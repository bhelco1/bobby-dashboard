#!/bin/bash
# watch.sh — Auto-deploy on file save
# Requires fswatch: brew install fswatch
# Usage: ./watch.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v fswatch &> /dev/null; then
  echo "❌ fswatch is not installed."
  echo "   Run: brew install fswatch"
  exit 1
fi

echo "👀 Watching for changes in $SCRIPT_DIR..."
echo "   Press Ctrl+C to stop."
echo ""

DEBOUNCE=10  # seconds of silence before deploying

echo "   Debounce delay: ${DEBOUNCE}s of quiet before deploy fires."
echo ""

fswatch -o -l $DEBOUNCE \
  --exclude='\.git' \
  --exclude='\.DS_Store' \
  --exclude='watch\.sh' \
  --exclude='deploy\.sh' \
  --exclude='test-results' \
  --exclude='test-reports' \
  --exclude='node_modules' \
  --exclude='playwright-report' \
  "$SCRIPT_DIR" | while read -r event; do
    echo "📝 Changes settled — deploying..."
    "$SCRIPT_DIR/deploy.sh"
    echo ""
done
