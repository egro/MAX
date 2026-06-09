# MAX — Security Assessment Platform

MAX automates security assessments by orchestrating a fleet of Kali-based engine containers. Assessments are broken into user-selectable phases covering both web application and host-level analysis (recon, SSL, enumeration, vulnerability testing, credential testing, compliance auditing, malware scanning, etc.), with findings captured and mapped to frameworks like OWASP Top 10, NIST SP 800-53, CWE, and SANS Top 25.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Management Host                              │
│  ┌───────────────────────┐      ┌───────────────────────────┐  │
│  │         web            │      │         db                │  │
│  │  Flask + Gunicorn      │      │  PostgreSQL 16            │  │
│  │  python:3.12-slim     │      └───────────────────────────┘  │
│  │                        │      ┌───────────────────────────┐  │
│  │                        │      │        redis              │  │
│  │                        │      │  Redis 7 + auth           │  │
│  └───────────────────────┘      └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Engine Host(s)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ engine                                                    │  │
│  │  Kali Linux + Attack Tools (nmap, nikto, gobuster, ...)  │  │
│  │  Celery Worker                                            │  │
│  │  Auto-registers on startup, sends heartbeat               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

Engines are deployed independently from the management stack and connect to the central web API, database, and Redis over the network.

## Services

| Service | Stack | Port |
|---------|-------|------|
| **web** | Flask, Gunicorn, SQLAlchemy | 7077 (configurable) |
| **engine** | Kali Linux, Python, Celery | — |
| **db** | PostgreSQL 16 | 5432 (internal) |
| **redis** | Redis 7 (with password auth) | 6379 (internal) |

## Quick Start

### Management host (web + db + redis)

```bash
cd buildme/webhost
cp .env.example .env    # review and adjust secrets
./start.sh up -d --build
```

> Use `./start.sh` instead of `docker compose` — it automatically detects the
> host's IP addresses (excluding Docker bridge IPs) and passes them to the
> engine containers so the health dashboard shows the real host IPs.

Then open http://localhost:7077, register an account, and log in.

The first account registered is a regular `user`. To promote it to `admin` (needed for managing phase definitions), run:

```bash
docker compose exec web flask set-role <username> admin
```

### Engine host (standalone)

```bash
cd buildme/engine
export DATABASE_URL=postgresql://user:pass@mgmt-host:5432/dbname
export REDIS_URL=redis://:password@mgmt-host:6379/0
export WEB_API_URL=http://mgmt-host:7077
./start.sh up -d --build
```

`start.sh` validates that the three required vars are set before starting.

## Project Structure

```
buildme/
├── webhost/
│   ├── docker-compose.yml      # Management stack: db, redis, web
│   ├── Dockerfile.web
│   ├── start.sh                # Injects host IPs before docker compose
│   ├── .env
│   └── .env.example
├── engine/
│   ├── docker-compose.yml      # Engine-only, standalone
│   ├── Dockerfile.engine
│   ├── entrypoint.sh           # Engine auto-registration on startup
│   ├── start.sh                # Validates required vars, injects host IPs
│   └── .env.example
├── app/
│   ├── __init__.py            # Flask app factory, CLI init
│   ├── cli.py                 # Flask CLI commands (set-role, list-users)
│   ├── config.py              # Configuration (DB, Redis, secrets)
│   ├── decorators.py          # @admin_required decorator
│   ├── extensions.py          # db, migrate, login_manager, celery
│   ├── models/
│   │   ├── user.py            # User (registration, auth, roles)
│   │   ├── engine.py          # Engine registration, heartbeat
│   │   ├── phase_definition.py # Phase catalog with command templates
│   │   ├── assessment.py      # Assessment model (target, status)
│   │   └── assessment_phase.py # Phase instance within an assessment
│   ├── routes/
│   │   ├── auth.py            # Login, logout, register
│   │   ├── engines.py         # Engine API + health dashboard
│   │   ├── assessments.py     # Assessment CRUD with phase picker
│   │   ├── phase_definitions.py # Phase definition CRUD (admin)
│   │   └── findings.py        # Findings CRUD + inline edit
│   ├── services/
│   │   ├── engine_registry.py # Online engine selection
│   │   ├── finding_extractor.py # Auto-extraction + LLM-enhanced extraction
│   │   ├── llm_service.py    # OpenAI-compatible LLM client
│   │   ├── report_builder.py # Report compilation with optional AI summary
│   │   └── seed_data.py      # Default phase definition seeding
│   ├── tasks/
│   │   └── heartbeat.py       # Celery heartbeat task
│   ├── templates/
│   │   ├── base.html
│   │   ├── auth/ (login, register)
│   │   ├── engines/
│   │   │   └── list.html
│   │   ├── assessments/
│   │   │   ├── list.html
│   │   │   ├── new.html
│   │   │   └── detail.html
│   │   └── phase_definitions/
│   │       ├── list.html
│   │       └── edit.html
│   └── static/css/app.css
├── requirements.txt
└── PLAN.md
```

## Phases (Build Plan)

| Phase | Description | Status |
|-------|-------------|--------|
| A | Docker & Foundation | Done |
| B | Auth & User Model | Done |
| C | Engine Registration + Health | Done |
| D | Assessment + PhaseDefinition CRUD | Done |
| E | Celery Task Framework + Live Output | Done |
| F | Tool Installation & Engine Readiness | Done |
| G | Findings Management | Done |
| H | Report Generation | Done |
| I | API Layer | Done |
| J | LLM Integration | Done |

## Engine Lifecycle

1. **Startup** — The engine container runs `entrypoint.sh`, which curls the web API to register with its name, network tag, and host IP.
2. **Registration** — The web API creates or updates the Engine record, marking it `online`.
3. **Celery Worker** — The engine starts a Celery worker listening on its network tag queue.
4. **Heartbeat** — A periodic Celery task updates `last_heartbeat_at` every 30 seconds.
5. **Health** — The dashboard shows engines as green (online) or red (offline).

## Configuration

### webhost `.env`

| Variable | Default | Description |
|----------|---------|-------------|
| `WEB_PORT` | `7077` | Host port for the web UI |
| `SECRET_KEY` | `changeme` | Flask session signing key |
| `POSTGRES_DB` | `MaxAttack` | PostgreSQL database name |
| `POSTGRES_USER` | `MaxAttack` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `Postgres_Password_changeMe!` | PostgreSQL password |
| `REDIS_PASSWORD` | `This-is-a-poor-Redis-password!` | Redis password |
| `ENGINE_NAME` | `engine-default` | Unique name for the engine |
| `ENGINE_NETWORK_TAG` | `engine-network-default` | Network segment tag |
| `LLM_ENDPOINT` | _(optional)_ | OpenAI-compatible API endpoint for AI-enhanced findings, analysis, and reports |
| `LLM_API_KEY` | _(optional)_ | API key for the LLM endpoint |
| `LLM_MODEL` | _(optional)_ | Model name to use (e.g. `llama3.2`, `gpt-4o`) |

### engine — required env vars (no defaults, must be exported)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string for the management host |
| `REDIS_URL` | Redis connection string for the management host |
| `WEB_API_URL` | Web API base URL (e.g. `http://mgmt-host:7077`) |

Engine `.env.example` documents optional overrides (`ENGINE_NAME`, `ENGINE_NETWORK_TAG`) but the connection URLs must always be provided at runtime.

## User Roles

MAX has two roles:

| Role | Permissions |
|------|-------------|
| `user` | Create assessments, select phases from the catalog, view results |
| `admin` | Everything a `user` can do, plus create/edit/delete phase definitions (including command templates) |

### Changing roles

Use the `set-role` Flask CLI command from the web container:

```bash
# Promote a user to admin
docker compose exec web flask set-role alice admin

# Demote an admin back to user
docker compose exec web flask set-role alice user
```

List all users and their roles:

```bash
docker compose exec web flask list-users
```

The first account registered defaults to `user`. An admin must promote it before that account can manage phase definitions.

## Deployment Notes

The management stack (**web**, **db**, **redis**) runs on a central host using `buildme/webhost/docker-compose.yml`. Engine containers run independently via `buildme/engine/docker-compose.yml` on separate hosts in their respective network segments. Engines connect to the central services via hostname/IP with firewall rules permitting outbound access. No code changes are needed.
