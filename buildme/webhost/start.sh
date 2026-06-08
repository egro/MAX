#!/usr/bin/env bash
set -e

HOST_IP=$(hostname -I | xargs -n1 | grep -v '^172\.1[6-9]\.' | grep -v '^172\.2[0-9]\.' | grep -v '^172\.3[0-1]\.' | xargs | tr ' ' ',')

export HOST_IP

exec docker compose "$@"
