// All monetary operating inputs are CAD million; shares are million.
export function operatingYear({revenue,expenses,insurance=0,pcl,taxRate,nonCommon,shares,afterTaxCharge=0}) {
  if (![revenue,expenses,insurance,pcl,taxRate,nonCommon,shares,afterTaxCharge].every(Number.isFinite) || shares<=0 || taxRate<0 || taxRate>=1) throw Error('Invalid operating inputs');
  const pretax=revenue-expenses-insurance-pcl;
  const tax=pretax*taxRate;
  const net=pretax-tax-afterTaxCharge;
  const common=net-nonCommon;
  return {revenue,expenses,insurance,pcl,taxRate,nonCommon,shares,afterTaxCharge,pretax,tax,net,common,eps:common/shares,efficiency:expenses/revenue};
}
export function forecast(bank) {
  const q=operatingYear(bank.q4);
  const y=bank.ytd;
  const first={year:2026,revenue:y.revenue+q.revenue,expenses:y.expenses+q.expenses,insurance:(y.insurance||0)+q.insurance,pcl:y.pcl+q.pcl,pretax:y.pretax+q.pretax,tax:y.tax+q.tax,net:y.net+q.net,common:y.common+q.common,nonCommon:y.net-y.common+q.nonCommon,shares:(y.shares*3+q.shares)/4,afterTaxCharge:q.afterTaxCharge};
  first.eps=first.common/first.shares; first.efficiency=first.expenses/first.revenue; first.taxRate=first.tax/first.pretax;
  const rows=[first];
  for(const a of bank.forecast) {
    const prev=rows.at(-1);
    rows.push({year:a.year,...operatingYear({revenue:prev.revenue*(1+a.revenueGrowth),expenses:prev.expenses*(1+a.expenseGrowth),insurance:prev.insurance*(1+(a.insuranceGrowth||0)),pcl:a.pcl,taxRate:a.taxRate,nonCommon:a.nonCommon,shares:a.shares,afterTaxCharge:a.afterTaxCharge||0})});
  }
  return rows;
}
export function totalReturn(price,eps,pe,dividend){if(![price,eps,pe,dividend].every(Number.isFinite)||price<=0||eps<0||pe<=0||dividend<0)throw Error('Invalid valuation inputs');const value=eps*pe;return {value,priceReturn:value/price-1,totalReturn:(value+dividend)/price-1};}
export function cases(bank){const base=forecast(bank)[1];return bank.cases.map(c=>{const op=operatingYear({...base,revenue:base.revenue*(1+c.revenueChange),expenses:base.expenses*(1+c.expenseChange),pcl:c.pcl,afterTaxCharge:c.afterTaxCharge||0});return {...c,...op,...totalReturn(bank.market.price,op.eps,c.pe,bank.dividend*4)};});}
export function justifiedBook(roe,cost,growth){if(![roe,cost,growth].every(Number.isFinite)||cost<=growth||roe<growth||growth<0)throw Error('Require cost of equity > growth and ROE ≥ growth');return {pb:(roe-growth)/(cost-growth),payout:1-growth/roe};}
export function stress(bank,{revenueChange=0,expenseChange=0,extraPclBps=0}={}){const b=forecast(bank)[1];return operatingYear({...b,revenue:b.revenue*(1+revenueChange),expenses:b.expenses*(1+expenseChange),pcl:b.pcl+bank.loanProxy*extraPclBps/10000});}
export function fiveYear({price,eps,growth,exitPE,dividend,dividendGrowth}) {
  if(![price,eps,growth,exitPE,dividend,dividendGrowth].every(Number.isFinite)||price<=0||eps<=0||growth<=-1||exitPE<=0||dividend<0||dividendGrowth<=-1)throw Error('Invalid five-year inputs');
  let cumulative=0;const rows=[];
  for(let y=1;y<=5;y++){const earnings=eps*(1+growth)**y;const cash=dividend*(1+dividendGrowth)**(y-1);cumulative+=cash;rows.push({year:y,eps:earnings,dividend:cash,cumulative,price:earnings*exitPE});}
  const last=rows.at(-1);const final=last.price+cumulative;
  let lo=-.999999,hi=1;const npv=r=>-price+rows.reduce((s,x)=>s+(x.dividend+(x.year===5?x.price:0))/(1+r)**x.year,0);while(npv(hi)>0&&hi<1e6)hi*=2;for(let i=0;i<160;i++){const mid=(lo+hi)/2;if(npv(mid)>0)lo=mid;else hi=mid;}
  return {rows,final,wealthCAGR:(final/price)**.2-1,cashIRR:(lo+hi)/2,priceCAGR:(last.price/price)**.2-1};
}
