// ── KPI cards ─────────────────────────────────────────────────────────────
export const KPI_SERIES = [
  { id: 'UNRATE',       label: 'Unemployment Rate',     unit: '%',  decimals: 1, transform: null },
  { id: 'UNEMPLOY',     label: 'Unemployed Persons',    unit: 'K',  decimals: 0, transform: null },
  { id: 'PAYEMS',       label: 'Nonfarm Payrolls (MoM)',unit: 'K',  decimals: 0, transform: 'mom' },
  { id: 'CES0500000003',label: 'Avg Hourly Earnings',   unit: '%',  decimals: 2, transform: 'yoy' },
  { id: 'JTSJOL',       label: 'Job Openings',          unit: 'K',  decimals: 0, transform: null },
  { id: 'IC4WSA',       label: 'Initial Claims (4wk)',  unit: 'K',  decimals: 0, transform: null },
];

// ── View definitions ────────────────────────────────────────────────────────
export const VIEWS = [
  {
    id: 'unemployment',
    label: 'Unemployment',
    metrics: [
      { id: 'UNRATE',      label: 'Unemployment Rate (U-3)',         unit: '%',        decimals: 1 },
      { id: 'U6RATE',      label: 'Broad Unemployment (U-6)',        unit: '%',        decimals: 1 },
      { id: 'U1RATE',      label: 'U-1 (Unemployed 15+ wks, %)',     unit: '%',        decimals: 1 },
      { id: 'U4RATE',      label: 'U-4 (incl. discouraged workers)', unit: '%',        decimals: 1 },
      { id: 'CIVPART',     label: 'Labor Force Participation Rate',  unit: '%',        decimals: 1 },
      { id: 'EMRATIO',     label: 'Employment-Population Ratio',     unit: '%',        decimals: 1 },
      { id: 'LNS12300060', label: 'Prime-Age Emp. Ratio (25–54)',    unit: '%',        decimals: 1 },
      { id: 'UNEMPLOY',    label: 'Unemployed Persons',              unit: 'thousands', decimals: 0 },
      { id: 'UEMP27OV',    label: 'Long-term Unemployed (27+ wks)', unit: 'thousands', decimals: 0 },
      { id: 'UEMPLT5',     label: 'Unemployed < 5 Weeks',           unit: 'thousands', decimals: 0 },
      { id: 'UEMP15OV',    label: 'Unemployed 15+ Weeks',           unit: 'thousands', decimals: 0 },
    ],
    defaultSelected: ['UNRATE', 'U6RATE'],
    allowMulti: true,
    yoyToggle: false,
    momToggle: false,
  },
  {
    id: 'payrolls',
    label: 'Payrolls',
    metrics: [
      { id: 'PAYEMS',    label: 'Total Nonfarm',                  unit: 'thousands', decimals: 0 },
      { id: 'USPRIV',    label: 'Total Private',                  unit: 'thousands', decimals: 0 },
      { id: 'USMINE',    label: 'Mining & Logging',               unit: 'thousands', decimals: 0 },
      { id: 'USCONS',    label: 'Construction',                   unit: 'thousands', decimals: 0 },
      { id: 'MANEMP',    label: 'Manufacturing (Total)',          unit: 'thousands', decimals: 0 },
      { id: 'DMANEMP',   label: 'Manufacturing – Durable Goods',  unit: 'thousands', decimals: 0 },
      { id: 'NDMANEMP',  label: 'Manufacturing – Nondurable',     unit: 'thousands', decimals: 0 },
      { id: 'USTPU',     label: 'Trade, Transport & Utilities',   unit: 'thousands', decimals: 0 },
      { id: 'USRETAIL',  label: 'Retail Trade',                   unit: 'thousands', decimals: 0 },
      { id: 'USWTRADE',  label: 'Wholesale Trade',                unit: 'thousands', decimals: 0 },
      { id: 'USINFO',    label: 'Information',                    unit: 'thousands', decimals: 0 },
      { id: 'USFIRE',    label: 'Financial Activities',           unit: 'thousands', decimals: 0 },
      { id: 'USPBS',     label: 'Professional & Business Svcs',   unit: 'thousands', decimals: 0 },
      { id: 'TEMPHELPS', label: 'Temp Help Services ↑ leading',  unit: 'thousands', decimals: 0 },
      { id: 'USEHS',     label: 'Education & Health Services',    unit: 'thousands', decimals: 0 },
      { id: 'USLAH',     label: 'Leisure & Hospitality',         unit: 'thousands', decimals: 0 },
      { id: 'USOSRV',    label: 'Other Services',                 unit: 'thousands', decimals: 0 },
      { id: 'USGVT',     label: 'Government',                     unit: 'thousands', decimals: 0 },
    ],
    defaultSelected: ['PAYEMS', 'USFIRE', 'USCONS', 'MANEMP'],
    allowMulti: true,
    yoyToggle: false,
    momToggle: true,
  },
  {
    id: 'wages',
    label: 'Wages',
    metrics: [
      { id: 'CES0500000003', label: 'All Private',                   unit: '$', decimals: 2 },
      { id: 'CES1000000003', label: 'Mining & Logging',              unit: '$', decimals: 2 },
      { id: 'CES2000000003', label: 'Construction',                  unit: '$', decimals: 2 },
      { id: 'CES3000000003', label: 'Manufacturing',                 unit: '$', decimals: 2 },
      { id: 'CES4000000003', label: 'Trade, Transport & Utilities',  unit: '$', decimals: 2 },
      { id: 'CES5000000003', label: 'Information',                   unit: '$', decimals: 2 },
      { id: 'CES5500000003', label: 'Financial Activities',          unit: '$', decimals: 2 },
      { id: 'CES6000000003', label: 'Professional & Business Svcs',  unit: '$', decimals: 2 },
      { id: 'CES6500000003', label: 'Education & Health Services',   unit: '$', decimals: 2 },
      { id: 'CES7000000003', label: 'Leisure & Hospitality',        unit: '$', decimals: 2 },
    ],
    defaultSelected: ['CES0500000003', 'CES5500000003'],
    allowMulti: true,
    yoyToggle: true,
    momToggle: false,
  },
  {
    id: 'jolts',
    label: 'JOLTS',
    metrics: [
      { id: 'JTSJOL', label: 'Job Openings',         unit: 'thousands', decimals: 0 },
      { id: 'JTSHIL', label: 'Hires',                unit: 'thousands', decimals: 0 },
      { id: 'JTSQUL', label: 'Quits',                unit: 'thousands', decimals: 0 },
      { id: 'JTSLDL', label: 'Layoffs & Discharges', unit: 'thousands', decimals: 0 },
      { id: 'JTSTSL', label: 'Total Separations',    unit: 'thousands', decimals: 0 },
    ],
    defaultSelected: ['JTSJOL', 'JTSHIL', 'JTSQUL', 'JTSLDL'],
    allowMulti: true,
    yoyToggle: false,
    momToggle: false,
  },
  {
    id: 'claims',
    label: 'Claims',
    metrics: [
      { id: 'IC4WSA',  label: 'Initial Claims – 4wk Avg',   unit: 'thousands', decimals: 0 },
      { id: 'ICSA',    label: 'Initial Claims (weekly)',     unit: 'thousands', decimals: 0 },
      { id: 'CCSA',    label: 'Continued Claims',           unit: 'thousands', decimals: 0 },
      { id: 'INSURED', label: 'Insured Unemployment Rate',  unit: '%',         decimals: 2 },
    ],
    defaultSelected: ['IC4WSA', 'CCSA'],
    allowMulti: true,
    yoyToggle: false,
    momToggle: false,
  },
];

// ── Formatting helpers ─────────────────────────────────────────────────────

export function applyYoY(obs) {
  const result = {};
  for (const key of Object.keys(obs)) {
    const [year, month] = key.split('-').map(Number);
    const priorKey = `${year - 1}-${String(month).padStart(2, '0')}`;
    const curr = obs[key], prior = obs[priorKey];
    if (curr != null && prior != null && prior !== 0) {
      result[key] = ((curr - prior) / Math.abs(prior)) * 100;
    }
  }
  return result;
}

export function applyMoM(obs) {
  const result = {};
  const keys = Object.keys(obs).sort();
  for (let i = 1; i < keys.length; i++) {
    const curr = obs[keys[i]], prev = obs[keys[i - 1]];
    if (curr != null && prev != null) result[keys[i]] = curr - prev;
  }
  return result;
}

export function formatKpiValue(value, kpi, rawObs) {
  if (value == null) return '—';
  if (kpi.unit === '%') return `${value.toFixed(kpi.decimals)}%`;
  if (kpi.unit === 'K') {
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}M`;
    return `${value >= 0 ? '+' : ''}${Math.round(value).toLocaleString()}K`;
  }
  return value.toLocaleString();
}

export function formatAxisValue(value, unit, isTransformed) {
  if (isTransformed) return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === '$') return `$${value.toFixed(2)}`;
  if (unit === 'thousands') {
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}M`;
    return `${Math.round(value / 1)}K`;
  }
  return value.toLocaleString();
}

export function formatTooltipValue(value, metric, isYoY, isMoM) {
  if (value == null) return '—';
  if (isYoY) return `${value >= 0 ? '+' : ''}${value.toFixed(2)}% YoY`;
  if (isMoM) {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${Math.round(value).toLocaleString()}K MoM`;
  }
  if (metric.unit === '%') return `${value.toFixed(metric.decimals)}%`;
  if (metric.unit === '$') return `$${value.toFixed(metric.decimals)}/hr`;
  if (metric.unit === 'thousands') {
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(2)}M`;
    return `${Math.round(value).toLocaleString()}K`;
  }
  return String(value);
}

export function latestValue(obs) {
  const keys = Object.keys(obs).sort();
  for (let i = keys.length - 1; i >= 0; i--) {
    if (obs[keys[i]] != null) return { date: keys[i], value: obs[keys[i]] };
  }
  return null;
}
