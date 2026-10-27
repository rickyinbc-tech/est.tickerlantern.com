import test from 'node:test';
import assert from 'node:assert/strict';
import { fthbGstPlan, fthbGstRules, fthbRelief, fthbNewHousingRebate, fthbLine14, fthbGstTax, fthbMarginal, PBO_FTHB } from '../src/planning-fthb-gst-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);
const net=(p,e=true)=>fthbGstTax(p)-fthbRelief(p,e).total;

test('Excise Tax Act s. 254(2) and (2.1) thresholds',()=>{
 const R=fthbGstRules;assert.equal(R.gst,.05);assert.equal(R.max,50000);assert.equal(R.full,1e6);assert.equal(R.zero,1.5e6);
 assert.equal(R.nhrMax,6300);assert.equal(R.nhrFull,350000);assert.equal(R.nhrZero,450000);assert.equal(R.lookback,5);
 near(fthbNewHousingRebate(300000),5400);near(fthbNewHousingRebate(350000),6300);near(fthbNewHousingRebate(400000),3150);assert.equal(fthbNewHousingRebate(450000),0);
 near(fthbLine14(1e6),50000);near(fthbLine14(1.1e6),40000);near(fthbLine14(1.25e6),25000);assert.equal(fthbLine14(1.5e6),0);
 // The FTHB part is line 14 less the new housing rebate; together they equal line 14.
 const r=fthbRelief(300000);near(r.nhr,5400);near(r.fthb,9600);near(r.total,15000);
});

test('worked cases match an independent 40-digit Decimal check',()=>{
 const d=defaults('fthbGst'),p=fthbGstPlan(d);
 near(p.base.gst,55000);near(p.base.total,40000);near(p.base.net,15000);near(p.base.loan,895000);near(p.base.payment,4512.729218983934,1e-12);
 near(p.up.net,22500);near(p.extraNet,7500);near(p.extraCost,57500);near(p.extraPayment,289.9239442363987,1e-10);
 near(p.notFirst.net,55000);near(p.advantage,40000);
 const add=q=>net(q+50000)-net(q);
 assert.deepEqual([900000,950000,1e6,1.45e6,1.5e6].map(add).map(v=>Math.round(v*100)/100),[0,0,7500,7500,2500]);
 assert.deepEqual([300000,400000,600000,1e6,1.1e6,1.25e6,1.4e6,1.5e6].map(q=>Math.round(net(q,false))),[9600,16850,30000,50000,55000,62500,70000,75000]);
 assert.equal(net(450000),0);near(fthbRelief(450000,false).total,0);
 const notFirst=fthbGstPlan(d,{fgYears:3});assert.equal(notFirst.eligible,false);near(notFirst.base.net,55000);
 assert.equal(fthbGstPlan(d,{fgYears:4}).eligible,false);assert.equal(fthbGstPlan(d,{fgYears:5}).eligible,true);assert.equal(fthbGstPlan(d,{fgStatus:0}).eligible,false);
});

test('marginal rates and monotonic boundary sweep',()=>{
 near(fthbMarginal(1.2e6,true),.15,1e-6);near(fthbMarginal(800000,true),0,1e-6);near(fthbMarginal(1.6e6,true),.05,1e-6);
 near(fthbMarginal(200000,false),.032,1e-6);near(fthbMarginal(400000,false),.113,1e-6);near(fthbMarginal(500000,false),.05,1e-6);
 let prev=-1,prevO=-1;
 for(let q=0;q<=2e6;q+=2500){
  const r=fthbRelief(q,true),o=fthbRelief(q,false);
  assert.ok(r.total<=50000+1e-9&&r.total<=fthbGstTax(q)+1e-9&&r.fthb>=0&&o.total<=r.total+1e-9);
  const n=net(q),m=net(q,false);assert.ok(n>=prev-1e-9&&m>=prevO-1e-9,String(q));prev=n;prevO=m;
 }
});

test('input rules',()=>{
 const d=defaults('fthbGst');assert.ok(validInputs('fthbGst',d));
 assert.equal(validInputs('fthbGst',{...d,fgDown:2e6}),false);
 assert.equal(validInputs('fthbGst',{...d,fgYears:2.5}),false);
 assert.equal(validInputs('fthbGst',{...d,fgStatus:.5}),false);
 assert.ok(validInputs('fthbGst',{...d,fgPrice:0,fgExtra:0,fgDown:0}));
});

test('PBO Table 2 projection',()=>{
 const S=PBO_FTHB.steps;assert.equal(S.length,6);
 for(const r of S)assert.equal(r.slice(1,7).reduce((a,b)=>a+b,0),r[7],r[0]);
 assert.equal(S[5][7],71711);assert.equal(PBO_FTHB.average,26832);
 near(S[5][7]*PBO_FTHB.average,1.924e9,1e-3);
});

test('guide is registered with four finite charts and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),g=planningGuides.find(x=>x.slug==='first-time-home-buyers-gst-rebate-1-million-phase-out-upgrade-cost');
 assert.ok(g);assert.equal(g.planning,'fthbGst');for(const r of g.related)assert.ok(slugs.has(r),r);
 assert.equal(planningGuides.filter(x=>x.planning==='fthbGst').length,1);
 const d=defaults('fthbGst');
 for(const input of [d,{...d,fgYears:0},{...d,fgStatus:0},{...d,fgPrice:0,fgExtra:0,fgDown:0},{...d,fgPrice:2.5e6,fgExtra:5e5},{...d,fgPrice:450000,fgDown:0,fgRate:0},{...d,fgExtra:0}]){
  const res=planningResult('fthbGst',input);assert.equal(res.charts.length,4);
  for(const c of res.charts){const vals=c.rows?c.rows.flatMap(r=>r.values??[r.value]):c.series.flatMap(s=>s.rows.map(r=>r.value));assert.ok(vals.length&&vals.every(Number.isFinite),c.id);}
  for(const [,v] of res.metrics)assert.ok(Number.isFinite(v));
 }
});
