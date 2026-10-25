// Small attributed public extract, not private account or client data.
export const wealthSource={
  publisher:'Statistics Canada',period:'2019 and 2023',released:'2024-10-29',reviewed:'2026-10-25',
  table:'https://www150.statcan.gc.ca/n1/daily-quotidien/241029/t001a-eng.htm',
  release:'https://www150.statcan.gc.ca/n1/daily-quotidien/241029/dq241029a-eng.htm',
  infographic:'https://www150.statcan.gc.ca/n1/pub/11-627-m/11-627-m2024047-eng.htm',
  scope:'Survey of Financial Security; economic families and persons not in an economic family, ten provinces. Excludes Indigenous communities and collective dwellings. Age is the major income recipient’s age. Constant 2023 CAD. These are medians, not means, targets or liquid balances. The cited release tables do not supply confidence intervals; no significance test is claimed.',
  national:519700,
  ages:[
    {label:'Under 35',before:56400,after:159100},{label:'35 to 44',before:270800,after:409300},
    {label:'45 to 54',before:602000,after:675800},{label:'55 to 64',before:797000,after:873400},
    {label:'65 and older',before:627500,after:738900}
  ],
  provinces:[
    {label:'Newfoundland and Labrador',value:333500},{label:'Prince Edward Island',value:399800},
    {label:'Nova Scotia',value:354600},{label:'New Brunswick',value:286200},{label:'Quebec',value:371000},
    {label:'Ontario',value:665600},{label:'Manitoba',value:386300},{label:'Saskatchewan',value:394600},
    {label:'Alberta',value:457100},{label:'British Columbia',value:773500}
  ]
};
