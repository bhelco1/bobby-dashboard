#!/bin/bash
# install-launchagent.sh — Install the macOS LaunchAgent for nightly tests
# Run once: bash scripts/install-launchagent.sh
# To uninstall: bash scripts/install-launchagent.sh --uninstall

LABEL="com.bobby.dashboard.nightly-test"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NIGHTLY_SCRIPT="$SCRIPT_DIR/nightly-test.sh"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ "${1:-}" = "--uninstall" ]; then
  echo "🗑  Unloading and removing LaunchAgent..."
  launchctl unload "$PLIST" 2>/dev/null || true
  rm -f "$PLIST"
  echo "✅ LaunchAgent removed"
  exit 0
fi

# ── Make the test script executable ──────────────────────────
chmod +x "$NIGHTLY_SCRIPT"

# ── Write the plist ───────────────────────────────────────────
mkdir -p "$HOME/Library/LaunchAgents"
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
    <string>$NIGHTLY_SCRIPT</string>
  </array>

  <!-- Run every day at 2:00 AM -->
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>2</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>

  <!-- If the Mac was asleep at 2am, run as soon as it wakes -->
  <key>RunAtLoad</key>
  <false/>

  <key>WorkingDirectory</key>
  <string>$PROJECT_DIR</string>

  <key>StandardOutPath</key>
  <string>$PROJECT_DIR/logs/launchagent.log</string>

  <key>StandardErrorPath</key>
  <string>$PROJECT_DIR/logs/launchagent-error.log</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
    <key>HOME</key>
    <string>$HOME</string>
  </dict>
</dict>
</plist>
EOF

# ── Load the agent ────────────────────────────────────────────
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"

echo ""
echo "✅ LaunchAgent installed and loaded"
echo "   Label:    $LABEL"
echo "   Schedule: Daily at 2:00 AM"
echo "   Script:   $NIGHTLY_SCRIPT"
echo "   Plist:    $PLIST"
echo "   Logs:     $PROJECT_DIR/logs/"
echo ""
echo "To run immediately (for testing):"
echo "  launchctl start $LABEL"
echo ""
echo "To uninstall:"
echo "  bash scripts/install-launchagent.sh --uninstall"
