import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {depositCoverageMap,depositMapCap} from '../src/planning-deposit-map-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('the original client-name snapshot aggregates channels before applying four separate caps',()=>{
 const p=depositCoverageMap(defaults('depositMap'));assert.equal(depositMapCap,100000);
 assert.deepEqual(p.cells.map(c=>c.total),[110000,110000,90000,30000]);assert.deepEqual(p.cells.map(c=>c.within),[100000,100000,90000,30000]);
 assert.deepEqual(p.cells.map(c=>c.excess),[10000,10000,0,0]);near(p.total,340000);near(p.within,320000);near(p.excess,20000);
});
test('a channel-only reclassification preserves all bucket balances and conditional coverage',()=>{
 const d=defaults('depositMap'),a=depositCoverageMap(d),b=depositCoverageMap({...d,depositAOneDirect:40000,depositAOneBroker:70000});
 near(a.total,b.total);near(a.within,b.within);near(a.excess,b.excess);
 for(let n=0;n<4;n++)for(const k of ['total','within','excess','headroom'])near(a.cells[n][k],b.cells[n][k]);
 assert.notEqual(a.cells[0].direct,b.cells[0].direct);
});
test('positive headroom elsewhere cannot net away an above-cap balance',()=>{
 const p=depositCoverageMap(defaults('depositMap'));
 near(p.cells.reduce((s,c)=>s+c.headroom,0),60000);assert.ok(p.total<4*depositMapCap);assert.ok(p.excess>0);
 assert.notEqual(Math.min(4*depositMapCap,p.total),p.within);
 near(p.excess,p.cells.reduce((s,c)=>s+Math.max(0,-c.headroom),0));
});
test('cell-level conservation and global aggregation hold over independent boundary combinations',()=>{
 const d=defaults('depositMap');
 for(const one of [0,50000,100000,150000,250000])for(const tfsa of [0,75000,150000]){
  const i={...d,depositAOneDirect:one,depositAOneBroker:tfsa,depositBTfsaDirect:tfsa},p=depositCoverageMap(i);
  for(const c of p.cells){near(c.direct+c.broker,c.total);near(c.within+c.excess,c.total);near(c.headroom+c.total,depositMapCap);assert.ok(c.within<=depositMapCap&&c.within>=0&&c.excess>=0);}
  near(p.within+p.excess,p.total);assert.ok(p.within<=400000);
 }
});
test('headroom matrix and coverage waterfall retain the same issuer/category mapping',()=>{
 const i=defaults('depositMap'),p=depositCoverageMap(i),r=planningResult('depositMap',i);
 assert.deepEqual(r.charts[2].rows.map(r=>r.values),[[-10000,-10000],[10000,70000]]);
 near(r.charts[3].rows.reduce((s,r)=>s+r.value,0),p.within);
 for(let n=0;n<4;n++){near(r.charts[0].rows[n].values.reduce((a,b)=>a+b,0),p.cells[n].total);near(r.charts[1].rows[n].values.reduce((a,b)=>a+b,0),p.cells[n].total);}
});
test('all supported balance limits produce finite nonnegative coverage and four inspectable charts',()=>{
 const d=defaults('depositMap'),fields=definitions.depositMap.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('depositMap',i));const r=planningResult('depositMap',i),p=depositCoverageMap(i);finite(r);near(p.within+p.excess,p.total);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 assert.equal(validInputs('depositMap',{...d,depositAOneDirect:-1}),false);
});
