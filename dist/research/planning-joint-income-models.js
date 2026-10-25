// Exact four-state probability illustration. All risks are entered assumptions for one window.
export const jointIncomeDefinitions={
  jointIncomeRisk:{title:'Keep each income risk fixed while changing their overlap',fields:[
    ['incomeA','Monthly net income A when available (CAD)',3500,0,15000,100],
    ['incomeB','Monthly net income B when available (CAD)',2500,0,15000,100],
    ['essentials','Monthly essential cash spending (CAD)',4500,0,20000,100],
    ['reserve','Accessible reserve at the start (CAD)',15000,0,250000,500],
    ['months','Months in the fixed receipt-state window',6,1,24,1],
    ['lossProbabilityA','Assumed probability A is absent throughout this window (%)',10,0,100,1],
    ['lossProbabilityB','Assumed probability B is absent throughout this window (%)',10,0,100,1],
    ['dependence','Dependence stress setting; 0 = independence, not a correlation estimate',50,-100,100,10]
  ]}
};
export function jointIncomeProbability(input) {
  const a=input.lossProbabilityA/100,b=input.lossProbabilityB/100,lower=Math.max(0,a+b-1),upper=Math.min(a,b),independent=a*b,t=input.dependence/100;
  const overlap=Math.min(upper,Math.max(lower,t>=0?independent+t*(upper-independent):independent+(-t)*(lower-independent)));
  return {a,b,lower,upper,independent,overlap};
}
export function jointIncomeBudget(input) {
  const p=jointIncomeProbability(input),j=p.overlap;
  const states=[
    {label:'Both income receipts continue',a:true,b:true,probability:Math.max(0,1-p.a-p.b+j)},
    {label:'Income A absent; B continues',a:false,b:true,probability:Math.max(0,p.a-j)},
    {label:'Income B absent; A continues',a:true,b:false,probability:Math.max(0,p.b-j)},
    {label:'Both entered incomes absent',a:false,b:false,probability:j}
  ].map(state=>{
    const receipts=(state.a?input.incomeA:0)+(state.b?input.incomeB:0);
    const need=Math.max(0,input.essentials-receipts)*input.months,funded=Math.min(input.reserve,need),unfunded=Math.max(0,need-input.reserve);
    return {...state,receipts,need,funded,unfunded};
  });
  const inadequate=Math.min(1,states.reduce((sum,s)=>sum+(s.unfunded>1e-8?s.probability:0),0));
  const expected=states.reduce((sum,s)=>sum+s.probability*s.unfunded,0);
  return {...p,states,inadequate,expected,worst:states[3].unfunded};
}
export function jointIncomeResult(kind,input) {
  if(kind!=='jointIncomeRisk')throw Error('Unknown joint-income topic.');
  const p=jointIncomeBudget(input),range=Array.from({length:21},(_,i)=>{
    const x=-100+i*10,s=jointIncomeBudget({...input,dependence:x});return {x,probability:s.inadequate,expected:s.expected};
  });
  return {metrics:[['Model probability the starting reserve is insufficient',p.inadequate,'percent'],['Probability-weighted unfunded need in the assumed model',p.expected,'money'],['Unfunded cash need if both entered incomes are absent',p.worst,'money']],note:'Original four-state illustration, not an employment-risk estimate. Each entered probability is the assumed chance that one net income is absent throughout the entire selected window; it is not an annual unemployment rate, a monthly hazard or a forecast. Each state begins at the start and persists for all selected months, with absent income set to zero. Essential spending is fixed; available income offsets expenses within each month. Only positive monthly deficits draw on the starting reserve, with no later surplus deposits, interest, borrowing or intramonth timing. Benefits, severance, replacement income, tax calculations and changing employment status are excluded. Dependence setting 0 gives independent receipt states. Positive settings interpolate the overlap probability toward its feasible maximum; negative settings toward its feasible minimum. The setting is an artificial stress control, not an estimated Pearson correlation. Changing the window retains the entered probability assumptions, which must be reconsidered for the new meaning. All probabilities and expected cash needs are conditional on this selected model.',charts:[
    {id:'joint-income-probability-grid',type:'heatmap',title:'The four cells preserve each income’s individual absence probability',unit:'percent',unitLabel:'Assumed joint probability of the two receipt states',columns:['B retained','B absent'],rows:[{label:'A retained',values:[p.states[0].probability,p.states[2].probability]},{label:'A absent',values:[p.states[1].probability,p.states[3].probability]}],evidence:'Hypothetical probability model',note:'Rows describe income A and columns income B. The four mutually exclusive cells sum to 100% before display rounding. The A-absent row sums to its entered probability and the B-absent column to its own. Moving the stress setting changes their overlap while holding those two marginal probabilities fixed. These are assumptions, not survey counts or measured labour-market frequencies.'},
    {id:'joint-income-state-cash',type:'stackbar',title:'Read the cash severity of each state before weighting it by probability',unit:'money',seriesNames:['Covered by the starting reserve','Unfunded need'],rows:p.states.map(s=>({label:s.label,values:[s.funded,s.unfunded]})),evidence:'Hypothetical cash scenarios',note:'Each bar equals the window’s essential spending less available income, floored at zero. The starting reserve covers as much of that need as possible. These are alternative states, not four bills to add together, and the bars are not probability-weighted. A state can have zero assigned probability and still appear as a cash stress. If ordinary spending already exceeds both incomes combined, even the first state has a funding need. Earlier bill dates can require a separate timing buffer.'},
    {id:'joint-income-shortfall-probability',type:'line',title:'The chance of an inadequate reserve need not tell the whole severity story',unit:'percent',unitLabel:'Conditional probability of any unfunded need',xMin:-100,xLabel:'Dependence setting (0 = independent)',series:[{name:'Reserve-inadequacy probability',rows:range.map(r=>({x:r.x,value:r.probability}))}],evidence:'Hypothetical probability model',note:'The curve spans the full feasible stress-control range at the selected incomes, expenses, reserve, window and individual risk assumptions. Negative settings move toward the smallest feasible overlap; positive settings toward the largest. The horizontal scale is not time or a correlation coefficient. Changing only the selected stress updates the grid and summary metrics; the full-range curve remains the comparison reference.'},
    {id:'joint-income-expected-shortfall',type:'line',title:'A probability-weighted average is different from the cash needed in a bad state',unit:'money',unitLabel:'Expected unfunded CAD under the entered probability model',xMin:-100,xLabel:'Dependence setting (0 = independent)',series:[{name:'Probability-weighted unfunded need',rows:range.map(r=>({x:r.x,value:r.expected}))}],evidence:'Hypothetical probability model',note:'At each setting, multiply each state’s unfunded amount by its probability and add the four products. The result is a modeled expectation, not a forecast invoice, insurance price or sufficient reserve target. A reserve equal to this average can still leave a large deficit in a particular state. Compare the unweighted state bars and the probability curve beside it.'}
  ]};
}
