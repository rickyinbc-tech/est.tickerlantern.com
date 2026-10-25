export const repeatRiskDefinitions={repeatRisk:{title:'Test repeated independent events against one unreplenished reserve',fields:[
 ['repeatProbability','Hypothetical chance of one event in each year (%)',10,0,50,1],
 ['repeatYears','Number of complete independent years',10,1,30,1],
 ['repeatCost','Constant cost per event (whole CAD)',5000,0,20000,500],
 ['repeatReserve','One opening reserve, with no replenishment (whole CAD)',5000,0,100000,1000]
]}};
export function independentEventCounts(years,p){
 let distribution=[1];
 for(let year=0;year<years;year++){
  const next=Array(distribution.length+1).fill(0);
  distribution.forEach((mass,k)=>{next[k]+=mass*(1-p);next[k+1]+=mass*p;});
  distribution=next;
 }
 return distribution;
}
export function repeatRiskSnapshot(i,years=i.repeatYears,probability=i.repeatProbability){
 const p=probability/100,distribution=independentEventCounts(years,p);
 let shortfallProbability=0,weightedCost=0,weightedUnfunded=0,weightedCovered=0;
 distribution.forEach((mass,k)=>{const cost=k*i.repeatCost,unfunded=Math.max(0,cost-i.repeatReserve);weightedCost+=mass*cost;weightedUnfunded+=mass*unfunded;weightedCovered+=mass*Math.min(cost,i.repeatReserve);if(cost>i.repeatReserve)shortfallProbability+=mass;});
 return {distribution,anyProbability:1-(1-p)**years,shortfallProbability:Math.min(1,Math.max(0,shortfallProbability)),weightedCost,weightedUnfunded,weightedCovered};
}
export function repeatRiskResult(kind,i){
 if(kind!=='repeatRisk')throw Error('Unknown repeated-risk topic.');
 const p=repeatRiskSnapshot(i),history=Array.from({length:i.repeatYears+1},(_,year)=>({x:year,...repeatRiskSnapshot(i,year)}));
 const counts=p.distribution.slice(0,5).map((value,k)=>({label:'Exactly '+k+' event'+(k===1?'':'s'),value}));
 if(i.repeatYears>=5)counts.push({label:'Five or more events · combined tail',value:p.distribution.slice(5).reduce((a,b)=>a+b,0)});
 const series=(name,key,dash=false)=>({name,dash,rows:history.map(r=>({x:r.x,value:r[key]}))});
 return {metrics:[['At least one modeled event within the horizon',p.anyProbability,'percent'],['Total modeled cost exceeds the opening reserve',p.shortfallProbability,'percent'],['Probability-weighted total event cost',p.weightedCost,'money']],note:'Original hypothetical independent-year model, not observed household incident data or an estimate of anyone’s actual risk. Each complete year has either zero events or one event, with the same independently entered probability; years are mutually independent. Every event costs the same entered whole-CAD amount. All costs and the one opening whole-CAD reserve are in a common constant-dollar basis. The reserve is available initially, used only for these events and never replenished; there is no income, insurance reimbursement, interest, inflation, borrowing, investment or other spending. The event count follows the binomial model under these assumptions. Total cost equals count × cost per event. An unfunded cost occurs only when total cost is STRICTLY GREATER than the reserve; exactly using all of it is fully funded for this limited exercise. Probability-weighted unfunded cost sums max(total cost − reserve, 0) across all outcomes, including zero for funded outcomes. It is not a conditional tail average, a confidence limit, a worst-case amount or a recommended reserve. The count distribution retains every outcome; counts five and above share one labelled display bucket. No event timing within a year, real-world independence or statistical calibration is established.',charts:[
  {id:'repeat-risk-horizon-probabilities',type:'line',title:'The chance of an event and the chance of an unfunded cost answer different questions',unit:'percent',unitLabel:'Modeled probability (%) · independent years, constant annual assumption',yMin:0,yMax:1,xLabel:'Complete years from the start',series:[series('At least one event','anyProbability'),series('Total cost exceeds the opening reserve','shortfallProbability',true)],note:'The first curve is one minus the probability of no event in every included year. The second uses the full event-count distribution and the selected reserve. Both start at zero. A reserve can fund one event while leaving exposure to repeated events; an event is not automatically a cash shortfall.'},
  {id:'repeat-risk-count-distribution',type:'bar',axisRight:36,title:'Keep zero, one and repeated events in the same probability distribution',unit:'percent',unitLabel:'Probability of each event-count bucket (%) · selected full horizon',rows:counts,note:'Every possible count from zero through the number of years is included once. The last row combines all counts of five or more when they are possible. It does not represent exactly five events, and its probability cannot be multiplied by five to reconstruct expected cost. Exact-count probabilities remain in the model and determine all cost calculations.'},
  {id:'repeat-risk-cost-and-reserve',type:'bar',axisRight:36,title:'An average cost equal to the reserve does not guarantee that every outcome is funded',unit:'money',unitLabel:'Constant CAD · distinct quantities, not additive categories',rows:[{label:'Probability-weighted total event cost',value:p.weightedCost},{label:'Assigned opening reserve · one stock',value:i.repeatReserve},{label:'Probability-weighted unfunded cost',value:p.weightedUnfunded}],note:'The first and third rows average over all outcomes; the middle row is actual assigned starting resources. They are not pieces of one total. The unfunded average is computed separately in each state before probability weighting, so it can be positive even when the average total cost equals the reserve. It is not the amount of cash guaranteed to be needed.'},
  {id:'repeat-risk-shortfall-grid',type:'heatmap',title:'Recheck the reserve against both the annual assumption and the number of years',unit:'percent',unitLabel:'Probability that cumulative event cost exceeds the opening reserve (%)',compactValues:false,columns:['1 yr','5 yrs','10 yrs','20 yrs'],rows:[1,5,10,20].map(probability=>({label:probability+'% / yr',values:[1,5,10,20].map(years=>repeatRiskSnapshot(i,years,probability).shortfallProbability)})),note:'Rows replace the hypothetical annual event probability; columns replace the number of independent years. Only cost per event and the one unreplenished opening reserve stay selected. No cell is an observed incident rate, forecast or recommended reserve confidence level. Changing replenishment or dependence would require a different model.'}
 ]};
}
