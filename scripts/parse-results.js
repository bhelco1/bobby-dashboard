#!/usr/bin/env node
// parse-results.js
// Reads the Playwright JSON output for a given timestamp, extracts pass/fail
// stats, copies the HTML report into test-reports/, and updates manifest.json.

const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const RESULTS_DIR = path.join(ROOT, 'test-results');
const REPORTS_DIR = path.join(ROOT, 'test-reports');

const timestamp = process.argv[2];
if (!timestamp) {
  console.error('Usage: node scripts/parse-results.js <YYYY-MM-DD_HH-MM-SS>');
  process.exit(1);
}

const source = process.env.TEST_SOURCE || 'manual';

// ── Read Playwright JSON output ──────────────────────────────
const resultsFile = path.join(RESULTS_DIR, timestamp, 'results.json');
if (!fs.existsSync(resultsFile)) {
  console.error(`Results file not found: ${resultsFile}`);
  process.exit(1);
}

const results  = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
const stats    = results.stats;
const passed   = stats.expected   || 0;
const failed   = stats.unexpected || 0;
const skipped  = stats.skipped    || 0;
const duration = Math.round((stats.duration || 0) / 1000);

// ── Parse timestamp into display strings ────────────────────
const [datePart, timePart] = timestamp.split('_');
const [yr, mo, dy]         = datePart.split('-');
const [hr, mn]             = timePart.split('-');
const dateObj   = new Date(`${yr}-${mo}-${dy}T${hr}:${mn}:00`);
const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const displayTime = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

// ── Copy HTML report into test-reports/<timestamp>/ ─────────
const srcReport  = path.join(RESULTS_DIR, timestamp, 'report');
const destReport = path.join(REPORTS_DIR, timestamp);

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

if (fs.existsSync(srcReport)) {
  copyDir(srcReport, destReport);
  console.log(`📋 HTML report copied → test-reports/${timestamp}/`);
} else {
  console.warn('⚠️  No HTML report found — skipping copy');
}

// ── Update manifest.json ─────────────────────────────────────
const manifestFile = path.join(REPORTS_DIR, 'manifest.json');
let manifest = [];
if (fs.existsSync(manifestFile)) {
  try { manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8')); } catch {}
}

const entry = {
  timestamp,
  date:       displayDate,
  time:       displayTime,
  passed,
  failed,
  skipped,
  total:      passed + failed + skipped,
  duration,
  source,
  reportPath: `test-reports/${timestamp}/index.html`
};

// Replace if same timestamp exists, otherwise prepend (newest first)
const idx = manifest.findIndex(e => e.timestamp === timestamp);
if (idx >= 0) manifest[idx] = entry;
else manifest.unshift(entry);

// Keep last 100 runs
manifest = manifest.slice(0, 100);

fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
console.log(`✅ Manifest updated: ${passed} passed, ${failed} failed, ${duration}s`);
