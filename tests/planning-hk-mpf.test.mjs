import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {hkMpfContribution,hkMpfRules} from '../src/planning-hk-mpf-models.js';
import {hkMpfGuides} from '../src/planning-hk-mpf-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {format,renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('employee and employer contributions follow the published monthly-income boundaries',()=>{
 const cases=[
  [0,0,0],[1,0,.05],[7099,0,354.95],[7100,355,355],[20000,1000,1000],[30000,1500,1500],[30001,1500,1500],[40000,1500,1500],[100000,1500,1500]
 ];
 for(const [income,employee,employer] of cases){
  const p=hkMpfContribution(income);
  near(p.employee,employee);near(p.employer,employer);near(p.total,employee+employer);near(p.afterEmployee,income-employee);
 }
 for(let income=0;income<=100000;income+=250){
  const p=hkMpfContribution(income);
  near(p.employer,Math.min(income,30000)*.05);
  assert.equal(p.employee,income<7100?0:p.employer);
  assert.ok(p.employee<=1500&&p.employer<=1500&&p.afterEmployee>=0);
 }
 assert.equal(hkMpfRules.rate,.05);assert.equal(hkMpfRules.minimumMonthly,7100);assert.equal(hkMpfRules.maximumMonthly,30000);assert.equal(hkMpfRules.maximumEach,1500);
});

test('the default result separates the payroll deduction from employer funding and cumulative balances',()=>{
 const d=defaults('hkMpf'),p=hkMpfContribution(d.mpfRelevantIncome),r=planningResult('hkMpf',d);
 assert.deepEqual(d,{mpfRelevantIncome:20000,mpfFullMonths:12});
 assert.equal(p.employee,1000);assert.equal(p.employer,1000);assert.equal(p.total,2000);assert.equal(p.afterEmployee,19000);
 assert.deepEqual(r.metrics.map(([label,value,unit])=>[label,value,unit]),[
  ['Employee mandatory contribution for one full wage period',1000,'hkd'],
  ['Employer mandatory contribution from employer funds for that period',1000,'hkd'],
  ['Relevant income less employee MPF contribution, before other deductions',19000,'hkd']
 ]);
 assert.equal(r.charts.length,4);
 assert.deepEqual(r.charts[0].rows.map(row=>row.label),['Relevant income HK$6,000','Relevant income HK$7,099','Relevant income HK$7,100','Relevant income HK$20,000','Relevant income HK$30,000','Relevant income HK$40,000']);
 assert.deepEqual(r.charts[0].rows[1].values.map(v=>Number(v.toFixed(2))),[0,354.95]);
 assert.deepEqual(r.charts[1].rows.map(row=>row.value),[20000,-1000]);
 assert.deepEqual(r.charts[2].rows.map(row=>row.label),['1 completed full wage period','4 completed full wage periods','8 completed full wage periods','12 completed full wage periods']);
 assert.deepEqual(r.charts[2].rows.map(row=>row.values),[ [1000,1000],[4000,4000],[8000,8000],[12000,12000] ]);
 assert.deepEqual(r.charts[3].series.map(s=>s.name),['Calculated effective employee share','5% comparison','Selected relevant income · gold point']);
 near(r.charts[3].series[0].rows[0].value,355/7100);near(r.charts[3].series.at(-1).rows[0].value,.05);
});

test('the cap produces a lower effective share without changing the stated contribution rate',()=>{
 near(hkMpfContribution(40000).employee/40000,.0375);
 near(hkMpfContribution(100000).employee/100000,.015);
 const below=planningResult('hkMpf',{...defaults('hkMpf'),mpfRelevantIncome:6000,mpfFullMonths:1});
 assert.equal(below.charts[3].series.length,2);
 assert.ok(below.charts[3].series.every(s=>s.name!=='Selected relevant income · gold point'));
 assert.equal(below.metrics[0][1],0);assert.equal(below.metrics[1][1],300);
 assert.equal(below.metrics[2][1],6000);
 const one=planningResult('hkMpf',{...defaults('hkMpf'),mpfFullMonths:1});
 assert.deepEqual(one.charts[2].rows.map(row=>row.label),['1 completed full wage period']);
});

test('whole-HKD income and whole wage periods are the only accepted inputs',()=>{
 const d=defaults('hkMpf');
 for(const key of ['mpfRelevantIncome','mpfFullMonths'])for(const value of [.5,12.5,NaN,Infinity,-1])assert.equal(validInputs('hkMpf',{...d,[key]:value}),false);
 assert.equal(validInputs('hkMpf',{...d,mpfRelevantIncome:100001}),false);
 assert.equal(validInputs('hkMpf',{...d,mpfFullMonths:25}),false);
 assert.equal(validInputs('hkMpf',{...d,mpfRelevantIncome:0,mpfFullMonths:1}),true);
 assert.equal(validInputs('hkMpf',{...d,mpfRelevantIncome:100000,mpfFullMonths:24}),true);
 assert.equal(definitions.hkMpf.fields.length,2);
});

test('Hong Kong dollars format without being mistaken for Canadian dollars',()=>{
 assert.equal(format(1500,'hkd'),'HK$1,500');assert.equal(format(-1500,'hkd'),'-HK$1,500');
 assert.equal(format(30000,'hkd',true),'HK$30k');assert.equal(format(1000000,'hkd',true),'HK$1.0m');
 assert.equal(format(1500,'money'),'$1,500');
});

test('the guide keeps eight sections, live companions and four finite accessible HKD charts',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 assert.equal(hkMpfGuides.length,1);
 for(const g of hkMpfGuides){
  assert.equal(g.slug,'hong-kong-mpf-monthly-contribution-threshold-cap-cash');assert.equal(g.planning,'hkMpf');
  assert.equal(g.sections.length,8);assert.ok(g.related.every(s=>slugs.has(s)));
  assert.ok(g.sources.length>=2&&g.sources.every(s=>s.url.startsWith('https://')&&/25 October 2026/i.test(s.note)));
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=900);
  assert.match(g.sections.map(s=>s.html).join(' '),/HK\$7,100/);
  assert.match(g.description,/Hong Kong dollars/);
  const d=defaults(g.planning),fields=definitions[g.planning].fields;
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){
   assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);
   assert.equal(result.charts.length,4);
   for(const width of [300,900]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/HK\$/);assert.doesNotMatch(html,/Canadian dollars/);}
  }
 }
});
