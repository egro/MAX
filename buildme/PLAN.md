# WAA Platform — Build Plan

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            docker-compose.yml                                │
│                                                                              │
│  ┌──────────────────────┐    ┌────────────────────┐  ┌────────────────────┐ │
│  │       web             │    │   engine-dmz        │  │  engine-internal   │ │
│  │  Flask + Gunicorn     │    │  Kali + Tools       │  │  Kali + Tools      │ │
│  │  python:3.12-slim    │    │  Celery Worker      │  │  Celery Worker     │ │
│  │                       │    │  queue: engine-01  │  │  queue: engine-02  │ │
│  │  tasks ──────────────│───>│  pub/sub output    │  │  pub/sub output    │ │
│  │  via Redis           │    │                     │  │                     │ │
│  │  SSE   <─────────────│────│  pub/sub output    │  │  pub/sub output    │ │
│  │  from Redis          │    └────────────────────┘  └────────────────────┘ │
│  │                       │                                                   │
│  │  db (postgres:16)     │                                                   │
│  │  redis (redis:7+auth) │                                                   │
│  └──────────────────────┘                                                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Engine Model

Each engine container is a Kali Linux instance dedicated to a specific network segment. Engines self-register on startup and maintain a heartbeat.

| Concept | Implementation |
|---------|---------------|
| **Engine identity** | `name` + `network_tag` (e.g. `dmz`, `internal-prod`) |
| **Registration** | Engine POSTs to `web` at startup, gets assigned ID, starts Celery worker on `engine-{id}` queue |
| **Heartbeat** | Celery periodic task updates `last_heartbeat_at` every 30s |
| **Health check** | Web marks engine offline if `last_heartbeat_at > 60s` stale |
| **Assessment assignment** | User tags target network when creating assessment; web auto-assigns online engine with matching `network_tag` |

---

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Frontend styling** | Bare-bones HTML + minimal CSS, no framework. UI will evolve through iteration. |
| **Phase error handling** | Abort immediately on tool failure, mark phase as `failed`. No skip-and-continue. |
| **Auth creds storage** | Fernet symmetric encryption using Flask's `SECRET_KEY`. Decrypted at runtime when engine needs them. |
| **Assessment states** | `created` → `running` → `paused` → `completed` / `failed`. User can pause between phases. |
| **Port scanning (Phase 1)** | Optional `nmap -p-` full port scan. User toggles on/off when creating the assessment. |
| **Wordlists** | Uploaded via web GUI, stored in DB/filesystem, propagated to the assigned engine before phase execution. |

---

## Production Deployment Note

For development, all 4 services run under a single `docker-compose.yml` on one host. In production:

- **web**, **db**, **redis** run on a central management host
- **engine** containers run on separate hosts in their respective network segments
- Engines connect to central Redis + PostgreSQL via hostname/IP (firewall rules permit outbound)
- `docker-compose` can still manage each engine host independently, or use `docker run` directly

No app code changes needed — it's a networking config change.

---

## Progress Summary

| Phase | Status |
|-------|--------|
| **A:** Docker & Foundation | `[DONE]` |
| **B:** Auth & User Model | `[DONE]` |
| **C:** Engine Registration + Health | `[DONE]` |
| **D:** Assessment CRUD + DB Schema | `[NOT STARTED]` |
| **E:** Celery Task Framework + Live Output | `[NOT STARTED]` |
| **F:** Phase Tasks (Tool Orchestration) | `[NOT STARTED]` |
| **G:** Findings Management | `[NOT STARTED]` |
| **H:** Report Generation | `[NOT STARTED]` |
| **I:** API Layer | `[NOT STARTED]` |

**Status Key:** `[NOT STARTED]` — `[IN PROGRESS]` — `[DONE]` — `[BLOCKED]`

---

## Directory Structure

```
buildme/
├── docker/
│   ├── Dockerfile.web          # python:3.12-slim + Flask
│   ├── Dockerfile.engine       # Kali + Python + all attack tools
│   ├── docker-compose.yml      # web, engine-*, db, redis
│   └── .env.example            # env var template
├── app/
│   ├── __init__.py             # Flask app factory
│   ├── config.py               # Configuration (DB, Redis, secrets)
│   ├── extensions.py           # db, migrate, login_manager, celery init
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── engine.py           # Engine registration + heartbeat
│   │   ├── assessment.py
│   │   ├── phase.py
│   │   ├── finding.py
│   │   └── command.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── engines.py          # Engine registration + health status
│   │   ├── assessments.py
│   │   ├── findings.py
│   │   └── reports.py
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── heartbeat.py        # Engine heartbeat task
│   │   ├── phase1_recon.py
│   │   ├── phase2_ssl.py
│   │   ├── phase3_enum.py
│   │   ├── phase4_vuln.py
│   │   ├── phase5_auth.py
│   │   ├── phase6_extra.py
│   │   └── reporting.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── tool_runner.py      # Subprocess wrapper, Redis pub/sub
│   │   ├── engine_registry.py  # Engine selection logic
│   │   ├── report_builder.py
│   │   └── framework_mapper.py
│   ├── templates/
│   │   ├── base.html
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   └── register.html
│   │   ├── engines/
│   │   │   └── list.html       # Engine health dashboard
│   │   ├── assessments/
│   │   │   ├── list.html
│   │   │   ├── new.html
│   │   │   └── detail.html
│   │   ├── findings/
│   │   │   └── list.html
│   │   └── reports/
│   │       └── view.html
│   └── static/
│       └── css/
│           └── app.css
├── requirements.txt
├── PLAN.md
└── AGENTS.md
```

---

## Phase A: Docker & Foundation `[DONE]`

- [ ] `docker/Dockerfile.web` — python:3.12-slim, Flask + gunicorn, no attack tools
- [ ] `docker/Dockerfile.engine` — Kali Linux + Python + Celery + all attack tools (dig, nmap, nikto, gobuster, sqlmap, ffuf, nuclei, wafw00f, whatweb, openssl, sslscan, whois, curl, wget)
- [ ] `docker/docker-compose.yml` — web, engine (scalable service), db (postgres:16), redis (redis:7 + requirepass)
- [ ] `docker/.env.example` — POSTGRES_*, REDIS_PASSWORD, SECRET_KEY, FLASK_ENV
- [ ] `requirements.txt` — flask, flask-login, flask-sqlalchemy, flask-migrate, celery[redis], psycopg2-binary, gunicorn, bleach, markdown
- [ ] `app/__init__.py` — Flask app factory
- [ ] `app/config.py` — configuration (DB URI, Redis with password, Celery broker)
- [ ] `app/extensions.py` — db, migrate, login_manager, celery init
- [ ] `app/templates/base.html` — bare-bones HTML skeleton with minimal CSS (no framework)
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
- [ ] `app/services/engine_registry.py` — engine selection logic (find online engine by network_tag)
- [ ] `app/routes/engines.py` — POST /api/engines/register (called by engine at startup), GET /engines (health dashboard)
- [ ] `app/templates/engines/list.html` — engine health dashboard (green/red per engine)
- [ ] Engine entrypoint script — startup curl to register, then launch Celery worker
- [ ] `app/tasks/heartbeat.py` — Celery periodic task (every 30s, updates last_heartbeat_at)
- [ ] Redis auth configured — all connection strings use REDIS_PASSWORD

---

## Phase D: Assessment CRUD + DB Schema `[NOT STARTED]`

- [ ] `app/models/assessment.py` — Assessment model (target info, auth mode, status `[created/running/paused/completed/failed]`, engine_id FK, scope, network_tag, auth_creds (Fernet encrypted), frameworks JSON, port_scan_enabled bool)
- [ ] `app/models/phase.py` — Phase model (number, name, status, timestamps)
- [ ] `app/models/finding.py` — Finding model (title, severity, CVSS, CWE, OWASP, NIST, SANS, evidence, risk, remediation)
- [ ] `app/models/command.py` — Command model (tool, command string, output, exit code, duration)
- [ ] `app/models/wordlist.py` — Wordlist model (id, name, filename, uploaded_at, user_id, file_path)
- [ ] `app/routes/assessments.py` — list, create (with engine auto-assignment + port scan toggle), detail routes
- [ ] `app/routes/wordlists.py` — upload, list, delete wordlists
- [ ] `app/templates/assessments/list.html`
- [ ] `app/templates/assessments/new.html` — includes network_tag dropdown, port scan toggle, wordlist selector
- [ ] `app/templates/assessments/detail.html`
- [ ] Fernet encryption utility in `app/services/crypto.py` — encrypt/decrypt auth creds at rest

---

## Phase E: Celery Task Framework + Live Output `[NOT STARTED]`

- [ ] Celery config in `extensions.py` (broker=redis with password, result backend=redis)
- [ ] `app/services/tool_runner.py` — subprocess wrapper with Redis pub/sub streaming per task
- [ ] SSE endpoint per assessment — client opens EventSource, server subscribes to Redis channel, streams lines
- [ ] Task routing by engine queue (publish to `engine-{id}` queue)
- [ ] Phase control buttons in detail.html (trigger phase, stop phase)
- [ ] Live output panel in detail.html

---

## Phase F: Phase Tasks (Tool Orchestration) `[NOT STARTED]`

- [ ] Wordlist propagation — upload selected wordlist to engine via API before phase starts
- [ ] `app/tasks/phase1_recon.py` — dig, whatweb, wafw00f, whois, optional `nmap -p-` full port scan (gated by assessment config)
- [ ] `app/tasks/phase2_ssl.py` — openssl s_client, sslscan, curl -I headers
- [ ] `app/tasks/phase3_enum.py` — gobuster dir (uses uploaded wordlist), nikto, nmap http-methods, robots.txt
- [ ] `app/tasks/phase4_vuln.py` — sqlmap, XSS payloads, path traversal, cmd injection, SSRF
- [ ] `app/tasks/phase5_auth.py` — login flow, cookie inspection, username enum, password reset
- [ ] `app/tasks/phase6_extra.py` — nuclei, ffuf (uses uploaded wordlist), searchsploit (user-consent gated)
- [ ] Auto-extraction of findings from tool output

---

## Phase G: Findings Management `[NOT STARTED]`

- [ ] `app/routes/findings.py` — list, update, create endpoints
- [ ] `app/templates/findings/list.html` — filterable table (by severity, phase, status)
- [ ] Edit finding inline (severity, status, CVSS, notes)
- [ ] Add manual finding form

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
- [ ] Endpoints for engine heartbeat + health
- [ ] Endpoint for report download

---

## Implementation Order

```
Phase A  ->  Phase B  ->  Phase C  ->  Phase D  ->  Phase E  ->  Phase F  ->  Phase G  ->  Phase H  ->  Phase I
```

Each phase is self-contained and testable. We build sequentially, verifying as we go. Status badges are updated in real-time as work progresses.
