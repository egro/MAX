from datetime import datetime, timezone

from app.extensions import celery, db
from app.models.engine import Engine


@celery.task
def heartbeat(engine_id):
    engine = db.session.get(Engine, engine_id)
    if engine:
        engine.last_heartbeat_at = datetime.now(timezone.utc)
        engine.status = 'online'
        db.session.commit()
