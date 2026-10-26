const DAY=86400000;
const lastYear=i=>Math.min(i.fhsaOpenYear+15,i.fhsaOpenYear+71-i.fhsaOpenAge);
const issue=i=>i.fhsaQualifying>i.fhsaBalance?{message:'The qualifying amount cannot exceed the FHSA balance in this simplified ledger.',fields:['fhsaQualifying']}
 :i.fhsaWithdrawYear<i.fhsaOpenYear?{message:'The first qualifying withdrawal cannot come before the first FHSA is opened.',fields:['fhsaWithdrawYear']}
 :i.fhsaWithdrawYear>lastYear(i)?{message:'Without an earlier qualifying withdrawal, the participation period would already have ended by this withdrawal year.',fields:['fhsaWithdrawYear']}
 :i.fhsaLastOwnedYear>0&&(i.fhsaLastOwnedYear<1980||i.fhsaLastOwnedYear>i.fhsaWithdrawYear)?{message:'Enter 0 for no owner-occupied home, or a year from 1980 to the withdrawal year.',fields:['fhsaLastOwnedYear']}:null;
export const fhsaWithdrawalDefinitions={fhsaWithdrawalWindow:{title:'Test an FHSA qualifying-withdrawal calendar and the closing deadline',inputIssue:issue,fields:[
 ['fhsaOpenYear','Year the first FHSA was opened',2024,2023,2045,1],
 ['fhsaOpenAge','Age reached by 31 December of the opening year',30,18,71,1],
 ['fhsaLastOwnedYear','Last calendar year living in a home you owned (0 = none)',0,0,2045,1],
 ['fhsaWithdrawYear','Year of the first qualifying withdrawal',2027,2023,2060,1],
 ['fhsaWithdrawMonth','Month of the withdrawal',3,1,12,1],
 ['fhsaWithdrawDay','Day of the withdrawal (1–28)',15,1,28,1],
 ['fhsaAcqLag','Home acquired this many days after the withdrawal (negative = before)',45,-60,700,1],
 ['fhsaOccupyMonths','Months after acquisition before you occupy the home',1,0,24,1],
 ['fhsaBalance','FHSA balance at the withdrawal (CAD)',33500,0,250000,500],
 ['fhsaQualifying','Amount withdrawn as a qualifying withdrawal (CAD)',30000,0,250000,500],
 ['fhsaTaxRate','Illustrative marginal tax rate for taxable amounts (%)',30,0,60,1]
]}};
const money=n=>Math.round((n+Number.EPSILON)*100)/100;
const iso=t=>new Date(t).toISOString().slice(0,10);
const human=t=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(t));
// Calendar months forward, clamped to the last day of the target month.
const addMonths=(t,n)=>{const d=new Date(t),y=d.getUTCFullYear(),m=d.getUTCMonth()+n,last=new Date(Date.UTC(y,m+1,0)).getUTCDate();return Date.UTC(y,m,Math.min(d.getUTCDate(),last));};
export function periodEndYear(openYear,openAge,firstWithdrawalYear){
 const triggers=[openYear+15,openYear+71-openAge];if(firstWithdrawalYear!=null)triggers.push(firstWithdrawalYear+1);return Math.min(...triggers);
}
export function fhsaWithdrawalResult(kind,i){
 if(kind!=='fhsaWithdrawalWindow')throw Error('Unknown FHSA withdrawal illustration.');
 const wd=Date.UTC(i.fhsaWithdrawYear,i.fhsaWithdrawMonth-1,i.fhsaWithdrawDay),acq=wd+i.fhsaAcqLag*DAY,octFirst=Date.UTC(i.fhsaWithdrawYear+1,9,1);
 const occupy=addMonths(acq,i.fhsaOccupyMonths),occupyLimit=addMonths(acq,12);
 const end=periodEndYear(i.fhsaOpenYear,i.fhsaOpenAge,i.fhsaWithdrawYear),endDate=Date.UTC(end,11,31);
 const triggers=[['15th anniversary of first opening',i.fhsaOpenYear+15],['year turning 71',i.fhsaOpenYear+71-i.fhsaOpenAge],['year after first qualifying withdrawal',i.fhsaWithdrawYear+1]];
 const binding=triggers.filter(([,y])=>y===end).map(([l])=>l).join(' and ');
 const margins=[
  ['Acquisition not more than 30 days before withdrawal',i.fhsaAcqLag+30],
  ['Acquisition before 1 October of the following year',Math.round((octFirst-acq)/DAY)-1],
  ['Occupancy within one year of acquisition',Math.round((occupyLimit-occupy)/DAY)],
  ['Withdrawal to end of maximum participation period',Math.round((endDate-wd)/DAY)]
 ];
 const lookBack=i.fhsaLastOwnedYear===0||i.fhsaLastOwnedYear<=i.fhsaWithdrawYear-5;
 const failed=margins.slice(0,3).filter(([,v])=>v<0).map(([l])=>l.toLowerCase());if(!lookBack)failed.unshift('four-year owner-occupied look-back');
 const status=failed.length?'Fails: '+failed.join('; '):'All modelled timing checks met';
 const r=i.fhsaTaxRate/100,remainder=money(i.fhsaBalance-i.fhsaQualifying),remTax=money(remainder*r),qTax=money(i.fhsaQualifying*r);
 const candidateYears=[...new Set([0,1,2,3,4,5].map(n=>i.fhsaOpenYear+n).concat(i.fhsaWithdrawYear))].filter(y=>y<=lastYear(i)).sort((a,b)=>a-b);
 const endRows=candidateYears.map(y=>{const e=periodEndYear(i.fhsaOpenYear,i.fhsaOpenAge,y);return {label:`First qualifying withdrawal ${y} → ends 31 Dec ${e}${y===i.fhsaWithdrawYear?' (selected)':''}`,value:e-i.fhsaOpenYear};});
 const noneEnd=periodEndYear(i.fhsaOpenYear,i.fhsaOpenAge,null);endRows.push({label:`No qualifying withdrawal → ends 31 Dec ${noneEnd}`,value:noneEnd-i.fhsaOpenYear});
 return {metrics:[
  ['Withdrawal date → acquisition date',null,'text',`${human(wd)} → ${human(acq)}`],
  ['Simplified qualifying-withdrawal status',null,'text',status],
  ['Maximum participation period ends',null,'text',`31 Dec ${end} (${binding})`],
  ['Days from withdrawal to that deadline',margins[3][1],'integer'],
  ['Remainder to transfer, withdraw or leave',remainder,'money'],
  ['Illustrative tax if the remainder is taxable',remTax,'money']
 ],note:`Original hypothetical calendar, not tax advice. It applies a simplified version of the CRA conditions reviewed 26 October 2026: acquisition no more than 30 days before the withdrawal; acquisition or construction completion before 1 October of the year after the withdrawal; occupancy, or intent to occupy, within one year after acquisition; and no owner-occupied principal residence in the previous four calendar years. It does not test the current-year part of the look-back, the written-agreement requirement, Form RC725, continuous Canadian residence, construction specifics, survivor or successor-holder rules, issuer processing time or any HBP condition. The participation period ends 31 December of the earliest trigger year. The tax rate is an editable illustration; withholding, credits and province are not calculated, and the balance is held flat. Dates: withdrawal ${iso(wd)}, acquisition ${iso(acq)}, occupancy ${iso(occupy)}.`,charts:[
  {id:'fhsa-checkpoint-margins',type:'signedbar',unit:'integer',title:'Days of margin at each dated checkpoint',unitLabel:'Days to spare (negative = checkpoint missed) · original hypothetical calendar',rows:margins.map(([label,value])=>({label,value})),note:'A positive bar is slack under the simplified test; zero is the last permitted day; a negative bar means the modelled checkpoint is missed and the withdrawal would be taxable. The last bar is not a qualification test: it is the time left to move or withdraw any remaining balance before the account must be closed.'},
  {id:'fhsa-balance-split',type:'stackbar',unit:'money',title:'Split the balance into the qualifying withdrawal and the remainder',unitLabel:'FHSA balance at the withdrawal date · CAD',seriesNames:['Qualifying withdrawal','Remainder still in the FHSA'],rows:[{label:'Selected scenario',values:[money(i.fhsaQualifying),remainder]},{label:'Whole balance withdrawn as qualifying',values:[money(i.fhsaBalance),0]}],note:'Each row adds back to the entered balance. A qualifying withdrawal is not included in income when every condition is met; the remainder must still be dealt with before the participation period ends.'},
  {id:'fhsa-remainder-routes',type:'stackbar',unit:'money',title:'Where untaxed money can end up under different routes',unitLabel:'Illustrative CAD at the entered tax rate; balance held flat',seriesNames:['Sheltered amount or after-tax value','Illustrative income tax'],rows:[
   {label:'Remainder · direct transfer to RRSP/RRIF',values:[remainder,0]},
   {label:'Remainder · taxable withdrawal (T4FHSA box 22)',values:[money(remainder-remTax),remTax]},
   {label:'Remainder · left past the deadline (box 26)',values:[money(remainder-remTax),remTax]},
   {label:'Qualifying amount · if a condition later fails',values:[money(i.fhsaQualifying-qTax),qTax]}
  ],note:`Every row adds back to the amount in that route. A direct transfer generally keeps the money tax-deferred inside the RRSP or RRIF. A taxable withdrawal is income in the year received, with tax withheld at source. If property stays after the period ends, its fair market value at the end of 31 December is included in income even though no cash left the account. The ${i.fhsaTaxRate}% rate is a placeholder, not an estimate of anyone’s tax.`},
  {id:'fhsa-participation-end',type:'bar',unit:'integer',title:'A first qualifying withdrawal pulls the closing deadline forward',unitLabel:`Years from the ${i.fhsaOpenYear} opening year to the year the period ends`,rows:endRows,note:`The period ends on 31 December of the earliest of: the 15th anniversary of the first FHSA (${i.fhsaOpenYear+15}), the year the holder turns 71 (${i.fhsaOpenYear+71-i.fhsaOpenAge}), and the year after the first qualifying withdrawal. Rows show the first qualifying withdrawal in different years; later withdrawals do not reset it.`}
 ]};
}
