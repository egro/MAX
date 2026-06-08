import json
import subprocess
import redis as redis_lib


def run_command(command_template, target, assessment_id, phase_id, redis_url):
    r = redis_lib.Redis.from_url(redis_url)
    channel = f"phase:{assessment_id}:{phase_id}"
    history_key = f"phase:{assessment_id}:{phase_id}:history"

    command = command_template.replace("{target}", target)
    success = False

    try:
        proc = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        for line in iter(proc.stdout.readline, ""):
            msg = json.dumps({"type": "output", "line": line.rstrip()})
            r.publish(channel, msg)
            r.rpush(history_key, msg)
            r.expire(history_key, 3600)

        proc.stdout.close()
        proc.wait()

        if proc.returncode == 0:
            msg = json.dumps({"type": "status", "status": "completed"})
            r.publish(channel, msg)
            r.rpush(history_key, msg)
            r.expire(history_key, 3600)
            success = True
        else:
            msg = json.dumps(
                {
                    "type": "status",
                    "status": "failed",
                    "exit_code": proc.returncode,
                }
            )
            r.publish(channel, msg)
            r.rpush(history_key, msg)
            r.expire(history_key, 3600)
    except Exception as e:
        msg = json.dumps({"type": "status", "status": "failed", "error": str(e)})
        r.publish(channel, msg)
        r.rpush(history_key, msg)
        r.expire(history_key, 3600)
    finally:
        r.close()

    return success
