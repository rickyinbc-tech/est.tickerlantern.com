import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {shareSplitLedger} from '../src/planning-share-split-models.js';
import {format,renderResult} from '../src/planning-charts.js';
const kind='shareSplit',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('full fractional entitlement preserves split-date value and attributes only the later loss',()=>{
  const p=shareSplitLedger(defaults(kind));near(p.ratio,1.5);near(p.newShares,181.5);near(p.adjustedPrice,60);
  near(p.before,10890);near(p.mechanical,10890);near(p.later,9982.5);near(p.change,-907.5);
  near(p.rawPriceReturn,-.38888888888888884);near(p.holdingReturn,-1/12);
});
test('proportional value invariance and adjusted-price return hold for forward, reverse and unchanged ratios',()=>{
  const base=defaults(kind);
  for(const splitOldShares of [1,121,1000000])for(const splitNewUnits of [1,3,20])for(const splitOldUnits of [1,7,20])for(const splitOldPrice of [.01,90,10000]){
    const input={...base,splitOldShares,splitNewUnits,splitOldUnits,splitOldPrice},p=shareSplitLedger(input);
    near(p.mechanical,p.before);near(p.newShares/p.ratio,splitOldShares);
    for(const priceFactor of [0,.8,1,1.2,2]){
      const later=shareSplitLedger({...input,splitLaterPrice:p.adjustedPrice*priceFactor});
      near(later.holdingReturn,priceFactor-1);near(later.later,p.before*priceFactor);
      near(later.holdingReturn,later.ratio*(1+later.rawPriceReturn)-1);
      near(p.before+later.change,later.later);
    }
  }
});
test('price chart adjusts the historical comparison unit without changing the later quote',()=>{
  const input=defaults(kind),result=planningResult(kind,input),price=result.charts[1];
  assert.deepEqual(price.series[0].rows.map(r=>r.value),[90,60,55]);
  assert.deepEqual(price.series[1].rows.map(r=>r.value),[60,60,55]);
  assert.equal(result.charts[3].rows[1].value,0);
  assert.match(result.note,/Full fractional entitlement is retained mathematically/);
});
test('matrix exposes mismatched quote units and replaces selected ratio and later price',()=>{
  const base=defaults(kind),grid=planningResult(kind,base).charts[4];
  assert.deepEqual(grid,planningResult(kind,{...base,splitNewUnits:1,splitOldUnits:20,splitLaterPrice:0}).charts[4]);
  near(grid.rows[3].values[2],-.4);near(grid.rows[0].values[1],1);near(grid.rows[1].values[1],0);
  for(const [i,ratio] of [.5,1,1.5,2].entries())for(const [j,returnValue] of [-.2,0,.2,.5].entries())near((1+grid.rows[i].values[j])*ratio-1,returnValue);
});
test('share quantities retain meaningful fractional display without rounding to whole shares',()=>{
  assert.equal(format(181.5,'shares'),'181.5');assert.equal(format(121/7,'shares'),'17.285714');
  assert.equal(format(1000000,'shares',true),'1m');assert.equal(format(181500,'shares',true),'181.5k');
});
test('supported field extremes render five figures and tables and reject fractional ratio inputs',()=>{
  const base=defaults(kind),fields=definitions[kind].fields;
  const cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
  for(const input of cases){assert.ok(validInputs(kind,input));for(const width of [300,760]){
    const html=renderResult(planningResult(kind,input),width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
    assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);
  }}
  assert.equal(validInputs(kind,{...base,splitNewUnits:1.5}),false);assert.equal(validInputs(kind,{...base,splitOldShares:121.5}),false);
  assert.equal(validInputs(kind,{...base,splitOldPrice:0}),false);
});
