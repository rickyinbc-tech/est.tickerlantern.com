import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {rentalMovePath} from '../src/planning-rental-move-models.js';
import {renderResult} from '../src/planning-charts.js';

test('rental move tracks payment dates before month-end surplus and the old-deposit refund',()=>{
  const p=rentalMovePath(defaults('rentalMove'));
  assert.deepEqual(p.rows.map(r=>r.before),[2500,1300,-1800,-1400,0,400,800]);
  assert.deepEqual(p.rows.map(r=>r.value),[2500,1700,-1400,0,400,800,1200]);
  assert.equal(p.lowest,-1800);assert.equal(p.extra,2300);assert.equal(p.ending,1200);assert.equal(p.monthsBelow,4);
});
test('the six-month endpoint conserves entered receipts and payments, excluding a later refund',()=>{
  const d=defaults('rentalMove');
  for(const refundMonth of [3,4,5,6,7])for(const monthly of [0,400,1200]){
    const input={...d,monthly,refundMonth},p=rentalMovePath(input),refund=refundMonth<=6?input.oldRefund:0;
    assert.equal(p.ending,input.reserve+6*monthly+refund-input.newDeposit-input.overlap-input.moving);
    assert.equal(p.refundReceived,refund);assert.equal(p.rows.reduce((sum,r)=>sum+r.refund,0),refund);
  }
  assert.equal(rentalMovePath({...d,refundMonth:7}).ending,200);
});
test('extra cash shifts the full path to the buffer without assuming any credit facility',()=>{
  const d=defaults('rentalMove'),base=rentalMovePath(d),funded=rentalMovePath({...d,reserve:d.reserve+base.extra});
  assert.equal(funded.lowest,d.floor);assert.equal(funded.extra,0);
  for(let i=0;i<base.rows.length;i++){assert.equal(funded.rows[i].before-base.rows[i].before,base.extra);assert.equal(funded.rows[i].value-base.rows[i].value,base.extra);}
  assert.equal(rentalMovePath({...d,reserve:20000}).extra,0);
});
test('a refund at month-end cannot pay an earlier bill and the duration count uses before-receipt points',()=>{
  const d=defaults('rentalMove'),early=rentalMovePath(d),later=rentalMovePath({...d,refundMonth:6}),none=rentalMovePath({...d,oldRefund:0});
  assert.equal(early.rows[2].before,later.rows[2].before);assert.equal(early.lowest,none.lowest);
  assert.equal(early.rows[3].before,-1400);assert.equal(early.rows[3].value,0);
  const result=planningResult('rentalMove');
  for(let r=0;r<4;r++)for(let c=0;c<4;c++){
    const input={...d,monthly:[0,400,800,1200][r],refundMonth:[3,4,5,7][c]};
    let cash=input.reserve,count=0;
    for(let month=1;month<=6;month++){
      cash-=month===1?input.newDeposit:month===2?input.overlap+input.moving:0;
      if(cash<input.floor)count++;
      cash+=input.monthly+(month===input.refundMonth?input.oldRefund:0);
    }
    assert.equal(result.charts[3].rows[r].values[c],count);
  }
});
test('only the selected cash buffer changes the funding target, not the cash reconciliation',()=>{
  const d=defaults('rentalMove'),base=planningResult('rentalMove'),edited=planningResult('rentalMove',{...d,floor:1000});
  assert.equal(edited.metrics[0][1]-base.metrics[0][1],500);assert.equal(edited.metrics[2][1],base.metrics[2][1]);
  assert.deepEqual(edited.charts[2],base.charts[2]);
  assert.match(base.note,/not an actual overdraft/);assert.match(base.note,/not a legal entitlement or deadline/);
});
test('whole refund month and boundary inputs render four finite charts with data tables',()=>{
  const d=defaults('rentalMove'),fields=definitions.rentalMove.fields;
  assert.equal(validInputs('rentalMove',{...d,refundMonth:3.5}),false);
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){const result=planningResult('rentalMove',input);assert.equal(result.charts.length,4);
    for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
