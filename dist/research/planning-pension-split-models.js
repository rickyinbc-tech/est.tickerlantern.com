const issue=i=>i.pspOasA>i.pspOtherA?{message:'OAS included for the transferring spouse cannot exceed that spouse’s other income.',fields:['pspOasA']}
 :i.pspOasB>i.pspOtherB?{message:'OAS included for the receiving spouse cannot exceed that spouse’s other income.',fields:['pspOasB']}:null;
export const pensionSplitDefinitions={pensionSplitElection:{title:'Test a pension income splitting election with 2026 federal rules',inputIssue:issue,fields:[
 ['pspPensionA','Transferring spouse · eligible pension income (CAD)',70000,0,300000,500],
 ['pspOtherA','Transferring spouse · other income incl. CPP and OAS (CAD)',25000,0,300000,500],
 ['pspOasA','OAS included in that other income (CAD)',9150,0,12000,50],
 ['pspPensionB','Receiving spouse · own eligible pension income (CAD)',0,0,300000,500],
 ['pspOtherB','Receiving spouse · other income incl. CPP and OAS (CAD)',16000,0,300000,500],
 ['pspOasB','OAS included in that other income (CAD)',9150,0,12000,50],
 ['pspSplit','Share of eligible pension allocated (%)',50,0,50,1]
]}};
export const pensionSplitWholeKeys=['pspPensionA','pspOtherA','pspOasA','pspPensionB','pspOtherB','pspOasB','pspSplit'];
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
// 2026 federal anchors: CRA current-year rates page, TD1-WS (26), Service Canada OAS recovery-tax table.
const BRACKETS=[[58523,.14],[117045,.205],[181440,.26],[258482,.29],[Infinity,.33]];
const CREDIT_RATE=.14,AGE_MAX=9208,AGE_BASE=46432,PENSION_MAX=2000,OAS_THRESHOLD=95323;
export function bracketTax(income){
 let tax=0,lower=0;
 for(const [upper,rate] of BRACKETS){if(income<=lower)break;tax+=(Math.min(income,upper)-lower)*rate;lower=upper;}
 return tax;
}
export const basicPersonal=ni=>ni<=181440?16452:ni>=258482?14829:16452-(ni-181440)*1623/77042;
export const ageAmount=ni=>Math.max(0,AGE_MAX-.15*Math.max(0,ni-AGE_BASE));
export function personTax(ni,eligiblePension,oas){
 const gross=bracketTax(ni),personal=CREDIT_RATE*(basicPersonal(ni)+ageAmount(ni)),pension=CREDIT_RATE*Math.min(PENSION_MAX,eligiblePension);
 const unused=Math.max(0,personal+pension-gross),recovery=Math.min(oas,.15*Math.max(0,ni-OAS_THRESHOLD));
 return {ni,gross,personal,pension,unused,basic:gross-personal-pension+unused,recovery,total:gross-personal-pension+unused+recovery};
}
export function household(i,pct){
 const moved=i.pspPensionA*pct/100;
 const a=personTax(i.pspPensionA-moved+i.pspOtherA,i.pspPensionA-moved,i.pspOasA);
 const b=personTax(i.pspPensionB+moved+i.pspOtherB,i.pspPensionB+moved,i.pspOasB);
 const sum=k=>a[k]+b[k];
 return {moved,a,b,gross:sum('gross'),personal:sum('personal'),pension:sum('pension'),unused:sum('unused'),basic:sum('basic'),recovery:sum('recovery'),total:sum('total')};
}
export function pensionSplitResult(kind,i){
 if(kind!=='pensionSplitElection')throw Error('Unknown pension splitting illustration.');
 const none=household(i,0),chosen=household(i,i.pspSplit);
 const grid=Array.from({length:51},(_,p)=>({p,h:household(i,p)}));
 const best=grid.reduce((m,g)=>g.h.total<m.h.total-.005?g:m,grid[0]);
 const delta=k=>money(chosen[k]-none[k]);
 const nets=h=>[money(h.a.ni),money(h.b.ni)];
 return {metrics:[
  ['Elected split amount at selected share',money(chosen.moved),'money'],
  ['Household federal tax + OAS recovery · no split',money(none.total),'money'],
  ['Household federal tax + OAS recovery · selected split',money(chosen.total),'money'],
  ['Illustrative federal saving at selected split',money(none.total-chosen.total),'money'],
  ['Smallest whole-percent split reaching the lowest modelled cost',best.p,'number',`${best.p}% · saving CAD ${money(none.total-best.h.total).toLocaleString('en-CA',{minimumFractionDigits:2,maximumFractionDigits:2})}`]
 ],note:'Original federal-only illustration for the 2026 tax year using CRA’s 2026 federal brackets (14%, 20.5%, 26%, 29%, 33%), the 2026 basic personal amount (CAD 16,452 phasing to CAD 14,829 between CAD 181,440 and CAD 258,482), the 2026 age amount (CAD 9,208 reduced by 15% of net income above CAD 46,432), the CAD 2,000 federal pension income amount and the 2026-income OAS recovery threshold of CAD 95,323. Both spouses are assumed to be 65 or older on 31 December 2026, resident in Canada and not separated. Net income equals the entered income; there are no other deductions or credits, no provincial tax, and no dividend, capital-gain or foreign-income rules. OAS recovery for 2026 income is collected through the return and later OAS payments; it is counted here in one total. The result is not tax advice or a filing calculation.',charts:[
  {id:'pension-split-cost-curve',type:'line',unit:'money',title:'Household federal cost at each allocation percentage',unitLabel:'CAD · federal tax and OAS recovery, both spouses',xLabel:'Share of eligible pension allocated (%)',series:[{name:'Federal tax + OAS recovery',rows:grid.map(g=>({x:g.p,value:money(g.h.total)}))},{name:'Federal tax only',rows:grid.map(g=>({x:g.p,value:money(g.h.basic)})),dash:true}],note:`Original calculation at every whole percentage from 0% to the 50% legal maximum. The lowest point in this model is ${best.p}%. A flat stretch means the two spouses face the same combined marginal effect, so moving more income does not change the total.`},
  {id:'pension-split-net-incomes',type:'groupbar',unit:'money',title:'Net income of each spouse before and after the election',seriesNames:['Transferring spouse','Receiving spouse'],rowLabel:'Allocation',rows:[{label:'No split · 0%',values:nets(none)},{label:`Selected · ${i.pspSplit}%`,values:nets(chosen)},{label:`Lowest-cost · ${best.p}%`,values:nets(best.h)}],note:'The elected amount is deducted on line 21000 by the transferring spouse and added on line 11600 by the receiving spouse, so household net income is unchanged. Only its distribution between the two returns moves.'},
  {id:'pension-split-bridge',type:'waterfall',unit:'money',title:'Where the selected split changes the federal bill',rows:[{label:'No-split household tax + recovery',value:money(none.total)},{label:'Bracket tax on the moved income',value:delta('gross')},{label:'Basic personal and age amounts',value:money(-(chosen.personal-none.personal))},{label:'Pension income amount',value:money(-(chosen.pension-none.pension))},{label:'Credits that could not be used',value:delta('unused')},{label:'OAS recovery tax',value:delta('recovery')}],totalLabel:'Selected-split household tax + recovery',note:'Negative steps lower the household bill. Credits are valued at the 14% federal credit rate for 2026; unused credits are non-refundable and cannot create a refund. Rounded steps reconcile to the total within one cent.'},
  {id:'pension-split-2026-brackets',type:'bar',unit:'percent',title:'2026 federal marginal rates by taxable-income band',rowLabel:'Taxable income band',rows:[{label:'Up to CAD 58,523',value:.14},{label:'CAD 58,523–117,045',value:.205},{label:'CAD 117,045–181,440',value:.26},{label:'CAD 181,440–258,482',value:.29},{label:'Over CAD 258,482',value:.33}],source:'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html',sourceLabel:'CRA · 2026 federal rates and brackets',note:'Official CRA federal rates for the 2026 tax year. Provincial or territorial rates are added on top and are not modelled.'},
  {id:'pension-split-income-markers',type:'bar',unit:'money',title:'Official 2026 net-income markers where splitting can change credits or clawbacks',rowLabel:'2026 federal marker',rows:[{label:'Age amount starts to shrink',value:46432},{label:'First federal bracket ends',value:58523},{label:'OAS recovery starts (2026 income)',value:95323},{label:'Age amount fully eliminated',value:107819},{label:'Second federal bracket ends',value:117045},{label:'Basic personal amount starts to shrink',value:181440}],source:'https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/recovery-tax.html',sourceLabel:'Service Canada OAS recovery tax · CRA TD1-WS (26)',note:'Thresholds published by CRA (TD1-WS 2026 worksheet, current-year bracket page) and Service Canada (recovery-tax table, July 2027–June 2028 payment period). The age-amount and OAS markers apply to net income; bracket markers apply to taxable income, which is the same number in this simplified model.'}
 ]};
}
