import test from 'node:test';
import assert from 'node:assert/strict';
import { roomByStartYear, stagePlan } from '../src/planning-tfsa-stage-models.js';
import { defaults, planningResult } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);
const slug='lump-sum-bigger-than-tfsa-room-move-in-each-january-non-registered-tax-drag';

test('cumulative TFSA room follows the CRA dollar limits',()=>{
 const rows=roomByStartYear();
 assert.equal(rows.length,18);assert.equal(rows[0].room,109000);
 assert.equal(rows.find(r=>r.year===2020).room,45500);assert.equal(rows.at(-1).room,7000);
});

test('default plan matches an independent unit-and-price Decimal check',()=>{
 const d=defaults('tfsaStageLump'),s=stagePlan(d),t=stagePlan(d,{stage:false});
 near(s.afterTax,304319.6354775677154,1e-12);near(t.afterTax,282677.1115550545578,1e-12);
 near(s.taxMove,3656.538012753163629,1e-10);near(s.taxDist,3872.099095367220629,1e-10);near(t.taxDist,14681.93192075513390,1e-10);
 assert.equal(s.full,16);assert.equal(t.full,null);
 // each January move fills exactly the new room while units remain
 near(s.rows[1].moved,7000,1e-12);
});

test('edge cases: room covers the lump, room used by pay, no new room',()=>{
 const d=defaults('tfsaStageLump');
 const all=stagePlan({...d,ltsRoom:200000});assert.equal(all.full,1);assert.equal(all.nonreg,0);near(all.afterTax,d.ltsLump*1.05**20,1e-12);
 const pay=stagePlan({...d,ltsPay:7000}),today=stagePlan(d,{stage:false});near(pay.afterTax,today.afterTax,1e-12);
 const big=stagePlan({...d,ltsLump:300000});assert.ok(big.rows.at(-1).nonreg>big.rows[0].nonreg);
 const loss=stagePlan({...d,ltsReturn:0,ltsDist:2});assert.ok(Number.isFinite(loss.afterTax)&&loss.taxMove===0);
});

test('guide renders four charts with the default text figures',()=>{
 const g=planningGuides.find(x=>x.slug===slug);assert.ok(g);
 const r=planningResult('tfsaStageLump',defaults('tfsaStageLump'));
 assert.equal(r.charts.length,4);assert.equal(r.metrics.length,6);
 assert.equal(r.charts[0].evidence,'Official limits');
 const grid=r.charts[3].rows;assert.ok(grid.every(row=>row.values.every(v=>v>0)));
 assert.ok(grid.every(row=>row.values[0]<1100));
 near(grid[0].values.at(-1),31953,2e-5);near(grid[4].values.at(-1),75556,2e-5);
 for(const s of ['CAD 304,320','CAD 282,677','CAD 21,643','CAD 3,657','CAD 3,872','CAD 14,682','year 16','CAD 109,000','CAD 45,500'])assert.ok(JSON.stringify(g).includes(s),s);
});
