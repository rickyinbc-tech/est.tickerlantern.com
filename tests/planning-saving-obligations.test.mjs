import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults,definitions,planningResult,validInputs } from '../src/planning-models.js';
import { maturityBudget,cesgSchedule,hbpSchedule } from '../src/planning-saving-obligations-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('ladder principal is invested once and returns with separately compounded interest at each maturity',()=>{
  const input=defaults('gicMaturities'),p=maturityBudget(input);
  near(p.rows[1].principal,10000);near(p.rows[1].interest,400);near(p.rows[2].proceeds,10816);near(p.rows[5].proceeds,10000*1.04**5);
  near(p.rows.reduce((s,r)=>s+r.principal,0),input.capital);near(p.totalProceeds,56329.754624);near(p.totalInterest,6329.754624);
  near(p.ending,input.cash+input.capital+p.totalInterest-5*input.annualNeed);near(p.ending,1329.754624);
});
test('funding is checked before the fifth maturity rather than inferred from the endpoint',()=>{
  const input=defaults('gicMaturities'),ladder=maturityBudget(input),bullet=maturityBudget(input,false);
  near(ladder.required,3836.7744);near(ladder.extra,0);near(ladder.rows[4].after,1163.2256);
  near(bullet.rows[4].after,-43000);near(bullet.extra,43000);near(bullet.totalInterest,50000*(1.04**5-1));assert.ok(bullet.ending>ladder.ending);
  const funded=maturityBudget({...input,cash:bullet.required},false);assert.ok(funded.rows.every(r=>r.after>=0));
  const zero=maturityBudget({...input,rate:0});near(zero.totalInterest,0);near(zero.required,10000);near(zero.extra,5000);
});
test('CESG default keeps prior grants, new grants and contributions in distinct ledgers',()=>{
  const p=cesgSchedule(defaults('cesgCatchup'));
  assert.equal(p.previousYears,4);near(p.priorContributions,10000);near(p.priorGrant,2000);
  assert.deepEqual(p.rows.map(r=>r.x),[13,14,15,16,17]);assert.deepEqual(p.rows.map(r=>r.grant),[1000,1000,1000,1000,1000]);
  near(p.newContributions,25000);near(p.newGrants,5000);near(p.contributions,35000);near(p.grants,7000);near(p.carry,2000);near(p.grantHeadroom,200);near(p.contributionRoom,15000);
  const chart=planningResult('cesgCatchup').charts[2];assert.ok(chart.series.every(s=>s.rows.every(r=>r.x<=17)));near(chart.series[0].rows[0].value,3000);
});
test('CESG catch-up respects annual capacity and the inclusive age-17 deadline when saving is delayed',()=>{
  const input=defaults('cesgCatchup'),delayed=cesgSchedule({...input,delayYears:2,annualContribution:7500});
  assert.deepEqual(delayed.rows.map(r=>r.grant),[0,0,1000,1000,1000]);near(delayed.newGrants,3000);
  const noPrior=cesgSchedule({...input,startAge:0,previousYears:17,annualContribution:5000});assert.equal(noPrior.previousYears,0);near(noPrior.rows[0].grant,500);
  const waitedPast=cesgSchedule({...input,startAge:17,delayYears:1});near(waitedPast.newGrants,0);near(waitedPast.newContributions,0);
});
test('CESG at 16 and 17 needs a qualifying history by the end of the year turning 15',()=>{
  const input=defaults('cesgCatchup');
  const tooLate=cesgSchedule({...input,startAge:16,previousYears:0,annualContribution:5000});near(tooLate.newContributions,10000);near(tooLate.newGrants,0);assert.ok(tooLate.rows.every(r=>!r.eligible));
  const justInTime=cesgSchedule({...input,startAge:15,previousYears:0,annualContribution:2000});assert.ok(justInTime.rows.every(r=>r.eligible));near(justInTime.newGrants,1200);
  const short=cesgSchedule({...input,startAge:15,previousYears:0,annualContribution:1999});near(short.rows[0].grant,399.8);near(short.rows[1].grant,0);near(short.rows[2].grant,0);
  const fourSmall=cesgSchedule({...input,startAge:12,previousYears:0,annualContribution:100});assert.ok(fourSmall.rows.every(r=>r.eligible));near(fourSmall.newGrants,120);
  const threeSmall=cesgSchedule({...input,startAge:13,previousYears:0,annualContribution:100});near(threeSmall.newGrants,60);assert.equal(threeSmall.rows[3].eligible,false);
});
test('CESG lifetime and RESP contribution limits stop different amounts independently',()=>{
  const input=defaults('cesgCatchup'),limited=cesgSchedule({...input,startAge:14,previousYears:14,annualContribution:15000});
  near(limited.priorGrant,7000);near(limited.rows[0].grant,200);near(limited.grants,7200);near(limited.newContributions,15000);near(limited.contributions,50000);near(limited.unplaced,45000);near(limited.contributionRoom,0);assert.ok(limited.carry>0);
  const maxed=cesgSchedule({...input,startAge:17,previousYears:17,annualContribution:15000});near(maxed.priorGrant,7200);near(maxed.newGrants,0);near(maxed.newContributions,7500);near(maxed.unplaced,7500);
});
test('HBP extra repayment recalculates later minima without skipping required years',()=>{
  const input=defaults('hbpRepay'),p=hbpSchedule(input);
  near(p.rows[0].minimum,2000);near(p.rows[0].designated,4500);near(p.rows[0].balance,25500);near(p.rows[1].minimum,25500/14);near(p.rows[1].inclusion,4500/14);
  near(p.repayments,25500);near(p.inclusions,4500);near(p.tax,1350);near(p.cash,26850);near(p.balance,0);
  for(const r of p.rows)near(r.opening-r.designated-r.inclusion,r.balance);
  near(p.repayments+p.inclusions,input.balance);assert.equal(p.rows.at(-1).x,2045);
});
test('HBP income inclusion clears the ledger without pretending to restore savings or pay the whole inclusion as tax',()=>{
  const input=defaults('hbpRepay'),none=hbpSchedule({...input,annualRepayment:0,firstExtra:0});near(none.repayments,0);near(none.inclusions,30000);near(none.tax,9000);near(none.cash,9000);near(none.balance,0);
  const minimum=hbpSchedule({...input,annualRepayment:2000,firstExtra:0});near(minimum.repayments,30000);near(minimum.inclusions,0);near(minimum.tax,0);
  const flatZero=hbpSchedule({...input,taxAllowance:0});near(flatZero.repayments,25500);near(flatZero.inclusions,4500);near(flatZero.cash,25500);
});
test('HBP clears early only up to balance and uses the calendar field as a label',()=>{
  const input=defaults('hbpRepay'),early=hbpSchedule({...input,firstExtra:60000});near(early.repayments,30000);near(early.rows[0].designated,30000);assert.ok(early.rows.slice(1).every(r=>r.minimum===0&&r.designated===0));
  const shifted=hbpSchedule({...input,firstYear:2026});near(shifted.repayments,25500);near(shifted.inclusions,4500);assert.equal(shifted.rows[0].x,2026);
  const last=hbpSchedule({...input,remainingYears:1,firstExtra:0});near(last.rows[0].minimum,30000);near(last.inclusions,28500);near(last.balance,0);
});
test('saving-obligation calendars reject fractional ages, years and remaining periods',()=>{
  for(const [kind,key] of [['cesgCatchup','startAge'],['cesgCatchup','previousYears'],['cesgCatchup','delayYears'],['hbpRepay','remainingYears'],['hbpRepay','firstYear']])assert.equal(validInputs(kind,{...defaults(kind),[key]:defaults(kind)[key]+.5}),false);
});
test('saving-obligation graphics remain finite and provide tables at individual and combined field limits',()=>{
  const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
  for(const kind of ['gicMaturities','cesgCatchup','hbpRepay']){
    const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input),count=kind==='cesgCatchup'?5:4;finite(result);assert.equal(result.charts.length,count);
      for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,count);assert.equal((html.match(/<caption>/g)||[]).length,count);}}
  }
});
