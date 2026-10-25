import test from 'node:test';
import assert from 'node:assert/strict';
import {loanRateOrderLedger} from '../src/planning-loan-rate-order-models.js';
import {loanRateOrderGuides} from '../src/planning-loan-rate-order-guides.js';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);

test('matching rate counts and means produce different interest when paired with declining balances',()=>{
 const p=loanRateOrderLedger(defaults('loanRateOrder'));near(p.meanRate,.08);assert.deepEqual(p.rows.map(r=>r.rateAFirst),[10,10,6,6]);assert.deepEqual(p.rows.map(r=>r.rateBFirst),[6,6,10,10]);
 assert.deepEqual(p.rows.map(r=>r.opening),[24000,18000,12000,6000]);assert.equal(p.interestA,5280);assert.equal(p.interestB,4320);assert.equal(p.gap,960);
 assert.equal(p.openingBalanceSum,60000);near(p.weightedA,.088);near(p.weightedB,.072);near(p.openingBalanceSum*p.meanRate,4800);
});
test('equal principal repayments reconcile each cash schedule and leave no principal at the horizon',()=>{
 const d=defaults('loanRateOrder'),p=loanRateOrderLedger(d);
 assert.equal(p.principalPayment,6000);assert.deepEqual(p.rows.map(r=>r.ending),[18000,12000,6000,0]);assert.equal(p.rows.reduce((s,r)=>s+r.principalPayment,0),24000);
 assert.deepEqual(p.rows.map(r=>r.paymentA),[8400,7800,6720,6360]);assert.deepEqual(p.rows.map(r=>r.paymentB),[7440,7080,7200,6600]);
 near(p.rows.reduce((s,r)=>s+r.paymentA,0),d.orderPrincipal+p.interestA);near(p.rows.reduce((s,r)=>s+r.paymentB,0),d.orderPrincipal+p.interestB);
 assert.equal(p.totalPaymentA,29280);assert.equal(p.totalPaymentB,28320);
});
test('independent balance weights and the closed-form order difference hold across rate pairs',()=>{
 const d=defaults('loanRateOrder');
 for(const principal of [0,1001,24000,500000])for(const a of [0,4,10,20])for(const b of [0,6,12,20]){
  const p=loanRateOrderLedger({...d,orderPrincipal:principal,rateBlockA:a,rateBlockB:b});
  near(p.interestA,principal*(7*a+3*b)/400);near(p.interestB,principal*(7*b+3*a)/400);near(p.gap,principal*(a-b)/100);
  near((p.interestA+p.interestB)/2,p.openingBalanceSum*p.meanRate);
 }
 const r=planningResult('loanRateOrder',d);near(r.charts[3].rows.reduce((s,row)=>s+row.value,0),960);assert.equal(r.charts[1].series[0].step,true);
});
test('reversing rate names reverses the cost gap while equal rates and zero debt remove it',()=>{
 const d=defaults('loanRateOrder'),p=loanRateOrderLedger(d),reverse=loanRateOrderLedger({...d,rateBlockA:d.rateBlockB,rateBlockB:d.rateBlockA});assert.equal(reverse.interestA,p.interestB);assert.equal(reverse.gap,-p.gap);
 const equal=loanRateOrderLedger({...d,rateBlockA:6});assert.equal(equal.gap,0);assert.equal(equal.interestA,3600);
 const zero=loanRateOrderLedger({...d,orderPrincipal:0});assert.equal(zero.interestA,0);assert.equal(zero.totalPaymentB,0);assert.equal(zero.weightedA,null);assert.equal(zero.weightedB,null);
});
test('rate-order prose states the repayment convention and avoids presenting weights as an APR',()=>{
 const g=loanRateOrderGuides[0],prose=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,6);assert.ok(prose.replace(/<[^>]*>/g,' ').split(/\s+/).length>=900);
 assert.match(prose,/not regulated APRs/);assert.match(prose,/would not convert this into a monthly repayment loan/);assert.match(prose,/flat original-principal basis is a different calculation/);
 for(const slug of g.related)assert.ok(planningGuides.some(x=>x.slug===slug),slug);
});
test('supported principal and rate edges render five finite charts with complete payment tables',()=>{
 const kind='loanRateOrder',d=defaults(kind),fields=definitions[kind].fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs)for(const width of [300,760]){const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
});
