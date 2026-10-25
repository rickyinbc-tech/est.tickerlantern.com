export const contributionTaxCashDefinitions={
 dcaBudget:{title:'Make the contribution schedule live inside the household budget',fields:[
  ['budgetFund','Starting investment balance (CAD)',20000,0,500000,1000],
  ['budgetCash','Starting accessible cash, separate from the investment (CAD)',5000,0,50000,500],
  ['budgetIncome','Normal monthly take-home income (CAD)',4000,0,15000,100],
  ['budgetLowIncome','Monthly take-home income during the interruption (CAD)',1500,0,15000,100],
  ['budgetSpending','Essential monthly spending (CAD)',3200,0,15000,100],
  ['budgetTransfer','Desired monthly investment transfer, if affordable (CAD)',500,0,5000,100],
  ['budgetFloor','Cash floor used to limit new investment transfers (CAD)',3000,0,20000,500],
  ['budgetStart','First month of the income interruption',3,1,12,1],
  ['budgetDuration','Income-interruption months, clipped at month twelve',3,0,12,1],
  ['budgetPath','Authored returns: 1 = decline/rebound, 2 = steady gains',1,1,2,1],
  ['budgetScale','Scale of the authored monthly investment returns (%)',100,0,150,10]
 ]},
 fundTaxCash:{title:'Reinvest the distribution only after identifying its tax cash',fields:[
  ['taxCashUnits','Units owned before the distribution',500,1,10000,1],
  ['taxCashNav','NAV immediately before the distribution (CAD per unit)',21,10,100,1],
  ['taxCashDistribution','Gross distribution per original unit (CAD)',1,0,5,.1],
  ['taxCashReinvest','Gross distribution reinvested (%)',100,0,100,5],
  ['taxCashFactor','Hypothetical tax provision as a share of the gross distribution (%)',30,0,60,5],
  ['taxCashOutside','Dedicated tax cash already outside the fund (CAD)',0,0,10000,100]
 ]}
};

export const budgetReturnPaths=[
 {name:'Decline and rebound',returns:[.01,-.08,-.12,-.06,.10,.08,.03,.02,.02,.01,.01,.01]},
 {name:'Steady monthly gains',returns:Array(12).fill(.01)}
];

export function dcaBudgetPlan(input,{floor=input.budgetFloor,duration=input.budgetDuration}={}){
 let fund=input.budgetFund,cash=input.budgetCash,transfers=0,sales=0,shortfall=0;
 const rows=[{x:0,fund,cash,wealth:fund+cash,income:0,spending:0,transfer:0,sale:0,unfunded:0,investmentChange:0}];
 budgetReturnPaths[input.budgetPath-1].returns.forEach((base,index)=>{
  const month=index+1,income=month>=input.budgetStart&&month<input.budgetStart+duration?input.budgetLowIncome:input.budgetIncome;
  const investmentChange=fund*base*input.budgetScale/100;fund+=investmentChange;
  cash+=income-input.budgetSpending;
  const sale=Math.min(fund,Math.max(0,-cash));fund-=sale;cash+=sale;
  const unfunded=Math.max(0,-cash);cash=Math.max(0,cash);
  const transfer=Math.min(input.budgetTransfer,Math.max(0,cash-floor));cash-=transfer;fund+=transfer;
  transfers+=transfer;sales+=sale;shortfall+=unfunded;
  rows.push({x:month,fund,cash,wealth:fund+cash,income,spending:input.budgetSpending,transfer,sale,unfunded,investmentChange});
 });
 return {rows,transfers,sales,shortfall,fund,cash,wealth:fund+cash};
}

export function fundTaxCashPlan(input,{reinvest=input.taxCashReinvest,factor=input.taxCashFactor}={}){
 const distribution=input.taxCashUnits*input.taxCashDistribution,postNav=input.taxCashNav-input.taxCashDistribution;
 const reinvested=distribution*reinvest/100,retained=distribution-reinvested;
 const newUnits=reinvested/postNav,fund=(input.taxCashUnits+newUnits)*postNav;
 const cash=input.taxCashOutside+retained,provision=distribution*factor/100;
 const cashAfterProvision=cash-provision,unfunded=Math.max(0,-cashAfterProvision);
 const before=input.taxCashUnits*input.taxCashNav+input.taxCashOutside;
 const requiredRetained=Math.max(0,provision-input.taxCashOutside);
 const maxReinvest=distribution===0?100:100*Math.max(0,Math.min(1,1-requiredRetained/distribution));
 return {distribution,postNav,reinvested,retained,newUnits,fund,cash,provision,cashAfterProvision,unfunded,before,net:fund+cash-provision,maxReinvest};
}

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:2});
export function contributionTaxCashResult(kind,input){
 if(kind==='dcaBudget'){
  const aware=dcaBudgetPlan(input),unbuffered=dcaBudgetPlan(input,{floor:0});
  return {metrics:[['Actual new investment transfers · selected cash floor',aware.transfers,'money'],['Investment sold for essential spending · selected floor',aware.sales,'money'],['Unfunded essential spending · selected floor',aware.shortfall,'money']],
   note:'Hypothetical twelve-month household exercise in nominal CAD, using authored investment returns, not crisis observations or a fund forecast. Selected path: '+budgetReturnPaths[input.budgetPath-1].name+'. Each month applies the investment return, receives income, pays essential spending, sells available investment only if cash cannot fund that spending, records any remaining unfunded expense, and then transfers at most the desired amount from cash above the selected floor. The comparison uses the identical order with a zero cash floor. Both start with identical separate cash/investment balances and have identical income and required spending. The floor restricts new purchases; it does not stop cash being used for essentials or guarantee the floor is maintained. No borrowing, tax, fees, cash interest, inflation or settlement delay is modeled. Unfunded essentials: selected-floor rule '+money(aware.shortfall)+'; zero-floor rule '+money(unbuffered.shortfall)+'. Unpaid spending is a shortfall, not a successful budget.',
   charts:[
    {id:'dca-budget-income-spending',type:'line',title:'An income interruption changes what the contribution schedule can afford',unit:'money',xLabel:'Month',series:[{name:'Take-home income',rows:aware.rows.slice(1).map(r=>({x:r.x,value:r.income}))},{name:'Essential spending',rows:aware.rows.slice(1).map(r=>({x:r.x,value:r.spending})),dash:true}],note:'These two cash-flow series are the same under both rules. Spending is a fixed monthly assumption. A temporary income gap can coincide with weak markets, but this scenario assigns no probability to that overlap. Within-month pay and bill dates require a separate calendar.'},
    {id:'dca-budget-cash-floor',type:'line',title:'The cash floor limits purchases; essential bills can still take cash below it',unit:'money',xLabel:'Month-end',series:[{name:'Selected cash-floor rule',rows:aware.rows.map(r=>({x:r.x,value:r.cash}))},{name:'Zero cash-floor rule',rows:unbuffered.rows.map(r=>({x:r.x,value:r.cash}))},{name:'Selected purchase floor',rows:aware.rows.map(r=>({x:r.x,value:input.budgetFloor})),dash:true}],note:'A floor is not an extra asset or a guaranteed account balance. Both rules use accessible cash for essentials and cap investment transfers at available cash. The zero-floor comparison can use more cash for purchases earlier, leaving less for a later income gap.'},
    {id:'dca-budget-total-resources',type:'line',title:'Compare investment plus cash, rather than only the fund statement',unit:'money',xLabel:'Month-end',series:[{name:'Selected floor · fund plus cash',rows:aware.rows.map(r=>({x:r.x,value:r.wealth}))},{name:'Zero floor · fund plus cash',rows:unbuffered.rows.map(r=>({x:r.x,value:r.wealth}))}],note:'Transfers and sales move value between the two accounts and do not themselves create or destroy resources in this no-cost example. Actual income, funded spending and the return earned on invested dollars change total resources. Higher cash can reduce exposure to losses and also to gains. Check unfunded expenses separately before treating a balance as adequate.'},
    {id:'dca-budget-forced-sale-grid',type:'heatmap',title:'Longer income interruptions can require sales even with a purchase floor',unit:'money',columns:['0 mo','2 mo','4 mo','6 mo'],rows:[0,2000,4000,6000].map(floor=>({label:'$'+floor/1000+'k floor',values:[0,2,4,6].map(duration=>dcaBudgetPlan(input,{floor,duration}).sales)})),note:'Rows replace the purchase floor; columns replace interruption length from the selected starting month, clipped at month twelve. Other assumptions stay selected. Cells report gross investment sold to fund essentials, not capital losses or required reserve targets. A zero can also occur when there is no investment left to sell; consult the unfunded-spending metric and compare the available resources.'}
   ]};
 }
 if(kind!=='fundTaxCash')throw Error('Unknown contribution/tax-cash topic.');
 const p=fundTaxCashPlan(input);
 return {metrics:[['Illustrative distribution-tax provision',p.provision,'money'],['Unfunded provision after available distribution/outside cash',p.unfunded,'money'],['Maximum reinvestment funded without selling or new outside cash',p.maxReinvest/100,'percent']],
  note:'Hypothetical non-registered fund distribution in CAD, with no intervening market movement or transaction cost. The NAV falls by the distribution per original unit; the selected part is immediately reinvested at the post-distribution NAV. The tax-provision factor is a user-entered effective teaching assumption applied to the gross distribution, not a Canadian marginal rate, capital-gains inclusion rate, issuer withholding rate or actual tax calculation. No income-character mix, dividend gross-up/credit, foreign tax, cost-base calculation, sale or tax from a sale is modeled. Dedicated outside cash is counted once. A cash gap is identified, not automatically funded. Net resources deduct the full modeled liability whether cash is available or not; they do not prove that liability has been paid. No tax payment date or filing requirement is determined. Registered-account treatment is outside this illustration.',
  charts:[
   {id:'fund-tax-cash-allocation',type:'stackbar',title:'Reinvesting more changes the location of value, not its immediate total',unit:'money',seriesNames:['Fund value after reinvestment','Distribution cash plus dedicated outside cash'],rows:[0,p.maxReinvest,100].map(reinvest=>{const q=fundTaxCashPlan(input,{reinvest});return {label:reinvest===0?'Retain all distribution cash':reinvest===100?'Reinvest all distribution':reinvest.toFixed(1)+'% reinvest · provision funded',values:[q.fund,q.cash]};}),note:'Every row starts with the same units, pre-distribution NAV and dedicated outside cash. The middle scenario retains only the cash needed to cover the provision after outside cash, with reinvestment capped at 100%. All bars total the same pre-tax resources. This comparison assumes a distribution eligible for a cash/reinvestment choice, not a non-cash phantom distribution.'},
   {id:'fund-tax-cash-liability-bridge',type:'waterfall',title:'Deduct the modeled liability once when assessing net resources',unit:'money',rows:[{label:'Fund before distribution',value:input.taxCashUnits*input.taxCashNav},{label:'Dedicated outside cash',value:input.taxCashOutside},{label:'Distribution-tax provision',value:-p.provision}],totalLabel:'Resources net of this liability',note:'The distribution is already part of the initial fund value, so it is not added again as profit. This economic net amount does not depend on the immediate reinvestment percentage. A liability can remain unfunded even when the fund value is large.'},
   {id:'fund-tax-cash-reinvestment-line',type:'line',title:'Find where reinvestment leaves too little cash for the provision',unit:'money',xLabel:'Gross distribution reinvested (%)',series:[{name:'Cash remaining after deducting the full provision',rows:Array.from({length:21},(_,i)=>({x:i*5,value:fundTaxCashPlan(input,{reinvest:i*5}).cashAfterProvision}))},{name:'Zero · cash provision fully funded',rows:[{x:0,value:0},{x:100,value:0}],dash:true}],note:'Positive values leave cash after the modeled provision; negative values are an unfunded amount requiring a separate decision. The line includes dedicated outside cash. A negative value is not an automatic loan, an executed sale or an actual CRA balance owing.'},
   {id:'fund-tax-cash-provision-grid',type:'heatmap',rowLabel:'Reinvested',title:'The same distribution can need different cash under different provision assumptions',unit:'money',columns:['10%','20%','30%','40%'],rows:[0,50,100].map(reinvest=>({label:reinvest+'%',values:[10,20,30,40].map(factor=>fundTaxCashPlan(input,{reinvest,factor}).unfunded)})),note:'Columns replace the hypothetical tax-provision factor; rows replace reinvestment. Every cell is the remaining cash gap after retained distribution cash and selected outside cash. These percentages are sensitivity assumptions, not a tax table or guidance on an investor’s applicable rate.'}
  ]};
}
