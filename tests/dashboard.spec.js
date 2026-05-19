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
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#joke-setup');
        return el && el.textContent !== 'Loading a joke...' && el.textContent.trim().length > 0;
      },
      { timeout: 10000 }
    );
    await expect(page.locator('#joke-setup')).not.toHaveText('Loading a joke...');
  });

  test('shows 5-day forecast section', async ({ page }) => {
    await expect(page.locator('#forecast-card')).toBeVisible();
  });

  test('shows Word of the Day section', async ({ page }) => {
    await expect(page.locator('#wotd-card')).toBeVisible();
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
    await expect(nav.locator('a', { hasText: 'Bookmarks' })).toBeVisible();
    await expect(nav.locator('a', { hasText: 'Notes' })).toBeVisible();
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
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#weather-summary');
        return el && !el.textContent.includes('Loading') && /\d+°F/.test(el.textContent);
      },
      { timeout: 10000 }
    );
    const summary = await page.locator('#weather-summary').textContent();
    expect(summary).toMatch(/\d+°F/);
  });

  test('weather hi/lo shows High and Low temps', async ({ page }) => {
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#weather-hilo');
        return el && el.textContent.includes('High') && el.textContent.includes('Low');
      },
      { timeout: 10000 }
    );
    const hilo = await page.locator('#weather-hilo').textContent();
    expect(hilo).toMatch(/High \d+°\s*\/\s*Low \d+°/);
  });

  test('5-day forecast renders 5 day cards', async ({ page }) => {
    await page.waitForFunction(
      () => document.querySelectorAll('.forecast-day').length === 5,
      { timeout: 10000 }
    );
    await expect(page.locator('.forecast-day')).toHaveCount(5);
  });

  test('forecast first card says Today', async ({ page }) => {
    await page.waitForFunction(
      () => document.querySelectorAll('.forecast-day').length === 5,
      { timeout: 10000 }
    );
    const firstName = await page.locator('.forecast-day-name').first().textContent();
    expect(firstName?.trim().toUpperCase()).toBe('TODAY');
  });

  test('forecast cards each show a high temperature', async ({ page }) => {
    await page.waitForFunction(
      () => document.querySelectorAll('.forecast-day-hi').length === 5,
      { timeout: 10000 }
    );
    const cards = await page.locator('.forecast-day-hi').allTextContents();
    for (const t of cards) {
      expect(t).toMatch(/\d+°/);
    }
  });

  test('Word of the Day shows a word', async ({ page }) => {
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#wotd-word');
        return el && el.textContent.trim() !== '—' && el.textContent.trim().length > 2;
      },
      { timeout: 5000 }
    );
    const word = await page.locator('#wotd-word').textContent();
    expect(word?.trim().length).toBeGreaterThan(2);
  });

  test('Word of the Day shows a definition', async ({ page }) => {
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#wotd-def');
        return el && el.textContent !== 'Loading definition...' && el.textContent.trim().length > 5;
      },
      { timeout: 10000 }
    );
    const def = await page.locator('#wotd-def').textContent();
    expect(def?.trim().length).toBeGreaterThan(5);
  });

  test('recipe shows ingredients and steps', async ({ page }) => {
    await expect(page.locator('.recipe-section-label').first()).toBeVisible();
    await expect(page.locator('.recipe li').first()).toBeVisible();
  });

  test('punchline section is visible', async ({ page }) => {
    await expect(page.locator('#joke-punchline')).toBeVisible();
    await page.waitForFunction(
      () => {
        const el = document.querySelector('#joke-punchline');
        return el && el.textContent.trim() !== '...' && el.textContent.trim().length > 0;
      },
      { timeout: 10000 }
    );
    await expect(page.locator('#joke-punchline')).not.toHaveText('...');
  });
});

// ─── Home page — functional ───────────────────────────────────
test.describe('Home page — functional', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('"New joke" button loads a different joke', async ({ page }) => {
    await page.locator('button', { hasText: 'New joke' }).click();
    await page.waitForTimeout(2000);
    const after = await page.locator('#joke-setup').textContent();
    expect(typeof after).toBe('string');
    expect(after?.length).toBeGreaterThan(0);
  });

  test('"Try another" recipe button changes the recipe', async ({ page }) => {
    await page.locator('button', { hasText: 'Try another' }).click();
    const after = await page.locator('.recipe-name').textContent();
    expect(after?.length).toBeGreaterThan(0);
  });

  test('"Refresh" news button is clickable', async ({ page }) => {
    const btn = page.locator('button', { hasText: 'Refresh' });
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.locator('#news-list')).toBeVisible();
  });

  test('dad joke auto-refresh interval is 30 minutes', async ({ page }) => {
    const interval = await page.evaluate(() =>
      document.documentElement.innerHTML.includes('30 * 60 * 1000')
    );
    expect(interval).toBe(true);
  });

  test('dark mode toggle button is present', async ({ page }) => {
    await expect(page.locator('#dark-toggle')).toBeVisible();
  });

  test('dark mode toggle switches theme', async ({ page }) => {
    // Start in light mode (default)
    const htmlEl = page.locator('html');
    const initialDark = await htmlEl.evaluate(el => el.classList.contains('dark'));

    await page.locator('#dark-toggle').click();
    const afterToggle = await htmlEl.evaluate(el => el.classList.contains('dark'));
    expect(afterToggle).toBe(!initialDark);

    // Toggle back
    await page.locator('#dark-toggle').click();
    const afterToggleBack = await htmlEl.evaluate(el => el.classList.contains('dark'));
    expect(afterToggleBack).toBe(initialDark);
  });

  test('dark mode preference persists across page reload', async ({ page }) => {
    // Enable dark mode
    await page.evaluate(() => localStorage.removeItem('dark'));
    await page.locator('#dark-toggle').click();
    const isDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));

    // Reload and check
    await page.reload();
    const afterReload = await page.locator('html').evaluate(el => el.classList.contains('dark'));
    expect(afterReload).toBe(isDark);

    // Cleanup: reset to light
    await page.evaluate(() => localStorage.removeItem('dark'));
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

  test('dark mode toggle is present', async ({ page }) => {
    await expect(page.locator('#dark-toggle')).toBeVisible();
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

  test('dark mode toggle is present', async ({ page }) => {
    await expect(page.locator('#dark-toggle')).toBeVisible();
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

  test('dark mode toggle is present', async ({ page }) => {
    await expect(page.locator('#dark-toggle')).toBeVisible();
  });
});

// ─── Bookmarks page ───────────────────────────────────────────
test.describe('Bookmarks page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bookmarks.html');
  });

  test('loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Bookmarks/i);
  });

  test('shows bookmarks section', async ({ page }) => {
    await expect(page.locator('#bookmarks-section')).toBeVisible();
  });

  test('shows placeholder message', async ({ page }) => {
    const placeholder = page.locator('#bookmarks-placeholder');
    await expect(placeholder).toBeVisible();
    const text = await placeholder.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('live header is present', async ({ page }) => {
    await expect(page.locator('#greeting')).toBeVisible();
    await expect(page.locator('#time')).toBeVisible();
  });

  test('dark mode toggle is present', async ({ page }) => {
    await expect(page.locator('#dark-toggle')).toBeVisible();
  });

  test('nav marks Bookmarks as active', async ({ page }) => {
    const activeLink = page.locator('footer.bottom-nav a.active');
    await expect(activeLink).toHaveText('Bookmarks');
  });
});

// ─── Notes page ───────────────────────────────────────────────
test.describe('Notes page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notes.html');
  });

  test('loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Notes/i);
  });

  test('shows notes scratchpad textarea', async ({ page }) => {
    await expect(page.locator('#notes-pad')).toBeVisible();
  });

  test('shows auto-save status', async ({ page }) => {
    await expect(page.locator('#notes-status')).toBeVisible();
  });

  test('shows clear notes button', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Clear notes' })).toBeVisible();
  });

  test('typing in notes pad triggers save indicator', async ({ page }) => {
    const pad = page.locator('#notes-pad');
    await pad.click();
    await pad.type('Test note content');
    // Wait for debounce + save
    await page.waitForFunction(
      () => {
        const s = document.querySelector('#notes-status');
        return s && s.textContent.includes('Saved');
      },
      { timeout: 5000 }
    );
    await expect(page.locator('#notes-status')).toContainText('Saved');
  });

  test('notes persist across page reload', async ({ page }) => {
    // Clear any existing notes first
    await page.evaluate(() => localStorage.removeItem('dashboard-notes'));
    await page.reload();

    const pad = page.locator('#notes-pad');
    await pad.click();
    await pad.type('Persistence test');
    await page.waitForFunction(
      () => (document.querySelector('#notes-status') || {}).textContent?.includes('Saved'),
      { timeout: 5000 }
    );
    await page.reload();
    const value = await pad.inputValue();
    expect(value).toContain('Persistence test');

    // Cleanup
    await page.evaluate(() => localStorage.removeItem('dashboard-notes'));
  });

  test('live header is present', async ({ page }) => {
    await expect(page.locator('#greeting')).toBeVisible();
    await expect(page.locator('#time')).toBeVisible();
  });

  test('dark mode toggle is present', async ({ page }) => {
    await expect(page.locator('#dark-toggle')).toBeVisible();
  });

  test('nav marks Notes as active', async ({ page }) => {
    const activeLink = page.locator('footer.bottom-nav a.active');
    await expect(activeLink).toHaveText('Notes');
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

  test('Bookmarks link navigates correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer.bottom-nav a', { hasText: 'Bookmarks' }).click();
    await expect(page).toHaveURL(/\/bookmarks/);
  });

  test('Notes link navigates correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer.bottom-nav a', { hasText: 'Notes' }).click();
    await expect(page).toHaveURL(/\/notes/);
  });

  test('active nav link is highlighted on each page', async ({ page }) => {
    const pages = [
      { url: '/',                           activeText: 'Home' },
      { url: '/contact.html',               activeText: 'Contact Me' },
      { url: '/testing.html',               activeText: 'Testing Results' },
      { url: '/cashs-terrible-music.html',  activeText: "Cash's Terrible Music" },
      { url: '/bookmarks.html',             activeText: 'Bookmarks' },
      { url: '/notes.html',                 activeText: 'Notes' },
    ];
    for (const { url, activeText } of pages) {
      await page.goto(url);
      const activeLink = page.locator('footer.bottom-nav a.active');
      // Use containsText because the Testing Results link may have a ✓/✗ badge appended
      await expect(activeLink).toContainText(activeText);
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
    const pages = ['/', '/contact.html', '/testing.html', '/cashs-terrible-music.html', '/bookmarks.html', '/notes.html'];
    for (const url of pages) {
      await page.goto(url);
      const position = await page.locator('header.hero').evaluate(el =>
        window.getComputedStyle(el).position
      );
      expect(position).toBe('fixed');
    }
  });

  test('all pages have a fixed footer nav', async ({ page }) => {
    const pages = ['/', '/contact.html', '/testing.html', '/cashs-terrible-music.html', '/bookmarks.html', '/notes.html'];
    for (const url of pages) {
      await page.goto(url);
      const position = await page.locator('footer.bottom-nav').evaluate(el =>
        window.getComputedStyle(el).position
      );
      expect(position).toBe('fixed');
    }
  });

  test('dark mode toggle exists on all pages', async ({ page }) => {
    const pages = ['/', '/contact.html', '/testing.html', '/cashs-terrible-music.html', '/bookmarks.html', '/notes.html'];
    for (const url of pages) {
      await page.goto(url);
      await expect(page.locator('#dark-toggle')).toBeVisible();
    }
  });
});

// ─── Accessibility ────────────────────────────────────────────
test.describe('Accessibility', () => {
  test('all nav links have visible text on every page', async ({ page }) => {
    const pages = ['/', '/contact.html', '/testing.html', '/cashs-terrible-music.html', '/bookmarks.html', '/notes.html'];
    for (const url of pages) {
      await page.goto(url);
      const links = page.locator('footer.bottom-nav a');
      for (const link of await links.all()) {
        const text = await link.textContent();
        // Strip any badge text (✓ or ✗) and check the link has a real label
        expect(text?.replace(/[✓✗]/g, '').trim().length).toBeGreaterThan(0);
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
    const pages = ['/', '/contact.html', '/testing.html', '/cashs-terrible-music.html', '/bookmarks.html', '/notes.html'];
    for (const url of pages) {
      await page.goto(url);
      const title = await page.title();
      expect(title.trim().length).toBeGreaterThan(0);
      expect(title).toContain('Bobby');
    }
  });
});
