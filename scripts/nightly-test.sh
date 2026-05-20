#!/bin/bash
# nightly-test.sh — Run dashboard tests and sync results to Pi
# Designed to be called by the macOS LaunchAgent (or cron) each night.
# Does NOT deploy code — only tests and uploads the test-reports folder.

set -euo pipefail

SERVER="pi@192.168.1.23"
REMOTE_REPORTS="/var/www/html/test-reports"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/nightly-$(date '+%Y-%m-%d').log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================"
echo "  Nightly test run — $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

cd "$PROJECT_DIR"

# ── Kill any stale server on port 3000 ───────────────────────
echo ""
echo "🔧 Clearing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# ── Set shared timestamp ─────────────────────────────────────
export TEST_TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
echo "🕐 Timestamp: $TEST_TIMESTAMP"

# ── Run Playwright tests ─────────────────────────────────────
echo ""
echo "🧪 Running tests..."
node --no-deprecation ./node_modules/.bin/playwright test
TEST_EXIT=$?

# ── Parse results and update manifest ───────────────────────
if [ -f "test-results/$TEST_TIMESTAMP/results.json" ]; then
  echo ""
  echo "📊 Parsing results..."
  node scripts/parse-results.js "$TEST_TIMESTAMP"
else
  echo "⚠️  No results.json found — skipping parse"
fi

# ── Sync test-reports to Pi ──────────────────────────────────
echo ""
echo "📡 Syncing test-reports to Pi..."
rsync -avz \
  "$PROJECT_DIR/test-reports/" \
  "$SERVER:$REMOTE_REPORTS/"

if [ $? -eq 0 ]; then
  echo "✅ Test results live on Pi"
else
  echo "❌ rsync to Pi failed — results saved locally in test-reports/"
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
if [ $TEST_EXIT -eq 0 ]; then
  echo "✅ Nightly run complete — all tests passed"
else
  echo "⚠️  Nightly run complete — some tests FAILED (see test-reports/)"
fi
echo "📄 Log: $LOG_FILE"
echo ""
