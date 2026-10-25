import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {pauseRegularPayment,pauseSchedule,paymentPausePlan} from '../src/planning-payment-pause-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);

test('the default pause separates cash relief, original principal, deferred interest and two payoff paths',()=>{
 const p=paymentPausePlan(defaults('paymentPause'));
 near(p.baseline.regular,904.5458291236831);near(p.before.principal,15294.914816698842);near(p.endPause.deferred,305.8982963339769);
 near(p.cashRelief,2713.6374873710492);near(p.resumedPayment,1096.241249601926);
 assert.equal(p.baseline.payoff,24);assert.equal(p.extended.payoff,28);assert.equal(p.restored.payoff,24);
 near(p.baseline.totalInterest,1709.0998989683947);near(p.extended.totalInterest-p.baseline.totalInterest,344.7620437233794);near(p.restored.totalInterest-p.baseline.totalInterest,161.7938198125939);
});
test('the original regular payment independently prices all monthly receipts at the stated monthly rate',()=>{
 for(const amount of [1000,20000,100000])for(const years of [12,24,60])for(const rate of [0,.08/12,.18/12]){
  const payment=pauseRegularPayment(amount,rate,years);let pv=0;for(let m=1;m<=years;m++)pv+=payment/Math.pow(1+rate,m);
  near(pv,amount);if(rate===0)near(payment,amount/years);
 }
});
test('every month conserves the liability and charges interest only on original principal',()=>{
 for(const pauseRate of [0,8,18])for(const loanMonths of [12,60])for(const deferMonths of [1,4]){
  const input={amount:100000,pauseRate,loanMonths,deferMonths},p=paymentPausePlan(input);
  for(const plan of [p.baseline,p.extended,p.restored]){
   let interest=0,paid=0;
   for(let i=1;i<plan.rows.length;i++){
    const prev=plan.rows[i-1],row=plan.rows[i];near(row.interest,prev.principal*pauseRate/1200);near(row.balance,prev.balance+row.interest-row.payment);
    assert.ok(row.principal>=0&&row.deferred>=0);interest+=row.interest;paid+=row.payment;
   }
   near(interest,plan.totalInterest);near(paid,plan.totalPaid);near(paid+plan.remaining,input.amount+interest);assert.equal(plan.remaining,0);
  }
  const principal=p.before.principal,perMonth=principal*pauseRate/1200;
  for(let i=1;i<=deferMonths;i++){const row=p.extended.rows[6+i];near(row.principal,principal);near(row.deferred,perMonth*i);assert.equal(row.payment,0);}
 }
});
test('repayments clear current interest, then the non-interest-bearing deferred ledger, then original principal',()=>{
 const input={amount:20000,pauseRate:18,loanMonths:60,deferMonths:4},p=paymentPausePlan(input),first=p.extended.rows[11];
 assert.ok(p.endPause.deferred>first.payment-first.interest);
 near(first.principal,p.endPause.principal);near(first.deferred,p.endPause.deferred-(first.payment-first.interest));
 const second=p.extended.rows[12];near(second.interest,p.endPause.principal*.18/12);
 // This differs from capitalizing the whole debt and charging interest on it.
 assert.ok(second.interest<first.balance*.18/12);
});
test('restoring the date solves the payment while a cent less leaves debt at the original final month',()=>{
 for(const pauseRate of [0,8,18])for(const loanMonths of [12,24,60])for(const deferMonths of [1,2,4]){
  const input={amount:20000,pauseRate,loanMonths,deferMonths},p=paymentPausePlan(input);
  assert.equal(p.restored.payoff,loanMonths);assert.equal(p.restored.remaining,0);assert.ok(p.resumedPayment>p.baseline.regular);
  assert.ok(pauseSchedule(input,deferMonths,p.resumedPayment-.01,loanMonths).remaining>0);
  assert.ok(p.extended.payoff>loanMonths);assert.ok(p.extended.totalInterest>=p.baseline.totalInterest-1e-6);
 }
});
test('zero-rate pauses preserve total principal and have independent closed-form payment and payoff identities',()=>{
 for(const loanMonths of [12,24,60])for(const deferMonths of [1,3,4]){
  const input={amount:20000,pauseRate:0,loanMonths,deferMonths},p=paymentPausePlan(input),remaining=20000-6*(20000/loanMonths);
  near(p.resumedPayment,remaining/(loanMonths-6-deferMonths));assert.equal(p.extended.payoff,loanMonths+deferMonths);
  assert.equal(p.endPause.deferred,0);near(p.baseline.totalPaid,20000);near(p.extended.totalPaid,20000);near(p.restored.totalPaid,20000);
 }
});
test('chart totals add interest once and the common balance display continues each paid-off path at zero',()=>{
 const d=defaults('paymentPause'),p=paymentPausePlan(d),r=planningResult('paymentPause');
 near(r.charts[2].rows.reduce((a,b)=>a+b.value,0),p.endPause.balance);
 assert.ok(p.endPause.balance<p.before.principal+p.cashRelief);
 [p.baseline,p.extended,p.restored].forEach((plan,i)=>near(r.charts[3].rows[i].values.reduce((a,b)=>a+b,0),plan.totalPaid));
 assert.ok(r.charts[0].series.every(s=>s.rows.length===29));assert.equal(r.charts[0].series[0].rows[28].value,0);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const input={...d,deferMonths:row+1,pauseRate:[0,6,12,18][col]};near(r.charts[4].rows[row].values[col],pauseSchedule(input,row+1).totalInterest-pauseSchedule(input).totalInterest);
 }
});
test('whole calendar counts and all input boundaries render five finite chart/table pairs',()=>{
 const d=defaults('paymentPause'),fields=definitions.paymentPause.fields;
 assert.equal(validInputs('paymentPause',{...d,deferMonths:2.5}),false);assert.equal(validInputs('paymentPause',{...d,loanMonths:24.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const r=planningResult('paymentPause',input);assert.equal(new Set(r.charts.map(c=>c.id)).size,5);
  for(const width of [300,1000]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
});
