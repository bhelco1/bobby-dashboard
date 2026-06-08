# Integrating a project with the Testing Results dashboard

The dashboard at `/testing.html` shows test results for any project that writes a manifest file to the Pi and registers itself in `test-results/projects.json`. Adding a new project is two steps: register it, then have your CI/nightly job write results.

---

## 1. Register the project

Edit `test-results/projects.json` in this repo and add one entry:

```json
[
  { "key": "bobby-dashboard",  "name": "Bobby Dashboard" },
  { "key": "ostomate-android", "name": "Ostomate Android" },
  { "key": "your-project",     "name": "Your Project Name" }
]
```

- `key` — URL-safe slug, no spaces. Used as the directory name and URL path.
- `name` — Display name shown in the dropdown.

Then run `./deploy.sh` from this repo to push the updated `projects.json` to the Pi. That's the only code change required — the dashboard reads the registry at runtime.

---

## 2. Write a manifest on the Pi

Your project's test runner must write (or append to) a manifest file at:

```
/var/www/html/test-results/<key>/manifest.json
```

The manifest is a JSON array of run entries, **newest first**, capped at 100 entries.

### Entry schema

```json
{
  "timestamp": "2026-06-08_13-14-26",
  "date":      "Jun 8, 2026",
  "time":      "1:14 PM",
  "passed":    42,
  "failed":    0,
  "skipped":   0,
  "total":     42,
  "duration":  38,
  "source":    "ci",
  "reportPath": "test-results/your-project/2026-06-08_13-14-26/index.html"
}
```

| Field        | Type   | Required | Notes |
|--------------|--------|----------|-------|
| `timestamp`  | string | yes      | `YYYY-MM-DD_HH-MM-SS` — used as a unique key for deduplication |
| `date`       | string | yes      | Human-readable date, e.g. `Jun 8, 2026` |
| `time`       | string | yes      | Human-readable time, e.g. `1:14 PM` |
| `passed`     | number | yes      | Count of passing tests |
| `failed`     | number | yes      | Count of failing tests |
| `skipped`    | number | yes      | Count of skipped tests |
| `total`      | number | yes      | `passed + failed + skipped` |
| `duration`   | number | yes      | Seconds (integer) |
| `source`     | string | no       | Label shown in the Source column — e.g. `ci`, `nightly`, `manual`. Omit or use `null` to show `—`. |
| `reportPath` | string | no       | Path to an HTML report, relative to the Apache root. Omit if you have no HTML report. |

---

## 3. Example: writing a run entry from a shell script

```bash
#!/bin/bash
# After your test suite finishes, call this to record results on the Pi.

PI="pi@192.168.1.190"
KEY="your-project"
MANIFEST="/var/www/html/test-results/$KEY/manifest.json"

TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
DATE=$(date '+%b %-d, %Y')
TIME=$(date '+%-I:%M %p')
PASSED=42   # replace with your actual values
FAILED=0
SKIPPED=0
TOTAL=$((PASSED + FAILED + SKIPPED))
DURATION=38

ssh "$PI" "
  mkdir -p /var/www/html/test-results/$KEY

  # Read existing manifest or start fresh
  if [ -f $MANIFEST ]; then
    EXISTING=\$(cat $MANIFEST)
  else
    EXISTING='[]'
  fi

  node -e \"
    const fs = require('fs');
    const entry = {
      timestamp: '$TIMESTAMP',
      date: '$DATE',
      time: '$TIME',
      passed: $PASSED,
      failed: $FAILED,
      skipped: $SKIPPED,
      total: $TOTAL,
      duration: $DURATION,
      source: 'ci'
    };
    let manifest = \$EXISTING;
    const idx = manifest.findIndex(e => e.timestamp === entry.timestamp);
    if (idx >= 0) manifest[idx] = entry;
    else manifest.unshift(entry);
    manifest = manifest.slice(0, 100);
    fs.writeFileSync('$MANIFEST', JSON.stringify(manifest, null, 2));
  \"
"
```

---

## 4. Uploading an HTML report (optional)

If your test framework generates an HTML report, copy it to the Pi before updating the manifest, then set `reportPath` to its location:

```bash
REPORT_DIR="/var/www/html/test-results/$KEY/$TIMESTAMP"
rsync -avz ./path/to/report/ "$PI:$REPORT_DIR/"
# Then set reportPath: "test-results/$KEY/$TIMESTAMP/index.html" in the manifest entry
```

---

## Reference implementation

`scripts/parse-results.js` is the full implementation used by the Bobby Dashboard project itself. It reads Playwright's JSON output, extracts stats, copies the HTML report, and updates the manifest. Use it as a reference for writing your own integration.
