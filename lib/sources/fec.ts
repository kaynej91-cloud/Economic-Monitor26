import type { TimeSeries } from '../types'

const FEC_BASE = 'https://api.open.fec.gov/v1'

const CYCLES = [2008, 2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024]

export async function fetchFECTotals(): Promise<TimeSeries | null> {
  const apiKey = process.env.FEC_API_KEY
  if (!apiKey) {
    console.warn('FEC_API_KEY not set; skipping')
    return null
  }

  const observations: { date: string; value: number }[] = []

  for (const cycle of CYCLES) {
    try {
      // Total receipts across all candidate committees for this cycle
      const url =
        `${FEC_BASE}/totals/candidate/` +
        `?cycle=${cycle}&election_full=true&api_key=${apiKey}&per_page=0`
      const res = await fetch(url, { next: { revalidate: 21600 } })
      if (!res.ok) continue
      const json = await res.json()
      const total: number | undefined = json.pagination?.pages
        ? (json.results as { receipts: number }[])
            .reduce((sum, r) => sum + (r.receipts ?? 0), 0)
        : undefined
      if (total != null && !isNaN(total)) {
        observations.push({ date: `${cycle}-11-01`, value: total / 1e9 })
      }
    } catch {
      // skip cycle
    }
  }

  return {
    metricId: 'campaign-fundraising',
    name: 'Total Campaign Fundraising',
    unit: '$B',
    granularity: 'cycle',
    source: {
      agency: 'FEC',
      program: 'Campaign Finance Totals',
      url: 'https://www.fec.gov/data/',
    },
    lastUpdated: observations.at(-1)?.date ?? '',
    observations,
  }
}
