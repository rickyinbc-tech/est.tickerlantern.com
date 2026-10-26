import {evidence,derive,history,median,sources,defaults,calculate,scenarioReturn} from './rbc-model.js';
import {seniorPreset,seniorDate} from './rbc-senior-model.js';
import {initializeReturnRegression} from './rbc-return-ui.js';
const $=s=>document.querySelector(s);
const f=(n,d=2)=>Number(n).toLocaleString('en-CA',{minimumFractionDigits:d,maximumFractionDigits:d});
const money=n=>'C$'+f(n),pct=n=>(n>=0?'+':'')+f(n*100)+'%';
const ZH=document.documentElement.lang==='zh-Hans';
const t=(en,zh)=>ZH?zh:en;
const ERROR_ZH={
  'Complete every assumption with a finite number.':'请为每项假设填写有限数值。',
  'An assumption is outside the supported calculation range.':'某项假设超出支持的计算范围。',
  'Use positive price, EPS, book and P/E; non-negative dividends, ROE and growth; and a hurdle above −100%.':'请使用正数的价格、每股收益、账面价值和市盈率；股息、ROE 和增长率不得为负；门槛回报率须高于 −100%。',
  'The required equity return must exceed perpetual growth.':'要求的股权回报率必须高于永续增长率。',
  'Sustainable ROE must cover growth in this retained-earnings model.':'在此留存收益模型中，可持续 ROE 必须覆盖增长率。',
  'These assumptions produce a result outside the supported numerical range.':'这些假设产生的结果超出支持的数值范围。'
};
const errorText=value=>ZH?(ERROR_ZH[value]||value):value;
let lastCalculation=null;
let assumptionBasis=t('Original provider-estimate case: FY2028 exit EPS19.96; reset restores these assumptions.','原始机构估算情景：2028 财年期末每股收益 19.96 加元；重置后恢复这些假设。');
function renderModel(){
  const values=Object.fromEntries(new FormData($('#valuation-form')));
  const r=calculate(values),error=$('#model-error');
  error.hidden=!r.error;error.textContent=errorText(r.error)||'';
  $('#download-model').disabled=Boolean(r.error);lastCalculation=r.error?null:r;
  if(r.error){$('#model-result').textContent=t('Calculation unavailable until assumptions are corrected.','在修正假设之前无法计算。');$('#return-matrix').replaceChildren();$('#live-audit').replaceChildren();return;}
  const v=r.inputs;
  const reading=ZH
    ?`<p class="model-reading">在 ${f(v.hurdle,1)}% 的一年期门槛回报率下，所需期末价格为 <b>${money(r.requiredExitPrice)}</b>，对应每股收益 <b>${money(r.requiredEPSAt14)}（按 14× 计算）</b>。稳态假设隐含 <b>${f(r.justifiedPB)}× 账面价值</b>（模型交叉核对：每股 ${money(r.stableBookValue)}）。按当前市净率推算，在输入的增长率和要求回报率下，可持续 ROE 为 <b>${f(r.impliedRoe,1)}%</b>。</p>`
    :`<p class="model-reading">At a ${f(v.hurdle,1)}% one-year hurdle, the required exit price is <b>${money(r.requiredExitPrice)}</b>, requiring <b>${money(r.requiredEPSAt14)} EPS at 14×</b>. The steady-state assumptions imply <b>${f(r.justifiedPB)}× book</b> (${money(r.stableBookValue)} per share as a model cross-check). Today’s P/B implies <b>${f(r.impliedRoe,1)}% sustainable ROE</b> at the entered growth and required return.</p>`;
  const labels=ZH
    ?[['当前远期市盈率',f(r.forwardPE)+'×'],['当前普通股市净率',f(r.pb)+'×'],['示例期末价格',money(r.exitPrice)],['一年期总回报',pct(r.totalReturn)]]
    :[['Current forward P/E',f(r.forwardPE)+'×'],['Current common P/B',f(r.pb)+'×'],['Illustrative exit price',money(r.exitPrice)],['One-year total return',pct(r.totalReturn)]];
  $('#model-result').innerHTML=`<div class="model-output">${labels.map(([k,x])=>`<div><span>${k}</span><strong>${x}</strong></div>`).join('')}</div>${reading}`;
  let matrix=`<div class="table-scroll" tabindex="0" role="region" aria-label="${t('One-year total-return sensitivity','一年期总回报敏感性')}"><table><caption>${t('Assumed dividends included; no probabilities, taxes or costs','已计入假设股息；未计入概率、税费或交易成本')}</caption><thead><tr><th scope="col">${t('Exit EPS / multiple','期末每股收益 / 倍数')}</th>`;
  for(let p=12;p<=18;p++)matrix+=`<th scope="col">${p}×</th>`;
  matrix+='</tr></thead><tbody>';
  for(const scale of [.8,.9,1,1.1]){const eps=v.exitEPS*scale;matrix+=`<tr${scale===1?' class="matrix-current"':''}><th scope="row">${money(eps)} (${f(scale*100,0)}%)</th>`;for(let p=12;p<=18;p++){const ret=scenarioReturn(v.price,eps,p,v.dividend).totalReturn;matrix+=`<td class="${ret>=0?'return-up':'return-down'}">${pct(ret)}</td>`;}matrix+='</tr>';}
  $('#return-matrix').innerHTML=matrix+'</tbody></table></div>';
  const pre=document.createElement('pre');pre.textContent=`Current forward P/E = ${v.price} / ${v.eps} = ${f(r.forwardPE,6)}×\nCurrent P/B = ${v.price} / ${v.book} = ${f(r.pb,6)}×\nExit price = ${v.exitEPS} × ${v.exitPE} = ${money(r.exitPrice)}\nPrice return = (${r.exitPrice} / ${v.price}) − 1 = ${pct(r.priceReturn)}\nTotal return = (${r.exitPrice} + ${v.dividend}) / ${v.price} − 1 = ${pct(r.totalReturn)}\nRequired exit = ${v.price} × (1 + ${v.hurdle}/100) − ${v.dividend}\n              = ${money(r.requiredExitPrice)}\nJustified P/B = (${v.roe} − ${v.growth}) / (${v.requiredReturn} − ${v.growth})\n              = ${f(r.justifiedPB,6)}×\nImplied ROE = ${v.growth}% + ${f(r.pb,6)} × (${v.requiredReturn}% − ${v.growth}%)\n            = ${f(r.impliedRoe,4)}%`;
  $('#live-audit').replaceChildren(pre);
}
$('#valuation-form').addEventListener('submit',event=>{event.preventDefault();renderModel();});
$('#valuation-form').addEventListener('input',()=>{assumptionBasis=t('Edited scenario assumptions;check every field and the earnings horizon.','已修改情景假设；请检查每个字段和盈利预测期限。');$('#model-basis').textContent=assumptionBasis;renderModel();});
$('#load-senior-case').addEventListener('click',()=>{for(const [key,value] of Object.entries(seniorPreset))$('#model-'+key).value=value;assumptionBasis=t('Senior base case: our FY2027 EPS18 at 15.5× in October 2027; steady-state 18.1% ROE, 9.5% required return and 5% growth.','高级基准情景：我们预测 2027 年 10 月 2027 财年每股收益 18 加元、15.5×；稳态 ROE 18.1%、要求回报率 9.5%、增长率 5%。');$('#model-basis').textContent=assumptionBasis;renderModel();});
// The reset event precedes the browser restoring default control values.
$('#valuation-form').addEventListener('reset',()=>setTimeout(()=>{assumptionBasis=t('Original provider-estimate case: FY2028 exit EPS19.96; reset restores these assumptions.','原始机构估算情景：2028 财年期末每股收益 19.96 加元；重置后恢复这些假设。');$('#model-basis').textContent=assumptionBasis;renderModel();},0));
$('#download-model').addEventListener('click',()=>{
  if(!lastCalculation)return;
  const data={title:t('TickerLantern RBC valuation scenario','TickerLantern 加拿大皇家银行估值情景'),researchDate:seniorDate,originalValuationDate:evidence.researchDate,priceDate:evidence.priceDate,currency:'CAD',assumptionBasis,horizon:t('Illustrative one-year exit around October 2027','示例：2027 年 10 月前后的一年期期末退出'),...lastCalculation,sourceDefaults:defaults,sourceDefaultsDescription:t('Original provider-estimate reset assumptions; actual calculation uses inputs and assumptionBasis','原始机构估算重置假设；实际计算使用输入值和假设依据'),sources,limitations:ZH?['按标注使用的机构估算或原始分析师假设；并非公司指引','未分配概率','未计入再投资、税费或交易成本','未来股息属于假设']:['Provider estimates or original analyst assumptions as labelled; not company guidance','No probabilities assigned','No reinvestment, taxes or trading costs','Future dividends are assumptions']};
  const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='tickerlantern-rbc-valuation-scenario.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
document.querySelectorAll('#print-note, [data-print]').forEach(button=>button.addEventListener('click',()=>window.print()));
let printDetails=[];
window.addEventListener('beforeprint',()=>{printDetails=[...document.querySelectorAll('details')].map(el=>({el,open:el.open}));printDetails.forEach(({el})=>el.open=true);});
window.addEventListener('afterprint',()=>printDetails.forEach(({el,open})=>el.open=open));

function renderHistory(metric='pe'){
  const current=derive(),now={pe:current.trailingPE,pb:current.pb,ps:current.ps}[metric];
  const label=(ZH?{pe:'报告市盈率',pb:'普通股市净率',ps:'市销率（报告营收）'}:{pe:'Reported P/E',pb:'Common P/B',ps:'P/reported revenue'})[metric];
  const values=[...history.map(x=>x[metric]),now],sampleMedian=median(history.map(x=>x[metric]));
  const max=Math.ceil(Math.max(...values)*1.15*2)/2,W=900,H=260,L=48,R=55,T=24,B=36;
  const x=i=>L+i*(W-L-R)/(values.length-1),y=v=>T+(max-v)/max*(H-T-B);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${t(label+', 2016 through 2025 fiscal year-ends plus current observation',label+'：2016 至 2025 财年末及当前观测值')}"><title>${ZH?`${label}：当前 ${f(now)} 倍；历史中位数 ${f(sampleMedian)} 倍`:`${label}: current ${f(now)} times; historical median ${f(sampleMedian)} times`}</title>`;
  for(let i=0;i<=4;i++){const v=max*i/4;svg+=`<path d="M${L} ${y(v)}H${W-R}" stroke="#d7e0e8"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" fill="#556779" font-size="10">${f(v,1)}×</text>`;}
  svg+=`<path d="M${L} ${y(sampleMedian)}H${W-R}" stroke="#396f9e" stroke-dasharray="5 5"/><text x="${L+6}" y="${y(sampleMedian)-6}" fill="#396f9e" font-size="10">${t('10-observation median','10 个观测值中位数')} ${f(sampleMedian)}×</text>`;
  svg+=`<path d="${values.map((v,i)=>(i?'L':'M')+x(i)+' '+y(v)).join(' ')}" stroke="#087f76" stroke-width="2" fill="none"/>`;
  values.forEach((v,i)=>{svg+=`<circle cx="${x(i)}" cy="${y(v)}" r="${i===10?5:3}" fill="${i===10?'#087f76':'#087f76'}"><title>${i===10?t('Current','当前'):history[i].year}: ${f(v)}×</title></circle><text x="${x(i)}" y="${H-12}" text-anchor="middle" fill="${i===10?'#087f76':'#556779'}" font-size="10">${i===10?t('Now','现在'):history[i].year}</text>`;});
  svg+=`<text x="${x(10)}" y="${y(now)-11}" text-anchor="middle" fill="#087f76" font-size="12">${f(now)}×</text></svg><p class="chart-caption">${ZH?`${label} · 财年末样本，并非时点交易信号。当前观测：10 月 16 日价格 / 最新报告财务数据。`:`${label} · fiscal year-end sample, not point-in-time trading signals. Current observation: October 16 price / latest reported financials.`}</p>`;
  $('#history-chart').innerHTML=svg;
  document.querySelectorAll('[data-chart]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chart===metric)));
}
document.querySelectorAll('[data-chart]').forEach(b=>b.addEventListener('click',()=>renderHistory(b.dataset.chart)));
if('IntersectionObserver' in window){
  const sections=[...document.querySelectorAll('.research-section')];
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)document.querySelectorAll('.article-nav a').forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});},{rootMargin:'-10% 0px -65% 0px'});sections.forEach(el=>observer.observe(el));
}
renderModel();renderHistory();
initializeReturnRegression();
