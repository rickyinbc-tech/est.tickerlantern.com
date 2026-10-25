// An original analytical probability illustration. Parameters are assumptions, not estimates.
export const distributionDefinitions = {
  wealthDistribution:{title:'Explore an assumed return distribution',fields:[
    ['initial','Single amount invested at the start (CAD)',50000,1000,1000000,1000],
    ['meanReturn','Assumed mean annual simple return (%)',5,-5,12,.5],
    ['logVolatility','Annual log-return standard deviation assumption (%)',15,0,35,1],
    ['years','Years invested with no deposits or withdrawals',20,1,40,1],
    ['goal','Nominal balance to compare at the finish (CAD)',100000,1000,5000000,1000]
  ]}
};
const zValues=[-1.6448536269514722,-0.6744897501960817,0,0.6744897501960817,1.6448536269514722];
// Symmetric normal-CDF approximation; absolute error is below 1e-7 in reference checks.
export function normalCDF(z) {
  if(z===Infinity)return 1;if(z===-Infinity)return 0;if(z===0)return .5;
  const x=Math.abs(z),t=1/(1+.2316419*x),density=Math.exp(-x*x/2)/Math.sqrt(2*Math.PI);
  const upper=density*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
  return Math.min(1,Math.max(0,z>0?1-upper:upper));
}
export function wealthDistributionAt(input,year=input.years) {
  const sigma=input.logVolatility/100,mu=Math.log1p(input.meanReturn/100)-sigma*sigma/2;
  const spread=sigma*Math.sqrt(year),logMedian=mu*year;
  const values=zValues.map(z=>input.initial*Math.exp(logMedian+spread*z));
  return {x:year,low:values[0],q25:values[1],median:values[2],q75:values[3],high:values[4],mean:input.initial*(1+input.meanReturn/100)**year};
}
export function wealthBelow(input,amount,year=input.years) {
  if(amount<=0)return 0;
  const sigma=input.logVolatility/100;
  if(sigma===0||year===0)return input.initial*(1+input.meanReturn/100)**year<amount?1:0;
  const mu=Math.log1p(input.meanReturn/100)-sigma*sigma/2;
  return normalCDF((Math.log(amount/input.initial)-year*mu)/(sigma*Math.sqrt(year)));
}
export function wealthRangeProbabilities(input) {
  const g=input.goal,bounds=[0,.5*g,.75*g,g,1.25*g,1.5*g,2*g,Infinity];
  const money=n=>'$'+n.toLocaleString('en-CA',{maximumFractionDigits:2});
  return bounds.slice(0,-1).map((lo,i)=>{
    const hi=bounds[i+1],value=(hi===Infinity?1:wealthBelow(input,hi))-wealthBelow(input,lo);
    return {label:hi===Infinity?money(lo)+' or more':money(lo)+' to below '+money(hi),value:Math.max(0,value)};
  });
}
export function distributionResult(kind,input) {
  if(kind!=='wealthDistribution')throw Error('Unknown distribution topic.');
  const last=wealthDistributionAt(input),rows=Array.from({length:input.years+1},(_,year)=>wealthDistributionAt(input,year));
  return {metrics:[['Median ending balance in the assumed model',last.median,'money'],['Mean ending balance in the assumed model',last.mean,'money'],['Model probability of ending below the selected balance',wealthBelow(input,input.goal),'percent']],note:'Original mathematical illustration for one positive starting amount, with no later cash flows. Annual gross return is lognormally distributed; log gross returns are independent, normally distributed and identically parameterised across years. The entered mean is the expected simple annual return. Log-return mean equals ln(1 + mean simple return) minus half the squared log-return standard deviation. The volatility input is the standard deviation of log gross return, not the standard deviation of the simple percentage return. Parameters are assumed and are not fitted to any market, fund or security. Every probability is conditional on this chosen distribution; none estimates your real-world likelihood of meeting a goal. Dollar amounts and the goal are nominal, before fees, taxes and inflation. Quantiles are calculated analytically, without random simulation or a historical sample. A normal-CDF numerical approximation is used for probabilities. The zero-volatility case collapses to one deterministic balance; below means strictly below, while equality meets the comparison amount.',charts:[
    {id:'distribution-percentile-fan',type:'fan',title:'A percentile band shows a distribution at each year, not one investor’s path',unit:'money',xLabel:'Years invested',rows,evidence:'Hypothetical probability model',note:'The outer band joins the 5th and 95th percentiles; the inner band joins the 25th and 75th. The line is the median. Each cross-section describes the assumed distribution at that year. These are not sample market paths, and the band is not a confidence interval for a fitted estimate. The central 90% at each year does not mean that 90% of complete paths stay inside the band throughout the period. Outcomes outside the shaded area remain possible in the model.'},
    {id:'distribution-outcome-ranges',type:'bar',title:'Compare model probabilities for explicit ending-balance ranges',unit:'percent',unitLabel:'Conditional probability under the entered assumptions',rows:wealthRangeProbabilities(input),evidence:'Hypothetical probability model',note:'The disjoint ranges cover all non-negative ending balances and their probabilities sum to 100% before display rounding. These are horizontal probability bars, not a histogram with equal-width dollar bins. The boundaries scale with the selected goal. Each lower boundary is included and each upper boundary excluded; the last range includes all larger amounts. No sample counts or historical frequencies are used.'},
    {id:'distribution-summary-values',type:'bar',title:'The mean and the median describe different parts of a skewed distribution',unit:'money',rows:[{label:'5th percentile',value:last.low},{label:'Median / 50th percentile',value:last.median},{label:'Mean / expected ending balance',value:last.mean},{label:'95th percentile',value:last.high}],evidence:'Hypothetical probability model',note:'The mean is a probability-weighted average, not an outcome that must occur. The median divides the continuous assumed distribution in half when volatility is positive. Upper-tail outcomes lift the mean above the median. At zero volatility the distribution is a single point and all four displayed values coincide. None of these summary values is a guaranteed minimum or maximum.'},
    {id:'distribution-goal-matrix',type:'heatmap',title:'The probability statement changes when the assumptions or target change',unit:'percent',unitLabel:'Conditional probability of finishing below the column amount',columns:['75%','100%','125%','150%'],rows:[0,10,20,30].map(logVolatility=>({label:logVolatility+'% log SD',values:[.75,1,1.25,1.5].map(k=>wealthBelow({...input,logVolatility},input.goal*k))})),evidence:'Hypothetical probability model',note:'Rows replace annual log-return standard deviation; column labels give the comparison amount as a percentage of the entered nominal goal. Starting capital, expected simple annual return and horizon stay fixed. The mean ending balance therefore stays constant across rows even though the distribution changes. Darker means a larger modeled shortfall probability, not stronger evidence. At zero volatility each cell is either 0% or 100%, with equality counted as meeting the amount.'}
  ]};
}
