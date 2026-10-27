const issue=i=>i.ctcLimit+i.ctcUsed>ctcRules.maxBy2026?{message:'At most CAD 1,750 can have built up by 2026 (CAD 250 for each of 2020 to 2026), so your 2026 limit plus the credit you already claimed cannot be more than CAD 1,750.',fields:['ctcLimit','ctcUsed']}:null;
export const ctcClaimDefinitions={
  ctcClaim:{title:'Plan a Canada training credit claim: how much of your course fees come back, and whether waiting adds more',inputIssue:issue,fields:[
    ['ctcLimit','Canada training credit limit for 2026 on your latest notice of assessment (CAD)',1750,0,1750,250],
    ['ctcUsed','Canada training credit you already claimed for 2020 to 2025 (CAD)',0,0,1500,250],
    ['ctcAge','Your age at the end of 2026',40,26,65,1],
    ['ctcFee','Eligible fees paid to Canadian institutions in each study year (CAD)',3000,0,20000,250],
    ['ctcDelay','Years from 2026 until the course starts (0 = in 2026)',0,0,14,1],
    ['ctcYears','Consecutive calendar years of study',2,1,6,1],
    ['ctcAccrue','Meet CRA’s income test each year from 2026 (1 = yes, 0 = no)',1,0,1,1],
    ['ctcGrowth','Yearly change in the fees if the course starts later (%)',0,0,8,.5]
  ]}
};
export const ctcClaimWholeKeys=['ctcAge','ctcDelay','ctcYears','ctcAccrue'];

// Income Tax Act s. 122.91 (current to 2026-09-30): the limit for a year is nil unless the individual is at least 26 and
// under 66 at the end of it; otherwise it is the lesser of (A + B − C) and (5,000 − D). B is CAD 250 when, in the
// preceding year, the individual filed, was resident all year, had working income at or above the indexed threshold and
// income not above the top of the 26% bracket. The credit is the lesser of the limit and 50% of eligible fees on
// Schedule 11 line 1 (Canadian institutions and exams), and the tuition amount is reduced by the credit claimed
// (Schedule 11 line 6). 2026 federal lowest rate 14% (CRA current-year rates page, 2026-06-25).
export const ctcRules={perYear:250,lifetime:5000,firstYear:2020,maxBy2026:1750,minAge:26,endAge:66,share:.5,fedRate:.14,
  thresholds:[{year:2025,incomeYear:2024,work:11821,net:173205},{year:2026,incomeYear:2025,work:12058,net:177882}]};

// CRA Individual Income Tax Return Statistics, Table 2, item 102 (Canada Training Credit): returns and CAD thousands.
// Data as of 30 June 2024 (2022), 30 November 2024 (2023) and 30 November 2025 (2024); counts rounded to the nearest ten.
export const CTC_STATS={url:'https://www.canada.ca/content/dam/cra-arc/prog-policy/stats/t1-final-stats/2024-tax-year/tbl2_ac_en.pdf',
  years:[{year:2022,claims:646610,thousands:219782},{year:2023,claims:681680,thousands:245260},{year:2024,claims:643900,thousands:249406}],
  // 2024 tax year, CRA's 19 total-income ranges grouped into seven.
  bands:[['Under CAD 20,000',103650,39633],['CAD 20,000–39,999',130530,48809],['CAD 40,000–59,999',125370,48557],['CAD 60,000–79,999',104390,40315],['CAD 80,000–99,999',74020,29059],['CAD 100,000–149,999',81990,33369],['CAD 150,000 and over',23950,9666]]};

// Year-by-year limit, claim and tuition amount. The full available credit is claimed in each study year: a dollar of
// limit is worth the same refundable dollar whenever it is used, and unused limit lapses once the limit becomes nil.
export function ctcPlan(input,overrides={}){
  const i={...input,...overrides},R=ctcRules,first=2026,start=first+i.ctcDelay,last=start+i.ctcYears-1,g=i.ctcGrowth/100;
  let limit=i.ctcLimit,used=i.ctcUsed,claim=0;const rows=[];
  for(let y=first;y<=last+1;y++){
    const age=i.ctcAge+(y-first),inRange=age>=R.minAge&&age<R.endAge;
    if(y>first)limit=inRange?Math.min(limit+(i.ctcAccrue?R.perYear:0)-claim,R.lifetime-used):0;
    const study=y>=start&&y<=last,fee=study?i.ctcFee*Math.pow(1+g,y-first):0;
    claim=study?Math.min(limit,R.share*fee):0;
    const tuition=fee-claim;
    rows.push({year:y,age,limit,fee,claim,tuition,tuitionCredit:R.fedRate*tuition,study});
    used+=claim;
  }
  const s=rows.filter(r=>r.study),sum=k=>s.reduce((a,r)=>a+r[k],0);
  const fees=sum('fee'),ctc=sum('claim'),tuitionCredit=sum('tuitionCredit'),after=rows[rows.length-1];
  return {start,rows,study:s,fees,ctc,tuitionCredit,federal:ctc+tuitionCredit,without:R.fedRate*fees,gain:ctc*(1-R.fedRate),net:fees-ctc-tuitionCredit,limitAfter:after.limit,afterYear:after.year,used};
}

export function ctcClaimResult(kind,input){
  if(kind!=='ctcClaim')throw Error('Unknown Canada training credit topic');
  const R=ctcRules,p=ctcPlan(input),money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
  const first=p.study[0],L=first.limit,fee1=first.fee;
  const fees=Array.from({length:49},(_,k)=>k*250),sweep=fees.map(x=>{const c=Math.min(L,R.share*x);return {x,c,t:R.fedRate*(x-c)};});
  const starts=Array.from({length:11},(_,k)=>2026+k).filter(y=>y+input.ctcYears-1<=2026+(R.endAge-1-input.ctcAge)||y===2026);
  const byStart=starts.map(y=>({y,p:ctcPlan(input,{ctcDelay:y-2026})}));
  const late=p.study.filter(r=>r.age>=R.endAge).length;
  return {metrics:[['Canada training credit for the whole course (refundable)',p.ctc,'money'],['Federal tuition tax credit on the remaining fees, at 14%',p.tuitionCredit,'money'],['Total federal relief on the fees',p.federal,'money'],['Federal relief without the training credit',p.without,'money'],['Fees left after federal relief',p.net,'money'],[`Training credit limit left for ${p.afterYear}`,p.limitAfter,'money']],
  note:`Fees of ${money(p.fees)} over ${input.ctcYears} study year${input.ctcYears>1?'s':''} from ${p.start} earn ${money(p.ctc)} of Canada training credit, paid even if you owe no tax, and a 14% federal tuition credit of ${money(p.tuitionCredit)} on the ${money(p.fees-p.ctc)} left. Without the training credit the tuition credit alone would be worth ${money(p.without)}, so the training credit adds ${money(p.gain)}: each dollar of it replaces a dollar of fees that would otherwise earn 14 cents. ${input.ctcAccrue?'The limit grows by CAD 250 a year because the income test is assumed to be met every year.':'No CAD 250 is added after 2026 because the income test is assumed not to be met.'}${late?` ${late} study year${late>1?'s fall':' falls'} in or after the year you turn 66, when the limit is nil.`:''} The tuition credit is non-refundable: it is used only against federal tax, and any unused part carries forward or can be transferred. Provincial and territorial credits are not included.`,
  charts:[
    {id:'ctc-cra-claims',type:'bar',evidence:'Official tax statistics',title:'Returns claiming the Canada training credit, 2024 tax year, by total income',unit:'count',unitLabel:'Returns with a line 45350 claim · 2024 tax year',rows:CTC_STATS.bands.map(([label,n])=>({label,value:n})),source:CTC_STATS.url,sourceLabel:'CRA · Individual Income Tax Return Statistics, 2024 tax year, Table 2',note:'Data as of 30 November 2025; counts rounded to the nearest ten and grouped here from CRA’s 19 total-income ranges. In all, 643,900 returns claimed CAD 249.4 million, about CAD 387 a claim, well below the CAD 1,250 most anyone could have had for 2024. The average claim is between about CAD 374 and CAD 407 in every income group. Claims were 646,610 for 2022 and 681,680 for 2023. Income on a return is total income, not the net income used for the income test, and a return can claim the credit in a year above that test because the limit was built up earlier.'},
    {id:'ctc-timeline',type:'line',title:`Training credit limit and the amount claimed, ${2026} to ${p.afterYear}`,unit:'money',xLabel:'Tax year',xTicks:p.rows.filter((_,k)=>k%2===0||k===p.rows.length-1).map(r=>({value:r.year,label:String(r.year)})),series:[{name:'Limit available for the year',rows:p.rows.map(r=>({x:r.year,value:r.limit}))},{name:'Training credit claimed',dash:true,rows:p.rows.map(r=>({x:r.year,value:r.claim}))},{name:'Half of the eligible fees',rows:p.rows.map(r=>({x:r.year,value:R.share*r.fee}))}],note:`Each year the credit is the smaller of the limit and half of the fees. The next year’s limit is this year’s, plus CAD 250 if the income test is met, minus what was claimed, and never more than CAD 5,000 minus everything claimed before. The limit is nil in the year you turn 66 and after.`},
    {id:'ctc-fees',type:'line',title:`Federal relief on fees in ${first.year}, with a ${money(L)} limit`,unit:'money',xLabel:`Eligible fees paid to Canadian institutions in ${first.year} (CAD)`,xTicks:[0,2000,4000,6000,8000,10000,12000].map(v=>({value:v,label:money(v)})),series:[{name:'Canada training credit',rows:sweep.map(q=>({x:q.x,value:q.c}))},{name:'14% tuition credit on the rest',dash:true,rows:sweep.map(q=>({x:q.x,value:q.t}))},{name:'Total federal relief',rows:sweep.map(q=>({x:q.x,value:q.c+q.t}))}],note:`Up to ${money(2*L)} of fees, the training credit returns half of every dollar, and the tuition credit 14% of the other half: 57 cents in all. Above that the limit is used up and each extra dollar of fees earns only the 14% credit. ${fee1>2*L?`Your ${money(fee1)} is past that point.`:`Your ${money(fee1)} is below that point, so the whole half is refunded.`}`},
    {id:'ctc-start',type:'groupbar',unit:'money',title:'Federal relief for the same course started in different years',seriesNames:['Canada training credit','14% tuition credit on the rest'],rowLabel:'First study year',rows:byStart.map(q=>({label:String(q.y),values:[q.p.ctc,q.p.tuitionCredit]})),note:`Each year of waiting adds CAD 250 to the limit${input.ctcAccrue?'':' only if the income test is met; it is set to not met here'}, until the limit covers half of every year’s fees. ${input.ctcGrowth>0?`Fees rise ${input.ctcGrowth}% a year when the course starts later, which raises both the fees and the relief.`:'Fees are held constant, so later starts look cheaper than they would if fees rise.'} Waiting also delays whatever the course is for; the extra credit is rarely large enough to justify that alone. Start years are shown only while the whole course ends before the year you turn 66.`}
  ]};
}
