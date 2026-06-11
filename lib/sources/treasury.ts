import type { TimeSeries } from '../types'

const BASE = 'https://api.fiscaldata.treasury.gov/services/api/v1'

export async function fetchTreasuryDebt(): Promise<TimeSeries | null> {
  const url =
    `${BASE}/accounting/od/debt_to_penny` +
    '?fields=record_date,tot_pub_debt_out_amt' +
    '&sort=-record_date' +
    '&page[size]=5000' +
    '&filter=record_date:gte:1993-01-01'

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) return null

  const json = await res.json()

  const observations = (
    json.data as { record_date: string; tot_pub_debt_out_amt: string }[]
  )
    .map(r => ({
      date: r.record_date,
      value: parseFloat(r.tot_pub_debt_out_amt) / 1e12,
    }))
    .filter(o => !isNaN(o.value))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    metricId: 'federal-debt',
    name: 'Total Public Debt Outstanding',
    unit: '$T',
    granularity: 'daily',
    source: {
      agency: 'Treasury',
      program: 'FiscalData — Debt to the Penny',
      url: 'https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/',
    },
    lastUpdated: observations.at(-1)?.date ?? '',
    observations,
  }
}
