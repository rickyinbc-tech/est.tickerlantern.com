export const glideExposureDefinitions={
  glideDollarExposure:{title:'Explore a planned allocation path while adding new saving',fields:[
    ['glideCapital','Initial portfolio value (CAD)',100000,0,500000,10000],
    ['glideContribution','New saving added at each year-end (CAD)',20000,0,50000,1000],
    ['glideYears','Whole years to the illustrative target',30,1,40,1],
    ['glideStartEquity','Planned equity share at the start (%)',80,0,100,5],
    ['glideEndEquity','Planned equity share at the target (%)',35,0,100,5],
    ['glideEquityDecline','One-time hypothetical decline in equity values (%)',30,0,60,5]
  ]}
};

export function glideExposureLedger(input){
  const rows=Array.from({length:input.glideYears+1},(_,year)=>{
    const total=input.glideCapital+year*input.glideContribution,equityShare=(input.glideStartEquity+(input.glideEndEquity-input.glideStartEquity)*year/input.glideYears)/100;
    const equity=total*equityShare,other=total-equity,shockChange=-equity*input.glideEquityDecline/100;
    return {x:year,total,equityShare,otherShare:1-equityShare,equity,other,shockChange};
  });
  const peak=rows.reduce((best,row)=>row.equity>best.equity?row:best,rows[0]);
  return {rows,first:rows[0],last:rows.at(-1),peak};
}
const path=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function glideExposureResult(kind,input){
  if(kind!=='glideDollarExposure')throw Error('Unknown allocation-path topic.');
  const p=glideExposureLedger(input);
  return {metrics:[['Planned equity share at the target',p.last.equityShare,'percent'],['Equity dollars held at the target',p.last.equity,'money'],['Modeled value change at target under the equity decline',p.last.shockChange,'money']],note:'Original contribution-only allocation illustration. The portfolio starts with selected capital and receives equal year-end contributions. Every asset earns zero return before the separate shock comparison, so the balance is capital plus deposits rather than an investment forecast. The planned equity share changes linearly between the selected endpoints; each year-end portfolio is reset to that mix without transaction costs or tax. The remaining allocation is called other assets. In the isolated one-time shock, only equities fall and other assets do not change; that is a scenario assumption, not a claim that other assets are safe. Start, peak-exposure and target shocks are separate snapshots, not sequential losses on one path. No withdrawals, inflation, fees, rebalancing restrictions, actual fund holdings or adequate-retirement-income assessment is included. A target-date fund’s actual glide path may differ; the model stops at the selected target.',charts:[
    {id:'glide-exposure-allocation-path',type:'line',title:'The planned allocation path is a percentage of a changing total',unit:'percent',unitLabel:'Planned portfolio allocation (%) · original linear path',xLabel:'Year',series:[path('Equity share',p.rows,'equityShare'),path('Other-asset share',p.rows,'otherShare',{dash:true})],note:'The two planned shares add to 100% at every checkpoint. The selected endpoint may be lower or higher than the starting share. This straight-line illustration is not the published glide path of a fund, a recommended mix or a projection beyond the target.'},
    {id:'glide-exposure-dollar-path',type:'line',title:'Contributions can raise equity dollars even while the equity share falls',unit:'money',xLabel:'Year',series:[path('Portfolio · capital plus deposits',p.rows,'total'),path('Planned equity dollars',p.rows,'equity',{dash:true}),path('Planned other-asset dollars',p.rows,'other')],note:'At each checkpoint, equity dollars equal the planned equity share times the portfolio total. The largest modeled equity amount occurs first at year '+p.peak.x+'. A smaller share does not by itself establish a smaller dollar exposure. All growth in the total here comes from saving, with no assumed investment return.'},
    {id:'glide-exposure-snapshot-shocks',type:'signedbar',title:'Apply the same equity decline to three different snapshots',unit:'money',rows:[{label:'Starting snapshot',value:p.first.shockChange},{label:'Peak equity · year '+p.peak.x,value:p.peak.shockChange},{label:'Target snapshot',value:p.last.shockChange}],note:'Each bar is the equity amount at that snapshot times the selected negative equity change. Other assets are assumed unchanged. The peak snapshot is selected from the modeled whole-year checkpoints. The shocks are independent comparisons and are never deducted repeatedly from the contribution path. They are not probabilities, volatility estimates or maximum possible losses.'},
    {id:'glide-exposure-target-matrix',type:'heatmap',title:'Target-date loss magnitude across equity shares and annual saving',unit:'money',columns:['$0 / yr','$10k','$20k','$30k'],rows:[20,35,50,65].map(glideEndEquity=>({label:glideEndEquity+'% eq',values:[0,10000,20000,30000].map(glideContribution=>-glideExposureLedger({...input,glideEndEquity,glideContribution}).last.shockChange)})),note:'Rows replace the target equity share; columns replace the year-end contribution. Initial capital, target years and the selected equity decline stay fixed. Cells show positive loss magnitudes in CAD. The initial equity share changes the interim path but not this endpoint calculation. A smaller cell does not establish that a goal is funded or an allocation is suitable.'}
  ]};
}
