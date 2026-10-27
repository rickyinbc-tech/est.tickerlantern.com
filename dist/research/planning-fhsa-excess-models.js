const issue=i=>{
  if(i.hxOut>0&&i.hxOutM===0)return {message:'Choose the month of the withdrawal, or set the amount withdrawn to 0.',fields:['hxOutM','hxOut']};
  if(i.hxOut>0&&i.hxKind===1&&i.hxOut>fhsaExcessBefore(i,i.hxOutM)+1e-9)return {message:'A designated withdrawal cannot be larger than the excess FHSA amount when it is made. Lower the amount, move it to a later month, or choose a taxable withdrawal.',fields:['hxOut','hxOutM','hxKind']};
  if(i.hxOut>0&&i.hxOut>i.hxUsed+fhsaExcessPaidIn(i,i.hxOutM))return {message:'The withdrawal cannot be larger than the contributions made by then, because growth is ignored in this model.',fields:['hxOut','hxOutM']};
  return null;
};
export const fhsaExcessDefinitions={
  fhsaExcess:{title:'Price an FHSA over-contribution: the 1% tax on the highest excess in each month, and what the next January’s room absorbs',inputIssue:issue,fields:[
    ['hxRoom','FHSA participation room for 2026, across all your FHSAs (CAD)',13000,0,40000,500],
    ['hxUsed','Contributions and transfers before 2026 that count toward the CAD 40,000 lifetime limit (CAD)',3000,0,40000,500],
    ['hxPay','Payroll or monthly contribution in each month of 2026 (CAD)',500,0,8000,50],
    ['hxLump','One-time contribution or RRSP transfer in 2026, possibly at another institution (CAD)',10000,0,40000,500],
    ['hxLumpM','Month of the one-time amount (1 = January 2026)',4,1,12,1],
    ['hxOut','Amount withdrawn to remove the excess (CAD)',2000,0,40000,500],
    ['hxOutM','Month of the withdrawal, after that month’s contributions (1 = January 2026, 13 = January 2027; 0 = none)',10,0,24,1],
    ['hxKind','Kind of withdrawal (1 = designated on Form RC727, 0 = taxable)',1,0,1,1],
    ['hxPay27','Monthly contribution in each month of 2027 (CAD)',500,0,8000,50],
    ['hxRate','Your marginal income tax rate on a taxable withdrawal (%)',30,0,55,1]
  ]}
};
export const fhsaExcessWholeKeys=['hxLumpM','hxOutM','hxKind'];

// Income Tax Act (current to 30 September 2026). s. 207.021: for each month in which an individual has an excess FHSA amount at
// any time, tax of 1% of the HIGHEST such amount in that month (unlike s. 204.1(2.1) for RRSPs, which uses the month-end).
// s. 207.01(1) "excess FHSA amount" = A + B + C − D − E − F: A the excess at the end of the preceding year, B and C contributions
// and RRSP transfers in the year so far, D the year's room (CAD 8,000 plus carryforward, capped by CAD 40,000 less earlier
// amounts), E designated amounts and taxable withdrawals that reduce the excess. A "designated amount" may not exceed the
// excess when it is designated (Form RC727).
// CRA participation room page (page details 2026-09-17): room for a later year = unused re-participation room + lesser of
// (CAD 8,000 + participation room carryforward) and (CAD 40,000 − earlier contributions and transfers + designated amounts);
// the carryforward is at most CAD 8,000; a taxable withdrawal beyond the excess becomes re-participation room the next year
// (CRA examples: Karla 13,000 against 8,000 → 2027 room 3,000; Julie 2,000 excess, 5,000 taxable → 11,000; Tony → 9,500).
export const fhsaExcessRules={rate:.01,annual:8000,carryMax:8000,lifetime:40000};

// CRA, First Home Savings Account Statistics (2024 tax year), Table 2 by federal tax bracket (page details 2026-10-14; data
// processed to 30 June 2026; counts rounded to 10, dollars to the thousand).
// [bracket, holders, accounts, holders who contributed, total contributions (CAD)].
export const FHSA_STATS={url:'https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/income-statistics-gst-hst-statistics/first-home-savings-account-statistics/first-home-savings-account-statistics-2024-tax-year.html',
  brackets:[['CAD 55,867 or less',802620,915360,541620,3052561000],['CAD 55,867 to 111,733',527820,614280,401390,2677809000],['CAD 111,733 to 173,205',91390,109940,69270,523330000],['CAD 173,205 to 246,752',21280,26020,16490,133610000],['CAD 246,752 or more',12170,14900,9770,83408000]],
  total:['All tax brackets',1455280,1680490,1038540,6470717000]};

const paidIn=(i,m)=>m<=12?i.hxPay+(m===i.hxLumpM?i.hxLump:0):i.hxPay27;
// Contributions and transfers made from January 2026 to the end of month m.
export const fhsaExcessPaidIn=(i,m)=>{let s=0;for(let k=1;k<=m;k++)s+=paidIn(i,k);return s;};

export function fhsaExcessPlan(input,overrides={}){
  const i={...input,...overrides},R=fhsaExcessRules,out=i.hxOut>0&&i.hxOutM>0?i.hxOut:0;
  let over=-i.hxRoom,reP=0,paid26=0,designated26=0,room27=null;const rows=[];
  for(let m=1;m<=24;m++){
    if(m===13){
      // 1 January 2027: the year-end excess carries in (element A) and the new room (element D) absorbs it.
      const excessEnd=Math.max(0,over),carry=Math.min(R.carryMax,Math.max(0,-over));
      const lifetimeLeft=Math.max(0,R.lifetime-(i.hxUsed+paid26-designated26));
      room27=reP+Math.min(R.annual+carry,lifetimeLeft);over=excessEnd-room27;
    }
    const pay=paidIn(i,m);over+=pay;if(m<=12)paid26+=pay;
    const highest=Math.max(0,over);let removed=0;
    if(out&&m===i.hxOutM){
      if(i.hxKind===1){removed=Math.min(out,highest);if(m<=12)designated26+=removed;}
      else{removed=Math.min(out,highest);if(m<=12)reP+=out-removed;}
      over-=removed;
    }
    rows.push({month:m,year:m<=12?2026:2027,over,highest,tax:R.rate*highest,removed});
  }
  const sum=(a,k)=>a.reduce((s,r)=>s+r[k],0),tax26=sum(rows.slice(0,12),'tax'),tax27=sum(rows.slice(12),'tax');
  const excessEnd26=Math.max(0,rows[11].over);
  return {rows,tax26,tax27,tax:tax26+tax27,months:rows.filter(r=>r.highest>0).length,highest:Math.max(...rows.map(r=>r.highest)),
    firstMonth:(rows.find(r=>r.highest>0)||{}).month||0,excessEnd26,room27,roomAfter27:room27-excessEnd26,reParticipation:reP,
    incomeTax:out&&i.hxKind===0?out*i.hxRate/100:0,lifetimeLeft27:R.lifetime-(i.hxUsed+paid26-designated26)};
}
// The excess in month m after that month's contributions, before any withdrawal in it: the most that can be designated then.
export const fhsaExcessBefore=(i,m)=>m>0?fhsaExcessPlan(i,{hxOut:0,hxOutM:0}).rows[m-1].highest:0;

const monthName=m=>['January','February','March','April','May','June','July','August','September','October','November','December'][(m-1)%12]+' '+(m<=12?2026:2027);
const short=m=>monthName(m).slice(0,3)+' ’'+(m<=12?'26':'27');

export function fhsaExcessResult(kind,input){
  if(kind!=='fhsaExcess')throw Error('Unknown FHSA excess topic');
  const p=fhsaExcessPlan(input),none=fhsaExcessPlan(input,{hxOut:0,hxOutM:0});
  const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0}),money2=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',minimumFractionDigits:2,maximumFractionDigits:2});
  // Timing chart: designate all of the excess present in each month, one month at a time, with nothing else changed.
  const months=none.rows.filter(r=>r.highest>0).map(r=>r.month);
  const byMonth=[...months.map(m=>({label:short(m),p:fhsaExcessPlan(input,{hxOut:none.rows[m-1].highest,hxOutM:m,hxKind:1})})),{label:'None',p:none}];
  // Remedies chart: the entered amount and month (or, with none entered, the largest excess in its month).
  const peak=none.rows.find(r=>r.highest===none.highest&&r.highest>0),M=input.hxOut>0?input.hxOutM:(peak?peak.month:0),A=input.hxOut>0?input.hxOut:none.highest;
  const des=M?fhsaExcessPlan(input,{hxOut:Math.min(A,none.rows[M-1].highest),hxOutM:M,hxKind:1}):none,txw=M?fhsaExcessPlan(input,{hxOut:A,hxOutM:M,hxKind:0}):none;
  const S=FHSA_STATS,T=S.total,avg=r=>r[4]/r[3];
  const note=none.highest>0?`Without a withdrawal, your contributions first go over your participation room in ${monthName(none.firstMonth)}. The tax is 1% of the highest excess at any time in each month, so a withdrawal still leaves that month taxed. With your inputs the excess is taxed in ${p.months} month${p.months===1?'':'s'}: ${money2(p.tax26)} for 2026${p.tax27>0?` and ${money2(p.tax27)} for 2027`:''}, against ${money2(none.tax)} with no withdrawal. ${p.excessEnd26>0?`An excess of ${money(p.excessEnd26)} is still there at the end of 2026; it uses up that much of the ${money(p.room27)} of new room on 1 January 2027, leaving ${money(Math.max(0,p.roomAfter27))}. `:''}${p.incomeTax>0?`Because the withdrawal is taxable, about ${money(p.incomeTax)} of income tax is added at your marginal rate. `:''}${p.tax26>0?'Form RC728 with Schedule A and payment for 2026 are due by 30 June 2027.':''}`:`Your contributions and transfers never go over your participation room, so there is no excess FHSA amount and no tax.${p.room27!==null?` Your room for 2027 would be ${money(Math.max(0,p.roomAfter27))}.`:''}`;
  return {metrics:[['Highest excess FHSA amount in a month',p.highest,'money'],['Months taxed',p.months,'integer'],['Tax for 2026 (RC728 due 30 June 2027)',p.tax26,'money'],['Tax for 2027 (RC728 due 30 June 2028)',p.tax27,'money'],['Participation room left for 2027 after any excess carried in',Math.max(0,p.roomAfter27),'money'],['Income tax on a taxable withdrawal at your marginal rate',p.incomeTax,'money']],
  note,
  charts:[
    {id:'hx-cra-brackets',type:'groupbar',evidence:'Official tax statistics',unit:'money',title:'Average FHSA contribution per contributing holder in 2024, by federal tax bracket, beside the CAD 8,000 annual limit',seriesNames:['Average contribution of holders who contributed','CAD 8,000 annual limit'],rowLabel:'Federal tax bracket (taxable income)',rows:[...S.brackets,T].map(r=>({label:r[0],values:[avg(r),8000]})),source:S.url,sourceLabel:'CRA · First Home Savings Account Statistics, 2024 tax year, Table 2',note:`In 2024, ${(T[3]/1e6).toFixed(2)} million of ${(T[1]/1e6).toFixed(2)} million FHSA holders contributed a total of CAD ${(T[4]/1e9).toFixed(2)} billion, an average of ${money(avg(T))}. In the two highest brackets the average was above CAD 8,000, which is possible only with carried-forward room. Holders had ${T[2].toLocaleString('en-CA')} accounts, ${(T[2]-T[1]).toLocaleString('en-CA')} more than holders; room is shared across all of a person’s FHSAs, which is how many excesses start. Averages are total contributions divided by contributors (CRA rounds counts to 10 and dollars to the thousand); they are not medians. CRA does not publish how many holders had an excess, so this chart shows the people exposed, not the number taxed.`},
    {id:'hx-ledger',type:'line',unit:'money',title:'Contributions over your participation room, and the highest excess taxed in each month, 2026 to 2027',xLabel:'Month (1 = January 2026)',xTicks:[1,7,13,19,24].map(v=>({value:v,label:short(v)})),series:[{name:'Contributions over room at the end of the month',rows:p.rows.map(r=>({x:r.month,value:r.over}))},{name:'Highest excess in the month (taxed at 1%)',rows:p.rows.map(r=>({x:r.month,value:r.highest}))},{name:'Tax so far',dash:true,rows:p.rows.map((r,k)=>({x:r.month,value:p.rows.slice(0,k+1).reduce((s,q)=>s+q.tax,0)}))}],note:`Below zero is room still unused. There is no cushion: the first dollar over room is an excess. In a month with a withdrawal, the highest excess is the amount before it, so the two lines part. In January 2027 new room of ${money(p.room27)} arrives (CAD 8,000 plus any carryforward and re-participation room, within the CAD 40,000 lifetime limit), minus the ${money(p.excessEnd26)} excess carried in.`},
    {id:'hx-designate-month',type:'bar',unit:'money',unitLabel:'Total tax on excess FHSA amounts, 2026 and 2027 · CAD',title:'Total tax if all of the excess present is designated and withdrawn in one month',rows:byMonth.map(q=>({label:q.label,value:q.p.tax})),note:months.length?'Each bar removes the whole excess in that month and changes nothing else. A designated withdrawal cannot exceed the excess when it is made, so it cannot get ahead of contributions that are still coming. If payroll contributions continue, a new excess appears the next month; stopping them matters as much as the withdrawal. The month of the withdrawal is still taxed, because the tax uses the highest excess at any time in the month.':'There is no excess with your inputs, so there is nothing to designate.'},
    {id:'hx-remedies',type:'groupbar',unit:'money',title:M?`Three ways to deal with the excess: ${money(A)} in ${monthName(M)}, or waiting for January`:'Three ways to deal with the excess',seriesNames:['1% tax on the excess, 2026 and 2027','Income tax on the withdrawal','Room left for 2027'],rowLabel:'Remedy',rows:[['Designated withdrawal (RC727)',des,0],['Taxable withdrawal',txw,txw.incomeTax],['No withdrawal; wait for 2027 room',none,0]].map(([label,q,t])=>({label,values:[q.tax,t,Math.max(0,q.roomAfter27)]})),note:`A designated withdrawal is limited to the excess at the time (here ${money(M?Math.min(A,none.rows[M-1].highest):0)}), is not income, and restores that much of the CAD 40,000 lifetime limit. A taxable withdrawal reduces the excess too, but the whole amount is income; any part above the excess becomes re-participation room the next year rather than lifetime room. Waiting lets 1 January absorb the excess, at the cost of months of tax and less new room. Income tax is a flat ${input.hxRate}% estimate on the amount, not a return calculation.`}
  ]};
}
