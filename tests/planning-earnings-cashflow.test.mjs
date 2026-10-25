import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,definitions,planningResult} from '../src/planning-models.js';
import {earningsCashflowBridge,earningsCashflowFixture} from '../src/planning-earnings-cashflow-models.js';
import {renderResult} from '../src/planning-charts.js';
import {planningGuides} from '../src/planning-guides.js';
import {guides} from '../src/research-guides.js';
const kind='earningsCashflowPlanning',near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('the original indirect reconciliation produces operating100, definedFCF55 and closing60',()=>{
 const p=earningsCashflowBridge(defaults(kind));assert.deepEqual([p.operating,p.freeCash,p.cashChange,p.closing,p.afterMaintenance],[100,55,20,60,75]);assert.deepEqual([p.receivables,p.inventory,p.payables],[110,120,75]);near(p.workingCapitalUse,35);near(p.cashConversion,1);
 const r=planningResult(kind);near(r.charts[0].rows.reduce((n,row)=>n+row.value,0),p.operating);near(r.charts[2].rows.reduce((n,row)=>n+row.value,0),p.closing);
});
test('an independent direct-cash fixture reconciles collections, purchases and supplier payments',()=>{
 const sales=1000,costOfSales=600,otherExpensedCash=265,depreciation=25,shareCompensation=10,collections=sales-(110-80),purchases=costOfSales+(120-100),supplierCash=purchases-(75-60),netIncome=sales-costOfSales-otherExpensedCash-depreciation-shareCompensation;
 near(netIncome,100);near(collections,970);near(supplierCash,605);near(collections-supplierCash-otherExpensedCash,earningsCashflowBridge(defaults(kind)).operating);
});
test('stock increases and releases have the correct opposite cash signs',()=>{
 const d=defaults(kind),base=earningsCashflowBridge(d);for(const [key,effect] of [['earningsIncome',1],['earningsReceivables',-1],['earningsInventory',-1],['earningsPayables',1]]){const p=earningsCashflowBridge({...d,[key]:d[key]+1});near(p.operating-base.operating,effect);near(p.closing-base.closing,effect);}
 const flat=earningsCashflowBridge({...d,earningsReceivables:0,earningsInventory:0,earningsPayables:0}),release=earningsCashflowBridge({...d,earningsReceivables:-30,earningsInventory:-20,earningsPayables:-15});near(flat.operating,135);near(flat.freeCash,90);near(release.operating,170);
});
test('a maintenance relabeling changes the analytical amount without changing actual spending or cash',()=>{
 const d=defaults(kind),base=earningsCashflowBridge(d);for(const earningsMaintenance of [0,10,25,45]){const p=earningsCashflowBridge({...d,earningsMaintenance});near(p.afterMaintenance,base.operating-earningsMaintenance);near(p.freeCash,55);near(p.cashChange,20);near(p.closing,60);}
 const a=planningResult(kind),b=planningResult(kind,{...d,earningsMaintenance:45});for(const i of [0,1,2,4])assert.deepEqual(a.charts[i],b.charts[i]);assert.notDeepEqual(a.charts[3],b.charts[3]);
});
test('closing cash includes the operating subtotal and fixed financing once',()=>{
 const d=defaults(kind),p=earningsCashflowBridge(d),f=earningsCashflowFixture;near(p.cashChange,p.operating-f.cashCapex+f.newBorrowing-f.principalPaid-f.dividends);near(p.closing,f.openingCash+p.cashChange);near(p.freeCash-p.cashChange,35);
 const stress=earningsCashflowBridge({...d,earningsReceivables:90,earningsInventory:60});near(stress.operating,0);near(stress.freeCash,-45);near(stress.closing,-40);near(stress.unfunded,40);
});
test('zero or negative net income keeps the cash-conversion ratio unavailable',()=>{
 const d=defaults(kind);for(const earningsIncome of [0,-100]){const p=earningsCashflowBridge({...d,earningsIncome}),r=planningResult(kind,{...d,earningsIncome});assert.equal(p.cashConversion,null);assert.match(r.note,/ratio is unavailable/);assert.ok(Number.isFinite(p.operating));}
});
test('grid cells replace the named working-capital changes and do not add account stocks to cash',()=>{
 const d=defaults(kind),r=planningResult(kind);for(let row=0;row<4;row++)for(let col=0;col<4;col++)near(r.charts[4].rows[row].values[col],earningsCashflowBridge({...d,earningsInventory:[-100,0,20,60][row],earningsReceivables:[-80,0,30,90][col]}).closing);near(r.charts[4].rows[2].values[2],60);
});
test('the original route occurs once and its separate receivables example and other research remain intact',()=>{
 const matches=[...planningGuides,...guides].filter(g=>g.slug==='earnings-quality-cash-flow');assert.equal(matches.length,1);assert.equal(matches[0].planning,kind);assert.equal(matches[0].sections.length,8);
 assert.match(matches[0].sections.find(s=>s.id==='working-capital').html,/separate illustration/);assert.match(matches[0].sections.find(s=>s.id==='working-capital').html,/change of 70/);assert.match(matches[0].sources[0].note,/12 January 2014/);assert.equal(guides.filter(g=>g.slug==='buybacks-dilution-per-share-value').length,1);
});
test('all allowed boundaries retain nonnegative closing operating balances and five finite chart/table pairs',()=>{
 const d=defaults(kind),fields=definitions[kind].fields,inputs=[d,...fields.flatMap(([key,,,min,max])=>[{...d,[key]:min},{...d,[key]:max}]),Object.fromEntries(fields.map(([key,,,min])=>[key,min])),Object.fromEntries(fields.map(([key,,,,max])=>[key,max]))];
 for(const input of inputs){const p=earningsCashflowBridge(input),r=planningResult(kind,input);assert.ok(p.receivables>=0&&p.inventory>=0&&p.payables>=0);assert.equal(r.charts.length,5);for(const width of [300,760]){const html=renderResult(r,width);assert.doesNotMatch(html,/NaN|Infinity|>undefined<|="undefined"/);assert.equal((html.match(/<svg /g)||[]).length,5);assert.equal((html.match(/<caption>/g)||[]).length,5);}}
});
