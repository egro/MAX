import re
from app.extensions import db
from app.models.finding import Finding
from app.services.llm_service import is_configured, extract_findings_via_llm


def extract_findings_from_output(assessment_id, phase_id, output_lines):
    lines = list(output_lines) if output_lines else []
    if not lines:
        return

    findings = []
    for i, line in enumerate(lines):
        line_lower = line.lower()

        if not line.strip():
            continue

        finding = None

        m = re.match(r'^(\d+)/tcp\s+open\s+(.+)$', line.strip())
        if m:
            port = m.group(1)
            service = m.group(2).strip()
            finding = Finding(
                title=f'Open Port {port}/{service}',
                severity='medium' if int(port) < 1024 else 'low',
                evidence=line.strip(),
                risk=f'An open {service} port ({port}) may expose the target to network-based attacks.',
                remediation='Close the port if not needed, or restrict access with a firewall.',
                assessment_phase_id=phase_id,
                status='open',
            )

        vuln_keywords = [
            'vulnerable', 'vulnerability', 'cve-', 'critical', 'exploit',
        ]
        if not finding and any(kw in line_lower for kw in vuln_keywords):
            cve_match = re.search(r'(CVE-\d{4}-\d{4,})', line, re.IGNORECASE)
            cwe_match = re.search(r'(CWE-\d+)', line, re.IGNORECASE)
            finding = Finding(
                title=line.strip()[:180],
                severity='high',
                cwe_id=cwe_match.group(1).upper() if cwe_match else None,
                evidence=line.strip(),
                risk='Potential vulnerability identified by security tool output.',
                assessment_phase_id=phase_id,
                status='open',
            )

        if not finding and ('password' in line_lower and ('found' in line_lower or 'login' in line_lower)):
            finding = Finding(
                title=f'Credential Found: {line.strip()[:150]}',
                severity='critical',
                evidence=line.strip(),
                risk='Compromised credentials could allow unauthorized access.',
                remediation='Change the compromised credentials immediately.',
                assessment_phase_id=phase_id,
                status='open',
            )

        if not finding and any(kw in line_lower for kw in ['weak ssl', 'weak tls', 'ssl certificate', 'self-signed', 'expired certificate']):
            finding = Finding(
                title=f'SSL/TLS Issue: {line.strip()[:150]}',
                severity='high',
                evidence=line.strip(),
                risk='Weak or misconfigured TLS can expose encrypted traffic to interception.',
                remediation='Use trusted certificates and disable weak protocol versions.',
                assessment_phase_id=phase_id,
                status='open',
            )

        if finding:
            db.session.add(finding)
            findings.append(finding)

    if findings:
        db.session.commit()

    if is_configured():
        try:
            _llm_enhance(assessment_id, phase_id, lines, findings)
        except Exception:
            pass


def _llm_enhance(assessment_id, phase_id, lines, existing_findings):
    from app.models.assessment import Assessment
    assessment = db.session.get(Assessment, assessment_id)
    target = assessment.target if assessment else 'unknown'

    full_output = '\n'.join(lines)
    llm_findings = extract_findings_via_llm(full_output, target)
    if not llm_findings:
        return

    existing_titles = {f.title.lower().strip() for f in existing_findings}
    added = 0
    for item in llm_findings:
        title = (item.get('title') or '').strip()
        if not title or title.lower() in existing_titles:
            continue

        sev = item.get('severity', 'medium')
        if sev not in ('critical', 'high', 'medium', 'low', 'info'):
            sev = 'medium'

        finding = Finding(
            title=title[:200],
            severity=sev,
            cwe_id=(item.get('cwe_id') or '')[:20] or None,
            evidence=(item.get('evidence') or '')[:2000] or None,
            risk=(item.get('risk') or '')[:1000] or None,
            remediation=(item.get('remediation') or '')[:1000] or None,
            assessment_phase_id=phase_id,
            status='open',
        )
        db.session.add(finding)
        added += 1
        existing_titles.add(title.lower())

    if added:
        db.session.commit()
