import { lifeSource } from './planning-life-data.js';
export const jointLongevityDefinitions={
  jointLongevity:{title:'Keep the joint-life illustration separate from a household budget scenario',fields:[
    ['bothGap','Annual portfolio-funded household gap while both are alive, today’s CAD',24000,0,150000,1000],
    ['oneGap','Annual gap after a hypothetical transition to one survivor, today’s CAD',18000,0,150000,1000],
    ['oneYear','First scenario year using the one-survivor gap',15,1,35,1],['years','Whole years in the budget scenario after age 65',30,10,35,1],
    ['real','Assumed annual real return after tax and costs (%)',2,-2,5,.5],['capital','Capital allocated at the start, today’s CAD',400000,0,2000000,10000]
  ]}
};
export function jointSurvivalBounds(a,b){
  if(!Number.isFinite(a)||!Number.isFinite(b)||a<0||a>1||b<0||b>1)throw Error('Marginal survival shares must be between zero and one.');
  const both=a*b,oneOnly=a*(1-b)+b*(1-a),neither=(1-a)*(1-b);
  return {both,oneOnly,neither,independent:1-neither,lower:Math.max(a,b),upper:Math.min(1,a+b)};
}
export function jointLifeRows(){
  const m65=lifeSource.rows[0][1],f65=lifeSource.rows[0][2];
  return lifeSource.rows.map(([age,m,f])=>({age,male:m/m65,female:f/f65,...jointSurvivalBounds(m/m65,f/f65)}));
}
export function survivorBudget(input){
  const r=input.real/100,rows=[];
  let presentValue=0,undiscounted=0;
  for(let year=1;year<=input.years;year++){
    const gap=year>=input.oneYear?input.oneGap:input.bothGap,pv=gap/(1+r)**year;
    presentValue+=pv;undiscounted+=gap;rows.push({x:year,gap,pv,cumulativePV:presentValue});
  }
  return {rows,presentValue,undiscounted,capitalGap:Math.max(0,presentValue-input.capital)};
}
export function jointLongevityResult(kind,input){
  if(kind!=='jointLongevity')throw Error('Unknown joint-longevity topic.');
  const life=jointLifeRows(),at90=life.find(r=>r.age===90),budget=survivorBudget(input);
  return {metrics:[['Illustrative chance at least one reaches age 90, assuming independence',at90.independent,'percent'],['Present value of the selected budget schedule',budget.presentValue,'money'],['Budget present value above allocated capital',budget.capitalGap,'money']],note:'Two separate exercises. Statistical context uses Canada’s preliminary 2022–2024 period life table, Statistics Canada Table 13-10-0114-01, released 13 January 2026 and retrieved 25 October 2026. Each marginal share is lx / l65 within the source categories Males and Females. The illustrative pair begins with one from each category, both age 65. Its joint figures additionally assume that the published marginal shares apply to the pair and, for the independence line, independent remaining lifetimes. These are not observed Canadian couple probabilities or personal survival forecasts. The bounds vary dependence while preserving those assumed marginals; they are not sampling confidence intervals. The source extract stops at age 100, where survival is still positive. Budget controls do not change these fixed statistics. The separate cash exercise chooses a transition year; it does not predict a death date or survival-weight the budget. Real CAD gaps are paid at year-end, with a constant real discount rate after assumed tax and costs. No benefits, household income, actual investment path, tax return, mortality improvement, annuity price or guaranteed funding level is calculated.',charts:[
    {id:'joint-life-marginals',type:'line',title:'Read each source survival share from the same starting age',unit:'percent',unitLabel:'Conditional survival from age 65 (%)',xMin:65,xTicks:[65,80,90,100].map(value=>({value,label:value})),xLabel:'Age under the period life table',series:[{name:'Males · lx / l65',rows:life.map(r=>({x:r.age,value:r.male}))},{name:'Females · lx / l65',rows:life.map(r=>({x:r.age,value:r.female})),dash:true}],source:lifeSource.url,sourceLabel:'Statistics Canada · Table 13-10-0114-01',evidence:'Derived marginal shares · preliminary 2022–2024 Canada period table',note:'These are population-level period-table calculations within the source sex categories, conditional on reaching age 65. They are not shares of a survey sample, health-adjusted estimates or forecasts for people retiring now. The curves end at age 100 because the retained extract ends there, not because survival becomes zero.'},
    {id:'joint-life-dependence-bounds',type:'heatmap',title:'Joint survival needs an additional dependence assumption',unit:'percent',unitLabel:'Illustrative conditional chance at least one is alive (%)',columns:[85,90,95,100].map(age=>'Age '+age),rows:[['lower','Lower bound'],['independent','Independent'],['upper','Upper bound']].map(([key,label])=>({label,values:[85,90,95,100].map(age=>life.find(r=>r.age===age)[key])})),source:lifeSource.url,sourceLabel:'Marginal inputs: Statistics Canada · Table 13-10-0114-01',evidence:'Original dependence bounds and independence calculation from source marginals',note:'For marginal shares a and b, at-least-one survival lies between max(a,b) and min(1,a+b). Independence gives 1 − (1 − a)(1 − b). The bounds assume the two source marginal shares apply to the illustrative pair and vary only their dependence. None of these rows is an observed couple statistic or a confidence interval; actual couple selection can also change the marginals.'},
    {id:'joint-life-budget-schedule',type:'line',title:'Choose the household gap after a transition; do not assume it halves',unit:'money',unitLabel:'Annual household funding gap, in today’s CAD',xMin:1,xLabel:'Budget year after both start at 65',series:[{name:'Selected two-phase household gap',rows:budget.rows.map(r=>({x:r.x,value:r.gap})),step:true},{name:'Both-person gap held throughout',rows:[{x:1,value:input.bothGap},{x:input.years,value:input.bothGap}],dash:true}],note:'The selected one-survivor gap begins in the entered year, including that year’s end payment. It is an independent planning assumption, not a table-implied transition. The one-person gap may be higher or lower than the two-person gap because the inputs describe funding after separately assessed income, rather than a headcount rule.'},
    {id:'joint-life-funding-horizon',type:'heatmap',title:'Budget present value across real returns and chosen horizons',unit:'money',unitLabel:'Present value in today’s CAD',columns:[20,25,30,35].map(years=>years+' years'),rows:[0,1,2,3].map(real=>({label:real+'% real',values:[20,25,30,35].map(years=>survivorBudget({...input,real,years}).presentValue)})),note:'Each cell replaces the horizon and real return while retaining both funding gaps and the chosen transition year. A transition beyond a cell’s horizon is omitted from that cell. No death probabilities weight these amounts. They are deterministic cash-flow present values and exclude funding after the selected finish date, including any survival beyond age 100.'}
  ]};
}
