import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';import {tfsaKindLedger} from '../src/planning-tfsa-kind-models.js';
import {tfsaKindGuides} from '../src/planning-tfsa-kind-guides.js';import {planningGuides} from '../src/planning-guides.js';import {renderFigure} from '../src/planning-charts.js';
const input=o=>({...defaults('tfsaKindContribution'),...o}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('default TFSA proposal separates FMV, cost, gain, room and conserved gross market value',()=>{
 const r=tfsaKindLedger(input());assert.deepEqual(r,{contribution:12000,cost:8000,difference:4000,gain:4000,deniedLoss:0,claimableLoss:0,roomAfter:3000,roomShortfall:0,before:18000,outside:6000,inside:12000,cashReceived:0});
});
test('contribution-price loss, equal cost and gain cases do not invent a deductible loss or tax cash',()=>{
 for(const [price,gain,denied] of [[15,0,2000],[20,0,0],[30,4000,0]]){const r=tfsaKindLedger(input({kindPrice:price}));assert.equal(r.gain,gain);assert.equal(r.deniedLoss,denied);assert.equal(r.claimableLoss,0);assert.equal(r.cashReceived,0);assert.equal(r.gain-r.deniedLoss,r.difference);}
 assert.equal(planningResult('tfsaKindContribution',input({kindPrice:15})).metrics[1][0],'Capital loss that cannot be claimed');
});
test('room uses the full FMV and retains a failed proposal instead of silently clipping it',()=>{
 const p=input({kindPrice:40}),r=tfsaKindLedger(p);assert.equal(r.contribution,16000);assert.equal(r.roomAfter,-1000);assert.equal(r.roomShortfall,1000);assert.equal(r.inside,16000);
 const equal=tfsaKindLedger(input({kindPrice:37.5}));assert.equal(equal.contribution,15000);assert.equal(equal.roomAfter,0);assert.equal(equal.roomShortfall,0);
});
test('changing cost does not change contribution, wealth location or room requirements',()=>{
 for(const kindUnitAcb of [0,10,20,30,500]){const r=tfsaKindLedger(input({kindUnitAcb}));assert.equal(r.contribution,12000);assert.equal(r.roomAfter,3000);assert.equal(r.before,18000);assert.equal(r.inside,12000);}
});
test('other retained units affect only gross outside wealth, never the contribution or its allocated gain',()=>{
 const a=tfsaKindLedger(input()),b=tfsaKindLedger(input({kindOtherUnits:5000}));for(const k of ['contribution','cost','gain','roomAfter'])assert.equal(a[k],b[k]);assert.equal(b.before-a.before,4800*30);assert.equal(b.outside-a.outside,4800*30);
});
test('zero units, zero value and no available room keep distinct economic and capacity outcomes',()=>{
 const zero=tfsaKindLedger(input({kindUnits:0}));assert.equal(zero.contribution,0);assert.equal(zero.gain,0);assert.equal(zero.deniedLoss,0);assert.equal(zero.roomAfter,15000);assert.equal(zero.before,zero.outside);
 const worthless=tfsaKindLedger(input({kindPrice:0}));assert.equal(worthless.contribution,0);assert.equal(worthless.deniedLoss,8000);assert.equal(worthless.roomAfter,15000);
 assert.equal(tfsaKindLedger(input({kindRoom:0})).roomShortfall,12000);
});
test('chart account totals and waterfall independently reconcile the same transaction scope',()=>{
 for(const p of [input(),input({kindPrice:15}),input({kindRoom:0}),input({kindUnits:0}),input({kindPrice:0,kindOtherUnits:0})]){
  const result=planningResult('tfsaKindContribution',p),r=tfsaKindLedger(p),bars=result.charts[0].rows;near(bars[0].values.reduce((a,b)=>a+b,0),bars[1].values.reduce((a,b)=>a+b,0));near(bars[1].values[1],p.kindUnits*p.kindPrice);near(result.charts[1].rows.reduce((a,b)=>a+b.value,0),p.kindRoom-p.kindUnits*p.kindPrice);near(r.before,r.outside+r.inside);
 }
});
test('price stress rows preserve cost and unit count and include the exact in-range room crossing',()=>{
 const p=input(),r=planningResult('tfsaKindContribution',p);r.charts[2].rows.forEach(row=>{const price=Number(row.label.match(/[\d,.]+/)[0].replaceAll(',',''));near(row.values[0],Math.max(0,p.kindUnits*(price-p.kindUnitAcb)));near(row.values[1],Math.max(0,p.kindUnits*(p.kindUnitAcb-price)));});
 const lines=r.charts[3].series,atCross=lines[0].rows.find(x=>x.x===37.5);assert.equal(atCross.value,15000);lines[0].rows.forEach(x=>near(x.value,p.kindUnits*x.x));lines[1].rows.forEach(x=>assert.equal(x.value,15000));
 planningResult('tfsaKindContribution',input({kindUnits:0})).charts[3].series[0].rows.forEach(x=>assert.equal(x.value,0));
});
test('all supported extrema render four finite accessible charts and reject invalid fractional units',()=>{
 for(const p of definitions.tfsaKindContribution.fields.flatMap(([key,,,lo,hi])=>[input({[key]:lo}),input({[key]:hi})])){assert.ok(validInputs('tfsaKindContribution',p));const r=planningResult('tfsaKindContribution',p);assert.equal(r.charts.length,4);for(const c of r.charts){const h=renderFigure(c,300);assert.match(h,/View chart data/);assert.match(h,/role="img"/);assert.doesNotMatch(h,/NaN|Infinity|undefined/);}}
 for(const o of [{kindUnits:.5},{kindOtherUnits:1.5},{kindRoom:-1},{kindPrice:501},{kindUnitAcb:NaN}]){assert.equal(validInputs('tfsaKindContribution',input(o)),false);assert.throws(()=>planningResult('tfsaKindContribution',input(o)));}
});
test('the substantive English guide distinguishes proposed room, personal tax and existing TFSA movement topics',()=>{
 const g=tfsaKindGuides[0];assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>750);assert.match(g.chartScope,/no personal tax calculation/);assert.equal(g.sources.length,3);g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug),slug));assert.equal(planningGuides.filter(x=>x.planning==='tfsaKindContribution').length,1);
});
