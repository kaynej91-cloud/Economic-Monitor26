import type { TimeSeries } from '../types'

const CONGRESS_BASE = 'https://api.congress.gov/v3'

// 93rd Congress (1973) through 118th (2023)
const CONGRESS_RANGE = Array.from({ length: 26 }, (_, i) => 93 + i)

export async function fetchCongressBills(): Promise<TimeSeries | null> {
  const apiKey = process.env.CONGRESS_API_KEY
  if (!apiKey) {
    console.warn('CONGRESS_API_KEY not set; skipping')
    return null
  }

  const observations: { date: string; value: number }[] = []

  for (const congress of CONGRESS_RANGE) {
    try {
      // Fetch count of enacted bills (type=enr = Enrolled/Enacted)
      const url =
        `${CONGRESS_BASE}/bill/${congress}` +
        `?api_key=${apiKey}&limit=1&type=enr`
      const res = await fetch(url, { next: { revalidate: 21600 } })
      if (!res.ok) continue
      const json = await res.json()
      const count = json.pagination?.count as number | undefined
      if (count != null) {
        const startYear = 1973 + (congress - 93) * 2
        observations.push({ date: `${startYear}-01-03`, value: count })
      }
    } catch {
      // skip
    }
  }

  return {
    metricId: 'bills-enacted',
    name: 'Bills Enacted per Congress',
    unit: 'bills',
    granularity: 'cycle',
    source: {
      agency: 'Congress.gov',
      program: 'Legislative Activity',
      url: 'https://www.congress.gov/browse-legislation',
    },
    lastUpdated: observations.at(-1)?.date ?? '',
    observations,
  }
}
