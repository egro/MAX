# Web Application Assessment - Frameworks

## Enable Frameworks (Set to true/false)

```markdown
USE_OWASP: true
USE_NIST: true
USE_CWE: true
USE_FEDRAMP: false
USE_SANS: true
USE_MITRE: false
```

---

## OWASP Top 10 2021 Mapping

| ID | Finding | OWASP Test | Must Include |
|----|--------|-----------|-----------|
| A01 | Broken Access Control | IDOR, auth bypass | [ ] |
| A02 | Cryptographic Failures | TLS config check | [x] |
| A03 | Injection | SQLi, XSS, cmd | [x] |
| A04 | Insecure Design | API endpoints | [x] |
| A05 | Security Misconfig | Headers, errors | [x] |
| A06 | Vulnerable Components | Version enum | [ ] |
| A07 | Auth Failures | Login testing | [ ] |
| A08 | Software Integrity | Deserzation | [ ] |
| A09 | Logging Failures | Log analysis | [ ] |
| A10 | SSRF | Header injection | [x] |

---

## NIST SP 800-53 Mapping

| Control | Web App Tests | Finding |
|---------|------------|---------|---------|
| AC-3 | Auth required | Login flow |
| AC-6 | Least privilege | Method limits |
| AC-14 | Permitted actions | Role checks |
| SC-8 | TLS encryption | SSL check |
| SC-10 | Error handling | Error pages |
| SC-13 | Cryptography | Cipher suite |
| SI-2 | Flaw remediation | WAF check |
| SI-3 | Malicious code | Rate limiting |
| SI-4 | Monitoring | Abuse detection |

Tests to perform:
- [x] SC-8: TLS 1.2+ enforcement
- [x] SC-10: Generic error messages
- [x] SC-13: Strong ciphers (AES-256+)
- [x] SI-2: WAF protection detected
- [x] SI-4: Rate limiting present
- [x] SI-3: Anti-automation present
- [x] AC-6: Method restrictions
- [x] AC-3: Authentication flow

---

## CWE Mapping

| CWE | Finding | Test Method |
|-----|--------|-------------|
| CWE-20 | Input Validation | Send special chars |
| CWE-22 | Path Traversal | ../../../etc/passwd |
| CWE-78 | Command Injection | ;whoami, $(whoami) |
| CWE-79 | XSS | <script>alert(1)</script> |
| CWE-89 | SQL Injection | ' OR '1'='1 |
| CWE-200 | Info Disclosure | Error analysis |
| CWE-255 | Credentials | Weak password test |
| CWE-287 | Authentication | Login flow |
| CWE-327 | Weak Crypto | TLS analysis |
| CWE-434 | File Upload | Upload test (if) |
| CWE-601 | Open Redirect | Redirect param |
| CWE-918 | SSRF | Header manip |

Tests to perform:
- [x] CWE-20: Input validation
- [x] CWE-22: Path traversal
- [x] CWE-78: Command injection
- [x] CWE-79: XSS (basic)
- [x] CWE-89: SQL injection (sqlmap)
- [x] CWE-200: Info in errors
- [x] CWE-327: TLS strength
- [x] CWE-918: SSRF

---

## SANS Top 25 Mapping

| Rank | Error | Test |
|------|-------|------|
| 3 | SQL Injection | sqlmap |
| 5 | OS Command Injection | Cmd injection |
| 6 | Path Traversal | LFI test |
| 8 | XSS (Reflected) | XSS payloads |
| 9 | Unrestricted Upload | If applicable |

Tests to perform:
- [x] CWE-89: SQL injection
- [x] CWE-78: Command injection
- [x] CWE-22: Path traversal
- [x] CWE-79: XSS
- [x] CWE-434: File upload

---

## MITRE ATT&CK Mapping (Optional)

| Tactic | Technique | Web App Tests |
|--------|----------|------------|
| TA0001 | T1190 - Exploit Public App | Version, CVE lookup |
| TA0001 | T1566 - Phishing | If applicable |
| TA0003 | T1078 - Valid Accounts | Login (if creds) |
| TA0006 | T1110 - Brute Force | If authorized |
| TA0007 | T1087 - Account Discovery | User enum |
| TA0010 | T1041 - Exfil C2 | Data exfil test |

Not typically tested in unauthenticated web app assessment.

---

## FedRAMP (Cloud Web App)

| Control | Test |
|---------|------|
| AC-2 | Account management |
| SC-7 | CDN/WAF protection |
| SC-8 | HTTPS enforced |
| SI-3 | WAF active |

Tests (if AWS-hosted):
- [ ] Check S3 buckets
- [ ] Check CloudFront
- [ ] Check WAF rules

---

## Finding Template with Mappings

Use this template for findings:

```csv
Finding ID,Title,Type,CVSS,CWE,OWASP,NIST,Evidence,Risk,Remediation,Status,Notes
```

Example:
```csv
WA-001,Information Disclosure,Info Disclosure,4.3,CWE-209,N/A,SC-10,"Server returns Apache, Oracle WebLogic headers","Reconnaissance made easier","Configure WAF to strip headers",Open,Akamai detected
```

---

## Multi-Framework Summary Table

| Finding | Severity | CVSS | CWE | OWASP | NIST | Status |
|---------|----------|-----|-----|------|------|--------|
| WA-001 | Medium | 4.3 | CWE-209 | N/A | SC-10 | Open |
| WA-002 | Positive | 0.0 | CWE-693 | N/A | CM-6 | Closed |
| WA-003 | Positive | 0.0 | CWE-184 | N/A | AC-6 | Closed |
| WA-004 | Positive | 0.0 | CWE-327 | A02 | SC-8 | Closed |
| WA-005 | Positive | 0.0 | CWE-1035 | A05 | SI-3 | Closed |
| WA-006 | Low | 2.0 | CWE-209 | A05 | N/A | Open |
```

---