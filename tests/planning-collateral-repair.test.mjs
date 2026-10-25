import test from 'node:test';
import assert from 'node:assert/strict';
import {collateralRepairLedger} from '../src/planning-collateral-repair-models.js';
import {collateralRepairGuides} from '../src/planning-collateral-repair-guides.js';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('the same original loss produces three different balance-sheet adjustment amounts',()=>{
 const d=defaults('collateralRepair'),p=collateralRepairLedger(d);
 assert.equal(p.loan,30000);assert.equal(p.assets,42000);assert.equal(p.equity,12000);assert.equal(p.initialEquity,30000);near(p.equityRatio,2/7);
 assert.equal(p.loanReduction,4800);assert.equal(p.extraCollateral,8000);assert.equal(p.sellValue,12000);
 assert.deepEqual(p.cases.map(c=>[c.assets,c.loan,c.equity]),[[42000,25200,16800],[50000,30000,20000],[30000,18000,12000]]);
 for(const c of p.cases){near(c.ratio,.4);near(c.netOfNewCash,12000);}
});
test('each adjustment satisfies its own independently stated ratio equation',()=>{
 for(const financedShare of [0,25,50,90])for(const priceMove of [-90,-60,-30,0,20])for(const equityFloor of [10,40,80]){
  const d={...defaults('collateralRepair'),financedShare,priceMove,equityFloor},p=collateralRepairLedger(d),m=equityFloor/100;
  near((p.equity+p.loanReduction)/p.assets,Math.max(m,p.equityRatio));
  near((p.equity+p.extraCollateral)/(p.assets+p.extraCollateral),Math.max(m,p.equityRatio));
  near(p.equity-p.initialEquity,d.initialAssets*priceMove/100);
  assert.ok(p.loanReduction>=0&&p.loanReduction<=p.loan+1e-7);
  for(const c of p.cases){assert.ok(c.assets>0&&c.loan>=-1e-7);assert.ok(c.ratio>=m-1e-9);near(c.netOfNewCash,p.equity);}
  if(p.sellValue!==null){assert.ok(p.sellValue>=0&&p.sellValue<p.assets);near(p.equity/(p.assets-p.sellValue),Math.max(m,p.equityRatio));}
 }
});
test('zero or negative equity cannot be repaired by selling collateral alone in a remaining funded account',()=>{
 const d=defaults('collateralRepair'),zero=collateralRepairLedger({...d,priceMove:-50}),negative=collateralRepairLedger({...d,priceMove:-60});
 assert.equal(zero.equity,0);assert.equal(zero.sellValue,null);assert.equal(zero.cases.length,2);
 assert.equal(negative.equity,-6000);assert.equal(negative.sellValue,null);assert.equal(negative.loanReduction,15600);assert.equal(negative.extraCollateral,26000);
 for(const c of negative.cases){near(c.ratio,.4);near(c.netOfNewCash,-6000);}
 const r=planningResult('collateralRepair',{...d,priceMove:-60});assert.equal(r.metrics[2][3],'No sale-only repair');assert.equal(r.charts[1].rows.length,2);assert.equal(r.charts[2].rows.length,3);
});
test('a position already above the assumed threshold requires no new adjustment',()=>{
 const d=defaults('collateralRepair');
 for(const input of [{...d,priceMove:0},{...d,financedShare:0,priceMove:-90}]){
  const p=collateralRepairLedger(input);assert.equal(p.loanReduction,0);assert.equal(p.extraCollateral,0);assert.equal(p.sellValue,0);
  for(const c of p.cases){near(c.assets,p.assets);near(c.loan,p.loan);near(c.netOfNewCash,p.equity);}
 }
});
test('collateral guide states the invented rule and keeps the held-cash convention distinct from debt repayment',()=>{
 const g=collateralRepairGuides[0],prose=g.sections.map(s=>s.html).join(' ');assert.equal(g.sections.length,6);assert.ok(prose.replace(/<[^>]*>/g,' ').split(/\s+/).length>=900);
 assert.match(g.chartScope,/invented assumptions/);assert.match(prose,/count one contribution twice/);assert.match(prose,/zero or negative/);
 for(const slug of g.related)assert.ok(planningGuides.some(x=>x.slug===slug),slug);
});
test('all supported financial boundaries render five finite charts with accessible data tables',()=>{
 const kind='collateralRepair',d=defaults(kind),fields=definitions[kind].fields;
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs)for(const width of [300,760]){
  const result=planningResult(kind,input);assert.equal(result.charts.length,5);const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);
 }
});

test('near-zero positive equity preserves the sale-case ratio without subtracting nearly equal balances',()=>{
 const p=collateralRepairLedger({...defaults('collateralRepair'),priceMove:-49.999999999999});assert.ok(p.equity>0);assert.notEqual(p.sellValue,null);assert.ok(p.cases[2].assets>0);near(p.cases[2].ratio,.4);near(p.cases[2].equity,p.equity);
});
