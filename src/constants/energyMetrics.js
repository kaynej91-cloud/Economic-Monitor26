// ── World Bank indicators ────────────────────────────────────────────────────────
// Electricity data: percentages × (kWh/cap × population) → TWh per source.
export const WB_INDICATORS = {
  total:   'EG.ELC.PROD.KH',  // Electric power consumption per capita (kWh)
  pop:     'SP.POP.TOTL',      // Population total (to compute aggregate TWh)
  nuclear: 'EG.ELC.NUCL.ZS',  // Nuclear (% of total electricity)
  hydro:   'EG.ELC.HYRO.ZS',  // Hydro (% of total electricity)
  fossil:  'EG.ELC.FOSL.ZS',  // Oil + gas + coal (% of total electricity)
  // "Solar / Wind / Geo" is derived: 100 − nuclear − hydro − fossil
};

// ── Electricity sources (World Bank) ───────────────────────────────────────────────
export const ELEC_SOURCES = [
  { id: 'nuclear', label: 'Nuclear',                   color: '#3b82f6' },
  { id: 'hydro',   label: 'Hydroelectric',              color: '#22c55e' },
  { id: 'renew',   label: 'Solar / Wind / Geothermal', color: '#f59e0b' },
  { id: 'fossil',  label: 'Fossil Fuels',               color: '#ef4444' },
];

// ── Crude Oil (EIA API — separate key required) ───────────────────────────────────
// Verify product/activity IDs at https://www.eia.gov/opendata/browser/international
export const OIL_CONFIG = {
  eiaProductId: '55',   // crude oil
  eiaActivityId: '1',   // production
  unit: 'kb/d',
  label: 'Crude Oil Production',
};

// ── Top-20 energy producing countries ────────────────────────────────────────────
// isoNum: ISO 3166-1 numeric — matches geo.id in world-atlas TopoJSON
export const ENERGY_COUNTRIES = [
  { code: 'US', name: 'United States',        isoNum: '840' },
  { code: 'CN', name: 'China',                isoNum: '156' },
  { code: 'RU', name: 'Russia',               isoNum: '643' },
  { code: 'SA', name: 'Saudi Arabia',         isoNum: '682' },
  { code: 'IN', name: 'India',                isoNum: '356' },
  { code: 'CA', name: 'Canada',               isoNum: '124' },
  { code: 'DE', name: 'Germany',              isoNum: '276' },
  { code: 'BR', name: 'Brazil',               isoNum: '076' },
  { code: 'JP', name: 'Japan',                isoNum: '392' },
  { code: 'KR', name: 'South Korea',          isoNum: '410' },
  { code: 'AU', name: 'Australia',            isoNum: '036' },
  { code: 'FR', name: 'France',               isoNum: '250' },
  { code: 'NO', name: 'Norway',               isoNum: '578' },
  { code: 'GB', name: 'United Kingdom',       isoNum: '826' },
  { code: 'IT', name: 'Italy',                isoNum: '380' },
  { code: 'IQ', name: 'Iraq',                 isoNum: '368' },
  { code: 'IR', name: 'Iran',                 isoNum: '364' },
  { code: 'AE', name: 'United Arab Emirates', isoNum: '784' },
  { code: 'MX', name: 'Mexico',               isoNum: '484' },
  { code: 'NG', name: 'Nigeria',              isoNum: '566' },
];

// Maps ISO numeric string → ISO-2 code (for choropleth matching)
export const ISO_NUM_TO_CODE = Object.fromEntries(
  ENERGY_COUNTRIES.map(c => [c.isoNum, c.code])
);
export const CODE_TO_NAME = Object.fromEntries(
  ENERGY_COUNTRIES.map(c => [c.code, c.name])
);

// ── Helpers ───────────────────────────────────────────────────────────────────

// Compute per-source TWh for a single (country, year) from raw WB data maps.
// wbRaw: { total: {CC: {year: val}}, pop: ..., nuclear: ..., hydro: ..., fossil: ... }
export function computeSourceTWh(wbRaw, countryCode, year) {
  const kwhPerCap = wbRaw.total?.[countryCode]?.[year];
  const pop = wbRaw.pop?.[countryCode]?.[year];
  if (kwhPerCap == null || pop == null) return null;
  const totalTWh = (kwhPerCap * pop) / 1e9;

  const nucPct = wbRaw.nuclear?.[countryCode]?.[year] ?? null;
  const hydPct = wbRaw.hydro?.[countryCode]?.[year] ?? null;
  const fosPct = wbRaw.fossil?.[countryCode]?.[year] ?? null;
  const renPct = (nucPct != null && hydPct != null && fosPct != null)
    ? Math.max(0, 100 - nucPct - hydPct - fosPct)
    : null;

  return {
    nuclear: nucPct != null ? (totalTWh * nucPct / 100) : null,
    hydro:   hydPct != null ? (totalTWh * hydPct / 100) : null,
    fossil:  fosPct != null ? (totalTWh * fosPct / 100) : null,
    renew:   renPct != null ? (totalTWh * renPct / 100) : null,
    total:   totalTWh,
  };
}

export function formatTWh(value) {
  if (value == null || isNaN(value)) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(1)} PWh`;
  if (value >= 1)    return `${value.toFixed(0)} TWh`;
  return `${(value * 1000).toFixed(0)} GWh`;
}

export function formatKbd(value) {
  if (value == null || isNaN(value)) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(2)} Mbd`;
  return `${Math.round(value).toLocaleString()} kb/d`;
}
