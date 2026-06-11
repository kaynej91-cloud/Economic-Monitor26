import type { MetricCatalogEntry, TimeSeries } from './types'
import { applyTransform } from './transforms'
import { fetchFredSeries } from './sources/fred'
import { fetchTreasuryDebt } from './sources/treasury'
import { fetchCensusPovertyRate } from './sources/census'
import { fetchFECTotals } from './sources/fec'
import { fetchCongressBills } from './sources/congress'
import { fetchPartyComposition, fetchVoterTurnout } from './sources/static'
import { downsample } from './downsample'

export async function fetchMetricSeries(
  entry: MetricCatalogEntry
): Promise<TimeSeries | null> {
  let series: TimeSeries | null = null

  switch (entry.fetchFn) {
    case 'fred':
      series = await fetchFredSeries(entry.seriesId!, '1947-01-01')
      if (series && entry.transform) {
        series = applyTransform(series, entry.transform)
      }
      if (series && entry.scale && entry.scale !== 1) {
        series = {
          ...series,
          observations: series.observations.map(o => ({
            date: o.date,
            value: o.value * entry.scale!,
          })),
        }
      }
      break
    case 'treasury':
      series = await fetchTreasuryDebt()
      break
    case 'census-poverty':
      series = await fetchCensusPovertyRate()
      break
    case 'fec-totals':
      series = await fetchFECTotals()
      break
    case 'congress-bills':
      series = await fetchCongressBills()
      break
    case 'static-party':
      series = fetchPartyComposition()
      break
    case 'static-turnout':
      series = fetchVoterTurnout()
      break
    default:
      return null
  }

  if (!series) return null

  series.metricId = entry.id
  series.unit = entry.unit

  if (entry.granularity === 'daily' && series.observations.length > 2000) {
    series.observations = downsample(series.observations, 2000)
  }

  return series
}
