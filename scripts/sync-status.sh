#!/bin/bash
# sync-status.sh — Collect every project's STATUS.json and push it to the Pi.
# Run by the LaunchAgent every 15 minutes (scripts/install-status-agent.sh),
# and at the end of deploy.sh. Safe to run by hand at any time.

SERVER="pi@192.168.1.190"
REMOTE_PATH="/var/www/html/project-status/"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR" || exit 1

node scripts/collect-status.js || exit 1

# One connection: write to a temp file, make it readable by Apache, then swap it in.
ssh -o BatchMode=yes -o ConnectTimeout=10 "$SERVER" \
  "mkdir -p $REMOTE_PATH && cat > ${REMOTE_PATH}status.json.tmp && chmod 644 ${REMOTE_PATH}status.json.tmp && mv ${REMOTE_PATH}status.json.tmp ${REMOTE_PATH}status.json" \
  < project-status/status.json \
  && echo "✅ Project status synced to Pi — $(date '+%H:%M:%S')" \
  || { echo "❌ Could not reach the Pi — status saved locally only"; exit 1; }
