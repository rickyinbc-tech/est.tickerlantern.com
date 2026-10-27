const issue=i=>{
  if(i.rxOut>0&&i.rxOutM===0)return {message:'Choose the month of the withdrawal, or set the amount withdrawn to 0.',fields:['rxOutM','rxOut']};
  if(i.rxOut>0&&i.rxOut>rrspExcessPaidIn(i,i.rxOutM))return {message:'The withdrawal cannot be larger than the contributions made by then, because growth is ignored in this model.',fields:['rxOut','rxOutM']};
  return null;
};
export const rrspExcessDefinitions={
  rrspExcess:{title:'Price an RRSP over-contribution: the CAD 2,000 cushion, the 1% month-end tax, and the months CRA assumes',inputIssue:issue,fields:[
    ['rxLimit','RRSP deduction limit for 2026 on your notice of assessment (CAD)',15000,0,200000,500],
    ['rxCarry','Unused contributions carried into 2026, not yet deducted (CAD)',0,0,200000,500],
    ['rxPay','Payroll or monthly contribution in each month of 2026 (CAD)',1000,0,20000,100],
    ['rxLump','One-time contribution in 2026 (CAD)',10000,0,200000,500],
    ['rxLumpM','Month of the one-time contribution (1 = January 2026)',3,1,12,1],
    ['rxOut','Amount withdrawn from the RRSP (CAD)',5000,0,200000,500],
    ['rxOutM','Month of the withdrawal (1 = January 2026, 13 = January 2027; 0 = none)',10,0,24,1],
    ['rxNew','New deduction room added for 2027 (CAD)',9000,0,35390,500],
    ['rxPay27','Monthly contribution in each month of 2027 (CAD)',500,0,20000,100],
    ['rxAdult','Turned 18 before 2026 (1 = yes, 0 = no)',1,0,1,1]
  ]}
};
export const rrspExcessWholeKeys=['rxLumpM','rxOutM','rxAdult'];

// Income Tax Act (current to 30 September 2026). s. 204.1(2.1): tax for each month equal to 1% of the cumulative excess
// amount at the END of the month. s. 204.2(1.1): cumulative excess = undeducted RRSP premiums − (A + B + R + C + D + E),
// where A + B is the deduction limit on the notice of assessment, C is CAD 2,000 if the individual turned 18 in a preceding
// year, and D (group plan amount) and E (pre-1995 transitional amount) are taken as nil. s. 204.2(1.2): undeducted premiums
// = carried-in undeducted premiums + premiums paid in the year so far − withdrawals included in income (element J).
// Because the year's deduction reduces both the undeducted premiums and next year's unused room by the same amount,
// the 2027 excess is the 2026 overage plus 2027 contributions less 2027 withdrawals and the new 2027 room.
// Dollar limits: CRA MP, DB, RRSP, DPSP, ALDA, TFSA limits page (page details 2025-12-01): 2026 CAD 33,810, 2027 CAD 35,390.
export const rrspExcessRules={rate:.01,cushion:2000,limit2026:33810,limit2027:35390};

// Statistics Canada Table 11-10-0044-01 (released 2025-04-01; latest reference year 2023): Canada, all tax filers.
// [year, tax filers, RRSP contributors, median contribution (CAD)].
export const RRSP_STATS={url:'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110004401',
  rows:[[2000,21611830,6291170,2700],[2001,21886860,6241050,2600],[2002,21979210,5991440,2500],[2003,22465770,5948340,2600],[2004,22725310,6002350,2600],[2005,23311690,6135980,2630],[2006,23338370,6196050,2730],[2007,23725970,6292480,2780],[2008,24035930,6178900,2700],[2009,24320760,5967710,2680],[2010,24494940,5956010,2790],[2011,24841630,5953370,2830],[2012,25159950,5951800,2930],[2013,25482640,5957550,3000],[2014,25922300,5974180,3000],[2015,26186760,5989810,3000],[2016,26350290,5936090,3000],[2017,26807670,5966630,3030],[2018,27394970,6003990,3130],[2019,27171990,5912000,3260],[2020,27855050,6201670,3600],[2021,28104130,6297570,3890],[2022,28934120,6268950,3910],[2023,29965100,6350070,4000]],
  total2023:55734780000};

// Contributions paid in month m (1–24) under the entered calendar.
const paidIn=(i,m)=>m<=12?i.rxPay+(m===i.rxLumpM?i.rxLump:0):i.rxPay27;
// Carried-in plus contributions to the end of month m, before any withdrawal: the most that can be withdrawn then.
export const rrspExcessPaidIn=(i,m)=>{let s=i.rxCarry;for(let k=1;k<=m;k++)s+=paidIn(i,k);return s;};

// CRA's T1-OVP page: without documents showing the months, CRA may put contributions from the first 60 days of a year in
// January, the rest of the year's contributions in March, and withdrawals in December. Months 1–2 stand in for the first
// 60 days here (59 days in 2026 and 2027, so a 1 March contribution is moved to March, not January).
const craMonth=(m,out)=>{const y=m>12?12:0,k=m-y;return out?y+12:y+(k<=2?1:3);};

export function rrspExcessPlan(input,overrides={},craDefaults=false){
  const i={...input,...overrides},R=rrspExcessRules,cushion=i.rxAdult?R.cushion:0;
  const P=Array(25).fill(0),W=Array(25).fill(0);
  for(let m=1;m<=24;m++)P[craDefaults?craMonth(m,false):m]+=paidIn(i,m);
  if(i.rxOut>0&&i.rxOutM>0)W[craDefaults?craMonth(i.rxOutM,true):i.rxOutM]+=i.rxOut;
  let undeducted=i.rxCarry;const rows=[];
  for(let m=1;m<=24;m++){
    undeducted+=P[m]-W[m];
    const room=i.rxLimit+(m>12?i.rxNew:0),over=undeducted-room,excess=Math.max(0,over-cushion);
    rows.push({month:m,year:m<=12?2026:2027,undeducted,room,over,excess,tax:R.rate*excess});
  }
  const sum=(a,k)=>a.reduce((s,r)=>s+r[k],0),y26=rows.slice(0,12),y27=rows.slice(12);
  const tax26=sum(y26,'tax'),tax27=sum(y27,'tax');
  return {rows,cushion,tax26,tax27,tax:tax26+tax27,months:rows.filter(r=>r.excess>0).length,highest:Math.max(...rows.map(r=>r.excess)),
    firstMonth:(rows.find(r=>r.excess>0)||{}).month||0,overEnd:rows[23].over,contributed:rrspExcessPaidIn(i,24)-i.rxCarry};
}

const monthName=m=>['January','February','March','April','May','June','July','August','September','October','November','December'][(m-1)%12]+' '+(m<=12?2026:2027);
const short=m=>monthName(m).slice(0,3)+' ’'+(m<=12?'26':'27');

export function rrspExcessResult(kind,input){
  if(kind!=='rrspExcess')throw Error('Unknown RRSP excess topic');
  const p=rrspExcessPlan(input),cra=rrspExcessPlan(input,{},true),none=rrspExcessPlan(input,{rxOut:0,rxOutM:0});
  const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}),money2=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',minimumFractionDigits:2,maximumFractionDigits:2});
  // The amount tested in the timing chart: the entered withdrawal, or else the largest excess with nothing withdrawn.
  const amount=input.rxOut>0?input.rxOut:none.highest,first=none.firstMonth;
  const months=Array.from({length:24},(_,k)=>k+1).filter(m=>amount>0&&amount<=rrspExcessPaidIn(input,m));
  const byMonth=[...months.map(m=>({label:short(m),p:rrspExcessPlan(input,{rxOut:amount,rxOutM:m})})),{label:'None',p:none}];
  const early=first&&months.includes(first)?rrspExcessPlan(input,{rxOut:amount,rxOutM:first}):null;
  const S=RRSP_STATS.rows,last=S.at(-1);
  const note=none.highest>0?`Without a withdrawal, your contributions first go more than ${money(p.cushion)} over your room in ${monthName(first)}. The tax is 1% of the cumulative excess at the end of each month. With your inputs it runs for ${p.months} month${p.months===1?'':'s'}: ${money2(p.tax26)} for 2026${p.tax27>0?` and ${money2(p.tax27)} for 2027`:''}, against ${money2(none.tax)} with no withdrawal. ${early?`Withdrawing ${money(amount)} before the end of ${monthName(first)} would cost ${money2(early.tax)}.`:''} If CRA has no records of the months, its default placement gives ${money2(cra.tax)}. ${p.tax26>0?'Form T1-OVP and payment for 2026 are due by 31 March 2027.':''}`:`Your contributions never go more than ${money(p.cushion)} over your deduction room at a month-end, so there is no cumulative excess and no tax.${p.rows.some(r=>r.over>0)?' Some unused contributions sit inside the cushion; they are not deductible until new room arrives.':''}`;
  return {metrics:[['Highest cumulative excess at a month-end',p.highest,'money'],['Months taxed',p.months,'integer'],['Tax for 2026 (T1-OVP due 31 March 2027)',p.tax26,'money'],['Tax for 2027 (T1-OVP due 90 days after 2027)',p.tax27,'money'],['Tax if CRA uses its default months (no records)',cra.tax,'money'],['Contributions above all room at the end of 2027',Math.max(0,p.overEnd),'money']],
  note,
  charts:[
    {id:'rx-statcan-median',type:'line',evidence:'Official tax statistics',unit:'money',title:'Median RRSP contribution beside the fixed CAD 2,000 cushion, 2000 to 2023',xLabel:'Tax year',xTicks:[2000,2005,2010,2015,2020,2023].map(v=>({value:v,label:String(v)})),series:[{name:'Median contribution of RRSP contributors',rows:S.map(r=>({x:r[0],value:r[3]}))},{name:'CAD 2,000 cushion in the Income Tax Act',dash:true,rows:S.map(r=>({x:r[0],value:2000}))}],source:RRSP_STATS.url,sourceLabel:'Statistics Canada · Table 11-10-0044-01, Canada',note:`In ${last[0]}, ${(last[2]/1e6).toFixed(2)} million of ${(last[1]/1e6).toFixed(2)} million tax filers contributed to an RRSP, and the median contribution was ${money(last[3])}, up from ${money(S[0][3])} in ${S[0][0]}. The CAD 2,000 in section 204.2(1.1) is a fixed dollar amount: it was 74% of the median contribution in 2000 and 50% in ${last[0]}. A median is the middle contributor, not an average. Statistics Canada does not publish the number of people with an RRSP excess, so this chart is context, not a count of people taxed.`},
    {id:'rx-ledger',type:'line',unit:'money',title:'Unused contributions over your room, and the excess taxed at each month-end, 2026 to 2027',xLabel:'Month (1 = January 2026)',xTicks:[1,4,7,10,13,16,19,22,24].map(v=>({value:v,label:short(v)})),series:[{name:'Contributions over your deduction room',rows:p.rows.map(r=>({x:r.month,value:r.over}))},{name:`Cumulative excess (over room by more than ${money(p.cushion)})`,rows:p.rows.map(r=>({x:r.month,value:r.excess}))},{name:'Tax so far (1% a month)',dash:true,rows:p.rows.map((r,k)=>({x:r.month,value:p.rows.slice(0,k+1).reduce((s,q)=>s+q.tax,0)}))}],note:`The first line can be negative: that is room still unused. Only the part more than ${money(p.cushion)} above zero is taxed. In January 2027 the line drops by the ${money(input.rxNew)} of new room you entered, then climbs again with 2027 contributions. New room for 2027 is 18% of 2026 earned income up to CAD 35,390, less any 2026 pension adjustment.`},
    {id:'rx-out-month',type:'bar',unit:'money',unitLabel:'Total tax on the cumulative excess, 2026 and 2027 · CAD',title:`Total tax if ${money(amount)} is withdrawn in each month`,rows:byMonth.map(q=>({label:q.label,value:q.p.tax})),note:amount>0?`Each bar repeats your inputs with the withdrawal moved to another month; months before enough has been contributed are left out. Because the tax is measured at the end of a month, a withdrawal before the month-end in which the excess appears avoids that month entirely. A withdrawal of unused contributions is taxable income unless you can deduct it on line 23200 (Form T746), and tax is withheld unless CRA approves Form T3012A first.`:'There is no excess to withdraw with your inputs, so every month costs nothing.'},
    {id:'rx-cra-default',type:'groupbar',unit:'money',title:'Tax with your actual months, and with CRA’s default months',seriesNames:['Your actual months','CRA default months when no records are sent'],rowLabel:'Tax year',rows:[['2026',p.tax26,cra.tax26],['2027',p.tax27,cra.tax27],['Both years',p.tax,cra.tax]].map(([label,a,b])=>({label,values:[a,b]})),note:`Without documents showing the months, CRA may place contributions from the first 60 days of a year in January, the rest in March, and withdrawals in December. That moves deposits earlier and withdrawals later, so it can only raise the tax: here ${money2(cra.tax)} against ${money2(p.tax)}. CRA does not accept RRSP receipts or T4RSP slips as proof of the months; keep statements that show transaction dates.`}
  ]};
}
