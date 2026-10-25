// Small attributed public-data extract, not private household/account evidence.
// Statistics Canada, Chart 1; survey period 2022, published 2 April 2024.
export const caregivingSource={
  publisher:'Statistics Canada',period:'2022',released:'2024-04-02',reviewed:'2026-10-25',
  url:'https://www150.statcan.gc.ca/n1/pub/89-652-x/89-652-x2024002-eng.htm',
  scope:'Canadian Social Survey, Wave 6. Non-institutionalized people aged 15+ living off-reserve in the ten provinces. Unpaid care in the previous twelve months. Rounded survey estimates, not individual probabilities.',
  rows:[
    {label:'No unpaid care',percent:58.1,lower:56.8,upper:59.3},
    {label:'Adult care only',percent:14.4,lower:13.6,upper:15.3},
    {label:'Child care only',percent:21.9,lower:20.9,upper:23.0},
    {label:'Both adult and child care',percent:5.6,lower:5.0,upper:6.2}
  ]
};
