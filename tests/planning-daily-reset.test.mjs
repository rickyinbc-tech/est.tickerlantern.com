import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {dailyResetPaths,compoundDailyReturns} from '../src/planning-daily-reset-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('flat-index defaults reproduce ten exact 54/55 two-day account factors',()=>{
 const d=defaults('dailyReset'),p=dailyResetPaths(d);assert.equal(p.days,20);near(p.pairedReturns[0],.1);near(p.pairedReturns[1],-1/11);near(p.pairedAccount[1].value,12000);near(p.pairedAccount[2].value,10000*54/55);near(p.pairedEnd,10000*(54/55)**10);near(p.pairedEnd,8323.59045080193);near(p.smoothEnd,10000);near(p.reference,10000);near(p.gap,-1676.40954919807);
 for(const row of p.pairedIndex.filter(row=>row.x%2===0))near(row.value,100);
});
test('both benchmark endpoints match for independent trend, swing, horizon and multiple cases',()=>{
 const d=defaults('dailyReset');for(const terminalMove of [-20,0,20])for(const pairedSwing of [0,10,20])for(const cyclePairs of [1,10,30])for(const dailyMultiple of [1,2,3]){
  const p=dailyResetPaths({...d,terminalMove,pairedSwing,cyclePairs,dailyMultiple});near(p.smoothIndex.at(-1).value,100+terminalMove);near(p.pairedIndex.at(-1).value,100+terminalMove);assert.ok(p.pairedReturns.every(r=>1+dailyMultiple*r>0));assert.ok(p.pairedAccount.every(r=>Number.isFinite(r.value)&&r.value>0));
  if(dailyMultiple===1){near(p.smoothEnd,10000*(1+terminalMove/100));near(p.pairedEnd,p.smoothEnd);assert.equal(p.gap,0);}
 }
});
test('each ideal account day independently equals the stated multiple of its benchmark daily return',()=>{
 const d=defaults('dailyReset'),p=dailyResetPaths({...d,terminalMove:17,pairedSwing:20,dailyMultiple:3});
 for(const [index,account] of [[p.smoothIndex,p.smoothAccount],[p.pairedIndex,p.pairedAccount]])for(let i=1;i<index.length;i++)near(account[i].value/account[i-1].value-1,3*(index[i].value/index[i-1].value-1));
});
test('reversing or sorting the same daily-return set preserves the endpoint without promising the same interim capital',()=>{
 const d=defaults('dailyReset'),p=dailyResetPaths(d),reversed=compoundDailyReturns([...p.pairedReturns].reverse(),d.resetCapital,2),sorted=compoundDailyReturns([...p.pairedReturns].sort((a,b)=>a-b),d.resetCapital,2);
 near(reversed.at(-1).value,p.pairedEnd);near(sorted.at(-1).value,p.pairedEnd);assert.notEqual(reversed[1].value,p.pairedAccount[1].value);assert.notEqual(sorted[2].value,p.pairedAccount[2].value);
});
test('a smooth positive trend can finish above the multiple-of-full-period arithmetic reference',()=>{
 const p=dailyResetPaths({...defaults('dailyReset'),cyclePairs:1,terminalMove:20,pairedSwing:0});near(p.smoothEnd,10000*(2*Math.sqrt(1.2)-1)**2);near(p.smoothEnd,14182.1953995867);near(p.reference,14000);assert.ok(p.gap>0);assert.deepEqual(p.pairedReturns,p.smoothReturns);
});
test('capital scaling leaves benchmark points unchanged and endpoint charts retain the correct reference',()=>{
 const d=defaults('dailyReset'),a=dailyResetPaths(d),b=dailyResetPaths({...d,resetCapital:20000});near(b.pairedEnd,2*a.pairedEnd);near(b.gap,2*a.gap);assert.deepEqual(a.pairedIndex,b.pairedIndex);
 const r=planningResult('dailyReset',d);near(r.charts[2].rows[1].value,a.pairedEnd);near(r.charts[2].rows[2].value,10000);assert.ok(r.charts[3].rows[0].values.every(v=>v===0));assert.match(r.note,/Different paired-swing settings change the return set/);
});
test('integer controls and supported field endpoints render four finite figures with benchmark points separate from CAD',()=>{
 const d=defaults('dailyReset');for(const key of ['cyclePairs','dailyMultiple'])assert.equal(validInputs('dailyReset',{...d,[key]:1.5}),false);
 const variants=[d];for(const [key,,,min,max] of definitions.dailyReset.fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs('dailyReset',input),true);const html=renderResult(planningResult('dailyReset',input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/benchmark points/);}
});
