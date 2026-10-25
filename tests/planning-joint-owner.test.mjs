import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {aggregateJointPools,jointOwnerLedger,jointOwnerCap} from '../src/planning-joint-owner-models.js';
import {jointOwnerGuides} from '../src/planning-joint-owner-guides.js';import {planningGuides} from '../src/planning-guides.js';import {renderFigure} from '../src/planning-charts.js';
const input=o=>({...defaults('jointOwnerPools'),...o});
test('the default four accounts aggregate into three independently limited owner-set/member pools',()=>{
 const r=jointOwnerLedger(input());assert.equal(jointOwnerCap,100000);assert.deepEqual(r.pools.map(g=>[g.member,g.owners,g.accounts,g.balance,g.within,g.above,g.unused]),[['X',['A','B'],2,118000,100000,18000,0],['X',['A','C'],1,51000,51000,0,49000],['Y',['A','B'],1,123000,100000,23000,0]]);assert.deepEqual([r.total,r.within,r.above,r.unused],[292000,251000,41000,49000]);assert.equal(r.total,r.within+r.above);
});
test('same-set order and account splitting are invariant; a distinct owner set or member remains separate',()=>{
 const a={member:'X',owners:['B','A'],balance:118000},base=aggregateJointPools([a]);assert.equal(base.above,18000);
 assert.deepEqual(aggregateJointPools([{...a,owners:['A','B']}]),base);
 const split=aggregateJointPools([{...a,balance:20000},{...a,balance:52000},{...a,balance:46000}]);assert.equal(split.pools.length,1);assert.equal(split.within,base.within);assert.equal(split.above,base.above);
 const separate=aggregateJointPools([a,{...a,owners:['A','C'],balance:51000},{...a,member:'Y',balance:123000}]);assert.equal(separate.pools.length,3);assert.equal(separate.above,41000);
});
test('the cap belongs to a set regardless of its number of owners and unused capacity stays local',()=>{
 const r=aggregateJointPools([{member:'X',owners:['A','B','C'],balance:180000},{member:'X',owners:['A','D'],balance:10000}]);assert.equal(r.within,110000);assert.equal(r.above,80000);assert.equal(r.unused,90000);assert.ok(r.total<2*jointOwnerCap);assert.equal(r.pools[0].within,100000);
});
test('zero, exact-threshold and one-cent-above boundaries match an independent integer-cent reference',()=>{
 for(const n of [0,1,99999.99,100000,100000.01,300000]){const r=aggregateJointPools([{member:'X',owners:['A','B'],balance:n}]);assert.equal(r.within,Math.min(Math.round(n*100),10000000)/100);assert.equal(r.above,Math.max(0,Math.round(n*100)-10000000)/100);assert.equal(r.pools[0].balance,n);}
 const r=aggregateJointPools([{member:'X',owners:['A','B'],balance:50000.004},{member:'X',owners:['B','A'],balance:50000.006}]);assert.equal(r.total,100000.01);assert.equal(r.above,.01);
});
test('amount edits change only their compatible pool; isolated sensitivity excludes the other pools',()=>{
 const base=jointOwnerLedger(input()),changed=jointOwnerLedger(input({jointXabOne:54000}));assert.equal(changed.above,23000);assert.equal(changed.pools[0].above,0);assert.deepEqual(changed.pools.slice(1),base.pools.slice(1));
 const figure=planningResult('jointOwnerPools').charts[3];assert.deepEqual(figure.rows.map(r=>r.values),[[0,0,0],[0,18000,64000],[44000,90000,136000]]);
 assert.deepEqual(figure,planningResult('jointOwnerPools',input({jointXac:300000,jointYab:0})).charts[3]);assert.notDeepEqual(figure.rows,planningResult('jointOwnerPools',input({jointXabTwo:0})).charts[3].rows);
});
test('the matrix rounds each stressed amount before grouping and its centre matches only the selected pool',()=>{
 const p=input({jointXabOne:60000.004,jointXabTwo:50000.006}),r=planningResult('jointOwnerPools',p),ledger=jointOwnerLedger(p);assert.equal(r.charts[3].rows[1].values[1],ledger.pools[0].above);
 for(let a=0;a<3;a++)for(let b=0;b<3;b++)assert.equal(r.charts[3].rows[a].values[b],Math.max(0,Math.round(p.jointXabOne*a*100)+Math.round(p.jointXabTwo*b*100)-10000000)/100);
});
test('every control endpoint and all-zero inventory render finite charts with accessible tables and reconciled totals',()=>{
 const allZero=Object.fromEntries(definitions.jointOwnerPools.fields.map(([k])=>[k,0]));
 for(const p of [allZero,...definitions.jointOwnerPools.fields.flatMap(([k,,,lo,hi])=>[input({[k]:lo}),input({[k]:hi})])]){const r=planningResult('jointOwnerPools',p),l=jointOwnerLedger(p);assert.equal(r.metrics[0][1],l.total);assert.equal(r.charts[2].rows.reduce((s,x)=>s+x.value,0),l.above);assert.equal(l.pools.length,3);for(const c of r.charts){const h=renderFigure(c,300);assert.match(h,/View chart data/);assert.match(h,/role="img"/);assert.doesNotMatch(h,/NaN|Infinity|undefined/);}}
 assert.deepEqual(planningResult('jointOwnerPools',allZero).metrics.map(m=>m[1]),[0,0,0]);
});
test('invalid input ranges and malformed inventories are rejected',()=>{
 for(const o of [{jointXabOne:-1},{jointXac:300001},{jointYab:Infinity},{jointXabTwo:NaN}]){assert.equal(validInputs('jointOwnerPools',input(o)),false);assert.throws(()=>planningResult('jointOwnerPools',input(o)));}
 for(const a of [{member:'',owners:['A','B'],balance:1},{member:'X',owners:['A'],balance:1},{member:'X',owners:['A','A'],balance:1},{member:'X',owners:['A',''],balance:1},{member:'X',owners:['A','B'],balance:-1}])assert.throws(()=>aggregateJointPools([a]));
});
test('the detailed English guide labels its conditional scope, original examples, primary sources and related reading',()=>{
 const g=jointOwnerGuides[0],r=planningResult(g.planning);assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>1000);assert.equal(g.sources.length,3);assert.ok(g.sources.every(s=>new URL(s.url).hostname==='www.cdic.ca'));assert.ok(r.charts.every(c=>!c.source));assert.match(r.note,/not a predicted loss/);assert.match(r.note,/rounded to cents/);assert.match(g.sections.map(s=>s.html).join(' '),/one payment/);g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug)));assert.equal(planningGuides.filter(x=>x.planning===g.planning).length,1);
});
