# Web Application Assessment - Tools

## Required Tools (Auto-Detect)

Run this first to check availability:

```bash
which dig nslookup host whatweb curl wget nmap nikto gobuster sqlmap nuclei ffuf wafw00f
```

## Tool Categories

### 1. Reconnaissance

| Tool | Purpose | Example |
|------|---------|---------|
| `dig` | DNS queries | `dig TARGET_DOMAIN +short` |
| `nslookup` | DNS lookup | `nslookup TARGET_DOMAIN` |
| `host` | DNS enum | `host -t any TARGET_DOMAIN` |
| `whatweb` | Tech fingerprint | `whatweb TARGET_URL` |
| `whois` | Domain info | `whois TARGET_DOMAIN` |

### 2. SSL/TLS Analysis

| Tool | Purpose | Example |
|------|---------|---------|
| `openssl` | Cert inspection | `openssl s_client -connect URL:443` |
| `testssl.sh` | Full TLS audit | `testssl.sh TARGET_URL` |

### 3. Directory/Path Enumeration

| Tool | Purpose | Example |
|------|---------|---------|
| `gobuster` | Dir busting | `gobuster dir -u URL -w wordlist.txt` |
| `dirb` | Dir scanning | `dirb URL wordlist.txt` |
| `ffuf` | Fast fuzzing | `ffuf -u URL/FUZZ -w wordlist.txt` |
| `nikto` | Web scanner | `nikto -h URL` |

### 4. Vulnerability Testing

| Tool | Purpose | Example |
|------|---------|---------|
| `sqlmap` | SQL injection | `sqlmap -u URL --batch` |
| `nuclei` | CVE scanning | `nuclei -u URL` |
| `xsser` | XSS testing | `xsser -u URL` |

### 5. WAF/Protection Detection

| Tool | Purpose | Example |
|------|---------|---------|
| `wafw00f` | WAF detection | `wafw00f TARGET_URL` |
| `whatwaf` | WAF detection | `whatwaf -u TARGET_URL` |

### 6. Manual Testing

| Tool | Purpose | Example |
|------|---------|---------|
| `curl` | HTTP requests | All manual testing |
| `wget` | Downloads | `wget -r TARGET_URL` |
| `browser` | Interactive | Manual form testing |

### 7. Metasploit (Optional)

| Module | Purpose |
|--------|---------|
| `auxiliary/scanner/http/http_version` | Version detection |
| `auxiliary/scanner/http/options` | HTTP options |
| `auxiliary/scanner/ssl/openssl_heartbleed` | Heartbleed |
| `auxiliary/scanner/ssl/ssl_version` | TLS version |

---

## Dynamic Tool Detection Script

```bash
#!/bin/bash
# Check available web testing tools

echo "=== Tool Detection ==="

for tool in dig nslookup host whatweb curl wget nmap nikto gobuster sqlmap nuclei ffuf wafw00f; do
    if which $tool >/dev/null 2>&1; then
        echo "[+] $tool"
    else
        echo "[-] $tool (NOT FOUND)"
    fi
done

echo "=== Metasploit ==="
if which msfconsole >/dev/null 2>&1; then
    echo "[+] Metasploit available"
else
    echo "[-] Metasploit (NOT FOUND)"
fi
```

---

## Output Directories

Create before testing:

```bash
mkdir -p outputs/{nmap,web,cloud,recon,scans}
```

| Directory | Contents |
|-----------|----------|
| `outputs/recon/` | DNS, SSL, whatweb |
| `outputs/nmap/` | Port scans, HTTP methods |
| `outputs/web/` | nikto, gobuster, sqlmap |
| `outputs/cloud/` | S3 buckets, cloud enum |
| `outputs/scans/` | Nuclei, other scans |

---

## Command Logging Template

```
| Date | Command | Output File |
|------|---------|----------|
| YYYY-MM-DD | command -args | outputs/path/file.txt |
```

Example:
```
| 2026-04-14 | dig www.example.com +short | outputs/recon/dns.txt |
| 2026-04-14 | nikto -h https://www.example.com | outputs/web/nikto.txt |
```
