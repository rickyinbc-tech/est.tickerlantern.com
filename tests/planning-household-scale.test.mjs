import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {householdScalePlan} from '../src/planning-household-scale-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);

test('the default distinguishes three income measures and independently reconciles monthly cash',()=>{
 const d=defaults('householdScale'),p=householdScalePlan(d);
 assert.equal(d.annualIncome,72000);assert.equal(p.factor,2);assert.equal(p.adjusted,36000);assert.equal(p.perPersonIncome,18000);
 assert.equal(p.personCosts,2400);assert.equal(p.remaining,1400);
 const r=planningResult('householdScale');assert.deepEqual(r.charts[0].rows.map(x=>x.value),[72000,36000,18000]);near(r.charts[2].rows.reduce((a,b)=>a+b.value,0),1400);
});
test('the square-root method preserves its independent algebraic identities for all supported household sizes',()=>{
 for(const annualIncome of [12000,72000,240000])for(let householdMembers=1;householdMembers<=6;householdMembers++){
  const p=householdScalePlan({...defaults('householdScale'),annualIncome,householdMembers});
  near(p.adjusted*p.factor,annualIncome);near(p.perPersonIncome*householdMembers,annualIncome);near(p.adjusted/p.perPersonIncome,Math.sqrt(householdMembers));
  assert.ok(p.adjusted>=p.perPersonIncome&&p.adjusted<=annualIncome);
 }
 const one=householdScalePlan({...defaults('householdScale'),householdMembers:1});assert.equal(one.adjusted,72000);assert.equal(one.perPersonIncome,72000);
});
test('changing the annual statistical income does not create cash in the separate budget',()=>{
 const d=defaults('householdScale'),a=planningResult('householdScale'),b=planningResult('householdScale',{...d,annualIncome:144000});
 assert.equal(b.metrics[0][1],2*a.metrics[0][1]);assert.equal(b.metrics[1][1],2*a.metrics[1][1]);assert.equal(b.metrics[2][1],a.metrics[2][1]);
 assert.deepEqual(a.charts[2],b.charts[2]);assert.deepEqual(a.charts[3],b.charts[3]);
});
test('cash and cost inputs change the budget without changing the source-defined income comparison',()=>{
 const d=defaults('householdScale'),a=planningResult('householdScale'),b=planningResult('householdScale',{...d,netCash:4000,sharedCosts:3000,perPerson:800});
 assert.deepEqual(a.charts[0],b.charts[0]);assert.deepEqual(a.charts[1],b.charts[1]);assert.equal(b.metrics[2][1],-2200);
 assert.equal(b.charts[3].signed,true);
 // Selected matrix scenario: four people, CAD 800 each, the same entered cash and shared costs.
 assert.equal(b.charts[3].rows[2].values[2],-2200);
});
test('the size curves retain a fixed income while the matrix independently varies budget needs',()=>{
 const d=defaults('householdScale'),r=planningResult('householdScale');
 for(let i=0;i<6;i++){const people=i+1;near(r.charts[1].series[0].rows[i].value,d.annualIncome/Math.sqrt(people));near(r.charts[1].series[1].rows[i].value,d.annualIncome/people);}
 assert.equal(r.charts[0].evidence,'Official method · hypothetical amounts');assert.equal(r.charts[1].evidence,'Official method · hypothetical comparisons');
 for(let row=0;row<4;row++)for(let col=0;col<4;col++)assert.equal(r.charts[3].rows[row].values[col],d.netCash-d.sharedCosts-[1,2,4,6][row]*[400,600,800,1000][col]);
});
test('whole people and all field boundaries render four finite graphs and data tables',()=>{
 const d=defaults('householdScale'),fields=definitions.householdScale.fields;assert.equal(validInputs('householdScale',{...d,householdMembers:2.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const r=planningResult('householdScale',input);assert.equal(new Set(r.charts.map(c=>c.id)).size,4);
  for(const width of [300,1000]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
