import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {illustrativeBracketTax,taxIndexationPlan} from '../src/planning-tax-indexation-models.js';
import {taxIndexationSource} from '../src/planning-tax-indexation-data.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);

test('published indexation percentages retain tax-year labels and remain separate from future assumptions',()=>{
 assert.deepEqual(taxIndexationSource.rows,[{year:2023,rate:6.3},{year:2024,rate:4.7},{year:2025,rate:2.7},{year:2026,rate:2}]);
 assert.equal(taxIndexationSource.pageDate,'2026-03-12');
 const a=planningResult('taxIndexation'),b=planningResult('taxIndexation',{...defaults('taxIndexation'),payGrowth:8,inflation:6,years:20});
 assert.deepEqual(a.charts[0],b.charts[0]);assert.match(a.charts[0].source,/canada\.ca/);assert.equal(a.charts.filter(c=>c.source).length,1);
});
test('independent dollar slices reproduce tax and apply a new rate only to income above its threshold',()=>{
 const rate=x=>x<=50000?.2:x<=100000?.3:.4;
 for(const income of [10000,49999,50000,50001,80000,100000,100001,250000]){
  let tax=0;for(let dollar=1;dollar<=income;dollar++)tax+=rate(dollar);
  near(illustrativeBracketTax(income),tax,1e-6);
 }
 near(illustrativeBracketTax(50001)-illustrativeBracketTax(50000),.3);
 near(illustrativeBracketTax(100001)-illustrativeBracketTax(100000),.4);
 assert.equal(illustrativeBracketTax(80000),19000);
});
test('the default annual gap reconciles nominal tax and starting-year purchasing power',()=>{
 const {start,end}=taxIndexationPlan(defaults('taxIndexation'));
 assert.equal(start.fixedTax,19000);assert.equal(start.fixedNet,61000);
 near(end.income,107513.31034752978);near(end.fixedTax,28005.324139011915);near(end.indexedTax,25534.411207538324);
 near(end.realGross,80000);near(end.realIndexed,61000);near(end.realFixed,59161.40872345087);near(end.realGap,1838.5912765491273);
 near(end.realGap,(end.fixedTax-end.indexedTax)/Math.pow(1.03,10));near(end.realFixed+end.realGap,end.realIndexed);
});
test('matched pay and price growth preserves real net income with fully scaled thresholds at every income level',()=>{
 for(const income of [10000,50000,80000,100000,250000])for(const rate of [0,2,6]){
  const p=taxIndexationPlan({...defaults('taxIndexation'),income,inflation:rate,payGrowth:rate,years:20});
  for(const r of p.rows){near(r.realGross,income);near(r.realIndexed,p.start.indexedNet);assert.ok(r.realGap>=-1e-7);}
 }
 // Below the first threshold, both schedules can charge the same flat rate.
 near(taxIndexationPlan({...defaults('taxIndexation'),income:10000}).end.realGap,0);
});
test('zero price inflation makes the threshold rules coincide regardless of pay growth',()=>{
 for(const income of [10000,80000,250000])for(const payGrowth of [0,3,8]){
  const p=taxIndexationPlan({...defaults('taxIndexation'),income,payGrowth,inflation:0});
  for(const r of p.rows){assert.equal(r.fixedTax,r.indexedTax);assert.equal(r.realGap,0);}
 }
});
test('five graphics reconcile annual amounts without treating the selected-year gap as cumulative savings',()=>{
 const d=defaults('taxIndexation'),r=planningResult('taxIndexation'),p=taxIndexationPlan(d);
 for(const row of r.charts[2].rows)near(row.values.reduce((a,b)=>a+b,0),p.end.income);
 near(r.charts[3].rows.reduce((a,b)=>a+b.value,0),p.end.realFixed);
 near(r.metrics[2][1],p.end.realGap);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++)near(r.charts[4].rows[row].values[col],taxIndexationPlan({...d,inflation:[0,2,4,6][row],payGrowth:[0,2,4,6][col]}).end.realGap);
 assert.ok(taxIndexationPlan({...d,payGrowth:8}).end.realFixed>p.start.realFixed);
});
test('whole years and input boundaries produce five finite and distinct chart/table pairs',()=>{
 const d=defaults('taxIndexation'),fields=definitions.taxIndexation.fields;
 assert.equal(validInputs('taxIndexation',{...d,years:2.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const r=planningResult('taxIndexation',input);assert.equal(new Set(r.charts.map(c=>c.id)).size,5);
  for(const width of [300,1000]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
});
