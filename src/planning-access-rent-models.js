import { rentComparisonSource } from './planning-access-rent-data.js';

export const accessRentDefinitions={
  accountAccess:{title:'Explore an interruption in access to household money',fields:[
    ['openingCash','Cash already accessible to the authorized bill payer (CAD)',2000,0,50000,500],
    ['delayedCash','Separate existing cash becoming accessible on the selected day (CAD)',12000,0,100000,1000],
    ['accessDay','Day the separate cash becomes usable, at the start of that day',21,1,60,1],
    ['monthlyIncome','Net income received at the end of each 30-day period (CAD)',2500,0,15000,100],
    ['monthlyCosts','Living costs per 30-day period, spread evenly by day (CAD)',4500,0,15000,100]
  ]},
  creditBackup:{title:'Explore cash owned, borrowing availability and an immediate bill',fields:[
    ['cash','Uncommitted cash available before the bill (CAD)',5000,0,50000,500],
    ['unusedLimit','Unused borrowing limit before the availability stress (CAD)',10000,0,100000,1000],
    ['availableShare','Share of that unused limit actually accessible in the scenario (%)',100,0,100,25],
    ['bill','Immediate unexpected bill (CAD)',8000,0,100000,500],
    ['apr','Hypothetical nominal annual interest rate on the amount drawn (%)',10,0,30,.5],
    ['principalMonthly','Monthly principal repayment, in addition to all monthly interest (CAD)',300,0,5000,50]
  ]},
  rentInterpretation:{title:'Explore an actual rent quote beside a complete monthly budget',fields:[
    ['netIncome','Household monthly take-home income (CAD)',5500,1000,20000,100],
    ['quotedRent','Monthly rent for the actual option being assessed (CAD)',2400,0,8000,100],
    ['utilities','Utilities not included in that rent (CAD per month)',150,0,1500,25],
    ['tenantInsurance','Tenant insurance paid monthly (CAD)',40,0,500,10],
    ['commute','Monthly transport cost for that location (CAD)',200,0,2000,25],
    ['otherLiving','All other monthly living expenses, without the above items (CAD)',2000,0,10000,100],
    ['saving','Monthly allocation to saving goals (CAD)',500,0,5000,50]
  ]}
};

export function accountAccessLedger(input,accessDay=input.accessDay){
  let net=0,minimum=0,released=0,incomeTotal=0,costTotal=0;
  const rows=[{x:0,value:input.openingCash}],daily=[];
  for(let day=1;day<=60;day++){
    const release=day===accessDay?input.delayedCash:0;
    net+=release;released+=release;
    rows.push({x:day-.75,value:input.openingCash+net});
    const cost=input.monthlyCosts/30;net-=cost;costTotal+=cost;minimum=Math.min(minimum,net);
    rows.push({x:day-.5,value:input.openingCash+net});
    const income=day%30===0?input.monthlyIncome:0;net+=income;incomeTotal+=income;
    rows.push({x:day,value:input.openingCash+net});
    daily.push({day,release,cost,income,closing:input.openingCash+net});
  }
  const required=Math.max(0,-minimum);
  return {rows,daily,released,incomeTotal,costTotal,required,extra:Math.max(0,required-input.openingCash),ending:input.openingCash+net};
}

export function creditBackupPlan(input){
  const capacity=input.unusedLimit*input.availableShare/100,cashUsed=Math.min(input.cash,input.bill);
  const need=Math.max(0,input.bill-cashUsed),drawn=Math.min(need,capacity),unfunded=need-drawn;
  let balance=drawn,interest=0,principal=0;
  const rows=[{x:0,value:drawn}],payments=[];
  for(let month=1;month<=24;month++){
    const charge=balance*input.apr/1200,repayment=Math.min(balance,input.principalMonthly);
    balance-=repayment;interest+=charge;principal+=repayment;
    rows.push({x:month,value:balance});payments.push({x:month,value:charge+repayment,interest:charge,principal:repayment});
  }
  return {capacity,cashUsed,drawn,unfunded,cashLeft:input.cash-cashUsed,balance,interest,principal,rows,payments};
}

export function rentQuoteBudget(input){
  const housing=input.quotedRent+input.utilities+input.tenantInsurance;
  const locationCost=housing+input.commute,remaining=input.netIncome-locationCost-input.otherLiving-input.saving;
  return {housing,locationCost,remaining,share:housing/input.netIncome};
}

export function accessRentResult(kind,input){
  if(kind==='accountAccess'){
    const p=accountAccessLedger(input),immediate=accountAccessLedger(input,1);
    return {metrics:[['Extra opening cash needed before any payment event',p.extra,'money'],['Existing cash unavailable to the bill payer at the start',input.delayedCash,'money'],['Operating cash after 60 days',p.ending,'money']],note:'Hypothetical 60-day access interruption. Opening cash is already usable by the person legally authorized to make the modeled payments. A separate existing cash balance becomes usable at the start of the selected day; this is a transfer of existing household resources, not income. Living costs leave daily at the monthly input divided by 30. Income arrives only at the end of days 30 and 60, after that day’s costs. Cash earns zero interest. Negative values are unfunded payments, without automatic borrowing or bill deferral. The assumed release date does not establish legal authority, document validity, account ownership or an institution’s processing time. Existing authority and actual access must be confirmed separately.',charts:[
      {id:'access-opening-cash',type:'bar',title:'A recorded balance and cash the authorized payer can use are different measures',unit:'money',rows:[{label:'Already accessible cash',value:input.openingCash},{label:'Separate cash awaiting access',value:input.delayedCash},{label:'Total of these two existing balances',value:input.openingCash+input.delayedCash}],note:'The final bar is the sum of the first two and is labelled as a total. Do not add all three bars. The unavailable balance remains a household asset; it cannot fund earlier payments under this scenario.'},
      {id:'access-daily-path',type:'line',title:'Compare the selected access delay with access at the start',unit:'money',xLabel:'Day in the 60-day plan',series:[{name:'Cash · selected access day',rows:p.rows},{name:'Cash · access on day 1',rows:immediate.rows,dash:true}],note:'Both paths have identical starting assets, income and living costs. The separate cash is released once. Within each day it arrives before costs, and income on days 30 and 60 arrives after costs. A later recovery in cash does not erase an earlier unpaid bill.'},
      {id:'access-sixty-day-bridge',type:'waterfall',title:'Reconcile the final cash without hiding the earlier gap',unit:'money',rows:[{label:'Already accessible opening cash',value:input.openingCash},{label:'Existing cash released during the period',value:p.released},{label:'Two net-income receipts',value:p.incomeTotal},{label:'Sixty days of living costs',value:-p.costTotal}],totalLabel:'Cash after day 60',note:'Every selected access day lies inside the 60-day horizon, so the release is included once. This endpoint is identical across access dates; the minimum operating position can differ. Cash transfers do not create investment gains or additional household income.'},
      {id:'access-delay-cost-matrix',type:'heatmap',title:'Additional opening cash across access delays and living costs',unit:'money',columns:['Day 7','Day 14','Day 21','Day 28'],rows:[3000,4000,5000,6000].map(monthlyCosts=>({label:'$'+monthlyCosts/1000+'k / 30d',values:[7,14,21,28].map(accessDay=>accountAccessLedger({...input,monthlyCosts,accessDay}).extra)})),note:'Rows replace 30-day living costs and columns replace the access day. Existing balances and end-of-period income stay selected. Cells measure extra opening cash beyond the entered accessible amount. They are planning stresses, not probabilities or legal processing-time estimates.'}
    ]};
  }
  if(kind==='creditBackup'){
    const p=creditBackupPlan(input);
    return {metrics:[['Immediate bill still without funding',p.unfunded,'money'],['Borrowing actually drawn to pay the bill',p.drawn,'money'],['Interest paid over the next 24 modeled months',p.interest,'money']],note:'Hypothetical funding and repayment exercise. Use uncommitted cash first, then draw only what remains needed and accessible from the entered unused borrowing limit. The availability percentage is an independent stress assumption, not a forecast or interpretation of a credit agreement. Unfunded bill amounts remain separate from debt actually drawn. For the next 24 months, interest on opening debt is paid in full each month at nominal annual rate divided by 12, plus the selected principal repayment capped at outstanding debt. These payments require a separate affordable income source; they do not rebuild the cash reserve. There are no fees, new draws, redrawing of repaid principal, rate changes or tax effects. Actual credit terms and minimum payments may differ.',charts:[
      {id:'backup-bill-funding',type:'waterfall',title:'An unused limit funds a bill only when money is actually borrowed',unit:'money',rows:[{label:'Immediate bill needing funding',value:input.bill},{label:'Owned cash applied to the bill',value:-p.cashUsed},{label:'Borrowing actually drawn',value:-p.drawn}],totalLabel:'Immediate funding still missing',note:'Cash applied and debt drawn reduce the unpaid bill. The unused limit is not added to owned cash or counted as an asset. Any final positive amount needs another supported funding source; the tool does not silently finance it.'},
      {id:'backup-debt-path',type:'line',title:'The bill payment can leave a separate repayment commitment',unit:'money',xLabel:'Months after the bill',series:[{name:'Debt still outstanding',rows:p.rows}],note:'The path tracks only the amount actually drawn. Interest is paid in full from other income; the entered principal amount reduces the balance. At zero principal repayment, paying interest alone leaves the debt unchanged. A zero debt balance does not prove that the original cash reserve has been restored.'},
      {id:'backup-reserve-comparison',type:'groupbar',title:'Compare borrowing and an unfunded bill across different owned reserves',unit:'money',seriesNames:['New borrowing drawn','Bill still unfunded'],rows:[0,2000,5000,10000].map(cash=>{const q=creditBackupPlan({...input,cash});return {label:'Owned reserve CAD '+cash.toLocaleString('en-CA'),values:[q.drawn,q.unfunded]};}),note:'The bill, unused limit and availability stress stay selected. Reserve amounts are alternative starting resources and are not assumed to be free to acquire. Borrowing and unfunded costs are separate outcomes, not two types of savings.'},
      {id:'backup-limit-stress',type:'heatmap',title:'Unfunded bills when less borrowing is usable',unit:'money',columns:['0% usable','25%','50%','100%'],rows:[5000,8000,10000,15000].map(bill=>({label:'$'+bill/1000+'k bill',values:[0,25,50,100].map(availableShare=>creditBackupPlan({...input,bill,availableShare}).unfunded)})),note:'Rows replace the immediate bill and columns replace the usable share of the selected unused limit. Owned cash stays fixed. Zero means that bill can be paid using cash and new debt under the assumptions; it does not assess whether future repayments are affordable or whether borrowing will actually be offered.'}
    ]};
  }
  if(kind==='rentInterpretation'){
    const p=rentQuoteBudget(input),source=rentComparisonSource.url;
    return {metrics:[['Rent, excluded utilities and tenant insurance each month',p.housing,'money'],['Housing plus location-specific transport each month',p.locationCost,'money'],['Monthly cash after living costs and saving allocation',p.remaining,'money']],note:'Official observations and a separate hypothetical budget. The first two charts use five selected CMAs and two-bedroom apartment averages for Q2 2026, released 9 September 2026. Asking and paid rent describe different populations and unadjusted unit mixes; their difference is not a matched tenant’s rent increase or a pure inflation rate. Data are experimental, in current CAD and subject to revision. The budget charts use only the independently entered rent quote and costs. No city average automatically becomes your quote. The monthly budget excludes deposits, moving costs, income tax calculations and credit or landlord qualification. A negative residual needs a funding or spending change.',charts:[
      {id:'rent-asking-paid-levels',type:'groupbar',title:'Asking rent and rent paid by existing tenants describe different populations',unit:'money',seriesNames:['Average asking rent','Average paid rent'],rows:rentComparisonSource.rows.map(r=>({label:r.label,values:[r.asking,r.paid]})),source,sourceLabel:'Statistics Canada · Q2 2026 rent comparison; Table 46-10-0092-01',note:'Five selected census metropolitan areas, two-bedroom apartments, monthly CAD. Experimental estimates released 9 September 2026; reviewed 25 October 2026. These selected examples are not a complete ranking or a quality-adjusted comparison of equivalent apartments.'},
      {id:'rent-asking-paid-gap',type:'signedbar',title:'The asking-minus-paid difference is not positive in every selected market',unit:'money',rows:rentComparisonSource.rows.map(r=>({label:r.label,value:r.asking-r.paid})),source,sourceLabel:'Statistics Canada · source levels for the displayed subtraction',evidence:'Derived from official statistics',note:'Each value subtracts the paid-rent average from the asking-rent average for the same CMA, unit type and quarter. Positive values mean a higher asking average, zero means equal averages, and negative values mean a lower asking average. The underlying apartments and tenant populations are not matched, so these differences cannot predict an individual move’s cost or a renewal increase.'},
      {id:'rent-quote-budget',type:'waterfall',title:'Test the actual quote against the whole monthly plan',unit:'money',rows:[{label:'Household take-home income',value:input.netIncome},{label:'Actual rent quote being assessed',value:-input.quotedRent},{label:'Utilities outside the rent',value:-input.utilities},{label:'Tenant insurance',value:-input.tenantInsurance},{label:'Transport for this location',value:-input.commute},{label:'Other living expenses',value:-input.otherLiving},{label:'Saving allocation',value:-input.saving}],totalLabel:'Unassigned monthly cash',note:'These are independent hypothetical inputs. Include a cost once: if heat or parking is included in the rent, do not add it again as an outside charge. Savings remain household assets but are committed cash in this monthly plan. This residual is not a formal affordability, benefit or lending test.'},
      {id:'rent-income-quote-matrix',type:'heatmap',title:'Monthly cash left across take-home income and actual rent quotes',unit:'money',signed:true,columns:['$1.5k rent','$2k','$2.5k','$3k'],rows:[4000,5000,6000,7000].map(netIncome=>({label:'$'+netIncome/1000+'k net',values:[1500,2000,2500,3000].map(quotedRent=>rentQuoteBudget({...input,netIncome,quotedRent}).remaining)})),note:'Rows replace monthly take-home income and columns replace the actual rent quote. All other costs and the saving allocation stay selected. Cells show unassigned monthly cash; negative values are a budget gap. Statistics Canada city averages are not used inside this matrix.'}
    ]};
  }
  throw Error('Unknown access-and-rent planning topic.');
}
