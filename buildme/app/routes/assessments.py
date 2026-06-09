import json
from datetime import datetime, timezone

import redis as redis_lib
from flask import Blueprint, Response, current_app, flash, jsonify, redirect, render_template, request, stream_with_context, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.models.assessment import Assessment
from app.models.assessment_phase import AssessmentPhase
from app.models.phase_definition import PhaseDefinition
from app.services.engine_registry import find_any_online_engine
from app.services.llm_service import is_configured, query_llm
from app.tasks.phase_tasks import run_phase_task

assessments = Blueprint('assessments', __name__, url_prefix='/assessments')


@assessments.route('/')
@login_required
def list_view():
    user_assessments = Assessment.query.filter_by(created_by=current_user.id).order_by(Assessment.created_at.desc()).all()
    return render_template('assessments/list.html', assessments=user_assessments)


@assessments.route('/new', methods=['GET', 'POST'])
@login_required
def new():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        target = request.form.get('target', '').strip()
        phase_ids = request.form.getlist('phase_ids')
        phase_order_raw = request.form.get('phase_order', '')

        if not name:
            flash('Assessment name is required.')
            return redirect(url_for('assessments.new'))

        if not target:
            flash('Target is required.')
            return redirect(url_for('assessments.new'))

        if not phase_ids:
            flash('Select at least one phase.')
            return redirect(url_for('assessments.new'))

        assessment = Assessment(name=name, target=target, created_by=current_user.id)
        db.session.add(assessment)
        db.session.flush()

        ordered_ids = []
        if phase_order_raw:
            try:
                ordered_ids = [int(pid) for pid in phase_order_raw.split(',') if pid]
            except ValueError:
                ordered_ids = []

        if not ordered_ids:
            ordered_ids = [int(pid) for pid in phase_ids]

        for idx, pid in enumerate(ordered_ids):
            phase_def = db.session.get(PhaseDefinition, pid)
            if not phase_def:
                continue
            ap = AssessmentPhase(
                assessment_id=assessment.id,
                phase_definition_id=pid,
                order=idx,
                status='pending'
            )
            db.session.add(ap)

        db.session.commit()
        flash(f'Assessment "{name}" created.')
        return redirect(url_for('assessments.list_view'))

    phase_defs = PhaseDefinition.query.order_by(PhaseDefinition.category, PhaseDefinition.label).all()
    return render_template('assessments/new.html', phase_defs=phase_defs)


@assessments.route('/<int:id>')
@login_required
def detail(id):
    assessment = db.session.get(Assessment, id)
    if not assessment:
        flash('Assessment not found.')
        return redirect(url_for('assessments.list_view'))

    phases = (AssessmentPhase.query
              .filter_by(assessment_id=id)
              .order_by(AssessmentPhase.order)
              .all())

    return render_template('assessments/detail.html', assessment=assessment, phases=phases)


@assessments.route('/<int:id>/delete', methods=['POST'])
@login_required
def delete(id):
    assessment = db.session.get(Assessment, id)
    if not assessment:
        flash('Assessment not found.')
        return redirect(url_for('assessments.list_view'))

    if assessment.created_by != current_user.id and current_user.role != 'admin':
        flash('You do not have permission to delete this assessment.')
        return redirect(url_for('assessments.list_view'))

    from app.extensions import celery
    from app.models.finding import Finding
    running = AssessmentPhase.query.filter_by(assessment_id=id, status='running').all()
    for ap in running:
        if ap.task_id:
            celery.control.revoke(ap.task_id, terminate=True)

    phase_ids = [p.id for p in AssessmentPhase.query.with_entities(AssessmentPhase.id).filter_by(assessment_id=id).all()]
    if phase_ids:
        Finding.query.filter(Finding.assessment_phase_id.in_(phase_ids)).delete(synchronize_session=False)
    AssessmentPhase.query.filter_by(assessment_id=id).delete()
    db.session.delete(assessment)
    db.session.commit()
    flash('Assessment deleted.')
    return redirect(url_for('assessments.list_view'))


@assessments.route('/<int:id>/phases/<int:phase_id>/run', methods=['POST'])
@login_required
def run_phase(id, phase_id):
    assessment = db.session.get(Assessment, id)
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404

    ap = db.session.get(AssessmentPhase, phase_id)
    if not ap or ap.assessment_id != id:
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
        args=[id, phase_id],
        queue=engine.network_tag,
    )

    ap.task_id = task.id
    db.session.commit()

    assessment.status = 'running'
    db.session.commit()

    return jsonify({'status': 'started', 'task_id': task.id})


@assessments.route('/<int:id>/run-all', methods=['POST'])
@login_required
def run_all_phases(id):
    assessment = db.session.get(Assessment, id)
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404

    phases = (AssessmentPhase.query
              .filter_by(assessment_id=id)
              .filter(AssessmentPhase.status.in_(['pending', 'failed']))
              .order_by(AssessmentPhase.order)
              .all())

    if not phases:
        return jsonify({'error': 'No phases to run'}), 400

    engine = find_any_online_engine()
    if not engine:
        return jsonify({'error': 'No online engines available'}), 503

    results = []
    for ap in phases:
        ap.status = 'running'
        ap.started_at = datetime.now(timezone.utc)
        ap.engine_id = engine.id
        ap.task_id = None
        db.session.flush()

        task = run_phase_task.apply_async(
            args=[id, ap.id],
            queue=engine.network_tag,
        )

        ap.task_id = task.id
        db.session.flush()
        results.append({'phase_id': ap.id, 'task_id': task.id})

    assessment.status = 'running'
    db.session.commit()

    return jsonify({'status': 'started', 'phases': results})


@assessments.route('/<int:id>/phases/<int:phase_id>/stop', methods=['POST'])
@login_required
def stop_phase(id, phase_id):
    ap = db.session.get(AssessmentPhase, phase_id)
    if not ap or ap.assessment_id != id:
        return jsonify({'error': 'Phase not found'}), 404

    if ap.status != 'running':
        return jsonify({'error': 'Phase is not running'}), 400

    if ap.task_id:
        from app.extensions import celery
        celery.control.revoke(ap.task_id, terminate=True)

    ap.status = 'failed'
    ap.completed_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({'status': 'stopped'})


@assessments.route('/<int:id>/phases/<int:phase_id>/stream')
@login_required
def stream_phase(id, phase_id):
    ap = db.session.get(AssessmentPhase, phase_id)
    if not ap or ap.assessment_id != id:
        return jsonify({'error': 'Phase not found'}), 404

    redis_url = current_app.config.get('REDIS_URL', 'redis://localhost:6379/0')

    def generate():
        r = redis_lib.Redis.from_url(redis_url)
        channel = f"phase:{id}:{phase_id}"
        history_key = f"phase:{id}:{phase_id}:history"
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


@assessments.route('/<int:id>/phases/<int:phase_id>/analyze', methods=['POST'])
@login_required
def analyze_phase(id, phase_id):
    if not is_configured():
        return jsonify({'error': 'LLM not configured — set LLM_ENDPOINT in .env'}), 503

    ap = db.session.get(AssessmentPhase, phase_id)
    if not ap or ap.assessment_id != id:
        return jsonify({'error': 'Phase not found'}), 404

    assessment = db.session.get(Assessment, id)
    if not assessment:
        return jsonify({'error': 'Assessment not found'}), 404

    redis_url = current_app.config.get('REDIS_URL', 'redis://localhost:6379/0')
    r = redis_lib.Redis.from_url(redis_url)
    try:
        history_key = f"phase:{id}:{phase_id}:history"
        lines = r.lrange(history_key, 0, -1)
    finally:
        r.close()

    if not lines:
        return jsonify({'error': 'No output to analyze'}), 400

    output_text = '\n'.join(
        json.loads(msg.decode())["line"]
        for msg in lines
        if json.loads(msg.decode()).get("type") == "output"
    )

    system = (
        "You are a security assessment analyst. Analyze the following penetration testing tool output. "
        "Identify security findings, anomalies, and interesting observations. "
        "For each finding, provide: title, severity (critical/high/medium/low/info), "
        "the relevant evidence line(s), risk description, and remediation advice. "
        "Respond in plain text with clear sections. Do not use markdown formatting."
    )
    prompt = (
        f"Target: {assessment.target}\n"
        f"Phase: {ap.phase_definition.label} ({ap.phase_definition.category})\n\n"
        f"Tool output:\n{output_text[:15000]}\n\n"
        "Analyze this output and identify all security findings."
    )

    result = query_llm(prompt, system_prompt=system, temperature=0.1, max_tokens=4096)
    if result is None:
        return jsonify({'error': 'LLM request failed — check server logs'}), 502

    return jsonify({'analysis': result})
