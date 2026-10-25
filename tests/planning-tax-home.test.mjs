import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { federal2026, federalBracketTax, nextDollarRate, fhsaCalendar, movingCash } from '../src/planning-tax-home-models.js';
import { renderFigure, renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('2026 federal parameters preserve the verified CRA thresholds and rates',()=>{
  assert.equal(federal2026.year,2026);assert.equal(federal2026.reviewed,'2026-10-25');
  assert.deepEqual(federal2026.bands,[[58523,.14],[117045,.205],[181440,.26],[258482,.29],[Infinity,.33]]);
  near(federalBracketTax(75000),58523*.14+(75000-58523)*.205);
  near(federalBracketTax(300000),58523*.14+(117045-58523)*.205+(181440-117045)*.26+(258482-181440)*.29+(300000-258482)*.33);
});
test('federal slice tax is continuous at thresholds and the next-dollar rate changes without repricing earlier slices',()=>{
  const cutoffs=[58523,117045,181440,258482],rates=[.14,.205,.26,.29,.33];
  cutoffs.forEach((x,i)=>{
    near(federalBracketTax(x)-federalBracketTax(x-1),rates[i]);
    near(federalBracketTax(x+1)-federalBracketTax(x),rates[i+1]);
    near(nextDollarRate(x),rates[i+1]);
  });
});
test('a deduction crossing a federal threshold uses both slice rates, and extra income uses only its applicable band',()=>{
  near(federalBracketTax(60000)-federalBracketTax(55000),1477*.205+3523*.14);
  const result=planningResult('federalTax');
  near(result.metrics[0][1],11571.005);near(result.metrics[1][1],11571.005/75000);near(result.metrics[2][1],.205);
  const bars=result.charts[2].rows;near(bars[1].values[0]-bars[0].values[0],2050);
  near(bars[1].values[1]-bars[0].values[1],7950);
});
test('zero-income average is undefined, negative taxable amounts are floored, and CRA attribution is explicit',()=>{
  const result=planningResult('federalTax',{income:0,deduction:5000,extra:0});
  assert.equal(result.metrics[0][1],0);assert.equal(result.metrics[1][1],null);assert.match(renderResult(result),/Not defined at \$0/);
  assert.ok(result.charts[1].series[1].rows.every(r=>r.x>0));
  const html=renderFigure(result.charts[0],300);assert.match(html,/CRA · federal rates for 2026/);assert.doesNotMatch(html,/Statistics Canada/);
});
test('FHSA ordinary calendar respects opening-year room, limited carryforward and cumulative capacity',()=>{
  const p=fhsaCalendar(defaults('fhsa'));
  assert.deepEqual(p.rows.slice(1).map(r=>r.room),[8000,16000,16000,14000,12000,10000,0,0]);
  assert.deepEqual(p.rows.slice(1).map(r=>r.deposit),[0,0,10000,10000,10000,10000,0,0]);
  assert.equal(p.used,40000);assert.equal(p.unplaced,20000);
  assert.ok(p.rows.slice(1).every(r=>r.carry<=8000&&r.deposit<=r.room&&r.used<=40000));
});
test('FHSA value matches an independent future value of year-end deposits and returns do not change contribution room',()=>{
  const input=defaults('fhsa');
  for(const rate of [-5,0,10]){
    const p=fhsaCalendar({...input,rate}),expected=10000*([5,4,3,2].reduce((s,y)=>s+(1+rate/100)**y,0));
    near(p.value,expected);assert.equal(p.used,40000);assert.equal(p.unplaced,20000);
  }
  const poor=fhsaCalendar({...input,rate:-5});assert.ok(poor.value<poor.used);assert.equal(poor.rows.at(-1).room,0);
});
test('FHSA first-year over-sized requests are capped and waiting never creates unlimited annual room',()=>{
  const input={...defaults('fhsa'),annual:16000,years:10,wait:0},p=fhsaCalendar(input);
  assert.equal(p.rows[1].deposit,8000);assert.equal(p.rows[2].deposit,8000);assert.equal(p.used,40000);
  const delayed=fhsaCalendar({...input,wait:5});assert.equal(delayed.rows[6].room,16000);assert.equal(delayed.rows[6].deposit,16000);
  const none=fhsaCalendar({...input,annual:0});assert.equal(none.used,0);assert.equal(none.value,0);assert.equal(none.unplaced,0);
});
test('moving ledger reconciles home equity and cash to the cost of the transaction',()=>{
  const input=defaults('moving'),p=movingCash(input);
  near(p.afterSale,609000);near(p.cashNeeded,479500);near(p.released,129500);near(p.costs,65500);
  near(input.buy-p.newDebt+p.released,input.sale-input.oldDebt-p.costs);
  const result=planningResult('moving');near(result.charts[0].rows.reduce((s,r)=>s+r.value,0),p.released);
});
test('less replacement debt can require extra cash even for a cheaper home, while added borrowing does not create wealth',()=>{
  const input=defaults('moving'),cash=movingCash({...input,newLTV:0}),borrowed=movingCash({...input,newLTV:80});
  near(cash.released,-65500);assert.ok(input.buy<input.sale);assert.ok(borrowed.released>cash.released);
  near(input.buy-cash.newDebt+cash.released,input.buy-borrowed.newDebt+borrowed.released);
});
test('new tax-home figures remain finite, include exact data tables, and reject fractional waiting years',()=>{
  for(const kind of ['federalTax','fhsa','moving']){
    const result=planningResult(kind);assert.equal(result.charts.length,4);assert.equal(new Set(result.charts.map(c=>c.id)).size,4);
    for(const chart of result.charts){
      const rows=chart.series?chart.series.flatMap(s=>s.rows):chart.rows;
      for(const row of rows){if('value' in row)assert.ok(Number.isFinite(row.value));if('x' in row)assert.ok(Number.isFinite(row.x));if(row.values)assert.ok(row.values.every(Number.isFinite));}
      const html=renderFigure(chart,300);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.match(html,/View chart data/);
    }
  }
  assert.equal(validInputs('fhsa',{...defaults('fhsa'),wait:1.5}),false);
});
