const issue=i=>i.cdbAfni+i.cdbChange<0?{message:'The tested change cannot take adjusted family net income below zero.',fields:['cdbChange','cdbAfni']}:i.cdbChangeWork&&i.cdbWork+i.cdbChange<0?{message:'A working-income change cannot take working income below zero.',fields:['cdbChange','cdbWork']}:null;
export const cdbIncomeDefinitions={cdbIncomeTest:{title:'Test the July 2026–June 2027 Canada Disability Benefit income test',inputIssue:issue,fields:[
 ['cdbFamily','Household on the benefit date (0 = single or spousal waiver · 1 = couple, partner not eligible · 2 = couple, both eligible)',0,0,2,1],
 ['cdbAfni','2025 adjusted family net income (CAD)',36000,0,150000,100],
 ['cdbWork','2025 working income included in it: employment, self-employment, taxable scholarships (CAD; combined for a couple)',8000,0,150000,100],
 ['cdbChange','Change in 2025 income to test (CAD; negative lowers it)',3000,-60000,60000,100],
 ['cdbChangeWork','The tested change is working income (1) or other income such as CPP disability or a pension (0)',1,0,1,1],
 ['cdbFactor','Indexing factor applied to the 2024 amounts (1.021 matches ESDC’s published 2026–27 amounts)',1.021,1,1.1,.0001]
]}};
export const cdbIncomeWholeKeys=['cdbFamily','cdbChangeWork'];
const r6=n=>Math.round(n*1e6)/1e6;
const money=n=>Math.round(r6(n)*100+1e-7)/100;
// Canada Disability Benefit Regulations (SOR/2025-35, as amended by SOR/2026-123) s. 6: amounts in 2024 dollars, multiplied by the indexing factor.
export const CDB_BASE={annual:2400,exemptSingle:10000,exemptCouple:14000,thresholdSingle:23000,thresholdCouple:32500,rate:.2,rateBoth:.1,lumpMonthly:20};
const B=CDB_BASE;
// Third Thursday of each month. July–December 2026 are listed on the Government of Canada benefits calendar; 2027 dates are computed from the same rule.
export const CDB_PAYMENT_DATES=['16 Jul 2026','20 Aug 2026','17 Sep 2026','15 Oct 2026','19 Nov 2026','17 Dec 2026','21 Jan 2027','18 Feb 2027','18 Mar 2027','15 Apr 2027','20 May 2027','17 Jun 2027'];
export const CDB_FAMILIES=['Single (or spousal waiver)','Couple · partner not eligible','Couple · both eligible'];
export function cdb({family=0,afni=0,work=0,factor=1.021}){
 const single=family===0,max=r6(B.annual*factor),cap=r6((single?B.exemptSingle:B.exemptCouple)*factor),threshold=r6((single?B.thresholdSingle:B.thresholdCouple)*factor),rate=family===2?B.rateBoth:B.rate;
 const exempt=Math.min(Math.max(0,work),cap),tested=r6(afni-exempt-threshold),reduction=r6(rate*Math.max(0,tested));
 const monthly=Math.max(0,money((max-reduction)/12)),annual=money(monthly*12),lump=monthly>0&&monthly<=B.lumpMonthly;
 const payments=lump?[annual,...Array(11).fill(0)]:Array(12).fill(monthly);
 return {max,cap,threshold,rate,exempt,tested,reduction:Math.min(reduction,max),monthly,annual,lump,payments,beneficiaries:family===2?2:1,household:money(annual*(family===2?2:1)),zero:r6(threshold+exempt+max/rate)};
}
const base=i=>({family:i.cdbFamily,afni:i.cdbAfni,work:i.cdbWork,factor:i.cdbFactor});
const cad=v=>'CAD '+v.toLocaleString('en-CA',{minimumFractionDigits:Number.isInteger(v)?0:2,maximumFractionDigits:2});
export function cdbIncomeResult(kind,i){
 if(kind!=='cdbIncomeTest')throw Error('Unknown Canada Disability Benefit illustration.');
 const h=base(i),now=cdb(h),after={...h,afni:h.afni+i.cdbChange,work:i.cdbChangeWork?h.work+i.cdbChange:h.work},tested=cdb(after);
 const diff=money(tested.household-now.household),both=h.family===2;
 const top=Math.max(80000,Math.ceil((Math.max(h.afni,after.afni,now.zero)+5000)/10000)*10000),xs=Array.from({length:161},(_,k)=>Math.round(k*top/160));
 const curve=(name,workAt,dash)=>({name,dash,rows:xs.map(x=>({x,value:cdb({...h,afni:x,work:workAt(x)}).monthly}))});
 const extra=Array.from({length:41},(_,k)=>k*500);
 const lost=asWork=>extra.map(x=>({x,value:money(now.household-cdb({...h,afni:h.afni+x,work:asWork?h.work+x:h.work}).household)}));
 const per=f=>cdb({...h,family:f});
 return {metrics:[
  [`Monthly CDB${both?' for each spouse':''}, July 2026–June 2027 (from the 2025 returns)`,now.monthly,'money',undefined,now.lump?'Monthly amount is CAD 20 or less, so the year is paid as one lump sum':`Maximum ${cad(money(now.max/12))} · reduced by ${cad(money(now.reduction/12))} a month`],
  [both?'Annual CDB for the couple (two beneficiaries)':'Annual CDB for the payment period',now.household,'money',undefined,now.annual?`${now.lump?'One payment on':'Twelve payments from'} ${CDB_PAYMENT_DATES[0]}`:'No entitlement at this income'],
  ['Annual CDB with the tested income change',tested.household,'money',undefined,`2025 AFNI ${cad(after.afni)} · working income ${cad(after.work)}`],
  ['Benefit change from the tested income change',diff,'money',undefined,i.cdbChange?`${(diff/-i.cdbChange*100).toFixed(1)} cents per dollar of ${i.cdbChangeWork?'working':'other'} income ${i.cdbChange<0?'removed':'added'}`:'No change entered'],
  ['2025 adjusted family net income at which the benefit reaches zero (working income as entered)',money(now.zero),'money']
 ],note:`Original illustration of the federal Canada Disability Benefit (CDB) allocation for the payment period July 2026 to June 2027, based on 2025 adjusted family net income (line 23600 for you and any cohabiting spouse or partner, less RDSP and UCCB income). It applies section 6 of the Canada Disability Benefit Regulations: CAD 2,400, the CAD 10,000 or 14,000 working-income exemption and the CAD 23,000 or 32,500 threshold are each multiplied by the indexing factor you enter (default ${h.factor}); the income above the threshold is reduced at 20%, or 10% for each spouse when both are beneficiaries; the monthly amount is rounded to the cent and an amount of CAD 20 or less a month is paid as one lump sum. ESDC publishes the 2026–27 maximum (CAD 204.20 a month) and exemptions (CAD 10,210 and 14,294) but not the indexed thresholds, so the thresholds here are derived. Eligibility (age 18–64, an approved Disability Tax Credit, filed 2025 returns, residence and status) is assumed. The one-time CAD 150 supplemental amount, provincial or territorial benefits, mid-year changes in marital status and retroactive payments are not modelled.`,charts:[
  {id:'cdb-income-curve',type:'line',unit:'money',title:'Monthly CDB for July 2026–June 2027 by 2025 adjusted family net income',unitLabel:`CAD per month${both?' per beneficiary':''}`,xLabel:'2025 adjusted family net income (CAD)',xUnit:'money',series:[curve('All income is working income',x=>x),curve('No working income',()=>0,true),curve(`Working income fixed at ${cad(h.work)}`,x=>Math.min(h.work,x))],note:`Original calculation for: ${CDB_FAMILIES[h.family]}. The full amount is paid until income after the working-income exemption passes the indexed threshold (derived CAD ${now.threshold.toLocaleString('en-CA')}); the gap between the lines is the exemption of up to ${cad(now.cap)}, which only working income can use.`},
  {id:'cdb-income-test',type:'waterfall',unit:'money',title:'The income test for this household: from 2025 income to the amount being reduced',rows:[{label:'2025 adjusted family net income',value:h.afni},{label:'Less exempt working income',value:-now.exempt},{label:'Less indexed income threshold',value:-money(now.threshold)}],totalLabel:'Income above the threshold (zero or less = full benefit)',note:`The amount above the threshold is multiplied by ${both?'10% for each spouse':'20%'} to give the annual reduction of ${cad(now.reduction)}. A negative total means income is below the threshold and the maximum is paid.`},
  {id:'cdb-payment-calendar',type:'groupbar',unit:'money',title:`Payments in the July 2026–June 2027 period${both?' (both spouses)':''}`,seriesNames:['2025 income as entered','With the tested change'],rowLabel:'Payment date',rows:CDB_PAYMENT_DATES.map((label,k)=>({label,values:[money(now.payments[k]*now.beneficiaries),money(tested.payments[k]*tested.beneficiaries)]})),note:'Payments go out on the third Thursday of each month. The July–December 2026 dates are on the Government of Canada benefits calendar; the 2027 dates are computed from the same rule and were not yet listed when reviewed. A monthly amount of CAD 20 or less is paid as one lump sum on the next payment date, shown here in July.'},
  {id:'cdb-family-types',type:'groupbar',unit:'money',title:'The same 2025 income and working income under each household type',seriesNames:['Monthly per beneficiary','Monthly for the household'],rowLabel:'Household',rows:[0,1,2].map(f=>{const r=per(f);return {label:CDB_FAMILIES[f],values:[r.monthly,money(r.monthly*r.beneficiaries)]};}),note:'Couples use the higher threshold and the larger combined exemption, but the income tested is the couple’s combined income. When both spouses are beneficiaries each benefit falls by 10 cents per dollar, so the household loses 20 cents in total. A spouse granted a filing waiver is treated as single.'},
  {id:'cdb-extra-income',type:'line',unit:'money',title:'Annual CDB lost as 2025 income rises from the entered level',unitLabel:'CAD per year for the household',xLabel:'Extra 2025 income (CAD)',xUnit:'money',series:[{name:'Extra income is working income',rows:lost(true)},{name:'Extra income is other income (e.g. CPP disability, pension, RRSP withdrawal)',rows:lost(false),dash:true}],note:`Original calculation from the entered household. Working income below the exemption cap (${cad(now.cap)}) costs nothing; after that both kinds of income cost the same ${both?'10 cents per spouse':'20 cents'} per dollar until the benefit reaches zero. RDSP payments are subtracted from adjusted family net income, so they are not on either line. Income tax and other income-tested benefits are not included.`}
 ]};
}
