import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, validInputs, planningResult } from '../src/planning-models.js';
import { repairReplaceCost } from '../src/planning-repair-replace-models.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('the two forward schedules reconcile cash starts, annual outlays and the common final sale',()=>{
 const d=defaults('repairReplace'),p=repairReplaceCost(d);near(p.repairStart,450);near(p.replaceStart,1650);near(p.repairNominal,2050);near(p.replaceNominal,2150);
 near(p.rows[0].repair,450);near(p.rows[0].replace,1650);near(p.rows.at(-1).repair,p.repairNominal);near(p.rows.at(-1).replace,p.replaceNominal);
 for(let t=1;t<=d.years;t++){
  near(p.rows[t].repair-p.rows[t-1].repair,d.annualOld-(t===d.years?d.repairEndValue:0));
  near(p.rows[t].replace-p.rows[t-1].replace,d.annualNew-(t===d.years?d.replaceEndValue:0));
 }
});
test('closed-form present values agree with independently discounted individual cash flows',()=>{
 const d=defaults('repairReplace');
 for(const discount of [0,.01,4,15])for(const years of [1,5,15]){
  const i={...d,discount,years},p=repairReplaceCost(i),df=t=>1/(1+discount/100)**t;
  let repair=d.repairQuote,replace=d.replacementPrice+d.installation-d.currentResale;
  for(let t=1;t<=years;t++){repair+=d.annualOld*df(t);replace+=d.annualNew*df(t);}
  repair-=d.repairEndValue*df(years);replace-=d.replaceEndValue*df(years);
  near(p.repairPV,repair);near(p.replacePV,replace);near(p.difference,replace-repair);
 }
 const p=repairReplaceCost(d);near(p.repairPV,1874.5831459251854);near(p.replacePV,2122.557176879176);near(p.difference,247.97403095399068);
});
test('the unrecoverable original price updates context without changing any forward result',()=>{
 const d=defaults('repairReplace'),a=planningResult('repairReplace',d),b=planningResult('repairReplace',{...d,pastPurchase:20000});
 assert.deepEqual(a.metrics,b.metrics);assert.deepEqual(a.charts,b.charts);assert.notEqual(a.note,b.note);
 assert.deepEqual(repairReplaceCost(d),repairReplaceCost({...d,pastPurchase:0}));
});
test('the current resale opportunity is counted once and equivalent initial ledgers have the same difference',()=>{
 const d=defaults('repairReplace'),p=repairReplaceCost(d);near(p.opportunityRepair,550);near(p.opportunityReplace,1750);
 near(p.opportunityReplace-p.opportunityRepair,p.initialDifference);near(p.initialDifference,1200);
 const extra=repairReplaceCost({...d,currentResale:d.currentResale+100});near(extra.replacePV-p.replacePV,-100);near(extra.repairPV,p.repairPV);near(extra.difference-p.difference,-100);
});
test('final sale values enter only at the final date and have the correct signed present effect',()=>{
 const d=defaults('repairReplace'),a=repairReplaceCost(d),b=repairReplaceCost({...d,repairEndValue:200,replaceEndValue:700});
 for(let t=0;t<d.years;t++)assert.deepEqual(a.rows[t],b.rows[t]);near(b.repairNominal-a.repairNominal,-200);near(b.replaceNominal-a.replaceNominal,-300);
 near(b.difference-a.difference,-100/(1.04**5));
 const r=planningResult('repairReplace',d);near(r.charts[0].rows.reduce((n,row)=>n+row.value,0),a.replaceStart);near(r.charts[2].rows.reduce((n,row)=>n+row.value,0),a.difference);
});
test('zero discount reconciles nominal totals and an all-zero cost case remains finite',()=>{
 const d=defaults('repairReplace'),p=repairReplaceCost({...d,discount:0});near(p.repairPV,p.repairNominal);near(p.replacePV,p.replaceNominal);
 const zero={...d,repairQuote:0,replacementPrice:0,installation:0,currentResale:0,annualOld:0,annualNew:0,repairEndValue:0,replaceEndValue:0};
 const r=planningResult('repairReplace',zero);near(r.metrics[2][1],0);assert.doesNotMatch(renderResult(r,300),/NaN|Infinity|undefined/);
});
test('large entered sale receipts remain signed and are not silently clamped into positive costs',()=>{
 const d={...defaults('repairReplace'),replacementPrice:0,installation:0,currentResale:10000,replaceEndValue:10000},p=repairReplaceCost(d),r=planningResult('repairReplace',d);
 assert.ok(p.replaceStart<0&&p.replacePV<0);assert.equal(r.charts[0].rows.at(-1).value,-10000);assert.doesNotMatch(renderResult(r,300),/NaN|Infinity|undefined/);
});
test('field limits render four accessible figures and the service horizon must be integral',()=>{
 const kind='repairReplace',d=defaults(kind),variants=[d];assert.equal(validInputs(kind,{...d,years:2.5}),false);
 for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs(kind,input),true);const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
});
