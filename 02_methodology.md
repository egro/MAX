# Web Application Assessment - Methodology

## Assessment Phases

### Phase 1: Reconnaissance

**Objective:** Gather information about target

| Activity | Tools | Output |
|----------|-------|--------|
| DNS Enumeration | `dig`, `nslookup`, `host` | DNS records, IPs |
| DNS Zone Transfers | `dig`, `host` | If allowed |
| SSL Certificate | `openssl s_client` | Cert details, issuer |
| WHOIS | `whois` | Domain registration |
| Technology Fingerprinting | `whatweb` | Tech stack |
| Subdomain Enumeration | `amass`, `subfinder`, `gobuster` | Subdomains |

**Commands:**
```bash
dig TARGET_DOMAIN +short
host TARGET_DOMAIN
openssl s_client -connect TARGET_URL:443
whatweb TARGET_URL
```

---

### Phase 2: Web Enumeration

**Objective:** Map application structure

| Activity | Tools | Output |
|----------|-------|--------|
| Directory Discovery | `gobuster`, `dirb`, `ffuf` | Directories, files |
| Parameter Discovery | `ffuf`, `wfuzz` | GET/POST params |
| Login Page Analysis | `curl`, `browser` | Form fields, tokens |
| Endpoint Mapping | `gobuster`, `nikto` | API endpoints |
| Error Page Analysis | `curl` | Error handling |

**Commands:**
```bash
gobuster dir -u TARGET_URL -w /usr/share/wordlists/dirb/common.txt
nikto -h TARGET_URL
curl -s TARGET_URL | grep -i form
```

---

### Phase 3: Vulnerability Assessment

**Objective:** Find security vulnerabilities

#### Injection Testing

| Vulnerability | Tools | Parameters to Test |
|---------------|-------|-------------------|
| SQL Injection | `sqlmap` | All form inputs, URL params |
| XSS | Manual + `sqlmap` | Form inputs |
| Command Injection | Manual | File upload, params |
| Path Traversal | Manual | File include params |
| SSRF | Manual | URL params, headers |

**Commands:**
```bash
sqlmap -u TARGET_URL --batch
# Manual payloads
curl -X POST TARGET_URL -d "param=<script>alert(1)</script>"
curl -X POST TARGET_URL -d "param=../../../etc/passwd"
```

#### Configuration Testing

| Test | Tools | What to Check |
|------|-------|--------------|
| SSL/TLS | `openssl`, `testssl.sh` | Cipher strength, versions |
| HTTP Methods | `nmap`, `curl` | PUT, DELETE, TRACE |
| Security Headers | `nmap`, `curl` | CSP, X-Frame-Options |
| CORS | `curl` | Origin handling |

**Commands:**
```bash
openssl s_client -connect TARGET_URL:443
nmap -p 443 --script=http-methods TARGET_IP
curl -I TARGET_URL | grep -i header
```

---

### Phase 4: Authentication Testing

**Objective:** Test auth mechanisms (if authenticated)

| Test | Tools | Scope |
|------|-------|-------|
| Login Brute Force | `hydra`, `burpsuite` | With authorization only |
| Session Management | Manual | Cookie handling |
| Password Policy | `curl` | Weak policy detection |
| Account Lockout | Manual | Lockout testing |

---

### Phase 5: Additional Testing

| Test | Tools | Description |
|------|-------|-------------|
| WAF Detection | `wafw00f` | Identify WAF |
| Rate Limiting | Manual | Test limits |
| Business Logic | Manual | Workflow testing |
| IDOR | Manual | With credentials |

**Commands:**
```bash
wafw00f TARGET_URL
```

---

## Testing Checklist

- [ ] Phase 1: Reconnaissance complete
- [ ] Phase 2: Web enumeration complete
- [ ] Phase 3: Vulnerability assessment complete
- [ ] Injection tests (SQLi, XSS, cmd)
- [ ] Configuration tests (TLS, headers)
- [ ] SSRF tests
- [ ] Phase 4: Auth testing (if applicable)
- [ ] Phase 5: Additional tests
- [ ] Framework mappings complete
- [ ] Report generated

---

## Notes

- Always respect `RATE_LIMIT` and `NO_BRUTE_FORCE` settings
- Log every command to `command_log.md`
- Save all tool outputs to appropriate directories
- Document any anomalies or interesting findings
- Test both GET and POST methods
- Check both HTTP and HTTPS
