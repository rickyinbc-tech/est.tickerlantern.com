import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {tfsaLossCase} from '../src/planning-tfsa-loss-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} differs from ${b}`);

test('a market loss changes value while an ordinary withdrawal supplies its actual next-year addback',()=>{
 const p=tfsaLossCase(defaults('tfsaLoss'));
 assert.equal(p.value,8000);assert.equal(p.change,-2000);assert.equal(p.withdrawal,8000);assert.equal(p.remaining,0);assert.equal(p.currentRoom,0);assert.equal(p.nextSubtotal,8000);assert.equal(p.addbackDifference,-2000);
});
test('without a withdrawal, no market move creates any withdrawal-based addback',()=>{
 const d=defaults('tfsaLoss');
 for(const marketChange of [-80,-20,0,20,80]){
  const p=tfsaLossCase({...d,marketChange,withdrawShare:0,roomAfterContribution:3000});
  assert.equal(p.withdrawal,0);assert.equal(p.currentRoom,3000);assert.equal(p.nextSubtotal,3000);
 }
});
test('withdrawing relocates value without adding room to financial resources',()=>{
 const d=defaults('tfsaLoss');
 for(const share of [0,25,50,75,100]){
  const input={...d,withdrawShare:share},p=tfsaLossCase(input),r=planningResult('tfsaLoss',input);
  near(p.remaining+p.withdrawal,p.value);assert.ok(p.remaining>=0);
  for(const row of r.charts[1].rows)near(row.values.reduce((sum,value)=>sum+value,0),8000);
 }
 const zero=planningResult('tfsaLoss',{...d,original:0,roomAfterContribution:100000});
 assert.ok(zero.charts[1].rows.every(r=>r.values.every(v=>v===0)));assert.equal(zero.charts[2].rows[3].value,100000);
});
test('partial withdrawals and gains use actual withdrawal amounts rather than the original contribution',()=>{
 const d=defaults('tfsaLoss'),partial=tfsaLossCase({...d,withdrawShare:50}),gain=tfsaLossCase({...d,marketChange:20});
 assert.equal(partial.withdrawal,4000);assert.equal(partial.remaining,4000);assert.equal(partial.nextSubtotal,4000);
 assert.equal(gain.value,12000);assert.equal(gain.currentRoom,0);assert.equal(gain.nextSubtotal,12000);assert.equal(gain.addbackDifference,2000);
});
test('unused room changes only its separate record and the following-year subtotal excludes a new annual limit',()=>{
 const d=defaults('tfsaLoss'),base=planningResult('tfsaLoss'),edited=planningResult('tfsaLoss',{...d,roomAfterContribution:3000});
 assert.deepEqual(edited.metrics,base.metrics);assert.deepEqual(edited.charts[0],base.charts[0]);assert.deepEqual(edited.charts[1],base.charts[1]);
 assert.deepEqual(edited.charts[2].rows.map(r=>r.value),[3000,3000,3000,11000]);assert.match(edited.charts[2].unitLabel,/new annual dollar limit deliberately excluded/);
});
test('the addback grid uses each assumed market value times the share actually withdrawn',()=>{
 const d=defaults('tfsaLoss'),r=planningResult('tfsaLoss');
 for(let row=0;row<4;row++)for(let col=0;col<4;col++)near(r.charts[3].rows[row].values[col],d.original*(1+[-40,-20,0,20][row]/100)*[.25,.5,.75,1][col]);
});
test('all allowed boundaries preserve non-negative account resources and render four finite chart/table pairs',()=>{
 const d=defaults('tfsaLoss'),fields=definitions.tfsaLoss.fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const p=tfsaLossCase(input);assert.ok(p.value>=0&&p.withdrawal>=0&&p.remaining>=0);near(p.remaining+p.withdrawal,p.value);
  const result=planningResult('tfsaLoss',input);assert.equal(result.charts.length,4);
  for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
