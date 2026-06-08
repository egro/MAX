from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user

from app.decorators import admin_required
from app.extensions import db
from app.models.phase_definition import PhaseDefinition

phase_defs = Blueprint('phase_defs', __name__, url_prefix='/phases')


@phase_defs.route('/')
@login_required
def list_view():
    definitions = PhaseDefinition.query.order_by(PhaseDefinition.category, PhaseDefinition.label).all()
    return render_template('phase_definitions/list.html', definitions=definitions)


@phase_defs.route('/new', methods=['GET', 'POST'])
@login_required
@admin_required
def new():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        label = request.form.get('label', '').strip()
        category = request.form.get('category', '')
        description = request.form.get('description', '').strip()
        command_template = request.form.get('command_template', '').strip()
        suggested_tools = request.form.get('suggested_tools', '').strip()

        if not all([name, label, category, command_template]):
            flash('Name, label, category, and command template are required.')
            return redirect(url_for('phase_defs.new'))

        if PhaseDefinition.query.filter_by(name=name).first():
            flash(f'A phase definition with name "{name}" already exists.')
            return redirect(url_for('phase_defs.new'))

        tools_list = [t.strip() for t in suggested_tools.split(',') if t.strip()] if suggested_tools else None

        phase = PhaseDefinition(
            name=name,
            label=label,
            category=category,
            description=description,
            command_template=command_template,
            suggested_tools=tools_list,
            created_by=current_user.id
        )
        db.session.add(phase)
        db.session.commit()
        flash(f'Phase definition "{label}" created.')
        return redirect(url_for('phase_defs.list_view'))

    return render_template('phase_definitions/edit.html', phase=None)


@phase_defs.route('/<int:id>/edit', methods=['GET', 'POST'])
@login_required
@admin_required
def edit(id):
    phase = db.session.get(PhaseDefinition, id)
    if not phase:
        flash('Phase definition not found.')
        return redirect(url_for('phase_defs.list_view'))

    if request.method == 'POST':
        phase.label = request.form.get('label', phase.label).strip()
        phase.category = request.form.get('category', phase.category)
        phase.description = request.form.get('description', '').strip()
        phase.command_template = request.form.get('command_template', phase.command_template).strip()

        suggested_tools = request.form.get('suggested_tools', '').strip()
        phase.suggested_tools = [t.strip() for t in suggested_tools.split(',') if t.strip()] if suggested_tools else None

        db.session.commit()
        flash(f'Phase definition "{phase.label}" updated.')
        return redirect(url_for('phase_defs.list_view'))

    return render_template('phase_definitions/edit.html', phase=phase)


@phase_defs.route('/<int:id>/delete', methods=['POST'])
@login_required
@admin_required
def delete(id):
    phase = db.session.get(PhaseDefinition, id)
    if not phase:
        flash('Phase definition not found.')
        return redirect(url_for('phase_defs.list_view'))

    db.session.delete(phase)
    db.session.commit()
    flash(f'Phase definition "{phase.label}" deleted.')
    return redirect(url_for('phase_defs.list_view'))
