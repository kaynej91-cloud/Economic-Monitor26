import Link from 'next/link'
import type { MetricCatalogEntry, TimeSeries } from '@/lib/types'
import FreshnessStamp from './FreshnessStamp'
import TrendChart from './TrendChart'

interface MetricCardProps {
  entry: MetricCatalogEntry
  series: TimeSeries | null
  isStale?: boolean
}

function formatValue(value: number, unit: string): string {
  if (unit.includes('$T')) return `$${value.toFixed(1)}T`
  if (unit.includes('$B')) return `$${value.toFixed(0)}B`
  if (unit.startsWith('$')) {
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }
  if (unit === 'M') return `${value.toFixed(1)}M`
  if (unit === 'thousands') {
    return value >= 1000
      ? `${(value / 1000).toFixed(1)}M`
      : `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}K`
  }
  if (unit.includes('%')) return `${value.toFixed(1)}%`
  return value.toLocaleString('en-US', { maximumFractionDigits: 1 })
}

export default function MetricCard({ entry, series, isStale }: MetricCardProps) {
  const obs = series?.observations ?? []
  const latest = obs.at(-1)
  const prev = obs.at(-2)
  const delta = latest && prev ? latest.value - prev.value : null

  const deltaPositive = delta !== null && delta > 0
  const deltaColor =
    entry.goodDirection === 'neutral' || delta === null
      ? 'text-[#6B7280]'
      : (entry.goodDirection === 'up') === deltaPositive
      ? 'text-[#1E7F4F]'
      : 'text-[#B3261E]'

  return (
    <Link href={`/metric/${entry.id}`} className="block h-full">
      <div className="border border-[#D6D9DD] p-4 hover:border-[#2A5DB0] transition-colors bg-white h-full flex flex-col group">
        {/* Eyebrow */}
        <div className="text-[10px] font-mono tracking-widest uppercase text-[#6B7280] mb-2 leading-tight">
          {entry.source.agency} · {entry.name}
        </div>

        {/* Latest value */}
        {latest ? (
          <div className="font-mono text-2xl font-medium tabular-nums leading-none mb-1 group-hover:text-[#2A5DB0] transition-colors">
            {formatValue(latest.value, entry.unit)}
          </div>
        ) : (
          <div className="font-mono text-lg text-[#6B7280] leading-none mb-1">—</div>
        )}

        {/* Delta */}
        {delta !== null && (
          <div className={`text-xs font-mono ${deltaColor} mb-3`}>
            {deltaPositive ? '▲' : '▼'}{' '}
            {Math.abs(delta).toLocaleString('en-US', { maximumFractionDigits: 2 })}{' '}
            {entry.unit.split(' ')[0]} vs prior
          </div>
        )}

        {/* Sparkline */}
        <div className="flex-1 min-h-[52px]">
          {series && series.observations.length > 1 && (
            <TrendChart series={series} height={56} isSparkline />
          )}
        </div>

        {/* Freshness stamp */}
        <div className="mt-3 pt-2 border-t border-[#D6D9DD]">
          <FreshnessStamp
            lastUpdated={series?.lastUpdated ?? ''}
            isStale={isStale || !series}
          />
        </div>
      </div>
    </Link>
  )
}
