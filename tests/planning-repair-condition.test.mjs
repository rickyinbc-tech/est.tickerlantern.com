import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {repairConditionPlan} from '../src/planning-repair-condition-models.js';
import {repairConditionSource,repairConditionHistory,repairConditionTenure} from '../src/planning-repair-condition-data.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const kind='repairConditionPlanning';
test('the quoted bill is exactly funded while the default cost stress leaves a 2400 gap',()=>{
 const d=defaults(kind),p=repairConditionPlan(d),base=repairConditionPlan(d,0);assert.equal(p.bill,14400);assert.equal(p.extra,2400);assert.equal(p.requiredMonthly,1900);assert.equal(p.contributions,9000);assert.equal(p.ending,-2400);assert.equal(p.gap,2400);assert.equal(base.ending,0);assert.equal(base.gap,0);assert.deepEqual(p.rows.map(r=>r.value),[3000,4500,6000,7500,9000,10500,-2400]);
 assert.deepEqual(p.rows.slice(0,-1),base.rows.slice(0,-1));
});
test('the complete bill is paid once after the due month contribution and cash reconciles in cents',()=>{
 const d=defaults(kind);for(const repairConditionMonths of [1,3,6,24])for(const repairConditionQuote of [0,12000,100000])for(const repairConditionReserve of [0,3000,100000])for(const repairConditionMonthly of [0,1500,10000])for(const repairConditionStress of [0,20,50]){
  const input={...d,repairConditionMonths,repairConditionQuote,repairConditionReserve,repairConditionMonthly,repairConditionStress},p=repairConditionPlan(input);assert.equal(p.ending,repairConditionReserve+repairConditionMonths*repairConditionMonthly-p.bill);assert.equal(p.gap,Math.max(0,-p.ending));assert.equal(p.rows.length,repairConditionMonths+1);
  assert.equal(p.rows.at(-2).value,repairConditionReserve+(repairConditionMonths-1)*repairConditionMonthly);assert.equal(p.rows.at(-1).value-p.rows.at(-2).value,repairConditionMonthly-p.bill);
 }
});
test('required saving rounds upward to cents, and excess opening cash remains available',()=>{
 const d=defaults(kind),fraction=repairConditionPlan({...d,repairConditionQuote:100,repairConditionStress:0,repairConditionReserve:0,repairConditionMonths:3});assert.equal(fraction.requiredMonthly,33.34);
 const funded=repairConditionPlan({...d,repairConditionQuote:100,repairConditionStress:0,repairConditionReserve:500,repairConditionMonthly:0,repairConditionMonths:3});assert.equal(funded.requiredMonthly,0);assert.equal(funded.ending,400);assert.equal(funded.gap,0);
 const cents=repairConditionPlan({...d,repairConditionQuote:100.01,repairConditionReserve:10.02,repairConditionStress:10,repairConditionMonths:6});assert.equal(cents.bill,110.01);assert.equal(cents.extra,10);assert.equal(cents.requiredMonthly,16.67);
});
test('official source charts remain fixed while the independent quote and saving inputs change',()=>{
 const d=defaults(kind),r=planningResult(kind),other=planningResult(kind,{...d,repairConditionQuote:100000,repairConditionReserve:0,repairConditionMonthly:0,repairConditionMonths:1});assert.deepEqual(r.charts.slice(0,2),other.charts.slice(0,2));assert.notDeepEqual(r.metrics,other.metrics);assert.ok(r.charts.slice(0,2).every(c=>c.evidence.startsWith('Official')));assert.ok(r.charts.slice(2).every(c=>c.evidence==='Hypothetical scenario'));
});
test('the reviewed survey extract preserves irregular years, household denominators and asymmetric intervals',()=>{
 assert.equal(repairConditionSource.table,'46-10-0081-01');assert.equal(repairConditionSource.geography,'Canada (provinces only)');assert.equal(repairConditionSource.unit,'Percentage of households');assert.equal(repairConditionSource.latestMajorRepairHouseholds,1167100);assert.deepEqual(repairConditionHistory.map(r=>r.year),[2018,2021,2022,2024]);assert.deepEqual(repairConditionHistory.map(r=>r.value),[7,7.4,7.3,7.1]);assert.deepEqual(repairConditionTenure.map(r=>[r.value,r.lower,r.upper]),[[7.1,6.6,7.7],[6.5,5.8,7.3],[8.4,7.6,9.2]]);assert.equal(repairConditionTenure[0].vectors.value,'v1594709369');assert.ok(repairConditionTenure.every(r=>r.status===''));
 const c=repairConditionSource.latestConditions;assert.ok(Math.abs(c['Regular maintenance needed']+c['Minor repairs needed']+c['Major repairs needed']-100.1)<1e-9);
 const r=planningResult(kind);assert.equal(r.charts[0].xMin,2018);assert.deepEqual(r.charts[0].xTicks.map(t=>t.value),[2018,2021,2022,2024]);assert.equal(r.charts[1].type,'intervalbar');for(const p of r.charts[1].rows)assert.ok(p.lower<p.value&&p.value<p.upper);
});
test('the required-saving grid replaces the deadline and price stress while the entered saving stays separate',()=>{
 const d=defaults(kind),r=planningResult(kind);for(let i=0;i<4;i++)for(let j=0;j<4;j++)assert.equal(r.charts[4].rows[i].values[j],repairConditionPlan({...d,repairConditionMonths:[3,6,12,24][i]},[0,10,20,30][j]).requiredMonthly);
 assert.deepEqual(r.charts[4].rows.map(r=>r.values[2]),[3800,1900,950,475]);assert.deepEqual(r.charts[4],planningResult(kind,{...d,repairConditionMonthly:0,repairConditionMonths:24,repairConditionStress:50}).charts[4]);assert.equal(r.charts[2].rows.reduce((s,p)=>s+p.value,0),14400);
});
test('the new guide preserves assessment, rounding, payer and timing boundaries with valid related routes',()=>{
 const matches=planningGuides.filter(g=>g.planning===kind);assert.equal(matches.length,1);const g=matches[0],text=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,8);assert.match(text,/provinces only/);assert.match(text,/100\.1%/);assert.match(text,/Desirable remodeling/);assert.match(text,/not a range/);assert.match(text,/simultaneously counted/);assert.match(text,/CAD 1,900/);assert.match(text,/6\.6%–7\.7%/);for(const slug of g.related)assert.ok(planningGuides.some(p=>p.slug===slug),slug);
});
test('whole positive payment months and input bounds are enforced before producing any chart',()=>{
 const d=defaults(kind);for(const repairConditionMonths of [0,1.5,25,NaN])assert.throws(()=>planningResult(kind,{...d,repairConditionMonths}));assert.throws(()=>planningResult(kind,{...d,repairConditionStress:-1}));
});
test('zero quote, fully funded and unfunded boundary cases render five finite accessible figures',()=>{
 const d=defaults(kind),fields=definitions[kind].fields,cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi])),{...d,repairConditionQuote:0,repairConditionReserve:0,repairConditionMonthly:0}];
 for(const input of cases)for(const width of [300,760]){const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);assert.match(html,/95% CI/);}
});
