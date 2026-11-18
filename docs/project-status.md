# Projects page — how status stays current

`projects.html` (and the Projects card on the home page) show each project's plan,
where it is in that plan, the next steps, and what only Bobby can do.

## How the data flows

1. Each project keeps a `STATUS.json` at its root. Claude Code updates it at the end of
   every working session (the rule lives in `~/Projects/CLAUDE.md`, which every project inherits).
2. On the Mac, a LaunchAgent runs `scripts/sync-status.sh` every 15 minutes. It runs
   `scripts/collect-status.js`, which reads every project in `project-status/registry.json`,
   adds live git facts (last commit, uncommitted files, branch) and writes
   `project-status/status.json`, then copies that one file to the Pi at
   `/var/www/html/project-status/status.json`.
3. The pages fetch that file and refresh every 5 minutes.

If a project's STATUS.json is more than 3 days older than its latest commit, the page flags it
as stale. If the whole file hasn't been refreshed for 2 hours, the page says the Mac may be asleep.

## One-time setup (on the Mac)

```bash
cd ~/Projects/bobby-dashboard
./deploy.sh                              # ships projects.html and the first status file
bash scripts/install-status-agent.sh     # refreshes it every 15 minutes from then on
```

## Adding a project

1. Add `{ "key": "slug", "path": "FolderName" }` to `project-status/registry.json`.
2. Create `STATUS.json` in that project's folder (schema below), or ask Claude Code to.

## STATUS.json schema

```json
{
  "name": "Display name",
  "tagline": "One line: what it is",
  "updated": "YYYY-MM-DD",
  "state": "active | waiting | planning | paused",
  "planDoc": "Path to the plan this mirrors, e.g. planning/05-dev-plan.md",
  "phases": [
    { "id": "3", "name": "Release preparation", "status": "done | active | todo" }
  ],
  "now": "One or two sentences: where it stands right now",
  "next": ["Next step the agents can do", "..."],
  "waitingOnBobby": ["Something only Bobby can do (accounts, secrets, decisions)"]
}
```

- `id` is optional; use the plan's own phase number so the page matches the plan doc.
- Exactly one phase should be `active` while work is underway.
- `state: "waiting"` means the next real progress is blocked on an item in `waitingOnBobby`.

## Future consideration: updates by webhook

Requested by Bobby 2026-11-18, not scheduled. Today the Mac collects every project's
`STATUS.json` every 15 minutes and copies one file to the Pi, so the page is up to 15 minutes
behind and goes stale while the Mac sleeps. Instead, each update would be pushed as it happens:
for example a GitHub webhook on push to a small endpoint on the Pi, which reads the project's
`STATUS.json` from the repo. Decide first: how the Pi is reachable from GitHub (it is on the home
network), how the webhook's signature is checked, where its secret lives, and what still supplies
the live git facts (uncommitted files, branch) that only the Mac can see.
