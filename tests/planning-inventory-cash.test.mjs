import test from 'node:test';
import assert from 'node:assert/strict';
import {inventoryCashLedger} from '../src/planning-inventory-cash-models.js';
import {inventoryCashGuides} from '../src/planning-inventory-cash-guides.js';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);

test('cash inventory, a half-batch sale and owner transfer keep profit distinct from requested cash',()=>{
 const d=defaults('inventoryCash'),p=inventoryCashLedger(d);
 assert.equal(p.costSold,6000);assert.equal(p.profit,12000);assert.equal(p.beforeDrawCash,6000);assert.equal(p.fundingNeed,6000);assert.equal(p.endingCash,14000);assert.equal(p.endingInventory,6000);
 assert.equal(p.monthly[1].cash,8000);assert.equal(p.monthly[1].stock,12000);assert.equal(p.monthly[1].profit,0);
 assert.equal(p.monthly[2].receivable,20000);assert.equal(p.monthly[2].cash,-6000);assert.equal(p.monthly[2].stock,6000);
 assert.equal(p.monthly[3].receivable,0);assert.equal(p.monthly[3].profit,p.monthly[2].profit);
});
test('an intermediate event deficit is retained even when collection makes the same month-end cash positive',()=>{
 const d={...defaults('inventoryCash'),inventoryOpening:5000,inventoryOwnerDraw:0,inventoryCollectMonth:2},p=inventoryCashLedger(d);
 assert.equal(p.events.find(r=>r.label.includes('buy inventory')).cash,-7000);assert.equal(p.events.find(r=>r.label.includes('pay operating cost')).cash,-9000);
 assert.equal(p.monthly[2].cash,11000);assert.equal(p.fundingNeed,9000);assert.ok(p.events.every(r=>r.fundedCash>=0));
 const order=p.events.filter(r=>r.month===2).map(r=>r.label);assert.ok(order[0].includes('operating cost'));assert.ok(order[1].includes('collect'));assert.ok(order[2].includes('owner withdrawal'));
});
test('moving the draw after collection changes cash timing while preserving profit and horizon cash',()=>{
 const d=defaults('inventoryCash'),a=inventoryCashLedger(d),b=inventoryCashLedger({...d,inventoryDrawMonth:3});
 assert.equal(b.fundingNeed,0);assert.equal(b.beforeDrawCash,26000);assert.equal(a.profit,b.profit);assert.equal(a.endingCash,b.endingCash);
 const early=inventoryCashLedger({...d,inventoryCollectMonth:2});assert.equal(early.fundingNeed,0);assert.equal(early.beforeDrawCash,26000);
});
test('funded assets reconcile to initial owner capital plus operating profit less owner transfers at every checkpoint',()=>{
 const d=defaults('inventoryCash');
 for(const collection of [2,3,6])for(const draw of [1,2,6])for(const invoice of [0,10000,20000]){
  const input={...d,inventoryCollectMonth:collection,inventoryDrawMonth:draw,inventoryInvoice:invoice},p=inventoryCashLedger(input);
  for(const r of [...p.events,...p.monthly]){near(r.fundedCash+r.stock+r.receivable,r.fundedEquity);near(r.fundedEquity,input.inventoryOpening+p.fundingNeed+r.profit-r.drawn);assert.ok(r.fundedCash>=0);}
  near(p.endingCash,input.inventoryOpening-input.inventoryBatch-input.inventoryOperating+invoice-input.inventoryOwnerDraw);
 }
 const r=planningResult('inventoryCash',d);near(r.charts[3].rows.reduce((s,row)=>s+row.value,0),-6000);assert.deepEqual(r.charts[4].rows[1].values,[6000,6000,0,0]);
});
test('owner transfers do not reduce operating profit and zero business amounts remain finite',()=>{
 const d=defaults('inventoryCash'),p=inventoryCashLedger({...d,inventoryOwnerDraw:100000});assert.equal(p.profit,12000);assert.equal(p.fundingNeed,94000);
 const zero=inventoryCashLedger({...d,inventoryOpening:0,inventoryBatch:0,inventoryInvoice:0,inventoryOperating:0,inventoryOwnerDraw:0});assert.equal(zero.profit,0);assert.equal(zero.fundingNeed,0);assert.equal(zero.endingCash,0);
 for(const key of ['inventoryCollectMonth','inventoryDrawMonth'])assert.equal(validInputs('inventoryCash',{...d,[key]:d[key]+.5}),false);
});
test('inventory guide retains source boundaries, detailed English prose and valid related paths',()=>{
 const g=inventoryCashGuides[0],prose=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,6);assert.ok(prose.replace(/<[^>]*>/g,' ').split(/\s+/).length>=900);
 assert.match(prose,/not an approved overdraft/);assert.match(prose,/not treat the contribution as a new sale/);assert.match(prose,/minimum across ordered events/);
 for(const slug of g.related)assert.ok(planningGuides.some(x=>x.slug===slug),slug);
});
test('inventory and event-order extremes render five finite charts and accessible cash tables',()=>{
 const kind='inventoryCash',d=defaults(kind),fields=definitions[kind].fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs)for(const width of [300,760]){const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
});
