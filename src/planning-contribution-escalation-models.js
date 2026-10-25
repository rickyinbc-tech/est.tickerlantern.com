export const contributionEscalationDefinitions={contributionEscalation:{title:'Test how a regular contribution changes with prices, pay and time',fields:[
 ['escalateMonthly','Starting monthly contribution (CAD)',400,0,5000,25],
 ['escalateInflation','Assumed annual price increase (%)',2.5,0,8,.25],
 ['escalatePay','Assumed annual pay increase (%)',2,0,8,.25],
 ['escalateReturn','Assumed annual investment return after fees (%)',4,-10,12,.25],
 ['escalateYears','Saving horizon (years)',20,1,40,1]
]}};
const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
export function contributionEscalationLedger(input,{inflation=input.escalateInflation,pay=input.escalatePay,returns=input.escalateReturn,years=input.escalateYears}={}){
 const monthlyRate=Math.expm1(Math.log1p(returns/100)/12), rows=[{x:0,flat:0,cpi:0,pay:0}], schedules={flat:0,cpi:0,pay:0}, annual=[];
 for(let year=1;year<=years;year++){
  const flatMonthly=input.escalateMonthly, cpiMonthly=input.escalateMonthly*(1+inflation/100)**(year-1), payMonthly=input.escalateMonthly*(1+pay/100)**(year-1);
  for(let month=1;month<=12;month++) for(const [key,amount] of [['flat',flatMonthly],['cpi',cpiMonthly],['pay',payMonthly]]) schedules[key]=schedules[key]*(1+monthlyRate)+amount;
  const price=(1+inflation/100)**year;
  annual.push({year,flatMonthly,cpiMonthly,payMonthly,flat:schedules.flat,cpi:schedules.cpi,pay:schedules.pay,flatReal:schedules.flat/price,cpiReal:schedules.cpi/price,payReal:schedules.pay/price,price});
  rows.push({x:year,flat:schedules.flat,cpi:schedules.cpi,pay:schedules.pay});
 }
 return {rows,annual,totalContributions:{flat:annual.reduce((s,r)=>s+12*r.flatMonthly,0),cpi:annual.reduce((s,r)=>s+12*r.cpiMonthly,0),pay:annual.reduce((s,r)=>s+12*r.payMonthly,0)}};
}
export function contributionEscalationResult(kind,input){
 if(kind!=='contributionEscalation')throw Error('Unknown contribution-escalation topic');
 const p=contributionEscalationLedger(input),last=p.annual.at(-1),base=input.escalateMonthly, observed=[.031,.023];
 return {metrics:[['Ending portfolio · flat nominal contribution',last.flat,'money'],['Ending portfolio · contribution raised with assumed CPI',last.cpi,'money'],['Ending portfolio · contribution raised with assumed pay',last.pay,'money']],
 note:'Hypothetical month-end contributions compounded at a constant user-entered annual return converted to an equivalent monthly rate. Contributions step up once each year at the year’s start; no initial lump sum, withdrawals, tax, inflation-linked return forecast, changing fund allocation or market sequence is modeled. The reported historical September 2026 figures are fixed official observations and do not set any scenario input. The pay-growth assumption is not an individual wage forecast; a household may receive no raise or a different increase. Fees are represented only through the user-entered after-fee return and must not be subtracted again.',
 charts:[
  {id:'contribution-escalation-observations',type:'groupbar',title:'September 2026 inflation and average wage growth are dated comparisons',unit:'percent',unitLabel:'Year-over-year change (%)',source:'https://www150.statcan.gc.ca/n1/daily-quotidien/261019/dq261019a-eng.htm',sourceLabel:'Statistics Canada · September 2026 Consumer Price Index; September 2026 Labour Force Survey',seriesNames:['Year-over-year change'],rows:[{label:'All-items CPI · Sep 2026',values:[observed[0]]},{label:'Average hourly wages · Sep 2026',values:[observed[1]]}],note:'Statistics Canada reported 3.1% year-over-year CPI growth in September 2026 and average hourly wages 2.3% higher than a year earlier. These aggregate observations cover different measures and populations; the difference does not describe an individual’s real pay, household budget or available investment contribution. Neither value is carried forward as a forecast.'},
  {id:'contribution-escalation-portfolio',type:'line',title:'The assumed return compounds three different contribution rules',unit:'money',xLabel:'Year-end',series:[{name:'Flat nominal amount',rows:p.rows.map(r=>({x:r.x,value:r.flat}))},{name:'Contribution rises with entered CPI',rows:p.rows.map(r=>({x:r.x,value:r.cpi}))},{name:'Contribution rises with entered pay',rows:p.rows.map(r=>({x:r.x,value:r.pay}))}],note:'All schedules begin with the same first monthly contribution and use the same selected annual return after fees. Differences in ending balances come from later contribution amounts, not a strategy-specific return. The line assumes a smooth return for legibility and is not a forecast or historical fund result.'},
  {id:'contribution-escalation-monthly',type:'line',title:'A flat dollar transfer buys less as the assumed price level rises',unit:'money',xLabel:'Year',series:[{name:'Flat monthly contribution · nominal CAD',rows:p.annual.map(r=>({x:r.year,value:r.flatMonthly}))},{name:'CPI-adjusted contribution · nominal CAD',rows:p.annual.map(r=>({x:r.year,value:r.cpiMonthly}))},{name:'Pay-adjusted contribution · nominal CAD',rows:p.annual.map(r=>({x:r.year,value:r.payMonthly}))}],note:`The starting contribution is ${money(base)} per month. The fixed schedule stays there; alternatives increase once a year by their entered assumptions. The CPI-linked amount is a planning rule, not a requirement to raise contributions or a claim that income keeps pace. Check affordability each year.`},
  {id:'contribution-escalation-real',type:'line',title:'Compare each projected balance in today’s assumed purchasing power',unit:'money',xLabel:'Year-end',series:[{name:'Flat schedule · real CAD',rows:p.annual.map(r=>({x:r.year,value:r.flatReal}))},{name:'CPI-linked schedule · real CAD',rows:p.annual.map(r=>({x:r.year,value:r.cpiReal}))},{name:'Pay-linked schedule · real CAD',rows:p.annual.map(r=>({x:r.year,value:r.payReal}))}],note:`Each nominal ending balance is divided by (1 + entered inflation)^year. If pay growth differs from inflation, that schedule changes in real terms. The displayed purchasing power inherits the hypothetical price assumption and smooth return; it is not a household-specific cost-of-living estimate.`}
 ]};
}
