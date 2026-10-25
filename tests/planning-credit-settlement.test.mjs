import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {creditSettlementLedger} from '../src/planning-credit-settlement-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('unused credit and refund from prior payments are distinct in the original example',()=>{
 const p=creditSettlementLedger(defaults('creditSettlement'));
 near(p.used,3000);near(p.unused,2000);near(p.remainingTax,0);near(p.baselineBalance,1800);
 near(p.nonrefundableBalance,-1200);near(p.refundableBalance,-3200);
 near(p.baselineBalance-p.nonrefundableBalance,3000);near(p.nonrefundableBalance-p.refundableBalance,2000);
});
test('the signed settlement identities hold across tax, credit and prior-payment combinations',()=>{
 for(const tax of [0,800,3000,50000])for(const credit of [0,500,5000,50000])for(const paid of [0,1200,50000]){
  const p=creditSettlementLedger({settlementTax:tax,settlementCredit:credit,settlementPaid:paid});
  near(p.used+p.unused,credit);assert.ok(p.used<=tax&&p.used<=credit&&p.used>=0&&p.unused>=0);
  near(p.remainingTax,tax-p.used);near(p.nonrefundableBalance+paid,p.remainingTax);near(p.refundableBalance+paid,tax-credit);
  near(p.baselineBalance-p.nonrefundableBalance,p.used);near(p.nonrefundableBalance-p.refundableBalance,p.unused);
 }
});
test('prior payments change settlement one for one without changing credit usage or current benefit',()=>{
 const d=defaults('creditSettlement'),a=creditSettlementLedger({...d,settlementPaid:0}),b=creditSettlementLedger({...d,settlementPaid:4000});
 near(a.used,b.used);near(a.unused,b.unused);near(a.remainingTax,b.remainingTax);
 near(a.nonrefundableBalance-b.nonrefundableBalance,4000);near(a.refundableBalance-b.refundableBalance,4000);
 near(a.nonrefundableBalance,0);near(a.refundableBalance,-2000);
});
test('a fully usable credit makes refundability cases agree and zero tax does not pay an unapplied nonrefundable amount',()=>{
 const d=defaults('creditSettlement'),usable=creditSettlementLedger({...d,settlementCredit:1000});near(usable.unused,0);near(usable.nonrefundableBalance,usable.refundableBalance);
 const zeroTax=creditSettlementLedger({...d,settlementTax:0});near(zeroTax.used,0);near(zeroTax.unused,d.settlementCredit);near(zeroTax.nonrefundableBalance,-d.settlementPaid);
 const zeroAll=creditSettlementLedger({settlementTax:0,settlementCredit:0,settlementPaid:0});Object.values(zeroAll).forEach(v=>near(v,0));
});
test('credit decomposition and the settlement bridge reconcile, and the exact utilization kink is sampled',()=>{
 const d={...defaults('creditSettlement'),settlementTax:3578,settlementCredit:18001},r=planningResult('creditSettlement',d),p=creditSettlementLedger(d);
 for(const row of r.charts[0].rows)near(row.values.reduce((a,b)=>a+b,0),d.settlementCredit);
 near(r.charts[1].rows.reduce((a,row)=>a+row.value,0),p.nonrefundableBalance);
 const line=r.charts[2].series[0];assert.ok(line.rows.some(row=>row.x===d.settlementTax&&row.value===d.settlementTax));
 assert.ok(line.rows.some(row=>row.x===d.settlementCredit));
});
test('all supported limits render four finite figures and tables without assuming a tax rate',()=>{
 const d=defaults('creditSettlement'),fields=definitions.creditSettlement.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('creditSettlement',i));const r=planningResult('creditSettlement',i);finite(r);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 assert.equal(validInputs('creditSettlement',{...d,settlementPaid:-1}),false);
});
