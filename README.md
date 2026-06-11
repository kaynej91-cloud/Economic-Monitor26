# US Pulse — National Metrics Dashboard

The official statistical record of the United States, made readable. Public-source US political, demographic, and economic data trended to the most recent published release.

## Setup

### 1. API keys (all free)

| Key | Sign-up URL | Env var |
|-----|-------------|----------|
| FRED | https://fred.stlouisfed.org/docs/api/api_key.html | `FRED_API_KEY` |
| Census | https://api.census.gov/data/key_signup.html | `CENSUS_API_KEY` |
| FEC (api.data.gov) | https://api.open.fec.gov/developers | `FEC_API_KEY` |
| Congress.gov | https://api.congress.gov/sign-up | `CONGRESS_API_KEY` |

Treasury FiscalData requires no key.

Copy `.env.example` to `.env.local` and fill in your keys.

### 2. Install and run

```bash
npm install
npm run dev
```

### 3. Deploy to Vercel

Connect this repo to a Vercel project via the GitHub integration. Set the four environment variables in Vercel project settings before the first deploy. Pushes to `main` auto-deploy.

---

## Adding a metric

Add one entry to `lib/catalog.ts`:

```ts
{
  id: 'my-metric',          // URL slug for /metric/[id]
  name: 'My Metric',        // Display name (use agency plain name)
  category: 'economic',     // 'economic' | 'demographic' | 'political'
  unit: '%',
  granularity: 'monthly',
  goodDirection: 'up',      // 'up' | 'down' | 'neutral'
  source: {
    agency: 'BLS',
    program: 'CPS',
    url: 'https://fred.stlouisfed.org/series/MYID',
  },
  seriesId: 'MYID',         // FRED series ID
  transform: 'identity',    // 'identity' | 'yoyPercent' | 'momChange'
  fetchFn: 'fred',          // adapter key
  description: 'One-line description of what this measures.',
},
```

If the source is not on FRED, add an adapter in `lib/sources/` that returns a `TimeSeries` object, register it in `lib/fetchSeries.ts`, and set `fetchFn` to your adapter's key.

---

## Architecture

```
app/                        Next.js 15 App Router
  page.tsx                  Overview (all categories)
  economy/page.tsx
  demographics/page.tsx
  politics/page.tsx
  metric/[id]/page.tsx      Full-screen metric detail with range selector
  api/series/[id]/route.ts  JSON endpoint (used by client-side range changes)
lib/
  catalog.ts               Single registry of all metrics
  types.ts                 TimeSeries and MetricCatalogEntry types
  transforms.ts            yoyPercent, momChange, identity
  fetchSeries.ts           Shared server-side fetch logic
  recessions.ts            USREC recession shading helper
  downsample.ts            Cap daily series at 2,000 points
  sources/
    fred.ts                FRED REST adapter
    treasury.ts            FiscalData adapter
    census.ts              Census ACS adapter
    fec.ts                 FEC campaign finance adapter
    congress.ts            Congress.gov bills adapter
    static.ts              Static JSON reader
components/
  MetricCard.tsx           Card with sparkline (server component)
  TrendChart.tsx           Interactive area chart with recession bands (client)
  RangeSelector.tsx        1Y/5Y/10Y/25Y/Max toggle
  FreshnessStamp.tsx       Observation-date stamp; turns amber if stale
  Nav.tsx                  Sticky header navigation
data/
  party-composition.json   House seat counts 1945–present
  voter-turnout.json       VEP turnout 1980–present
  election-results.json    Presidential popular vote 1976–present
```

## Design tokens

| Token | Value | Use |
|-------|-------|-----|
| `--paper` | `#FFFFFF` | Background |
| `--ink` | `#1B1F23` | Body text |
| `--rule` | `#D6D9DD` | Borders, grid lines |
| `--series` | `#2A5DB0` | Chart line (federal blue) |
| `--good` | `#1E7F4F` | Positive deltas |
| `--bad` | `#B3261E` | Negative deltas |
| `--recession` | `#EFF1F3` | Recession shading bands |

All numerals use IBM Plex Mono with `tabular-nums`. UI text uses Public Sans (USWDS typeface).
