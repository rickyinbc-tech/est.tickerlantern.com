import {constructionQuoteSource} from './planning-construction-quote-data.js';
export const constructionQuoteDefinitions={
  constructionQuote:{title:'Reconcile the project quote, separate costs and contingency',fields:[
    ['budgetMaterials','Earlier materials budget estimate (CAD)',40000,0,500000,1000],
    ['budgetLabour','Earlier labour budget estimate (CAD)',30000,0,500000,1000],
    ['budgetOther','Earlier other contract-cost estimate (CAD)',10000,0,500000,1000],
    ['quoteMaterials','Current quote: materials allocation (CAD)',44000,0,500000,1000],
    ['quoteLabour','Current quote: labour allocation (CAD)',34500,0,500000,500],
    ['quoteOther','Current quote: other contract-cost allocation (CAD)',10000,0,500000,1000],
    ['outsideCosts','Known project costs outside the quote (CAD)',5000,0,200000,500],
    ['contingency','Additional uncommitted contingency, as % of current quote',10,0,40,1],
    ['availableCash','Cash assigned to this project, after other commitments (CAD)',100000,0,2000000,5000]
  ]}
};
export function constructionQuoteBudget(input,quoteFactor=1,contingency=input.contingency){
  const earlier=input.budgetMaterials+input.budgetLabour+input.budgetOther;
  const quote=(input.quoteMaterials+input.quoteLabour+input.quoteOther)*quoteFactor;
  const reserve=quote*contingency/100,committed=quote+input.outsideCosts+reserve,residual=input.availableCash-committed;
  return {earlier,quote,change:quote-earlier,changeRate:earlier?quote/earlier-1:null,reserve,committed,residual,extra:Math.max(0,-residual)};
}
export function constructionQuoteResult(kind,input){
  if(kind!=='constructionQuote')throw Error('Unknown construction quote topic.');
  const p=constructionQuoteBudget(input);
  return {metrics:[['Current contract quote entered',p.quote,'money'],['Quote plus known outside costs and earmarked contingency',p.committed,'money'],['Unassigned project cash after those commitments',p.residual,'money']],note:'The official chart is fixed historical context. Every project amount and stress is independently hypothetical; no construction-index change is automatically applied to a quote, property valuation or policy. Enter each quoted cost once, with applicable quoted taxes allocated consistently across categories. Outside costs exclude amounts already included in the quote. Contingency is an additional earmark on the current quote alone, not a paid expense or an estimate of an overrun probability. Assigned cash is assumed already available; no financing, interest, grants, tax credits, payment dates, contract rights or insurance claims are modeled.',charts:[
    {id:'construction-official-quarterly',type:'signedbar',title:'A construction-price headline can contain both rises and falls across selected markets',unit:'percent',unitLabel:'Residential BCPI · Q2 2026 versus Q1 2026 · percentage change',rows:constructionQuoteSource.rows.map(r=>({...r})),source:constructionQuoteSource.url,sourceLabel:'Statistics Canada · 24 July 2026 release',note:constructionQuoteSource.scope+' Locations are selected to display positive and negative changes, not as a complete ranking. The composite includes 15 CMAs; it is not the arithmetic average of the six displayed local changes. These observations remain fixed when project inputs change.'},
    {id:'construction-estimate-quote',type:'groupbar',title:'Compare the earlier budget with the current quote category by category',unit:'money',seriesNames:['Earlier budget estimate','Current quote allocation'],rows:[['Materials',input.budgetMaterials,input.quoteMaterials],['Labour',input.budgetLabour,input.quoteLabour],['Other contract costs',input.budgetOther,input.quoteOther]].map(([label,a,b])=>({label,values:[a,b]})),note:'The categories are mutually exclusive, exhaustive allocations of the entered contract totals, including applicable quoted taxes once. They need not reproduce a contractor’s invoice layout. The difference is a change in the household’s selected estimates, not a measured inflation rate or evidence that scope, quality and quantity are unchanged. Known costs outside the contract are excluded here.'},
    {id:'construction-cash-commitments',type:'waterfall',title:'A quote below available cash can still leave the complete plan short',unit:'money',rows:[{label:'Cash assigned to this project',value:input.availableCash},{label:'Current contract quote',value:-p.quote},{label:'Known costs outside the quote',value:-input.outsideCosts},{label:'Additional contingency earmark',value:-p.reserve}],totalLabel:'Unassigned cash / funding shortfall',note:'Cash less the quote, outside costs and contingency gives the endpoint. Contingency remains owned cash until spent; subtracting its earmark prevents the same reserve being counted as free project cash. A negative endpoint needs another funding source or a change in commitments. No loan is created and no payment-timing sufficiency is established.'},
    {id:'construction-quote-contingency-matrix',type:'heatmap',title:'Test a changed quote and contingency without assigning either a probability',unit:'money',columns:['−10% quote','Same quote','+10% quote','+20% quote'],rows:[0,5,10,20].map(contingency=>({label:contingency+'% held',values:[.9,1,1.1,1.2].map(factor=>constructionQuoteBudget(input,factor,contingency).extra)})),note:'Cells show additional cash required beyond the amount assigned. Columns scale all three current quote allocations together; rows replace the contingency percentage applied to that changed quote. “Held” means a contingency earmark. Known outside costs and available cash remain selected. The earlier estimate and official observations do not enter these cells. Zero means this selected total is funded, rather than proving the contingency is adequate or that every payment date is covered.'}
  ]};
}
