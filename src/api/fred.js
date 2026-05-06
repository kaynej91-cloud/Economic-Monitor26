const FRED_BASE = 'https://api.stlouisfed.org/fred';

export function getFredApiKey() {
  return localStorage.getItem('fred_api_key') ?? '';
}

export function setFredApiKey(key) {
  localStorage.setItem('fred_api_key', key.trim());
}

function ck(...parts) {
  return `fred|${parts.join('|')}`;
}

export async function fetchSeries(seriesId, startDate, endDate) {
  const apiKey = getFredApiKey();
  if (!apiKey) throw new Error('FRED_NO_KEY');

  const cacheKey = ck(seriesId, startDate, endDate);
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const url = new URL(`${FRED_BASE}/series/observations`);
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('observation_start', startDate);
  url.searchParams.set('observation_end', endDate);
  url.searchParams.set('frequency', 'm');
  url.searchParams.set('aggregation_method', 'avg');
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 400 || res.status === 403) throw new Error('FRED_BAD_KEY');
    throw new Error(`FRED API error ${res.status}`);
  }
  const json = await res.json();
  if (json.error_code) throw new Error(`FRED: ${json.error_message}`);

  const result = {};
  for (const obs of json.observations ?? []) {
    if (obs.value !== '.') {
      result[obs.date.slice(0, 7)] = parseFloat(obs.value);
    }
  }

  sessionStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}

export async function searchCountySeries(countyName, stateName) {
  const apiKey = getFredApiKey();
  if (!apiKey) throw new Error('FRED_NO_KEY');

  const query = `${countyName} ${stateName} Unemployment Rate`;
  const cacheKey = ck('search', query);
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const url = new URL(`${FRED_BASE}/series/search`);
  url.searchParams.set('search_text', query);
  url.searchParams.set('search_type', 'full_text');
  url.searchParams.set('limit', '10');
  url.searchParams.set('order_by', 'search_rank');
  url.searchParams.set('filter_variable', 'frequency');
  url.searchParams.set('filter_value', 'Monthly');
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`FRED search error ${res.status}`);
  const json = await res.json();

  // Find best match — prefer series with "Unemployment Rate" in title and monthly frequency
  const series = (json.seriess ?? []).find(
    (s) =>
      s.title.toLowerCase().includes('unemployment') &&
      s.title.toLowerCase().includes(countyName.toLowerCase().replace(' county', ''))
  );

  const result = series ?? null;
  sessionStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}
