import { getMetricsByCategory } from '@/lib/catalog'
import { fetchMetricSeries } from '@/lib/fetchSeries'
import MetricCard from '@/components/MetricCard'

export const revalidate = 21600

export default async function EconomyPage() {
  const metrics = getMetricsByCategory('economic')
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
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Economy</h1>
        <p className="text-sm text-[#6B7280]">
          Macroeconomic indicators from BLS, BEA, Federal Reserve, and Treasury.
        </p>
        <p className="text-xs text-[#6B7280] font-mono mt-2">
          Release cadence: CPI, payrolls, unemployment — monthly · GDP — quarterly · Fed funds, Treasury yield, debt — daily
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {metrics.map(entry => (
          <MetricCard key={entry.id} entry={entry} series={seriesMap[entry.id] ?? null} />
        ))}
      </div>
    </div>
  )
}
