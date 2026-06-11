'use client'

import { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts'
import type { TimeSeries } from '@/lib/types'
import RangeSelector, { type Range } from './RangeSelector'

function filterByRange(
  obs: { date: string; value: number }[],
  range: Range
): { date: string; value: number }[] {
  if (range === 'Max') return obs
  const now = new Date()
  const yearsBack = range === '1Y' ? 1 : range === '5Y' ? 5 : range === '10Y' ? 10 : 25
  const cutoff = new Date(now.getFullYear() - yearsBack, now.getMonth(), now.getDate())
  return obs.filter(o => new Date(o.date) >= cutoff)
}

function formatTick(value: string): string {
  const d = new Date(value + 'T12:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' })
}

function CustomTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
  unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#D6D9DD] px-3 py-2 text-xs font-mono shadow-sm">
      <div className="text-[#6B7280] mb-0.5">{label}</div>
      <div className="font-medium">
        {payload[0].value.toLocaleString('en-US', { maximumFractionDigits: 3 })}
        {unit && <span className="text-[#6B7280] ml-1">{unit}</span>}
      </div>
    </div>
  )
}

interface TrendChartProps {
  series: TimeSeries
  recessionPeriods?: { start: string; end: string }[]
  showRangeSelector?: boolean
  defaultRange?: Range
  height?: number
  isSparkline?: boolean
}

export default function TrendChart({
  series,
  recessionPeriods = [],
  showRangeSelector = false,
  defaultRange = '10Y',
  height = 200,
  isSparkline = false,
}: TrendChartProps) {
  const [range, setRange] = useState<Range>(defaultRange)

  const data = useMemo(
    () => filterByRange(series.observations, range),
    [series.observations, range]
  )

  const recInRange = useMemo(() => {
    if (!data.length) return []
    const first = data[0].date
    const last = data[data.length - 1].date
    return recessionPeriods.filter(r => r.end >= first && r.start <= last)
  }, [recessionPeriods, data])

  const gradientId = `grad-${series.metricId}`

  if (isSparkline) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2A5DB0" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#2A5DB0" stopOpacity={0} />
            </linearGradient>
          </defs>
          {recInRange.map((r, i) => (
            <ReferenceArea key={i} x1={r.start} x2={r.end} fill="#EFF1F3" fillOpacity={1} />
          ))}
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2A5DB0"
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  const values = data.map(o => o.value)
  const minVal = values.length ? Math.min(...values) : 0
  const maxVal = values.length ? Math.max(...values) : 1
  const pad = (maxVal - minVal) * 0.08 || 1

  return (
    <div>
      {showRangeSelector && (
        <div className="flex justify-end mb-3">
          <RangeSelector selected={range} onChange={setRange} />
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2A5DB0" stopOpacity={0.14} />
              <stop offset="95%" stopColor="#2A5DB0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#D6D9DD" strokeOpacity={0.7} />
          {recInRange.map((r, i) => (
            <ReferenceArea key={i} x1={r.start} x2={r.end} fill="#EFF1F3" fillOpacity={1} />
          ))}
          <XAxis
            dataKey="date"
            tickFormatter={formatTick}
            tick={{ fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)', fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#D6D9DD' }}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            domain={[minVal - pad, maxVal + pad]}
            tick={{ fontSize: 11, fontFamily: 'var(--font-ibm-plex-mono)', fill: '#6B7280' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v =>
              Math.abs(v) >= 1000
                ? `${(v / 1000).toFixed(1)}K`
                : v.toLocaleString('en-US', { maximumFractionDigits: 1 })
            }
            width={56}
          />
          <Tooltip
            content={props => (
              <CustomTooltip
                active={props.active}
                payload={props.payload as { value: number }[] | undefined}
                label={props.label}
                unit={series.unit}
              />
            )}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#2A5DB0"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            connectNulls={false}
            animationDuration={150}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
