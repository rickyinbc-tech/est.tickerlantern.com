// Original cost schedules. Hypothetical premium inputs do not imply equivalent coverage.
export const optionalCoverDefinitions={
  loanInsuranceCash:{title:'Follow a loan-insurance premium through the cash payments',fields:[
    ['advance','Cash available for the purchase or other loan purpose (CAD)',25000,1000,250000,1000],
    ['apr','Nominal annual loan rate, compounded monthly (%)',8,0,24,.5],
    ['months','Scheduled loan term (months)',60,6,120,1],
    ['singlePremium','Hypothetical one-time insurance premium (CAD)',1800,0,25000,100],
    ['monthlyPremium','Separate hypothetical recurring premium per month (CAD)',35,0,500,5]
  ]}
};
export function insuranceLoanSchedule(principal,apr,months) {
  const r=apr/1200,payment=r===0?principal/months:principal*r/(-Math.expm1(-months*Math.log1p(r)));
  let balance=principal,interest=0,paid=0;
  const rows=[{x:0,value:balance,paid:0}];
  for(let month=1;month<=months;month++) {
    const charge=balance*r,due=balance+charge,actual=month===months?due:Math.min(due,payment);
    interest+=charge;paid+=actual;balance=Math.max(0,due-actual);rows.push({x:month,value:balance,paid,payment:actual});
  }
  return {rows,payment,interest,paid,balance};
}
export function insuranceCashComparison(input) {
  const base=insuranceLoanSchedule(input.advance,input.apr,input.months);
  const financed=insuranceLoanSchedule(input.advance+input.singlePremium,input.apr,input.months);
  const premium=insuranceLoanSchedule(input.singlePremium,input.apr,input.months);
  return {base,financed,premium,recurring:input.monthlyPremium*input.months,extraInterest:financed.interest-base.interest};
}
export function optionalCoverResult(kind,input) {
  if(kind!=='loanInsuranceCash')throw Error('Unknown optional-coverage topic.');
  const p=insuranceCashComparison(input),periods=[1,Math.min(12,input.months),input.months].filter((v,i,a)=>a.indexOf(v)===i);
  return {metrics:[['Monthly loan payment with the single premium financed',p.financed.payment,'money'],['Additional loan interest from financing the premium',p.extraInterest,'money'],['One-time premium plus its financing interest',p.premium.paid,'money']],note:'Original nominal-CAD cost comparison. The same net amount is available for the loan purpose in every case. The optional single premium is either paid from separate cash at time zero or added to the loan principal and sent to the insurer; financing it does not create additional spendable loan proceeds. A separate recurring-premium case uses the entered flat premium at each month-end through the scheduled loan term. The loan has a fixed nominal annual rate divided by 12, monthly payments in arrears, no other fees and no early repayment. The final payment clears residual arithmetic; no monthly cent rounding is applied. Premium quotes are independent assumptions, not offers, and coverage, eligibility, exclusions, claims and refund rights are not assessed or assumed equivalent. No claim benefit, premium refund, tax effect or return on retained cash is included. The no-policy row is a cost baseline with no insurance benefit; it is not an equally protected alternative.',charts:[
    {id:'optional-cover-total-payments',type:'stackbar',title:'Keep loan proceeds, interest and insurance premiums in separate parts',unit:'money',seriesNames:['Loan-purpose cash repaid','Loan interest','Insurance premiums'],rows:[{label:'Loan only: no policy',values:[input.advance,p.base.interest,0]},{label:'One-time premium paid from cash',values:[input.advance,p.base.interest,input.singlePremium]},{label:'One-time premium added to loan',values:[input.advance,p.financed.interest,input.singlePremium]},{label:'Recurring premium paid separately',values:[input.advance,p.base.interest,p.recurring]}],note:'Each bar totals scheduled loan repayments plus insurance paid from separate cash, without discounting. In the financed case, the premium is repaid as principal and its interest is in the interest segment. The premium is counted once. A lower cost does not establish that two policies provide the same protection or that having no policy meets a household need.'},
    {id:'optional-cover-loan-balances',type:'line',title:'A financed premium increases the debt even when the purchase budget is unchanged',unit:'money',xLabel:'Months after the loan starts',series:[{name:'Loan-purpose borrowing only',rows:p.base.rows},{name:'Loan-purpose borrowing plus premium',rows:p.financed.rows,dash:true}],note:'The financed loan starts higher by the one-time premium and uses a larger payment over the same term. Paying the premium from cash or paying a recurring premium outside the loan leaves the base loan balance unchanged. A policy payment or cancellation does not automatically erase a debt balance in this illustration.'},
    {id:'optional-cover-premium-calendar',type:'groupbar',title:'Upfront, financed and recurring premiums use cash on different schedules',unit:'money',seriesNames:['One-time premium from cash','Premium-related loan payments','Recurring premiums'],rows:periods.map(month=>({label:'Cumulative through month '+month,values:[input.singlePremium,p.premium.rows[month].paid,input.monthlyPremium*month]})),note:'These amounts isolate insurance-related cash outlays and exclude the base loan repayment common to all cases. The cash premium leaves before the first month; the other cases pay at month-end. The financed column includes interest on the premium. This comparison does not assign an investment return or household value to cash retained earlier.'},
    {id:'optional-cover-financing-bridge',type:'waterfall',title:'The extra borrowing has a premium component and an interest component',unit:'money',rows:[{label:'Single insurance premium',value:input.singlePremium},{label:'Interest charged on that financed premium',value:p.premium.interest}],totalLabel:'Premium-related loan payments',note:'At the same rate and term, the premium can be reconciled as a separate amortising amount. Its total payments equal the difference between financed and base loan repayments, up to floating-point arithmetic. The interest cost is additional to the quoted premium, while any future claim value remains outside this cash-cost calculation.'},
    {id:'optional-cover-rate-term',type:'heatmap',title:'A longer financing term can increase the total cash paid for the same premium',unit:'money',columns:['0%','6%','12%','18%'],rows:[24,36,60,84].map(months=>({label:months+' months',values:[0,6,12,18].map(apr=>insuranceLoanSchedule(input.singlePremium,apr,months).paid)})),note:'Every cell uses the entered single premium, with the row replacing the loan term and the column replacing the nominal annual loan rate. Values are total premium-related repayments, including interest, not the monthly payment. At zero interest every cell equals the premium. The recurring-premium quote and the base loan-purpose amount do not enter these cells.'}
  ]};
}
