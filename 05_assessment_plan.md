# Web Application Assessment - Execution Plan

## Pre-Assessment Setup

### 1. Configure Target (Edit 01_target.md)
```bash
# Update target variables
TARGET_URL=https://www.example.com
TARGET_DOMAIN=example.com
```

### 2. Enable Frameworks (Edit 04_frameworks.md)
```bash
# Set USE_OWASP: true
# Set USE_NIST: true
# etc.
```

### 3. Create Output Structure
```bash
mkdir -p outputs/{nmap,web,cloud,recon,scans}
```

---

## Assessment Checklist

### Phase 1: Reconnaissance
- [ ] DNS enumeration (dig, nslookup)
- [ ] SSL certificate analysis (openssl)
- [ ] Technology fingerprinting (whatweb)
- [ ] WHOIS lookup (optional)

**Output:** `outputs/recon/`

### Phase 2: Web Enumeration
- [ ] Directory enumeration (gobuster/dirb)
- [ ] HTTP header analysis (nmap, curl)
- [ ] Login page analysis (curl)
- [ ] Nikto scan (nikto)

**Output:** `outputs/web/`, `outputs/nmap/`

### Phase 3: Vulnerability Assessment
- [ ] SSL/TLS analysis
- [ ] HTTP methods test
- [ ] SQL injection (sqlmap)
- [ ] Input validation (manual)
- [ ] SSRF testing
- [ ] Security headers check

**Output:** `outputs/web/`, `outputs/nmap/`

### Phase 4: Cloud/Infrastructure (if applicable)
- [ ] S3 bucket enumeration (curl)
- [ ] WAF detection (wafw00f)
- [ ] Cloud hosting identification

**Output:** `outputs/cloud/`

### Phase 5: Framework Mapping
- [ ] Map findings to OWASP
- [ ] Map to CWE
- [ ] Map to NIST (if enabled)
- [ ] Map to SANS (if enabled)
- [ ] Map to MITRE (if enabled)

### Phase 6: Reporting
- [ ] Generate `findings.csv`
- [ ] Generate `command_log.md`
- [ ] Generate final report

---

## Post-Assessment

### Commands to Run

```bash
# Phase 1
dig TARGET_DOMAIN +short > outputs/recon/dns.txt
openssl s_client -connect TARGET_URL:443 2>&1 | openssl x509 -noout -text > outputs/recon/ssl_cert.txt
whatweb TARGET_URL > outputs/recon/whatweb.txt

# Phase 2
gobuster dir -u TARGET_URL -w /usr/share/wordlists/dirb/common.txt > outputs/web/dir_scan.txt
nikto -h TARGET_URL > outputs/web/nikto_scan.txt
nmap -p 443 --script=http-title,http-headers,ssl-cert TARGET_IP > outputs/nmap/headers.nmap

# Phase 3
nmap -p 443 --script=http-methods TARGET_IP > outputs/nmap/http_methods.nmap
sqlmap -u TARGET_URL --batch > outputs/web/sqlmap_log.txt
wafw00f TARGET_URL > outputs/cloud/wafw00f.txt

# Cloud
for bucket in BUCKET_NAMES; do
    curl -s -I "https://$bucket.s3.amazonaws.com"
done > outputs/cloud/buckets.txt
```

---

## Quality Checks

Before completing:
- [ ] All commands logged to `command_log.md`
- [ ] All tool outputs saved
- [ ] Findings mapped to frameworks
- [ ] CVSS scores calculated
- [ ] Remediation recommendations included
- [ ] Positive findings marked

---

## Deliverables

| Deliverable | Location |
|------------|----------|
| Findings CSV | `findings/findings.csv` |
| Command Log | `command_log.md` |
| Raw Outputs | `outputs/` |
| Final Report | `Assessment_Report.md` |

---

## Reuse Template

To reuse this template for a new target:

1. Copy `web_application/` folder
2. Edit `01_target.md` with new target info
3. Edit `04_frameworks.md` to enable frameworks
4. Run assessment using 05_assessment_plan.md
5. Generate new report

Example:
```bash
cp -r TEMPLATES/web_application /home/kali/new_assessment
cd /home/kali/new_assessment
# Edit 01_target.md
# Run commands from plan
# Generate report
```