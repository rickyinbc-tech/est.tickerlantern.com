export const balancedTimingDefinitions={
  balancedStress:{title:'Stress a balanced portfolio before assuming a smooth long-term return',fields:[
    ['stressCapital','Starting portfolio (CAD)',100000,1000,1000000,1000],
    ['stressEquity','Starting equity allocation (%)',60,0,100,5],
    ['stressStocks','First-year equity total return before modeled fee (%)',-35,-70,20,1],
    ['stressBonds','First-year bond total return before modeled fee (%)',-8,-40,20,1],
    ['stressGrowth','Assumed later annual portfolio return before fee (%)',6,-5,15,.5],
    ['stressFee','Annual modeled portfolio fee (%)',1,0,3,.1],
    ['stressInflation','Annual assumed inflation (%)',2,0,8,.5],
    ['stressYears','Years from the starting date, including the shock year',20,1,30,1]
  ]},
  timingRule:{title:'Write an exit rule and a return-to-market rule before seeing the outcome',fields:[
    ['timingCapital','Starting invested balance (CAD)',10000,0,500000,1000],
    ['timingMonthly','New cash added at each month-end in both strategies (CAD)',500,0,10000,100],
    ['timingPath','Authored path: 1 = fast rebound, 2 = longer decline, 3 = whipsaw',1,1,3,1],
    ['timingScale','Scale of the authored monthly returns (%)',100,0,150,10],
    ['timingExit','Exit after a month-end drawdown from the index peak of at least (%)',20,5,60,5],
    ['timingBounce','Re-enter after an index rise from the exit close of at least (%)',10,0,40,5],
    ['timingCash','Effective annual interest on waiting cash (%)',3,0,8,.5],
    ['timingCost','Cost deducted at each exit and re-entry (% of balance)',.1,0,1,.05]
  ]}
};

export function balancedStressPlan(input,{growth=input.stressGrowth,inflation=input.stressInflation}={}){
  const weight=input.stressEquity/100,stockChange=input.stressCapital*weight*input.stressStocks/100;
  const bondChange=input.stressCapital*(1-weight)*input.stressBonds/100;
  const beforeFee=input.stressCapital+stockChange+bondChange,firstFee=beforeFee*input.stressFee/100;
  const afterShock=beforeFee-firstFee,netFactor=(1+growth/100)*(1-input.stressFee/100);
  const rows=[{x:0,value:input.stressCapital,real:input.stressCapital}];
  for(let year=1;year<=input.stressYears;year++){
    const value=afterShock*netFactor**(year-1);rows.push({x:year,value,real:value/(1+inflation/100)**year});
  }
  return {stockChange,bondChange,firstFee,afterShock,netFactor,rows,realEnd:rows.at(-1).real};
}

export const timingPaths=[
  {name:'Fast rebound',returns:[-.12,-.12,.18,.12,.05,.02,.01,.01,.01,.01,.01,.01]},
  {name:'Longer decline',returns:[-.12,-.12,-.12,-.10,-.08,-.02,0,.02,.02,.01,.01,.01]},
  {name:'Whipsaw',returns:[-.12,.14,-.12,.14,-.12,.14,-.03,.03,.02,.01,.01,.01]}
];

// One exit/re-entry cycle only. Decisions use the current close, never a later return.
// Both strategies receive identical new cash AFTER each month's market/interest return.
export function timingRulePlan(input,{path=input.timingPath,exit=input.timingExit,bounce=input.timingBounce}={}){
  let index=100,peak=100,hold=input.timingCapital,timed=hold,invested=true,exitMonth=null,entryMonth=null,exitIndex=null,fees=0;
  const cashFactor=(1+input.timingCash/100)**(1/12),cost=input.timingCost/100;
  const rows=[{x:0,index,hold,timed,capital:hold,invested:true,event:'Starting investment'}];
  timingPaths[path-1].returns.forEach((base,i)=>{
    const factor=1+base*input.timingScale/100;
    index*=factor;peak=Math.max(peak,index);
    hold=hold*factor+input.timingMonthly;
    timed=timed*(invested?factor:cashFactor)+input.timingMonthly;
    let event=invested?'Remain invested':'Remain in cash';
    if(invested&&exitMonth===null&&index/peak-1<=-exit/100+1e-12){
      exitMonth=i+1;exitIndex=index;const charge=timed*cost;fees+=charge;timed-=charge;invested=false;event='Exit at this close';
    }else if(!invested&&index>=exitIndex*(1+bounce/100)-1e-12){
      entryMonth=i+1;const charge=timed*cost;fees+=charge;timed-=charge;invested=true;event='Re-enter at this close';
    }
    rows.push({x:i+1,index,hold,timed,capital:input.timingCapital+(i+1)*input.timingMonthly,invested,event});
  });
  return {rows,exitMonth,entryMonth,fees,hold,timed,difference:timed-hold};
}

export function balancedTimingResult(kind,input){
  if(kind==='balancedStress'){
    const p=balancedStressPlan(input),feeFactor=1-input.stressFee/100;
    return {metrics:[['Portfolio after the modeled first year',p.afterShock,'money'],['Ending purchasing power in starting-date CAD',p.realEnd,'money'],['Later annual return after the modeled fee',p.netFactor-1,'percent']],
      note:'Hypothetical stress arithmetic in CAD, not a fund forecast, historical crisis replay or probability estimate. The first year applies the entered equity and bond total returns to starting weights, then deducts the fee from the resulting portfolio. Every later year uses the independently entered whole-portfolio gross return, then the same fee. Changing the equity weight changes the first-year stress only; it does not estimate later returns. Inflation applies in every year including year one. Distributions are retained within total return. No new deposits, withdrawals, taxes, trading spreads or additional charges are calculated. Actual fund expenses accrue differently; do not subtract this fee again from a published return already net of it. No recovery date is guaranteed.',
      charts:[
        {id:'balanced-stress-mixes',type:'groupbar',title:'Capital remaining depends on both the equity mix and the bond outcome',unit:'percent',seriesNames:['Entered equity shock; bonds +5%','Entered equity and bond shocks'],rows:[0,40,60,80,100].map(w=>({label:w+'% equity / '+(100-w)+'% bonds',values:[(1+w/100*input.stressStocks/100+(1-w/100)*.05)*feeFactor,(1+w/100*input.stressStocks/100+(1-w/100)*input.stressBonds/100)*feeFactor]})),note:'Each bar starts from the same 100% capital and includes one modeled fee. The first comparison fixes the bond return at hypothetical +5%; the second uses your entered bond shock. These are alternate stresses, not historical frequencies. Values below 100% mean capital was lost. The selected allocation is calculated exactly in the waterfall.'},
        {id:'balanced-stress-loss-bridge',type:'waterfall',title:'Translate the selected first-year stress into actual portfolio dollars',unit:'money',rows:[{label:'Starting capital',value:input.stressCapital},{label:'Equity return in dollars',value:p.stockChange},{label:'Bond return in dollars',value:p.bondChange},{label:'Modeled first-year fee',value:-p.firstFee}],totalLabel:'First-year closing portfolio',note:'The two asset changes use their starting allocations. The fee is applied once to their combined closing value. A diversified label cannot cancel negative returns in both sleeves.'},
        {id:'balanced-stress-real-path',type:'line',title:'A higher future balance and restored purchasing power are different milestones',unit:'money',xLabel:'Years from the starting date',series:[{name:'Portfolio in future CAD',rows:p.rows.map(({x,value})=>({x,value}))},{name:'Portfolio in starting-date purchasing power',rows:p.rows.map(({x,real})=>({x,value:real}))},{name:'Original capital in starting-date CAD',rows:p.rows.map(({x})=>({x,value:input.stressCapital})),dash:true}],note:'Year one is the entered stress. Years two onward use a smooth assumption solely to expose the compounding arithmetic. The dashed reference and real-value line share the starting-date price basis. No deposits mask the investment result. Actual returns and inflation will vary.'},
        {id:'balanced-stress-real-grid',type:'heatmap',title:'Test the ending real gain against different later returns and inflation rates',unit:'percent',signed:true,columns:['0%','2%','4%','6%'],rows:[2,4,6,8].map(growth=>({label:growth+'% gross',values:[0,2,4,6].map(inflation=>balancedStressPlan(input,{growth,inflation}).realEnd/input.stressCapital-1)})),note:'Columns replace annual inflation; rows replace the later gross annual portfolio return. The selected first-year shock, horizon and fee stay fixed. Cells are ending purchasing-power changes relative to starting capital. Negative cells remain possible at a long horizon. The selected growth and inflation inputs drive the line chart, while this matrix deliberately shows fixed alternatives.'}
      ]};
  }
  if(kind!=='timingRule')throw Error('Unknown balanced-investing topic.');
  const p=timingRulePlan(input),path=timingPaths[input.timingPath-1];
  return {metrics:[['Remain invested: ending total resources',p.hold,'money'],['Timing rule: ending investment plus cash',p.timed,'money'],['Timing rule minus remain invested',p.difference,'money']],
    note:'Twelve authored hypothetical monthly total returns; no historical index, financial crisis replay, forecast or probability. Selected path: '+path.name+'. Returns are treated as already net of ongoing fund expenses, with income reinvested. Both strategies start with the same capital and receive the same month-end new cash. The timing rule makes at most one exit and one re-entry: after the current return and deposit, exit on the entered drawdown from the observed index peak; while out, earn the entered cash interest and re-enter at a later close when the index reaches the entered rise from the exit close. It participates in market returns again only in the next month. Exit month: '+(p.exitMonth??'not triggered')+'; re-entry month: '+(p.entryMonth??'not reached')+'. Proportional trade costs are deducted at each switch; initial implementation and final liquidation costs are excluded for both. Cash is included even if re-entry never happens. Taxes, inflation, settlement delays and interest-rate changes are excluded. This monthly-close rule is not a stop order or a recommendation.',
    charts:[
      {id:'timing-rule-market-path',type:'line',title:'Observe the whole selected return path before interpreting a strategy result',unit:'decimal',xLabel:'Month-end · total-return index starts at 100',series:[{name:path.name+' · hypothetical index',rows:p.rows.map(({x,index})=>({x,value:index}))}],note:'The index contains no household deposits. Monthly returns, including negative months, are available in the article’s scenario table. Exit and re-entry are determined only after each close is observed, without anticipating the next month.'},
      {id:'timing-rule-resource-path',type:'line',title:'Count waiting cash and match every monthly contribution',unit:'money',xLabel:'Month-end',series:[{name:'Remain invested with regular contributions',rows:p.rows.map(({x,hold})=>({x,value:hold}))},{name:'One-cycle timing rule, including cash',rows:p.rows.map(({x,timed})=>({x,value:timed}))},{name:'Cumulative new capital, without returns',rows:p.rows.map(({x,capital})=>({x,value:capital})),dash:true}],note:'Each month applies the market return or cash interest first, then adds the same new cash to both strategies. While the timing strategy waits, its new savings stay in cash. The dashed capital line separates saving from performance. The chart includes all resources, not just the part currently invested.'},
      {id:'timing-rule-three-paths',type:'groupbar',title:'The same announced rule can help or hurt under different paths',unit:'money',seriesNames:['Remain invested','One-cycle timing rule, including cash'],rows:timingPaths.map((path,i)=>{const q=timingRulePlan(input,{path:i+1});return {label:path.name,values:[q.hold,q.timed]};}),note:'All three paths use identical starting capital, deposits, scaling, thresholds, cash interest and trade costs. They were authored to expose different tradeoffs and are not a representative backtest. No occurrence probability or expected advantage can be inferred from three examples.'},
      {id:'timing-rule-threshold-grid',type:'heatmap',title:'Changing either decision can change the timing advantage',unit:'money',signed:true,columns:['0%','10%','20%','30%'],rows:[10,20,30].map(exit=>({label:exit+'% exit',values:[0,10,20,30].map(bounce=>timingRulePlan(input,{exit,bounce}).difference)})),note:'Rows replace the exit drawdown; columns replace the required rise from the exit close before re-entry. Other selected inputs and the selected return path stay fixed. Cells show ending timing-rule resources minus remain-invested resources. A best cell found after observing the whole path is hindsight, not a rule that was available with knowledge of future returns.'}
    ]};
}
