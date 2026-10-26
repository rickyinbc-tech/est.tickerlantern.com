import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,validInputs,planningResult} from '../src/planning-models.js';
import {ukPensionLedger,ukPensionRules} from '../src/planning-uk-pension-models.js';
import {ukPensionGuides} from '../src/planning-uk-pension-guides.js';
import {planningGuides} from '../src/planning-guides.js';
import {format,renderResult} from '../src/planning-charts.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9,`${a} != ${b}`);

test('the band limits and contribution rates apply at every boundary',()=>{
 for(let earnings=0;earnings<=100000;earnings+=250){
  const p=ukPensionLedger({ukEarnings:earnings,ukEmployeeRate:5,ukEmployerRate:3});
  const qualifying=Math.max(0,Math.min(earnings,50270)-6240);
  near(p.qualifying,qualifying);near(p.employee,qualifying*.05);near(p.employer,qualifying*.03);
  near(p.total,qualifying*.08);near(p.afterContribution,earnings-qualifying*.05);
  assert.ok(p.employee>=0&&p.employer>=0&&p.afterContribution>=0);
 }
 assert.equal(ukPensionRules.bandLower,6240);assert.equal(ukPensionRules.bandUpper,50270);
 assert.equal(ukPensionRules.employeeMinimum,.05);assert.equal(ukPensionRules.employerMinimum,.03);
 for(const earnings of [0,6240,8000])near(ukPensionLedger({ukEarnings:earnings,ukEmployeeRate:5,ukEmployerRate:3}).qualifying,Math.max(0,earnings-6240));
 for(const earnings of [50270,60000,100000])near(ukPensionLedger({ukEarnings:earnings,ukEmployeeRate:5,ukEmployerRate:3}).qualifying,44030);
});

test('the default year reproduces the published band arithmetic',()=>{
 const d=defaults('ukPension'),p=ukPensionLedger(d),r=planningResult('ukPension',d);
 assert.deepEqual(d,{ukEarnings:35000,ukEmployeeRate:5,ukEmployerRate:3});
 near(p.qualifying,28760);near(p.employee,1438);near(p.employer,862.8);near(p.total,2300.8);
 near(p.effectiveTotal,2300.8/35000);near(p.netPayRelief,287.6);near(p.netPayCost,1150.4);
 near(p.reliefAtSourceOutlay,1150.4);near(p.governmentTopUp,287.6);near(p.reliefAtSourceClaim,0);
 near(p.reliefAtSourceCost,1150.4);near(p.reliefAtSourceCredit,1438);near(p.gap,0);
 assert.equal(Number(p.total.toFixed(2)),2300.8);assert.equal(Number(p.effectiveTotal*100).toFixed(2),'6.57');
 assert.deepEqual(r.charts.map(c=>c.id),['uk-pension-qualifying-band','uk-pension-take-home-cost','uk-pension-relief-at-source-bridge','uk-pension-relief-gap']);
 assert.deepEqual(r.metrics.map(([label,,unit])=>unit),['gbp','gbp','gbp','gbp']);
});

test('relief routes agree for basic-rate taxpayers but diverge below the Personal Allowance',()=>{
 const low=ukPensionLedger({ukEarnings:10000,ukEmployeeRate:5,ukEmployerRate:3});
 near(low.qualifying,3760);near(low.employee,188);near(low.employer,112.8);
 near(low.netPayRelief,0);near(low.netPayCost,188);near(low.reliefAtSourceOutlay,150.4);
 near(low.governmentTopUp,37.6);near(low.reliefAtSourceClaim,0);near(low.reliefAtSourceCost,150.4);near(low.gap,37.6);
 const atAllowance=ukPensionLedger({ukEarnings:12570,ukEmployeeRate:5,ukEmployerRate:3});
 near(atAllowance.employee,316.5);near(atAllowance.netPayCost,316.5);near(atAllowance.reliefAtSourceCost,253.2);near(atAllowance.gap,63.3);
 const basic=ukPensionLedger({ukEarnings:20000,ukEmployeeRate:5,ukEmployerRate:3});
 near(basic.netPayCost,basic.reliefAtSourceCost);near(basic.gap,0);
 for(const earnings of [20000,35000,50270]){const p=ukPensionLedger({ukEarnings:earnings,ukEmployeeRate:5,ukEmployerRate:3});near(p.gap,0);near(p.reliefAtSourceCredit,p.employee);}
 const partial=ukPensionLedger({ukEarnings:12600,ukEmployeeRate:5,ukEmployerRate:3});
 near(partial.employee,318);near(partial.netPayRelief,6);near(partial.netPayCost,312);near(partial.reliefAtSourceCost,254.4);near(partial.gap,57.6);near(partial.reliefAtSourceClaim,0);
 const converged=ukPensionLedger({ukEarnings:13000,ukEmployeeRate:5,ukEmployerRate:3});
 near(converged.employee,338);near(converged.netPayRelief,67.6);near(converged.reliefAtSourceClaim,0);near(converged.reliefAtSourceCost,270.4);near(converged.gap,0);
});

test('higher-rate relief arrives in two stages and the final cost is unchanged',()=>{
 const high=ukPensionLedger({ukEarnings:60000,ukEmployeeRate:5,ukEmployerRate:3});
 near(high.qualifying,44030);near(high.employee,2201.5);near(high.employer,1320.9);near(high.total,3522.4);
 near(high.netPayRelief,880.6);near(high.netPayCost,1320.9);
 near(high.reliefAtSourceOutlay,1761.2);near(high.governmentTopUp,440.3);near(high.reliefAtSourceClaim,440.3);
 near(high.reliefAtSourceCost,1320.9);near(high.gap,0);
 near(high.netPayCost,high.employee*.6);near(high.reliefAtSourceCredit,high.employee);
 const atCap=ukPensionLedger({ukEarnings:50270,ukEmployeeRate:5,ukEmployerRate:3});
 near(atCap.employee,high.employee);near(atCap.netPayRelief,440.3);near(atCap.netPayCost,1761.2);
 const zero=ukPensionLedger({ukEarnings:0,ukEmployeeRate:5,ukEmployerRate:3});
 near(zero.employee,0);near(zero.employer,0);near(zero.gap,0);near(zero.effectiveTotal,0);
});

test('the signed relief-gap grid recomputes every cell and is zero where tax covers the contribution',()=>{
 const d=defaults('ukPension'),grid=planningResult('ukPension',d).charts[3];
 assert.equal(grid.type,'heatmap');assert.equal(grid.signed,true);
 assert.deepEqual(grid.columns,['3%','5%','8%','12%']);
 assert.equal(grid.rows.length,6);
 grid.rows.forEach(row=>row.values.forEach((value,c)=>{
  const earnings=Number(row.label.replace(/[£,]/g,''));
  near(value,ukPensionLedger({...d,ukEarnings:earnings,ukEmployeeRate:[3,5,8,12][c]}).gap);
 }));
 grid.rows.slice(0,3).forEach(row=>assert.ok(row.values.every(v=>v>0)));
 grid.rows.slice(3).forEach(row=>assert.ok(row.values.every(v=>Math.abs(v)<1e-9)));
 grid.rows.slice(0,3).forEach(row=>{for(let c=1;c<4;c++)assert.ok(row.values[c]>row.values[c-1]);});
});

test('whole-pound earnings and bounded rates are the only accepted inputs',()=>{
 const d=defaults('ukPension');
 for(const value of [0.5,35000.5,NaN,Infinity,-1])assert.equal(validInputs('ukPension',{...d,ukEarnings:value}),false);
 for(const key of ['ukEmployeeRate','ukEmployerRate'])for(const value of [-0.5,20.5,NaN,Infinity])assert.equal(validInputs('ukPension',{...d,[key]:value}),false);
 assert.equal(validInputs('ukPension',{...d,ukEarnings:100000,ukEmployeeRate:0,ukEmployerRate:20}),true);
 assert.equal(validInputs('ukPension',{...d,ukEarnings:100001}),false);
 assert.equal(definitions.ukPension.fields.length,3);
});

test('sterling formatting never claims Canadian dollars',()=>{
 assert.equal(format(2300.8,'gbp'),'£2,300.8');assert.equal(format(-1500,'gbp'),'-£1,500');
 assert.equal(format(30000,'gbp',true),'£30k');assert.equal(format(1000000,'gbp',true),'£1.0m');
 assert.equal(format(1500,'money'),'$1,500');assert.equal(format(1500,'hkd'),'HK$1,500');
 const result=planningResult('ukPension',defaults('ukPension')),html=renderResult(result,900);
 assert.match(html,/Pounds sterling \(GBP\)/);assert.doesNotMatch(html,/Canadian dollars/);
});

test('the guide keeps eight sections, live companions and four finite accessible GBP charts',()=>{
 const slugs=new Set(planningGuides.map(g=>g.slug));
 const finite=value=>{if(typeof value==='number')assert.ok(Number.isFinite(value));else if(Array.isArray(value))value.forEach(finite);else if(value&&typeof value==='object')Object.values(value).forEach(finite);};
 assert.equal(ukPensionGuides.length,1);
 for(const g of ukPensionGuides){
  assert.equal(g.slug,'uk-workplace-pension-qualifying-earnings-tax-relief-route');assert.equal(g.planning,'ukPension');
  assert.equal(g.sections.length,8);assert.ok(g.related.every(s=>slugs.has(s)));
  assert.equal(g.sources.length,3);assert.ok(g.sources.every(s=>s.url.startsWith('https://')&&/25 October 2026/i.test(s.note)));
  assert.ok(g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').split(/\s+/).length>=1000);
  assert.match(g.sections.map(s=>s.html).join(' '),/£6,240/);assert.match(g.description,/pounds sterling/);
  const d=defaults(g.planning),fields=definitions[g.planning].fields;
  const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
  for(const input of inputs){
   assert.ok(validInputs(g.planning,input));const result=planningResult(g.planning,input);finite(result);
   assert.equal(result.charts.length,4);
   for(const width of [300,900]){const html=renderResult(result,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);assert.match(html,/£/);assert.doesNotMatch(html,/Canadian dollars/);}
  }
 }
});
