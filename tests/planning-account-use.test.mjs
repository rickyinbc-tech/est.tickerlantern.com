import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, validInputs, planningResult } from '../src/planning-models.js';
import { tfsaTimeline, respBudget, mortgageCashChoice, prepayComparison } from '../src/planning-account-use-models.js';
import { mortgageMonthlyRate } from '../src/planning-more-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('ordinary TFSA withdrawal changes value now and room next year, with capped same-year recontribution',()=>{
  const p=tfsaTimeline(defaults('tfsaCalendar'));
  assert.deepEqual(p.states.map(s=>s.room),[7000,2000,2000,0,17000,2000]);
  assert.deepEqual(p.states.map(s=>s.balance),[40000,45000,35000,37000,37000,52000]);
  near(p.blockedLater,8000);near(p.unplaced,8000);near(p.nextRoom,17000);
});
test('TFSA requests beyond assets or room never create a modeled excess or fictitious restored room',()=>{
  const input={...defaults('tfsaCalendar'),balance:1000,room:0,withdrawal:100000,newRoom:0};const p=tfsaTimeline(input);
  near(p.first,0);near(p.later,0);near(p.withdrawal,1000);near(p.nextRoom,1000);near(p.next,1000);near(p.balance,1000);
  for(const s of p.states)assert.ok(s.balance>=0&&s.room>=0);
  const noWithdrawal=tfsaTimeline({...defaults('tfsaCalendar'),withdrawal:0}),largeWithdrawal=tfsaTimeline({...defaults('tfsaCalendar'),withdrawal:40000});
  near(noWithdrawal.blockedLater,largeWithdrawal.blockedLater);
});
test('TFSA contribution and value ledgers reconcile separately over all capped events',()=>{
  for(const room of [0,7000,200000])for(const balance of [0,40000,1000000]){
    const input={...defaults('tfsaCalendar'),room,balance},p=tfsaTimeline(input),deposits=p.first+p.later+p.next;
    near(p.balance,balance+deposits-p.withdrawal);near(p.room,room+p.withdrawal+input.newRoom-deposits);
    near(p.unplaced,input.first+input.later+input.next-deposits);
  }
});
test('RESP gross EAP, allowance and contribution refund fund the default net education budget once',()=>{
  const input=defaults('respWithdrawals'),p=respBudget(input);near(p.eap,10000);near(p.allowance,1000);near(p.netEap,9000);near(p.contribution,11000);near(p.gap,0);
  near(p.remainingContributions,9000);near(p.remainingEap,5000);
  near(input.outside+p.eap+p.contribution-p.allowance-input.costs,p.cash);
});
test('RESP capacity caps and the voluntary education-budget cap do not invent a grossed-up entitlement',()=>{
  const base=defaults('respWithdrawals');
  const limited=respBudget({...base,eapCapacity:3000,request:50000});near(limited.eap,3000);near(limited.contribution,17300);
  const small=respBudget({...base,costs:1000,outside:0,allowance:50,contributions:0});near(small.eap,1000);near(small.netEap,500);near(small.gap,500);
  const noNeed=respBudget({...base,costs:0});near(noNeed.eap,0);near(noNeed.contribution,0);near(noNeed.cash,4000);
  const short=respBudget({...base,contributions:0,eapCapacity:0});near(short.gap,20000);
});
test('mortgage prepayment default reconciles interest avoided, savings growth and the net-position difference',()=>{
  const p=prepayComparison(defaults('mortgagePrepay'));near(p.prepay.payment,1660.4188628564798);near(p.prepay.applied,20000);near(p.prepay.debt,238405.0944446848);near(p.liquid.debt,263389.1629739284);
  near(p.liquid.cash,22081.616064);near(p.prepay.cash,0);near(p.interestAvoided,4984.068529242584);near(p.advantage,2902.4524652435794);
  near(p.advantage,p.interestAvoided+p.growthDifference);
});
test('before either mortgage is repaid, the difference agrees with independent compound-factor identities',()=>{
  const input=defaults('mortgagePrepay'),p=prepayComparison(input),loanRate=mortgageMonthlyRate(input.mortgageRate);
  const avoided=input.lump*((1+loanRate)**(input.years*12)-1),cashGrowth=input.lump*((1+input.cashRate/100)**input.years-1);
  near(p.interestAvoided,avoided);near(p.advantage,avoided-cashGrowth);
});
test('prepayment comparison saves freed payments, caps the lump sum and preserves zero-rate accounting after payoff',()=>{
  const input={...defaults('mortgagePrepay'),balance:10000,lump:20000,amortYears:5,years:10,mortgageRate:0,cashRate:0};const p=prepayComparison(input);
  near(p.prepay.applied,10000);near(p.prepay.rows[0].cash,10000);near(p.prepay.debt,0);near(p.liquid.debt,0);near(p.prepay.cash,30000);near(p.liquid.cash,30000);near(p.advantage,0);
  assert.ok(p.prepay.unusedPayments>p.liquid.unusedPayments);near(p.advantage,p.interestAvoided+p.growthDifference);
  for(const changes of [{lump:0},{balance:0}])near(prepayComparison({...defaults('mortgagePrepay'),...changes}).advantage,0);
});
test('equal effective savings and mortgage rates yield equal arithmetic positions under a matched payment budget',()=>{
  for(const mortgageRate of [0,3,4.5,6]){
    const cashRate=((1+mortgageRate/200)**2-1)*100;
    for(const amortYears of [5,25]){
      const p=prepayComparison({...defaults('mortgagePrepay'),mortgageRate,cashRate,amortYears,years:10});
      assert.ok(Math.abs(p.advantage)<.0001,JSON.stringify({mortgageRate,cashRate,advantage:p.advantage}));
    }
  }
});
test('account-use graphics remain finite and retain accessible data at supported field edges',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['tfsaCalendar','respWithdrawals','mortgagePrepay']){
    const d=defaults(kind),inputs=[d,...definitions[kind].fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}])];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
  assert.equal(validInputs('mortgagePrepay',{...defaults('mortgagePrepay'),amortYears:5.5}),false);
});
