// Official public observations reviewed 25 October 2026. Persons in thousands,
// annual averages and unadjusted monthly estimates as published; no derived job
// totals, wages or household amounts are added.
export const multipleJobholderAnnualSource={
  publisher:'Statistics Canada',table:'14-10-0044-01',
  title:'Multiple jobholders by industry, annual',
  released:'2026-01-09',reviewed:'2026-10-25',latestPeriod:'2025',
  unit:'Persons in thousands, annual average',
  url:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410004401',
  csvUrl:'https://www150.statcan.gc.ca/n1/tbl/csv/14100044-eng.zip',
  vector:'v2342653',coordinate:'1.1.1.1',
  scope:'Canada; total employed multiple jobholders, all industries; total gender; 15 years and over. Each row is an annual average of people employed in two or more jobs simultaneously during the reference week, not a unique-person count accumulated over the year. Industry is assigned from the main job only.',
  rows:[
    {year:2016,persons:1006.8},
    {year:2017,persons:1046.4},
    {year:2018,persons:1077.0},
    {year:2019,persons:1108.2},
    {year:2020,persons:810.4},
    {year:2021,persons:966.4},
    {year:2022,persons:1086.7},
    {year:2023,persons:1136.8},
    {year:2024,persons:1156.1},
    {year:2025,persons:1178.6}
  ]
};
export const multipleJobholderMonthlySource={
  publisher:'Statistics Canada',table:'14-10-0045-01',
  title:'Multiple jobholders by industry, monthly, unadjusted for seasonality',
  released:'2026-10-09',reviewed:'2026-10-25',latestPeriod:'2026-09',
  unit:'Persons in thousands, unadjusted monthly estimate',
  url:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410004501',
  csvUrl:'https://www150.statcan.gc.ca/n1/tbl/csv/14100045-eng.zip',
  vector:'v3834095',coordinate:'1.1.1.1',
  adjustment:'Unadjusted for seasonality',
  scope:'Canada; total employed multiple jobholders, all industries; total gender; 15 years and over. Each value is an unadjusted estimate for the reference week, generally the week containing the fifteenth of the month. Month-to-month movement is not a seasonally adjusted trend, a hiring flow or a transition count.',
  rows:[
    {period:'Oct 2025',short:'Oct',persons:1156.1},
    {period:'Nov 2025',short:'Nov',persons:1224.0},
    {period:'Dec 2025',short:'Dec',persons:1218.9},
    {period:'Jan 2026',short:'Jan',persons:1118.9},
    {period:'Feb 2026',short:'Feb',persons:1209.4},
    {period:'Mar 2026',short:'Mar',persons:1234.8},
    {period:'Apr 2026',short:'Apr',persons:1210.3},
    {period:'May 2026',short:'May',persons:1217.4},
    {period:'Jun 2026',short:'Jun',persons:1231.7},
    {period:'Jul 2026',short:'Jul',persons:1233.4},
    {period:'Aug 2026',short:'Aug',persons:1203.2},
    {period:'Sep 2026',short:'Sep',persons:1240.8}
  ]
};
