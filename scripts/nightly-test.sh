#!/bin/bash
# nightly-test.sh — Run dashboard tests and sync results to Pi
# Designed to be called by the macOS LaunchAgent (or cron) each night.
# Does NOT deploy code — only tests and uploads the test-reports folder.

set -euo pipefail

SERVER="pi@192.168.1.190"
REMOTE_REPORTS="/var/www/html/test-results"
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
if [ -f "playwright-results/$TEST_TIMESTAMP/results.json" ]; then
  echo ""
  echo "📊 Parsing results..."
  TEST_SOURCE=mac-nightly node scripts/parse-results.js "$TEST_TIMESTAMP"
else
  echo "⚠️  No results.json found — skipping parse"
fi

# ── Merge manifest with Pi's current runs ────────────────────
# Prevents overwriting Pi nightly entries that accumulated since last deploy.
echo ""
echo "📥 Merging manifest with Pi's current runs..."
if scp -q "$SERVER:${REMOTE_REPORTS}/bobby-dashboard/manifest.json" /tmp/pi-manifest.json 2>/dev/null; then
  node -e "
    const fs = require('fs');
    const mac = JSON.parse(fs.readFileSync('test-results/bobby-dashboard/manifest.json', 'utf8'));
    const pi  = JSON.parse(fs.readFileSync('/tmp/pi-manifest.json', 'utf8'));
    const seen = new Set();
    const merged = [...mac, ...pi]
      .filter(e => { if (seen.has(e.timestamp)) return false; seen.add(e.timestamp); return true; })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 100);
    fs.writeFileSync('test-results/bobby-dashboard/manifest.json', JSON.stringify(merged, null, 2));
    console.log('Merged: ' + merged.length + ' runs (' + mac.length + ' mac + ' + pi.length + ' pi, deduped)');
  "
  rm -f /tmp/pi-manifest.json
else
  echo "ℹ️  Could not reach Pi — using local manifest only"
fi

# ── Sync test-reports to Pi ──────────────────────────────────
echo ""
echo "📡 Syncing test-results to Pi..."
rsync -avz \
  "$PROJECT_DIR/test-results/" \
  "$SERVER:$REMOTE_REPORTS/"

if [ $? -eq 0 ]; then
  echo "✅ Test results live on Pi"
else
  echo "❌ rsync to Pi failed — results saved locally in test-results/"
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
if [ $TEST_EXIT -eq 0 ]; then
  echo "✅ Nightly run complete — all tests passed"
else
  echo "⚠️  Nightly run complete — some tests FAILED (see test-results/bobby-dashboard/)"
fi
echo "📄 Log: $LOG_FILE"
echo ""
