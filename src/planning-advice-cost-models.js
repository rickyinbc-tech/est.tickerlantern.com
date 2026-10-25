import {adviceSource} from './planning-advice-data.js';
export const adviceCostDefinitions={
  adviceCost:{title:'Keep the survey context separate from a hypothetical advice-fee budget',fields:[
    ['adviceProject','Initial project fee, paid at the start (CAD)',1500,0,20000,250],['adviceReview','Review fee in starting-date dollars (CAD)',500,0,5000,100],
    ['adviceReviewEvery','Years between project reviews',3,1,10,1],['adviceRetainer','First annual retainer, paid at the start (CAD)',1800,0,10000,100],
    ['adviceYears','Service years included',10,1,20,1],['adviceFeeGrowth','Annual increase in future quoted fees (%)',2,0,8,.5],
    ['adviceDiscount','Effective annual discount assumption for fee timing (%)',3,0,10,.5]
  ]}
};
export function adviceFeeSchedule(input){
  let projectTotal=0,retainerTotal=0,projectPV=0,retainerPV=0;
  const annual=[],cumulative=[{x:0,project:0,retainer:0}];
  for(let t=0;t<input.adviceYears;t++){
    const factor=(1+input.adviceFeeGrowth/100)**t;
    const project=t===0?input.adviceProject:t%input.adviceReviewEvery===0?input.adviceReview*factor:0;
    const retainer=input.adviceRetainer*factor,discount=(1+input.adviceDiscount/100)**t;
    projectTotal+=project;retainerTotal+=retainer;projectPV+=project/discount;retainerPV+=retainer/discount;
    annual.push({x:t+1,project,retainer,paymentTime:t});cumulative.push({x:t+1,project:projectTotal,retainer:retainerTotal});
  }
  return {annual,cumulative,projectTotal,retainerTotal,projectPV,retainerPV};
}
export function adviceCostResult(kind,input){
  if(kind!=='adviceCost')throw Error('Unknown advice-cost topic.');
  const p=adviceFeeSchedule(input),line=(name,rows,key,extra={})=>({name,rows:rows.map(r=>({x:r.x,value:r[key]})),...extra});
  return {metrics:[['Nominal fees: initial project and scheduled reviews',p.projectTotal,'money'],['Nominal fees: annual retainer',p.retainerTotal,'money'],['Present cost: retainer minus project schedule',p.retainerPV-p.projectPV,'money']],note:'The first two charts reproduce selected 2024 survey observations from the FCAC spotlight issued 17 November 2025 and modified 21 November 2025, retrieved 25 October 2026. They describe reported source use, not advisor quality or the effect of obtaining advice. The other two charts are separate hypothetical fee schedules. Both start immediately. The project path pays the initial fee at time zero, then a review after every selected number of complete years, only if its payment date falls before the end of the selected service window. The retainer path pays at the start of every service year. Future review and retainer quotes grow at the selected annual rate; the initial project fee is paid once without escalation. The discount rate converts dated payments to starting-date present cost and is not an expected portfolio return. No household funding account, investment performance, taxes, reimbursement, product costs or service outcomes are calculated. The two packages are not assumed to provide equivalent services.',charts:[
    {id:'advice-professional-age-use',type:'bar',evidence:'Official survey observations',title:'Reported use of professional advisors across age groups',unit:'percent',unitLabel:'Reported share of each stated age group (%) · 2024 survey',rows:adviceSource.professionalByAge.map(r=>({label:r.label,value:r.percent/100})),source:adviceSource.url,sourceLabel:'FCAC · 2024 CFCS advice spotlight',note:'Descriptive source-use shares reported by FCAC. These groups have different denominators. The spotlight supplies no uncertainty intervals for these displayed comparisons; no significance or causal claim is made.'},
    {id:'advice-young-selected-sources',type:'bar',evidence:'Official survey observations',title:'Three reported advice sources among people aged 18–34',unit:'percent',unitLabel:'Reported share of the 18–34 group (%) · selected sources',rows:adviceSource.youngSources.map(r=>({label:r.label,value:r.percent/100})),source:adviceSource.url,sourceLabel:'FCAC · 2024 CFCS advice spotlight',note:'Selected channels, with possible overlapping use. These bars are not a complete mutually exclusive allocation and should not be added into a pie or used to infer individual source combinations.'},
    {id:'advice-fee-calendar',type:'line',title:'A project with periodic reviews has a different fee calendar from a retainer',unit:'money',xMin:1,xLabel:'Service year · each fee is paid at that year’s start',series:[line('Initial project / scheduled review',p.annual,'project'),line('Annual retainer',p.annual,'retainer',{dash:true})],note:'Original hypothetical quotes, not survey-reported fees or market prices. Lines connect annual fee amounts; there are no additional charges between year starts. A review after year three occurs at the start of service year four. It is excluded if the selected window contains only three service years.'},
    {id:'advice-fee-cumulative',type:'line',title:'Compare cumulative nominal outlays before assessing service value',unit:'money',xLabel:'Number of service years included',series:[line('Project and review outlays',p.cumulative,'project'),line('Retainer outlays',p.cumulative,'retainer',{dash:true})],note:'The first service year includes the payment made immediately at the start. The lines accumulate cash outlays and do not represent an investment balance. Present-cost metrics discount the original payment times, not these year-count positions. A higher fee does not establish worse value, and a lower fee does not establish adequate scope.'}
  ]};
}
