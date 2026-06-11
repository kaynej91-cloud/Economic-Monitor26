import { fetchFredSeries } from './sources/fred'

let cached: { periods: { start: string; end: string }[]; ts: number } | null = null
const TTL = 6 * 3600 * 1000

export async function getRecessionPeriods(): Promise<{ start: string; end: string }[]> {
  if (cached && Date.now() - cached.ts < TTL) return cached.periods

  const series = await fetchFredSeries('USREC', '1950-01-01')
  if (!series) return []

  const periods: { start: string; end: string }[] = []
  let start: string | null = null

  for (const obs of series.observations) {
    if (obs.value === 1 && !start) {
      start = obs.date
    } else if (obs.value === 0 && start) {
      periods.push({ start, end: obs.date })
      start = null
    }
  }
  if (start) {
    periods.push({ start, end: new Date().toISOString().slice(0, 10) })
  }

  cached = { periods, ts: Date.now() }
  return periods
}
