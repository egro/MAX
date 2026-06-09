import json
import requests
from flask import current_app


def is_configured():
    endpoint = current_app.config.get('LLM_ENDPOINT', '')
    return bool(endpoint)


def query_llm(prompt, system_prompt=None, max_tokens=4096, temperature=0.1):
    endpoint = current_app.config.get('LLM_ENDPOINT', '')
    api_key = current_app.config.get('LLM_API_KEY', '')
    model = current_app.config.get('LLM_MODEL', '')

    if not endpoint:
        current_app.logger.warning('LLM not configured — skipping query')
        return None

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    url = endpoint.rstrip('/')
    if not url.endswith('/v1/chat/completions'):
        url += '/v1/chat/completions'

    body = {
        "model": model or "default",
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    try:
        resp = requests.post(url, json=body, headers=headers, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]
    except requests.Timeout:
        current_app.logger.error('LLM query timed out after 120s')
    except requests.HTTPError as e:
        current_app.logger.error(f'LLM HTTP error {e.response.status_code}: {e.response.text[:500]}')
    except (KeyError, json.JSONDecodeError) as e:
        current_app.logger.error(f'LLM parse error: {e}')
    except Exception as e:
        current_app.logger.error(f'LLM query failed: {e}')

    return None


def extract_findings_via_llm(output_text, target):
    system = (
        "You are a security assessment finding extractor. "
        "Analyze the following penetration testing tool output and identify security findings. "
        "Return a JSON array of objects. Each object must have: "
        "title (string), severity (one of: critical, high, medium, low, info), "
        "evidence (string, the exact relevant line(s) from the output), "
        "risk (string), remediation (string), "
        "and optionally cwe_id (string). "
        "If no findings are present, return an empty array. "
        "Only return valid JSON — no markdown, no explanation."
    )
    prompt = (
        f"Target: {target}\n\n"
        f"Tool output:\n```\n{output_text[:12000]}\n```\n\n"
        "Extract findings as a JSON array."
    )

    raw = query_llm(prompt, system_prompt=system, temperature=0.05)
    if not raw:
        return []

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return parsed
        return []
    except json.JSONDecodeError:
        try:
            start = raw.index('[')
            end = raw.rindex(']') + 1
            return json.loads(raw[start:end])
        except (ValueError, json.JSONDecodeError):
            current_app.logger.warning('LLM returned unparseable JSON')
            return []


def generate_executive_summary(assessment_name, target, findings_data, phases_data):
    system = (
        "You are a security report writer. Generate an executive summary for a penetration test report. "
        "Write 2-4 concise, professional paragraphs. "
        "Focus on: what was tested, key risks identified, and strategic recommendations. "
        "Do not use markdown formatting. Use plain English suitable for a C-level audience."
    )
    prompt = (
        f"Assessment: {assessment_name}\n"
        f"Target: {target}\n\n"
        f"Findings:\n{json.dumps(findings_data, indent=2)}\n\n"
        f"Phases completed: {phases_data.get('passed', 0)}/{phases_data.get('total', 0)}\n\n"
        "Write an executive summary."
    )

    return query_llm(prompt, system_prompt=system, temperature=0.3)
