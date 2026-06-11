import { NextRequest, NextResponse } from 'next/server'
import { getMetric } from '@/lib/catalog'
import { fetchMetricSeries } from '@/lib/fetchSeries'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const metric = getMetric(id)

  if (!metric) {
    return NextResponse.json({ error: 'Metric not found' }, { status: 404 })
  }

  const series = await fetchMetricSeries(metric)

  if (!series) {
    return NextResponse.json(
      { error: `Data unavailable from ${metric.source.agency}` },
      { status: 502 }
    )
  }

  const revalidate = metric.granularity === 'daily' ? 3600 : 21600

  return NextResponse.json(series, {
    headers: {
      'Cache-Control': `s-maxage=${revalidate}, stale-while-revalidate=86400`,
    },
  })
}
