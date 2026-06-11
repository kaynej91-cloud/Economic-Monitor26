import { notFound } from 'next/navigation'
import Link from 'next/link'
import { catalog, getMetric } from '@/lib/catalog'
import { fetchMetricSeries } from '@/lib/fetchSeries'
import { getRecessionPeriods } from '@/lib/recessions'
import TrendChart from '@/components/TrendChart'
import FreshnessStamp from '@/components/FreshnessStamp'

export const revalidate = 3600

export async function generateStaticParams() {
  return catalog.map(m => ({ id: m.id }))
}

function formatLatest(value: number, unit: string): string {
  if (unit.includes('$T')) return `$${value.toFixed(2)}T`
  if (unit.includes('$B')) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}B`
  if (unit.startsWith('$')) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (unit.includes('%')) return `${value.toFixed(2)}%`
  if (unit === 'thousands') return value >= 1000
    ? `${(value / 1000).toFixed(2)}M`
    : `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}K`
  if (unit === 'M') return `${value.toFixed(1)}M`
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export default async function MetricDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const metric = getMetric(id)
  if (!metric) notFound()

  const [series, recessionPeriods] = await Promise.all([
    fetchMetricSeries(metric),
    metric.category === 'economic' ? getRecessionPeriods() : Promise.resolve([]),
  ])

  const latest = series?.observations.at(-1)
  const prev = series?.observations.at(-2)
  const delta = latest && prev ? latest.value - prev.value : null

  const categoryLabel =
    metric.category.charAt(0).toUpperCase() + metric.category.slice(1)
  const categoryHref = `/${metric.category === 'demographic' ? 'demographics' : metric.category}`

  return (
    <div className="max-w-4xl">
      <div className="mb-3">
        <Link
          href={categoryHref}
          className="text-xs font-mono text-[#6B7280] hover:text-[#2A5DB0] transition-colors"
        >
          ← {categoryLabel}
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="text-[10px] font-mono tracking-widest uppercase text-[#6B7280] mb-1">
            {metric.source.agency} · {metric.source.program}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{metric.name}</h1>
          {metric.description && (
            <p className="text-sm text-[#6B7280] mt-1 max-w-xl">{metric.description}</p>
          )}
        </div>
        {series && <FreshnessStamp lastUpdated={series.lastUpdated} />}
      </div>

      {latest ? (
        <div className="mb-6 flex items-baseline gap-4">
          <span className="font-mono text-5xl font-medium tabular-nums">
            {formatLatest(latest.value, metric.unit)}
          </span>
          {delta !== null && (
            <span
              className={`text-sm font-mono ${
                metric.goodDirection === 'neutral'
                  ? 'text-[#6B7280]'
                  : (metric.goodDirection === 'up') === delta > 0
                  ? 'text-[#1E7F4F]'
                  : 'text-[#B3261E]'
              }`}
            >
              {delta >= 0 ? '▲' : '▼'}{' '}
              {Math.abs(delta).toLocaleString('en-US', { maximumFractionDigits: 3 })}{' '}
              {metric.unit.split(' ')[0]} vs prior
            </span>
          )}
        </div>
      ) : (
        <div className="mb-6 text-[#6B7280] font-mono">
          Latest data unavailable from {metric.source.agency}.
        </div>
      )}

      {series && series.observations.length > 0 ? (
        <div className="border border-[#D6D9DD] p-4 mb-6">
          <TrendChart
            series={series}
            recessionPeriods={recessionPeriods}
            showRangeSelector
            defaultRange="10Y"
            height={320}
          />
        </div>
      ) : (
        <div className="border border-[#D6D9DD] p-10 text-center text-[#6B7280] font-mono text-sm mb-6">
          Latest data unavailable from {metric.source.agency}. Showing last retrieved values.
        </div>
      )}

      <div className="border border-[#D6D9DD] p-5">
        <h3 className="text-[10px] font-mono tracking-widest uppercase text-[#6B7280] mb-4">Source</h3>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-xs font-mono">
          <dt className="text-[#6B7280]">Agency</dt>
          <dd>{metric.source.agency}</dd>
          <dt className="text-[#6B7280]">Program</dt>
          <dd>{metric.source.program}</dd>
          {metric.seriesId && (
            <>
              <dt className="text-[#6B7280]">Series ID</dt>
              <dd>
                <a
                  href={metric.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2A5DB0] hover:underline"
                >
                  {metric.seriesId}
                </a>
              </dd>
            </>
          )}
          <dt className="text-[#6B7280]">Granularity</dt>
          <dd className="capitalize">{metric.granularity}</dd>
          {series && (
            <>
              <dt className="text-[#6B7280]">Last observation</dt>
              <dd>{series.lastUpdated}</dd>
              <dt className="text-[#6B7280]">Observations</dt>
              <dd>{series.observations.length.toLocaleString()}</dd>
            </>
          )}
          <dt className="text-[#6B7280]">Source URL</dt>
          <dd>
            <a
              href={metric.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2A5DB0] hover:underline break-all"
            >
              {metric.source.url}
            </a>
          </dd>
        </dl>
      </div>
    </div>
  )
}
