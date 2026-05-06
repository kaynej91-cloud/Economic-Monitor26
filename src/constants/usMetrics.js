export const KPI_SERIES = [
  { id: 'FEDFUNDS', label: 'Fed Funds Rate', unit: '%', decimals: 2 },
  { id: 'MORTGAGE30US', label: '30-Yr Mortgage', unit: '%', decimals: 2 },
  { id: 'UNRATE', label: 'Unemployment', unit: '%', decimals: 1 },
  { id: 'CPIAUCSL', label: 'CPI (YoY)', unit: '%', decimals: 2, transform: 'yoy' },
];

export const US_METRIC_CATEGORIES = [
  {
    id: 'rates',
    label: 'Interest Rates',
    metrics: [
      { id: 'FEDFUNDS', label: 'Federal Funds Rate', unit: '%', decimals: 2,
        description: 'Target federal funds rate set by the FOMC' },
      { id: 'MORTGAGE30US', label: '30-Year Fixed Mortgage Rate', unit: '%', decimals: 2,
        description: 'National average 30-year fixed-rate mortgage (Freddie Mac)' },
      { id: 'MORTGAGE15US', label: '15-Year Fixed Mortgage Rate', unit: '%', decimals: 2,
        description: 'National average 15-year fixed-rate mortgage (Freddie Mac)' },
      { id: 'DGS10', label: '10-Year Treasury Yield', unit: '%', decimals: 2,
        description: 'Market yield on 10-year US Treasury constant maturity' },
      { id: 'DGS2', label: '2-Year Treasury Yield', unit: '%', decimals: 2,
        description: 'Market yield on 2-year US Treasury constant maturity' },
      { id: 'T10Y2Y', label: 'Yield Spread (10Y – 2Y)', unit: '%', decimals: 2,
        description: 'Difference between 10-year and 2-year Treasury yields — negative = inverted curve' },
    ],
  },
  {
    id: 'housing',
    label: 'Housing Market',
    metrics: [
      { id: 'CSUSHPISA', label: 'Case-Shiller Home Price Index', unit: 'index', decimals: 1,
        description: 'S&P/Case-Shiller national home price index (Jan 2000 = 100)' },
      { id: 'HOUST', label: 'Housing Starts', unit: 'thousands', decimals: 0,
        description: 'New privately-owned housing units started (seasonally adjusted annual rate)' },
      { id: 'HSN1F', label: 'New Home Sales', unit: 'thousands', decimals: 0,
        description: 'New single-family homes sold (seasonally adjusted annual rate)' },
      { id: 'EXHOSLUSM495S', label: 'Existing Home Sales', unit: 'millions', decimals: 2,
        description: 'Existing homes sold (seasonally adjusted annual rate, millions)' },
      { id: 'MSPUS', label: 'Median Home Sale Price', unit: '$', decimals: 0,
        description: 'Median sales price of houses sold in the US (quarterly)' },
    ],
  },
  {
    id: 'labor',
    label: 'Labor Market',
    metrics: [
      { id: 'UNRATE', label: 'Unemployment Rate', unit: '%', decimals: 1,
        description: 'Civilian unemployment rate, seasonally adjusted' },
      { id: 'PAYEMS', label: 'Nonfarm Payrolls', unit: 'thousands', decimals: 0,
        description: 'Total nonfarm employees, seasonally adjusted (thousands)' },
      { id: 'ICSA', label: 'Initial Jobless Claims', unit: 'thousands', decimals: 0,
        description: 'Initial unemployment insurance claims (4-week moving avg, seasonally adjusted)' },
      { id: 'PSAVERT', label: 'Personal Saving Rate', unit: '%', decimals: 1,
        description: 'Personal saving as a percent of disposable personal income' },
      { id: 'DSPIC96', label: 'Real Disposable Personal Income', unit: '$B', decimals: 0,
        description: 'Real disposable personal income, seasonally adjusted (billions 2017 $)' },
    ],
  },
  {
    id: 'consumer',
    label: 'Consumer',
    metrics: [
      { id: 'UMCSENT', label: 'Consumer Sentiment (UMich)', unit: 'index', decimals: 1,
        description: 'University of Michigan consumer sentiment index' },
      { id: 'RSAFS', label: 'Retail & Food Services Sales', unit: '$M', decimals: 0,
        description: 'Advance retail sales: retail & food services, seasonally adjusted (millions)' },
      { id: 'PCE', label: 'Personal Consumption Expenditures', unit: '$B', decimals: 0,
        description: 'Personal consumption expenditures, seasonally adjusted (billions)' },
    ],
  },
  {
    id: 'credit',
    label: 'Credit & Lending',
    metrics: [
      { id: 'TOTALSL', label: 'Total Consumer Credit', unit: '$B', decimals: 0,
        description: 'Total outstanding consumer credit (auto, student, card), seasonally adjusted (billions)' },
      { id: 'REVOLSL', label: 'Revolving Credit (Cards)', unit: '$B', decimals: 0,
        description: 'Revolving consumer credit outstanding (primarily credit cards, billions)' },
      { id: 'DRCCLACBS', label: 'Credit Card Delinquency Rate', unit: '%', decimals: 2,
        description: 'Delinquency rate on credit card loans at all commercial banks (quarterly)' },
      { id: 'DRSFRMACBS', label: 'Mortgage Delinquency Rate', unit: '%', decimals: 2,
        description: 'Delinquency rate on single-family residential mortgages (quarterly)' },
      { id: 'TDSP', label: 'Household Debt Service Ratio', unit: '%', decimals: 2,
        description: 'Household debt service payments as a % of disposable personal income (quarterly)' },
    ],
  },
  {
    id: 'inflation',
    label: 'Inflation',
    metrics: [
      { id: 'CPIAUCSL', label: 'CPI – All Items', unit: 'index', decimals: 2,
        description: 'Consumer Price Index for all urban consumers (1982-84 = 100)' },
      { id: 'CPILFESL', label: 'Core CPI (ex. Food & Energy)', unit: 'index', decimals: 2,
        description: 'CPI excluding food and energy (1982-84 = 100)' },
      { id: 'PCEPI', label: 'PCE Price Index', unit: 'index', decimals: 2,
        description: "Fed's preferred inflation gauge: Personal Consumption Expenditure price index" },
    ],
  },
];

export const DEFAULT_METRIC = US_METRIC_CATEGORIES[0].metrics[0];

export function findMetric(id) {
  for (const cat of US_METRIC_CATEGORIES) {
    const m = cat.metrics.find((m) => m.id === id);
    if (m) return m;
  }
  return DEFAULT_METRIC;
}

export function applyYoY(observations) {
  const result = {};
  const keys = Object.keys(observations).sort();
  for (const key of keys) {
    const [year, month] = key.split('-').map(Number);
    const priorKey = `${year - 1}-${String(month).padStart(2, '0')}`;
    const curr = observations[key];
    const prior = observations[priorKey];
    if (curr != null && prior != null && prior !== 0) {
      result[key] = ((curr - prior) / prior) * 100;
    }
  }
  return result;
}

export function formatUsValue(value, metric) {
  if (value == null) return '—';
  switch (metric.unit) {
    case '%': return `${value.toFixed(metric.decimals)}%`;
    case '$': return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    case '$B': return `$${(value / 1000).toFixed(1)}T`;
    case '$M': return `$${(value / 1000).toFixed(1)}B`;
    case 'thousands': return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}K`;
    case 'millions': return `${value.toFixed(2)}M`;
    default: return value.toFixed(metric.decimals);
  }
}

export function formatAxisUs(value, unit) {
  if (unit === '%') return `${value.toFixed(1)}%`;
  if (unit === '$B') return `$${(value / 1000).toFixed(0)}T`;
  if (unit === '$M') return `$${(value / 1000).toFixed(0)}B`;
  if (unit === 'thousands') return value >= 1000 ? `${(value / 1000).toFixed(1)}M` : `${value}K`;
  if (unit === 'millions') return `${value.toFixed(1)}M`;
  if (unit === '$') return `$${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
