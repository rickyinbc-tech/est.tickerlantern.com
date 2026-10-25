import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { orderedDebt, goalAllocation, minimumGoalBudget, rrifFactor, rrifCash, rrifRules } from '../src/planning-priorities-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('debt order holds the same budget while directing the first extra payment to different balances',()=>{
  const input=defaults('debtOrder'),a=orderedDebt(input,'avalanche'),s=orderedDebt(input,'snowball');
  near(a.budget,635);near(s.budget,635);near(a.rows[1].value,13510);near(s.rows[1].value,13510);
  near(a.rows[1].balances[0],5000*(1+.2/12)-125-300);near(s.rows[1].balances[1],1000*(1+.1/12)-50-300);
  assert.equal(a.months,25);assert.equal(s.months,25);near(a.interest,1630.859982872812);near(s.interest,1712.8679584288475);
  near(a.paid-a.principal,a.interest);near(s.paid-s.principal,s.interest);
});
test('zero-rate debt schedules match total-principal arithmetic and keep released base payments in the budget',()=>{
  const input={...defaults('debtOrder'),rateA:0,rateB:0,rateC:0};
  for(const strategy of ['avalanche','snowball']){const p=orderedDebt(input,strategy);assert.equal(p.months,Math.ceil(14000/635));near(p.interest,0);near(p.paid,14000);}
  const p=orderedDebt({...input,balanceA:100,balanceB:1000,balanceC:0,baseA:100,baseB:100,extra:0},'avalanche');
  near(p.budget,200);near(p.rows[2].value,700);assert.equal(p.months,6);near(p.paid,1100);
});
test('single-debt priority schedules agree with the closed-form fixed-payment payoff calculation',()=>{
  const principal=10000,payment=400,r=.01,n=Math.ceil(-Math.log(1-principal*r/payment)/Math.log1p(r));
  const beforeLast=principal*(1+r)**(n-1)-payment*((1+r)**(n-1)-1)/r;
  const p=orderedDebt({...defaults('debtOrder'),balanceA:principal,rateA:12,baseA:payment,balanceB:0,balanceC:0,extra:0},'avalanche');
  assert.equal(p.months,n);near(p.interest,(n-1)*payment+beforeLast*(1+r)-principal);
});
test('unpaid debt is labelled incomplete at the horizon, and zero starting debts do not invent a budget',()=>{
  const input={...defaults('debtOrder'),baseA:0,baseB:0,baseC:0,extra:0},p=orderedDebt(input,'avalanche');
  assert.equal(p.months,null);assert.equal(p.complete,false);assert.equal(p.rows.length,121);assert.ok(p.rows.at(-1).value>p.principal);
  near(p.rows.at(-1).value-p.principal,p.interest);
  const zero=orderedDebt({...input,balanceA:0,balanceB:0,balanceC:0,extra:300},'snowball');assert.equal(zero.months,0);near(zero.budget,0);near(zero.interest,0);
});
test('goal allocation preserves each deadline, caps targets and tracks later unallocated cash separately',()=>{
  const input=defaults('multipleGoals'),d=goalAllocation(input,'deadline'),e=goalAllocation(input,'equal');
  near(minimumGoalBudget(input),1000);assert.deepEqual(d.goals.map(g=>g.funded),[6000,14400,12000]);assert.deepEqual(e.goals.map(g=>g.funded),[3600,18000,9000]);
  near(d.shortfall,3600);near(e.shortfall,5400);near(e.unallocated,1800);
  for(const p of [d,e]){for(const row of p.rows)near(row.value+row.unallocated,input.budget*row.x);for(const g of p.goals)assert.ok(g.funded>=0&&g.funded<=g.target+1e-7);}
});
test('the constant goal-budget threshold funds deadline-first targets and correctly combines tied deadlines',()=>{
  const input=defaults('multipleGoals'),threshold=minimumGoalBudget(input);near(goalAllocation({...input,budget:threshold},'deadline').shortfall,0);assert.ok(goalAllocation({...input,budget:threshold-1},'deadline').shortfall>0);
  const tied={...input,deadlineA:12,deadlineB:12,deadlineC:12,budget:3000};near(minimumGoalBudget(tied),3000);
  near(goalAllocation(tied,'deadline').shortfall,0);near(goalAllocation(tied,'equal').shortfall,0);
  const empty={...input,goalA:0,goalB:0,goalC:0};near(minimumGoalBudget(empty),0);near(goalAllocation(empty,'equal').unallocated,input.budget*36);
});
test('ordinary RRIF factors preserve formula boundaries, table values and the age-95 cap',()=>{
  assert.equal(rrifRules.reviewed,'2026-10-25');assert.equal(rrifRules.factors.length,25);
  near(rrifFactor(55),1/35);near(rrifFactor(65),.04);near(rrifFactor(70),.05);near(rrifFactor(71),.0528);near(rrifFactor(72),.054);near(rrifFactor(80),.0682);near(rrifFactor(94),.1879);near(rrifFactor(95),.2);near(rrifFactor(100),.2);
});
test('RRIF gross minimum, request, asset cap and hypothetical allowance remain separate',()=>{
  const input=defaults('rrifSpending'),p=rrifCash(input);near(p.minimum,27000);near(p.gross,30000);near(p.allowance,7500);near(p.surplus,4500);near(p.remaining,470000);
  const below=rrifCash({...input,requested:0});near(below.gross,27000);near(below.surplus,2250);
  const capped=rrifCash({...input,balance:10000,requested:500000});near(capped.gross,10000);near(capped.remaining,0);
  const empty=rrifCash({...input,balance:0});near(empty.minimum,0);near(empty.gross,0);near(empty.surplus,-18000);
});
test('goal deadlines and RRIF age require whole values',()=>{
  for(const key of ['deadlineA','deadlineB','deadlineC'])assert.equal(validInputs('multipleGoals',{...defaults('multipleGoals'),[key]:12.5}),false);
  assert.equal(validInputs('rrifSpending',{...defaults('rrifSpending'),age:72.5}),false);
});
test('priority graphics retain finite data, explicit incomplete states and accessible tables at field edges',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['debtOrder','multipleGoals','rrifSpending']){
    const d=defaults(kind),inputs=[d,...definitions[kind].fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}])];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
