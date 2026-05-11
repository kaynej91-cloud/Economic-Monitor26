const PROXY = '/api/eia';

export function getEiaApiKey() {
  return localStorage.getItem('eia_api_key') ?? '';
}

export function setEiaApiKey(key) {
  localStorage.setItem('eia_api_key', key.trim());
}

// Fetch international crude oil production from EIA API v2.
// Returns { [countryCode]: { [year]: value } }
export async function fetchEiaCrudeOil(countryCodes, startYear, endYear) {
  const apiKey = getEiaApiKey();
  if (!apiKey) throw new Error('EIA_NO_KEY');

  const cacheKey = `eia|oil|${countryCodes.join(',')}|${startYear}|${endYear}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const url = new URL(PROXY, window.location.origin);
  url.searchParams.set('path', 'international/data/');
  // productId 55 = Crude oil, activityId 1 = Production
  // Verify/update these at: https://www.eia.gov/opendata/browser/international
  url.searchParams.append('facets[productId][]', '55');
  url.searchParams.append('facets[activityId][]', '1');
  countryCodes.forEach(c => url.searchParams.append('facets[countryRegionCode][]', c));
  url.searchParams.set('frequency', 'annual');
  url.searchParams.set('data[0]', 'value');
  url.searchParams.set('start', String(startYear));
  url.searchParams.set('end', String(endYear));
  url.searchParams.set('sort[0][column]', 'period');
  url.searchParams.set('sort[0][direction]', 'asc');
  url.searchParams.set('offset', '0');
  url.searchParams.set('length', '5000');
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    if (res.status === 403 || res.status === 401) throw new Error('EIA_BAD_KEY');
    throw new Error(`EIA API error ${res.status}`);
  }
  const json = await res.json();
  if (json.error) throw new Error(`EIA: ${json.error}`);

  const result = {};
  for (const obs of json.response?.data ?? []) {
    const code = obs.countryRegionCode;
    const year = parseInt(obs.period, 10);
    const val = parseFloat(obs.value);
    if (!code || isNaN(year) || isNaN(val)) continue;
    if (!result[code]) result[code] = {};
    result[code][year] = val;
  }

  sessionStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}
