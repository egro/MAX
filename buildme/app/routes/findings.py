import json
from datetime import datetime, timezone

from flask import Blueprint, flash, jsonify, redirect, render_template, request, url_for
from flask_login import current_user, login_required

from app.extensions import db
from app.models.assessment import Assessment
from app.models.finding import Finding
from app.models.assessment_phase import AssessmentPhase

findings = Blueprint('findings', __name__, url_prefix='/findings')


@findings.route('/')
@login_required
def list_view():
    phase_id = request.args.get('phase_id', type=int)
    assessment_id = request.args.get('assessment_id', type=int)
    severity = request.args.get('severity')
    status = request.args.get('status')
    q = Finding.query

    if phase_id:
        q = q.filter_by(assessment_phase_id=phase_id)
    if severity:
        q = q.filter_by(severity=severity)
    if status:
        q = q.filter_by(status=status)
    if assessment_id:
        q = q.join(AssessmentPhase).filter(
            AssessmentPhase.assessment_id == assessment_id
        )

    all_findings = q.order_by(Finding.created_at.desc()).all()
    return render_template('findings/list.html', findings=all_findings)


@findings.route('/by-assessment')
@login_required
def by_assessment():
    assessments = (
        db.session.query(
            Assessment,
            db.func.count(Finding.id).label('total'),
            db.func.sum(db.cast(db.text("CASE WHEN finding.severity = 'critical' THEN 1 ELSE 0 END"), db.Integer)).label('critical'),
            db.func.sum(db.cast(db.text("CASE WHEN finding.severity = 'high' THEN 1 ELSE 0 END"), db.Integer)).label('high'),
            db.func.sum(db.cast(db.text("CASE WHEN finding.severity = 'medium' THEN 1 ELSE 0 END"), db.Integer)).label('medium'),
            db.func.sum(db.cast(db.text("CASE WHEN finding.severity = 'low' THEN 1 ELSE 0 END"), db.Integer)).label('low'),
            db.func.sum(db.cast(db.text("CASE WHEN finding.severity = 'info' THEN 1 ELSE 0 END"), db.Integer)).label('info'),
            db.func.max(Finding.created_at).label('latest_finding_at'),
        )
        .join(AssessmentPhase, AssessmentPhase.assessment_id == Assessment.id)
        .join(Finding, Finding.assessment_phase_id == AssessmentPhase.id)
        .group_by(Assessment.id)
        .order_by(db.func.max(Finding.created_at).desc())
        .all()
    )

    rows = []
    for assessment, total, critical, high, medium, low, info, latest_finding_at in assessments:
        rows.append({
            'assessment': assessment,
            'total': total,
            'critical': critical or 0,
            'high': high or 0,
            'medium': medium or 0,
            'low': low or 0,
            'info': info or 0,
            'latest_finding_at': latest_finding_at,
        })

    return render_template('findings/by_assessment.html', rows=rows)


@findings.route('/new', methods=['GET', 'POST'])
@login_required
def new():
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        if not title:
            flash('Title is required.')
            return redirect(url_for('findings.new'))

        severity = request.form.get('severity', 'medium')
        cvss_score = request.form.get('cvss_score', '').strip()
        cwe_id = request.form.get('cwe_id', '').strip()
        owasp_category = request.form.get('owasp_category', '').strip()
        nist_id = request.form.get('nist_id', '').strip()
        sans_id = request.form.get('sans_id', '').strip()
        evidence = request.form.get('evidence', '').strip()
        risk = request.form.get('risk', '').strip()
        remediation = request.form.get('remediation', '').strip()
        phase_id = request.form.get('assessment_phase_id', type=int)

        finding = Finding(
            title=title,
            severity=severity,
            cvss_score=float(cvss_score) if cvss_score else None,
            cwe_id=cwe_id or None,
            owasp_category=owasp_category or None,
            nist_id=nist_id or None,
            sans_id=sans_id or None,
            evidence=evidence or None,
            risk=risk or None,
            remediation=remediation or None,
            assessment_phase_id=phase_id or None,
        )
        db.session.add(finding)
        db.session.commit()
        flash(f'Finding "{title}" created.')

        if phase_id:
            phase = db.session.get(AssessmentPhase, phase_id)
            if phase:
                return redirect(url_for('assessments.detail', id=phase.assessment_id))
        return redirect(url_for('findings.list_view'))

    phase_id = request.args.get('phase_id', type=int)
    phase = db.session.get(AssessmentPhase, phase_id) if phase_id else None
    return render_template('findings/new.html', phase=phase)


@findings.route('/<int:id>/edit', methods=['POST'])
@login_required
def edit(id):
    finding = db.session.get(Finding, id)
    if not finding:
        return jsonify({'error': 'Finding not found'}), 404

    field = request.form.get('field')
    value = request.form.get('value', '').strip()

    editable = {'title', 'severity', 'cvss_score', 'cwe_id', 'owasp_category',
                'nist_id', 'sans_id', 'evidence', 'risk', 'remediation', 'status'}
    if field not in editable:
        return jsonify({'error': 'Invalid field'}), 400

    if field == 'cvss_score':
        setattr(finding, field, float(value) if value else None)
    else:
        setattr(finding, field, value or None)

    finding.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({'status': 'updated'})


@findings.route('/<int:id>/delete', methods=['POST'])
@login_required
def delete(id):
    finding = db.session.get(Finding, id)
    if not finding:
        flash('Finding not found.')
        return redirect(url_for('findings.list_view'))

    phase_id = finding.assessment_phase_id
    db.session.delete(finding)
    db.session.commit()
    flash('Finding deleted.')

    if phase_id:
        phase = db.session.get(AssessmentPhase, phase_id)
        if phase:
            return redirect(url_for('assessments.detail', id=phase.assessment_id))
    return redirect(url_for('findings.list_view'))
