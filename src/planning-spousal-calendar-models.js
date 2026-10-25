export const spousalCalendarReference={reviewed:'2026-10-25',windowYears:3,url:'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/making-withdrawals/withdrawing-spousal-common-law-partner-rrsps.html'};
export const spousalCalendarDefinitions={
  spousalCalendar:{title:'Map one contributor’s hypothetical calendar-year record',fields:[
    ['c2025','Contributor’s total deposits to the annuitant’s RRSPs in 2025 (CAD)',0,0,50000,500],
    ['c2026','Contributor’s total deposits to the annuitant’s RRSPs in 2026 (CAD)',5000,0,50000,500],
    ['c2027','Contributor’s total deposits to the annuitant’s RRSPs in 2027 (CAD)',0,0,50000,500],
    ['c2028','Contributor’s total deposits to the annuitant’s RRSPs in 2028 (CAD)',0,0,50000,500],
    ['c2029','Contributor’s total deposits to the annuitant’s RRSPs in 2029 (CAD)',0,0,50000,500],
    ['c2030','Contributor’s total deposits to the annuitant’s RRSPs in 2030 (CAD)',0,0,50000,500],
    ['c2031','Contributor’s total deposits to the annuitant’s RRSPs in 2031 (CAD)',0,0,50000,500],
    ['withdrawYear','Hypothetical withdrawal calendar year',2029,2027,2031,1],
    ['contributionMonth','Month of a separate example deposit dated in 2026',12,1,12,1],
    ['withdrawMonth','Month of the example withdrawal; January = 1',1,1,12,1]
  ]}
};
export function spousalWindow(input,year=input.withdrawYear){
  const years=Array.from({length:spousalCalendarReference.windowYears},(_,i)=>year-spousalCalendarReference.windowYears+1+i),values=years.map(y=>input['c'+y]);
  return {years,values,total:values.reduce((a,b)=>a+b,0)};
}
export function calendarMonthGap(contributionYear,contributionMonth,withdrawYear,withdrawMonth){
  return (withdrawYear-contributionYear)*12+withdrawMonth-contributionMonth;
}
export function depositYearInWindow(depositYear,withdrawYear){
  return depositYear>=withdrawYear-2&&depositYear<=withdrawYear;
}
export function spousalCalendarResult(kind,input){
  if(kind!=='spousalCalendar')throw Error('Unknown spousal-calendar topic.');
  const window=spousalWindow(input),months=calendarMonthGap(2026,input.contributionMonth,input.withdrawYear,input.withdrawMonth);
  return {metrics:[['Recorded contributor deposits in the selected three-year window',window.total,'money'],['Calendar years in the selected review window',input.withdrawYear,'integer',window.years[0]+'–'+window.years[2]],['Months between the two example dates',months,'months']],note:'Original hypothetical calendar ledger using CRA’s general spousal-RRSP calendar-year review described in the cited public guidance, reviewed 25 October 2026. The amounts aggregate one contributor’s deposits to the same annuitant’s RRSPs across the entered years; they are not the annuitant’s own deposits, investment returns, contribution room, deductions or transfers. Each review totals the withdrawal calendar year and the two preceding calendar years. Totals identify records to review; they are not attributed income or tax payable. No withdrawal amount, prior attribution, income allocation, final tax, withholding, account eligibility, relationship exception, residency exception, RRIF minimum, SPP or FHSA transfer is calculated. Future dates are examples conditional on the reviewed rule, not a promise that future law will stay unchanged. The separate 2026 example date remains a date illustration even when its annual deposit amount is zero. Month gaps compare month labels without day-of-month precision. A calendar window alone does not establish a tax-free or permitted withdrawal.',charts:[
    {id:'spousal-calendar-annual-record',type:'bar',title:'Start with the contributor’s complete annual record',unit:'money',unitLabel:'Hypothetical deposits made in each calendar year (CAD)',rows:Array.from({length:7},(_,i)=>{const year=2025+i;return {label:String(year),value:input['c'+year]};}),note:'Each annual bar is the same contributor’s total across the relevant annuitant’s RRSPs for that calendar year. Amounts in years after today are hypothetical planning inputs. A deposit receipt date and the year for which a deduction may be claimed are separate records; this ledger uses the calendar year the deposit was made.'},
    {id:'spousal-calendar-moving-window',type:'stackbar',title:'The review window advances with the withdrawal year',unit:'money',unitLabel:'Contributor deposits in each three-calendar-year review (CAD)',seriesNames:['Two years before withdrawal','One year before withdrawal','Withdrawal calendar year'],rows:[2027,2028,2029,2030,2031].map(year=>({label:year+(year===input.withdrawYear?' · selected withdrawal year':''),values:spousalWindow(input,year).values})),source:spousalCalendarReference.url,sourceLabel:'CRA · Spousal RRSP withdrawal guidance',evidence:'Hypothetical annual totals beside the reviewed calendar-year framework',note:'Every bar sums three distinct calendar-year entries, not thirty-six monthly deposits or a calculation of income attributed. The earliest displayed window is 2025–2027 and the latest is 2029–2031, all fully represented by the controls. Deposits to other relevant plans must be included in a real record review. Use the applicable CRA process to determine income reporting.'},
    {id:'spousal-calendar-example-months',type:'bar',title:'Elapsed months and calendar-window membership describe different dates',unit:'months',unitLabel:'Whole month-label difference from an example 2026 deposit',rows:[2027,2028,2029,2030,2031].map(year=>({label:year+' · 2026 '+(depositYearInWindow(2026,year)?'included':'excluded'),value:calendarMonthGap(2026,input.contributionMonth,year,input.withdrawMonth)})),note:'All rows use the selected 2026 deposit month and selected withdrawal month, changing only the withdrawal year. Included or excluded describes that 2026 calendar year’s membership in the three-year review, not the tax result of a withdrawal. Other entered contribution years may still be in a later window.'},
    {id:'spousal-calendar-fixed-dates',type:'heatmap',title:'A fixed 2026-to-2029 comparison spans different numbers of months',unit:'months',unitLabel:'Rows: 2026 deposit month; columns: 2029 withdrawal month; values: months',columns:['Jan','Apr','Jul','Dec'],rows:[[1,'Jan 2026'],[4,'Apr 2026'],[7,'Jul 2026'],[12,'Dec 2026']].map(([month,label])=>({label,values:[1,4,7,12].map(withdrawMonth=>calendarMonthGap(2026,month,2029,withdrawMonth))})),note:'This is a separate fixed date comparison, unchanged by the controls. Rows select a 2026 deposit month and columns a 2029 withdrawal month. The elapsed month counts vary from 25 to 47; 2026 is outside a 2027–2029 review in every cell. That observation about one year does not review deposits made in 2027, 2028 or 2029 or determine anyone’s taxable income.'}
  ]};
}
