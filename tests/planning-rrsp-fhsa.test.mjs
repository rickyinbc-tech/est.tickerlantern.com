import test from 'node:test';
import assert from 'node:assert/strict';
import { rrspFhsaCompare, rrspFhsaPlan, hbpSchedule, FHSA_FLOWS } from '../src/planning-rrsp-fhsa-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b}`);
const base=defaults('rrspFhsaTransfer');
const two=(c,k)=>[c.plans[k].homeCash,c.plans[k].netWorth];

test('worked cases match the independent Decimal check',()=>{
 const cases=[[{},[41731.776,43728.5133],[50477.696,46325.6832],[46731.776,45176.9344]],
  [{rftCash:8000},[58463.552,60460.2893],[58463.552,60460.2893],[59717.632,58162.7904]],
  [{rftCash:0},[25000,26996.7366],[33745.92,32191.0815],[33745.92,32191.0815]],
  [{rftTaxRet:40},[41731.776,36979.3306],[50477.696,42173.6704],[46731.776,43622.0928]],
  [{rftTaxRet:30},[41731.776,40353.9219],[50477.696,44249.6768],[46731.776,44399.5136]]];
 for(const [o,a,b,c] of cases){const r=rrspFhsaCompare({...base,...o});
  for(const [k,v] of [['cashOnly',a],['topUp',b],['transferFirst',c]])two(r,k).forEach((x,j)=>near(x,v[j],1e-2));}
 const d=rrspFhsaCompare(base);assert.equal(d.best.strategy,'topUp');near(d.plans.topUp.transferIn,12000);near(d.plans.topUp.hbp,20760.064,1e-3);
 assert.equal(rrspFhsaCompare({...base,rftTaxRet:40}).best.strategy,'transferFirst');
 const five=rrspFhsaCompare({...base,rftYears:5});near(five.plans.transferFirst.hbp,0);near(five.plans.topUp.netWorth,62737.54,1e-2);
});

test('FHSA room, lifetime limit and HBP limits are respected across a sweep',()=>{
 for(const rrsp of [0,5000,30000,120000])for(const cash of [0,3000,8000,20000])for(const years of [1,3,6,15])for(const used of [0,20000,36000])for(const s of ['cashOnly','topUp','transferFirst']){
  const i={...base,rftRrsp:rrsp,rftCash:cash,rftYears:years,rftUsed:used,rftRoom:Math.min(8000,40000-used),rftHbp:60000},p=rrspFhsaPlan(i,s);
  let total=0;for(const r of p.rows){assert.ok(r.cash+r.transfer<=r.room+1e-9&&r.room<=16000+1e-9&&r.unused>=-1e-9);total+=r.cash+r.transfer;}
  assert.ok(total<=40000-used+1e-9);assert.ok(p.transferIn<=rrsp*(1+i.rftReturn/100)**years+1e-9);assert.ok(p.hbp<=60000&&p.rrspLeft>=-1e-9);
  if(s==='cashOnly')near(p.transferIn,0);
  // With equal returns and no tax difference the HBP is neutral: net worth does not depend on the amount withdrawn.
  near(rrspFhsaPlan({...i,rftHbp:0},s).netWorth,p.netWorth,1e-6);
 }
 assert.ok(rrspFhsaCompare({...base,rftTaxRet:0}).best.strategy!=='transferFirst');
});

test('HBP schedule follows the standard and extended relief rules',()=>{
 const a=hbpSchedule(30000,2026,true);assert.equal(a.first,2031);assert.equal(a.last,2045);near(a.minimum,2000);
 near(a.rows.reduce((s,r)=>s+r.minimum,0),30000);
 assert.equal(hbpSchedule(30000,2028,true).first,2033);assert.equal(hbpSchedule(30000,2029,true).first,2031);assert.equal(hbpSchedule(30000,2026,false).first,2028);
});

test('official statistics are as published and the result renders six finite charts',()=>{
 const T=FHSA_FLOWS.total;assert.deepEqual(T.slice(1),[1455280,1680490,1038540,6470717000,146400,1761791000]);
 // CRA rounds each cell, so bracket rows add to the total only within rounding (10 per count, CAD 1,000 per amount).
 for(let k=1;k<7;k++)assert.ok(Math.abs(FHSA_FLOWS.brackets.reduce((s,r)=>s+r[k],0)-T[k])<=5*(k===4||k===6?1000:10));
 const r=planningResult('rrspFhsaTransfer',base);assert.equal(r.charts.length,6);assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));
 for(const c of r.charts){for(const s of c.series??[])for(const row of s.rows)assert.ok(Number.isFinite(row.value));for(const row of c.rows??[])for(const v of row.values??[row.value])assert.ok(Number.isFinite(v));}
 assert.equal(validInputs('rrspFhsaTransfer',{...base,rftUsed:36000,rftRoom:8000}),false);assert.equal(validInputs('rrspFhsaTransfer',base),true);
 assert.ok(planningGuides.some(g=>g.slug==='rrsp-to-fhsa-transfer-or-home-buyers-plan-room-deduction-repayment'&&g.planning==='rrspFhsaTransfer'));
});
