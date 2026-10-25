import { caregivingSource } from './planning-care-data.js';
export const transitionDefinitions={
  retirementBridge:{title:'Explore a retirement-income bridge',fields:[
    ['spending','Annual spending target (year-1 CAD, net)',60000,0,200000,5000],['base','Annual income available from year 1 (year-1 CAD, net)',18000,0,100000,1000],
    ['later','Additional annual income starting later (year-1 CAD, net)',24000,0,100000,1000],['startYear','First year of additional income',6,1,15,1],
    ['work','Annual temporary work income (year-1 CAD, net)',12000,0,100000,1000],['workYears','Years with temporary work income',3,0,15,1],
    ['years','Years in the illustration',12,5,20,1],['inflation','Annual increase in all cash-flow amounts (%)',2,0,5,.5],
    ['rate','Assumed annual portfolio return after costs (%)',4,-5,8,.5],['reserve','Starting portfolio available for this plan (CAD)',200000,0,1000000,10000]
  ]},
  caregiving:{title:'Explore the cash cost of a care arrangement',fields:[
    ['hours','Paid support hours per week',8,0,40,1],['hourly','Cost per paid support hour (CAD)',35,0,100,5],
    ['travel','Additional monthly transport and supplies (CAD)',150,0,3000,50],['lostIncome','Monthly reduction in net earnings (CAD)',800,0,10000,100],
    ['support','Monthly confirmed net support received (CAD)',300,0,10000,100],['surplus','Monthly budget surplus before this arrangement (CAD)',500,0,10000,100],
    ['setup','One-time setup cost at the start (CAD)',2000,0,50000,500],['months','Months in the arrangement',24,1,60,1],
    ['reserve','Starting cash allocated to this plan (CAD)',12000,0,200000,1000]
  ]},
  estateCash:{title:'Explore an estate cash-timing ledger',fields:[
    ['cash','Estate cash assumed available at the start (CAD)',25000,0,500000,5000],['immediate','Immediate one-time obligations (CAD)',20000,0,200000,1000],
    ['monthly','Monthly carrying and administration costs (CAD)',1500,0,10000,100],['taxPayment','Separate tax and debt payment (CAD)',60000,0,500000,5000],
    ['dueMonth','Month of that separate payment',6,1,24,1],['sale','Later asset-sale cash, net of sale costs and loans (CAD)',250000,0,2000000,10000],
    ['receiptMonth','Month sale cash is assumed accessible',9,1,24,1]
  ]}
};
export function bridgePlan(input){
  let value=input.reserve,unfunded=0,totalGap=0,bridgeGap=0,capital=0;
  const rows=[{x:0,value,unfunded}];
  for(let year=1;year<=input.years;year++){
    const factor=(1+input.inflation/100)**(year-1),spending=input.spending*factor;
    const base=input.base*factor,later=year>=input.startYear?input.later*factor:0,work=year<=input.workYears?input.work*factor:0;
    const income=base+later+work,gap=Math.max(0,spending-income),surplus=Math.max(0,income-spending);
    const available=value*(1+input.rate/100),paid=Math.min(available,gap);
    value=available-paid;unfunded+=gap-paid;totalGap+=gap;if(year<input.startYear)bridgeGap+=gap;
    capital+=gap/(1+input.rate/100)**year;
    rows.push({x:year,value,unfunded,spending,base,later,work,income,gap,surplus,paid});
  }
  return {rows,totalGap,bridgeGap,capital,value,unfunded};
}
export function careCash(input){
  const paid=input.hours*input.hourly*52/12,draw=paid+input.travel+input.lostIncome-input.support-input.surplus;
  const required=input.setup+Math.max(0,draw*input.months),extra=Math.max(0,required-input.reserve);
  const rows=Array.from({length:input.months+1},(_,x)=>({x,value:input.reserve-input.setup-draw*x}));
  return {paid,draw,required,extra,rows,ending:rows.at(-1).value};
}
export function estateLedger(input){
  let value=input.cash-input.immediate;const rows=[{x:0,value}];
  for(let month=1;month<=24;month++){
    const receipt=month===input.receiptMonth?input.sale:0,payment=input.monthly+(month===input.dueMonth?input.taxPayment:0);
    value+=receipt-payment;rows.push({x:month,value,receipt,payment});
  }
  return {rows,ending:value,extra:Math.max(0,-Math.min(...rows.map(r=>r.value))),costs:input.immediate+input.monthly*24+input.taxPayment};
}
export function transitionResult(kind,input){
  if(kind==='retirementBridge'){
    const p=bridgePlan(input);
    return {metrics:[['Requested savings withdrawals before later income',p.bridgeGap,'money'],['Starting capital for all modeled withdrawals',p.capital,'money'],['Cumulative unfunded withdrawals',p.unfunded,'money']],note:'Hypothetical annual net cash flows over the selected horizon, not a lifetime retirement projection. Spending and all income inputs are stated in year-1 CAD and increase at the same selected rate. Temporary work ends after the selected years; additional income begins in the selected start year. Income arrives and withdrawals occur at year-end, after the portfolio earns its constant effective annual return. Withdrawals are capped at available assets, with unmet amounts recorded separately. Surplus income is not added to the portfolio. No tax, benefit eligibility, pension quotations, start-age adjustments, mortality or stochastic returns are calculated. No spending or terminal capital requirement beyond the horizon is included.',charts:[
      {id:'bridge-income',type:'line',title:'Income sources can begin and end on different dates',unit:'money',xMin:1,xLabel:'Year of the retirement example',series:[{name:'Spending target',rows:p.rows.slice(1).map(r=>({x:r.x,value:r.spending}))},{name:'Income before savings withdrawals',dash:true,rows:p.rows.slice(1).map(r=>({x:r.x,value:r.income}))}],note:'Income combines the ongoing source, additional source after its start year, and temporary work while active. A line between annual observations is a visual guide, not a monthly payment schedule. Income above spending is an unallocated surplus, not an assumed portfolio deposit.'},
      {id:'bridge-gaps',type:'bar',title:'The savings withdrawal request changes as the income mix changes',unit:'money',rows:p.rows.slice(1).map(r=>({label:'Year '+r.x,value:r.gap})),note:'Each year requests the positive difference between spending and non-portfolio income. Zero means the selected income covers that year’s spending; it does not establish long-term adequacy. Values are nominal amounts in the year shown.'},
      {id:'bridge-assets',type:'line',title:'Track portfolio assets and unmet withdrawals separately',unit:'money',xLabel:'Years since the starting date',series:[{name:'Remaining portfolio',rows:p.rows},{name:'Cumulative unfunded withdrawals',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.unfunded}))}],note:'The portfolio cannot go below zero. The second curve is accumulated nominal spending shortfall, not an asset, debt balance or funded payment. It receives no interest. Future income surpluses do not retrospectively fund an earlier shortfall.'},
      {id:'bridge-matrix',type:'heatmap',title:'Capital required for different spending and income start dates',unit:'money',columns:['Year 1','Year 3','Year 6','Year 9'],rows:[.8,1,1.2,1.4].map(scale=>({label:Math.round(scale*100)+'% spend',values:[1,3,6,9].map(startYear=>bridgePlan({...input,startYear,spending:input.spending*scale}).capital)})),note:'Cells discount every requested year-end withdrawal over the selected horizon at the chosen constant return. Rows scale spending; columns change only the additional-income start year. Its annual amount does not rise when delayed. These are funding comparisons, not recommendations about CPP/OAS timing or actual pension entitlements. No terminal reserve is required.'}
    ]};
  }
  if(kind==='caregiving'){
    const p=careCash(input);
    return {metrics:[['Monthly draw / replenishment after budget surplus',p.draw,'money'],['Starting cash needed for the selected schedule',p.required,'money'],['Additional cash beyond selected reserve',p.extra,'money']],note:'Hypothetical household cash impact. Paid support uses 52 weeks divided by 12 months; its hourly cost and hours are entered assumptions, not market averages or care recommendations. Add transport/supplies and the reduction in net earnings, then subtract confirmed net support and the household’s pre-care monthly budget surplus. Setup cost is paid at time zero; recurring net amounts settle at month-end. No interest, inflation, tax credits, benefit entitlement, reimbursements in arrears, clinical care needs or lost pension contributions are calculated. The official survey graphic is fixed and separate from these scenario inputs.',charts:[
      {id:'care-context',type:'bar',title:'Unpaid caregiving in the surveyed population, 2022',unit:'percent',unitLabel:'Share of survey target population (%)',source:caregivingSource.url,sourceLabel:'Statistics Canada · 2022 caregiving survey',rows:caregivingSource.rows.map(r=>({label:r.label,value:r.percent/100})),note:'Canadian Social Survey Wave 6: non-institutionalized people aged 15+ living off-reserve in the ten provinces; care in the previous twelve months. Categories are mutually exclusive. Rounded point estimates; 95% confidence intervals are in the source. This does not estimate a household’s future care needs or paid-care costs.'},
      {id:'care-monthly',type:'waterfall',title:'Care bills and lower earnings both affect monthly cash',unit:'money',rows:[{label:'Paid support',value:p.paid},{label:'Transport and supplies',value:input.travel},{label:'Reduction in net earnings',value:input.lostIncome},{label:'Confirmed net support received',value:-input.support},{label:'Pre-care budget surplus applied',value:-input.surplus}],totalLabel:'Monthly draw / replenishment',note:'Positive total means cash must be drawn from reserves or another source; negative means the entered monthly resources exceed this incremental burden. Lost earnings are a reduction in household receipts, not an invoice paid to a provider. Setup cost is excluded here and included at the start of the reserve path.'},
      {id:'care-reserve',type:'line',title:'Follow the cash position after setup and recurring costs',unit:'money',xLabel:'Months after setup',series:[{name:'Cash position under the selected arrangement',rows:p.rows}],note:'Month zero is after the one-time setup cost. Negative positions show an unfunded amount; they are not an approved overdraft or actual negative account balance. A positive monthly replenishment does not remove the need to fund setup before it arrives.'},
      {id:'care-matrix',type:'heatmap',title:'Additional starting cash across paid hours and duration',unit:'money',columns:['6 mo','12 mo','24 mo','36 mo'],rows:[0,4,8,16].map(hours=>({label:hours+' h/week',values:[6,12,24,36].map(months=>careCash({...input,hours,months}).extra)})),note:'Rows change paid support hours; columns change the duration. All other selected costs, lost earnings, support, baseline surplus, setup cost and starting reserve stay fixed. Cells show additional cash beyond that reserve, with a zero floor. They do not determine an appropriate care package.'}
    ]};
  }
  if(kind==='estateCash'){
    const p=estateLedger(input),earlier=estateLedger({...input,receiptMonth:Math.max(1,input.receiptMonth-3)});
    return {metrics:[['Maximum additional cash needed',p.extra,'money'],['Total entered obligations over 24 months',p.costs,'money'],['Ending cash position after 24 months',p.ending,'money']],note:'Hypothetical estate-only cash ledger over 24 months. Starting cash is assumed legally accessible; immediate obligations settle at time zero. The selected asset-sale receipt arrives at the start of its month, with recurring costs and the separate tax/debt payment at month-end. Sale cash is net of sale costs and secured loans but before the separate tax/debt payment entered here. No estate distribution, other asset valuation, interest, borrowing cost, tax assessment, probate calculation or claim priority is determined. Dates and amounts are placeholders, not legal deadlines or processing-time estimates. A positive cash position does not authorize distribution.',charts:[
      {id:'estate-amounts',type:'bar',title:'An eventual cash receipt is different from cash available now',unit:'money',rows:[{label:'Cash assumed accessible at time zero',value:input.cash},{label:'Later net asset-sale receipt',value:input.sale},{label:'Entered 24-month obligations',value:p.costs}],note:'The later receipt enters cash only in the selected month. These amounts are not a full balance sheet or a test of legal estate solvency. Proceeds exclude selling costs and secured loans; the separate tax/debt payment must not be counted twice.'},
      {id:'estate-path',type:'line',title:'The receipt date can change the deepest cash shortfall',unit:'money',xLabel:'Months after immediate obligations',series:[{name:'Selected receipt month '+input.receiptMonth,rows:p.rows},{name:'Receipt month '+Math.max(1,input.receiptMonth-3),rows:earlier.rows,dash:true}],note:'Both paths have the same receipts and payments in total; only asset-sale access moves, up to three months earlier. Negative positions are funding needs, not an available credit facility. Same-month receipts precede the entered month-end payments; within-month timing could change the result.'},
      {id:'estate-bridge',type:'waterfall',title:'Reconcile the endpoint without losing the timing problem',unit:'money',rows:[{label:'Starting accessible estate cash',value:input.cash},{label:'Later net asset-sale receipt',value:input.sale},{label:'Immediate obligations',value:-input.immediate},{label:'24 months of recurring costs',value:-input.monthly*24},{label:'Separate tax and debt payment',value:-input.taxPayment}],totalLabel:'Ending cash position',note:'This is a totals reconciliation, not the order of actual payments. A positive endpoint can coexist with an earlier shortage. It is not a distributable estate value; unmodeled liabilities, claims, costs and legal requirements may remain.'},
      {id:'estate-matrix',type:'heatmap',title:'Additional cash needed when payment and receipt dates move',unit:'money',columns:['Sale m3','Sale m6','Sale m9','Sale m12'],rows:[3,6,9,12].map(dueMonth=>({label:'Due m'+dueMonth,values:[3,6,9,12].map(receiptMonth=>estateLedger({...input,dueMonth,receiptMonth}).extra)})),note:'Each cell is the largest negative cash position, floored at zero, across the full 24-month ledger after selected starting cash. Rows change the separate payment month; columns change the receipt month. Immediate obligations and recurring costs remain fixed. Same-month receipts arrive first by convention.'}
    ]};
  }
  throw Error('Unknown financial-transition topic.');
}
