import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {cardPurchaseLedger} from '../src/planning-card-ledger-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('nested spending shares preserve the stated denominator and a nonnegative surplus',()=>{
 const d=defaults('cardLedger'),p=cardPurchaseLedger(d);
 near(p.cashPurchase,3000);near(p.cardPurchase,800);near(p.surplus,1200);near(p.transfer,600);
 near(p.cashPurchase+p.cardPurchase+p.surplus,d.ledgerIncome);
 near(p.yearEnd.consumption,45600);near(p.yearEnd.purchaseOutflow,44800);
 near(p.yearEnd.checking,18000);near(p.yearEnd.saving,12200);near(p.yearEnd.payable,800);near(p.yearEnd.net,29400);
});
test('independent closed forms reconcile all ordinary monthly balance snapshots',()=>{
 const d=defaults('cardLedger');
 for(const cashShare of [0,25,60,100])for(const cardShare of [0,40,100])for(const saveShare of [0,50,100]){
  const i={...d,ledgerCashShare:cashShare,ledgerCardShare:cardShare,ledgerSaveShare:saveShare},p=cardPurchaseLedger(i);
  const direct=i.ledgerIncome*cashShare/100,credit=(i.ledgerIncome-direct)*cardShare/100,retained=i.ledgerIncome-direct-credit,moved=retained*saveShare/100;
  for(const r of p.rows.slice(1,13)){
   near(r.checking,i.ledgerChecking+credit+r.x*(retained-moved));near(r.saving,i.ledgerSaving+r.x*moved);
   near(r.payable,credit);near(r.net,i.ledgerChecking+i.ledgerSaving+r.x*retained);
   near(r.consumption,r.x*(direct+credit));near(r.purchaseOutflow,r.x*direct+(r.x-1)*credit);
   near(r.consumption-r.purchaseOutflow,r.payable);assert.ok(r.checking>=0&&r.saving>=0);
  }
 }
});
test('final cohort settlement moves cash and liability equally without new consumption or income',()=>{
 const p=cardPurchaseLedger(defaults('cardLedger')),a=p.yearEnd,b=p.settled;
 near(a.checking-b.checking,a.payable);near(a.net,b.net);near(a.saving,b.saving);near(a.consumption,b.consumption);
 near(b.payable,0);near(b.consumption,b.purchaseOutflow);near(b.transfer,0);near(b.repayment,a.payable);
 near(b.checking,17200);near(b.saving,12200);
});
test('savings-transfer shares change account location but not consumption or consolidated net assets',()=>{
 const d=defaults('cardLedger'),none=cardPurchaseLedger({...d,ledgerSaveShare:0}),all=cardPurchaseLedger({...d,ledgerSaveShare:100});
 for(let j=0;j<none.rows.length;j++){
  const a=none.rows[j],b=all.rows[j];near(a.net,b.net);near(a.consumption,b.consumption);near(a.payable,b.payable);
  near(a.checking+a.saving,b.checking+b.saving);near(a.checking-b.checking,b.saving-a.saving);
 }
 near(all.yearEnd.saving-none.yearEnd.saving,12*all.surplus);
});
test('the incorrect double-counting total exceeds consumption by repayments inside the window',()=>{
 const d=defaults('cardLedger'),p=cardPurchaseLedger(d),r=planningResult('cardLedger',d),recording=r.charts.find(c=>c.id==='card-ledger-recording-rules');
 near(recording.rows[0].value,45600);near(recording.rows[1].value,44800);near(recording.rows[2].value,54400);
 near(recording.rows[2].value-recording.rows[0].value,p.rows.slice(1,13).reduce((s,r)=>s+r.repayment,0));
 const waterfall=r.charts.find(c=>c.type==='waterfall');near(waterfall.rows.reduce((s,r)=>s+r.value,0),p.yearEnd.net);
});
test('zero receipts preserve opening balances and boundary combinations remain finite and fully reconciled',()=>{
 const d=defaults('cardLedger'),fields=definitions.cardLedger.fields;
 const empty=cardPurchaseLedger({...d,ledgerIncome:0});near(empty.yearEnd.net,15000);near(empty.yearEnd.consumption,0);
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('cardLedger',i));const p=cardPurchaseLedger(i),r=planningResult('cardLedger',i);finite(p);finite(r);
  near(p.yearEnd.net-p.opening,12*p.surplus);assert.ok(p.settled.checking>=-1e-8);assert.equal(r.charts.length,5);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,5);assert.equal((h.match(/<caption>/g)||[]).length,5);}
 }
 assert.equal(validInputs('cardLedger',{...d,ledgerCardShare:101}),false);
});
