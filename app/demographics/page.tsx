import { getMetricsByCategory } from '@/lib/catalog'
import { fetchMetricSeries } from '@/lib/fetchSeries'
import MetricCard from '@/components/MetricCard'

export const revalidate = 21600

export default async function DemographicsPage() {
  const metrics = getMetricsByCategory('demographic')
  const results = await Promise.allSettled(metrics.map(m => fetchMetricSeries(m)))
  const seriesMap = Object.fromEntries(
    metrics.map((m, i) => [
      m.id,
      results[i].status === 'fulfilled' ? results[i].value : null,
    ])
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Demographics</h1>
        <p className="text-sm text-[#6B7280]">
          Population, poverty, housing, and educational statistics from Census Bureau and BEA.
        </p>
        <p className="text-xs text-[#6B7280] font-mono mt-2">
          Release cadence: ACS series — annual (released ~September) · 2020 ACS not published (pandemic gap) · Homeownership — quarterly
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map(entry => (
          <MetricCard key={entry.id} entry={entry} series={seriesMap[entry.id] ?? null} />
        ))}
      </div>
    </div>
  )
}
