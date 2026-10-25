import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { leaseDistanceCost } from '../src/planning-lease-distance-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('term totals separate the two allowances, actual kilometres, monthly premium and final excess charges',()=>{
 const d=defaults('leaseDistance'),p=leaseDistanceCost(d);assert.equal(p.months,36);assert.equal(p.distance,60000);assert.equal(p.capA,48000);assert.equal(p.capB,72000);assert.equal(p.excessA,12000);assert.equal(p.excessB,0);near(p.chargeA,2400);near(p.chargeB,0);near(p.extraPayments,900);near(p.costA,2400);near(p.costB,900);near(p.difference,-1500);
});
test('the default piecewise costs have two verified equalities and reverse preference above the second',()=>{
 const d=defaults('leaseDistance');for(const annualDrive of [17500,37000])near(leaseDistanceCost(d,annualDrive).difference,0);
 assert.ok(leaseDistanceCost(d,12000).difference>0);assert.ok(leaseDistanceCost(d,20000).difference<0);assert.ok(leaseDistanceCost(d,30000).difference<0);near(leaseDistanceCost(d,40000).difference,900);
 const equalRate={...d,rateB:.2};near(leaseDistanceCost(equalRate,40000).difference,-3900);near(leaseDistanceCost(equalRate,60000).difference,-3900);
});
test('charges use one full-term allowance, with no annual resetting or unused-distance credit',()=>{
 const d=defaults('leaseDistance');for(const annualDrive of [0,12000,16000,20000,24000,40000]){
  const p=leaseDistanceCost(d,annualDrive);near(p.chargeA,Math.max(0,3*annualDrive-48000)*.2);near(p.chargeB,Math.max(0,3*annualDrive-72000)*.3);assert.ok(p.chargeA>=0&&p.chargeB>=0);
 }
 const low=leaseDistanceCost(d,0);near(low.costA,0);near(low.costB,900);
 near(leaseDistanceCost({...d,years:5}).costA,4000);near(leaseDistanceCost({...d,years:5}).costB,1500);
});
test('both exact allowance breakpoints are retained and curves reconcile the selected state',()=>{
 const d=defaults('leaseDistance'),r=planningResult('leaseDistance',d),curves=r.charts[0].series;
 for(const series of curves){assert.ok(series.rows.some(row=>row.x===16000));assert.ok(series.rows.some(row=>row.x===24000));assert.ok(series.rows.some(row=>row.x===20000));}
 for(const annualDrive of [15000,16000,17000,24000,25000,60000]){near(curves[0].rows.find(r=>r.x===annualDrive).value,leaseDistanceCost(d,annualDrive).costA);near(curves[1].rows.find(r=>r.x===annualDrive).value,leaseDistanceCost(d,annualDrive).costB);}
 for(const row of r.charts[1].series[0].rows)near(row.value,leaseDistanceCost(d,row.x).difference);
 const selected=r.charts[2].rows;near(selected[0].values.reduce((a,b)=>a+b,0),2400);near(selected[1].values.reduce((a,b)=>a+b,0),900);
});
test('the monthly calendar counts the final extra payment and both final charges once',()=>{
 const d={...defaults('leaseDistance'),annualDrive:40000},p=leaseDistanceCost(d),r=planningResult('leaseDistance',d),[a,b]=r.charts[3].series;
 near(a.rows.at(-1).value,p.costA);near(b.rows.at(-1).value,p.costB);near(a.rows.at(-2).value,0);near(b.rows.at(-2).value,35*25);near(b.rows.at(-1).value-b.rows.at(-2).value,25+p.chargeB);
});
test('zero excess rates leave only the monthly premium and identical allowances with identical rates cancel',()=>{
 const d=defaults('leaseDistance'),zero=leaseDistanceCost({...d,rateA:0,rateB:0},60000);near(zero.costA,0);near(zero.costB,900);
 for(const annualDrive of [0,20000,60000])near(leaseDistanceCost({...d,allowanceB:d.allowanceA,rateB:d.rateA},annualDrive).difference,900);
 const noPremium=leaseDistanceCost({...d,extraMonthly:0},0);near(noPremium.difference,0);
});
test('full-term integer validation and all input limits retain finite five-chart results',()=>{
 const kind='leaseDistance',d=defaults(kind),variants=[d];assert.equal(validInputs(kind,{...d,years:2.5}),false);
 for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs(kind,input),true);const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}
});
