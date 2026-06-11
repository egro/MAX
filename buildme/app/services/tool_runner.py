import json
import subprocess
import redis as redis_lib


def run_command(command_template, target, assessment_id, phase_id, redis_url):
    r = redis_lib.Redis.from_url(redis_url)
    channel = f"phase:{assessment_id}:{phase_id}"
    history_key = f"phase:{assessment_id}:{phase_id}:history"

    command = command_template.replace("{target}", target)
    if "{ports}" in command:
        from app.services.port_resolver import resolve_web_ports
        msg = json.dumps({"type": "output", "line": "[*] Scanning for open HTTP/HTTPS ports..."})
        r.publish(channel, msg)
        r.rpush(history_key, msg)
        r.expire(history_key, 3600)

        ports = resolve_web_ports(target, redis_url)

        msg = json.dumps({"type": "output", "line": f"[+] Web ports discovered: {ports}"})
        r.publish(channel, msg)
        r.rpush(history_key, msg)
        r.expire(history_key, 3600)

        command = command.replace("{ports}", ports)
    success = False

    output_count = 0

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
            output_count += 1

        proc.stdout.close()
        proc.wait()

        if proc.returncode == 0:
            if output_count == 0:
                line = json.dumps({"type": "output", "line": "[command completed with no output]"})
                r.publish(channel, line)
                r.rpush(history_key, line)
                r.expire(history_key, 3600)
            msg = json.dumps({"type": "status", "status": "completed"})
            r.publish(channel, msg)
            r.rpush(history_key, msg)
            r.expire(history_key, 3600)
            success = True
        else:
            if output_count == 0:
                line = json.dumps({"type": "output", "line": f"[command failed with exit code {proc.returncode}]"})
                r.publish(channel, line)
                r.rpush(history_key, line)
                r.expire(history_key, 3600)
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
        if output_count == 0:
            line = json.dumps({"type": "output", "line": f"[error: {e}]"})
            r.publish(channel, line)
            r.rpush(history_key, line)
            r.expire(history_key, 3600)
        msg = json.dumps({"type": "status", "status": "failed", "error": str(e)})
        r.publish(channel, msg)
        r.rpush(history_key, msg)
        r.expire(history_key, 3600)
    finally:
        r.close()

    return success
