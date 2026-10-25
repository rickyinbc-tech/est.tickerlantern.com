import test from 'node:test';
import assert from 'node:assert/strict';
import {definitions,defaults,planningResult,validInputs} from '../src/planning-models.js';
import {illnessLedger} from '../src/planning-illness-cash-models.js';
import {illnessCashGuides} from '../src/planning-illness-cash-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderFigure} from '../src/planning-charts.js';
const input=overrides=>({...defaults('illnessReceiptShape'),...overrides});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('default calendars expose an earlier deficit despite the higher monthly-scenario ending balance',()=>{
 const a=illnessLedger(input(),'lump'),b=illnessLedger(input(),'monthly');
 assert.deepEqual([a.totalBenefits,a.required,a.extra,a.ending],[50000,10000,0,0]);
 assert.deepEqual([b.totalBenefits,b.required,b.extra,b.ending],[54000,15000,5000,4000]);
 assert.equal(b.rows[3].value,-5000);assert.equal(b.rows[4].benefit,4500);assert.equal(b.rows[15].benefit,4500);assert.equal(b.rows[16].benefit,0);
});
test('every monthly position agrees with an independent count-of-receipts formula',()=>{
 for(const i of [input(),input({illnessMonths:36,illnessLumpMonth:36,illnessFirstMonth:30,illnessPaymentMonths:36}),input({illnessMonths:6,illnessLumpMonth:12,illnessFirstMonth:9}),input({illnessOther:6000,illnessSpend:2000,illnessInitialCost:17000})]){
  for(const shape of ['lump','monthly']){
   const result=illnessLedger(i,shape);let expectedMin=0;
   for(let m=0;m<=i.illnessMonths;m++){
    const count=Math.max(0,Math.min(i.illnessPaymentMonths,m-i.illnessFirstMonth+1));
    const benefits=shape==='lump'?(m>=i.illnessLumpMonth?i.illnessLump:0):count*i.illnessMonthly;
    const expected=benefits+m*(i.illnessOther-i.illnessSpend)-(m?i.illnessInitialCost:0);
    near(result.rows[m].value,i.illnessCash+expected);expectedMin=Math.min(expectedMin,expected);
   }
   near(result.required,Math.max(0,-expectedMin));near(result.ending,i.illnessCash+result.totalBenefits+i.illnessMonths*(i.illnessOther-i.illnessSpend)-i.illnessInitialCost);
  }
 }
});
test('later equal one-time receipts cannot reduce the required opening reserve',()=>{
 const i=input();let prior=-1;
 for(let m=1;m<=36;m++){
  const r=illnessLedger(i,'lump',{illnessLumpMonth:m});assert.ok(r.required>=prior);prior=r.required;
 }
 const late=illnessLedger(i,'lump',{illnessLumpMonth:12});assert.equal(late.required,39000);assert.equal(late.extra,29000);assert.equal(late.ending,0);
});
test('a future receipt and an exhausted stream have no invented settlement value',()=>{
 const i=input({illnessMonths:6,illnessLumpMonth:7,illnessFirstMonth:5,illnessPaymentMonths:1});
 const a=illnessLedger(i,'lump'),b=illnessLedger(i,'monthly');assert.equal(a.totalBenefits,0);assert.equal(a.required,24000);assert.equal(b.totalBenefits,4500);assert.equal(b.rows[5].benefit,4500);assert.equal(b.rows[6].benefit,0);
});
test('opening cash changes funding capacity but never required cash or benefit receipts',()=>{
 for(const shape of ['lump','monthly']){
  const a=illnessLedger(input(),shape);
  const b=illnessLedger(input({illnessCash:200000}),shape);assert.equal(a.required,b.required);assert.equal(a.totalBenefits,b.totalBenefits);assert.equal(b.extra,0);
  b.rows.forEach((r,n)=>near(r.value-a.rows[n].value,190000));
 }
});
test('zero costs and sufficient other income produce exact nonnegative zero requirements',()=>{
 for(const shape of ['lump','monthly']){
  const a=illnessLedger(input({illnessSpend:0,illnessInitialCost:0,illnessOther:0,illnessLump:0,illnessMonthly:0,illnessCash:0}),shape);
  assert.equal(a.required,0);assert.equal(a.extra,0);assert.ok(!Object.is(a.required,-0));assert.equal(a.ending,0);
 }
 assert.equal(illnessLedger(input({illnessOther:11000}),'monthly').required,0);
});
test('sensitivity cells independently replace only the one-time amount and month',()=>{
 const i=input(),result=planningResult('illnessReceiptShape'),matrix=result.charts[3],lags=[1,3,6,9,12],amounts=[0,25000,50000,75000];
 matrix.rows.forEach((r,n)=>r.values.forEach((value,k)=>assert.equal(value,illnessLedger(i,'lump',{illnessLump:amounts[n],illnessLumpMonth:lags[k]}).extra)));
 const original=illnessLedger(i,'monthly');planningResult('illnessReceiptShape',input({illnessLump:0,illnessLumpMonth:36}));assert.deepEqual(illnessLedger(i,'monthly'),original);
});
test('all supported boundaries render finite charts and preserve independent-scenario scope',()=>{
 const boundaries=definitions.illnessReceiptShape.fields.flatMap(([key,,,min,max])=>[input({[key]:min}),input({[key]:max})]);
 for(const i of [...boundaries,input(),input({illnessMonths:6,illnessLump:0,illnessMonthly:0}),input({illnessMonths:36,illnessSpend:30000,illnessOther:30000,illnessInitialCost:100000,illnessCash:200000,illnessLump:300000,illnessMonthly:20000,illnessLumpMonth:36,illnessFirstMonth:36,illnessPaymentMonths:36})]){
  assert.ok(validInputs('illnessReceiptShape',i));const r=planningResult('illnessReceiptShape',i);assert.equal(r.charts.length,4);assert.match(r.note,/independent alternatives/);assert.match(r.note,/Do not add them/);
  for(const chart of r.charts){const html=renderFigure(chart,300);assert.match(html,/View chart data/);assert.match(html,/role="img"/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);}
 }
});
test('whole-month controls reject fractional, missing-range and non-finite values',()=>{
 for(const key of ['illnessMonths','illnessLumpMonth','illnessFirstMonth','illnessPaymentMonths'])for(const value of [1.5,37,NaN]){
  assert.equal(validInputs('illnessReceiptShape',input({[key]:value})),false);assert.throws(()=>planningResult('illnessReceiptShape',input({[key]:value})));
 }
});
test('the detailed English article uses existing related routes and no combined-claim model',()=>{
 const g=illnessCashGuides[0];assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>=700);
 g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug),slug));assert.match(g.chartScope,/does not combine claims/);assert.equal(g.sources.length,2);
});
