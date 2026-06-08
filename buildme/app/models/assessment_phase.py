from datetime import datetime, timezone

from app.extensions import db


class AssessmentPhase(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assessment_id = db.Column(db.Integer, db.ForeignKey('assessment.id'), nullable=False)
    phase_definition_id = db.Column(db.Integer, db.ForeignKey('phase_definition.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    order = db.Column(db.Integer, nullable=False, default=0)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    engine_id = db.Column(db.Integer, db.ForeignKey('engine.id'), nullable=True)

    assessment = db.relationship('Assessment', backref='phases')
    phase_definition = db.relationship('PhaseDefinition')
    engine = db.relationship('Engine')
