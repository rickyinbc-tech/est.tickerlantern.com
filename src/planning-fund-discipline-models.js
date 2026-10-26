export const fundDisciplineDefinitions={
  dipWait:{title:'Write the waiting rule before holding new pay in cash for a dip',fields:[
    ['dipMonthly','New cash available at each month-end (CAD)',500,0,10000,50],
    ['dipPath','Authored index path: 1 = steady rise, 2 = early dip, 3 = late dip',2,1,3,1],
    ['dipScale','Scale of the authored monthly returns (%)',100,0,150,10],
    ['dipTrigger','Invest waiting cash once the index is below its running peak by at least (%)',10,1,40,1],
    ['dipMaxWait','Invest anyway after the oldest waiting deposit has waited (months)',12,0,36,1],
    ['dipCash','Effective annual interest on waiting cash (%)',2.25,0,8,.25]
  ]},
  rebalanceDrift:{title:'Compare a mix that is rebalanced with one that is left to drift',fields:[
    ['rbCapital','Starting portfolio (CAD)',100000,1000,1000000,1000],
    ['rbEquity','Target equity allocation (%)',60,0,100,5],
    ['rbCrashStocks','Year-one equity total return (%)',-35,-70,20,1],
    ['rbCrashBonds','Year-one bond total return (%)',2,-30,20,1],
    ['rbRecoveryYears','Recovery years after year one',3,0,10,1],
    ['rbRecoveryStocks','Equity return in each recovery year (%)',15,-20,40,1],
    ['rbLaterStocks','Equity return in each later year (%)',6,-10,15,.5],
    ['rbBonds','Bond return after year one (%)',3,-10,10,.5],
    ['rbBand','Rebalance at a year-end when equity is off target by more than (percentage points; 0 = every year)',5,0,30,1],
    ['rbYears','Horizon (years)',10,1,30,1]
  ]}
};
export const fundDisciplineWholeKeys=['dipPath','dipTrigger','dipMaxWait','rbRecoveryYears','rbBand','rbYears'];

// Authored 36-month index paths for teaching only; they are not historical returns or forecasts.
export const dipPaths=[
  {name:'Steady rise with shallow pullbacks',returns:[.012,.008,-.02,.015,.01,-.015,.012,.009,-.01,.014,.008,-.018,.013,.01,-.012,.011,.009,-.016,.014,.008,-.01,.012,.01,-.014,.013,.009,-.011,.012,.008,-.015,.014,.01,-.01,.012,.009,.01]},
  {name:'Early dip, then recovery',returns:[.01,.008,.006,-.06,-.07,-.05,-.03,.03,.035,.03,.025,.02,.012,.01,.008,.01,.012,.008,.01,.009,.011,.008,.01,.009,.008,.01,.009,.011,.008,.01,.009,.008,.01,.009,.011,.008]},
  {name:'Long rise, late dip',returns:[.012,.013,.011,.012,.014,.01,.012,.013,.011,.012,.014,.01,.012,.013,.011,.012,.014,.01,.012,.013,.011,.012,.014,.01,-.07,-.08,-.06,-.02,.02,.025,.02,.015,.012,.01,.012,.01]}
];

// Month-end order: index return, cash interest on cash already waiting, new deposit, then a decision on the observed close.
export function dipWaitPlan(input,{path=input.dipPath,trigger=input.dipTrigger,maxWait=input.dipMaxWait}={}){
  const returns=dipPaths[path-1].returns,cashRate=Math.expm1(Math.log1p(input.dipCash/100)/12),c=input.dipMonthly;
  let index=100,peak=100,dcaUnits=0,dipUnits=0,cash=0,oldest=null,deposited=0,dipInvested=0,purchases=0,cashMonths=0,maxCash=0;
  const rows=[{x:0,index,peak,triggerLevel:peak*(1-trigger/100),dca:0,dip:0,cash:0}];
  returns.forEach((r,i)=>{
    const month=i+1;index*=1+r*input.dipScale/100;peak=Math.max(peak,index);
    dcaUnits+=c/index;deposited+=c;
    cash*=1+cashRate;cash+=c;if(c>0&&oldest==null)oldest=month;
    const drawdown=1-index/peak,forced=oldest!=null&&month-oldest>=maxWait;
    let bought=false;
    if(cash>0&&(drawdown>=trigger/100-1e-12||forced)){dipUnits+=cash/index;dipInvested+=cash;cash=0;oldest=null;purchases++;bought=true;}
    if(cash>0)cashMonths++;maxCash=Math.max(maxCash,cash);
    rows.push({x:month,index,peak,triggerLevel:peak*(1-trigger/100),drawdown,dca:dcaUnits*index,dip:dipUnits*index+cash,cash,bought});
  });
  const last=rows.at(-1);
  return {rows,dcaEnd:last.dca,dipEnd:last.dip,cashEnd:cash,deposited,dipInvested,purchases,cashMonths,maxCash,dcaUnits,dipUnits,
    dcaCost:dcaUnits>0?deposited/dcaUnits:null,dipCost:dipUnits>0?dipInvested/dipUnits:null,difference:last.dip-last.dca};
}

function rebalanceYearReturns(input,variant='entered'){
  const out=[];
  for(let year=1;year<=input.rbYears;year++){
    let stocks=year===1?input.rbCrashStocks:year<=1+input.rbRecoveryYears?input.rbRecoveryStocks:input.rbLaterStocks;
    let bonds=year===1?input.rbCrashBonds:input.rbBonds;
    if(variant==='second'&&year===2)stocks=input.rbCrashStocks/2;
    if(variant==='second'&&year>2)stocks=year<=2+input.rbRecoveryYears?input.rbRecoveryStocks:input.rbLaterStocks;
    if(variant==='none'){stocks=input.rbLaterStocks;bonds=input.rbBonds;}
    out.push({year,stocks:stocks/100,bonds:bonds/100});
  }
  return out;
}

// Returns apply to each bucket over the year; any rebalancing trade happens at the year-end close. No costs or tax.
export function rebalanceDriftPlan(input,{variant='entered',band=input.rbBand}={}){
  const target=input.rbEquity/100,years=rebalanceYearReturns(input,variant);
  let rs=input.rbCapital*target,rb=input.rbCapital-rs,ds=rs,db=rb,bought=0,sold=0,low={rebalanced:input.rbCapital,drift:input.rbCapital};
  const rows=[{x:0,rebalanced:input.rbCapital,drift:input.rbCapital,rebalancedWeight:target,driftWeight:target,trade:0,preTradeWeight:target}];
  for(const y of years){
    rs*=1+y.stocks;rb*=1+y.bonds;ds*=1+y.stocks;db*=1+y.bonds;
    const value=rs+rb,pre=value>0?rs/value:target;let trade=0;
    if(value>0&&(band===0?Math.abs(pre-target)>1e-12:Math.abs(pre-target)*100>band+1e-9)){trade=target*value-rs;rs+=trade;rb-=trade;if(trade>0)bought+=trade;else sold-=trade;}
    const drift=ds+db;low={rebalanced:Math.min(low.rebalanced,value),drift:Math.min(low.drift,drift)};
    rows.push({x:y.year,rebalanced:value,drift,rebalancedWeight:value>0?rs/value:target,driftWeight:drift>0?ds/drift:target,trade,preTradeWeight:pre,stocks:y.stocks,bonds:y.bonds});
  }
  const last=rows.at(-1);
  return {rows,years,rebalancedEnd:last.rebalanced,driftEnd:last.drift,bought,sold,low,trades:rows.filter(r=>r.x>0&&r.trade!==0).length};
}

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
export function fundDisciplineResult(kind,input){
  if(kind==='dipWait'){
    const p=dipWaitPlan(input),paths=dipPaths.map((d,i)=>({name:d.name,q:dipWaitPlan(input,{path:i+1})}));
    return {metrics:[['Ending value · invest each deposit at month-end',p.dcaEnd,'money'],['Ending value · wait-for-a-dip rule, including cash',p.dipEnd,'money'],['Wait rule minus regular investing',p.difference,'money'],['Months ending with cash still waiting',p.cashMonths,'integer']],
    note:`Both rules receive the same ${money(input.dipMonthly)} at each of 36 month-ends. The regular rule buys at that close. The waiting rule holds new cash and buys all of it at the first close at least ${input.dipTrigger}% below the running peak, or once the oldest waiting deposit has waited ${input.dipMaxWait} months. The authored paths are teaching examples, not historical returns, forecasts or likelihoods. No trading costs, tax, fund fees, distributions or settlement delay are modeled; waiting cash earns the entered effective annual rate converted to a monthly rate.`,
    charts:[
      {id:'dip-wait-reference-rates',type:'groupbar',title:'Two dated reference rates for money that waits in cash',unit:'percent',unitLabel:'Rate (%)',source:'https://www150.statcan.gc.ca/n1/daily-quotidien/261019/dq261019a-eng.htm',sourceLabel:'Statistics Canada · CPI, September 2026; Bank of Canada · target for the overnight rate, 22 October 2026',seriesNames:['Published rate'],rows:[{label:'All-items CPI, year over year · Sep 2026',values:[.031]},{label:'Target for the overnight rate · 22 Oct 2026',values:[.0225]}],note:'Statistics Canada reported 3.1% year-over-year growth in all-items CPI for September 2026. The Bank of Canada target for the overnight rate was 2.25% on 22 October 2026. A savings account, GIC or money market fund can pay a different rate, and neither figure forecasts future inflation or interest. The scenario cash rate is a separate editable input.'},
      {id:'dip-wait-index',type:'line',title:'The waiting rule buys only when the index is below the trigger line',unit:'decimal',xLabel:'Month-end',series:[{name:'Authored index level',rows:p.rows.map(r=>({x:r.x,value:r.index}))},{name:`Trigger level · ${input.dipTrigger}% below running peak`,dash:true,rows:p.rows.map(r=>({x:r.x,value:r.triggerLevel}))}],note:`The index starts at 100. The trigger line follows the highest close observed so far, so a late dip can still occur at a higher level than earlier prices. This path invests waiting cash ${p.purchases} time${p.purchases===1?'':'s'}; ${p.dipUnits>0?`its average cost per unit is ${p.dipCost.toFixed(2)} versus ${p.dcaCost.toFixed(2)} for buying every month.`:'no waiting cash has been invested by the end.'}`},
      {id:'dip-wait-resources',type:'line',title:'Cash waiting for a dip sits outside the market until the rule fires',unit:'money',xLabel:'Month-end',series:[{name:'Invest each month-end · market value',rows:p.rows.map(r=>({x:r.x,value:r.dca}))},{name:'Wait-for-a-dip rule · invested value plus cash',rows:p.rows.map(r=>({x:r.x,value:r.dip}))},{name:'Wait-for-a-dip rule · cash waiting',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.cash}))}],note:`The waiting cash peaks at ${money(p.maxCash)} in this path. Total deposits are ${money(p.deposited)} under both rules. Interest on waiting cash is included; any tax on that interest outside a registered account is not.`},
      {id:'dip-wait-paths',type:'groupbar',title:'The same rule can help, hurt or never fire depending on the path',unit:'money',seriesNames:['Invest each month-end','Wait-for-a-dip rule'],rows:paths.map(({name,q})=>({label:name,values:[q.dcaEnd,q.dipEnd]})),note:'Every row uses the same deposits, trigger, waiting limit, cash rate and return scale; only the authored path changes. The three paths are not equally likely and are not a backtest. The rule is known in advance and uses only closes already observed.'}
    ]};
  }
  if(kind==='rebalanceDrift'){
    const p=rebalanceDriftPlan(input),variants=[['Entered path','entered'],['A second, smaller down year','second'],['No crash year','none']].map(([label,variant])=>({label,q:rebalanceDriftPlan(input,{variant})}));
    const tradeRows=p.rows.filter(r=>r.x>0&&r.trade!==0).map(r=>({label:`Year ${r.x} · equity ${(r.preTradeWeight*100).toFixed(1)}% before trade`,value:r.trade}));
    return {metrics:[['Ending value · rebalanced mix',p.rebalancedEnd,'money'],['Ending value · drifting mix',p.driftEnd,'money'],['Lowest year-end value · rebalanced',p.low.rebalanced,'money'],['Lowest year-end value · drifting',p.low.drift,'money'],['Equity bought by rebalancing trades',p.bought,'money'],['Equity sold by rebalancing trades',p.sold,'money']],
    note:'Both portfolios start with the same money and target. Annual asset returns are authored inputs, applied to each bucket for the full year. The rebalanced portfolio trades back to the target at a year-end only when equity is off target by more than the entered band. No new contributions, withdrawals, fees, trading costs, spreads or taxes are modeled. Returns are hypothetical, not historical crisis data, forecasts or a guaranteed recovery.',
    charts:[
      {id:'rebalance-weight',type:'line',title:'A crash shrinks the equity share unless something restores it',unit:'percent',xLabel:'Year-end, after any rebalancing trade',series:[{name:'Rebalanced mix · equity share',rows:p.rows.map(r=>({x:r.x,value:r.rebalancedWeight}))},{name:'Drifting mix · equity share',rows:p.rows.map(r=>({x:r.x,value:r.driftWeight}))}],note:`The target is ${input.rbEquity}% equity. A rebalancing band of ${input.rbBand} percentage points ${input.rbBand===0?'restores the target at every year-end':'allows small deviations without a trade'}. The drifting mix never trades, so its equity share moves with relative returns.`},
      {id:'rebalance-value',type:'line',title:'Portfolio value with and without rebalancing',unit:'money',xLabel:'Year-end',series:[{name:'Rebalanced mix',rows:p.rows.map(r=>({x:r.x,value:r.rebalanced}))},{name:'Drifting mix',rows:p.rows.map(r=>({x:r.x,value:r.drift}))}],note:'Both lines fall by the same amount in year one because they start with the same weights. Later differences come only from the equity share each holds after the crash. In a recovery, buying equity after the fall can help; if declines continue, the same trades add to losses.'},
      {id:'rebalance-trades',type:'signedbar',title:'Rebalancing trades: equity bought (+) or sold (−) at year-end',unit:'money',rows:tradeRows.length?tradeRows:[{label:'No trade triggered within the band',value:0}],note:'A positive bar sells bonds to buy equity; a negative bar sells equity to buy bonds. In a non-registered account, a sale can be a disposition that realizes a capital gain or loss. Inside a balanced mutual fund, the fund itself trades, and its distributions may still be taxable outside a registered plan. Taxes and costs are not deducted here.'},
      {id:'rebalance-variants',type:'groupbar',title:'Rebalancing is a risk-control rule, not a guaranteed return improvement',unit:'money',seriesNames:['Rebalanced mix','Drifting mix'],rows:variants.map(({label,q})=>({label,values:[q.rebalancedEnd,q.driftEnd]})),note:'The second-down-year variant replaces year two with half the year-one equity return, then begins the recovery. The no-crash variant uses the later equity return in every year. Ending values depend on the order of returns; no variant is a probability or forecast.'}
    ]};
  }
  throw Error('Unknown fund-discipline topic');
}
