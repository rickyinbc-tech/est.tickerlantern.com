export const paymentPauseDefinitions={
  paymentPause:{title:'Trace a hypothetical agreed payment pause and two repayment paths',fields:[
    ['amount','Original loan principal (CAD)',20000,1000,100000,1000],
    ['pauseRate','Illustrative nominal annual rate, divided by 12 for monthly interest (%)',8,0,18,1],
    ['loanMonths','Original number of monthly payments',24,12,60,1],
    ['deferMonths','Payments paused after the first six payments',3,1,4,1]
  ]}
};
export function pauseRegularPayment(amount,monthlyRate,months){
  return monthlyRate===0?amount/months:amount*monthlyRate/(-Math.expm1(-months*Math.log1p(monthlyRate)));
}
// Deferred interest stays separate and never earns interest in this constructed agreement.
export function pauseSchedule(input,pauseMonths=0,resumedPayment=null,limit=600){
  const r=input.pauseRate/1200,regular=pauseRegularPayment(input.amount,r,input.loanMonths);
  let principal=input.amount,deferred=0,totalPaid=0,totalInterest=0;
  const rows=[{month:0,principal,deferred,balance:principal,payment:0,interest:0}];
  for(let month=1;month<=limit && principal+deferred>1e-8;month++){
    const interest=principal*r,paused=month>6&&month<=6+pauseMonths;
    totalInterest+=interest;let payment=0;
    if(paused)deferred+=interest;
    else{
      const scheduled=month>6+pauseMonths&&resumedPayment!==null?resumedPayment:regular;
      payment=Math.min(scheduled,principal+deferred+interest);
      if(payment<interest)deferred+=interest-payment;
      else{
        let available=payment-interest;const paidDeferred=Math.min(deferred,available);
        deferred-=paidDeferred;available-=paidDeferred;principal=Math.max(0,principal-available);
      }
    }
    if(principal+deferred<1e-8){principal=0;deferred=0;}
    totalPaid+=payment;rows.push({month,principal,deferred,balance:principal+deferred,payment,interest});
  }
  return {rows,regular,totalPaid,totalInterest,payoff:rows.at(-1).month,remaining:principal+deferred};
}
export function paymentPausePlan(input){
  const baseline=pauseSchedule(input),extended=pauseSchedule(input,input.deferMonths);
  let low=baseline.regular,high=input.amount*(1+input.pauseRate/1200);
  for(let i=0;i<80;i++){
    const middle=(low+high)/2,remaining=pauseSchedule(input,input.deferMonths,middle,input.loanMonths).remaining;
    if(remaining>0)low=middle;else high=middle;
  }
  const restored=pauseSchedule(input,input.deferMonths,high),before=extended.rows[6],endPause=extended.rows[6+input.deferMonths];
  return {baseline,extended,restored,resumedPayment:high,before,endPause,cashRelief:baseline.regular*input.deferMonths};
}
export function paymentPauseResult(kind,input){
  if(kind!=='paymentPause')throw Error('Unknown payment-pause topic.');
  const p=paymentPausePlan(input),lastMonth=Math.max(p.baseline.payoff,p.extended.payoff,p.restored.payoff);
  const paths=[p.baseline,p.extended,p.restored],names=['No pause','Pause, resume original payment','Pause, restore original payoff month'];
  const balanceRows=plan=>Array.from({length:lastMonth+1},(_,x)=>({x,value:plan.rows[x]?.balance??0}));
  return {metrics:[['Payments not paid during the agreed pause',p.cashRelief,'money'],['Resumed monthly payment to restore the original payoff month',p.resumedPayment,'money'],['Extra total interest if the original payment resumes',p.extended.totalInterest-p.baseline.totalInterest,'money']],note:'Original hypothetical instalment-loan illustration, not a lender quote or a Canadian mortgage calculator. Six month-end payments are made before the agreed pause begins in month 7. Interest each month equals outstanding original principal times the entered nominal annual rate divided by 12. During the pause, no cash is paid and interest is recorded separately. No interest is ever charged on that deferred-interest balance, during or after the pause. Once payments resume, they pay current interest first, then deferred interest, then original principal. One path resumes the original payment; another solves a higher payment to clear both balances by the original final month. The final payment is limited to the amount owed. All payments are assumed affordable and made when due. The agreement, allocation rule and continuing exemption from interest on deferred interest are model assumptions, not a statement that every relief arrangement uses them. There are no fees, rate changes, insurance, property taxes, rounding to cents, tax effects, eligibility tests, credit-reporting results or household savings returns. Lower payments during the pause are temporary cash relief, not income or debt forgiveness.',charts:[
    {id:'payment-pause-owed',type:'line',title:'The payment pause interrupts the decline in the amount owed',unit:'money',xLabel:'Months since the original loan began',series:paths.map((plan,i)=>({name:names[i],rows:balanceRows(plan),...(i===1?{dash:true}:{})})),note:'Each line includes unpaid original principal plus the separate deferred-interest balance. A paid-off plan stays at zero through the common display window. The same-payment path can run beyond the original payoff month; the restored-date path requires a higher resumed payment. These are liability balances, not household wealth.'},
    {id:'payment-pause-payment-levels',type:'groupbar',title:'Cash relief now can require a higher payment later',unit:'money',seriesNames:names,rows:[{label:'Before the pause',values:[p.baseline.regular,p.baseline.regular,p.baseline.regular]},{label:'Each paused month',values:[p.baseline.regular,0,0]},{label:'First resumed payment',values:[p.baseline.regular,p.baseline.regular,p.resumedPayment]}],note:'The pause covers months 7 through '+(6+input.deferMonths)+'. The first resumed payment is in month '+(7+input.deferMonths)+'. The bars show regular payment levels at these points, not total amounts across the whole phase. Every path still owes its remaining principal and any unpaid interest.'},
    {id:'payment-pause-interest-ledger',type:'waterfall',title:'Add unpaid interest once; do not add the full skipped instalments to principal',unit:'money',rows:[{label:'Original principal after payment 6',value:p.before.principal},{label:'Interest deferred during the pause',value:p.endPause.deferred}],totalLabel:'Total owed at the end of the pause',note:'Original principal is unchanged during the paused months. Only interest accruing on that principal is added to the separate interest ledger. The principal portion of the skipped instalments was already part of the outstanding original principal; adding those whole instalments again would double-count it. The separate deferred-interest ledger earns no interest in this model.'},
    {id:'payment-pause-total-repaid',type:'stackbar',title:'Compare all cash repayments through each path’s own payoff date',unit:'money',unitLabel:'Total nominal CAD paid until the illustrated debt is cleared',seriesNames:['Original principal repaid','All interest charged'],rows:paths.map((plan,i)=>({label:[`No pause · ${plan.payoff}mo`,`Same pay · ${plan.payoff}mo`,`Restore · ${plan.payoff}mo`][i],values:[input.amount,plan.totalInterest]})),note:'The payoff month is shown in each label, so the totals span different lengths. Deferred interest is included once when charged, not added again when paid. There is no discounting or valuation of the temporary cash relief, and these totals do not rank household welfare or establish that an option is affordable.'},
    {id:'payment-pause-cost-grid',type:'heatmap',title:'Longer pauses and different rates change the same-payment interest cost',unit:'money',columns:['0% rate','6% rate','12% rate','18% rate'],rows:[1,2,3,4].map(deferMonths=>({label:deferMonths+'mo pause',values:[0,6,12,18].map(pauseRate=>{
      const scenario={...input,deferMonths,pauseRate};return pauseSchedule(scenario,deferMonths).totalInterest-pauseSchedule(scenario).totalInterest;
    })})),unitLabel:'Extra interest compared with no pause, resuming the original payment (CAD)',note:'Rows replace paused months and columns replace the nominal annual rate with the same monthly division convention. Original principal, original payment count and the month-7 pause start remain entered. The regular payment is recalculated for each rate. No interest on deferred interest is charged. Cells contain additional total interest over each plan’s full life, with no probability or approval implied.'}
  ]};
}
