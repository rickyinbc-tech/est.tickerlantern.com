import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { familyLoanCash } from '../src/planning-family-receivable-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('the month-twelve bill distinguishes on-time cash from a nominal unpaid claim and delayed receipts',()=>{
 const d=defaults('familyReceivable'),on=familyLoanCash(d),late=familyLoanCash(d,12),keep=familyLoanCash(d,0,false);
 near(on.rows[0].cash,40000);near(on.rows[12].cash,3000);near(on.rows[12].unpaid,13000);near(late.rows[12].cash,-4000);near(late.rows[12].unpaid,20000);near(keep.rows[12].cash,16000);
 near(on.extraStartingCash,0);near(late.extraStartingCash,4000);near(keep.extraStartingCash,0);
 near(on.cash,21000);near(on.unpaid,1000);near(late.cash,9000);near(late.unpaid,13000);
});
test('a separately computed closed-form receipt count agrees with the cash and unpaid-principal ledger',()=>{
 const d=defaults('familyReceivable');for(const months of [12,24,48])for(const delay of [0,6,12,36]){
  const input={...d,months},p=familyLoanCash(input,delay),count=Math.max(0,months-(d.firstRepayMonth+delay)+1),paid=Math.min(d.advance,count*d.repayment),bill=d.personalBillMonth<=months?d.personalBill:0;
  near(p.received,paid);near(p.unpaid,d.advance-paid);near(p.cash,d.cash-d.advance+months*d.monthlySurplus+paid-bill);
  for(const row of p.rows)assert.ok(row.unpaid>=0&&row.repayment>=0);
 }
});
test('principal transfers reconcile every month and the last receipt cannot overpay the original advance',()=>{
 const d={...defaults('familyReceivable'),advance:2500,repayment:1000,firstRepayMonth:1,personalBill:0},p=familyLoanCash(d);
 assert.deepEqual(p.rows.slice(1,5).map(r=>r.repayment),[1000,1000,500,0]);near(p.received,2500);near(p.unpaid,0);
 for(let month=1;month<=d.months;month++){
  near(p.rows[month-1].unpaid-p.rows[month].unpaid,p.rows[month].repayment);
  near(p.rows[month].cash-p.rows[month-1].cash,d.monthlySurplus+p.rows[month].repayment-p.rows[month].bill);
 }
});
test('the peak-funding amount lifts every date to non-negative without erasing an earlier gap using a later receipt',()=>{
 const d=defaults('familyReceivable'),p=familyLoanCash(d,12);assert.ok(p.cash>0&&p.min<0);near(p.extraStartingCash,4000);
 for(const row of p.rows)assert.ok(row.cash+p.extraStartingCash>=-1e-8);
 const funded=familyLoanCash({...d,cash:d.cash+p.extraStartingCash},12);near(funded.min,0);near(funded.cash,p.cash+4000);
});
test('zero repayment, no advance and events after the horizon remain explicit boundary cases',()=>{
 const d=defaults('familyReceivable'),zero=familyLoanCash({...d,repayment:0},0);near(zero.received,0);near(zero.unpaid,20000);
 const noAdvance=familyLoanCash({...d,advance:0});near(noAdvance.unpaid,0);near(noAdvance.received,0);assert.deepEqual(noAdvance,familyLoanCash({...d,advance:0},0,false));
 const later=familyLoanCash({...d,firstRepayMonth:48,personalBillMonth:48});near(later.received,0);near(later.cash,52000);assert.ok(later.rows.every(r=>r.bill===0));
});
test('the funding requirement includes underlying deficits and an initial advance that exceeds cash',()=>{
 const d=defaults('familyReceivable'),short=familyLoanCash({...d,cash:10000,advance:20000,personalBill:0,monthlySurplus:0},36);near(short.extraStartingCash,10000);near(short.min,-10000);
 const underlying=familyLoanCash({...d,cash:0,personalBill:0,monthlySurplus:-100},0,false);near(underlying.extraStartingCash,2400);
});
test('charts reconcile the same scenarios and all date fields enforce whole months with finite accessible figures',()=>{
 const kind='familyReceivable',d=defaults(kind),r=planningResult(kind,d),p=familyLoanCash(d,12);near(r.metrics[1][1],p.extraStartingCash);near(r.charts[0].rows.reduce((n,row)=>n+row.value,0),40000);near(r.charts[2].rows[2].value,p.extraStartingCash);near(r.charts[3].rows.find(r=>r.label==='Bill mo 12').values[2],4000);
 const variants=[d];for(const key of ['firstRepayMonth','repayDelayMonths','personalBillMonth','months'])assert.equal(validInputs(kind,{...d,[key]:1.5}),false);
 for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs(kind,input),true);const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
});
