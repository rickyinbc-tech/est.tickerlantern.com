import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { balancedStressPlan, timingRulePlan, timingPaths } from '../src/planning-balanced-timing-models.js';
import { balancedTimingGuides } from '../src/planning-balanced-timing-guides.js';
import { planningGuides } from '../src/planning-guides.js';
import { renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('balanced stress reconciles the asset losses, closing-value fee and independently calculated real wealth',()=>{
 const input=defaults('balancedStress'),p=balancedStressPlan(input);
 near(p.stockChange,-21000);near(p.bondChange,-3200);near(p.firstFee,758);near(p.afterShock,75042);
 // Reference values calculated separately with 40-digit Decimal arithmetic.
 near(p.rows.at(-1).value,187579.13879463104);near(p.realEnd,126235.38309788423);
 near(p.netFactor,1.0494);near(p.rows[1].real,75042/1.02);
 for(const equity of [0,20,60,100]){
  const q=balancedStressPlan({...input,stressEquity:equity});
  near(q.stockChange+q.bondChange+input.stressCapital-q.firstFee,q.afterShock);
  near(q.netFactor,p.netFactor); // Asset-weight control changes only the shock, as disclosed.
 }
});

test('real-value stress boundaries include a one-year horizon and persistent real erosion',()=>{
 const input=defaults('balancedStress');
 const one=balancedStressPlan({...input,stressYears:1});near(one.rows.at(-1).value,75042);near(one.realEnd,75042/1.02);
 const flat=balancedStressPlan({...input,stressStocks:0,stressBonds:0,stressGrowth:0,stressFee:0,stressInflation:0});
 assert.ok(flat.rows.every(r=>r.value===100000&&r.real===100000));
 const erosion=balancedStressPlan({...input,stressGrowth:2});assert.ok(erosion.realEnd<erosion.rows[1].real);
 const charts=planningResult('balancedStress').charts;
 near(charts[0].rows[2].values[0],.8019);near(charts[0].rows[2].values[1],.75042);
 near(charts[1].rows.reduce((n,r)=>n+r.value,0),75042);
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)near(charts[3].rows[i].values[j],balancedStressPlan(input,{growth:[2,4,6,8][i],inflation:[0,2,4,6][j]}).realEnd/100000-1);
});

test('benchmark wealth equals a separate fractional-unit ledger for every authored path',()=>{
 const input=defaults('timingRule');
 for(const path of [1,2,3]){
  const p=timingRulePlan(input,{path});let units=input.timingCapital/100;
  for(const row of p.rows.slice(1)){units+=input.timingMonthly/row.index;near(row.hold,units*row.index);near(row.capital,10000+500*row.x);}
 }
});

test('timing decisions occur after observed losses, with re-entry after the rebound and no future knowledge',()=>{
 const input=defaults('timingRule'),p=timingRulePlan(input),q=timingRulePlan(input,{path:2});
 assert.equal(p.exitMonth,2);assert.equal(p.entryMonth,3);assert.deepEqual(p.rows.slice(0,3),q.rows.slice(0,3));
 near(p.rows[1].hold,9300);near(p.rows[2].hold,8684);near(p.rows[2].timed,8684*.999);
 const atReentry=(8684*.999*1.03**(1/12)+500)*.999;
 near(p.rows[3].timed,atReentry);assert.equal(p.rows[3].event,'Re-enter at this close');
 assert.ok(p.rows[3].timed<p.rows[3].hold); // It did not capture the triggering 18% rebound.
 near(p.hold,18401.052275384627);near(p.timed,16415.18432548798);
 assert.ok(p.difference<0);assert.ok(q.difference>0);
 assert.equal(q.entryMonth,null);
 // Closed-form waiting-cash annuity, ten interest/deposit periods after the exit.
 const factor=1.03**(1/12);near(q.timed,8684*.999*factor**10+500*(factor**10-1)/(factor-1));
 const noSwitch=timingRulePlan(input,{path:3});assert.equal(noSwitch.exitMonth,null);near(noSwitch.fees,0);near(noSwitch.difference,0);
});

test('flat returns, no trigger, zero resources and switching costs preserve fair comparisons',()=>{
 const input=defaults('timingRule');
 const flat=timingRulePlan({...input,timingScale:0});near(flat.hold,16000);near(flat.timed,16000);assert.equal(flat.exitMonth,null);
 const noTrigger=timingRulePlan({...input,timingExit:60});near(noTrigger.difference,0);
 const none=timingRulePlan({...input,timingCapital:0,timingMonthly:0});near(none.hold,0);near(none.timed,0);near(none.fees,0);
 const free=timingRulePlan({...input,timingCost:0});near(free.fees,0);assert.ok(free.timed>timingRulePlan(input).timed);
 const noNewCash=timingRulePlan({...input,timingMonthly:0,timingExit:60});near(noNewCash.hold,10000*noNewCash.rows.at(-1).index/100);
 assert.equal(timingPaths.length,3);assert.ok(timingPaths.every(p=>p.returns.length===12));
});

test('new guides have valid cross-links and four accessible finite figures at field boundaries',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 for(const guide of balancedTimingGuides){
  assert.ok(guide.related.every(s=>slugs.has(s)));assert.equal(guide.sections.length,7);assert.ok(guide.sources.every(s=>s.url.startsWith('https://')));
  for(const input of [defaults(guide.planning),...['min','max'].map(edge=>Object.fromEntries(definitions[guide.planning].fields.map(f=>[f[0],f[edge==='min'?3:4]])))]){
   assert.ok(validInputs(guide.planning,input));const result=planningResult(guide.planning,input);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/View chart data/g)||[]).length,4);}
  }
 }
 assert.equal(validInputs('timingRule',{...defaults('timingRule'),timingPath:1.5}),false);
 assert.equal(validInputs('balancedStress',{...defaults('balancedStress'),stressYears:1.5}),false);
 assert.throws(()=>planningResult('balancedStress',{...defaults('balancedStress'),stressCapital:NaN}));
});
