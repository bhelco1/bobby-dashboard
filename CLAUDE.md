# bobby-dashboard

Personal browser dashboard for Bobby in Provo, UT.

## What it is

Single self-contained `index.html` — all CSS and JS inline. No build step, no framework, no server required. Open the file directly in a browser.

Other HTML files: `projects.html`, `bookmarks.html`, `notes.html`, `contact.html`, `cashs-terrible-music.html`.

## Running

```bash
npm run serve       # serve at http://localhost:3000
npm test            # Playwright tests
npm run test:report # view last test report
```

## Testing

Uses Playwright. Tests live in `tests/`. Always run tests after changes.

```bash
npm test
```

## Key config locations (inside index.html)

- **Weather location** — `latitude`/`longitude` in `loadWeather()` (Provo: 40.2338, -111.6585)
- **Time zone** — `America/Denver` (appears in clock and weather URL)
- **Recipes** — `RECIPES` array in the inline `<script>`
- **Calendar** — `src=` param in the calendar iframe

## Constraints

- No build step — keep it that way. No bundlers, no npm packages added to the page.
- All logic stays inline in the HTML file.
- External services are all free/keyless (Open-Meteo, Google News RSS, Official Joke API).
- CORS proxy fallbacks are already in place for news/weather — don't remove them.

## Deploy

See `deploy.sh`. Nightly test script: `scripts/nightly-test.sh`.

## Projects page

`projects.html` and the home-page Projects card read `project-status/status.json`, built from each
project's `STATUS.json` by `scripts/collect-status.js` and pushed to the Pi by `scripts/sync-status.sh`
(LaunchAgent every 15 min, and at the end of `deploy.sh`). Register projects in
`project-status/registry.json`. Details and the schema: `docs/project-status.md`.
