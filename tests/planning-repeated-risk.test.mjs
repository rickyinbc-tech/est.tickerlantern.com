import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {independentEventProbabilities,eventCostQuantile,repeatedRiskLedger} from '../src/planning-repeated-risk-models.js';
import {renderResult} from '../src/planning-charts.js';
const kind='repeatedRisk',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('default independent distribution separates any event, expected cost and funded cumulative costs',()=>{
  const p=repeatedRiskLedger(defaults(kind));near(p.any,.40951);near(p.expected,1500);near(p.coverage,.91854);
  near(p.probabilities[0],.59049);near(p.probabilities[1],.32805);near(p.probabilities.slice(2).reduce((a,b)=>a+b),.08146);
  near(p.q90,3000);near(p.q95,6000);near(p.maximum,15000);near(p.linked95,15000);
  near(repeatedRiskLedger({...defaults(kind),eventCashReserve:1500}).coverage,.59049);
});
test('convolution matches an independent combinatorial formula and the first two count moments',()=>{
  const choose=(n,k)=>{let c=1;for(let j=1;j<=k;j++)c=c*(n-j+1)/j;return c;};
  for(const n of [1,5,10,20])for(const p of [0,.01,.1,.5,.9,1]){
    const probabilities=independentEventProbabilities(n,p),mean=probabilities.reduce((a,v,k)=>a+k*v,0);
    near(probabilities.reduce((a,b)=>a+b),1);near(mean,n*p);
    near(probabilities.reduce((a,v,k)=>a+(k-mean)**2*v,0),n*p*(1-p));
    probabilities.forEach((v,k)=>near(v,choose(n,k)*p**k*(1-p)**(n-k)));
  }
});
test('discrete quantiles give at least their threshold and the prior cost is below it',()=>{
  for(const n of [1,5,20])for(const p of [.01,.1,.5,.99])for(const q of [.9,.95]){
    const probabilities=independentEventProbabilities(n,p),cost=eventCostQuantile(probabilities,3000,q),k=cost/3000;
    assert.ok(probabilities.slice(0,k+1).reduce((a,b)=>a+b,0)>=q-1e-12);
    if(k)assert.ok(probabilities.slice(0,k).reduce((a,b)=>a+b,0)<q+1e-12);
  }
  near(eventCostQuantile([.95,.05],3000,.95),0);
});
test('zero probability, certain events, zero severity and full coverage retain distinct meanings',()=>{
  const base=defaults(kind),none=repeatedRiskLedger({...base,annualEventChance:0,eventCashReserve:0});
  near(none.any,0);near(none.expected,0);near(none.coverage,1);near(none.q95,0);
  const certain=repeatedRiskLedger({...base,annualEventChance:100});near(certain.any,1);near(certain.coverage,0);near(certain.q95,15000);
  const free=repeatedRiskLedger({...base,eventCashCost:0,eventCashReserve:0});near(free.any,.40951);near(free.coverage,1);near(free.q95,0);
  near(repeatedRiskLedger({...base,eventCashReserve:15000}).coverage,1);
});
test('display aggregation preserves probability and the two-axis matrix ignores selected window and chance',()=>{
  const base=defaults(kind),result=planningResult(kind,{...base,eventYears:20}),bins=result.charts[1].rows;
  assert.equal(bins.length,6);near(bins.reduce((a,r)=>a+r.value,0),1);assert.match(bins.at(-1).label,/5–20/);
  assert.deepEqual(result.charts[3],planningResult(kind,{...base,eventYears:1,annualEventChance:99}).charts[3]);
  near(result.charts[3].rows[2].values[1],.40951);
  const curve=planningResult(kind,base).charts[0];near(curve.series[0].rows[20].value,.8784233454094307);
  near(curve.series[1].rows[20].value,.1);assert.deepEqual(curve.series[2].rows,[{x:5,value:.40950999999999993}]);
});
test('supported extremes render five accessible charts and fractional years are rejected',()=>{
  const base=defaults(kind),fields=definitions[kind].fields;
  const cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
  for(const input of cases){assert.ok(validInputs(kind,input));for(const width of [300,760]){
    const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
    assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);
  }}
  assert.equal(validInputs(kind,{...base,eventYears:3.5}),false);assert.equal(validInputs(kind,{...base,annualEventChance:101}),false);
});
