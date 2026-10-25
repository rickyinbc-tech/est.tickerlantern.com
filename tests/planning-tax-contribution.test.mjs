import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {taxInstalmentLedger,instalmentDateSource,contributionReturns,contributionSequencePath} from '../src/planning-tax-contribution-models.js';
import {taxContributionGuides} from '../src/planning-tax-contribution-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
const product=rates=>rates.reduce((p,r)=>p*(1+r),1);

test('fixed 2026 calendar applies the March weekend adjustment and actual month ends',()=>{
  assert.equal(new Date('2026-03-15T00:00:00Z').getUTCDay(),0);assert.equal(new Date('2026-03-16T00:00:00Z').getUTCDay(),1);
  assert.deepEqual(instalmentDateSource.dates.map(r=>r[1]),['2026-03-16','2026-06-15','2026-09-15','2026-12-15']);
  const p=taxInstalmentLedger(defaults('taxInstalmentReserve'));
  assert.equal(p.events.filter(r=>r.type==='payment').length,4);assert.equal(p.events.filter(r=>r.type==='transfer').length,12);
  assert.equal(p.events[1].date,'2026-02-28');assert.equal(p.rows.at(-1).label,'2026-12-31');assert.equal(p.rows.at(-1).x,364);
  assert.ok(p.rows.every((r,i)=>i===0||r.x>=p.rows[i-1].x));
});
test('instalment funding follows payments before the same month-end transfer',()=>{
  const input=defaults('taxInstalmentReserve'),p=taxInstalmentLedger(input);
  assert.deepEqual(p.payments.map(r=>p.rows.find(row=>row.label===r.date).value),[3000,1000,-1000,-3000]);
  near(p.required,9000);near(p.extra,3000);assert.equal(p.firstGap,'2026-09-15');near(p.ending,-2000);
  near(p.ending,input.openingReserve+12*input.monthlyReserve-p.totalPayments);near(p.totalPayments,20000);
  const funded=taxInstalmentLedger({...input,openingReserve:9000});assert.ok(funded.rows.every(r=>r.value>=0));near(funded.extra,0);
});
test('an independent prefix-payment formula verifies reserve requirements for unequal instalments',()=>{
  const d=defaults('taxInstalmentReserve');
  for(const amounts of [[0,0,0,0],[10000,0,1000,500],[0,0,10000,15000],[50000,50000,50000,50000]])for(const monthlyReserve of [0,500,1000,10000]){
    const input={...d,monthlyReserve,march:amounts[0],june:amounts[1],september:amounts[2],december:amounts[3]},p=taxInstalmentLedger(input);
    let cumulative=0;const needs=amounts.map((amount,i)=>{cumulative+=amount;return cumulative-[2,5,8,11][i]*monthlyReserve;});
    near(p.required,Math.max(0,...needs));near(p.extra,Math.max(0,p.required-d.openingReserve));near(p.ending,d.openingReserve+12*monthlyReserve-amounts.reduce((s,v)=>s+v,0));
  }
});
test('zero instalments retain the opening reserve and do not pretend internal transfers paid tax',()=>{
  const d=defaults('taxInstalmentReserve'),p=taxInstalmentLedger({...d,march:0,june:0,september:0,december:0});near(p.totalPayments,0);near(p.required,0);near(p.ending,18000);assert.equal(p.firstGap,null);
  const result=planningResult('taxInstalmentReserve');assert.match(result.note,/not a payment to CRA/);assert.match(result.charts[0].evidence,/hypothetical payment amounts/);
  assert.ok(result.charts[1].series[0].rows.every(r=>/^2026-\d\d-\d\d$/.test(r.label)));
});
test('contribution paths match an independently expanded terminal-value equation',()=>{
  const d=defaults('contributionSequence');
  for(const initial of [0,10000,500000])for(const annualDeposit of [0,6000,50000])for(const contributionDelay of [0,2,9])for(const returnScale of [0,100,150])for(const reverse of [false,true]){
    const input={initial,annualDeposit,contributionDelay,returnScale},rates=(reverse?[...contributionReturns].reverse():contributionReturns).map(r=>r*returnScale/100);
    const expected=initial*product(rates)+rates.reduce((sum,_,i)=>sum+(i+1>contributionDelay?annualDeposit*product(rates.slice(i+1)):0),0),p=contributionSequencePath(input,reverse);
    near(p.value,expected);near(p.principal,initial+annualDeposit*(10-contributionDelay));near(p.growth,p.value-p.principal);
  }
});
test('the default contribution schedule has equal principal but different ending values',()=>{
  const d=defaults('contributionSequence'),early=contributionSequencePath(d),late=contributionSequencePath(d,true);
  near(early.rows[1].value,14500);near(late.rows[1].value,16500);near(early.value,95990.67609658831);near(late.value,77579.65222936627);near(early.principal,70000);near(late.principal,70000);
  near(early.value-late.value,18411.023867222044);
});
test('without deposits, the same return product gives equal endpoints; a last-year deposit has no return exposure',()=>{
  const d=defaults('contributionSequence');
  const none={...d,annualDeposit:0};near(contributionSequencePath(none).value,contributionSequencePath(none,true).value);
  const last={...d,contributionDelay:9};near(contributionSequencePath(last).value,d.initial*product(contributionReturns)+d.annualDeposit);near(contributionSequencePath(last).value,contributionSequencePath(last,true).value);
  const more={...d,initial:100000};near(contributionSequencePath(more).value-contributionSequencePath(more,true).value,contributionSequencePath(d).value-contributionSequencePath(d,true).value);
});
test('a fractional contribution delay is invalid and all new figures stay finite at field boundaries',()=>{
  assert.equal(validInputs('contributionSequence',{...defaults('contributionSequence'),contributionDelay:.5}),false);
  const slugs=new Set(planningGuides.map(g=>g.slug)),finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const guide of taxContributionGuides){assert.equal(guide.sections.length,6);assert.ok(guide.related.every(slug=>slugs.has(slug)));assert.ok(guide.sections.map(s=>s.html).join(' ').replace(/<[^>]*>/g,' ').split(/\s+/).length>800);
    const kind=guide.planning,d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
