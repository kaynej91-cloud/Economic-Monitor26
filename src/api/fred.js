const PROXY = '/api/fred';

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

  const url = new URL(PROXY, window.location.origin);
  url.searchParams.set('path', 'series/observations');
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('observation_start', startDate);
  url.searchParams.set('observation_end', endDate);
  url.searchParams.set('frequency', 'm');
  url.searchParams.set('aggregation_method', 'avg');
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('api_key', apiKey);

  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url.toString());
    if (res.status !== 429) break;
    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
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
