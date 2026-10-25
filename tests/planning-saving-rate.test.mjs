import test from 'node:test';
import assert from 'node:assert/strict';
import { householdSavingRows,householdSavingSource } from '../src/planning-saving-rate-data.js';
import { householdCashBudget } from '../src/planning-saving-rate-models.js';
import { defaults,definitions,planningResult } from '../src/planning-models.js';
import { renderResult,format } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('official saving-rate extract retains one vintage and twelve consecutive quarterly observations',()=>{
  assert.equal(householdSavingSource.released,'2026-08-28');assert.equal(householdSavingSource.rateVector,'v62305984');assert.equal(householdSavingRows.length,12);
  assert.deepEqual(householdSavingRows.map(r=>r.rate),[3.4,3.5,3.5,5,5.9,5.5,5.3,4.3,4.4,3.7,3.3,3.7]);
  const ordinal=r=>Number(r.quarter.slice(0,4))*4+Number(r.quarter.slice(-1));
  for(let i=1;i<householdSavingRows.length;i++)assert.equal(ordinal(householdSavingRows[i])-ordinal(householdSavingRows[i-1]),1);
  for(const row of householdSavingRows){assert.equal(row.income-row.consumption+row.pension,row.saving);near(Math.round(row.saving/row.income*1000)/10,row.rate);}
});
test('latest accounting bridge includes the pension adjustment and preserves source precision',()=>{
  const charts=planningResult('householdSaving').charts,bridge=charts[1];
  near(bridge.rows[0].value,1860.216);near(bridge.rows[1].value,-1844.124);near(bridge.rows[2].value,51.828);near(bridge.rows.reduce((n,r)=>n+r.value,0),67.920);
  assert.equal(bridge.unit,'billions');assert.equal(format(1860.216,'billions'),'1,860.216');assert.equal(format(51.828,'billions'),'51.828');
  near(charts[0].series[0].rows.at(-1).value,.037);assert.equal(charts[0].series[0].rows.at(-1).label,'2026 Q2');assert.ok(charts[0].source.includes('3610011201'));assert.match(bridge.evidence,/Derived/);
});
test('personal cash budget counts each commitment once and separates requested transfers from available cash',()=>{
  const input=defaults('householdSaving'),p=householdCashBudget(input);near(p.irregular,300);near(p.capacity,1200);near(p.residual,700);near(p.requestedShare,1/12);
  const waterfall=planningResult('householdSaving').charts[2];near(waterfall.rows.reduce((n,r)=>n+r.value,0),p.residual);
  const short=householdCashBudget({...input,income:4000});near(short.capacity,-800);near(short.residual,-1300);
  const noIncome=householdCashBudget({...input,income:0});assert.equal(noIncome.requestedShare,null);assert.ok(Number.isFinite(noIncome.residual));
});
test('personal edits cannot mutate official observations or the accounting bridge',()=>{
  const input=defaults('householdSaving'),before=planningResult('householdSaving'),after=planningResult('householdSaving',{...input,income:15000,living:9000,goal:1000});
  assert.deepEqual(before.charts.slice(0,2),after.charts.slice(0,2));assert.notDeepEqual(before.charts[2],after.charts[2]);
  assert.match(before.note,/first two figures are fixed/);assert.match(before.charts[3].note,/not saving-rate statistics/);
});
test('hypothetical budget boundaries preserve four finite figures and exact-value tables',()=>{
  const d=defaults('householdSaving'),fields=definitions.householdSaving.fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){const result=planningResult('householdSaving',input);assert.equal(result.charts.length,4);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/<th scope="row">2023 Q3<\/th>/);assert.match(html,/Official statistics/);assert.match(html,/Hypothetical scenario/);}}
});
