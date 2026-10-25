import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, validInputs, planningResult } from '../src/planning-models.js';
import { vacationCommitmentCost } from '../src/planning-vacation-commitment-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const geometric=(first,growth,n)=>growth===0?first*n:first*((1+growth)**n-1)/growth;
const growingPV=(first,growth,discount,n)=>{
  const q=(1+growth)/(1+discount);
  return first/(1+discount)*(Math.abs(q-1)<1e-12?n:(q**n-1)/(q-1));
};

test('window costs match independent geometric sums and the complete cash reconciliation',()=>{
  const d=defaults('timeshareCost'),p=vacationCommitmentCost(d);
  near(p.duesTotal,geometric(1300,.04,15));near(p.rental,geometric(7*250,.03,15));
  near(p.bookingTotal,1500);near(p.assessmentTotal,5000);near(p.nights,105);
  near(p.owner,30000+p.duesTotal+1500+5000);near(p.owner,62530.66392897477);near(p.rental,32548.099301711263);near(p.perNight,595.5301326569025);
  near(p.rows[0].owner,d.upfront);near(p.rows[0].rental,0);near(p.rows.at(-1).owner,p.owner);
});
test('present values match an independent growing-annuity equation including the equal-growth boundary',()=>{
  const d=defaults('timeshareCost');
  for(const discount of [0,3,4,12]) {
    const i={...d,discount},p=vacationCommitmentCost(i),r=discount/100;
    const expected=d.upfront+growingPV(d.dues,.04,r,15)+growingPV(d.bookingFee,0,r,15)+5000/(1+r)**8;
    near(p.ownerPV,expected);near(p.rentalPV,growingPV(7*250,.03,r,15));
    assert.ok(p.ownerPV<=p.owner+1e-7);assert.ok(p.rentalPV<=p.rental+1e-7);
  }
  const p=vacationCommitmentCost(d);near(p.ownerPV,55415.263407745515);near(p.rentalPV,15*1750/1.03);
});
test('unused nights remove the entered booking charge but retain dues and the hypothetical assessment',()=>{
  const d=defaults('timeshareCost'),p=vacationCommitmentCost({...d,usedNights:0});
  assert.equal(p.perNight,null);near(p.nights,0);near(p.rental,0);near(p.rentalPV,0);near(p.bookingTotal,0);
  near(p.owner,d.upfront+p.duesTotal+d.assessment);assert.ok(p.owner>0);
  const r=planningResult('timeshareCost',{...d,usedNights:0});assert.equal(r.metrics[2][3],'No nights used');
  assert.doesNotMatch(renderResult(r,300),/NaN|Infinity|undefined/);
});
test('an assessment enters only its selected year inside the reporting window',()=>{
  const d=defaults('timeshareCost');
  for(const assessmentYear of [1,8,15,16,30]) {
    const p=vacationCommitmentCost({...d,assessmentYear});near(p.assessmentTotal,assessmentYear<=15?5000:0);
    const events=p.annual.filter(r=>r.assessment>0);assert.equal(events.length,assessmentYear<=15?1:0);
    if(events.length)assert.equal(events[0].year,assessmentYear);
  }
  const inside=vacationCommitmentCost({...d,years:16,assessmentYear:16}),outside=vacationCommitmentCost({...d,years:15,assessmentYear:16});
  near(inside.assessmentTotal-outside.assessmentTotal,5000);
});
test('positive usage changes per-night cost and rental consumption without inventing unused-rights revenue',()=>{
  const d=defaults('timeshareCost'),a=vacationCommitmentCost(d),b=vacationCommitmentCost({...d,usedNights:14});
  near(a.owner,b.owner);near(a.ownerPV,b.ownerPV);near(b.perNight,a.perNight/2);near(b.rental,2*a.rental);
  near(b.nights,2*a.nights);
});
test('zero growth and discount remain explicit flat-cost cases',()=>{
  const d={...defaults('timeshareCost'),duesGrowth:0,rentalGrowth:0,discount:0,assessment:0},p=vacationCommitmentCost(d);
  near(p.duesTotal,d.dues*d.years);near(p.rental,d.usedNights*d.nightRate*d.years);near(p.ownerPV,p.owner);near(p.rentalPV,p.rental);
});
test('annual comparison retains the assessment year and the waterfall and matrix reconcile the same window',()=>{
  const d=defaults('timeshareCost'),p=vacationCommitmentCost(d),r=planningResult('timeshareCost',d);
  assert.ok(r.charts[1].rows.some(row=>row.label==='Year 8 · assessment included'));
  near(r.charts[2].rows.reduce((n,row)=>n+row.value,0),p.owner);
  near(r.charts[3].rows[1].values[2],p.perNight);
  near(r.charts[4].rows[0].values[0],p.owner);near(r.charts[4].rows[1].values[0],p.ownerPV);
});
test('integer dates and nights are enforced and all input boundaries render five finite figures with data tables',()=>{
  const kind='timeshareCost',d=defaults(kind),variants=[d];
  for(const key of ['usedNights','assessmentYear','years'])assert.equal(validInputs(kind,{...d,[key]:1.5}),false);
  for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
  for(const input of variants){assert.equal(validInputs(kind,input),true);const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
});
