# Web Application Assessment - Target Configuration

## Target Information

| Variable | Value | Description |
|----------|-------|-------------|
| `TARGET_URL` | | Primary target URL |
| `TARGET_DOMAIN` | | Domain name |
| `TARGET_IP` | | Primary IP (if known) |
| `TARGET_NAME` | | Friendly name |

## Scope

| Variable | Value | Description |
|----------|-------|-------------|
| `SCOPE_PORTS` | | Ports to test (default: 80, 443) |
| `SCOPE_PATHS` | | Specific paths in scope |
| `EXCLUSIONS` | | Paths/URLs out of scope |

## Authentication

| Variable | Value | Description |
|----------|-------|-------------|
| `AUTH_MODE` | `unauthenticated` / `authenticated` / `both` | Test scope |
| `AUTH_USERNAME` | | Test account username |
| `AUTH_PASSWORD` | | Test account password |
| `AUTH_URL` | | Login URL if applicable |

## Testing Rules

| Variable | Value | Description |
|----------|-------|-------------|
| `RATE_LIMIT` | `true` | Respect rate limits |
| `MAX_REQUESTS_PER_MIN` | | Request throttle |
| `NO_BRUTE_FORCE` | `true` | No credential guessing |
| `NO_DOS` | `true` | No denial of service |
| `NO_PERSISTENCE` | `true` | No persistence tests |
| `NO_LATERAL` | `true` | No lateral movement |

## Output

| Variable | Value | Description |
|----------|-------|-------------|
| `OUTPUT_DIR` | | Output directory path |
| `REPORT_FILE` | | Final report name |

---

## Example Configuration

```markdown
# My Web Application Assessment

TARGET_URL: https://www.example.com
TARGET_DOMAIN: example.com
TARGET_IP: 203.0.113.50
TARGET_NAME: Example Corp Web Portal

AUTH_MODE: unauthenticated

SCOPE_PORTS: 80, 443
EXCLUSIONS: /admin, /api/v1/private

RATE_LIMIT: true
MAX_REQUESTS_PER_MIN: 60
NO_BRUTE_FORCE: true
NO_DOS: true

OUTPUT_DIR: /home/kali/example_assessment/outputs
```
