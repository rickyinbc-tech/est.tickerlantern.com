import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {promoConditionLedger} from '../src/planning-promo-condition-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('principal conservation and independently summed monthly opening-balance memo match the default',()=>{
 const d=defaults('promoCondition'),p=promoConditionLedger(d);
 near(p.beforeTopup,240);near(p.paid,2160);near(p.memo,338.4);near(p.assessed,338.4);near(p.deferredBalance,578.4);near(p.zeroBalance,240);
 const openingSum=12*(2400+420)/2;near(p.memo,openingSum*.02);
 for(const r of p.rows.slice(1)){near(r.opening-r.payment,r.principal);near(r.monthInterest,r.opening*.02);}
 near(p.paid+p.principal,d.promoPurchase);near(p.deferredBalance,p.principal+p.assessed);
});
test('deadline top-up changes the payoff condition without rewriting earlier principal or memo accrual',()=>{
 const d=defaults('promoCondition'),a=promoConditionLedger(d),b=promoConditionLedger(d,99),c=promoConditionLedger(d,100);
 assert.deepEqual(a.rows,b.rows);assert.deepEqual(a.rows,c.rows);near(a.memo,b.memo);near(b.memo,c.memo);
 near(b.extra,237.6);near(b.principal,2.4);near(b.assessed,338.4);near(b.deferredBalance,340.8);
 near(c.extra,240);near(c.principal,0);near(c.assessed,0);near(c.waived,338.4);near(c.deferredBalance,0);near(c.paid,2400);
});
test('payments are capped, early principal payoff stops accrual, and memo amounts do not compound',()=>{
 const d=defaults('promoCondition'),p=promoConditionLedger({...d,promoPayment:2000});
 near(p.rows[1].principal,400);near(p.rows[2].payment,400);near(p.paid,2400);near(p.memo,56);near(p.assessed,0);near(p.waived,56);
 assert.ok(p.rows.slice(3).every(r=>r.principal===0&&r.payment===0&&r.monthInterest===0));
 const unpaid=promoConditionLedger({...d,promoPayment:0});near(unpaid.memo,2400*.24);near(unpaid.deferredBalance,2976);
 const single=promoConditionLedger({...d,promoMonths:1,promoPayment:2400});near(single.memo,48);near(single.assessed,0);
});
test('monthly cent rounding is independent of the full-precision interest sum and top-up remains exact cents',()=>{
 const d={...defaults('promoCondition'),promoPurchase:101,promoPayment:7,promoMonths:7,promoRate:19.7,promoTopup:99};
 const p=promoConditionLedger(d);let cents=10100,memo=0;
 for(let m=0;m<7;m++){memo+=Math.round(cents*.197/12);cents-=Math.min(cents,700);}
 near(p.memo,memo/100);near(p.beforeTopup,52);near(p.extra,51.48);near(p.principal,.52);
 assert.equal(p.rows.every(r=>Number.isInteger(Math.round(r.monthInterest*100))),true);
});
test('zero purchase, zero rate and sufficient payments preserve distinct principal and interest identities',()=>{
 const d=defaults('promoCondition'),zero=promoConditionLedger({...d,promoPurchase:0});near(zero.deferredBalance,0);near(zero.memo,0);near(zero.paid,0);
 const noInterest=promoConditionLedger({...d,promoRate:0});near(noInterest.principal,240);near(noInterest.memo,0);near(noInterest.deferredBalance,240);
 const exact=promoConditionLedger({...d,promoPayment:200});near(exact.principal,0);near(exact.assessed,0);near(exact.memo,312);
});
test('stack components reconcile posted debt and alternative rows replace only the final payment percentage',()=>{
 const d=defaults('promoCondition'),p=promoConditionLedger(d),r=planningResult('promoCondition',d);
 near(r.charts[2].rows[0].values.reduce((a,b)=>a+b),p.zeroBalance);near(r.charts[2].rows[1].values.reduce((a,b)=>a+b),p.deferredBalance);
 [0,50,99,100].forEach((percent,j)=>{const q=promoConditionLedger(d,percent);near(r.charts[3].rows[j].values[0],q.zeroBalance);near(r.charts[3].rows[j].values[1],q.deferredBalance);});
 const changed=planningResult('promoCondition',{...d,promoTopup:100});assert.deepEqual(r.charts.slice(0,2),changed.charts.slice(0,2));assert.deepEqual(r.charts[3],changed.charts[3]);
});
test('whole currency, period and top-up inputs and supported boundaries render four finite figures/tables',()=>{
 const d=defaults('promoCondition'),fields=definitions.promoCondition.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('promoCondition',i));const r=planningResult('promoCondition',i);finite(r);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 for(const key of ['promoPurchase','promoPayment','promoMonths','promoTopup'])assert.equal(validInputs('promoCondition',{...d,[key]:1.5}),false);
});
