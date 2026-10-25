import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { rrspWithholdingRate, rrspWithdrawalCash, oasRecoveryPlan, returnWorkBudget, paymentRules } from '../src/planning-payments-work-models.js';
import { childcareSource } from '../src/planning-childcare-data.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('child-care snapshot retains dated units, complete 2025 regional coverage and the cross-year coverage limitation',()=>{
  assert.equal(childcareSource.released,'2025-10-21');assert.equal(childcareSource.retrieved,'2026-10-25');assert.equal(childcareSource.table,'42-10-0053-01');
  assert.deepEqual(childcareSource.national,[{year:2022,value:663},{year:2023,value:508},{year:2025,value:435}]);
  assert.equal(childcareSource.regions.length,13);assert.equal(new Set(childcareSource.regions.map(r=>r.label)).size,13);
  assert.deepEqual(childcareSource.regions.map(r=>r.value),[242,206,383,386,348,542,264,260,452,571,280,352,293]);
  assert.match(childcareSource.population,/30\+ hours/);assert.match(childcareSource.unit,/Current CAD per month/);assert.match(childcareSource.comparisonNote,/2022.*excludes territories/);
  for(const hash of [childcareSource.releaseSHA256,childcareSource.chartSHA256])assert.match(hash,/^[0-9a-f]{64}$/);
});
test('RRSP withholding thresholds apply to the whole single request, with zero treated as no withdrawal',()=>{
  assert.deepEqual([0,5000,5000.01,15000,15000.01,100000].map(rrspWithholdingRate),[0,.1,.2,.2,.3,.3]);
  const input=defaults('rrspCash');near(rrspWithdrawalCash({...input,gross:15000}).withheld,3000);near(rrspWithdrawalCash({...input,gross:15000.01}).withheld,4500);
  near(rrspWithdrawalCash({...input,gross:5000}).immediate+input.fee,4500);near(rrspWithdrawalCash({...input,gross:5000.01}).immediate+input.fee,4000.01);
});
test('RRSP immediate cash and incremental settlement reconcile without deducting prepaid tax twice',()=>{
  const input=defaults('rrspCash'),p=rrspWithdrawalCash(input);near(p.withheld,2000);near(p.immediate,7950);near(p.estimatedTax,3000);near(p.settlement,1000);near(p.afterTax,6950);near(p.spendingBalance,-50);
  for(const taxEstimate of [0,10,20,30,55]){const q=rrspWithdrawalCash({...input,taxEstimate});near(q.immediate-q.settlement,q.afterTax);near(q.withheld,p.withheld);}
  const excess=rrspWithdrawalCash({...input,taxEstimate:10});near(excess.settlement,-1000);near(excess.afterTax,8950);
});
test('zero RRSP transaction charges no fee while a separately paid fee can require other cash',()=>{
  const input=defaults('rrspCash'),zero=rrspWithdrawalCash({...input,gross:0,fee:1000});near(zero.withheld,0);near(zero.fee,0);near(zero.immediate,0);
  const fee=rrspWithdrawalCash({...input,gross:100,fee:1000});near(fee.immediate,-910);near(fee.afterTax,-930);
});
test('OAS illustration fixes the 2025 threshold and caps recovery without adding pension to entered income again',()=>{
  assert.equal(paymentRules.oasIncomeYear,2025);assert.equal(paymentRules.oasThreshold,93454);assert.equal(paymentRules.oasRate,.15);
  const input=defaults('oasRecovery'),p=oasRecoveryPlan(input);near(p.excess,6546);near(p.recovery,981.9);near(p.retainedAnnual,8018.1);
  near(oasRecoveryPlan({...input,income:93454}).recovery,0);near(oasRecoveryPlan({...input,income:93455}).recovery,.15);
  near(oasRecoveryPlan({...input,income:200000}).recovery,9000);near(oasRecoveryPlan({...input,annualOAS:0}).recovery,0);
});
test('OAS cash calendar changes after June and preserves cent arithmetic without treating it as the annual liability',()=>{
  const p=oasRecoveryPlan(defaults('oasRecovery'));near(p.monthlyDeduction,81.83);near(p.monthlyRetained,668.17);assert.equal(p.rows.length,18);
  for(const row of p.rows){near(row.gross-row.deduction,row.retained);near(row.deduction,row.x<=6?0:81.83);}
  near(p.rows.filter(r=>r.x>=7&&r.x<=12).reduce((s,r)=>s+r.deduction,0),490.98);near(p.rows.filter(r=>r.x>=13).reduce((s,r)=>s+r.deduction,0),490.98);
  near(12*p.monthlyDeduction-p.recovery,.06);
});
test('later OAS cash caps do not change the simplified earlier-year recovery',()=>{
  const input=defaults('oasRecovery'),p=oasRecoveryPlan({...input,monthlyOAS:10,oldDeduction:2000});near(p.recovery,981.9);near(p.monthlyDeduction,10);near(p.monthlyRetained,0);
  assert.ok(p.rows.every(r=>r.retained>=0&&r.deduction<=r.gross));
  const noLaterPension=oasRecoveryPlan({...input,monthlyOAS:0});near(noLaterPension.recovery,981.9);near(noLaterPension.monthlyDeduction,0);
  const prior=oasRecoveryPlan({...input,oldDeduction:100});near(prior.rows[5].retained,650);near(prior.rows[6].retained,668.17);
});
test('return-to-work recurring differences and setup produce an independently reconciled cumulative budget',()=>{
  const input=defaults('returnWork'),p=returnWorkBudget(input);near(p.monthly,1850);near(p.total,20700);near(p.rows[0].value,-1500);near(p.rows[1].value,350);assert.equal(p.recoveryMonth,1);assert.equal(p.withinHorizon,true);
  near(p.total,input.months*input.netPay-input.months*(input.care+input.commute+input.otherWork+input.lostIncome)-input.setup);
  const waterfall=planningResult('returnWork').charts[2];near(waterfall.rows.reduce((s,r)=>s+r.value,0),p.monthly);
});
test('setup recovery distinguishes no recovery, recovery beyond the horizon and zero setup',()=>{
  const input=defaults('returnWork');
  const zero=returnWorkBudget({...input,netPay:1650});near(zero.monthly,0);assert.equal(zero.recoveryMonth,null);near(zero.total,-1500);
  const loss=returnWorkBudget({...input,netPay:1000});assert.equal(loss.recoveryMonth,null);assert.ok(loss.total<0);
  const late=returnWorkBudget({...input,setup:5000,months:1});assert.equal(late.recoveryMonth,3);assert.equal(late.withinHorizon,false);
  assert.match(renderResult(planningResult('returnWork',{...input,setup:5000,months:1})),/Beyond horizon/);
  const noSetup=returnWorkBudget({...input,setup:0,netPay:0});assert.equal(noSetup.recoveryMonth,0);assert.equal(noSetup.withinHorizon,true);assert.ok(noSetup.total<0);
});
test('official child-care figures remain unchanged when household assumptions change',()=>{
  const first=planningResult('returnWork'),second=planningResult('returnWork',{...defaults('returnWork'),netPay:12000,care:5000,months:24,setup:20000});
  assert.deepEqual(first.charts.slice(0,2),second.charts.slice(0,2));assert.equal(first.charts[1].rows.length,13);
  assert.equal(validInputs('returnWork',{...defaults('returnWork'),months:1.5}),false);
});
test('withdrawal, OAS and work models render finite accessible figures at supported field edges',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['rrspCash','oasRecovery','returnWork']){
    const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input),count=kind==='returnWork'?5:4;finite(result);assert.equal(result.charts.length,count);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,count);assert.equal((html.match(/<caption>/g)||[]).length,count);}}
  }
});
