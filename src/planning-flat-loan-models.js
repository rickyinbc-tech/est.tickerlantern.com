export const flatLoanDefinitions={flatLoan:{title:'Compare an original-principal interest quote with a reducing-balance quote',fields:[
 ['flatPrincipal','Same loan advance at time zero (CAD)',10000,0,50000,1000],
 ['flatQuote','Flat annual rate applied to original principal (%)',6,0,15,.5],
 ['restQuote','Reducing-balance nominal annual quote, divided by 12 (%)',6,0,24,.5],
 ['flatMonths','Equal end-of-month payments',24,1,60,1]
]}};
const annuityFactor=(monthly,n)=>monthly===0?n:-Math.expm1(-n*Math.log1p(monthly))/monthly;
export function flatLoanMonthlyEquivalent(flatPercent,n){
 if(flatPercent===0)return 0;
 const paymentPerDollar=(1+flatPercent*n/1200)/n;
 let lo=0,hi=1;
 while(paymentPerDollar*annuityFactor(hi,n)>1)hi*=2;
 for(let j=0;j<110;j++){const mid=(lo+hi)/2;if(paymentPerDollar*annuityFactor(mid,n)>1)lo=mid;else hi=mid;}
 return (lo+hi)/2;
}
export function flatLoanSchedule(i){
 const p=i.flatPrincipal,n=i.flatMonths,restMonthly=i.restQuote/1200,flatInterest=p*i.flatQuote/1200;
 const flatPayment=p*(1+i.flatQuote*n/1200)/n,restPayment=p/annuityFactor(restMonthly,n);
 let restPrincipal=p,restInterestTotal=0,restPaid=0;
 const rows=[{x:0,flatPrincipal:p,restPrincipal:p,flatInterest:0,restInterest:0,flatPayment:0,restPayment:0}];
 for(let month=1;month<=n;month++){
  const restInterest=restPrincipal*restMonthly,principalPaid=month===n?restPrincipal:restPayment-restInterest;
  const actualPayment=principalPaid+restInterest;restPrincipal=Math.max(0,restPrincipal-principalPaid);restInterestTotal+=restInterest;restPaid+=actualPayment;
  rows.push({x:month,flatPrincipal:Math.max(0,p*(1-month/n)),restPrincipal,flatInterest,restInterest,flatPayment,restPayment:actualPayment});
 }
 const flatMonthly=flatLoanMonthlyEquivalent(i.flatQuote,n);
 return {rows,flatPayment,restPayment,flatInterestTotal:flatInterest*n,restInterestTotal,flatPaid:flatPayment*n,restPaid,flatMonthly,flatEffective:p>0?Math.expm1(12*Math.log1p(flatMonthly)):null,restEffective:p>0?Math.expm1(12*Math.log1p(restMonthly)):null};
}
export function flatLoanResult(kind,i){
 if(kind!=='flatLoan')throw Error('Unknown flat-loan topic.');
 const p=flatLoanSchedule(i),series=(name,key,dash=false)=>({name,dash,rows:p.rows.map(r=>({x:r.x,value:r[key]}))});
 const selectedMonths=[...new Set([1,Math.ceil(i.flatMonths/2),i.flatMonths])];
 return {metrics:[['Flat original-principal quote · monthly payment',p.flatPayment,'money'],['Reducing-balance quote · monthly payment',p.restPayment,'money'],['Flat schedule · effective annual cash-flow equivalent',p.flatEffective,'percent',i.flatPrincipal===0?'N/A · no advance or repayments':undefined]],note:'Two hypothetical fixed schedules advance the same principal at time zero and receive one payment at each month-end, starting one full month later. Flat interest equals original principal × flat annual quote × months / 12 and is divided equally across payments; allocated principal declines in equal amounts. The reducing-balance quote is nominal annual divided by twelve, charged to each month’s opening unpaid principal; the fixed payment amortizes it over the same number of months. Full-precision amounts are used, with only display rounding; these are mathematical schedules rather than cent-rounded lender invoices. The final reducing-balance payment closes floating-point residuals. The flat periodic equivalent solves advance = present value of the complete monthly payment schedule, then compounds that monthly rate for twelve months: (1 + monthly equivalent)^12 − 1. It is a defined effective annual cash-flow equivalent, not a jurisdiction-specific APR/EIR disclosure or legal-compliance test. At a zero advance the cost ratio is undefined and the headline stays N/A. Fees, insurance, taxes, defaults, early settlement, rebates and household funding are excluded. The principal chart is an allocation schedule, not a contractual early-payoff quote. All rate/term matrix cells use a normalized positive one-dollar advance, independently of selected loan size and quotes.',charts:[
  {id:'flat-loan-monthly-interest',type:'groupbar',axisRight:36,title:'The interest base differs even when both annual quotes display 6% by default',unit:'money',unitLabel:'CAD interest allocated to each selected payment month',seriesNames:['Flat · original principal base','Reducing · opening unpaid principal'],rows:selectedMonths.map(month=>({label:'Payment month '+month,values:[p.rows[month].flatInterest,p.rows[month].restInterest]})),note:'The flat example allocates the same interest amount to each month. The reducing-balance example charges interest on an amount that falls as principal is repaid. These are components of payments, not extra payments in addition to the scheduled installment. The row numbers follow the selected term.'},
  {id:'flat-loan-principal-path',type:'line',title:'Equal principal slices and a fixed amortizing payment repay principal at different speeds',unit:'money',unitLabel:'CAD allocated unpaid principal · not a settlement quote',xLabel:'Month-end payment number · 0 is the advance',series:[series('Flat schedule · equal principal allocation','flatPrincipal'),series('Reducing schedule · amortized principal','restPrincipal',true)],note:'Both schedules begin with the same advance and end with zero allocated principal. Future unearned flat interest is not added to this principal chart. A real early-payoff amount depends on contract terms and cannot be read from these lines.'},
  {id:'flat-loan-total-payments',type:'stackbar',axisRight:36,title:'Separate repayment of the advance from the total interest cost',unit:'money',unitLabel:'CAD over the complete selected payment schedule',seriesNames:['Original advance repaid','Total interest'],rows:[{label:'Original-principal flat schedule',values:[i.flatPrincipal,p.flatInterestTotal]},{label:'Reducing-balance schedule',values:[i.flatPrincipal,p.restInterestTotal]}],note:'Each total includes the same original principal once, plus that schedule’s interest. Original principal is money borrowed and returned, not a financing charge. The selected quote rates can differ, so the model does not assume either schedule is always cheaper.'},
  {id:'flat-loan-effective-grid',type:'heatmap',title:'Convert each flat quote through its stated payment dates before annualizing',unit:'percent',unitLabel:'Effective annual cash-flow equivalent (%) · normalized positive advance',compactValues:false,columns:['1 mo','12 mo','24 mo','60 mo'],rows:[0,3,6,9].map(rate=>({label:rate+'% flat',values:[1,12,24,60].map(n=>Math.expm1(12*Math.log1p(flatLoanMonthlyEquivalent(rate,n))))})),note:'Rows replace the flat annual quote and columns replace the number of monthly payments. Every cell uses a positive one-dollar advance and the same fee-free formula; no selected balance or reducing-balance rate is retained. One payment after one month and sixty monthly payments create different cash-flow schedules. These are computed equivalents, not observed lending rates.'}
 ]};
}
