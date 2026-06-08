# MAX — Build Plan

MAX automates security assessments by orchestrating a fleet of Kali-based engine containers. Assessments are broken into user-selectable phases (recon, SSL, enumeration, vulnerability testing, credential testing, host analysis, etc.), with findings captured and mapped to frameworks like OWASP Top 10, NIST SP 800-53, CWE, and SANS Top 25.

## Architecture

```
                     Management Host
┌─────────────────────────────────────────────────────────────────────┐
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │       web          │  │   db             │  │   redis          │ │
│  │  Flask + Gunicorn  │  │  PostgreSQL 16   │  │  Redis 7 + auth  │ │
│  │  python:3.12-slim │  └──────────────────┘  └──────────────────┘ │
│  └───────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────┘

                          Engine Host(s)
┌─────────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ engine                                                       │  │
│  │  Kali Linux + Attack Tools                                    │  │
│  │  Celery Worker                                                │  │
│  │  Auto-registers on startup, sends heartbeat                   │  │
│  │  Receives tasks with command_template + target, executes,     │  │
│  │  streams live output via Redis pub/sub                        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Frontend styling** | Bare-bones HTML + minimal CSS, no framework. UI will evolve through iteration. |
| **Phase execution** | PhaseDefinitions store a `command_template` with `{target}` placeholder. Engine substitutes and executes via shell. |
| **Phase error handling** | Abort immediately on tool failure, mark phase as `failed`. No skip-and-continue. |
| **Auth creds storage** | Fernet symmetric encryption using Flask's `SECRET_KEY`. Decrypted at runtime when engine needs them. |
| **Assessment states** | `created` → `running` → `paused` → `completed` / `failed`. User can pause between phases. |
| **User roles** | `admin` — can create/edit phase definitions (command templates). `user` — can create assessments and select from existing phases. |
| **Wordlists** | Uploaded via web GUI, stored in DB/filesystem, propagated to the assigned engine before phase execution. |

## Engine Model

Each engine container is a Kali Linux instance. Engines self-register on startup and maintain a heartbeat.

| Concept | Implementation |
|---------|---------------|
| **Engine identity** | `name` + `network_tag` (e.g. `dmz`, `internal-prod`) |
| **Registration** | Engine POSTs to `web` at startup, gets assigned ID, starts Celery worker |
| **Heartbeat** | Celery periodic task updates `last_heartbeat_at` every 30s |
| **Health check** | Web marks engine offline if `last_heartbeat_at > 60s` stale |
| **Task routing** | All engines listen on same queue; any engine can pick up any task |

## PhaseDefinitions (Seed Data)

Shipped with the app and stored in the DB. Users with `admin` role can create/edit/delete them.

| name | label | category | command_template |
|------|-------|----------|-----------------|
| network_recon | Network Recon | host | `nmap -sV -sC -O -p- {target} -oX /tmp/{id}.xml` |
| os_fingerprint | OS Fingerprinting | host | `nmap -O --osscan-guess {target}` |
| service_enum | Service Enumeration | host | `nmap -sV --version-intensity 9 {target}` |
| dns_enum | DNS Enumeration | host | `dnsrecon -d {target} 2>&1; dnsenum {target} 2>&1` |
| host_vuln | Vulnerability Scan | host | `nuclei -u {target} -severity critical,high,medium 2>&1` |
| compliance | Compliance Audit | host | `lynis audit system --quiet 2>&1` |
| cred_test | Credential Testing | host | `hydra -L /usr/share/wordlists/usernames.txt -P /usr/share/wordlists/passwords.txt {target} ssh 2>&1` |
| share_enum | Share Enumeration | host | `smbclient -L //{target} -N 2>&1; enum4linux {target} 2>&1` |
| malware_scan | Malware Scan | host | `clamscan -r / 2>&1; chkrootkit 2>&1` |
| container | Container/Cloud | host | `docker ps -a 2>&1; docker info 2>&1` |
| recon | Reconnaissance | web | `whois {target} 2>&1; whatweb {target} 2>&1` |
| ssl_tls | SSL/TLS Audit | web | `sslscan {target} 2>&1; testssl {target} 2>&1` |
| web_enum | Web Enumeration | web | `nikto -h {target} 2>&1; wafw00f {target} 2>&1` |
| web_vuln | Web Vulnerability | web | `nuclei -u {target} -severity critical,high,medium 2>&1` |
| web_fuzz | Web Fuzzing | web | `gobuster dir -u {target} -w /usr/share/wordlists/dirb/common.txt 2>&1; ffuf -u {target}/FUZZ -w /usr/share/wordlists/dirb/common.txt 2>&1` |
| auth | Auth Testing | web | `nmap -p 80,443 --script http-auth-finder {target} 2>&1` |

## Progress Summary

| Phase | Status |
|-------|--------|
| **A:** Docker & Foundation | `[DONE]` |
| **B:** Auth & User Model | `[DONE]` |
| **C:** Engine Registration + Health | `[DONE]` |
| **D:** Assessment + PhaseDefinition CRUD | `[DONE]` |
| **E:** Celery Task Framework + Live Output | `[NOT STARTED]` |
| **F:** Tool Installation & Engine Readiness | `[NOT STARTED]` |
| **G:** Findings Management | `[NOT STARTED]` |
| **H:** Report Generation | `[NOT STARTED]` |
| **I:** API Layer | `[NOT STARTED]` |

**Status Key:** `[NOT STARTED]` — `[IN PROGRESS]` — `[DONE]` — `[BLOCKED]`

## Directory Structure

```
buildme/
├── webhost/
│   ├── Dockerfile.web
│   ├── docker-compose.yml        # Management stack: db, redis, web
│   ├── start.sh                  # Injects host IPs before docker compose
│   ├── .env
│   └── .env.example
├── engine/
│   ├── Dockerfile.engine
│   ├── docker-compose.yml        # Engine-only, standalone
│   ├── entrypoint.sh             # Engine auto-registration on startup
│   ├── start.sh                  # Validates required vars, injects host IPs
│   └── .env.example
├── app/
│   ├── __init__.py               # Flask app factory, CLI init
│   ├── cli.py                    # Flask CLI commands (set-role, list-users)
│   ├── config.py                 # Configuration (DB, Redis, secrets)
│   ├── extensions.py             # db, migrate, login_manager, celery init
│   ├── models/
│   │   ├── user.py               # User (registration, auth, roles)
│   │   ├── engine.py             # Engine registration + heartbeat
│   │   ├── phase_definition.py   # Phase catalog (user-customizable command templates)
│   │   ├── assessment.py         # Assessment model (target, phases, status)
│   │   ├── assessment_phase.py   # Phase instance within an assessment
│   │   └── finding.py            # Finding model (severity, evidence, frameworks)
│   ├── routes/
│   │   ├── auth.py               # Login, logout, register
│   │   ├── engines.py            # Engine API + health dashboard
│   │   ├── assessments.py        # Assessment CRUD
│   │   ├── phase_definitions.py  # Phase definition CRUD (admin)
│   │   └── findings.py           # Findings list/edit
│   ├── services/
│   │   ├── tool_runner.py        # Subprocess wrapper, Redis pub/sub
│   │   ├── engine_registry.py    # Engine selection logic
│   │   ├── report_builder.py
│   │   └── framework_mapper.py
│   ├── templates/
│   │   ├── base.html
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   └── register.html
│   │   ├── engines/
│   │   │   └── list.html
│   │   ├── assessments/
│   │   │   ├── list.html
│   │   │   ├── new.html
│   │   │   └── detail.html
│   │   ├── phase_definitions/
│   │   │   ├── list.html
│   │   │   └── edit.html
│   │   ├── findings/
│   │   │   └── list.html
│   │   └── reports/
│   │       └── view.html
│   └── static/
│       └── css/
│           └── app.css
├── requirements.txt
├── PLAN.md
├── AGENTS.md
└── README.md
```

---

## Phase A: Docker & Foundation `[DONE]`

- [ ] `webhost/Dockerfile.web` — python:3.12-slim, Flask + gunicorn, no attack tools
- [ ] `engine/Dockerfile.engine` — Kali Linux + Python + Celery + all attack tools
- [ ] `webhost/docker-compose.yml` — web, db (postgres:16), redis (redis:7 + requirepass)
- [ ] `engine/docker-compose.yml` — engine, standalone
- [ ] `webhost/.env.example` — POSTGRES_*, REDIS_PASSWORD, SECRET_KEY, FLASK_ENV
- [ ] `requirements.txt` — flask, flask-login, flask-sqlalchemy, flask-migrate, celery[redis], psycopg2-binary, gunicorn, bleach, markdown
- [ ] `app/__init__.py` — Flask app factory
- [ ] `app/config.py` — configuration (DB URI, Redis with password, Celery broker)
- [ ] `app/extensions.py` — db, migrate, login_manager, celery init
- [ ] `app/templates/base.html` — bare-bones HTML skeleton with minimal CSS
- [ ] `app/static/css/app.css` — minimal custom stylesheet

---

## Phase B: Auth & User Model `[DONE]`

- [ ] `app/models/user.py` — User model (id, username, password_hash, role, created_at)
- [ ] `app/routes/auth.py` — login, logout, register endpoints
- [ ] Flask-Login integration in extensions.py
- [ ] `app/templates/auth/login.html`
- [ ] `app/templates/auth/register.html`

---

## Phase C: Engine Registration + Health `[DONE]`

- [ ] `app/models/engine.py` — Engine model (id, name, network_tag, ip, status, last_heartbeat_at, registered_at)
- [ ] `app/services/engine_registry.py` — engine selection logic
- [ ] `app/routes/engines.py` — POST /api/engines/register (called by engine at startup), GET /engines (health dashboard)
- [ ] `app/templates/engines/list.html` — engine health dashboard (green/red per engine)
- [ ] Engine entrypoint script — startup curl to register, then launch Celery worker
- [ ] `app/tasks/heartbeat.py` — Celery periodic task (every 30s, updates last_heartbeat_at)
- [ ] Redis auth configured — all connection strings use REDIS_PASSWORD

---

## Phase D: Assessment + PhaseDefinition CRUD `[DONE]`

- [x] `app/models/phase_definition.py` — PhaseDefinition model (name, label, category, description, command_template, suggested_tools, created_by, timestamps)
- [x] `app/services/seed_data.py` — Seed default phase definitions on first deploy
- [x] `app/models/assessment.py` — Assessment model (id, name, target (Text, free-form), status, created_by, created_at, updated_at)
- [x] `app/models/assessment_phase.py` — AssessmentPhase model (id, assessment_id FK, phase_definition_id FK, status, order, started_at, completed_at, engine_id FK)
- [x] `app/routes/assessments.py` — list, create (phase selection UI with drag-to-reorder), detail routes
- [x] `app/routes/phase_definitions.py` — CRUD for phase definitions (admin-only)
- [x] `app/templates/assessments/list.html`
- [x] `app/templates/assessments/new.html` — target input + phase checklist from catalog
- [x] `app/templates/assessments/detail.html` — phase list with status, run buttons
- [x] `app/templates/phase_definitions/list.html`
- [x] `app/templates/phase_definitions/edit.html` — command_template editor

---

## Phase E: Celery Task Framework + Live Output `[NOT STARTED]`

- [ ] Celery config in `extensions.py` (broker=redis with password, result backend=redis)
- [ ] `app/services/tool_runner.py` — subprocess wrapper: takes command_template + target, substitutes `{target}`, executes, streams output via Redis pub/sub
- [ ] SSE endpoint per assessment — client opens EventSource, server subscribes to Redis channel, streams lines
- [ ] Phase control buttons in detail.html (trigger phase, stop phase)
- [ ] Live output panel in detail.html

---

## Phase F: Tool Installation & Engine Readiness `[NOT STARTED]`

- [ ] Add to `engine/Dockerfile.engine`:
  - lynis — compliance/hardening auditing
  - hydra — credential brute-force
  - smbclient, enum4linux — SMB enumeration
  - dnsrecon, dnsenum — DNS enumeration
  - clamav, chkrootkit, rkhunter — malware/rootkit scanning
  - impacket-scripts — Windows protocol/AD testing
  - wordlists (dirb, rockyou, etc.) — bundled in image

---

## Phase G: Findings Management `[NOT STARTED]`

- [ ] `app/models/finding.py` — Finding model (title, severity, CVSS, CWE, OWASP, NIST, SANS, evidence, risk, remediation, phase_id FK)
- [ ] `app/routes/findings.py` — list, update, create endpoints
- [ ] `app/templates/findings/list.html` — filterable table (by severity, phase, status)
- [ ] Edit finding inline (severity, status, CVSS, notes)
- [ ] Add manual finding form
- [ ] Auto-extraction of findings from tool output

---

## Phase H: Report Generation `[NOT STARTED]`

- [ ] `app/services/report_builder.py` — Jinja2 -> .md report compilation
- [ ] Report layout to be designed collaboratively
- [ ] `app/templates/reports/view.html` — preview in browser
- [ ] Download as .md

---

## Phase I: API Layer `[NOT STARTED]`

- [ ] Flask Blueprint for REST API
- [ ] Token-based auth (API key per user)
- [ ] Endpoints for engines CRUD
- [ ] Endpoints for assessments CRUD
- [ ] Endpoint for phase trigger
- [ ] Endpoints for findings CRUD
- [ ] Endpoints for phase definitions CRUD
- [ ] Endpoint for engine heartbeat + health
- [ ] Endpoint for report download

---

## Implementation Order

```
Phase A  ->  Phase B  ->  Phase C  ->  Phase D  ->  Phase E  ->  Phase F  ->  Phase G  ->  Phase H  ->  Phase I
```

Each phase is self-contained and testable. We build sequentially, verifying as we go. Status badges are updated in real-time as work progresses.
