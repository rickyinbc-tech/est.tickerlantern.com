// Ordinary-case educational snapshots and hypothetical cash ledgers; no private records.
export const accessBridgeCoverDefinitions={
 rdspRepaymentCash:{title:'Separate an RDSP payment from the government repayment',fields:[
  ['rdspValue','Plan value before this payment (CAD)',100000,0,1000000,5000],['rdspHoldback','Issuer-confirmed assistance holdback amount (CAD)',21000,0,100000,1000],
  ['rdspRequest','Gross payment requested for the beneficiary (CAD)',5000,0,100000,500],['rdspCap','Issuer-confirmed remaining payment capacity for the year (CAD)',10000,0,100000,500]
 ]},
 pensionBridgeEnd:{title:'Map the end of temporary pension income',fields:[
  ['pensionStartAge','Age at the start of the first whole-year period',60,50,75,1],['bridgeStopAge','First whole-year age with no temporary bridge',65,50,80,1],
  ['laterStartAge','First whole-year age with the later income source',67,50,85,1],['pensionYears','Whole years in this cash illustration',15,5,30,1],
  ['lifetimeNet','Ongoing annual pension, year-1 net CAD',32000,0,150000,1000],['bridgeNet','Temporary annual bridge, year-1 net CAD',8000,0,50000,1000],
  ['laterNet','Later annual income, independently entered in year-1 net CAD',14000,0,100000,1000],['pensionSpend','Annual spending, year-1 CAD',45000,0,200000,1000],
  ['pensionInflation','Common annual increase in all cash amounts (%)',2,0,6,.5],['bridgeCash','Cash available at the start (CAD)',30000,0,500000,1000]
 ]},
 rebuildingCashGap:{title:'Compare market value with a hypothetical rebuilding cash need',fields:[
  ['homeMarket','Home market value today, context only (CAD)',1200000,0,5000000,50000],['rebuildNow','Hypothetical covered rebuilding cost today (CAD)',650000,0,3000000,10000],
  ['buildingLimit','Hypothetical dwelling coverage limit today (CAD)',600000,0,3000000,10000],['rebuildGrowth','Annual rebuilding-cost increase assumption (%)',5,0,12,.5],
  ['limitGrowth','Annual increase assumed in that limit (%)',2,0,12,.5],['lossYear','Years until the hypothetical total covered loss',5,0,20,1],
  ['buildingDeductible','Assumed fixed deductible (CAD)',2500,0,50000,500],['rebuildCash','Cash assigned to the owner’s share (CAD)',50000,0,500000,5000]
 ]}
};
export function rdspSinglePayment(i){
 const roomAboveHoldback=Math.max(0,i.rdspValue-i.rdspHoldback);
 const payment=Math.min(i.rdspRequest,i.rdspCap,roomAboveHoldback),repayment=Math.min(3*payment,i.rdspHoldback);
 const remaining=i.rdspValue-payment-repayment,remainingHoldback=i.rdspHoldback-repayment;
 return {payment,repayment,remaining,remainingHoldback,roomAboveHoldback,unpaid:i.rdspRequest-payment,holdbackGap:Math.max(0,remainingHoldback-remaining)};
}
export function bridgeEndCash(i){
 let cash=i.bridgeCash,net=0,minimumNet=0,totalIncome=0,totalSpend=0;
 const rows=[{x:i.pensionStartAge-1,value:cash}];
 for(let year=0;year<i.pensionYears;year++){
  const age=i.pensionStartAge+year,factor=(1+i.pensionInflation/100)**year;
  const lifetime=i.lifetimeNet*factor,bridge=age<i.bridgeStopAge?i.bridgeNet*factor:0,later=age>=i.laterStartAge?i.laterNet*factor:0;
  const income=lifetime+bridge+later,spend=i.pensionSpend*factor;
  net+=income-spend;cash+=income-spend;minimumNet=Math.min(minimumNet,net);totalIncome+=income;totalSpend+=spend;
  rows.push({x:age,value:cash,lifetime,bridge,later,income,spend,net:income-spend});
 }
 const required=Math.max(0,-minimumNet);
 return {rows,cash,required,additional:Math.max(0,required-i.bridgeCash),totalIncome,totalSpend};
}
export function rebuildingGap(i,year=i.lossYear){
 const cost=i.rebuildNow*(1+i.rebuildGrowth/100)**year,limit=i.buildingLimit*(1+i.limitGrowth/100)**year;
 // Explicit teaching contract: limit covered cost first, then deduct the deductible.
 const payout=Math.max(0,Math.min(cost,limit)-i.buildingDeductible),owner=cost-payout;
 return {cost,limit,payout,owner,extra:Math.max(0,owner-i.rebuildCash),cashLeft:i.rebuildCash-owner};
}
const point=(rows,key)=>rows.map(r=>({x:r.x,value:r[key]}));
export function accessBridgeCoverResult(kind,i){
 if(kind==='rdspRepaymentCash'){
  const p=rdspSinglePayment(i),capacity=Math.min(i.rdspCap,p.roomAboveHoldback);
  const curve=Array.from({length:21},(_,n)=>{const x=capacity*n/20;return {x,repay:Math.min(3*x,i.rdspHoldback),draw:x+Math.min(3*x,i.rdspHoldback)};});
  return {metrics:[['Gross beneficiary payment illustrated',p.payment,'money'],['Separate grant/bond repayment',p.repayment,'money'],['Requested payment not illustrated',p.unpaid,'money']],note:'Ordinary proportional-repayment illustration only: beneficiary remains DTC-eligible, is under 60, and the issuer has independently confirmed the AHA and remaining annual payment capacity. It does not determine DAP/LDAP entitlement, annual statutory limits, tax composition or net cash after tax. Requested cash is capped at the entered annual capacity and plan value above the confirmed AHA. The government repayment is the lesser of three times that gross payment and the entered AHA, reducing both plan value and the AHA. No new grants, withdrawals, returns or passage of time are assumed. AHA above plan value produces no payment here and requires issuer review. DTC loss, SDSP/specified-year exceptions, closure and death require different treatment.',charts:[
   {id:'rdsp-account',type:'waterfall',title:'The plan can lose more than the beneficiary receives',unit:'money',rows:[{label:'Opening plan value',value:i.rdspValue},{label:'Gross beneficiary payment',value:-p.payment},{label:'Government repayment',value:-p.repayment}],totalLabel:'Remaining plan value',note:'The government repayment is additional money leaving the plan; it is not deducted again from the gross payment shown for the beneficiary. The beneficiary’s payment may contain taxable amounts, which are not calculated here.'},
   {id:'rdsp-repayment-curve',type:'line',title:'Follow the repayment until the confirmed holdback is exhausted',unit:'money',xLabel:'Gross beneficiary payment (CAD)',xUnit:'money',series:[{name:'Government repayment',rows:point(curve,'repay')},{name:'Total reduction in plan value',dash:true,rows:point(curve,'draw')}],note:'Each point is an independent single-payment alternative from the same opening snapshot. The horizontal range is capped at entered annual capacity and assets above AHA. It is not a sequence of twenty-one withdrawals. A zero-capacity example has only zero payment values.'},
   {id:'rdsp-retained',type:'groupbar',title:'Keep remaining assets and remaining holdback distinct',unit:'money',seriesNames:['Before payment','After payment and repayment'],rows:[{label:'Plan value',values:[i.rdspValue,p.remaining]},{label:'Assistance holdback amount',values:[i.rdspHoldback,p.remainingHoldback]}],note:'AHA is a repayment-related restriction, not a second investment account to add to plan value. If entered AHA already exceeds assets, this tool makes no payment and does not claim that the deficit has been repaired.'},
   {id:'rdsp-formula',type:'heatmap',title:'Isolate the proportional-repayment formula',unit:'money',columns:['$1k pay','$3k pay','$5k pay','$10k pay'],rows:[0,5000,15000,30000].map(holdback=>({label:'AHA '+holdback/1000+'k',values:[1000,3000,5000,10000].map(payment=>Math.min(3*payment,holdback))})),note:'Cells are conditional formula results only: min(3 × gross payment, AHA). They do not confirm that any displayed withdrawal is permitted, adequately funded or within annual limits. The selected controls do not change these fixed formula comparisons.'}
  ]};
 }
 if(kind==='pensionBridgeEnd'){
  const p=bridgeEndCash(i),last=i.pensionStartAge+i.pensionYears-1;
  const ages=[...new Set([i.pensionStartAge,i.bridgeStopAge-1,i.bridgeStopAge,i.laterStartAge-1,i.laterStartAge,last])].filter(age=>age>=i.pensionStartAge&&age<=last).sort((a,b)=>a-b);
  return {metrics:[['Starting cash needed for the annual schedule',p.required,'money'],['Additional cash beyond the selected reserve',p.additional,'money'],['Cash position at the last year-end',p.cash,'money']],note:'Hypothetical whole-year age bands; receipts arrive before that year’s spending at year-end. A temporary bridge is present only below the selected stop age. The later income begins independently at its selected start age. All income and spending inputs are year-1 net cash amounts, increased at the same constant assumption. Annual surpluses remain in this zero-interest cash ledger. Negative balances are unfunded positions, not an available overdraft. The tool does not calculate an employer pension, CPP/QPP/OAS entitlement, start-age adjustment, withholding or actual birthday-month proration; changing a start date does not reprice an income quote. No survivor/disability events or spending beyond the horizon are included.',charts:[
   {id:'bridge-end-mix',type:'stackbar',title:'Look at the income mix around the change dates',unit:'money',seriesNames:['Ongoing pension','Temporary bridge','Later income'],rows:ages.map(age=>{const r=p.rows.find(r=>r.x===age);return {label:'Age '+age,values:[r.lifetime,r.bridge,r.later]};}),note:'Selected first/last ages and ages just before/at each transition. Repeated or out-of-window ages are omitted. All amounts are nominal annual net cash in the displayed age band; the components add to its modeled income.'},
   {id:'bridge-end-budget',type:'line',title:'The bridge end and later-income start need not coincide',unit:'money',xMin:i.pensionStartAge,xLabel:'Age during the whole-year period',series:[{name:'Income before savings',rows:point(p.rows.slice(1),'income')},{name:'Spending',dash:true,rows:point(p.rows.slice(1),'spend')}],note:'The two curves cover every modeled year. A line between annual totals is a visual guide, not a monthly payment forecast. The later income is an independent entered amount, not an automatic replacement of the bridge.'},
   {id:'bridge-end-cash',type:'line',title:'Track the reserve through the income drop and any later surplus',unit:'money',xMin:i.pensionStartAge-1,xLabel:'Age band completed',series:[{name:'Unfunded / remaining cash position',rows:p.rows}],note:'The opening point precedes the first age band. Every later point includes that year’s receipts and bills. Additional starting cash covers the deepest annual deficit under this ordering, but does not establish that every within-year bill can be paid.'},
   {id:'bridge-end-matrix',type:'heatmap',title:'Additional cash if the two transition ages differ',unit:'money',columns:['Later 65','Later 67','Later 70','Later 72'],rows:[64,65,66,67].map(bridgeStopAge=>({label:'Ends '+bridgeStopAge,values:[65,67,70,72].map(laterStartAge=>bridgeEndCash({...i,bridgeStopAge,laterStartAge}).additional)})),note:'Rows change the first age without a bridge; columns change the later-income start. Amounts, horizon and selected reserve stay fixed. These are calendar sensitivities, not available pension elections. Income changes outside the chosen horizon are not tested.'}
  ]};
 }
 if(kind==='rebuildingCashGap'){
  const p=rebuildingGap(i),path=Array.from({length:i.lossYear+1},(_,x)=>({x,...rebuildingGap(i,x)}));
  return {metrics:[['Modeled covered rebuilding cost at loss date',p.cost,'money'],['Owner’s share under the teaching contract',p.owner,'money'],['Additional cash beyond the assigned reserve',p.extra,'money']],note:'Hypothetical total covered dwelling loss at the selected future date, not an insurance quotation, valuation or claim determination. Market value is context only and never enters the payout. Rebuilding cost and the coverage limit grow at separate constant assumptions. The teaching contract first limits the covered cost to the stated limit, then subtracts a fixed deductible, flooring payout at zero. Actual policy wording may apply limits and deductibles differently. No guaranteed/extended replacement provision, coinsurance, exclusions, bylaw costs, contents, land, additional living expenses, claim delay or future premium is modeled. The reserve is immediately available and earns no interest.',charts:[
   {id:'rebuild-values',type:'bar',title:'Three property figures answer different questions',unit:'money',rows:[{label:'Market value today',value:i.homeMarket},{label:'Covered rebuilding cost today',value:i.rebuildNow},{label:'Dwelling limit today',value:i.buildingLimit}],note:'Market value can include land and demand for the location. It is not used as the rebuilding-cost estimate or as an automatic claim limit. All three numbers here are independently entered assumptions.'},
   {id:'rebuild-path',type:'line',title:'A limit and a rebuilding estimate can grow at different rates',unit:'money',xLabel:'Years after the starting snapshot',series:[{name:'Hypothetical rebuilding cost',rows:point(path,'cost')},{name:'Assumed dwelling limit',dash:true,rows:point(path,'limit')}],note:'Smooth annual growth is a sensitivity, not a construction-cost forecast or a promised policy adjustment. A zero-year loss uses the starting figures. Review actual estimates, renewal documents and any replacement-cost conditions with the insurer.'},
   {id:'rebuild-funding',type:'waterfall',title:'Reconcile the rebuilding bill, modeled payout and assigned cash',unit:'money',rows:[{label:'Covered rebuilding bill',value:p.cost},{label:'Assumed insurer payment',value:-p.payout},{label:'Owner’s assigned cash',value:-i.rebuildCash}],totalLabel:'Unfunded cost / cash left',note:'A positive endpoint is extra cash needed; a negative endpoint is unused assigned cash. The deductible is already included in the owner’s share through the payout formula and is not added again. No asset sale, borrowing or actual claim settlement is implied.'},
   {id:'rebuild-matrix',type:'heatmap',title:'Extra cash under different cost increases and loss dates',unit:'money',columns:['Year 0','Year 5','Year 10','Year 15'],rows:[0,3,6,9].map(rebuildGrowth=>({label:'Cost +'+rebuildGrowth+'%',values:[0,5,10,15].map(year=>rebuildingGap({...i,rebuildGrowth},year).extra)})),note:'Cells change only the rebuilding-cost growth rate and loss date. Starting cost, limit growth, deductible and reserve stay selected. No probability is assigned to any date or increase; the matrix is not an estimate of insurance loss frequency.'}
  ]};
 }throw Error('Unknown access/bridge/coverage scenario: '+kind);
}
