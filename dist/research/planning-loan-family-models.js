import {ccbCalendarSource as ccb} from './planning-loan-family-data.js';

export const loanFamilyDefinitions={
  loanAdvanceFee:{title:'Explore a fee withheld from an otherwise amortizing loan advance',fields:[
    ['advancePrincipal','Contract principal repaid through the loan (CAD)',10000,1000,50000,1000],
    ['advanceRate','Nominal annual interest rate, divided by twelve (%)',8,0,15,.5],
    ['advanceMonths','Whole monthly payments in the full term',36,12,60,1],
    ['withheldFee','Upfront fee withheld from the advance (%)',5,0,5,.5]
  ]},
  ccbCashCalendar:{title:'Explore a fixed 2026 benefit-and-expense cash calendar',fields:[
    ['childOpening','Cash already dedicated to this budget on 1 January (CAD)',0,0,10000,100],
    ['childFunding','Other household cash assigned on each month’s first day (CAD)',150,0,2000,50],
    ['childExpense','Selected child-related bill on each month’s first day (CAD)',600,0,3000,50],
    ['ccbFirstHalf','Confirmed or hypothetical monthly receipt, January–June (CAD)',450,0,2000,50],
    ['ccbSecondHalf','Confirmed or hypothetical monthly receipt, July–December (CAD)',600,0,2000,50],
    ['ccbLagDays','Hypothetical calendar-day lag after each scheduled payment',0,0,35,1]
  ]}
};

export function equalPaymentPresentValue(payment,months,monthlyRate){
  return monthlyRate===0?payment*months:payment*(-Math.expm1(-months*Math.log1p(monthlyRate)))/monthlyRate;
}
export function loanAdvanceLedger(input){
  const principal=input.advancePrincipal,rate=input.advanceRate/1200,months=input.advanceMonths,fee=principal*input.withheldFee/100,netCash=principal-fee;
  const payment=rate===0?principal/months:principal*rate/(-Math.expm1(-months*Math.log1p(rate)));
  let monthlyCashRate=rate;
  if(fee>0){
    let low=0,high=Math.max(.01,rate);
    while(equalPaymentPresentValue(payment,months,high)>netCash)high*=2;
    for(let i=0;i<100;i++){const middle=(low+high)/2;if(equalPaymentPresentValue(payment,months,middle)>netCash)low=middle;else high=middle;}
    monthlyCashRate=(low+high)/2;
  }
  let balance=principal,interestTotal=0,principalPaid=0,payments=0;
  const rows=[{x:0,balance,interest:0,principal:0,payment:0,interestTotal,principalPaid}];
  for(let month=1;month<=months;month++){
    const interest=balance*rate,paid=month===months?balance+interest:payment,principalPart=paid-interest;
    balance=month===months?0:balance-principalPart;interestTotal+=interest;principalPaid+=principalPart;payments+=paid;
    rows.push({x:month,balance,interest,principal:principalPart,payment:paid,interestTotal,principalPaid});
  }
  return {rows,payment,payments,fee,netCash,interestTotal,cost:payments-netCash,monthlyCashRate,
    effectiveCashRate:Math.expm1(12*Math.log1p(monthlyCashRate)),effectiveNoFee:Math.expm1(12*Math.log1p(rate))};
}

const dayMs=86400000,startUTC=Date.UTC(2026,0,1),yearEndDay=364;
const iso=value=>new Date(value).toISOString().slice(0,10),dayOf=value=>(Date.parse(value+'T00:00:00Z')-startUTC)/dayMs;
export function ccbCashLedger(input){
  const receipts=ccb.dates.map((scheduledDate,index)=>({scheduledDate,date:iso(Date.parse(scheduledDate+'T00:00:00Z')+input.ccbLagDays*dayMs),amount:index<6?input.ccbFirstHalf:input.ccbSecondHalf,baseTaxYear:ccb.baseTaxYears[index]}));
  const events=receipts.map(r=>({...r,type:'benefit',priority:2}));
  for(let month=0;month<12;month++){
    const date=iso(Date.UTC(2026,month,1));events.push({date,type:'funding',amount:input.childFunding,priority:0},{date,type:'expense',amount:-input.childExpense,priority:1});
  }
  events.sort((a,b)=>dayOf(a.date)-dayOf(b.date)||a.priority-b.priority);
  let net=0,lowestNet=0,yearEnd=input.childOpening;
  const rows=[{x:0,label:'2026-01-01 · opening',value:input.childOpening}];
  for(const event of events){net+=event.amount;lowestNet=Math.min(lowestNet,net);const x=dayOf(event.date),value=input.childOpening+net;if(x<=yearEndDay)yearEnd=value;rows.push({x,label:event.date+' · '+event.type,value});}
  // Add the year-end checkpoint even when a delayed receipt extends the collection period into 2027.
  rows.push({x:yearEndDay,label:'2026-12-31 · year-end',value:yearEnd});rows.sort((a,b)=>a.x-b.x);
  const expectedBenefits=receipts.reduce((s,r)=>s+r.amount,0),benefitsInYear=receipts.filter(r=>dayOf(r.date)<=yearEndDay).reduce((s,r)=>s+r.amount,0);
  return {receipts,events,rows,expectedBenefits,benefitsInYear,laterBenefits:expectedBenefits-benefitsInYear,yearEnd,ending:input.childOpening+net,requiredOpening:Math.max(0,-lowestNet),extra:Math.max(0,-lowestNet-input.childOpening),funding:12*input.childFunding,expenses:12*input.childExpense};
}
const path=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});

export function loanFamilyResult(kind,input){
  if(kind==='loanAdvanceFee'){
    const p=loanAdvanceLedger(input);
    return {metrics:[['Cash actually advanced after the withheld fee',p.netCash,'money'],['Unrounded end-of-month payment',p.payment,'money'],['Effective annual cash-flow rate including the withheld fee',p.effectiveCashRate,'percent']],note:'Original amortizing-loan illustration. The nominal annual rate is divided by twelve; interest accrues on the outstanding contract principal and payments arrive at each month-end. The full term equals the repayment period. A percentage fee is withheld once at origination, reducing cash received without reducing the principal owed or being added as a second financed amount. The effective cash-flow rate discounts the equal payments to that net advance and compounds its monthly rate over twelve periods. This is not a calculation of a statutory disclosed APR, legal compliance, lender eligibility or an available offer. No insurance, other fees, missed or extra payments, early settlement, taxes, irregular dates or cent-by-cent payment rounding is included; tiny final numerical residuals are reconciled at the last payment.',charts:[
      {id:'loan-fee-net-advance',type:'waterfall',title:'The amount owed can exceed the cash actually received',unit:'money',rows:[{label:'Contract principal',value:input.advancePrincipal},{label:'Fee withheld from the advance',value:-p.fee}],totalLabel:'Net cash advanced',note:'The fee reduces the initial proceeds. The repayment schedule still amortizes the full contract principal. Do not also add the same fee to the financed principal or treat it as another cash payment at the start.'},
      {id:'loan-fee-repayment-path',type:'line',title:'Trace the contract balance beside principal and interest repaid',unit:'money',xLabel:'Month',series:[path('Outstanding contract principal',p.rows,'balance'),path('Cumulative principal repaid',p.rows,'principalPaid',{dash:true}),path('Cumulative interest paid',p.rows,'interestTotal')],note:'Each point is after the month-end payment. Principal repaid and remaining principal reconcile to the starting contract amount; interest is a separate cost. The upfront fee does not alter this contractual amortization path when the other inputs stay fixed.'},
      {id:'loan-fee-total-cost',type:'stackbar',title:'Reconcile the cost beyond the net cash advanced',unit:'money',seriesNames:['Interest paid','Fee withheld'],rows:[{label:'Full-term borrowing cost',values:[p.interestTotal,p.fee]}],note:'The two components equal all loan payments minus net cash received. Adding the fee again to that payment-minus-proceeds difference would double count it. Total repayment is not all borrowing cost because part repays the principal advanced.'},
      {id:'loan-fee-term-matrix',type:'heatmap',title:'Effective annual cash-flow rate across fees and full repayment terms',unit:'percent',unitLabel:'Effective annual cash-flow rate (%) · not statutory disclosed APR',columns:['12 mo','24 mo','36 mo','60 mo'],rows:[0,1,3,5].map(withheldFee=>({label:withheldFee+'% fee',values:[12,24,36,60].map(advanceMonths=>loanAdvanceLedger({...input,withheldFee,advanceMonths}).effectiveCashRate)})),note:'Rows replace the withheld fee percentage; columns replace the whole repayment term. Contract principal and nominal annual rate stay selected. Every cell recalculates the payment and net-advance discount rate. A longer term can spread a fee while increasing total interest, so a lower annualized rate alone does not establish a cheaper or affordable loan.'}
    ]};
  }
  if(kind==='ccbCashCalendar'){
    const p=ccbCashLedger(input),last=p.rows.at(-1).x,lastDate=iso(startUTC+last*dayMs),endLabel=new Date(lastDate+'T00:00:00Z').toLocaleDateString('en-CA',{month:'short',day:'numeric',timeZone:'UTC'});
    return {metrics:[['Modeled benefit receipts arriving during 2026',p.benefitsInYear,'money'],['Extra starting cash required before every modeled bill',p.extra,'money'],['Dedicated budget balance at 31 December 2026',p.yearEnd,'money']],note:'Fixed 2026 educational calendar with independently entered recurring monthly benefit receipts. CRA’s published schedule and base-tax-year mapping are reference facts, not eligibility or amount calculations. Other household cash is assigned on each month’s first day, then the selected child bill is paid; a benefit arriving that same day is credited afterward. The calendar-day lag is an authored stress after each scheduled date, not a forecast of CRA or bank delays. Receipt amounts stay constant within each half-year as a simplifying assumption. Actual entitlements, reassessments, custody or age changes, combined provincial amounts, stopped payments and low-entitlement lump sums are outside this model. Use actual confirmed payment information; inputs do not certify a monthly entitlement. No interest, borrowing or costs outside this dedicated budget are included. Year-end metrics stop on 31 December; the path continues only to collect any delayed 2026 receipts, with no new 2027 costs or resources added.',charts:[
      {id:'ccb-calendar-scheduled-payments',type:'bar',title:'Attach the selected monthly amount to the official 2026 schedule',unit:'money',evidence:'Official 2026 schedule · hypothetical receipt amounts',source:ccb.url,sourceLabel:'CRA · CCB payment dates and tax-year mapping',rows:p.receipts.map(r=>({label:r.scheduledDate,value:r.amount})),note:'Labels retain CRA’s scheduled dates, even when a hypothetical receipt lag is selected. January–June dates use the 2024 base tax year; July–December dates use 2025. Amounts are entered examples, not maximum benefits or outputs from a tax-income formula. Check the actual expected amount and payment pattern independently.'},
      {id:'ccb-calendar-cash-path',type:'line',title:'A later receipt cannot fund an earlier first-of-month bill',unit:'money',xLabel:'Date',xTicks:[{value:0,label:'Jan 1'},{value:181,label:'Jul 1'},{value:last,label:endLabel}],series:[{name:'Dedicated cash after each event',rows:p.rows,step:true}],note:'The table preserves full event dates and the stepped path retains each funding assignment, bill and receipt. There is no modeled bill after December 2026. Any early-2027 segment collects a delayed receipt from the 2026 schedule; it is not a 2027 benefit or expense projection.'},
      {id:'ccb-calendar-year-reconciliation',type:'waterfall',title:'Reconcile the calendar-year cash separately from late receipts',unit:'money',rows:[{label:'Opening dedicated cash',value:input.childOpening},{label:'Other household funding during 2026',value:p.funding},{label:'Benefits received during 2026',value:p.benefitsInYear},{label:'Selected 2026 child bills',value:-p.expenses}],totalLabel:'Cash at 31 December 2026',note:'The selected schedule assigns '+p.expectedBenefits.toLocaleString('en-CA')+' CAD of receipts to 2026 payment dates. Under the selected lag, '+p.laterBenefits.toLocaleString('en-CA')+' CAD arrives afterward and is excluded from this year-end bridge. A positive year-end balance does not prove each earlier bill was funded.'},
      {id:'ccb-calendar-funding-matrix',type:'heatmap',title:'Extra opening cash across dedicated reserves and other monthly funding',unit:'money',columns:['$0 / mo','$150','$300','$450'],rows:[0,300,600,900].map(childOpening=>({label:'$'+childOpening+' start',values:[0,150,300,450].map(childFunding=>ccbCashLedger({...input,childOpening,childFunding}).extra)})),note:'Rows replace the dedicated opening reserve; columns replace other household cash assigned at each month-start. Both half-year receipt amounts, the selected bill and receipt lag stay fixed. Cells measure extra starting cash needed to avoid a negative balance, not extra benefits or an assessment of eligibility.'}
    ]};
  }
  throw Error('Unknown loan or family-calendar topic.');
}
