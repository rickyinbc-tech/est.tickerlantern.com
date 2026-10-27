import test from 'node:test';
import assert from 'node:assert/strict';
import {planningResult,validInputs,defaults} from '../src/planning-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {allocate,taxEffect,separationChoice,breakEvenSpousal,supportYear,SP_STATS} from '../src/planning-support-payments-models.js';
import {DTC_STATS} from '../src/planning-dtc-transfer-models.js';

const kind='supportPayments';
test('payments fill child support (arrears first) before spousal support',()=>{
 const base={arrears:0,childDue:12000,spousalDue:18000};
 assert.deepEqual(allocate({...base,paid:30000}),{toArrears:0,toChild:12000,toSpousal:18000,childUnpaid:0,spousalUnpaid:0,deductible:18000});
 assert.equal(allocate({...base,paid:24000}).deductible,12000);
 assert.deepEqual([allocate({...base,paid:10000}).deductible,allocate({...base,paid:10000}).childUnpaid],[0,2000]);
 const late=allocate({...base,arrears:5000,paid:30000});assert.deepEqual([late.toArrears,late.toChild,late.toSpousal,late.spousalUnpaid],[5000,12000,13000,5000]);
 assert.equal(allocate({...base,paid:0}).childUnpaid,12000);
 // the deduction falls dollar for dollar with the shortfall once child support is covered
 for(let p=0;p<=30000;p+=500)assert.equal(allocate({...base,paid:p}).deductible,Math.max(0,p-12000));
});
test('default former couple matches the worked year in the article',()=>{
 const d=defaults(kind),y=supportYear(d);
 assert.deepEqual([y.saved,y.added,y.net,y.payerCost,y.recipKept,y.rrspRecip],[3690,2520,1170,26310,27480,3240]);
 assert.equal(y.rrspPayer,-3240);
 assert.deepEqual(planningResult(kind,d).metrics.map(m=>m[1]),[18000,3690,2520,1170,0]);
 assert.equal(supportYear({...d,spPaid:24000}).saved,2460);
 const short=supportYear({...d,spPaid:10000});assert.deepEqual([short.saved,short.added,short.childUnpaid],[0,0,2000]);
 assert.equal(taxEffect(d,0).net,0);
});
test('year-of-separation choice and break-even spousal support',()=>{
 const d={...defaults(kind),spSepYear:1};
 assert.equal(breakEvenSpousal(d),11235);assert.ok(Math.abs(2303.28/.205-breakEvenSpousal(d))<1);
 const low=separationChoice({...d,spSpousalDue:8000,spPaid:20000});assert.deepEqual(low,{credit:2303.28,deduction:1640,better:'credit'});
 const y=supportYear({...d,spSpousalDue:8000,spPaid:20000});assert.deepEqual([y.claimed,y.credit,y.added],[0,2303.28,1120]);
 assert.equal(supportYear(d).claimed,18000);
});
test('CRA 2024 item 37 statistics reconcile with the published totals',()=>{
 const s=SP_STATS.rows.reduce((a,r)=>[a[0]+r[1],a[1]+r[2]],[0,0]);
 assert.deepEqual(s,[51390,1123951]);assert.ok(Math.abs(s[0]-SP_STATS.total[0])<=50&&Math.abs(s[1]-SP_STATS.total[1])<=5);
 assert.ok(SP_STATS.rows.every((r,k)=>r[0]===DTC_STATS.rows[k][0]));
 assert.equal(Math.round(SP_STATS.total[1]*1000/SP_STATS.total[0]),21884);
 assert.equal(Math.round(SP_STATS.rows.at(-1)[2]*1000/SP_STATS.rows.at(-1)[1]),68855);
 assert.equal(Math.round(SP_STATS.rows.at(-1)[2]/SP_STATS.total[1]*100),54);
});
test('input limits, guide wiring and accessible figures remain valid',()=>{
 const d=defaults(kind),guide=planningGuides.find(g=>g.slug==='spousal-child-support-tax-deductible-priority-rule-lines-22000-12800');
 assert.ok(guide);assert.ok(guide.sources.length>=9);assert.ok(guide.sections.length>=8);
 assert.equal(guide.related.length,3);assert.ok(guide.related.every(s=>planningGuides.some(g=>g.slug===s)));
 assert.equal(planningGuides.filter(g=>g.planning===kind).length,1);
 for(const bad of [{...d,spPaid:30100},{...d,spSepYear:.5},{...d,spPayerEarn:150000},{...d,spArrears:-1}])assert.equal(validInputs(kind,bad),false);
 for(const input of [d,{...d,spPaid:0},{...d,spPayerNet:0,spPayerEarn:0,spPaid:0},{...d,spRecipNet:200000,spRecipEarn:200000},{...d,spSepYear:1,spSpousalDue:5000,spPaid:17000},{...d,spArrears:20000,spPaid:50000},{...d,spPayerNet:400000,spPayerEarn:400000,spSpousalDue:240000,spPaid:252000}]){
  assert.ok(validInputs(kind,input));const result=planningResult(kind,input),html=renderResult(result,360);
  assert.equal(result.charts.length,6);assert.equal((html.match(/<svg /g)||[]).length,6);assert.equal((html.match(/<caption>/g)||[]).length,6);
  assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"|-\$0\b/);
 }
});
