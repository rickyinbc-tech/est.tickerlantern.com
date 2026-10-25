import test from 'node:test';
import assert from 'node:assert/strict';
import {renewalAccessDefinitions as defs,premiumRenewalLedger,depositAccessLedger} from '../src/planning-renewal-access-models.js';
import {renewalAccessGuides as guides} from '../src/planning-renewal-access-guides.js';
import {defaults,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderFigure} from '../src/planning-charts.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('premium default saves early cash and later spends the same household reserve',()=>{
  const p=premiumRenewalLedger(defaults('termPremiumReserve'));
  assert.equal(p.blockMonths,120);assert.equal(p.totalMonths,240);assert.equal(p.firstPremiums,6000);assert.equal(p.nextPremiums,30000);assert.equal(p.totalPremium,36000);assert.equal(p.totalAssigned,36000);
  assert.equal(p.peak.x,120);assert.equal(p.peak.value,12000);assert.equal(p.extra,0);assert.equal(p.ending,0);
  assert.equal(p.rows[120].premium,50);assert.equal(p.rows[121].premium,250);assert.equal(p.rows[121].value,11900);
});
test('premium funding need and peak agree with independent piecewise-linear endpoint formulas',()=>{
  const base=defaults('termPremiumReserve');
  for(const currentTermPremium of [0,50,500])for(const nextTermPremium of [0,250,1000])for(const premiumAssignment of [0,150,1000])for(const premiumPeriodYears of [1,10,20])for(const premiumOpening of [0,50000]){
    const q={...base,currentTermPremium,nextTermPremium,premiumAssignment,premiumPeriodYears,premiumOpening},p=premiumRenewalLedger(q),n=12*premiumPeriodYears,first=n*(premiumAssignment-currentTermPremium),last=n*(2*premiumAssignment-currentTermPremium-nextTermPremium);
    const required=Math.max(0,-first,-last);assert.equal(p.requiredOpening,required);assert.equal(p.extra,Math.max(0,required-premiumOpening));assert.equal(p.peak.value,premiumOpening+Math.max(0,first,last));assert.equal(p.ending,premiumOpening+last);
    assert.equal(premiumOpening+p.totalAssigned-p.totalPremium,p.ending);
    for(const row of p.rows)assert.equal(row.value,premiumOpening+Math.min(row.x,n)*(premiumAssignment-currentTermPremium)+Math.max(0,row.x-n)*(premiumAssignment-nextTermPremium));
  }
});
test('adding an opening reserve cannot change premiums or imply a policy cash value',()=>{
  const q=defaults('termPremiumReserve'),a=premiumRenewalLedger({...q,premiumAssignment:100}),b=premiumRenewalLedger({...q,premiumAssignment:100,premiumOpening:12000});
  assert.equal(a.extra,12000);assert.equal(b.extra,0);assert.equal(a.totalPremium,b.totalPremium);assert.equal(b.ending-a.ending,12000);
  const p=planningResult('termPremiumReserve',q);assert.match(p.note,/No death event/);assert.match(p.charts[1].note,/not a term policy/);assert.equal(p.charts[2].rows.reduce((s,r)=>s+r.value,0),0);
});
test('deposit default funds a common bill and reconciles principal, both interest streams and bridge cost',()=>{
  const p=depositAccessLedger(defaults('depositEarlyBill'));
  assert.equal(p.bill,5000);assert.equal(p.firstDays,90);assert.equal(p.remainingDays,275);close(p.cashableInterest,486.986301369863);close(p.lockedInterest,900);close(p.loanInterest,301.369863013699);
  close(p.cashableEnding,15486.986301369863);close(p.lockedEnding,15598.630136986301);close(p.difference,111.643835616438);
  close(p.interestAdvantage-p.loanInterest,p.difference);
});
test('deposit interest agrees with an independent daily-principal ledger across sizes, dates and bill fractions',()=>{
  const base=defaults('depositEarlyBill');
  for(const accessPrincipal of [1000,20000,100000])for(const accessBillPercent of [0,25,90])for(const accessBillDay of [30,90,364])for(const accessLoanRate of [0,8,20]){
    const q={...base,accessPrincipal,accessBillPercent,accessBillDay,accessLoanRate},p=depositAccessLedger(q);let cashable=0,loan=0;
    for(let day=0;day<365;day++){cashable+=(day<accessBillDay?accessPrincipal:accessPrincipal-p.bill)*q.cashableYield/100/365;if(day>=accessBillDay)loan+=p.bill*accessLoanRate/100/365;}
    close(p.cashableInterest,cashable);close(p.loanInterest,loan);close(p.cashableEnding,accessPrincipal-p.bill+cashable);close(p.lockedEnding,accessPrincipal+p.lockedInterest-p.bill-loan);
    close(p.lockedEnding-p.cashableEnding,p.lockedInterest-cashable-loan);
  }
});
test('no bill eliminates borrowing and a negative maturity result remains an outside funding gap',()=>{
  const q=defaults('depositEarlyBill'),none=depositAccessLedger({...q,accessBillPercent:0});assert.equal(none.bill,0);assert.equal(none.loanInterest,0);close(none.difference,q.accessPrincipal*(q.lockedYield-q.cashableYield)/100);
  const stressed={...q,accessBillPercent:90,accessBillDay:30,lockedYield:0,accessLoanRate:20},p=depositAccessLedger(stressed);assert.ok(p.lockedEnding<0);close(p.lockedEnding,-1304.109589041096);
  const result=planningResult('depositEarlyBill',stressed);assert.equal(result.charts[0].type,'signedbar');close(result.charts[1].rows.reduce((s,r)=>s+r.value,0),p.lockedEnding);close(result.charts[2].rows.reduce((s,r)=>s+r.value,0),p.difference);assert.match(result.note,/negative settlement endpoint requires outside cash/);
});
test('whole timing inputs are enforced and supported boundaries render finite accessible charts',()=>{
  assert.equal(validInputs('termPremiumReserve',{...defaults('termPremiumReserve'),premiumPeriodYears:2.5}),false);assert.equal(validInputs('depositEarlyBill',{...defaults('depositEarlyBill'),accessBillDay:30.5}),false);
  for(const [kind,def] of Object.entries(defs)){
    const base=defaults(kind),variants=[base,Object.fromEntries(def.fields.map(f=>[f[0],f[3]])),Object.fromEntries(def.fields.map(f=>[f[0],f[4]])),...def.fields.flatMap(f=>[f[3],f[4]].map(v=>({...base,[f[0]]:v})))];
    if(kind==='depositEarlyBill')variants.push({...base,accessBillPercent:90,accessBillDay:30,lockedYield:0,accessLoanRate:20});
    for(const q of variants){assert.ok(validInputs(kind,q));const p=planningResult(kind,q);assert.equal(p.charts.length,4);assert.equal(new Set(p.charts.map(c=>c.id)).size,4);
      for(const c of p.charts)for(const width of [300,354,760]){const html=renderFigure(c,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/role="img"/);assert.match(html,/<table/);}
    }
  }
});
test('new articles have six detailed English sections and unique linked destinations',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const g of guides){assert.equal(g.sections.length,6);assert.ok(g.related.every(s=>slugs.has(s)));const words=g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').trim().split(/\s+/).length;assert.ok(words>=750,`${g.slug}: ${words}`);assert.ok(slugs.has(g.slug));}
});
