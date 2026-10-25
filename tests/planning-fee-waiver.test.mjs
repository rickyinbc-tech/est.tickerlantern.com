import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';import {feeWaiverLedger} from '../src/planning-fee-waiver-models.js';
import {feeWaiverGuides} from '../src/planning-fee-waiver-guides.js';import {planningGuides} from '../src/planning-guides.js';import {renderFigure} from '../src/planning-charts.js';
const input=o=>({...defaults('feeWaiverCash'),...o}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('default equal-resource checkpoint preserves saved fee principal, growth and foregone interest',()=>{
 const r=feeWaiverLedger(input());near(r.retain,6033.295391047066);near(r.pay,5796.3703715);near(r.difference,236.925019547066);assert.equal(r.avoided,960);assert.equal(r.outsideBudget,960);assert.equal(r.feesRetain,0);assert.equal(r.feesPay,960);near(r.breakEven,6487.530350361779);
});
test('future saved fees agree with an independently discounted month-end cash-flow sum',()=>{
 for(const p of [input(),input({waiverMonths:5}),input({waiverYears:15,waiverYield:10,waiverFee:50,waiverExtra:30000}),input({waiverYield:0,waiverMonths:7,waiverFee:.1}),input({waiverMonths:0})]){
  const r=feeWaiverLedger(p),m=(1+p.waiverYield/100)**(1/12)-1;let fv=0;
  for(let year=0;year<p.waiverYears;year++)for(let month=1;month<=p.waiverMonths;month++)fv+=p.waiverFee*(1+m)**(12*p.waiverYears-(12*year+month));
  near(r.avoided+r.savedGrowth,fv);near(r.pay,p.waiverExtra*(1+p.waiverYield/100)**p.waiverYears);near(r.retain,p.waiverExtra+fv);
 }
});
test('outside budgets are conserved and B fees are never also taken from its investment balance',()=>{
 for(const q of [0,1,7,12]){const p=input({waiverMonths:q}),r=feeWaiverLedger(p);assert.equal(r.feesRetain+r.avoided,r.outsideBudget);assert.equal(r.feesPay,r.outsideBudget);near(r.pay,5000*1.03**5);near(r.retain-r.pay,r.difference);assert.equal(r.avoided,q*5*16);}
});
test('the full-qualification break-even uses monthly timing and zero-yield outcomes are explicit',()=>{
 for(const waiverYears of [1,5,15]){const p=input({waiverYears}),r=feeWaiverLedger(p);near(r.breakEven,p.waiverFee/r.monthlyRate);near(feeWaiverLedger(p,{waiverExtra:r.breakEven}).difference,0);}
 const zero=feeWaiverLedger(input({waiverYield:0}));assert.equal(zero.savedGrowth,0);assert.equal(zero.foregone,0);assert.equal(zero.difference,960);assert.equal(zero.breakEven,null);assert.equal(zero.tieAtZeroYield,false);
 assert.equal(planningResult('feeWaiverCash',input({waiverYield:0})).metrics[2][3],'No finite balance at 0%');
 assert.equal(planningResult('feeWaiverCash',input({waiverYield:0,waiverMonths:0})).metrics[2][3],'All balances tie at 0%');
});
test('a partial repeated-year pattern has a valid independently substituted break-even',()=>{
 for(const waiverMonths of [0,3,7,12]){const p=input({waiverMonths}),r=feeWaiverLedger(p);near(feeWaiverLedger(p,{waiverExtra:r.breakEven}).difference,0);near(r.breakEven,feeWaiverLedger(p,{waiverYears:1}).breakEven);}
});
test('more qualifying months cannot lower A resources, while a larger extra balance increases positive-yield opportunity cost',()=>{
 let last=-Infinity;for(let waiverMonths=0;waiverMonths<=12;waiverMonths++){const r=feeWaiverLedger(input({waiverMonths}));assert.ok(r.retain>=last);last=r.retain;}
 const a=feeWaiverLedger(input()),b=feeWaiverLedger(input({waiverExtra:10000}));near(b.difference-a.difference,-5000*(1.03**5-1));
});
test('the waterfall, qualifying-month rows and signed matrix use independent ledger cases',()=>{
 const p=input(),r=planningResult('feeWaiverCash');near(r.charts[1].rows.reduce((n,x)=>n+x.value,0),r.metrics[0][1]);
 r.charts[2].rows.forEach(row=>near(row.value,feeWaiverLedger(p,{waiverMonths:Number(row.label.split(' ')[0])}).difference));
 r.charts[3].rows.forEach(row=>row.values.forEach((v,k)=>near(v,feeWaiverLedger(p,{waiverYield:Number(row.label.split('%')[0]),waiverExtra:[0,5000,10000][k]}).difference)));
 assert.equal(planningResult('feeWaiverCash',input({waiverExtra:0})).charts[3].columns.length,1);
});
test('zero fee and zero extra funds keep the shared-resource accounting intact',()=>{
 const a=feeWaiverLedger(input({waiverFee:0}));assert.equal(a.avoided,0);assert.equal(a.savedGrowth,0);near(a.difference,-a.foregone);assert.equal(a.breakEven,0);
 const b=feeWaiverLedger(input({waiverExtra:0}));assert.equal(b.pay,0);assert.equal(b.foregone,0);near(b.retain,b.avoided+b.savedGrowth);
});
test('supported field boundaries render finite accessible charts and whole-year/month rules reject invalid inputs',()=>{
 const cases=definitions.feeWaiverCash.fields.flatMap(([key,,,min,max])=>[input({[key]:min}),input({[key]:max})]);
 for(const p of cases){assert.ok(validInputs('feeWaiverCash',p));const r=planningResult('feeWaiverCash',p);assert.equal(r.charts.length,4);for(const c of r.charts){const h=renderFigure(c,300);assert.match(h,/View chart data/);assert.match(h,/role="img"/);assert.doesNotMatch(h,/NaN|Infinity|undefined/);}}
 for(const o of [{waiverYears:2.5},{waiverMonths:1.5},{waiverMonths:13},{waiverYield:NaN},{waiverExtra:-1}]){assert.equal(validInputs('feeWaiverCash',input(o)),false);assert.throws(()=>planningResult('feeWaiverCash',input(o)));}
});
test('the detailed article retains independent eligibility and equal budgets with existing related routes',()=>{
 const g=feeWaiverGuides[0];assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>=750);assert.match(g.chartScope,/equal starting funds/);assert.match(g.chartScope,/neither a bank’s eligibility/);g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug),slug));assert.equal(g.sources.length,2);
});
