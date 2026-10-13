#!/usr/bin/env node
// collect-status.js
// Reads every project listed in project-status/registry.json, loads that
// project's STATUS.json, adds live git facts (last commit, uncommitted files),
// and writes the combined file project-status/status.json for projects.html.
//
// Usage: node scripts/collect-status.js [projectsRoot]
//   projectsRoot defaults to the parent of this repo (~/Projects).

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT          = path.join(__dirname, '..');
const PROJECTS_ROOT = path.resolve(process.argv[2] || path.join(ROOT, '..'));
const REGISTRY      = process.env.STATUS_REGISTRY || path.join(ROOT, 'project-status', 'registry.json');
const OUT_FILE      = process.env.STATUS_OUT      || path.join(ROOT, 'project-status', 'status.json');

// STATUS.json older than the latest commit by more than this is flagged stale.
const STALE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

function git(dir, args) {
  try {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function gitFacts(dir) {
  if (git(dir, ['rev-parse', '--is-inside-work-tree']) !== 'true') return null;
  const log = git(dir, ['log', '-1', '--format=%cI%x09%s']);
  const [lastCommitAt, lastCommitSubject] = log ? log.split('\t') : [null, null];
  const status = git(dir, ['status', '--porcelain']);
  return {
    branch: git(dir, ['rev-parse', '--abbrev-ref', 'HEAD']),
    lastCommitAt,
    lastCommitSubject,
    uncommitted: status ? status.split('\n').filter(Boolean).length : 0,
  };
}

function readStatus(dir) {
  const file = path.join(dir, 'STATUS.json');
  if (!fs.existsSync(file)) return { error: 'No STATUS.json in this project yet' };
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return { error: 'STATUS.json is not valid JSON: ' + e.message };
  }
}

function isStale(status, gitInfo) {
  if (!status.updated || !gitInfo || !gitInfo.lastCommitAt) return false;
  const updated = new Date(status.updated + 'T23:59:59');
  return new Date(gitInfo.lastCommitAt) - updated > STALE_DAYS * DAY_MS;
}

function collect() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  const projects = registry.map(({ key, path: rel }) => {
    const dir = path.join(PROJECTS_ROOT, rel || key);
    if (!fs.existsSync(dir)) {
      return { key, error: `Folder not found: ${rel || key}` };
    }
    const status = readStatus(dir);
    const gitInfo = gitFacts(dir);
    return { key, ...status, git: gitInfo, stale: isStale(status, gitInfo) };
  });
  return { generatedAt: new Date().toISOString(), projects };
}

if (require.main === module) {
  const data = collect();
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2));
  const bad = data.projects.filter(p => p.error).length;
  console.log(`📋 Project status: ${data.projects.length} projects written to ${path.relative(ROOT, OUT_FILE)}` +
    (bad ? ` (${bad} with problems)` : ''));
}

module.exports = { collect, isStale };
