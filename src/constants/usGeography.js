export const US_STATES = [
  { code: 'AL', name: 'Alabama', fredSeries: 'ALUR' },
  { code: 'AK', name: 'Alaska', fredSeries: 'AKUR' },
  { code: 'AZ', name: 'Arizona', fredSeries: 'AZUR' },
  { code: 'AR', name: 'Arkansas', fredSeries: 'ARUR' },
  { code: 'CA', name: 'California', fredSeries: 'CAUR' },
  { code: 'CO', name: 'Colorado', fredSeries: 'COUR' },
  { code: 'CT', name: 'Connecticut', fredSeries: 'CTUR' },
  { code: 'DE', name: 'Delaware', fredSeries: 'DEUR' },
  { code: 'FL', name: 'Florida', fredSeries: 'FLUR' },
  { code: 'GA', name: 'Georgia', fredSeries: 'GAUR' },
  { code: 'HI', name: 'Hawaii', fredSeries: 'HIUR' },
  { code: 'ID', name: 'Idaho', fredSeries: 'IDUR' },
  { code: 'IL', name: 'Illinois', fredSeries: 'ILUR' },
  { code: 'IN', name: 'Indiana', fredSeries: 'INUR' },
  { code: 'IA', name: 'Iowa', fredSeries: 'IAUR' },
  { code: 'KS', name: 'Kansas', fredSeries: 'KSUR' },
  { code: 'KY', name: 'Kentucky', fredSeries: 'KYUR' },
  { code: 'LA', name: 'Louisiana', fredSeries: 'LAUR' },
  { code: 'ME', name: 'Maine', fredSeries: 'MEUR' },
  { code: 'MD', name: 'Maryland', fredSeries: 'MDUR' },
  { code: 'MA', name: 'Massachusetts', fredSeries: 'MAUR' },
  { code: 'MI', name: 'Michigan', fredSeries: 'MIUR' },
  { code: 'MN', name: 'Minnesota', fredSeries: 'MNUR' },
  { code: 'MS', name: 'Mississippi', fredSeries: 'MSUR' },
  { code: 'MO', name: 'Missouri', fredSeries: 'MOUR' },
  { code: 'MT', name: 'Montana', fredSeries: 'MTUR' },
  { code: 'NE', name: 'Nebraska', fredSeries: 'NEUR' },
  { code: 'NV', name: 'Nevada', fredSeries: 'NVUR' },
  { code: 'NH', name: 'New Hampshire', fredSeries: 'NHUR' },
  { code: 'NJ', name: 'New Jersey', fredSeries: 'NJUR' },
  { code: 'NM', name: 'New Mexico', fredSeries: 'NMUR' },
  { code: 'NY', name: 'New York', fredSeries: 'NYUR' },
  { code: 'NC', name: 'North Carolina', fredSeries: 'NCUR' },
  { code: 'ND', name: 'North Dakota', fredSeries: 'NDUR' },
  { code: 'OH', name: 'Ohio', fredSeries: 'OHUR' },
  { code: 'OK', name: 'Oklahoma', fredSeries: 'OKUR' },
  { code: 'OR', name: 'Oregon', fredSeries: 'ORUR' },
  { code: 'PA', name: 'Pennsylvania', fredSeries: 'PAUR' },
  { code: 'RI', name: 'Rhode Island', fredSeries: 'RIUR' },
  { code: 'SC', name: 'South Carolina', fredSeries: 'SCUR' },
  { code: 'SD', name: 'South Dakota', fredSeries: 'SDUR' },
  { code: 'TN', name: 'Tennessee', fredSeries: 'TNUR' },
  { code: 'TX', name: 'Texas', fredSeries: 'TXUR' },
  { code: 'UT', name: 'Utah', fredSeries: 'UTUR' },
  { code: 'VT', name: 'Vermont', fredSeries: 'VTUR' },
  { code: 'VA', name: 'Virginia', fredSeries: 'VAUR' },
  { code: 'WA', name: 'Washington', fredSeries: 'WAUR' },
  { code: 'WV', name: 'West Virginia', fredSeries: 'WVUR' },
  { code: 'WI', name: 'Wisconsin', fredSeries: 'WIUR' },
  { code: 'WY', name: 'Wyoming', fredSeries: 'WYUR' },
];

// Top ~100 US counties by population with FIPS codes
// FRED will be searched dynamically for their unemployment series
export const US_COUNTIES = [
  // California
  { fips: '06037', name: 'Los Angeles County', state: 'CA' },
  { fips: '06073', name: 'San Diego County', state: 'CA' },
  { fips: '06059', name: 'Orange County', state: 'CA' },
  { fips: '06065', name: 'Riverside County', state: 'CA' },
  { fips: '06071', name: 'San Bernardino County', state: 'CA' },
  { fips: '06085', name: 'Santa Clara County', state: 'CA' },
  { fips: '06001', name: 'Alameda County', state: 'CA' },
  { fips: '06067', name: 'Sacramento County', state: 'CA' },
  { fips: '06013', name: 'Contra Costa County', state: 'CA' },
  { fips: '06019', name: 'Fresno County', state: 'CA' },
  { fips: '06111', name: 'Ventura County', state: 'CA' },
  { fips: '06077', name: 'San Joaquin County', state: 'CA' },
  // Texas
  { fips: '48201', name: 'Harris County', state: 'TX' },
  { fips: '48113', name: 'Dallas County', state: 'TX' },
  { fips: '48439', name: 'Tarrant County', state: 'TX' },
  { fips: '48029', name: 'Bexar County', state: 'TX' },
  { fips: '48453', name: 'Travis County', state: 'TX' },
  { fips: '48085', name: 'Collin County', state: 'TX' },
  { fips: '48141', name: 'El Paso County', state: 'TX' },
  { fips: '48121', name: 'Denton County', state: 'TX' },
  // Florida
  { fips: '12086', name: 'Miami-Dade County', state: 'FL' },
  { fips: '12011', name: 'Broward County', state: 'FL' },
  { fips: '12099', name: 'Palm Beach County', state: 'FL' },
  { fips: '12057', name: 'Hillsborough County', state: 'FL' },
  { fips: '12103', name: 'Pinellas County', state: 'FL' },
  { fips: '12095', name: 'Orange County', state: 'FL' },
  { fips: '12031', name: 'Duval County', state: 'FL' },
  { fips: '12071', name: 'Lee County', state: 'FL' },
  // New York
  { fips: '36081', name: 'Queens County', state: 'NY' },
  { fips: '36047', name: 'Kings County', state: 'NY' },
  { fips: '36061', name: 'New York County', state: 'NY' },
  { fips: '36005', name: 'Bronx County', state: 'NY' },
  { fips: '36103', name: 'Suffolk County', state: 'NY' },
  { fips: '36059', name: 'Nassau County', state: 'NY' },
  { fips: '36119', name: 'Westchester County', state: 'NY' },
  { fips: '36055', name: 'Monroe County', state: 'NY' },
  // Illinois
  { fips: '17031', name: 'Cook County', state: 'IL' },
  { fips: '17043', name: 'DuPage County', state: 'IL' },
  { fips: '17197', name: 'Will County', state: 'IL' },
  { fips: '17089', name: 'Kane County', state: 'IL' },
  // Arizona
  { fips: '04013', name: 'Maricopa County', state: 'AZ' },
  { fips: '04019', name: 'Pima County', state: 'AZ' },
  { fips: '04021', name: 'Pinal County', state: 'AZ' },
  // Washington
  { fips: '53033', name: 'King County', state: 'WA' },
  { fips: '53053', name: 'Pierce County', state: 'WA' },
  { fips: '53061', name: 'Snohomish County', state: 'WA' },
  { fips: '53063', name: 'Spokane County', state: 'WA' },
  // Nevada
  { fips: '32003', name: 'Clark County', state: 'NV' },
  { fips: '32031', name: 'Washoe County', state: 'NV' },
  // Colorado
  { fips: '08031', name: 'Denver County', state: 'CO' },
  { fips: '08041', name: 'El Paso County', state: 'CO' },
  { fips: '08059', name: 'Jefferson County', state: 'CO' },
  { fips: '08005', name: 'Arapahoe County', state: 'CO' },
  { fips: '08035', name: 'Douglas County', state: 'CO' },
  { fips: '08013', name: 'Boulder County', state: 'CO' },
  // Georgia
  { fips: '13121', name: 'Fulton County', state: 'GA' },
  { fips: '13067', name: 'Cobb County', state: 'GA' },
  { fips: '13089', name: 'DeKalb County', state: 'GA' },
  { fips: '13135', name: 'Gwinnett County', state: 'GA' },
  // North Carolina
  { fips: '37119', name: 'Mecklenburg County', state: 'NC' },
  { fips: '37183', name: 'Wake County', state: 'NC' },
  { fips: '37081', name: 'Guilford County', state: 'NC' },
  { fips: '37063', name: 'Durham County', state: 'NC' },
  // Michigan
  { fips: '26163', name: 'Wayne County', state: 'MI' },
  { fips: '26125', name: 'Oakland County', state: 'MI' },
  { fips: '26099', name: 'Macomb County', state: 'MI' },
  { fips: '26065', name: 'Ingham County', state: 'MI' },
  // Ohio
  { fips: '39049', name: 'Franklin County', state: 'OH' },
  { fips: '39035', name: 'Cuyahoga County', state: 'OH' },
  { fips: '39061', name: 'Hamilton County', state: 'OH' },
  { fips: '39113', name: 'Montgomery County', state: 'OH' },
  { fips: '39151', name: 'Stark County', state: 'OH' },
  // Pennsylvania
  { fips: '42101', name: 'Philadelphia County', state: 'PA' },
  { fips: '42003', name: 'Allegheny County', state: 'PA' },
  { fips: '42091', name: 'Montgomery County', state: 'PA' },
  { fips: '42017', name: 'Bucks County', state: 'PA' },
  // New Jersey
  { fips: '34023', name: 'Middlesex County', state: 'NJ' },
  { fips: '34039', name: 'Union County', state: 'NJ' },
  { fips: '34013', name: 'Essex County', state: 'NJ' },
  { fips: '34031', name: 'Passaic County', state: 'NJ' },
  // Maryland
  { fips: '24031', name: 'Montgomery County', state: 'MD' },
  { fips: '24033', name: "Prince George's County", state: 'MD' },
  { fips: '24005', name: 'Baltimore County', state: 'MD' },
  { fips: '24510', name: 'Baltimore City', state: 'MD' },
  // Virginia
  { fips: '51059', name: 'Fairfax County', state: 'VA' },
  { fips: '51107', name: 'Loudoun County', state: 'VA' },
  { fips: '51153', name: 'Prince William County', state: 'VA' },
  { fips: '51760', name: 'Richmond City', state: 'VA' },
  // Minnesota
  { fips: '27053', name: 'Hennepin County', state: 'MN' },
  { fips: '27123', name: 'Ramsey County', state: 'MN' },
  { fips: '27037', name: 'Dakota County', state: 'MN' },
  // Missouri
  { fips: '29189', name: 'St. Louis County', state: 'MO' },
  { fips: '29510', name: 'St. Louis City', state: 'MO' },
  { fips: '29095', name: 'Jackson County', state: 'MO' },
  // Massachusetts
  { fips: '25025', name: 'Suffolk County', state: 'MA' },
  { fips: '25017', name: 'Middlesex County', state: 'MA' },
  { fips: '25021', name: 'Norfolk County', state: 'MA' },
  { fips: '25023', name: 'Plymouth County', state: 'MA' },
  // Indiana
  { fips: '18097', name: 'Marion County', state: 'IN' },
  { fips: '18003', name: 'Allen County', state: 'IN' },
  { fips: '18057', name: 'Hamilton County', state: 'IN' },
  // Wisconsin
  { fips: '55079', name: 'Milwaukee County', state: 'WI' },
  { fips: '55025', name: 'Dane County', state: 'WI' },
  { fips: '55133', name: 'Waukesha County', state: 'WI' },
  // Tennessee
  { fips: '47157', name: 'Shelby County', state: 'TN' },
  { fips: '47037', name: 'Davidson County', state: 'TN' },
  { fips: '47093', name: 'Knox County', state: 'TN' },
  // Oregon
  { fips: '41051', name: 'Multnomah County', state: 'OR' },
  { fips: '41067', name: 'Washington County', state: 'OR' },
  { fips: '41005', name: 'Clackamas County', state: 'OR' },
  // Utah
  { fips: '49035', name: 'Salt Lake County', state: 'UT' },
  { fips: '49049', name: 'Utah County', state: 'UT' },
  { fips: '49011', name: 'Davis County', state: 'UT' },
  // Oklahoma
  { fips: '40109', name: 'Oklahoma County', state: 'OK' },
  { fips: '40143', name: 'Tulsa County', state: 'OK' },
  // Kansas
  { fips: '20091', name: 'Johnson County', state: 'KS' },
  { fips: '20173', name: 'Sedgwick County', state: 'KS' },
  // Connecticut
  { fips: '09009', name: 'New Haven County', state: 'CT' },
  { fips: '09003', name: 'Hartford County', state: 'CT' },
  { fips: '09001', name: 'Fairfield County', state: 'CT' },
  // Kentucky
  { fips: '21111', name: 'Jefferson County', state: 'KY' },
  { fips: '21067', name: 'Fayette County', state: 'KY' },
  // Louisiana
  { fips: '22071', name: 'Orleans Parish', state: 'LA' },
  { fips: '22033', name: 'East Baton Rouge Parish', state: 'LA' },
  { fips: '22051', name: 'Jefferson Parish', state: 'LA' },
  // Iowa
  { fips: '19153', name: 'Polk County', state: 'IA' },
  { fips: '19113', name: 'Linn County', state: 'IA' },
  // Nebraska
  { fips: '31055', name: 'Douglas County', state: 'NE' },
  { fips: '31109', name: 'Lancaster County', state: 'NE' },
  // New Mexico
  { fips: '35001', name: 'Bernalillo County', state: 'NM' },
  // Hawaii
  { fips: '15003', name: 'Honolulu County', state: 'HI' },
  // Idaho
  { fips: '16001', name: 'Ada County', state: 'ID' },
  { fips: '16027', name: 'Canyon County', state: 'ID' },
  // Mississippi
  { fips: '28049', name: 'Hinds County', state: 'MS' },
  { fips: '28047', name: 'Harrison County', state: 'MS' },
  // Arkansas
  { fips: '05119', name: 'Pulaski County', state: 'AR' },
  // South Carolina
  { fips: '45019', name: 'Charleston County', state: 'SC' },
  { fips: '45079', name: 'Richland County', state: 'SC' },
  { fips: '45045', name: 'Greenville County', state: 'SC' },
  // Alabama
  { fips: '01073', name: 'Jefferson County', state: 'AL' },
  { fips: '01101', name: 'Montgomery County', state: 'AL' },
  // West Virginia
  { fips: '54039', name: 'Kanawha County', state: 'WV' },
];

export function countiesForState(stateCode) {
  return US_COUNTIES.filter((c) => c.state === stateCode);
}
