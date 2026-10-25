export const performanceFeeDefinitions={
 performanceFee:{title:'Hold gross returns fixed and compare two invented annual fee rules',fields:[
  ['feeCapital','Initial investor capital (CAD)',100000,0,1000000,5000],
  ['feeYearOne','Year one gross return (%)',-20,-80,40,1],
  ['feeYearTwo','Year two gross return (%)',25,-50,60,1],
  ['feeYearThree','Year three gross return (%)',10,-50,40,1],
  ['feeYearFour','Year four gross return (%)',10,-50,40,1],
  ['performanceRate','Invented fee as a share of eligible gain (%)',20,0,40,1]
 ]}
};

export function performanceFeePath(d){
 const returns=[d.feeYearOne,d.feeYearTwo,d.feeYearThree,d.feeYearFour].map(r=>r/100),rate=d.performanceRate/100;
 const rows=[{year:0,plain:d.feeCapital,annual:d.feeCapital,marked:d.feeCapital,annualFee:0,markedFee:0,mark:d.feeCapital,openingMark:d.feeCapital}];
 let plain=d.feeCapital,annual=d.feeCapital,marked=d.feeCapital,mark=d.feeCapital;
 for(let i=0;i<returns.length;i++){
  const r=returns[i],annualGross=annual*(1+r),markedGross=marked*(1+r),openingMark=mark;
  const annualFee=rate*Math.max(0,annualGross-annual),markedFee=rate*Math.max(0,markedGross-mark);
  plain*=1+r;annual=annualGross-annualFee;marked=markedGross-markedFee;mark=Math.max(mark,marked);
  rows.push({year:i+1,plain,annual,marked,annualFee,markedFee,mark,openingMark,annualGross,markedGross});
 }
 const annualFees=rows.reduce((s,r)=>s+r.annualFee,0),markedFees=rows.reduce((s,r)=>s+r.markedFee,0);
 return {returns,rows,plain,annual,marked,annualFees,markedFees,advantage:marked-annual,annualGap:plain-annual,markedGap:plain-marked,annualSubsequentEffect:plain-annual-annualFees,markedSubsequentEffect:plain-marked-markedFees};
}

export function performanceFeeResult(kind,d){
 if(kind!=='performanceFee')throw Error('Unknown performance-fee illustration.');
 const p=performanceFeePath(d);
 return {metrics:[['Ending value: annual positive-gain fee',p.annual,'money'],['Ending value: fee above the prior net high-water mark',p.marked,'money'],['High-water-mark ending value less annual-reset value',p.advantage,'money']],
 note:'Original hypothetical four-year comparison. All paths receive the same entered gross total-return percentages with no contributions or withdrawals. One path has no modeled fees. The annual-reset path charges the selected fraction of each positive annual dollar gain, with no carryforward of past losses. The high-water-mark path charges only on gross year-end value above its prior highest post-fee year-end balance, starting at initial capital. After charging, its mark is the larger of the old mark and the new net balance. Fees crystallize once per year and are deducted inside each account; no outside fee cash is added. These are explicitly invented rules, not a description or quote for a specific fund. Management fees, hurdles, benchmarks, subscriptions, redemptions, equalization, tax and other costs are excluded. No high-water mark guarantees principal or prevents losses. Future return effects on earlier fee deductions may be positive or negative.',charts:[
  {id:'performance-fee-gross-return-calendar',type:'returns',title:'The same gross return calendar applies before either fee rule',unit:'percent',unitLabel:'Independent assumed annual gross total returns · not observed fund performance',seriesNames:['Entered gross return'],rows:p.returns.map((r,i)=>({label:'Year '+(i+1),values:[r]})),note:'Each percentage applies to that path’s own opening balance. Different fees therefore produce different later dollar gains despite matching gross percentages. Negative years do not earn a fee refund under either invented rule.'},
  {id:'performance-fee-account-paths',type:'line',title:'Recovering a previous loss can trigger a fee under one rule and none under the other',unit:'money',xLabel:'Completed annual periods',series:[{name:'No modeled fee',rows:p.rows.map(r=>({x:r.year,value:r.plain}))},{name:'Annual positive-gain fee',dash:true,rows:p.rows.map(r=>({x:r.year,value:r.annual}))},{name:'Prior net high-water-mark fee',rows:p.rows.map(r=>({x:r.year,value:r.marked}))}],note:'Balances are after each year’s fee deduction. The no-fee path is a counterfactual using the same gross percentages, not a quoted investable alternative. No path receives new investor deposits. A path returning to its original capital has recovered a nominal amount; this chart does not adjust for inflation.'},
  {id:'performance-fee-charges-by-year',type:'groupbar',title:'Inspect the dollar charged in each year before adding up fees',unit:'money',unitLabel:'Hypothetical fees deducted inside each account · CAD',seriesNames:['Annual positive-gain rule','Prior net high-water-mark rule'],rows:p.rows.slice(1).map(r=>({label:'Year '+r.year,values:[r.annualFee,r.markedFee]})),note:'The same fee percentage can apply to different eligible gain amounts. A zero charge under the mark rule means gross value has not exceeded that path’s own prior net mark, or the fee rate is zero; it does not mean the investment cannot lose money.'},
  {id:'performance-fee-cost-return-bridge',type:'waterfall',title:'Fee dollars and their subsequent return effects reconcile to the ending value gap',unit:'money',rows:[...p.rows.slice(1).map(r=>({label:'Year '+r.year+' high-water-mark fee',value:r.markedFee})),{label:'Subsequent return effect',value:p.markedSubsequentEffect}],totalLabel:'Ending value gap',note:'The first steps sum fees actually deducted under the invented high-water-mark path. The final step is the extra difference caused by later gross returns on those removed dollars. It can be negative when later returns are negative. The endpoint is the no-fee account value less that fee-paying account, rather than an extra cash charge or an annualized fee rate.'},
  {id:'performance-fee-loss-recovery-matrix',type:'heatmap',title:'The first loss and following recovery change the difference between the two fee rules',unit:'money',unitLabel:'Year-four high-water-mark account value less annual-reset account value · CAD',columns:['10%','25%','40%','60%'],rows:[-10,-20,-30,-40].map(first=>({label:first+'%',values:[10,25,40,60].map(second=>performanceFeePath({...d,feeYearOne:first,feeYearTwo:second}).advantage)})),note:'Rows replace the year-one return and columns replace the year-two return. Initial capital, fee percentage and years three and four stay selected. Every cell is an original assumed path, not a probability, forecast or estimate of a product’s actual fees. Different fee contracts or external cash flows would need different calculations.'}
 ]};
}
