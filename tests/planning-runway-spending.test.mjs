import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult,validInputs } from '../src/planning-models.js';
import { jobLossCalendar,retirementSpending,eventCashCalendar } from '../src/planning-runway-spending-models.js';
import { runwaySpendingGuides } from '../src/planning-runway-spending-guides.js';
import { planningGuides } from '../src/planning-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('job-loss receipts have separate windows, a single settlement and temporary spending changes',()=>{
  const input=defaults('jobLossRunway'),p=jobLossCalendar(input),normal=jobLossCalendar(input,false);
  near(p.rows[0].cash,17000);near(p.rows[1].cash,14600);near(p.rows[2].cash,24200);
  assert.deepEqual(p.rows.filter(r=>r.support>0).map(r=>r.x),[3,4,5,6,7,8]);
  near(p.supportTotal,6*1800);near(p.earningsTotal,9*4200);near(p.spendingTotal,9*3900+9*4500);
  near(p.required,3400);near(p.ending,18000-1000+12000+18*1500+6*1800+9*4200-9*3900-9*4500);
  near(p.ending-normal.ending,9*600);assert.equal(p.firstGap,null);
});
test('a later settlement leaves a real early gap despite a positive endpoint',()=>{
  const input={...defaults('jobLossRunway'),reserve:3000,settlementMonth:6},p=jobLossCalendar(input);
  assert.equal(p.firstGap,1);near(p.rows[1].cash,-400);near(p.rows[5].cash,-4600);near(p.required,7600);near(p.extra,4600);assert.ok(p.ending>0);
  const funded=jobLossCalendar({...input,reserve:7600});assert.ok(funded.rows.every(r=>r.cash>=0));near(funded.extra,0);
  assert.equal(jobLossCalendar({...input,reserve:0,upfront:1000}).firstGap,0);
});
test('job start stops temporary support, while settlement and continuing income remain independently scheduled',()=>{
  const input=defaults('jobLossRunway'),p=jobLossCalendar({...input,jobMonth:4,settlementMonth:9});
  near(p.supportTotal,1800);near(p.rows[4].support,0);near(p.rows[4].spending,4500);near(p.rows[4].income,5700);
  near(p.rows[9].settlement,12000);near(p.rows.reduce((s,r)=>s+r.settlement,0),12000);
  const late=jobLossCalendar({...input,supportDelay:12,supportMonths:12,jobMonth:19});near(late.supportTotal,6*1800);near(late.earningsTotal,0);
  const cut=jobLossCalendar({...input,cut:10000});assert.ok(cut.rows.filter(r=>r.x>0&&r.x<10).every(r=>r.spending===0));
});
test('retirement phases use a quantity change and the correct elapsed price periods',()=>{
  const input=defaults('retirementPhases'),p=retirementSpending(input),y11=p.rows[10],y21=p.rows[20];
  near(p.rows[0].spending,54000);near(y11.essential,36000*1.02**10);near(y11.discretionary,18000*.6*1.02**10);near(y11.real,46800);
  near(p.rows[19].care,0);near(y21.care,18000*1.04**20);near(y21.real,46800+18000*(1.04/1.02)**20);
  near(p.rows[29].gap,10800*1.02**29+18000*1.04**29);near(p.peakGap,75314.84879030405);
  near(p.cumulativeGap,p.rows.reduce((s,r)=>s+r.gap,0));
});
test('equal price rates preserve the real category budget and income surpluses are not silently carried forward',()=>{
  const d=defaults('retirementPhases'),equal=retirementSpending({...d,laterShare:100,careInflation:2});
  for(const r of equal.rows)near(r.real,r.x<21?54000:72000);
  const p=retirementSpending({...d,essential:30000,discretionary:0,care:0,income:50000,incomeGrowth:0,inflation:5});
  near(p.rows[0].gap,0);assert.ok(p.rows.at(-1).gap>0);
  assert.ok(p.cumulativeGap>Math.max(0,p.totalSpending-p.totalIncome));
  const immediate=retirementSpending({...d,careYear:1});near(immediate.rows[0].care,18000);near(immediate.rows[0].spending,72000);
});
test('event quotes count the deposit once and exclude an event-month saving transfer',()=>{
  const p=eventCashCalendar(defaults('eventBudget'));
  near(p.base,18000);near(p.deposit,5400);near(p.contingency,1800);near(p.final,14400);near(p.total,19800);
  near(p.rows[0].cash,600);near(p.rows[11].cash,11600);near(p.rows[12].cash,-2800);near(p.ending,-2800);near(p.extra,2800);near(p.monthlyTarget,13800/11);
  near(p.rows.reduce((s,r)=>s+r.bill,0),19800);near(p.rows.reduce((s,r)=>s+r.saving,0),11000);
});
test('a monthly event contribution cannot finance an immediate booking gap',()=>{
  const d=defaults('eventBudget'),p=eventCashCalendar({...d,cash:1000,monthly:10000});near(p.bookingGap,4400);near(p.extra,4400);assert.ok(p.ending>0);
  assert.equal(planningResult('eventBudget',{...d,cash:1000,monthly:10000}).metrics[2][3],'Fund the booking deposit first');
  const exact=eventCashCalendar({...d,monthly:13800/11});near(exact.ending,0);near(exact.extra,0);
  const noDeposit=eventCashCalendar({...d,depositPercent:0});near(noDeposit.deposit,0);near(noDeposit.final,19800);near(noDeposit.ending,-2800);
});
test('event guest costs scale independently of fixed costs and the full allowance is spent only with the final bill',()=>{
  const d=defaults('eventBudget'),p=eventCashCalendar({...d,guests:0,contingencyPercent:0});near(p.base,10000);near(p.total,10000);
  const all=eventCashCalendar({...d,depositPercent:100});near(all.deposit,18000);near(all.final,1800);near(all.extra,12000);
});
test('all calendar controls reject fractional periods and preserve last-valid-scenario contract',()=>{
  for(const [kind,key] of [['jobLossRunway','settlementMonth'],['jobLossRunway','supportDelay'],['jobLossRunway','supportMonths'],['jobLossRunway','jobMonth'],['retirementPhases','careYear'],['eventBudget','guests'],['eventBudget','eventMonth']])assert.equal(validInputs(kind,{...defaults(kind),[key]:defaults(kind)[key]+.5}),false);
});
test('new article links resolve, full explanations are present and chart specifications remain finite at field limits',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const guide of runwaySpendingGuides){
    assert.ok(guide.related.every(slug=>slugs.has(slug)));assert.equal(guide.sections.length,6);
    assert.ok(guide.sections.map(s=>s.html).join(' ').replace(/<[^>]*>/g,' ').split(/\s+/).length>850);
    const kind=guide.planning,d=defaults(kind),fields=definitions[kind].fields;
    const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
