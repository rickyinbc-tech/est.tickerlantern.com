import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {rrifKindLedger} from '../src/planning-rrif-kind-models.js';
import {rrifKindGuides} from '../src/planning-rrif-kind-guides.js';
import {planningGuides} from '../src/planning-guides.js';import {renderFigure} from '../src/planning-charts.js';
const input=o=>({...defaults('rrifKindCash'),...o}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('default property and bank cash reconcile while the two assignments expose the shortage',()=>{
 const r=rrifKindLedger(input());assert.deepEqual([r.paid,r.securities,r.cash,r.bankBalance,r.budget,r.gap,r.rrifAfter],[25000,15000,10000,22000,-2000,2000,375000]);assert.equal(r.unfundedSelectedPayment,0);
});
test('payment components conserve the gross amount and total resources before assignments are paid',()=>{
 for(const o of [{},{rrifKindShare:0},{rrifKindShare:100},{rrifKindValue:10000,rrifKindPayment:20000},{rrifKindValue:0},{rrifKindPayment:0},{rrifKindShare:37.5,rrifKindBank:12345.67}]){
  const p=input(o),r=rrifKindLedger(p);near(r.securities+r.cash,r.paid);near(r.rrifAfter+r.securities+r.bankBalance,p.rrifKindValue+p.rrifKindBank);assert.ok(r.rrifAfter>=0);
  near(r.budget,p.rrifKindBank+Math.min(p.rrifKindValue,p.rrifKindPayment)*(1-p.rrifKindShare/100)-p.rrifKindTaxReserve-p.rrifKindSpend);
 }
});
test('tax and spending are availability assignments, not completed bank debits',()=>{
 const a=rrifKindLedger(input()),b=rrifKindLedger(input({rrifKindTaxReserve:16000,rrifKindSpend:28000}));assert.equal(a.bankBalance,b.bankBalance);assert.equal(a.rrifAfter,b.rrifAfter);assert.equal(a.securities,b.securities);assert.equal(a.budget-b.budget,20000);
 assert.match(planningResult('rrifKindCash').note,/before either is paid/);
});
test('changing the form leaves gross payment fixed and shifts bank cash dollar for dollar',()=>{
 const p=input();let previous=Infinity;
 for(let share=0;share<=100;share+=5){const r=rrifKindLedger(p,{rrifKindShare:share});assert.equal(r.paid,25000);near(r.cash,25000*(1-share/100));assert.ok(r.budget<=previous);previous=r.budget;}
 assert.equal(rrifKindLedger(p,{rrifKindShare:0}).budget,13000);assert.equal(rrifKindLedger(p,{rrifKindShare:100}).gap,12000);near(rrifKindLedger(p,{rrifKindShare:52}).budget,0);
});
test('an unavailable selected amount is identified without inventing an account withdrawal',()=>{
 const r=rrifKindLedger(input({rrifKindValue:10000,rrifKindPayment:25000}));assert.equal(r.paid,10000);assert.equal(r.unfundedSelectedPayment,15000);assert.equal(r.rrifAfter,0);near(r.cash,4000);near(r.securities,6000);
});
test('more starting cash reduces the funding gap but never changes the represented payment',()=>{
 const p=input(),a=rrifKindLedger(p),b=rrifKindLedger(p,{rrifKindBank:14000});assert.equal(a.paid,b.paid);assert.equal(a.cash,b.cash);assert.equal(b.gap,0);assert.equal(b.budget,0);assert.ok(!Object.is(b.gap,-0));
});
test('matrix cells and line points independently match the cash-capacity equation',()=>{
 const p=input(),r=planningResult('rrifKindCash'),matrix=r.charts[3];const shares=[0,25,50,75,100],cash=[0,6000,12000,18000];
 matrix.rows.forEach((row,n)=>row.values.forEach((v,k)=>near(v,Math.max(0,p.rrifKindTaxReserve+p.rrifKindSpend-cash[n]-25000*(1-shares[k]/100)))));
 r.charts[2].series[0].rows.forEach(row=>near(row.value,12000+25000*(1-row.x)-6000-18000));
 assert.equal(planningResult('rrifKindCash',input({rrifKindBank:0})).charts[3].rows.length,1);
});
test('all supported boundaries yield finite accessible figures including zero assets and zero obligations',()=>{
 const cases=definitions.rrifKindCash.fields.flatMap(([key,,,min,max])=>[input({[key]:min}),input({[key]:max})]);cases.push(input({rrifKindValue:0,rrifKindBank:0,rrifKindTaxReserve:0,rrifKindSpend:0}));
 for(const p of cases){assert.ok(validInputs('rrifKindCash',p));const r=planningResult('rrifKindCash',p);assert.equal(r.charts.length,4);for(const c of r.charts){const html=renderFigure(c,300);assert.match(html,/View chart data/);assert.match(html,/role="img"/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);}}
 for(const p of [input({rrifKindShare:101}),input({rrifKindBank:-1}),input({rrifKindPayment:NaN})]){assert.equal(validInputs('rrifKindCash',p),false);assert.throws(()=>planningResult('rrifKindCash',p));}
});
test('the article is detailed, uses current related routes and keeps tax and minimums external',()=>{
 const g=rrifKindGuides[0];assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>=700);g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug),slug));assert.match(g.chartScope,/does not calculate a statutory minimum/);assert.equal(g.sources.length,2);
});
