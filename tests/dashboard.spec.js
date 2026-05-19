// @ts-check
const { test, expect } = require('@playwright/test');

// ─── Home page ────────────────────────────────────────────────
test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
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
    const weather = page.locator('#weather-summary');
    await expect(weather).toBeVisible();
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
    const joke = page.locator('#joke-setup');
    await expect(joke).toBeVisible();
    await expect(joke).not.toHaveText('Loading a joke...');
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
    const bands = page.locator('.band-list li');
    await expect(bands).toHaveCount(5);
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
});
