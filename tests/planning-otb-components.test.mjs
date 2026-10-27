import test from 'node:test';
import assert from 'node:assert/strict';
import { oeptcGross, otbMaximums, otbParameters, otbPlan } from '../src/planning-otb-components-models.js';
import { defaults, planningResult } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('2026 OTB parameters reproduce the published Ontario maximums',()=>{
 const P=otbParameters;
 assert.equal(oeptcGross(1e6,0,false).gross,1307);assert.equal(oeptcGross(1e6,0,true).gross,1488);
 assert.equal(P.oeptc.nonSenior.base+P.oeptc.nonSenior.cap+P.oeptc.energyMax,1307);assert.equal(P.oeptc.senior.base+P.oeptc.senior.cap+P.oeptc.energyMax,1488);
 assert.equal(P.ostc.perPerson,378);assert.equal(P.noec.single.max,189);assert.equal(P.noec.family.max,290);assert.equal(P.payment.lumpSum,500);
 assert.deepEqual(otbMaximums.map(r=>r[1]),[1488,1307,378,290,290,189,25]);
 // ceilings are first reached at occupancy costs of 9,440 and 5,810 (rent 47,200 and 29,050)
 near(oeptcGross(47200,0,false).gross,1307);assert.ok(oeptcGross(47000,0,false).gross<1307);
 near(oeptcGross(29050,0,true).gross,1488);assert.ok(oeptcGross(29000,0,true).gross<1488);
});

test('default and worked households match an independent 40-digit Decimal check',()=>{
 const p=otbPlan(defaults('otbComponents'));
 near(p.occ,4800);near(p.energy,290);near(p.property,553);near(p.oeptc,723.94);near(p.ostc,139.88);assert.equal(p.noec,0);near(p.total,863.82);
 assert.equal(p.mode,'monthly');near(p.monthly,71.985);near(p.interestGivenUp,9.853809101969505,1e-10);
 const s=otbPlan(defaults('otbComponents'),{otbRent:0,otbPropTax:4200,otbIncome:48000,otbAdults:2,otbSenior:1,otbNorth:1});
 near(s.property,1037);near(s.oeptc,1238.42);near(s.ostc,288.36);near(s.noec,290);near(s.total,1816.78);near(s.interestGivenUp,20.72446030454974,1e-10);
 const f=otbPlan(defaults('otbComponents'),{otbIncome:80000,otbAdults:2,otbKids:2,otbNorth:1});
 assert.equal(f.oeptc,0);assert.equal(f.ostc,0);near(f.noec,143.56);assert.equal(f.mode,'lump');assert.equal(f.interestGivenUp,0);
 near(oeptcGross(12000,0,false).gross,603);near(oeptcGross(12000,0,true).gross,1147);
});

test('payment rules, thresholds and boundary cases',()=>{
 const base=defaults('otbComponents');
 assert.equal(otbPlan(base,{otbRent:0,otbIncome:200000}).total,0);
 const tiny=otbPlan(base,{otbRent:0,otbIncome:29047+376/0.04});near(tiny.raw,2);assert.equal(tiny.total,0);assert.equal(tiny.mode,'none');
 const small=otbPlan(base,{otbRent:0,otbIncome:29047+373/0.04});near(small.raw,5);assert.equal(small.total,10);assert.equal(small.mode,'lump');
 assert.equal(otbPlan(base,{otbRent:0,otbIncome:0}).noec,0);
 assert.equal(otbPlan(base,{otbRent:0,otbIncome:0,otbNorth:1}).noec,0);
 near(otbPlan(base,{otbIncome:0,otbNorth:1}).noec,189);
 near(otbPlan(base,{otbRent:400}).oeptc,40.94);near(oeptcGross(400,0,false).gross,160);
 near(otbPlan(base,{otbSaving:0}).interestGivenUp,0);
 const z=otbPlan(base);near(z.zeroIncome.oeptc,29047+843/0.02);near(z.zeroIncome.ostc,29047+378/0.04);
 // a single parent uses the family thresholds; a senior single uses 36,309 for the OEPTC
 near(otbPlan(base,{otbKids:1}).oeptc,843);near(otbPlan(base,{otbKids:1}).ostc,756);
 near(otbPlan(base,{otbSenior:1}).oeptc,290+617+480);
 for(let k=0;k<300;k++){
  const q=otbPlan(base,{otbRent:(k*7919)%120000,otbPropTax:(k*104729)%30000,otbIncome:(k*15485863)%200000,otbAdults:1+k%2,otbKids:k%5,otbSenior:k%3===0?1:0,otbNorth:k%4===0?1:0,otbSaving:(k%17)/2});
  for(const v of [q.oeptc,q.ostc,q.noec,q.total,q.atJune,q.interestGivenUp])assert.ok(Number.isFinite(v)&&v>=0);
  assert.ok(q.oeptc<=1488&&q.noec<=290);
 }
});

test('guide is registered with four finite charts and existing related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug)),g=planningGuides.find(x=>x.slug==='ontario-trillium-benefit-components-payment-option');
 assert.ok(g);assert.equal(g.planning,'otbComponents');for(const r of g.related)assert.ok(slugs.has(r),r);
 for(const input of [defaults('otbComponents'),{...defaults('otbComponents'),otbNorth:1,otbIncome:90000,otbAdults:2,otbKids:3}]){
  const res=planningResult('otbComponents',input);assert.equal(res.charts.length,4);
  for(const c of res.charts){const vals=c.rows?c.rows.map(r=>r.value):c.series.flatMap(s=>s.rows.map(r=>r.value));assert.ok(vals.length&&vals.every(Number.isFinite),c.id);}
 }
 assert.equal(planningResult('otbComponents',{...defaults('otbComponents'),otbNorth:1}).charts[1].series.length,4);
});
