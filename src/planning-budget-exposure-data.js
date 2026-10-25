// Small public-data extract. Recheck against the accessible chart description.
// Source HTML and retrieval receipts remain in ignored qa/.
export const cpi2025 = {
  publisher:'Statistics Canada', table:'18-10-0005-01', geography:'Canada',
  period:'2025 annual average compared with 2024 annual average',
  released:'2026-01-19', reviewed:'2026-10-25', unit:'percent change',
  url:'https://www150.statcan.gc.ca/n1/daily-quotidien/260119/cg-b003-eng.htm',
  releaseUrl:'https://www150.statcan.gc.ca/n1/daily-quotidien/260119/dq260119b-eng.htm',
  headline:2.1,
  rows:[
    {key:'food',label:'Food',rate:3.2},
    {key:'shelter',label:'Shelter',rate:3.0},
    {key:'household',label:'Household operations, furnishings and equipment',rate:1.8},
    {key:'clothing',label:'Clothing and footwear',rate:0.5},
    {key:'transport',label:'Transportation',rate:0.3},
    {key:'health',label:'Health and personal care',rate:2.5},
    {key:'recreation',label:'Recreation, education and reading',rate:1.3},
    {key:'alcohol',label:'Alcoholic beverages, tobacco products and recreational cannabis',rate:1.6}
  ]
};
