#!/bin/bash
set -e

ENGINE_NAME="${ENGINE_NAME:-engine-default}"
ENGINE_NETWORK_TAG="${ENGINE_NETWORK_TAG:-default}"
WEB_API_URL="${WEB_API_URL:-http://web:8000}"
HOST_IP="${HOST_IP:-$(ip route | grep default | awk '{print $3}')}"

echo "Registering engine '$ENGINE_NAME' (tag: $ENGINE_NETWORK_TAG, ip: $HOST_IP) with $WEB_API_URL"

curl -s -X POST "$WEB_API_URL/engines/api/register" \
  -H "Content-Type: application/json" \
  -H "X-Engine-Name: $ENGINE_NAME" \
  -H "X-Engine-Network-Tag: $ENGINE_NETWORK_TAG" \
  -H "X-Engine-Ip: $HOST_IP" \
  -d '{}' || echo "Registration failed (will retry in Celery)"

exec celery -A app.celery_worker.celery worker --loglevel=info -Q "$ENGINE_NETWORK_TAG"
