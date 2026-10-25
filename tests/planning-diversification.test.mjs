import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {twoAssetMoments} from '../src/planning-diversification-models.js';
import {renderFigure,renderResult} from '../src/planning-charts.js';
const kind='diversificationGeometry',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('two-asset default reconciles variance terms, mean, attribution and dollar translation',()=>{
  const p=twoAssetMoments(defaults(kind));
  near(p.mean,.056);near(p.ownA*10000,12.96);near(p.ownB*10000,51.84);near(p.cross*10000,10.368);
  near(p.variance,.0075168);near(p.sd,.08669948096730454);near(p.dollarSD,8669.948096730453);
  near(p.attributedA+p.attributedB,p.variance);near(p.attributedA*10000,18.144);near(p.attributedB*10000,57.024);
});
test('analytical paired deviations independently recover covariance and portfolio variance',()=>{
  const input=defaults(kind);
  for(const weightA of [0,25,60,75,100])for(const correlation of [-1,-.5,0,.2,1]){
    const a=weightA/100,b=1-a,orthogonal=Math.sqrt(1-correlation**2);
    // Four equally weighted analytical states: orthogonal, zero-mean, unit-variance vectors.
    const u=[1,1,-1,-1],v=[1,-1,1,-1];
    const values=u.map((x,i)=>a*input.volA/100*x+b*input.volB/100*(correlation*x+orthogonal*v[i]));
    const secondMoment=values.reduce((s,x)=>s+x*x,0)/4;
    near(twoAssetMoments(input,weightA,correlation).variance,secondMoment);
  }
});
test('perfect and zero correlations obey limiting identities and allocation endpoints',()=>{
  const input=defaults(kind);
  for(const weightA of [0,25,60,75,100]){
    const a=weightA/100*input.volA/100,b=(1-weightA/100)*input.volB/100;
    near(twoAssetMoments(input,weightA,1).sd,a+b);
    near(twoAssetMoments(input,weightA,-1).sd,Math.abs(a-b));
    near(twoAssetMoments(input,weightA,0).sd,Math.hypot(a,b));
    const values=[-1,-.5,0,.5,1].map(r=>twoAssetMoments(input,weightA,r).variance);
    assert.ok(values.every((v,i)=>!i||v>=values[i-1]-1e-12));
  }
  near(twoAssetMoments(input,75,-1).sd,0);
  near(twoAssetMoments(input,0,-1).sd,.18);near(twoAssetMoments(input,100,1).sd,.06);
});
test('capital scales dollars without changing moments; negative covariance can give a negative attribution',()=>{
  const input=defaults(kind),p=twoAssetMoments(input),double=twoAssetMoments({...input,capital:input.capital*2});
  near(double.mean,p.mean);near(double.sd,p.sd);near(double.dollarSD,2*p.dollarSD);
  const hedge=twoAssetMoments(input,60,-1);assert.ok(hedge.attributedA<0);near(hedge.attributedA+hedge.attributedB,hedge.variance);
  near(hedge.mean,p.mean);near(twoAssetMoments({...input,volA:0,volB:0}).sd,0);
});
test('all five charts remain finite and tabulated at field boundaries, negative means and zero risks',()=>{
  const base=defaults(kind),fields=definitions[kind].fields;
  const cases=[base,...fields.flatMap(([k,,,min,max])=>[{...base,[k]:min},{...base,[k]:max}]),Object.fromEntries(fields.map(([k,,,min])=>[k,min])),Object.fromEntries(fields.map(([k,,,,max])=>[k,max])),{...base,volA:0,volB:0,meanA:0,meanB:0},{...base,meanA:-10,meanB:20}];
  for(const input of cases){
    assert.ok(validInputs(kind,input));const result=planningResult(kind,input);assert.equal(result.charts.length,5);
    for(const width of [300,760]){
      const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);
      assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);
    }
  }
  assert.equal(validInputs(kind,{...base,correlation:1.01}),false);
});
test('scatter exposes percentage coordinates, selected point and validation for invalid geometry',()=>{
  const spec=planningResult(kind).charts.find(c=>c.type==='scatter'),html=renderFigure(spec,300);
  assert.match(html,/A 60%: Annual standard deviation 8.67%, Arithmetic mean return 5.60%/);
  assert.match(html,/<td>8.67%<\/td><td>5.60%<\/td>/);assert.match(html,/tabindex="0" role="img"/);
  for(const rows of [[],[{x:-1,value:0}],[{x:0,value:Infinity}]])assert.throws(()=>renderFigure({...spec,rows}),/Scatter coordinates/);
  assert.equal(spec.rows.filter(r=>r.selected).length,1);
});
