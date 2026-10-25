import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,planningResult,validInputs} from '../src/planning-models.js';
import {vacancyBandSource as source} from '../src/planning-vacancy-band-data.js';
import {vacancyBandComparison} from '../src/planning-vacancy-band-models.js';
import {renderResult,renderPlanningExplorer} from '../src/planning-charts.js';
const kind='vacancyBand',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('eleven annual snapshots retain four rent quartiles and the publication vintage',()=>{
  assert.equal(source.observations,44);assert.equal(source.releaseDate,'2025-12-11');assert.deepEqual(source.years,Array.from({length:11},(_,i)=>2015+i));
  assert.equal(source.bands.length,4);source.bands.forEach((b,i)=>{assert.equal(b.id,i+1);assert.equal(b.sourceLabel,'Q'+(i+1));assert.equal(b.values.length,11);assert.ok(b.values.every(v=>Number.isFinite(v)&&v>=0&&v<=100));});
  const p=vacancyBandComparison(defaults(kind));near(p.selected,.014);near(p.change,.007);near(p.gap,.039);
});
test('two-year selections produce exact rate differences in percentage points, including zero and reversed comparisons',()=>{
  const base=defaults(kind),result=planningResult(kind,base);
  result.charts[1].rows.forEach((r,i)=>near(r.value,[.007,.011,.011,.008][i]));
  assert.equal(result.charts[1].unit,'pp');assert.equal(result.metrics[1][2],'pp');
  const reversed=planningResult(kind,{...base,vacancyYear:2024,vacancyReference:2025});
  reversed.charts[1].rows.forEach((r,i)=>near(r.value,-result.charts[1].rows[i].value));
  assert.ok(planningResult(kind,{...base,vacancyYear:2024}).charts[1].rows.every(r=>r.value===0));
  near(vacancyBandComparison({...base,vacancyYear:2015}).gap,-.019);
});
test('traced rent band changes only the selected metrics and history while the fixed matrix retains original values',()=>{
  const base=defaults(kind),a=planningResult(kind,base),band=planningResult(kind,{...base,vacancyBand:4}),year=planningResult(kind,{...base,vacancyYear:2015});
  for(const i of [0,1,3])assert.deepEqual(a.charts[i],band.charts[i]);
  assert.deepEqual(a.charts[2],year.charts[2]);assert.deepEqual(a.charts[3],year.charts[3]);
  near(band.metrics[0][1],.053);near(band.metrics[1][1],.008);
  assert.deepEqual(band.charts[2].series[0].rows.map(r=>r.value),source.bands[3].values.map(v=>v/100));
  a.charts[3].rows[0].values.forEach((value,i)=>near(value,[.048,.023,.022,.011,.014][i]));
});
test('every source view is finite, fully sourced and rendered with four accessible charts',()=>{
  const base=defaults(kind);
  for(const vacancyBand of [1,2,3,4])for(const vacancyYear of source.years){
    const input={...base,vacancyBand,vacancyYear};assert.ok(validInputs(kind,input));const result=planningResult(kind,input);
    assert.ok(result.charts.every(c=>c.source===source.url));assert.match(result.note,/not calendar quarters/);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
  assert.match(renderPlanningExplorer(kind),/Restore source view/);
  assert.equal(validInputs(kind,{...base,vacancyYear:2026}),false);assert.equal(validInputs(kind,{...base,vacancyBand:1.5}),false);assert.equal(validInputs(kind,{...base,vacancyReference:2020.5}),false);
});
