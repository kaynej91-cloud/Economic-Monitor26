import type { TimeSeries } from '../types'
import partyData from '@/data/party-composition.json'
import turnoutData from '@/data/voter-turnout.json'

type PartyRecord = { congress: number; year: number; dem: number; rep: number }
type TurnoutRecord = { year: number; election: string; turnout: number }

export function fetchPartyComposition(): TimeSeries {
  const data = partyData as { source: string; retrieved: string; data: PartyRecord[] }
  return {
    metricId: 'party-composition',
    name: 'House Party Composition (Democratic Seats)',
    unit: 'D seats',
    granularity: 'cycle',
    source: {
      agency: 'House.gov',
      program: 'Historical Party Divisions',
      url: 'https://history.house.gov/Institution/Party-Divisions/Party-Divisions/',
    },
    lastUpdated: data.retrieved,
    observations: data.data.map(d => ({ date: `${d.year}-01-03`, value: d.dem })),
  }
}

export function fetchVoterTurnout(): TimeSeries {
  const data = turnoutData as { source: string; retrieved: string; data: TurnoutRecord[] }
  return {
    metricId: 'voter-turnout',
    name: 'Voter Turnout (VEP)',
    unit: '%',
    granularity: 'cycle',
    source: {
      agency: 'Census',
      program: 'CPS Voting Supplement',
      url: 'https://www.census.gov/topics/public-sector/voting.html',
    },
    lastUpdated: data.retrieved,
    observations: data.data.map(d => ({ date: `${d.year}-11-01`, value: d.turnout })),
  }
}
