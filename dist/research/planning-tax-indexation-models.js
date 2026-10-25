import {taxIndexationSource} from './planning-tax-indexation-data.js';
export const taxIndexationDefinitions={
  taxIndexation:{title:'Compare two hypothetical threshold rules and income purchasing power',fields:[
    ['income','Starting annual income, all taxable in this illustration (CAD)',80000,10000,250000,1000],
    ['payGrowth','Assumed annual nominal income increase (%)',3,0,8,.5],
    ['inflation','Assumed annual price increase (%)',3,0,6,.5],
    ['years','Whole years after the starting year',10,1,20,1]
  ]}
};
// Deliberately constructed schedule, not federal, provincial or combined Canadian rates.
export const illustrativeTaxBands=[{ceiling:50000,rate:.2},{ceiling:100000,rate:.3},{ceiling:Infinity,rate:.4}];
export function illustrativeBracketTax(income,thresholdFactor=1){
  let tax=0,lower=0;
  for(const {ceiling,rate} of illustrativeTaxBands){
    const upper=ceiling*thresholdFactor;
    tax+=Math.max(0,Math.min(income,upper)-lower)*rate;
    lower=upper;
  }
  return tax;
}
export function taxIndexationPlan(input){
  const rows=Array.from({length:input.years+1},(_,year)=>{
    const priceFactor=(1+input.inflation/100)**year,income=input.income*(1+input.payGrowth/100)**year;
    const fixedTax=illustrativeBracketTax(income),indexedTax=illustrativeBracketTax(income,priceFactor);
    const fixedNet=income-fixedTax,indexedNet=income-indexedTax;
    return {year,priceFactor,income,fixedTax,indexedTax,fixedNet,indexedNet,realGross:income/priceFactor,realFixed:fixedNet/priceFactor,realIndexed:indexedNet/priceFactor,realGap:(fixedTax-indexedTax)/priceFactor};
  });
  return {rows,start:rows[0],end:rows.at(-1)};
}
export function taxIndexationResult(kind,input){
  if(kind!=='taxIndexation')throw Error('Unknown tax-indexation topic.');
  const p=taxIndexationPlan(input),s=taxIndexationSource,end=p.end;
  return {metrics:[['Final annual gross income in starting-year purchasing power',end.realGross,'money'],['Final annual net income with inflation-indexed thresholds, starting-year CAD',end.realIndexed,'money'],['Final annual net-income gap: indexed less fixed thresholds, starting-year CAD',end.realGap,'money']],note:'The first chart reproduces CRA’s dated annual indexation percentages for 2023–2026, reviewed 25 October 2026. They are not annual-average CPI inflation readings or future forecasts. The remaining four charts are an independent teaching model, not a Canadian tax calculator or a forecast of policy. Its constructed marginal rates are 20% on the first CAD 50,000, 30% on the next CAD 50,000 and 40% above CAD 100,000 in the starting year. There is no tax-free amount, credit, deduction, payroll contribution, provincial calculation, benefit or other income. All entered income is taxable. One rule holds both thresholds fixed; the other multiplies both by the same cumulative price factor used to deflate income. Rates stay constant and thresholds are not rounded. Each year’s nominal income grows by the selected pay rate. Annual net income means gross income less this illustrative tax only, not actual take-home pay or an accumulated savings balance. There is no investment return or payment-date calculation.',charts:[
    {id:'tax-indexation-official',type:'bar',title:'CRA’s published indexation percentages vary by tax year',unit:'percent',unitLabel:'Published indexation increase for the stated tax year (%)',rows:s.rows.map(row=>({label:String(row.year),value:row.rate/100})),source:s.url,sourceLabel:'CRA · Indexation increase per year, 2023–2026',evidence:'Official published amounts · dated policy parameters',note:'Source row: “Indexation increase” in CRA’s table, displayed chronologically here. These four rates do not change when the scenario inputs change. They describe the published annual indexation adjustment, not the inflation experienced by an individual household, a pay increase or a projection for later years.'},
    {id:'tax-indexation-real-net',type:'line',title:'Compare annual net income in the same purchasing-power units',unit:'money',unitLabel:'Annual income in starting-year CAD; constructed tax schedule',xLabel:'Years after the starting year',series:[{name:'Thresholds indexed to the assumed prices',rows:p.rows.map(r=>({x:r.year,value:r.realIndexed}))},{name:'Thresholds held fixed in nominal CAD',rows:p.rows.map(r=>({x:r.year,value:r.realFixed})),dash:true}],note:'Both paths use identical gross income and prices. Only the threshold rule differs. When pay and prices rise at the same rate, indexing the whole constructed threshold schedule preserves real net income. With a different pay increase, real net income can rise or fall under either rule. Values are each year’s income, not money accumulated across years.'},
    {id:'tax-indexation-final-split',type:'stackbar',title:'The same final nominal income can have a different tax split',unit:'money',unitLabel:'Final year nominal CAD; net income plus illustrative tax equals gross income',seriesNames:['Annual net income','Illustrative annual tax'],rows:[{label:'Fixed thresholds',values:[end.fixedNet,end.fixedTax]},{label:'Indexed thresholds',values:[end.indexedNet,end.indexedTax]}],note:'Both bars sum to the same final gross income. The bars use final-year nominal dollars; the line above uses starting-year purchasing power. The difference is generated by the constructed threshold rules, not by different earnings or a government benefit payment.'},
    {id:'tax-indexation-real-gap',type:'waterfall',title:'Reconcile the final annual purchasing-power difference',unit:'money',unitLabel:'Final annual net income expressed in starting-year CAD',rows:[{label:'Net with indexed thresholds',value:end.realIndexed},{label:'Less the fixed-threshold tax difference',value:-end.realGap}],totalLabel:'Net with fixed thresholds',note:'The deduction is the extra nominal tax under fixed thresholds divided by the same cumulative price factor. It is an annual income difference at the selected horizon, not the sum of losses over all years or a separate fee. With zero assumed inflation, both threshold rules coincide.'},
    {id:'tax-indexation-gap-grid',type:'heatmap',title:'Test the threshold effect across pay and price assumptions',unit:'money',unitLabel:'Final annual net-income advantage of indexed thresholds, starting-year CAD',columns:['0% pay','2% pay','4% pay','6% pay'],rows:[0,2,4,6].map(inflation=>({label:inflation+'% prices',values:[0,2,4,6].map(payGrowth=>taxIndexationPlan({...input,inflation,payGrowth}).end.realGap)})),note:'Rows replace the annual price increase; columns replace annual nominal pay growth. Starting income and years remain entered. The cells compare indexed with fixed thresholds at the same income in each scenario. They do not measure the total change in living standards, and no probability is attached to an assumption.'}
  ]};
}
