import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {incomeTransitionPeriods as periods,incomeTransitionMeasures as measures,incomeTransitionSource as source} from '../src/planning-income-transition-data.js';
import {incomeTransitionLedger} from '../src/planning-income-transition-models.js';
import {renderResult} from '../src/planning-charts.js';
const kind='incomeTransition',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('source vintage, measure identifiers and selected denominators retain the public table scope',()=>{
  assert.equal(source.observations,55);assert.equal(periods.length,5);assert.equal(Object.keys(measures).length,11);
  assert.equal(new Set(Object.values(measures).map(m=>m.coordinate)).size,11);assert.equal(source.releaseDate,'2025-10-31');
  const p=incomeTransitionLedger(defaults(kind));near(p.firstNotLow,23863695);near(p.selected.firstLow,4439745);
  near(p.selected.entrants,980895);near(p.selected.exits,1549805);near(p.selected.secondLow,3870835);
  near(p.selected.entryRate,4.1);near(p.selected.exitRate,34.9);near(p.monthlyGap,400);near(p.coverageMonths,6);
});
test('each matched pair reconciles its four cells, rates and low-income count without joining cohorts',()=>{
  for(const r of periods){
    assert.equal(r.firstLow+r.entrants-r.exits,r.secondLow);
    assert.equal(r.stayedLow+r.exits,r.firstLow);assert.equal(r.stayedLow+r.entrants,r.secondLow);
    assert.equal(r.stayedLow+r.stayedNotLow+r.entrants+r.exits,r.total);
    near(r.entryRate+r.resistanceRate,100);near(r.exitRate+r.immobilityRate,100);
    assert.ok(Math.abs(100*r.entrants/(r.total-r.firstLow)-r.entryRate)<.05000001);
    assert.ok(Math.abs(100*r.exits/r.firstLow-r.exitRate)<.05000001);
    const result=planningResult(kind,{...defaults(kind),transitionEndYear:r.endYear});
    assert.equal(result.charts[3].rows.reduce((a,row)=>a+row.value,0),r.secondLow);
    assert.equal(result.charts[2].rows.flatMap(row=>row.values).reduce((a,b)=>a+b,0),r.total);
  }
  assert.notEqual(periods[3].secondLow,periods[4].firstLow);
});
test('national source selectors and independent cash inputs cannot rewrite each other',()=>{
  const base=defaults(kind),a=planningResult(kind,base),year=planningResult(kind,{...base,transitionEndYear:2020}),cash=planningResult(kind,{...base,transitionReceipts:0,transitionReserve:100});
  assert.deepEqual(a.charts[4],year.charts[4]);assert.deepEqual(a.charts[0],year.charts[0]);
  assert.deepEqual(a.charts.slice(0,4),cash.charts.slice(0,4));
  assert.ok(a.charts.slice(0,4).every(c=>c.source));assert.equal(a.charts[4].source,undefined);
  near(year.metrics[0][1],.034);near(year.metrics[1][1],.397);
});
test('cash remaining and unfunded gap reconcile separately at every month-end',()=>{
  const base=defaults(kind);
  for(const transitionEssentials of [0,2500,20000])for(const transitionReceipts of [0,2100,20000])for(const transitionReserve of [0,2400,200000]){
    const input={...base,transitionEssentials,transitionReceipts,transitionReserve},result=planningResult(kind,input),gap=Math.max(0,transitionEssentials-transitionReceipts);
    for(let month=0;month<=12;month++){
      const remaining=result.charts[4].series[0].rows[month].value,unfunded=result.charts[4].series[1].rows[month].value;
      near(remaining-unfunded,transitionReserve-month*gap);assert.ok(remaining>=0&&unfunded>=0);
      assert.ok(remaining===0||unfunded===0);
    }
  }
});
test('all supported extremes render five finite figures and source-year bounds are strict',()=>{
  const base=defaults(kind),fields=definitions[kind].fields;
  const cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
  for(const input of cases){assert.ok(validInputs(kind,input));for(const width of [300,760]){
    const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
    assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);
  }}
  assert.equal(validInputs(kind,{...base,transitionEndYear:2024}),false);assert.equal(validInputs(kind,{...base,transitionEndYear:2020.5}),false);
});
