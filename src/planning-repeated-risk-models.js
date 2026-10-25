export const repeatedRiskDefinitions={repeatedRisk:{title:'Test a fixed annual event chance across several years',fields:[
  ['eventYears','Years in the hypothetical window',5,1,20,1],
  ['annualEventChance','Assumed event chance in each year (%)',10,0,100,1],
  ['eventCashCost','Fixed cash cost per event (CAD)',3000,0,100000,100],
  ['eventCashReserve','Cash available at the start, with no replenishment (CAD)',3000,0,2000000,100]
]}};
export function independentEventProbabilities(years,p){
  let probabilities=[1];
  for(let year=0;year<years;year++){
    const next=Array(probabilities.length+1).fill(0);
    probabilities.forEach((probability,k)=>{next[k]+=probability*(1-p);next[k+1]+=probability*p;});
    probabilities=next;
  }
  return probabilities;
}
export function eventCostQuantile(probabilities,cost,q){
  let cumulative=0;
  for(let k=0;k<probabilities.length;k++){cumulative+=probabilities[k];if(cumulative+1e-12>=q)return k*cost;}
  return (probabilities.length-1)*cost;
}
export function repeatedRiskLedger(input){
  const n=input.eventYears,p=input.annualEventChance/100,cost=input.eventCashCost,probabilities=independentEventProbabilities(n,p);
  const coverage=Math.min(1,probabilities.reduce((sum,probability,k)=>sum+(k*cost<=input.eventCashReserve?probability:0),0));
  const linked=Array(n+1).fill(0);linked[0]=1-p;linked[n]=p;
  return {n,p,cost,probabilities,any:1-(1-p)**n,expected:n*p*cost,coverage,q90:eventCostQuantile(probabilities,cost,.90),q95:eventCostQuantile(probabilities,cost,.95),maximum:n*cost,linked95:eventCostQuantile(linked,cost,.95)};
}
export function repeatedRiskResult(kind,input){
  if(kind!=='repeatedRisk')throw Error('Unknown repeated-risk topic.');
  const p=repeatedRiskLedger(input),bins=p.probabilities.slice(0,5).map((value,k)=>({label:k+' event'+(k===1?'':'s'),value}));
  if(p.n>=5)bins.push({label:p.n===5?'5 events':'5–'+p.n+' events combined',value:p.probabilities.slice(5).reduce((a,b)=>a+b,0)});
  return {metrics:[['Chance of at least one event in the selected window: independent years',p.any,'percent'],['Expected cumulative cash cost: a probability-weighted average',p.expected,'money'],['Chance the selected starting reserve covers all modeled costs',p.coverage,'percent']],note:'Original hypothetical probability model, not an observed loss rate, insurance quote or recommended reserve. Each year has at most one event, the same independently chosen marginal event probability and the same cash cost. The main distribution assumes statistical independence across years. All cash is available at the start, and event costs only reduce it: no saving, replenishment, interest, inflation, income interruption, borrowing or insurance recovery is included. Reserve coverage means total modeled cost is at most the entered cash balance. The separate fully linked stress has either no events or an event in every year, with the same annual marginal probability. Neither dependence structure is estimated from evidence.',charts:[
    {id:'repeated-risk-any-event',type:'line',title:'A multi-year chance is not the annual percentage multiplied by the years',unit:'percent',unitLabel:'Probability of one or more events under the stated dependence assumption',xLabel:'Years in the window',series:[{name:'Independent years: 1 − (1 − p)^years',rows:Array.from({length:21},(_,years)=>({x:years,value:1-(1-p.p)**years}))},{name:'Fully linked stress: all years share one event indicator',dash:true,rows:Array.from({length:21},(_,years)=>({x:years,value:years?p.p:0}))},{name:'Selected independent window · gold point',rows:[{x:p.n,value:p.any}]}],note:'Both scenarios give each individual year the same entered event probability. Under independence, the chance of no event is (1 − p)^years. In the fully linked stress, a single hypothetical indicator determines every year, so the chance of at least one event equals p for any positive horizon. The curve compares windows, not a forecast path or the chance conditional on earlier events.'},
    {id:'repeated-risk-count-distribution',type:'bar',title:'An event count distribution keeps zero, one and repeated events separate',unit:'percent',unitLabel:'Probability of the event-count category · independent years',rows:bins,note:'The probabilities sum to 100%. Each event costs the selected fixed amount. For windows longer than five years, the final bar combines all counts from five through the selected maximum; it does not assign one fixed cost to that combined category. Calculations of coverage and quantiles use every individual count before any display aggregation.'},
    {id:'repeated-risk-cost-thresholds',type:'bar',title:'The expected cost and a cost percentile answer different cash questions',unit:'money',rows:[{label:'Expected cumulative cost',value:p.expected},{label:'90th-percentile cumulative cost',value:p.q90},{label:'95th-percentile cumulative cost',value:p.q95},{label:'Maximum within this bounded model',value:p.maximum}],note:'A qth-percentile cost is the smallest possible modeled cost with cumulative probability at least q. The step-shaped count distribution can give more than exactly 90% or 95% coverage at that amount. The expected cost averages all outcomes and need not equal any possible bill. The maximum is limited by one fixed-cost event per year; it is not a bound on actual household emergencies.'},
    {id:'repeated-risk-horizon-matrix',type:'heatmap',title:'Change the annual chance and the horizon without treating either as observed data',unit:'percent',unitLabel:'Independent-year probability of at least one event',columns:['1 year','5 years','10 years','20 years'],rows:[1,5,10,20].map(chance=>({label:chance+'% / yr',values:[1,5,10,20].map(years=>1-(1-chance/100)**years)})),note:'Rows replace the annual event probability and columns replace the horizon. Cells equal 1 − (1 − p)^years and are bounded between zero and 100%. This grid replaces both selected probability inputs. It does not estimate the frequency of repairs, claims, job loss or medical expenses.'},
    {id:'repeated-risk-dependence-tail',type:'bar',title:'The same annual probability and expected cost can produce different tail costs',unit:'money',rows:[{label:'95th-percentile cost: independent years',value:p.q95},{label:'95th-percentile cost: fully linked years',value:p.linked95}],note:'In the fully linked stress there are zero events with probability 1 − p and exactly one event in every year with probability p. Each year still has marginal probability p, and expected total cost remains years × p × cost. Dependence changes the distribution. Either percentile can equal zero at sufficiently low event probability; that is not a recommendation to hold no reserve. This all-or-none illustration is not an estimate of actual clustering.'}
  ]};
}
