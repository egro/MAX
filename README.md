# MAX — Web Application Assessment Platform

MAX automates web application security assessments by orchestrating a fleet of Kali-based engine containers. Assessments are broken into sequential phases (recon, SSL, enumeration, vulnerability testing, auth testing, extras), with findings captured and mapped to frameworks like OWASP Top 10, NIST SP 800-53, CWE, and SANS Top 25.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       docker-compose.yml                        │
│                                                                 │
│  ┌───────────────────────┐      ┌───────────────────────────┐  │
│  │         web            │      │       engine              │  │
│  │  Flask + Gunicorn      │      │  Kali + Attack Tools     │  │
│  │  python:3.12-slim     │      │  Celery Worker            │  │
│  │                        │      │                           │  │
│  │  PostgreSQL 16 (db)    │      │  Auto-registers on       │  │
│  │  Redis 7 + auth       │      │  startup, sends heartbeat │  │
│  └───────────────────────┘      └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Services

| Service | Stack | Port |
|---------|-------|------|
| **web** | Flask, Gunicorn, SQLAlchemy | 7077 (configurable) |
| **engine** | Kali Linux, Python, Celery | — |
| **db** | PostgreSQL 16 | 5432 (internal) |
| **redis** | Redis 7 (with password auth) | 6379 (internal) |

## Quick Start

```bash
cd buildme/docker
cp .env.example .env    # review and adjust secrets
docker compose build
docker compose up -d
```

Then open http://localhost:7077, register an account, and log in.

## Project Structure

```
buildme/
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.web
│   ├── Dockerfile.engine
│   ├── entrypoint.sh          # Engine auto-registration on startup
│   ├── .env.example
│   └── .env
├── app/
│   ├── __init__.py            # Flask app factory
│   ├── config.py              # Configuration (DB, Redis, secrets)
│   ├── extensions.py          # db, migrate, login_manager, celery
│   ├── models/
│   │   ├── user.py            # User (registration, auth)
│   │   └── engine.py          # Engine registration, heartbeat
│   ├── routes/
│   │   ├── auth.py            # Login, logout, register
│   │   └── engines.py         # Engine API + health dashboard
│   ├── services/
│   │   └── engine_registry.py # Online engine selection
│   ├── tasks/
│   │   └── heartbeat.py       # Celery heartbeat task
│   ├── templates/
│   │   ├── base.html
│   │   ├── auth/ (login, register)
│   │   └── engines/list.html  # Health dashboard
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
| D | Assessment CRUD + DB Schema | Not started |
| E | Celery Task Framework + Live Output | Not started |
| F | Phase Tasks (Tool Orchestration) | Not started |
| G | Findings Management | Not started |
| H | Report Generation | Not started |
| I | API Layer | Not started |

## Engine Lifecycle

1. **Startup** — The engine container runs `entrypoint.sh`, which curls the web API to register with its name, network tag, and host IP.
2. **Registration** — The web API creates or updates the Engine record, marking it `online`.
3. **Celery Worker** — The engine starts a Celery worker listening on its network tag queue.
4. **Heartbeat** — A periodic Celery task updates `last_heartbeat_at` every 30 seconds.
5. **Health** — The dashboard shows engines as green (online) or red (offline).

## Configuration

Key environment variables in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `WEB_PORT` | `7077` | Host port for the web UI |
| `SECRET_KEY` | `changeme` | Flask session signing key |
| `POSTGRES_DB` | `waa` | PostgreSQL database name |
| `POSTGRES_PASSWORD` | `changeme` | PostgreSQL password |
| `REDIS_PASSWORD` | `changeme` | Redis password |
| `ENGINE_NAME` | `engine-default` | Unique name for the engine |
| `ENGINE_NETWORK_TAG` | `default` | Network segment tag |
| `HOST_IP` | _(auto-detected)_ | Host IP for engine registration |

## Deployment Notes

In production, **web**, **db**, and **redis** run on a central management host while **engine** containers run on separate hosts in their respective network segments. Engines connect to the central services via hostname/IP with firewall rules permitting outbound access. No code changes are needed.
