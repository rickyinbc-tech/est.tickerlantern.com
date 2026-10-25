// Complete invented holdings, not a sample of any real fund or issuer.
export const lookthroughPositions=[
  {id:'A',name:'Company A',short:'Company A',asset:'equity',geography:'US',weights:[.4,.3,0]},
  {id:'B',name:'Company B',short:'Company B',asset:'equity',geography:'US',weights:[.3,.2,0]},
  {id:'C',name:'Company C',short:'Company C',asset:'equity',geography:'Non-US',weights:[.2,.1,.4]},
  {id:'D',name:'Bond issuer D',short:'Bond D',asset:'bond',geography:'Non-US',weights:[.1,0,.4]},
  {id:'E',name:'Bond issuer E',short:'Bond E',asset:'bond',geography:'US',weights:[0,.4,.2]}
];
export const lookthroughDefinitions={
  fundLookthroughPlanning:{title:'Change the balances while retaining the complete fictional holdings matrix',fields:[
    ['lookFundA','Fund A market value in the selected portfolio (CAD)',40000,0,500000,1000],
    ['lookFundB','Fund B market value in the selected portfolio (CAD)',30000,0,500000,1000],
    ['lookFundC','Fund C market value in the selected portfolio (CAD)',20000,0,500000,1000],
    ['lookDirectA','Direct Company A market value (CAD)',10000,0,500000,1000]
  ]}
};
export function lookthroughPortfolio(input){
  const fundValues=[input.lookFundA,input.lookFundB,input.lookFundC],total=fundValues.reduce((n,v)=>n+v,0)+input.lookDirectA;
  const positions=lookthroughPositions.map(row=>{const fromFunds=row.weights.map((w,i)=>w*fundValues[i]),direct=row.id==='A'?input.lookDirectA:0,value=fromFunds.reduce((n,v)=>n+v,0)+direct;return {...row,fromFunds,direct,value,share:total>0?value/total:null};});
  const sum=predicate=>positions.filter(predicate).reduce((n,r)=>n+r.value,0),equity=sum(r=>r.asset==='equity'),bonds=sum(r=>r.asset==='bond'),us=sum(r=>r.geography==='US'),nonUs=sum(r=>r.geography==='Non-US');
  return {total,fundValues,positions,companyA:positions[0],equity,bonds,us,nonUs,equityShare:total>0?equity/total:null,usShare:total>0?us/total:null,nonUsShare:total>0?nonUs/total:null};
}
const percentText=v=>v==null?'unavailable':(v*100).toFixed(2)+'%';
export function lookthroughResult(kind,input){
  if(kind!=='fundLookthroughPlanning')throw Error('Unknown look-through planning topic.');
  const p=lookthroughPortfolio(input);
  return {metrics:[['Selected portfolio market value',p.total,'money'],['Combined Company A allocation',p.companyA.share,'percent'],['Equity allocation across the underlying positions',p.equityShare,'percent']],note:(p.total===0?'No portfolio entered. Dollar allocations are zero; percentage allocations are unavailable. ':'')+'All funds, companies, bond issuers and weights are invented. Every fund is fully described by the fixed matrix, which totals 100% per fund. Balances share one hypothetical valuation instant and CAD basis. The same Company A appears in Funds A and B and the optional direct position. This is a long-only unlevered market-value composition model, with no tax, fees, price changes, cash residual, derivatives or nested funds. Editing a balance creates an independent snapshot, not a funded trade. Account labels are not asset classes. Neither fund count nor these allocation percentages calculate volatility, expected loss, correlations, suitability or a safe concentration limit. Underlying dollars describe the existing fund values; they are not additional assets to add to them.',charts:[
    {id:'lookthrough-input-balances',type:'bar',title:'Begin with the balances in the selected portfolio',unit:'money',unitLabel:'CAD at one hypothetical valuation instant',rows:[{label:'Fund A',value:input.lookFundA},{label:'Fund B',value:input.lookFundB},{label:'Fund C',value:input.lookFundC},{label:'Direct Company A',value:input.lookDirectA}],note:'These four entries sum to the selected portfolio total. A long list of entries does not by itself establish different underlying exposures. The remaining figures explain these same dollars in other ways; adding those views would double count the portfolio.'},
    {id:'lookthrough-fixed-holdings',type:'heatmap',title:'Read the complete invented fund holdings before combining them',unit:'percent',unitLabel:'Share of each individual fund’s market value; fixed fictional composition',columns:['Fund A','Fund B','Fund C'],rows:lookthroughPositions.map(r=>({label:r.short,values:[...r.weights]})),note:'Each column totals 100%. Company A, B and C are equities; Bond D and E mean the separate fictional bond issuers D and E. The direct holding is 100% Company A. This matrix does not change when balances change. Its percentages are fund composition, not investment returns or percentages of the combined household portfolio.'},
    {id:'lookthrough-combined-issuers',type:'bar',title:'Combine the same issuer across funds and the direct holding',unit:'percent',unitLabel:'Issuer allocation / total selected portfolio market value',rows:p.positions.map(r=>({label:r.name,value:r.share})),note:'Each fund balance is multiplied by its internal issuer weight, then matching issuer amounts are added. Each underlying dollar appears once. The five issuer allocations total 100% when the selected portfolio is nonempty. An empty portfolio has unavailable percentage weights. This is allocation, not a measure of the issuer’s shares outstanding or a risk score.'},
    {id:'lookthrough-asset-partition',type:'donut',title:'Read asset class as another partition of the same portfolio',unit:'money',unitLabel:'CAD in underlying equities and bonds; no additional assets',rows:[{label:'Equities',value:p.equity},{label:'Bonds',value:p.bonds}],note:'This asset-class view sums to the same selected total. '+(p.total>0?'Separately, the invented issuer geography tags produce US '+percentText(p.usShare)+' and non-US '+percentText(p.nonUsShare)+'. ':'Geography percentages are also unavailable for an empty portfolio. ')+'Do not add geography percentages to equity and bond percentages: those are overlapping alternative classifications. Tags do not establish listing currency, revenue exposure, hedging or independent economic risks.'},
    {id:'lookthrough-company-a-bridge',type:'waterfall',title:'Reconcile Company A’s combined allocation in dollars',unit:'money',unitLabel:'CAD allocated to the same fictional Company A',rows:[{label:'Company A inside Fund A',value:p.companyA.fromFunds[0]},{label:'Company A inside Fund B',value:p.companyA.fromFunds[1]},{label:'Company A inside Fund C',value:p.companyA.fromFunds[2]},{label:'Direct Company A position',value:p.companyA.direct}],totalLabel:'Combined Company A amount',note:'Only Company A’s portion of each fund enters this bridge, not the full fund balances. The endpoint is part of the selected portfolio, not an extra asset. It can exceed the visible direct position even though every input holding has a different label.'}
  ]};
}
