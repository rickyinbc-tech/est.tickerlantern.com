import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {independentEventCounts,repeatRiskSnapshot} from '../src/planning-repeat-risk-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('independent enumeration of all binary paths matches count probabilities for short horizons',()=>{
 for(let n=0;n<=8;n++)for(const p of [0,.01,.1,.5,1]){
  const enumerated=Array(n+1).fill(0);
  for(let mask=0;mask<2**n;mask++){let k=0,mass=1;for(let j=0;j<n;j++){const event=Boolean(mask&(1<<j));k+=Number(event);mass*=event?p:1-p;}enumerated[k]+=mass;}
  const actual=independentEventCounts(n,p);actual.forEach((v,k)=>near(v,enumerated[k]));near(actual.reduce((a,b)=>a+b,0),1);near(actual.reduce((sum,v,k)=>sum+k*v,0),n*p);
 }
});
test('default any-event and reserve-shortfall probabilities distinguish one event from two or more',()=>{
 const d=defaults('repeatRisk'),p=repeatRiskSnapshot(d);
 near(p.anyProbability,1-.9**10);near(p.anyProbability,.6513215599);
 near(p.shortfallProbability,1-.9**10-10*.1*.9**9);near(p.shortfallProbability,.2639010709);
 near(p.weightedCost,5000);near(p.weightedUnfunded,1743.3922005);near(p.weightedCovered,3256.6077995);near(p.weightedCost,p.weightedCovered+p.weightedUnfunded);
 assert.ok(p.weightedUnfunded>Math.max(0,p.weightedCost-d.repeatReserve));
});
test('funding uses a strict greater-than boundary and whole costs without redefining any-event probability',()=>{
 const d={...defaults('repeatRisk'),repeatYears:1},equal=repeatRiskSnapshot(d),short=repeatRiskSnapshot({...d,repeatReserve:4999});
 near(equal.anyProbability,.1);near(equal.shortfallProbability,0);near(equal.weightedUnfunded,0);
 near(short.anyProbability,.1);near(short.shortfallProbability,.1);near(short.weightedUnfunded,.1);
 const noReserve=repeatRiskSnapshot({...d,repeatReserve:0});near(noReserve.shortfallProbability,noReserve.anyProbability);near(noReserve.weightedUnfunded,noReserve.weightedCost);
 const zeroCost=repeatRiskSnapshot({...d,repeatCost:0,repeatReserve:0});near(zeroCost.anyProbability,.1);near(zeroCost.shortfallProbability,0);near(zeroCost.weightedCost,0);
});
test('expected aggregate cost is np times severity and added reserve cannot increase unfunded outcomes',()=>{
 const d=defaults('repeatRisk');
 for(const years of [1,5,10,30])for(const probability of [0,1,10,50]){
  const a=repeatRiskSnapshot(d,years,probability),b=repeatRiskSnapshot({...d,repeatReserve:15000},years,probability);
  near(a.weightedCost,years*probability/100*d.repeatCost);assert.ok(b.shortfallProbability<=a.shortfallProbability+1e-12);assert.ok(b.weightedUnfunded<=a.weightedUnfunded+1e-9);
  near(a.distribution.reduce((x,y)=>x+y,0),1);assert.ok(a.distribution.every(v=>v>=0));
 }
 const allFunded=repeatRiskSnapshot({...d,repeatReserve:d.repeatYears*d.repeatCost});near(allFunded.shortfallProbability,0);near(allFunded.weightedUnfunded,0);
});
test('display grouping retains all probability and never treats the tail as exactly five events',()=>{
 for(const years of [1,4,5,10,30]){
  const d={...defaults('repeatRisk'),repeatYears:years},p=repeatRiskSnapshot(d),r=planningResult('repeatRisk',d),bars=r.charts[1].rows;
  near(bars.reduce((s,b)=>s+b.value,0),1);assert.equal(bars.length,years<5?years+1:6);
  if(years>=5){assert.equal(bars.at(-1).label,'Five or more events · combined tail');near(bars.at(-1).value,p.distribution.slice(5).reduce((a,b)=>a+b,0));}
 }
 const d={...defaults('repeatRisk'),repeatYears:30,repeatProbability:50,repeatReserve:0},p=repeatRiskSnapshot(d),r=planningResult('repeatRisk',d);
 assert.ok(p.weightedCost>5*d.repeatCost*r.charts[1].rows.at(-1).value);
});
test('horizon curves and matrix replace only their labelled assumptions',()=>{
 const d=defaults('repeatRisk'),r=planningResult('repeatRisk',d);
 r.charts[0].series[1].rows.forEach(row=>near(row.value,repeatRiskSnapshot(d,row.x).shortfallProbability));
 [1,5,10,20].forEach((probability,j)=>[1,5,10,20].forEach((years,k)=>near(r.charts[3].rows[j].values[k],repeatRiskSnapshot(d,years,probability).shortfallProbability)));
 assert.deepEqual(r.charts[3],planningResult('repeatRisk',{...d,repeatProbability:50,repeatYears:30}).charts[3]);
 const scaled=repeatRiskSnapshot({...d,repeatCost:d.repeatCost*2,repeatReserve:d.repeatReserve*2}),p=repeatRiskSnapshot(d);near(scaled.shortfallProbability,p.shortfallProbability);near(scaled.weightedUnfunded,2*p.weightedUnfunded);
});
test('whole periods/currency and supported boundaries render four finite accessible figures/tables',()=>{
 const d=defaults('repeatRisk'),fields=definitions.repeatRisk.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('repeatRisk',i));const r=planningResult('repeatRisk',i);finite(r);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 for(const key of ['repeatYears','repeatCost','repeatReserve'])assert.equal(validInputs('repeatRisk',{...d,[key]:1.5}),false);
});
