const issue=i=>i.cgebAfni+i.cgebChange<0?{message:'The tested change cannot take adjusted family net income below zero.',fields:['cgebChange','cgebAfni']}:null;
export const cgebYearDefinitions={cgebBenefitYear:{title:'Test the July 2026–June 2027 Canada Groceries and Essentials Benefit',inputIssue:issue,fields:[
 ['cgebMarried','Marital status on the benefit date (0 = single · 1 = spouse or common-law partner)',0,0,1,1],
 ['cgebChildren','Eligible children under 19 registered for the benefit (0–4)',0,0,4,1],
 ['cgebAfni','2025 adjusted family net income (CAD)',52000,0,120000,100],
 ['cgebChange','Change in 2025 adjusted family net income to test, e.g. a reassessment (CAD; negative lowers it)',-3000,-60000,60000,100]
]}};
export const cgebYearWholeKeys=['cgebMarried','cgebChildren'];
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
// July 2026–June 2027 (2025 base year): CRA payments chart dated 8 June 2026; every published row is reproduced by these parameters.
export const CGEB_2026={adult:445,partner:445,child:234,supplementMax:234,supplementFloor:11564,supplementRate:.02,threshold:46432,phaseOut:.05,lumpBelow:200};
const P=CGEB_2026;
export const CGEB_PAYMENT_DATES=['3 July 2026','5 October 2026','January 2027','April 2027'];
export function cgeb({married=0,children=0,afni=0}){
 const partner=married||children>0?P.partner:0,kids=Math.max(0,children-(married?0:1))*P.child;
 const supplement=married?0:children>0?P.supplementMax:Math.min(P.supplementMax,P.supplementRate*Math.max(0,afni-P.supplementFloor));
 const max=P.adult+partner+kids+supplement,reduction=Math.min(max,P.phaseOut*Math.max(0,afni-P.threshold));
 const annual=money(max-reduction);
 const quarters=annual<P.lumpBelow?[annual,0,0,0]:[0,1,2,3].map(()=>money(annual/4));
 return {adult:P.adult,partner,kids,supplement:money(supplement),max:money(max),reduction:money(reduction),annual,quarters,zero:P.threshold+(P.adult+partner+kids+(married?0:P.supplementMax))/P.phaseOut};
}
const base=i=>({married:i.cgebMarried,children:i.cgebChildren,afni:i.cgebAfni});
const fmt=v=>v.toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2});
export function cgebYearResult(kind,i){
 if(kind!=='cgebBenefitYear')throw Error('Unknown Canada Groceries and Essentials Benefit illustration.');
 const h=base(i),now=cgeb(h),tested=cgeb({...h,afni:h.afni+i.cgebChange}),diff=money(tested.annual-now.annual);
 const top=Math.max(90000,Math.ceil((Math.max(h.afni,h.afni+i.cgebChange)+5000)/10000)*10000),step=top/180;
 const xs=Array.from({length:181},(_,k)=>Math.round(k*step));
 const other={...h,married:h.married?0:1};
 const per=Array.from({length:Math.round(top/1000)+1},(_,k)=>{const x=k*1000,d=(cgeb({...h,afni:x+100}).annual-cgeb({...h,afni:x}).annual)/100;return {x,value:Math.round(d*1e4)/1e4};});
 const who=`${h.married?'Couple':'Single'}${h.children?` · ${h.children} child${h.children>1?'ren':''}`:' · no children'}`;
 const whoOther=`${other.married?'Couple':'Single'} · same children`;
 const steps=[{label:'Adult amount',value:now.adult}];
 if(now.partner)steps.push({label:h.married?'Spouse or partner amount':'Eligible-dependant amount (first child)',value:now.partner});
 if(now.kids)steps.push({label:`Other children (${Math.round(now.kids/P.child)} × CAD 234)`,value:now.kids});
 if(!h.married)steps.push({label:'Single supplement',value:now.supplement});
 steps.push({label:'5% income reduction',value:-now.reduction});
 return {metrics:[
  ['Annual benefit, July 2026–June 2027 (from the 2025 return)',now.annual,'money',`Maximum CAD ${fmt(now.max)} · reduced by CAD ${fmt(now.reduction)}`],
  [now.annual<P.lumpBelow?'Paid as one July 2026 lump sum (under CAD 50 a quarter)':'Each quarterly payment',now.annual<P.lumpBelow?now.annual:now.quarters[0],'money',now.annual?CGEB_PAYMENT_DATES.join(' · '):'No entitlement at this income'],
  ['Annual benefit with the tested income change',tested.annual,'money',`2025 AFNI CAD ${(h.afni+i.cgebChange).toLocaleString('en-CA')}`],
  ['Benefit change from the tested income change',diff,'money',i.cgebChange?`${(diff/-i.cgebChange*100).toFixed(1)} cents per dollar of income ${i.cgebChange<0?'removed':'added'}`:'No change entered'],
  ['Income at which the benefit reaches zero (derived)',money(now.zero),'money']
 ],note:'Original illustration of the federal Canada Groceries and Essentials Benefit (CGEB, formerly the GST/HST credit) for the payment period July 2026 to June 2027, based on 2025 adjusted family net income. Parameters are derived from the CRA payments chart dated 8 June 2026 (CAD 445 adult and spouse or eligible-dependant amounts, CAD 234 per other child, single supplement up to CAD 234 phased in at 2% above CAD 11,564, all reduced by 5% above CAD 46,432) and reproduce every row of that chart. Eligibility (age 19, residence, a filed 2025 return, a registered child) is assumed. Provincial and territorial programs paid with the benefit, the separately paid Ontario trillium benefit, shared custody, mid-year changes in marital status or children, and offsets against debts are not modelled. Quarterly amounts are the annual amount divided by four; CRA rounding can differ by a cent.',charts:[
  {id:'cgeb-income-curve',type:'line',unit:'money',title:'Annual CGEB for July 2026–June 2027 by 2025 adjusted family net income',unitLabel:'CAD per year',xLabel:'2025 adjusted family net income (CAD)',xUnit:'money',series:[{name:who,rows:xs.map(x=>({x,value:cgeb({...h,afni:x}).annual}))},{name:whoOther,rows:xs.map(x=>({x,value:cgeb({...other,afni:x}).annual})),dash:true}],note:`Original calculation from the CRA parameters. ${h.married?'':'For a single person with no children the supplement phases in at 2% above CAD 11,564. '}Every household type starts losing 5 cents per dollar above CAD 46,432; more children push the zero point higher, not the threshold.`},
  {id:'cgeb-build-up',type:'waterfall',unit:'money',title:'How the annual amount is built for this household',rows:steps,totalLabel:'Annual benefit',note:'Single parents receive the eligible-dependant amount (equal to the spouse amount) for the first child plus the full single supplement, which is why a single parent with one child and a couple with one child have the same CAD 1,124 maximum.'},
  {id:'cgeb-quarters',type:'groupbar',unit:'money',title:'Quarterly payments under the entered and tested 2025 income',seriesNames:['2025 income as entered','With the tested change'],rowLabel:'Payment',rows:CGEB_PAYMENT_DATES.map((label,k)=>({label,values:[now.quarters[k],tested.quarters[k]]})),note:'The CRA pays on the 5th of July, October, January and April, or the last business day before when the 5th falls on a weekend or federal holiday; July 2026 was paid on 3 July and October 2026 on 5 October. The January and April 2027 dates were not yet listed on the CRA page reviewed. An annual amount under CAD 200 (less than CAD 50 a quarter) is paid in full in July.'},
  {id:'cgeb-marginal',type:'line',unit:'percent',title:'Benefit added or removed per extra dollar of 2025 adjusted family net income',unitLabel:'Change in annual benefit per extra dollar',xLabel:'2025 adjusted family net income (CAD)',xUnit:'money',series:[{name:who,rows:per,step:true}],note:'Positive values are the 2% single-supplement phase-in; negative values are the 5% reduction. Measured over CAD 100 steps, so the kinks show partial rates. Income tax and other income-tested benefits are not included.'},
  {id:'cgeb-official-quarters',type:'groupbar',unit:'billions',title:'Official GST/HST credit amounts paid by quarter, July 2025–June 2026',unitLabel:'CAD billions',seriesNames:['Amount paid'],rowLabel:'Quarter',rows:[{label:'Jul–Sep 2025',values:[1.725951]},{label:'Oct–Dec 2025',values:[1.713124]},{label:'Jan–Mar 2026',values:[1.708322]},{label:'Apr–Jun 2026',values:[4.698827]}],source:'https://www.canada.ca/en/revenue-agency/services/child-family-benefits/benefits-statistics/goods-services-tax-harmonized-sales-tax-credit-statistics-july-2025-june-2026.html',sourceLabel:'CRA · GST/HST credit statistics, July 2025–June 2026 (page dated 19 October 2026)',note:'Official CRA year-to-date totals, including related provincial and territorial program payments, rounded to the nearest thousand dollars; total CAD 9,846,224,000 in 54,827,530 payments. The CRA table does not separate the one-time top-up, but the April–June 2026 quarter covers its 5 June 2026 issue date and has about twice as many payments (22,270,170) as the other quarters. Figures are subject to revision.'}
 ]};
}
