import json

from datetime import datetime, timezone

import redis as redis_lib
from flask import current_app

from app.extensions import celery, db
from app.models.assessment import Assessment
from app.models.assessment_phase import AssessmentPhase
from app.services.tool_runner import run_command
from app.services.finding_extractor import extract_findings_from_output


@celery.task(bind=True, max_retries=0, autoretry_for=())
def run_phase_task(self, assessment_id, phase_id):
    try:
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

        try:
            r = redis_lib.Redis.from_url(redis_url)
            history_key = f"phase:{assessment_id}:{phase_id}:history"
            lines = r.lrange(history_key, 0, -1)
            r.close()
            output_lines = [
                json.loads(msg.decode())["line"]
                for msg in lines
                if json.loads(msg.decode()).get("type") == "output"
            ]
            if output_lines:
                extract_findings_from_output(assessment_id, phase_id, output_lines)
        except Exception:
            pass

        return {"status": ap.status}

    except Exception as e:
        db.session.rollback()
        try:
            ap = db.session.get(AssessmentPhase, phase_id)
            if ap and ap.status == "running":
                ap.status = "failed"
                ap.completed_at = datetime.now(timezone.utc)
                db.session.commit()
        except Exception:
            db.session.rollback()
        return {"status": "failed", "error": str(e)}
