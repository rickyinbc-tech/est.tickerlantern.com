import test from 'node:test';
import assert from 'node:assert/strict';
import { estateAtDeath, taxablePath } from '../src/planning-estate-account-models.js';
import { defaults, planningResult } from '../src/planning-models.js';
import { planningGuides } from '../src/planning-guides.js';
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*tol,`${a} != ${b}`);

test('defaults match an independent 40-digit Decimal check',()=>{
 const d=defaults('estateAccount'),e=estateAtDeath(d);
 near(e.tfsa.heirs,415785.635882);near(e.rrif.heirs,228682.099735);near(e.rrif.tax,415785.635882*.45);
 near(e.taxable.value,379484.114033);near(e.taxable.lifeTax,26268.758624);near(e.gain,172928.964229);
 near(e.taxable.tax,38909.016951);near(e.taxable.probate,5692.261710);near(e.taxable.heirs,334882.835371);
});

test('named beneficiary, spouse rollover and edge cases',()=>{
 const d=defaults('estateAccount');
 const un=estateAtDeath({...d,esNamed:0});near(un.tfsa.probate+un.rrif.probate+un.taxable.probate,18165.830787);
 const sp=estateAtDeath({...d,esSpouse:1});assert.equal(sp.rrif.tax,0);near(sp.rrif.deferred+sp.taxable.deferred,187103.536147+38909.016951);
 const now=estateAtDeath({...d,esYears:0});near(now.taxable.tax,200000*.3*.45/2);assert.equal(taxablePath(d,0).length,1);
 const loss=estateAtDeath({...d,esReturn:-5,esCost:100});assert.equal(loss.taxable.tax,0);
 // With no distributions and a full cost base, the taxable account only pays tax on the gain at death.
 const flat=estateAtDeath({...d,esDist:0,esCost:100});near(flat.taxable.lifeTax,0);near(flat.gain,flat.tfsa.value-200000);
});

test('result renders four charts with finite values',()=>{
 const r=planningResult('estateAccount',defaults('estateAccount'));
 assert.equal(r.charts.length,4);assert.ok(r.metrics.every(m=>Number.isFinite(m[1])));
 near(r.charts[3].rows[2].values[1],0.8389634357713606,1e-9);
 assert.ok(planningGuides.some(g=>g.slug==='same-fund-at-death-tfsa-rrsp-rrif-taxable-account-what-heirs-receive'));
});
