from flask import Blueprint, Response, flash, redirect, render_template, url_for
from flask_login import login_required

from app.services.report_builder import build_report

reports = Blueprint('reports', __name__, url_prefix='/reports')


@reports.route('/<int:assessment_id>')
@login_required
def preview(assessment_id):
    markdown = build_report(assessment_id)
    if markdown is None:
        flash('Assessment not found.')
        return redirect(url_for('assessments.list_view'))
    return render_template('reports/view.html', markdown=markdown, assessment_id=assessment_id)


@reports.route('/<int:assessment_id>/download')
@login_required
def download(assessment_id):
    markdown = build_report(assessment_id)
    if markdown is None:
        flash('Assessment not found.')
        return redirect(url_for('assessments.list_view'))

    return Response(
        markdown,
        mimetype='text/markdown',
        headers={
            'Content-Disposition': f'attachment; filename="assessment-{assessment_id}-report.md"',
        }
    )
