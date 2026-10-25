import test from 'node:test';
import assert from 'node:assert/strict';
import {assetResilienceData as data} from '../src/planning-asset-resilience-data.js';
import {assetBufferTargets} from '../src/planning-asset-resilience-models.js';
import {assetResilienceGuides} from '../src/planning-asset-resilience-guides.js';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('asset resilience retains the six independent hub control totals and supplied 2023 intervals',()=>{
 assert.equal(data.table,'11-10-0082-01');assert.equal(data.latestReferenceYear,2023);assert.equal(data.released,'2024-10-29');
 assert.deepEqual(data.trend.map(r=>r.year),[1999,2005,2012,2016,2019,2023]);
 assert.deepEqual(data.trend.map(r=>Number((r.value*100).toFixed(1))),[63.6,65.1,65.3,66.6,67.1,71.4]);
 const selected=data.duration.find(r=>r.months===3&&r.measure==='lim');near(selected.value,.714);near(selected.lower,.702);near(selected.upper,.727);
 const income=data.duration.find(r=>r.months===3&&r.measure==='income');near(income.value,.636);near(income.lower,.624);near(income.upper,.650);
 assert.match(data.scope,/ten Canadian provinces/);assert.match(data.scope,/excludes the three territories/);assert.match(data.downloadSHA256,/^[a-f0-9]{64}$/);
});
test('public source snapshot preserves source precision units vectors flags and complete unique grains',()=>{
 assert.equal(data.trend.length,6);assert.equal(data.duration.length,6);
 for(const group of [data.trend,data.duration])assert.equal(new Set(group.map(r=>[r.year,r.measure,r.months].join('|'))).size,group.length);
 for(const r of [...data.trend,...data.duration]){
  assert.ok(0<=r.lower&&r.lower<=r.value&&r.value<=r.upper&&r.upper<=1);assert.equal(r.observations.length,3);
  for(const o of r.observations){assert.equal(o.UOM,'Percent');assert.equal(o.SCALAR_FACTOR,'units');assert.equal(o.STATUS,'');assert.equal(o.DECIMALS,'1');assert.match(o.VECTOR,/^v\d+$/);assert.match(o.VALUE,/^\d+\.\d$/);}
  near(r.value,Number(r.observations[0].VALUE)/100);near(r.lower,Number(r.observations[1].VALUE)/100);near(r.upper,Number(r.observations[2].VALUE)/100);
 }
 for(const measure of ['lim','income']){
  const points=data.duration.filter(r=>r.measure===measure);assert.ok(points[0].value>=points[1].value&&points[1].value>=points[2].value);
 }
});
test('one hypothetical cash balance produces three different dollar targets without allocating it three times',()=>{
 const d=defaults('assetBufferDefinition'),p=assetBufferTargets(d);
 assert.equal(p.benchmark,7500);assert.equal(p.income,18000);assert.equal(p.expenses,13500);assert.equal(p.extraCash,3500);near(p.runway,20/9);
 const r=planningResult('assetBufferDefinition',d),targets=r.charts[2].rows;
 assert.deepEqual(targets.map(x=>x.values),[[7500,10000],[18000,10000],[13500,10000]]);
 assert.equal(r.charts[3].rows[1].values[2],17000);assert.equal(r.charts[3].rows[2].values[2],26000);
});
test('personal inputs leave source observations unchanged and expense shortfalls cannot be negative',()=>{
 const d=defaults('assetBufferDefinition'),a=planningResult('assetBufferDefinition',d),b=planningResult('assetBufferDefinition',{...d,bufferMonths:12,accessibleCash:500000,annualBenchmark:0,annualNetIncome:0,monthlyEssentials:0});
 assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));assert.notDeepEqual(a.charts[2],b.charts[2]);
 const zero=assetBufferTargets({...d,monthlyEssentials:0});assert.equal(zero.expenses,0);assert.equal(zero.extraCash,0);assert.equal(zero.runway,null);
 assert.equal(assetBufferTargets({...d,accessibleCash:20000}).extraCash,0);
 assert.equal(assetBufferTargets({...d,accessibleCash:0}).extraCash,13500);
 assert.ok(b.charts[3].rows.every(row=>row.values.every(v=>v===0)));
});
test('reserve definitions have complete English prose source boundaries and valid related links',()=>{
 const guide=assetResilienceGuides[0];assert.equal(guide.sections.length,6);
 assert.ok(guide.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);
 for(const slug of guide.related)assert.ok(planningGuides.some(g=>g.slug===slug),slug);
 assert.match(guide.chartScope,/published 95% confidence/);assert.match(guide.sections.map(s=>s.html).join(' '),/not a current official LIM/);
 assert.equal(validInputs('assetBufferDefinition',{...defaults('assetBufferDefinition'),bufferMonths:3.5}),false);
});
test('supported buffer edges render accessible official intervals and hypothetical tables without invalid results',()=>{
 const kind='assetBufferDefinition',d=defaults(kind),fields=definitions[kind].fields;
 for(const input of [d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}])]){
  const result=planningResult(kind,input);
  for(const width of [300,760]){
   const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
   assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/95% CI lower/);assert.match(html,/95% CI upper/);
  }
 }
});
