import test from 'node:test';
import assert from 'node:assert/strict';
import { dipPaths, dipWaitPlan, rebalanceDriftPlan } from '../src/planning-fund-discipline-models.js';
import { defaults, planningResult, validInputs } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('a zero waiting limit reproduces investing each deposit at month-end',()=>{
 for(const path of [1,2,3]){const p=dipWaitPlan({...defaults('dipWait'),dipMaxWait:0},{path});near(p.dipEnd,p.dcaEnd);assert.equal(p.cashEnd,0);}
});

test('default dip ledger matches an independent unit and cash recurrence',()=>{
 const input=defaults('dipWait'),p=dipWaitPlan(input),r=(1.0225)**(1/12)-1;
 let index=100,peak=100,units=0,cash=0,oldest=null,dca=0;
 dipPaths[1].returns.forEach((ret,i)=>{index*=1+ret;peak=Math.max(peak,index);dca+=500/index;cash=cash*(1+r)+500;if(oldest==null)oldest=i+1;
  if(1-index/peak>=.1||i+1-oldest>=12){units+=cash/index;cash=0;oldest=null;}});
 near(p.dcaEnd,dca*index);near(p.dipEnd,units*index+cash);
 assert.deepEqual(p.rows.filter(x=>x.bought).map(x=>x.x),[5,6,7,8,9,10,23,36]);
 near(p.dcaEnd,21127.28,1e-6);near(p.dipEnd,20759.79,1e-6);assert.equal(p.deposited,18000);
});

test('zero returns and zero cash rate leave both rules with deposits only',()=>{
 const p=dipWaitPlan({...defaults('dipWait'),dipScale:0,dipCash:0,dipMaxWait:36});
 near(p.dcaEnd,18000);near(p.dipEnd,18000);near(p.cashEnd,18000);assert.equal(p.purchases,0);
});

test('steady-rise path never reaches a 10% trigger; decisions use observed closes only',()=>{
 const p=dipWaitPlan(defaults('dipWait'),{path:1});
 assert.ok(p.rows.every(r=>r.x===0||r.drawdown<.1));
 const full=dipWaitPlan(defaults('dipWait'),{path:3}),prefixInput=defaults('dipWait');
 const truncated=dipPaths[2].returns.slice(0,24);assert.ok(full.rows.slice(1,25).every((r,i)=>Math.abs(r.index-100*truncated.slice(0,i+1).reduce((a,x)=>a*(1+x),1))<1e-9));
 assert.ok(validInputs('dipWait',prefixInput));
});

test('rebalancing conserves value at each trade and restores the target',()=>{
 const input=defaults('rebalanceDrift'),p=rebalanceDriftPlan(input);
 near(p.rows[1].rebalanced,79800);near(p.rows[1].drift,79800);near(p.rows[1].trade,.6*79800-60000*.65);
 near(p.rows[1].rebalancedWeight,.6);near(p.rows[1].driftWeight,39000/79800);
 near(p.rebalancedEnd,142505.14,1e-6);near(p.driftEnd,137372.97,1e-6);
 for(const r of p.rows.slice(1))if(r.trade!==0)near(r.rebalancedWeight,.6);
});

test('equal asset returns, 0% or 100% equity make rebalancing irrelevant',()=>{
 const base=defaults('rebalanceDrift');
 for(const input of [{...base,rbCrashStocks:3,rbCrashBonds:3,rbRecoveryStocks:3,rbLaterStocks:3,rbBonds:3},{...base,rbEquity:0},{...base,rbEquity:100}]){
  const p=rebalanceDriftPlan(input);near(p.rebalancedEnd,p.driftEnd);
 }
});

test('a second decline lowers the rebalanced trough; no-crash drift raises equity share',()=>{
 const input=defaults('rebalanceDrift'),second=rebalanceDriftPlan(input,{variant:'second'}),none=rebalanceDriftPlan(input,{variant:'none'});
 assert.ok(second.low.rebalanced<second.low.drift);near(second.low.rebalanced,72378.6,1e-6);
 assert.ok(none.rows.at(-1).driftWeight>.66);assert.ok(none.driftEnd>none.rebalancedEnd);
 const every=rebalanceDriftPlan(input,{band:0});assert.ok(every.rows.slice(1).every(r=>Math.abs(r.rebalancedWeight-.6)<1e-12));
});

test('registered guides have four finite charts, sources and resolvable related links',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 for(const [slug,kind] of [['waiting-for-a-dip-new-contributions-cash-rule','dipWait'],['balanced-fund-rebalancing-crash-drift-equity-share','rebalanceDrift']]){
  const guide=planningGuides.find(g=>g.slug===slug);assert.ok(guide);assert.equal(guide.planning,kind);
  assert.ok(guide.sources.length>=4);assert.ok(guide.related.every(s=>slugs.has(s)));
  const result=planningResult(kind);assert.equal(result.charts.length,4);
  for(const c of result.charts){assert.ok(c.id&&c.title&&c.note);const values=JSON.stringify(c.rows??c.series);assert.ok(!/null|NaN|Infinity/.test(values));}
 }
});

test('inputs remain valid and finite at their bounds',()=>{
 for(const kind of ['dipWait','rebalanceDrift']){
  const input=defaults(kind);assert.ok(validInputs(kind,input));
 }
 const d=defaults('dipWait');
 for(const edge of [{dipMonthly:0},{dipMonthly:10000,dipScale:150,dipTrigger:40,dipMaxWait:36,dipCash:8},{dipPath:3,dipTrigger:1,dipScale:0}]){
  const input={...d,...edge};assert.ok(validInputs('dipWait',input));assert.ok(planningResult('dipWait',input).metrics.every(m=>Number.isFinite(m[1])));
 }
 assert.equal(validInputs('dipWait',{...d,dipPath:2.5}),false);
 const b=defaults('rebalanceDrift');
 for(const edge of [{rbCrashStocks:-70,rbCrashBonds:-30,rbYears:1,rbRecoveryYears:10},{rbYears:30,rbBand:30,rbRecoveryStocks:40,rbLaterStocks:15,rbBonds:10},{rbBand:0,rbRecoveryYears:0}]){
  const input={...b,...edge};assert.ok(validInputs('rebalanceDrift',input));assert.ok(planningResult('rebalanceDrift',input).metrics.every(m=>Number.isFinite(m[1])));
 }
});
