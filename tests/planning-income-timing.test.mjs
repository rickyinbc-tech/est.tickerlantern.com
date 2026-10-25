import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult,validInputs } from '../src/planning-models.js';
import { helocSchedule,pensionIndexPath,paydayBudget } from '../src/planning-income-timing-models.js';
import { incomeTimingGuides } from '../src/planning-income-timing-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('HELOC interest-only cost uses the two rate periods without reducing principal',()=>{
  const input=defaults('helocPlan'),p=helocSchedule(input,0);
  near(p.interest,60000*(.07*1+.09*9));near(p.balance,60000);near(p.principal,0);near(p.paid,52800);
  near(p.rows[12].charge,350);near(p.rows[13].charge,450);
});
test('fixed principal HELOC arithmetic reconciles independently to arithmetic-series interest',()=>{
  const input=defaults('helocPlan'),p=helocSchedule(input);
  const firstYear=(60000*12-300*12*11/2)*.07/12;
  const laterYears=(56400*108-300*108*107/2)*.09/12;
  near(p.interest,firstYear+laterYears);near(p.interest,36768);near(p.principal,36000);near(p.balance,24000);near(p.paid,p.interest+p.principal);
  near(p.rows[13].charge,423);near(p.rows[13].payment,723);
});
test('HELOC final principal payment is capped and rate boundaries include immediate and post-horizon changes',()=>{
  const input={...defaults('helocPlan'),balance:650,principalMonthly:300},p=helocSchedule(input);
  near(p.rows[3].principal,650);near(p.rows[3].payment,50+50*.07/12);assert.ok(p.rows.slice(4).every(r=>r.payment===0));near(p.balance,0);
  const immediate=helocSchedule({...input,changeAfter:0});near(immediate.rows[1].charge,650*.09/12);
  const beyond=helocSchedule({...defaults('helocPlan'),years:5,changeAfter:60},0);near(beyond.interest,60000*.07*5);assert.ok(beyond.rows.slice(1).every(r=>r.rate===7));
  const empty=helocSchedule({...input,balance:0});near(empty.interest,0);near(empty.paid,0);
});
test('pension purchasing power uses twenty-five increases on a common price basis',()=>{
  const input=defaults('pensionIndex'),fixed=pensionIndexPath(input,'fixed'),capped=pensionIndexPath(input),full=pensionIndexPath(input,'full');
  near(fixed.end.real,36000/1.03**25);near(capped.end.income,36000*1.02**25);near(capped.end.real,36000*(1.02/1.03)**25);near(capped.end.gap,36000*(1.03**25-1.02**25));near(full.end.real,36000);near(full.end.gap,0);
  assert.equal(capped.rows.length,26);near(capped.rows[0].income,36000);near(capped.rows[1].income,36720);near(capped.rows[25].x,25);
});
test('index caps cannot exceed inflation and a surplus is not a negative funding gap',()=>{
  const input=defaults('pensionIndex'),flat=pensionIndexPath({...input,inflation:0,indexCap:8});near(flat.end.real,36000);near(flat.end.income,36000);
  const full=pensionIndexPath({...input,indexCap:8});near(full.end.real,36000);
  const fixed=pensionIndexPath({...input,indexCap:0});near(fixed.end.income,36000);
  const surplus=pensionIndexPath({...input,pension:100000,spending:1000});assert.ok(surplus.rows.every(r=>r.gap===0));
  const noIncome=pensionIndexPath({...input,pension:0});near(noIncome.end.gap,noIncome.end.cost);
});
test('2027 payday dates produce actual monthly counts and annual cash, not twelve average deposits',()=>{
  const input=defaults('paydayCalendar'),p=paydayBudget(input);
  assert.equal(p.paydays,26);assert.deepEqual(p.months.map(m=>m.paydays),[2,2,2,3,2,2,2,2,2,3,2,2]);
  assert.equal(p.rows.filter(r=>r.income>0).at(-1).date,'2027-12-24');assert.equal(p.rows.at(-1).date,'2027-12-31');assert.equal(p.rows.length,366);
  near(p.received,52000);near(p.spent,12*1800+365*60);near(p.ending,500+52000-43500);
  near(p.months[1].daily,28*60);near(p.months[0].daily,31*60);
});
test('opening reserve covers costs before same-day salary even when the day ends above zero',()=>{
  const input=defaults('paydayCalendar'),p=paydayBudget(input),payday=p.rows.find(r=>r.date==='2027-01-08');
  near(p.required,1800+8*60);near(p.extra,1780);near(payday.before,-1780);near(payday.end,220);
  const funded=paydayBudget({...input,cash:p.required});assert.ok(funded.rows.every(r=>r.before>=-1e-7&&r.end>=-1e-7));
  const centShort=paydayBudget({...input,cash:p.required-.01});assert.ok(centShort.rows.some(r=>r.before<0));
  const extra=paydayBudget({...input,cash:input.cash+1000});near(extra.required,p.required);near(extra.extra,p.extra-1000);near(extra.ending,p.ending+1000);
});
test('calendar date changes can produce twenty-seven receipts and preserve all twelve bill payments',()=>{
  const input=defaults('paydayCalendar'),p=paydayBudget({...input,firstPayday:1});assert.equal(p.paydays,27);near(p.received,54000);near(p.rows[1].before,input.cash-1800-60);
  for(const billDay of [1,7,14,21,28]){
    const q=paydayBudget({...input,billDay});assert.equal(q.rows.filter(r=>r.bill>0).length,12);near(q.spent,p.spent);near(q.received,52000);
  }
  const empty=paydayBudget({...input,pay:0,monthlyBill:0,dailySpend:0,cash:0});near(empty.required,0);near(empty.ending,0);
});
test('new calendars reject fractional dates and each article has a distinct topic and detailed source notes',()=>{
  for(const [kind,key] of [['helocPlan','changeAfter'],['helocPlan','years'],['pensionIndex','years'],['paydayCalendar','firstPayday'],['paydayCalendar','billDay']])assert.equal(validInputs(kind,{...defaults(kind),[key]:defaults(kind)[key]+.5}),false);
  assert.equal(new Set(incomeTimingGuides.map(g=>g.slug)).size,3);
  for(const g of incomeTimingGuides){assert.ok(g.sections.length>=6);assert.ok(g.sources.every(s=>s.url.startsWith('https://')&&s.note.includes('25 October 2026')));assert.ok(g.sections.map(s=>s.html).join(' ').replace(/<[^>]*>/g,' ').split(/\s+/).length>750);}
});
test('four accessible figures stay finite at all supported individual and combined input limits',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['helocPlan','pensionIndex','paydayCalendar']){
    const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
