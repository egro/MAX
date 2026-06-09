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
| **E:** Celery Task Framework + Live Output | `[DONE]` |
| **F:** Tool Installation & Engine Readiness | `[DONE]` |
| **G:** Findings Management | `[DONE]` |
| **H:** Report Generation | `[DONE]` |
| **I:** API Layer | `[DONE]` |
| **J:** LLM Integration | `[DONE]` |

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
│   ├── .env
│   └── .env.example
├── app/
│   ├── __init__.py               # Flask app factory, CLI init, blueprint registration
│   ├── cli.py                    # Flask CLI commands (set-role, list-users)
│   ├── config.py                 # Configuration (DB, Redis, secrets)
│   ├── extensions.py             # db, migrate, login_manager, celery init
│   ├── decorators.py             # admin_required decorator
│   ├── models/
│   │   ├── __init__.py           # All model exports
│   │   ├── user.py               # User (registration, auth, roles, api_key)
│   │   ├── engine.py             # Engine registration + heartbeat
│   │   ├── phase_definition.py   # Phase catalog (user-customizable command templates)
│   │   ├── assessment.py         # Assessment model (target, phases, status)
│   │   ├── assessment_phase.py   # Phase instance within an assessment
│   │   └── finding.py            # Finding model (severity, evidence, frameworks)
│   ├── routes/
│   │   ├── __init__.py           # (empty)
│   │   ├── auth.py               # Login, logout, register
│   │   ├── engines.py            # Engine API + health dashboard
│   │   ├── assessments.py        # Assessment CRUD, phase run/stop/stream SSE
│   │   ├── phase_definitions.py  # Phase definition CRUD (admin)
│   │   ├── findings.py           # Findings CRUD + inline edit
│   │   ├── reports.py            # Report preview + download
│   │   └── api.py                # REST API v1 (token-based, all resources)
│   ├── services/
│   │   ├── tool_runner.py        # Subprocess wrapper, Redis pub/sub streaming
│   │   ├── engine_registry.py    # Engine selection/registration logic
│   │   ├── finding_extractor.py  # Auto-extraction + LLM-enhanced extraction
│   │   ├── llm_service.py        # OpenAI-compatible LLM client
│   │   ├── report_builder.py     # Jinja2 -> Markdown report compilation
│   │   └── seed_data.py          # Seed default phase definitions
│   ├── tasks/
│   │   ├── phase_tasks.py        # Celery task: run phase, auto-extract findings
│   │   └── heartbeat.py          # Celery beat: engine heartbeat every 30s
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
│   │   │   └── detail.html       # Phase tabs, live output, findings tab
│   │   ├── phase_definitions/
│   │   │   ├── list.html
│   │   │   └── edit.html
│   │   ├── findings/
│   │   │   ├── list.html
│   │   │   └── new.html
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

- [x] `webhost/Dockerfile.web` — python:3.12-slim, Flask + gunicorn, no attack tools
- [x] `engine/Dockerfile.engine` — Kali Linux + Python + Celery + all attack tools
- [x] `webhost/docker-compose.yml` — web, db (postgres:16), redis (redis:7 + requirepass)
- [x] `engine/docker-compose.yml` — engine, standalone
- [x] `webhost/.env.example` — POSTGRES_*, REDIS_PASSWORD, SECRET_KEY, FLASK_ENV
- [x] `engine/.env.example`
- [x] `requirements.txt` — flask, flask-login, flask-sqlalchemy, flask-migrate, celery[redis], psycopg2-binary, gunicorn, bleach, markdown, redis>=5.0, gevent>=24
- [x] `app/__init__.py` — Flask app factory
- [x] `app/config.py` — configuration (DB URI, Redis with password, Celery broker)
- [x] `app/extensions.py` — db, migrate, login_manager, celery init
- [x] `app/templates/base.html` — bare-bones HTML skeleton with minimal CSS
- [x] `app/static/css/app.css` — minimal custom stylesheet

---

## Phase B: Auth & User Model `[DONE]`

- [x] `app/models/user.py` — User model (id, username, password_hash, role, created_at, api_key)
- [x] `app/routes/auth.py` — login, logout, register endpoints
- [x] Flask-Login integration in extensions.py
- [x] `app/templates/auth/login.html`
- [x] `app/templates/auth/register.html`

---

## Phase C: Engine Registration + Health `[DONE]`

- [x] `app/models/engine.py` — Engine model (id, name, network_tag, ip, status, last_heartbeat_at, registered_at)
- [x] `app/services/engine_registry.py` — engine selection logic
- [x] `app/routes/engines.py` — POST /api/engines/register (called by engine at startup), GET /engines (health dashboard)
- [x] `app/templates/engines/list.html` — engine health dashboard (green/red per engine)
- [x] Engine entrypoint script — startup curl to register, then launch Celery worker
- [x] `app/tasks/heartbeat.py` — Celery periodic task (every 30s, updates last_heartbeat_at)
- [x] Redis auth configured — all connection strings use REDIS_PASSWORD

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

## Phase E: Celery Task Framework + Live Output `[DONE]`

- [x] Celery config in `extensions.py` (broker=redis with password, result backend=redis)
- [x] `app/services/tool_runner.py` — subprocess wrapper: takes command_template + target, substitutes `{target}`, executes, streams output via Redis pub/sub with history buffer
- [x] `app/tasks/phase_tasks.py` — Celery task `run_phase_task` dispatches phase execution, updates status/engine in DB
- [x] SSE endpoint `GET /assessments/<id>/phases/<phase_id>/stream` — replays history then subscribes to live Redis pub/sub
- [x] Phase control buttons in detail.html — `Run` (pending/failed) and `Stop` (running), wired to POST endpoints
- [x] Live output panel with tabbed per-phase output and dark terminal console
- [x] `POST /assessments/<id>/phases/<phase_id>/run` — finds online engine, dispatches Celery task, returns task_id
- [x] `POST /assessments/<id>/phases/<phase_id>/stop` — revokes Celery task (terminate=True), marks phase failed
- [x] Gevent worker type for gunicorn to handle long-lived SSE connections
- [x] Explicit `redis>=5.0` and `gevent>=24` in requirements.txt

---

## Phase F: Tool Installation & Engine Readiness `[DONE]`

- [x] Added to `engine/Dockerfile.engine`:
  - lynis — compliance/hardening auditing
  - hydra — credential brute-force
  - smbclient, enum4linux — SMB enumeration
  - dnsrecon, dnsenum — DNS enumeration
  - clamav, chkrootkit, rkhunter — malware/rootkit scanning
  - impacket-scripts — Windows protocol/AD testing
  - wordlists (dirb, rockyou, etc.) — bundled in image
- [x] Verified all tools present in built image

---

## Phase G: Findings Management `[COMPLETE]`

- [x] `app/models/finding.py` — Finding model (title, severity, CVSS, CWE, OWASP, NIST, SANS, evidence, risk, remediation, phase_id FK)
- [x] `app/routes/findings.py` — list, update, create endpoints
- [x] `app/templates/findings/list.html` — filterable table (by severity, phase, status)
- [x] Edit finding inline (severity, status, CVSS)
- [x] Add manual finding form (`app/templates/findings/new.html`)
- [x] Auto-extraction of findings from tool output (`app/services/finding_extractor.py`)
- [x] Findings tab integrated into assessment detail page (inline edit selects for status/CVSS)
- [x] Auto-extraction invoked from `run_phase_task` after phase completes
- [x] Findings by-assessment page (`/findings/by-assessment`) with severity count badges
- [x] "Run All" button dispatches all pending/failed phases at once (`POST /assessments/<id>/run-all`)

---

## Phase H: Report Generation `[COMPLETE]`

- [x] `app/services/report_builder.py` — Jinja2 -> .md report compilation
- [x] Report layout designed: executive summary, findings by severity with evidence/risk/remediation, phase summary, framework references
- [x] `app/templates/reports/view.html` — preview in browser (monospace, pre-wrapped render)
- [x] Download as .md (`/reports/<id>/download`)
- [x] Report button added to assessment detail page

---

## Phase I: API Layer `[COMPLETE]`

- [x] Flask Blueprint for REST API (`/api/v1`)
- [x] Token-based auth via `X-API-Key` header (`require_api_key` decorator)
- [x] `api_key` column on User model with `generate_api_key()` method
- [x] Endpoints for engines GET list + GET by ID
- [x] Endpoints for assessments CRUD (GET list, GET by ID, POST create, DELETE)
- [x] Endpoint for phase trigger (POST .../run)
- [x] Endpoint for phase stream (SSE)
- [x] Endpoints for findings CRUD (GET list with filters, POST create, PATCH update, DELETE)
- [x] Endpoints for phase definitions CRUD (GET list, POST create, PUT update, DELETE)
- [x] Endpoint for report download
- [x] API key management endpoints (GET/POST `/api/v1/auth/api-key`, session-based)

---

## Phase J: LLM Integration `[COMPLETE]`

- [x] LLM config added to `config.py` (`LLM_ENDPOINT`, `LLM_API_KEY`, `LLM_MODEL`)
- [x] `app/services/llm_service.py` — OpenAI-compatible chat completions client:
  - `query_llm()` — generic chat with configurable system prompt
  - `extract_findings_via_llm()` — sends tool output, returns structured findings
  - `generate_executive_summary()` — writes report executive summary
- [x] Enhanced auto-extraction in `finding_extractor.py` — regex + LLM pass (deduplicated)
- [x] AI executive summary in `report_builder.py` — replaces boilerplate with LLM-generated text
- [x] `POST /assessments/<id>/phases/<phase_id>/analyze` — on-demand phase output analysis
- [x] "Analyze with AI" button in assessment detail page — sends phase output, shows results
- [x] LLM status indicator in nav (purple dot when configured)
- [x] CSS for AI button, analysis panel, nav indicator
- [x] `.env.example` and `docker-compose.yml` updated with LLM vars
- [x] Docs updated (README.md, PLAN.md)
- [x] All LLM calls gracefully skipped when `LLM_ENDPOINT` is unset

---

## Implementation Order

```
Phase A  ->  Phase B  ->  Phase C  ->  Phase D  ->  Phase E  ->  Phase F  ->  Phase G  ->  Phase H  ->  Phase I  ->  Phase J
```

Each phase is self-contained and testable. We build sequentially, verifying as we go. Status badges are updated in real-time as work progresses.
