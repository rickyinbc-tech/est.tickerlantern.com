import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {fuelMixCosts,fuelMixCrossing} from '../src/planning-fuel-mix-models.js';
import {renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('fuel defaults use distance weights, divide by 100, and allow fewer litres to cost more',()=>{
 const d=defaults('fuelMix'),p=fuelMixCosts(d);near(p.rates[0],8.2);near(p.rates[1],7.225);near(p.litres[0],1640);near(p.litres[1],1445);near(p.costs[0],2788);near(p.costs[1],2817.75);near(p.saving,-29.75);assert.ok(p.litres[1]<p.litres[0]);assert.ok(p.costs[1]>p.costs[0]);
});
test('separate consumption and cash equalities reconcile their respective units',()=>{
 const d=defaults('fuelMix'),volume=fuelMixCrossing(d,false),cash=fuelMixCrossing(d);assert.equal(volume.status,'point');assert.equal(cash.status,'point');near(volume.share,100/3);near(cash.share,100*4.425/7.775);
 const v=fuelMixCosts(d,volume.share),c=fuelMixCosts(d,cash.share);near(v.litres[0],v.litres[1]);near(c.costs[0],c.costs[1]);assert.ok(v.saving<0);assert.ok(fuelMixCosts(d,cash.share+1).saving>0);
});
test('city mix and vehicle-specific fuel price have independently checkable effects',()=>{
 const d=defaults('fuelMix'),p=fuelMixCosts(d,80);near(p.rates[0],9.2);near(p.rates[1],7.1);near(p.costs[0],3128);near(p.costs[1],2769);near(p.saving,359);near(fuelMixCosts({...d,fuelPriceB:1.7}).saving,331.5);
 for(const share of [0,25,55,80,100]){const a=fuelMixCosts(d,share),b=fuelMixCosts({...d,annualKm:40000},share);near(b.saving,2*a.saving);near(a.cityCosts[0]+a.highwayCosts[0],a.costs[0]);near(a.cityCosts[1]+a.highwayCosts[1],a.costs[1]);}
 near(fuelMixCrossing({...d,annualKm:40000}).share,fuelMixCrossing(d).share);
});
test('identical, parallel, outside-range and endpoint cost patterns have explicit crossing status',()=>{
 const d=defaults('fuelMix');assert.equal(fuelMixCrossing({...d,cityB:10,highwayB:6,fuelPriceB:1.7}).status,'all');assert.equal(fuelMixCrossing({...d,cityB:11,highwayB:7,fuelPriceB:1.7}).status,'none');
 assert.equal(fuelMixCrossing({...d,cityB:2,highwayB:1,fuelPriceB:1.7}).status,'none');near(fuelMixCrossing({...d,highwayB:6,fuelPriceB:1.7}).share,0);near(fuelMixCrossing({...d,cityB:10,fuelPriceB:1.7}).share,100);
});
test('zero kilometres, free fuel and zero consumption remain finite without invented costs',()=>{
 const d=defaults('fuelMix'),zero={...d,annualKm:0};assert.deepEqual(fuelMixCosts(zero).costs,[0,0]);assert.match(planningResult('fuelMix',zero).note,/zero at every driving mix/);
 const free=fuelMixCosts({...d,fuelPriceA:0,fuelPriceB:0});assert.deepEqual(free.costs,[0,0]);assert.equal(fuelMixCrossing({...d,fuelPriceA:0,fuelPriceB:0}).status,'all');near(fuelMixCosts({...d,cityA:0,highwayA:0}).costs[0],0);
});
test('cash chart components reconcile while the full-range curve retains the selected exact crossover',()=>{
 const d=defaults('fuelMix'),r=planningResult('fuelMix',d),p=fuelMixCosts(d),cross=fuelMixCrossing(d);r.charts[1].rows.forEach((row,i)=>near(row.values.reduce((a,b)=>a+b,0),p.costs[i]));
 const root=r.charts[2].series[0].rows.find(row=>row.x===cross.share);assert.ok(root);near(root.value,0);near(r.metrics[2][1],p.saving);assert.ok(r.charts[3].rows.some(row=>row.values.some(v=>v<0)));assert.ok(r.charts[3].rows.some(row=>row.values.some(v=>v>0)));
});
test('every supported field endpoint renders four finite figures and data tables with explicit units',()=>{
 const d=defaults('fuelMix'),variants=[d];for(const [key,,,min,max] of definitions.fuelMix.fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs('fuelMix',input),true);const html=renderResult(planningResult('fuelMix',input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/L\/100 km/);}
});
