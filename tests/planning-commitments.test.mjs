import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {jointLoanPath,subscriptionPath,saleAtGross,saleCashPlan} from '../src/planning-commitments-models.js';
import {commitmentGuides} from '../src/planning-commitments-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('joint-loan payments and takeover debt agree with independent annuity formulas',()=>{
  const d=defaults('jointLoan'),p=jointLoanPath(d),r=d.apr/1200,n=d.loanMonths;
  const A=d.balance*r/(1-(1+r)**-n),k=d.takeoverMonth-1;
  const debt=d.balance*(1+r)**k-A*((1+r)**k-1)/r;
  near(p.payment,A);near(p.takeoverBalance,debt);near(p.ownPaid,(n-k)*A);
  near(p.ownPrincipal,debt);near(p.ownInterest,(n-k)*A-debt);near(p.rows.at(-1).balance,0);
  near(p.extra,Math.max(0,(A-d.surplus)*(n-k)-d.cash));
  near(p.ending,d.cash+(n-k)*d.surplus-p.ownPaid);
  for(const takeoverMonth of [1,13,48,49,61]){
    const q=jointLoanPath({...d,takeoverMonth});
    assert.deepEqual(q.rows.map(x=>x.balance),p.rows.map(x=>x.balance));
    near(q.ownPaid+q.otherPaid,n*A);
  }
});
test('zero-rate, empty and no-takeover loans preserve the correct funding boundary',()=>{
  const d={...defaults('jointLoan'),apr:0,balance:12000,loanMonths:12,takeoverMonth:7,surplus:200,cash:1000},p=jointLoanPath(d);
  near(p.payment,1000);near(p.takeoverBalance,6000);near(p.ownInterest,0);near(p.extra,3800);
  for(const variant of [{...d,balance:0},{...d,takeoverMonth:13}]){
    const q=jointLoanPath(variant);near(q.ownPaid,0);near(q.extra,0);near(q.ending,d.cash);near(q.takeoverBalance,0);
  }
});
test('subscription prices, unused time and optional refunds reconcile independently',()=>{
  const d=defaults('subscriptionPlan');
  for(let useMonths=1;useMonths<=12;useMonths++)for(const refundPct of [0,25,50,100]){
    const q=subscriptionPath({...d,useMonths,refundPct}),unused=d.annualPrice*(12-useMonths)/12;
    near(q.refund,unused*refundPct/100);near(q.annualNet,d.annualPrice-q.refund);
    near(q.monthlyNet,d.monthlyPrice*useMonths);near(q.used+unused,d.annualPrice);
    near(q.rows[0].annual,d.annualPrice);near(q.rows[useMonths-1].annual,d.annualPrice);
    near(q.rows[useMonths].annual,q.annualNet);near(q.rows.at(-1).monthly,q.monthlyNet);
  }
  near(subscriptionPath({...d,useMonths:10}).monthlyNet,300);
  near(subscriptionPath({...d,useMonths:12}).monthlyNet-subscriptionPath({...d,useMonths:12}).annualNet,60);
});
test('sale solves the goal while retaining both the cost-base and cash reconciliations',()=>{
  const d=defaults('saleCash'),p=saleCashPlan(d);
  near(p.gross,20075/.9);near(p.tax,2205.5555555555557);near(p.net,d.target);
  near(p.basisSold+p.remainingBasis,d.basis);near(p.retained+p.gross,d.market);
  near(p.gross-p.fee-p.tax,p.net);near(p.gain,p.gross-p.basisSold-p.fee);
  near(p.shortfall,0);
  // Independently bisect the usable-cash function, instead of reusing the solver.
  for(const basis of [0,30000,60000,100000,150000])for(const gainTax of [0,15,25,50]){
    const input={...d,basis,gainTax};let lo=0,hi=d.market;
    for(let i=0;i<80;i++){const mid=(lo+hi)/2,net=mid-d.fee-Math.max(0,mid-d.fee-basis*mid/d.market)*gainTax/100;if(net<d.target)lo=mid;else hi=mid;}
    const q=saleCashPlan(input);near(q.gross,(lo+hi)/2);near(q.net,d.target);
  }
});
test('losses, zero targets and unavailable goals never invent a tax refund or another asset',()=>{
  const d=defaults('saleCash'),loss=saleCashPlan({...d,market:60000});near(loss.gross,20100);near(loss.tax,0);assert.ok(loss.gain<0);
  const zero=saleCashPlan({...d,target:0});near(zero.gross,0);near(zero.fee,0);near(zero.tax,0);near(zero.fraction,0);
  const tooLarge=saleCashPlan({...d,target:200000});near(tooLarge.gross,d.market);near(tooLarge.shortfall,200000-tooLarge.net);near(tooLarge.retained,0);near(tooLarge.remainingBasis,0);
  const tiny=saleAtGross(d,10);near(tiny.fee,10);near(tiny.net,0);near(tiny.tax,0);
});
test('articles have substantial prose, valid related links and four accessible figures across input boundaries',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const g of commitmentGuides){
    assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800);
    assert.ok(g.related.every(s=>slugs.has(s)));
    const d=defaults(g.planning),fields=definitions[g.planning].fields;
    const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
  assert.equal(validInputs('jointLoan',{...defaults('jointLoan'),takeoverMonth:1.5}),false);
  assert.equal(validInputs('subscriptionPlan',{...defaults('subscriptionPlan'),useMonths:2.5}),false);
});
