export const fuelMixDefinitions={
 fuelMix:{title:'Translate city/highway consumption into annual fuel cash at each vehicle’s entered price',fields:[
  ['annualKm','Same annual distance for both vehicles (km)',20000,0,60000,1000],
  ['cityShare','Share of distance driven in city conditions (%)',55,0,100,5],
  ['cityA','Vehicle A city consumption (L/100 km)',10,0,25,.1],
  ['highwayA','Vehicle A highway consumption (L/100 km)',6,0,25,.1],
  ['cityB','Vehicle B city consumption (L/100 km)',7,0,25,.1],
  ['highwayB','Vehicle B highway consumption (L/100 km)',7.5,0,25,.1],
  ['fuelPriceA','Vehicle A required fuel price (CAD/L)',1.7,0,4,.05],
  ['fuelPriceB','Vehicle B required fuel price (CAD/L)',1.95,0,4,.05]
 ]}
};
export function fuelMixCosts(input,cityShare=input.cityShare) {
 const w=cityShare/100,distance=input.annualKm;
 const rates=[input.cityA*w+input.highwayA*(1-w),input.cityB*w+input.highwayB*(1-w)];
 const litres=rates.map(v=>distance*v/100),cityCosts=[input.cityA*input.fuelPriceA,input.cityB*input.fuelPriceB].map(v=>distance*w*v/100),highwayCosts=[input.highwayA*input.fuelPriceA,input.highwayB*input.fuelPriceB].map(v=>distance*(1-w)*v/100);
 const costs=litres.map((v,i)=>v*[input.fuelPriceA,input.fuelPriceB][i]);
 return {rates,litres,cityCosts,highwayCosts,costs,saving:costs[0]-costs[1]};
}
export function fuelMixCrossing(input,priced=true) {
 const a=priced?input.fuelPriceA:1,b=priced?input.fuelPriceB:1;
 const intercept=input.highwayA*a-input.highwayB*b,slope=(input.cityA-input.highwayA)*a-(input.cityB-input.highwayB)*b;
 if(Math.abs(slope)<1e-12)return {status:Math.abs(intercept)<1e-12?'all':'none',share:null};
 const w=-intercept/slope;
 return w>=-1e-12&&w<=1+1e-12?{status:'point',share:Math.max(0,Math.min(1,w))*100}:{status:'none',share:null};
}
export function fuelMixResult(kind,input) {
 if(kind!=='fuelMix')throw Error('Unknown fuel-mix topic.');
 const p=fuelMixCosts(input),cross=fuelMixCrossing(input),crossNote=input.annualKm===0?'At zero annual distance both fuel budgets are zero at every driving mix.':cross.status==='point'?'The entered annual fuel costs tie at '+cross.share.toFixed(2)+'% city-distance share.':cross.status==='all'?'The entered fuel costs tie at every city/highway mix.':'There is no equal-cost city/highway mix between 0% and 100% under these entered rates.';
 const shares=[...new Set([0,100,input.cityShare,...Array.from({length:21},(_,i)=>i*5),...(cross.status==='point'?[cross.share]:[])])].sort((a,b)=>a-b);
 return {metrics:[['Vehicle A annual fuel-only cash',p.costs[0],'money'],['Vehicle B annual fuel-only cash',p.costs[1],'money'],['A minus B annual fuel cost; positive means B costs less',p.saving,'money']],note:'Original hypothetical fuel-only comparison, not actual vehicle ratings, fuel quotes or a prediction of annual driving. Each vehicle travels the same entered annual kilometres and city-distance share. Litres per 100 km are weighted by distance, then multiplied by kilometres/100 and that vehicle’s required fuel price. The selected weighted consumption is '+p.rates[0].toFixed(3)+' L/100 km for A and '+p.rates[1].toFixed(3)+' for B. '+crossNote+' Fuel prices are constant over the modeled year. No purchase price, financing, depreciation, maintenance, insurance, tax calculation, non-fuel energy, equipment spending, time savings or resale value is included. The city/highway inputs may describe synthetic cases that do not match any actual vehicle; the tool does not recommend substituting a fuel type or grade. Laboratory labels are comparison tools, and actual consumption can differ with conditions. Display rounding does not feed back into the calculations.',charts:[
  {id:'fuel-mix-consumption-rates',type:'groupbar',title:'Consumption ratings and the selected distance-weighted mix are separate comparisons',unit:'decimal',unitLabel:'Litres per 100 km · lower means less fuel for equal distance',tableUnit:'L/100 km',seriesNames:['Vehicle A','Vehicle B'],rows:[{label:'City conditions',values:[input.cityA,input.cityB]},{label:'Highway conditions',values:[input.highwayA,input.highwayB]},{label:'Selected distance mix',values:p.rates}],evidence:'Hypothetical consumption inputs',note:'The selected mix weights each city rating by the entered share of kilometres and the highway rating by the remaining share. It is not an equal average unless city distance is 50%. These are original consumption assumptions, not published or reconstructed manufacturer ratings. Values display to one decimal; annual fuel costs use the full weighted result.'},
  {id:'fuel-mix-annual-cash',type:'stackbar',title:'Fuel cash depends on litres consumed and the price paid for each vehicle’s fuel',unit:'money',seriesNames:['Fuel for city kilometres','Fuel for highway kilometres'],rows:['Vehicle A','Vehicle B'].map((label,i)=>({label,values:[p.cityCosts[i],p.highwayCosts[i]]})),evidence:'Hypothetical annual fuel budget',note:'Each segment equals kilometres in that condition × consumption in L/100 km ÷ 100 × the vehicle-specific CAD-per-litre price. The segment sum is annual fuel cash only. Both vehicles cover the same distance. A lower total number of litres can still cost more when the required fuel is more expensive. The prices do not establish which fuel grade any actual vehicle can use.'},
  {id:'fuel-mix-city-share-difference',type:'line',title:'The signed fuel-cost difference can reverse as the city-distance share changes',unit:'money',unitLabel:'Annual A minus B fuel cost · positive favours B',xLabel:'City share of annual distance (%)',series:[{name:'Annual fuel cost A minus B',rows:shares.map(x=>({x,value:fuelMixCosts(input,x).saving}))}],evidence:'Hypothetical driving-mix sensitivity',note:'Only the city-distance share changes along this curve; total kilometres, all four consumption inputs and both fuel prices stay fixed. Zero means equal annual fuel cash. Negative values favour A within this limited comparison. An exact feasible equal-cost point is included when one exists. This is a deterministic cost relationship, not a probability distribution of driving or future prices.'},
  {id:'fuel-mix-price-driving-matrix',type:'heatmap',title:'Test the fuel-price difference beside the driving mix',unit:'money',signed:true,compactValues:false,columns:[1.5,1.75,2,2.25].map(v=>'$'+v.toFixed(2)+'/L'),rows:[25,55,80,100].map(cityShare=>({label:cityShare+'% city',values:[1.5,1.75,2,2.25].map(fuelPriceB=>fuelMixCosts({...input,fuelPriceB},cityShare).saving)})),evidence:'Hypothetical two-input sensitivity',note:'Columns replace vehicle B’s fuel price and rows replace city share of annual kilometres. Vehicle A’s price, annual distance and all consumption inputs stay selected values. Positive cells mean B has lower annual fuel cost and negative cells mean A does. The grid has no likelihood weights and does not quote local pump prices. At zero annual kilometres every cell is zero.'}
 ]};
}
