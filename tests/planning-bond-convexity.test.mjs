import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {optionFreeAnnualPrice,annualBondSensitivities,convexityComparison} from '../src/planning-bond-convexity-models.js';
import {renderResult} from '../src/planning-charts.js';
const kind='bondConvexity',near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<tolerance*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('annual-pay default repricing reconciles both approximation terms and the residual',()=>{
  const p=convexityComparison(defaults(kind));near(p.price,100000);near(p.duration,7.721734929184811);near(p.convexity,74.99768153281748);
  near(p.exact,85952.83691813475);near(p.linear,84556.53014163036);near(p.quadratic,86056.48377228671);
  near(p.linearChange,-15443.469858369615);near(p.convexityChange,1499.9536306563532);near(p.residual,-103.64685415195709);
  near(p.price+p.linearChange+p.convexityChange+p.residual,p.exact);
});
test('cash-flow price agrees with an independent annuity formula including zero and negative yields',()=>{
  for(const years of [1,10,30])for(const coupon of [0,5,12])for(const yieldPercent of [-3,0,5,15]){
    const y=yieldPercent/100,face=100000;
    const expected=y===0?face+face*coupon/100*years:face*coupon/100*(-Math.expm1(-years*Math.log1p(y)))/y+face*Math.exp(-years*Math.log1p(y));
    near(optionFreeAnnualPrice(face,coupon,years,yieldPercent),expected);
  }
});
test('analytic duration and convexity agree with finite differences with respect to fractional yield',()=>{
  const base=defaults(kind),h=1e-5;
  for(const convexYears of [1,10,30])for(const convexCoupon of [0,5,12])for(const convexBaseYield of [0,5,12]){
    const input={...base,convexYears,convexCoupon,convexBaseYield},p=annualBondSensitivities(input);
    const down=optionFreeAnnualPrice(input.convexFace,convexCoupon,convexYears,convexBaseYield-h*100),up=optionFreeAnnualPrice(input.convexFace,convexCoupon,convexYears,convexBaseYield+h*100);
    near(-(up-down)/(2*h*p.price),p.duration,1e-6);near((up-2*p.price+down)/(h*h*p.price),p.convexity,2e-5);
    assert.ok(p.duration>0&&p.convexity>0);
    if(convexCoupon===0){near(p.duration,convexYears/(1+convexBaseYield/100));near(p.convexity,convexYears*(convexYears+1)/(1+convexBaseYield/100)**2);}
  }
});
test('zero shocks are exact, the tangent is below the curve and default second-order errors are smaller',()=>{
  const base=defaults(kind),zero=convexityComparison(base,0);near(zero.linearError,0);near(zero.quadraticError,0);near(zero.convexityChange,0);
  for(const move of [-3,-2,-1,1,2,3]){
    const p=convexityComparison(base,move);assert.ok(p.linearError<0);assert.ok(Math.abs(p.quadraticError)<Math.abs(p.linearError));
    near(p.convexityChange,convexityComparison(base,-move).convexityChange);
  }
  const up=convexityComparison(base,2),down=convexityComparison(base,-2);assert.ok(up.quadraticError>0&&down.quadraticError<0);
});
test('maturity/shock matrix recalculates local sensitivities and keeps scale separate from percentage risk',()=>{
  const base=defaults(kind),result=planningResult(kind,base),grid=result.charts[3];
  assert.deepEqual(grid,planningResult(kind,{...base,convexYears:30,convexShock:-3}).charts[3]);
  for(const [i,n] of [5,10,20,30].entries())for(const [j,shock] of [-3,-1,1,3].entries())near(grid.rows[i].values[j],convexityComparison(base,shock,n).linearError);
  const twice=convexityComparison({...base,convexFace:base.convexFace*2}),once=convexityComparison(base);
  near(twice.duration,once.duration);near(twice.convexity,once.convexity);near(twice.linearError,once.linearError*2);
});
test('field extremes including negative resulting yields render four finite accessible figures',()=>{
  const base=defaults(kind),fields=definitions[kind].fields;
  const cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max]))];
  for(const input of cases){assert.ok(validInputs(kind,input));for(const width of [300,760]){
    const result=planningResult(kind,input),html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
    assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);
    assert.ok(result.charts[3].rows.every(r=>r.values.every(v=>v<=1e-7)));
  }}
  assert.equal(validInputs(kind,{...base,convexYears:1.5}),false);assert.equal(validInputs(kind,{...base,convexFace:0}),false);
});
