// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');

const FIXTURE = path.join(__dirname, 'fixtures', 'project-status.json');

async function mockStatus(page, body = fs.readFileSync(FIXTURE, 'utf8'), status = 200) {
  await page.route('**/project-status/status.json*', route =>
    route.fulfill({ status, contentType: 'application/json', body })
  );
}

// ─── Projects page ────────────────────────────────────────────
test.describe('Projects page', () => {
  test.beforeEach(async ({ page }) => {
    await mockStatus(page);
    await page.goto('/projects.html');
  });

  test('renders one section per project', async ({ page }) => {
    await expect(page.locator('article.project')).toHaveCount(3);
  });

  test('shows where each project is in its plan', async ({ page }) => {
    const alpha = page.locator('#alpha');
    await expect(alpha.locator('.plan-where')).toContainText('Step 2 of 3');
    await expect(alpha.locator('.plan-where')).toContainText('Build');
    await expect(alpha.locator('.plan-count')).toHaveText('1 of 3 phases done');
    await expect(alpha.locator('.seg.done')).toHaveCount(1);
    await expect(alpha.locator('.seg.active')).toHaveCount(1);
  });

  test('full plan marks the current phase', async ({ page }) => {
    const alpha = page.locator('#alpha');
    await alpha.locator('details.full-plan summary').click();
    await expect(alpha.locator('.phase-list li.active')).toContainText('You are here');
    await expect(alpha.locator('.plan-doc')).toContainText('docs/plan.md');
  });

  test('uses the plan\'s own phase numbers when given', async ({ page }) => {
    await page.unrouteAll();
    const data = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
    data.projects[0].phases = [{ id: '2.5', name: 'Hardening', status: 'done' }, { id: '3', name: 'Release prep', status: 'active' }];
    await mockStatus(page, JSON.stringify(data));
    await page.goto('/projects.html');
    await expect(page.locator('#alpha .plan-where')).toContainText('Phase 3 · Release prep');
    await page.goto('/');
    await expect(page.locator('#proj-list .proj-phase').first()).toHaveText('Phase 3');
  });

  test('a project with no active phase points at its first unfinished phase', async ({ page }) => {
    await expect(page.locator('#beta .plan-where')).toContainText('Step 1 of 2');
  });

  test('lists next steps and the things only Bobby can do', async ({ page }) => {
    const alpha = page.locator('#alpha');
    await expect(alpha.locator('.steps li')).toHaveText(['Write the parser', 'Wire the API']);
    await expect(alpha.locator('.waiting li')).toHaveText(['Create the account']);
    await expect(page.locator('#beta .waiting')).toHaveCount(0);
  });

  test('totals what is waiting on Bobby', async ({ page }) => {
    await expect(page.locator('#waiting-total')).toContainText('1 thing');
  });

  test('shows the state label', async ({ page }) => {
    await expect(page.locator('#alpha .state-chip')).toHaveText('Active');
    await expect(page.locator('#beta .state-chip')).toHaveText('Planning');
  });

  test('shows git activity and the stale warning', async ({ page }) => {
    const activity = page.locator('#alpha .activity');
    await expect(activity).toContainText('3 uncommitted files on main');
    await expect(activity.locator('.stale-warn')).toBeVisible();
    await expect(page.locator('#beta .activity')).toContainText('Not a git repository yet');
  });

  test('escapes HTML coming from status files', async ({ page }) => {
    await expect(page.locator('#alpha .commit')).toHaveText('feat: <b>parser</b>');
    await expect(page.locator('#alpha .commit b')).toHaveCount(0);
  });

  test('shows a project problem instead of failing the page', async ({ page }) => {
    await expect(page.locator('#gamma .problem')).toHaveText('No STATUS.json in this project yet');
  });

});

test.describe('Projects page — freshness', () => {
  test('flags data that has not been refreshed in hours', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-13T12:00:00Z'));
    await mockStatus(page);
    await page.goto('/projects.html');
    await expect(page.locator('#freshness')).toHaveClass(/old/);
    await expect(page.locator('#freshness')).toContainText('5 hours ago — is the Mac asleep?');
  });

  test('does not flag recent data', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-13T07:20:00Z'));
    await mockStatus(page);
    await page.goto('/projects.html');
    await expect(page.locator('#freshness')).toHaveText('Updated 20 min ago');
    await expect(page.locator('#freshness')).not.toHaveClass(/old/);
  });
});

test.describe('Projects page — no data', () => {
  test('explains how to generate status when the file is missing', async ({ page }) => {
    await mockStatus(page, 'not found', 404);
    await page.goto('/projects.html');
    await expect(page.locator('#projects-list')).toContainText('sync-status.sh');
  });
});

// ─── Home page Projects card ─────────────────────────────────
test.describe('Home page — Projects card', () => {
  test('lists projects with phase and next step, linking to their section', async ({ page }) => {
    await mockStatus(page);
    await page.goto('/');
    const rows = page.locator('#proj-list .proj-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.first().locator('.proj-phase')).toHaveText('Step 2 of 3');
    await expect(rows.first().locator('.proj-next')).toContainText('Write the parser');
    await expect(rows.first().locator('.proj-name')).toHaveAttribute('href', 'projects.html#alpha');
    await expect(page.locator('#proj-waiting')).toHaveText('1 thing only you can do →');
  });

  test('shows a note when status is unavailable', async ({ page }) => {
    await mockStatus(page, 'nope', 500);
    await page.goto('/');
    await expect(page.locator('#proj-list')).toContainText('Project status unavailable');
  });
});

// ─── Collector script ────────────────────────────────────────
test.describe('collect-status.js', () => {
  const { isStale } = require('../scripts/collect-status.js');

  test('flags a status written well before the latest commit', () => {
    expect(isStale({ updated: '2026-10-01' }, { lastCommitAt: '2026-10-10T12:00:00Z' })).toBe(true);
  });

  test('does not flag a status written the day of the latest commit', () => {
    expect(isStale({ updated: '2026-10-10' }, { lastCommitAt: '2026-10-10T20:00:00Z' })).toBe(false);
  });

  test('collects STATUS.json and git facts from a projects folder', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'projects-'));
    const proj = path.join(root, 'demo');
    fs.mkdirSync(proj);
    fs.writeFileSync(path.join(proj, 'STATUS.json'), JSON.stringify({ name: 'Demo', updated: '2026-10-13', phases: [] }));
    fs.writeFileSync(path.join(proj, 'scratch.txt'), 'x');
    execFileSync('git', ['init', '-q', proj]);

    const registry = path.join(root, 'registry.json');
    const outFile = path.join(root, 'status.json');
    fs.writeFileSync(registry, JSON.stringify([{ key: 'demo', path: 'demo' }, { key: 'missing', path: 'missing' }]));
    try {
      const out = execFileSync('node', [path.join(__dirname, '..', 'scripts', 'collect-status.js'), root], {
        encoding: 'utf8',
        env: { ...process.env, STATUS_REGISTRY: registry, STATUS_OUT: outFile },
      });
      expect(out).toContain('1 with problems');
      const data = JSON.parse(fs.readFileSync(outFile, 'utf8'));
      expect(data.projects[0].name).toBe('Demo');
      expect(data.projects[0].git.uncommitted).toBe(2);
      expect(data.projects[1].error).toContain('Folder not found');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
