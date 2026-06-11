import type { TimeSeries } from './types'

function findYearAgo(
  obs: { date: string; value: number }[],
  idx: number
): number {
  const target = new Date(obs[idx].date)
  target.setFullYear(target.getFullYear() - 1)
  const targetMs = target.getTime()

  let best = -1
  let bestDiff = Infinity
  for (let i = 0; i < idx; i++) {
    const diff = Math.abs(new Date(obs[i].date).getTime() - targetMs)
    if (diff < bestDiff) {
      bestDiff = diff
      best = i
    }
  }
  // Accept if within 60 days of the target date
  return bestDiff < 60 * 24 * 3600 * 1000 ? best : -1
}

export function yoyPercent(series: TimeSeries): TimeSeries {
  const obs = series.observations
  const result: { date: string; value: number }[] = []
  for (let i = 0; i < obs.length; i++) {
    const prevIdx = findYearAgo(obs, i)
    if (prevIdx < 0 || obs[prevIdx].value === 0) continue
    result.push({
      date: obs[i].date,
      value: ((obs[i].value - obs[prevIdx].value) / Math.abs(obs[prevIdx].value)) * 100,
    })
  }
  return { ...series, observations: result }
}

export function momChange(series: TimeSeries): TimeSeries {
  const obs = series.observations
  const result = obs.slice(1).map((point, i) => ({
    date: point.date,
    value: point.value - obs[i].value,
  }))
  return { ...series, observations: result }
}

export function identity(series: TimeSeries): TimeSeries {
  return series
}

export function applyTransform(
  series: TimeSeries,
  transform: 'yoyPercent' | 'momChange' | 'identity'
): TimeSeries {
  if (transform === 'yoyPercent') return yoyPercent(series)
  if (transform === 'momChange') return momChange(series)
  return identity(series)
}
