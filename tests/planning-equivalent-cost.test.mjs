import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {equivalentAnnuityFactor,equivalentCycleCost,equivalentCostComparison} from '../src/planning-equivalent-cost-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('default one-cycle valuations, annual equivalents and eight-year repeat comparison reconcile',()=>{
 const d=defaults('equivalentCost'),p=equivalentCostComparison(d);assert.equal(p.horizon,8);
 near(p.a.pv,1490.3916179405483);near(p.b.pv,2336.63724374752);near(p.a.annual,410.5880544377628);near(p.b.annual,347.0556640934259);
 near(p.pvA,2764.384619231703);near(p.pvB,2336.63724374752);near(p.rows.at(-1).cumulativeA,3040);near(p.rows.at(-1).cumulativeB,2400);
 assert.ok(p.a.pv<p.b.pv);assert.ok(p.a.annual>p.b.annual);
});
test('closed-form finite annuities independently match year-end factors and annual equivalents',()=>{
 for(let n=1;n<=8;n++)for(const rate of [0,4,12]){
  const r=rate/100,closed=r===0?n:(1-(1+r)**-n)/r,c=equivalentCycleCost(1200,80,n,rate);
  near(equivalentAnnuityFactor(rate,n),closed);near(c.pv,1200+80*closed);near(c.annual,1200/closed+80);
 }
});
test('every supported pair of service lives has complete cycles and the same common-horizon identity',()=>{
 const d=defaults('equivalentCost');
 for(let a=1;a<=8;a++)for(let b=1;b<=8;b++)for(const rate of [0,4,12]){
  const p=equivalentCostComparison({...d,eacYearsA:a,eacYearsB:b,eacDiscount:rate}),af=equivalentAnnuityFactor(rate,p.horizon);
  assert.equal(p.horizon%a,0);assert.equal(p.horizon%b,0);assert.ok(p.horizon<=56);
  near(p.pvA,p.a.annual*af);near(p.pvB,p.b.annual*af);
  const chain=(cycle,life)=>Array.from({length:p.horizon/life},(_,j)=>cycle.pv/(1+rate/100)**(j*life)).reduce((x,y)=>x+y,0);
  near(p.pvA,chain(p.a,a));near(p.pvB,chain(p.b,b));
 }
 assert.equal(equivalentCostComparison({...d,eacYearsA:7,eacYearsB:8}).horizon,56);
});
test('purchase at cycle starts, final-year running cost and no unused endpoint purchase stay distinct',()=>{
 const d=defaults('equivalentCost'),p=equivalentCostComparison(d);
 near(p.rows[0].purchaseA,1200);near(p.rows[0].runningA,0);near(p.rows[4].purchaseA,1200);near(p.rows[4].runningA,80);near(p.rows[4].costA,1280);
 near(p.rows[8].purchaseA,0);near(p.rows[8].purchaseB,0);near(p.rows[8].runningA,80);near(p.rows[8].runningB,50);
 near(p.rows.reduce((v,r)=>v+r.purchaseA,0),d.eacCostA*p.horizon/d.eacYearsA);near(p.rows.reduce((v,r)=>v+r.runningA,0),d.eacRunA*p.horizon);
 const one=equivalentCostComparison({...d,eacYearsA:1,eacYearsB:1});assert.equal(one.rows.length,2);near(one.rows.at(-1).costA,d.eacRunA);
});
test('zero discount, identical options, zero costs and scale identities retain their meanings',()=>{
 const d=defaults('equivalentCost'),z=equivalentCostComparison({...d,eacDiscount:0});near(z.a.annual,d.eacCostA/d.eacYearsA+d.eacRunA);near(z.pvA,z.rows.at(-1).cumulativeA);
 const same=equivalentCostComparison({...d,eacCostB:d.eacCostA,eacYearsB:d.eacYearsA,eacRunB:d.eacRunA});near(same.a.annual,same.b.annual);near(same.pvA,same.pvB);
 const zero=equivalentCostComparison({...d,eacCostA:0,eacCostB:0,eacRunA:0,eacRunB:0});near(zero.a.annual,0);near(zero.b.annual,0);near(zero.pvA,0);
 const p=equivalentCostComparison(d),scaled=equivalentCostComparison({...d,eacCostA:2*d.eacCostA,eacCostB:2*d.eacCostB,eacRunA:2*d.eacRunA,eacRunB:2*d.eacRunB});near(scaled.a.annual,2*p.a.annual);near(scaled.pvB,2*p.pvB);
});
test('cumulative chart uses discrete steps and the sensitivity grid replaces only B price and life',()=>{
 const d=defaults('equivalentCost'),p=equivalentCostComparison(d),r=planningResult('equivalentCost',d);
 assert.ok(r.charts[0].series.every(s=>s.step));near(r.charts[0].series[0].rows.at(-1).value,p.rows.at(-1).cumulativeA);
 [1000,1500,2000,2500].forEach((price,j)=>[2,4,6,8].forEach((years,k)=>near(r.charts[3].rows[j].values[k],equivalentCycleCost(price,d.eacRunB,years,d.eacDiscount).annual-p.a.annual)));
 assert.deepEqual(r.charts[3],planningResult('equivalentCost',{...d,eacCostB:0,eacYearsB:1}).charts[3]);
});
test('whole cycle lengths and supported limits render four finite accessible figures/tables',()=>{
 const d=defaults('equivalentCost'),fields=definitions.equivalentCost.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi])),{...d,eacYearsA:7,eacYearsB:8}];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('equivalentCost',i));const r=planningResult('equivalentCost',i);finite(r);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 for(const key of ['eacYearsA','eacYearsB'])assert.equal(validInputs('equivalentCost',{...d,[key]:1.5}),false);
});
