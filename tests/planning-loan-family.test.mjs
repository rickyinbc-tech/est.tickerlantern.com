import test from 'node:test';
import assert from 'node:assert/strict';
import {loanFamilyDefinitions as defs,loanAdvanceLedger,ccbCashLedger} from '../src/planning-loan-family-models.js';
import {ccbCalendarSource as ccb} from '../src/planning-loan-family-data.js';
import {loanFamilyGuides as guides} from '../src/planning-loan-family-guides.js';
import {defaults,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderFigure} from '../src/planning-charts.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('withheld-fee loan separates cash proceeds, unchanged principal and borrowing cost',()=>{
  const q=defaults('loanAdvanceFee'),p=loanAdvanceLedger(q),free=loanAdvanceLedger({...q,withheldFee:0});
  assert.equal(p.netCash,9500);assert.equal(p.fee,500);close(p.payment,313.3636546143085);close(p.interestTotal,1281.0915661151057);close(p.cost,1781.0915661151066);
  close(p.effectiveCashRate,.12148447800967815);close(free.effectiveCashRate,.08299950680751075);assert.deepEqual(p.rows,free.rows);
  close(p.payments-p.netCash,p.interestTotal+p.fee);assert.equal(p.rows.at(-1).balance,0);
});
test('loan rate solves the independent discounted payment sum and each balance matches a closed form',()=>{
  const base=defaults('loanAdvanceFee');
  for(const advancePrincipal of [1000,10000,50000])for(const advanceRate of [0,8,15])for(const advanceMonths of [12,36,60])for(const withheldFee of [0,1,5]){
    const q={...base,advancePrincipal,advanceRate,advanceMonths,withheldFee},p=loanAdvanceLedger(q),j=advanceRate/1200;
    const pv=p.rows.slice(1).reduce((s,row)=>s+row.payment/(1+p.monthlyCashRate)**row.x,0);close(pv,p.netCash);
    for(const row of p.rows){const k=row.x,expected=j===0?advancePrincipal-k*p.payment:advancePrincipal*(1+j)**k-p.payment*((1+j)**k-1)/j;close(row.balance,expected);assert.ok(row.balance>=0);close(row.principalPaid+row.balance,advancePrincipal);}
    close(p.payments,p.payment*advanceMonths);close(p.interestTotal+p.fee,p.cost);assert.ok(p.effectiveCashRate>=p.effectiveNoFee-1e-12);
    if(withheldFee===0)close(p.monthlyCashRate,j);
  }
});
test('fee percentage produces the same cash-flow rate at different principal sizes and zero interest is supported',()=>{
  const q=defaults('loanAdvanceFee'),a=loanAdvanceLedger(q),b=loanAdvanceLedger({...q,advancePrincipal:2*q.advancePrincipal});
  close(a.effectiveCashRate,b.effectiveCashRate);close(b.payment,2*a.payment);close(b.netCash,2*a.netCash);
  const zero=loanAdvanceLedger({...q,advanceRate:0,withheldFee:0});close(zero.interestTotal,0);close(zero.effectiveCashRate,0);close(zero.payment,q.advancePrincipal/q.advanceMonths);
  const feeOnly=loanAdvanceLedger({...q,advanceRate:0});assert.ok(feeOnly.effectiveCashRate>0);close(feeOnly.cost,feeOnly.fee);
});
test('fixed CCB calendar retains all official 2026 dates and the July base-tax-year boundary',()=>{
  assert.deepEqual(ccb.dates,['2026-01-20','2026-02-20','2026-03-20','2026-04-20','2026-05-20','2026-06-19','2026-07-20','2026-08-20','2026-09-18','2026-10-20','2026-11-20','2026-12-11']);
  assert.deepEqual(ccb.baseTaxYears,[2024,2024,2024,2024,2024,2024,2025,2025,2025,2025,2025,2025]);
  const p=ccbCashLedger(defaults('ccbCashCalendar'));assert.equal(p.expectedBenefits,6300);assert.equal(p.benefitsInYear,6300);assert.equal(p.yearEnd,900);assert.equal(p.extra,450);assert.equal(p.requiredOpening,450);assert.equal(p.receipts.length,12);
  assert.equal(p.receipts[5].amount,450);assert.equal(p.receipts[6].amount,600);assert.equal(p.rows.at(-1).label,'2026-12-31 · year-end');
});
test('CCB no-lag funding need agrees with an independent bill-before-receipt cumulative formula',()=>{
  const base=defaults('ccbCashCalendar');
  for(const childOpening of [0,500,10000])for(const childFunding of [0,150,2000])for(const childExpense of [0,600,3000])for(const ccbFirstHalf of [0,450,2000])for(const ccbSecondHalf of [0,600,2000]){
    const q={...base,childOpening,childFunding,childExpense,ccbFirstHalf,ccbSecondHalf},p=ccbCashLedger(q);
    const required=Math.max(0,...Array.from({length:12},(_,i)=>{const m=i+1;return m*(childExpense-childFunding)-Math.min(m-1,6)*ccbFirstHalf-Math.max(0,m-7)*ccbSecondHalf;}));
    close(p.requiredOpening,required);close(p.extra,Math.max(0,required-childOpening));close(p.yearEnd,childOpening+12*childFunding+6*ccbFirstHalf+6*ccbSecondHalf-12*childExpense);
  }
});
test('receipt lag increases interim needs and keeps post-year receipts outside the year-end balance',()=>{
  const q=defaults('ccbCashCalendar'),a=ccbCashLedger({...q,ccbLagDays:14}),b=ccbCashLedger({...q,ccbLagDays:35});
  assert.equal(a.extra,900);assert.equal(a.yearEnd,900);assert.equal(a.laterBenefits,0);
  assert.equal(b.benefitsInYear,5700);assert.equal(b.laterBenefits,600);assert.equal(b.yearEnd,300);assert.equal(b.ending,900);assert.equal(b.rows.at(-1).label,'2027-01-15 · benefit');
  assert.ok(b.events.filter(e=>e.date>'2026-12-31').every(e=>e.type==='benefit'));
  const collision=ccbCashLedger({...q,ccbLagDays:12});assert.deepEqual(collision.events.filter(e=>e.date==='2026-02-01').map(e=>e.type),['funding','expense','benefit']);
  const zero=ccbCashLedger({...q,childOpening:0,childFunding:0,childExpense:0,ccbFirstHalf:0,ccbSecondHalf:0});assert.equal(zero.requiredOpening,0);assert.equal(zero.ending,0);
  const result=planningResult('ccbCashCalendar',{...q,ccbLagDays:35});assert.equal(result.charts[2].rows.reduce((s,r)=>s+r.value,0),b.yearEnd);assert.match(result.charts[0].evidence,/Official 2026 schedule.*hypothetical/);
});
test('new whole-period inputs are enforced and all declared boundaries render finite accessible figures',()=>{
  assert.equal(validInputs('loanAdvanceFee',{...defaults('loanAdvanceFee'),advanceMonths:30.5}),false);
  assert.equal(validInputs('ccbCashCalendar',{...defaults('ccbCashCalendar'),ccbLagDays:30.5}),false);
  for(const [kind,def] of Object.entries(defs)){
    const base=defaults(kind),variants=[base,Object.fromEntries(def.fields.map(f=>[f[0],f[3]])),Object.fromEntries(def.fields.map(f=>[f[0],f[4]])),...def.fields.flatMap(f=>[f[3],f[4]].map(v=>({...base,[f[0]]:v})))];
    for(const q of variants){assert.ok(validInputs(kind,q));const p=planningResult(kind,q);assert.equal(p.charts.length,4);assert.equal(new Set(p.charts.map(c=>c.id)).size,4);
      for(const c of p.charts)for(const width of [300,354,760]){const html=renderFigure(c,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/role="img"/);assert.match(html,/<table/);}
    }
  }
});
test('both guides provide six substantial English sections and resolve unique related destinations',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const g of guides){assert.equal(g.sections.length,6);assert.ok(g.related.every(s=>slugs.has(s)));const words=g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').trim().split(/\s+/).length;assert.ok(words>=750,`${g.slug}: ${words}`);assert.ok(slugs.has(g.slug));}
});
