import test from 'node:test';
import assert from 'node:assert/strict';
import {taxableRealDefinitions as defs,taxableInterestLedger} from '../src/planning-taxable-real-models.js';
import {taxableRealGuides as guides} from '../src/planning-taxable-real-guides.js';
import {defaults,validInputs,planningResult} from '../src/planning-models.js';
import {planningGuides} from '../src/planning-guides.js';
import {renderFigure} from '../src/planning-charts.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('default first year credits gross interest, pays tax from the same balance and loses purchasing power',()=>{
  const p=taxableInterestLedger(defaults('taxableRealSavings')),first=p.rows[1];
  close(first.interest,2000);close(first.tax,800);close(first.balance,51200);close(first.realBalance,51200/1.03);
  close(p.afterTax,.024);close(p.realRate,1.024/1.03-1);close(p.breakEvenGross,.05);
  assert.ok(p.balance>50000&&p.realBalance<50000);assert.equal(p.rows.length,11);
});
test('taxed, before-tax and real paths agree with independent compound and geometric-sum formulas',()=>{
  const base=defaults('taxableRealSavings');
  for(const interestPrincipal of [1000,50000,1000000])for(const grossInterestRate of [0,4,10])for(const interestTaxRate of [0,40,60])for(const priceGrowth of [0,3,8])for(const interestYears of [1,10,30]){
    const q={...base,interestPrincipal,grossInterestRate,interestTaxRate,priceGrowth,interestYears},p=taxableInterestLedger(q),r=grossInterestRate/100,t=interestTaxRate/100,factor=1+r*(1-t),terminal=interestPrincipal*factor**interestYears;
    close(p.balance,terminal);close(p.realBalance,terminal/(1+priceGrowth/100)**interestYears);
    const interest=factor===1?interestPrincipal*r*interestYears:interestPrincipal*r*(factor**interestYears-1)/(factor-1);
    close(p.interestTotal,interest);close(p.taxTotal,interest*t);close(p.rows.at(-1).beforeTax,interestPrincipal*(1+r)**interestYears);
    close(interestPrincipal+p.interestTotal-p.taxTotal,p.balance);
    for(const row of p.rows.slice(1)){const previous=p.rows[row.x-1];close(previous.balance+row.interest-row.tax,row.balance);}
  }
});
test('zero tax unifies nominal paths, zero inflation unifies valuations and break-even preserves buying power',()=>{
  const q=defaults('taxableRealSavings'),noTax=taxableInterestLedger({...q,interestTaxRate:0});
  close(noTax.taxTotal,0);close(noTax.balance,noTax.rows.at(-1).beforeTax);
  const noInflation=taxableInterestLedger({...q,priceGrowth:0});close(noInflation.realBalance,noInflation.balance);close(noInflation.realRate,noInflation.afterTax);
  const breakEven=taxableInterestLedger({...q,grossInterestRate:5});close(breakEven.realRate,0);close(breakEven.realBalance,q.interestPrincipal);
  const p=taxableInterestLedger(q);assert.ok(p.rows.at(-1).beforeTax-p.balance>p.taxTotal);
});
test('annual rate matrix is independent of principal and horizon and decreases with tax and inflation',()=>{
  const q=defaults('taxableRealSavings'),a=planningResult('taxableRealSavings',q),b=planningResult('taxableRealSavings',{...q,interestPrincipal:1000,interestYears:30});
  assert.deepEqual(a.charts[3].rows,b.charts[3].rows);
  for(const row of a.charts[3].rows)for(let i=1;i<row.values.length;i++)assert.ok(row.values[i]<row.values[i-1]);
  for(let i=1;i<a.charts[3].rows.length;i++)for(let j=0;j<3;j++)assert.ok(a.charts[3].rows[i].values[j]<a.charts[3].rows[i-1].values[j]);
  close(a.charts[2].rows.reduce((s,r)=>s+r.value,0),taxableInterestLedger(q).balance);
});
test('whole years and declared boundaries are enforced and all supported edge cases render finite values',()=>{
  const base=defaults('taxableRealSavings'),fields=defs.taxableRealSavings.fields;
  assert.equal(validInputs('taxableRealSavings',{...base,interestYears:2.5}),false);assert.throws(()=>planningResult('taxableRealSavings',{...base,interestYears:2.5}));
  const variants=[base,Object.fromEntries(fields.map(f=>[f[0],f[3]])),Object.fromEntries(fields.map(f=>[f[0],f[4]])),...fields.flatMap(f=>[f[3],f[4]].map(v=>({...base,[f[0]]:v})))];
  for(const q of variants){assert.ok(validInputs('taxableRealSavings',q));const p=planningResult('taxableRealSavings',q);assert.equal(p.charts.length,4);assert.equal(new Set(p.charts.map(c=>c.id)).size,4);
    for(const c of p.charts)for(const width of [300,354,760]){const html=renderFigure(c,width);assert.doesNotMatch(html,/NaN|Infinity|undefined/);assert.match(html,/role="img"/);assert.match(html,/<table/);}
  }
});
test('taxable-interest guide is distinct, detailed and connected to existing planning guides',()=>{
  const slugs=new Set(planningGuides.map(g=>g.slug));assert.equal(slugs.size,planningGuides.length);
  for(const g of guides){assert.equal(g.sections.length,6);assert.ok(g.related.every(s=>slugs.has(s)));const count=g.sections.map(s=>s.html.replace(/<[^>]*>/g,' ')).join(' ').trim().split(/\s+/).length;assert.ok(count>=750,`${count} words`);assert.ok(slugs.has(g.slug));}
});
