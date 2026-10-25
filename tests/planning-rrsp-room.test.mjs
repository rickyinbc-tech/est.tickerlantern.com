import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {rrspRoomRow,rrspRoomAllocation} from '../src/planning-rrsp-room-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const kind='rrspRoomLedgerPlanning';
test('the invented contribution schedule crosses ordinary capacity before the conditional reference',()=>{
 const d=defaults(kind);assert.equal(rrspRoomRow(d,0).headroom,13000);
 assert.equal(rrspRoomRow(d,8).headroom,1000);assert.equal(rrspRoomRow(d,9).headroom,-500);
 assert.equal(rrspRoomRow(d,10).aboveReference,0);assert.equal(rrspRoomRow(d,11).aboveReference,1500);
 const end=rrspRoomRow(d,12);assert.equal(end.record,23000);assert.equal(end.newContributions,18000);assert.equal(end.headroom,-5000);assert.equal(end.aboveReference,3000);
});
test('prior undeducted deposits use capacity and a prior overage remains visible with no new cash',()=>{
 const d=defaults(kind);assert.equal(rrspRoomRow({...d,rrspRoomUnused:0},0).headroom,18000);
 const over=rrspRoomRow({...d,rrspRoomCapacity:2000,rrspRoomUnused:5000,rrspRoomMonthly:0},12);assert.equal(over.headroom,-3000);assert.equal(over.withinReference,2000);assert.equal(over.aboveReference,1000);
 assert.equal(rrspRoomRow({...d,rrspRoomMonthly:0},12).record,d.rrspRoomUnused);
});
test('every snapshot partitions the record exactly without treating its reference bands as extra capacity',()=>{
 const d=defaults(kind);for(const rrspRoomCapacity of [0,2000,18000,100000])for(const rrspRoomUnused of [0,5000,100000])for(const rrspRoomMonthly of [0,1500,10000])for(let m=0;m<=12;m++){
  const r=rrspRoomRow({...d,rrspRoomCapacity,rrspRoomUnused,rrspRoomMonthly},m);assert.equal(r.withinCapacity+r.withinReference+r.aboveReference,r.record);assert.equal(r.headroom,rrspRoomCapacity-rrspRoomUnused-rrspRoomMonthly*m);assert.ok(r.withinReference>=0&&r.withinReference<=2000);
 }
});
test('the paired allocation leaves the capacity-minus-contribution difference unchanged',()=>{
 const d=defaults(kind),a=rrspRoomAllocation(d);assert.equal(a.q,10000);assert.equal(a.afterCapacity,8000);assert.equal(a.afterRecord,13000);assert.equal(a.afterCapacity-a.afterRecord,-5000);
 for(const rrspRoomCapacity of [0,5000,18000,100000])for(const rrspRoomUnused of [0,20000]){const p=rrspRoomAllocation({...d,rrspRoomCapacity,rrspRoomUnused});assert.ok(p.afterCapacity>=0&&p.afterRecord>=0);assert.equal(p.afterCapacity-p.afterRecord,p.headroom);}
});
test('the fixed matrix replaces horizon and contribution size while keeping the opening basis',()=>{
 const d=defaults(kind),r=planningResult(kind),grid=r.charts[4];assert.deepEqual(grid,planningResult(kind,{...d,rrspRoomMonths:3,rrspRoomMonthly:100}).charts[4]);
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)assert.equal(grid.rows[i].values[j],d.rrspRoomCapacity-d.rrspRoomUnused-[3,6,9,12][i]*[500,1000,1500,2000][j]);
 assert.equal(grid.rows[3].values[1],1000);assert.equal(grid.rows[2].values[2],-500);
});
test('monthly curves show undeducted records rather than account returns and the reference never changes capacity',()=>{
 const d=defaults(kind),r=planningResult(kind),chart=r.charts[1];assert.equal(chart.series[0].rows[0].value,5000);assert.equal(chart.series[0].rows.at(-1).value,23000);assert.ok(chart.series[1].rows.every(row=>row.value===18000));assert.ok(chart.series[2].rows.every(row=>row.value===20000));
 assert.deepEqual(r.metrics.map(m=>m[1]),[13000,-5000,23000]);assert.equal(r.charts[2].rows.at(-1).values.reduce((a,b)=>a+b),23000);
});
test('the new route and existing deduction-timing and equal-budget guides remain distinct',()=>{
 const match=planningGuides.filter(g=>g.planning===kind);assert.equal(match.length,1);const g=match[0];assert.equal(g.slug,'rrsp-contribution-room-undeducted-contributions-ledger');assert.equal(g.sections.length,8);
 for(const slug of ['rrsp-deduction-now-later-tax-saving-opportunity-cost','rrsp-tfsa-tax-timing']){assert.ok(planningGuides.some(p=>p.slug===slug));assert.ok(g.related.includes(slug));}
 const text=g.sections.map(s=>s.html).join(' ');assert.match(text,/earlier taxation year/);assert.match(text,/not a newly issued CRA limit/);assert.match(text,/for 2025/);assert.ok(g.sources.some(s=>s.url.includes('section-204.2')));
});
test('whole-month and numerical limits reject invalid requests before results change',()=>{
 const d=defaults(kind);for(const rrspRoomMonths of [0,1.5,13,NaN])assert.throws(()=>planningResult(kind,{...d,rrspRoomMonths}));assert.throws(()=>planningResult(kind,{...d,rrspRoomMonthly:-1}));
});
test('zero, overage and field boundaries render five finite figures with exact-value tables',()=>{
 const d=defaults(kind),fields=definitions[kind].fields,cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi])),{...d,rrspRoomCapacity:0,rrspRoomUnused:100000,rrspRoomMonthly:10000}];
 for(const input of cases)for(const width of [300,760]){const r=planningResult(kind,input),html=renderResult(r,width);assert.equal(r.charts.length,5);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
});
