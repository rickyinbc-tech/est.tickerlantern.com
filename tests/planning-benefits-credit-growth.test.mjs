import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {benefitCapCalendar,creditSnapshotCalendar,pairedCompoundRate,pairedReturnPath} from '../src/planning-benefits-credit-growth-models.js';
import {benefitsCreditGrowthGuides} from '../src/planning-benefits-credit-growth-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult,renderFigure} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);

test('each benefit year applies deductible, coverage and insurer-dollar cap in the correct order',()=>{
  const d=defaults('annualBenefitCap'),p=benefitCapCalendar(d);
  assert.deepEqual(p.claims.slice(0,7).map(r=>r.allowed),[160,320,320,320,320,60,0]);near(p.claims[12].allowed,160);
  for(const r of p.years){near(r.billed,4800);near(r.benefit,1500);near(r.household,3300);near(r.deductibleUsed,200);}
  near(p.netCost,6600);near(p.required,1000);near(p.extra,0);near(p.ending,1400);
});
test('annual benefit totals match an independent aggregate formula across expense and limit boundaries',()=>{
  const d=defaults('annualBenefitCap');
  for(const eligibleMonthly of [0,400,3000])for(const annualDeductible of [0,200,3000])for(const coverage of [0,80,100])for(const annualMaximum of [0,1500,10000]){
    const input={...d,eligibleMonthly,annualDeductible,coverage,annualMaximum},p=benefitCapCalendar(input),expected=Math.min(annualMaximum,Math.max(0,eligibleMonthly*12-annualDeductible)*coverage/100);
    near(p.totalBenefits,expected*2);near(p.received,p.totalBenefits);near(p.netCost,24*eligibleMonthly-2*expected);
    near(p.ending,d.startingCash+24*d.monthlyAllocation-p.netCost);
  }
});
test('benefit entitlement stays with service year while delayed cash can arrive after all service bills end',()=>{
  const d=defaults('annualBenefitCap'),input={...d,annualDeductible:0,coverage:100,annualMaximum:10000,monthlyAllocation:0,startingCash:0},p=benefitCapCalendar(input);
  near(p.totalBenefits,9600);near(p.afterServiceReceipts,800);near(p.required,1200);near(p.rows[24].after,-800);near(p.ending,0);
  assert.ok(p.rows.slice(25).every(r=>r.bill===0&&r.allocation===0));near(p.rows[25].receipt,400);near(p.rows[26].receipt,400);
  near(benefitCapCalendar({...input,receiptLag:0}).required,400);
  let previous=0;for(let receiptLag=0;receiptLag<=6;receiptLag++){const q=benefitCapCalendar({...input,receiptLag});assert.ok(q.required>=previous);previous=q.required;near(q.netCost,0);}
});
test('credit snapshot ratios match a closed-form posted-payment calendar with a capped payment',()=>{
  const d=defaults('creditSnapshot');
  for(const paymentDay of [1,15,30])for(const reportDay of [1,15,30])for(const payment of [0,1000,30000]){
    const input={...d,paymentDay,reportDay,payment},p=creditSnapshotCalendar(input),paid=Math.min(d.openingBalance+d.dailyPurchase*paymentDay,payment);
    const reported=d.openingBalance+d.dailyPurchase*reportDay-(reportDay>=paymentDay?paid:0);
    near(p.paid,paid);near(p.reported,reported);near(p.ending,d.openingBalance+30*d.dailyPurchase-paid);near(p.reportedShare,reported/d.creditLimit);
  }
});
test('combined utilization uses combined dollars and limits rather than averaging ratios',()=>{
  const d=defaults('creditSnapshot'),p=creditSnapshotCalendar(d);near(p.reported,1500);near(p.reportedShare,.3);near(p.combinedShare,2500/15000);near(p.ending,2000);
  assert.notEqual(p.combinedShare,(.3+.1)/2);
  const before=creditSnapshotCalendar({...d,reportDay:14}),same=creditSnapshotCalendar({...d,reportDay:15});near(before.reported,2200);near(same.reported,1250);
});
test('paired compounding matches factor products, with order changing interim values but not complete-pair endpoints',()=>{
  const d=defaults('pairedReturns');
  for(const mean of [-5,0,5,10])for(const spread of [0,20,50])for(const cycles of [1,10,15]){
    const input={...d,mean,spread,cycles},p=pairedReturnPath(input),r=pairedReturnPath(input,true),pair=(1+(mean+spread)/100)*(1+(mean-spread)/100);
    near(p.alternating,d.initial*pair**cycles);near(p.smooth,d.initial*(1+mean/100)**(2*cycles));near(p.alternating,r.alternating);near((1+p.compound)**(2*cycles),pair**cycles);
    if(spread>0)assert.notEqual(p.rows[1].alternating,r.rows[1].alternating);
  }
  const two=pairedReturnPath({...d,cycles:1});near(two.alternating,10625);near(two.smooth,11025);near(two.compound,Math.sqrt(1.0625)-1);
});
test('zero capital and zero return spread retain a defined growth convention without division by zero',()=>{
  const d=defaults('pairedReturns'),zero=pairedReturnPath({...d,initial:0});near(zero.alternating,0);near(zero.smooth,0);near(zero.compound,pairedCompoundRate(5,20));
  const smooth=pairedReturnPath({...d,spread:0});near(smooth.alternating,smooth.smooth);near(smooth.compound,.05);
});
test('signed bars draw negative values left of zero and keep all rectangles within the viewport',()=>{
  for(const width of [300,760]){
    const spec=planningResult('pairedReturns').charts[0],html=renderFigure(spec,width),rects=[...html.matchAll(/<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g)].map(m=>({x:+m[1],width:+m[3]}));
    assert.equal(rects.length,3);assert.ok(rects.every(r=>r.width>=0&&r.x>=0&&r.x+r.width<=width));
    near(rects[0].x,rects[1].x+rects[1].width);assert.ok(rects[1].x<rects[0].x);assert.match(html,/-15\.00%/);assert.match(html,/explicit zero axis/);
  }
});
test('calendar and paired-horizon inputs reject fractional days, months and pair counts',()=>{
  for(const [kind,key] of [['annualBenefitCap','receiptLag'],['creditSnapshot','paymentDay'],['creditSnapshot','reportDay'],['pairedReturns','cycles']])assert.equal(validInputs(kind,{...defaults(kind),[key]:defaults(kind)[key]+.5}),false);
});
test('all three new guides have resolved links and four accessible finite graphics across field boundaries',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug)),finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
  for(const guide of benefitsCreditGrowthGuides){assert.equal(guide.sections.length,6);assert.ok(guide.related.every(slug=>slugs.has(slug)));assert.ok(guide.sections.map(s=>s.html).join(' ').replace(/<[^>]*>/g,' ').split(/\s+/).length>800);
    const kind=guide.planning,d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
    for(const input of inputs){const result=planningResult(kind,input);finite(result);assert.equal(result.charts.length,4);for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
  }
});
