import type { TimeSeries, Granularity } from '../types'

const FRED_BASE = 'https://api.stlouisfed.org/fred'

function mapFrequency(freq: string): Granularity {
  switch (freq) {
    case 'D': return 'daily'
    case 'W': return 'monthly'
    case 'M': return 'monthly'
    case 'Q': return 'quarterly'
    case 'A': return 'annual'
    default: return 'monthly'
  }
}

export async function fetchFredSeries(
  seriesId: string,
  observationStart = '1947-01-01'
): Promise<TimeSeries | null> {
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    console.warn('FRED_API_KEY not set; skipping', seriesId)
    return null
  }

  const revalidate = ['DFF', 'DGS10'].includes(seriesId) ? 3600 : 21600

  const [infoRes, dataRes] = await Promise.all([
    fetch(
      `${FRED_BASE}/series?series_id=${seriesId}&api_key=${apiKey}&file_type=json`,
      { next: { revalidate } }
    ),
    fetch(
      `${FRED_BASE}/series/observations?series_id=${seriesId}&observation_start=${observationStart}&api_key=${apiKey}&file_type=json`,
      { next: { revalidate } }
    ),
  ])

  if (!infoRes.ok || !dataRes.ok) {
    console.error(`FRED fetch failed for ${seriesId}: info=${infoRes.status} data=${dataRes.status}`)
    return null
  }

  const [info, data] = await Promise.all([infoRes.json(), dataRes.json()])

  const srs = info.seriess?.[0]
  if (!srs) return null

  const observations = (data.observations as { date: string; value: string }[])
    .filter(o => o.value !== '.' && o.value !== 'ND')
    .map(o => ({ date: o.date, value: parseFloat(o.value) }))
    .filter(o => !isNaN(o.value))

  return {
    metricId: seriesId,
    name: srs.title,
    unit: srs.units_short || srs.units || '',
    granularity: mapFrequency(srs.frequency_short),
    source: {
      agency: srs.source || 'FRED',
      program: srs.title,
      url: `https://fred.stlouisfed.org/series/${seriesId}`,
    },
    lastUpdated: (srs.last_updated as string)?.split(' ')[0] ?? '',
    observations,
  }
}
