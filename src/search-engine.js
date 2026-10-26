// Same search implementation runs in the browser and in relevance tests.
// Concepts are editorial synonyms, not generated answers or financial advice.
export const concepts = [
  ['mortgage','mortgages','home loan','房貸','房贷','按揭','供樓','供楼','樓按','抵押贷款','房屋贷款','按揭贷款'],
  ['renewal','renew','renewing','續期','续期','續按','轉按','转按','续签','续约','续按'],
  ['retirement','retire','retiring','退休','退休金','養老','养老'],
  ['inflation','cpi','purchasing power','cost of living','物價','物价','通脹','通胀','通貨膨脹','通货膨胀','購買力','购买力','生活費','生活费'],
  ['debt','debts','borrowing','borrow','債務','债务','欠債','欠债','借錢','借钱','還債','还债','负债','借款','借贷'],
  ['credit card','credit-card','card payment','信用卡','卡數','卡数','卡債','卡债'],
  ['minimum payment','minimum payments','min pay','最低還款','最低还款','min payment','最低付款','最低缴款'],
  ['savings','saving','save','save money','儲錢','储钱','儲蓄','储蓄','存錢','存钱','存款'],
  ['compound','compounding','compound interest','複利','复利','息疊息','息叠息','利疊利'],
  ['emergency','emergency fund','buffer','rainy day','應急','应急','緊急','紧急','備用金','备用金','失業','失业'],
  ['cash flow','cash-flow','cashflow','現金流','现金流','周轉','周转','现金流量'],
  ['budget','budgeting','spending','開支','开支','預算','预算','使費','洗費','洗费'],
  ['down payment','saving for a home','save for a house','save for a home','saving for a house','首期','儲首期','储首期','首付款'],
  ['housing','house','home','home purchase','buying a home','買樓','买楼','置業','置业','買屋','买房','樓','楼','住房','房屋'],
  ['rent','renting','rental','租樓','租楼','租金','租屋','租房'],
  ['insurance','coverage','premium','保險','保险','保費','保费','保障'],
  ['education','tuition','student','school','學費','学费','升學','升学','教育','讀書','读书'],
  ['resp','cesg','education savings','教育儲蓄','教育储蓄'],
  ['rrsp','registered retirement savings','註冊退休儲蓄','注册退休储蓄','退休儲蓄計劃'],
  ['tfsa','tax free savings','tax-free savings','免稅儲蓄','免税储蓄'],
  ['rrif','retirement income fund','退休收入基金'],
  ['fhsa','first home savings','首次置業儲蓄','首次置业储蓄'],
  ['cpp','canada pension','加拿大退休金'],
  ['oas','old age security','老人金','高齡保障','高龄保障'],
  ['tax','taxes','taxation','稅','税','報稅','报税','扣稅','扣税'],
  ['gic','guaranteed investment certificate','定期','定存','存款證','存款证'],
  ['dividend','dividends','distribution','distributions','股息','派息','分紅','分红','派彩','红利'],
  ['currency','foreign exchange','fx','exchange rate','匯率','汇率','外幣','外币','兌換','兑换'],
  ['cad','canadian dollar','加元','加幣','加币'],
  ['fees','fee','commission','costs','手續費','手续费','管理費','管理费','收費','收费'],
  ['etf','exchange traded fund','exchange-traded fund','交易所買賣基金','交易所买卖基金'],
  ['bond','bonds','duration','債券','债券','久期'],
  ['return','returns','performance','回報','回报','收益'],
  ['risk','risks','uncertainty','風險','风险','不確定','不确定'],
  ['net worth','wealth','assets','身家','淨資產','净资产','財富','财富','資產','资产'],
  ['pension','pensions','退休長俸','長俸','長糧','养老金','退休金'],
  ['longevity','life expectancy','survival','長壽','长寿','壽命','寿命'],
  ['caregiving','caregiver','care costs','護理','护理','照顧','照顾','長期照護'],
  ['estate','inheritance','遺產','遗产','承繼','承继','继承'],
  ['car','vehicle','lease','汽車','汽车','買車','买车','供車','供车','租車','租车'],
  ['income','salary','wage','pay rise','pay raise','人工','薪金','收入','加薪'],
  ['parental leave','maternity','育嬰','育婴','產假','产假','育儿假'],
  ['structured note','structured notes','autocall','coupon barrier','結構性票據','结构性票据','結構票據','結構產品','自动赎回','自動贖回'],
  ['equity-linked gic','market-linked gic','股票掛鈎定存','股票挂钩定存','股票掛鈎','股票挂钩'],
  ['valuation','price earnings','p/e','pe ratio','估值','市盈率','估價','估价'],
  ['index','indices','benchmark','指數','指数','基準','基准'],
  ['s&p 500','sp500','s&p500','標普','标普'],
  ['royal bank','rbc','ry','加拿大皇家銀行','皇家銀行','皇家银行'],
  ['toronto dominion','td','道明'],
  ['bmo','bank of montreal','滿地可','满地可','蒙特利爾銀行','蒙特利尔银行'],
  ['scotiabank','bns','bank of nova scotia','豐業','丰业'],
  ['cibc','cm','imperial bank','帝國銀行','帝国银行'],
  ['bank','banks','banking','銀行','银行'],
  ['concentration','overlap','diversification','集中','重疊','重叠','分散'],
  ['sequence','sequence of returns','回報次序','回报顺序','回報順序'],
  ['rebalancing','allocation','asset allocation','再平衡','配置'],
  ['reimbursement','refund','claim','報銷','报销','索償','索偿','退款'],
  ['interest','interest rate','apr','利息','利率','息率','息'],
  ['stock','stocks','equity','shares','股票','股市'],
  ['last','lasts','longevity','run out','夠唔夠用','夠用','用晒','用哂','用完','夠唔夠']
];

export function normalize(value) {
  return String(value).normalize('NFKC').toLowerCase().replace(/[’']/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
}
const stop = new Set('a an the and or of for to in on at by with from about how what when why does do is are can i me my we our you your show find want looking would like please chart charts graph graphs article articles tool tools compare vs versus much get some that this it will have money happens happen need needs know 想搵 想找 我想 有關 关于 關於 圖表 图表 文章'.split(' '));
const normalizedConcepts = concepts.map(group => [...new Set(group.map(normalize))]);
const contains = (text, term) => /[\p{Script=Han}]/u.test(term) ? text.includes(term) : (' '+text+' ').includes(' '+term+' ');
const stem = word => word.length>4 ? word.replace(/(?:ing|ed|s)$/,'') : word;

function distanceOne(a,b) {
  if(Math.abs(a.length-b.length)>1)return false;
  let i=0,j=0,edits=0;
  while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;continue;}if(++edits>1)return false;if(a.length>=b.length)i++;if(b.length>=a.length)j++;}
  return edits+(i<a.length||j<b.length?1:0)<=1;
}

export function queryGroups(query) {
  let remaining=normalize(query).slice(0,180);
  const groups=[];
  // Longest phrases first, so a multiword concept does not become three unrelated words.
  const hits=normalizedConcepts.map(terms=>({terms,matched:terms.filter(t=>contains(remaining,t)).sort((a,b)=>b.length-a.length)})).filter(x=>x.matched.length).sort((a,b)=>b.matched[0].length-a.matched[0].length);
  for(const {terms,matched} of hits){
    const active=matched.filter(t=>contains(remaining,t));
    if(!active.length)continue;
    groups.push({terms,original:active[0],concept:true});
    for(const t of active)remaining=remaining.split(t).join(' ');
  }
  const words=remaining.match(/[a-z0-9]+|[\p{Script=Han}]+/gu)||[];
  for(const word of words)if(!stop.has(word)&&word.length>1&&!/^[\p{Script=Han}]+$/u.test(word))groups.push({terms:[word],original:word});
  // Unsupported Chinese queries must yield no match, rather than returning all content.
  if(!groups.length&&/[\p{Script=Han}]/u.test(remaining))groups.push({terms:[remaining.trim()],original:remaining.trim()});
  return groups.slice(0,12);
}

export function createSearch(documents) {
  const prepared=documents.map(doc=>({...doc,fields:[normalize(doc.title),normalize((doc.parentTitle||'')+' '+doc.category+' '+(doc.keywords||'')),normalize(doc.description),normalize(doc.body||'')]}));
  const vocabulary=[...new Set(prepared.flatMap(d=>d.fields.slice(0,3).join(' ').match(/[a-z]{4,}/g)||[]))];
  return function search(query,{type='all',topic='all',limit=24}={}) {
    const groups=queryGroups(query);
    if(!groups.length)return {results:[],total:0,counts:{all:0,article:0,chart:0,tool:0},terms:[]};
    const expanded=groups.map(group=>{
      const exact=prepared.some(doc=>doc.fields.some(f=>group.terms.some(t=>contains(f,t))));
      const fuzzy=!exact&&!group.concept&&/^[a-z]{3,}$/.test(group.original)?vocabulary.filter(w=>w.startsWith(group.original)||(group.original.length>=4&&distanceOne(w,group.original))).slice(0,8):[];
      return {...group,terms:[...group.terms,...fuzzy],fuzzy:fuzzy.length>0};
    });
    const matches=prepared.map(doc=>{
      let score=0,coverage=0;
      for(const group of expanded){
        let best=0;
        doc.fields.forEach((field,i)=>{for(const term of group.terms){
          const matched=contains(field,term)||(!group.concept&&term.length>3&&field.split(' ').some(w=>stem(w)===stem(term)));
          if(matched)best=Math.max(best,[15,9,6,1.2][i]*(term===group.original?1.3:1)*(group.fuzzy?.7:1));
        }});
        if(best){coverage++;score+=best;}
      }
      const phrase=normalize(query);
      if(phrase.length>2&&doc.fields[0].includes(phrase))score+=30;
      if(expanded.length===1){
        const introductions={mortgage:'mortgage-renewal-payment-shock',retirement:'retirement-longevity-planning',inflation:'inflation-purchasing-power',savings:'savings-compounding',compound:'savings-compounding',debt:'debt-payoff-interest','credit card':'credit-card-minimum-payment-long-tail',valuation:'banks'};
        const key=expanded[0].terms.find(t=>introductions[t]);
        if(key&&doc.url.split('#')[0]==='/research/'+introductions[key])score+=doc.type==='chart'?10:12;
      }
      // Weak matches to one word in a long question should not swamp the useful results.
      if(coverage<Math.max(1,Math.ceil(expanded.length*.6)))score=0;
      score*=coverage/expanded.length;
      return {doc,score};
    }).filter(x=>x.score>0&&(topic==='all'||x.doc.topic===topic));
    matches.sort((a,b)=>b.score-a.score||(a.doc.type===b.doc.type?0:a.doc.type==='article'?-1:1)||a.doc.title.localeCompare(b.doc.title));
    const counts={all:matches.length,article:0,chart:0,tool:0};
    for(const {doc} of matches)counts[doc.type]++;
    const filtered=matches.filter(x=>type==='all'||x.doc.type===type);
    return {results:filtered.slice(0,limit).map(({doc,score})=>{const {fields,...value}=doc;return {...value,score};}),total:filtered.length,counts,terms:[...new Set(expanded.flatMap(g=>g.terms))]};
  };
}

export function excerpt(document,terms,max=220) {
  const body=document.body||document.description;
  const lower=body.toLowerCase();
  const positions=terms.map(term=>lower.indexOf(term)).filter(x=>x>=0);
  const start=positions.length?Math.max(0,Math.min(...positions)-65):0;
  const chunk=body.slice(start,start+max);
  return (start?'…':'')+chunk+(start+max<body.length?'…':'');
}
