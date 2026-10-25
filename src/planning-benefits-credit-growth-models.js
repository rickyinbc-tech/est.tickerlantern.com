export const benefitsCreditGrowthDefinitions={
  annualBenefitCap:{title:'Explore two benefit years and the reimbursement cash calendar',fields:[
    ['eligibleMonthly','Confirmed eligible expense billed each service month (CAD)',400,0,3000,50],['annualDeductible','Annual deductible applied before reimbursement (CAD)',200,0,3000,50],
    ['coverage','Reimbursement share after the deductible (%)',80,0,100,5],['annualMaximum','Maximum insurer benefit per service year (CAD)',1500,0,10000,250],
    ['receiptLag','Whole months from a service bill to receipt at month-end',2,0,6,1],['startingCash','Cash assigned to these bills at the start (CAD)',2000,0,30000,500],
    ['monthlyAllocation','Cash assigned from income at each service month-end (CAD)',250,0,3000,50]
  ]},
  creditSnapshot:{title:'Explore a card-balance calendar and an assumed reporting date',fields:[
    ['openingBalance','Opening card A balance (CAD)',1500,0,30000,500],['creditLimit','Card A limit used in the ratio (CAD)',5000,500,50000,500],
    ['dailyPurchase','One purchase amount on each of thirty days (CAD)',50,0,500,10],['payment','Cash payment requested once during the month (CAD)',1000,0,30000,100],
    ['paymentDay','Day the payment is actually credited, after that day’s purchase',15,1,30,1],['reportDay','Assumed snapshot day, after that day’s transactions',20,1,30,1],
    ['otherBalance','Other card balance, held constant in this example (CAD)',1000,0,30000,500],['otherLimit','Other card limit used in the combined ratio (CAD)',10000,0,50000,500]
  ]},
  pairedReturns:{title:'Explore the same arithmetic mean with different paired return spreads',fields:[
    ['initial','Initial capital, with no later deposits or withdrawals (CAD)',10000,0,500000,1000],['mean','Arithmetic mean of each two-year pair (%)',5,-5,10,.5],
    ['spread','Difference of each annual return from that mean (percentage points)',20,0,50,5],['cycles','Number of complete two-year pairs',10,1,15,1]
  ]}
};

export function benefitCapCalendar(input){
  const claims=[],years=[];
  for(let year=1;year<=2;year++){
    let deductibleLeft=input.annualDeductible,benefitLeft=input.annualMaximum,benefitTotal=0,deductibleUsed=0;
    for(let i=1;i<=12;i++){
      const deductible=Math.min(input.eligibleMonthly,deductibleLeft);deductibleLeft-=deductible;deductibleUsed+=deductible;
      const allowed=Math.min(benefitLeft,(input.eligibleMonthly-deductible)*input.coverage/100);benefitLeft-=allowed;benefitTotal+=allowed;
      claims.push({x:(year-1)*12+i,year,bill:input.eligibleMonthly,deductible,allowed,benefitUsed:input.annualMaximum-benefitLeft});
    }
    years.push({year,billed:12*input.eligibleMonthly,benefit:benefitTotal,household:12*input.eligibleMonthly-benefitTotal,deductibleUsed});
  }
  let net=0,lowest=0,received=0;
  const rows=[{x:0,before:input.startingCash,after:input.startingCash,bill:0,receipt:0,allocation:0}];
  for(let month=1;month<=24+input.receiptLag;month++){
    const bill=month<=24?input.eligibleMonthly:0,allocation=month<=24?input.monthlyAllocation:0;
    const receipt=claims[month-input.receiptLag-1]?.allowed??0;
    net-=bill;lowest=Math.min(lowest,net);const before=input.startingCash+net;
    net+=allocation+receipt;received+=receipt;
    rows.push({x:month,before,after:input.startingCash+net,bill,receipt,allocation});
  }
  const totalBenefits=years.reduce((s,r)=>s+r.benefit,0),required=-lowest;
  return {claims,years,rows,totalBenefits,received,netCost:24*input.eligibleMonthly-totalBenefits,required,extra:Math.max(0,required-input.startingCash),afterServiceReceipts:claims.filter(r=>r.x+input.receiptLag>24).reduce((s,r)=>s+r.allowed,0),ending:input.startingCash+net};
}

export function creditSnapshotCalendar(input){
  let balance=input.openingBalance,paid=0;
  const rows=[{x:0,balance}];
  for(let day=1;day<=30;day++){
    balance+=input.dailyPurchase;
    if(day===input.paymentDay){paid=Math.min(balance,input.payment);balance-=paid;}
    rows.push({x:day,balance});
  }
  const reported=rows[input.reportDay].balance;
  return {rows,paid,ending:balance,reported,reportedShare:reported/input.creditLimit,combinedShare:(reported+input.otherBalance)/(input.creditLimit+input.otherLimit),purchases:30*input.dailyPurchase};
}

export function pairedCompoundRate(mean,spread){return Math.sqrt((1+mean/100)**2-(spread/100)**2)-1;}
export function pairedReturnPath(input,reverse=false){
  let alternating=input.initial,smooth=input.initial;
  const rows=[{x:0,alternating,smooth,annualReturn:0}];
  for(let year=1;year<=input.cycles*2;year++){
    const high=(year%2===1)!==reverse,annualReturn=(input.mean+(high?input.spread:-input.spread))/100;
    alternating*=1+annualReturn;smooth*=1+input.mean/100;
    rows.push({x:year,alternating,smooth,annualReturn});
  }
  return {rows,alternating,smooth,compound:pairedCompoundRate(input.mean,input.spread)};
}
const path=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});

export function benefitsCreditGrowthResult(kind,input){
  if(kind==='annualBenefitCap'){
    const p=benefitCapCalendar(input);
    return {metrics:[['Two service years: expense left with the household',p.netCost,'money'],['Additional starting cash needed before month-end resources',p.extra,'money'],['Reimbursements received after the twenty-fourth service month',p.afterServiceReceipts,'money']],note:'Hypothetical single benefit category with confirmed eligible bills for 24 consecutive months, beginning at the start of a benefit year. Each twelve-month service year resets the deductible and insurer-payment maximum. The annual maximum caps benefit dollars, not eligible expenses. Deductible applies first, then the coverage percentage, then the remaining benefit maximum. Eligibility and prices are assumed confirmed independently; no claim adjudication is calculated. Each bill is paid before that month’s income allocation and reimbursement receipts arrive at month-end. Reimbursement follows the entered whole-month lag, including zero. A payment received in a later year still consumes the benefit year of its service. The chart continues after month 24 only to collect delayed receipts; no more bills or allocations occur then. No premiums, clinical decision, treatment scheduling advice, coordination of benefits, tax credit, policy interpretation, return or borrowing is modeled. Negative cash is an unfunded bill, not credit approval.',charts:[
      {id:'benefit-service-year-cap',type:'line',title:'Allowed benefit payments can fall to zero before the service year ends',unit:'money',xMin:1,xLabel:'Service month',series:[path('Eligible bill in each service month',p.claims,'bill'),path('Benefit allowed against that service year',p.claims,'allowed',{dash:true})],note:'These are service-month entitlements under the chosen teaching rules, rather than receipt dates. The year-one cap does not continue into year two; both the cap and deductible reset at month thirteen. A quoted reimbursement percentage does not override either constraint.'},
      {id:'benefit-annual-cost-share',type:'stackbar',title:'Split each year’s eligible expense between insurer and household',unit:'money',seriesNames:['Allowed insurer benefit','Expense left with household'],rows:p.years.map(r=>({label:'Service year '+r.year,values:[r.benefit,r.household]})),note:'The two parts sum to that year’s eligible bills. The household part already contains the deductible, percentage cost sharing and expenses above the insurer-payment cap; adding those amounts again would double count them. Premiums and ineligible bills are outside this chart.'},
      {id:'benefit-bills-receipts-cash',type:'line',title:'Paying a covered bill and receiving reimbursement are separate events',unit:'money',xLabel:'Month',series:[path('Cash after the bill, before month-end resources',p.rows,'before'),path('Cash after allocation and receipts at month-end',p.rows,'after',{dash:true})],note:'The required starting cash is based on the lowest after-bill point. Even zero lag means receipt at month-end, after the bill. The tail after month 24 contains delayed reimbursements only. The annual cost split is unchanged when the lag changes, but the cash bridge can change.'},
      {id:'benefit-cap-lag-matrix',type:'heatmap',title:'Extra starting cash across reimbursement lags and annual benefit maxima',unit:'money',columns:['$500 cap','$1k','$1.5k','$2.5k'],rows:[0,1,2,3].map(receiptLag=>({label:receiptLag+' mo lag',values:[500,1000,1500,2500].map(annualMaximum=>benefitCapCalendar({...input,receiptLag,annualMaximum}).extra)})),note:'Rows replace receipt lag; columns replace the cap on insurer dollars per service year. Eligible bills, deductible, coverage share, starting cash and monthly allocation stay selected. Cells are extra starting cash needed to fund every bill before month-end resources; they are not coverage quotations, treatment recommendations or probabilities.'}
    ]};
  }
  if(kind==='creditSnapshot'){
    const p=creditSnapshotCalendar(input);
    return {metrics:[['Card A use at the assumed reporting snapshot',p.reportedShare,'percent'],['Combined use at the same assumed snapshot',p.combinedShare,'percent'],['Card A balance after day thirty',p.ending,'money']],note:'Hypothetical thirty-day balance ledger, excluding interest, fees, refunds and pending transactions. One purchase posts on each day, then the entered payment posts on its chosen day, capped at the balance then owed. The assumed reporting snapshot is after all transactions on that selected day. The other card balance and limit stay fixed and are assumed observed at the same snapshot. Utilization is balance divided by the stated limit; combined use is total balance divided by total limit, not an average of individual percentages. Report timing is an independent scenario assumption, not an issuer reporting schedule. This tool does not calculate a credit score, predict a score change, decide a lender outcome, establish available funds for the payment, assess whether an over-limit purchase would be authorized or model a payment deadline/grace period. Use actual statements and required payment dates.',charts:[
      {id:'credit-use-daily-balance',type:'line',title:'A scheduled balance changes between an opening date and a reporting snapshot',unit:'money',xLabel:'Day of the hypothetical month',series:[path('Card A scheduled balance',p.rows,'balance'),{name:'Card A stated credit limit',rows:[{x:0,value:input.creditLimit},{x:30,value:input.creditLimit}],dash:true}],note:'The assumed snapshot is day '+input.reportDay+', after that day’s purchase and any credited payment. A mathematical balance above the limit is a stress illustration, not approval to make that transaction. No balance is replaced by a credit-score estimate.'},
      {id:'credit-use-snapshot-ratios',type:'bar',title:'The date and denominator change the displayed utilization ratio',unit:'percent',unitLabel:'Balance divided by the corresponding credit limit (%)',rows:[{label:'Card A · opening snapshot',value:input.openingBalance/input.creditLimit},{label:'Card A · assumed reporting day',value:p.reportedShare},{label:'Card A · end of day thirty',value:p.ending/input.creditLimit},{label:'Both cards · same assumed reporting day',value:p.combinedShare}],note:'The first three rows use card A’s limit. The fourth uses both balances and both limits at the same assumed date. These ratios are not interchangeable and do not add up to a whole. No score threshold, lending decision or bureau formula is inferred.'},
      {id:'credit-use-debt-reconciliation',type:'waterfall',title:'A payment changes debt as well as a percentage',unit:'money',rows:[{label:'Opening card A balance',value:input.openingBalance},{label:'Thirty scheduled purchase amounts',value:p.purchases},{label:'Cash payment actually applied',value:-p.paid}],totalLabel:'Card A ending balance',note:'The actual payment is capped at the balance on its posting day. Any unused part of the requested payment remains outside this ledger. Later purchases can rebuild a balance after an early full repayment. The other card is excluded from this card A reconciliation.'},
      {id:'credit-use-payment-snapshot-matrix',type:'heatmap',title:'Card A utilization across payment-posting and snapshot dates',unit:'percent',columns:['Day 10','Day 15','Day 20','Day 30'],rows:[5,10,15,25].map(paymentDay=>({label:'Pay day '+paymentDay,values:[10,15,20,30].map(reportDay=>creditSnapshotCalendar({...input,paymentDay,reportDay}).reportedShare)})),note:'Rows replace the payment-posting day; columns replace the assumed snapshot day. Opening balance, purchases, requested payment and card A limit stay selected. The snapshot is after the day’s transactions. These date stresses do not establish actual reporting practices or justify delaying a required payment.'}
    ]};
  }
  if(kind==='pairedReturns'){
    const p=pairedReturnPath(input),reverse=pairedReturnPath(input,true),years=input.cycles*2;
    return {metrics:[['Arithmetic mean of the chosen annual returns',input.mean/100,'percent'],['Annual compound rate of every complete two-year pair',p.compound,'percent'],['Smooth-path ending value minus alternating-path ending value',p.smooth-p.alternating,'money']],note:'Original deterministic return illustration, with one initial amount and no external deposits or withdrawals. Every complete pair contains mean plus spread and mean minus spread; the arithmetic mean is therefore held constant. The selected number of pairs always produces an even horizon. Returns are nominal total returns with all distributions retained; no separate dividend yield is added. The smooth comparison earns the mean every year as a mathematical reference, not an available guaranteed return. A reversed pair changes interim balances but has the same complete-pair product without cash flows. No asset prices, historical series, market forecast, probabilities, inflation, fee, tax, contribution schedule or suitable allocation is calculated. Holding an arithmetic mean fixed while changing the spread is a controlled comparison, not a claim about achievable investments.',charts:[
      {id:'compound-paired-annual-returns',type:'signedbar',title:'Two annual returns can have a positive average and a much smaller compound result',unit:'percent',unitLabel:'Chosen nominal annual total returns (%)',rows:[{label:'First year in each pair',value:(input.mean+input.spread)/100},{label:'Second year in each pair',value:(input.mean-input.spread)/100},{label:'Arithmetic mean of the pair',value:input.mean/100}],note:'Each gross growth factor is one plus the annual return. The paired factor is their product, not one plus the sum of the two returns. Signed bars preserve gains and losses around an explicit zero line.'},
      {id:'compound-paired-capital-paths',type:'line',title:'Compare full capital paths under the same arithmetic mean',unit:'money',xLabel:'Years after the initial investment',series:[path('Smooth mean every year',p.rows,'smooth'),path('Higher return first in each pair',p.rows,'alternating',{dash:true}),path('Lower return first in each pair',reverse.rows,'alternating')],note:'The two alternating paths meet after every complete pair and at year '+years+'. They differ between those endpoints. Their shared compound rate differs from the smooth reference when spread is positive. No later saving or withdrawal is present to create a cash-flow timing effect.'},
      {id:'compound-mean-spread-matrix',type:'heatmap',title:'Compound annual rates across arithmetic means and paired spreads',unit:'percent',signed:true,columns:['0 pp','10 pp','20 pp','30 pp'],rows:[0,3,5,8].map(mean=>({label:mean+'% mean',values:[0,10,20,30].map(spread=>pairedCompoundRate(mean,spread))})),note:'Rows replace the arithmetic mean; columns replace the percentage-point distance of each return from that mean. Each cell is sqrt((1 + mean)² − spread²) − 1, with rates expressed as decimals inside the formula. Negative cells are compound losses, not statistical confidence bounds or expected returns.'},
      {id:'compound-paired-horizon-values',type:'groupbar',title:'The difference accumulates over repeated complete pairs',unit:'money',seriesNames:['Smooth annual mean','Alternating selected pair'],rows:[1,5,10,15].map(cycles=>{const q=pairedReturnPath({...input,cycles});return {label:cycles*2+' years',values:[q.smooth,q.alternating]};}),note:'These separate horizon comparisons keep the entered starting capital, arithmetic mean and spread. They replace the selected number of pairs with the displayed horizons. Ending amounts contain no new contributions and assign no likelihood to a future market path.'}
    ]};
  }
  throw Error('Unknown benefits, credit and compounding topic.');
}
