// Original fixed-window vacation cost scenarios. No resale, exit right or contract release.
export const vacationCommitmentDefinitions={
  timeshareCost:{title:'Compare a vacation commitment with paying for the nights used',fields:[
    ['upfront','Upfront purchase paid from cash (CAD)',30000,0,150000,1000],
    ['dues','First-year annual dues (CAD)',1300,0,10000,100],
    ['duesGrowth','Annual dues increase assumption (%)',4,0,10,.5],
    ['usedNights','Nights actually used in each year',7,0,28,1],
    ['nightRate','First-year comparable rental cost per night (CAD)',250,0,1500,25],
    ['rentalGrowth','Annual increase in the rental price assumption (%)',3,0,10,.5],
    ['bookingFee','Annual booking charge if any nights are used (CAD)',100,0,1000,25],
    ['assessment','One hypothetical additional assessment (CAD)',5000,0,50000,500],
    ['assessmentYear','Year of the assessment; outside the window means excluded',8,1,30,1],
    ['discount','Effective annual discount rate for present value (%)',3,0,12,.5],
    ['years','Years included in the reporting window',15,1,30,1]
  ]}
};
export function vacationCommitmentCost(input) {
  let owner=input.upfront,rental=0,duesTotal=0,bookingTotal=0,assessmentTotal=0,ownerPV=input.upfront,rentalPV=0;
  const rows=[{x:0,owner,rental}],annual=[];
  for(let year=1;year<=input.years;year++) {
    const dues=input.dues*(1+input.duesGrowth/100)**(year-1);
    const booking=input.usedNights>0?input.bookingFee:0;
    const assessment=year===input.assessmentYear?input.assessment:0;
    const own=dues+booking+assessment,rent=input.usedNights*input.nightRate*(1+input.rentalGrowth/100)**(year-1);
    owner+=own;rental+=rent;duesTotal+=dues;bookingTotal+=booking;assessmentTotal+=assessment;
    const divisor=(1+input.discount/100)**year;ownerPV+=own/divisor;rentalPV+=rent/divisor;
    rows.push({x:year,owner,rental});annual.push({year,own,rent,dues,booking,assessment});
  }
  const nights=input.usedNights*input.years;
  return {rows,annual,owner,rental,duesTotal,bookingTotal,assessmentTotal,ownerPV,rentalPV,nights,perNight:nights>0?owner/nights:null};
}
export function vacationCommitmentResult(kind,input) {
  if(kind!=='timeshareCost')throw Error('Unknown vacation-commitment topic.');
  const p=vacationCommitmentCost(input);
  const selected=p.annual.filter(r=>r.year===1||r.year===input.years||r.assessment>0||r.year%5===0);
  return {metrics:[['Ownership cash cost within the reporting window',p.owner,'money'],['Rental cash cost for the same number of nights',p.rental,'money'],['Ownership cost per night actually used in the window',p.perNight,'money',p.perNight===null?'No nights used':undefined]],note:'Original nominal-CAD illustration for a hypothetical vacation ownership or right-to-use arrangement. The purchase is paid from cash at time zero. Annual dues grow at the entered constant rate whether or not any nights are used. One annual booking fee is paid only in a year with positive usage; one assessment is included only if its selected year falls within the reporting window. Comparable rental cost uses the same number of nights each year and its own price-growth assumption. All annual costs are placed at year-end for the present-value calculation; actual due dates can be earlier. No financing, resale proceeds, rental income from unused rights, tax, travel costs, additional fees or exit payments are included. Night availability and equivalence of lodging are assumed, not verified. The window is only a measurement period: it does not mean the real contract ends or that fees can be cancelled. Present values discount the same cash costs and are not added to nominal totals.',charts:[
    {id:'vacation-commitment-cumulative',type:'line',title:'The upfront payment and recurring dues create a different cash path',unit:'money',xLabel:'Years in the reporting window',series:[{name:'Ownership cash paid',rows:p.rows.map(r=>({x:r.x,value:r.owner}))},{name:'Rental cash paid',rows:p.rows.map(r=>({x:r.x,value:r.rental})),dash:true}],note:'The ownership line begins with the purchase at time zero. Later points add dues, any booking fee and the selected assessment. The rental path buys only the nights used. The chart measures cash paid through each date; it does not report investment wealth, property value, unspent savings or a contractual payout amount.'},
    {id:'vacation-commitment-annual',type:'groupbar',title:'Check recurring bills and the year of a possible extra assessment',unit:'money',seriesNames:['Ownership costs in the year','Rental costs in the year'],rows:selected.map(r=>({label:'Year '+r.year+(r.assessment>0?' · assessment included':''),values:[r.own,r.rent]})),note:'The comparison shows year one, the finish, every fifth year within the window and any included assessment year. The purchase paid at time zero is excluded from these annual bars. The assessment is an entered stress, not an estimate of a particular property’s reserve deficiency or a claim that the bill is likely.'},
    {id:'vacation-commitment-cost-parts',type:'waterfall',title:'Reconcile the purchase with every cost included in the window',unit:'money',rows:[{label:'Upfront cash purchase',value:input.upfront},{label:'Annual dues across the window',value:p.duesTotal},{label:'Booking charges for years used',value:p.bookingTotal},{label:'Assessment inside the window',value:p.assessmentTotal}],totalLabel:'Ownership cash paid',note:'These are positive cash outlays, with no assumed resale offset. An assessment after the selected finish is outside the total rather than forgiven. Costs beyond the reporting horizon, termination expenses and continuing contractual obligations are not measured by this reconciliation.'},
    {id:'vacation-commitment-used-night',type:'heatmap',title:'Cost per used night depends on actual use as well as fee increases',unit:'money',columns:['0%','2%','4%','6%'],rows:[3,7,14,21].map(usedNights=>({label:usedNights+' nights/year',values:[0,2,4,6].map(duesGrowth=>vacationCommitmentCost({...input,usedNights,duesGrowth}).perNight)})),note:'Rows replace nights actually used per year, and columns replace the annual dues-growth rate. All other entered costs and the window stay fixed. Positive usage incurs one annual booking charge under this model. A lower average from more use requires actually taking more nights; it does not prove additional nights are available, valuable or free of travel costs.'},
    {id:'vacation-commitment-discounted',type:'groupbar',title:'Present value changes the comparison date, not the bills themselves',unit:'money',seriesNames:['Ownership costs','Rental costs'],rows:[{label:'Undiscounted cash within the window',values:[p.owner,p.rental]},{label:'Present value at the entered discount rate',values:[p.ownerPV,p.rentalPV]}],note:'Present values keep the time-zero purchase unchanged and discount annual costs at the selected effective annual rate. They are alternative date-adjusted totals, not additional costs or account balances. The discount rate is a valuation assumption, not an offered return. A smaller present value does not reduce the dollars actually payable when a fee falls due.'}
  ]};
}
