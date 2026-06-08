from datetime import datetime, timezone

from app.extensions import db
from app.models.engine import Engine


def register_engine(name, network_tag, ip):
    engine = Engine.query.filter_by(name=name).first()
    if engine:
        engine.network_tag = network_tag
        engine.ip = ip
        engine.status = 'online'
        engine.last_heartbeat_at = datetime.now(timezone.utc)
    else:
        engine = Engine(
            name=name,
            network_tag=network_tag,
            ip=ip,
            status='online',
            last_heartbeat_at=datetime.now(timezone.utc),
        )
        db.session.add(engine)
    db.session.commit()
    return engine


def find_online_engine(network_tag):
    return Engine.query.filter_by(
        network_tag=network_tag, status='online'
    ).order_by(Engine.last_heartbeat_at.desc().nullslast()).first()


def update_heartbeat(engine_id):
    engine = db.session.get(Engine, engine_id)
    if engine:
        engine.last_heartbeat_at = datetime.now(timezone.utc)
        engine.status = 'online'
        db.session.commit()


def mark_offline(engine_id):
    engine = db.session.get(Engine, engine_id)
    if engine:
        engine.status = 'offline'
        db.session.commit()


def get_all_engines():
    return Engine.query.order_by(Engine.registered_at.desc()).all()
