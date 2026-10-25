import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { inventoryCashCycle } from '../src/planning-inventory-cycle-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('the default annual result and cash funding trough agree with independent batch and overhead sums',()=>{
 const d=defaults('inventoryCycle'),p=inventoryCashCycle(d);near(p.profit,6*(8000-5000)-365*20);near(p.profit,10700);near(p.endingCash,20700);near(p.requiredStartingCash,11180);near(p.extraCash,1180);near(p.interval,45);
 const min=p.rows.reduce((a,b)=>b.cash<a.cash?b:a);assert.equal(min.x,59);near(min.cash,-1180);near(min.cash,10000-2*5000-59*20);
 assert.deepEqual(p.batches[0],{order:0,sale:30,collect:60,pay:15});assert.equal(p.rows.length,366);
});
test('trade balances independently reconcile the operating-result versus net-cash difference on every day',()=>{
 const d=defaults('inventoryCycle');for(const change of [{},{stockDays:0},{buyerDelayDays:0},{supplierDelayDays:60},{batchSale:0},{stockBatches:1},{orderSpacingDays:7}]){
  const p=inventoryCashCycle({...d,...change});for(const row of p.rows){near(row.profit-row.netCash,row.inventory+row.receivables-row.payables);assert.ok(row.inventory>=0&&row.receivables>=0&&row.payables>=0);}
 }
 const s=inventoryCashCycle(d).snapshot;assert.deepEqual([s.inventory,s.receivables,s.payables,s.profit,s.netCash],[5000,8000,5000,2200,-5800]);
});
test('all agreed timing variants close by day 365 and change cash timing without changing fixed-year margin or overhead',()=>{
 const d=defaults('inventoryCycle'),base=inventoryCashCycle(d);
 for(const stockDays of [0,30,60])for(const buyerDelayDays of [0,30,60])for(const supplierDelayDays of [0,15,60]){
  const p=inventoryCashCycle({...d,stockDays,buyerDelayDays,supplierDelayDays});assert.ok(p.batches.every(b=>b.sale<=365&&b.collect<=365&&b.pay<=365));near(p.profit,base.profit);near(p.endingCash,base.endingCash);
  const end=p.rows.at(-1);near(end.inventory,0);near(end.receivables,0);near(end.payables,0);near(end.profit,end.netCash);
 }
});
test('a negative per-batch interval retains the supplier liability and is not free income',()=>{
 const d={...defaults('inventoryCycle'),stockDays:0,buyerDelayDays:0,supplierDelayDays:60},p=inventoryCashCycle(d);near(p.interval,-60);assert.ok(p.rows[0].payables>0);near(p.rows[0].profit-p.rows[0].netCash,-p.rows[0].payables);near(p.rows.at(-1).payables,0);
});
test('the timing interval does not determine the dollar requirement and added starting cash shifts the full ledger only',()=>{
 const d=defaults('inventoryCycle'),a=inventoryCashCycle(d),b=inventoryCashCycle({...d,batchCost:10000});near(a.interval,b.interval);assert.ok(b.requiredStartingCash>a.requiredStartingCash);
 const funded=inventoryCashCycle({...d,cash:a.requiredStartingCash});near(funded.extraCash,0);near(funded.requiredStartingCash,a.requiredStartingCash);near(funded.profit,a.profit);
 for(let t=0;t<=365;t++){near(funded.rows[t].cash-a.rows[t].cash,1180);assert.ok(funded.rows[t].cash>=-1e-8);}
});
test('changing only the snapshot day preserves annual metrics and the other charts',()=>{
 const d=defaults('inventoryCycle'),a=planningResult('inventoryCycle',d),b=planningResult('inventoryCycle',{...d,viewDay:365});assert.deepEqual(a.metrics,b.metrics);for(let i=0;i<4;i++)assert.deepEqual(a.charts[i],b.charts[i]);near(b.charts[4].rows.reduce((n,r)=>n+r.value,0),0);
 const p=inventoryCashCycle(d);near(a.charts[4].rows.reduce((n,r)=>n+r.value,0),p.snapshot.profit-p.snapshot.netCash);near(a.charts[0].rows.reduce((n,r)=>n+r.value,0),p.interval);
});
test('integer event dates and all field limits retain five finite charts and exact source-data tables',()=>{
 const kind='inventoryCycle',d=defaults(kind),variants=[d];for(const key of ['stockBatches','orderSpacingDays','stockDays','buyerDelayDays','supplierDelayDays','viewDay'])assert.equal(validInputs(kind,{...d,[key]:1.5}),false);
 for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs(kind,input),true);const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
});
