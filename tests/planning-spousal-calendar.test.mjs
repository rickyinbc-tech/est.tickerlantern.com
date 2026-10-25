import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { spousalWindow, calendarMonthGap, depositYearInWindow, spousalCalendarReference } from '../src/planning-spousal-calendar-models.js';
import { renderResult } from '../src/planning-charts.js';

test('each review contains the withdrawal calendar year and exactly two preceding calendar years',()=>{
  const d=defaults('spousalCalendar');
  assert.deepEqual(spousalWindow(d).years,[2027,2028,2029]);assert.equal(spousalWindow(d).total,0);
  assert.equal(spousalWindow(d,2027).total,5000);assert.equal(spousalWindow(d,2028).total,5000);
  assert.equal(spousalWindow(d,2030).total,0);assert.equal(spousalWindow(d,2031).total,0);
  assert.equal(spousalCalendarReference.reviewed,'2026-10-25');assert.equal(spousalCalendarReference.windowYears,3);
});
test('annual totals aggregate once and newer deposits remain visible after the 2026 year leaves a window',()=>{
  const d={...defaults('spousalCalendar'),c2025:1000,c2026:2000,c2027:3000,c2028:4000,c2029:5000,c2030:6000,c2031:7000};
  for(const year of [2027,2028,2029,2030,2031]){
    let expected=0;for(let contributionYear=2025;contributionYear<=2031;contributionYear++)if(contributionYear>=year-2&&contributionYear<=year)expected+=d['c'+contributionYear];
    assert.equal(spousalWindow(d,year).total,expected);
  }
  const later={...defaults('spousalCalendar'),c2028:2000};assert.equal(spousalWindow(later,2029).total,2000);assert.equal(spousalWindow(later,2028).total,7000);
});
test('month-label arithmetic and calendar membership do not collapse into one elapsed-month threshold',()=>{
  assert.equal(calendarMonthGap(2026,12,2029,1),25);assert.equal(calendarMonthGap(2026,1,2029,1),36);
  assert.equal(calendarMonthGap(2026,1,2029,12),47);assert.equal(calendarMonthGap(2026,12,2028,12),24);
  assert.equal(depositYearInWindow(2026,2028),true);assert.equal(depositYearInWindow(2026,2029),false);
  for(const cm of [1,4,7,12])for(const wm of [1,4,7,12]){const months=calendarMonthGap(2026,cm,2029,wm);assert.ok(months>=25&&months<=47);assert.equal(depositYearInWindow(2026,2029),false);}
});
test('the fixed date matrix remains fixed and record totals are not presented as attributed income',()=>{
  const d=defaults('spousalCalendar'),base=planningResult('spousalCalendar'),edited=planningResult('spousalCalendar',{...d,withdrawYear:2027,contributionMonth:1,withdrawMonth:12,c2027:10000});
  assert.deepEqual(edited.charts[3],base.charts[3]);assert.equal(base.metrics[0][1],0);assert.equal(edited.metrics[0][1],15000);
  assert.equal(base.metrics[1][3],'2027–2029');assert.equal(edited.metrics[1][3],'2025–2027');
  assert.match(base.note,/not attributed income or tax payable/);
});
test('calendar controls require whole values and every boundary produces four finite chart/table pairs',()=>{
  const d=defaults('spousalCalendar'),fields=definitions.spousalCalendar.fields;
  for(const key of ['withdrawYear','contributionMonth','withdrawMonth'])assert.equal(validInputs('spousalCalendar',{...d,[key]:d[key]+.5}),false);
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const input of inputs){const result=planningResult('spousalCalendar',input);finite(result);assert.equal(result.charts.length,4);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
