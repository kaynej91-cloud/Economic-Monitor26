const DIVISORS = {
  currency_billions: 1e9,
  currency: 1,
  percent: 1,
  number_millions: 1e6,
};

export function getChartValue(rawValue, format) {
  if (rawValue === null || rawValue === undefined) return null;
  const divisor = DIVISORS[format] ?? 1;
  return rawValue / divisor;
}

export function getRawFromChart(chartValue, format) {
  if (chartValue === null || chartValue === undefined) return null;
  const divisor = DIVISORS[format] ?? 1;
  return chartValue * divisor;
}

export function formatValue(rawValue, format) {
  if (rawValue === null || rawValue === undefined) return '—';
  switch (format) {
    case 'currency_billions': {
      const b = rawValue / 1e9;
      if (Math.abs(b) >= 1000) return `$${(b / 1000).toFixed(2)}T`;
      return `$${b.toFixed(1)}B`;
    }
    case 'currency':
      return `$${Math.round(rawValue).toLocaleString()}`;
    case 'percent':
      return `${rawValue.toFixed(2)}%`;
    case 'number_millions': {
      const m = rawValue / 1e6;
      if (m >= 1000) return `${(m / 1000).toFixed(2)}B`;
      return `${m.toFixed(1)}M`;
    }
    default:
      return String(rawValue);
  }
}

export function getChartUnit(format) {
  switch (format) {
    case 'currency_billions': return 'Billions USD';
    case 'currency': return 'USD';
    case 'percent': return '%';
    case 'number_millions': return 'Millions';
    default: return '';
  }
}

export function formatAxisTick(value, format) {
  if (value === null || value === undefined) return '';
  switch (format) {
    case 'currency_billions':
      if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}T`;
      return `$${value.toFixed(0)}B`;
    case 'currency':
      if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
      if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value.toFixed(0)}`;
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'number_millions':
      if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}B`;
      return `${value.toFixed(0)}M`;
    default:
      return String(value);
  }
}
