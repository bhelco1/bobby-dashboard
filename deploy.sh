#!/bin/bash
# deploy.sh — Sync bobby-dashboard to Apache server
# Usage: ./deploy.sh

SERVER="pi@192.168.1.23"
REMOTE_PATH="/var/www/html/"
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)/"

echo "🚀 Deploying to $SERVER$REMOTE_PATH..."

rsync -avz --delete \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='*.sh' \
  --exclude='README.md' \
  "$LOCAL_PATH" "$SERVER:$REMOTE_PATH"

if [ $? -eq 0 ]; then
  echo "✅ Deploy complete — $(date '+%H:%M:%S')"
else
  echo "❌ Deploy failed. Check SSH access to $SERVER"
  exit 1
fi
