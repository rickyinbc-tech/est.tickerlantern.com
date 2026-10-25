import test from 'node:test';
import assert from 'node:assert/strict';
import {spendingQuintileData as data} from '../src/planning-spending-utility-data.js';
import {spendingUtilityDefinitions as defs,spendingQuintileBudget,utilitySeasonWeights,utilitySettlementLedger} from '../src/planning-spending-utility-models.js';
import {spendingUtilityGuides as guides} from '../src/planning-spending-utility-guides.js';
import {defaults,planningResult,validInputs} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderFigure,renderResult} from '../src/planning-charts.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('quintile charts retain reported shares, their consumption denominator and dated annual means',()=>{
  assert.deepEqual(data.shares.map(r=>[r.label,r.lowest,r.highest]),[['Shelter',34.8,32.2],['Food',17.9,14.6],['Transportation',13.3,15.9]]);
  assert.deepEqual(data.annualConsumption.map(r=>r.value),[40080,123447]);assert.equal(data.observedYear,2023);assert.equal(data.released,'2025-05-21');
  const a=planningResult('spendingQuintiles',defaults('spendingQuintiles')),b=planningResult('spendingQuintiles',{monthlyTakeHome:0,housingCash:0,foodCash:0,transportCash:0,otherCash:0});
  assert.deepEqual(a.charts.slice(0,2),b.charts.slice(0,2));assert.match(a.charts[0].unitLabel,/consumption/);assert.match(a.charts[1].unitLabel,/annual/);
});
test('personal shares use different denominators and can rise while the cash remainder improves',()=>{
  const q=defaults('spendingQuintiles'),p=spendingQuintileBudget(q),less=spendingQuintileBudget({...q,otherCash:q.otherCash-500});
  close(p.housingSpendingShare,.44);close(p.housingIncomeShare,2200/6000);assert.equal(p.remaining,1000);assert.equal(p.selectedSpending,5000);
  assert.equal(less.remaining,1500);close(less.housingSpendingShare,2200/4500);assert.ok(less.housingSpendingShare>p.housingSpendingShare);assert.equal(less.housingIncomeShare,p.housingIncomeShare);
  const empty=spendingQuintileBudget({monthlyTakeHome:0,housingCash:0,foodCash:0,transportCash:0,otherCash:0});assert.equal(empty.housingIncomeShare,null);assert.equal(empty.housingSpendingShare,null);
  const noIncome=spendingQuintileBudget({...q,monthlyTakeHome:0});assert.equal(noIncome.housingIncomeShare,null);assert.equal(noIncome.remaining,-5000);
  assert.match(renderResult(planningResult('spendingQuintiles',{monthlyTakeHome:0,housingCash:0,foodCash:0,transportCash:0,otherCash:0})),/No selected spending/);
});
test('utility weights allocate exactly one annual cost and the default reserve funds the extra charge',()=>{
  close(utilitySeasonWeights.reduce((a,b)=>a+b,0),12);assert.equal(utilitySeasonWeights.length,12);
  const p=utilitySettlementLedger(defaults('utilitySettlement'));
  close(p.actualCost,2760);close(p.payments,2400);close(p.providerBalance,360);close(p.extraCharge,360);close(p.credit,0);close(p.reserve,360);close(p.gap,0);close(p.reserveAfterSettlement,0);
  close(p.rows[1].charge,345);close(p.rows[1].providerBalance,145);close(p.rows[2].providerBalance,267);assert.equal(p.rows.length,13);
  close(p.rows.reduce((sum,r)=>sum+r.charge,0),p.actualCost);close(p.rows.at(-1).providerBalance,p.providerBalance);
});
test('utility settlement obeys independent annual cash identities across all input extremes',()=>{
  const base=defaults('utilitySettlement');
  for(const annualEstimate of [0,2400,12000])for(const annualCostChange of [-50,0,15,100])for(const utilityPayment of [0,200,2000])for(const settlementReserve of [0,5000])for(const settlementSaving of [0,30,500]){
    const q={...base,annualEstimate,annualCostChange,utilityPayment,settlementReserve,settlementSaving},p=utilitySettlementLedger(q);
    close(p.payments+p.providerBalance,p.actualCost);close(p.extraCharge-p.credit,p.providerBalance);
    close(p.reserve+ p.gap,p.extraCharge+Math.max(0,p.reserveAfterSettlement));assert.ok(!(p.extraCharge>0&&p.credit>0));
    close(p.rows.at(-1).reserve,settlementReserve+12*settlementSaving);
    for(const r of p.rows)close(r.reserve,settlementReserve+r.x*settlementSaving);
  }
});
test('provider credits never become household cash refunds and reserve changes cannot alter provider settlement',()=>{
  const q=defaults('utilitySettlement'),a=utilitySettlementLedger({...q,annualCostChange:-10});
  close(a.credit,240);close(a.extraCharge,0);close(a.reserveAfterSettlement,360);close(a.gap,0);
  const b=utilitySettlementLedger({...q,settlementReserve:1000,settlementSaving:0});close(b.providerBalance,360);close(b.reserveAfterSettlement,640);
  const c=utilitySettlementLedger({...q,settlementSaving:0});close(c.gap,360);
  const p=planningResult('utilitySettlement',q);close(p.charts[2].rows.reduce((s,r)=>s+r.value,0),p.metrics[0][1]);
  assert.match(p.note,/not a BC Hydro bill/);assert.match(p.note,/never added to household cash/);
});
test('new models reject unsupported inputs and render finite figures at input bounds',()=>{
  for(const [kind,def] of Object.entries(defs)){
    const base=defaults(kind),variants=[base,Object.fromEntries(def.fields.map(f=>[f[0],f[3]])),Object.fromEntries(def.fields.map(f=>[f[0],f[4]])),...def.fields.flatMap(f=>[f[3],f[4]].map(v=>({...base,[f[0]]:v})))];
    assert.equal(validInputs(kind,{...base,[def.fields[0][0]]:-1}),false);
    for(const q of variants){assert.ok(validInputs(kind,q));const p=planningResult(kind,q);assert.equal(p.charts.length,4);assert.equal(new Set(p.charts.map(c=>c.id)).size,4);
      for(const chart of p.charts)for(const width of [300,354,760]){const html=renderFigure(chart,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/role="img"/);assert.match(html,/<table/);}
    }
  }
});
test('guides have substantial original explanation, unique destinations and resolved related links',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const g of guides){assert.equal(g.sections.length,6);const words=g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').trim().split(/\s+/).length;assert.ok(words>=750,`${g.slug}: ${words}`);assert.ok(g.related.every(s=>slugs.has(s)));assert.ok(slugs.has(g.slug));}
});
