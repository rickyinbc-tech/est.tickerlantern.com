import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { collateralAdjustment } from '../src/planning-collateral-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('the default retains positive equity while breaching the fictional ratio and distinguishes three response amounts',()=>{
 const p=collateralAdjustment(defaults('collateralTest'));near(p.value,70000);near(p.equity,20000);near(p.ratio,5/7);near(p.paydown,8000);near(p.addition,40000/3);near(p.internalSale,20000);near(p.minimumValue,250000/3);near(p.initialSlackLoss,1/6);
 assert.ok(p.equity>0&&p.ratio>p.cap);
});
test('each mathematical response meets the same covenant through its own changed balances',()=>{
 const d=defaults('collateralTest');
 for(const decline of [0,15,30,45,60,80])for(const ltvLimit of [20,40,60,90]){
  const p=collateralAdjustment(d,decline,ltvLimit);assert.ok((p.debt-p.paydown)/p.value<=p.cap+1e-12);assert.ok(p.debt/(p.value+p.addition)<=p.cap+1e-12);
  if(p.paydown>0){near((p.debt-p.paydown)/p.value,p.cap);near(p.debt/(p.value+p.addition),p.cap);}
  if(p.internalSale!=null&&p.internalSale>0){assert.ok(p.internalSale<p.value);near((p.debt-p.internalSale)/(p.value-p.internalSale),p.cap);near((p.value-p.internalSale)-(p.debt-p.internalSale),p.equity);}
 }
});
test('a higher fictional limit changes the adjustment but not asset value, debt or equity',()=>{
 const d=defaults('collateralTest'),a=collateralAdjustment(d),b=collateralAdjustment({...d,ltvLimit:80});near(a.value,b.value);near(a.equity,b.equity);near(a.debt,b.debt);near(b.paydown,0);near(b.addition,0);
 assert.deepEqual(planningResult('collateralTest',d).charts[1],planningResult('collateralTest',{...d,ltvLimit:80}).charts[1]);
});
test('outside resources are transfers and partial sales preserve equity before costs',()=>{
 const p=collateralAdjustment(defaults('collateralTest')),outside=20000;
 near(p.value-(p.debt-p.paydown)+outside-p.paydown,p.equity+outside);
 near((p.value+p.addition)-p.debt+outside-p.addition,p.equity+outside);
 near((p.value-p.internalSale)-(p.debt-p.internalSale),p.equity);
});
test('equal or excess debt has no partial-sale active-loan solution and reports full-sale debt separately',()=>{
 const d=defaults('collateralTest'),equal=collateralAdjustment({...d,collateral:50000,loan:50000,decline:0}),excess=collateralAdjustment({...d,loan:100000});
 assert.equal(equal.internalSale,null);near(equal.fullSaleDebtLeft,0);assert.equal(excess.internalSale,null);near(excess.fullSaleDebtLeft,30000);
 assert.match(planningResult('collateralTest',{...d,collateral:50000,loan:50000,decline:0}).note,/close both positions/);
 assert.match(planningResult('collateralTest',{...d,loan:100000}).note,/still leave CAD 30,000/);
});
test('zero debt and the exact fictional limit need no adjustment',()=>{
 const d=defaults('collateralTest');for(const input of [{...d,loan:0},{...d,decline:0,loan:60000}]){const p=collateralAdjustment(input);near(p.paydown,0);near(p.addition,0);near(p.internalSale,0);}
 const r=planningResult('collateralTest',d),p=collateralAdjustment(d);near(r.charts[1].rows.reduce((n,row)=>n+row.value,0),p.equity);
 const selected=r.charts[2].rows.find(row=>row.label==='30% collateral decline');near(selected.values[0],p.paydown);near(selected.values[1],p.addition);
});
test('all field bounds retain finite signed values and four accessible charts without implying a probability',()=>{
 const kind='collateralTest',d=defaults(kind),variants=[d];for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs(kind,input),true);const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/not a probability/);}
});
