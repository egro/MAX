// Common pentest scenario shared across all four directions.
// Engagement: Northwind Commerce — external web app assessment.
// Reporting-only: find & document, no exploitation past PoC.

window.PENTEST = {
  engagement: {
    name: "Northwind Commerce",
    code: "NW-WEB-2026-03",
    type: "Public Web App",
    startedAt:    "2026-05-14 09:00 UTC",
    lastActivity: "just now",
    operator: "j.calder",
    assessor: "Jordan Calder",
    team: "CI Cyber Recon Hunt",
    status: "Active",
  },

  scope: {
    in: [
      "shop.northwind.io",
      "api.northwind.io",
      "cdn.northwind.io",
      "auth.northwind.io",
    ],
    out: [
      "corp.northwind.io",
      "*.internal.northwind.io",
      "billing-provider.com",
    ],
    rules: [
      "No exploitation past minimal PoC",
      "No DoS or volumetric scans",
      "No social engineering",
      "No data exfiltration beyond proof",
      "Notify SOC before active scans",
    ],
  },

  llm: {
    primary: "claude-sonnet-4.5",
    local: "qwen2.5-coder:32b · ollama",
    router: "policy: cloud for reasoning · local for tool I/O",
    spend: { today: 14.22, cap: 50, unit: "USD" },
    tokensIn: 2_148_300,
    tokensOut: 318_440,
  },

  hosts: [
    {
      host: "shop.northwind.io",
      ip: "203.0.113.42",
      tech: ["nginx/1.18.0", "Next.js 13.4", "jQuery 1.7.2"],
      ports: [
        { p: 80, svc: "http", state: "redirect→443" },
        { p: 443, svc: "https", state: "open", cert: "DigiCert · 87d" },
      ],
      findings: 4,
    },
    {
      host: "api.northwind.io",
      ip: "203.0.113.51",
      tech: ["nginx/1.20.0", "GraphQL (Apollo 3.7)", "Node 18"],
      ports: [
        { p: 443, svc: "https", state: "open", cert: "DigiCert · 87d" },
      ],
      findings: 3,
    },
    {
      host: "cdn.northwind.io",
      ip: "203.0.113.88",
      tech: ["CloudFront", "S3 origin"],
      ports: [{ p: 443, svc: "https", state: "open" }],
      findings: 1,
    },
    {
      host: "auth.northwind.io",
      ip: "203.0.113.19",
      tech: ["nginx/1.18.0", "Keycloak 21.1"],
      ports: [{ p: 443, svc: "https", state: "open" }],
      findings: 2,
    },
    {
      host: "cdn-old.northwind.io",
      ip: "—",
      tech: ["CNAME → orphaned-bucket.s3.amazonaws.com"],
      ports: [],
      findings: 1,
      orphan: true,
    },
  ],

  findings: [
    {
      id: "NW-F001",
      sev: "high",
      title: "Subdomain takeover via dangling CNAME",
      host: "cdn-old.northwind.io",
      cwe: "CWE-1104",
      cve: null,
      evidence: "dig cdn-old.northwind.io → orphaned-bucket.s3.amazonaws.com (NoSuchBucket)",
      status: "confirmed",
      eta_patch: "Remove DNS record or reclaim bucket",
      first_seen: "2026-05-16 11:42 UTC",
      cvss: { AV: "N", AC: "L", PR: "N", UI: "N", S: "C", C: "H", I: "H", A: "N" },
    },
    {
      id: "NW-F002",
      sev: "high",
      title: "Outdated jQuery 1.7.2 — multiple XSS sinks",
      host: "shop.northwind.io",
      cwe: "CWE-79",
      cve: "CVE-2020-11023, CVE-2015-9251",
      evidence: "GET / → /static/js/jquery-1.7.2.min.js (sha256 match)",
      status: "confirmed",
      eta_patch: "Upgrade to 3.7.x and audit selectors",
      first_seen: "2026-05-15 14:08 UTC",
      cvss: { AV: "N", AC: "L", PR: "N", UI: "R", S: "C", C: "L", I: "L", A: "N" },
    },
    {
      id: "NW-F003",
      sev: "high",
      title: "GraphQL introspection enabled in production",
      host: "api.northwind.io",
      cwe: "CWE-200",
      cve: null,
      evidence: "POST /graphql {query:__schema{types{name}}} → 200 (full schema)",
      status: "confirmed",
      eta_patch: "Disable introspection on prod gateway",
      first_seen: "2026-05-17 09:51 UTC",
      cvss: { AV: "N", AC: "L", PR: "N", UI: "N", S: "U", C: "L", I: "N", A: "N" },
    },
    {
      id: "NW-F004",
      sev: "med",
      title: "JWT validates with HS256 + weak signing key",
      host: "auth.northwind.io",
      cwe: "CWE-326",
      cve: null,
      evidence: "Recovered key 'northwind2023' via wordlist (rockyou subset, 4.2M tries)",
      status: "confirmed",
      eta_patch: "Rotate to RS256 + 256-bit random key, revoke tokens",
      first_seen: "2026-05-18 16:30 UTC",
      cvss: { AV: "N", AC: "L", PR: "N", UI: "N", S: "C", C: "H", I: "H", A: "N" },
    },
    {
      id: "NW-F005",
      sev: "med",
      title: "Missing Content-Security-Policy header",
      host: "shop.northwind.io",
      cwe: "CWE-693",
      cve: null,
      evidence: "Response headers lack CSP / X-Frame-Options on all routes",
      status: "confirmed",
      eta_patch: "Add strict CSP via edge config; report-only first",
      first_seen: "2026-05-15 14:11 UTC",
      cvss: { AV: "N", AC: "H", PR: "N", UI: "R", S: "U", C: "N", I: "L", A: "N" },
    },
    {
      id: "NW-F006",
      sev: "med",
      title: "Verbose error discloses stack trace on /search",
      host: "shop.northwind.io",
      cwe: "CWE-209",
      cve: null,
      evidence: "GET /search?q=%27 → 500 + Node.js trace + /var/app/server/db.js:142",
      status: "confirmed",
      eta_patch: "Catch & redact in error middleware",
      first_seen: "2026-05-19 10:14 UTC",
      cvss: { AV: "N", AC: "L", PR: "N", UI: "N", S: "U", C: "L", I: "N", A: "N" },
    },
    {
      id: "NW-F007",
      sev: "med",
      title: "GraphQL field-level rate-limit absent",
      host: "api.northwind.io",
      cwe: "CWE-770",
      cve: null,
      evidence: "1000× nested user{orders{items{...}}} accepted, 14s server time",
      status: "hypothesis",
      eta_patch: "Apollo persisted queries + depth/complexity limit",
      first_seen: "2026-05-20 13:02 UTC",
      cvss: { AV: "N", AC: "L", PR: "N", UI: "N", S: "U", C: "N", I: "N", A: "L" },
    },
    {
      id: "NW-F008",
      sev: "low",
      title: "Server header leaks nginx version",
      host: "shop.northwind.io · api.northwind.io",
      cwe: "CWE-200",
      cve: null,
      evidence: "Server: nginx/1.18.0",
      status: "confirmed",
      eta_patch: "server_tokens off; in nginx.conf",
      first_seen: "2026-05-14 16:22 UTC",
      cvss: { AV: "N", AC: "L", PR: "N", UI: "N", S: "U", C: "L", I: "N", A: "N" },
    },
    {
      id: "NW-F009",
      sev: "low",
      title: "robots.txt discloses /staging and /internal-api",
      host: "shop.northwind.io",
      cwe: "CWE-200",
      cve: null,
      evidence: "GET /robots.txt → Disallow: /staging, /internal-api, /admin-legacy",
      status: "confirmed",
      eta_patch: "Move sensitive paths off public host; serve auth.",
      first_seen: "2026-05-14 16:25 UTC",
      cvss: { AV: "N", AC: "L", PR: "N", UI: "N", S: "U", C: "L", I: "N", A: "N" },
    },
    {
      id: "NW-F010",
      sev: "info",
      title: "Keycloak 21.1 — N-1 minor (CVE-2024-1132 partial)",
      host: "auth.northwind.io",
      cwe: "CWE-1104",
      cve: "CVE-2024-1132",
      evidence: "GET /realms/master → version banner",
      status: "informational",
      eta_patch: "Upgrade to 24.x stable",
      first_seen: "2026-05-21 09:00 UTC",
      cvss: { AV: "N", AC: "H", PR: "L", UI: "N", S: "U", C: "L", I: "N", A: "N" },
    },
  ],

  agentLog: [
    { t: "09:14:02", kind: "plan", body: "This morning · sweep new /staging endpoints disclosed in robots.txt, validate JWT key reuse hypothesis on auth.northwind.io, hand off draft report sections." },
    { t: "09:14:18", kind: "tool", body: "ffuf -w common.txt -u https://shop.northwind.io/staging/FUZZ -mc 200,401,403", cost: "local" },
    { t: "09:14:42", kind: "obs",  body: "47 paths returned 401, 3 returned 200: /staging/health, /staging/version, /staging/_internal/jobs" },
    { t: "09:14:50", kind: "think", body: "Health + version are low value. /jobs may expose pending tasks — fetch + classify, do not interact." },
    { t: "09:15:11", kind: "tool", body: "curl -s https://shop.northwind.io/staging/_internal/jobs", cost: "local" },
    { t: "09:15:13", kind: "obs",  body: "200 · JSON · 12 entries · contains job IDs + status, no credentials. Logging as INFO; not in scope to interact." },
    { t: "09:15:30", kind: "plan", body: "Pivot: test JWT key reuse hypothesis. Use recovered key 'northwind2023' against api.northwind.io endpoints (read-only)." },
    { t: "09:15:34", kind: "approve", body: "Pending: forge JWT (sub=ops-readonly) and send 1 request to /api/users/me." },
    { t: "09:17:02", kind: "human", body: "approved (single request, read-only)" },
    { t: "09:17:04", kind: "tool", body: "curl -H \"Authorization: Bearer $JWT\" https://api.northwind.io/api/users/me" },
    { t: "09:17:05", kind: "obs",  body: "200 · {\"sub\":\"ops-readonly\",\"roles\":[\"viewer\"]} — key is shared across auth + api. Promoting NW-F004 from MED to HIGH; opening NW-F011." },
    { t: "09:17:40", kind: "think", body: "This is sufficient to demonstrate impact. Do not enumerate further accounts — escalation would breach RoE (no data exfiltration beyond proof)." },
  ],

  metrics: {
    days: { current: 9, total: 14 },
    coverage: 0.62,
    hostsSeen: 14,
    hostsInScope: 4,
    findingsBySev: { high: 3, med: 4, low: 2, info: 1 },
    reportReady: 0.71,
  },
};

// Methodology playbooks — drive the agent's plan template.
// Each engagement type maps to exactly one methodology (official names kept).
window.METHODOLOGIES = [
  { id: "owasp-wstg-pub",  name: "OWASP WSTG v4.2",          profile: "Public Web Application",   playbook: "OWASP",   active: true, steps: 12 },
  { id: "owasp-wstg-int",  name: "OWASP WSTG v4.2",          profile: "Internal Web Application", playbook: "OWASP",   steps: 12 },
  { id: "owasp-cis-cloud", name: "OWASP WSTG v4.2 + CIS",    profile: "Cloud Web Application",    playbook: "CLOUD",   steps: 11 },
  { id: "attack-ad",       name: "MITRE ATT&CK (Enterprise)", profile: "Active Directory",         playbook: "AD",      steps: 9 },
  { id: "ptes-network",    name: "PTES",                     profile: "Internal Network / Hosts", playbook: "PTES",    steps: 7 },
  { id: "nist-800-115",    name: "NIST SP 800-115",          profile: "Asset Discovery & ID",     playbook: "DISCOVERY", steps: 5 },
  { id: "nist-800-61",     name: "NIST SP 800-61r2",         profile: "Incident Investigation",   playbook: "IR",      steps: 6 },
  { id: "owasp-asvs-sso",  name: "OWASP ASVS + WSTG",        profile: "Authenticated / SSO",      playbook: "ASVS",    steps: 10 },
  { id: "custom",          name: "Custom playbook",          profile: "—",                        playbook: "CUSTOM",  steps: 0 },
];

// Maps an engagement-type label (used in the wizard) → methodology id.
window.ENGAGEMENT_METHODOLOGY = {
  "Public Web Application":   "owasp-wstg-pub",
  "Internal Web Application": "owasp-wstg-int",
  "Cloud Web Application":    "owasp-cis-cloud",
  "Active Directory":         "attack-ad",
  "Internal Network / Hosts": "ptes-network",
  "Asset Discovery & ID":     "nist-800-115",
  "Incident Investigation":   "nist-800-61",
  "Authenticated / SSO":      "owasp-asvs-sso",
};

window.PLAYBOOK_OWASP_EXT = [
  { code: "WSTG-INFO", name: "Information Gathering",        status: "done", findings: 2, current: false },
  { code: "WSTG-CONF", name: "Configuration & Deployment",   status: "done", findings: 2, current: false },
  { code: "WSTG-IDNT", name: "Identity Management",          status: "done", findings: 0, current: false },
  { code: "WSTG-ATHN", name: "Authentication Testing",       status: "active", findings: 1, current: true },
  { code: "WSTG-ATHZ", name: "Authorization Testing",        status: "active", findings: 0, current: false },
  { code: "WSTG-SESS", name: "Session Management",           status: "queued", findings: 0, current: false },
  { code: "WSTG-INPV", name: "Input Validation",             status: "partial", findings: 2, current: false },
  { code: "WSTG-ERRH", name: "Error Handling",               status: "done", findings: 1, current: false },
  { code: "WSTG-CRYP", name: "Cryptography",                 status: "partial", findings: 1, current: false },
  { code: "WSTG-BUSL", name: "Business Logic",               status: "queued", findings: 0, current: false },
  { code: "WSTG-CLNT", name: "Client-Side Testing",          status: "partial", findings: 1, current: false },
  { code: "WSTG-APIT", name: "API Testing",                  status: "active", findings: 1, current: false },
];

// PTES — internal network / host groups
window.PLAYBOOK_PTES = [
  { code: "PTES-PRE",  name: "Pre-engagement Interactions", status: "done",    findings: 0, current: false },
  { code: "PTES-INTL", name: "Intelligence Gathering",      status: "done",    findings: 1, current: false },
  { code: "PTES-THRT", name: "Threat Modeling",             status: "done",    findings: 0, current: false },
  { code: "PTES-VULN", name: "Vulnerability Analysis",      status: "active",  findings: 3, current: true },
  { code: "PTES-EXPL", name: "Exploitation",                status: "queued",  findings: 0, current: false },
  { code: "PTES-POST", name: "Post-Exploitation",           status: "queued",  findings: 0, current: false },
  { code: "PTES-RPT",  name: "Reporting",                   status: "queued",  findings: 0, current: false },
];

// MITRE ATT&CK (Enterprise) — Active Directory
window.PLAYBOOK_AD = [
  { code: "TA0043", name: "Reconnaissance",          status: "done",    findings: 1, current: false },
  { code: "TA0007", name: "Discovery",               status: "active",  findings: 2, current: true },
  { code: "TA0006", name: "Credential Access",       status: "active",  findings: 1, current: false },
  { code: "TA0008", name: "Lateral Movement",        status: "queued",  findings: 0, current: false },
  { code: "TA0004", name: "Privilege Escalation",    status: "queued",  findings: 0, current: false },
  { code: "TA0003", name: "Persistence",             status: "queued",  findings: 0, current: false },
  { code: "TA0005", name: "Defense Evasion",         status: "queued",  findings: 0, current: false },
  { code: "TA0040", name: "Impact (assessed only)",  status: "queued",  findings: 0, current: false },
  { code: "RPT",    name: "Reporting",               status: "queued",  findings: 0, current: false },
];

// NIST SP 800-115 — asset discovery & identification
window.PLAYBOOK_DISCOVERY = [
  { code: "DISC-PLAN", name: "Planning & Scope",         status: "done",    findings: 0, current: false },
  { code: "DISC-DISC", name: "Network Discovery",        status: "active",  findings: 2, current: true },
  { code: "DISC-IDNT", name: "Service & OS Identification", status: "active", findings: 1, current: false },
  { code: "DISC-VULN", name: "Vulnerability Identification", status: "queued", findings: 0, current: false },
  { code: "DISC-RPT",  name: "Inventory & Reporting",    status: "queued",  findings: 0, current: false },
];

// NIST SP 800-61r2 — incident investigation
window.PLAYBOOK_IR = [
  { code: "IR-PREP", name: "Preparation & Context",       status: "done",    findings: 0, current: false },
  { code: "IR-DETC", name: "Detection & Analysis",        status: "active",  findings: 2, current: true },
  { code: "IR-SCOP", name: "Scoping & Triage",            status: "active",  findings: 1, current: false },
  { code: "IR-CONT", name: "Containment (recommendations)", status: "queued", findings: 0, current: false },
  { code: "IR-ERAD", name: "Eradication & Recovery (guidance)", status: "queued", findings: 0, current: false },
  { code: "IR-RPT",  name: "Post-Incident Reporting",     status: "queued",  findings: 0, current: false },
];

// OWASP ASVS + WSTG — authenticated / SSO
window.PLAYBOOK_ASVS = [
  { code: "V1",  name: "Architecture & Threat Modeling",  status: "done",    findings: 0, current: false },
  { code: "V2",  name: "Authentication",                  status: "active",  findings: 1, current: true },
  { code: "V3",  name: "Session Management",              status: "active",  findings: 0, current: false },
  { code: "V4",  name: "Access Control",                  status: "queued",  findings: 0, current: false },
  { code: "V6",  name: "Stored Cryptography",             status: "queued",  findings: 0, current: false },
  { code: "V7",  name: "Error Handling & Logging",        status: "queued",  findings: 0, current: false },
  { code: "V8",  name: "Data Protection",                 status: "queued",  findings: 0, current: false },
  { code: "V11", name: "Business Logic",                  status: "queued",  findings: 0, current: false },
  { code: "V13", name: "API & Web Service (SSO/OIDC/SAML)", status: "active", findings: 1, current: false },
  { code: "V14", name: "Configuration",                   status: "queued",  findings: 0, current: false },
];

// Cloud web app — OWASP WSTG + CIS Benchmarks overlay
window.PLAYBOOK_CLOUD = [
  { code: "WSTG-INFO", name: "Information Gathering",       status: "done",    findings: 1, current: false },
  { code: "CIS-IAM",   name: "Identity & Access (CIS)",     status: "active",  findings: 2, current: true },
  { code: "CIS-STOR",  name: "Storage Exposure (CIS)",      status: "active",  findings: 1, current: false },
  { code: "WSTG-CONF", name: "Configuration & Deployment",  status: "active",  findings: 1, current: false },
  { code: "WSTG-ATHN", name: "Authentication Testing",      status: "queued",  findings: 0, current: false },
  { code: "WSTG-ATHZ", name: "Authorization Testing",       status: "queued",  findings: 0, current: false },
  { code: "WSTG-INPV", name: "Input Validation",            status: "queued",  findings: 0, current: false },
  { code: "CIS-NET",   name: "Network Exposure (CIS)",      status: "active",  findings: 1, current: false },
  { code: "CIS-LOG",   name: "Logging & Monitoring (CIS)",  status: "queued",  findings: 0, current: false },
  { code: "WSTG-CRYP", name: "Cryptography / TLS",          status: "partial", findings: 1, current: false },
  { code: "CLOUD-RPT", name: "Reporting",                   status: "queued",  findings: 0, current: false },
];

// Lookup: playbook key → step array (used by sidebar + methodology preview).
window.PLAYBOOK_BY_KEY = {
  OWASP:     window.PLAYBOOK_OWASP_EXT,
  CLOUD:     window.PLAYBOOK_CLOUD,
  AD:        window.PLAYBOOK_AD,
  PTES:      window.PLAYBOOK_PTES,
  DISCOVERY: window.PLAYBOOK_DISCOVERY,
  IR:        window.PLAYBOOK_IR,
  ASVS:      window.PLAYBOOK_ASVS,
  CUSTOM:    [],
};

// Pivot suggestions surfaced by the agent when findings cross-pollinate.
window.PIVOTS = [
  {
    id: "NW-PV1",
    title: "JWT signing key reuse across services",
    body: "NW-F004 recovered key 'northwind2023' validates on auth.northwind.io. Test the same key against api.northwind.io read endpoints — single forged token, read-only call.",
    connects: ["NW-F004", "NW-F003"],
    sev: "high",
    cost: "1 request",
    risk: "low",
    status: "approved",
  },
  {
    id: "NW-PV2",
    title: "Subdomain takeover + missing CSP enables drive-by",
    body: "If we claim orphaned-bucket.s3.amazonaws.com (NW-F001) and shop.northwind.io lacks CSP (NW-F005), an attacker could serve JS from cdn-old.northwind.io and have shop pages execute it. Worth a paper exercise — no actual claim.",
    connects: ["NW-F001", "NW-F005"],
    sev: "high",
    cost: "documentation only",
    risk: "none",
    status: "pending",
  },
  {
    id: "NW-PV3",
    title: "GraphQL introspection + complexity gap",
    body: "NW-F003 (introspection) gives us the schema; NW-F007 (no complexity limit) lets us craft a deep query. Together they enable denial-of-wallet without DoS. Skip — out of scope (no DoS).",
    connects: ["NW-F003", "NW-F007"],
    sev: "med",
    cost: "skipped",
    risk: "RoE conflict",
    status: "skipped",
  },
];

// Kali Linux tool inventory — grouped by Kali's native category headings.
// Defaults reflect a typical External Web engagement; internal/post-exploitation
// tools default off and can be enabled per engagement.
window.KALI_TOOLS = [
  // ── Information Gathering ───────────────────────────────────────
  { id: "nmap",         cat: "Information Gathering", label: "nmap",         v: "7.94",   desc: "port + service scanner",                  on: true,  externalOK: true },
  { id: "masscan",      cat: "Information Gathering", label: "masscan",      v: "1.3.2",  desc: "fast wide port sweeps",                   on: false, externalOK: true },
  { id: "amass",        cat: "Information Gathering", label: "amass",        v: "4.2.0",  desc: "subdomain enumeration (active + passive)", on: true,  externalOK: true },
  { id: "sublist3r",    cat: "Information Gathering", label: "sublist3r",    v: "1.1",    desc: "passive subdomain enumeration",           on: true,  externalOK: true },
  { id: "dnsrecon",     cat: "Information Gathering", label: "dnsrecon",     v: "1.1.5",  desc: "DNS reconnaissance + zone walking",       on: true,  externalOK: true },
  { id: "whatweb",      cat: "Information Gathering", label: "whatweb",      v: "0.5.5",  desc: "web tech fingerprinter",                  on: true,  externalOK: true },
  { id: "httpx",        cat: "Information Gathering", label: "httpx",        v: "1.3.7",  desc: "HTTP probe + screenshot",                 on: true,  externalOK: true },
  { id: "theharvester", cat: "Information Gathering", label: "theHarvester", v: "4.5",    desc: "email/host/sub-domain harvester",         on: true,  externalOK: true },

  // ── Vulnerability Analysis ──────────────────────────────────────
  { id: "nikto",        cat: "Vulnerability Analysis", label: "nikto",       v: "2.5.0",  desc: "web server vulnerability scanner",        on: true,  externalOK: true },
  { id: "nuclei",       cat: "Vulnerability Analysis", label: "nuclei",      v: "3.2.1",  desc: "template-based CVE scanner",              on: true,  externalOK: true },
  { id: "testssl",      cat: "Vulnerability Analysis", label: "testssl.sh",  v: "3.2",    desc: "TLS/SSL audit",                           on: true,  externalOK: true },
  { id: "sslyze",       cat: "Vulnerability Analysis", label: "sslyze",      v: "5.2",    desc: "TLS configuration scanner",               on: false, externalOK: true },

  // ── Web Application Analysis ────────────────────────────────────
  { id: "ffuf",         cat: "Web Application Analysis", label: "ffuf",      v: "2.1.0",  desc: "fast web fuzzer",                         on: true,  externalOK: true },
  { id: "gobuster",     cat: "Web Application Analysis", label: "gobuster",  v: "3.6",    desc: "content + DNS brute-forcer",              on: true,  externalOK: true },
  { id: "dirb",         cat: "Web Application Analysis", label: "dirb",      v: "2.22",   desc: "web content scanner",                     on: false, externalOK: true },
  { id: "wpscan",       cat: "Web Application Analysis", label: "wpscan",    v: "3.8.25", desc: "WordPress security scanner",              on: false, externalOK: true },
  { id: "sqlmap",       cat: "Web Application Analysis", label: "sqlmap",    v: "1.8.2",  desc: "SQL injection scanner",                   on: true,  externalOK: true },
  { id: "burp",         cat: "Web Application Analysis", label: "burpsuite", v: "2024.6", desc: "intercepting proxy",                      on: true,  externalOK: true },

  // ── Password Attacks ────────────────────────────────────────────
  { id: "hydra",        cat: "Password Attacks", label: "hydra",        v: "9.5",    desc: "network logon cracker",                   on: false, externalOK: true },
  { id: "medusa",       cat: "Password Attacks", label: "medusa",       v: "2.2",    desc: "parallel login brute",                    on: false, externalOK: true },
  { id: "john",         cat: "Password Attacks", label: "john",         v: "1.9.0",  desc: "password hash cracker",                   on: true,  externalOK: true },
  { id: "hashcat",      cat: "Password Attacks", label: "hashcat",      v: "6.2.6",  desc: "GPU hash cracker",                        on: true,  externalOK: true },

  // ── Exploitation Tools ──────────────────────────────────────────
  { id: "metasploit",   cat: "Exploitation Tools", label: "metasploit", v: "6.4.5",  desc: "exploitation framework",                  on: false, externalOK: true },
  { id: "searchsploit", cat: "Exploitation Tools", label: "searchsploit", v: "2024.1", desc: "exploit-db CLI",                        on: true,  externalOK: true },

  // ── Sniffing & Spoofing ─────────────────────────────────────────
  { id: "mitmproxy",    cat: "Sniffing & Spoofing", label: "mitmproxy",  v: "10.2",   desc: "interactive TLS-capable proxy",           on: false, externalOK: true },

  // ── Post Exploitation ──────────────────────────────────────────
  { id: "responder",    cat: "Post Exploitation", label: "responder",    v: "3.1.5",  desc: "LLMNR/NBT-NS poisoner",                  on: false, externalOK: false },
  { id: "bloodhound",   cat: "Post Exploitation", label: "bloodhound",   v: "5.3",    desc: "AD attack-path mapper",                  on: false, externalOK: false },
  { id: "impacket",     cat: "Post Exploitation", label: "impacket-*",   v: "0.12",   desc: "windows/AD exploitation suite",          on: false, externalOK: false },
  { id: "netexec",      cat: "Post Exploitation", label: "netexec",      v: "1.2",    desc: "SMB/WinRM/MSSQL enumerator (CME fork)",  on: false, externalOK: false },

  // ── Scripting & Shells ──────────────────────────────────────────
  { id: "bash",         cat: "Scripting & Shells", label: "bash",       v: "5.2",    desc: "shell scripting",                         on: true,  externalOK: true },
  { id: "python",       cat: "Scripting & Shells", label: "python3",    v: "3.12",   desc: "ad-hoc scripts + libs (requests, etc.)",  on: true,  externalOK: true },
  { id: "powershell",   cat: "Scripting & Shells", label: "pwsh",       v: "7.4",    desc: "PowerShell — Win/AD modules",             on: true,  externalOK: true },
  { id: "curl",         cat: "Scripting & Shells", label: "curl",       v: "8.6.0",  desc: "ad-hoc HTTP",                             on: true,  externalOK: true },

  // ── Reporting Tools ─────────────────────────────────────────────
  { id: "pandoc",       cat: "Reporting Tools", label: "pandoc",        v: "3.1.13", desc: "MD ↔ PDF / DOCX",                         on: true,  externalOK: true },
  { id: "gowitness",    cat: "Reporting Tools", label: "gowitness",     v: "3.0",    desc: "web screenshots for evidence",            on: true,  externalOK: true },
];

window.SEV_COLORS = {
  high: "#e0533d",
  med: "#e0a93d",
  low: "#7ab6e0",
  info: "#9aa0a6",
};
