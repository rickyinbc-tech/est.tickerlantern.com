const issue=i=>i.metcEarnA>i.metcNetA+60000||i.metcEarnB>i.metcNetB+60000?{message:'Working income should not exceed net income by more than the RRSP, pension and other deductions it could plausibly carry.',fields:['metcEarnA','metcEarnB']}:!i.metcCouple&&(i.metcNetB||i.metcEarnB)?{message:'Set the second person’s income to zero for a single filer.',fields:['metcNetB','metcEarnB']}:null;
export const metcClaimDefinitions={metcClaimant:{title:'Test the 2026 medical expense tax credit: threshold, claimant and 12-month window',inputIssue:issue,fields:[
 ['metcCouple','Household (1 = spouses or common-law partners · 0 = single filer)',1,0,1,1],
 ['metcNetA','Person A 2026 net income, line 23600 (CAD)',70000,0,300000,100],
 ['metcEarnA','Person A employment income in it (CAD; drives the CPP, EI and employment-amount credits)',70000,0,300000,100],
 ['metcNetB','Person B 2026 net income (CAD; 0 for a single filer)',26000,0,300000,100],
 ['metcEarnB','Person B employment income in it (CAD)',20000,0,300000,100],
 ['metcExp','Eligible expenses for you, your spouse and children under 18 in the 12-month window (CAD)',4500,0,60000,50],
 ['metcDepExp','Eligible expenses for one other dependant, e.g. an adult child or parent (CAD)',1800,0,60000,50],
 ['metcDepNet','That dependant’s 2026 net income (CAD)',9000,0,150000,100]
]}};
export const metcClaimWholeKeys=['metcCouple'];
const r6=n=>Math.round(n*1e6)/1e6;
const money=n=>Math.round(r6(n)*100+1e-7)/100;
// CRA 2026 indexed amounts (indexation 2.0%) and T4127 January 2026 payroll formulas.
export const METC_2026={rate:.14,threshold:2890,pct:.03,rmesMax:1534,rmesEarn:4478,rmesFamily:33960,rmesRate:.25,rmesPhase:.05,bpaMax:16452,bpaMin:14829,bpaFrom:181440,bpaTo:258482,cea:1501,cppExempt:3500,ympe:74600,cppBase:.0495,eiRate:.0163,eiMie:68900};
export const METC_2025={threshold:2834,rmesMax:1504,rmesEarn:4390,rmesFamily:33294};
const M=METC_2026;
const BRACKETS=[[58523,.14],[117045,.205],[181440,.26],[258482,.29],[Infinity,.33]];
export function federalTax(net){let tax=0,low=0;for(const [top,rate] of BRACKETS){if(net>low)tax+=(Math.min(net,top)-low)*rate;low=top;}return r6(tax);}
export function bpa(net){return net<=M.bpaFrom?M.bpaMax:net>=M.bpaTo?M.bpaMin:r6(M.bpaMax-(M.bpaMax-M.bpaMin)*(net-M.bpaFrom)/(M.bpaTo-M.bpaFrom));}
// Federal tax left for the medical credit after the basic personal amount, Canada employment amount, base CPP and EI credits.
export function taxRoom(net,earn){
 const cpp=money(M.cppBase*Math.max(0,Math.min(earn,M.ympe)-M.cppExempt)),ei=money(M.eiRate*Math.min(earn,M.eiMie));
 const credits=money(M.rate*(bpa(net)+Math.min(M.cea,earn)+cpp+ei));
 return {gross:money(federalTax(net)),credits,cpp,ei,room:Math.max(0,money(federalTax(net)-credits))};
}
export const reduction=net=>money(Math.min(M.pct*Math.max(0,net),M.threshold));
export function allowable(exp,net,depExp=0,depNet=0){
 const own=Math.max(0,money(exp-reduction(net))),dep=Math.max(0,money(depExp-reduction(depNet)));
 return {own,dep,total:money(own+dep)};
}
export function rmes(total,earn,family){
 if(earn<M.rmesEarn||total<=0)return 0;
 return Math.max(0,money(Math.min(M.rmesMax,M.rmesRate*total)-M.rmesPhase*Math.max(0,family-M.rmesFamily)));
}
export function claim({net,earn,family,exp,depExp=0,depNet=0}){
 const a=allowable(exp,net,depExp,depNet),credit=money(M.rate*a.total),t=taxRoom(net,earn),used=Math.min(credit,t.room),sup=rmes(a.total,earn,family);
 return {...a,threshold:reduction(net),credit,room:t.room,used:money(used),lost:money(credit-used),rmes:sup,value:money(used+sup)};
}
export const METC_STATS={year:2024,asOf:'30 November 2025',url:'https://www.canada.ca/content/dam/cra-arc/prog-policy/stats/t1-final-stats/2024-tax-year/tbl2_ac_en.pdf',
 rows:[['Under 10k',3934160,279230,420187],['10k–20k',3453300,367630,880248],['20k–30k',4022830,782740,2117632],['30k–40k',2950090,863250,2523085],['40k–50k',2782710,824410,2666115],['50k–60k',2620060,735560,2537323],['60k–80k',3886400,852160,3098350],['80k–100k',2664330,442540,1875321],['100k–150k',3223120,395460,1910082],['150k–250k',1403640,176840,1131620],['250k+',623510,108220,1174106]],
 total:[31564160,5828020,20334070]};
const cad=v=>'CAD '+v.toLocaleString('en-CA',{minimumFractionDigits:Number.isInteger(v)?0:2,maximumFractionDigits:2});
export function metcClaimResult(kind,i){
 if(kind!=='metcClaimant')throw Error('Unknown medical expense credit illustration.');
 const couple=i.metcCouple===1,family=i.metcNetA+(couple?i.metcNetB:0),dep={depExp:i.metcDepExp,depNet:i.metcDepNet};
 const A=claim({net:i.metcNetA,earn:i.metcEarnA,family,exp:i.metcExp,...dep}),B=couple?claim({net:i.metcNetB,earn:i.metcEarnB,family,exp:i.metcExp,...dep}):null;
 const best=!B||A.value>=B.value?'A':'B',W=best==='A'?A:B,other=best==='A'?B:A,wNet=best==='A'?i.metcNetA:i.metcNetB,wEarn=best==='A'?i.metcEarnA:i.metcEarnB;
 const people=couple?[['Person A',A],['Person B',B]]:[['Person A',A]];
 const top=Math.max(10000,Math.ceil((i.metcExp+3000)/5000)*5000),xs=Array.from({length:81},(_,k)=>Math.round(k*top/80));
 const at=(net,earn,exp)=>claim({net,earn,family,exp,...dep}).value;
 // Window chart: the same total split between two calendar years, claimed either as one 12-month window or year by year.
 const split=Array.from({length:21},(_,k)=>k*5),total=i.metcExp;
 const yearByYear=s=>{const second=money(total*s/100),first=money(total-second);return money(claim({net:wNet,earn:wEarn,family,exp:first,...dep}).value+claim({net:wNet,earn:wEarn,family,exp:second}).value);};
 const famTop=80000,fx=Array.from({length:81},(_,k)=>k*1000);
 return {metrics:[
  [`Federal credit plus supplement, best claimant (${couple?'Person '+best:'single filer'})`,W.value,'money',undefined,`${cad(W.used)} non-refundable credit · ${cad(W.rmes)} refundable supplement`],
  ['Allowable medical expenses, line 33200, best claimant',W.total,'money',undefined,`Threshold ${cad(W.threshold)} · dependant line 33199 ${cad(W.dep)}`],
  couple?['Gain from the better claimant over the other spouse',money(W.value-other.value),'money',undefined,`Person ${best==='A'?'B':'A'} would get ${cad(other.value)}`]:['Refundable supplement included above',W.rmes,'money',undefined,W.rmes?'Paid even with no tax owing':'Not available at this income or working income'],
  ['Credit that cannot be used for lack of federal tax (best claimant)',W.lost,'money',undefined,`Federal tax left after basic credits ${cad(W.room)}`],
  ['Net income above which the threshold is the fixed CAD 2,890',money(M.threshold/M.pct),'money',undefined,'Below it the threshold is 3% of the claimant’s net income']
 ],note:`Original illustration of the 2026 federal medical expense tax credit (METC) and refundable medical expense supplement (RMES) for hypothetical households. Expenses on line 33099 are reduced by the lesser of 3% of the claimant’s net income and CAD 2,890; line 33199 expenses for another dependant are reduced by the lesser of 3% of that dependant’s net income and CAD 2,890. The total (line 33200) earns a 14% non-refundable federal credit, usable only against federal tax left after the basic personal amount, Canada employment amount and base CPP and EI credits, which are calculated from the employment income entered with 2026 payroll parameters (taxable income is taken to equal net income). The supplement is the lesser of CAD 1,534 and 25% of line 33200, reduced by 5% of family net income above CAD 33,960, for a claimant with at least CAD 4,478 of working income. Provincial and territorial credits, the disability supports deduction, other credits (age, pension, tuition, disability, donations), the top-up tax credit and Quebec abatement are left out, and all expenses are assumed to be eligible and receipted.`,charts:[
  {id:'metc-claimant-compare',type:'groupbar',unit:'money',title:'Who should claim: credit, supplement and wasted credit for each spouse',seriesNames:['Non-refundable credit used','Refundable supplement','Credit wasted (too little tax)'],rowLabel:'Claimant',rows:people.map(([label,r])=>({label,values:[r.used,r.rmes,r.lost]})),note:`Both spouses would claim the same ${cad(i.metcExp)} of family expenses and ${cad(i.metcDepExp)} for the dependant. The lower income gives the lower threshold, but only federal tax actually payable can absorb a non-refundable credit.`},
  {id:'metc-claim-waterfall',type:'waterfall',unit:'money',title:`From receipts to federal value for the best claimant (${couple?'Person '+best:'single filer'})`,rows:[{label:'Family expenses in the window',value:i.metcExp},{label:'Less 3% / CAD 2,890 threshold',value:-Math.min(i.metcExp,W.threshold)},{label:'Plus dependant expenses after their threshold',value:W.dep},{label:'Less the 86% that is not credited',value:-money(W.total-W.credit)},{label:'Less credit with no tax to absorb it',value:W.lost?-W.lost:0},{label:'Plus refundable supplement',value:W.rmes}],totalLabel:'Federal value of the claim',note:'Each CAD 1 of allowable expense is worth 14 cents of federal tax, if there is tax to reduce. Provincial credits add more at provincial rates and thresholds not modelled here.'},
  {id:'metc-expense-curve',type:'line',unit:'money',title:'Federal value as eligible family expenses rise',unitLabel:'CAD of federal credit plus supplement',xLabel:'Eligible family expenses in the 12-month window (CAD)',xUnit:'money',series:people.map(([label],k)=>({name:`${label} claims`,dash:k===1,rows:xs.map(x=>({x,value:k===0?at(i.metcNetA,i.metcEarnA,x):at(i.metcNetB,i.metcEarnB,x)}))})),note:'Nothing is credited until expenses pass the claimant’s threshold; each line then rises by 14 cents per dollar, plus up to 25 cents of supplement for an eligible lower-income family, and flattens where the claimant runs out of federal tax.'},
  {id:'metc-window-split',type:'line',unit:'money',title:'One 12-month window or two calendar-year claims for the same expenses',unitLabel:'CAD of federal value, best claimant',xLabel:'Share of the expenses paid in the second calendar year (%)',series:[{name:'Both bills inside one 12-month window ending in the second year',rows:split.map(x=>({x,value:W.value}))},{name:'Each calendar year claimed separately',dash:true,rows:split.map(x=>({x,value:yearByYear(x)}))}],note:`Original calculation: the ${cad(total)} of family expenses is paid in two years, within 12 months, and the dependant expenses fall in the first year. Choosing a window that captures both bills uses the threshold once; claiming year by year applies it twice and each year’s share must clear it alone. Income is held at 2026 levels in both years.`},
  {id:'metc-supplement-phase',type:'line',unit:'money',title:'Refundable supplement by family net income',unitLabel:'CAD of refundable supplement',xLabel:'Family net income (CAD)',xUnit:'money',series:[{name:`Allowable expenses ${cad(W.total)}`,rows:fx.map(x=>({x,value:rmes(W.total,Math.max(M.rmesEarn,wEarn),x)}))},{name:'Allowable expenses large enough for the CAD 1,534 maximum',dash:true,rows:fx.map(x=>({x,value:rmes(M.rmesMax/M.rmesRate,M.rmesEarn,x)}))}],note:`Assumes the claimant has at least ${cad(M.rmesEarn)} of working income. The maximum supplement ends at family net income of ${cad(money(M.rmesFamily+M.rmesMax/M.rmesPhase))}. This household’s family net income is ${cad(family)}.`},
  {id:'metc-cra-claims',type:'bar',evidence:'Official tax statistics',title:'Share of 2024 returns claiming medical expenses, by total income',unit:'percent',unitLabel:'Returns with an allowable medical expense amount ÷ all returns in the income range (%) · 2024 tax year',rows:METC_STATS.rows.map(([label,ret,n])=>({label,value:Math.round(n/ret*10000)/10000})),source:METC_STATS.url,sourceLabel:'CRA · Individual Income Tax Return Statistics, 2024 tax year, Table 2',note:'Data as of 30 November 2025; counts rounded to the nearest ten. One return per filer: a couple usually claims family expenses on one spouse’s return, so the share of households is higher than the share of returns. Ranges are total income assessed, grouped here from CRA’s 19 ranges. Average allowable amount per claiming return rises from about CAD 1,505 under CAD 10,000 to about CAD 10,849 at CAD 250,000 and over.'}
 ]};
}
