import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';import {fxCostLedger} from '../src/planning-fx-cost-models.js';import {fxCostGuides} from '../src/planning-fx-cost-guides.js';import {planningGuides} from '../src/planning-guides.js';import {renderFigure} from '../src/planning-charts.js';
const input=o=>({...defaults('fxCapitalRecord'),...o}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('default dated-CAD cost, translated proceeds and before-inclusion gain reconcile',()=>{
 const r=fxCostLedger(input());near(r.costCad,12500);near(r.proceedsCad,16200);near(r.gainCad,3650);assert.equal(r.usdChange,2000);near(r.usdChangeCad,2700);near(r.costFxEffect,1000);
});
test('the independent price/currency decomposition matches direct dated conversion across zero and signed cases',()=>{
 for(const usdCost of [0,10000,500000])for(const usdProceeds of [0,8000,500000])for(const buy of [.5,1.25,2])for(const sale of [.5,1.35,2]){
  const p=input({fxOriginalUsd:usdCost,fxSaleUsd:usdProceeds,fxBuyCad:buy,fxSaleCad:sale}),r=fxCostLedger(p);near(r.gainCad,usdProceeds*sale-usdCost*buy-p.fxSellingCad);near(r.usdChangeCad+r.costFxEffect-p.fxSellingCad,r.gainCad);
 }
});
test('equal USD proceeds and cost leave only currency movement and the separately entered CAD expense',()=>{
 for(const [rate,expected] of [[1,-2550],[1.25,-50],[1.35,950],[1.5,2450]]){const r=fxCostLedger(input({fxSaleUsd:10000,fxSaleCad:rate}));assert.equal(r.usdChange,0);near(r.gainCad,expected);}
});
test('equal purchase/sale exchange rates remove the original-cost currency effect',()=>{
 for(const rate of [.5,1.25,2]){const r=fxCostLedger(input({fxBuyCad:rate,fxSaleCad:rate}));assert.equal(r.costFxEffect,0);near(r.gainCad,2000*rate-50);}
});
test('a CAD disposition expense is deducted once without multiplying it by either USD exchange rate',()=>{
 const p=input(),a=fxCostLedger(p),b=fxCostLedger({...p,fxSellingCad:550});near(b.gainCad-a.gainCad,-500);near(a.costCad,b.costCad);near(a.proceedsCad,b.proceedsCad);near(a.usdChangeCad,b.usdChangeCad);near(a.costFxEffect,b.costFxEffect);
});
test('changing each dated exchange rate moves only its corresponding translated record',()=>{
 const p=input(),a=fxCostLedger(p),b=fxCostLedger(p,{fxBuyCad:1.45}),c=fxCostLedger(p,{fxSaleCad:1.55});near(b.proceedsCad,a.proceedsCad);near(b.gainCad-a.gainCad,-p.fxOriginalUsd*.2);near(c.costCad,a.costCad);near(c.gainCad-a.gainCad,p.fxSaleUsd*.2);
});
test('both waterfalls and the equal-USD sensitivity rows independently reproduce the direct formula',()=>{
 const p=input(),r=planningResult('fxCapitalRecord',p),result=12000*1.35-10000*1.25-50;for(const c of r.charts.slice(0,2))near(c.rows.reduce((n,x)=>n+x.value,0),result);
 r.charts[2].rows.forEach(row=>{const rate=Number(row.label.split(' ')[2]);near(row.value,p.fxOriginalUsd*(rate-p.fxBuyCad)-p.fxSellingCad);});
});
test('matrix values retain USD column amounts, CAD-per-USD rows and fixed acquisition-date cost',()=>{
 const p=input(),c=planningResult('fxCapitalRecord',p).charts[3];assert.deepEqual(c.columns,['9,000','12,000','15,000']);assert.deepEqual(c.rows.map(x=>x.label),['1.0000','1.3500','1.5000']);c.rows.forEach(row=>row.values.forEach((v,k)=>near(v,[9000,12000,15000][k]*Number(row.label)-10000*1.25-50)));
 assert.equal(planningResult('fxCapitalRecord',input({fxSaleUsd:0})).charts[3].columns.length,1);
});
test('zero inputs and all supported field endpoints render four finite accessible figures; invalid ranges fail',()=>{
 const zero=fxCostLedger(input({fxOriginalUsd:0,fxSaleUsd:0,fxSellingCad:0}));assert.equal(zero.gainCad,0);assert.equal(zero.costCad,0);assert.equal(zero.proceedsCad,0);
 for(const p of definitions.fxCapitalRecord.fields.flatMap(([key,,,lo,hi])=>[input({[key]:lo}),input({[key]:hi})])){assert.ok(validInputs('fxCapitalRecord',p));for(const c of planningResult('fxCapitalRecord',p).charts){const h=renderFigure(c,300);assert.match(h,/View chart data/);assert.match(h,/role="img"/);assert.doesNotMatch(h,/NaN|Infinity|undefined/);}}
 for(const o of [{fxBuyCad:0},{fxSaleCad:2.01},{fxSellingCad:-1},{fxSaleUsd:NaN}]){assert.equal(validInputs('fxCapitalRecord',input(o)),false);assert.throws(()=>planningResult('fxCapitalRecord',input(o)));}
});
test('the substantive article preserves quote direction, single-purchase scope and separate tax/cash boundaries',()=>{
 const g=fxCostGuides[0],r=planningResult(g.planning);assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>750);assert.match(g.chartScope,/one purchase/);assert.match(g.chartScope,/before inclusion/);assert.match(r.note,/No actual currency conversion/);assert.match(r.note,/not a determination/);assert.equal(g.sources.length,2);g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug),slug));assert.equal(planningGuides.filter(x=>x.planning===g.planning).length,1);
});

test('high-precision input stresses use exactly the rounded rate and proceeds labels displayed in the tables',()=>{
 const p=input({fxBuyCad:1.234567,fxSaleCad:1.3789123,fxSaleUsd:12345.6789}),r=planningResult('fxCapitalRecord',p);r.charts[2].rows.forEach(row=>{const rate=Number(row.label.split(' ')[2]);near(row.value,p.fxOriginalUsd*rate-p.fxOriginalUsd*p.fxBuyCad-p.fxSellingCad);});r.charts[3].rows.forEach(row=>row.values.forEach((v,k)=>near(v,Number(r.charts[3].columns[k].replaceAll(',',''))*Number(row.label)-p.fxOriginalUsd*p.fxBuyCad-p.fxSellingCad)));
});
