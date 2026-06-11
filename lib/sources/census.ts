import type { TimeSeries } from '../types'

const CENSUS_BASE = 'https://api.census.gov/data'

// 2020 not published (pandemic data-quality issue — design spec §9)
const POVERTY_YEARS = [
  2024, 2023, 2022, 2021, 2019, 2018, 2017, 2016, 2015,
  2014, 2013, 2012, 2011, 2010, 2009, 2008, 2007, 2006, 2005,
]

export async function fetchCensusPovertyRate(): Promise<TimeSeries | null> {
  const apiKey = process.env.CENSUS_API_KEY
  const observations: { date: string; value: number }[] = []

  for (const year of POVERTY_YEARS) {
    try {
      const keyParam = apiKey ? `&key=${apiKey}` : ''
      const url = `${CENSUS_BASE}/${year}/acs/acs1/subject?get=S1701_C03_001E&for=us:1${keyParam}`
      const res = await fetch(url, { next: { revalidate: 21600 } })
      if (!res.ok) continue
      const json = await res.json()
      // Response: [[header], [value, "1"]]
      const raw = json[1]?.[0]
      const value = raw != null ? parseFloat(raw) : NaN
      if (!isNaN(value)) {
        observations.push({ date: `${year}-01-01`, value })
      }
    } catch {
      // skip year on error
    }
  }

  observations.sort((a, b) => a.date.localeCompare(b.date))

  return {
    metricId: 'poverty-rate',
    name: 'Poverty Rate',
    unit: '%',
    granularity: 'annual',
    source: {
      agency: 'Census',
      program: 'ACS 1-Year S1701',
      url: 'https://www.census.gov/programs-surveys/acs',
    },
    lastUpdated: observations.at(-1)?.date ?? '',
    observations,
  }
}
