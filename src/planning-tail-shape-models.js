export const tailShapeDefinitions={
 tailShape:{title:'Compare two invented one-year return distributions with identical mean and standard deviation',fields:[
  ['shapeMean','Common assumed arithmetic mean return (%)',5,-5,15,.5],
  ['shapeSD','Common assumed return standard deviation (%)',15,1,20,1],
  ['lowerChance','Lower-outcome probability in the unequal case (%)',10,5,50,5],
  ['shapeCapital','Opening investment (CAD)',100000,1000,1000000,1000],
  ['goalReturn','Required one-year return to meet the goal (%)',0,-20,20,1]
 ]}
};
export function twoPointReturns(mean,sd,lowerChance){
 const m=mean/100,s=sd/100,q=lowerChance/100;
 return [{label:'Lower outcome',probability:q,return:m-s*Math.sqrt((1-q)/q)},
  {label:'Upper outcome',probability:1-q,return:m+s*Math.sqrt(q/(1-q))}];
}
export function probabilityBelow(rows,threshold){
 return rows.reduce((sum,r)=>sum+(r.return<threshold-1e-12?r.probability:0),0);
}
export function tailShapePlan(d){
 const equal=twoPointReturns(d.shapeMean,d.shapeSD,50),unequal=twoPointReturns(d.shapeMean,d.shapeSD,d.lowerChance),threshold=d.goalReturn/100;
 return {equal,unequal,target:d.shapeCapital*(1+threshold),expected:d.shapeCapital*(1+d.shapeMean/100),equalBelow:probabilityBelow(equal,threshold),unequalBelow:probabilityBelow(unequal,threshold)};
}
export function tailShapeResult(kind,d){
 if(kind!=='tailShape')throw Error('Unknown return-shape topic.');
 const p=tailShapePlan(d),both=[...p.equal,...p.unequal],xmin=Math.floor(Math.min(...both.map(r=>r.return*100))/5)*5-5,xmax=Math.ceil(Math.max(...both.map(r=>r.return*100))/5)*5+5;
 const cdf=rows=>[{x:xmin,value:0},...rows.map((r,i)=>({x:r.return*100,value:rows.slice(0,i+1).reduce((s,a)=>s+a.probability,0),label:(r.return*100).toFixed(4)+'%'})),{x:xmax,value:1}];
 const pct=x=>Number((x*100).toFixed(2))+'%';
 return {metrics:[['Common assumed arithmetic mean return',d.shapeMean/100,'percent'],['Equal probabilities: chance of finishing below the selected goal',p.equalBelow,'percent'],['Unequal probabilities: chance of finishing below the selected goal',p.unequalBelow,'percent']],note:'Original, completely specified two-outcome probability examples for one holding year. The probabilities are chosen assumptions, not estimated historical frequencies or forecasts for any security. Both cases have the selected population mean and population standard deviation. The unequal case changes outcome values when its lower-outcome probability changes so those moments stay fixed. Each case has exactly two possible returns; no normal distribution, sample, p-value, confidence interval or simulation is used. The bounds on controls keep every modeled gross return positive; they are demonstration limits, not market risk limits. There are no contributions, withdrawals, fees, taxes, inflation, leverage, serial dependence or multiyear compounding. An outcome below the required return fails the goal; equality meets it, allowing only machine-precision tolerance. The minimum outcome is a bound in this invented distribution, not an actual investment’s maximum possible loss.',charts:[
  {id:'tail-shape-outcomes',type:'signedbar',title:'The same mean and standard deviation can hide different outcome sizes',unit:'percent',unitLabel:'One-year simple return · each label includes its assumed probability',rows:[...p.equal.map(r=>({label:'Equal: '+r.label.toLowerCase()+' · '+pct(r.probability),value:r.return})),...p.unequal.map(r=>({label:'Unequal: '+r.label.toLowerCase()+' · '+pct(r.probability),value:r.return}))],note:'Bars show returns, not probabilities. The label gives the probability of that particular outcome. The two probabilities within each case sum to 100%. A lower outcome can still be positive under other inputs; the term does not automatically mean a loss.'},
  {id:'tail-shape-cumulative',type:'line',title:'Read the full cumulative probability instead of inferring a normal curve',unit:'percent',unitLabel:'Cumulative probability of a return at or below the horizontal value',xLabel:'One-year return (%)',xMin:xmin,xTicks:[xmin,(xmin+xmax)/2,xmax].map(value=>({value,label:Number(value.toFixed(1))+'%'})),yMax:1,series:[{name:'Equal outcome probabilities',step:true,rows:cdf(p.equal)},{name:'Unequal outcome probabilities',step:true,rows:cdf(p.unequal)}],note:'Each curve jumps only at its two possible return values and is flat between them. The vertical coordinate includes the probability exactly at a return. The goal-failure metrics instead use strictly below the required return, so subtract any probability at the goal when reading a jump. The horizontal axis is return, not elapsed time. The table retains the jump locations.'},
  {id:'tail-shape-wealth',type:'groupbar',title:'Identical expected wealth still leaves different lower ending balances',unit:'money',seriesNames:['Lower outcome: ending balance','Upper outcome: ending balance','Probability-weighted expected ending balance'],rows:[{label:'Equal outcome probabilities',values:[d.shapeCapital*(1+p.equal[0].return),d.shapeCapital*(1+p.equal[1].return),p.expected]},{label:'Unequal outcome probabilities',values:[d.shapeCapital*(1+p.unequal[0].return),d.shapeCapital*(1+p.unequal[1].return),p.expected]}],note:'Expected balance weights each possible balance by its probability. It is a summary of mutually exclusive outcomes, not a third possible balance or money paid into the account. Neither the lower and upper balances nor the expected balance should be added together.'},
  {id:'tail-shape-goal-matrix',type:'heatmap',title:'A smaller lower-outcome probability does not guarantee a smaller goal shortfall probability',unit:'percent',unitLabel:'Chance of finishing strictly below the goal · rows: required return; columns: lower-outcome probability',columns:[5,10,25,50].map(x=>x+'%'),rows:[-20,-10,0,10,20].map(goalReturn=>({label:goalReturn+'% goal',values:[5,10,25,50].map(q=>probabilityBelow(twoPointReturns(d.shapeMean,d.shapeSD,q),goalReturn/100))})),note:'Every cell uses the same selected mean and standard deviation and replaces both the goal and unequal-case lower-outcome probability. The two return values are recalculated to preserve those moments. If the required return exceeds even the upper outcome, goal failure is 100%. Equality meets the goal. The selected goal control affects the metrics; the matrix retains these fixed goal rows.'}
 ]};
}
