import test from 'node:test';
import assert from 'node:assert/strict';
import {planningGuides} from '../src/planning-guides.js';
import {defaults,definitions,planningResult,validInputs} from '../src/planning-models.js';
import {renderFigure} from '../src/planning-charts.js';

const kind='cppPostRetirementIncrement';
test('PRB guide is unique, detailed and links distinct CPP reading',()=>{
 const guide=planningGuides.find(x=>x.planning===kind);
 assert.ok(guide);assert.equal(planningGuides.filter(x=>x.slug===guide.slug).length,1);
 assert.ok(guide.sections.reduce((n,x)=>n+x.html.length,0)>5000);
 assert.equal(new Set(guide.related).size,3);assert.equal(planningResult(kind,defaults(kind)).charts.length,5);
});
test('published 2025 employee contributions reconcile with age-65 2026 PRB',()=>{
 const d=defaults(kind),r=planningResult(kind,d);
 assert.equal(r.metrics[0][1],4430.10);assert.equal(r.metrics[1][1],4430.10);
 assert.equal(r.metrics[2][1],54.69);assert.equal(r.metrics[3][1],54.69);
 assert.equal(r.charts[0].rows[0].value,54.69);
 assert.equal(r.charts[2].rows[0].value+r.charts[2].rows[1].value,4430.10);
 assert.deepEqual(r.charts[2].rows.map(x=>x.value),[4034.10,396,4430.10,4430.10,8860.20]);
 assert.deepEqual(r.charts[3].rows.map(x=>x.value),[26.25,54.69]);
});
test('one full year is CAD 656.28 and simple gross crossover occurs in year seven',()=>{
 const r=planningResult(kind,defaults(kind));
 assert.equal(r.metrics[5][1],7);assert.equal(r.charts[1].series[0].rows[1].value,656.28);
 assert.equal(r.charts[1].series[0].rows[7].value,4593.96);
 assert.match(r.note,/not a personal break-even age/);
});
test('scenario shares scale both dated reference values without presenting a future forecast',()=>{
 const d={...defaults(kind),prbContributionShare:50,prbContributionYears:3,prbPaymentYears:20};
 assert.ok(validInputs(kind,d));const r=planningResult(kind,d);
 assert.equal(r.metrics[0][1],2215.05);assert.equal(r.metrics[2][1],27.35);assert.equal(r.metrics[3][1],82.05);
 assert.equal(r.charts[0].rows.length,3);assert.equal(r.charts[0].rows[2].value,27.35);
 assert.match(r.charts[0].note,/not observations for 2027–2030/);
});
test('zero contribution produces zero cash flows and no undefined crossover',()=>{
 const r=planningResult(kind,{...defaults(kind),prbContributionShare:0});
 assert.equal(r.metrics[5][3],'No crossover at zero contribution share');
 assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));
 for(const c of r.charts)assert.doesNotThrow(()=>renderFigure(c,320));
});
test('ranges, integer horizons and all chart tables are validated at desktop and mobile widths',()=>{
 const d=defaults(kind);
 for(const change of [{prbContributionShare:-1},{prbContributionShare:101},{prbContributionYears:0},{prbContributionYears:1.5},{prbPaymentYears:36},{prbPaymentYears:2.5}])assert.equal(validInputs(kind,{...d,...change}),false);
 for(const width of [1440,390,320])for(const c of planningResult(kind,d).charts){const html=renderFigure(c,width);assert.match(html,/plot-data/);assert.match(html,/<svg/);assert.doesNotMatch(html,/NaN|Infinity/);}
});
test('public evidence and age/payment limitations appear in the guide',()=>{
 const guide=planningGuides.find(x=>x.planning===kind),body=guide.sections.map(x=>x.html).join(' '),evidence=body+guide.sources.map(x=>x.url).join(' ');
 for(const url of ['https://www.canada.ca/en/services/benefits/publicpensions/cpp/cpp-post-retirement/benefit-amount.html','https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html','https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/calculating-deductions/making-deductions/second-additional-cpp-contribution-rates-maximums.html','https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/cpp/canada-pension-plan-cpp-contributions-cpp-working-beneficiaries.html','https://www.canada.ca/en/services/benefits/publicpensions/cpp/cpp-post-retirement/after-apply.html'])assert.ok(evidence.includes(url));
 assert.match(body,/January 1/);assert.match(body,/early April/);assert.match(body,/not a personal break-even age/);assert.match(body,/60 to 70/);
});
