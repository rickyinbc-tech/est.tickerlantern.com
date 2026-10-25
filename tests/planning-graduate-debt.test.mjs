import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,planningResult,validInputs} from '../src/planning-models.js';
import {graduateDebtSource as source,graduateDebtLevels as levels,graduateDebtMeasures as measures} from '../src/planning-graduate-debt-data.js';
import {graduateDebtSelection} from '../src/planning-graduate-debt-models.js';
import {renderResult,renderPlanningExplorer} from '../src/planning-charts.js';
const kind='graduateDebt';
test('historical debt measures retain dates, conditional groups and every source quality code',()=>{
  assert.equal(source.classYear,2020);assert.equal(source.interviewYear,2023);assert.equal(source.releaseDate,'2025-05-02');assert.equal(source.observations,36);
  const codes=levels.flatMap(level=>Object.keys(measures).map(k=>level[k].quality));
  assert.deepEqual(Object.fromEntries(['A','B','C'].map(q=>[q,codes.filter(v=>v===q).length])),{A:25,B:9,C:2});
  assert.equal(new Set(levels.flatMap(level=>Object.keys(measures).map(k=>level[k].coordinate))).size,36);
  const selected=graduateDebtSelection(defaults(kind));assert.equal(selected.debtShare.value,47);assert.equal(selected.medianAtGrad.value,18800);assert.equal(selected.medianRemaining.value,15000);assert.equal(selected.paidOffShare.value,33);
});
test('selected source view highlights the right level and does not rewrite cross-level evidence',()=>{
  const a=planningResult(kind),b=planningResult(kind,{graduateDebtLevel:4});
  assert.deepEqual(a.metrics.map(m=>m[1]),[.47,18800,15000]);assert.deepEqual(b.metrics.map(m=>m[1]),[.8,65000,48000]);
  for(const i of [0,1,3,5])assert.deepEqual(a.charts[i],b.charts[i]);
  assert.equal(b.charts[4].rows.filter(r=>r.selected).length,1);assert.match(b.charts[4].rows.find(r=>r.selected).label,/Professional \[B\/C\]/);
  assert.equal(b.charts[4].pointLabelHeader,'Study level · quality [incidence / median]');assert.match(b.charts[4].pointContext,/overlapping aggregate/);
  assert.equal(b.charts[0].rows.length,5);assert.equal(b.charts[4].rows.length,6);
});
test('every study level maps source measures to the correct chart and retains quality beside the row',()=>{
  for(const level of levels){
    const result=planningResult(kind,{graduateDebtLevel:level.id}),chart=result.charts[2];
    assert.deepEqual(chart.rows[0].values,[level.meanAtGrad.value,level.medianAtGrad.value]);
    assert.deepEqual(chart.rows[1].values,[level.meanRemaining.value,level.medianRemaining.value]);
    assert.ok(chart.rows[0].label.includes('['+level.meanAtGrad.quality+'/'+level.medianAtGrad.quality+']'));
    assert.ok(chart.rows[1].label.includes('['+level.meanRemaining.quality+'/'+level.medianRemaining.quality+']'));
    assert.ok(result.charts.slice(0,5).every(c=>c.source===source.url));assert.equal(result.charts[5].source,undefined);
  }
});
test('invented example demonstrates denominator selection without reconstructing survey borrowers',()=>{
  const rows=planningResult(kind).charts[5].rows,before=rows.map(r=>r.values[0]),after=rows.map(r=>r.values[1]);
  const median=xs=>{const s=[...xs].sort((a,b)=>a-b),m=s.length/2;return Number.isInteger(m)?(s[m-1]+s[m])/2:s[Math.floor(m)];};
  assert.equal(median(before),20000);assert.equal(median(after),19000);assert.equal(median(after.filter(v=>v>0)),24000);
  assert.equal(median(before.map((v,i)=>v-after[i])),1000);assert.ok(rows.every(r=>r.values[1]<r.values[0]));
  assert.match(planningResult(kind).charts[5].note,/entirely invented/);
});
test('all six source views render six finite accessible figures and source controls remain descriptive',()=>{
  for(let graduateDebtLevel=1;graduateDebtLevel<=6;graduateDebtLevel++){
    const input={graduateDebtLevel};assert.ok(validInputs(kind,input));
    for(const width of [300,760]){const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,6);assert.equal((html.match(/<caption>/g)||[]).length,6);}
  }
  const html=renderPlanningExplorer(kind);assert.match(html,/Choose a source level/);assert.match(html,/Restore source level/);assert.doesNotMatch(html,/Change an assumption/);
  assert.match(renderPlanningExplorer('retirementAgeStatistics'),/Restore source year/);
  assert.equal(validInputs(kind,{graduateDebtLevel:0}),false);assert.equal(validInputs(kind,{graduateDebtLevel:7}),false);assert.equal(validInputs(kind,{graduateDebtLevel:2.5}),false);
});
