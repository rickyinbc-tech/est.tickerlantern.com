import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,planningResult,validInputs} from '../src/planning-models.js';
import {savingDistributionSource as source} from '../src/planning-saving-distribution-data.js';
import {savingDistributionComparison} from '../src/planning-saving-distribution-models.js';
import {renderResult} from '../src/planning-charts.js';
const kind='savingDistribution';
test('annual net-saving extract preserves all 25 observations, signs, years and source units',()=>{
  assert.deepEqual(source.years,[2021,2022,2023,2024,2025]);assert.equal(source.groups.length,5);
  assert.ok(source.groups.every(g=>g.values.length===5&&g.values.every(Number.isInteger)));
  assert.deepEqual(source.groups.map(g=>g.values[4]),[-38907,-19944,-10092,18912,75469]);
  const p=savingDistributionComparison(defaults(kind));assert.equal(p.selected,-10092);assert.equal(p.change,-7020);assert.equal(p.gap,114376);
  assert.match(source.attribution,/does not constitute an endorsement/);
});
test('reference-year differences reverse exactly and zero references retain actual levels',()=>{
  const base=defaults(kind);
  for(const year of source.years)for(const reference of source.years){
    const forward=planningResult(kind,{...base,netSavingYear:year,netSavingCompare:reference});
    const reverse=planningResult(kind,{...base,netSavingYear:reference,netSavingCompare:year});
    forward.charts[1].rows.forEach((r,i)=>assert.equal(r.value+reverse.charts[1].rows[i].value,0));
    if(year===reference){assert.ok(forward.charts[1].rows.every(r=>r.value===0));assert.ok(forward.charts[0].rows.some(r=>r.value!==0));}
  }
  const improved=savingDistributionComparison({...base,netSavingCompare:2024});assert.equal(improved.change,295);assert.ok(improved.selected<0);
});
test('history and fixed matrix select the intended observations without inventing personal values',()=>{
  const base=defaults(kind),a=planningResult(kind),b=planningResult(kind,{...base,netSavingYear:2021,netSavingCompare:2023});
  assert.deepEqual(a.charts[2],b.charts[2]);assert.deepEqual(a.charts[3],b.charts[3]);
  const high=planningResult(kind,{...base,netSavingGroup:5});assert.notDeepEqual(a.charts[2],high.charts[2]);assert.deepEqual(a.charts[3],high.charts[3]);
  assert.deepEqual(a.charts[2].series[0].rows.map(r=>r.value),source.groups[2].values);assert.equal(a.charts[2].yMax,0);
  assert.deepEqual(a.charts[2].xTicks.map(t=>t.label),['2021','2023','2025']);
  assert.ok(a.charts.every(c=>c.source===source.url));assert.equal(a.charts[1].evidence,'Derived from official statistics');
});
test('all historical year and group combinations render finite signed geometry and exact-value tables',()=>{
  const base=defaults(kind);
  for(const netSavingYear of source.years)for(const netSavingCompare of source.years)for(const netSavingGroup of [1,2,3,4,5]){
    const input={...base,netSavingYear,netSavingCompare,netSavingGroup};assert.ok(validInputs(kind,input));const result=planningResult(kind,input);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
  for(const key of ['netSavingYear','netSavingCompare','netSavingGroup'])assert.equal(validInputs(kind,{...base,[key]:base[key]+.5}),false);
  assert.equal(validInputs(kind,{...base,netSavingYear:2026}),false);
});
