import { catalog, getMetricsByCategory } from '@/lib/catalog'
import { fetchMetricSeries } from '@/lib/fetchSeries'
import type { MetricCatalogEntry, TimeSeries } from '@/lib/types'
import MetricCard from '@/components/MetricCard'
import Link from 'next/link'

export const revalidate = 21600

async function fetchAll(): Promise<Record<string, TimeSeries | null>> {
  const results = await Promise.allSettled(catalog.map(e => fetchMetricSeries(e)))
  return Object.fromEntries(
    catalog.map((e, i) => [
      e.id,
      results[i].status === 'fulfilled' ? results[i].value : null,
    ])
  )
}

export default async function OverviewPage() {
  const seriesMap = await fetchAll()
  const economic = getMetricsByCategory('economic')
  const demographic = getMetricsByCategory('demographic')
  const political = getMetricsByCategory('political')

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-1">National Metrics</h1>
        <p className="text-sm text-[#6B7280]">
          Official US government statistics trended to the most recent published release.
        </p>
      </div>

      <CategorySection
        title="Economy"
        href="/economy"
        entries={economic}
        seriesMap={seriesMap}
      />
      <CategorySection
        title="Demographics"
        href="/demographics"
        entries={demographic}
        seriesMap={seriesMap}
      />
      <CategorySection
        title="Politics"
        href="/politics"
        entries={political}
        seriesMap={seriesMap}
      />
    </div>
  )
}

function CategorySection({
  title,
  href,
  entries,
  seriesMap,
}: {
  title: string
  href: string
  entries: MetricCatalogEntry[]
  seriesMap: Record<string, TimeSeries | null>
}) {
  return (
    <section className="mb-14">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-xs font-mono tracking-widest uppercase text-[#6B7280]">{title}</h2>
        <Link href={href} className="text-xs font-mono text-[#2A5DB0] hover:underline">
          All {title.toLowerCase()} metrics →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {entries.map(entry => (
          <MetricCard key={entry.id} entry={entry} series={seriesMap[entry.id] ?? null} />
        ))}
      </div>
    </section>
  )
}
