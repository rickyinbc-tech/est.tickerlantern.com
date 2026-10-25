import { mortgageMonthlyRate, mortgagePayment } from './planning-more-models.js';
export const decisionDefinitions={
  taxTiming:{title:'Explore RRSP and TFSA tax timing',fields:[
    ['budget','One-time after-tax saving budget (CAD)',10000,1000,50000,1000],['deduction','Assumed tax relief on RRSP deduction (%)',40,0,60,5],
    ['withdrawal','Assumed tax on RRSP withdrawal (%)',30,0,60,5],['rate','Assumed annual return (%)',5,-5,10,.5],['years','Years invested',20,1,40,1]
  ]},
  cppTiming:{title:'Explore CPP start-age adjustments',fields:[
    ['pension','Assumed age-65 monthly pension (CAD)',1000,100,2000,50],['age','Compare receipts through age',90,70,100,1],
    ['discount','Real annual discount rate (%)',2,0,6,.5]
  ]},
  rentBuy:{title:'Explore renting and buying with a common budget',fields:[
    ['price','Home purchase price (CAD)',600000,100000,2000000,10000],['down','Down payment (%)',20,20,80,5],
    ['rent','Initial monthly rent (CAD)',2500,500,10000,100],['rate','Quoted mortgage rate (%)',4,0,10,.25],
    ['years','Years in the comparison',10,1,25,1],['appreciation','Annual home-value change (%)',2,-5,8,.5],
    ['investment','Annual investment return (%)',4,-5,10,.5],['carry','Annual owner costs / home value (%)',1.5,0,5,.25],
    ['rentGrowth','Annual rent increase (%)',2,0,8,.5],['buyCosts','Purchase costs / initial price (%)',2,0,8,.5],
    ['sellCosts','Sale costs / final home value (%)',4,0,8,.5]
  ]}
};
export function taxTimingValues(input,years=input.years){
  const deposit=input.budget/(1-input.deduction/100),growth=(1+input.rate/100)**years;
  return {deposit,relief:deposit-input.budget,rrspGross:deposit*growth,rrspNet:deposit*growth*(1-input.withdrawal/100),tfsa:input.budget*growth};
}
export function cppAdjustment(start){return start<65?1-(65-start)*12*.006:1+(start-65)*12*.007;}
export function cppReceipts(pension,start,end,discount=0){
  const monthly=pension*cppAdjustment(start),r=(1+discount/100)**(1/12)-1;
  let total=0;
  for(let month=start*12+1;month<=end*12;month++)total+=monthly/(1+r)**(month-60*12);
  return total;
}
export function housingComparison(input){
  const down=input.price*input.down/100,buyCosts=input.price*input.buyCosts/100,capital=down+buyCosts;
  let debt=input.price-down,home=input.price,renter=capital,owner=0,firstOwner=0,firstRent=0;
  const pay=mortgagePayment(debt,input.rate,300),mr=mortgageMonthlyRate(input.rate),ir=(1+input.investment/100)**(1/12)-1,hr=(1+input.appreciation/100)**(1/12)-1;
  const rows=[{x:0,owner:down-input.price*input.sellCosts/100,renter,debt,home,ownerPortfolio:owner}];
  for(let month=1;month<=input.years*12;month++){
    const interest=debt*mr,paid=Math.min(pay,debt+interest),ownerCost=paid+home*input.carry/1200,rent=input.rent*(1+input.rentGrowth/100)**Math.floor((month-1)/12);
    const commonBudget=Math.max(ownerCost,rent);
    renter=renter*(1+ir)+commonBudget-rent;owner=owner*(1+ir)+commonBudget-ownerCost;
    debt=Math.max(0,debt+interest-paid);if(debt<1e-6)debt=0;home*=1+hr;
    if(month<=12){firstOwner+=ownerCost;firstRent+=rent;}
    if(month%12===0)rows.push({x:month/12,owner:home*(1-input.sellCosts/100)-debt+owner,renter,debt,home,ownerPortfolio:owner});
  }
  return {rows,capital,pay,firstOwner:firstOwner/12,firstRent:firstRent/12,end:rows.at(-1)};
}
export function decisionResult(kind,input){
  if(kind==='taxTiming'){
    const v=taxTimingValues(input),paths=Array.from({length:input.years+1},(_,x)=>({x,...taxTimingValues(input,x)}));
    return {metrics:[['RRSP gross contribution',v.deposit,'money'],['RRSP after assumed tax',v.rrspNet,'money'],['TFSA ending amount',v.tfsa,'money']],note:'Hypothetical one-time contribution comparison with the same net saving cost today. RRSP contribution is grossed up using fully usable immediate tax relief; sufficient contribution and deduction room is assumed. Both accounts earn the same constant effective annual return. RRSP balances are shown after an assumed full withdrawal at one constant tax rate. TFSA qualified growth and withdrawals are assumed tax-free. No benefit interactions, refund delay, fees, account limits or other tax rules are modeled.',charts:[
      {id:'tax-ending',type:'groupbar',title:'Compare spendable amounts as well as account balances',unit:'money',seriesNames:['Account balance','After assumed withdrawal tax'],rows:[{label:'RRSP',values:[v.rrspGross,v.rrspNet]},{label:'TFSA',values:[v.tfsa,v.tfsa]}],note:'The larger gross RRSP balance includes money that would be paid as tax under the selected withdrawal-rate assumption. Initial personal saving cost is identical in both cases.'},
      {id:'tax-path',type:'line',title:'The same growth rate, different tax timing',unit:'money',xLabel:'Years invested',series:[{name:'RRSP after assumed withdrawal tax',rows:paths.map(r=>({x:r.x,value:r.rrspNet}))},{name:'TFSA',rows:paths.map(r=>({x:r.x,value:r.tfsa})),dash:true}],note:'Each point assumes the entire RRSP balance could be withdrawn at the selected constant tax rate at that date. It is not a schedule of repeated withdrawals or an actual tax-return calculation.'},
      {id:'tax-bridge',type:'waterfall',title:'Bridge the gross balance to the after-tax difference',unit:'money',rows:[{label:'Gross RRSP ending balance',value:v.rrspGross},{label:'Assumed withdrawal tax',value:-(v.rrspGross-v.rrspNet)},{label:'TFSA ending amount',value:-v.tfsa}],totalLabel:'RRSP minus TFSA',note:'A positive endpoint favors the modeled RRSP amount; a negative endpoint favors the modeled TFSA amount. The initial tax relief already financed the gross contribution and is not added again.'},
      {id:'tax-matrix',type:'heatmap',title:'The tax-rate relationship, isolated',unit:'percent',signed:true,columns:[20,30,40,50].map(x=>x+'% relief'),rows:[10,20,30,40].map(x=>({label:x+'% at exit',values:[20,30,40,50].map(y=>(1-x/100)/(1-y/100)-1)})),note:'Percentage difference: RRSP after tax relative to TFSA, with equal net initial cost and identical growth. This ratio depends only on the two displayed tax rates. Zero means equal modeled spendable outcomes, not that the accounts have identical rules.'}
    ]};
  }
  if(kind==='cppTiming'){
    const starts=[60,65,70],ages=Array.from({length:input.age-59},(_,i)=>60+i);
    return {metrics:starts.map(start=>['Monthly pension · start '+start,input.pension*cppAdjustment(start),'money']),note:'Simplified CPP age-adjustment illustration, not a personal benefit estimate. The same assumed age-65 entitlement is held fixed across start ages. All amounts use constant purchasing-power dollars with no tax, benefit interactions or further contribution accrual. A full payment year runs from one birthday to the next, with payments at month-end. Discounted receipts are valued at age 60 using the selected real rate. Survival probabilities, survivor benefits and QPP rules are excluded.',charts:[
      {id:'cpp-monthly',type:'bar',title:'Starting age changes the monthly payment',unit:'money',rows:starts.map(start=>({label:'Start at age '+start,value:input.pension*cppAdjustment(start)})),note:'Uses the official CPP adjustment factors of 0.6% per month before 65 and 0.7% per month after 65, applied to an assumed common age-65 amount. CAD amounts are hypothetical, not maximum or average benefits.'},
      {id:'cpp-cumulative',type:'line',title:'More early payments versus larger later payments',unit:'money',xMin:60,xLabel:'Age reached',series:starts.map((start,i)=>({name:'Start '+start,rows:ages.map(age=>({x:age,value:cppReceipts(input.pension,start,age)})),dash:i===1})),note:'Undiscounted cumulative receipts through each birthday. At the starting birthday the total is zero; the next birthday includes twelve month-end payments. Assumes the person is alive for every displayed payment.'},
      {id:'cpp-present',type:'groupbar',title:'Cumulative receipts after discounting the timing',unit:'money',seriesNames:starts.map(start=>'Start '+start),rows:[75,85,95].map(age=>({label:'Through age '+age,values:starts.map(start=>cppReceipts(input.pension,start,age,input.discount))})),note:'Present value at age 60, using the selected real discount rate and month-end payment dates. The comparison birthdays are fixed alternatives and may differ from the selected line-chart endpoint.'},
      {id:'cpp-matrix',type:'heatmap',title:'Delay to 70 versus start at 65: discounted receipt difference',unit:'money',signed:true,columns:[75,85,95,100].map(age=>'Age '+age),rows:[0,2,4,6].map(discount=>({label:discount+'% real',values:[75,85,95,100].map(age=>cppReceipts(input.pension,70,age,discount)-cppReceipts(input.pension,65,age,discount))})),note:'Signed difference in present value at age 60: start at 70 minus start at 65. These are deterministic receipts conditional on living to the displayed age. They do not include the cost of bridging income before the pension starts.'}
    ]};
  }
  if(kind==='rentBuy'){
    const p=housingComparison(input),end=p.end;
    return {metrics:[['Starting capital in either case',p.capital,'money'],['Owner ending wealth',end.owner,'money'],['Renter ending portfolio',end.renter,'money']],note:'Hypothetical comparable housing over the selected years. Mortgage: 25-year amortization, nominal quoted rate compounded semi-annually, constant throughout. Renter invests the owner’s down payment plus purchase costs. Each month both households allocate the higher housing cash outflow; the cheaper option invests the difference at month-end. Investment returns are effective annual rates before tax and fees. Owner costs scale with current home value; rent increases annually. Owner wealth assumes sale at every displayed endpoint. No default insurance, tax benefits, capital-gains tax, moving costs or rent-law constraints are modeled.',charts:[
      {id:'housing-wealth',type:'line',title:'Wealth after housing costs and investing the difference',unit:'money',xLabel:'Years from today',series:[{name:'Owner: sale proceeds plus portfolio',rows:p.rows.map(r=>({x:r.x,value:r.owner}))},{name:'Renter: invested portfolio',rows:p.rows.map(r=>({x:r.x,value:r.renter})),dash:true}],note:'Owner amount is home value less assumed sale costs and remaining debt, plus any invested monthly cost advantage. The renter begins with all the common starting capital invested. Lines can fall below zero.'},
      {id:'housing-outflow',type:'bar',title:'First-year housing cash flow before investing any difference',unit:'money',rows:[{label:'Owner · monthly average',value:p.firstOwner},{label:'Renter · monthly average',value:p.firstRent}],note:'Owner includes mortgage principal, interest and the selected combined carrying costs. Principal builds equity, so these bars measure cash required rather than pure economic expense. Common utilities and lifestyle spending are excluded.'},
      {id:'housing-bridge',type:'waterfall',title:'From the home’s value to the relative ending wealth',unit:'money',rows:[{label:'Final home value',value:end.home},{label:'Assumed sale costs',value:-end.home*input.sellCosts/100},{label:'Remaining mortgage',value:-end.debt},{label:'Owner investment portfolio',value:end.ownerPortfolio},{label:'Renter investment portfolio',value:-end.renter}],totalLabel:'Owner minus renter',note:'The endpoint is a difference in modeled wealth, not profit on the home. Purchase costs already reduced the owner’s starting wealth; the renter invested that same cash.'},
      {id:'housing-matrix',type:'heatmap',title:'Home appreciation and investment return can change the result',unit:'money',signed:true,columns:[-2,0,2,4].map(x=>x+'% home'),rows:[0,2,4,6].map(x=>({label:x+'% invest',values:[-2,0,2,4].map(y=>{const e=housingComparison({...input,investment:x,appreciation:y}).end;return e.owner-e.renter;})})),note:'Owner minus renter ending wealth at the selected horizon. Each cell reruns both monthly budgets and investment paths. Positive values favor the modeled owner; negative values favor the modeled renter. No cell has an assigned probability.'}
    ]};
  }
  throw Error('Unknown planning decision.');
}
