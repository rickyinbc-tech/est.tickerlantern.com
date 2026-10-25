import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {tieredSavingsPlan} from '../src/planning-tiered-savings-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);

test('the default interest slices reconcile the blended rate and the same-balance flat comparison',()=>{
 const p=tieredSavingsPlan(defaults('tieredSavings'));
 assert.deepEqual(p.slices.map(s=>s.principal),[5000,5000,5000]);assert.deepEqual(p.slices.map(s=>s.interest),[50,150,250]);
 assert.equal(p.interest,450);assert.equal(p.blended,.03);assert.equal(p.flatInterest,525);assert.equal(p.difference,-75);assert.equal(p.allAtTop,750);
});
test('independent dollar-by-dollar interest matches the marginal balance slices',()=>{
 for(const balance of [1000,4999,5000,5001,9999,10000,10001,15000,100000])for(const topRate of [3,5,8]){
  let interest=0;for(let dollar=1;dollar<=balance;dollar++)interest+=dollar<=5000?.01:dollar<=10000?.03:topRate/100;
  const p=tieredSavingsPlan({...defaults('tieredSavings'),balance,topRate});near(p.interest,interest,1e-6);near(p.slices.reduce((a,b)=>a+b.principal,0),balance);
 }
});
test('crossing a threshold changes only the rate on incremental dollars and leaves interest continuous',()=>{
 const d=defaults('tieredSavings'),interest=balance=>tieredSavingsPlan({...d,balance}).interest;
 near(interest(5001)-interest(5000),.03);near(interest(10001)-interest(10000),.05);
 near(interest(5000.01)-interest(5000),.0003);near(interest(10000.01)-interest(10000),.0005);
 assert.equal(interest(10000),200);assert.equal(interest(25000),950);
});
test('the headline bridge, slice bars and comparison matrix all reproduce annual cash interest',()=>{
 const d=defaults('tieredSavings'),p=tieredSavingsPlan(d),r=planningResult('tieredSavings');
 near(r.charts[0].rows.reduce((a,b)=>a+b.value,0),p.interest);near(r.charts[1].rows.reduce((a,b)=>a+b.value,0),p.interest);
 assert.equal(r.charts[3].signed,true);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++)near(r.charts[3].rows[row].values[col],tieredSavingsPlan({...d,balance:[5000,10000,15000,25000][row],flatRate:[2,3,4,5][col]}).difference);
});
test('the fixed-range blended curve changes with the rate table rather than the selected balance',()=>{
 const d=defaults('tieredSavings'),a=planningResult('tieredSavings'),b=planningResult('tieredSavings',{...d,balance:100000});
 assert.deepEqual(a.charts[2],b.charts[2]);
 for(const row of a.charts[2].series[0].rows){const p=tieredSavingsPlan({...d,balance:row.x*1000});near(row.value,p.interest/(row.x*1000));assert.ok(row.value<d.topRate/100);}
 const noTop=tieredSavingsPlan({...d,balance:5000,topRate:8});assert.equal(noTop.interest,50);assert.equal(noTop.blended,.01);
});
test('all input boundaries render four finite charts and data tables without an empty-balance denominator',()=>{
 const d=defaults('tieredSavings'),fields=definitions.tieredSavings.fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const r=planningResult('tieredSavings',input);assert.equal(new Set(r.charts.map(c=>c.id)).size,4);
  for(const width of [300,1000]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
