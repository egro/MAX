from datetime import datetime, timezone

from flask import current_app, render_template
from flask_login import current_user

from app.extensions import db
from app.models.assessment import Assessment
from app.models.assessment_phase import AssessmentPhase
from app.models.finding import Finding
from app.services.llm_service import is_configured, generate_executive_summary


def build_report(assessment_id):
    assessment = db.session.get(Assessment, assessment_id)
    if not assessment:
        return None

    phases = AssessmentPhase.query.filter_by(assessment_id=assessment_id).order_by(AssessmentPhase.order).all()
    all_findings = (
        Finding.query
        .join(AssessmentPhase)
        .filter(AssessmentPhase.assessment_id == assessment_id)
        .order_by(Finding.severity.desc(), Finding.created_at.desc())
        .all()
    )

    severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3, 'info': 4}
    severity_labels = {'critical': 'Critical', 'high': 'High', 'medium': 'Medium', 'low': 'Low', 'info': 'Info'}
    severity_counts = []
    for sev in ('critical', 'high', 'medium', 'low', 'info'):
        count = sum(1 for f in all_findings if f.severity == sev)
        if count > 0:
            severity_counts.append({'label': severity_labels[sev], 'count': count, 'severity': sev})

    passed = sum(1 for p in phases if p.status == 'completed')
    failed = sum(1 for p in phases if p.status == 'failed')

    framework_refs = {'owasp': set(), 'nist': set(), 'sans': set()}
    for f in all_findings:
        if f.owasp_category:
            framework_refs['owasp'].add(f.owasp_category)
        if f.nist_id:
            framework_refs['nist'].add(f.nist_id)
        if f.sans_id:
            framework_refs['sans'].add(f.sans_id)

    for key in framework_refs:
        framework_refs[key] = sorted(framework_refs[key])

    executive_summary = None
    if is_configured() and all_findings:
        try:
            findings_data = [
                {'title': f.title, 'severity': f.severity, 'risk': f.risk}
                for f in all_findings[:20]
            ]
            phases_data = {'total': len(phases), 'passed': passed}
            executive_summary = generate_executive_summary(
                assessment.name, assessment.target, findings_data, phases_data
            )
        except Exception:
            pass

    markdown = render_template(
        'reports/report.md.j2',
        assessment=assessment,
        phases=phases,
        findings=all_findings,
        total_findings=len(all_findings),
        total_phases=len(phases),
        passed_phases=passed,
        failed_phases=failed,
        severity_counts=severity_counts,
        framework_refs=framework_refs,
        executive_summary=executive_summary,
        generated_at=datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC'),
    )

    return markdown
