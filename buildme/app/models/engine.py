from datetime import datetime, timezone

from app.extensions import db


class Engine(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    network_tag = db.Column(db.String(80), nullable=False)
    ip = db.Column(db.String(45), nullable=False)
    status = db.Column(db.String(20), default='offline')
    last_heartbeat_at = db.Column(db.DateTime, nullable=True)
    registered_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )
