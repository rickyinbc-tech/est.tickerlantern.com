import { tfsaExcessRules } from './planning-tfsa-excess-models.js';

export const tfsaStageDefinitions={
  tfsaStageLump:{title:'Move a lump sum larger than your TFSA room into the TFSA each January, and price the tax on the part still waiting',fields:[
    ['ltsLump','Lump sum to invest today (CAD)',120000,1000,2000000,1000],
    ['ltsRoom','TFSA room available today (CAD)',45000,0,200000,500],
    ['ltsNew','New TFSA room each January (CAD)',7000,0,20000,500],
    ['ltsPay','Room used each year by saving from pay (CAD)',0,0,20000,500],
    ['ltsReturn','Fund return a year, including distributions (%)',5,0,12,.25],
    ['ltsDist','Part of the return paid out as taxable distributions (% of value a year)',2,0,6,.25],
    ['ltsDistTax','Tax rate on those distributions (%)',30,0,55,1],
    ['ltsMarg','Marginal tax rate on ordinary income (%)',40,0,55,1],
    ['ltsYears','Years invested',20,1,40,1]
  ]}
};
export const tfsaStageWholeKeys=['ltsYears'];

// CRA TFSA dollar limits 2009 to 2026 (shared with the over-contribution guide). Room accrues from the year a resident
// turns 18, or from 2009 for anyone 18 or older that year, and unused room carries forward.
export const tfsaLimits=Object.fromEntries(tfsaExcessRules.limits);
export function roomByStartYear(last=2026){
  const rows=[];
  for(let y=2009;y<=last;y++){let s=0;for(let k=y;k<=last;k++)s+=tfsaLimits[k];rows.push({year:y,room:s});}
  return rows;
}

const money=n=>n.toLocaleString('en-CA',{style:'currency',currency:'CAD',maximumFractionDigits:0});
const pct=(v,d=1)=>`${(v*100).toFixed(d)}%`;

// Sell units worth `amount` of tax-free proceeds plus the tax on the gain the sale itself realizes. With a gain share q
// of value and c tax per dollar of gain, a sale of S leaves S(1-qc), so S = amount/(1-qc). Units are sold in
// proportion, so the adjusted cost base falls by the same fraction as the value.
function sell(acct,proceeds,c){
  if(acct.v<=0)return {sold:0,tax:0};
  const q=Math.max(0,1-acct.b/acct.v),sold=Math.min(acct.v,proceeds/(1-q*c)),tax=sold*q*c;
  acct.b-=acct.b*sold/acct.v;acct.v-=sold;if(acct.v<1e-9){acct.v=0;acct.b=0;}
  return {sold,tax};
}

// Yearly model. In January of year 1 the lump sum fills the room available today and the rest is invested in the same
// fund in a non-registered account (cost base = amount invested). From year 2, each January the new room left after
// saving from pay is filled by moving units in kind; CRA treats the move as a disposition at fair market value, so the
// gain on the units moved is taxed (half included at the marginal rate) and that tax is paid by selling further units.
// During each year both accounts earn the return. The distributed part of it is reinvested (raising the cost base)
// and taxed at the distribution rate; that tax is also paid by selling units at year-end. At the end the
// non-registered account is valued after the tax that selling it would trigger.
export function stagePlan(input,{stage=true}={}){
  const r=input.ltsReturn/100,d=input.ltsDist/100,td=input.ltsDistTax/100,c=input.ltsMarg/200,n=input.ltsYears;
  const yearly=Math.max(0,input.ltsNew-input.ltsPay);
  let t=Math.min(input.ltsRoom,input.ltsLump),moved=t,taxMove=0,taxDist=0,full=t>=input.ltsLump?1:null;
  const nr={v:input.ltsLump-t,b:input.ltsLump-t};
  const rows=[];
  for(let k=1;k<=n;k++){
    let mv=0,mt=0;
    if(k>1&&stage&&nr.v>0&&yearly>0){
      const s=sell(nr,yearly,c);mv=s.sold-s.tax;mt=s.tax;t+=mv;moved+=mv;taxMove+=mt;
      if(nr.v===0&&full==null)full=k;
    }
    const start=nr.v,dist=start*d,owed=dist*td;
    t*=1+r;nr.v=start*(1+r);nr.b+=dist;
    const paid=owed>0?sell(nr,owed,c):{sold:0,tax:0};
    taxDist+=paid.sold;
    rows.push({x:k,tfsa:t,nonreg:nr.v,moved:mv,taxMove:mt,taxDist:paid.sold});
  }
  const gain=Math.max(0,nr.v-nr.b),afterTax=t+nr.v-gain*c;
  return {rows,tfsa:t,nonreg:nr.v,cost:nr.b,afterTax,taxMove,taxDist,moved,full};
}

export function tfsaStageResult(kind,input){
  if(kind!=='tfsaStageLump')throw Error('Unknown TFSA staging topic');
  const n=input.ltsYears,r=input.ltsReturn/100,yrs=`${n} year${n===1?'':'s'}`;
  const staged=stagePlan(input),today=stagePlan(input,{stage:false}),whole=input.ltsLump*(1+r)**n;
  const gap=staged.afterTax-today.afterTax,yearly=Math.max(0,input.ltsNew-input.ltsPay);
  const roomRows=roomByStartYear();
  const fullText=staged.full==null?`After ${yrs} ${money(staged.nonreg)} is still outside the TFSA: the room arriving each January${yearly?` (${money(yearly)} left after saving from pay)`:''} does not keep up with the growth of the part still waiting.`:staged.full===1?'Today’s room already holds the whole lump sum, so nothing has to wait outside.':`The last of the lump sum moves in during year ${staged.full}.`;
  const dists=[0,1,2,3,4],spans=[5,10,15,20,25,30];
  const grid=dists.map(x=>({label:`${x}% distributed`,values:spans.map(s=>{const i={...input,ltsDist:Math.min(x,input.ltsReturn),ltsYears:s};return stagePlan(i).afterTax-stagePlan(i,{stage:false}).afterTax;})}));
  return {metrics:[
    ['Year the whole lump sum is inside the TFSA (Unavailable if later than the years invested)',staged.full??null,'integer'],
    [`After-tax value after ${yrs} · moved in each January`,staged.afterTax,'money'],
    [`After-tax value after ${yrs} · only today’s room used`,today.afterTax,'money'],
    ['Difference from moving in each January',gap,'money'],
    ['Tax on gains realized by the moves',staged.taxMove,'money'],
    ['Whole lump sum tax-free from day one (reference only)',whole,'money']
  ],
  note:`${money(input.ltsLump)} invested in one fund returning ${input.ltsReturn}% a year, ${input.ltsDist}% of value paid out as distributions taxed at ${input.ltsDistTax}%. ${money(Math.min(input.ltsRoom,input.ltsLump))} goes into the TFSA today and the rest into a non-registered account. ${fullText} After ${yrs} the plan is worth ${money(staged.afterTax)} after tax, against ${money(today.afterTax)} if only today’s room is used. Returns are smooth and hypothetical; no fund or future TFSA limit is predicted.`,
  charts:[
    {id:'tfsa-stage-room',type:'bar',evidence:'Official limits',title:'TFSA room available in 2026 with no contributions yet, by the year room started',unit:'money',unitLabel:'Cumulative TFSA dollar limits to 2026, CAD',rows:roomRows.map(r=>({label:r.year===2009?'2009 or earlier':String(r.year),value:r.room})),source:'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/contributing/calculate-room.html',sourceLabel:'Canada Revenue Agency · Calculate your TFSA contribution room',note:`Room builds from the year you turn 18 (or from 2009, when TFSAs began) and unused room carries forward. Someone who has been eligible since 2009 and has never contributed has ${money(roomRows[0].room)} of room in 2026; someone who turned 18 in 2020 has ${money(roomRows.find(r=>r.year===2020).room)}. Past withdrawals add room back the following January and past contributions use it, so your own figure can differ: check it in CRA My Account and your own records before moving money. The 2027 limit had not been announced when this was reviewed.`},
    {id:'tfsa-stage-where',type:'stackbar',title:`Where the lump sum sits each year when it is moved in each January`,unit:'money',seriesNames:['Inside the TFSA','Still in the non-registered account'],rows:staged.rows.map(r=>({label:`Year ${r.x}`,values:[r.tfsa,r.nonreg]})),note:`Values at each year-end, before the tax that selling the non-registered part would trigger. ${fullText}${yearly===0?' With no new room left for the lump sum, the bars show only growth.':''}`},
    {id:'tfsa-stage-tax',type:'stackbar',title:'Tax paid each year on the part still outside the TFSA',unit:'money',seriesNames:['Tax on the gain in units moved in January','Tax on distributions (and on the units sold to pay it)'],rows:staged.rows.map(r=>({label:`Year ${r.x}`,values:[r.taxMove,r.taxDist]})),note:`Over ${yrs} the moves realize gains taxed at ${money(staged.taxMove)} and distributions cost ${money(staged.taxDist)} in tax. Using only today’s room, distribution tax would total ${money(today.taxDist)} and the deferred gain would be taxed when the account is finally sold. The tax on moving units is not an extra cost of the TFSA: it is tax on a gain that already exists, paid earlier than it otherwise would be, and afterwards that money grows without tax.`},
    {id:'tfsa-stage-grid',type:'heatmap',signed:true,title:'After-tax gain from moving the lump sum in each January rather than using only today’s room',unit:'money',rowLabel:'Distributions',columns:spans.map(s=>`${s} years`),rows:grid,note:`Each cell repeats the calculation with the other inputs unchanged. The advantage grows with time and with the share of the return paid out as taxable distributions, because those are taxed every year outside the TFSA. With little paid out it is smaller but still positive here: gains taxed now and then sheltered beat gains deferred and taxed at the end, as long as the fund keeps a positive return.`}
  ]};
}
