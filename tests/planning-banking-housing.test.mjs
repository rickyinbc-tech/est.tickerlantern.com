import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {overdraftPath,shelterCash} from '../src/planning-banking-housing-models.js';
import {housingSource} from '../src/planning-banking-housing-data.js';
import {bankingHousingGuides} from '../src/planning-banking-housing-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
test('overdraft default charges use the actual end-of-day ledger, including per-debit fees',()=>{
  const d=defaults('overdraftCalendar'),fixed=overdraftPath(d),use=overdraftPath(d,true);
  near(fixed.interest,(4*1300+6*400)*.21/365);near(use.interest,(4*1305+2*10+6*415)*.21/365);
  near(fixed.fees,5);near(use.fees,15);assert.equal(use.chargedDebits,3);assert.equal(fixed.negativeDays,10);assert.equal(use.negativeDays,12);
  near(fixed.peak,1300);near(use.peak,1305);near(use.rows[12].balance,-10);near(fixed.rows[12].balance,0);
  for(const p of [fixed,use])near(p.balance,d.opening+2*d.pay-d.housing-4*d.weekly-d.other-p.fees-p.interest);
});
test('zero debits never trigger a charge, and the flat fee remains due even without borrowing',()=>{
  const d=defaults('overdraftCalendar'),empty={...d,opening:1000,pay:0,housing:0,weekly:0,other:0};
  const fixed=overdraftPath(empty),use=overdraftPath(empty,true);near(fixed.fees,5);near(fixed.interest,0);near(use.cost,0);near(use.chargedDebits,0);
  const borrowed=overdraftPath({...empty,opening:0,housing:100},true);assert.equal(borrowed.chargedDebits,1);near(borrowed.interest,105*.21*30/365);
  const feeOnly=overdraftPath({...empty,opening:0});near(feeOnly.interest,5*.21/365);near(feeOnly.peak,5+5*.21/365);
});
test('same-day deposits precede debits and monthly interest is posted once without daily interest-on-interest',()=>{
  const d=defaults('overdraftCalendar'),input={...d,opening:0,pay:1800,firstSalaryDay:1,housing:1800,weekly:0,other:0,monthlyFee:0},p=overdraftPath(input);
  near(p.rows[1].balance,0);near(p.peak,0);near(p.interest,0);
  const unpaid=overdraftPath({...input,pay:0,housing:100});near(unpaid.interest,100*.21*30/365);near(unpaid.rows[29].balance,-100);near(unpaid.balance,-100-unpaid.interest);
});
test('official housing observations retain their periods, conditional denominators and fixed values',()=>{
  assert.deepEqual(housingSource.periods,[2018,2021,2022,2024]);assert.equal(housingSource.rows.length,7);
  assert.deepEqual(housingSource.rows.find(r=>r.label==='All households').values,[21.5,19.5,22,23.2]);
  const first=planningResult('shelterBudget'),changed=planningResult('shelterBudget',{...defaults('shelterBudget'),grossAnnual:180000,netMonthly:0,shelter:5000});
  assert.deepEqual(first.charts.slice(0,2),changed.charts.slice(0,2));assert.deepEqual(first.charts[1].rows.map(r=>r.value),[.057,.261,.337]);
  assert.match(first.charts[0].note,/no annual path/);assert.match(first.charts[1].note,/do not add/);
});
test('gross ratio, net ratio and remaining cash use independent, explicit denominators',()=>{
  const d=defaults('shelterBudget'),p=shelterCash(d);near(p.grossShare,.3);near(p.netShare,.4);near(p.remaining,200);
  near(shelterCash({...d,grossAnnual:160000}).grossShare,.15);near(shelterCash({...d,grossAnnual:160000}).remaining,200);
  const zero=planningResult('shelterBudget',{...d,netMonthly:0});assert.equal(zero.metrics[1][1],null);assert.equal(zero.metrics[1][3],'No net income entered');
  near(zero.metrics[2][1],-4800);
});
test('banking and housing temporal fields reject fractional months or days',()=>{
  for(const [kind,key] of [['overdraftCalendar','firstSalaryDay']])assert.equal(validInputs(kind,{...defaults(kind),[key]:defaults(kind)[key]+.5}),false);
});
test('new articles resolve their related links and all field-boundary graphics expose finite values and tables',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug)),finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const guide of bankingHousingGuides){
    assert.equal(guide.sections.length,6);assert.ok(guide.sections.map(s=>s.html).join(' ').replace(/<[^>]*>/g,' ').split(/\s+/).length>800);assert.ok(guide.related.every(slug=>slugs.has(slug)));
    const kind=guide.planning,d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
