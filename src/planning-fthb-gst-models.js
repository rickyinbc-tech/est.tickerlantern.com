const issue=i=>{
  if(i.fgDown>i.fgPrice+fthbGstNet(i,i.fgPrice))return {message:'The down payment is larger than the price plus the GST still payable. Lower the down payment or raise the price.',fields:['fgDown','fgPrice']};
  return null;
};
export const fthbGstDefinitions={
  fthbGst:{title:'Price the first-time home buyers’ GST rebate on a new home: the rebate, the GST still payable, and what an upgrade costs inside the CAD 1 million to 1.5 million phase-out',inputIssue:issue,fields:[
    ['fgPrice','Purchase price of the new home from the builder, before GST or HST (CAD)',1100000,0,2500000,5000],
    ['fgExtra','Upgrades, a larger unit or a price increase added to that price (CAD)',50000,0,500000,5000],
    ['fgYears','Years since you, or your spouse or common-law partner, last lived in a home either of you owned (0 = this year; 99 = never)',99,0,99,1],
    ['fgStatus','You are 18 or older and a Canadian citizen or permanent resident (1 = yes, 0 = no)',1,0,1,1],
    ['fgDown','Down payment (CAD)',220000,0,2500000,5000],
    ['fgRate','Mortgage interest rate, compounded half-yearly (%)',4.5,0,12,.05],
    ['fgAmort','Amortization (years)',30,5,30,1]
  ]}
};
export const fthbGstWholeKeys=['fgYears','fgStatus','fgAmort'];

// Excise Tax Act s. 254(2) and (2.1) (current to 2026-09-30), CRA guide RC4028 (25) and Form RC7190-WS (25), GST190
// Calculation Worksheet, Section 1 (lines 1 to 4) and Section 4 (lines 12 to 14):
// - New housing rebate (ETA s. 254(2)), house bought from a builder: 36% of the GST or federal part of the HST, maximum
//   CAD 6,300; full at a price of CAD 350,000 or less; × (450,000 − price) ÷ 100,000 between; nil at CAD 450,000 or more.
// - FTHB rebate (s. 254(2.1)): price ≤ CAD 1,000,000 → lesser of CAD 50,000 and the GST paid, less the new housing rebate;
//   between CAD 1,000,000 and 1,500,000 → lesser of CAD 50,000 and the GST × (1,500,000 − price) ÷ 500,000; nil at
//   CAD 1,500,000 or more. Price excludes GST/HST. Agreement after 19 March 2025 and before 2031; construction substantially
//   completed and ownership transferred before 2036. First-time buyer: 18 or older, citizen or permanent resident, and did
//   not occupy as a primary residence a home they (or their spouse or common-law partner) owned in the calendar year of
//   the transfer or the four before it. One claimant per home; not available to anyone who has received it before.
export const fthbGstRules={gst:.05,nhrRate:.36,nhrMax:6300,nhrFull:350000,nhrZero:450000,max:50000,full:1000000,zero:1500000,lookback:5};

// Office of the Parliamentary Budget Officer, Introducing GST rebates for first-time home buyers (RP-2526-001-S,
// 11 June 2025), Table 2: projected new home purchases by eligibility step, calendar years 2025 to 2030 (projection, not
// observation; the PBO assumed purchases after 26 May 2025, the bill's date at the time, rather than the enacted
// 20 March 2025). Rows: [label, 2025, 2026, 2027, 2028, 2029, 2030, total].
export const PBO_FTHB={url:'https://www.pbo-dpb.ca/en/publications/RP-2526-001-S--introducing-gst-rebates-first-time-home-buyers--remboursement-tps-acheteurs-une-premiere-habitation',
  steps:[
    ['Projected houses and apartments completed',236466,237324,241761,248638,256397,261820,1482406],
    ['Intended for the ownership, condo and co-op markets',142174,137956,136413,137943,140146,141252,835884],
    ['Bought as a primary residence by citizens and permanent residents',69388,67329,66576,67323,68397,68935,407948],
    ['Bought by first-time buyers',13802,13393,13243,13391,13605,13712,81146],
    ['Valued under CAD 1.5 million',13301,12903,12711,12756,12806,12776,77253],
    ['Bought after the effective date (rebate paid)',7759,12903,12711,12756,12806,12776,71711]
  ],cost:1.9e9,average:26832,share:.048};

const R=fthbGstRules;
export const fthbGstTax=p=>R.gst*Math.max(0,p);
export function fthbNewHousingRebate(p){
  const base=Math.min(R.nhrRate*fthbGstTax(p),R.nhrMax);
  if(p<=R.nhrFull)return base;
  return p>=R.nhrZero?0:base*(R.nhrZero-p)/(R.nhrZero-R.nhrFull);
}
// RC7190-WS line 14: the first-time buyers' amount before the new housing rebate is deducted.
export function fthbLine14(p){
  const cap=Math.min(R.max,fthbGstTax(p));
  if(p<=R.full)return cap;
  return p>=R.zero?0:cap*(R.zero-p)/(R.zero-R.full);
}
export const fthbEligible=i=>i.fgStatus===1&&i.fgYears>=R.lookback;
// Total federal relief: the new housing rebate, plus the FTHB rebate (line 14 less the new housing rebate) when eligible.
export function fthbRelief(p,eligible=true){
  const nhr=fthbNewHousingRebate(p);
  if(!eligible)return {nhr,fthb:0,total:nhr};
  const fthb=Math.max(0,fthbLine14(p)-nhr);
  return {nhr,fthb,total:nhr+fthb};
}
export const fthbGstNet=(i,p)=>fthbGstTax(p)-fthbRelief(p,fthbEligible(i)).total;
// Monthly payment for a Canadian fixed-rate mortgage (interest compounded half-yearly, not in advance).
export function fthbPayment(principal,ratePct,years){
  if(principal<=0)return 0;
  const n=12*years,r=Math.pow(1+ratePct/200,1/6)-1;
  return r===0?principal/n:principal*r/(1-Math.pow(1+r,-n));
}

export function fthbGstPlan(input,overrides={}){
  const i={...input,...overrides},eligible=fthbEligible(i),at=p=>{
    const gst=fthbGstTax(p),rel=fthbRelief(p,eligible),net=gst-rel.total,loan=Math.max(0,p+net-i.fgDown);
    return {price:p,gst,...rel,net,loan,payment:fthbPayment(loan,i.fgRate,i.fgAmort)};
  };
  const base=at(i.fgPrice),up=at(i.fgPrice+i.fgExtra),other=fthbRelief(i.fgPrice,false);
  return {eligible,base,up,extraNet:up.net-base.net,extraCost:i.fgExtra+up.net-base.net,extraPayment:up.payment-base.payment,
    notFirst:{relief:other.total,net:base.gst-other.total},advantage:base.total-other.total};
}

// Federal sales tax on the next dollar of price, by price (the slope of the net GST line).
export function fthbMarginal(p,eligible){
  const h=1,net=q=>fthbGstTax(q)-fthbRelief(q,eligible).total;
  return (net(p+h)-net(p))/h;
}

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const kTick=v=>v===0?'0':v>=1e6?(v/1e6).toLocaleString('en-CA',{maximumFractionDigits:2})+'M':(v/1e3)+'k';

export function fthbGstResult(kind,input){
  if(kind!=='fthbGst')throw Error('Unknown FTHB GST topic');
  const p=fthbGstPlan(input),b=p.base,e=p.eligible;
  const grid=[];for(let q=0;q<=1700000;q+=10000)grid.push(q);
  const bases=[800000,950000,1000000,1100000,1250000,1450000,1500000];
  const steps=PBO_FTHB.steps;
  const why=input.fgStatus!==1?'you are not 18 or older and a citizen or permanent resident':`you lived in a home you or your spouse owned ${input.fgYears===0?'this year':input.fgYears+' year'+(input.fgYears===1?'':'s')+' ago'}, inside the five-calendar-year look-back`;
  const note=e?(b.price>=R.zero?`At ${money(b.price)} the home is at or above CAD 1.5 million, so there is no first-time buyers’ rebate and no new housing rebate: the full ${money(b.gst)} of GST (or federal HST) is payable.`
    :`At ${money(b.price)} the GST or federal part of the HST is ${money(b.gst)}. As a first-time buyer you get back ${money(b.total)}${b.nhr>0?` (${money(b.nhr)} new housing rebate plus ${money(b.fthb)} first-time buyers’ rebate)`:''} and pay ${money(b.net)}. ${b.price>R.full?`Because the price is inside the CAD 1 million to 1.5 million phase-out, each extra dollar of price costs about 15 cents of federal tax, not 5: `:''}${input.fgExtra>0?`adding ${money(input.fgExtra)} raises the GST payable by ${money(p.extraNet)}, so the change costs ${money(p.extraCost)}${p.extraPayment>0?` and about ${money(p.extraPayment)} a month on the mortgage`:''}.`:''}`)
    :`You do not qualify for the first-time buyers’ rebate because ${why}. Only the new housing rebate applies: ${money(b.nhr)}, leaving ${money(b.net)} of GST payable on ${money(b.price)}.`;
  return {metrics:[
    ['GST or federal part of the HST on the price',b.gst,'money'],
    ['First-time home buyers’ rebate',b.fthb,'money'],
    ['New housing rebate',b.nhr,'money'],
    ['GST still payable after rebates',b.net,'money'],
    [`Extra GST payable on the added ${money(input.fgExtra)}`,p.extraNet,'money'],
    ['Extra monthly mortgage payment for the added price and GST',p.extraPayment,'money']
  ],note,charts:[
    {id:'fg-pbo-funnel',type:'bar',evidence:'Official projection',unit:'count',unitLabel:'New homes, 2026 (projected) · count',title:'How many of the new homes completed in 2026 the PBO expects to get the first-time buyers’ rebate',rows:steps.map(r=>({label:r[0],value:r[2]})),source:PBO_FTHB.url,sourceLabel:'Parliamentary Budget Officer · Introducing GST rebates for first-time home buyers, Table 2',note:`A projection made in June 2025, not a count of claims. Of ${steps[0][2].toLocaleString('en-CA')} homes projected to be completed in 2026, the PBO expects ${steps[5][2].toLocaleString('en-CA')} (${(steps[5][2]/steps[0][2]*100).toFixed(1)}%) to receive the rebate. The largest cuts are homes built for rent and homes not bought as a primary residence (investors, non-residents, temporary residents and corporations cannot claim), then the step to first-time buyers: about 20% of qualifying sales in the PBO’s Canadian Housing Statistics Program data for three provinces. Over 2025 to 2030 it projects ${steps[5][7].toLocaleString('en-CA')} rebates averaging ${money(PBO_FTHB.average)}, costing about CAD 1.9 billion. The PBO assumed agreements after 26 May 2025; the law as enacted reaches back to 20 March 2025.`},
    {id:'fg-levels',type:'line',evidence:'Rules applied to hypothetical prices',unit:'money',title:'Federal GST (or federal part of the HST), the rebates and the tax still payable, by price of the new home',xLabel:'Purchase price before tax (CAD)',xTicks:[0,500000,1000000,1500000].map(v=>({value:v,label:kTick(v)})),series:[
      {name:'GST at 5% of the price',dash:true,rows:grid.map(q=>({x:q,value:fthbGstTax(q)}))},
      {name:'Rebates for a first-time buyer',rows:grid.map(q=>({x:q,value:fthbRelief(q,true).total}))},
      {name:'Rebate for any other buyer (new housing rebate)',rows:grid.map(q=>({x:q,value:fthbRelief(q,false).total}))},
      {name:'GST still payable by a first-time buyer',rows:grid.map(q=>({x:q,value:fthbGstTax(q)-fthbRelief(q,true).total}))}],
      note:`Up to CAD 1 million a first-time buyer pays no federal GST: the two rebates together return all of it, and CAD 50,000 is the most. From CAD 1 million the rebate falls in a straight line to nil at CAD 1.5 million, while the tax keeps rising, so the GST payable climbs from CAD 0 to CAD 75,000 over that CAD 500,000. Any other buyer of a home they will live in gets at most CAD 6,300, and nothing at CAD 450,000 or more. ${e?`Your price, ${money(b.price)}: rebates ${money(b.total)}, GST payable ${money(b.net)}.`:`With your inputs you are not a first-time buyer, so the lower line applies: ${money(b.total)}.`}`},
    {id:'fg-marginal',type:'line',evidence:'Rules applied to hypothetical prices',unit:'percent',title:'Federal sales tax on the next dollar of price: first-time buyer and other buyers',xLabel:'Purchase price before tax (CAD)',xTicks:[0,500000,1000000,1500000].map(v=>({value:v,label:kTick(v)})),series:[
      {name:'First-time buyer',rows:grid.map(q=>({x:q,value:fthbMarginal(q,true)}))},
      {name:'Other buyer living in the home',rows:grid.map(q=>({x:q,value:fthbMarginal(q,false)}))},
      {name:'Statutory GST rate',dash:true,rows:grid.map(q=>({x:q,value:R.gst}))}],
      note:'The slope of the GST still payable. Inside the phase-out, each extra dollar of price adds 5 cents of tax and removes 10 cents of rebate (CAD 50,000 over CAD 500,000), so the first-time buyer’s marginal rate is 15% between CAD 1 million and 1.5 million, three times the statutory 5%. Other buyers face 3.2% below CAD 350,000 (5% less the 36% rebate) and 11.3% between CAD 350,000 and 450,000 (5% plus CAD 6,300 lost over CAD 100,000). Above the top of each band, the rate returns to 5%. Upgrades, a bigger unit and price escalations are all taxed at these rates.'},
    {id:'fg-upgrade',type:'groupbar',evidence:'Rules applied to hypothetical prices',unit:'money',title:`What adding ${money(input.fgExtra)} to the price costs a first-time buyer, by starting price`,seriesNames:['Price added','GST added after rebates'],rowLabel:'Starting price before tax',rows:[...bases.map(q=>[money(q),q]),[`Your price, ${money(input.fgPrice)}`,input.fgPrice]].map(([label,q])=>{const n=x=>fthbGstTax(x)-fthbRelief(x,true).total;return {label,values:[input.fgExtra,n(q+input.fgExtra)-n(q)]};}),note:`Each pair is the same ${money(input.fgExtra)} added at a different starting price, for a buyer who qualifies. Below CAD 1 million the addition costs no GST if the total stays under CAD 1 million; once the total crosses it, each dollar above CAD 1 million carries 15 cents; from CAD 1.5 million it is back to 5 cents. The calculator treats upgrades bought from the builder as part of the price on the agreement, so a change order can cross a threshold; confirm the total consideration with the builder. Work bought from someone else after closing is a separate purchase. ${e?'':'You are not a first-time buyer with your inputs; this chart shows the rule for someone who is.'}`}
  ]};
}
