// More planning topics. Every amount and rate is a reader-controlled hypothetical assumption.
export const additionalDefinitions = {
  mortgage:{title:'Explore a mortgage renewal',fields:[
    ['balance','Mortgage balance today (CAD)',400000,10000,2000000,10000],['rate','Current quoted annual rate (%)',4,0,12,.25],
    ['years','Remaining amortization (years)',20,10,30,1],['renewal','Quoted rate after five years (%)',6,0,12,.25]
  ]},
  protection:{title:'Explore a family funding gap',fields:[
    ['gap','First annual income shortfall (CAD)',40000,0,200000,1000],['years','Years of support',20,1,40,1],
    ['inflation','Annual shortfall increase (%)',2,0,6,.5],['discount','Assumed net discount rate (%)',3,0,8,.5],
    ['immediate','Immediate costs to fund (CAD)',50000,0,1000000,5000],['assets','Assets allocated to this need (CAD)',100000,0,3000000,10000],
    ['cover','Existing death benefits (CAD)',300000,0,5000000,10000]
  ]},
  education:{title:'Explore an education funding plan',fields:[
    ['cost','One study year at today’s prices (CAD)',20000,1000,100000,1000],['years','Years until study starts',12,1,18,1],
    ['study','Number of study years',4,1,6,1],['inflation','Annual education-cost increase (%)',3,0,8,.5],
    ['initial','Existing education savings (CAD)',10000,0,500000,1000],['monthly','Monthly amount saved (CAD)',200,0,3000,50],
    ['rate','Assumed annual return before study (%)',4,-5,10,.5]
  ]},
  networth:{title:'Explore a household balance sheet',fields:[
    ['home','Home value (CAD)',600000,0,3000000,10000],['investments','Market investments (CAD)',150000,0,3000000,10000],
    ['cash','Cash and deposits (CAD)',30000,0,1000000,1000],['mortgage','Mortgage owed (CAD)',350000,0,2000000,10000],
    ['otherDebt','Other debts (CAD)',20000,0,1000000,1000],['homeFall','Home-value stress: decline (%)',20,0,60,5],
    ['marketFall','Investment stress: decline (%)',25,0,60,5]
  ]}
};
export function mortgageMonthlyRate(quotedPercent){return Math.expm1(Math.log1p(quotedPercent/200)/6);}
export function mortgagePayment(balance,quotedPercent,months){
  const r=mortgageMonthlyRate(quotedPercent);
  return r===0?balance/months:balance*r/-Math.expm1(-months*Math.log1p(r));
}
export function mortgageProjection(input,renew=false){
  let balance=input.balance,payment=mortgagePayment(balance,input.rate,input.years*12);
  const firstPayment=payment,rows=[{x:0,value:balance}],periods=[{principal:0,interest:0},{principal:0,interest:0}];
  let renewalPayment=payment,renewalBalance=balance;
  for(let month=1;month<=input.years*12;month++){
    if(month===61){renewalBalance=balance;if(renew)payment=mortgagePayment(balance,input.renewal,(input.years-5)*12);renewalPayment=payment;}
    const rate=renew&&month>60?input.renewal:input.rate;
    const interest=balance*mortgageMonthlyRate(rate),paid=Math.min(payment,balance+interest),principal=paid-interest;
    if(month<=120){const period=month<=60?0:1;periods[period].interest+=interest;periods[period].principal+=principal;}
    balance=Math.max(0,balance-principal);if(balance<1e-6)balance=0;
    if(month%12===0)rows.push({x:month/12,value:balance});
  }
  return {rows,periods,firstPayment,renewalPayment,renewalBalance};
}
export function fundingNeed({gap,years,inflation,discount,immediate}){
  const rows=Array.from({length:years},(_,i)=>({x:i+1,value:gap*(1+inflation/100)**i}));
  const incomePV=rows.reduce((sum,r)=>sum+r.value/(1+discount/100)**r.x,0);
  return {rows,incomePV,total:incomePV+immediate};
}
export function accumulatedSavings(initial,monthly,rate,years){
  const m=Math.expm1(Math.log1p(rate/100)/12),n=years*12;
  return initial*(1+rate/100)**years+monthly*(m===0?n:Math.expm1(n*Math.log1p(m))/m);
}
export function educationFunding(input){
  const costs=Array.from({length:input.study},(_,i)=>({label:'Study year '+(i+1),value:input.cost*(1+input.inflation/100)**(input.years+i)}));
  const target=costs.reduce((sum,r)=>sum+r.value,0),initialFuture=accumulatedSavings(input.initial,0,input.rate,input.years);
  const factor=accumulatedSavings(0,1,input.rate,input.years),required=Math.max(0,(target-initialFuture)/factor);
  return {costs,target,required,ending:accumulatedSavings(input.initial,input.monthly,input.rate,input.years)};
}
export function additionalResult(kind,input){
  if(kind==='mortgage'){
    const base=mortgageProjection(input),renew=mortgageProjection(input,true);
    return {metrics:[['Current monthly payment',base.firstPayment,'money'],['Payment after renewal',renew.renewalPayment,'money'],['Monthly payment change',renew.renewalPayment-base.firstPayment,'money']],note:'Hypothetical fixed-rate convention: quoted nominal annual rates compounded semi-annually, converted to equivalent monthly rates. Monthly payments at month-end. One assumed renewal after five years preserves the remaining amortization. No fees, prepayments, default insurance or later rate changes. Actual contracts and compounding can differ; this is not an approval or a rate quote.',charts:[
      {id:'mortgage-balance',type:'line',title:'The same end date, two payment paths',unit:'money',xLabel:'Years from today',series:[{name:'Current rate continues',rows:base.rows},{name:'Rate changes after year five',rows:renew.rows,dash:true}],note:'The new payment is recalculated at the end of year five. Both scenarios keep the selected original payoff date. Neither future rate path is a forecast.'},
      {id:'mortgage-payment',type:'bar',title:'The monthly budget at renewal',unit:'money',rows:[{label:'Current monthly payment',value:base.firstPayment},{label:'Payment at selected renewal rate',value:renew.renewalPayment}],note:'The renewal payment uses the balance left after 60 payments and the remaining amortization, not the original starting balance.'},
      {id:'mortgage-components',type:'stackbar',title:'Where the first ten years of payments go',unit:'money',seriesNames:['Principal repaid','Interest paid'],rows:renew.periods.map((p,i)=>({label:i?'Years 6–10 · assumed renewal':'Years 1–5 · current rate',values:[p.principal,p.interest]})),note:'Two successive five-year periods in the renewal scenario. They begin with different balances; this is a cash-flow breakdown, not a matched investment-performance comparison.'},
      {id:'mortgage-matrix',type:'heatmap',title:'Rate and amortization change the payment',unit:'money',columns:[10,15,20,25].map(y=>y+' years'),rows:[3,4,5,6].map(r=>({label:r+'% rate',values:[10,15,20,25].map(y=>mortgagePayment(input.balance,r,y*12))})),note:'Separate comparison using today’s starting balance. Each cell is a monthly payment at the displayed quoted rate and amortization; it does not show the projected renewal balance.'}
    ]};
  }
  if(kind==='protection'){
    const need=fundingNeed(input),resources=input.assets+input.cover,net=need.total-resources;
    return {metrics:[['Estimated funding need',need.total,'money'],['Allocated resources',resources,'money'],['Additional funding gap',Math.max(0,net),'money']],note:'Needs-based illustration assuming the loss occurs today. Annual after-tax household shortfalls arrive at year-end and increase at the selected rate. Discounting uses an assumed nominal return after costs and tax; no mortality probabilities are applied. Existing benefits and allocated assets are assumed fully available immediately. Policy terms, underwriting, benefit taxation, settlement timing and other income require separate verification.',charts:[
      {id:'protection-income',type:'line',title:'The household income shortfall over time',unit:'money',xLabel:'Years after the assumed loss',series:[{name:'Annual funding shortfall',rows:need.rows}],note:'First payment is at the end of year one. The shortfall is spending minus surviving income and benefits; it is not automatically the insured person’s salary.'},
      {id:'protection-bridge',type:'waterfall',title:'From family needs to the remaining gap',unit:'money',rows:[{label:'Immediate costs',value:input.immediate},{label:'Present value of income gap',value:need.incomePV},{label:'Allocated assets',value:-input.assets},{label:'Existing death benefits',value:-input.cover}],totalLabel:'Net gap / surplus',note:'Positive steps add needs; negative steps subtract allocated resources. A negative endpoint means a modeled surplus, not a recommendation to cancel coverage. Avoid counting one asset against several goals.'},
      {id:'protection-duration',type:'groupbar',title:'How long must the support last?',unit:'money',seriesNames:['Estimated need','Allocated resources'],rows:[5,10,20,30].map(years=>({label:years+' years of support',values:[fundingNeed({...input,years}).total,resources]})),note:'Same first annual shortfall, escalation, discount rate and immediate costs; only the support period changes. These durations are alternative assumptions.'},
      {id:'protection-matrix',type:'heatmap',title:'The shortfall across duration and discount rates',unit:'money',columns:[5,10,20,30].map(y=>y+' years'),rows:[0,2,4,6].map(discount=>({label:discount+'% net rate',values:[5,10,20,30].map(years=>Math.max(0,fundingNeed({...input,years,discount}).total-resources))})),note:'Cells show additional funding gaps after the selected resources. Zero does not establish that existing coverage is suitable. The discount rates are assumptions, not guaranteed investment returns.'}
    ]};
  }
  if(kind==='education'){
    const plan=educationFunding(input);
    const path=monthly=>Array.from({length:input.years+1},(_,x)=>({x,value:accumulatedSavings(input.initial,monthly,input.rate,x)}));
    return {metrics:[['Modeled study-cost reserve',plan.target,'money'],['Savings when study starts',plan.ending,'money'],['Monthly amount needed',plan.required,'money']],note:'Hypothetical all-in education-cost budget in CAD. Costs rise annually until and during study. Savings earn the selected effective annual return, with month-end deposits, only before study. The full sum of nominal study costs is reserved when study starts, with zero return during study. No grants, tax benefits, fees, scholarships, borrowing or work income are included. This is not an RESP-benefit or institution-fee quote.',charts:[
      {id:'education-savings',type:'line',title:'Current saving versus the modeled requirement',unit:'money',xLabel:'Years from today',series:[{name:'Selected monthly saving',rows:path(input.monthly)},{name:'Required monthly saving',rows:path(plan.required),dash:true}],note:'Both paths share the existing savings and assumed return. The required contribution is solved to fund the whole study-cost reserve by the start date; it can be zero if existing savings already suffice.'},
      {id:'education-costs',type:'bar',title:'The estimated cost of each study year',unit:'money',rows:plan.costs,note:'Today’s annual budget is inflated separately to each payment year. These values are future nominal costs, not official tuition averages. Housing, travel and other expenses must be included in the starting budget if relevant.'},
      {id:'education-bridge',type:'waterfall',title:'From projected costs to a funding gap',unit:'money',rows:[...plan.costs.map(r=>({...r,label:r.label+' cost'})),{label:'Savings at start of study',value:-plan.ending}],totalLabel:'Net gap / surplus',note:'A positive endpoint is an unfunded reserve under these assumptions. A negative endpoint is a modeled surplus. Do not add investment earnings a second time: they are already in the savings balance.'},
      {id:'education-matrix',type:'heatmap',title:'The monthly saving required under other assumptions',unit:'money',columns:[5,10,15,18].map(y=>y+' years'),rows:[0,3,5,7].map(rate=>({label:rate+'% return',values:[5,10,15,18].map(years=>educationFunding({...input,rate,years}).required)})),note:'Separate scenario grid: columns change the years until study, and rows change the pre-study return. Each later start also has higher modeled study costs when cost inflation is positive. The selected current monthly saving is not used to solve the required amount.'}
    ]};
  }
  if(kind==='networth'){
    const assets=input.home+input.investments+input.cash,debt=input.mortgage+input.otherDebt,net=assets-debt;
    const stresses=[['Selected values',0,0],['Home-value stress',input.homeFall/100,0],['Investment stress',0,input.marketFall/100],['Both stresses',input.homeFall/100,input.marketFall/100]];
    return {metrics:[['Total listed assets',assets,'money'],['Total listed debts',debt,'money'],['Net worth',net,'money']],note:'Simplified household snapshot using selected market values and debt balances on the same date. No sale costs, accrued tax, pensions, business interests or other assets and obligations are included. Cash, investments and a home differ in accessibility. Stress scenarios change asset values while holding debt balances fixed; no probabilities are assigned.',charts:[
      {id:'networth-bridge',type:'waterfall',title:'What you own, less what you owe',unit:'money',rows:[{label:'Home value',value:input.home},{label:'Market investments',value:input.investments},{label:'Cash and deposits',value:input.cash},{label:'Mortgage owed',value:-input.mortgage},{label:'Other debts',value:-input.otherDebt}],totalLabel:'Net worth',note:'The endpoint can be negative. List gross home value as an asset and mortgage debt as a liability, or use home equity alone; do not do both.'},
      {id:'networth-mix',type:'donut',title:'Where gross asset value is held',unit:'money',rows:[{label:'Home',value:input.home},{label:'Market investments',value:input.investments},{label:'Cash and deposits',value:input.cash}],note:'Composition of listed gross assets, before debt. A large share in a home is not the same as a large cash reserve. The data table retains exact amounts.'},
      {id:'networth-stress',type:'groupbar',title:'Asset values can move while debts remain',unit:'money',seriesNames:['Listed assets','Listed debts'],rows:stresses.map(([label,homeFall,marketFall])=>({label,values:[input.home*(1-homeFall)+input.investments*(1-marketFall)+input.cash,debt]})),note:'The difference between each pair corresponds to net worth. Debt does not automatically fall when the market value of the financed asset declines.'},
      {id:'networth-matrix',type:'heatmap',title:'Net worth under joint asset-value stresses',unit:'money',signed:true,columns:[0,10,20,30].map(x=>x+'% home'),rows:[0,10,20,30].map(x=>({label:x+'% market',values:[0,10,20,30].map(y=>input.home*(1-y/100)+input.investments*(1-x/100)+input.cash-debt)})),note:'Column labels are percentage declines in home value; row labels are percentage declines in market investments. Signed cell values are resulting net worth in CAD. Negative cells mean listed debts exceed stressed listed assets. These are scenarios, not forecasts.'}
    ]};
  }
  throw Error('Unknown additional planning topic.');
}
