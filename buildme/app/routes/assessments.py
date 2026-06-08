from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user

from app.extensions import db
from app.models.assessment import Assessment
from app.models.assessment_phase import AssessmentPhase
from app.models.phase_definition import PhaseDefinition

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

    AssessmentPhase.query.filter_by(assessment_id=id).delete()
    db.session.delete(assessment)
    db.session.commit()
    flash('Assessment deleted.')
    return redirect(url_for('assessments.list_view'))
