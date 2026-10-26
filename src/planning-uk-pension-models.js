export const ukPensionRules={
  reviewed:'2026-10-25',taxYear:'6 April 2026 to 5 April 2027',
  bandLower:6240,bandUpper:50270,employeeMinimum:.05,employerMinimum:.03,
  personalAllowance:12570,basicLimit:50270,basicRate:.2,higherRate:.4,
  url:'https://www.gov.uk/workplace-pensions/what-you-your-employer-and-the-government-pay',
  reliefUrl:'https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief',
  taxUrl:'https://www.gov.uk/income-tax-rates'
};
export const ukPensionDefinitions={ukPension:{title:'UK workplace pension: the qualifying-earnings band and two routes to tax relief',fields:[
  ['ukEarnings','Annual earnings counted for automatic enrolment (GBP)',35000,0,100000,1000],
  ['ukEmployeeRate','Employee contribution rate on qualifying earnings (%)',5,0,20,1],
  ['ukEmployerRate','Employer contribution rate on qualifying earnings (%)',3,0,20,1]
]}};
function incomeTax(earnings){
  const taxable=Math.max(0,earnings-ukPensionRules.personalAllowance);
  const basic=Math.min(taxable,ukPensionRules.basicLimit-ukPensionRules.personalAllowance);
  return basic*ukPensionRules.basicRate+Math.max(0,taxable-basic)*ukPensionRules.higherRate;
}
export function ukPensionLedger(input){
  const earnings=Math.max(0,input.ukEarnings);
  const qualifying=Math.max(0,Math.min(earnings,ukPensionRules.bandUpper)-ukPensionRules.bandLower);
  const employee=qualifying*input.ukEmployeeRate/100;
  const employer=qualifying*input.ukEmployerRate/100;
  const taxWithout=incomeTax(earnings);
  const taxWithEmployeeContribution=incomeTax(earnings-employee);
  const netPayRelief=taxWithout-taxWithEmployeeContribution;
  const netPayCost=employee-netPayRelief;
  const reliefAtSourceOutlay=employee*(1-ukPensionRules.basicRate);
  const governmentTopUp=employee*ukPensionRules.basicRate;
  const reliefAtSourceClaim=Math.max(0,netPayRelief-governmentTopUp);
  const reliefAtSourceCost=reliefAtSourceOutlay-reliefAtSourceClaim;
  return {earnings,qualifying,employee,employer,total:employee+employer,
    afterContribution:earnings-employee,taxWithout,taxWithEmployeeContribution,
    netPayRelief,netPayCost,reliefAtSourceOutlay,governmentTopUp,reliefAtSourceClaim,reliefAtSourceCost,
    reliefAtSourceCredit:reliefAtSourceOutlay+governmentTopUp,
    gap:netPayCost-reliefAtSourceCost,
    effectiveTotal:earnings? (employee+employer)/earnings:0};
}
export function ukPensionResult(kind,input){
  if(kind!=='ukPension')throw Error('Unknown UK workplace pension topic.');
  const p=ukPensionLedger(input),common={source:ukPensionRules.url,sourceLabel:'GOV.UK · Workplace pensions · automatic enrolment contribution rules and earnings band checked 25 October 2026',evidence:'Calculated from public GOV.UK rules'};
  const earningsScenarios=[5000,6240,8000,12570,20000,35000,50270,60000];
  const takeHomeScenarios=[8000,10000,12570,20000,35000,60000];
  const bridgeRows=[{label:'Employee pays from take-home pay',value:p.reliefAtSourceOutlay},{label:'Government basic-rate top-up',value:p.governmentTopUp}];
  return {metrics:[
    ['Qualifying earnings between the band limits',p.qualifying,'gbp'],
    ['Employee contribution before tax relief',p.employee,'gbp'],
    ['Employer contribution',p.employer,'gbp'],
    ['Take-home cost after basic-rate relief',p.netPayCost,'gbp']
  ],note:'Pounds sterling (GBP) throughout; no CAD conversion. Public GOV.UK automatic-enrolment rules checked 25 October 2026: 5% employee and 3% employer minimums on qualifying earnings between £6,240 and £50,270, with 8% combined. Tax relief is modelled at the 20% basic rate up to taxable income of £50,270 and the 40% higher rate above it, using the £12,570 personal allowance stated for the tax year 6 April 2026 to 5 April 2027. Earnings are capped at £100,000 so the personal-allowance taper, additional rate, Scottish rates and Welsh rates remain outside the model. The model holds one annual earnings figure constant, ignores bonuses or irregular pay, and does not determine eligibility, scheme pensionable pay, annual allowance, carry-forward, salary sacrifice, National Insurance, student loan, other deductions, investment return, fees, or the timing of actual payroll and relief payments. Employer contributions are not deducted from the employee’s pay. Net pay means the contribution comes out before Income Tax; relief at source means the employee pays net and the provider claims basic-rate relief. Neither route is assumed to be available in every scheme.',charts:[
    {id:'uk-pension-qualifying-band',type:'stackbar',title:'Both contributions start at £6,240 of earnings and stop growing above £50,270',unit:'gbp',unitLabel:'GBP per year at the selected contribution rates · qualifying earnings only',axisRight:34,seriesNames:['Employee contribution','Employer contribution'],rows:earningsScenarios.map(earnings=>{const r=ukPensionLedger({...input,ukEarnings:earnings});return {label:'Earnings £'+earnings.toLocaleString('en-GB'),values:[r.employee,r.employer]};}),...common,note:'The fixed scenarios use the selected rates but replace annual earnings. A salary below £6,240 produces no qualifying earnings in this simplified band model; eligibility or a right to join must be checked separately. Between the limits, £1 more of earnings adds the selected percentage to each side. Above £50,270 the contribution amounts stay flat because only £44,030 of earnings is inside the band. The bars are calculated contributions, not observed payroll deductions.'},
    {id:'uk-pension-take-home-cost',type:'groupbar',title:'The same gross contribution can cost different take-home amounts by relief route',unit:'gbp',unitLabel:'GBP take-home cost of the employee contribution · after relief at basic or higher rate',axisRight:40,seriesNames:['Net pay: take-home cost after Income Tax','Relief at source: net cost after any claim'],rows:takeHomeScenarios.map(earnings=>{const r=ukPensionLedger({...input,ukEarnings:earnings});return {label:'Earnings £'+earnings.toLocaleString('en-GB'),values:[r.netPayCost,r.reliefAtSourceCost]};}),...common,note:'Each pair uses the same earnings and rates. For a basic-rate taxpayer with enough taxable income, the two bars coincide because £100 of gross contribution costs £80 either way. Below the £12,570 personal allowance, net pay gives no Income Tax relief in this model while relief at source still adds 20%, so the net-pay bar is higher. The relief-at-source bar assumes any extra higher-rate relief is successfully claimed; it is not a promise that a claim will be made or paid on time.'},
    {id:'uk-pension-relief-at-source-bridge',type:'waterfall',title:'Relief at source builds the gross contribution from a net payment and government money',unit:'gbp',unitLabel:'GBP · one year of the selected employee contribution',rows:bridgeRows,totalLabel:'Gross contribution credited',...common,note:'The first step is the amount taken from take-home pay. The basic-rate top-up is 20% of the gross contribution, or 25% of the net payment. When higher-rate tax applies, the provider still adds only the basic 20%. Any additional higher-rate relief is claimed from HMRC and paid to the employee rather than added to the pension pot, so it is deliberately outside this bridge. The endpoint is the gross contribution credited before any investment movement or fee, not a cash amount available to spend. Scottish relief-at-source rules can differ, and the source notes that a 19% Scottish rate still receives a 20% at-source claim.'},
    {id:'uk-pension-relief-gap',type:'heatmap',signed:true,title:'Relief at source only beats net pay where the employee has little or no Income Tax to relieve',unit:'gbp',unitLabel:'GBP · net-pay take-home cost minus relief-at-source cost; positive means relief at source costs less',columns:['3%','5%','8%','12%'],rows:takeHomeScenarios.map(earnings=>({label:'£'+earnings.toLocaleString('en-GB'),values:[3,5,8,12].map(rate=>ukPensionLedger({...input,ukEarnings:earnings,ukEmployeeRate:rate}).gap)})),...common,note:'Rows replace annual earnings and columns replace the employee rate; the employer rate stays as selected. Positive cells are amounts by which the relief-at-source take-home cost is lower after any claim. Zero cells mean the two routes produce the same basic-rate result. The grid assumes the extra higher-rate relief is claimed, so a failure to claim would turn some zero cells positive. It is a mechanical comparison, not a prediction of which scheme an employer offers or which route is better for a particular person.'}
  ]};
}
