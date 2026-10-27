import test from 'node:test';
import assert from 'node:assert/strict';
import { oshptgAmount, seniorHomeowner, oshptgRules } from '../src/planning-oshptg-models.js';
import { defaults, planningResult } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('worked cases match an independent 40-digit Decimal check',()=>{
 const d=seniorHomeowner(42000,3600,false);near(d.grant,266.9);near(d.step4,1153.18);near(d.cut,0);near(d.total,1420.08);
 const x=seniorHomeowner(47000,3600,false);near(x.grant,100.4);near(x.oeptc,1053.18);near(d.total-x.total,266.5);
 const s=seniorHomeowner(30000,1000,false);near(s.step4,1007);near(s.cut,217);near(s.oeptc,790);near(s.total,1290);
 const c=seniorHomeowner(55000,4800,true);near(c.grant,167);near(c.oeptc,1158.42);
 near(seniorHomeowner(30000,300,false).cut,300);near(seniorHomeowner(30000,1240,false).cut,1);near(seniorHomeowner(30000,1241,false).cut,.1);near(seniorHomeowner(30000,1242,false).cut,0);
 near(seniorHomeowner(60000,3600,false).oeptc,793.18);near(seniorHomeowner(30000,8000,true).total,1988);
});

test('grant boundaries and Step 5 cap hold across a sweep',()=>{
 assert.equal(oshptgAmount(50000,3600,false),0);assert.equal(oshptgAmount(60000,3600,true),0);
 near(oshptgAmount(49999,3600,false),500-.0333*14999);near(oshptgAmount(35000,3600,false),500);near(oshptgAmount(45000,200,true),200);
 assert.equal(oshptgAmount(20000,0,false),0);
 for(const couple of [false,true])for(let p=0;p<=9000;p+=150){let prev=Infinity;for(let i=0;i<=90000;i+=250){
  const r=seniorHomeowner(i,p,couple);
  assert.ok(r.grant<=Math.min(oshptgRules.max,p)+1e-9&&r.grant>=0);assert.ok(r.oeptc>=-1e-9&&r.oeptc<=r.step4+1e-9);
  if(r.grant>0)assert.ok(r.total<=p+r.energy+1e-9);
  assert.ok(r.total<=prev+1e-9);prev=r.total;
 }}
});

test('result renders five finite charts and the guide is registered',()=>{
 const r=planningResult('oshptgGrant',defaults('oshptgGrant'));
 assert.equal(r.charts.length,5);assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));
 near(r.metrics[7][1],.2533);near(r.charts[3].series[1].rows.at(-1).value,500*165.6/116.5);
 for(const c of r.charts)for(const s of c.series??[])for(const row of s.rows)assert.ok(Number.isFinite(row.value));
 assert.ok(planningGuides.some(g=>g.slug==='ontario-senior-homeowners-property-tax-grant-oeptc-step-5-income'));
});
