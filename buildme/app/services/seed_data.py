from app.extensions import db
from app.models.phase_definition import PhaseDefinition


DEFAULT_PHASES = [
    {
        "name": "network_recon",
        "label": "Network Recon",
        "category": "host",
        "description": "Port scan and service discovery with OS detection",
        "command_template": "nmap -sV -sC -O -p- {target} -oX /tmp/{id}.xml",
        "suggested_tools": ["nmap"]
    },
    {
        "name": "os_fingerprint",
        "label": "OS Fingerprinting",
        "category": "host",
        "description": "Remote OS detection via TCP/IP stack fingerprinting",
        "command_template": "nmap -O --osscan-guess {target}",
        "suggested_tools": ["nmap"]
    },
    {
        "name": "service_enum",
        "label": "Service Enumeration",
        "category": "host",
        "description": "Service version detection and banner grabbing",
        "command_template": "nmap -sV --version-intensity 9 {target}",
        "suggested_tools": ["nmap"]
    },
    {
        "name": "dns_enum",
        "label": "DNS Enumeration",
        "category": "host",
        "description": "DNS zone transfer attempts and record enumeration",
        "command_template": "dnsrecon -d {target} 2>&1; dnsenum {target} 2>&1",
        "suggested_tools": ["dnsrecon", "dnsenum"]
    },
    {
        "name": "host_vuln",
        "label": "Vulnerability Scan",
        "category": "host",
        "description": "General vulnerability scanning with nuclei",
        "command_template": "nuclei -u {target} -severity critical,high,medium 2>&1",
        "suggested_tools": ["nuclei"]
    },
    {
        "name": "compliance",
        "label": "Compliance Audit",
        "category": "host",
        "description": "System hardening and CIS benchmark audit",
        "command_template": "lynis audit system --quiet 2>&1",
        "suggested_tools": ["lynis"]
    },
    {
        "name": "cred_test",
        "label": "Credential Testing",
        "category": "host",
        "description": "Password brute-force against SSH and other services",
        "command_template": "hydra -L /usr/share/wordlists/usernames.txt -P /usr/share/wordlists/passwords.txt {target} ssh 2>&1",
        "suggested_tools": ["hydra"]
    },
    {
        "name": "share_enum",
        "label": "Share Enumeration",
        "category": "host",
        "description": "SMB and network share discovery",
        "command_template": "smbclient -L //{target} -N 2>&1; enum4linux {target} 2>&1",
        "suggested_tools": ["smbclient", "enum4linux"]
    },
    {
        "name": "malware_scan",
        "label": "Malware Scan",
        "category": "host",
        "description": "Local malware and rootkit detection",
        "command_template": "clamscan -r / 2>&1; chkrootkit 2>&1",
        "suggested_tools": ["clamav", "chkrootkit", "rkhunter"]
    },
    {
        "name": "container",
        "label": "Container/Cloud",
        "category": "host",
        "description": "Container runtime and orchestration posture checks",
        "command_template": "docker ps -a 2>&1; docker info 2>&1",
        "suggested_tools": ["docker"]
    },
    {
        "name": "recon",
        "label": "Reconnaissance",
        "category": "web",
        "description": "WHOIS lookup and web technology fingerprinting",
        "command_template": "whois {target} 2>&1; whatweb {target} 2>&1",
        "suggested_tools": ["whatweb", "whois"]
    },
    {
        "name": "ssl_tls",
        "label": "SSL/TLS Audit",
        "category": "web",
        "description": "SSL/TLS certificate and cipher suite analysis",
        "command_template": "sslscan {target} 2>&1; testssl {target} 2>&1",
        "suggested_tools": ["sslscan", "testssl"]
    },
    {
        "name": "web_enum",
        "label": "Web Enumeration",
        "category": "web",
        "description": "Web server enumeration, known paths, and WAF detection",
        "command_template": "nikto -h {target} 2>&1; wafw00f {target} 2>&1",
        "suggested_tools": ["nikto", "wafw00f"]
    },
    {
        "name": "web_vuln",
        "label": "Web Vulnerability",
        "category": "web",
        "description": "Web application vulnerability scanning with nuclei",
        "command_template": "nuclei -u {target} -severity critical,high,medium 2>&1",
        "suggested_tools": ["nuclei"]
    },
    {
        "name": "web_fuzz",
        "label": "Web Fuzzing",
        "category": "web",
        "description": "Directory brute-force and parameter fuzzing",
        "command_template": "gobuster dir -u {target} -w /usr/share/wordlists/dirb/common.txt 2>&1; ffuf -u {target}/FUZZ -w /usr/share/wordlists/dirb/common.txt 2>&1",
        "suggested_tools": ["gobuster", "ffuf"]
    },
    {
        "name": "auth",
        "label": "Auth Testing",
        "category": "web",
        "description": "HTTP authentication method discovery",
        "command_template": "nmap -p 80,443 --script http-auth-finder {target} 2>&1",
        "suggested_tools": ["nmap"]
    },
]


def seed_default_phases():
    if PhaseDefinition.query.first() is not None:
        return

    for phase_data in DEFAULT_PHASES:
        existing = PhaseDefinition.query.filter_by(name=phase_data["name"]).first()
        if existing:
            continue
        phase = PhaseDefinition(**phase_data)
        db.session.add(phase)

    db.session.commit()
