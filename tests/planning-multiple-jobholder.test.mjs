import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {multipleJobholderTally} from '../src/planning-multiple-jobholder-models.js';
import {multipleJobholderGuides} from '../src/planning-multiple-jobholder-guides.js';
import {multipleJobholderAnnualSource,multipleJobholderMonthlySource} from '../src/planning-multiple-jobholder-data.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('the four-person tally keeps people, groups and positions consistent for every assignment',()=>{
 for(let a=0;a<=3;a++)for(let b=0;b<=3;b++)for(let c=0;c<=3;c++)for(let d=0;d<=3;d++){
  const jobs=[a,b,c,d],p=multipleJobholderTally({mjbJobsA:a,mjbJobsB:b,mjbJobsC:c,mjbJobsD:d});
  assert.deepEqual(p.jobs,jobs);assert.equal(p.people,4);
  assert.equal(p.jobholding,jobs.filter(j=>j>0).length);
  assert.equal(p.multiple,jobs.filter(j=>j>=2).length);
  assert.equal(p.one,jobs.filter(j=>j===1).length);
  assert.equal(p.none,jobs.filter(j=>j===0).length);
  assert.equal(p.positions,jobs.reduce((t,j)=>t+j,0));
  assert.equal(p.one+p.multiple+p.none,4);
  assert.equal(p.shareAll,p.multiple/4);
  if(p.jobholding){near(p.shareJobholders,p.multiple/p.jobholding);}else{assert.equal(p.shareJobholders,null);}
 }
});

test('the default tally reproduces the source fixture and the six-to-seven position example',()=>{
 const d=defaults('multipleJobholders'),p=multipleJobholderTally(d);
 assert.deepEqual(p.jobs,[2,1,3,0]);
 assert.equal(p.jobholding,3);assert.equal(p.multiple,2);assert.equal(p.one,1);assert.equal(p.none,1);
 assert.equal(p.positions,6);near(p.shareJobholders,2/3);near(p.shareAll,1/2);
 const plusA=p.scenarios[1];assert.equal(plusA.positions,7);assert.equal(plusA.jobholding,3);assert.equal(plusA.multiple,2);near(plusA.shareJobholders,2/3);
 const plusD=p.scenarios[2];assert.equal(plusD.positions,7);assert.equal(plusD.jobholding,4);assert.equal(plusD.multiple,2);near(plusD.shareJobholders,1/2);
 const noJobs=multipleJobholderTally({mjbJobsA:0,mjbJobsB:0,mjbJobsC:0,mjbJobsD:0});
 assert.equal(noJobs.jobholding,0);assert.equal(noJobs.shareJobholders,null);assert.equal(noJobs.shareAll,0);assert.equal(noJobs.positions,0);
});

test('official series retain the reviewed observations, units and release dates without derived job totals',()=>{
 assert.deepEqual(multipleJobholderAnnualSource.rows.map(r=>r.persons),[1006.8,1046.4,1077.0,1108.2,810.4,966.4,1086.7,1136.8,1156.1,1178.6]);
 assert.equal(multipleJobholderAnnualSource.released,'2026-01-09');assert.equal(multipleJobholderAnnualSource.latestPeriod,'2025');assert.equal(multipleJobholderAnnualSource.vector,'v2342653');
 assert.deepEqual(multipleJobholderMonthlySource.rows.map(r=>r.persons),[1156.1,1224.0,1218.9,1118.9,1209.4,1234.8,1210.3,1217.4,1231.7,1233.4,1203.2,1240.8]);
 assert.equal(multipleJobholderMonthlySource.adjustment,'Unadjusted for seasonality');assert.equal(multipleJobholderMonthlySource.latestPeriod,'2026-09');assert.equal(multipleJobholderMonthlySource.vector,'v3834095');
 const published2025=[1174.7,1244.8,1198.7,1182.9,1174.9,1201.1,1154.5,1088.3,1124.9,1156.1,1224.0,1218.9];
 const mean=published2025.reduce((s,v)=>s+v,0)/12;
 near(mean,1178.65);assert.notEqual(mean,1178.6);assert.equal(multipleJobholderAnnualSource.rows.at(-1).persons,1178.6);
});

test('guide prose is long enough, links only live companions and renders finite accessible charts',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of multipleJobholderGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);
  assert.ok(g.related.every(s=>slugs.has(s)));assert.ok(g.sources.every(s=>s.url.startsWith('https://')));
  const d=defaults(g.planning),fields=definitions[g.planning].fields;
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max])),{mjbJobsA:0,mjbJobsB:0,mjbJobsC:0,mjbJobsD:0},{mjbJobsA:3,mjbJobsB:3,mjbJobsC:3,mjbJobsD:3}];
  for(const input of inputs){
   assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);
   assert.equal(result.charts.length,6);
   assert.ok(result.charts[0].source&&result.charts[1].source);
   assert.ok(result.charts.slice(2).every(c=>!c.source));
   assert.equal(result.charts[0].series[0].rows.length,10);assert.equal(result.charts[1].series[0].rows.length,12);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,6);assert.equal((html.match(/<caption>/g)||[]).length,6);}
  }
 }
 assert.equal(validInputs('multipleJobholders',{...defaults('multipleJobholders'),mjbJobsA:1.5}),false);
 assert.equal(validInputs('multipleJobholders',{...defaults('multipleJobholders'),mjbJobsA:4}),false);
});
