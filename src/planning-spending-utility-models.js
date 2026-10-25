import { spendingQuintileData as spending } from './planning-spending-utility-data.js';

export const spendingUtilityDefinitions={
  spendingQuintiles:{title:'Compare a personal spending share with the cash left to allocate',fields:[
    ['monthlyTakeHome','Monthly household take-home cash (CAD)',6000,0,20000,500],
    ['housingCash','Selected monthly housing spending (CAD)',2200,0,10000,100],
    ['foodCash','Selected monthly food spending (CAD)',900,0,5000,100],
    ['transportCash','Selected monthly transportation spending (CAD)',700,0,5000,100],
    ['otherCash','Other selected monthly spending, excluding the three above (CAD)',1200,0,10000,100]
  ]},
  utilitySettlement:{title:'Explore a generic twelve-instalment utility settlement',fields:[
    ['annualEstimate','Reference annual all-in utility cost (CAD)',2400,0,12000,100],
    ['annualCostChange','Change from that reference annual cost (%)',15,-50,100,5],
    ['utilityPayment','Fixed monthly utility instalment in this illustration (CAD)',200,0,2000,10],
    ['settlementReserve','Cash already reserved for an extra settlement (CAD)',0,0,5000,100],
    ['settlementSaving','New cash reserved at each month-end (CAD)',30,0,500,10]
  ]}
};
export function spendingQuintileBudget(input){
  const selectedSpending=input.housingCash+input.foodCash+input.transportCash+input.otherCash;
  return {selectedSpending,remaining:input.monthlyTakeHome-selectedSpending,
    housingSpendingShare:selectedSpending>0?input.housingCash/selectedSpending:null,
    housingIncomeShare:input.monthlyTakeHome>0?input.housingCash/input.monthlyTakeHome:null};
}
export const utilitySeasonWeights=[1.5,1.4,1.2,.9,.7,.6,.6,.7,.9,1,1.2,1.3];
export function utilitySettlementLedger(input){
  const actualCost=input.annualEstimate*(1+input.annualCostChange/100);
  let charges=0,payments=0;
  const rows=[{x:0,charge:0,payment:0,providerBalance:0,reserve:input.settlementReserve}];
  utilitySeasonWeights.forEach((weight,i)=>{
    const charge=actualCost*weight/12,payment=input.utilityPayment;charges+=charge;payments+=payment;
    rows.push({x:i+1,charge,payment,providerBalance:charges-payments,reserve:input.settlementReserve+(i+1)*input.settlementSaving});
  });
  const providerBalance=actualCost-12*input.utilityPayment,extraCharge=Math.max(0,providerBalance),credit=Math.max(0,-providerBalance),reserve=input.settlementReserve+12*input.settlementSaving;
  return {rows,actualCost,payments:12*input.utilityPayment,providerBalance,extraCharge,credit,reserve,gap:Math.max(0,extraCharge-reserve),reserveAfterSettlement:reserve-extraCharge};
}
const line=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});

export function spendingUtilityResult(kind,input){
  if(kind==='spendingQuintiles'){
    const p=spendingQuintileBudget(input);
    return {metrics:[['Housing share of the selected spending total',p.housingSpendingShare,'percent',p.housingSpendingShare===null?'No selected spending':undefined],['Housing share of selected take-home cash',p.housingIncomeShare,'percent',p.housingIncomeShare===null?'No take-home cash':undefined],['Cash after selected spending, before other uses',p.remaining,'money']],note:'The first two charts are fixed 2023 Canadian household survey observations from the release dated 21 May 2025, reviewed 25 October 2026. Shares use total current consumption, not income; the amounts are nominal annual CAD including sales taxes. Canada-level estimates cover the provinces only. These release figures are not presented as the latest revised table, a median or a recommended budget. The separate editable exercise uses selected monthly CAD cash spending and household take-home cash, with no claim of exact reconciliation to survey classifications. Each expense is entered once. Unentered debt repayments, saving, taxes not already withheld and irregular bills still need funding. A negative remainder is a cash gap, not assumed credit. Zero denominators are shown as unavailable shares rather than invented percentages.',charts:[
      {id:'spending-quintile-consumption-shares',type:'groupbar',title:'Different income groups allocate different shares of their consumption',unit:'percent',unitLabel:'Share of total current consumption (%) · 2023 · households in the provinces',seriesNames:['Lowest income quintile','Highest income quintile'],rows:spending.shares.map(r=>({label:r.label,values:[r.lowest/100,r.highest/100]})),source:spending.source,sourceLabel:'Statistics Canada · 2023 SHS release, income-group comparisons',note:'Three selected categories are shown for each group. They are not the full spending basket, and their denominator is consumption rather than income. These are reported group estimates, not shares for every individual household. The comparison does not isolate household size, age, location or other differences.'},
      {id:'spending-quintile-annual-levels',type:'bar',title:'A lower category share can sit inside a much larger spending total',unit:'money',unitLabel:'Average annual household current consumption (CAD) · 2023 release figures',rows:spending.annualConsumption,source:spending.source,sourceLabel:'Statistics Canada · 2023 SHS release, lowest and highest income quintiles',note:'These are mean goods-and-services spending totals, not household income or medians. The bars compare two income groups in the same year. They do not prescribe the amount a household should consume or measure the effect of moving a household into another quintile. No uncertainty interval is calculated here.'},
      {id:'spending-quintile-personal-cash',type:'waterfall',title:'Your own spending plan still needs a cash reconciliation',unit:'money',rows:[{label:'Monthly take-home cash',value:input.monthlyTakeHome},{label:'Selected housing spending',value:-input.housingCash},{label:'Selected food spending',value:-input.foodCash},{label:'Selected transport spending',value:-input.transportCash},{label:'Other selected spending',value:-input.otherCash}],totalLabel:'Cash remaining before other uses',note:'This original monthly cash example is independent of the official annual means. The remainder is not automatically saving: all omitted commitments must still be allocated. Enter non-overlapping costs, and use a dated bill calendar when receipts and payments do not line up.'},
      {id:'spending-quintile-cash-sensitivity',type:'heatmap',title:'Cash left across housing amounts and take-home cash',unit:'money',signed:true,columns:['$4k','$5k','$6k','$7k'],rows:[1500,2000,2500,3000].map(housingCash=>({label:'$'+housingCash/1000+'k home',values:[4000,5000,6000,7000].map(monthlyTakeHome=>spendingQuintileBudget({...input,housingCash,monthlyTakeHome}).remaining)})),note:'Rows replace selected monthly housing spending; columns replace take-home cash. Food, transport and other selected spending stay at the entered values. Negative cells are funding gaps. Positive cells still need to cover unentered uses. No national share or income-quintile membership is assigned to a cell.'}
    ]};
  }
  if(kind==='utilitySettlement'){
    const p=utilitySettlementLedger(input);
    return {metrics:[['Provider settlement balance · positive owed, negative credit',p.providerBalance,'money'],['Separate household cash reserved before settlement',p.reserve,'money'],['Extra funding required after using that reserve',p.gap,'money']],note:'Original generic twelve-month illustration, not a BC Hydro bill, tariff or simulation of its exact plan. Annual all-in cost is the reference estimate times the selected change. Authored seasonal weights sum to twelve and allocate that cost across months; they are not measured weather, electricity use or prices. Twelve selected instalments remain fixed; no provider review is simulated. Reserve saving arrives at each month-end, including month twelve, before an assumed settlement after all twelve instalments. Positive provider balance is an extra charge; negative balance is a credit retained on the provider ledger. A credit is never added to household cash as a refund. The household reserve is separate cash, earns zero and funds only a positive extra charge. No opening provider balance, missed payments, interest, late fees, tariffs, rebates or costs outside the entered all-in total are modeled.',charts:[
      {id:'utility-settlement-monthly-cost',type:'line',title:'Equal instalments can differ from the cost allocated to each month',unit:'money',xMin:1,xLabel:'Month',series:[line('Authored monthly cost allocation',p.rows.slice(1),'charge'),line('Fixed monthly instalment',p.rows.slice(1),'payment',{dash:true})],note:'Month one is an abstract starting month. The reference seasonal weights sum to twelve, so allocated monthly cost reconciles to the selected actual annual cost. These cost allocations are not issued monthly invoices. The instalment line is a hypothetical payment schedule, without an automatic adjustment.'},
      {id:'utility-settlement-two-ledgers',type:'line',title:'A provider balance and household reserve are separate ledgers',unit:'money',xLabel:'Month',series:[line('Provider balance · positive owed',p.rows,'providerBalance'),line('Household cash reserve',p.rows,'reserve',{dash:true})],note:'The provider line is cumulative allocated cost less instalments; a positive interim balance is not modeled as an overdue bill under the plan. A negative balance is a provider credit. The reserve line is cash still held by the household before settlement. Do not add the two as if both were spendable cash.'},
      {id:'utility-settlement-annual-reconciliation',type:'waterfall',title:'Reconcile the annual cost with all twelve instalments',unit:'money',rows:[{label:'Selected actual annual utility cost',value:p.actualCost},{label:'Twelve instalments already paid',value:-p.payments}],totalLabel:'Provider balance · owed or credit',note:'A positive endpoint is the extra settlement charge; a negative endpoint is a credit. The cash reserve is not deducted in this provider reconciliation, because it has not yet been paid. It funds a positive charge in a separate household cash step. Any credit application or refund follows the actual provider’s rules.'},
      {id:'utility-settlement-funding-matrix',type:'heatmap',title:'Extra cash needed after the selected settlement reserve',unit:'money',columns:['$150','$200','$250','$300'],rows:[-10,0,15,30].map(annualCostChange=>({label:annualCostChange+'% cost',values:[150,200,250,300].map(utilityPayment=>utilitySettlementLedger({...input,annualCostChange,utilityPayment}).gap)})),note:'Rows replace the percentage change from the reference annual cost; columns replace the monthly instalment. Reference annual cost, opening cash reserve and monthly reserve saving stay selected. A zero cell can mean instalments cover the cost or cash is reserved for the difference. It does not mean energy use became cheaper.'}
    ]};
  }
  throw Error('Unknown spending or utility topic.');
}
