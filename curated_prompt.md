# Web Application Assessment - Curated Prompt

Use this prompt to start a new web application security assessment. Copy the entire block and fill in the target information.

---

## Prompt Template

```
I want to conduct a comprehensive security assessment of a web application.

TARGET: [URL or Domain]

ASSESSMENT TYPE: Web Application Security Assessment

AUTHENTICATION: [unauthenticated / authenticated / both]
- If authenticated: [provide credentials or note they'll be provided]

SCOPE:
- Target URL: [https://www.example.com]
- In-scope paths: [/path1, /path2 - or leave empty for all]
- Out-of-scope: [/admin, /api/private - or leave empty]

ENABLE FRAMEWORKS:
- [x] OWASP Top 10 2021
- [x] NIST SP 800-53
- [x] CWE (Common Weakness Enumeration)
- [ ] FedRAMP (if cloud-hosted)
- [x] SANS Top 25
- [ ] MITRE ATT&CK (if advanced)

TESTING RULES:
- [x] Scan/Recon (passive)
- [x] Directory enumeration
- [x] Vulnerability testing (SQLi, XSS, etc.)
- [ ] Credential brute force (with auth only)
- [ ] DoS testing
- [ ] Lateral movement

OUTPUT:
- Create output directories
- Log all commands
- Save tool outputs

Please proceed with the assessment following the methodology in the template files. Use tools available on this Kali system. Map findings to all enabled frameworks. Generate a findings.csv and final report with executive summary, detailed findings with CVSS scores, CWE IDs, framework mappings, and remediation recommendations.
```

---

## Example Prompts (Ready to Use)

### Minimal Unauthenticated Assessment
```
I want to conduct a comprehensive security assessment of https://www.example.com as an unauthenticated external attacker.

Follow the methodology in my TEMPLATES/web_application folder. Enable OWASP, NIST, CWE, and SANS frameworks. Run directory enumeration, vulnerability testing (SQLi, XSS, input validation), SSL/TLS analysis, and WAF detection.

Log all commands to command_log.md, save outputs to appropriate directories, and generate a findings.csv with CVSS scores, CWE IDs, and framework mappings.
```

### Full Authenticated Assessment
```
I have credentials for the web application at https://www.example.com.

Username: testuser@example.com
Password: [provided separately]
Login URL: https://www.example.com/login

Conduct a comprehensive authenticated security assessment. Enable all frameworks (OWASP, NIST, CWE, FedRAMP, SANS, MITRE). Test access controls, IDOR, session management, and privileged functions.

Follow the web_application template methodology. Log all commands and generate a full report with findings.csv.
```

### Cloud Hosted Assessment
```
Assess https://www.example.com which is hosted on AWS.

Include in scope: S3 bucket enumeration, AWS metadata API testing, CDN configuration.

Use all frameworks including FedRAMP. Run cloud-specific tests alongside normal web app testing.
```

---

## Quick Start Commands

Once you've prepared your prompt, run these setup commands:

```bash
# Navigate to template
cd /home/kali/TEMPLATES/web_application

# Copy to your assessment directory
cp -r . /home/kali/[assessment_name]/
cd /home/kali/[assessment_name]/

# Edit target configuration
# (edit 01_target.md)

# Create output directories
mkdir -p outputs/{nmap,web,cloud,recon}

# Start assessment - paste your curated prompt here
```

---

## Post-Assessment Commands

After assessment, generate the report:

```bash
# Generate findings summary
echo "# Findings Summary" > findings_summary.md
cat findings/findings.csv >> findings_summary.md

# Generate final report
# Reference the template in Enhanced_Security_Assessment_Report.md
```

---

## Tips

1. **Authentication**: If testing requires credentials, provide them AFTER starting the session to avoid including them in any logs.

2. **Scope**: Be specific about what's out of scope to avoid wasting time on excluded areas.

3. **Frameworks**: More frameworks = more comprehensive but takes longer. Start with OWASP + CWE + NIST for web apps.

4. **Tools**: The template auto-detects available tools and adjusts testing accordingly.

5. **Output**: All outputs are saved locally - no external cloud storage unless specified.

---

## Need Help?

If you need to modify the prompt:
- Remove frameworks you don't need
- Add specific tests (e.g., "Include payment testing for PCI DSS")
- Change testing rules (e.g., "No SQLmap - manual testing only")
- Add specific targets (e.g., "Also test api.example.com")

The template is flexible - adjust the prompt to match your exact requirements.