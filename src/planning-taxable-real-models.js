export const taxableRealDefinitions={
  taxableRealSavings:{title:'Explore interest retained after a simplified annual tax payment',fields:[
    ['interestPrincipal','Initial accessible savings balance (CAD)',50000,1000,1000000,1000],
    ['grossInterestRate','Constant gross annual interest rate (%)',4,0,10,.25],
    ['interestTaxRate','Assumed combined tax rate on each dollar of interest (%)',40,0,60,5],
    ['priceGrowth','Constant annual inflation assumption (%)',3,0,8,1],
    ['interestYears','Whole years in the illustration',10,1,30,1]
  ]}
};
export function taxableInterestLedger(input){
  const gross=input.grossInterestRate/100,taxRate=input.interestTaxRate/100,inflation=input.priceGrowth/100,afterTax=gross*(1-taxRate),realRate=(1+afterTax)/(1+inflation)-1;
  let balance=input.interestPrincipal,interestTotal=0,taxTotal=0;
  const rows=[{x:0,balance,realBalance:balance,beforeTax:balance,interest:0,tax:0}];
  for(let year=1;year<=input.interestYears;year++){
    const interest=balance*gross,tax=interest*taxRate;interestTotal+=interest;taxTotal+=tax;balance+=interest-tax;
    rows.push({x:year,balance,realBalance:balance/(1+inflation)**year,beforeTax:input.interestPrincipal*(1+gross)**year,interest,tax});
  }
  return {rows,balance,realBalance:rows.at(-1).realBalance,interestTotal,taxTotal,afterTax,realRate,breakEvenGross:inflation/(1-taxRate)};
}
const path=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
export function taxableRealResult(kind,input){
  if(kind!=='taxableRealSavings')throw Error('Unknown taxable-interest topic.');
  const p=taxableInterestLedger(input);
  return {metrics:[['Nominal annual rate retained after the assumed tax',p.afterTax,'percent'],['Annual change in purchasing power after tax and inflation',p.realRate,'percent'],['Gross annual rate required just to preserve purchasing power',p.breakEvenGross,'percent']],note:'Original constant-rate example of fully taxable interest on accessible savings. At each year-end, interest is credited, the assumed combined tax rate applies to that interest, and that tax is paid immediately from the same savings balance. Only net interest stays invested. This timing is an arithmetic convention, not tax withholding, a filing deadline or a CRA instalment schedule. There are no new deposits, withdrawals other than the modeled tax, fees, tax credits, loss offsets, benefit interactions or changes in tax brackets. The tax rate is a user-selected assumption, not a calculated Canadian personal tax rate. The inflation input is a constant assumption, not current CPI. Real values are expressed in the purchasing power of the starting date. The before-tax reference is a mathematical comparison, not a registered-account recommendation or promise of a market yield.',charts:[
    {id:'taxable-interest-rate-bridge',type:'signedbar',title:'Gross interest, retained interest and purchasing power are different rates',unit:'percent',unitLabel:'Annual rates (%) · hypothetical constant assumptions',rows:[{label:'Gross nominal interest',value:input.grossInterestRate/100},{label:'After tax · nominal',value:p.afterTax},{label:'After tax and inflation',value:p.realRate}],note:'Net nominal interest is gross interest times one minus the assumed tax rate. The real rate divides one plus that net rate by one plus inflation, then subtracts one. These are different rate definitions, not additive portions of a single return. Negative real values mean less purchasing power.'},
    {id:'taxable-interest-value-paths',type:'line',title:'A rising nominal balance can coexist with falling purchasing power',unit:'money',unitLabel:'CAD · nominal balances and starting-date purchasing power, as labelled',xLabel:'Year',series:[path('Before-tax reference · nominal CAD',p.rows,'beforeTax'),path('Tax paid annually · nominal CAD',p.rows,'balance',{dash:true}),path('After-tax balance · starting-date CAD',p.rows,'realBalance')],note:'All paths begin with the same principal and receive no external money. The real path discounts the after-tax balance by cumulative assumed inflation. Comparing it with the starting principal tests buying power. The difference between nominal and real values is a valuation adjustment, not a cash fee paid from the account.'},
    {id:'taxable-interest-cash-reconciliation',type:'waterfall',title:'Reconcile interest earned and tax paid before deflating the balance',unit:'money',rows:[{label:'Opening savings balance',value:input.interestPrincipal},{label:'Gross interest actually earned',value:p.interestTotal},{label:'Modeled tax paid from savings',value:-p.taxTotal}],totalLabel:'Ending after-tax nominal balance',note:'Each year’s gross interest is earned on the balance left after earlier modeled tax payments. The total is not the interest of the untouched before-tax reference. No separate inflation cash deduction appears in this ledger: purchasing power is calculated by deflating the endpoint.'},
    {id:'taxable-interest-real-rate-matrix',type:'heatmap',title:'Annual purchasing-power change across tax and inflation assumptions',unit:'percent',signed:true,unitLabel:'After-tax real annual rate (%) · selected gross interest rate',columns:['0% prices','3%','6%'],rows:[0,20,40,60].map(interestTaxRate=>({label:interestTaxRate+'% tax',values:[0,3,6].map(priceGrowth=>taxableInterestLedger({...input,interestTaxRate,priceGrowth}).realRate)})),note:'Rows replace the assumed combined tax rate on interest; columns replace annual inflation. Gross interest stays selected. This is an annual-rate comparison, so changing principal or years does not change its cells; those controls change the balance path. Positive and negative cells are scenarios, not probabilities or available product offers.'}
  ]};
}
