import test from 'node:test';import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';import {cppCashLedger} from '../src/planning-cpp-amounts-models.js';import {cppAmounts} from '../src/planning-cpp-amounts-data.js';
import {cppAmountsGuides} from '../src/planning-cpp-amounts-guides.js';import {planningGuides} from '../src/planning-guides.js';import {renderFigure} from '../src/planning-charts.js';
const input=o=>({...defaults('cppAmountContext'),...o});
test('CPP snapshot retains exact dates, dimensions, source encoding and content hashes',()=>{
 assert.equal(cppAmounts.age,65);assert.equal(cppAmounts.average.reference,'2026-07');assert.equal(cppAmounts.average.value,858.34);assert.match(cppAmounts.average.population,/New beneficiaries/);assert.equal(cppAmounts.reviewed,'2026-10-25');assert.equal(cppAmounts.maximumSource.encoding,'Windows-1252');for(const h of [cppAmounts.average.sha256,cppAmounts.maximumSource.sha256])assert.match(h,/^[a-f0-9]{64}$/);
});
test('ten exact new-start maxima preserve calendar order and exclude future start months',()=>{
 assert.deepEqual(cppAmounts.maximumRows.map(r=>r.value),[1507.65,1509.20,1510.76,1512.32,1513.88,1515.44,1516.99,1518.55,1520.11,1521.67]);assert.deepEqual(cppAmounts.maximumRows.map(r=>r.month),[1,2,3,4,5,6,7,8,9,10]);cppAmounts.maximumRows.forEach((r,i)=>assert.equal(r.reference,`2026-${String(i+1).padStart(2,'0')}`));
});
test('dated comparison and focused axis use the corresponding source values',()=>{
 const r=planningResult('cppAmountContext'),a=r.charts[0],b=r.charts[1];assert.deepEqual(a.rows.map(x=>x.value),[858.34,1507.65,1516.99]);assert.match(a.rows[1].label,/January/);assert.match(a.rows[2].label,/July/);assert.equal(b.yMin,1500);assert.equal(b.yMax,1530);assert.equal(b.series[0].rows.length,10);assert.match(b.note,/not a monthly escalation/);assert.match(b.note,/November/);
});
test('the default cash ledger reconciles its monthly gap, ninth-month shortage and full-horizon funding',()=>{
 const p=input(),r=cppCashLedger(p);assert.equal(r.net,-700);assert.equal(r.gap,700);assert.equal(r.rows[0].value,6000);assert.equal(r.rows[8].value,400);assert.equal(r.rows[9].value,-300);assert.equal(r.ending,-2400);assert.equal(r.extra,2400);assert.equal(r.rows.length,13);
});
test('each cash input can change without changing any official source row or source metric',()=>{
 const base=planningResult('cppAmountContext');for(const [key,,,lo,hi] of definitions.cppAmountContext.fields)for(const v of [lo,hi]){const r=planningResult('cppAmountContext',input({[key]:v}));assert.deepEqual(r.charts.slice(0,2),base.charts.slice(0,2));assert.deepEqual(r.metrics[0],base.metrics[0]);}
});
test('independent month-end sums and the waterfall agree with the cash path',()=>{
 for(const p of [input(),input({cppCashPension:0,cppCashMonths:36}),input({cppCashOther:20000,cppCashSpend:0}),input({cppCashReserve:0,cppCashMonths:1})]){const r=planningResult('cppAmountContext',p),ledger=cppCashLedger(p);assert.equal(r.charts[2].rows.reduce((n,x)=>n+x.value,0),ledger.net);let balance=p.cppCashReserve;r.charts[3].series[0].rows.forEach((row,k)=>{if(k)balance+=p.cppCashOther+p.cppCashPension-p.cppCashSpend;assert.equal(row.value,balance);});assert.equal(ledger.ending,p.cppCashReserve+p.cppCashMonths*(p.cppCashOther+p.cppCashPension-p.cppCashSpend));}
});
test('additional cash lifts the lowest provisional point to zero without inventing borrowing',()=>{
 for(const p of [input(),input({cppCashReserve:0}),input({cppCashMonths:36}),input({cppCashOther:0,cppCashPension:0})]){const r=cppCashLedger(p),funded=cppCashLedger({...p,cppCashReserve:p.cppCashReserve+r.extra});assert.equal(Math.min(...funded.rows.map(x=>x.value)),0);assert.equal(funded.extra,0);}
});
test('surplus, exact-balance and zero-cash cases do not manufacture a reserve shortfall',()=>{
 for(const p of [input({cppCashOther:2500}),input({cppCashOther:5000}),input({cppCashReserve:0,cppCashSpend:0,cppCashOther:0,cppCashPension:0})]){const r=cppCashLedger(p);assert.equal(r.gap,0);assert.equal(r.extra,0);assert.ok(r.ending>=p.cppCashReserve);}
});
test('supported field extrema render finite labelled charts while fractional months are rejected',()=>{
 for(const p of definitions.cppAmountContext.fields.flatMap(([key,,,lo,hi])=>[input({[key]:lo}),input({[key]:hi})])){assert.ok(validInputs('cppAmountContext',p));const r=planningResult('cppAmountContext',p);for(const c of r.charts){const h=renderFigure(c,300);assert.match(h,/View chart data/);assert.match(h,/role="img"/);assert.doesNotMatch(h,/NaN|Infinity|undefined/);}}
 for(const o of [{cppCashMonths:1.5},{cppCashMonths:0},{cppCashSpend:-1},{cppCashPension:NaN}]){assert.equal(validInputs('cppAmountContext',input(o)),false);assert.throws(()=>planningResult('cppAmountContext',input(o)));}
});
test('the English guide preserves the population/entitlement limits and separate hypothetical figures',()=>{
 const g=cppAmountsGuides[0],r=planningResult(g.planning);assert.ok(g.sections.reduce((n,s)=>n+s.html.replace(/<[^>]*>/g,' ').split(/\s+/).length,0)>750);assert.match(g.chartScope,/July 2026 new-beneficiary/);assert.equal(g.sources.length,4);assert.ok(r.charts.slice(0,2).every(x=>x.source));assert.ok(r.charts.slice(2).every(x=>!x.source));g.related.forEach(slug=>assert.ok(planningGuides.some(x=>x.slug===slug),slug));
});

test('the focused money axis preserves distinct exact ticks without changing other chart defaults',()=>{
 const c=planningResult('cppAmountContext').charts[1],h=renderFigure(c,300);for(const tick of ['$1,500','$1,507.5','$1,515','$1,522.5','$1,530'])assert.ok(h.includes(tick),tick);assert.equal(c.compactYTicks,false);assert.match(renderFigure({...c,compactYTicks:true},300),/\$1.5k/);
});
