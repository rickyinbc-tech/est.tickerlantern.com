import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {taperBudget,taperChange,taperProfile} from '../src/planning-taper-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);
test('default endpoints and gross-change reconciliation cap benefit loss at the amount remaining',()=>{
 const d=defaults('taper'),p=taperChange(d);assert.deepEqual(p.before,{gross:2000,tax:400,benefit:50,resources:1650,localOffset:.7});
 near(p.after.gross,2200);near(p.after.tax,440);near(p.after.benefit,0);near(p.after.resources,1760);
 near(p.extraTax,40);near(p.lostBenefit,50);near(p.gain,110);near(p.offset,.45);
 near(p.gain,d.taperRaise-p.extraTax-p.lostBenefit);near(planningResult('taper',d).charts[1].rows.reduce((v,r)=>v+r.value,0),p.gain);
});
test('local right-hand offset respects the beginning and exhaustion of the benefit phase-out',()=>{
 const d=defaults('taper');near(taperBudget(d,1499).localOffset,.2);near(taperBudget(d,1500).localOffset,.7);near(taperBudget(d,2099).localOffset,.7);near(taperBudget(d,2100).localOffset,.2);
 near(taperChange(d,2000,100).gain,30);near(taperChange(d,2100,100).gain,80);near(taperChange(d,2000,200).gain,110);
 assert.notEqual(taperChange(d).offset,taperChange(d).before.localOffset);
});
test('independent piecewise slope integration matches full endpoint changes over boundaries',()=>{
 const d=defaults('taper');
 for(const tax of [0,20,60])for(const phase of [0,50,100])for(const benefit of [0,300])for(const start of [0,1000,1500,1600,2000,2100,3000])for(const raise of [0,50,200,2000]){
  const i={...d,taperTax:tax,taperRate:phase,taperBenefit:benefit},finish=start+raise,end=phase>0?1500+benefit/(phase/100):null;
  const points=[...new Set([start,finish,...[1500,end].filter(x=>x!==null&&x>start&&x<finish)])].sort((a,b)=>a-b);
  let integrated=0;
  for(let j=1;j<points.length;j++){const midpoint=(points[j]+points[j-1])/2,active=phase>0&&benefit>0&&midpoint>1500&&midpoint<end;integrated+=(points[j]-points[j-1])*(1-tax/100-(active?phase/100:0));}
  near(taperChange(i,start,raise).gain,integrated);
 }
});
test('zero phase-out, zero benefit and zero raise preserve their distinct identities',()=>{
 const d=defaults('taper');for(const gross of [0,1500,2000,7000])near(taperBudget({...d,taperRate:0},gross).benefit,300);
 for(const key of ['taperRate','taperBenefit']){const p=taperChange({...d,[key]:0});near(p.lostBenefit,0);near(p.gain,d.taperRaise*(1-d.taperTax/100));}
 const zero=taperChange({...d,taperRaise:0});near(zero.gain,0);near(zero.extraTax,0);near(zero.lostBenefit,0);assert.equal(zero.offset,null);
 assert.equal(planningResult('taper',{...d,taperRaise:0}).metrics[2][3],'N/A · no gross increase');
});
test('combined offsets above 100 percent retain negative resource changes without negative benefits',()=>{
 const d={...defaults('taper'),taperIncome:1600,taperRaise:100,taperTax:60,taperRate:100},p=taperChange(d);
 near(p.before.resources,840);near(p.after.resources,780);near(p.gain,-60);near(p.offset,1.6);near(p.before.localOffset,1.6);
 assert.ok(p.before.benefit>=0&&p.after.benefit>=0);assert.ok(planningResult('taper',d).charts[1].rows.reduce((v,r)=>v+r.value,0)<0);
});
test('profiles insert exact kinks and comparison/matrix rows replace only their labelled incomes',()=>{
 const d={...defaults('taper'),taperBenefit:333,taperRate:37},end=1500+333/.37,profile=taperProfile(d);
 assert.ok(profile.some(r=>r.gross===1500));assert.ok(profile.some(r=>r.gross===end));near(profile.find(r=>r.gross===end).benefit,0);
 const r=planningResult('taper',d);[500,1000,1500,2000,2500,3000].forEach((gross,j)=>near(r.charts[2].rows[j].value,taperChange(d,gross).gain));
 [1000,1500,2000,2500].forEach((gross,j)=>[100,200,500,1000].forEach((raise,k)=>near(r.charts[3].rows[j].values[k],taperChange(d,gross,raise).gain)));
 assert.deepEqual(r.charts[3],planningResult('taper',{...d,taperIncome:0,taperRaise:0}).charts[3]);
});
test('supported boundaries render four finite accessible figures/tables including negative changes',()=>{
 const d=defaults('taper'),fields=definitions.taper.fields;
 const cases=[d,...fields.flatMap(([k,,,lo,hi])=>[{...d,[k]:lo},{...d,[k]:hi}]),Object.fromEntries(fields.map(([k,,,lo])=>[k,lo])),Object.fromEntries(fields.map(([k,,,,hi])=>[k,hi])),{...d,taperIncome:1600,taperRaise:100,taperTax:60,taperRate:100}];
 const finite=v=>{if(typeof v==='number')assert.ok(Number.isFinite(v));else if(Array.isArray(v))v.forEach(finite);else if(v&&typeof v==='object')Object.values(v).forEach(finite);};
 for(const i of cases){assert.ok(validInputs('taper',i));const r=planningResult('taper',i);finite(r);assert.equal(r.charts.length,4);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,4);assert.equal((h.match(/<caption>/g)||[]).length,4);}
 }
 assert.equal(validInputs('taper',{...d,taperRaise:-1}),false);
});
