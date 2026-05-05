const BASE_URL = 'https://api.worldbank.org/v2';

export async function fetchIndicatorData(indicatorId, countryCodes, startYear, endYear) {
  const countryParam = countryCodes.join(';');
  let allPoints = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = `${BASE_URL}/country/${countryParam}/indicator/${indicatorId}?format=json&date=${startYear}:${endYear}&per_page=500&page=${page}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`World Bank API error: HTTP ${res.status}`);
    }

    const json = await res.json();

    if (!Array.isArray(json) || json.length < 2) {
      throw new Error('Unexpected response format from World Bank API');
    }

    if (!json[1]) break;

    totalPages = json[0]?.pages ?? 1;
    allPoints = allPoints.concat(json[1]);
    page++;
  } while (page <= totalPages);

  // Build result keyed by uppercase country code → year → raw value
  const result = {};
  for (const point of allPoints) {
    const code = point.country?.id?.toUpperCase();
    const year = parseInt(point.date, 10);
    if (!code || isNaN(year)) continue;
    if (!result[code]) result[code] = {};
    result[code][year] = point.value; // null when no data for that year
  }

  return result;
}

export async function fetchAvailableCountries() {
  const url = `${BASE_URL}/country?format=json&per_page=300`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json[1] ?? [];
}
