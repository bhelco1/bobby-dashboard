#!/bin/bash
# deploy.sh — Test, build report, sync to Apache, push to GitHub
# Usage: ./deploy.sh

SERVER="pi@192.168.1.190"
REMOTE_PATH="/var/www/html/"
LOCAL_PATH="$(cd "$(dirname "$0")" && pwd)/"

# ── Generate a shared timestamp for this run ─────────────────
export TEST_TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
echo "🕐 Run timestamp: $TEST_TIMESTAMP"
echo ""

# ── Clear port 3000 so Playwright owns a fresh server ────────
echo "🔧 Clearing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# ── Run Playwright tests ─────────────────────────────────────
echo "🧪 Running tests..."
node --no-deprecation ./node_modules/.bin/playwright test 2>&1
TEST_EXIT=$?

# ── Parse results and update manifest (even on failure) ──────
if [ -f "test-results/$TEST_TIMESTAMP/results.json" ]; then
  echo ""
  echo "📊 Parsing results..."
  TEST_SOURCE=deploy node scripts/parse-results.js "$TEST_TIMESTAMP"
else
  echo "⚠️  No results file found — skipping report"
fi

# ── Abort deploy if tests failed ─────────────────────────────
if [ $TEST_EXIT -ne 0 ]; then
  echo ""
  echo "❌ Tests failed — deploy aborted."
  echo "   Run 'npm test' to see full details."
  exit 1
fi
echo "✅ All tests passed"
echo ""

# ── Merge manifest with Pi's current runs ────────────────────
echo "📥 Merging manifest with Pi's current runs..."
scp -q "$SERVER:${REMOTE_PATH}test-reports/manifest.json" /tmp/pi-manifest.json 2>/dev/null
if [ -f /tmp/pi-manifest.json ]; then
  node -e "
    const fs = require('fs');
    const mac = JSON.parse(fs.readFileSync('test-reports/manifest.json', 'utf8'));
    const pi  = JSON.parse(fs.readFileSync('/tmp/pi-manifest.json', 'utf8'));
    const seen = new Set();
    const merged = [...mac, ...pi]
      .filter(e => { if (seen.has(e.timestamp)) return false; seen.add(e.timestamp); return true; })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 100);
    fs.writeFileSync('test-reports/manifest.json', JSON.stringify(merged, null, 2));
    console.log('Merged: ' + merged.length + ' runs (' + mac.length + ' mac + ' + pi.length + ' pi, deduped)');
  "
  rm -f /tmp/pi-manifest.json
else
  echo "ℹ️  No Pi manifest found — using Mac manifest only"
fi

# ── Sync project to Pi ───────────────────────────────────────
echo "🚀 Deploying to $SERVER$REMOTE_PATH..."

rsync -avz --delete \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='*.sh' \
  --exclude='README.md' \
  --exclude='node_modules' \
  --exclude='test-results' \
  --exclude='test-reports' \
  "$LOCAL_PATH" "$SERVER:$REMOTE_PATH"

# Sync test-reports additively so Pi cron runs are never deleted
rsync -avz test-reports/ "$SERVER:${REMOTE_PATH}test-reports/"

if [ $? -eq 0 ]; then
  echo "✅ Deploy complete — $(date '+%H:%M:%S')"
else
  echo "❌ Deploy failed. Check SSH access to $SERVER"
  exit 1
fi

# ── Fix Apache permissions on Pi ─────────────────────────────
echo "🔒 Fixing permissions on Pi..."
ssh "$SERVER" "sudo chown -R pi:www-data /var/www/html/ && sudo chmod -R 755 /var/www/html/"
echo "✅ Permissions fixed"

# ── Commit and push to GitHub ────────────────────────────────
echo "📝 Committing to git..."
git -C "$LOCAL_PATH" add -A
git -C "$LOCAL_PATH" commit -m "Deploy $(date '+%Y-%m-%d %H:%M:%S')" 2>&1
COMMIT_EXIT=$?
if [ $COMMIT_EXIT -eq 0 ]; then
  echo "✅ Committed"
else
  echo "ℹ️  Nothing new to commit"
fi

echo "⬆️  Pushing to GitHub..."
git -C "$LOCAL_PATH" push origin HEAD 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Pushed to GitHub"
else
  echo "⚠️  GitHub push failed — commits are safe locally, push manually if needed"
fi
