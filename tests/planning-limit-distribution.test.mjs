import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults,definitions} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {tfsaLimits,tfsaFactors,tfsaLimitPath,tfsaLimitReaches,roundTo500,preDistributionPlan} from '../src/planning-limit-distribution-models.js';

const near=(a,b,tol=.005)=>assert.ok(Math.abs(a-b)<tol,`${a} vs ${b}`);

test('indexation rule reproduces every CRA TFSA limit from 2016 to 2026',()=>{
 const rows=tfsaLimitPath({tlInflation:2,tlHorizon:14});
 for(const r of rows.filter(r=>r.year>=2016&&r.year<=2026))assert.equal(roundTo500(r.indexed),tfsaLimits[r.year],String(r.year));
 assert.equal(Object.values(tfsaLimits).reduce((a,b)=>a+b,0),109000);
 assert.deepEqual([2023,2024,2025,2026].map(y=>tfsaFactors[y]),[.063,.047,.027,.02]);
 near(rows.find(r=>r.year===2026).indexed,7184.917074);near(rows.find(r=>r.year===2027).indexed,7371.722818);
 assert.equal(roundTo500(6250),6500);assert.equal(roundTo500(6249.99),6000);
});
test('TFSA defaults and projection steps',()=>{
 const d=defaults('tfsaLimitIndex'),r=planningResult('tfsaLimitIndex',d);
 assert.equal(r.metrics[0][1],109000);near(r.metrics[1][1],138616.918950,.001);assert.equal(r.metrics[4][1],7500);
 assert.equal(r.metrics[5][1],9500);assert.equal(r.metrics[6][1],118000);
 assert.equal(planningResult('tfsaLimitIndex',{...d,tlAge:29}).metrics[0][1],78000);
 assert.equal(tfsaLimitReaches(8000,2),2030);assert.equal(tfsaLimitReaches(10000,2),2042);assert.equal(tfsaLimitReaches(10000,1),2056);assert.equal(tfsaLimitReaches(8000,0),null);
 assert.equal(r.charts.length,4);
});
test('pre-distribution defaults match 40-digit Decimal arithmetic',()=>{
 const p=preDistributionPlan(defaults('preDistribution'));
 near(p.D,1600);near(p.taxNow,296.5);near(p.taxGain,177.9);near(p.taxIncome,118.6);near(p.saleSaving,237.2);
 near(p.end.cost,142.345067354);near(p.end.costToday,111.199739111);near(p.growthForgone,83.045067354);near(p.rows[0].cost,59.3);
 // Same units either way: the early buyer's after-tax position trails by exactly the net cost
 for(const r of p.rows)near(r.after-r.before,r.cost,1e-6);
 const allGains=preDistributionPlan({...defaults('preDistribution'),pdGainShare:100,pdCash:0});
 near(allGains.end.cost,0,1e-9);
});
test('random valid inputs render finite charts',()=>{
 let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(const kind of ['tfsaLimitIndex','preDistribution']){
  const def=defaults(kind);
  for(let n=0;n<400;n++){
   const input={...def};
   for(const [key,,,min,max,step] of definitions[kind].fields){const k=Math.round((min+rnd()*(max-min))/step)*step;input[key]=Math.min(max,Math.max(min,+k.toFixed(6)));}
   assert.ok(validInputs(kind,input),JSON.stringify(input));
   const r=planningResult(kind,input);
   for(const m of r.metrics)assert.ok(m[3]||Number.isFinite(m[1]),m[0]);
   assert.doesNotThrow(()=>renderResult(r,720));
  }
 }
});
test('guides are registered with four charts each',()=>{
 for(const slug of ['tfsa-dollar-limit-inflation-indexation-500-rounding-real-room','buying-fund-before-year-end-distribution-non-registered-tax-cost']){
  const g=planningGuides.find(x=>x.slug===slug);assert.ok(g,slug);assert.equal(planningResult(g.planning,defaults(g.planning)).charts.length,4);
  for(const rel of g.related)assert.ok(planningGuides.some(x=>x.slug===rel),rel);
 }
});
