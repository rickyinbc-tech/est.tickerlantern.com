import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,planningResult,validInputs} from '../src/planning-models.js';
import {adjustedIncomeSelection} from '../src/planning-adjusted-income-models.js';
import {adjustedIncomeSource as source} from '../src/planning-adjusted-income-data.js';
import {renderFigure,renderResult} from '../src/planning-charts.js';
const kind='adjustedIncome';
test('75 annual observations preserve source units, default means and the independent rounding residual',()=>{
  assert.equal(source.groups.reduce((sum,g)=>sum+g.rows.length*3,0),75);
  const {row}=adjustedIncomeSelection(defaults(kind));assert.deepEqual([row.disposable,row.inKind,row.adjusted],[87705,31905,119610]);
  const residuals=source.groups.flatMap(g=>g.rows.map(r=>r.roundingResidual));assert.equal(residuals.filter(x=>x===0).length,21);assert.equal(residuals.filter(x=>x===1).length,1);assert.equal(residuals.filter(x=>x===-1).length,3);
  source.groups.forEach(g=>g.rows.forEach(r=>{assert.equal(r.disposable+r.inKind+r.roundingResidual,r.adjusted);assert.ok(r.inKind>0&&r.adjusted>r.disposable);assert.ok(r.inKind/r.adjusted>0&&r.inKind/r.adjusted<1);}));
});
test('waterfalls reproduce every published adjusted mean without silently dropping rounding',()=>{
  const base=defaults(kind);
  for(const adjustedYear of source.years)for(const adjustedGroup of [1,2,3,4,5]){
    const input={...base,adjustedYear,adjustedGroup},result=planningResult(kind,input),{row}=adjustedIncomeSelection(input),bridge=result.charts[3];
    assert.equal(bridge.rows.reduce((sum,r)=>sum+r.value,0),row.adjusted);
    assert.equal(bridge.rows.length,row.roundingResidual?3:2);
    assert.deepEqual(result.metrics.map(m=>m[1]),[row.disposable,row.inKind,row.adjusted]);
  }
});
test('group-wide charts and the selected history obey their separate historical controls',()=>{
  const base=defaults(kind),a=planningResult(kind),otherGroup=planningResult(kind,{...base,adjustedGroup:5}),otherYear=planningResult(kind,{...base,adjustedYear:2021});
  assert.deepEqual(a.charts[0],otherGroup.charts[0]);assert.deepEqual(a.charts[1],otherGroup.charts[1]);
  assert.deepEqual(a.charts[2],otherYear.charts[2]);assert.notDeepEqual(a.charts[0],otherYear.charts[0]);
  assert.deepEqual(a.charts[2].xTicks.map(t=>t.label),['2021','2023','2025']);
  assert.equal(a.charts[4].rows.filter(r=>r.selected).length,1);assert.equal(a.charts[4].rows.find(r=>r.selected).label,'Middle');
});
test('official-data scatter retains income-group semantics and distinguishes dollars from a derived ratio',()=>{
  const chart=planningResult(kind).charts[4],html=renderFigure(chart,300);
  assert.match(html,/<th scope="col">Income quintile<\/th>/);assert.doesNotMatch(html,/selected allocation|calculated scenarios/);
  assert.match(html,/\$87,705/);assert.match(html,/26\.67%/);assert.match(chart.pointContext,/not individual households/);
  chart.rows.forEach((point,i)=>{const row=source.groups[i].rows.at(-1);assert.equal(point.x,row.disposable);assert.equal(point.value,row.inKind/row.adjusted);});
});
test('all historical combinations render five finite, labelled and tabulated figures at narrow and wide widths',()=>{
  const base=defaults(kind);
  for(const adjustedYear of source.years)for(const adjustedGroup of [1,2,3,4,5]){
    const input={...base,adjustedYear,adjustedGroup};assert.ok(validInputs(kind,input));const result=planningResult(kind,input);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
  }
  assert.equal(validInputs(kind,{...base,adjustedYear:2026}),false);assert.equal(validInputs(kind,{...base,adjustedGroup:2.5}),false);
});
