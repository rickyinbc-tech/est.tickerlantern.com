import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {packagePurchasePath} from '../src/planning-package-price-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} differs from ${b}`);

test('same sticker price and fewer grams raise the unit price by a different percentage from the weight cut',()=>{
 const d=defaults('packagePrice'),r=planningResult('packagePrice');
 near(r.charts[0].rows[0].value,8);near(r.charts[0].rows[1].value,6/650*1000);near(r.metrics[0][1],750/650-1);
 assert.notEqual(r.metrics[0][1],(750-650)/750);assert.equal(r.metrics[1][1],12);assert.equal(r.metrics[2][1],90);
});
test('the purchase calendar buys whole packages and uses carried stock before the next purchase',()=>{
 const p=packagePurchasePath(6,650,6000,12);
 assert.equal(p.rows[1].purchased,10);assert.equal(p.rows[1].inventory,500);assert.equal(p.rows[1].value,60);
 assert.equal(p.rows[2].purchased,9);assert.equal(p.rows[2].inventory,350);assert.equal(p.rows[2].value,114);
 assert.equal(p.packages,111);assert.equal(p.cash,666);assert.equal(p.inventory,150);
});
test('quantity and cost conservation hold across package sizes, monthly use and horizons',()=>{
 for(const grams of [50,650,750,5000])for(const use of [0,1,6000,30000])for(const months of [1,12,24]){
  const p=packagePurchasePath(6.49,grams,use,months),expectedPackages=Math.ceil(months*use/grams);
  assert.equal(p.packages,expectedPackages);assert.equal(p.packages*grams,months*use+p.inventory);
  assert.ok(p.rows.every(r=>Number.isInteger(r.purchased)&&r.purchased>=0&&r.inventory>=0&&r.inventory<grams));
  near(p.cash,p.consumedCost+p.stockCost);near(p.cash,expectedPackages*6.49);
 }
});
test('zero consumption buys nothing and identical alternatives have no cash or unit-price difference',()=>{
 const d=defaults('packagePrice'),zero=planningResult('packagePrice',{...d,monthlyGrams:0}),same=planningResult('packagePrice',{...d,newGrams:d.oldGrams,newPrice:d.oldPrice});
 assert.equal(zero.metrics[1][1],0);assert.equal(zero.metrics[2][1],0);assert.ok(zero.charts[3].rows.every(r=>r.values.every(v=>v===0)));
 assert.ok(same.metrics.every(m=>m[1]===0));assert.deepEqual(same.charts[1].series[0].rows,same.charts[1].series[1].rows);
});
test('the matrix independently rounds cumulative quantity into whole packs for each cell',()=>{
 const d=defaults('packagePrice'),r=planningResult('packagePrice'),reference=Math.ceil(d.months*d.monthlyGrams/d.oldGrams)*d.oldPrice;
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const expected=Math.ceil(d.months*d.monthlyGrams/[500,650,750,1000][row])*[4,5,6,7][col]-reference;
  near(r.charts[3].rows[row].values[col],expected);
 }
 for(const row of r.charts[2].rows)assert.ok(row.values.every(v=>v>=0));
 assert.match(r.charts[2].note,/not an extra expense/);
});
test('whole quantity inputs and every boundary produce four finite chart/table pairs',()=>{
 const d=defaults('packagePrice'),fields=definitions.packagePrice.fields;
 for(const key of ['oldGrams','newGrams','monthlyGrams','months'])assert.equal(validInputs('packagePrice',{...d,[key]:d[key]+.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const result=planningResult('packagePrice',input);assert.equal(result.charts.length,4);
  for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
