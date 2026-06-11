export type Granularity = 'daily' | 'monthly' | 'quarterly' | 'annual' | 'cycle'

export type TimeSeries = {
  metricId: string
  name: string
  unit: string
  granularity: Granularity
  source: { agency: string; program: string; url: string }
  lastUpdated: string
  observations: { date: string; value: number }[]
}

export type MetricCatalogEntry = {
  id: string
  name: string
  category: 'economic' | 'demographic' | 'political'
  unit: string
  granularity: Granularity
  goodDirection: 'up' | 'down' | 'neutral'
  source: { agency: string; program: string; url: string }
  seriesId?: string
  transform?: 'yoyPercent' | 'momChange' | 'identity'
  fetchFn: string
  scale?: number
  description?: string
}
