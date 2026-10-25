export const emergencySurveyData = {
  source:'https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-savings-investments.htm',
  methodology:'https://www.federalreserve.gov/publications/2026-economic-well-being-of-us-households-in-2025-description.htm',
  savingsSourceSha256:'6ce8e10bd61fcd298eaf5fb956edc61dbfab7597c7b0d84a6d95ed031cf1af9c',
  methodSourceSha256:'b897a69ad7c9f29ee9851b7ffe9bc48391ca0d750e1bb731460d4f77b2ff52b4',
  observedYear:2025,report:'May 2026',reviewed:'2026-10-25',
  population:'Weighted U.S. adult population; civilian, noninstitutionalized people age 18 and older',
  fieldDates:['2025-10-17','2025-10-28'],sample:12934,
  currency:'USD',
  savingsOnly:[
    {label:'Under $100',sourceLabel:'Less than $100',percent:18},
    {label:'$100–$499',sourceLabel:'$100–$499',percent:12},
    {label:'$500–$999',sourceLabel:'$500–$999',percent:9},
    {label:'$1,000–$1,999',sourceLabel:'$1,000–$1,999',percent:11},
    {label:'$2,000–$4,999',sourceLabel:'$2,000-$4,999',percent:12},
    {label:'$5,000 or more',sourceLabel:'$5,000 or more',percent:38}
  ],
  wouldPay400CashEquivalent:63,couldPay500Savings:70
};
