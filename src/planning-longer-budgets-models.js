export const longerBudgetDefinitions={
  businessCash:{title:'Explore invoices, operating cash and an earmark for taxes',fields:[
    ['revenue','Invoices issued each month, excluding sales taxes (CAD)',12000,0,50000,1000],['costPercent','Monthly operating cash costs / invoiced revenue (%)',30,0,120,5],
    ['collectionDelay','Full-month collection delay',1,0,6,1],['draw','Monthly owner withdrawal at the start of the month (CAD)',4000,0,20000,500],
    ['taxAllowance','Hypothetical tax earmark / positive operating profit (%)',25,0,60,5],['cash','Starting cash allocated to this ledger (CAD)',10000,0,200000,1000]
  ]},
  homeReplacement:{title:'Explore a twelve-year home replacement reserve',fields:[
    ['roofCost','Roof replacement: cost in today’s CAD',15000,0,100000,1000],['roofCycle','Roof: assumed replacement interval (years)',8,1,20,1],
    ['heatCost','Heating replacement: cost in today’s CAD',7000,0,50000,500],['heatCycle','Heating: assumed replacement interval (years)',6,1,20,1],
    ['applianceCost','Appliance bundle: cost in today’s CAD',3000,0,30000,500],['applianceCycle','Appliances: assumed replacement interval (years)',4,1,20,1],
    ['costGrowth','Annual replacement-cost growth assumption (%)',3,0,8,.5],['saved','Starting replacement reserve (CAD)',5000,0,200000,1000],
    ['reserveMonthly','Month-end replacement-reserve contribution (CAD)',300,0,3000,50],['routine','Separate monthly routine-upkeep allowance (CAD)',100,0,2000,50]
  ]},
  givingCash:{title:'Compare gift schedules before an assumed tax saving arrives',fields:[
    ['monthlyGift','Monthly gift amount; annual alternatives use twelve times this (CAD)',200,0,2000,50],['budget','Other monthly budget surplus allocated to giving (CAD)',150,0,5000,50],
    ['taxSaving','Assumed usable tax saving attributable to year-one gifts (CAD)',600,0,12000,100],['savingMonth','Month when that saving reaches this budget (13–24)',16,13,24,1],
    ['cash','Starting cash allocated to the two-year giving plan (CAD)',1000,0,100000,500]
  ]}
};

export function businessCashPlan(input){
  const cost=input.revenue*input.costPercent/100,profit=input.revenue-cost,allocation=Math.max(0,profit)*input.taxAllowance/100;
  let cash=0,earmark=0,lowest=0,received=0;
  const rows=[{x:0,before:input.cash,end:input.cash,free:input.cash,earmark:0}];
  for(let month=1;month<=12;month++){
    cash-=cost+input.draw;const before=cash-earmark;lowest=Math.min(lowest,before);
    const receipt=month>input.collectionDelay?input.revenue:0;cash+=receipt;received+=receipt;earmark+=allocation;
    const free=cash-earmark;lowest=Math.min(lowest,free);
    rows.push({x:month,before:before+input.cash,end:cash+input.cash,free:free+input.cash,earmark,receipt});
  }
  const required=Math.max(0,-lowest),invoiced=input.revenue*12,receivable=invoiced-received;
  return {cost,profit,annualProfit:profit*12,earmark,received,invoiced,receivable,required,extra:Math.max(0,required-input.cash),ending:rows.at(-1).free,rows};
}

export function replacementReserve(input,firstEarlier=0,monthly=input.reserveMonthly){
  const components=[{name:'Roof',cost:input.roofCost,cycle:input.roofCycle},{name:'Heating',cost:input.heatCost,cycle:input.heatCycle},{name:'Appliances',cost:input.applianceCost,cycle:input.applianceCycle}];
  const years=Array.from({length:12},(_,i)=>({year:i+1,values:[0,0,0]}));
  const base=[0,0,0];
  components.forEach((item,index)=>{
    for(let year=Math.max(1,item.cycle-firstEarlier);year<=12;year+=item.cycle){years[year-1].values[index]+=item.cost*(1+input.costGrowth/100)**year;base[index]+=item.cost;}
  });
  let position=0,lowest=0,cumulative=0,needed=0;const rows=[{x:0,value:input.saved}];
  for(let month=1;month<=144;month++){
    position+=monthly;
    if(month%12===0){const cost=years[month/12-1].values.reduce((a,b)=>a+b,0);position-=cost;cumulative+=cost;needed=Math.max(needed,(cumulative-input.saved)/month);}
    lowest=Math.min(lowest,position);let value=position+input.saved;if(Math.abs(value)<1e-7)value=0;
    rows.push({x:month/12,value});
  }
  const totals=components.map((item,i)=>({name:item.name,base:base[i],total:years.reduce((sum,y)=>sum+y.values[i],0)}));
  const required=Math.max(0,-lowest),monthlyNeeded=Math.max(0,Math.ceil(Math.max(0,needed)*100-1e-7)/100);
  return {years,rows,totals,total:totals.reduce((s,c)=>s+c.total,0),required,extra:Math.max(0,required-input.saved),monthlyNeeded,ending:rows.at(-1).value};
}

export function givingCashPlan(input,timing='monthly'){
  const annual=input.monthlyGift*12,saving=Math.min(input.taxSaving,annual);let position=0,lowest=0;
  const rows=[{x:0,before:input.cash,end:input.cash,gift:0,saving:0}];
  for(let month=1;month<=24;month++){
    const gift=timing==='monthly'?input.monthlyGift:timing==='start'?(month===1||month===13?annual:0):(month===12||month===24?annual:0);
    position-=gift;lowest=Math.min(lowest,position);const before=position+input.cash,benefit=month===input.savingMonth?saving:0;
    position+=input.budget+benefit;rows.push({x:month,before,end:position+input.cash,gift,saving:benefit});
  }
  const required=Math.max(0,-lowest);
  return {annual,gross:annual*2,saving,netOutflow:annual*2-saving,required,extra:Math.max(0,required-input.cash),ending:position+input.cash,rows};
}

export function longerBudgetResult(kind,input){
  if(kind==='businessCash'){
    const p=businessCashPlan(input);
    return {metrics:[['Invoiced operating profit before owner draws',p.annualProfit,'money'],['Year-end tax earmark target',p.earmark,'money'],['Additional starting cash needed',p.extra,'money']],note:'Hypothetical twelve-month cash ledger with equal invoices each month and no opening receivables or payables. Operating cash costs and owner withdrawals occur at each month’s start; invoice m is collected at the end of month m + delay. Only receipts inside twelve months are counted; later invoices remain receivable. Positive invoice-based operating profit creates a month-end tax earmark even before collection. This percentage is a planning allowance, not actual tax or CPP/QPP. Earmark is held, with no remittance modeled; if cash is insufficient it is an unfunded target, not a funded account. Free cash deducts the target once. No corporate salary/dividend rules, GST/HST, deductible-expense assessment, depreciation, bad debt, financing cost or tax deadline is calculated. Negative points are unfunded needs, not an approved overdraft.',charts:[
      {id:'business-free-cash',type:'waterfall',title:'Invoiced revenue is several steps away from uncommitted cash',unit:'money',rows:[{label:'Starting cash',value:input.cash},{label:'Twelve months of invoices',value:p.invoiced},{label:'Operating cash costs',value:-p.cost*12},{label:'Owner withdrawals',value:-input.draw*12},{label:'Tax earmark target',value:-p.earmark},{label:'Invoices not yet collected',value:-p.receivable}],totalLabel:'Year-end uncommitted cash',note:'Owner withdrawals reduce cash but do not reduce the operating-profit figure in this illustration. The earmark remains an asset if funded; it is deducted because it is committed. Uncollected invoices are not available cash. This is a simplified management ledger, not a tax return or formal profit statement.'},
      {id:'business-cash-timing',type:'line',title:'Month-end cash can conceal a shortage before collections',unit:'money',xLabel:'Months since the invoice schedule starts',series:[{name:'Cash before tax earmark · month-end',rows:p.rows.map(r=>({x:r.x,value:r.end}))},{name:'Uncommitted cash · month-end',rows:p.rows.map(r=>({x:r.x,value:r.free})),dash:true},{name:'Uncommitted after start-of-month spending',rows:p.rows.map(r=>({x:r.x,value:r.before}))}],note:'Three observations of one ledger, not three income forecasts. Start-of-month spending precedes customer receipts and the new month’s earmark. Starting cash needs use the lowest uncommitted position at either event, rather than month-end alone. No invoice is assumed paid early to cure a shortfall.'},
      {id:'business-delay-buffer',type:'bar',title:'Slower collections can require more starting cash',unit:'money',rows:[0,1,2,3,6].map(collectionDelay=>({label:collectionDelay+' full-month collection delay',value:businessCashPlan({...input,collectionDelay}).required})),note:'Invoices, operating costs, owner draws and tax allowance stay selected. Each schedule starts without older receivables and ends at month twelve; more delay also leaves more invoices uncollected at that point. Costs and draws are still paid at month-start even with zero full-month delay.'},
      {id:'business-draw-matrix',type:'heatmap',title:'Additional starting cash across draws and tax allowances',unit:'money',columns:['$2k','$4k','$6k','$8k'],rows:[10,20,30,40].map(taxAllowance=>({label:taxAllowance+'%',values:[2000,4000,6000,8000].map(draw=>businessCashPlan({...input,taxAllowance,draw}).extra)})),note:'Columns replace monthly owner withdrawals; rows replace the hypothetical earmark percentage of positive operating profit. Revenue, operating-cost percentage, collection delay and starting cash remain selected. The percentages are not official tax rates or estimates of a personal tax bill.'}
    ]};
  }
  if(kind==='homeReplacement'){
    const p=replacementReserve(input),funded=replacementReserve(input,0,p.monthlyNeeded);
    const annualRows=p.years.filter(y=>y.values.some(v=>v>0)).map(y=>({label:'Year '+y.year,values:y.values}));
    return {metrics:[['Replacement bills within twelve years',p.total,'money'],['Largest unfunded need with selected saving',p.extra,'money'],['Monthly reserve saving needed for this schedule',p.monthlyNeeded,'money']],note:'Hypothetical three-component replacement schedule over twelve years, not a building inspection, lifespan table or condominium reserve study. In the base case, first replacement occurs after the selected interval and repeats at that interval. Each event costs today’s entered amount grown to its event year at the selected constant rate. Contributions arrive monthly before any year-end replacements. Reserve earns zero interest. Routine upkeep is a separate constant monthly cash allowance; it does not enter or leave this replacement reserve. Required monthly saving is the largest cumulative funding requirement at any event, rounded up to cents, given starting reserve. Negative balances are unmet needs, not borrowing. No emergency repair, tax, insurance recovery, renovation scope change, investment risk or costs after year twelve are calculated.',charts:[
      {id:'replacement-cost-components',type:'stackbar',title:'Replacement reserves and routine upkeep have different cash roles',unit:'money',seriesNames:['Entered costs repeated','Replacement cost-growth increment'],rows:[...p.totals.map(c=>({label:c.name,values:[c.base,Math.max(0,c.total-c.base)]})),{label:'Routine upkeep · paid separately',values:[input.routine*144,0]}],note:'Replacement base segments include every occurrence inside the horizon, not just one purchase; their second segments add assumed cost growth. The routine-upkeep bar is twelve years at the selected constant monthly allowance. It is paid separately and excluded from replacement totals and reserve paths. The three replacement components are a selected example, not a complete inventory or a quote.'},
      {id:'replacement-reserve-path',type:'line',title:'An adequate ending average can miss an earlier replacement bill',unit:'money',xLabel:'Years in the twelve-year replacement schedule',series:[{name:'Selected monthly reserve contribution',rows:p.rows},{name:'Calculated minimum monthly contribution',rows:funded.rows,dash:true}],note:'Both paths use the same starting reserve and replacement schedule. Contributions occur before replacements at year-end. The minimum contribution must keep every modeled point funded, not only the final year. A negative selected-path balance is a shortfall that needs another source; no financing is assumed.'},
      {id:'replacement-year-bills',type:'stackbar',title:'Several components can need cash in the same year',unit:'money',seriesNames:['Roof','Heating','Appliances'],rows:annualRows.length?annualRows:[{label:'No modeled replacement bills',values:[0,0,0]}],note:'Only years with a positive modeled replacement bill are shown. Components due in the same year stack into one cash requirement. Routine upkeep is excluded because its selected allowance is paid separately from the replacement reserve. These dates are assumptions, not condition assessments.'},
      {id:'replacement-earlier-matrix',type:'heatmap',title:'Shortfalls when first replacements arrive sooner',unit:'money',columns:['$200','$300','$400','$500'],rows:[0,1,2,3].map(firstEarlier=>({label:firstEarlier?('−'+firstEarlier+' yr'):'As set',values:[200,300,400,500].map(monthly=>replacementReserve(input,firstEarlier,monthly).extra)})),note:'Columns replace monthly reserve saving in CAD. Rows move the first replacement of every component earlier by the stated years, no earlier than year one; its repeat interval stays selected. Earlier first dates can also change how many events fit inside twelve years. Prices grow only to each revised event date. Starting reserve and other assumptions stay selected.'}
    ]};
  }
  if(kind==='givingCash'){
    const monthly=givingCashPlan(input),start=givingCashPlan(input,'start'),end=givingCashPlan(input,'end');
    return {metrics:[['Gross gifts over two years',monthly.gross,'money'],['Starting cash needed for monthly gifts',monthly.required,'money'],['Additional starting cash for monthly gifts',monthly.extra,'money']],note:'Hypothetical twenty-four-month cash-gift comparison. Equal annual gifts are paid monthly, at the start of each year, or in months twelve and twenty-four. Gifts leave at month-start; other giving-budget surplus arrives at each month-end. One assumed usable tax saving from first-year gifts arrives at the selected month-end in year two. It is entered independently, capped at first-year gifts as an illustration convention, and set to zero when there are no gifts; this is not a statutory tax-credit limit. No second-year benefit is received in this horizon. No eligibility, non-refundable-credit utilization, federal/provincial credit rate, receipt validation, carryforward, appreciated-property gift, refund approval, interest or investment return is calculated. A usable saving may reduce a tax payment rather than create a refund; count it only once when it actually frees cash for this budget.',charts:[
      {id:'giving-net-outflow',type:'waterfall',title:'Keep gross gifts separate from the assumed usable tax saving',unit:'money',rows:[{label:'First-year cash gifts',value:monthly.annual},{label:'Second-year cash gifts',value:monthly.annual},{label:'Year-one tax saving realized',value:-monthly.saving}],totalLabel:'Two-year net gift cash outflow',note:'This endpoint includes only one entered tax saving, from first-year gifts. It is a twenty-four-month cash measure, not the lifetime after-tax cost of both years’ donations. Monthly budget contributions and starting cash are funding sources, so they do not reduce the cost shown here.'},
      {id:'giving-cash-path',type:'line',title:'Gift timing changes the cash needed before later resources arrive',unit:'money',xLabel:'Months in the two-year giving plan',series:[{name:'Monthly gifts · after month-start gifts',rows:monthly.rows.map(r=>({x:r.x,value:r.before}))},{name:'Year-start gifts · after month-start gifts',rows:start.rows.map(r=>({x:r.x,value:r.before})),dash:true},{name:'Year-end gifts · after month-start gifts',rows:end.rows.map(r=>({x:r.x,value:r.before}))}],note:'The same annual gift total, budget surplus and assumed tax saving apply to every schedule. Lines show cash immediately after any month-start gift, before that month’s surplus or tax saving. Thus the final plotted value excludes month twenty-four’s later resources. Negative values are unfunded needs, not an approved credit facility.'},
      {id:'giving-starting-cash',type:'bar',title:'Compare the starting cash required by equal annual commitments',unit:'money',rows:[{label:'Monthly gifts',value:monthly.required},{label:'Year-start gifts · months 1 and 13',value:start.required},{label:'Year-end gifts · months 12 and 24',value:end.required}],note:'These requirements are measured before the selected starting cash is applied. Later tax savings cannot pay an earlier gift. Each alternative still gives the same annual amount; the tool does not rank their impact on a charity or recommend a donation date.'},
      {id:'giving-saving-matrix',type:'heatmap',title:'Monthly-gift starting cash across usable savings and arrival dates',unit:'money',columns:['Mo 13','Mo 16','Mo 20','Mo 24'],rows:[0,300,600,900].map(taxSaving=>({label:'$'+taxSaving,values:[13,16,20,24].map(savingMonth=>givingCashPlan({...input,taxSaving,savingMonth}).required)})),note:'Rows replace the assumed usable first-year tax saving in CAD; columns replace its arrival month. Each saving remains capped at the modeled first-year gifts. Monthly gifts and budget surplus stay selected. Cells show total starting cash needed for the monthly schedule, not an actual refund or a credit entitlement.'}
    ]};
  }
  throw Error('Unknown longer-budget planning topic.');
}
