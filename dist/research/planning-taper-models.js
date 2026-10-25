export const taperDefinitions={taper:{title:'Separate a hypothetical flat tax from a separate benefit phase-out',fields:[
 ['taperIncome','Starting monthly gross earnings (CAD)',2000,0,5000,100],
 ['taperRaise','Increase in monthly gross earnings (CAD)',200,0,2000,50],
 ['taperTax','Hypothetical flat tax on all gross earnings (%)',20,0,60,5],
 ['taperBenefit','Maximum separate monthly cash benefit (CAD)',300,0,1000,50],
 ['taperRate','Benefit reduction per dollar above CAD 1,500 (%)',50,0,100,10]
]}};
const threshold=1500;
export function taperBudget(i,gross=i.taperIncome){
 const rate=i.taperRate/100,end=rate>0?threshold+i.taperBenefit/rate:null;
 const benefit=end!==null&&gross>=end?0:Math.max(0,i.taperBenefit-Math.max(0,gross-threshold)*rate);
 const tax=gross*i.taperTax/100,resources=gross-tax+benefit;
 const active=rate>0&&i.taperBenefit>0&&gross>=threshold&&gross<end;
 return {gross,tax,benefit,resources,localOffset:i.taperTax/100+(active?rate:0)};
}
export function taperChange(i,gross=i.taperIncome,raise=i.taperRaise){
 const before=taperBudget(i,gross),after=taperBudget(i,gross+raise),extraTax=after.tax-before.tax,lostBenefit=before.benefit-after.benefit,gain=after.resources-before.resources;
 return {before,after,extraTax,lostBenefit,gain,offset:raise>0?(extraTax+lostBenefit)/raise:null};
}
export function taperProfile(i){
 const max=Math.max(5000,i.taperIncome+i.taperRaise),end=i.taperRate>0?threshold+i.taperBenefit/(i.taperRate/100):null;
 const points=[0,max,threshold,i.taperIncome,i.taperIncome+i.taperRaise,...Array.from({length:101},(_,j)=>j*max/100)];
 if(end!==null&&Number.isFinite(end)&&end<=max)points.push(end);
 return [...new Set(points)].sort((a,b)=>a-b).map(gross=>taperBudget(i,gross));
}
export function taperResult(kind,i){
 if(kind!=='taper')throw Error('Unknown benefit-taper topic.');
 const p=taperChange(i),profile=taperProfile(i),max=profile.at(-1).gross;
 return {metrics:[['Modeled monthly resources after the selected raise',p.after.resources,'money'],['Increase in monthly resources',p.gain,'money'],['Extra tax plus lost benefit / selected gross raise',p.offset,'percent',i.taperRaise===0?'N/A · no gross increase':undefined]],note:'An invented monthly tax-and-benefit system, not the law, eligibility rules or tax year of any country. All amounts are hypothetical CAD per month. Tax is a flat entered percentage of ALL gross earnings, without brackets, allowances, credits or payroll contributions. A separate nontaxable cash benefit begins at the entered maximum and falls by the selected rate on gross earnings above a fixed CAD 1,500 threshold, stopping at zero. The benefit is never negative; no cliff or repayment debt is modeled. Both earnings and the benefit are assumed received in the same modeled month; no prior-year assessment, withholding/refund settlement or receipt lag is calculated. Resources equal gross earnings minus this modeled tax plus this modeled benefit. The selected-raise offset share is (extra tax + lost benefit) / the full gross increase; it is undefined when the increase is zero. The right-hand local offset at the selected STARTING income is '+(p.before.localOffset*100).toFixed(2)+'%, which can differ from the full-increase share when a phase-out boundary is crossed. A zero phase-out rate keeps the benefit constant. Combined local offsets may exceed 100% under deliberately extreme entered assumptions, and negative resource gains are retained. No employee/employer contributions, household costs, inflation, work incentives or behaviour, real benefit entitlement, tax deduction or personal affordability is inferred. This is not an OECD country estimate or an employer-labour-cost tax wedge.',charts:[
  {id:'taper-resources-profile',type:'line',title:'Trace the resource level through the start and end of a benefit phase-out',unit:'money',unitLabel:'Hypothetical CAD of monthly resources',xLabel:'Monthly gross earnings · hypothetical CAD',xUnit:'money',xTicks:[{value:0,label:'$0'},{value:max/2,label:'$'+(max/2000).toFixed(1)+'k'},{value:max,label:'$'+(max/1000).toFixed(1)+'k'}],series:[{name:'Earnings after modeled tax, plus benefit',rows:profile.map(r=>({x:r.gross,value:r.resources}))},{name:'Earnings after modeled tax only',dash:true,rows:profile.map(r=>({x:r.gross,value:r.gross-r.tax}))}],note:'The curve contains the exact fixed phase-out start and any finite exhaustion point inside the chart, so a line segment does not smooth over a change in slope. The two lines differ by the current benefit, not by another wage payment. The plot shows resource levels across separate gross-income scenarios, not a career forecast.'},
  {id:'taper-raise-reconciliation',type:'waterfall',title:'Reconcile the selected gross raise with extra tax and the benefit lost',unit:'money',unitLabel:'Change in hypothetical CAD per month',rows:[{label:'Selected increase in gross earnings',value:i.taperRaise},{label:'Extra flat modeled tax',value:-p.extraTax},{label:'Separate cash benefit lost',value:-p.lostBenefit}],totalLabel:'Increase / decrease in monthly resources',note:'The benefit loss is limited to what was still received at the starting income. Its phase-out rate is not applied without limit to the whole raise. This change identity equals after-raise resources minus before-raise resources; it does not calculate the household’s total budget or an actual tax bill.'},
  {id:'taper-same-raise-starting-income',type:'signedbar',title:'The same gross raise can retain different amounts at different starting incomes',unit:'money',unitLabel:'Change in hypothetical monthly resources · same selected gross increase',rows:[500,1000,1500,2000,2500,3000].map(gross=>({label:'Starting gross CAD '+gross.toLocaleString('en-CA'),value:taperChange(i,gross).gain})),note:'Only starting gross earnings are replaced. The selected raise, tax rate, maximum benefit, phase-out rate and fixed threshold stay unchanged. Each row compares its own before/after resources. A larger gain from a different starting income does not establish a higher benefit or compare overall living standards.'},
  {id:'taper-start-and-raise-grid',type:'heatmap',signed:true,title:'Test a complete before-and-after change across both starting income and raise size',unit:'money',unitLabel:'Increase / decrease in hypothetical CAD of monthly resources',columns:['+$100','+$200','+$500','+$1k'],rows:[1000,1500,2000,2500].map(gross=>({label:'$'+(gross/1000).toFixed(1)+'k start',values:[100,200,500,1000].map(raise=>taperChange(i,gross,raise).gain)})),note:'Rows replace starting monthly gross earnings; columns replace the monthly gross increase. Both endpoints are recalculated using the selected tax, benefit and phase-out assumptions. These are dollar changes, not local marginal percentages or resource levels. A negative cell is preserved when the invented combined deductions exceed the gross increase.'}
 ]};
}
