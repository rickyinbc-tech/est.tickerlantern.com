import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {currencyMatchFunding} from '../src/planning-currency-match-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} differs from ${b}`);

test('the default translates both sides and reconciles a 95% funded bill with the two currency shortfalls',()=>{
 const p=currencyMatchFunding(defaults('currencyMatch'));
 assert.equal(p.foreignCash,10000);assert.equal(p.cadCash,13500);assert.equal(p.assetCAD,28500);assert.equal(p.billCAD,30000);
 assert.equal(p.availableFCU,19000);assert.equal(p.gapFCU,-1000);assert.equal(p.gapCAD,-1500);assert.equal(p.ratio,.95);
});
test('every allocation starts with the same resources and converting the remaining CAD reconciles both funding units',()=>{
 const d=defaults('currencyMatch');
 for(const budgetCAD of [0,27000,200000])for(const startingQuote of [.5,1.35,2.5])for(const allocation of [0,25,50,100])for(const quote of [.5,1.5,2.5]){
  const p=currencyMatchFunding({...d,budgetCAD,startingQuote},allocation,quote);
  near(p.foreignCash*startingQuote+p.cadCash,budgetCAD);
  near(p.availableFCU,p.foreignCash+p.cadCash/quote);near(p.gapFCU*quote,p.gapCAD);near(p.assetCAD/p.billCAD,p.ratio);
 }
});
test('full foreign allocation fixes foreign units but cannot repair an initially inadequate budget',()=>{
 const d=defaults('currencyMatch');
 for(const quote of [.5,1,1.5,2.5]){
  const funded=currencyMatchFunding(d,100,quote);assert.equal(funded.availableFCU,20000);assert.equal(funded.ratio,1);assert.equal(funded.gapFCU,0);
  const short=currencyMatchFunding({...d,budgetCAD:24300},100,quote);assert.equal(short.availableFCU,18000);assert.equal(short.ratio,.9);assert.equal(short.gapFCU,-2000);near(short.gapCAD,-2000*quote);
 }
});
test('no initial conversion leaves CAD assets unchanged while their foreign purchasing power varies inversely with the quote',()=>{
 const d=defaults('currencyMatch');
 const low=currencyMatchFunding(d,0,1),high=currencyMatchFunding(d,0,2);
 assert.equal(low.assetCAD,27000);assert.equal(high.assetCAD,27000);assert.equal(low.availableFCU,2*high.availableFCU);
 // A stronger CAD quote can lower the reported foreign asset value while improving this bill's funding.
 const halfLow=currencyMatchFunding(d,50,1),halfHigh=currencyMatchFunding(d,50,2);
 assert.ok(halfLow.assetCAD<halfHigh.assetCAD);assert.ok(halfLow.gapFCU>halfHigh.gapFCU);
});
test('the reference quote produces the same starting funding ratio for all allocations and the bridge includes the bill repricing',()=>{
 const d=defaults('currencyMatch'),r=planningResult('currencyMatch');
 for(const allocation of [0,25,50,100]){const p=currencyMatchFunding(d,allocation,d.startingQuote);near(p.assetCAD,d.budgetCAD);near(p.ratio,1);}
 r.charts[1].rows.forEach((row,i)=>near(row.value,[0,1500,-3000][i]));near(r.charts[1].rows.reduce((a,b)=>a+b.value,0),-1500);
 assert.equal(r.metrics[1][3],'-1,000 FCU');assert.equal(r.charts[2].unit,'percent');
 assert.deepEqual(r.charts[2].xTicks.map(x=>x.label),['0.50','1.50','2.50']);
});
test('continuous and grid scenarios preserve quote units and distinguish allocation from the share of the bill funded',()=>{
 const d=defaults('currencyMatch'),r=planningResult('currencyMatch');
 for(let s=0;s<3;s++)for(const row of r.charts[2].series[s].rows)near(row.value,currencyMatchFunding(d,[0,d.foreignAllocation,100][s],row.x).gapFCU/d.billFCU);
 assert.equal(r.charts[3].columns.length,3);for(let row=0;row<4;row++)for(let col=0;col<3;col++)near(r.charts[3].rows[row].values[col],currencyMatchFunding(d,[0,25,50,100][row],[1,1.5,2][col]).ratio);
 const short=planningResult('currencyMatch',{...d,budgetCAD:24300});assert.ok(short.charts[3].rows[3].values.every(x=>Math.abs(x-.9)<1e-10));
});
test('zero budget and all field boundaries produce four finite graphs and data tables',()=>{
 const d=defaults('currencyMatch'),fields=definitions.currencyMatch.fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const r=planningResult('currencyMatch',input);assert.equal(new Set(r.charts.map(c=>c.id)).size,4);
  for(const width of [300,1000]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
