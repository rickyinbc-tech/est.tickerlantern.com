export const taxContributionDefinitions={
  taxInstalmentReserve:{title:'Explore a fixed 2026 quarterly instalment cash calendar',fields:[
    ['openingReserve','Cash already assigned to instalments on 1 January (CAD)',6000,0,100000,1000],
    ['monthlyReserve','Transfer into the reserve at each month-end (CAD)',1000,0,10000,100],
    ['march','Independently confirmed March instalment amount (CAD)',5000,0,50000,500],['june','Independently confirmed June instalment amount (CAD)',5000,0,50000,500],
    ['september','Independently confirmed September instalment amount (CAD)',5000,0,50000,500],['december','Independently confirmed December instalment amount (CAD)',5000,0,50000,500]
  ]},
  contributionSequence:{title:'Explore ten return years while adding new savings',fields:[
    ['initial','Initial invested capital (CAD)',10000,0,500000,1000],['annualDeposit','Deposit at each eligible year-end (CAD)',6000,0,50000,1000],
    ['contributionDelay','Whole opening years with no new deposit',0,0,9,1],['returnScale','Scale applied to every illustrative annual return (%)',100,0,150,10]
  ]}
};
export const instalmentDateSource={url:'https://www.canada.ca/en/revenue-agency/services/payments/payments-cra/individual-payments/income-tax-instalments/due-dates.html',reviewed:'2026-10-25',year:2026,dates:[['march','2026-03-16'],['june','2026-06-15'],['september','2026-09-15'],['december','2026-12-15']]};
const startUTC=Date.UTC(2026,0,1),dayIndex=key=>(Date.parse(key+'T00:00:00Z')-startUTC)/86400000;

export function taxInstalmentLedger(input){
  const payments=instalmentDateSource.dates.map(([key,date])=>({key,date,amount:input[key],day:dayIndex(date)}));
  const events=[...payments.map(p=>({...p,type:'payment'})),...Array.from({length:12},(_,month)=>{
    const date=new Date(Date.UTC(2026,month+1,0)).toISOString().slice(0,10);return {type:'transfer',date,day:dayIndex(date),amount:input.monthlyReserve};
  })].sort((a,b)=>a.day-b.day||(a.type==='payment'?-1:1));
  let net=0,lowest=0,firstGap=null;
  const rows=[{x:0,label:'2026-01-01',value:input.openingReserve}];
  for(const event of events){net+=event.type==='transfer'?event.amount:-event.amount;lowest=Math.min(lowest,net);if(firstGap===null&&input.openingReserve+net<0)firstGap=event.date;rows.push({x:event.day,label:event.date,value:input.openingReserve+net});}
  const totalPayments=payments.reduce((s,p)=>s+p.amount,0),required=-lowest;
  return {payments,events,rows,totalPayments,transfers:12*input.monthlyReserve,required,extra:Math.max(0,required-input.openingReserve),firstGap,ending:input.openingReserve+net};
}

export const contributionReturns=[-.15,-.05,.08,.10,.12,.06,.04,.08,.07,.05];
export function contributionSequencePath(input,reverse=false){
  const rates=reverse?[...contributionReturns].reverse():contributionReturns;
  let value=input.initial,principal=input.initial;
  const rows=[{x:0,value,principal,annualReturn:0,deposit:0}];
  rates.forEach((base,i)=>{
    const annualReturn=base*input.returnScale/100,deposit=i+1>input.contributionDelay?input.annualDeposit:0;
    value=value*(1+annualReturn)+deposit;principal+=deposit;rows.push({x:i+1,value,principal,annualReturn,deposit});
  });
  return {rows,value,principal,growth:value-principal};
}
const path=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});

export function taxContributionResult(kind,input){
  if(kind==='taxInstalmentReserve'){
    const p=taxInstalmentLedger(input);
    return {metrics:[['Four entered instalment payments',p.totalPayments,'money'],['Additional cash needed at the start to fund every payment date',p.extra,'money'],['Reserve balance after the December month-end transfer',p.ending,'money']],note:'Fixed 2026 educational calendar for the ordinary quarterly individual-instalment pattern, using independently confirmed payment amounts. CRA lists March 15, June 15, September 15 and December 15, with next-business-day receipt when a due date falls on a weekend or recognized holiday. The March 15 date is Sunday in 2026, so this calendar uses Monday March 16; the other three modeled dates remain the fifteenth. Reserve transfers occur on actual calendar month-ends, after that month’s mid-month payment. Starting reserve earns zero. A transfer into your own reserve is not a payment to CRA. The model does not establish an obligation, determine instalment amounts, select a calculation option, settle final annual tax, calculate interest or penalties, cover farming/fishing or deceased-person exceptions, or guarantee payment-processing time. Check applicable provincial or territorial holiday effects before applying the reference dates. No later-year calendar is inferred. Negative balances are unfunded requirements; no borrowing is assumed.',charts:[
      {id:'tax-instalment-dated-payments',type:'bar',title:'Attach each independently confirmed amount to its 2026 payment date',unit:'money',evidence:'Official due-date rule · hypothetical payment amounts',source:instalmentDateSource.url,sourceLabel:'CRA · Individual instalment due dates and weekend rule',rows:p.payments.map(r=>({label:r.date,value:r.amount})),note:'Dates follow the stated ordinary 2026 calendar, including the March weekend adjustment. Amounts are editable hypothetical inputs, not statutory equal-quarter amounts or a calculation from household income. Confirm the applicable actual amounts and arrangements separately.'},
      {id:'tax-instalment-reserve-calendar',type:'line',title:'A month-end transfer may arrive after the mid-month tax payment',unit:'money',xLabel:'2026 date',xTicks:[{value:0,label:'Jan 1'},{value:181,label:'Jul 1'},{value:364,label:'Dec 31'}],series:[{name:'Reserve after each payment or transfer',rows:p.rows,step:true}],note:'The stepped path retains every payment and month-end transfer event; the table gives full dates. The lowest point controls the starting funding need. The first unfunded event under the selected reserve is '+(p.firstGap??'none in this modeled year')+'. A positive later transfer does not retroactively fund an earlier payment.'},
      {id:'tax-instalment-annual-reconciliation',type:'waterfall',title:'Reconcile reserve transfers separately from tax paid',unit:'money',rows:[{label:'Opening dedicated reserve',value:input.openingReserve},{label:'Twelve month-end reserve transfers',value:p.transfers},{label:'Four instalment payments to CRA',value:-p.totalPayments}],totalLabel:'Reserve after the final December transfer',note:'This year-end amount may be higher than the lowest earlier balance. It is not a final tax refund or balance owing on a tax return. Moving money into a savings bucket and paying tax are two different ledger events.'},
      {id:'tax-instalment-funding-matrix',type:'heatmap',title:'Additional starting cash across monthly transfers and opening reserves',unit:'money',columns:['$500 / mo','$1k','$1.5k','$2k'],rows:[0,3000,6000,9000].map(openingReserve=>({label:'$'+openingReserve/1000+'k start',values:[500,1000,1500,2000].map(monthlyReserve=>taxInstalmentLedger({...input,openingReserve,monthlyReserve}).extra)})),note:'Rows replace the opening reserve; columns replace the month-end transfer. All four entered payment amounts and dates stay selected. Cells show extra starting cash needed to cover every modeled event, rather than the final annual deficit. They do not assess instalment eligibility, required amounts or tax-payment compliance.'}
    ]};
  }
  if(kind==='contributionSequence'){
    const early=contributionSequencePath(input),late=contributionSequencePath(input,true);
    return {metrics:[['Ending portfolio · losses earlier in the chosen sequence',early.value,'money'],['Ending portfolio · reversed sequence, losses later',late.value,'money'],['Initial capital plus deposits made in either path',early.principal,'money']],note:'Original deterministic ten-year total-return illustration. The annual return list is [-15%, -5%, 8%, 10%, 12%, 6%, 4%, 8%, 7%, 5%] times the selected scale. The second path reverses exactly those scaled returns. Both receive the same initial capital and equal deposits on the same eligible year-end dates. Each annual return applies before that year-end deposit; a deposit first earns return in the following year. The selected opening delay skips deposits without later catch-up. No contribution earns return before it arrives. All distributions are retained within the assumed total returns. There are no withdrawals, fees, taxes, market data, probabilities, investment recommendations or future-return estimates. The comparison keeps the same full-period product and arithmetic mean; with no deposits, the two ending values agree.',charts:[
      {id:'contribution-sequence-annual-returns',type:'line',title:'The two paths use the same annual returns in a different order',unit:'percent',unitLabel:'Hypothetical nominal annual total return (%)',xMin:1,xLabel:'Year',series:[path('Losses earlier',early.rows.slice(1),'annualReturn'),path('Reversed order',late.rows.slice(1),'annualReturn',{dash:true})],note:'Every selected return appears once in each sequence. Reversing the order preserves the full-period growth-factor product. The chart describes two authored paths without a probability attached to either.'},
      {id:'contribution-sequence-capital',type:'line',title:'New deposits change how much capital encounters each annual return',unit:'money',xLabel:'Year',series:[path('Portfolio · losses earlier',early.rows,'value'),path('Portfolio · losses later',late.rows,'value',{dash:true}),path('Initial capital plus contributions',early.rows,'principal')],note:'A year-end point is after that year’s return and then its deposit. The principal line contains no investment gain. The selected delayed years skip contributions in both portfolios equally. Compare every endpoint using the same cash-flow schedule.'},
      {id:'contribution-sequence-growth',type:'signedbar',title:'Subtract principal contributed before calling an amount investment growth',unit:'money',rows:[{label:'Losses earlier',value:early.growth},{label:'Losses later',value:late.growth}],note:'Each value is ending portfolio less initial capital and deposits actually made. Negative values are losses relative to those contributions; they are not missing contributions. This dollar measure is not a money-weighted annual return or a statement of tax cost basis.'},
      {id:'contribution-sequence-delay-matrix',type:'heatmap',title:'Ending-value difference across deposit delays and annual saving amounts',unit:'money',signed:true,columns:['$0 / yr','$3k','$6k','$12k'],rows:[0,2,4,6].map(contributionDelay=>({label:contributionDelay+' yr delay',values:[0,3000,6000,12000].map(annualDeposit=>{const q={...input,contributionDelay,annualDeposit};return contributionSequencePath(q).value-contributionSequencePath(q,true).value;})})),note:'Rows replace the number of skipped opening deposits; columns replace each eligible annual deposit. Initial capital and return scale stay selected. Each cell compares two paths with the same timing and amount of contributions. The horizons remain ten years. Signed cells are early-loss ending value minus reversed-order ending value, without any claim that delaying saving is preferable.'}
    ]};
  }
  throw Error('Unknown tax-and-contribution topic.');
}
