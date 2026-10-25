import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {discountBasisLedger} from '../src/planning-discount-basis-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
const geometric=(q,n)=>Math.abs(q-1)<1e-12?n:q*(q**n-1)/(q-1);
test('the two consistent routes agree payment by payment with exact year-end timing',()=>{
 const d=defaults('discountBasis'),p=discountBasisLedger(d),pg=1.03,ng=1.06;
 assert.equal(p.rows.length,20);assert.equal(p.rows[0].x,1);assert.equal(p.rows.at(-1).x,20);
 near(p.rows[0].nominalCash,12360);near(p.rows[0].correctNominal,12360/1.06);near((1+p.realRate)*pg,ng);
 for(const r of p.rows){near(r.correctNominal,r.correctReal);near(r.nominalCash/pg**r.x,d.basisCost);}
 near(p.matchedNominal,p.matchedReal);near(p.matchedNominal,179980.54365618186);near(p.matchedNominal-p.mixedFixed,42341.48903339883);
});
test('independent finite geometric sums reproduce matched and deliberately mixed totals',()=>{
 const d=defaults('discountBasis');
 for(const inflation of [0,2,6,8])for(const nominal of [0,3,6,12]){
  const i={...d,basisInflation:inflation,basisNominal:nominal},p=discountBasisLedger(i),pg=1+inflation/100,ng=1+nominal/100;
  near(p.matchedNominal,i.basisCost*geometric(pg/ng,i.basisYears));near(p.mixedFixed,i.basisCost*geometric(1/ng,i.basisYears));near(p.mixedIndexed,i.basisCost*geometric(pg*pg/ng,i.basisYears));
  assert.ok(p.mixedFixed<=p.matchedNominal+1e-6&&p.matchedNominal<=p.mixedIndexed+1e-6);
 }
});
test('zero inflation removes basis differences and equal nominal/inflation rates give a zero real rate',()=>{
 const d=defaults('discountBasis'),noInflation=discountBasisLedger({...d,basisInflation:0});
 near(noInflation.realRate,d.basisNominal/100);near(noInflation.matchedNominal,noInflation.mixedFixed);near(noInflation.matchedNominal,noInflation.mixedIndexed);
 const equal=discountBasisLedger({...d,basisNominal:d.basisInflation});near(equal.realRate,0);near(equal.matchedNominal,d.basisCost*d.basisYears);
 const negative=discountBasisLedger({...d,basisNominal:0});assert.ok(negative.realRate<0);near(negative.matchedNominal,negative.matchedReal);
});
test('zero-cost percentage errors remain unavailable while nonzero cost scales dollars only',()=>{
 const d=defaults('discountBasis'),zero=planningResult('discountBasis',{...d,basisCost:0});
 near(zero.metrics[1][1],0);near(zero.metrics[2][1],0);assert.ok(zero.charts[3].rows.every(r=>r.values.every(v=>v===null)));assert.match(renderResult(zero),/N\/A/);
 const a=discountBasisLedger(d),b=discountBasisLedger({...d,basisCost:3*d.basisCost});near(b.matchedNominal,3*a.matchedNominal);near(b.mixedFixed,3*a.mixedFixed);near(b.realRate,a.realRate);
 const ar=planningResult('discountBasis',d),br=planningResult('discountBasis',{...d,basisCost:3*d.basisCost});
 ar.charts[3].rows.forEach((row,n)=>row.values.forEach((v,j)=>near(v,br.charts[3].rows[n].values[j])));
});
test('the matrix replaces both rate assumptions and retains the selected cost and year count',()=>{
 const d=defaults('discountBasis'),m=planningResult('discountBasis',d).charts[3];
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const p=discountBasisLedger({...d,basisInflation:[0,2,4,6][row],basisNominal:[0,3,6,9][col]});near(m.rows[row].values[col],p.mixedFixed/p.matchedNominal-1);
  if(row===0)near(m.rows[row].values[col],0);else assert.ok(m.rows[row].values[col]<0);
 }
});
test('whole payment counts and supported input boundaries retain four finite charts/tables',()=>{
 const d=defaults('discountBasis'),fields=definitions.discountBasis.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('discountBasis',i));const r=planningResult('discountBasis',i);finite(r);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 assert.equal(validInputs('discountBasis',{...d,basisYears:1.5}),false);
});
