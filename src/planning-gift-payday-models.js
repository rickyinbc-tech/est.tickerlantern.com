export const giftPaydayDefinitions={
  donateKind:{title:'Compare giving fund units directly to a charity with selling them first and giving the cash',fields:[
    ['dkValue','Market value of the fund units to give (CAD)',20000,500,2000000,500],
    ['dkCost','Adjusted cost base of those units (CAD)',12000,0,2000000,500],
    ['dkCredit','Combined federal and provincial donation credit rate on the gift (%)',45.8,0,60,.1],
    ['dkRate','Marginal tax rate on taxable capital gains (%)',40,0,60,.5],
    ['dkGrowth','Fund return each year after the gift (%)',6,-5,15,.25],
    ['dkYears','Years until the remaining fund units are sold',10,1,40,1]
  ]},
  tfsaPayday:{title:'Compare a January TFSA contribution with spreading the same room across the year',fields:[
    ['tpAmount','TFSA room used this year (CAD)',7000,100,100000,100],
    ['tpReturn','Fund return each year (%)',6,-5,15,.25],
    ['tpCash','Savings interest rate on money waiting to be invested (%)',2,0,8,.05],
    ['tpTax','Marginal tax rate on interest earned outside the TFSA (%)',30,0,60,.5],
    ['tpYears','Years the same pattern is repeated',20,1,40,1]
  ]}
};
export const giftPaydayWholeKeys=['dkYears','tpYears'];

// CRA, Line 34900 "How much you can claim" (2025 tax year, page dated 6 July 2026): federal 29% and each province's
// rate on gifts above the first CAD 200, before the higher rates for donors with income in the top bracket.
// Quebec is administered by Revenu Québec and is not listed by CRA.
export const donationCreditRates={federal:29,taxYear:2025,provinces:[
  ['Alberta',21],['British Columbia',16.8],['Manitoba',17.4],['New Brunswick',17.95],['Newfoundland and Labrador',21.8],['Northwest Territories',14.05],
  ['Nova Scotia',21],['Nunavut',11.5],['Ontario',11.16],['Prince Edward Island',19],['Saskatchewan',14.5],['Yukon',12.8]
]};
// CRA, MP, DB, RRSP, DPSP, ALDA, TFSA limits and YMPE (page dated 1 December 2025).
export const tfsaDollarLimits={2009:5000,2010:5000,2011:5000,2012:5000,2013:5500,2014:5500,2015:10000,2016:5500,2017:5500,2018:5500,2019:6000,2020:6000,2021:6000,2022:6000,2023:6500,2024:7000,2025:7000,2026:7000};

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const INCLUSION=.5;

// Giving units in kind: CRA allows a zero inclusion rate on the capital gain from a gift of qualifying securities,
// which include units of a mutual fund trust and shares of a mutual fund corporation (P113, T1170). Selling first
// makes the gain taxable at the one-half inclusion rate; the receipt and credit are the same in both cases. A loss
// (cost above value) gives no gain to exempt, so the two routes are equal here. The credit is applied at one rate,
// as if the first CAD 200 of gifts this year were already claimed and the 75% of net income limit is not reached.
// "Keep the fund" paths: the household holds the units and the same amount of cash, and wants to give the cash
// amount and still hold the fund. Gift the units and rebuy with the cash (cost base resets to market value), sell
// and give the proceeds then rebuy (tax now, with the tax payment's lost growth) or give the cash and keep the units.
export function donateKindPlan(input,overrides={}){
  const i={...input,...overrides},V=i.dkValue,C=i.dkCost,gain=V-C,h=INCLUSION*i.dkRate/100,g=i.dkGrowth/100;
  const credit=V*i.dkCredit/100,taxNow=Math.max(0,gain)*h;
  const inKindCost=V-credit,sellFirstCost=inKindCost+taxNow;
  const rows=Array.from({length:i.dkYears+1},(_,t)=>{
    const grown=V*Math.pow(1+g,t);
    const rebuy=grown-Math.max(0,grown-V)*h,keep=grown-Math.max(0,grown-C)*h,sellRebuy=rebuy-taxNow*Math.pow(1+g,t);
    return {x:t,grown,rebuy,keep,sellRebuy};
  });
  return {gain,credit,taxNow,inKindCost,sellFirstCost,saving:sellFirstCost-inKindCost,rows,end:rows.at(-1)};
}

// One year of TFSA room, monthly steps with monthly rates equivalent to the annual inputs. A January deposit is
// invested on 1 January. Staging moves one twelfth into the fund at the start of each month, the rest waiting in
// savings: inside the TFSA (interest tax-free) or outside it (interest taxed at the entered rate). Paycheque money
// arrives in twelve equal parts at the start of each month: invested on arrival, or saved outside the TFSA and
// deposited the next 1 January. Returns are smooth; the heatmap varies the two half-year fund returns.
const monthly=a=>Math.pow(1+a,1/12)-1;
export function stagedYearEnd(A,fundMonthly,cashMonthly){
  let fund=0,cash=A;
  for(let k=0;k<12;k++){fund+=A/12;cash-=A/12;fund*=1+fundMonthly(k);cash*=1+cashMonthly;}
  return fund+cash;
}
export function tfsaPaydayPlan(input,overrides={}){
  const i={...input,...overrides},A=i.tpAmount,r=monthly(i.tpReturn/100),cIn=monthly(i.tpCash/100),cOut=monthly(i.tpCash/100*(1-i.tpTax/100));
  const front=[],stIn=[],stOut=[];
  let f=A,sIn={fund:0,cash:A},sOut={fund:0,cash:A};
  for(let m=0;m<=12;m++){
    front.push({x:m,value:f});stIn.push({x:m,value:sIn.fund+sIn.cash});stOut.push({x:m,value:sOut.fund+sOut.cash});
    if(m===12)break;
    for(const [s,c] of [[sIn,cIn],[sOut,cOut]]){s.fund+=A/12;s.cash-=A/12;s.fund*=1+r;s.cash*=1+c;}
    f*=1+r;
  }
  // Paycheque money over the repeated years: invested each payday, or saved outside and deposited each 1 January.
  const n=i.tpYears,pay=[],save=[];let fundP=0,fundS=0,cashS=0;
  for(let m=0;m<=12*n;m++){
    if(m%12===0&&m>0){fundS+=cashS;cashS=0;}
    if(m%12===0)pay.push({x:m/12,value:fundP}),save.push({x:m/12,value:fundS+cashS,fund:fundS});
    if(m===12*n)break;
    fundP+=A/12;cashS+=A/12;fundP*=1+r;fundS*=1+r;cashS*=1+cOut;
  }
  return {front,stIn,stOut,frontEnd:front.at(-1).value,stInEnd:stIn.at(-1).value,stOutEnd:stOut.at(-1).value,pay,save,payEnd:pay.at(-1).value,saveEnd:save.at(-1).value};
}
// January deposit minus staging inside the TFSA at year-end, for given first-half and second-half fund returns.
export function frontMinusStaged(input,firstHalf,secondHalf){
  const A=input.tpAmount,cIn=monthly(input.tpCash/100),h1=Math.pow(1+firstHalf,1/6)-1,h2=Math.pow(1+secondHalf,1/6)-1;
  const rm=k=>k<6?h1:h2,front=A*(1+firstHalf)*(1+secondHalf);
  return front-stagedYearEnd(A,rm,cIn);
}

export function giftPaydayResult(kind,input){
  if(kind==='donateKind'){
    const p=donateKindPlan(input),d=donationCreditRates,V=input.dkValue,e=p.end,n=input.dkYears;
    const shares=[0,20,40,60,80,100],rates=[20,30,40,50];
    return {metrics:[['Capital gain inside the units',p.gain,'money'],['Donation credit, either route',p.credit,'money'],['Tax on the gain if sold first',p.taxNow,'money'],['After-credit cost of giving the units',p.inKindCost,'money'],['After-credit cost of selling first',p.sellFirstCost,'money'],[`Keeping the fund: after-tax edge in year ${n}`,e.rebuy-e.keep,'money']],
    note:`Units worth ${money(V)} with a ${money(input.dkCost)} cost base are given to a registered charity. Either route earns the same official receipt for ${money(V)} and a ${input.dkCredit}% credit, ${money(p.credit)}. Selling first makes half of the ${money(Math.max(0,p.gain))} gain taxable at ${input.dkRate}%; giving the units directly can qualify for a zero inclusion rate. The credit rate assumes your first CAD 200 of gifts this year is already claimed and that total gifts stay within 75% of net income. The fund return of ${input.dkGrowth}% is a hypothetical input, not a forecast; this is not a personal tax calculation.`,
    charts:[
      {id:'donate-kind-credit-rates',type:'bar',evidence:'Official tax rates',title:`Federal plus provincial credit rate on gifts above CAD 200, ${d.taxYear} tax year`,unit:'percent',unitLabel:'Combined non-refundable credit rate · before top-bracket rates',rows:d.provinces.map(([name,rate])=>({label:name,value:(d.federal+rate)/100})).sort((a,b)=>b.value-a.value),source:'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-34900-donations-gifts/how-much-claim.html',sourceLabel:'Canada Revenue Agency · Line 34900, how much you can claim',note:`CRA lists the ${d.taxYear} rates: federal ${d.federal}% on gifts above the first CAD 200 (33% on the part paid from income in the top federal bracket), plus each province’s rate above CAD 200. British Columbia also lists 20.5% for donors with income in its top bracket. Quebec’s credit is administered by Revenu Québec and is not shown. The rate is the same whichever route the gift takes.`},
      {id:'donate-kind-routes',type:'stackbar',title:`Where a ${money(V)} gift comes from under each route`,unit:'money',rowLabel:'Route',seriesNames:['Your net cost after the credit','Paid back to you through the donation credit','Tax on the capital gain, selling first only'],rows:[{label:'Give the fund units directly',values:[p.inKindCost,p.credit,0]},{label:'Sell the units, then give the cash',values:[p.inKindCost,p.credit,p.taxNow]}],note:`The charity receives ${money(V)} either way. Selling first adds ${money(p.taxNow)} of tax on the gain, so your total outlay for the same gift is ${money(p.sellFirstCost)} instead of ${money(p.inKindCost)}. With units below their cost base there is no gain and the two bars are the same height.`},
      {id:'donate-kind-keep-fund',type:'line',title:'If you also want to keep the fund: after-tax value if sold at each year-end',unit:'money',xLabel:'Years after the gift',series:[{name:'Give the units, rebuy the fund with your cash',rows:p.rows.map(r=>({x:r.x,value:r.rebuy}))},{name:'Give your cash, keep the old units',dash:true,rows:p.rows.map(r=>({x:r.x,value:r.keep}))},{name:'Sell the units, give the proceeds, rebuy with your cash',rows:p.rows.map(r=>({x:r.x,value:r.sellRebuy}))}],note:`All three routes give ${money(V)} and leave you holding ${money(V)} of the same fund. Giving the units and rebuying resets the cost base to ${money(V)}, so ${money(Math.max(0,p.gain))} of gain that would otherwise be taxed later is never taxed: the edge over keeping the old units is ${money(e.rebuy-e.keep)} whenever the units are sold at or above today’s value. Selling first pays ${money(p.taxNow)} now and loses its growth. Rebuying a fund at a gain does not trigger the superficial-loss rule, which applies only to losses.`},
      {id:'donate-kind-grid',type:'heatmap',title:`Tax saved by giving the units instead of selling first, on a ${money(V)} gift`,unit:'money',rowLabel:'Cost base as a share of market value',columns:rates.map(r=>`${r}% marginal rate`),rows:shares.map(s=>({label:`${s}% of value`,values:rates.map(r=>donateKindPlan(input,{dkCost:V*s/100,dkRate:r}).saving)})),note:`Each cell keeps the ${money(V)} gift and changes only the cost base and the marginal rate. Units bought long ago, or reinvested distributions that are a small part of the holding, have a low cost base and the largest gain to exempt. Units bought recently, near the current price, have little gain, and the routes are almost equal.`}
    ]};
  }
  if(kind==='tfsaPayday'){
    const p=tfsaPaydayPlan(input),A=input.tpAmount,L=tfsaDollarLimits,years=Object.keys(L).map(Number);
    const halves=[-20,-10,0,10,20],months=['Jan 1','Feb 1','Mar 1','Apr 1','May 1','Jun 1','Jul 1','Aug 1','Sep 1','Oct 1','Nov 1','Dec 1','Dec 31'];
    let cum=0;const cumulative=years.map(y=>(cum+=L[y]));
    return {metrics:[['Value on 31 December · deposited and invested on 1 January',p.frontEnd,'money'],['Value on 31 December · deposited in January, invested monthly inside the TFSA',p.stInEnd,'money'],['Value on 31 December · invested monthly, cash waiting outside the TFSA',p.stOutEnd,'money'],[`Paycheque money after ${input.tpYears} years · invested each payday`,p.payEnd,'money'],[`Paycheque money after ${input.tpYears} years · saved and deposited each January`,p.saveEnd,'money'],['Cost of waiting for January with paycheque money',p.payEnd-p.saveEnd,'money']],
    note:`${money(A)} of TFSA room is used each year. The fund returns ${input.tpReturn}% a year and money waiting in savings earns ${input.tpCash}%, taxed at ${input.tpTax}% when held outside the TFSA and tax-free inside it. Returns are smooth and hypothetical; real fund returns vary month to month and can be negative for long periods. Fees are assumed to be inside the fund return. The TFSA dollar limits are CRA figures; available room also depends on past contributions and withdrawals.`,
    charts:[
      {id:'tfsa-payday-limits',type:'bar',evidence:'Official limits',title:'TFSA dollar limit by year, 2009 to 2026',unit:'money',unitLabel:'Annual TFSA dollar limit, CAD · new room each 1 January',rows:years.map(y=>({label:String(y),value:L[y]})),source:'https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html',sourceLabel:'Canada Revenue Agency · TFSA dollar limits',note:`CRA lists the limits through 2026 (page dated 1 December 2025); no 2027 limit was listed when this page was reviewed. A resident who was 18 or older in 2009 and never contributed would have ${money(cumulative.at(-1))} of room in 2026. The year’s new room is available from 1 January, and unused room carries forward, so a January deposit and twelve monthly deposits use the same room.`},
      {id:'tfsa-payday-one-year',type:'line',title:`Money you already have: ${money(A)} through one year, three ways`,unit:'money',xLabel:'Start of month',xTicks:[0,3,6,9,12].map(k=>({value:k,label:months[k]})),series:[{name:'Deposit and invest on 1 January',rows:p.front},{name:'Deposit in January, move one twelfth into the fund each month',rows:p.stIn},{name:'Invest one twelfth a month, the rest waiting outside the TFSA',dash:true,rows:p.stOut}],note:`With a positive expected return above the savings rate, investing on 1 January ends ahead on average: ${money(p.frontEnd)} against ${money(p.stInEnd)} when the waiting cash sits inside the TFSA and ${money(p.stOutEnd)} when it sits outside and its interest is taxed. The pace of investing and the account it waits in are separate choices.`},
      {id:'tfsa-payday-halves',type:'heatmap',title:`Money you already have: 1 January investing minus monthly staging inside the TFSA, ${money(A)}`,unit:'money',rowLabel:'Fund return, January to June',columns:halves.map(h=>`${h>0?'+':''}${h}% July to December`),rows:halves.map(a=>({label:`${a>0?'+':''}${a}%`,values:halves.map(b=>frontMinusStaged(input,a/100,b/100))})),note:`Positive cells favour investing in January; negative cells favour staging. Staging wins when the fund falls early in the year, because later instalments buy at lower prices, and loses in years that rise steadily. Each cell keeps the ${input.tpCash}% tax-free savings rate on cash waiting inside the TFSA. Which row a future year falls in is not known in advance.`},
      {id:'tfsa-payday-paycheque',type:'line',title:`Paycheque money: investing each payday or saving up for each January deposit`,unit:'money',xLabel:'Years from the first paycheque',series:[{name:'Invested each payday',rows:p.pay},{name:'Saved outside the TFSA, deposited each 1 January',dash:true,rows:p.save}],note:`When the money only arrives as you earn it, waiting for January means each instalment sits in a taxable savings account for 6.5 months on average before reaching the fund. After ${input.tpYears} years the gap is ${money(p.payEnd-p.saveEnd)}, with ${money(input.tpAmount*input.tpYears)} contributed in both cases. The final year’s savings are counted once they are deposited on the following 1 January.`}
    ]};
  }
  throw Error('Unknown gift-payday topic');
}
