import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, definitions, validInputs, planningResult } from '../src/planning-models.js';
import { sensitivityGoal, sensitivityCases } from '../src/planning-sensitivity-models.js';
import { renderFigure, renderResult } from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('the saving formula matches an independently iterated month-end ledger at zero, negative and positive returns',()=>{
 const d=defaults('planningSensitivity');for(const rate of [-5,0,3,10])for(const years of [1,5,15]){
  const input={...d,rate,years},p=sensitivityGoal(input),r=(1+rate/100)**(1/12)-1;let balance=input.starting;
  for(let month=1;month<=years*12;month++)balance=balance*(1+r)+input.monthly;
  near(p.balance,balance);near(p.target,50000*1.04**years);near(p.gap,p.target-balance);
  near(sensitivityGoal({...input,monthly:p.requiredMonthly}).gap,0);
 }
 const p=sensitivityGoal(d);near(p.target,60832.64512000001);near(p.balance,43883.22171322073);near(p.gap,16949.42340677928);near(p.requiredMonthly,762.452321822189);
});
test('lower and higher input endpoints keep their identity even when their output effects reverse direction',()=>{
 const d=defaults('planningSensitivity'),p=sensitivityCases(d),saving=p.ranges.find(r=>r.key==='monthly'),quote=p.ranges.find(r=>r.key==='currentCost');
 near(saving.lowInput,375);near(saving.highInput,625);assert.ok(saving.low>0&&saving.high<0);assert.ok(quote.low<0&&quote.high>0);
 for(const r of p.ranges){near(r.low,sensitivityGoal({...d,[r.key]:r.lowInput}).gap-p.baseline.gap);near(r.high,sensitivityGoal({...d,[r.key]:r.highInput}).gap-p.baseline.gap);}
});
test('reducing the tested quote range changes its sensitivity spread and ordering without changing the baseline',()=>{
 const d=defaults('planningSensitivity'),a=planningResult('planningSensitivity',d),b=planningResult('planningSensitivity',{...d,quoteRange:0});assert.deepEqual(a.metrics,b.metrics);
 assert.equal(a.charts[0].rows[0].label,'Current project quote');assert.equal(b.charts[0].rows.at(-1).label,'Current project quote');near(b.charts[0].rows.at(-1).low,0);near(b.charts[0].rows.at(-1).high,0);
 const rows=a.charts[0].rows;for(let i=1;i<rows.length;i++)assert.ok(Math.abs(rows[i-1].high-rows[i-1].low)>=Math.abs(rows[i].high-rows[i].low)-1e-8);
});
test('combined changes reconcile sequentially and differ from adding one-input effects to the baseline',()=>{
 const d=defaults('planningSensitivity'),p=sensitivityCases(d);near(p.baseline.gap+p.steps.reduce((sum,r)=>sum+r.value,0),p.combined.gap);
 near(p.combined.gap,sensitivityGoal({...d,currentCost:60000,costGrowth:6,monthly:375,rate:1,years:4}).gap);near(p.combined.gap,46987.17768573097);
 near(p.baseline.gap+p.standaloneSum,50737.61927060926);assert.ok(Math.abs(p.combined.gap-p.baseline.gap-p.standaloneSum)>3000);
});
test('two-input cells and the deposit curve describe their labelled inputs and the required deposit is zero when already funded',()=>{
 const d=defaults('planningSensitivity'),r=planningResult('planningSensitivity',d);near(r.charts[2].rows[1].values[1],sensitivityGoal(d).gap);
 for(const row of r.charts[1].series[0].rows)near(row.value,sensitivityGoal({...d,monthly:row.x}).gap);
 near(sensitivityGoal({...d,starting:200000}).requiredMonthly,0);assert.ok(sensitivityGoal({...d,starting:200000}).gap<0);
});
test('tornado geometry supports reversed, equal, positive and negative endpoints with complete data and redundant markers',()=>{
 const chart={id:'sensitivity-test',type:'tornado',title:'Tested sensitivity',unit:'money',rows:[{label:'Reversed',low:200,high:-100,lowLabel:'CAD 10',highLabel:'CAD 20'},{label:'Zero',low:0,high:0,lowLabel:'0%',highLabel:'0%'}]};
 const html=renderFigure(chart,300);assert.match(html,/Lower tested input/);assert.match(html,/Higher tested input/);assert.match(html,/not confidence intervals/);assert.match(html,/fill="white"/);assert.match(html,/CAD 10/);assert.doesNotMatch(html,/NaN|Infinity|undefined/);
 assert.doesNotMatch(renderFigure({...chart,rows:[chart.rows[1]]},300),/NaN|Infinity|undefined/);
 assert.throws(()=>renderFigure({...chart,rows:[{...chart.rows[0],low:NaN}]},300),/finite/);
});
test('the integer horizon and all field limits retain finite four-figure results, including bounded stress endpoints',()=>{
 const kind='planningSensitivity',d=defaults(kind),variants=[d];assert.equal(validInputs(kind,{...d,years:1.5}),false);
 for(const [key,,,min,max] of definitions[kind].fields)for(const value of [min,max])variants.push({...d,[key]:value});
 for(const input of variants){assert.equal(validInputs(kind,input),true);const p=sensitivityCases(input);for(const r of p.ranges){assert.ok(Number.isFinite(r.low)&&Number.isFinite(r.high));if(r.key==='years')assert.ok(r.lowInput>=1&&r.highInput<=15);}
 const html=renderResult(planningResult(kind,input),300);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.equal((html.match(/<figure /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}
});
