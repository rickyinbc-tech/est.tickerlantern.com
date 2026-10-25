import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {feeSlicesQuote} from '../src/planning-fee-slices-models.js';
import {renderResult,renderFigure} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('default quotes allocate actual slices, then minimum uplift and fixed annual fee once',()=>{
 const d=defaults('feeSlices'),q=feeSlicesQuote(d);
 assert.deepEqual(q.slices,[100000,150000,0]);assert.deepEqual(q.sliceCharges,[800,750,0]);
 near(q.progressiveRaw,1550);near(q.wholeRaw,1250);near(q.progressiveUplift,0);near(q.progressive,1670);near(q.whole,1370);near(q.progressiveRate,.00668);
 const chart=planningResult('feeSlices',d).charts[0];near(chart.rows.reduce((s,r)=>s+r.value,0),q.progressive);
});
test('whole-balance threshold boundaries retain the lower band and cross only above it',()=>{
 const d={...defaults('feeSlices'),feeMinimum:0,feeFixed:0};
 for(const [base,band] of [[0,0],[99999.99,0],[100000,0],[100000.01,1],[500000,1],[500000.01,2],[1000000,2]]){
  const q=feeSlicesQuote(d,base);assert.equal(q.band,band);near(q.wholeRaw,base*[.008,.005,.003][band]);near(q.slices.reduce((a,b)=>a+b,0),base);
 }
 near(feeSlicesQuote(d,100000.01).progressive-feeSlicesQuote(d,100000).progressive,.00005);
 near(feeSlicesQuote(d,500000.01).progressive-feeSlicesQuote(d,500000).progressive,.00003);
});
test('independent dollar-block allocation matches progressive sums across the full fee base',()=>{
 const d={...defaults('feeSlices'),feeMinimum:0,feeFixed:0};let sum=0;
 // Independent CAD 100 blocks, charging the rate in force for that block.
 for(let base=0;base<=1000000;base+=100){
  near(feeSlicesQuote(d,base).progressiveRaw,sum);
  sum+=100*(base<100000?.008:base<500000?.005:.003);
 }
});
test('minimum applies to asset charge before fixed fee and zero denominators stay undefined',()=>{
 const d=defaults('feeSlices'),small=feeSlicesQuote(d,25000),zero=feeSlicesQuote(d,0);
 near(small.progressiveRaw,200);near(small.progressiveUplift,100);near(small.progressive,420);near(small.whole,420);
 near(zero.progressive,420);assert.equal(zero.progressiveRate,null);assert.equal(zero.wholeRate,null);
 const result=planningResult('feeSlices',{...d,feeBase:0});assert.equal(result.metrics[2][1],null);assert.equal(result.metrics[2][3],'N/A · zero fee base');
 const capped=feeSlicesQuote({...d,feeMinimum:2000});near(capped.progressive,2120);near(capped.whole,2120);
 const allZero=feeSlicesQuote({...d,feeFirst:0,feeMiddle:0,feeTop:0,feeMinimum:0,feeFixed:0});near(allZero.progressive,0);near(allZero.whole,0);
});
test('threshold comparison uses exactly CAD 100 more and does not infer a continuous whole-band path',()=>{
 const d=defaults('feeSlices'),r=planningResult('feeSlices',d),changes=r.charts[2].rows.map(x=>x.value);
 [.5,-299.5,.3,-999.7].forEach((v,j)=>near(changes[j],v));
 const raisedFixed=planningResult('feeSlices',{...d,feeFixed:500});r.charts[2].rows.forEach((row,j)=>near(raisedFixed.charts[2].rows[j].value,row.value));
 const minimum=planningResult('feeSlices',{...d,feeMinimum:2000});near(minimum.charts[2].rows[0].value,0);near(minimum.charts[2].rows[1].value,0);
 const increasing={...d,feeFirst:.2,feeMiddle:.5,feeTop:1,feeMinimum:0};assert.ok(feeSlicesQuote(increasing).progressive<feeSlicesQuote(increasing).whole);
});
test('comparison rows and effective matrix use their stated bases and retain entered charges',()=>{
 const d=defaults('feeSlices'),r=planningResult('feeSlices',d),bases=[25000,100000,250000,500000,750000,1000000];
 r.charts[1].rows.forEach((row,j)=>{const q=feeSlicesQuote(d,bases[j]);near(row.values[0],q.progressive);near(row.values[1],q.whole);});
 [50000,250000,1000000].forEach((base,j)=>{const q=feeSlicesQuote(d,base);near(r.charts[3].rows[0].values[j],q.progressive/base);near(r.charts[3].rows[1].values[j],q.whole/base);});
});
test('supported boundary combinations render four finite figures and accessible tables',()=>{
 const d=defaults('feeSlices'),fields=definitions.feeSlices.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('feeSlices',i));const r=planningResult('feeSlices',i);finite(r);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 assert.equal(validInputs('feeSlices',{...d,feeBase:-1}),false);
});

test('an asymmetric signed-bar scale keeps zero legible instead of overlapping the tiny positive endpoint',()=>{
 const chart=planningResult('feeSlices').charts[2],h=renderFigure(chart,354);
 const axisY=12+chart.rows.length*70+42-10;
 const labels=[...h.matchAll(new RegExp('<text x="[^" ]+" y="'+axisY+'"[^>]*>([^<]+)</text>','g'))].map(m=>m[1]);
 assert.ok(labels.includes('$0'));assert.ok(!labels.includes('$0.5'));assert.ok(h.includes('$0.5</text>'));
});
