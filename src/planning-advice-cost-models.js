import { adviceSource } from './planning-advice-cost-data.js';

export const adviceCostDefinitions={
  adviceFeeCash:{title:'Budget three hypothetical fee schedules without assigning an investment benefit',fields:[
    ['projectFee','One-time project fee paid immediately (CAD)',2500,0,15000,100],
    ['monthlyFee','Alternative ongoing monthly retainer (CAD)',200,0,1000,25],
    ['feeAssets','Unchanging assets used only as the fee calculation base (CAD)',400000,0,2000000,10000],
    ['assetFee','Alternative annual charge on that fixed asset base (%)',.8,0,2.5,.1],
    ['feeMonths','Months of ongoing service in the comparison',24,1,60,1],
    ['feeCash','Outside cash available for advice bills at the start (CAD)',2000,0,50000,500],
    ['feeSurplus','Monthly outside cash added before each ongoing bill (CAD)',150,0,3000,25]
  ]}
};

export function adviceFeePlan(input){
  const assetMonthly=input.feeAssets*input.assetFee/100/12;
  const schedules=[
    {name:'One-time project',upfront:input.projectFee,monthly:0},
    {name:'Monthly retainer',upfront:0,monthly:input.monthlyFee},
    {name:'Asset-linked charge',upfront:0,monthly:assetMonthly}
  ].map(s=>{
    let paid=s.upfront,cumulative=-s.upfront,lowest=cumulative;
    const rows=[{x:0,paid,cash:input.feeCash+cumulative}];
    for(let month=1;month<=input.feeMonths;month++){
      paid+=s.monthly;cumulative+=input.feeSurplus-s.monthly;lowest=Math.min(lowest,cumulative);
      rows.push({x:month,paid,cash:input.feeCash+cumulative});
    }
    return {...s,rows,total:paid,ending:rows.at(-1).cash,required:-lowest,extra:Math.max(0,-lowest-input.feeCash)};
  });
  return {schedules,assetMonthly,annualAssetFee:assetMonthly*12,
    equivalentAssets:input.assetFee>0?input.monthlyFee*12/(input.assetFee/100):null};
}

export function adviceCostResult(kind,input){
  if(kind!=='adviceFeeCash')throw Error('Unknown advice-cost topic.');
  const p=adviceFeePlan(input);
  return {metrics:p.schedules.map(s=>[s.name+': total selected fees',s.total,'money']),
    note:'The first figure contains fixed survey observations. The other figures compare three independent hypothetical payment schedules in CAD, not quotations or equivalent service packages. The project is paid at time zero and has no automatic renewal. Ongoing bills occur at each month-end after the entered outside-cash addition. The asset-linked bill uses a fixed asset base and one-twelfth of the annual percentage; it is paid from outside cash and never deducted from those assets. No portfolio return, promised advice benefit, tax, sales tax, product fee, commission, minimum charge, tiering or cancellation rule is calculated. Negative outside cash is an unmet funding need, not automatic borrowing. A lower cost does not establish adequate scope, quality, suitability or better outcomes.',
    charts:[
      {id:'advice-source-survey',type:'bar',title:'Reported sources of financial advice in the 2024 survey',unit:'percent',unitLabel:'Share of survey respondents reporting each source · overlapping categories',rows:adviceSource.rows,source:adviceSource.url,sourceLabel:'FCAC · 2024 CFCS advice-source summary',note:adviceSource.scope+' Released 21 November 2025; reviewed 25 October 2026. The percentages sum to 142%, not a partition of a 100% total. Editing the fee inputs does not change these observations.'},
      {id:'advice-fee-cumulative',type:'line',title:'A project bill arrives immediately; recurring charges accumulate with time',unit:'money',xLabel:'Months of service',series:p.schedules.map((s,i)=>({name:s.name,rows:s.rows.map(r=>({x:r.x,value:r.paid})),dash:i===1})),note:'Each line is a separate payment alternative, not three charges assumed purchased together. Time zero includes the full one-time project bill; recurring fees begin at the end of month one. The project line assumes no further engagement, so it does not promise ongoing reviews for free.'},
      {id:'advice-fee-outside-cash',type:'line',title:'Put each payment schedule beside the outside cash assigned to it',unit:'money',xLabel:'Months from first bill',series:p.schedules.map((s,i)=>({name:s.name+' · required opening cash '+cad(s.required),rows:s.rows.map(r=>({x:r.x,value:r.cash})),dash:i===1})),note:'All three alternatives start with the same outside cash and receive the same monthly additions. Every ending value equals starting cash plus additions less that alternative’s fees. Required opening cash uses the deepest funding deficit, including the project bill at time zero. Assets used to calculate the percentage charge are not another source of bill-paying cash here.'},
      {id:'advice-fee-asset-base-grid',type:'heatmap',title:'Translate an annual percentage into one year of fee dollars',unit:'money',columns:[100000,400000,800000].map(n=>'$'+n/1000+'k base'),rows:[.4,.8,1.2].map(rate=>({label:rate.toFixed(1)+'% / yr',values:[100000,400000,800000].map(base=>base*rate/100)})),note:'Each cell replaces the annual percentage and the fixed calculation base, showing twelve monthly charges in total. The base stays unchanged; this is not a portfolio projection or a fee quote. Amounts exclude every other charge and tax. The recurring monthly-retainer input is a separate contract assumption.'}
    ]};
}

function cad(value){return 'CAD '+value.toLocaleString('en-CA',{maximumFractionDigits:2});}
