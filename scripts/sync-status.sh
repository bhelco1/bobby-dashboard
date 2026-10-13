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

ssh -o BatchMode=yes -o ConnectTimeout=10 "$SERVER" "mkdir -p $REMOTE_PATH" \
  && rsync -az --chmod=F644 -e "ssh -o BatchMode=yes -o ConnectTimeout=10" \
       project-status/status.json "$SERVER:$REMOTE_PATH" \
  && echo "✅ Project status synced to Pi — $(date '+%H:%M:%S')" \
  || { echo "❌ Could not reach the Pi — status saved locally only"; exit 1; }
