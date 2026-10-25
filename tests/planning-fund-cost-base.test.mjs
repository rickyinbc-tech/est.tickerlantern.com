import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {fundCostBaseLedger} from '../src/planning-fund-cost-base-models.js';
import {fundCostBaseGuides} from '../src/planning-fund-cost-base-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-8,`${a} != ${b}`);
test('reinvestment and cash return of capital reconcile units, total cost and value transferred',()=>{
 const d=defaults('fundCostBase');
 for(const reinvestedDistribution of [0,500,1000])for(const returnCapital of [0,200,500])for(const openingPrice of [10,20,100]){
  const x={...d,reinvestedDistribution,returnCapital,openingPrice},p=fundCostBaseLedger(x);
  near(p.units,d.openingUnits+reinvestedDistribution/openingPrice);near(p.acb,d.openingUnits*openingPrice+reinvestedDistribution-returnCapital);near(p.averageCost*p.units,p.acb);
  near(d.openingUnits*p.preDistributionNAV,p.units*openingPrice);near(p.units*p.afterRocNAV+returnCapital,p.units*openingPrice);
  assert.ok(p.acb>0&&p.afterRocNAV>0);
 }
 const p=fundCostBaseLedger(d);near(p.units,525);near(p.acb,10300);near(p.averageCost,10300/525);near(p.gain,1230);
});
test('sale expense is subtracted once and ignored cost adjustments explain the shortcut error',()=>{
 const d=defaults('fundCostBase');
 for(const salePrice of [1,18,22,150])for(const saleFee of [0,20,50]){
  const p=fundCostBaseLedger({...d,salePrice,saleFee});near(p.gain,p.units*salePrice-saleFee-p.acb);near(p.shortcutError,d.reinvestedDistribution-d.returnCapital);
  near(p.resources-p.openingCost,d.reinvestedDistribution+p.gain);
 }
 const p=fundCostBaseLedger(d),loss=fundCostBaseLedger({...d,salePrice:18});assert.ok(loss.gain<0);near(loss.gain,-870);near(p.resources,11730);near(p.resourceGain,1730);
 near(fundCostBaseLedger({...d,returnCapital:500,reinvestedDistribution:0}).shortcutError,-500);
 const bridge=planningResult('fundCostBase').charts.find(c=>c.type==='waterfall');near(bridge.rows.reduce((s,r)=>s+r.value,0),p.acb);
});
test('fractional reinvested units retain calculation precision beyond the displayed chart labels',()=>{
 const d={...defaults('fundCostBase'),openingPrice:33,reinvestedDistribution:500},p=fundCostBaseLedger(d);near(p.newUnits,500/33);near(p.gain,p.units*d.salePrice-d.saleFee-p.acb);
 assert.equal(planningResult('fundCostBase',d).metrics[1][3],p.units.toLocaleString('en-CA',{maximumFractionDigits:6}));
});
test('fund-cost guide preserves detailed prose, related links and four accessible finite figures at input boundaries',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 for(const g of fundCostBaseGuides){
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=800);assert.ok(g.related.every(s=>slugs.has(s)));
  const d=defaults(g.planning),fields=definitions[g.planning].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);assert.equal(result.charts.length,4);
   for(const width of [300,760]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
 }
});
