import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {twoPeriodNpv,nonnegativeTwoPeriodIrr} from '../src/planning-multiple-irr-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
test('the original example has two verified roots and an independently factorized NPV profile',()=>{
 const d=defaults('multipleIrr'),roots=nonnegativeTwoPeriodIrr(d);assert.equal(roots.length,2);near(roots[0],.1);near(roots[1],.2);
 for(const r of [0,.05,.1,.15,.2,.3,.5]){const g=1+r;near(twoPeriodNpv(d,r),-10000*(g-1.1)*(g-1.2)/g**2);}
 for(const r of roots)near(twoPeriodNpv(d,r),0);
 near(twoPeriodNpv(d,.15),18.90359168241988);
 assert.ok(twoPeriodNpv(d,0)<0&&twoPeriodNpv(d,.15)>0&&twoPeriodNpv(d,.3)<0);
});
test('known nonnegative rate pairs recover from cash flows constructed by Vieta identities',()=>{
 for(const [a,b] of [[0,.1],[.1,.2],[.02,.9],[1,2],[.4,.4]]){
  const c=10000,i={irrInitial:c,irrReceipt:c*(2+a+b),irrFinal:c*(1+a)*(1+b)},roots=nonnegativeTwoPeriodIrr(i);
  assert.equal(roots.length,a===b?1:2);near(roots[0],a);near(roots.at(-1),b);
  for(const r of roots)near(twoPeriodNpv(i,r),0);
 }
});
test('a tangent solution is distinct from no nonnegative solution or a discarded negative-rate root',()=>{
 const d=defaults('multipleIrr'),tangent={...d,irrFinal:13225},one=nonnegativeTwoPeriodIrr(tangent);assert.equal(one.length,1);near(one[0],.15);
 for(let n=0;n<=50;n++)assert.ok(twoPeriodNpv(tangent,n/100)<=1e-8);
 assert.deepEqual(nonnegativeTwoPeriodIrr({...d,irrReceipt:10000,irrFinal:10000}),[]);
 assert.deepEqual(nonnegativeTwoPeriodIrr({...d,irrReceipt:0,irrFinal:0}),[]);
 const mixed=nonnegativeTwoPeriodIrr({...d,irrReceipt:13000,irrFinal:3000});assert.equal(mixed.length,1);near(mixed[0],0);
});
test('a zero terminal obligation reduces to the two-date return without admitting growth factor zero',()=>{
 const d=defaults('multipleIrr');
 const positive=nonnegativeTwoPeriodIrr({...d,irrReceipt:15000,irrFinal:0});assert.equal(positive.length,1);near(positive[0],.5);
 assert.deepEqual(nonnegativeTwoPeriodIrr({...d,irrReceipt:5000,irrFinal:0}),[]);
 assert.deepEqual(nonnegativeTwoPeriodIrr({...d,irrReceipt:10000,irrFinal:0}),[0]);
});
test('scale changes dollars but preserves rates, while discount input changes NPV but not roots',()=>{
 const d=defaults('multipleIrr'),k=3.25,s={...d,irrInitial:k*d.irrInitial,irrReceipt:k*d.irrReceipt,irrFinal:k*d.irrFinal};
 nonnegativeTwoPeriodIrr(s).forEach((r,j)=>near(r,nonnegativeTwoPeriodIrr(d)[j]));near(twoPeriodNpv(s,.15),k*twoPeriodNpv(d,.15));
 const a=planningResult('multipleIrr',d),b=planningResult('multipleIrr',{...d,irrDiscount:50});assert.equal(a.metrics[1][3],b.metrics[1][3]);assert.notEqual(a.metrics[0][1],b.metrics[0][1]);
 near(a.charts[2].rows.reduce((sum,r)=>sum+r.value,0),a.metrics[0][1]);assert.equal(b.charts[1].series[0].rows.at(-1).x,50);
});
test('all supported boundaries produce finite cash-flow valuations and three charts/tables',()=>{
 const d=defaults('multipleIrr'),fields=definitions.multipleIrr.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi]))];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('multipleIrr',i));const r=planningResult('multipleIrr',i);finite(r);assert.equal(r.charts.length,3);assert.ok(nonnegativeTwoPeriodIrr(i).every(x=>x>=0));
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,3);assert.equal((h.match(/<caption>/g)||[]).length,3);}
 }
 assert.equal(validInputs('multipleIrr',{...d,irrInitial:0}),false);
});
