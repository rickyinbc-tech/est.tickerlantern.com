import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { basketExposure, payCalendar, raiseBudget } from '../src/planning-budget-exposure-models.js';
import { cpi2025 } from '../src/planning-budget-exposure-data.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('dated CPI observations stay separate from the weighted hypothetical budget',()=>{
  const input=defaults('personalBasket'),p=basketExposure(input);
  near(p.base,4000);near(p.change,54+25.6+1.5+4.5+.5+5+3.9+.8);near(p.repriced,4095.8);near(p.rate,.02395);
  near(cpi2025.headline,2.1);assert.equal(cpi2025.rows.length,8);
  const edited=planningResult('personalBasket',{...input,shelter:10000});
  assert.deepEqual(edited.charts[0],planningResult('personalBasket').charts[0]);
  const doubled=Object.fromEntries(Object.entries(input).map(([k,v])=>[k,v*2]));near(basketExposure(doubled).rate,p.rate);near(basketExposure(doubled).change,2*p.change);
  const zero=basketExposure(Object.fromEntries(Object.keys(input).map(k=>[k,0])));assert.equal(zero.rate,null);near(zero.repriced,0);
});

test('calendar counts known 2027 dates and reconciles cash to annual receipts and outflows',()=>{
  const input=defaults('payCalendar'),p=payCalendar(input);
  assert.equal(p.payCount,26);assert.deepEqual(p.months.map(m=>m.count),[2,2,2,3,2,2,2,2,2,3,2,2]);
  assert.equal(p.events.filter(r=>r.pay).at(-1).date,'2027-12-24');
  near(p.income,59800);near(p.expenses,51600);near(p.saving,6000);near(p.ending,4200);
  near(p.months.reduce((s,m)=>s+m.other,0),18000);
  near(p.points.at(-1).value,input.cash+p.income-p.expenses-p.saving);
  near(p.required,3436.986301369863);near(p.extra,1436.986301369863);
  const funded=payCalendar({...input,cash:p.required});assert.ok(funded.points.every(r=>r.value>=-1e-8));
  near(payCalendar({...input,cash:p.required+1000}).extra,0);
});

test('moving a savings transfer changes funding needs while annual cash and saving stay equal',()=>{
  const input=defaults('payCalendar'),early=payCalendar({...input,savingDay:1}),late=payCalendar({...input,savingDay:28}),end=payCalendar(input,true);
  near(early.saving,6000);near(late.saving,early.saving);near(early.income,late.income);near(early.ending,late.ending);near(end.ending,late.ending);near(early.required-late.required,500);
  assert.equal(early.events.filter(e=>e.saving).length,12);assert.equal(late.events.filter(e=>e.saving).length,12);assert.equal(end.events.filter(e=>e.saving).length,12);
  assert.equal(late.events.find(e=>e.saving).date,'2027-01-28');assert.equal(end.events.find(e=>e.saving).date,'2027-01-31');
});

test('same-day debits require cash before pay even when closing cash is positive',()=>{
  const input={...defaults('payCalendar'),firstPayDay:1,billDay:1,fixedBills:1000,otherSpending:0,savingTransfer:0,cash:0};
  const p=payCalendar(input);assert.equal(p.payCount,27);near(p.required,1000);near(p.points[1].value,-1000);near(p.points[2].value,1300);
  assert.ok(p.points.every((r,i)=>i===0||r.x>p.points[i-1].x));
  const nothing=payCalendar({...input,netPay:0,fixedBills:0});near(nothing.required,0);near(nothing.ending,0);
  const deficit=payCalendar({...input,netPay:0,savingTransfer:100});near(deficit.ending,-13200);near(deficit.required,13200);
});

test('expense price and lifestyle factors compound while income uses a separate net rate',()=>{
  const input=defaults('raiseBudget'),p=raiseBudget(input);
  near(p.rows[0].income,5000);near(p.rows[0].expenses,4200);near(p.rows[1].income,5150);near(p.rows[1].expenses,4200*1.02**2);
  near(p.rows.at(-1).income,5000*1.03**19);near(p.rows.at(-1).expenses,4200*1.02**38);
  near(p.rows.at(-1).surplus,-146.12466270212826);near(p.unfunded,2417.834401302767);
  near(p.balance,211094.2087177078);near(p.realBalance,p.balance/1.02**20);
});

test('saved surpluses match an independently expanded future-value equation and deficits remain separate',()=>{
  const input=defaults('raiseBudget'),p=raiseBudget(input),rate=Math.expm1(Math.log(1.05)/12),horizon=20*12;
  let expanded=0,contributions=0,gaps=0;
  for(let month=1;month<=horizon;month++){
    const k=Math.floor((month-1)/12),surplus=5000*1.03**k-4200*1.02**(2*k);
    expanded+=Math.max(0,surplus)*(1+rate)**(horizon-month);contributions+=Math.max(0,surplus);gaps+=Math.max(0,-surplus);
  }
  near(p.balance,expanded);near(p.contributions,contributions);near(p.unfunded,gaps);
  const zero=raiseBudget({...input,returnRate:0});near(zero.balance,p.contributions);near(zero.unfunded,p.unfunded);
  const noLifestyle=raiseBudget(input,0);assert.ok(noLifestyle.balance>p.balance);near(noLifestyle.unfunded,0);
  const deficit=raiseBudget({...input,netIncome:500,expenses:1000,netGrowth:0,priceGrowth:0,lifestyleGrowth:0,years:2});near(deficit.balance,0);near(deficit.unfunded,12000);
});

test('growth matrix shows signed cash-flow gaps and does not depend on the investment return',()=>{
  const input=defaults('raiseBudget'),chart=planningResult('raiseBudget',input).charts[3];assert.equal(chart.signed,true);
  assert.ok(chart.rows.flatMap(r=>r.values).some(v=>v<0));assert.ok(chart.rows.flatMap(r=>r.values).some(v=>v>0));
  assert.deepEqual(chart,planningResult('raiseBudget',{...input,returnRate:-5}).charts[3]);
});

test('calendar days and horizons require whole inputs and reject incomplete or nonfinite numbers',()=>{
  for(const [kind,key] of [['payCalendar','firstPayDay'],['payCalendar','billDay'],['payCalendar','savingDay'],['raiseBudget','years']])assert.equal(validInputs(kind,{...defaults(kind),[key]:1.5}),false);
  assert.equal(validInputs('personalBasket',{...defaults('personalBasket'),food:NaN}),false);
  assert.throws(()=>planningResult('payCalendar',{...defaults('payCalendar'),firstPayDay:0}));
});

test('new article charts stay finite at supported limits and include accessible data tables',()=>{
  function finite(value){if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);}
  for(const kind of ['personalBasket','payCalendar','raiseBudget']){
    const d=defaults(kind),fields=definitions[kind].fields;
    const cases=[d,...fields.flatMap(([k,,,min,max])=>[{...d,[k]:min},{...d,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
    for(const input of cases){const p=planningResult(kind,input);finite(p);assert.equal(p.charts.length,4);assert.equal(new Set(p.charts.map(c=>c.id)).size,4);
      for(const width of [300,760]){const html=renderResult(p,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
    }
  }
});
