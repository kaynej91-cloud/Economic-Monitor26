// Coverage notes:
//   ✓ broad  — data available for virtually all countries in this list
//   ~ partial — data available for most countries; some gaps, especially recent years
//   ⚠ limited — only a subset of countries report this to the World Bank

export const INDICATORS = [
  {
    id: 'NY.GDP.MKTP.KD.ZG',
    label: 'GDP Growth Rate',
    description: 'GDP growth (annual %)',
    format: 'percent',
    coverage: 'broad',
  },
  {
    id: 'NY.GDP.MKTP.CD',
    label: 'GDP',
    description: 'Gross Domestic Product (current US$)',
    format: 'currency_billions',
    coverage: 'broad',
  },
  {
    id: 'NY.GDP.PCAP.CD',
    label: 'GDP Per Capita',
    description: 'GDP per capita (current US$)',
    format: 'currency',
    coverage: 'broad',
  },
  {
    id: 'SL.UEM.TOTL.ZS',
    label: 'Unemployment Rate',
    description: 'Unemployment, total (% of total labor force, modeled ILO estimate)',
    format: 'percent',
    coverage: 'broad',
  },
  {
    id: 'FP.CPI.TOTL.ZG',
    label: 'Inflation Rate',
    description: 'Consumer price inflation (annual %)',
    format: 'percent',
    coverage: 'broad',
  },
  {
    id: 'BN.CAB.XOKA.GD.ZS',
    label: 'Current Account Balance (% of GDP)',
    description: 'Current account balance as a percentage of GDP — measures net trade in goods, services, and transfers',
    format: 'percent',
    coverage: 'broad',
  },
  {
    id: 'NE.TRD.GNFS.ZS',
    label: 'Trade (% of GDP)',
    description: 'Exports plus imports as a percentage of GDP',
    format: 'percent',
    coverage: 'broad',
  },
  {
    id: 'NE.EXP.GNFS.ZS',
    label: 'Exports (% of GDP)',
    description: 'Exports of goods and services as a percentage of GDP',
    format: 'percent',
    coverage: 'broad',
  },
  {
    id: 'NE.IMP.GNFS.ZS',
    label: 'Imports (% of GDP)',
    description: 'Imports of goods and services as a percentage of GDP',
    format: 'percent',
    coverage: 'broad',
  },
  {
    id: 'NY.GNS.ICTR.ZS',
    label: 'Gross Savings (% of GDP)',
    description: 'Gross savings as a percentage of GDP',
    format: 'percent',
    coverage: 'broad',
  },
  {
    id: 'BX.KLT.DINV.WD.GD.ZS',
    label: 'FDI Inflows (% of GDP)',
    description: 'Foreign direct investment, net inflows as a percentage of GDP',
    format: 'percent',
    coverage: 'broad',
  },
  {
    id: 'SP.POP.TOTL',
    label: 'Population',
    description: 'Total population',
    format: 'number_millions',
    coverage: 'broad',
  },
  {
    id: 'SH.XPD.CHEX.GD.ZS',
    label: 'Health Expenditure (% of GDP)',
    description: 'Current health expenditure as a percentage of GDP',
    format: 'percent',
    coverage: 'partial',
  },
  {
    id: 'SE.XPD.TOTL.GD.ZS',
    label: 'Education Expenditure (% of GDP)',
    description: 'Government expenditure on education as a percentage of GDP',
    format: 'percent',
    coverage: 'partial',
  },
  {
    id: 'MS.MIL.XPND.GD.ZS',
    label: 'Military Expenditure (% of GDP)',
    description: 'Military expenditure as a percentage of GDP (SIPRI data)',
    format: 'percent',
    coverage: 'broad',
  },
  {
    id: 'GC.DOD.TOTL.GD.ZS',
    label: 'Central Govt Debt (% of GDP)',
    description: 'Central government debt as % of GDP — reported via IMF/GFS; sparse for high-income nations (Germany, Japan, etc. are not covered)',
    format: 'percent',
    coverage: 'limited',
  },
];
