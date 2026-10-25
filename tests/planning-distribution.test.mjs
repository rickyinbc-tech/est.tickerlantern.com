import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { defaults, definitions, planningResult, validInputs } from '../src/planning-models.js';
import { normalCDF, wealthDistributionAt, wealthBelow, wealthRangeProbabilities } from '../src/planning-distribution-models.js';
import { renderFigure, renderResult } from '../src/planning-charts.js';
const near=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('normal probabilities agree with an independent Python erfc reference over both tails and the centre',()=>{
  const points=Array.from({length:321},(_,i)=>(i-160)/20);
  const expected=JSON.parse(execFileSync('python3',['-c','import math,json,sys; print(json.dumps([0.5*math.erfc(-z/math.sqrt(2)) for z in json.loads(sys.argv[1])]))',JSON.stringify(points)],{encoding:'utf8'}));
  for(let i=0;i<points.length;i++)near(normalCDF(points[i]),expected[i],8e-8);
  assert.equal(normalCDF(0),.5);assert.equal(normalCDF(-Infinity),0);assert.equal(normalCDF(Infinity),1);
});
test('the expected balance and lognormal median obey independent moment relationships',()=>{
  const d=defaults('wealthDistribution');
  for(const years of [1,20,40])for(const logVolatility of [0,10,15,35]) {
    const input={...d,years,logVolatility},p=wealthDistributionAt(input),sigma=logVolatility/100;
    near(p.mean,d.initial*1.05**years);
    near(p.mean/p.median,Math.exp(.5*sigma*sigma*years));
    near(p.low*p.high,p.median*p.median);near(p.q25*p.q75,p.median*p.median);
    if(sigma>0){near(wealthBelow(input,p.low),.05,1e-7);near(wealthBelow(input,p.q25),.25,1e-7);near(wealthBelow(input,p.median),.5,1e-7);near(wealthBelow(input,p.q75),.75,1e-7);near(wealthBelow(input,p.high),.95,1e-7);}
  }
});
test('default summary agrees with independently calculated published-example amounts',()=>{
  const input=defaults('wealthDistribution'),p=wealthDistributionAt(input);
  near(p.mean,132664.88525722112);near(p.median,105935.06253774276);near(p.low,35142.981726951264);near(p.high,319330.8286151798);
  near(wealthBelow(input,input.goal),.46575355514523176);
});
test('zero volatility is a point mass, includes lower range endpoints and counts equality as meeting the goal',()=>{
  const input={...defaults('wealthDistribution'),logVolatility:0,meanReturn:0,goal:50000},p=wealthDistributionAt(input);
  for(const key of ['low','q25','median','q75','high','mean'])near(p[key],50000);
  near(wealthBelow(input,50000),0);near(wealthBelow(input,50000.01),1);near(wealthBelow(input,0),0);
  const bins=wealthRangeProbabilities(input);assert.equal(bins.filter(b=>b.value===1).length,1);assert.equal(bins[3].value,1);
  assert.equal(wealthBelow(input,50000,0),0);assert.equal(wealthBelow(input,50001,0),1);
});
test('outcome ranges partition the complete distribution and preserve probability above the last boundary',()=>{
  const d=defaults('wealthDistribution');
  for(const logVolatility of [0,10,15,35])for(const goal of [1000,50000,100000,5000000]) {
    const input={...d,goal,logVolatility},bins=wealthRangeProbabilities(input);
    near(bins.reduce((n,b)=>n+b.value,0),1);assert.ok(bins.every(b=>b.value>=0&&b.value<=1));
    near(bins.at(-1).value,1-wealthBelow(input,2*goal));
    near(bins.slice(0,3).reduce((n,b)=>n+b.value,0),wealthBelow(input,goal));
  }
});
test('changing the comparison goal leaves the wealth distribution unchanged and creates no random sampling variation',()=>{
  const d=defaults('wealthDistribution');
  assert.deepEqual(wealthDistributionAt(d),wealthDistributionAt({...d,goal:5000000}));
  assert.deepEqual(planningResult('wealthDistribution'),planningResult('wealthDistribution'));
  const zeroMean=wealthDistributionAt({...d,meanReturn:0});near(zeroMean.mean,d.initial);assert.ok(zeroMean.median<d.initial);
  const atStart=wealthDistributionAt(d,0);for(const k of ['low','q25','median','q75','high','mean'])near(atStart[k],d.initial);
});
test('fan charts retain ordered values, semantic band descriptions and all five quantiles in their data table',()=>{
  const result=planningResult('wealthDistribution'),fan=result.charts[0];
  for(const width of [300,390,760,1000]) {
    const html=renderFigure(fan,width);assert.equal((html.match(/<polygon /g)||[]).length,2);
    assert.match(html,/5th percentile/);assert.match(html,/25th percentile/);assert.match(html,/75th percentile/);assert.match(html,/95th percentile/);
    assert.match(html,/role="img"/);assert.match(html,/not a prediction interval for an entire investment path/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
  }
  const malformed={...fan,rows:[{x:0,low:10,q25:9,median:12,q75:13,high:14}]};
  assert.throws(()=>renderFigure(malformed),/ordered/);
});
test('all supported input boundaries produce finite model probabilities, charts and accessible tables',()=>{
  const kind='wealthDistribution',d=defaults(kind),variants=[d];
  for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
  assert.equal(validInputs(kind,{...d,years:2.5}),false);
  for(const input of variants) {
    assert.equal(validInputs(kind,input),true);const result=planningResult(kind,input);
    const html=renderResult(result,300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
    assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);
    assert.ok(result.charts.every(c=>c.evidence==='Hypothetical probability model'));
    const probability=result.metrics[2][1];assert.ok(probability>=0&&probability<=1);
  }
});
