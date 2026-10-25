export const runwaySpendingDefinitions={
  jobLossRunway:{title:'Explore an 18-month job-loss cash calendar',fields:[
    ['reserve','Accessible cash at the start (CAD)',18000,0,100000,1000],['settlement','Confirmed one-off net settlement (CAD)',12000,0,100000,1000],
    ['settlementMonth','Month the settlement is actually received',2,1,18,1],['continuing','Other continuing household income per month, net (CAD)',1500,0,10000,100],
    ['support','Confirmed temporary support per month, net (CAD)',1800,0,10000,100],['supportDelay','Full months before temporary support starts',2,0,12,1],
    ['supportMonths','Maximum number of temporary-support payments',6,0,12,1],['jobMonth','First month of new net earnings; 19 means after the chart',10,1,19,1],
    ['newPay','New monthly earnings, in addition to continuing income (CAD)',4200,0,15000,100],['spending','Normal monthly household cash spending (CAD)',4500,0,15000,100],
    ['cut','Monthly spending reduction before new earnings start (CAD)',600,0,10000,100],['upfront','Immediate transition costs before month one (CAD)',1000,0,30000,500]
  ]},
  retirementPhases:{title:'Explore spending categories over thirty retirement years',fields:[
    ['essential','Annual essential spending at retirement, excluding added care (CAD)',36000,0,150000,1000],['discretionary','Annual discretionary spending at retirement (CAD)',18000,0,100000,1000],
    ['laterShare','Discretionary quantity retained from year 11 onward (%)',60,0,150,5],['care','Additional annual care budget in retirement-start dollars (CAD)',18000,0,100000,1000],
    ['careYear','First retirement year with the added care budget',21,1,30,1],['inflation','Annual general price increase assumption (%)',2,0,8,.5],
    ['careInflation','Annual care price increase from retirement start (%)',4,0,10,.5],['income','Annual non-portfolio income at retirement, net (CAD)',36000,0,150000,1000],
    ['incomeGrowth','Annual increase in that net income (%)',2,0,8,.5]
  ]},
  eventBudget:{title:'Explore booking deposits and an event-month final bill',fields:[
    ['fixed','Fixed event costs, fully inclusive of taxes and fees (CAD)',6000,0,50000,500],['guests','Guest count used in the quote',80,0,300,5],
    ['perGuest','Fully inclusive cost per guest (CAD)',100,0,500,10],['other','Other fixed costs included in the booking quote (CAD)',4000,0,30000,500],
    ['depositPercent','Share of the base quote paid at booking, time zero (%)',30,0,100,5],['contingencyPercent','Additional allowance on the base quote, spent at the event (%)',10,0,40,5],
    ['eventMonth','Month when the final bill is due, before that month’s saving',12,3,24,1],['cash','Existing cash allocated to this event (CAD)',6000,0,100000,500],
    ['monthly','Monthly saving at each earlier month-end (CAD)',1000,0,10000,100]
  ]}
};

export function jobLossCalendar(input,reduced=true){
  let net=-input.upfront,lowest=Math.min(0,net),firstGap=input.reserve+net<0?0:null,supportTotal=0,earningsTotal=0,spendingTotal=0;
  const rows=[{x:0,cash:input.reserve+net,income:0,support:0,newPay:0,settlement:0,spending:0}];
  for(let month=1;month<=18;month++){
    const working=month>=input.jobMonth,newPay=working?input.newPay:0;
    const support=!working&&month>input.supportDelay&&month<=input.supportDelay+input.supportMonths?input.support:0;
    const settlement=month===input.settlementMonth?input.settlement:0;
    const spending=Math.max(0,input.spending-(!working&&reduced?input.cut:0));
    const income=input.continuing+newPay+support;
    net+=income+settlement-spending;lowest=Math.min(lowest,net);
    supportTotal+=support;earningsTotal+=newPay;spendingTotal+=spending;
    if(firstGap===null&&input.reserve+net<0)firstGap=month;
    rows.push({x:month,cash:input.reserve+net,income,support,newPay,settlement,spending});
  }
  const required=-lowest;
  return {rows,required,extra:Math.max(0,required-input.reserve),firstGap,supportTotal,earningsTotal,spendingTotal,ending:input.reserve+net};
}

export function retirementSpending(input){
  const rows=[];
  let cumulativeGap=0,totalSpending=0,totalIncome=0;
  for(let year=1;year<=30;year++){
    const t=year-1,price=(1+input.inflation/100)**t;
    const essential=input.essential*price,discretionary=input.discretionary*(year<=10?1:input.laterShare/100)*price;
    const care=year>=input.careYear?input.care*(1+input.careInflation/100)**t:0;
    const spending=essential+discretionary+care,income=input.income*(1+input.incomeGrowth/100)**t;
    const gap=Math.max(0,spending-income);cumulativeGap+=gap;totalSpending+=spending;totalIncome+=income;
    rows.push({x:year,essential,discretionary,care,spending,income,gap,cumulativeGap,real:spending/price,flat:(input.essential+input.discretionary)*price});
  }
  return {rows,cumulativeGap,totalSpending,totalIncome,peakGap:Math.max(...rows.map(r=>r.gap))};
}

export function eventCashCalendar(input){
  const base=input.fixed+input.guests*input.perGuest+input.other,deposit=base*input.depositPercent/100;
  const contingency=base*input.contingencyPercent/100,total=base+contingency,final=total-deposit;
  let cash=input.cash-deposit,lowest=cash;
  const rows=[{x:0,cash,bill:deposit,saving:0,saved:0}];
  for(let month=1;month<=input.eventMonth;month++){
    const bill=month===input.eventMonth?final:0,saving=month<input.eventMonth?input.monthly:0;
    cash-=bill;lowest=Math.min(lowest,cash);cash+=saving;
    rows.push({x:month,cash,bill,saving,saved:input.monthly*Math.min(month,input.eventMonth-1)});
  }
  return {rows,base,deposit,contingency,total,final,extra:Math.max(0,-lowest),bookingGap:Math.max(0,deposit-input.cash),monthlyTarget:Math.max(0,(total-input.cash)/(input.eventMonth-1)),ending:cash};
}
const path=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});

export function runwaySpendingResult(kind,input){
  if(kind==='jobLossRunway'){
    const p=jobLossCalendar(input),normal=jobLossCalendar(input,false);
    return {metrics:[['Additional starting cash needed, with the reduction',p.extra,'money'],['First unfunded point, with the reduction',p.firstGap,'integer',p.firstGap===null?'None in 18 months':p.firstGap===0?'Before month one':'Month '+p.firstGap],['Cash after month 18, with the reduction',p.ending,'money']],note:'Original hypothetical 18-month cash ledger. Immediate transition costs are paid at time zero. All monthly receipts arrive at the start of their labeled month, before that month’s spending. Continuing net income remains throughout; new net earnings are additional. Temporary support begins after the entered full delay, lasts at most the entered payment count and stops when new earnings start. There is no catch-up payment for delayed months. One net settlement is received in its independently entered month regardless of work status. The spending reduction applies only before new earnings begin and cannot make spending negative. Accessible cash earns zero. No EI eligibility, statutory amount, waiting period, severance allocation, tax, benefit coordination, legal entitlement, credit facility or investment sale is calculated. Negative cash represents an unfunded requirement, not a permitted overdraft.',charts:[
      {id:'job-loss-receipts',type:'stackbar',title:'Recurring income can stop before new earnings arrive',unit:'money',seriesNames:['Continuing income','Temporary support','New earnings'],rows:p.rows.slice(1).map(r=>({label:'Month '+r.x,values:[input.continuing,r.support,r.newPay]})),note:'The one-off settlement is excluded from recurring income and appears in the cash reconciliation below. Temporary support ends when either its payment window ends or new earnings start. Receipt amounts are independent net assumptions, not calculated EI benefits.'},
      {id:'job-loss-cash-path',type:'line',title:'Compare the lowest cash point with the final balance',unit:'money',xLabel:'Months after the income interruption',series:[path('Temporary spending reduction',p.rows,'cash'),path('Normal spending throughout',normal.rows,'cash',{dash:true})],note:'Time zero is after immediate costs. Every later point is after that month’s receipts and spending. A later settlement or salary can lift the ending balance after an earlier shortfall. Additional starting cash is calculated from the lowest point, including time zero.'},
      {id:'job-loss-reconciliation',type:'waterfall',title:'Reconcile all eighteen months of the reduced-spending scenario',unit:'money',rows:[{label:'Starting accessible cash',value:input.reserve},{label:'Net settlement received once',value:input.settlement},{label:'Continuing income over 18 months',value:input.continuing*18},{label:'Temporary support actually received',value:p.supportTotal},{label:'New net earnings received',value:p.earningsTotal},{label:'Immediate transition costs',value:-input.upfront},{label:'Household spending over 18 months',value:-p.spendingTotal}],totalLabel:'Cash after month 18',note:'This endpoint does not test liquidity at earlier dates. It counts support only for months when it is paid and counts the settlement once. It excludes borrowing and assumes no investment return.'},
      {id:'job-loss-search-matrix',type:'heatmap',title:'Extra starting cash across job-start dates and settlement timing',unit:'money',columns:['Month 1','Month 3','Month 6','Month 9'],rows:[4,7,10,13].map(jobMonth=>({label:'Work in m'+jobMonth,values:[1,3,6,9].map(settlementMonth=>jobLossCalendar({...input,jobMonth,settlementMonth}).extra)})),note:'Rows replace the first month of new earnings; columns replace the settlement receipt month. The reduced budget, net income amounts, support window, settlement amount and current reserve stay selected. Cells show additional starting cash needed to prevent any modeled shortfall. They are timing stresses without probabilities.'}
    ]};
  }
  if(kind==='retirementPhases'){
    const p=retirementSpending(input);
    return {metrics:[['First-year spending, including care if selected',p.rows[0].spending,'money'],['Largest annual spending gap over thirty years',p.peakGap,'money'],['Sum of positive annual gaps, without growth or discounting',p.cumulativeGap,'money']],note:'Hypothetical thirty-year category budget beginning at retirement, with year one at the entered starting prices. Essentials increase at general inflation. Discretionary quantity is unchanged for years 1–10, then resets to the selected share from year 11; its prices still increase at general inflation. Additional care starts in the selected year. Its input is in retirement-start dollars, inflated from year one at the separate care price rate, including the years before care begins. Non-portfolio income is entered net and increases at its own assumed rate. Annual funding gap is max(spending minus income, zero). No benefit entitlement, tax, portfolio return, withdrawal order, probability of care, mortality, present value or required starting portfolio is calculated. Surplus income is not saved or carried to later years in the gap total. Care is an additional non-overlapping budget; remove displaced costs separately in a personal plan.',charts:[
      {id:'retirement-category-phases',type:'stackbar',title:'The spending mix can change even as prices keep rising',unit:'money',seriesNames:['Essentials','Discretionary','Added care'],rows:[1,10,11,input.careYear,30].filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b).map(year=>{const r=p.rows[year-1];return {label:'Retirement year '+year,values:[r.essential,r.discretionary,r.care]};}),note:'Selected years expose the year-11 discretionary change and the chosen care start. Every bar uses that year’s nominal CAD. The care allowance is additive; it does not automatically replace housing, food or other essentials.'},
      {id:'retirement-real-nominal-spending',type:'line',title:'Compare nominal spending with the retirement-start purchasing-power basis',unit:'money',xMin:1,xLabel:'Retirement year',series:[path('Nominal annual spending',p.rows,'spending'),path('Spending in retirement-start dollars',p.rows,'real',{dash:true}),path('Initial budget at general inflation only',p.rows,'flat')],note:'The real series divides the entire budget by cumulative general inflation. Care prices can rise differently, so this deflated amount need not equal the original care input. The simple initial-budget comparison has neither a discretionary change nor an added care expense. These are chosen paths, not observed retiree-spending statistics.'},
      {id:'retirement-income-spending-gap',type:'line',title:'Compare annual spending with independently indexed net income',unit:'money',xMin:1,xLabel:'Retirement year',series:[path('Household spending',p.rows,'spending'),path('Non-portfolio net income',p.rows,'income',{dash:true}),path('Positive annual funding gap',p.rows,'gap')],note:'The gap is zero whenever income exceeds spending. This does not mean the excess disappears in a real household; this budget tool simply does not model its saving or later use. The gap is an after-tax cash requirement, not a gross registered-account withdrawal.'},
      {id:'retirement-care-price-matrix',type:'heatmap',title:'Largest annual gap across additional care budgets and care price growth',unit:'money',columns:['0%','2%','4%','6%'],rows:[0,12000,24000,36000].map(care=>({label:'$'+care/1000+'k care',values:[0,2,4,6].map(careInflation=>retirementSpending({...input,care,careInflation}).peakGap)})),note:'Rows replace additional annual care in retirement-start dollars; columns replace its annual price increase from retirement start. Care begins in the selected year. Other budget and income assumptions stay selected. Cells show peak annual gaps rather than a probability-weighted care cost, lifetime spending or capital requirement.'}
    ]};
  }
  if(kind==='eventBudget'){
    const p=eventCashCalendar(input);
    return {metrics:[['Base quote plus the additional allowance',p.total,'money'],['Additional cash needed now at the selected saving rate',p.extra,'money'],['Monthly saving needed before the final bill',p.monthlyTarget,'money',p.bookingGap>0?'Fund the booking deposit first':undefined]],note:'Hypothetical event budget with fixed quotes and no inflation or interest. Fixed, guest and other costs are fully inclusive of any taxes and fees; no tax is calculated. The booking deposit is the selected share of the full base quote and is paid immediately, before any new saving. The rest of that quote plus the full additional contingency allowance is paid at the beginning of the selected event month. Saving arrives at each earlier month-end only; the event month’s paycheque cannot fund its opening bill. Guests and prices stay fixed after booking. No gifts, reimbursements, refunds, cancellation, contract interpretation, credit, return or other household goal is assumed. Negative cash is unfunded spending. A higher future saving rate cannot repair a booking deposit already due. The additional allowance is assumed fully spent in this stress budget; it is not a statistical forecast.',charts:[
      {id:'event-quote-components',type:'stackbar',title:'Guest costs and fixed costs respond differently to the plan',unit:'money',seriesNames:['Fixed event costs','Guest-based costs','Other fixed costs'],rows:[{label:'Base booking quote',values:[input.fixed,input.guests*input.perGuest,input.other]}],note:'Guest costs equal count times the fully inclusive per-guest quote. The extra contingency allowance is excluded from this base-quote bar and included in the payment schedule. Reducing guest count does not automatically change either fixed-cost input.'},
      {id:'event-deposit-final-calendar',type:'bar',title:'Separate the booking deposit from the event-month cash call',unit:'money',rows:[{label:'Booking at time zero',value:p.deposit},{label:'Beginning of event month '+input.eventMonth,value:p.final}],note:'The final bill is unpaid base quote plus the entire additional allowance. The deposit is part of the base quote, not a second expense on top. Payment dates and deposit percentages are invented teaching terms; use actual supplier contracts for a real event.'},
      {id:'event-saving-cash-calendar',type:'line',title:'Count only the saving transfers that arrive before the bill',unit:'money',xLabel:'Months after booking',series:[path('Cash after bills and permitted saving transfers',p.rows,'cash'),{name:'Total of earlier month-end saving transfers',rows:p.rows.map(r=>({x:r.x,value:r.saved})),dash:true}],note:'Time zero is after the deposit. Transfers occur at the end of months 1 through '+(input.eventMonth-1)+'. The final bill is paid at the beginning of month '+input.eventMonth+', with no additional transfer afterward. The saving-transfer line excludes starting cash and is not money remaining after expenses.'},
      {id:'event-guest-saving-matrix',type:'heatmap',title:'Extra starting cash across guest counts and monthly saving amounts',unit:'money',columns:['$500 / mo','$1k','$1.5k','$2k'],rows:[40,80,120,160].map(guests=>({label:guests+' guests',values:[500,1000,1500,2000].map(monthly=>eventCashCalendar({...input,guests,monthly}).extra)})),note:'Rows replace the guest count; columns replace monthly saving. Fixed costs, unit guest cost, deposit percentage, allowance, event month and allocated starting cash remain selected. Cells measure extra cash needed at booking to avoid any gap, including the immediate deposit. They are not total event prices, cost forecasts or likelihoods.'}
    ]};
  }
  throw Error('Unknown runway-and-spending topic.');
}
