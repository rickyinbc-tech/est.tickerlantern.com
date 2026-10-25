import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {accountAccessLedger,creditBackupPlan,rentQuoteBudget} from '../src/planning-access-rent-models.js';
import {rentComparisonSource} from '../src/planning-access-rent-data.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('account access requirement matches a separate pre-income daily cash equation',()=>{
  const base=defaults('accountAccess');
  for(const accessDay of [1,7,21,30,31,60])for(const monthlyCosts of [0,4500,10000]){
    const input={...base,accessDay,monthlyCosts},p=accountAccessLedger(input);
    const expected=Math.max(0,...Array.from({length:60},(_,i)=>{
      const day=i+1;return day*monthlyCosts/30-Math.floor((day-1)/30)*input.monthlyIncome-(day>=accessDay?input.delayedCash:0);
    }));
    near(p.required,expected);near(p.extra,Math.max(0,expected-input.openingCash));
    near(p.ending,input.openingCash+input.delayedCash+2*input.monthlyIncome-2*monthlyCosts);
    near(p.daily.reduce((s,r)=>s+r.release,0),input.delayedCash);
  }
});
test('same household assets and ending cash can conceal an earlier access gap',()=>{
  const input=defaults('accountAccess'),p=accountAccessLedger(input),immediate=accountAccessLedger(input,1);
  near(p.required,3000);near(p.extra,1000);near(p.ending,10000);near(p.ending,immediate.ending);near(immediate.extra,0);
  assert.ok(p.rows.some(r=>r.value<0));
  const funded=accountAccessLedger({...input,openingCash:p.required});assert.ok(funded.rows.every(r=>r.value>=-1e-8));
  assert.equal(p.daily.find(r=>r.release).day,21);near(p.daily[19].closing,-1000);near(p.daily[20].closing,10850);
});
test('credit capacity is not an asset and the bill reconciles with cash, a real draw and an unfunded remainder',()=>{
  const input=defaults('creditBackup'),p=creditBackupPlan(input);
  near(p.cashUsed,5000);near(p.drawn,3000);near(p.unfunded,0);near(p.cashLeft,0);near(p.interest,137.5);near(p.balance,0);
  const reduced=creditBackupPlan({...input,availableShare:20});near(reduced.drawn,2000);near(reduced.unfunded,1000);
  const none=creditBackupPlan({...input,availableShare:0});near(none.drawn,0);near(none.unfunded,3000);near(none.interest,0);
  const cashOnly=creditBackupPlan({...input,cash:10000});near(cashOnly.drawn,0);near(cashOnly.cashLeft,2000);
  for(const q of [p,reduced,none,cashOnly])near(q.cashUsed+q.drawn+q.unfunded,input.bill);
});
test('credit interest equals a truncated arithmetic series of opening debt balances',()=>{
  const base=defaults('creditBackup');
  for(const principalMonthly of [0,50,300,5000]){
    const input={...base,principalMonthly},p=creditBackupPlan(input),n=principalMonthly?Math.min(24,Math.ceil(p.drawn/principalMonthly)):24;
    const expected=(n*p.drawn-principalMonthly*n*(n-1)/2)*input.apr/1200;
    near(p.interest,expected);near(p.balance,p.drawn-Math.min(p.drawn,24*principalMonthly));
    near(p.payments.reduce((s,r)=>s+r.value,0),p.principal+p.interest);
  }
  const interestOnly=creditBackupPlan({...base,principalMonthly:0});near(interestOnly.balance,3000);near(interestOnly.interest,600);
});
test('rent observations retain unequal, equal and negative asking-minus-paid comparisons and remain fixed',()=>{
  assert.deepEqual(rentComparisonSource.rows.map(r=>r.asking-r.paid),[560,490,-40,0,-100]);
  const input=defaults('rentInterpretation'),p=rentQuoteBudget(input);near(p.housing,2590);near(p.locationCost,2790);near(p.remaining,210);
  const edited=planningResult('rentInterpretation',{...input,quotedRent:8000,netIncome:1000});
  assert.deepEqual(edited.charts.slice(0,2),planningResult('rentInterpretation').charts.slice(0,2));
  assert.equal(edited.charts[1].type,'signedbar');assert.ok(edited.metrics[2][1]<0);
});
test('access days are whole and new charts remain finite, labelled and tabulated at supported limits',()=>{
  assert.equal(validInputs('accountAccess',{...defaults('accountAccess'),accessDay:1.5}),false);
  const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const kind of ['accountAccess','creditBackup','rentInterpretation']){
    const base=defaults(kind),fields=definitions[kind].fields,cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
    for(const input of cases){const p=planningResult(kind,input);finite(p);assert.equal(p.charts.length,4);
      for(const width of [300,760]){const html=renderResult(p,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
    }
  }
});
