#!/bin/bash
# install-status-agent.sh — Install the macOS LaunchAgent that keeps the
# Projects page current. Every 15 minutes it collects each project's
# STATUS.json plus git activity and pushes the result to the Pi.
#
# Run once:      bash scripts/install-status-agent.sh
# To uninstall:  bash scripts/install-status-agent.sh --uninstall

LABEL="com.bobby.dashboard.project-status"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SYNC_SCRIPT="$SCRIPT_DIR/sync-status.sh"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ "${1:-}" = "--uninstall" ]; then
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "✅ Project status agent removed"
  exit 0
fi

NODE_BIN="$(command -v node)"
if [ -z "$NODE_BIN" ]; then
  echo "❌ node not found on PATH — open a terminal where 'node -v' works and run this again."
  exit 1
fi
NODE_DIR="$(dirname "$NODE_BIN")"

chmod +x "$SYNC_SCRIPT"
mkdir -p "$HOME/Library/LaunchAgents" "$PROJECT_DIR/logs"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>

  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$SYNC_SCRIPT</string>
  </array>

  <!-- Every 15 minutes, and once right away -->
  <key>StartInterval</key>
  <integer>900</integer>
  <key>RunAtLoad</key>
  <true/>

  <key>WorkingDirectory</key>
  <string>$PROJECT_DIR</string>

  <key>StandardOutPath</key>
  <string>$PROJECT_DIR/logs/project-status.log</string>
  <key>StandardErrorPath</key>
  <string>$PROJECT_DIR/logs/project-status-error.log</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>$NODE_DIR:/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
    <key>HOME</key>
    <string>$HOME</string>
  </dict>
</dict>
</plist>
EOF

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo ""
echo "✅ Project status agent installed — runs every 15 minutes"
echo "   Log:  $PROJECT_DIR/logs/project-status.log"
echo "   Run now:  launchctl start $LABEL"
echo "   Remove:   bash scripts/install-status-agent.sh --uninstall"
