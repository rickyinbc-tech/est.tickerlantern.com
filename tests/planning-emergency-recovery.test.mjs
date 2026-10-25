import test from 'node:test';
import assert from 'node:assert/strict';
import { emergencySurveyData as survey } from '../src/planning-emergency-recovery-data.js';
import { emergencyRecoveryDefinitions as defs, emergencyCashCheck, drawdownRecoveryLedger } from '../src/planning-emergency-recovery-models.js';
import { emergencyRecoveryGuides as guides } from '../src/planning-emergency-recovery-guides.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
import { renderFigure } from '../src/planning-charts.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('2025 SHED extract retains six distinct categories, population and question-specific indicators',()=>{
  assert.deepEqual(survey.savingsOnly.map(r=>r.percent),[18,12,9,11,12,38]);
  assert.equal(survey.savingsOnly.reduce((s,r)=>s+r.percent,0),100);
  assert.equal(survey.savingsOnly.slice(2).reduce((s,r)=>s+r.percent,0),survey.couldPay500Savings);
  assert.equal(survey.wouldPay400CashEquivalent,63);assert.equal(survey.currency,'USD');assert.equal(survey.observedYear,2025);
  assert.equal(survey.sample,12934);assert.deepEqual(survey.fieldDates,['2025-10-17','2025-10-28']);
  assert.equal(new Set(survey.savingsOnly.map(r=>r.label)).size,6);
});
test('usable-cash calculation subtracts all commitments without creating borrowing',()=>{
  assert.deepEqual(emergencyCashCheck(defaults('emergencySurveyCash')),{uncommitted:3000,available:3000,ending:-1000,gap:1000});
  assert.deepEqual(emergencyCashCheck({bankCash:100,committedCash:300,shockCost:0}),{uncommitted:-200,available:0,ending:-200,gap:200});
  assert.deepEqual(emergencyCashCheck({bankCash:0,committedCash:0,shockCost:0}),{uncommitted:0,available:0,ending:0,gap:0});
  for(const bankCash of [0,3000,100000])for(const committedCash of [0,5000,100000])for(const shockCost of [0,1000,50000]){
    const p=emergencyCashCheck({bankCash,committedCash,shockCost});assert.equal(bankCash+p.gap,committedCash+shockCost+Math.max(0,p.ending));
    assert.ok(p.available>=0&&p.gap>=0);assert.equal(p.gap>0,p.ending<0);
  }
});
test('editing the CAD scenario cannot alter the fixed USD survey charts',()=>{
  const a=planningResult('emergencySurveyCash',defaults('emergencySurveyCash'));
  const b=planningResult('emergencySurveyCash',{bankCash:100000,committedCash:0,shockCost:0});
  assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));
  assert.equal(a.charts[0].rows.length,6);assert.match(a.charts[0].unitLabel,/U.S. adults.*USD/);
  assert.match(a.note,/CAD/);assert.equal(a.charts[2].rows.reduce((s,r)=>s+r.value,0),-1000);
});
test('recovery ledger agrees with independent compound-sum closed forms including negative and zero returns',()=>{
  const base=defaults('drawdownRecovery');
  for(const originalCapital of [10000,100000,500000])for(const initialLoss of [0,30,90])for(const recoveryReturn of [-10,0,5,15])for(const recoveryYears of [1,10,20])for(const recoveryDeposit of [0,3000,30000]){
    const q={...base,originalCapital,initialLoss,recoveryReturn,recoveryYears,recoveryDeposit},p=drawdownRecoveryLedger(q),factor=1+recoveryReturn/100;
    const growthFactor=factor**recoveryYears,annuity=recoveryReturn===0?recoveryYears:(growthFactor-1)/(factor-1);
    close(p.noDeposit,originalCapital*(1-initialLoss/100)*growthFactor);
    close(p.withDeposits,p.noDeposit+recoveryDeposit*annuity);close(p.target,originalCapital*1.02**recoveryYears);
    close(p.postLoss*(1+p.requiredAnnual)**recoveryYears,p.target);
    close(p.postLoss+p.deposits+p.growth,p.withDeposits);
  }
});
test('default loss needs a larger gain and nominal recovery precedes purchasing-power recovery',()=>{
  const p=drawdownRecoveryLedger(defaults('drawdownRecovery'));
  assert.equal(p.postLoss,70000);close(p.nominalGain,3/7);close(p.realTotalGain,.7414205999925105);close(p.requiredAnnual,.05703743410852047);
  close(p.noDeposit,114022.62387442093);close(p.withDeposits,151756.3014810674);close(p.target,121899.44199947573);
  assert.equal(p.firstNominal,8);assert.equal(p.firstReal,null);assert.equal(p.deposits,30000);
  assert.ok(p.noDeposit>100000&&p.noDeposit<p.target);assert.ok(p.withDeposits>p.target);
});
test('deposits arrive after return and zero inflation unifies the two recovery thresholds',()=>{
  const q={...defaults('drawdownRecovery'),recoveryYears:1},a=drawdownRecoveryLedger(q),b=drawdownRecoveryLedger({...q,recoveryDeposit:0});
  close(a.withDeposits-b.withDeposits,q.recoveryDeposit);assert.equal(a.rows[0].withDeposits,a.postLoss);
  const p=drawdownRecoveryLedger({...defaults('drawdownRecovery'),annualInflation:0,recoveryDeposit:0});
  close(p.nominalGain,p.realTotalGain);assert.equal(p.firstNominal,p.firstReal);close(p.noDeposit,p.withDeposits);
  const zero=drawdownRecoveryLedger({...defaults('drawdownRecovery'),initialLoss:0});assert.equal(zero.firstReal,0);assert.equal(zero.firstNominal,0);
});
test('recovery horizon is a whole year and all declared input bounds produce finite accessible figures',()=>{
  assert.equal(validInputs('drawdownRecovery',{...defaults('drawdownRecovery'),recoveryYears:2.5}),false);
  assert.throws(()=>planningResult('drawdownRecovery',{...defaults('drawdownRecovery'),recoveryYears:2.5}));
  for(const [kind,definition] of Object.entries(defs)){
    const base=defaults(kind),variants=[base,Object.fromEntries(definition.fields.map(f=>[f[0],f[3]])),Object.fromEntries(definition.fields.map(f=>[f[0],f[4]])),...definition.fields.flatMap(f=>[f[3],f[4]].map(v=>({...base,[f[0]]:v})))];
    for(const q of variants){assert.ok(validInputs(kind,q));const p=planningResult(kind,q);assert.equal(p.charts.length,4);
      for(const c of p.charts)for(const width of [284,354,760]){const html=renderFigure(c,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/role="img"/);assert.match(html,/<table/);}
      assert.equal(new Set(p.charts.map(c=>c.id)).size,4);
    }
  }
});
test('both new guides contain six substantial English sections and valid related destinations',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const g of guides){assert.equal(g.sections.length,6);const words=g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').trim().split(/\s+/).length;assert.ok(words>=750,`${g.slug}: ${words} words`);assert.ok(g.related.every(s=>slugs.has(s)));assert.ok(slugs.has(g.slug));}
});
