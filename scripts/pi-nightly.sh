#!/bin/bash
# pi-nightly.sh — Nightly test runner for the Raspberry Pi
# Runs Playwright tests against the local project, parses results,
# and copies test-reports into Apache's web root so the dashboard shows them.
#
# Cron entry (runs at 2am daily):
#   0 2 * * * /bin/bash /home/pi/Projects/bobby-dashboard/scripts/pi-nightly.sh

PROJECT_DIR="/home/pi/Projects/bobby-dashboard"
APACHE_DIR="/var/www/html"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/nightly-$(date '+%Y-%m-%d').log"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================"
echo "  Pi nightly test run — $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

cd "$PROJECT_DIR" || exit 1

# ── Pull latest code from GitHub ─────────────────────────────
echo ""
echo "⬇️  Pulling latest code..."
git pull origin main 2>&1

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

# ── Seed project manifest from Apache (preserves Mac + prior Pi runs) ──
if [ -f "$APACHE_DIR/test-reports/manifest.json" ]; then
  mkdir -p "$PROJECT_DIR/test-reports"
  cp "$APACHE_DIR/test-reports/manifest.json" "$PROJECT_DIR/test-reports/manifest.json"
  echo "📋 Seeded manifest from Apache"
fi

# ── Parse results and update manifest ───────────────────────
if [ -f "test-results/$TEST_TIMESTAMP/results.json" ]; then
  echo ""
  echo "📊 Parsing results..."
  TEST_SOURCE=nightly node scripts/parse-results.js "$TEST_TIMESTAMP"
else
  echo "⚠️  No results.json found — skipping parse"
fi

# ── Copy test-reports to Apache web root ─────────────────────
echo ""
echo "📡 Copying test-reports to Apache..."
rsync -av "$PROJECT_DIR/test-reports/" "$APACHE_DIR/test-reports/"

if [ $? -eq 0 ]; then
  echo "✅ Test results live at /var/www/html/test-reports/"
else
  echo "❌ Copy to Apache failed"
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
if [ $TEST_EXIT -eq 0 ]; then
  echo "✅ Nightly run complete — all tests passed"
else
  echo "⚠️  Nightly run complete — some tests FAILED"
fi
echo "📄 Log: $LOG_FILE"
echo ""
