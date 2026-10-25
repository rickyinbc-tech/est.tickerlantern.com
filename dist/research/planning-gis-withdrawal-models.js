const gisHouseholds=[
 {label:'Single / divorced / widowed',threshold:23112,maximum:1138.90},
 {label:'Partner gets full OAS',threshold:30528,maximum:685.56},
 {label:'Partner gets Allowance',threshold:42768,maximum:685.56},
 {label:'Partner gets neither',threshold:55392,maximum:1138.90}
];
export const gisWithdrawalDefinitions={gisWithdrawalTiming:{title:'Compare an RRSP or TFSA withdrawal before the next GIS income review',fields:[
 ['gisWithdrawalAmount','Hypothetical one-time cash withdrawal (CAD)',12000,0,100000,500],
 ['gisWithdrawalYear','Calendar tax year of withdrawal',2025,2020,2032,1],
 ['gisWithdrawalMonth','Month of withdrawal (1 = January, 12 = December)',6,1,12,1]
]}};
const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
export function gisWithdrawalResult(kind,i){
 if(kind!=='gisWithdrawalTiming')throw Error('Unknown GIS withdrawal-timing view.');
 const start=i.gisWithdrawalYear+1,end=i.gisWithdrawalYear+2,monthsUntilJuly=19-i.gisWithdrawalMonth;
 const amount=Math.round(i.gisWithdrawalAmount*100)/100;
 return {metrics:[
  ['Cash need in the hypothetical withdrawal',amount,'money'],
  ['RRSP amount reported in its withdrawal-year income',amount,'money'],
  ['TFSA withdrawal effect on federal income-tested benefits',0,'money'],
  ['Usual annual-review payment window',0,'integer',`July ${start} – June ${end}`],
  ['Month-start intervals from draw month to July review',monthsUntilJuly,'integer']
 ],note:'Original source-and-timing illustration, not a benefit or tax estimate. CRA says an RRSP withdrawal is included in income for the year withdrawn; CRA says TFSA income and withdrawals do not affect federal income-tested benefits, including GIS. Service Canada says GIS is reviewed annually using a federal tax return and considers previous-year income; if income drops due to retirement or a pension reduction, contact Service Canada because it may use estimated current-year income. The selected annual review window is the ordinary prior-year illustration. The module does not calculate the GIS income base, eligibility, household income, tax, withholding, GIS amount or benefit lost. It holds current October–December 2026 published maximums and income thresholds fixed as a dated reference, not a future forecast.',charts:[
  {id:'gis-withdrawal-maximums',type:'bar',unit:'money',title:'Published maximum monthly GIS differs by household situation',unitLabel:'Maximum payment per month · October–December 2026 · CAD',source:'https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/benefit-amount.html',sourceLabel:'Service Canada · GIS payment amounts · page updated 13 October 2026',rows:gisHouseholds.map(x=>({label:x.label,value:x.maximum})),note:'Official maximum payment observations for October–December 2026, in CAD per month. They depend on eligibility and are not a prediction or guaranteed amount. The displayed categories distinguish single people from three partner situations. Quarterly indexing means these amounts should not be multiplied by twelve to forecast a full year.'},
  {id:'gis-withdrawal-thresholds',type:'bar',unit:'money',title:'The official income ceilings also depend on partner status',unitLabel:'Published annual income ceiling · prior-year income basis · CAD',source:'https://www.canada.ca/en/services/benefits/publicpensions/old-age-security/guaranteed-income-supplement/benefit-amount.html',sourceLabel:'Service Canada · GIS payment amounts · page updated 13 October 2026',rows:gisHouseholds.map(x=>({label:x.label,value:x.threshold})),note:'The source says the amount depends on previous-year income and, for a spouse or common-law partner, combined income. These are the official table’s less-than annual income thresholds shown alongside the October–December 2026 maximum-payment table. They are not stand-alone personal eligibility tests: family status, current program rules and actual income calculation still matter.'},
  {id:'gis-withdrawal-source-comparison',type:'bar',unit:'money',title:'The same hypothetical cash need has different reported-income treatment',unitLabel:'One-time illustration · CAD',rows:[{label:'RRSP income inclusion',value:amount},{label:'TFSA federal-benefit effect',value:0}],note:'The RRSP bar is the hypothetical amount the CRA says must be included in income in the year withdrawn; the TFSA bar is the benefit impact the CRA explicitly says is zero. This is not an RRSP-versus-TFSA tax comparison and the two labels describe different source rules. No marginal tax or lost-GIS dollar value is estimated.'},
  {id:'gis-withdrawal-month-lag',type:'line',unit:'integer',xUnit:'integer',xLabel:'Withdrawal month (1 = January; 12 = December)',yMin:0,yMax:20,title:'Within one income year, the usual next July review can be months away',series:[{name:'Month-start intervals to July '+start,rows:monthNames.map((label,k)=>({x:k+1,label,value:18-k}))}],note:'For the selected tax year, each hypothetical withdrawal month maps to the usual July annual-review start in the following calendar year. The line counts intervals between the first day of the withdrawal month and 1 July of that review year: 18 months for January and 7 for December. It is a calendar illustration, not a Service Canada processing-time promise. Use the July-to-June window above; contact Service Canada if a substantial retirement-related income drop makes the current-year estimate route relevant.'}
 ]};
}
