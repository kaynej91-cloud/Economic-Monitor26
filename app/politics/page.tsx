import { getMetricsByCategory } from '@/lib/catalog'
import { fetchMetricSeries } from '@/lib/fetchSeries'
import MetricCard from '@/components/MetricCard'

export const revalidate = 21600

export default async function PoliticsPage() {
  const metrics = getMetricsByCategory('political')
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
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Politics</h1>
        <p className="text-sm text-[#6B7280]">
          Campaign finance, legislative activity, congressional composition, and voter turnout.
        </p>
        <p className="text-xs text-[#6B7280] font-mono mt-2">
          Release cadence: 2-year election cycle · No interpretation — all deltas shown as neutral
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
