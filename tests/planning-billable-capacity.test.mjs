import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {capacityAnnual} from '../src/planning-billable-capacity-models.js';
import {billableCapacityGuides} from '../src/planning-billable-capacity-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderFigure} from '../src/planning-charts.js';
const input=o=>({...defaults('billableCapacity'),...o}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('default capacity reconciles time, fees, business costs and a separate provision',()=>{
 const r=capacityAnnual(input());assert.deepEqual([r.weeks,r.workingHours,r.adminHours,r.billableHours,r.unavailableHours],[43,1720,430,1290,360]);
 assert.deepEqual([r.revenue,r.variable,r.businessRemainder,r.remaining],[129000,10320,106680,94680]);near(r.rateNeeded,104000/1186.8);
});
test('annual cash matches an independent formula and every template hour is accounted for',()=>{
 for(const p of [input(),input({capacityLeave:0,capacityDowntime:0,capacityAdmin:0}),input({capacityHours:17,capacityLeave:26,capacityDowntime:25,capacityAdmin:13.7,capacityRate:219.3,capacityVariable:34.5,capacityFixed:1234,capacityProvision:4321})]){
  const r=capacityAnnual(p);near(r.billableHours+r.adminHours+r.unavailableHours,52*p.capacityHours);
  near(r.remaining,(52-p.capacityLeave-p.capacityDowntime)*p.capacityHours*(1-p.capacityAdmin/100)*p.capacityRate*(1-p.capacityVariable/100)-p.capacityFixed-p.capacityProvision);
  near(r.remaining+r.variable+p.capacityFixed+p.capacityProvision,r.revenue);
 }
});
test('the solved rate produces the exact entered target at every positive-capacity boundary',()=>{
 for(const o of [{},{capacityHours:1,capacityLeave:26,capacityDowntime:25,capacityAdmin:99,capacityVariable:80,capacityTarget:250000},{capacityTarget:0,capacityFixed:0,capacityProvision:0},{capacityRate:0}]){
  const p=input(o),r=capacityAnnual(p);near(capacityAnnual(p,{capacityRate:r.rateNeeded}).remaining,p.capacityTarget);
 }
});
test('zero billable capacity keeps fixed obligations and reports no finite price solution',()=>{
 for(const o of [{capacityAdmin:100},{capacityLeave:26,capacityDowntime:26}]){
  const p=input(o),r=capacityAnnual(p);assert.equal(r.billableHours,0);assert.equal(r.revenue,0);assert.equal(r.remaining,-24000);assert.equal(r.rateNeeded,null);
  assert.equal(capacityAnnual(p,{capacityRate:300}).remaining,r.remaining);assert.equal(planningResult('billableCapacity',p).metrics[2][3],'No billable hours');
 }
});
test('more non-overlapping downtime or unpaid work cannot raise remaining cash',()=>{
 const p=input();let prior=Infinity;
 for(let admin=0;admin<=100;admin++){const r=capacityAnnual(p,{capacityAdmin:admin});assert.ok(r.remaining<=prior);prior=r.remaining;}
 prior=Infinity;for(let weeks=0;weeks<=26;weeks++){const r=capacityAnnual(p,{capacityDowntime:weeks});assert.ok(r.remaining<=prior);prior=r.remaining;}
});
test('personal provision changes cash once while leaving revenue and business remainder unchanged',()=>{
 const p=input(),a=capacityAnnual(p),b=capacityAnnual(p,{capacityProvision:22000});assert.equal(a.revenue,b.revenue);assert.equal(a.businessRemainder,b.businessRemainder);assert.equal(a.remaining-b.remaining,10000);
 assert.equal(capacityAnnual(p,{capacityTarget:180000}).remaining,a.remaining);
});
test('each rate and unpaid-share cell is reconciled to a separate capacity case',()=>{
 const p=input(),r=planningResult('billableCapacity'),matrix=r.charts[3];assert.deepEqual(matrix.columns,['$50','$75','$100','$125','$150']);
 matrix.rows.forEach((row,n)=>row.values.forEach((value,k)=>near(value,capacityAnnual(p,{capacityAdmin:n*25,capacityRate:50+k*25}).remaining)));
 assert.deepEqual(planningResult('billableCapacity',input({capacityRate:0})).charts[3].columns,['$0','$25','$50']);
});
test('every field boundary produces finite accessible charts and signed funding gaps',()=>{
 const cases=definitions.billableCapacity.fields.flatMap(([key,,,min,max])=>[input({[key]:min}),input({[key]:max})]);
 for(const p of cases){assert.ok(validInputs('billableCapacity',p));const r=planningResult('billableCapacity',p);assert.equal(r.charts.length,4);assert.match(r.note,/before personal income tax/);
  for(const chart of r.charts){const html=renderFigure(chart,300);assert.match(html,/View chart data/);assert.match(html,/role="img"/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);}
 }
});
test('capacity weeks and weekly hours require supported whole values',()=>{
 for(const key of ['capacityHours','capacityLeave','capacityDowntime'])for(const value of [1.5,100,NaN]){const p=input({[key]:value});assert.equal(validInputs('billableCapacity',p),false);assert.throws(()=>planningResult('billableCapacity',p));}
});
test('the substantive guide has existing related routes and no salary or status determination',()=>{
 const g=billableCapacityGuides[0];assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>=700);g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug),slug));assert.match(g.chartScope,/does not classify a worker/);assert.equal(g.sources.length,2);
});
