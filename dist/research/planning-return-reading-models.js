export const returnReadingDefinitions={
  fundDistributions:{title:'Separate a fund’s distributions, unit value and total resources',fields:[
    ['initial','Initial amount invested (CAD)',100000,1000,1000000,5000],['annualReturn','Hypothetical annual fund total return before investor costs (%)',5,-10,10,.5],
    ['distributionRate','Annual scheduled distribution as % of initial unit NAV',8,0,10,.5],['years','Whole years in the illustration',5,1,5,1]
  ]},
  returnMeasurement:{title:'Explore one invented return path and the date of one contribution',fields:[
    ['initial','Opening account investment (CAD)',10000,1000,200000,1000],['contribution','One additional contribution (CAD)',10000,0,200000,1000],
    ['depositMonth','Contribution arrives after this month’s return',6,1,12,1],['firstHalf','Total return over the first six months (%)',-20,-40,40,5],
    ['secondHalf','Total return over the final six months (%)',25,-40,40,5]
  ]}
};

// Annual total return is converted to monthly fund growth before distribution.
// The scheduled per-unit cash payment is based on the initial CAD 10 unit NAV.
// The supported return/distribution/horizon ranges keep ex-distribution NAV positive.
export function distributionPath(d){
  const initialNAV=10,originalUnits=d.initial/initialNAV,growth=(1+d.annualReturn/100)**(1/12),perUnit=initialNAV*d.distributionRate/100/12;
  let nav=initialNAV,cash=0,reinvestedUnits=originalUnits,investmentGain=0;
  const rows=[{x:0,nav,fund:d.initial,cash:0,total:d.initial,reinvested:d.initial}];
  for(let month=1;month<=12*d.years;month++){
    const oldNAV=nav,before=oldNAV*growth;nav=before-perUnit;
    if(!(nav>0))throw Error('The selected illustration exhausts the fund unit value.');
    investmentGain+=originalUnits*oldNAV*(growth-1);cash+=originalUnits*perUnit;
    reinvestedUnits*=1+perUnit/nav;
    const fund=originalUnits*nav;
    rows.push({x:month,nav,fund,cash,total:fund+cash,reinvested:reinvestedUnits*nav});
  }
  return {rows,end:rows.at(-1),cash,investmentGain,perUnit,annualCash:d.initial*d.distributionRate/100};
}

// With one positive initial investment, a nonnegative contribution and positive
// terminal resources, the annual growth factor is the unique positive root.
export function moneyWeightedReturn(initial,contribution,depositMonth,ending){
  if(contribution===0)return ending/initial-1;
  const remaining=(12-depositMonth)/12;
  let low=0,high=ending/initial+1;
  for(let i=0;i<90;i++){
    const factor=(low+high)/2,value=initial*factor+contribution*factor**remaining;
    if(value<ending)low=factor;else high=factor;
  }
  const rate=(low+high)/2-1;return Math.abs(rate)<1e-12?0:rate;
}
export function measuredReturnPath(d){
  const first=(1+d.firstHalf/100)**(1/6),second=(1+d.secondHalf/100)**(1/6);
  let account=d.initial,normalized=1000,contributed=0;
  const rows=[{x:0,account,normalized,contributed:0}];
  for(let month=1;month<=12;month++){
    const factor=month<=6?first:second;account*=factor;normalized*=factor;const beforeContribution=account;
    if(month===d.depositMonth){account+=d.contribution;contributed+=d.contribution;}
    rows.push({x:month,account,normalized,contributed,beforeContribution});
  }
  const twr=(1+d.firstHalf/100)*(1+d.secondHalf/100)-1;
  const mwr=moneyWeightedReturn(d.initial,d.contribution,d.depositMonth,account);
  return {rows,ending:account,contributed,gain:account-d.initial-contributed,twr:Math.abs(twr)<1e-12?0:twr,mwr};
}

const series=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function returnReadingResult(kind,d){
  if(kind==='fundDistributions'){
    const p=distributionPath(d);
    return {metrics:[['Cash distributions collected and retained outside',p.cash,'money'],['Collect-and-retain: fund plus outside cash at the end',p.end.total,'money'],['Reinvest-all: fund value at the end',p.end.reinvested,'money']],note:'One invented fund, CAD 10 initial unit NAV, fractional units and constant hypothetical monthly total-return factors. The annual total-return input is converted to monthly growth before a fixed per-unit distribution. That payment is initial unit NAV × scheduled annual distribution % ÷ 12. One holder retains cash outside at zero interest; the other reinvests every payment at the post-distribution NAV. Neither consumes cash or adds money. No taxes, fees, dealing prices, actual fund policy, guaranteed distribution or tax classification is calculated. The distribution schedule is not an investment-return forecast.',charts:[
      {id:'distribution-fund-cash-resources',type:'line',title:'Fund value and retained cash are separate resources',unit:'money',xLabel:'Completed monthly periods',series:[series('Original units: fund value only',p.rows,'fund'),series('Distributions retained outside at zero interest',p.rows,'cash',{dash:true}),series('Fund plus outside cash',p.rows,'total')],note:'The outside cash is retained, not spent. The total line already includes both components; do not add it to the other lines. These are hypothetical financial resources, not a payout-rate measure.'},
      {id:'distribution-unit-nav',type:'line',title:'Unit NAV can fall while the investor receives cash',unit:'money',unitLabel:'CAD per original fund unit',tableUnit:'CAD per unit',xLabel:'Completed monthly periods',series:[series('Post-distribution NAV per unit',p.rows,'nav')],note:'NAV grows by the assumed monthly total-return factor before the scheduled per-unit payment is deducted. A declining unit price alone does not include the value transferred to the holder as cash, and cannot identify a distribution’s tax character.'},
      {id:'distribution-fund-bridge',type:'waterfall',title:'Reconcile the value remaining inside the original fund units',unit:'money',rows:[{label:'Initial fund investment',value:d.initial},{label:'Cumulative investment gain or loss inside original units',value:p.investmentGain},{label:'Distributions transferred to outside cash',value:-p.cash}],totalLabel:'Value remaining in the original fund units',note:'The ending amount excludes outside cash, which remains an asset in the collect-and-retain example. The distribution is a transfer of resources out of the fund; it is not added again as separate investment profit.'},
      {id:'distribution-rate-comparison',type:'line',title:'Ending resources across hypothetical distribution schedules',unit:'money',xLabel:'Scheduled annual distribution % of initial unit NAV',series:[{name:'Collect cash outside, earning zero interest',rows:[0,2,4,6,8,10].map(distributionRate=>({x:distributionRate,value:distributionPath({...d,distributionRate}).end.total}))},{name:'Reinvest every distribution',dash:true,rows:[0,2,4,6,8,10].map(distributionRate=>({x:distributionRate,value:distributionPath({...d,distributionRate}).end.reinvested}))}],note:'Initial investment, assumed fund total return and horizon stay selected. Reinvesting preserves full fund exposure; collecting cash changes that exposure. Cash can lag in a positive-return scenario or cushion a negative-return scenario. The distribution rate itself is not a performance forecast.'}
    ]};
  }
  if(kind==='returnMeasurement'){
    const p=measuredReturnPath(d),timing=Array.from({length:12},(_,i)=>({month:i+1,p:measuredReturnPath({...d,depositMonth:i+1})}));
    return {metrics:[['Time-weighted return for the invented year',p.twr,'percent'],['Money-weighted annual return for the entered cash timing',p.mwr,'percent'],['Investment gain or loss, excluding the contribution',p.gain,'money']],note:'One invented year of twelve equal month fractions. Each six-month return is spread evenly through its six months; the contribution arrives after the selected month’s return. There are no withdrawals, distributions, fees or taxes. Time-weighted return links the fund-growth factors independently of external contributions. Money-weighted return solves the unique annual cash-flow equation using the opening investment, one nonnegative contribution and positive ending value. No actual statement convention, daily XIRR, manager evaluation or future timing recommendation is provided.',charts:[
      {id:'measurement-account-balance',type:'line',title:'The account balance includes an external cash contribution',unit:'money',xLabel:'Completed month; any contribution arrives after its return',series:[{name:'Account value, with a vertical cash-contribution step',rows:p.rows.flatMap(r=>r.x===d.depositMonth&&d.contribution>0?[{x:r.x,value:r.beforeContribution},{x:r.x,value:r.account}]:[{x:r.x,value:r.account}])}],note:'A contribution can raise the account balance without creating investment profit. Two points at the selected month show its value immediately before and after the external contribution. The vertical step is cash arriving at that date; other lines connect month-end observations.'},
      {id:'measurement-normalized-path',type:'line',title:'Growth of an unchanged CAD 1,000 exposure to the same return path',unit:'money',unitLabel:'CAD, normalized to an unchanged initial 1,000 investment',xLabel:'Completed monthly periods',series:[series('No external cash flows',p.rows,'normalized')],note:'This normalized investment receives the same return factors but no contributions. Its endpoint relative to CAD 1,000 measures the linked time-weighted return; it is not the dollar value of the larger account above.'},
      {id:'measurement-balance-bridge',type:'waterfall',title:'Separate new money from the investment gain or loss',unit:'money',rows:[{label:'Opening account investment',value:d.initial},{label:'One external contribution',value:d.contribution},{label:'Investment gain or loss',value:p.gain}],totalLabel:'Ending account value',note:'Gain is ending value less initial investment and external contributions. Dividing that gain by a chosen deposit total is not automatically either the time-weighted or the annual money-weighted rate.'},
      {id:'measurement-contribution-timing',type:'line',title:'The same invented year with a contribution on alternative dates',unit:'percent',unitLabel:'Annual return for the same one-year horizon',xLabel:'Contribution arrives after this month’s return',xMin:1,series:[{name:'Money-weighted return',rows:timing.map(r=>({x:r.month,value:r.p.mwr}))},{name:'Time-weighted return',dash:true,rows:timing.map(r=>({x:r.month,value:r.p.twr}))}],note:'Each point is a separate contribution-date scenario, not the return earned through that month. The return path and contribution amount stay selected. The path is known only because it is invented here; this comparison cannot identify a future best time to invest.'}
    ]};
  }
  throw Error('Unknown return-reading planning topic.');
}
