# Web Application Assessment - Interactive (Step-by-Step) Prompt

Use this prompt to start a new web application assessment **with user interaction after each phase**. The assessment pauses at defined checkpoints for user review, questions, and go/no-go decisions.

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
- Log all commands to command_log.md
- Save tool outputs to organized directories
- Track all progress in assessment_state.md

IMPORTANT — INTERACTIVE MODE:

STRUCTURE & FLOW:
- Execute one phase at a time. STOP after each phase and present a summary.
- Use only the target URL provided — do NOT use resolved IPs for testing.
- Ask for user confirmation, questions, or additional direction before moving to the next phase.
- If a critical finding is discovered (open database, exposed credentials, etc.), STOP immediately and inform the user. Do NOT proceed without discussion.
- Always ask before running: brute force, DoS-level fuzzing, or tools requiring sudo.

STATE TRACKING:
- Maintain assessment_state.md at all times. Update it AFTER every phase, BEFORE presenting results.
- assessment_state.md must contain: goal, discoveries, current phase, commands run, findings so far, next steps, key decisions made.
- The state file is the definitive session record. It must be sufficient to fork/restart the session from scratch without losing context.
- Present findings as they are discovered and get user input on severity/classification.

---

## Phases (Execute One at a Time)

### Phase 1: Initial Reconnaissance
- DNS enumeration (dig, host, nslookup)
- Port scan (nmap -p- full, then -sV on open ports)
- Technology fingerprinting (whatweb)
- WAF detection (wafw00f)
- STOP: Present findings, ask user to review before continuing.

### Phase 2: SSL/TLS Analysis
- Cipher suite enumeration (sslscan, sslyze)
- Protocol version testing (TLS 1.0/1.1/1.2/1.3, SSLv2/SSLv3)
- Certificate inspection (openssl s_client)
- Vulnerability checks (Heartbleed, renegotiation, compression)
- HSTS and security header check
- STOP: Present findings, ask user to review before continuing.

### Phase 3: Directory & Content Enumeration
- Directory brute force (gobuster, dirb)
- Common files check (robots.txt, .env, .git, admin panels, etc.)
- HTTP methods test (OPTIONS, PUT, DELETE, TRACE, PATCH)
- STOP: Present findings, ask user to review before continuing.

### Phase 4: Input Validation & Vulnerability Testing
- Cross-Site Scripting (XSS) payload tests
- SQL Injection payload tests
- Directory traversal tests
- Command injection tests
- Host header injection tests
- STOP: Present findings, ask user to review before continuing.

### Phase 5: Authentication & Session Testing
- Login page behavior (response codes, error messages, timing)
- Username enumeration tests
- Password reset flow analysis
- Session cookie analysis (JSESSIONID, SameSite, Secure, HttpOnly)
- STOP: Present findings, ask user to review before continuing.

### Phase 6: Additional Enumeration (User Discretion)
- ffuf for deeper fuzzing (if user approves)
- nuclei for CVE scanning (if user approves)
- searchsploit for known vulnerabilities
- Any user-requested additional tools
- STOP: Present all findings, ask user if they want more tests or to proceed to reporting.

### Phase 7: Reporting
- Compile all findings into findings.csv with CVSS, CWE, OWASP, NIST, SANS mappings
- Use an ID scheme for findings (e.g., EW-001, EW-002...)
- Include positive controls ("things done right") as formal findings, not just vulnerabilities
- Generate three .md reports:
  - assessment_report.md — full report with commands inline with each finding
  - executive_report.md — trimmed leadership summary
  - technical_report.md — detailed evidence, methodology, all commands
- Commands must appear inline with each finding, NOT in a separate section
- .md is the definitive source. Do NOT generate .docx programmatically (no python-docx)
- Update assessment_state.md with complete session state (must be sufficient to fork/restart)
- STOP: Inform user they will manually convert to .docx via:
    pandoc <file>.md -o <file>.docx --reference-doc=template.docx
- Note: pandoc copies styles but NOT structure — headers, footers, images, and table positions from template.docx will NOT carry over
- Ask if user wants deprecated/temp files cleaned up

---

## Interactive Mode Rules for the AI

1. At each STOP point, provide:
   - A one-paragraph summary of what was done
   - The key findings (positive and negative)
   - Any anomalies or interesting observations
   - The question: "Proceed to next phase? [y/N]"

2. After user approves:
   - Run the phase
   - Save outputs to appropriate directories
   - Log all commands to command_log.md
   - Update assessment_state.md
   - STOP and present results

3. If something unexpected is found (e.g., open database, exposed credentials, critical vulnerability):
   - STOP immediately
   - Inform the user
   - Do NOT proceed without discussion

4. Always ask before running:
   - Brute force or password guessing
   - Tools that may cause service disruption (DoS, aggressive fuzzing)
   - Tools requiring elevated privileges (sudo)

5. Track state persistently:
   - assessment_state.md must be updated after every STOP point
   - Include: what was done, what was found, current phase, next steps
   - This allows forking/restarting the session without losing context

Please proceed with the assessment following these interactive rules.
```
---

## Report Polish (Markdown Formatting)

The user reviews reports in Obsidian. The AI MUST ensure all generated .md files follow these rules:

- **Headings:** Space after `#` — `# Title`, not `#Title`
- **Bold:** No stray `#` inside bold markers — `**text**`, not `**text#**` or `**#text**`
- All .md files must render cleanly in Obsidian (or any markdown viewer) without syntax errors
- Run a formatting check on .md files before delivery

---

## Quick Start

```bash
# Navigate to template directory
cd /home/kali/TEMPLATES/web_application

# Copy to your assessment directory
cp -r . /home/kali/[assessment_name]/
cd /home/kali/[assessment_name]/

# Edit target configuration
# (edit 01_target.md with your URL only)

# Create output directories
mkdir -p outputs/{nmap,web,cloud,recon}

# Create findings directory
mkdir -p findings

# Paste the interactive prompt above to start
```

---

## Key Differences from Standard Prompt

| Aspect | Standard | Interactive |
|--------|----------|-------------|
| Flow | Continuous | Stops at 7 defined phases; target URL only, no resolved IPs |
| User input | At start only | After every phase; emergency stop on critical findings |
| State file | Optional | Required — assessment_state.md updated after every phase, fork/restart ready |
| Tool choice | AI decides | User can request additional tools at each stop |
| Reporting | One report + CSV | 3 .md reports, commands inline with findings, no python-docx |
| Polish | None | Obsidian-compatible markdown enforced (headings, bold, no stray #) |
| Risk | AI proceeds unless blocked | AI stops and asks before potentially disruptive tests |
