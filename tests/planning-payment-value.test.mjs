import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentValueLedger} from '../src/planning-payment-value-models.js';
import {paymentValueGuides} from '../src/planning-payment-value-guides.js';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);

test('payment stream value reconciles to an independent ordinary-annuity formula and cash dates',()=>{
 const d=defaults('paymentValue'),p=paymentValueLedger(d);
 const annuity=12000*(1-1.05**-5)/.05;
 near(p.present,annuity);near(p.gap,1953.72004756982);assert.equal(p.nominal,60000);
 near(p.payments[0].present,12000/1.05);near(p.payments[4].present,12000/1.05**5);
 assert.deepEqual(p.timeline.map(r=>r.upfront),[50000,0,0,0,0,0]);assert.deepEqual(p.timeline.map(r=>r.payment),[0,12000,12000,12000,12000,12000]);
 assert.equal(p.timeline.at(-1).received,60000);near(p.equalPayment,50000/((1-1.05**-5)/.05));
});
test('moving the first payment shifts discounting without changing payment count or cash total',()=>{
 const d=defaults('paymentValue'),base=paymentValueLedger(d),now=paymentValueLedger({...d,firstPaymentYear:0}),later=paymentValueLedger({...d,firstPaymentYear:3});
 near(now.present,base.present*1.05);near(later.present,base.present/1.05**2);near(later.present,47123.555598702784);
 assert.deepEqual(later.payments.map(r=>r.year),[3,4,5,6,7]);assert.equal(now.timeline[0].payment,12000);
 assert.equal(base.nominal,later.nominal);assert.equal(later.timeline[0].received,0);assert.equal(later.timeline[2].received,0);
});
test('valuation rate changes present value without manufacturing cash receipts or reinvestment',()=>{
 const d=defaults('paymentValue'),base=paymentValueLedger(d),high=paymentValueLedger({...d,valueDiscount:8}),zero=paymentValueLedger({...d,valueDiscount:0});
 near(high.present,47912.52044493702);assert.ok(high.gap<0);assert.deepEqual(base.timeline,high.timeline);assert.equal(zero.present,60000);assert.equal(zero.gap,10000);
 assert.equal(paymentValueLedger({...d,valueDiscount:0,firstPaymentYear:5}).present,zero.present);
 const result=planningResult('paymentValue',d),waterfall=result.charts[1];near(waterfall.rows.reduce((s,r)=>s+r.value,0),base.gap);
 assert.deepEqual(result.charts[3].rows.map(r=>r.values[0]),[10000,10000,10000,10000]);
});
test('immediate single payment and absent cash amounts have explicit finite boundaries',()=>{
 const d=defaults('paymentValue'),single=paymentValueLedger({...d,paymentCount:1,firstPaymentYear:0,annualPayment:50000});
 assert.equal(single.present,50000);assert.equal(single.gap,0);assert.equal(single.timeline.length,1);assert.equal(single.lastYear,0);
 const noPayment=paymentValueLedger({...d,annualPayment:0});assert.equal(noPayment.present,0);assert.equal(noPayment.gap,-50000);
 assert.equal(paymentValueLedger({...d,upfrontCash:0,annualPayment:0}).equalPayment,0);
 for(const key of ['paymentCount','firstPaymentYear'])assert.equal(validInputs('paymentValue',{...d,[key]:d[key]+.5}),false);
});
test('receipt comparison contains detailed English prose and states the distinction between value and available cash',()=>{
 const g=paymentValueGuides[0];assert.equal(g.sections.length,6);const prose=g.sections.map(s=>s.html).join(' ');
 assert.ok(prose.replace(/<[^>]*>/g,' ').split(/\s+/).length>=1000);assert.match(prose,/does not create CAD 51,953.72 of accessible cash/);
 assert.match(g.chartScope,/original hypothetical/);for(const slug of g.related)assert.ok(planningGuides.some(x=>x.slug===slug),slug);
});
test('all supported individual and combined boundaries render four finite charts and tables',()=>{
 const kind='paymentValue',d=defaults(kind),fields=definitions[kind].fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){
  const result=planningResult(kind,input);
  for(const width of [300,760]){
   const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);
  }
 }
});
