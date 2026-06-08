from datetime import datetime, timezone

from flask import current_app

from app.extensions import celery, db
from app.models.assessment import Assessment
from app.models.assessment_phase import AssessmentPhase
from app.services.tool_runner import run_command


@celery.task(bind=True)
def run_phase_task(self, assessment_id, phase_id):
    ap = db.session.get(AssessmentPhase, phase_id)
    if not ap:
        return {"status": "error", "message": "Phase not found"}

    assessment = db.session.get(Assessment, assessment_id)
    if not assessment:
        return {"status": "error", "message": "Assessment not found"}

    ap.status = "running"
    ap.started_at = datetime.now(timezone.utc)
    db.session.commit()

    command_template = ap.phase_definition.command_template
    target = assessment.target
    redis_url = current_app.config["REDIS_URL"]

    success = run_command(
        command_template, target, assessment_id, phase_id, redis_url
    )

    ap.status = "completed" if success else "failed"
    ap.completed_at = datetime.now(timezone.utc)

    all_phases = AssessmentPhase.query.filter_by(
        assessment_id=assessment_id
    ).all()
    all_done = all(
        p.status in ("completed", "failed") for p in all_phases
    )
    if all_done:
        assessment.status = "completed"

    db.session.commit()

    return {"status": ap.status}
