export const crashWithdrawalDefinitions={
  crashContribution:{title:'Follow monthly contributions through a market fall and its recovery',inputIssue:i=>i.ccStart+i.ccMonthly<=0?{message:'Enter a starting balance, a monthly contribution or both.',fields:['ccStart','ccMonthly']}:null,fields:[
    ['ccStart','Balance already invested when the market peaks (CAD)',20000,0,2000000,1000],
    ['ccMonthly','Contribution from pay at each month-end (CAD)',500,0,20000,50],
    ['ccDrop','Market fall from the peak to the low (%)',35,5,70,1],
    ['ccFallMonths','Months from the peak to the low',18,1,60,1],
    ['ccRiseMonths','Months from the low back to the old peak',42,1,120,1],
    ['ccAfter','Market return per year after the old peak is regained (%)',6,-2,12,.25],
    ['ccCash','Interest on paused contributions held in cash (%)',2.5,0,8,.25],
    ['ccHorizon','Months followed after the peak',96,24,240,1]
  ]},
  fundWithdrawalTax:{title:'Tax on cash withdrawn from a fund in a non-registered account',fields:[
    ['fwValue','Fund value in the non-registered account at the start (CAD)',300000,1000,5000000,1000],
    ['fwCost','Adjusted cost base of those units (CAD)',200000,0,5000000,1000],
    ['fwWithdraw','Cash redeemed in the first year (CAD)',18000,0,500000,500],
    ['fwIndex','Yearly increase in the amount redeemed (%)',2,0,6,.25],
    ['fwGrowth','Unit price growth per year, after fund costs (%)',4,-4,10,.25],
    ['fwDist','Distributions per year, reinvested and taxed as ordinary income (%)',1.5,0,6,.25],
    ['fwFedRate','Federal marginal tax rate (%)',20.5,0,33,.5],
    ['fwProvRate','Provincial or territorial marginal tax rate (%)',9.15,0,25,.05],
    ['fwYears','Years of withdrawals',20,1,40,1]
  ]}
};
export const crashWithdrawalWholeKeys=['ccFallMonths','ccRiseMonths','ccHorizon','fwYears'];

// Market price relative to the old peak (1 = the peak). The fall and the recovery are each geometric, so every month in
// a phase has the same percentage move; after month fall+rise the market grows at the entered yearly rate.
export function crashPrice(i,m){
  const F=i.ccFallMonths,R=i.ccRiseMonths,low=1-i.ccDrop/100;
  if(m<=F)return Math.pow(low,m/F);
  if(m<=F+R)return Math.pow(low,1-(m-F)/R);
  return Math.pow(1+i.ccAfter/100,(m-F-R)/12);
}

// The starting balance buys units at the peak; each contribution buys at that month-end's price. In the paused plan,
// contributions from month 1 until the old peak is regained wait in cash (monthly compounding) and are invested in
// one purchase at the month the peak is regained, after which contributions resume. Fund fees are taken to be inside
// the market path; no tax, spread or trading cost is modeled.
export function crashContributionPlan(input,overrides={}){
  const i={...input,...overrides},F=i.ccFallMonths,R=i.ccRiseMonths,back=F+R,H=Math.max(i.ccHorizon,back+12);
  const cashGrowth=Math.pow(1+i.ccCash/100,1/12);
  let units=i.ccStart,pauseUnits=i.ccStart,cash=0;
  const rows=[{x:0,price:1,value:i.ccStart,invested:i.ccStart,paused:i.ccStart}];
  let recover=null,pauseRecover=null;
  for(let m=1;m<=H;m++){
    const p=crashPrice(i,m);
    units+=i.ccMonthly/p;
    cash*=cashGrowth;
    if(m<back)cash+=i.ccMonthly;
    else if(m===back){cash+=i.ccMonthly;pauseUnits+=cash/p;cash=0;}
    else pauseUnits+=i.ccMonthly/p;
    const invested=i.ccStart+i.ccMonthly*m,value=units*p,paused=pauseUnits*p+cash;
    // A tolerance keeps a plan that is exactly back to its contributions (e.g. no starting balance at month 1) from
    // being counted as recovered because of float rounding; recovery is looked for only after the low.
    if(recover==null&&m>=F&&value>=invested*(1-1e-12))recover=m;
    if(pauseRecover==null&&m>=F&&paused>=invested*(1-1e-12))pauseRecover=m;
    rows.push({x:m,price:p,value,invested,paused});
  }
  return {rows,back,horizon:H,extended:H>i.ccHorizon,recover,pauseRecover,end:rows.at(-1)};
}

// Gain or loss on the contributions made in one block of months, valued at the month the old peak is regained (price 1).
export function contributionBlockReturn(input,from,to){
  let units=0;for(let m=from;m<=to;m++)units+=1/crashPrice(input,m);
  return units/(to-from+1)-1;
}

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(n,d=1)=>(n*100).toFixed(d)+'%';

export const capitalGainsInclusion=.5;

// Yearly order: the redemption is taken at the start of the year, using the average cost per unit of all units held
// (CRA treats units of the same fund series as identical property). The half of the gain that is taxable is taxed at
// the combined marginal rate. The remaining units then grow; distributions are paid on the remaining value, taxed at
// the full marginal rate and reinvested, which raises the adjusted cost base. Tax is paid out of the redeemed cash.
// A redemption made while the units are below cost realizes a capital loss, given no tax value here.
export function fundWithdrawalPlan(input,overrides={}){
  const i={...input,...overrides},m=(i.fwFedRate+i.fwProvRate)/100,g=i.fwGrowth/100,d=i.fwDist/100;
  let value=i.fwValue,cost=i.fwCost,withdrawn=0,taxTotal=0,lasted=0;
  const rows=[{x:0,value,cost,deferredTax:Math.max(0,value-cost)*capitalGainsInclusion*m}],years=[];
  for(let year=1;year<=i.fwYears;year++){
    if(value<=1e-9)break;
    const wanted=i.fwWithdraw*Math.pow(1+i.fwIndex/100,year-1),w=Math.min(wanted,value);
    const costOut=cost*(w/value),gain=w-costOut,gainTax=Math.max(0,gain)*capitalGainsInclusion*m;
    value-=w;cost-=costOut;
    const dist=value*d,distTax=dist*m;
    value=value*(1+g)+dist;cost+=dist;
    withdrawn+=w;taxTotal+=gainTax+distTax;if(w>=wanted-1e-9)lasted=year;
    years.push({year,w,costOut,gain,gainTax,dist,distTax,tax:gainTax+distTax});
    rows.push({x:year,value,cost,deferredTax:Math.max(0,value-cost)*capitalGainsInclusion*m});
  }
  const last=rows.at(-1);
  return {rows,years,withdrawn,taxTotal,lasted,end:last.value,endDeferredTax:last.deferredTax,average:withdrawn?taxTotal/withdrawn:0,rate:m};
}

export function crashWithdrawalResult(kind,input){
  if(kind==='crashContribution'){
    const p=crashContributionPlan(input),back=p.back,e=p.end;
    const avgPrice=input.ccMonthly>0?back/Array.from({length:back},(_,k)=>1/crashPrice(input,k+1)).reduce((a,b)=>a+b,0):null;
    const blocks=[];for(let from=1;from<=back;from+=12){const to=Math.min(back,from+11);blocks.push({label:`Contributions in months ${from}–${to}`,value:contributionBlockReturn(input,from,to)});}
    const multiples=[0,12,36,60,120,240],drops=[20,35,50,60];
    const grid=multiples.map(k=>({label:k===0?'No starting balance':`Start = ${k} contributions`,values:drops.map(dr=>{const q=crashContributionPlan(input,{ccDrop:dr,ccStart:k*input.ccMonthly,...(input.ccMonthly===0&&k===0?{ccStart:input.ccStart}:{})});return q.recover;})}));
    const notYet=v=>v==null?'Not within the horizon':undefined;
    return {metrics:[['Months for the market to regain its old peak',back,'integer'],['Months until the account is back above the money put in',p.recover,'integer',notYet(p.recover)],['Same, if contributions waited in cash until the old peak',p.pauseRecover,'integer',notYet(p.pauseRecover)],[`Account value after ${p.horizon} months · contributions continued`,e.value,'money'],[`Account value after ${p.horizon} months · contributions paused`,e.paused,'money'],...(avgPrice==null?[]:[['Average price paid by contributions until the peak returns, vs the old peak',avgPrice,'percent']])].filter(x=>Number.isFinite(x[1])||x[3]),
    note:`A ${money(input.ccStart)} balance is invested at a market peak and ${money(input.ccMonthly)} is added at each month-end. The market falls ${input.ccDrop}% over ${input.ccFallMonths} month${input.ccFallMonths===1?'':'s'}, takes ${input.ccRiseMonths} more month${input.ccRiseMonths===1?'':'s'} to regain the old peak, and then grows ${input.ccAfter}% a year. The paused plan holds contributions in cash at ${input.ccCash}% until the peak returns, invests that cash in one purchase and then resumes. The path is a hypothetical teaching shape, not the history of any index or fund, and no tax, fee or trading cost is modeled beyond the market path itself.${p.extended?` The horizon is extended to ${p.horizon} months so the chart shows a year after the recovery.`:''}`,
    charts:[
      {id:'crash-contribution-paths',type:'line',title:'Account value with contributions continued or paused, against money put in',unit:'money',xLabel:'Months after the market peak',series:[{name:'Contributions continued',rows:p.rows.map(r=>({x:r.x,value:r.value}))},{name:'Contributions paused until the old peak',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.paused}))},{name:'Money put in',rows:p.rows.map(r=>({x:r.x,value:r.invested}))}],note:`Continuing ends at ${money(e.value)} and pausing at ${money(e.paused)}, from the same ${money(e.invested)} put in. The paused cash earns interest but buys back in only once prices have returned to the old peak.`},
      {id:'crash-contribution-ratio',type:'line',title:'The account can be back above its contributions long before the market regains its peak',unit:'percent',xLabel:'Months after the market peak',series:[{name:'Market price, % of the old peak',rows:p.rows.map(r=>({x:r.x,value:r.price}))},{name:'Account value, % of money put in',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.invested>0?r.value/r.invested:1}))}],note:`The market regains its old peak in month ${back}. ${p.recover==null?'Within this horizon the account does not get back above the money put in.':`With contributions continued, the account is back above the money put in by month ${p.recover}${p.recover<back?`, ${back-p.recover} month${back-p.recover===1?'':'s'} earlier`:''}.`} The larger the starting balance compared with each contribution, the closer the account follows the market line.`},
      {id:'crash-contribution-blocks',type:'signedbar',title:'Gain or loss on each year’s contributions on the day the old peak returns',unit:'percent',rows:[{label:'Starting balance invested at the peak',value:0},...blocks],note:`Each bar values one block of month-end purchases at the old peak price in month ${back}. Contributions made near the low bought the most units. These are gains on paper only, and they exist only if the market does recover; the recovery length is an assumption you enter, not a promise.`},
      {id:'crash-contribution-grid',type:'heatmap',title:'Months until the account is back above money put in, by fall size and starting balance',unit:'months',unitLabel:'Months after the market peak',rowLabel:'Starting balance',unavailableLabel:'Not within horizon',columns:drops.map(dr=>`Fall −${dr}%`),rows:grid,note:`Each cell keeps the entered ${input.ccFallMonths}-month fall and ${input.ccRiseMonths}-month recovery, so the market always regains its peak in month ${back}; only the depth of the fall and the starting balance change. A starting balance is shown as a number of monthly contributions of ${money(input.ccMonthly)}.`}
    ]};
  }
  if(kind==='fundWithdrawalTax'){
    const p=fundWithdrawalPlan(input),m=p.rate,first=p.years[0]??{w:0,gain:0,gainTax:0,costOut:0};
    const W=input.fwWithdraw,share=input.fwValue>0?Math.min(1,input.fwCost/input.fwValue):1;
    const compare=[{label:'TFSA withdrawal',value:0},{label:'Non-registered fund · units bought recently (cost ≈ value)',value:0},{label:'Non-registered fund · the entered cost base',value:Math.max(0,W*(1-share))*capitalGainsInclusion*m},{label:'Non-registered fund · no cost base left (all gain)',value:W*capitalGainsInclusion*m},{label:'RRSP or RRIF withdrawal (fully taxable)',value:W*m}];
    const picks=[...new Set([1,5,10,15,20,25,30,35,40].filter(y=>y<=p.years.length).concat(p.years.length?[p.years.length]:[]))];
    const shares=[1,.8,.6,.4,.2,0],growths=[0,2,4,6,8];
    return {metrics:[['Tax on the first year’s redemption',first.gainTax,'money'],['Share of the first redemption that is taxable income',first.w?Math.max(0,first.gain)*capitalGainsInclusion/first.w:0,'percent'],['Tax on the first year’s reinvested distributions',p.years[0]?.distTax??0,'money'],['Total tax per dollar redeemed over the plan',p.average,'percent'],[p.lasted===input.fwYears?`Fund value after ${input.fwYears} years`:'Fund value when withdrawals stop',p.end,'money'],['Tax that would be due if the rest were sold then',p.endDeferredTax,'money'],['Years the full withdrawal is paid',p.lasted,'integer']],
    note:`The fund starts at ${money(input.fwValue)} with an adjusted cost base of ${money(input.fwCost)}. ${money(input.fwWithdraw)} is redeemed at the start of the first year, rising ${input.fwIndex}% a year. Each redemption uses the average cost per unit, so only the part above cost is a capital gain, and half of that gain is taxed at the combined ${pct(m,2)} marginal rate (${input.fwFedRate}% federal plus ${input.fwProvRate}% provincial or territorial). Units then grow ${input.fwGrowth}% a year and distributions of ${input.fwDist}% a year are reinvested and taxed at the full marginal rate, a conservative simplification: eligible dividends and capital gains distributions would be taxed less. Tax is paid from the redeemed cash. Returns are hypothetical, not a forecast, and this is not a personal tax calculation.`,
    charts:[
      {id:'fund-withdrawal-wrappers',type:'signedbar',title:`Tax on the same ${money(W)} withdrawal, by account and cost base`,unit:'money',rows:compare,note:`At a combined ${pct(m,2)} marginal rate. In the non-registered fund only the gain portion is taxed, at half inclusion; an RRSP or RRIF withdrawal is fully taxable because the contributions were deducted when made, so the comparison is about the cash-flow tax in that year, not about which account was better over a lifetime.`},
      {id:'fund-withdrawal-parts',type:'stackbar',title:'What each redemption is made of',unit:'money',seriesNames:['Your own cost coming back (not taxed)','Half of the gain left out of income','Half of the gain taxed as income'],rows:picks.map(y=>{const r=p.years[y-1],gn=Math.max(0,r.gain);return {label:`Year ${y} · ${money(r.w)} redeemed`,values:[r.costOut+Math.min(0,r.gain),gn/2,gn/2]};}),note:`The taxable share grows as the fund’s gain grows relative to its cost base. In year 1, ${pct(first.w?Math.max(0,first.gain)/first.w:0)} of the redemption is gain; ${p.years.length>1?`by year ${p.years.length} it is ${pct(Math.max(0,p.years.at(-1).gain)/p.years.at(-1).w)}`:'only one year is modeled'}.`},
      {id:'fund-withdrawal-balance',type:'line',title:'Market value, adjusted cost base and the tax deferred inside the fund',unit:'money',xLabel:'Year-end',series:[{name:'Market value',rows:p.rows.map(r=>({x:r.x,value:r.value}))},{name:'Adjusted cost base',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.cost}))},{name:'Tax due if everything were sold that day',rows:p.rows.map(r=>({x:r.x,value:r.deferredTax}))}],note:`Redemptions remove cost base in proportion to value; reinvested distributions add to it. The gap between the two lines is unrealized gain. It is taxed when units are sold or are considered sold (a deemed disposition), so deferral postpones the tax; it does not cancel it.`},
      {id:'fund-withdrawal-grid',type:'heatmap',title:'Total tax per dollar redeemed over the plan, by starting cost base and price growth',unit:'percent',columns:growths.map(g=>`Growth ${g}%`),rows:shares.map(s=>({label:`Cost base ${Math.round(s*100)}% of value`,values:growths.map(g=>fundWithdrawalPlan(input,{fwCost:input.fwValue*s,fwGrowth:g}).average)})),note:`Each cell reruns the ${input.fwYears}-year plan with the entered withdrawal, distribution rate and tax rates, changing only the starting cost base and unit price growth. The figure includes tax on reinvested distributions, which is owed whether or not any units are sold.`}
    ]};
  }
  throw Error('Unknown crash-withdrawal topic');
}
