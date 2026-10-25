import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult,validInputs } from '../src/planning-models.js';
import { rentalMoveCalendar } from '../src/planning-rental-move-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('daily move ledger identifies the early shortfall despite a positive final balance',()=>{
  const d=defaults('rentalMoveBridge'),p=rentalMoveCalendar(d);assert.equal(p.rows.length,61);near(p.required,5200);near(p.additional,1200);near(p.minimum,-1200);near(p.ending,1900);near(p.rows[15].balance,-300);near(p.rows[22].balance,-1200);
  for(let day=1;day<=60;day++)near(p.rows[day].balance,p.rows[day-1].balance+p.rows[day].receipt-p.rows[day].outflow);
  const funded=rentalMoveCalendar({...d,moveCash:p.required});near(funded.minimum,0);near(funded.additional,0);assert.ok(funded.rows.every(r=>r.balance>=0));
});
test('period totals and closing bridge reconcile without masking the daily low point',()=>{
  const p=rentalMoveCalendar(defaults('rentalMoveBridge'));assert.deepEqual(p.periods,[{label:'Days 1–30',receipt:4000,outflow:7200},{label:'Days 31–60',receipt:4900,outflow:3800}]);
  near(p.rows[30].balance,800);assert.ok(p.rows.slice(0,31).some(r=>r.balance<0));near(p.receipts,8900);near(p.outflows,11000);
  near(planningResult('rentalMoveBridge').charts[2].rows.reduce((n,r)=>n+r.value,0),p.ending);
});
test('a refund outside the window remains pending and is never counted as bank cash',()=>{
  const d=defaults('rentalMoveBridge'),base=rentalMoveCalendar(d),late=rentalMoveCalendar({...d,refundArrival:61}),later=rentalMoveCalendar({...d,refundArrival:90}),none=rentalMoveCalendar({...d,oldRefundCash:0});
  near(base.refundReceived,900);near(base.pendingRefund,0);near(late.refundReceived,0);near(late.pendingRefund,900);near(late.ending,1000);near(late.ending,base.ending-900);
  assert.deepEqual(late.rows,later.rows);assert.deepEqual(late.rows,none.rows);near(late.required,base.required);
});
test('an earlier receipt can change the needed fund while later delays need not increase its peak',()=>{
  const d=defaults('rentalMoveBridge');for(const refundArrival of [10,20]){const p=rentalMoveCalendar({...d,refundArrival});near(p.required,4300);near(p.additional,300);near(p.ending,1900);}
  const before=rentalMoveCalendar({...d,refundArrival:35}),after=rentalMoveCalendar({...d,refundArrival:61});near(before.required,after.required);assert.notEqual(before.ending,after.ending);
  const grid=planningResult('rentalMoveBridge').charts[3];near(grid.rows[2].values[0],300);near(grid.rows[2].values[1],300);near(grid.rows[2].values[2],1200);near(grid.rows[2].values[3],1200);
});
test('same-day receipts are netted before payments under the stated availability convention',()=>{
  const d=defaults('rentalMoveBridge'),p=rentalMoveCalendar({...d,refundArrival:1,oldRefundCash:5000});near(p.rows[1].receipt,5000);near(p.rows[1].outflow,2800);near(p.rows[1].balance,6200);
  const onPayday=rentalMoveCalendar({...d,refundArrival:10});near(onPayday.rows[10].receipt,2900);near(onPayday.refundReceived,900);
});
test('new deposit cash is counted once while the old refund stays separate from opening cash',()=>{
  const d=defaults('rentalMoveBridge'),base=rentalMoveCalendar(d),more=rentalMoveCalendar({...d,newDepositCash:1500});near(base.ending-more.ending,500);near(more.required-base.required,500);near(more.refundReceived,base.refundReceived);
  near(base.ending,d.moveCash+4*d.movePay+base.refundReceived-d.oldRentCash-2*d.newRentCash-d.newDepositCash-d.moveCostCash-4*d.moveLiving);
});
test('whole arrival days and supported boundary values retain four finite accessible charts',()=>{
  const kind='rentalMoveBridge',d=defaults(kind),fields=definitions[kind].fields;assert.equal(validInputs(kind,{...d,refundArrival:35.5}),false);
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
