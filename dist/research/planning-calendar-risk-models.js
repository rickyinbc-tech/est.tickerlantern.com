// Original deterministic teaching models. No payroll, market or retirement forecast.
export const calendarRiskDefinitions = {
  jobOffer: {title:'Compare take-home pay, work costs and commuting time',fields:[
    ['netA','Current job: monthly take-home pay (CAD)',4500,0,30000,100],
    ['netB','New job: monthly take-home pay (CAD)',5000,0,30000,100],
    ['workDaysA','Current job: commuting days per working week',3,0,5,1],
    ['workDaysB','New job: commuting days per working week',5,0,5,1],
    ['dayCostA','Current job: return-trip cost per commuting day (CAD)',12,0,200,1],
    ['dayCostB','New job: return-trip cost per commuting day (CAD)',28,0,200,1],
    ['otherA','Current job: other monthly work costs (CAD)',50,0,3000,25],
    ['otherB','New job: other monthly work costs (CAD)',100,0,3000,25],
    ['minutesA','Current job: return-trip commuting minutes per day',45,0,300,5],
    ['minutesB','New job: return-trip commuting minutes per day',90,0,300,5],
    ['workWeeks','Working weeks with commuting in the year',46,1,52,1]
  ]},
  goalDeadline: {title:'Stress-test a goal with a fixed payment date',fields:[
    ['initial','Starting goal savings (CAD)',30000,0,500000,1000],
    ['monthly','Monthly contribution at month-end (CAD)',500,0,10000,100],
    ['months','Months until the goal payment',24,1,60,1],
    ['goal','Nominal amount needed at the deadline (CAD)',50000,0,1000000,1000],
    ['exposed','Share of savings and new deposits exposed to the loss (%)',60,0,100,5],
    ['loss','One-time loss on the exposed portion (%)',25,0,60,5],
    ['shockMonth','Loss at the start of this month; later than deadline means no loss',18,1,60,1]
  ]},
  spendingRule: {title:'Explore the cost of a retirement spending adjustment',fields:[
    ['initial','Starting portfolio in today’s CAD',600000,0,3000000,10000],
    ['essential','Annual essential spending requested from this portfolio (today’s CAD)',18000,0,100000,1000],
    ['flexible','Initial annual flexible spending requested (today’s CAD)',12000,0,100000,1000],
    ['trigger','Requested withdrawal / opening balance trigger (%)',5,1,20,.5],
    ['cut','Cut to remaining flexible spending when triggered (%)',20,0,100,5],
    ['loss','First-year real portfolio loss (%)',25,0,60,5],
    ['rate','Real return in each subsequent year (%)',3,-5,8,.5],
    ['years','Years in the illustration',30,2,40,1]
  ]}
};

export function jobOfferComparison(input) {
  const make=suffix=>{
    const days=input['workDays'+suffix]*input.workWeeks;
    const commuting=days*input['dayCost'+suffix],other=12*input['other'+suffix],pay=12*input['net'+suffix];
    return {days,commuting,other,pay,cost:commuting+other,remaining:pay-commuting-other,hours:days*input['minutes'+suffix]/60};
  };
  const current=make('A'),offer=make('B');
  return {current,offer,gain:offer.remaining-current.remaining,extraHours:offer.hours-current.hours,breakEven:(current.remaining+offer.cost)/12};
}

export function deadlineGoal(input) {
  let balance=input.initial,lossAmount=0;
  const rows=[{x:0,value:balance}];
  for(let month=1;month<=input.months;month++) {
    if(month===input.shockMonth) {
      lossAmount=balance*input.exposed/100*input.loss/100;balance-=lossAmount;
      rows.push({x:month-1,value:balance});
    }
    balance+=input.monthly;rows.push({x:month,value:balance});
  }
  const baseline=input.initial+input.monthly*input.months;
  return {rows,balance,baseline,lossAmount,gap:Math.max(0,input.goal-balance),surplus:Math.max(0,balance-input.goal)};
}
export function deadlineMonthlyNeeded(input) {
  const hit=input.shockMonth<=input.months?input.exposed/100*input.loss/100:0;
  // Only the first shockMonth-1 month-end deposits are present when the loss arrives.
  return Math.max(0,(input.goal-input.initial*(1-hit))/(input.months-(input.shockMonth-1)*hit));
}

export function retirementSpendingRule(input,adjust=true) {
  let balance=input.initial,flexible=input.flexible,essentialPaid=0,flexiblePaid=0,unmet=0,unmetEssential=0,foregone=0;
  const rows=[{x:0,value:balance}],annual=[];
  for(let year=1;year<=input.years;year++) {
    const requestBefore=input.essential+flexible;
    const triggered=adjust&&requestBefore>0&&(balance===0||requestBefore/balance>input.trigger/100);
    if(triggered)flexible*=1-input.cut/100;
    const requested=input.essential+flexible,paidEssential=Math.min(balance,input.essential);
    const paidFlexible=Math.min(Math.max(0,balance-paidEssential),flexible),paid=paidEssential+paidFlexible;
    essentialPaid+=paidEssential;flexiblePaid+=paidFlexible;unmet+=requested-paid;unmetEssential+=input.essential-paidEssential;
    foregone+=input.flexible-flexible;
    balance=(balance-paid)*(1+(year===1?-input.loss/100:input.rate/100));
    annual.push({x:year,requested,paid,flexible,triggered,value:balance});rows.push({x:year,value:balance});
  }
  return {rows,annual,balance,essentialPaid,flexiblePaid,unmet,unmetEssential,foregone};
}

export function calendarRiskResult(kind,input) {
  if(kind==='jobOffer') {
    const p=jobOfferComparison(input);
    return {metrics:[['Additional annual cash after the specified work costs',p.gain,'money'],['Additional commuting hours per year',p.extraHours,'decimal'],['New monthly take-home pay to match current remaining cash',p.breakEven,'money']],note:'Original full-year job comparison in nominal CAD. Each monthly take-home amount is entered independently after payroll deductions and is received for all twelve months. Commuting days equal days per working week × the shared number of working weeks. Return-trip cash cost and return-trip time are entered per commuting day. Other work costs are constant monthly amounts incurred throughout the year. Take-home pay less these specified work costs is a partial cash comparison, not a complete household budget. Negative remaining cash is a deficit to fund separately. No tax, gross-to-net salary conversion, bonus, benefit, employer match, moving cost, start-date gap or pension valuation is calculated. Time is shown separately without assigning an hourly money value. Paid work hours, overtime, caregiving and job quality are outside the comparison. The entered amounts are assumptions, not observed salary or commuting statistics.',charts:[
      {id:'job-offer-cash-bridge',type:'waterfall',title:'Follow the pay increase through the extra work costs',unit:'money',rows:[{label:'Annual take-home pay difference',value:p.offer.pay-p.current.pay},{label:'Effect of different commuting costs',value:p.current.commuting-p.offer.commuting},{label:'Effect of other work-cost differences',value:p.current.other-p.offer.other}],totalLabel:'Additional annual remaining cash',note:'Each cost step subtracts only the increase from the current job, rather than the full new cost. A cost reduction adds to the result. The total can be negative even when take-home pay increases. A positive endpoint does not include the costs or benefits omitted from the comparison.'},
      {id:'job-offer-pay-costs',type:'groupbar',title:'Compare annual net receipts and the work costs paid from them',unit:'money',seriesNames:['Take-home pay received','Specified work costs'],rows:[{label:'Current job',values:[p.current.pay,p.current.cost]},{label:'New job',values:[p.offer.pay,p.offer.cost]}],note:'The difference within each pair is remaining cash after the entered costs, before ordinary household expenses and saving. Take-home amounts should use comparable payroll assumptions and include all twelve months. Benefits paid directly by an employer are not cash receipts in this chart.'},
      {id:'job-offer-commuting-time',type:'bar',title:'Keep commuting time visible beside the cash comparison',unit:'decimal',unitLabel:'Hours per year spent commuting; return trips',rows:[{label:'Current job: annual commuting hours',value:p.current.hours},{label:'New job: annual commuting hours',value:p.offer.hours}],note:'Hours equal return-trip minutes × commuting days per week × working weeks ÷ 60. This measures travel time only; it does not compare total working time, calculate an hourly wage or price the household value of an extra hour. The data table retains the hours even when the cash difference is negative.'},
      {id:'job-offer-commute-matrix',type:'heatmap',title:'Additional annual cash across new-job commute assumptions',unit:'money',signed:true,columns:['$10/day','$20/day','$30/day','$40/day'],rows:[1,3,4,5].map(workDaysB=>({label:workDaysB+' days/week',values:[10,20,30,40].map(dayCostB=>jobOfferComparison({...input,workDaysB,dayCostB}).gain)})),note:'Each cell changes only new-job commuting days and return-trip cash cost. Current-job costs, both take-home amounts, other monthly costs and working weeks stay fixed. Positive amounts mean more remaining cash in the new job; negative amounts mean less. The matrix does not price travel time or imply that different office schedules are available.'}
    ]};
  }
  if(kind==='goalDeadline') {
    const p=deadlineGoal(input),needed=deadlineMonthlyNeeded(input);
    return {metrics:[['Savings at the payment deadline after the loss',p.balance,'money'],['Amount still missing at the deadline',p.gap,'money'],['Monthly deposit needed from the start under this stress',needed,'money']],note:'Original nominal goal illustration with one possible loss and otherwise zero returns. The selected share of starting savings and every new deposit is exposed to the one-time percentage loss. The remaining share keeps a constant nominal value in this model; no actual investment is promised to do so. The loss occurs at the start of its selected month, before that month’s deposit, only if the month falls within the goal horizon. No rebound, ongoing growth, interest, taxes, fees or inflation is modeled. Deposits continue at month-end through the deadline. No goal payment has yet been deducted from the final balance. The amount needed is a fixed nominal bill, not a future cost forecast. No probability is assigned to any loss or allocation.',charts:[
      {id:'deadline-savings-path',type:'line',title:'The payment date does not move when savings fall',unit:'money',xLabel:'Months from the start; deposits at month-end',series:[{name:'Zero-return path without a loss',rows:[{x:0,value:input.initial},{x:input.months,value:p.baseline}]},{name:'Selected one-loss scenario',rows:p.rows,dash:true},{name:'Amount due at the deadline',rows:[{x:0,value:input.goal},{x:input.months,value:input.goal}]}],note:'The vertical change at the start of the loss month comes before its deposit. A loss in month 18 appears immediately after month 17 ends. A loss month beyond the deadline leaves both savings paths identical. Straight segments between deposits are a drawing aid, not continuous saving.'},
      {id:'deadline-loss-reconciliation',type:'waterfall',title:'Show exactly which dollars the stress removes',unit:'money',rows:[{label:'Starting savings',value:input.initial},{label:'All scheduled deposits',value:input.monthly*input.months},{label:'Loss on funds present at the stress date',value:-p.lossAmount}],totalLabel:'Savings before the goal payment',note:'The loss applies only to the exposed share of the starting amount and deposits already present. Later deposits avoid this single modeled event. This arithmetic does not establish that later investing is generally safer or that market losses occur only once.'},
      {id:'deadline-exposure-comparison',type:'groupbar',title:'Compare available savings with the same nominal bill',unit:'money',seriesNames:['Savings at deadline','Goal payment'],rows:[0,input.exposed,100].filter((w,i,a)=>a.indexOf(w)===i).map(exposed=>({label:exposed+'% exposed to the loss',values:[deadlineGoal({...input,exposed}).balance,input.goal]})),note:'The starting savings, contribution, deadline and loss month stay unchanged. Only the loss-exposed share changes. The zero-exposure case has zero nominal return and no modeled loss, while still facing any original saving shortfall. Real products also have access, credit, inflation and other terms to assess.'},
      {id:'deadline-required-saving',type:'heatmap',title:'Required monthly saving from today under alternative stresses',unit:'money',columns:['10% loss','20% loss','30% loss','50% loss'],rows:[0,25,50,100].map(exposed=>({label:exposed+'% exposed',values:[10,20,30,50].map(loss=>deadlineMonthlyNeeded({...input,exposed,loss}))})),note:'These cells replace the monthly contribution with the amount that exactly funds the goal, floored at zero. They are not top-ups added to your selected contribution. All monthly deposits begin from the start and follow the same exposure split; pre-loss deposits also suffer the loss. If the stress is after the deadline, loss size and exposure do not affect the cells.'}
    ]};
  }
  if(kind==='spendingRule') {
    const p=retirementSpendingRule(input),fixed=retirementSpendingRule(input,false);
    return {metrics:[['Portfolio remaining under the adjustment rule (today’s CAD)',p.balance,'money'],['Cumulative flexible spending deliberately forgone (today’s CAD)',p.foregone,'money'],['Unfunded essential requests under the rule (today’s CAD)',p.unmetEssential,'money']],note:'Original deterministic illustration in today’s CAD throughout: all returns are real, so no further inflation increase is applied to expenses. Essential and flexible amounts are the spending requested from this portfolio after any income funded elsewhere. At the start of each year, before withdrawal and that year’s return, compare the planned essential plus remaining flexible request with opening assets. If it strictly exceeds the selected percentage, cut the remaining flexible amount once by the selected proportion. Essential requests stay unchanged; cuts persist and are never automatically restored. A zero balance with a positive request triggers the rule. Pay essential requests first, then flexible requests, using available assets only. Record unpaid requests without borrowing. Apply the selected first-year loss to assets left after withdrawal; subsequent years use the constant real return. No pension calculation, tax, fees, RRIF rule, benefit adjustment, mortality or probability of success is included. The trigger is a chosen teaching input, not a safe withdrawal rate or a published guardrail method.',charts:[
      {id:'spending-rule-assets',type:'line',title:'A larger ending portfolio can be purchased with lower spending',unit:'money',unitLabel:'Today’s Canadian dollars (real CAD)',xLabel:'Years from retirement',series:[{name:'Constant real spending request',rows:fixed.rows},{name:'Cuts to remaining flexible spending',rows:p.rows,dash:true}],note:'Both paths use the same initial portfolio and return sequence. The rule can change consumption every year, so a higher ending balance is not superior investment performance. Assets stop at zero; unmet requests are retained in the spending ledger.'},
      {id:'spending-rule-consumption',type:'line',title:'Read the household spending path beside the asset path',unit:'money',unitLabel:'Annual spending in today’s CAD',xMin:1,xLabel:'Retirement year; annual amounts',series:[{name:'Original annual spending request',rows:p.annual.map(r=>({x:r.x,value:input.essential+input.flexible}))},{name:'Adjusted annual request',rows:p.annual.map(r=>({x:r.x,value:r.requested})),dash:true},{name:'Actually funded under the rule',rows:p.annual.map(r=>({x:r.x,value:r.paid}))}],note:'The adjusted request can fall through repeated cuts even if assets remain positive. Funded spending can fall below that request when cash runs out. A chosen reduction in flexible spending and an inability to fund an essential bill are separate outcomes.'},
      {id:'spending-rule-funded-needs',type:'stackbar',title:'Separate what was paid from requests that assets could not fund',unit:'money',unitLabel:'Cumulative amounts in today’s CAD; undiscounted',seriesNames:['Essential spending paid','Flexible spending paid','Unfunded requests'],rows:[{label:'Constant real request',values:[fixed.essentialPaid,fixed.flexiblePaid,fixed.unmet]},{label:'Flexible-spending cuts',values:[p.essentialPaid,p.flexiblePaid,p.unmet]}],note:'Each bar totals its own requested spending over the horizon. Deliberately forgone flexible spending is excluded from the adjusted bar, not counted as an unpaid bill. Bar totals therefore differ. These real amounts are undiscounted consumption sums, not portfolio values or present values.'},
      {id:'spending-rule-stress-matrix',type:'heatmap',title:'Ending assets across loss and spending-cut assumptions',unit:'money',unitLabel:'Portfolio at the selected finish in today’s CAD',columns:['0% loss','15% loss','30% loss','45% loss'],rows:[0,10,20,30].map(cut=>({label:cut+'% cut',values:[0,15,30,45].map(loss=>retirementSpendingRule({...input,cut,loss}).balance)})),note:'Rows change the recurring cut to remaining flexible spending and columns change the first-year real return to the shown loss. The trigger, essential need, later real return and horizon stay fixed. The 0% cut row makes no spending adjustment. Darker cells do not imply a more comfortable retirement: inspect the spending sacrificed and any unpaid essentials.'}
    ]};
  }
  throw Error('Unknown calendar and risk planning topic.');
}
