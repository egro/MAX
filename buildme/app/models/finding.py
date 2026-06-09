from datetime import datetime, timezone
from app.extensions import db


class Finding(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    severity = db.Column(db.String(20), default='medium')
    cvss_score = db.Column(db.Float, nullable=True)
    cwe_id = db.Column(db.String(20), nullable=True)
    owasp_category = db.Column(db.String(80), nullable=True)
    nist_id = db.Column(db.String(80), nullable=True)
    sans_id = db.Column(db.String(80), nullable=True)
    evidence = db.Column(db.Text, nullable=True)
    risk = db.Column(db.Text, nullable=True)
    remediation = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='open')
    assessment_phase_id = db.Column(db.Integer, db.ForeignKey('assessment_phase.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    phase = db.relationship('AssessmentPhase', backref='findings')
