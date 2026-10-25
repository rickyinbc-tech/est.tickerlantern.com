import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,planningResult,validInputs} from '../src/planning-models.js';
import {fraudSource} from '../src/planning-fraud-data.js';
import {fraudComparison} from '../src/planning-fraud-models.js';
import {renderResult} from '../src/planning-charts.js';

test('CAFC source preserves rounded dollar amounts, dates, column grain and unavailable values',()=>{
 assert.equal(fraudSource.referenceYear,2025);assert.equal(fraudSource.issued,'2026-02-25');assert.equal(fraudSource.modified,'2026-02-25');assert.equal(fraudSource.retrieved,'2026-10-25');assert.match(fraudSource.sha256,/^[a-f0-9]{64}$/);
 assert.equal(fraudSource.rows.length,10);assert.deepEqual(fraudSource.rows[0],{label:'Investments',reports:4409,victims:3867,lossCAD:351000000,publishedLoss:'$351 M'});
 assert.equal(fraudSource.rows[1].label,'Spear phishing');assert.equal(fraudSource.rows[1].lossCAD,67900000);
 assert.deepEqual(fraudSource.notAvailableLosses.map(r=>r.lossCAD),[null,null,null]);
 for(const r of fraudSource.rows){assert.ok(r.reports>=r.victims&&r.victims>0);assert.ok(r.lossCAD>0);assert.match(r.publishedLoss,/ M$/);}
});
test('the row control takes a prefix of the loss ranking without modifying observations',()=>{
 const original=JSON.stringify(fraudSource);
 for(let n=3;n<=10;n++){
  const p=fraudComparison({fraudShow:n});assert.deepEqual(p.rows,fraudSource.rows.slice(0,n));
  assert.deepEqual(new Set(p.ratios.map(r=>r.label)),new Set(p.rows.map(r=>r.label)));
  assert.ok(p.rows.every((r,j)=>!j||r.lossCAD<=p.rows[j-1].lossCAD));
 }
 assert.equal(JSON.stringify(fraudSource),original);
});
test('derived ratios use victim counts and round to hundreds without implying medians',()=>{
 const p=fraudComparison(defaults('fraudReports'));
 for(const r of p.ratios){const raw=r.lossCAD/r.victims;assert.equal(r.lossPerVictim,Math.round(raw/100)*100);assert.ok(Math.abs(r.lossPerVictim-raw)<=50);}
 assert.equal(p.ratios[0].label,'Spear phishing');assert.equal(p.ratios[0].lossPerVictim,118900);
 assert.equal(p.ratios.find(r=>r.label==='Investments').lossPerVictim,90800);
 assert.ok(p.ratios.every((r,j)=>!j||r.lossPerVictim<=p.ratios[j-1].lossPerVictim));
});
test('official charts remain sourced and the headline retains its lower-bound language',()=>{
 const r=planningResult('fraudReports');assert.equal(r.charts.length,3);assert.equal(r.metrics[0][1],null);assert.equal(r.metrics[0][3],'More than $704 million');
 assert.ok(r.charts.every(c=>c.source===fraudSource.url&&c.sourceLabel.startsWith('Canadian Anti-Fraud Centre')));
 assert.equal(r.charts[2].evidence,'Derived from rounded reported statistics');
 assert.deepEqual(r.charts[1].rows.map(r=>r.label),r.charts[0].rows.map(r=>r.label));
});
test('every supported row count renders three source-backed charts and tables',()=>{
 assert.equal(validInputs('fraudReports',{fraudShow:4.5}),false);assert.equal(validInputs('fraudReports',{fraudShow:11}),false);
 for(let n=3;n<=10;n++){
  assert.ok(validInputs('fraudReports',{fraudShow:n}));const r=planningResult('fraudReports',{fraudShow:n});assert.equal(r.metrics[2][1],n);
  for(const width of [300,760]){const h=renderResult(r,width);assert.doesNotMatch(h,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((h.match(/<svg /g)||[]).length,3);assert.equal((h.match(/<caption>/g)||[]).length,3);assert.match(h,/More than \$704 million/);}
 }
});
