import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {depositRenewalPath,temporaryPensionYear,temporaryPensionPath,diyTimeLedger} from '../src/planning-renewal-supplement-time-models.js';
import {renewalSupplementTimeGuides} from '../src/planning-renewal-supplement-time-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('renewals use a product of separately purchased terms and return principal only once',()=>{
 const d=defaults('depositRenewal'),p=depositRenewalPath(d);
 near(p.rolling,50000*1.04*1.02**4);near(p.locked,50000*1.035**5);near(p.gap,-3097.842962343748);
 near(p.rows[1].rollingInterest,2000);near(p.rows[1].lockedInterest,1750);near(p.rows[2].rollingInterest,1040);
 near(p.rows.slice(1).reduce((s,r)=>s+r.rollingInterest-r.lockedInterest,0),p.gap);
 near(p.rolling-p.rollingInterest,50000);near(p.locked-p.lockedInterest,50000);
});
test('four later renewal rates solve a common five-year endpoint with explicit empty and negative-rate boundaries',()=>{
 const d=defaults('depositRenewal'),p=depositRenewalPath(d);near(p.breakEven,.033753760533570716);near(depositRenewalPath({...d,renewalRate:p.breakEven*100}).gap,0);
 const equal=depositRenewalPath({...d,firstRate:3,renewalRate:3,lockedRate:3});near(equal.gap,0);
 const zero=depositRenewalPath({...d,firstRate:0,renewalRate:0,lockedRate:0});near(zero.rolling,50000);near(zero.lockedInterest,0);
 assert.equal(depositRenewalPath({...d,capital:0}).breakEven,null);
 const negative=depositRenewalPath({...d,firstRate:8,lockedRate:0,renewalRate:0});assert.ok(negative.breakEven<0);assert.ok(negative.gap>0);
});
test('temporary income ends independently of later income and the boundary bridge reconciles indexed amounts',()=>{
 const d=defaults('temporaryPension'),p=temporaryPensionPath(d),before=p.before,after=p.boundary;
 near(before.total,38967.55776);near(before.temporary,12989.18592);near(after.total,26497.9392768);near(after.temporary,0);near(after.later,0);near(after.gap,13248.9696384);
 near(before.total+(after.lifetime-before.lifetime)+(after.temporary-before.temporary)+(after.later-before.later),after.total);
 near(p.largestGap,13513.949031168);near(p.annualGapSum,172308.04528740112);
 assert.equal(p.rows[0].x,60);assert.equal(p.rows.at(-1).x,90);assert.equal(p.rows.length,31);
});
test('later benefits are independent cash inputs rather than an automatic replacement of the lost supplement',()=>{
 const d=defaults('temporaryPension'),same=temporaryPensionYear({...d,laterStart:65},65),later=temporaryPensionYear({...d,laterStart:72},65);
 near(same.later,9000);near(same.total,35497.9392768);near(later.temporary,0);near(later.later,0);near(later.total,26497.9392768);
 near(temporaryPensionYear({...d,startAge:64,laterStart:60},64).later,9000*1.02**4);
 const flat=temporaryPensionPath({...d,incomeGrowth:0,inflation:0});near(flat.annualGapSum,2*12000+24*3000);near(flat.largestGap,12000);
});
test('DIY charges only actually lost paid work and keeps the subjective time value outside the cash bridge',()=>{
 const d=defaults('diyTime'),p=diyTimeLedger(d);near(p.workHours,20);near(p.leisureHours,30);near(p.lostPay,600);near(p.diyCash,2100);near(p.cashSaving,900);
 near(p.diyTimeValue,1200);near(p.hiredTimeValue,200);near(p.diyCombined,3300);near(p.hiredCombined,3200);near(p.combinedSaving,-100);near(p.hoursExtra,45);
 near(diyTimeLedger({...d,timeValue:36}).combinedSaving,0);
 const free=diyTimeLedger({...d,timeValue:0});near(free.cashSaving,p.cashSaving);near(free.combinedSaving,p.cashSaving);
});
test('a weekend wage equivalent does not create earnings forgone when no paid work is displaced',()=>{
 const d=defaults('diyTime'),none=diyTimeLedger({...d,paidShare:0,netHourly:200});near(none.lostPay,0);near(none.cashSaving,1500);
 const all=diyTimeLedger({...d,paidShare:100});near(all.lostPay,1500);near(all.leisureHours,0);near(all.diyTimeValue,0);
 near(all.workHours+all.leisureHours,d.hours);near(all.diyCash,d.materials+d.tools+all.lostPay);
});
test('age inputs require whole periods and guide text retains source scope and valid related links',()=>{
 for(const key of ['startAge','bridgeEnd','laterStart'])assert.equal(validInputs('temporaryPension',{...defaults('temporaryPension'),[key]:defaults('temporaryPension')[key]+.5}),false);
 for(const g of renewalSupplementTimeGuides){assert.equal(g.sections.length,6);assert.ok(g.chartScope);assert.ok(g.sections.map(s=>s.html.replace(/<[^>]+>/g,' ')).join(' ').split(/\s+/).length>=800);for(const related of g.related)assert.ok(planningGuides.some(x=>x.slug===related));}
});
test('renewal, supplement and time-value figures retain finite values and tables at supported edges',()=>{
 const finite=x=>{if(typeof x==='number')assert.ok(Number.isFinite(x));else if(Array.isArray(x))x.forEach(finite);else if(x&&typeof x==='object')Object.values(x).forEach(finite);};
 for(const kind of ['depositRenewal','temporaryPension','diyTime']){
  const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
});
