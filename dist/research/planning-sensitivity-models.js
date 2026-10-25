export const sensitivityDefinitions={
 planningSensitivity:{title:'Test the saving-gap assumptions individually and together',fields:[
  ['currentCost','Project price in today’s dollars (CAD)',50000,1000,200000,1000],
  ['starting','Savings available today (CAD)',10000,0,200000,1000],
  ['monthly','Deposit at each month-end (CAD)',500,0,5000,50],
  ['rate','Assumed constant effective annual savings return (%)',3,-5,10,.5],
  ['costGrowth','Assumed constant annual project-price growth (%)',4,0,12,.5],
  ['years','Whole years until the payment date',5,1,15,1],
  ['quoteRange','Tested project-quote range either side of the baseline (%)',20,0,40,5]
 ]}
};
export function sensitivityGoal(input) {
 const n=input.years*12,m=Math.expm1(Math.log1p(input.rate/100)/12),factor=(1+input.rate/100)**input.years;
 const annuity=m===0?n:Math.expm1(n*Math.log1p(m))/m,target=input.currentCost*(1+input.costGrowth/100)**input.years;
 const initialFuture=input.starting*factor,balance=initialFuture+input.monthly*annuity;
 return {target,balance,gap:target-balance,annuity,requiredMonthly:Math.max(0,(target-initialFuture)/annuity)};
}
export function sensitivityCases(input) {
 const baseline=sensitivityGoal(input),ranges=[
  {key:'currentCost',label:'Current project quote',lowInput:input.currentCost*(1-input.quoteRange/100),highInput:input.currentCost*(1+input.quoteRange/100),unit:'money'},
  {key:'monthly',label:'Monthly saving',lowInput:input.monthly*.75,highInput:input.monthly*1.25,unit:'money'},
  {key:'rate',label:'Annual savings return',lowInput:Math.max(-5,input.rate-2),highInput:Math.min(10,input.rate+2),unit:'percent'},
  {key:'costGrowth',label:'Annual project-price growth',lowInput:Math.max(0,input.costGrowth-2),highInput:Math.min(12,input.costGrowth+2),unit:'percent'},
  {key:'years',label:'Years until payment',lowInput:Math.max(1,input.years-1),highInput:Math.min(15,input.years+1),unit:'years'}
 ].map(r=>({...r,low:sensitivityGoal({...input,[r.key]:r.lowInput}).gap-baseline.gap,high:sensitivityGoal({...input,[r.key]:r.highInput}).gap-baseline.gap}));
 const changes=[['currentCost','highInput','Higher current quote'],['costGrowth','highInput','Higher project-price growth'],['monthly','lowInput','Lower monthly saving'],['rate','lowInput','Lower savings return'],['years','lowInput','Earlier payment date']];
 let state={...input},previous=baseline.gap;
 const steps=changes.map(([key,side,label])=>{const range=ranges.find(r=>r.key===key);state={...state,[key]:range[side]};const next=sensitivityGoal(state).gap,step={label,value:next-previous};previous=next;return step;});
 const standaloneSum=changes.reduce((sum,[key,side])=>sum+ranges.find(r=>r.key===key)[side==='lowInput'?'low':'high'],0);
 return {baseline,ranges,steps,combined:sensitivityGoal(state),standaloneSum};
}
const inputLabel=(value,unit)=>unit==='money'?'CAD '+value.toLocaleString('en-CA',{maximumFractionDigits:2}):unit==='percent'?value.toFixed(2)+'%':value+' years';
export function sensitivityResult(kind,input) {
 if(kind!=='planningSensitivity')throw Error('Unknown sensitivity topic.');
 const p=sensitivityCases(input),sorted=[...p.ranges].sort((a,b)=>Math.abs(b.high-b.low)-Math.abs(a.high-a.low)||a.label.localeCompare(b.label));
 return {metrics:[['Modeled project price at the payment date',p.baseline.target,'money'],['Modeled signed gap: price less available savings',p.baseline.gap,'money'],['Month-end deposit needed to close this baseline gap',p.baseline.requiredMonthly,'money']],note:'Original deterministic nominal-CAD saving illustration. The project price grows at the entered constant annual rate. Starting savings and equal month-end deposits earn a constant effective annual return converted to a monthly rate; negative rates are allowed, but no uncertain return path is simulated. The full project bill is paid at the end of the selected whole-year period, with no earlier deposits to suppliers. A positive gap means a shortfall and a negative gap excess savings relative to this modeled bill. No tax, fees, borrowing, reserve earmark or guarantee is included. The sensitivity chart changes one input at a time: quote ± the selected percentage; monthly saving ±25%; return and price growth ±2 percentage points, bounded to their stated baseline ranges; and the deadline ±1 year, bounded to 1–15 years. Quotes and deposits are scaled stress cases, so their tested endpoints may exceed baseline form limits. All tested inputs are listed in the data table. Ranges are authored assumptions, not confidence intervals, probability distributions, equally likely outcomes or a global sensitivity decomposition. The combined case applies its five changes together in the stated order, without calling it a worst case.',charts:[
  {id:'saving-gap-sensitivity-tornado',type:'tornado',title:'Change in the saving gap when one tested assumption moves',unit:'money',unitLabel:'CAD change from the selected baseline gap · negative reduces the gap',evidence:'One-at-a-time hypothetical sensitivity',rows:sorted.map(r=>({label:r.label,low:r.low,high:r.high,lowLabel:inputLabel(r.lowInput,r.unit),highLabel:inputLabel(r.highInput,r.unit)})),note:'Rows are ordered by the absolute difference between their two tested output changes. The filled marker is the lower input, and the open marker the higher input; either one can lie on either side of zero. Lower monthly saving can increase the gap, for example. The ranking depends on the chosen range for every input, not only on the model formula. The bars do not show probability mass, an uncertainty interval or an amount assigned to each cause. Consult the table for all actual tested input values.'},
  {id:'saving-gap-deposit-curve',type:'line',title:'Signed funding gap as the monthly deposit changes',unit:'money',xLabel:'Assumed month-end deposit (CAD per month)',evidence:'Hypothetical saving scenarios',series:[{name:'Future project price minus savings',rows:Array.from({length:21},(_,i)=>{const x=i*Math.max(1000,input.monthly*1.5)/20;return {x,value:sensitivityGoal({...input,monthly:x}).gap};})}],note:'Only the deposit changes along this curve. Project price, price growth, return, starting savings and the payment date stay selected assumptions. The horizontal axis is a monthly cash commitment, not time. The zero crossing is the deposit that funds the modeled bill under this constant-return case; it is not a deposit that guarantees success under uncertain prices or returns.'},
  {id:'saving-gap-return-deadline',type:'heatmap',title:'Signed funding gaps when return and the deadline change together',unit:'money',signed:true,compactValues:false,columns:[0,3,6,9].map(v=>v+'%'),rows:[2,5,8,10].map(years=>({label:years+' years',values:[0,3,6,9].map(rate=>sensitivityGoal({...input,years,rate}).gap)})),evidence:'Hypothetical two-input scenarios',note:'Rows replace whole years until payment and columns the constant annual savings return. Changing the horizon changes the project-price growth period, number of month-end deposits and savings growth period together. All other baseline inputs stay fixed. This grid shows combinations that a one-input-at-a-time chart does not evaluate. Each signed cell is a gap, with no likelihood or empirical return frequency attached.'},
  {id:'saving-gap-combined-case',type:'waterfall',title:'From the baseline gap to one combined assumption case',unit:'money',rows:[{label:'Baseline signed funding gap',value:p.baseline.gap},...p.steps],totalLabel:'Combined-case signed gap',evidence:'Sequential hypothetical scenario bridge',note:'The case uses the higher tested quote and price growth, lower tested saving and return, and earlier tested deadline. Each step recomputes the model after all preceding changes, so its amount is conditional on that order. The endpoint is an exact reconciliation, not a unique causal attribution, sum of independent risks or proof of a global worst outcome. Adding the separate effects from the first figure generally gives a different result because these inputs interact.'}
 ]};
}
