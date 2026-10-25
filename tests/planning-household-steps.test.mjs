import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { basicDownPayment, homePurchaseCash, sharedHousehold, educationLoanSchedule, studentLoanPlan } from '../src/planning-household-steps-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('basic down-payment thresholds apply the marginal portion below 1.5 million and the whole-price rule at it',()=>{
  near(basicDownPayment(100000),5000);near(basicDownPayment(500000),25000);near(basicDownPayment(700000),45000);
  near(basicDownPayment(1000000),75000);near(basicDownPayment(1499999),124999.9);near(basicDownPayment(1500000),300000);near(basicDownPayment(2000000),400000);
});
test('home cash requirement credits a paid deposit once and keeps post-deposit available cash separate',()=>{
  const input=defaults('homeCash'),p=homePurchaseCash(input);
  near(p.down,70000);near(p.deposit,20000);near(p.downDue,50000);near(p.closing,21000);near(p.total,108000);near(p.remaining,88000);near(p.gap,8000);
  near(p.remaining,p.downDue+p.closing+input.fixedCosts+input.setup+input.reserve);
  const beforeDeposit=homePurchaseCash({...input,deposit:0,cash:100000});near(beforeDeposit.gap,p.gap);
  const funded=homePurchaseCash({...input,cash:90000});near(funded.gap,0);near(funded.signedGap,-2000);
});
test('a requested percentage cannot bypass the basic minimum or the fully credited deposit convention',()=>{
  const input=defaults('homeCash');near(homePurchaseCash({...input,downPercent:0}).down,45000);
  const depositFloor=homePurchaseCash({...input,downPercent:5,deposit:100000});near(depositFloor.down,100000);near(depositFloor.downDue,0);
  const capped=homePurchaseCash({...input,price:100000,deposit:200000});near(capped.deposit,100000);near(capped.down,100000);near(capped.downDue,0);
});
test('both bill-sharing rules preserve the same commitment and reconcile individual and household remainders',()=>{
  const input=defaults('sharedBills'),p=sharedHousehold(input);near(p.commitment,4800);near(p.afterPersonal,7200);near(p.unassigned,2400);
  assert.deepEqual(p.rules,[{label:'Equal shares',a:2400,b:2400},{label:'Income shares',a:3000,b:1800}]);
  for(const rule of p.rules){near(rule.a+rule.b,p.commitment);near(input.incomeA-input.personalA-rule.a+input.incomeB-input.personalB-rule.b,p.unassigned);}
  const changed=sharedHousehold({...input,personalA:4000});assert.deepEqual(changed.rules,p.rules);near(changed.unassigned,-1100);
});
test('zero incomes omit undefined income weights while one income assigns the full total to its earner',()=>{
  const input=defaults('sharedBills'),zero=sharedHousehold({...input,incomeA:0,incomeB:0});assert.equal(zero.rules.length,1);near(zero.unassigned,-5600);
  const single=sharedHousehold({...input,incomeA:0});near(single.rules[1].a,0);near(single.rules[1].b,4800);
  const result=planningResult('sharedBills',{...input,incomeA:0,incomeB:0});assert.equal(result.charts[0].rows.length,1);assert.equal(result.charts[2].rows.length,2);
});
test('interest-free scheduled amounts round up to cents and cap the final payment without erasing the opening amount',()=>{
  const p=educationLoanSchedule(20000,0,120);near(p.payment,166.67);near(p.interest,0);near(p.paid,20000);near(p.rows.at(-1).value,0);near(p.rows.at(-1).payment,166.27);
  for(let month=0;month<120;month++)near(p.rows[month].value,20000-month*166.67);
  const zero=educationLoanSchedule(0,18,180);near(zero.payment,0);near(zero.interest,0);near(zero.paid,0);assert.equal(zero.rows.length,181);
});
test('interest-bearing repayment agrees with independent closed-form balances and a capped final payment',()=>{
  const p=educationLoanSchedule(10000,6,120),r=.06/12,scheduled=111.03,n=119;
  const beforeLast=10000*(1+r)**n-scheduled*((1+r)**n-1)/r,final=beforeLast*(1+r);
  near(p.payment,scheduled);near(p.rows[119].value,beforeLast);near(p.rows[120].payment,final);near(p.rows[120].value,0);
  near(p.paid,n*scheduled+final);near(p.interest,p.paid-10000);near(p.interest,3322.043464401581);
});
test('budget is a comparison and does not change the amortization schedules',()=>{
  const input=defaults('studentLoans'),p=studentLoanPlan(input);near(p.payment,277.7);near(p.gap,0);
  const low=studentLoanPlan({...input,budget:200});near(low.gap,77.7);assert.deepEqual(low.federal,p.federal);assert.deepEqual(low.other,p.other);
  const short=studentLoanPlan({...input,repayMonths:60}),long=studentLoanPlan({...input,repayMonths:180});assert.ok(short.payment>long.payment);assert.ok(short.other.interest<long.other.interest);
});
test('loan term rejects fractional periods and rounding clears balances at supported term and rate edges',()=>{
  assert.equal(validInputs('studentLoans',{...defaults('studentLoans'),repayMonths:120.5}),false);
  for(const balance of [0,.01,1,20000,100000])for(const rate of [0,3,6,18])for(const months of [12,60,120,180]){
    const p=educationLoanSchedule(balance,rate,months);near(p.rows.at(-1).value,0);near(p.paid,balance+p.interest);
    assert.ok(p.rows.every(r=>r.payment>=0&&r.payment<=p.payment+1e-7));
  }
});
test('household models keep four finite accessible graphics at supported single-field and combined edges',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['homeCash','sharedBills','studentLoans']){
    const d=defaults(kind),fields=definitions[kind].fields;
    const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
