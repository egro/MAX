import json
from datetime import datetime, timezone
from functools import wraps

from flask import Blueprint, Response, jsonify, request, stream_with_context, current_app
from flask_login import current_user, login_required

import redis as redis_lib

from app.extensions import db
from app.models.assessment import Assessment
from app.models.assessment_phase import AssessmentPhase
from app.models.engine import Engine
from app.models.finding import Finding
from app.models.phase_definition import PhaseDefinition
from app.models.user import User
from app.services.engine_registry import find_any_online_engine
from app.services.report_builder import build_report
from app.tasks.phase_tasks import run_phase_task

api = Blueprint('api', __name__, url_prefix='/api/v1')


def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key', '')
        if not api_key:
            return jsonify({'error': 'Missing X-API-Key header'}), 401
        user = User.query.filter_by(api_key=api_key).first()
        if not user:
            return jsonify({'error': 'Invalid API key'}), 401
        return f(*args, **kwargs)
    return decorated


# ── Engines ──────────────────────────────────────────────────────────────

@api.route('/engines')
@require_api_key
def list_engines():
    engines = Engine.query.order_by(Engine.name).all()
    return jsonify([{
        'id': e.id,
        'name': e.name,
        'network_tag': e.network_tag,
        'ip': e.ip,
        'status': e.status,
        'last_heartbeat_at': e.last_heartbeat_at.isoformat() if e.last_heartbeat_at else None,
        'registered_at': e.registered_at.isoformat() if e.registered_at else None,
    } for e in engines])


@api.route('/engines/<int:engine_id>')
@require_api_key
def get_engine(engine_id):
    engine = db.session.get(Engine, engine_id)
    if not engine:
        return jsonify({'error': 'Engine not found'}), 404
    return jsonify({
        'id': engine.id,
        'name': engine.name,
        'network_tag': engine.network_tag,
        'ip': engine.ip,
        'status': engine.status,
        'last_heartbeat_at': engine.last_heartbeat_at.isoformat() if engine.last_heartbeat_at else None,
        'registered_at': engine.registered_at.isoformat() if engine.registered_at else None,
    })


# ── Assessments ──────────────────────────────────────────────────────────

@api.route('/assessments')
@require_api_key
def list_assessments():
    assessments = Assessment.query.order_by(Assessment.created_at.desc()).all()
    return jsonify([{
        'id': a.id,
        'name': a.name,
        'target': a.target,
        'status': a.status,
        'created_by': a.created_by,
        'created_at': a.created_at.isoformat() if a.created_at else None,
        'updated_at': a.updated_at.isoformat() if a.updated_at else None,
    } for a in assessments])


@api.route('/assessments', methods=['POST'])
@require_api_key
def create_assessment():
    data = request.get_json(force=True)
    name = (data.get('name') or '').strip()
    target = (data.get('target') or '').strip()
    phase_ids = data.get('phase_ids', [])

    if not name:
        return jsonify({'error': 'name is required'}), 400
    if not target:
        return jsonify({'error': 'target is required'}), 400

    user = User.query.filter_by(api_key=request.headers.get('X-API-Key', '')).first()
    assessment = Assessment(name=name, target=target, created_by=user.id)
    db.session.add(assessment)
    db.session.flush()

    for idx, pid in enumerate(phase_ids):
        phase_def = db.session.get(PhaseDefinition, pid)
        if not phase_def:
            continue
        ap = AssessmentPhase(
            assessment_id=assessment.id,
            phase_definition_id=pid,
            order=idx,
            status='pending',
        )
        db.session.add(ap)

    db.session.commit()
    return jsonify({'id': assessment.id, 'status': assessment.status}), 201


@api.route('/assessments/<int:assessment_id>')
@require_api_key
def get_assessment(assessment_id):
    assessment = db.session.get(Assessment, assessment_id)
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404

    phases = AssessmentPhase.query.filter_by(assessment_id=assessment_id).order_by(AssessmentPhase.order).all()

    return jsonify({
        'id': assessment.id,
        'name': assessment.name,
        'target': assessment.target,
        'status': assessment.status,
        'created_by': assessment.created_by,
        'created_at': assessment.created_at.isoformat() if assessment.created_at else None,
        'updated_at': assessment.updated_at.isoformat() if assessment.updated_at else None,
        'phases': [{
            'id': p.id,
            'phase_definition_id': p.phase_definition_id,
            'phase_label': p.phase_definition.label if p.phase_definition else None,
            'order': p.order,
            'status': p.status,
            'started_at': p.started_at.isoformat() if p.started_at else None,
            'completed_at': p.completed_at.isoformat() if p.completed_at else None,
            'engine_id': p.engine_id,
        } for p in phases],
    })


@api.route('/assessments/<int:assessment_id>', methods=['DELETE'])
@require_api_key
def delete_assessment(assessment_id):
    assessment = db.session.get(Assessment, assessment_id)
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404

    AssessmentPhase.query.filter_by(assessment_id=assessment_id).delete()
    db.session.delete(assessment)
    db.session.commit()
    return jsonify({'status': 'deleted'})


@api.route('/assessments/<int:assessment_id>/phases/<int:phase_id>/run', methods=['POST'])
@require_api_key
def run_phase(assessment_id, phase_id):
    assessment = db.session.get(Assessment, assessment_id)
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404

    ap = db.session.get(AssessmentPhase, phase_id)
    if not ap or ap.assessment_id != assessment_id:
        return jsonify({'error': 'Phase not found'}), 404

    if ap.status not in ('pending', 'failed'):
        return jsonify({'error': f'Phase is {ap.status}, cannot run'}), 400

    engine = find_any_online_engine()
    if not engine:
        return jsonify({'error': 'No online engines available'}), 503

    ap.status = 'running'
    ap.started_at = datetime.now(timezone.utc)
    ap.engine_id = engine.id
    ap.task_id = None
    db.session.commit()

    task = run_phase_task.apply_async(
        args=[assessment_id, phase_id],
        queue=engine.network_tag,
    )

    ap.task_id = task.id
    assessment.status = 'running'
    db.session.commit()

    return jsonify({'status': 'started', 'task_id': task.id})


@api.route('/assessments/<int:assessment_id>/phases/<int:phase_id>/stream')
@require_api_key
def stream_phase(assessment_id, phase_id):
    ap = db.session.get(AssessmentPhase, phase_id)
    if not ap or ap.assessment_id != assessment_id:
        return jsonify({'error': 'Phase not found'}), 404

    redis_url = current_app.config.get('REDIS_URL', 'redis://localhost:6379/0')

    def generate():
        r = redis_lib.Redis.from_url(redis_url)
        channel = f"phase:{assessment_id}:{phase_id}"
        history_key = f"phase:{assessment_id}:{phase_id}:history"
        pubsub = None

        try:
            history = r.lrange(history_key, 0, -1)
            for msg in history:
                yield f"data: {msg.decode()}\n\n"

            pubsub = r.pubsub()
            pubsub.subscribe(channel)

            while True:
                msg = pubsub.get_message(timeout=5.0)
                if msg is None:
                    yield ": keepalive\n\n"
                    continue
                if msg['type'] == 'message':
                    data = json.loads(msg['data'])
                    yield f"data: {msg['data'].decode()}\n\n"
                    if data.get('type') == 'status':
                        break
        except GeneratorExit:
            pass
        except (SystemExit, KeyboardInterrupt):
            pass
        finally:
            if pubsub:
                pubsub.unsubscribe()
                pubsub.close()
            r.close()

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
        }
    )


# ── Findings ─────────────────────────────────────────────────────────────

@api.route('/findings')
@require_api_key
def list_findings():
    q = Finding.query
    assessment_id = request.args.get('assessment_id', type=int)
    phase_id = request.args.get('phase_id', type=int)
    severity = request.args.get('severity')
    status = request.args.get('status')

    if assessment_id:
        q = q.join(AssessmentPhase).filter(AssessmentPhase.assessment_id == assessment_id)
    if phase_id:
        q = q.filter_by(assessment_phase_id=phase_id)
    if severity:
        q = q.filter_by(severity=severity)
    if status:
        q = q.filter_by(status=status)

    findings = q.order_by(Finding.created_at.desc()).all()
    return jsonify([{
        'id': f.id,
        'title': f.title,
        'severity': f.severity,
        'cvss_score': f.cvss_score,
        'cwe_id': f.cwe_id,
        'owasp_category': f.owasp_category,
        'nist_id': f.nist_id,
        'sans_id': f.sans_id,
        'evidence': f.evidence,
        'risk': f.risk,
        'remediation': f.remediation,
        'status': f.status,
        'assessment_phase_id': f.assessment_phase_id,
        'created_at': f.created_at.isoformat() if f.created_at else None,
        'updated_at': f.updated_at.isoformat() if f.updated_at else None,
    } for f in findings])


@api.route('/findings', methods=['POST'])
@require_api_key
def create_finding():
    data = request.get_json(force=True)
    title = (data.get('title') or '').strip()
    if not title:
        return jsonify({'error': 'title is required'}), 400

    finding = Finding(
        title=title,
        severity=data.get('severity', 'medium'),
        cvss_score=data.get('cvss_score'),
        cwe_id=data.get('cwe_id'),
        owasp_category=data.get('owasp_category'),
        nist_id=data.get('nist_id'),
        sans_id=data.get('sans_id'),
        evidence=data.get('evidence'),
        risk=data.get('risk'),
        remediation=data.get('remediation'),
        assessment_phase_id=data.get('assessment_phase_id'),
        status='open',
    )
    db.session.add(finding)
    db.session.commit()
    return jsonify({'id': finding.id, 'status': 'created'}), 201


@api.route('/findings/<int:finding_id>', methods=['PATCH'])
@require_api_key
def update_finding(finding_id):
    finding = db.session.get(Finding, finding_id)
    if not finding:
        return jsonify({'error': 'Finding not found'}), 404

    data = request.get_json(force=True)
    editable = {'title', 'severity', 'cvss_score', 'cwe_id', 'owasp_category',
                'nist_id', 'sans_id', 'evidence', 'risk', 'remediation', 'status'}
    for field in editable:
        if field in data:
            setattr(finding, field, data[field])

    finding.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({'status': 'updated'})


@api.route('/findings/<int:finding_id>', methods=['DELETE'])
@require_api_key
def delete_finding(finding_id):
    finding = db.session.get(Finding, finding_id)
    if not finding:
        return jsonify({'error': 'Finding not found'}), 404
    db.session.delete(finding)
    db.session.commit()
    return jsonify({'status': 'deleted'})


# ── Phase Definitions ────────────────────────────────────────────────────

@api.route('/phase-definitions')
@require_api_key
def list_phase_definitions():
    defs = PhaseDefinition.query.order_by(PhaseDefinition.category, PhaseDefinition.label).all()
    return jsonify([{
        'id': pd.id,
        'name': pd.name,
        'label': pd.label,
        'category': pd.category,
        'description': pd.description,
        'command_template': pd.command_template,
        'suggested_tools': pd.suggested_tools,
    } for pd in defs])


@api.route('/phase-definitions', methods=['POST'])
@require_api_key
def create_phase_definition():
    data = request.get_json(force=True)
    name = (data.get('name') or '').strip()
    label = (data.get('label') or '').strip()
    category = data.get('category', '')
    command_template = (data.get('command_template') or '').strip()

    if not all([name, label, category, command_template]):
        return jsonify({'error': 'name, label, category, and command_template are required'}), 400

    if PhaseDefinition.query.filter_by(name=name).first():
        return jsonify({'error': f'Phase definition "{name}" already exists'}), 409

    pd = PhaseDefinition(
        name=name,
        label=label,
        category=category,
        description=data.get('description'),
        command_template=command_template,
        suggested_tools=data.get('suggested_tools'),
    )
    db.session.add(pd)
    db.session.commit()
    return jsonify({'id': pd.id, 'status': 'created'}), 201


@api.route('/phase-definitions/<int:pd_id>', methods=['PUT'])
@require_api_key
def update_phase_definition(pd_id):
    pd = db.session.get(PhaseDefinition, pd_id)
    if not pd:
        return jsonify({'error': 'Phase definition not found'}), 404

    data = request.get_json(force=True)
    if 'label' in data:
        pd.label = data['label']
    if 'category' in data:
        pd.category = data['category']
    if 'description' in data:
        pd.description = data.get('description')
    if 'command_template' in data:
        pd.command_template = data['command_template']
    if 'suggested_tools' in data:
        pd.suggested_tools = data.get('suggested_tools')

    db.session.commit()
    return jsonify({'status': 'updated'})


@api.route('/phase-definitions/<int:pd_id>', methods=['DELETE'])
@require_api_key
def delete_phase_definition(pd_id):
    pd = db.session.get(PhaseDefinition, pd_id)
    if not pd:
        return jsonify({'error': 'Phase definition not found'}), 404
    db.session.delete(pd)
    db.session.commit()
    return jsonify({'status': 'deleted'})


# ── Reports ──────────────────────────────────────────────────────────────

@api.route('/reports/<int:assessment_id>/download')
@require_api_key
def download_report(assessment_id):
    markdown = build_report(assessment_id)
    if markdown is None:
        return jsonify({'error': 'Assessment not found'}), 404

    return Response(
        markdown,
        mimetype='text/markdown',
        headers={
            'Content-Disposition': f'attachment; filename="assessment-{assessment_id}-report.md"',
        }
    )


# ── API Key Management ───────────────────────────────────────────────────

@api.route('/auth/api-key', methods=['POST'])
@login_required
def generate_api_key():
    user = db.session.get(User, current_user.id)
    api_key = user.generate_api_key()
    db.session.commit()
    return jsonify({'api_key': api_key})


@api.route('/auth/api-key', methods=['GET'])
@login_required
def get_api_key():
    user = db.session.get(User, current_user.id)
    if not user.api_key:
        return jsonify({'api_key': None})
    return jsonify({'api_key': user.api_key[-8:]})
