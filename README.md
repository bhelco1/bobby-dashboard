# bobby-dashboard

A single-page personal dashboard for Bobby in Provo, UT. Open `bobby-dashboard.html` in any browser — no build step, no install.

## What it shows

- **Local time** — Mountain Time clock with a time-of-day greeting.
- **Weather** — Current conditions for Provo via [Open-Meteo](https://open-meteo.com/) (free, no key). Falls back through public CORS proxies if the direct call is blocked.
- **My Calendar** — Embedded Google Calendar in agenda view. Requires the embedded calendar to be marked publicly viewable in Google Calendar settings.
- **Top news** — Provo and Utah headlines via Google News RSS, routed through public CORS proxies. Falls back to direct links to local news sites (Daily Herald, KSL, Salt Lake Tribune) if the proxies fail.
- **Keto recipe** — A rotating daily pick from a curated list of 16 meat-, egg-, and cheese-forward recipes. "Try another" button rolls a different one.
- **Dad joke** — Setup appears in the top-right above the calendar; punchline waits for you at the very bottom of the page (scroll-and-reveal). Pulled live from the [Official Joke API](https://official-joke-api.appspot.com/) with a curated 20-joke fallback if the API is unreachable. "New joke" button rolls a fresh one.

## How it works

Single self-contained HTML file. All CSS and JavaScript are inline. No build step, no package manager, no server. Open the file in a browser and it runs.

External dependencies (loaded at runtime):

| Feature  | Service                      | Key required? |
|----------|------------------------------|---------------|
| Weather  | api.open-meteo.com           | No            |
| News     | news.google.com/rss          | No            |
| News CORS proxies | api.allorigins.win, corsproxy.io | No |
| Calendar | calendar.google.com (iframe) | No (one-time public-view setting) |
| Dad jokes | official-joke-api.appspot.com    | No            |

## Customizing

- **Recipes** — edit the `RECIPES` array in the inline `<script>`.
- **Weather location** — change `latitude` and `longitude` in the `loadWeather` function (currently 40.2338, -111.6585 for Provo).
- **Time zone** — change `America/Denver` in both the clock and weather URL.
- **Calendar source** — change the `src=` param in the calendar iframe to a different calendar's email/ID.

## Setup notes

The calendar panel only shows live events if the source calendar is set to **"Make available to public"** in Google Calendar settings (Settings and sharing → Access permissions for events).
