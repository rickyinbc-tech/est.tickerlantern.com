import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';import {capitalLossLedger} from '../src/planning-capital-loss-models.js';
import {capitalLossGuides} from '../src/planning-capital-loss-guides.js';import {planningGuides} from '../src/planning-guides.js';import {renderFigure} from '../src/planning-charts.js';
const input=o=>({...defaults('capitalLossYearLedger'),...o}),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('default historical loss record reconciles current use, each prior allocation and residual once',()=>{
 const r=capitalLossLedger(input());assert.equal(r.sameYear,3000);assert.equal(r.netLoss,9000);assert.equal(r.remainingGain,0);assert.deepEqual(r.prior.map(x=>x.used),[2000,4000,1000]);assert.equal(r.used,7000);assert.equal(r.carryForward,2000);assert.equal(r.unallocatedRequest,0);
});
test('same-year use plus carryback plus remaining record equals the allowable loss across independent cases',()=>{
 for(const loss of [0,.1,2000,12000,100000])for(const gain of [0,.3,3000,100000])for(const request of [0,3000,100000]){
  const p=input({lossAllowable:loss,lossCurrentGain:gain,lossCarryRequest:request}),r=capitalLossLedger(p);near(r.sameYear+r.used+r.carryForward,loss);near(r.remainingGain,Math.max(0,gain-loss));assert.ok(r.used<=request&&r.used<=r.netLoss);assert.ok(r.carryForward>=0);r.prior.forEach(x=>{assert.ok(x.used>=0&&x.used<=x.capacity);near(x.used+x.gainAfter,x.capacity);});
 }
});
test('the declared destination order is capped by a distinct carryback request',()=>{
 const r=capitalLossLedger(input({lossCarryRequest:3000}));assert.deepEqual(r.prior.map(x=>x.used),[2000,1000,0]);assert.equal(r.carryForward,6000);
 const large=capitalLossLedger(input({lossCarryRequest:20000}));assert.equal(large.used,7000);assert.equal(large.carryForward,2000);assert.equal(large.unallocatedRequest,13000);
});
test('no carryback request preserves the loss without treating prior gain capacity as a mandatory deduction',()=>{
 const r=capitalLossLedger(input({lossCarryRequest:0}));assert.equal(r.used,0);assert.equal(r.carryForward,9000);assert.deepEqual(r.prior.map(x=>x.used),[0,0,0]);
});
test('the available loss, current gain and destination capacity each impose independent limits',()=>{
 const small=capitalLossLedger(input({lossAllowable:4000}));assert.deepEqual(small.prior.map(x=>x.used),[1000,0,0]);assert.equal(small.carryForward,0);
 const gain=capitalLossLedger(input({lossAllowable:2000}));assert.equal(gain.remainingGain,1000);assert.equal(gain.netLoss,0);assert.equal(gain.used,0);assert.equal(gain.carryForward,0);
 const none=capitalLossLedger(input({lossPrior2022:0,lossPrior2023:0,lossPrior2024:0}));assert.equal(none.used,0);assert.equal(none.carryForward,9000);
});
test('an independent total-capacity formula agrees without depending on destination allocation order',()=>{
 for(const p of [input(),input({lossPrior2022:100000}),input({lossCurrentGain:0,lossCarryRequest:100000}),input({lossPrior2023:0,lossAllowable:2500,lossCurrentGain:500})]){const r=capitalLossLedger(p),net=Math.max(0,p.lossAllowable-p.lossCurrentGain),used=Math.min(net,p.lossCarryRequest,p.lossPrior2022+p.lossPrior2023+p.lossPrior2024);near(r.used,used);near(r.carryForward,net-used);}
});
test('waterfalls, grouped bars and every matrix cell reproduce independent record identities',()=>{
 const p=input(),r=planningResult('capitalLossYearLedger',p);near(r.charts[0].rows.reduce((n,x)=>n+x.value,0),9000);near(r.charts[2].rows.reduce((n,x)=>n+x.value,0),2000);assert.deepEqual(r.charts[1].rows.map(x=>x.values),[[2000,2000],[4000,4000],[1000,1000]]);
 r.charts[3].rows.forEach((row,k)=>row.values.forEach((v,j)=>{const net=Math.max(0,[0,12000,24000][k]-[0,3000,6000][j]);near(v,Math.max(0,net-Math.min(7000,net)));}));
});
test('zero amounts collapse duplicate stress labels without non-finite or negative loss records',()=>{
 const p=input({lossAllowable:0,lossCurrentGain:0,lossCarryRequest:0}),r=planningResult('capitalLossYearLedger',p);assert.equal(r.charts[3].rows.length,1);assert.equal(r.charts[3].columns.length,1);assert.equal(r.charts[3].rows[0].values[0],0);
});
test('all supported field endpoints retain finite accessible figures and invalid numbers are rejected',()=>{
 for(const p of definitions.capitalLossYearLedger.fields.flatMap(([key,,,lo,hi])=>[input({[key]:lo}),input({[key]:hi})])){assert.ok(validInputs('capitalLossYearLedger',p));const r=planningResult('capitalLossYearLedger',p);assert.equal(r.charts.length,4);r.charts.forEach(c=>{const h=renderFigure(c,300);assert.match(h,/View chart data/);assert.match(h,/role="img"/);assert.doesNotMatch(h,/NaN|Infinity|undefined/);});}
 for(const o of [{lossAllowable:-1},{lossCarryRequest:100001},{lossPrior2022:NaN},{lossCurrentGain:Infinity}]){assert.equal(validInputs('capitalLossYearLedger',input(o)),false);assert.throws(()=>planningResult('capitalLossYearLedger',input(o)));}
});
test('the detailed English guide states the historical basis, authored order and absence of refund calculation',()=>{
 const g=capitalLossGuides[0],r=planningResult(g.planning);assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>750);assert.match(g.chartScope,/2025/);assert.match(r.note,/not a legal priority/);assert.match(r.note,/No tax refund/);assert.equal(g.sources.length,3);assert.ok(r.charts.every(x=>!x.source));g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug),slug));assert.equal(planningGuides.filter(x=>x.planning===g.planning).length,1);
});
