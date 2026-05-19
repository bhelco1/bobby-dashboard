// shared.js — common utilities for all Bobby's Dashboard pages
// Included at end of <body> on every page.
// FOUC prevention (dark mode) is handled by an inline <script> in each page's <head>.

// ============================================================
// Dark mode
// ============================================================
function toggleDark() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('dark', isDark ? '1' : '0');
  const btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// Set the correct icon after the DOM loads
(function initDarkUI() {
  const btn = document.getElementById('dark-toggle');
  if (btn) btn.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
})();

// ============================================================
// Clock + Greeting
// ============================================================
function updateTime() {
  const now = new Date();
  const timeEl  = document.getElementById('time');
  const dateEl  = document.getElementById('dateline');
  const calEl   = document.getElementById('cal-month');

  if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', {
    timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit', hour12: true
  });
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', {
    timeZone: 'America/Denver', weekday: 'long', month: 'long', day: 'numeric'
  });
  if (calEl) calEl.textContent = now.toLocaleDateString('en-US', {
    timeZone: 'America/Denver', month: 'long', year: 'numeric'
  });

  const hour = parseInt(now.toLocaleString('en-US', {
    timeZone: 'America/Denver', hour: 'numeric', hour12: false
  }));
  let g;
  if      (hour < 5)  g = 'Up late, Bobby';
  else if (hour < 12) g = 'Good morning, Bobby';
  else if (hour < 17) g = 'Good afternoon, Bobby';
  else if (hour < 21) g = 'Good evening, Bobby';
  else                g = 'Winding down, Bobby';
  const gEl = document.getElementById('greeting');
  if (gEl) gEl.textContent = g;
}

updateTime();
setInterval(updateTime, 30 * 1000);

// ============================================================
// CORS proxy helpers
// ============================================================
const CORS_PROXIES = [
  url => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url),
  url => 'https://corsproxy.io/?' + encodeURIComponent(url)
];

async function fetchJsonWithFallback(url) {
  try {
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (e) {}
  for (const buildProxy of CORS_PROXIES) {
    try {
      const res = await fetch(buildProxy(url));
      if (!res.ok) continue;
      const text = await res.text();
      try { return JSON.parse(text); } catch (e) { continue; }
    } catch (e) {}
  }
  return null;
}

// ============================================================
// Weather (Open-Meteo — Provo UT: 40.2338 N, -111.6585 W)
// Also populates 5-day forecast strip if #forecast-strip exists
// ============================================================
const WEATHER_CODES = {
  0:  { icon: '☀️',  desc: 'Clear' },
  1:  { icon: '🌤️', desc: 'Mostly clear' },
  2:  { icon: '⛅',  desc: 'Partly cloudy' },
  3:  { icon: '☁️',  desc: 'Overcast' },
  45: { icon: '🌫️', desc: 'Fog' },
  48: { icon: '🌫️', desc: 'Freezing fog' },
  51: { icon: '🌦️', desc: 'Light drizzle' },
  53: { icon: '🌦️', desc: 'Drizzle' },
  55: { icon: '🌦️', desc: 'Heavy drizzle' },
  61: { icon: '🌧️', desc: 'Light rain' },
  63: { icon: '🌧️', desc: 'Rain' },
  65: { icon: '🌧️', desc: 'Heavy rain' },
  71: { icon: '🌨️', desc: 'Light snow' },
  73: { icon: '🌨️', desc: 'Snow' },
  75: { icon: '❄️',  desc: 'Heavy snow' },
  80: { icon: '🌦️', desc: 'Rain showers' },
  81: { icon: '🌧️', desc: 'Heavy showers' },
  82: { icon: '⛈️', desc: 'Violent rain' },
  85: { icon: '🌨️', desc: 'Snow showers' },
  86: { icon: '❄️',  desc: 'Heavy snow showers' },
  95: { icon: '⛈️', desc: 'Thunderstorm' },
  96: { icon: '⛈️', desc: 'Thunderstorm w/ hail' },
  99: { icon: '⛈️', desc: 'Severe thunderstorm' }
};

async function loadWeather() {
  const url = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=40.2338&longitude=-111.6585'
    + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m'
    + '&daily=temperature_2m_max,temperature_2m_min,weather_code'
    + '&temperature_unit=fahrenheit&wind_speed_unit=mph'
    + '&timezone=America%2FDenver'
    + '&forecast_days=5';

  const data = await fetchJsonWithFallback(url);

  if (!data || !data.current) {
    const el = document.getElementById('weather-summary');
    if (el) el.textContent = 'Weather unavailable';
    return;
  }

  const c  = data.current;
  const w  = WEATHER_CODES[c.weather_code] || { icon: '🌡️', desc: 'Current conditions' };
  const hi = Math.round(data.daily.temperature_2m_max[0]);
  const lo = Math.round(data.daily.temperature_2m_min[0]);

  const summaryEl = document.getElementById('weather-summary');
  const hiloEl    = document.getElementById('weather-hilo');
  if (summaryEl) summaryEl.textContent = `${w.icon} ${Math.round(c.temperature_2m)}°F · ${w.desc}`;
  if (hiloEl)    hiloEl.textContent    = `High ${hi}° / Low ${lo}°`;

  // 5-day forecast strip (home page only)
  const forecastEl = document.getElementById('forecast-strip');
  if (forecastEl && data.daily && data.daily.time) {
    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    forecastEl.innerHTML = data.daily.time.slice(0, 5).map((dateStr, i) => {
      const d    = new Date(dateStr + 'T12:00:00');
      const name = i === 0 ? 'Today' : DAY_NAMES[d.getDay()];
      const wc   = WEATHER_CODES[data.daily.weather_code[i]] || { icon: '🌡️', desc: '' };
      const fhi  = Math.round(data.daily.temperature_2m_max[i]);
      const flo  = Math.round(data.daily.temperature_2m_min[i]);
      return `<div class="forecast-day">
        <div class="forecast-day-name">${name}</div>
        <div class="forecast-day-icon">${wc.icon}</div>
        <div class="forecast-day-hi">${fhi}°</div>
        <div class="forecast-day-lo">${flo}°</div>
      </div>`;
    }).join('');
  }
}

loadWeather();
setInterval(loadWeather, 30 * 60 * 1000);

// ============================================================
// Pass/fail badge next to "Testing Results" nav link
// ============================================================
async function loadTestBadge() {
  try {
    const res = await fetch('/test-reports/manifest.json?nc=' + Date.now());
    if (!res.ok) return;
    const manifest = await res.json();
    if (!manifest || !manifest.length) return;
    const latest = manifest[0];
    const ok = latest.failed === 0;
    const badge = document.createElement('span');
    badge.className = 'test-badge ' + (ok ? 'pass' : 'fail');
    badge.textContent = ok ? ' ✓' : ' ✗';
    badge.setAttribute('data-test-badge', '1');
    const links = document.querySelectorAll('footer.bottom-nav a');
    for (const link of links) {
      if (link.textContent.includes('Testing Results')) {
        const existing = link.querySelector('[data-test-badge]');
        if (existing) existing.remove();
        link.appendChild(badge);
        break;
      }
    }
  } catch (e) { /* badge is optional */ }
}

loadTestBadge();
