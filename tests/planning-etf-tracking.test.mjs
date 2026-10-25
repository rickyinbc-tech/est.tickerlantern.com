import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {trackingWealth,trackingMonthlySample,trackingAttribution} from '../src/planning-etf-tracking-models.js';
import {renderResult,renderFigure,format} from '../src/planning-charts.js';
const kind='etfTrackingPlanning',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('the annual tracking difference is a signed difference of matched NAV and benchmark returns',()=>{
 const d=defaults(kind),p=trackingWealth(d,1);near(p.index,10800);near(p.fund,10772);near(p.difference,-28);near(p.cumulativeGap,-.0028);near(p.fundRate-p.indexRate,d.trackingGap/100);
 const positive=trackingWealth({...d,trackingGap:.28},1);near(positive.fund,10828);near(positive.difference,28);
});
test('repeated annual wealth includes the selected gap once without a second expense deduction',()=>{
 const d=defaults(kind),p=trackingWealth(d),result=planningResult(kind);let index=d.trackingPrincipal,fund=d.trackingPrincipal;
 for(let n=0;n<d.trackingYears;n++){index*=1.08;fund*=1.0772;}
 near(p.index,index);near(p.fund,fund);near(result.charts[0].series[0].rows.at(-1).value,fund);near(result.metrics[1][1],fund-index);near(p.cumulativeGap,(fund-index)/d.trackingPrincipal);
});
test('a zero annual gap gives identical wealth and every cumulative gap is zero',()=>{
 const d={...defaults(kind),trackingGap:0},result=planningResult(kind,d);assert.deepEqual(result.charts[0].series[0].rows,result.charts[0].series[1].rows);assert.ok(result.charts[1].rows.every(r=>r.value===0));near(result.metrics[1][1],0);
});
test('each cumulative row has its own horizon and is not an annualized return-gap label',()=>{
 const d={...defaults(kind),trackingYears:7},r=planningResult(kind,d);assert.deepEqual(r.charts[1].rows.map(row=>Number.parseInt(row.label)),[1,5,7,10,20,30]);
 for(const row of r.charts[1].rows)near(row.value,trackingWealth(d,Number.parseInt(row.label)).cumulativeGap);
 assert.notEqual(trackingWealth(d,10).cumulativeGap/10,d.trackingGap/100);
});
test('the four-month sample illustrates mean and variability without estimating real tracking error',()=>{
 const mean=a=>a.reduce((n,v)=>n+v,0)/a.length;near(mean(trackingMonthlySample.fundA),-.0002);near(mean(trackingMonthlySample.fundB),-.0002);assert.equal(new Set(trackingMonthlySample.fundA).size,1);assert.equal(new Set(trackingMonthlySample.fundB).size,2);
 const a=planningResult(kind),b=planningResult(kind,{...defaults(kind),trackingGap:1,trackingYears:30});assert.deepEqual(a.charts[2],b.charts[2]);assert.deepEqual(a.charts[3],b.charts[3]);near(trackingAttribution.reduce((n,r)=>n+r.value,0),-.0028);
});
test('percentage-point labels retain small active gaps and do not mislabel them as percentage returns',()=>{
 assert.equal(format(-.0002,'pp',true),'-0.02 pp');assert.equal(format(.001,'pp'), '0.10 pp');assert.equal(format(-.0028,'pp'),'-0.28 pp');
 const html=renderResult(planningResult(kind),300);assert.match(html,/-0\.02 pp/);assert.match(html,/percentage points<\/caption>/);assert.match(html,/-0\.28 pp/);
});
test('whole horizons and all field boundaries produce four finite chart/table pairs',()=>{
 const d=defaults(kind),fields=definitions[kind].fields;assert.equal(validInputs(kind,{...d,trackingYears:1.5}),false);
 const inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const r=planningResult(kind,input),p=trackingWealth(input);near((p.fund-p.index)/input.trackingPrincipal,p.cumulativeGap);assert.equal(r.charts.length,4);for(const width of [300,760]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,4);assert.equal((html.match(/<caption>/g)||[]).length,4);}}
});
test('the original tracking URL occurs once with all original sections and the distinct trade-cost link',async()=>{
 const {planningGuides}=await import('../src/planning-guides.js'),{guides}=await import('../src/research-guides.js');
 const matches=[...planningGuides,...guides].filter(g=>g.slug==='etf-tracking-difference-costs');assert.equal(matches.length,1);assert.equal(matches[0].planning,kind);assert.equal(matches[0].sections.length,8);
 assert.ok(matches[0].related.includes('etf-bid-ask-spread-order-commission-cash'));for(const id of ['three-returns','difference','error','explain','trading','compare'])assert.ok(matches[0].sections.some(s=>s.id===id));
 assert.match(matches[0].sections.find(s=>s.id==='cumulative-gap').html,/21,036\.01/);assert.match(matches[0].sections.find(s=>s.id==='error').html,/compound the active-return differences by themselves/);
});

test('a sub-one-point attribution uses its actual signed range rather than a one-unit minimum',()=>{
 const chart=planningResult(kind).charts[3],html=renderFigure(chart,300);
 const bars=[...html.matchAll(/<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="18"/g)].map(m=>({x:Number(m[1]),width:Number(m[3])}));
 assert.equal(bars.length,6);assert.ok(bars.at(-1).width>100,'the total must remain visibly comparable to its sub-one-point components');
 for(const bar of bars){assert.ok(bar.x>=64-1e-8);assert.ok(bar.x+bar.width<=280+1e-8);}
 assert.doesNotMatch(html,/99\.50 pp|24\.50 pp/);assert.match(html,/-0\.28 pp/);
});
