import { oeptcGross, otbParameters } from './planning-otb-components-models.js';

export const oshptgDefinitions={
  oshptgGrant:{title:'Ontario senior homeowners’ property tax grant beside the senior OEPTC: what a homeowner aged 64 or older receives, when the grant reduces the credit, and what extra income costs',fields:[
    ['ogCouple','Married or living common-law on 31 December 2025 (1 = yes, 0 = single, separated, divorced or widowed)',0,0,1,1],
    ['ogIncome','Adjusted family net income for 2025 (CAD)',42000,0,120000,500],
    ['ogPropTax','Property tax paid for 2025 on your Ontario principal residence, your share (CAD)',3600,0,20000,50],
    ['ogExtra','Extra 2025 income you are weighing, such as a larger RRIF withdrawal (CAD)',5000,0,40000,500],
    ['ogTaxRate','Assumed income tax rate on that extra income (%)',20,0,55,.5]
  ]}
};
export const oshptgWholeKeys=['ogCouple'];

// Ontario.ca, Senior Homeowners' Property Tax Grant (updated 2 January 2026) and CRA, OSHPTG Questions and Answers
// (page details 2026-01-20): the 2026 grant is applied for on the 2025 return (Form ON-BEN, line 61120). Maximum =
// lesser of CAD 500 and eligible property tax paid for 2025, reduced by 3.33% of adjusted (family) net income over
// CAD 35,000 (single) or CAD 45,000 (couple); nil at CAD 50,000 or 60,000 or more. Applicant (or spouse) 64 or older,
// Ontario resident, owning and occupying the principal residence on 31 December 2025. One grant per couple. Non-taxable.
export const oshptgRules={max:500,rate:.0333,threshold:{single:35000,couple:45000},cutoff:{single:50000,couple:60000},firstYearAtMax:2010};

// Statistics Canada, table 18-10-0005-01, Consumer Price Index, annual average, not seasonally adjusted, All-items,
// Ontario, 2002=100 (released 2026-01-19; archive SHA-256 9b52900a…e8e0a, same file as planning-cpi-level-data.js).
export const ontarioCpi={table:'18-10-0005-01',url:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000501',released:'2026-01-19',
  rows:[[2010,116.5],[2011,120.1],[2012,121.8],[2013,123.0],[2014,125.9],[2015,127.4],[2016,129.7],[2017,131.9],[2018,135.0],[2019,137.5],[2020,138.4],[2021,143.2],[2022,152.9],[2023,158.7],[2024,162.5],[2025,165.6]]};

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const cents=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',minimumFractionDigits:2,maximumFractionDigits:2});
const pos=x=>Math.max(0,x);
const kTick=v=>v===0?'0':(v/1e3)+'k';

export function oshptgAmount(income,propTax,couple){
  const R=oshptgRules,k=couple?'couple':'single';
  if(income>=R.cutoff[k])return 0;
  return pos(Math.min(R.max,pos(propTax))-R.rate*pos(income-R.threshold[k]));
}

// Senior OEPTC for a homeowner (no rent, long-term care, reserve energy or student residence), CRA 2026 sheets for
// single seniors and married or common-law seniors with no children. Step 5 applies when an OSHPTG is received:
// A = Step 4 + grant; B = A − Step 2 (energy component), not below zero; C = B − Step 1 (occupancy cost), not below zero;
// annual OEPTC = Step 4 − C. So the grant and the OEPTC together never exceed property tax plus the energy component.
export function seniorHomeowner(income,propTax,couple){
  const P=otbParameters.oeptc,o=oeptcGross(0,propTax,true);
  const reduction=P.reduction*pos(income-P.senior.threshold[couple?'family':'single']);
  const step4=pos(o.gross-reduction),grant=oshptgAmount(income,propTax,couple);
  const cut=pos(pos(step4+grant-o.energy)-o.occ),oeptc=step4-cut;
  return {occ:o.occ,energy:o.energy,property:o.property,gross:o.gross,reduction,step4,grant,cut,oeptc,total:grant+oeptc};
}

export function oshptgResult(kind,input){
  if(kind!=='oshptgGrant')throw Error('Unknown senior grant topic');
  const couple=input.ogCouple===1,I=input.ogIncome,P=input.ogPropTax,X=input.ogExtra,tr=input.ogTaxRate/100,R=oshptgRules;
  const k=couple?'couple':'single',who=couple?'couple':'single senior';
  const b=seniorHomeowner(I,P,couple),a=seniorHomeowner(I+X,P,couple);
  const lostGrant=b.grant-a.grant,lostCredit=b.oeptc-a.oeptc,tax=X*tr,kept=X-tax-lostGrant-lostCredit;
  const incomes=Array.from({length:141},(_,j)=>j*500);
  const taxes=Array.from({length:121},(_,j)=>j*50);
  const extras=[1000,2500,5000,10000,15000,20000];
  const cpi0=ontarioCpi.rows[0][1],cpiN=ontarioCpi.rows.at(-1)[1],infl=cpiN/cpi0;
  const gridIncome=couple?[30000,40000,45000,50000,55000,60000,70000]:[25000,30000,35000,40000,45000,50000,60000],gridTax=[1000,2000,3000,5000,8000];
  const threshold=R.threshold[k],oeThreshold=otbParameters.oeptc.senior.threshold[couple?'family':'single'];
  const step5=b.cut>0?`Step 5 removes ${cents(b.cut)} of the OEPTC, because the grant and the credit together would otherwise exceed your property tax plus the ${cents(b.energy)} energy component.`:'Step 5 removes nothing: the grant and the credit together stay below your property tax plus the energy component.';
  return {metrics:[
    ['2026 senior homeowners’ property tax grant (one payment)',b.grant,'money'],
    ['2026 OEPTC before Step 5 (Step 4)',b.step4,'money'],
    ['OEPTC removed by Step 5 because of the grant',b.cut,'money'],
    ['2026 OEPTC after Step 5 (paid with the Ontario trillium benefit)',b.oeptc,'money'],
    ['Grant and OEPTC together',b.total,'money'],
    [`Grant and OEPTC lost if 2025 income is ${money(X)} higher`,lostGrant+lostCredit,'money'],
    ['Left from that extra income after the assumed tax and lost payments',kept,'money'],
    ['Share of the extra income lost to tax and the two payments',X>0?(X-kept)/X:0,'percent']
  ],
  note:`For a ${who} aged 64 or older with ${money(I)} of 2025 adjusted ${couple?'family ':''}net income and ${money(P)} of 2025 property tax, the 2026 grant is ${cents(b.grant)} (the lesser of CAD 500 and the tax, less 3.33% of income over ${money(threshold)}) and the OEPTC is ${cents(b.step4)} before Step 5. ${step5} Together: ${cents(b.total)}. Adding ${money(X)} of income would cost ${cents(lostGrant)} of grant and ${cents(lostCredit)} of OEPTC, plus ${money(tax)} of tax at the assumed ${input.ogTaxRate}%, leaving ${money(kept)}. Estimates from Ontario and CRA rules for the 2026 grant and the July 2026 to June 2027 OEPTC; the Ontario sales tax credit, the Northern Ontario energy credit, rent, long-term care and federal benefits that also depend on income are not included.`,
  charts:[
    {id:'og-income',type:'line',evidence:'Rules applied to hypothetical incomes',unit:'money',title:`Grant and senior OEPTC by 2025 adjusted ${couple?'family ':''}net income, with ${money(P)} of property tax`,xLabel:'Adjusted net income for 2025 (CAD)',xTicks:[0,20000,40000,60000].map(v=>({value:v,label:kTick(v)})),series:[
      {name:'Senior homeowners’ property tax grant',rows:incomes.map(x=>({x,value:seniorHomeowner(x,P,couple).grant}))},
      {name:'Senior OEPTC after Step 5',rows:incomes.map(x=>({x,value:seniorHomeowner(x,P,couple).oeptc}))},
      {name:'Grant and OEPTC together',rows:incomes.map(x=>({x,value:seniorHomeowner(x,P,couple).total}))}],
      note:`The grant falls by 3.33 cents per dollar of income over ${money(threshold)} and is nil from ${money(R.cutoff[k])}. The OEPTC falls by 2 cents per dollar over ${money(oeThreshold)}, an amount that is indexed, unlike the grant’s. Where both are falling, between ${money(Math.max(threshold,oeThreshold))} and ${money(R.cutoff[k])}, each extra dollar of income costs 5.33 cents of the two payments before any income tax. Your income, ${money(I)}: together ${cents(b.total)}.`},
    {id:'og-proptax',type:'line',evidence:'Rules applied to hypothetical property tax',unit:'money',title:`Where Step 5 bites: grant and OEPTC by property tax paid for 2025, at ${money(I)} of income`,xLabel:'Property tax paid for 2025 (CAD)',xTicks:[0,2000,4000,6000].map(v=>({value:v,label:kTick(v)})),series:[
      {name:'OEPTC before Step 5',dash:true,rows:taxes.map(x=>({x,value:seniorHomeowner(I,x,couple).step4}))},
      {name:'OEPTC after Step 5',rows:taxes.map(x=>({x,value:seniorHomeowner(I,x,couple).oeptc}))},
      {name:'Senior homeowners’ property tax grant',rows:taxes.map(x=>({x,value:seniorHomeowner(I,x,couple).grant}))},
      {name:'Grant and OEPTC together',rows:taxes.map(x=>({x,value:seniorHomeowner(I,x,couple).total}))}],
      note:`Step 5 only matters when the property tax is small. The grant can never be more than the tax, and the OEPTC is then cut so that the two together do not exceed the tax plus the energy component (at most CAD 290). The gap between the dashed and solid OEPTC lines is the amount removed; it closes once the tax is large enough, which CRA notes is the case for most seniors. With ${money(P)} of tax: ${b.cut>0?cents(b.cut)+' removed':'nothing removed'}.`},
    {id:'og-extra',type:'stackbar',evidence:'Rules applied to hypothetical extra income',unit:'money',title:`What happens to extra 2025 income starting from ${money(I)}`,rowLabel:'Extra income',seriesNames:['Kept','Income tax at the assumed rate','Grant lost','OEPTC lost'],rows:extras.map(x=>{const c=seniorHomeowner(I+x,P,couple),g=b.grant-c.grant,o=b.oeptc-c.oeptc,t=x*tr;return {label:`${money(x)} more`,values:[x-t-g-o,t,g,o]};}),
      note:`Each bar is the extra income, split into what is left after the assumed ${input.ogTaxRate}% income tax and after the smaller 2026 grant and OEPTC. The tax rate is an input, not a calculation: it leaves out the age amount, OAS recovery tax, GIS and other income-tested amounts, which can add more. Moving a withdrawal from 2025 to another year moves this effect, it does not remove it; the grant and the OEPTC for 2027 are based on 2026 income.`},
    {id:'og-cpi',type:'line',evidence:'Official statistics and fixed rule amounts',unit:'money',title:'The CAD 500 maximum, fixed since 2010, against what CAD 500 of 2010 buys in later Ontario prices',xLabel:'Year (annual average CPI)',xMin:2010,xTicks:[2010,2015,2020,2025].map(v=>({value:v,label:String(v)})),series:[
      {name:'Maximum grant (CAD 500)',dash:true,rows:ontarioCpi.rows.map(([y])=>({x:y,value:R.max}))},
      {name:'CAD 500 of 2010 in that year’s prices',rows:ontarioCpi.rows.map(([y,v])=>({x:y,value:R.max*v/cpi0}))}],
      source:ontarioCpi.url,sourceLabel:'Statistics Canada · Table 18-10-0005-01, Consumer Price Index, annual average, Ontario',
      note:`Ontario’s all-items CPI rose from ${cpi0} in 2010 to ${cpiN} in 2025 (2002=100), a ${((infl-1)*100).toFixed(1)}% increase. Keeping the 2010 purchasing power would take ${money(R.max*infl)} in 2025; CAD 500 in 2025 buys what ${money(R.max/infl)} did in 2010. The same arithmetic puts the CAD 35,000 single threshold at ${money(35000*infl)} and the CAD 45,000 couple threshold at ${money(45000*infl)} in 2025 prices. CRA states the CAD 500 maximum applies for 2010 and later years; the price index is an observation, the restated amounts are calculations.`},
    {id:'og-grid',type:'heatmap',evidence:'Rules applied to hypothetical households',unit:'money',title:`Grant and OEPTC together for a ${who}, by income and property tax`,rowLabel:'Adjusted net income for 2025',columns:gridTax.map(t=>`${money(t)} tax`),rows:gridIncome.map(y=>({label:money(y),values:gridTax.map(t=>seniorHomeowner(y,t,couple).total)})),
      note:`Each cell repeats the calculation for a ${who} who owns and lives in the home. Moving right adds property tax; the total stops rising once the OEPTC’s property tax component reaches its cap (CAD 1,198 at CAD 5,810 of tax) and the grant reaches CAD 500 less the income reduction. Moving down, the grant disappears at ${money(R.cutoff[k])}; the OEPTC continues further.`}
  ]};
}
