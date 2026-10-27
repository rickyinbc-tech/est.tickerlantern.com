const issue=i=>i.tfxOut>i.tfxFirst?{message:'The withdrawal cannot be larger than the January contribution in this model, because nothing else is in the account.',fields:['tfxOut','tfxFirst']}:i.tfxBack>0&&i.tfxBackM<i.tfxOutM?{message:'Put the money back in the same month as the withdrawal or later.',fields:['tfxBackM','tfxOutM']}:i.tfxBack>0&&i.tfxFix>0&&i.tfxFix<i.tfxBackM?{message:'The month you take the excess out must be on or after the month you put the money back in (or 0 if you leave it in).',fields:['tfxFix','tfxBackM']}:null;
export const tfsaExcessDefinitions={
  tfsaExcess:{title:'Price a TFSA over-contribution: the 1% monthly tax, when to take the excess out, and what 1 January fixes',inputIssue:issue,fields:[
    ['tfxRoom','Your TFSA contribution room on 1 January 2026 (CAD)',7000,0,200000,500],
    ['tfxFirst','Contribution in January 2026 (CAD)',7000,0,200000,500],
    ['tfxOut','Withdrawal later in 2026 (CAD)',5000,0,200000,500],
    ['tfxOutM','Month of that withdrawal (1 = January 2026)',3,1,12,1],
    ['tfxBack','Amount put back in 2026 (CAD)',5000,0,200000,500],
    ['tfxBackM','Month you put it back (1 = January 2026)',7,1,12,1],
    ['tfxFix','Month you take the excess out (13 = January 2027; 0 = leave it in)',10,0,24,1],
    ['tfxNext','TFSA dollar limit assumed for 2027 (CAD; not yet announced)',7000,0,10000,500]
  ]}
};
export const tfsaExcessWholeKeys=['tfxOutM','tfxBackM','tfxFix'];

// Income Tax Act s. 207.01(1) (current to 2026-09-30): excess TFSA amount at a time in a year = A − B − C − D − E, where
// A is contributions made in the year so far, B is unused room at the end of the preceding year, C is the preceding year's
// withdrawals, D is the year's TFSA dollar limit and E is the qualifying portion of withdrawals made in the year so far.
// The qualifying portion of a withdrawal is the lesser of the withdrawal and the excess just before it, so a withdrawal
// made while there is no excess does not offset a later contribution in the same year. Unused room at year-end =
// B + C + D − A. Section 207.02: tax of 1% of the highest excess in each calendar month in which an excess exists.
// B + C + D for 2026 is the room on 1 January 2026 that CRA reports. 2026 dollar limit CAD 7,000; the 2027 limit was not
// announced when this was reviewed (27 October 2026).
export const tfsaExcessRules={rate:.01,limit2026:7000,cumulative2026:109000,
  limits:[[2009,5000],[2010,5000],[2011,5000],[2012,5000],[2013,5500],[2014,5500],[2015,10000],[2016,5500],[2017,5500],[2018,5500],[2019,6000],[2020,6000],[2021,6000],[2022,6000],[2023,6500],[2024,7000],[2025,7000],[2026,7000]]};

// CRA Tax-Free Savings Account Statistics, 2024 tax year (page details 2026-04-30), Table 1A by age group.
// Cells are rounded by CRA, so age groups can differ from the totals by a few tens.
export const TFSA_STATS={url:'https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/income-statistics-gst-hst-statistics/tax-free-savings-account-statistics/tax-free-savings-account-statistics-2024-tax-year.html',
  holders:19322830,contributed:10979910,maximized:1711020,withdrew:5685240,
  ages:[['Under 20',164910,36060,31540],['20 to 24',1027480,301930,67430],['25 to 29',1600020,546870,69270],['30 to 34',1861290,653240,71210],['35 to 39',1766240,590220,75160],['40 to 44',1614100,523310,76930],['45 to 49',1429870,453320,81450],['50 to 54',1378160,414340,104600],['55 to 59',1432000,406430,142620],['60 to 64',1653090,455600,205730],['65 to 69',1574020,427070,218860],['70 to 74',1332820,340240,193970],['75 to 79',1068420,243970,160060],['80 and over',1420420,292640,212190]]};

// Monthly ledger for January 2026 to December 2027. Events in a month are applied in a fixed order: the January
// contribution, the withdrawal, the re-contribution (so a withdrawal and re-contribution in the same month are in that
// order), then removal of the whole excess. The tax for a month uses the highest excess at any point in it, so the month in
// which the excess is removed is still taxed.
export function tfsaExcessPlan(input,overrides={}){
  const i={...input,...overrides},R=tfsaExcessRules,room=i.tfxRoom;
  let A=0,E=0,W=0,removed=0;const rows=[];let A26=0,W26=0,room27=0;
  const excess=()=>Math.max(0,A-room-E);
  for(let m=1;m<=24;m++){
    if(m===13){A26=A;W26=W;room27=room-A26+W26+i.tfxNext;A=0;E=0;W=0;}
    const base=m<=12?()=>Math.max(0,A-room-E):()=>Math.max(0,A-room27-E);
    let high=base();
    const contribute=x=>{A+=x;high=Math.max(high,base());};
    const withdraw=x=>{const q=Math.min(x,base());E+=q;W+=x;high=Math.max(high,base());return q;};
    if(m===1)contribute(i.tfxFirst);
    if(m===i.tfxOutM)withdraw(i.tfxOut);
    if(m===i.tfxBackM)contribute(i.tfxBack);
    if(m===i.tfxFix){const x=base();if(x>0){withdraw(x);removed+=x;}}
    rows.push({month:m,year:m<=12?2026:2027,high,end:base(),tax:R.rate*high});
  }
  const y26=rows.slice(0,12),y27=rows.slice(12),sum=(a,k)=>a.reduce((s,r)=>s+r[k],0);
  const tax26=sum(y26,'tax'),tax27=sum(y27,'tax'),months=rows.filter(r=>r.high>0).length;
  const left=rows[23].end;
  // Account balance (contributions less withdrawals, ignoring growth) and room carried to 1 January 2028.
  const balance=i.tfxFirst-i.tfxOut+i.tfxBack-removed;
  return {rows,tax26,tax27,tax:tax26+tax27,months,highest:Math.max(...rows.map(r=>r.high)),removed,left,room27:Math.max(0,room27),room27raw:room27,balance,A26,W26,firstMonth:(rows.find(r=>r.high>0)||{}).month||0};
}

const monthName=m=>['January','February','March','April','May','June','July','August','September','October','November','December'][(m-1)%12]+' '+(m<=12?2026:2027);

export function tfsaExcessResult(kind,input){
  if(kind!=='tfsaExcess')throw Error('Unknown TFSA excess topic');
  const p=tfsaExcessPlan(input),money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}),money2=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',minimumFractionDigits:2,maximumFractionDigits:2});
  const lo=input.tfxBack>0?Math.max(input.tfxBackM,p.firstMonth||1):Math.max(1,p.firstMonth),fixes=[...Array.from({length:25-lo},(_,k)=>lo+k),0];
  const byFix=fixes.map(f=>({f,p:tfsaExcessPlan(input,{tfxFix:f})}));
  const wait=tfsaExcessPlan(input,{tfxBack:0,tfxFix:0}),keep=tfsaExcessPlan(input,{tfxFix:0}),now=tfsaExcessPlan(input,{tfxFix:lo});
  const sheltered=q=>q.balance+Math.max(0,q.room27raw);
  const label=f=>f===0?'Left in':monthName(f).slice(0,3)+' ’'+(f<=12?'26':'27');
  const cases=[['Put back in January 2027 instead',wait],[`Removed in ${monthName(lo)}`,now],[input.tfxFix?`Removed in ${monthName(input.tfxFix)}`:'Your inputs (left in)',p],['Left in the account',keep]];
  const note=p.highest>0?`The ${p.firstMonth===1?'January contribution':monthName(p.firstMonth)+' contribution'} creates an excess of ${money(p.rows[p.firstMonth-1].high)}. The tax is 1% of the highest excess in each month it exists: ${p.months} month${p.months>1?'s':''} here, ${money2(p.tax26)} for 2026${p.tax27>0?` and ${money2(p.tax27)} for 2027`:''}. ${p.removed>0?`Withdrawing ${money(p.removed)} in ${monthName(input.tfxFix)} ends it, but that month is still taxed because the excess existed in it.`:p.left>0?`${money(p.left)} is still over at the end of 2027, so the tax keeps running until it is withdrawn or later room absorbs it.`:'Nothing is withdrawn; on 1 January 2027 the 2026 withdrawals and the 2027 dollar limit come back as room and absorb the excess.'} A TFSA return (RC243) is due by 30 June of the year after each year with tax.`:`No contribution goes over the room available at the time, so there is no excess and no tax. ${input.tfxOut>0?`The ${money(input.tfxOut)} withdrawal comes back as room on 1 January 2027.`:''}`;
  return {metrics:[['Highest excess at any time',p.highest,'money'],['Months with an excess',p.months,'integer'],['Tax on the excess for 2026 (RC243 due 30 June 2027)',p.tax26,'money'],['Tax on the excess for 2027 (RC243 due 30 June 2028)',p.tax27,'money'],[`Tax if the excess were taken out in ${monthName(lo)}`,now.tax,'money'],['Contribution room on 1 January 2027',p.room27,'money']],
  note,
  charts:[
    {id:'tfx-cra-withdrawals',type:'groupbar',evidence:'Official tax statistics',unit:'count',title:'TFSA holders who withdrew, and who maximized contributions, 2024, by age',seriesNames:['Holders with withdrawals','Holders who maximized contributions'],rowLabel:'Age group',rows:TFSA_STATS.ages.map(([label,,w,mx])=>({label,values:[w,mx]})),source:TFSA_STATS.url,sourceLabel:'CRA · Tax-Free Savings Account Statistics, 2024 tax year, Table 1A',note:`Counts of individuals who held a TFSA in 2024 (19.32 million in all): 5.69 million made at least one withdrawal and 1.71 million maximized their contributions, as CRA labels it. A holder who withdraws and later puts the money back in the same year is the case where an excess most often appears without anyone meaning to over-contribute. CRA does not publish how many holders had an excess, so this chart shows the population exposed, not the number taxed.`},
    {id:'tfx-ledger',type:'line',unit:'money',title:'Highest excess in each month, and the tax building up, 2026 to 2027',xLabel:'Month (1 = January 2026)',xTicks:[1,4,7,10,13,16,19,22,24].map(v=>({value:v,label:v<=12?monthName(v).slice(0,3)+' ’26':monthName(v).slice(0,3)+' ’27'})),series:[{name:'Highest excess in the month',rows:p.rows.map(r=>({x:r.month,value:r.high}))},{name:'Tax so far (1% a month)',dash:true,rows:p.rows.map((r,k)=>({x:r.month,value:p.rows.slice(0,k+1).reduce((s,q)=>s+q.tax,0)}))}],note:`A withdrawal made while there is no excess does not reduce a later excess in the same year: its room returns only on 1 January. ${p.room27raw<0?`On 1 January 2027 the room returned (${money(p.W26)} of 2026 withdrawals plus the ${money(input.tfxNext)} limit) is not enough to absorb the excess.`:'On 1 January 2027 the 2026 withdrawals and the 2027 dollar limit come back as room.'} The 2027 dollar limit is an assumption until CRA announces it.`},
    {id:'tfx-fix-month',type:'bar',unit:'money',unitLabel:'Total tax on the excess, 2026 and 2027 · CAD',title:'Total tax by the month the excess is taken out',rows:byFix.map(q=>({label:label(q.f),value:q.p.tax})),note:`Each bar repeats your inputs with a different removal month. Removing the excess in ${monthName(lo)}, the earliest month allowed by your inputs, costs ${money2(now.tax)}. Each later month adds 1% of the excess still there. "Left in" relies on 1 January: ${keep.left>0?`here the excess is not fully absorbed by 2027 room, so the tax continues past December 2027.`:`here the room that returns on 1 January 2027 absorbs it, so the tax stops after December 2026.`}`},
    {id:'tfx-sheltered',type:'stackbar',unit:'money',title:'Money in the TFSA and room on 1 January 2027, four ways',seriesNames:['Net amount in the TFSA (deposits less withdrawals)','Contribution room on 1 January 2027'],rows:cases.map(([lab,q])=>({label:`${lab} · tax ${money2(q.tax)}`,values:[q.balance,Math.max(0,q.room27raw)]})),note:`Growth is ignored. ${cases.every(([,q])=>Math.abs(sheltered(q)-sheltered(wait))<1e-6)?`In every case the amount in the account plus the room on 1 January 2027 is ${money(sheltered(wait))}: taking the excess out does not lose any room, because that withdrawal comes back on 1 January too.`:'The totals differ here because the room on 1 January 2027 is not enough to absorb the excess in every case; the part still over is not room.'} Only the tax differs. Income earned on an excess can also be taxed separately as an advantage, which this chart does not include.`}
  ]};
}
