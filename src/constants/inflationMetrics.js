// ── CPI categories with SA / NSA FRED series IDs ─────────────────────────
export const CPI_CATEGORIES = [
  // Headline
  { id: 'headline',      label: 'All Items (Headline)',      group: 'headline', saId: 'CPIAUCSL',       nsaId: 'CPIAUCNS' },
  { id: 'core',          label: 'Core (ex. Food & Energy)',  group: 'headline', saId: 'CPILFESL',       nsaId: 'CPILFENS' },

  // Food
  { id: 'food',          label: 'Food (All)',                group: 'food',     saId: 'CPIUFDSL',       nsaId: 'CPIUFDSNS' },
  { id: 'food_home',     label: 'Food at Home',             group: 'food',     saId: 'CUSR0000SAF11',  nsaId: 'CUUR0000SAF11' },
  { id: 'food_away',     label: 'Food Away from Home',      group: 'food',     saId: 'CUSR0000SEFV',   nsaId: 'CUUR0000SEFV' },

  // Energy
  { id: 'energy',        label: 'Energy (All)',              group: 'energy',   saId: 'CPIENGSL',       nsaId: 'CPIENGNS' },
  { id: 'gasoline',      label: 'Gasoline',                 group: 'energy',   saId: 'CUSR0000SETB01', nsaId: 'CUUR0000SETB01' },
  { id: 'electricity',   label: 'Electricity',              group: 'energy',   saId: 'CUSR0000SEHE',   nsaId: 'CUUR0000SEHE' },
  { id: 'natgas',        label: 'Natural Gas (Piped)',       group: 'energy',   saId: 'CUSR0000SEHE2',  nsaId: 'CUUR0000SEHE2' },

  // Housing / Shelter
  { id: 'shelter',       label: 'Shelter (All)',            group: 'housing',  saId: 'CUSR0000SAH1',   nsaId: 'CUUR0000SAH1' },
  { id: 'rent',          label: 'Rent of Primary Res.',     group: 'housing',  saId: 'CUSR0000SEHA',   nsaId: 'CUUR0000SEHA' },
  { id: 'oer',           label: "Owners' Equiv. Rent",      group: 'housing',  saId: 'CUSR0000SEHC',   nsaId: 'CUUR0000SEHC' },

  // Medical Care
  { id: 'medical',       label: 'Medical Care (All)',       group: 'medical',  saId: 'CPIMEDSL',       nsaId: 'CPIMEDNS' },
  { id: 'med_svc',       label: 'Medical Services',         group: 'medical',  saId: 'CUSR0000SAM2',   nsaId: 'CUUR0000SAM2' },
  { id: 'rx_drugs',      label: 'Prescription Drugs',       group: 'medical',  saId: 'CUSR0000SEMD',   nsaId: 'CUUR0000SEMD' },

  // Vehicles
  { id: 'new_vehicles',  label: 'New Vehicles',             group: 'vehicles', saId: 'CUSR0000SETA01', nsaId: 'CUUR0000SETA01' },
  { id: 'used_cars',     label: 'Used Cars & Trucks',       group: 'vehicles', saId: 'CUSR0000SETA02', nsaId: 'CUUR0000SETA02' },

  // Other
  { id: 'apparel',       label: 'Apparel',                  group: 'other',    saId: 'CPIAPPSL',       nsaId: 'CPIAPPNS' },
  { id: 'transport_svc', label: 'Transportation Services',  group: 'other',    saId: 'CUSR0000SETG',   nsaId: 'CUUR0000SETG' },
  { id: 'airfare',       label: 'Airline Fares',            group: 'other',    saId: 'CUSR0000SETG01', nsaId: 'CUUR0000SETG01' },
  { id: 'recreation',    label: 'Recreation',               group: 'other',    saId: 'CUSR0000SAR',    nsaId: 'CUUR0000SAR' },
  { id: 'edu_comm',      label: 'Education & Comm.',        group: 'other',    saId: 'CUSR0000SAE1',   nsaId: 'CUUR0000SAE1' },
];

export const CPI_GROUPS = [
  { id: 'headline', label: 'Headline' },
  { id: 'food',     label: 'Food' },
  { id: 'energy',   label: 'Energy' },
  { id: 'housing',  label: 'Housing / Shelter' },
  { id: 'medical',  label: 'Medical Care' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'other',    label: 'Other' },
];

// Shown in KPI cards (always YoY %)
export const KPI_CATEGORIES = [
  { id: 'headline', label: 'Headline CPI' },
  { id: 'core',     label: 'Core CPI' },
  { id: 'food',     label: 'Food' },
  { id: 'energy',   label: 'Energy' },
  { id: 'shelter',  label: 'Shelter' },
  { id: 'medical',  label: 'Medical Care' },
];

export const DEFAULT_SELECTED = ['headline', 'core', 'food', 'energy', 'shelter'];

export const DISPLAY_MODES = [
  { id: 'yoy',        label: 'YoY %',      hint: 'Year-over-year % change' },
  { id: 'mom',        label: 'MoM %',      hint: 'Month-over-month % change' },
  { id: 'level',      label: 'Level',      hint: 'Raw CPI index (1982–84 = 100)' },
  { id: 'cumulative', label: 'Cumulative', hint: '% change from a chosen reference date' },
];

// ── Transformation helpers ────────────────────────────────────────────────

export function applyMoM(obs) {
  const sorted = Object.keys(obs).sort();
  const result = {};
  for (let i = 1; i < sorted.length; i++) {
    const curr = obs[sorted[i]];
    const prev = obs[sorted[i - 1]];
    if (curr != null && prev != null && prev !== 0) {
      result[sorted[i]] = ((curr / prev) - 1) * 100;
    }
  }
  return result;
}

export function applyYoY(obs) {
  const result = {};
  for (const [date, val] of Object.entries(obs)) {
    const [y, m] = date.split('-').map(Number);
    const prevDate = `${y - 1}-${String(m).padStart(2, '0')}`;
    const prevVal = obs[prevDate];
    if (val != null && prevVal != null && prevVal !== 0) {
      result[date] = ((val / prevVal) - 1) * 100;
    }
  }
  return result;
}

export function applyCumulative(obs, refDate) {
  const refVal = obs[refDate];
  if (refVal == null) return {};
  const result = {};
  for (const [date, val] of Object.entries(obs)) {
    if (val != null) {
      result[date] = ((val / refVal) - 1) * 100;
    }
  }
  return result;
}

export function latestValue(obs) {
  const keys = Object.keys(obs).sort();
  for (let i = keys.length - 1; i >= 0; i--) {
    if (obs[keys[i]] != null) return { date: keys[i], value: obs[keys[i]] };
  }
  return null;
}

export function seriesId(cat, adjustment) {
  return adjustment === 'sa' ? cat.saId : cat.nsaId;
}
