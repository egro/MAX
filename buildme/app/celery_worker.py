from app import create_app
from app.extensions import celery
from app.tasks import heartbeat  # noqa: ensure tasks are registered
from app.tasks import phase_tasks  # noqa: ensure tasks are registered

create_app()
