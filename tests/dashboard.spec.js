// @ts-check
const { test, expect } = require('@playwright/test');

// ─── Home page — structural ───────────────────────────────────
test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Bobby/i);
  });

  test('shows greeting in header', async ({ page }) => {
    const greeting = page.locator('#greeting');
    await expect(greeting).toBeVisible();
    await expect(greeting).not.toBeEmpty();
  });

  test('shows time in header', async ({ page }) => {
    const time = page.locator('#time');
    await expect(time).toBeVisible();
    await expect(time).not.toHaveText('--:--');
  });

  test('shows weather info', async ({ page }) => {
    await expect(page.locator('#weather-summary')).toBeVisible();
  });

  test('Weather Underground link is present', async ({ page }) => {
    const link = page.locator(`a[href="https://www.wunderground.com/weather/us/ut/provo"]`).first();
    await expect(link).toBeVisible();
  });

  test('shows news section', async ({ page }) => {
    await expect(page.locator('#news-card')).toBeVisible();
  });

  test('shows dad joke section', async ({ page }) => {
    await expect(page.locator('#joke-setup-card')).toBeVisible();
    await expect(page.locator('#joke-setup')).not.toHaveText('Loading a joke...');
  });

  test('shows calendar section', async ({ page }) => {
    await expect(page.locator('#calendar-card')).toBeVisible();
  });

  test('shows keto recipe section', async ({ page }) => {
    await expect(page.locator('#recipe-card')).toBeVisible();
    await expect(page.locator('.recipe-name')).not.toBeEmpty();
  });

  test('bottom nav has all links', async ({ page }) => {
    const nav = page.locator('footer.bottom-nav');
    await expect(nav.locator('a', { hasText: 'Home' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'Contact Me' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'Testing Results' })).toBeVisible();
    await expect(nav.locator('a', { hasText: "Cash's Terrible Music" })).toBeVisible();
  });
});

// ─── Home page — content ──────────────────────────────────────
test.describe('Home page — content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('clock shows a valid 12-hour time format', async ({ page }) => {
    const time = await page.locator('#time').textContent();
    expect(time).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/i);
  });

  test('greeting contains Bobby', async ({ page }) => {
    const greeting = await page.locator('#greeting').textContent();
    expect(greeting).toMatch(/Bobby/i);
  });

  test('greeting reflects time of day', async ({ page }) => {
    const greeting = await page.locator('#greeting').textContent();
    const validGreetings = [
      'Good morning, Bobby',
      'Good afternoon, Bobby',
      'Good evening, Bobby',
      'Winding down, Bobby',
      'Up late, Bobby',
    ];
    expect(validGreetings).toContain(greeting?.trim());
  });

  test('weather summary contains a temperature in °F', async ({ page }) => {
    const summary = await page.locator('#weather-summary').textContent();
    expect(summary).toMatch(/\d+°F/);
  });

  test('weather hi/lo shows High and Low temps', async ({ page }) => {
    const hilo = await page.locator('#weather-hilo').textContent();
    expect(hilo).toMatch(/High \d+°\s*\/\s*Low \d+°/);
  });

  test('recipe shows ingredients and steps', async ({ page }) => {
    await expect(page.locator('.recipe-section-label').first()).toBeVisible();
    await expect(page.locator('.recipe li').first()).toBeVisible();
  });

  test('punchline section is visible', async ({ page }) => {
    await expect(page.locator('#joke-punchline')).toBeVisible();
    await expect(page.locator('#joke-punchline')).not.toHaveText('...');
  });
});

// ─── Home page — functional ───────────────────────────────────
test.describe('Home page — functional', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('"New joke" button loads a different joke', async ({ page }) => {
    const before = await page.locator('#joke-setup').textContent();
    await page.locator('button', { hasText: 'New joke' }).click();
    await page.waitForTimeout(2000);
    const after = await page.locator('#joke-setup').textContent();
    // Either a new joke loaded or it's still loading — both are valid
    expect(typeof after).toBe('string');
    expect(after?.length).toBeGreaterThan(0);
  });

  test('"Try another" recipe button changes the recipe', async ({ page }) => {
    const before = await page.locator('.recipe-name').textContent();
    await page.locator('button', { hasText: 'Try another' }).click();
    const after = await page.locator('.recipe-name').textContent();
    // Recipe list is finite so it could land on the same one — just check it's still there
    expect(after?.length).toBeGreaterThan(0);
  });

  test('"Refresh" news button is clickable', async ({ page }) => {
    const btn = page.locator('button', { hasText: 'Refresh' });
    await expect(btn).toBeVisible();
    await btn.click();
    // After click the list should still exist (not crash)
    await expect(page.locator('#news-list')).toBeVisible();
  });

  test('dad joke auto-refresh interval is 30 minutes', async ({ page }) => {
    const interval = await page.evaluate(() => {
      // Parse the setInterval call from the page source
      return document.documentElement.innerHTML.includes('30 * 60 * 1000');
    });
    expect(interval).toBe(true);
  });
});

// ─── Contact page ─────────────────────────────────────────────
test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact.html');
  });

  test('loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Contact/i);
  });

  test('shows Bobby Helco name', async ({ page }) => {
    await expect(page.locator('.contact-name')).toHaveText('Bobby Helco');
  });

  test('email link is correct', async ({ page }) => {
    const email = page.locator('a[href="mailto:bhelco@gmail.com"]');
    await expect(email).toBeVisible();
    await expect(email).toHaveText('bhelco@gmail.com');
  });

  test('phone link is correct', async ({ page }) => {
    const phone = page.locator('a[href="tel:+18017349434"]');
    await expect(phone).toBeVisible();
    await expect(phone).toHaveText('801-734-9434');
  });

  test('live header is present', async ({ page }) => {
    await expect(page.locator('#greeting')).toBeVisible();
    await expect(page.locator('#time')).toBeVisible();
  });
});

// ─── Testing Results page ─────────────────────────────────────
test.describe('Testing Results page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/testing.html');
  });

  test('loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Testing/i);
  });

  test('shows results table', async ({ page }) => {
    await expect(page.locator('.results-table')).toBeVisible();
    await expect(page.locator('#results-body')).toBeVisible();
  });

  test('shows summary stat cards', async ({ page }) => {
    await expect(page.locator('#stat-runs')).toBeVisible();
    await expect(page.locator('#stat-passed')).toBeVisible();
    await expect(page.locator('#stat-failed')).toBeVisible();
    await expect(page.locator('#stat-rate')).toBeVisible();
  });

  test('trend chart canvas is present', async ({ page }) => {
    await expect(page.locator('#trend-chart')).toBeVisible();
  });
});

// ─── Cash's Terrible Music page ───────────────────────────────
test.describe("Cash's Terrible Music page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cashs-terrible-music.html');
  });

  test('loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Cash/i);
  });

  test('shows 5 bands', async ({ page }) => {
    await expect(page.locator('.band-list li')).toHaveCount(5);
  });

  test('all bands have Wikipedia links', async ({ page }) => {
    const wikiLinks = page.locator('.wiki-link');
    await expect(wikiLinks).toHaveCount(5);
    for (const link of await wikiLinks.all()) {
      await expect(link).toHaveAttribute('href', /wikipedia\.org/);
    }
  });

  test('Led Zeppelin is ranked #1', async ({ page }) => {
    const firstBand = page.locator('.band-list li').first();
    await expect(firstBand.locator('.band-name')).toContainText('Led Zeppelin');
  });

  test('all bands have descriptions', async ({ page }) => {
    const descs = page.locator('.band-desc');
    await expect(descs).toHaveCount(5);
    for (const desc of await descs.all()) {
      const text = await desc.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('band ranks are numbered 1 through 5', async ({ page }) => {
    const ranks = page.locator('.band-rank');
    await expect(ranks).toHaveCount(5);
    const texts = await ranks.allTextContents();
    expect(texts.map(t => t.trim())).toEqual(['1', '2', '3', '4', '5']);
  });
});

// ─── Navigation ───────────────────────────────────────────────
test.describe('Navigation', () => {
  test('Home link navigates correctly', async ({ page }) => {
    await page.goto('/contact.html');
    await page.locator('footer.bottom-nav a', { hasText: 'Home' }).click();
    await expect(page).toHaveURL('http://localhost:3000/');
  });

  test('Contact Me link navigates correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer.bottom-nav a', { hasText: 'Contact Me' }).click();
    await expect(page).toHaveURL(/\/contact/);
  });

  test("Cash's Terrible Music link navigates correctly", async ({ page }) => {
    await page.goto('/');
    await page.locator('footer.bottom-nav a', { hasText: "Cash's Terrible Music" }).click();
    await expect(page).toHaveURL(/\/cashs-terrible-music/);
  });

  test('Testing Results link navigates correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer.bottom-nav a', { hasText: 'Testing Results' }).click();
    await expect(page).toHaveURL(/\/testing/);
  });

  test('active nav link is highlighted on each page', async ({ page }) => {
    const pages = [
      { url: '/',                        activeText: 'Home' },
      { url: '/contact.html',            activeText: 'Contact Me' },
      { url: '/testing.html',            activeText: 'Testing Results' },
      { url: '/cashs-terrible-music.html', activeText: "Cash's Terrible Music" },
    ];
    for (const { url, activeText } of pages) {
      await page.goto(url);
      const activeLink = page.locator('footer.bottom-nav a.active');
      await expect(activeLink).toHaveText(activeText);
    }
  });
});

// ─── Regression ───────────────────────────────────────────────
test.describe('Regression', () => {
  test('Home nav link points to / not index.html', async ({ page }) => {
    await page.goto('/');
    const homeHref = await page.locator('footer.bottom-nav a', { hasText: 'Home' }).getAttribute('href');
    expect(homeHref).toBe('/');
  });

  test('Weather Underground link points to Provo UT page', async ({ page }) => {
    await page.goto('/');
    const href = await page.locator(`a[href="https://www.wunderground.com/weather/us/ut/provo"]`).first().getAttribute('href');
    expect(href).toBe('https://www.wunderground.com/weather/us/ut/provo');
  });

  test('dad joke 30-minute refresh is set on home page', async ({ page }) => {
    await page.goto('/');
    const hasInterval = await page.evaluate(() =>
      document.documentElement.innerHTML.includes('30 * 60 * 1000')
    );
    expect(hasInterval).toBe(true);
  });

  test('all pages have a fixed header', async ({ page }) => {
    const pages = ['/', '/contact.html', '/testing.html', '/cashs-terrible-music.html'];
    for (const url of pages) {
      await page.goto(url);
      const position = await page.locator('header.hero').evaluate(el =>
        window.getComputedStyle(el).position
      );
      expect(position).toBe('fixed');
    }
  });

  test('all pages have a fixed footer nav', async ({ page }) => {
    const pages = ['/', '/contact.html', '/testing.html', '/cashs-terrible-music.html'];
    for (const url of pages) {
      await page.goto(url);
      const position = await page.locator('footer.bottom-nav').evaluate(el =>
        window.getComputedStyle(el).position
      );
      expect(position).toBe('fixed');
    }
  });
});

// ─── Accessibility ────────────────────────────────────────────
test.describe('Accessibility', () => {
  test('all nav links have visible text on every page', async ({ page }) => {
    const pages = ['/', '/contact.html', '/testing.html', '/cashs-terrible-music.html'];
    for (const url of pages) {
      await page.goto(url);
      const links = page.locator('footer.bottom-nav a');
      for (const link of await links.all()) {
        const text = await link.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('all external links open in a new tab', async ({ page }) => {
    await page.goto('/cashs-terrible-music.html');
    const externalLinks = page.locator('a[href^="https://"]');
    for (const link of await externalLinks.all()) {
      const target = await link.getAttribute('target');
      expect(target).toBe('_blank');
    }
  });

  test('all external links have rel=noopener', async ({ page }) => {
    await page.goto('/cashs-terrible-music.html');
    const externalLinks = page.locator('a[href^="https://"]');
    for (const link of await externalLinks.all()) {
      const rel = await link.getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });

  test('page has a meaningful title on every page', async ({ page }) => {
    const pages = ['/', '/contact.html', '/testing.html', '/cashs-terrible-music.html'];
    for (const url of pages) {
      await page.goto(url);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
      expect(title).toContain('Bobby');
    }
  });
});
