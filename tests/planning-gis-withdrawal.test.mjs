import test from 'node:test';
import assert from 'node:assert/strict';
import {planningGuides} from '../src/planning-guides.js';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {renderFigure} from '../src/planning-charts.js';

const kind='gisWithdrawalTiming';
test('GIS source/timing guide is unique, detailed and linked to existing reading',()=>{
 const guide=planningGuides.find(x=>x.planning===kind);
 assert.ok(guide);assert.equal(planningGuides.filter(x=>x.slug===guide.slug).length,1);
 assert.ok(guide.sections.reduce((n,x)=>n+x.html.length,0)>4500);
 assert.equal(guide.related.length,3);assert.equal(new Set(guide.related).size,3);
 assert.equal(planningResult(kind,defaults(kind)).charts.length,4);
});
test('dated official maxima and household income ceilings retain source values and units',()=>{
 const charts=planningResult(kind,defaults(kind)).charts;
 assert.deepEqual(charts[0].rows.map(x=>x.value),[1138.90,685.56,685.56,1138.90]);
 assert.deepEqual(charts[1].rows.map(x=>x.value),[23112,30528,42768,55392]);
 assert.match(charts[0].unitLabel,/October–December 2026/);
 assert.match(charts[1].note,/combined income/);
});
test('the selected annual income amount and TFSA federal benefit effect stay separate',()=>{
 const result=planningResult(kind,defaults(kind));
 assert.equal(result.metrics[0][1],12000);assert.equal(result.metrics[1][1],12000);assert.equal(result.metrics[2][1],0);
 assert.equal(result.metrics[3][3],'July 2026 – June 2027');assert.equal(result.metrics[4][1],13);
 assert.equal(result.charts[2].rows[0].value,12000);assert.equal(result.charts[2].rows[1].value,0);
 assert.match(result.note,/does not calculate the GIS income base/);
});
test('month-start intervals map January to 18 months and December to 7 months',()=>{
 const d=defaults(kind),r=planningResult(kind,d),rows=r.charts[3].series[0].rows;
 assert.equal(rows[0].value,18);assert.equal(rows.at(-1).value,7);
 assert.equal(rows.length,12);assert.equal(rows[5].label,'June');
 const dec=planningResult(kind,{...d,gisWithdrawalMonth:12});
 assert.equal(dec.metrics[3][3],'July 2026 – June 2027');assert.equal(dec.metrics[4][1],7);
});
test('supported boundaries remain finite with no fictitious GIS or tax estimate',()=>{
 for(const input of [
  {...defaults(kind),gisWithdrawalAmount:0,gisWithdrawalYear:2020,gisWithdrawalMonth:1},
  {...defaults(kind),gisWithdrawalAmount:100000,gisWithdrawalYear:2032,gisWithdrawalMonth:12}
 ]){
  assert.ok(validInputs(kind,input));const r=planningResult(kind,input);
  assert.equal(r.metrics[1][1],input.gisWithdrawalAmount);assert.equal(r.metrics[2][1],0);
  for(const chart of r.charts)assert.doesNotThrow(()=>renderFigure(chart,320));
 }
});
test('fractional years/months and out-of-range draws are rejected',()=>{
 const d=defaults(kind);
 for(const change of [{gisWithdrawalAmount:-1},{gisWithdrawalAmount:100001},{gisWithdrawalYear:2025.5},{gisWithdrawalMonth:0},{gisWithdrawalMonth:12.5}]){
  const input={...d,...change};assert.equal(validInputs(kind,input),false);
  assert.throws(()=>planningResult(kind,input));
 }
});
test('all charts render accessible table data at desktop and phone widths',()=>{
 const charts=planningResult(kind,defaults(kind)).charts;
 for(const width of [1440,390,320])for(const chart of charts){
  const html=renderFigure(chart,width);assert.match(html,/plot-data/);assert.match(html,/<svg/);assert.doesNotMatch(html,/NaN|Infinity/);
 }
});
test('RRSP and TFSA source rules and the review timing limitation remain visible in prose',()=>{
 const guide=planningGuides.find(x=>x.planning===kind),body=guide.sections.map(x=>x.html).join(' ');
 for(const s of ['https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4040/rrsps-other-registered-plans-retirement.html','https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/what.html','https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/while-receiving.html'])assert.ok(body.includes(s));
 assert.match(body,/July 2026/);assert.match(body,/not a dollar-for-dollar estimate/);assert.match(body,/current year/);
});
test('the public statistic is not presented as a guaranteed annual payment',()=>{
 const guide=planningGuides.find(x=>x.planning===kind),body=guide.sections.map(x=>x.html).join(' ');
 assert.match(body,/guaranteed annual payment/);assert.match(body,/should not be multiplied by twelve/);
});
