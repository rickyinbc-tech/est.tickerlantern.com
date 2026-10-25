import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {buybackDilutionSnapshot} from '../src/planning-buyback-dilution-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {guides} from '../src/research-guides.js';
const kind='buybackDilutionPlanning',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('the original count and full-period EPS fixture reconciles100−6+2=96',()=>{
 const p=buybackDilutionSnapshot(defaults(kind));near(p.repurchased,6);near(p.endingShares,96);near(p.weightedShares,96);near(p.priorEPS,5);near(p.weightedEPS,500/96);near(p.epsChange,1/24);near(p.shareChange,-.04);
 const r=planningResult(kind);near(r.charts[0].rows.reduce((n,row)=>n+row.value,0),p.endingShares);
});
test('the new coherent equity assumption can fall per share while modeled EPS rises',()=>{
 const p=buybackDilutionSnapshot(defaults(kind));near(p.endingEquity,4700);near(p.beforeValue,50);near(p.afterValue,4700/96);near(p.valueChange,-1/48);assert.ok(p.epsChange>0&&p.valueChange<0);
 const r=planningResult(kind);near(r.charts[3].rows.reduce((n,row)=>n+row.value,0),p.endingEquity);assert.deepEqual(r.charts[2].rows.map(row=>row.value),[p.epsChange,p.valueChange]);
});
test('the time fraction changes period EPS without changing the ending snapshot',()=>{
 const d=defaults(kind),half=buybackDilutionSnapshot({...d,buybackPeriod:50}),end=buybackDilutionSnapshot({...d,buybackPeriod:0}),full=buybackDilutionSnapshot(d);near(half.weightedShares,98);near(half.weightedEPS,500/98);near(end.weightedShares,100);near(end.weightedEPS,5);
 for(const p of [half,end]){near(p.endingShares,full.endingShares);near(p.afterValue,full.afterValue);near(p.endingShareProxy,full.endingShareProxy);}
});
test('zero events are neutral and new issuance can exceed repurchases',()=>{
 const d=defaults(kind),zero=buybackDilutionSnapshot({...d,buybackCash:0,buybackIssued:0});near(zero.endingShares,100);near(zero.epsChange,0);near(zero.valueChange,0);
 const issue=buybackDilutionSnapshot({...d,buybackCash:0,buybackIssued:10});near(issue.endingShares,110);assert.ok(issue.epsChange<0&&issue.valueChange<0);near(issue.endingEquity,d.buybackEquity);
});
test('a pure repurchase at the initial assumed value per share is neutral for that value',()=>{
 const d=defaults(kind);for(const buybackCash of [0,100,300,500]){const p=buybackDilutionSnapshot({...d,buybackCash,buybackIssued:0,buybackPrice:d.buybackEquity/100});near(p.afterValue,p.beforeValue);}
 const cheaper=buybackDilutionSnapshot({...d,buybackIssued:0,buybackPrice:25}),dearer=buybackDilutionSnapshot({...d,buybackIssued:0,buybackPrice:100});assert.ok(cheaper.valueChange>0);assert.ok(dearer.valueChange<0);
});
test('the fixed grid substitutes price and issuance while timing only affects period EPS',()=>{
 const d=defaults(kind),r=planningResult(kind),timing=planningResult(kind,{...d,buybackPeriod:0});assert.deepEqual(r.charts[4],timing.charts[4]);
 for(let row=0;row<4;row++)for(let col=0;col<4;col++)near(r.charts[4].rows[row].values[col],buybackDilutionSnapshot({...d,buybackIssued:[0,2,5,10][row],buybackPrice:[25,50,75,100][col]}).valueChange);
});
test('all original cases stay separate and the canonical route remains unique',()=>{
 const matches=[...planningGuides,...guides].filter(g=>g.slug==='buybacks-dilution-per-share-value');assert.equal(matches.length,1);assert.equal(matches[0].planning,kind);assert.equal(matches[0].sections.length,9);
 const text=matches[0].sections.map(s=>s.html).join(' ');assert.match(text,/486\.5/);assert.match(text,/9\.60/);assert.match(text,/5,000/);assert.match(text,/separate original case/);assert.doesNotMatch(text,/whole company has fallen/);assert.ok(matches[0].sources.some(s=>s.url.includes('ias-33')));
});
test('numerical limits preserve pre-issuance shares, positive equity and five finite chart/table pairs',()=>{
 const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max])),{...d,buybackEquity:1000,buybackCash:500,buybackPrice:10,buybackIssued:0}];
 for(const input of inputs){const p=buybackDilutionSnapshot(input),r=planningResult(kind,input);assert.ok(p.repurchased<100&&p.endingShares>0&&p.weightedShares>0&&p.endingEquity>0);assert.equal(r.charts.length,5);for(const width of [300,760]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
});

test('the timing plot shows EPS percentage changes on a domain that retains both accretion and dilution',()=>{
 const d=defaults(kind);for(const input of [d,{...d,buybackPeriod:50},{...d,buybackCash:0,buybackIssued:20},{...d,buybackCash:0,buybackIssued:0}]){
  const p=buybackDilutionSnapshot(input),chart=planningResult(kind,input).charts[1];assert.equal(chart.unit,'percent');near(chart.series[0].rows[0].value,0);near(chart.series[0].rows.at(-1).value,p.endingShareProxy/p.priorEPS-1);near(chart.series[2].rows[0].value,p.epsChange);
  for(const row of chart.series.flatMap(s=>s.rows))assert.ok(row.value>=chart.yMin-1e-9&&row.value<=chart.yMax+1e-9);assert.ok(chart.yMax>chart.yMin);
 }
});
