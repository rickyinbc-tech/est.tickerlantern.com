import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { studentBudget, promotionalDebt, promoPaymentNeeded, reimbursementPlan } from '../src/planning-cost-timing-models.js';
import { tuitionSource } from '../src/planning-tuition-data.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('tuition snapshot preserves current-dollar undergraduate observations, provincial coverage and preliminary status',()=>{
  assert.equal(tuitionSource.period,'2026/2027');assert.equal(tuitionSource.preliminary,true);assert.equal(tuitionSource.released,'2026-09-16');
  assert.deepEqual(tuitionSource.national.map(r=>r.value),[8021,42062]);assert.equal(tuitionSource.provinces.length,10);
  const all=[...tuitionSource.national,...tuitionSource.provinces];assert.equal(new Set(all.map(r=>r.vector)).size,12);assert.equal(new Set(tuitionSource.provinces.map(r=>r.label)).size,10);
  for(const r of all)assert.ok(Number.isInteger(r.value)&&r.value>0);assert.match(tuitionSource.archiveSHA256,/^[0-9a-f]{64}$/);assert.match(tuitionSource.weights,/2023\/2024/);
});
test('student budget separates fixed observed charts from editable costs and does not prorate tuition by living months',()=>{
  const input=defaults('tuitionBudget'),p=studentBudget(input);near(p.living,11200);near(p.total,22221);near(p.gap,10221);near(p.tuitionShare,8021/22221);
  const longer=studentBudget({...input,months:12});near(longer.total-p.total,1400*4);
  assert.deepEqual(planningResult('tuitionBudget').charts.slice(0,2),planningResult('tuitionBudget',{...input,tuition:60000,months:12}).charts.slice(0,2));
  const zero=studentBudget({...input,tuition:0,fees:0,living:0,books:0,setup:0});assert.equal(zero.tuitionShare,null);near(zero.gap,0);
  assert.match(renderResult(planningResult('tuitionBudget',{...input,tuition:0,fees:0,living:0,books:0,setup:0})),/No modeled costs/);
});
test('transfer fee and first twelve zero-rate cycles reconcile before the follow-on rate starts',()=>{
  const input=defaults('promoTransfer'),p=promotionalDebt(input,true);near(p.rows[0].value,10300);near(p.fee,300);near(p.promoEnd,5500);
  near(p.rows[12].value,5500);near(p.rows[13].value,5500*(1+.22/12)-400);near(promoPaymentNeeded(input),858.34);
  const funded=promotionalDebt({...input,payment:promoPaymentNeeded(input)},true);assert.equal(funded.months,12);near(funded.promoEnd,0);near(funded.interest,0);
  const roundedDown=promotionalDebt({...input,payment:858.33},true);assert.ok(roundedDown.promoEnd>0&&roundedDown.months>12);
});
test('post-promotion payoff agrees with an independent fixed-payment closed form',()=>{
  const input=defaults('promoTransfer'),r=.22/12,opening=5500,n=Math.ceil(-Math.log(1-opening*r/400)/Math.log1p(r));
  const beforeLast=opening*(1+r)**(n-1)-400*((1+r)**(n-1)-1)/r;
  const expectedInterest=12*400+(n-1)*400+beforeLast*(1+r)-10300,p=promotionalDebt(input,true);
  assert.equal(p.months,12+n);near(p.interest,expectedInterest);near(p.interest,895.3490052840532);near(p.paid,input.balance+p.fee+p.interest);
  const current=promotionalDebt(input,false);assert.equal(current.months,33);near(current.interest,3044.2053840783165);near(current.paid,input.balance+current.interest);
});
test('zero promotion, zero debt and incomplete schedules remain explicit',()=>{
  const input={...defaults('promoTransfer'),promoMonths:0};assert.equal(promoPaymentNeeded(input),null);near(promotionalDebt(input,true).rows[1].value,10300*(1+.22/12)-400);
  const empty=promotionalDebt({...input,balance:0},true);assert.equal(empty.months,0);near(empty.fee,0);
  const unpaid=promotionalDebt({...input,payment:0},true);assert.equal(unpaid.months,null);assert.equal(unpaid.rows.length,121);near(unpaid.rows.at(-1).value,10300+unpaid.interest);
  const free=promotionalDebt({...input,currentRate:0,followRate:0,payment:1000},true);assert.equal(free.months,11);near(free.interest,0);near(free.paid,10300);
});
test('claim sequence consumes the remaining deductible and insurer-payment maximum without treating coverage as invoice coverage',()=>{
  const p=reimbursementPlan(defaults('reimbursement'));assert.deepEqual(p.claims.map(c=>c.reimbursement),[320,400,400,380,0,0]);
  near(p.reimbursement,1500);near(p.gross,3600);near(p.netCost,2100);near(p.deductibleLeft,0);near(p.maximumLeft,0);
  assert.deepEqual(p.claims.map(c=>c.receiptMonth),[3,4,5,6,7,8]);
});
test('claim cash needs include invoices before month-end resources, even when month-end cash is positive',()=>{
  const input=defaults('reimbursement'),p=reimbursementPlan(input);near(p.rows[4].after,-130);near(p.rows[4].end,420);near(p.required,1730);near(p.extra,230);near(p.ending,600);
  near(p.ending,input.cash+input.surplus*(input.claimMonths+input.delay)+p.reimbursement-p.gross);
  const sameMonth=reimbursementPlan({...input,bill:1000,eligible:1000,deductible:0,coverage:100,maximum:1000,claimMonths:1,delay:0,surplus:0,cash:0});
  near(sameMonth.netCost,0);near(sameMonth.required,1000);near(sameMonth.rows[1].after,-1000);near(sameMonth.rows[1].end,0);
});
test('receipt delay changes starting cash needs without changing the benefit calculation',()=>{
  const input=defaults('reimbursement'),plans=[0,1,2,4,6].map(delay=>reimbursementPlan({...input,delay}));
  assert.deepEqual(plans.map(p=>p.required),[1350,1350,1730,2530,2850]);for(const p of plans)near(p.reimbursement,1500);
  const noBenefit=reimbursementPlan({...input,maximum:0});near(noBenefit.reimbursement,0);near(noBenefit.required,600*6-150*5);
  const cappedEligible=reimbursementPlan({...input,bill:100,eligible:5000,coverage:100,deductible:0,maximum:10000});for(const c of cappedEligible.claims)assert.ok(c.reimbursement<=100);
});
test('promotion and claim calendars require whole months',()=>{
  for(const [kind,key] of [['promoTransfer','promoMonths'],['reimbursement','claimMonths'],['reimbursement','delay']])assert.equal(validInputs(kind,{...defaults(kind),[key]:1.5}),false);
});
test('cost and timing graphics retain finite values and accessible data at supported field edges',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['tuitionBudget','promoTransfer','reimbursement']){
    const d=defaults(kind),inputs=[d,...definitions[kind].fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}])];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
