import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {etfPremiumLedger} from '../src/planning-etf-premium-models.js';
import {renderResult} from '../src/planning-charts.js';
const kind='etfPremium',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('default matched prices, fixed units and proceeds produce the exact selected price return',()=>{
  const p=etfPremiumLedger(defaults(kind));near(p.buyPrice,102);near(p.endNav,105);near(p.sellPrice,103.95);
  near(p.units,10000/102);near(p.initialNavValue,9803.92156862745);near(p.proceeds,10191.176470588235);
  near(p.marketReturn,103.95/102-1);near(p.returnGap,p.marketReturn-.05);
  near(p.entryAdjustment,-196.078431372549);near(p.navGrowth,490.196078431373);near(p.exitAdjustment,-102.941176470588);
});
test('independent execution-price ratio and complete attribution bridge reconcile across supported scenarios',()=>{
  const base=defaults(kind);
  for(const premiumCash of [100,10000,1000000])for(const premiumStartNav of [1,100,10000])for(const premiumNavChange of [-50,0,5,50])for(const premiumEntry of [-5,0,2,5])for(const premiumExit of [-5,0,2,5]){
    const input={...base,premiumCash,premiumStartNav,premiumNavChange,premiumEntry,premiumExit},p=etfPremiumLedger(input);
    near(p.marketReturn,p.sellPrice/p.buyPrice-1);near(p.proceeds/input.premiumCash-1,p.marketReturn);
    near(p.units*p.buyPrice,premiumCash);near(p.units*p.sellPrice,p.proceeds);
    near(premiumCash+p.entryAdjustment+p.navGrowth+p.exitAdjustment,p.proceeds);
  }
});
test('equal entry/exit premium factors cancel rather than acting as a recurring fee',()=>{
  const base=defaults(kind);
  for(const premiumNavChange of [-50,0,5,50])for(const premiumEntry of [-5,-2,0,2,5]){
    const p=etfPremiumLedger({...base,premiumNavChange,premiumEntry,premiumExit:premiumEntry});near(p.marketReturn,premiumNavChange/100);
  }
  near(etfPremiumLedger({...base,premiumExit:0}).marketReturn,.02941176470588225);
  near(etfPremiumLedger({...base,premiumNavChange:0,premiumEntry:-2,premiumExit:0}).marketReturn,.020408163265306145);
});
test('NAV unit scale and purchase cash scale dollars consistently without changing the return identity',()=>{
  const base=defaults(kind),a=etfPremiumLedger(base),nav=etfPremiumLedger({...base,premiumStartNav:200}),cash=etfPremiumLedger({...base,premiumCash:20000});
  near(nav.units,a.units/2);near(nav.proceeds,a.proceeds);near(cash.units,a.units*2);near(cash.proceeds,a.proceeds*2);
  near(nav.marketReturn,a.marketReturn);near(cash.marketReturn,a.marketReturn);
  assert.deepEqual(planningResult(kind,base).charts[3],planningResult(kind,{...base,premiumEntry:-5,premiumExit:5,premiumCash:1000000,premiumStartNav:1}).charts[3]);
});
test('sensitivity point uses the selected exit and data-table percentages have the correct units',()=>{
  const input=defaults(kind),result=planningResult(kind,input),curve=result.charts[1];
  assert.deepEqual(curve.series[2].rows,[{x:-1,value:etfPremiumLedger(input).marketReturn}]);
  assert.equal(result.metrics[2][2],'pp');assert.equal(curve.xMin,-5);
  assert.ok(curve.series[0].rows.every((r,i,rows)=>!i||r.value>rows[i-1].value));
  assert.match(result.note,/no cash distributions/);assert.match(result.charts[2].note,/not a second commission/);
});
test('all supported extremes retain positive prices and four finite accessible figures',()=>{
  const base=defaults(kind),fields=definitions[kind].fields;
  const cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
  for(const input of cases){assert.ok(validInputs(kind,input));const p=etfPremiumLedger(input);assert.ok(p.buyPrice>0&&p.sellPrice>0);
    for(const width of [300,760]){const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
  }
  assert.equal(validInputs(kind,{...base,premiumExit:-6}),false);assert.equal(validInputs(kind,{...base,premiumCash:0}),false);
});
