// Builds the planner conversation toolkit in English (dist/index.html) and
// Simplified Chinese (.build/planner-zh.html, published at /zh/ by
// build-zh.mjs). Both pages come from the same content below, and every chart
// is pre-rendered from the same functions the browser uses, so each page reads
// fully without JavaScript.
import { writeFile, copyFile, mkdir } from 'node:fs/promises';
import { renderFigure, FIGURES, defaults, ASSETS, SCENARIOS, translate } from '../src/planner-sections.js';
import { FUND_SAMPLE } from '../src/planner-fund-sample.js';

const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RETRIEVED = { en: '22 November 2026', zh: '2026年11月22日' };

function page(lang) {
const T = (en, zh) => lang === 'zh' ? zh : en;
const dateEn = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const dateZh = iso => { const [y, m, d] = iso.split('-').map(Number); return `${y}年${m}月${d}日`; };
const monthEn = ym => new Date(ym + '-01T00:00:00Z').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', timeZone: 'UTC' });
const minus = v => String(v).replace('-', '−');
const monthZh = ym => { const [y, m] = ym.split('-').map(Number); return `${y}年${m}月`; };

// Numbered sources. Cite with ref('key'); the list renders in this order.
const SOURCES = [
  ['statcan-cpi', T('Statistics Canada, Table 18-10-0005-01: Consumer Price Index, annual average, not seasonally adjusted (Canada and British Columbia, all-items, 2002 = 100).', '加拿大统计局，表18-10-0005-01：消费者价格指数年均值，未经季节调整（加拿大和卑诗省，所有项目，2002 = 100）。'), 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000501'],
  ['statcan-oct', T('Statistics Canada, The Daily, “Consumer Price Index, October 2026” (released 16 November 2026): all-items CPI up 3.1% year over year.', '加拿大统计局《每日》“2026年10月消费者价格指数”（2026年11月16日发布）：所有项目消费者价格指数按年上涨3.1%。'), 'https://www150.statcan.gc.ca/n1/daily-quotidien/261116/dq261116a-eng.htm'],
  ['boc-target', T('Bank of Canada, Inflation-control target (2% midpoint of a 1% to 3% range).', '加拿大央行，通胀控制目标（1%至3%区间的中点2%）。'), 'https://www.bankofcanada.ca/rates/indicators/key-variables/inflation-control-target/'],
  ['osc-fees', T('Ontario Securities Commission, GetSmarterAboutMoney: Mutual fund fees (what Fund Facts show about MER, trading expenses and trailing commissions).', '安大略省证券委员会GetSmarterAboutMoney：共同基金费用（基金概况文件中关于管理费用比率、交易费用和尾随佣金的说明）。'), 'https://www.getsmarteraboutmoney.ca/learning-path/mutual-funds-segregated-funds/mutual-fund-fees/'],
  ['cdic', T('Canada Deposit Insurance Corporation, What’s covered: GICs and other term deposits are eligible deposits; mutual funds, stocks, bonds and ETFs are not eligible.', '加拿大存款保险公司（CDIC），保障范围：GIC及其他定期存款属于合资格存款；共同基金、股票、债券和交易所交易基金不受保障。'), 'https://www.cdic.ca/your-coverage/whats-covered/'],
  ['cdic-gic', T('Canada Deposit Insurance Corporation, GICs: eligible GICs at a member institution are covered up to $100,000, principal and interest combined, per insured category, per member institution.', '加拿大存款保险公司（CDIC），GIC：成员机构的合资格GIC，每个受保类别、每家成员机构的本金加利息合计最多保障$100,000。'), 'https://www.cdic.ca/depositors/whats-covered/guaranteed-investment-certificates-gics/'],
  ['cdic-members', T('Canada Deposit Insurance Corporation, List of members: banks, federally regulated credit unions, and loan and trust companies.', '加拿大存款保险公司（CDIC），成员名单：银行、联邦监管的信用合作社以及贷款和信托公司。'), 'https://www.cdic.ca/depositors/list-of-members/'],
  ['rbcgam-rbf460', T(`RBC Global Asset Management, ${FUND_SAMPLE.name}, Series ${FUND_SAMPLE.series} (${FUND_SAMPLE.code}), fund page: Trailing returns %, 10 yr: ${FUND_SAMPLE.tenYearPct}% as of ${dateEn(FUND_SAMPLE.asOf)} (retrieved ${dateEn(FUND_SAMPLE.retrieved)}). Its Distributions table lists the fund’s actual distributions by type.`, `RBC环球资产管理，${FUND_SAMPLE.nameZh}（正式英文名称：${FUND_SAMPLE.name}；中文名称为本页译名），${FUND_SAMPLE.series}系列（${FUND_SAMPLE.code}）基金页面（英文）：“Trailing returns %”（过往回报）表“10 yr”（10年）一栏为${FUND_SAMPLE.tenYearPct}%，截至${dateZh(FUND_SAMPLE.asOf)}（检索日期${dateZh(FUND_SAMPLE.retrieved)}）。该页的“Distributions”（分派）表列出基金按类型的实际分派。`), FUND_SAMPLE.url],
  ['rbcgam-rbf460-monthly', T(`RBC Global Asset Management, ${FUND_SAMPLE.name} monthly update (PDF), Series ${FUND_SAMPLE.series}, data as of ${dateEn(FUND_SAMPLE.asOf)}: Trailing return %, 10 Yr: ${FUND_SAMPLE.tenYearPct}%; Highest/lowest returns (%), 10 yr, since inception: highest ${FUND_SAMPLE.tenYearHistory.highPct}% (period ending ${monthEn(FUND_SAMPLE.tenYearHistory.highEnded)}), lowest ${FUND_SAMPLE.lowest[10].pct}% (ending ${monthEn(FUND_SAMPLE.lowest[10].ended)}), average ${FUND_SAMPLE.tenYearHistory.averagePct}%, ${FUND_SAMPLE.tenYearHistory.periods} periods; lowest for 1, 3 and 5 yr: ${[1, 3, 5].map(n => `${minus(FUND_SAMPLE.lowest[n].pct)}% (ending ${monthEn(FUND_SAMPLE.lowest[n].ended)})`).join(', ')}.`, `RBC环球资产管理，${FUND_SAMPLE.nameZh}月度报告（PDF，英文），${FUND_SAMPLE.series}系列，数据截至${dateZh(FUND_SAMPLE.asOf)}：“Trailing return %”（过往回报）表“10 Yr”（10年）为${FUND_SAMPLE.tenYearPct}%；“Highest/lowest returns (%)”（最高/最低回报）表自基金成立以来的10年数据：最高${FUND_SAMPLE.tenYearHistory.highPct}%（截至${monthZh(FUND_SAMPLE.tenYearHistory.highEnded)}的期间），最低${FUND_SAMPLE.lowest[10].pct}%（截至${monthZh(FUND_SAMPLE.lowest[10].ended)}），平均${FUND_SAMPLE.tenYearHistory.averagePct}%，共${FUND_SAMPLE.tenYearHistory.periods}个期间；1年、3年和5年的最低回报：${[1, 3, 5].map(n => `${minus(FUND_SAMPLE.lowest[n].pct)}%（截至${monthZh(FUND_SAMPLE.lowest[n].ended)}）`).join('、')}。`), FUND_SAMPLE.monthly.url],
  ['cudic', T('Credit Union Deposit Insurance Corporation of British Columbia (CUDIC), What CUDIC covers: all eligible deposits at BC credit unions are 100% guaranteed with no dollar limit, including term deposits of any length; mutual funds are not covered.', '卑诗省信用合作社存款保险公司（CUDIC），保障范围：卑诗省信用合作社的所有合资格存款100%受保障，没有金额上限，包括任何期限的定期存款；共同基金不受保障。'), 'https://www.cudicbc.ca/what-cudic-covers'],
  ['cra-interest', T('Canada Revenue Agency, Line 12100: interest and other investment income. Interest on a compound GIC must be reported for each complete investment year even if not yet paid; foreign interest and dividend income is reported here too.', '加拿大税务局，第12100行：利息及其他投资收入。复利GIC的利息即使尚未支付，也须按每个完整投资年度申报；外国利息和股息收入也在此申报。'), 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-12100-interest-other-investment-income.html'],
  ['cra-t4037', T('Canada Revenue Agency, Guide T4037, Capital Gains: a capital gain is the amount above adjusted cost base (ACB); its example adds reinvested mutual fund trust distributions to the ACB.', '加拿大税务局，T4037指南《资本利得》：资本利得是超出调整后成本基数（ACB）的部分；指南示例将再投资的共同基金信托分派计入ACB。'), 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4037/capital-gains.html'],
  ['cra-gross-up', T('Canada Revenue Agency, Line 12000: taxable amount of dividends (eligible dividends grossed up by 38%, other-than-eligible by 15%).', '加拿大税务局，第12000行：股息应税金额（合格股息加计38%，非合格股息加计15%）。'), 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-12000-taxable-amount-dividends-eligible-other-than-eligible-taxable-canadian-corporations.html'],
  ['cra-fdtc', T('Canada Revenue Agency, Line 40425: federal dividend tax credit. The toolkit uses 15.0198% of the taxable amount for eligible dividends.', '加拿大税务局，第40425行：联邦股息税收抵免。本工具对合格股息采用应税金额的15.0198%。'), 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-40425-federal-dividend-tax-credit.html'],
  ['bc-dtc', T('Government of British Columbia, B.C. basic personal income tax credits: 2026 dividend tax credit 12% of the taxable amount of eligible dividends; BC tax reduction up to $690, reduced by 3.56% of net income over $25,570 (nil at $44,952).', '卑诗省政府，卑诗省基本个人所得税抵免：2026年合格股息税收抵免为应税金额的12%；卑诗省减税额最高$690，按超过$25,570的净收入的3.56%递减（收入达$44,952时为零）。'), 'https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/credits/basic'],
  ['pmo-cg', T('Prime Minister of Canada, 21 March 2025: the proposed increase to the capital gains inclusion rate is cancelled (the inclusion rate remains one-half).', '加拿大总理办公室，2025年3月21日：取消提高资本利得计入比例的提案（计入比例维持二分之一）。'), 'https://www.pm.gc.ca/en/news/news-releases/2025/03/21/prime-minister-mark-carney-cancels-proposed-capital-gains-tax-increase'],
  ['cra-brackets', T('Canada Revenue Agency, Tax rates and income brackets for individuals: current year (2026 federal and BC tables).', '加拿大税务局，个人税率和收入级距：本年度（2026年联邦和卑诗省税率表）。'), 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html'],
  ['bc-rates', T('Government of British Columbia, B.C. basic personal income tax rates (2026 brackets; updated 17 April 2026).', '卑诗省政府，卑诗省基本个人所得税税率（2026年级距；2026年4月17日更新）。'), 'https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/tax-rates'],
  ['bc-budget', T('Government of British Columbia, Budget tax changes (updated 26 February 2026): lowest personal income tax rate rises from 5.06% to 5.60% for 2026 and later years.', '卑诗省政府，预算税务变更（2026年2月26日更新）：最低个人所得税税率自2026年起由5.06%提高至5.60%。'), 'https://www2.gov.bc.ca/gov/content/taxes/tax-updates/budget-changes'],
  ['bc-bill2', T('Legislative Assembly of British Columbia, Bill 2 – 2026, Budget Measures Implementation Act, 2026 (third reading text): section 37 replaces “5.06%” with “5.6%”, in force January 1, 2026.', '卑诗省议会，2026年第2号法案《2026年预算措施实施法》（三读文本）：第37条将“5.06%”改为“5.6%”，自2026年1月1日起生效。'), 'https://lims.leg.bc.ca/pdms/ldp/43rd2nd/3rd_read/gov02-3.htm'],
  ['bc-hansard-ra', T('Legislative Assembly of British Columbia, Hansard, 16 April 2026 (afternoon, issue 155): Royal Assent given to the Budget Measures Implementation Act, 2026.', '卑诗省议会议事录，2026年4月16日（下午，第155期）：《2026年预算措施实施法》获御准。'), 'https://lims.leg.bc.ca/hdms/file/Debates/43rd2nd/20260416pm-Hansard-n155.html'],
  ['kpmg-top', T('KPMG, Combined top marginal tax rates for individuals: 2026 (used to check this toolkit’s BC calculations).', '毕马威（KPMG），2026年个人合并最高边际税率（用于核对本工具的卑诗省计算）。'), 'https://assets.kpmg.com/content/dam/kpmgsites/ca/pdf/services/tax/personal-tables/ca-combined-top-marginal-tax-rates-for-individuals-2026.pdf.coredownload.inline.pdf'],
  ['cra-bpa', T('Canada Revenue Agency, Line 30000: basic personal amount, reduced for higher net incomes (the page currently shows the 2025 range, $177,882 to $253,414).', '加拿大税务局，第30000行：基本个人免税额，较高净收入者会被削减（该页目前显示2025年区间$177,882至$253,414）。'), 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30000-basic-personal-amount.html'],
  ['cra-capital-losses', T('Canada Revenue Agency, Capital losses and deductions: a net capital loss can be carried back three years or forward indefinitely, and only reduces taxable capital gains.', '加拿大税务局，资本亏损与扣除：净资本亏损可向前结转三年或无限期向后结转，且只能抵减应税资本利得。'), 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-12700-capital-gains/capital-losses-deductions.html'],
  ['cra-tfsa-what', T('Canada Revenue Agency, What is a TFSA: income earned in a TFSA, and withdrawals, are generally tax-free.', '加拿大税务局，什么是TFSA：TFSA内赚取的收入及提款一般免税。'), 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/what.html'],
  ['cra-rrsp-withdraw', T('Canada Revenue Agency, RRSPs: making withdrawals. Income earned in an RRSP is usually exempt while it stays in the plan; withdrawals are generally taxed.', '加拿大税务局，RRSP提款：资金留在计划内时所赚收入通常免税；提款一般须缴税。'), 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/making-withdrawals.html']
];
const order = Object.fromEntries(SOURCES.map(([k], i) => [k, i + 1]));
const ref = (...keys) => [...keys].sort((a, b) => order[a] - order[b]).map(k => { if (!order[k]) throw Error('Unknown source ' + k); return `<a class="pc-cite" href="#src-${k}" aria-label="${T('Source', '来源')} ${order[k]}">[${order[k]}]</a>`; }).join('');

const FIELDS = {
  amount: [T('Amount', '金额'), '$', 1], from: [T('Starting year', '起始年份'), '', 1], region: [T('Price index', '价格指数')], cash: [T('Savings balance', '储蓄余额'), '$', 100],
  rate: [T('Annual return', '年回报'), '%', 0.1], infl: [T('Inflation a year', '每年通胀率'), '%', 0.1], years: [T('Years', '年数'), '', 1], monthly: [T('Monthly contribution', '每月供款'), '$', 25],
  preset: [T('Portfolio mix (assumed)', '投资组合（假设）')], drop: [T('Size of the fall', '跌幅'), '%', 1], ret: [T('Return while recovering', '恢复期间的回报'), '%', 0.5],
  sigma: [T('Volatility of one holding', '单项持仓波动率'), '%', 1], rho: [T('Correlation between holdings', '持仓间相关系数'), '', 0.05], n: [T('Number of holdings', '持仓数目'), '', 1], equity: [T('Stocks in the mix', '组合中的股票比例'), '%', 5],
  scenario: [T('Situation', '情境')],
  account: [T('Account type', '账户类型')], gicRate: [T('GIC rate, first term', 'GIC首期利率'), '%', 0.05], term: [T('GIC term', 'GIC期限'), T(' yr', '年'), 1], renewRate: [T('Assumed renewal rate', '假设续期利率'), '%', 0.05], fundReturn: [T('Assumed future fund return a year (middle case)', '假设的未来基金年回报（中间情形）'), '%', 0.1],
  income: [T('Taxable income (non-registered)', '应税收入（非注册账户）'), '$', 1000], withdraw: [T('Tax rate on RRSP/RRIF withdrawals', 'RRSP/RRIF提款税率'), '%', 1], sale: [T('At the end', '期末')],
  fi: [T('Hypothetical split: interest income', '假设拆分：利息收入'), '%', 0.1], fd: [T('Hypothetical split: Canadian dividends', '假设拆分：加拿大股息'), '%', 0.1], ff: [T('Hypothetical split: foreign income', '假设拆分：外国收入'), '%', 0.1], fg: [T('Hypothetical split: distributed capital gains', '假设拆分：派发的资本利得'), '%', 0.1]
};
const cap = s => lang === 'zh' ? s : s[0].toUpperCase() + s.slice(1);
const OPTION_LABELS = {
  canada: T('Canada', '加拿大'), bc: T('British Columbia', '不列颠哥伦比亚省'),
  cautious: T('Cautious (assumed 4% median, 6% volatility)', '保守（假设中位数4%，波动率6%）'), balanced: T('Balanced (assumed 5% median, 10% volatility)', '平衡（假设中位数5%，波动率10%）'), growth: T('Growth (assumed 6.5% median, 15% volatility)', '增长（假设中位数6.5%，波动率15%）'),
  nonreg: T('Non-registered', '非注册账户'), tfsa: T('TFSA', '免税储蓄账户（TFSA）'), rrsp: T('RRSP or RRIF', 'RRSP或RRIF'),
  sell: T('Sell the fund units (tax the gain)', '卖出基金单位（对增值缴税）'), hold: T('Keep the fund units (gain untaxed)', '继续持有基金单位（增值暂不缴税）'),
  ...Object.fromEntries(Object.keys(SCENARIOS).map(k => [k, cap(translate('scen.' + k, {}, lang))]))
};
// Sliders for bounded settings people nudge live; typed boxes for dollar amounts.
const RANGE = new Set(['n', 'equity', 'years', 'rate', 'infl', 'drop', 'ret', 'sigma', 'rho', 'gicRate', 'term', 'renewRate', 'fundReturn', 'withdraw', 'fi', 'fd', 'ff', 'fg']);
// Choices whose labels are too long for a menu are shown as radio buttons.
const RADIO = new Set(['scenario']);
// The settings shown up front; the rest sit under "More settings".
const PRIMARY = { cash: ['rate', 'infl', 'years'], diversification: ['n'], gic: ['account', 'amount', 'income', 'withdraw', 'years', 'term', 'gicRate', 'renewRate', 'fundReturn'] };
// Settings that only matter for some accounts; the page hides the others (all show without JavaScript).
const WHEN = { gic: { income: 'nonreg', withdraw: 'rrsp', sale: 'nonreg', fi: 'nonreg', fd: 'nonreg', ff: 'nonreg', fg: 'nonreg' } };

function control(fig, key) {
  const when = WHEN[fig]?.[key];
  return when ? field(fig, key).replace(/^<(div|fieldset) class="/, `<$1 data-when="${when}" class="`) : field(fig, key);
}
function field(fig, key) {
  const spec = FIGURES[fig].inputs[key], [label, unit, step] = FIELDS[key], id = `${fig}-${key}`, d = defaults(fig)[key];
  if (RADIO.has(key)) return `<fieldset class="pc-field pc-choices" id="${id}"><legend>${label}</legend>${spec[1].map(o => `<label><input type="radio" name="${key}" value="${o}"${o === d ? ' checked' : ''}><span>${OPTION_LABELS[o]}</span></label>`).join('')}</fieldset>`;
  if (Array.isArray(spec[1])) return `<div class="pc-field"><label for="${id}">${label}</label><select id="${id}" name="${key}">${spec[1].map(o => `<option value="${o}"${o === d ? ' selected' : ''}>${OPTION_LABELS[o]}</option>`).join('')}</select></div>`;
  if (key === 'from') {
    const [, min, max] = spec, opts = []; for (let y = max; y >= min; y--) opts.push(`<option value="${y}"${y === d ? ' selected' : ''}>${y}</option>`);
    return `<div class="pc-field"><label for="${id}">${label}</label><select id="${id}" name="${key}">${opts.join('')}</select></div>`;
  }
  const [, min, max] = spec, suffix = unit && unit !== '$' ? unit : '';
  if (RANGE.has(key)) return `<div class="pc-field pc-field--range"><label for="${id}"><span>${label}</span><output for="${id}" data-echo="${key}" data-unit="${suffix}">${d}${suffix}</output></label><input id="${id}" name="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${d}"><span class="pc-range-ends" aria-hidden="true"><span>${String(min).replace(/^-/, '−')}${suffix}</span><span>${max}${suffix}</span></span></div>`;
  const prefix = unit === '$' ? '<span aria-hidden="true">$</span>' : '';
  return `<div class="pc-field"><label for="${id}">${label}</label><div class="pc-input">${prefix}<input id="${id}" name="${key}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${d}"></div></div>`;
}

function controls(fig) {
  const keys = Object.keys(FIGURES[fig].inputs);
  if (!keys.length) return '';
  const first = PRIMARY[fig] || keys, rest = keys.filter(k => !first.includes(k));
  return `<form class="pc-controls" data-figure="${fig}" novalidate>${first.map(k => control(fig, k)).join('')}${rest.length ? `<details class="pc-more-inputs"><summary>${T('More settings', '更多设置')} <span>(${rest.length})</span></summary><div>${rest.map(k => control(fig, k)).join('')}</div></details>` : ''}<button class="pc-reset" type="reset">${T('Reset', '重置')}</button></form>`;
}

const BADGE = { history: ['pc-badge--history', T('Historical data', '历史数据')], illustration: ['pc-badge--illustration', T('Illustration', '示意')], rules: ['pc-badge--rules', T('2026 rules', '2026年规则')] };
// `caveat` stays visible beside the result; `note` (longer method and sources) sits in the disclosure.
function figure(fig, { badge, caveat = '', note = '', caption = '', lead = '' }) {
  const r = renderFigure(fig, {}, lang), [cls, text] = BADGE[badge], caveatHtml = [].concat(caveat).filter(Boolean).map(c => `<p class="pc-caveat">${c}</p>`).join('');
  const about = [r.assumptions ? `<p class="pc-assumptions" data-out="assumptions">${esc(r.assumptions)}</p>` : '', note ? `<p class="pc-note">${note}</p>` : '', r.table ? `<div class="pc-data" data-out="table">${r.table}</div>` : ''].join('');
  return `<figure class="pc-figure${r.chart ? '' : ' pc-figure--plain'}" data-figure="${fig}" id="fig-${fig}-wrap">
  <div class="pc-figure__head"><span class="pc-badge ${cls}">${text}</span>${caption ? `<figcaption>${caption}</figcaption>` : ''}</div>
  ${lead}
  <div class="pc-figure__body">
    <div class="pc-figure__visual"><div class="pc-chart" data-out="chart">${r.chart}</div><div data-out="legend">${r.legend || ''}</div><p class="pc-readout" data-out="readout" aria-hidden="true"></p>${r.extra != null ? `<div class="pc-extra" data-out="extra">${r.extra}</div>` : ''}${caveatHtml}</div>
    <div class="pc-figure__side">${controls(fig)}
      ${r.stats ? `<div data-out="stats">${r.stats}</div>` : ''}<p class="pc-summary" data-out="summary" aria-live="polite">${esc(r.summary)}</p>
    </div>
  </div>
  ${about ? `<details class="pc-about"><summary>${r.table ? T('Numbers, assumptions and sources', '数字、假设与来源') : T('Assumptions and sources', '假设与来源')}</summary>${about}</details>` : ''}
</figure>`;
}

const notes = items => `<aside class="pc-notes" aria-label="${T('Talking points', '谈话要点')}"><h3>${T('Talking points', '谈话要点')} <span>${T('Hidden in client view', '客户视图中隐藏')}</span></h3><dl>${items.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></aside>`;
const topics = [
  ['why', T('Why invest at all?', '为什么要投资？'), T('Inflation and cash', '通胀与现金')],
  ['contributions', T('Why a monthly plan?', '为什么要每月定投？'), T('Regular contributions', '定期供款')],
  ['volatility', T('What if markets fall?', '市场下跌怎么办？'), T('Volatility and recovery', '波动与恢复')],
  ['balanced-example', T('What does the ride feel like?', '持有过程是什么感觉？'), T('A hypothetical balanced fund', '假设的平衡型基金')],
  ['diversification', T('Why not just pick winners?', '为什么不只挑赢家？'), T('Diversification', '分散投资')],
  ['asset-classes', T('Where does a balanced fund sit?', '平衡型基金处于什么位置？'), T('Asset classes compared', '资产类别比较')],
  ['gic-vs-fund', T('Why not just buy a GIC?', '为什么不干脆买GIC？'), T('After-tax comparison, BC 2026', '税后比较（卑诗省，2026年）')]
];
function pager(id) {
  const i = topics.findIndex(t => t[0] === id), prev = topics[i - 1], next = topics[i + 1];
  const link = (t, dir) => t ? `<a class="pc-pager__${dir}" href="#${t[0]}"><small>${dir === 'prev' ? T('Previous', '上一个') : T('Next', '下一个')}</small><span>${t[1]}</span></a>` : '<span></span>';
  return `<nav class="pc-pager" aria-label="${T('Previous and next conversation', '上一个和下一个话题')}">${link(prev, 'prev')}${link(next, 'next')}</nav>`;
}
const section = ({ id, kicker, title, lead, body }) => { const num = String(topics.findIndex(t => t[0] === id) + 1).padStart(2, '0'); return `<section class="pc-section pc-panel${id === topics[0][0] ? ' is-active' : ''}" id="${id}" aria-labelledby="${id}-title"><div class="pc-section__head"><p class="pc-kicker"><span>${num}</span>${kicker}</p><h2 id="${id}-title" tabindex="-1">${title}</h2><p class="pc-lead">${lead}</p></div>${body}${pager(id)}</section>`; };

const BC_STATUS = T(`<strong>BC rate status:</strong> the 5.60% lowest BC rate is law for 2026. Bill 2, the Budget Measures Implementation Act, 2026, received Royal Assent on 16 April 2026, with the rate change in force from January 1, 2026 ${ref('bc-bill2', 'bc-hansard-ra', 'bc-budget')}. It applies to BC taxable income up to $50,363.`,
  `<strong>卑诗省税率状态：</strong>卑诗省5.60%的最低税率已于2026年成为法律。2026年第2号法案《2026年预算措施实施法》于2026年4月16日获御准，税率变更自2026年1月1日起生效 ${ref('bc-bill2', 'bc-hansard-ra', 'bc-budget')}。该税率适用于卑诗省应税收入$50,363以下的部分。`);
const pctw = w => Math.round(w * 100) + '%';
const balMix = ASSETS.keys.map((k, i) => [k, ASSETS.weights[i]]).filter(([, w]) => w > 0);
const mixText = balMix.map(([k, w]) => pctw(w) + T(' ', '') + translate('asset.' + k, {}, lang).replace(/^(Developed|Emerging)/, m => m.toLowerCase())).join(T(', ', '、'));

const taxTable = `<div class="pc-table-wrap" tabindex="0" role="region" aria-label="${T('How each kind of return is taxed', '各类回报的税务处理')}"><table class="pc-table pc-stack"><caption>${T('How each kind of return is taxed', '各类回报的税务处理')}</caption><thead><tr><th scope="col">${T('Return', '回报类型')}</th><th scope="col">${T('Non-registered', '非注册账户')}</th><th scope="col">TFSA</th><th scope="col">${T('RRSP or RRIF', 'RRSP或RRIF')}</th></tr></thead><tbody>
  <tr><th scope="row">${T('GIC interest', 'GIC利息')}</th><td data-label="${T('Non-registered', '非注册账户')}">${T('Taxed every year at the full rate, even when a compounding GIC has not paid it out', '每年按全额税率缴税，即使复利GIC尚未支付利息')} ${ref('cra-interest')}</td><td data-label="TFSA">${T('Not taxed', '不缴税')} ${ref('cra-tfsa-what')}</td><td data-label="${T('RRSP or RRIF', 'RRSP或RRIF')}">${T('Not taxed until withdrawn; withdrawals taxed as income', '提取前不缴税；提款按收入缴税')} ${ref('cra-rrsp-withdraw')}</td></tr>
  <tr><th scope="row">${T('Fund interest and foreign income', '基金利息和外国收入')}</th><td data-label="${T('Non-registered', '非注册账户')}">${T('Taxed in the year paid at the full rate, even if reinvested', '在支付当年按全额税率缴税，即使已再投资')} ${ref('cra-interest')}</td><td data-label="TFSA">${T('Not taxed', '不缴税')}</td><td data-label="${T('RRSP or RRIF', 'RRSP或RRIF')}">${T('Same as all RRSP money', '与RRSP内所有资金相同')}</td></tr>
  <tr><th scope="row">${T('Fund Canadian dividends', '基金加拿大股息')}</th><td data-label="${T('Non-registered', '非注册账户')}">${T('Grossed up, then reduced by the dividend tax credit, so usually taxed less than interest', '先加计，再扣除股息税收抵免，因此通常税负低于利息')} ${ref('cra-gross-up', 'cra-fdtc', 'bc-dtc')}</td><td data-label="TFSA">${T('Not taxed', '不缴税')}</td><td data-label="${T('RRSP or RRIF', 'RRSP或RRIF')}">${T('No dividend credit: withdrawals are taxed as ordinary income', '没有股息抵免：提款按普通收入缴税')}</td></tr>
  <tr><th scope="row">${T('Fund capital gains distributions', '基金资本利得分派')}</th><td data-label="${T('Non-registered', '非注册账户')}">${T('Half is taxable, in the year paid', '在支付当年，一半计入应税收入')} ${ref('pmo-cg')}</td><td data-label="TFSA">${T('Not taxed', '不缴税')}</td><td data-label="${T('RRSP or RRIF', 'RRSP或RRIF')}">${T('Same as all RRSP money', '与RRSP内所有资金相同')}</td></tr>
  <tr><th scope="row">${T('Growth in unit value', '基金单位价值增长')}</th><td data-label="${T('Non-registered', '非注册账户')}">${T('Not taxed until units are sold; then half of the gain above the adjusted cost base is taxable', '卖出单位前不缴税；卖出时，超出调整后成本基数部分的一半须缴税')} ${ref('cra-t4037')}</td><td data-label="TFSA">${T('Not taxed', '不缴税')}</td><td data-label="${T('RRSP or RRIF', 'RRSP或RRIF')}">${T('Same as all RRSP money', '与RRSP内所有资金相同')}</td></tr>
</tbody></table></div>`;

const sampleCard = `<aside class="pc-sample" aria-label="${T('Published past performance', '已公布的过往表现')}"><p class="pc-sample__head"><span class="pc-badge pc-badge--history">${T('Historical data', '历史数据')}</span><strong>${T('Published past performance, dated', '已公布的过往表现（注明日期）')}</strong></p>
  <p>${T(`A balanced fund (Series ${FUND_SAMPLE.series}): <strong>${FUND_SAMPLE.tenYearPct}% a year over 10 years</strong>, as of ${dateEn(FUND_SAMPLE.asOf)}, as published by ${FUND_SAMPLE.publisher} ${ref('rbcgam-rbf460', 'rbcgam-rbf460-monthly')}. Since the fund began in ${FUND_SAMPLE.tenYearHistory.inception}, its rolling 10-year returns ranged from ${FUND_SAMPLE.lowest[10].pct}% to ${FUND_SAMPLE.tenYearHistory.highPct}% a year (average ${FUND_SAMPLE.tenYearHistory.averagePct}%, ${FUND_SAMPLE.tenYearHistory.periods} periods) ${ref('rbcgam-rbf460-monthly')}. Past performance does not guarantee future results; returns will vary and can be negative.`, `一只平衡型基金（${FUND_SAMPLE.series}系列）：<strong>10年年化回报${FUND_SAMPLE.tenYearPct}%</strong>，截至${dateZh(FUND_SAMPLE.asOf)}，由RBC环球资产管理公布 ${ref('rbcgam-rbf460', 'rbcgam-rbf460-monthly')}。自${FUND_SAMPLE.tenYearHistory.inception}年基金成立以来，滚动10年回报介于每年${FUND_SAMPLE.lowest[10].pct}%至${FUND_SAMPLE.tenYearHistory.highPct}%之间（平均${FUND_SAMPLE.tenYearHistory.averagePct}%，共${FUND_SAMPLE.tenYearHistory.periods}个期间）${ref('rbcgam-rbf460-monthly')}。过去的表现不保证未来的结果；回报会变化，也可能为负。`)}</p>
  <details class="pc-sample__use"><summary>${T('How this tool uses these figures', '本工具如何使用这些数字')}</summary><p>${T(`They are the fund’s own published figures, not recalculated here. The assumed future fund return below starts at ${FUND_SAMPLE.tenYearPct}%; move it to test lower, higher or negative returns. Everything else about the fund here, including how its return is split for tax, is a hypothetical assumption, not this fund’s data.`, `这些是基金本身公布的数字，本页没有重新计算。下方的“假设的未来基金年回报”以${FUND_SAMPLE.tenYearPct}%为起点；您可以调整它，测试较低、较高或负的回报。这里关于基金的其他一切，包括回报在税务上的拆分，都只是假设，并非这只基金的数据。`)}</p></details></aside>`;

const body = [
section({ id: 'why', kicker: T('Inflation and cash', '通胀与现金'), title: T('“Why not just keep it in savings?”', '“为什么不把钱存在储蓄账户里就好？”'), lead: T('Cash is the right home for an emergency fund and money needed soon. Over longer periods, rising prices quietly shrink what savings can buy.', '紧急备用金和短期要用的钱，放在现金里最合适。但时间一长，物价上涨会悄悄削弱储蓄的购买力。'),
  body: `${figure('inflation', { badge: 'history', caption: T('What the same basket of goods and services cost over time', '同一篮子商品和服务的价格变化'), caveat: T(`Statistics Canada annual-average Consumer Price Index ${ref('statcan-cpi')}. A personal basket can differ from the index.`, `加拿大统计局年均消费者价格指数 ${ref('statcan-cpi')}。个人的消费组合可能与指数不同。`), note: T(`In October 2026 the all-items CPI was up 3.1% from a year earlier ${ref('statcan-oct')}.`, `2026年10月，所有项目消费者价格指数比一年前上涨3.1% ${ref('statcan-oct')}。`) })}
  ${figure('cash', { badge: 'illustration', caption: T('Interest compared with inflation', '利息与通胀的比较'), caveat: T('Your inputs, not a forecast.', '使用您输入的数字，并非预测。'), note: T(`The Bank of Canada aims to keep inflation at 2%, the middle of a 1% to 3% range ${ref('boc-target')}; actual inflation has been well above and below that.`, `加拿大央行的目标是将通胀维持在2%，即1%至3%区间的中点 ${ref('boc-target')}；实际通胀曾明显高于或低于这个水平。`) })}
  ${notes([[T('Try saying', '可以这样说'), T('“A savings account keeps your dollars safe, but inflation can shrink what they buy. Investing aims for growth that can help offset inflation over time, with the risk that values fall, especially over short periods.”', '“储蓄账户能保住您的本金，但通胀会削弱它的购买力。投资是希望通过增长，长期抵消通胀的影响，但价值也可能下跌，尤其是在短期内。”')], [T('Keep it balanced', '保持平衡'), T('Cash and GICs have a real job: stability and money you will need soon. Investing makes sense for money that can stay put through ups and downs.', '现金和GIC有它们的作用：稳定，以及应付短期需要。适合投资的，是能够经得起起伏、可以长期不动的钱。')], [T('Ask', '可以问'), T('“Which part of this money might you need in the next two or three years?”', '“这笔钱里，哪一部分在未来两三年内可能要用到？”')]])}` }),

section({ id: 'contributions', kicker: T('Regular contributions', '定期供款'), title: T('“Why set up a monthly plan instead of waiting?”', '“为什么要设定每月供款，而不是等待时机？”'), lead: T('A pre-authorized contribution plan (PAC) turns investing into a habit. Buying the same dollar amount each month also means more units are bought when prices are lower.', '预先授权供款计划（PAC）把投资变成一种习惯。每月投入相同金额，也意味着价格较低时能买到更多单位。'),
  body: `${figure('contributions', { badge: 'illustration', caption: T('What a monthly plan could add up to', '每月供款计划可能累积多少'), caveat: T('A steady assumed return, contributions at each month-end, before taxes. Real returns vary from year to year and can be negative.', '假设回报稳定，每月月底供款，未计税款。实际回报每年不同，也可能为负。') })}
  ${figure('dca', { badge: 'illustration', caption: T('Same dollars each month, changing prices', '每月相同金额，价格不断变化'), caveat: T('Invented prices that fall and recover to where they started. Regular buying lowers the average cost compared with the average price, but it does not guarantee a gain.', '虚构的价格先跌后回到起点。定期买入使平均成本低于平均价格，但并不保证获利。'), note: T('If prices only rise, money invested sooner would have bought more units at the start.', '如果价格只升不跌，较早投入的钱一开始就能买到更多单位。') })}
  ${notes([[T('Try saying', '可以这样说'), T('“You don’t have to guess the right day. The plan buys a little every month, including the months that feel uncomfortable.”', '“您不必猜哪一天是好时机。这个计划每个月都买一点，包括那些让人不安的月份。”')], [T('Keep it honest', '如实说明'), T('A monthly plan is mostly about habit and cash flow. With a lump sum already in hand, investing it now gives every dollar more time invested, while spreading it out can feel easier but leaves cash waiting. Neither approach is guaranteed to come out ahead.', '每月供款主要关乎习惯和现金流。如果手上已有一笔整数，现在投入能让每一元有更长的投资时间；分批投入感觉较轻松，但部分现金要等待。两种做法都不保证结果更好。')], [T('Practical', '实际安排'), T('Line the PAC up with payday, and revisit the amount when income changes.', '让PAC扣款日与发薪日对齐，收入变化时再调整金额。')]])}` }),

section({ id: 'volatility', kicker: T('Volatility and recovery', '波动与恢复'), title: T('“What happens when the market drops?”', '“市场下跌时会怎样？”'), lead: T('Falls are a normal part of investing, and the range of outcomes is widest over short periods. A plan a client can stick with through a decline matters more than one that looks best on paper.', '下跌是投资的正常部分，而短期内结果的范围最宽。一个客户在下跌时也能坚持的计划，比纸面上最好看的计划更重要。'),
  body: `${figure('volatility', { badge: 'illustration', caption: T('How wide the range of outcomes can be', '结果的范围可以有多宽'), caveat: T('A statistical teaching model with assumed inputs, not market history and not a forecast for any fund.', '这是使用假设参数的统计教学模型，既不是市场历史，也不是对任何基金的预测。') })}
  ${figure('recovery', { badge: 'illustration', caption: T('Why losses take bigger gains to repair', '为什么亏损需要更大的涨幅才能弥补'), caveat: T('Pure arithmetic. Real recoveries depend on what markets actually do; some have taken months and others many years.', '纯粹是算术。真实的恢复取决于市场的实际表现；有的只需几个月，有的要很多年。') })}
  ${notes([[T('Try saying', '可以这样说'), T('“A 30% drop needs about a 43% gain to get back. That is why we match the mix to how much of a fall you can live with, not just the return you want.”', '“下跌30%，需要上涨约43%才能回本。所以我们要根据您能承受多大的跌幅来配置组合，而不只看您想要的回报。”')], [T('Keep it honest', '如实说明'), T('Recoveries have happened after past declines, but they are not guaranteed, and they can be slow. Someone who needs the money during a decline can lock in a loss.', '过去的下跌之后曾出现恢复，但恢复并无保证，而且可能很慢。在下跌期间需要用钱的人，可能会把亏损变成实际损失。')], [T('Ask', '可以问'), T('“If this account fell by a fifth next year, what would you want to do?”', '“如果这个账户明年下跌五分之一，您会想怎么做？”')]])}` }),

section({ id: 'balanced-example', kicker: T('A hypothetical balanced fund', '假设的平衡型基金'), title: T('“What does the ride actually feel like?”', '“持有的过程实际上是什么感觉？”'), lead: T('An average return sounds smooth; year-by-year results are not. This hypothetical example uses invented returns, already net of expenses, to show the difference between the average and the path.', '平均回报听起来很平稳，但逐年的结果并非如此。这个假设例子使用已扣除费用的虚构回报，说明平均值与实际路径之间的差别。'),
  body: `${figure('hypoReturns', { badge: 'illustration', caption: T('Invented year-by-year returns', '虚构的逐年回报'), caveat: T('Hypothetical and invented for teaching. Not the results of any real fund, index or period.', '假设数字，为教学而虚构。并非任何真实基金、指数或时期的结果。') })}
  ${figure('hypoPath', { badge: 'illustration', caption: T('Same average, very different journey', '平均值相同，过程却大不相同'), caveat: T('Uses the invented returns above, which are already net of expenses.', '使用上面已扣除费用的虚构回报。'), note: T('Real results depend on the fund, the period and taxes.', '实际结果取决于基金、时期和税务。') })}
  <details class="pc-reading"><summary>${T('Before looking at a real fund', '查看真实基金之前')}</summary><div class="pc-cards">
    <article><h3>${T('Read the real Fund Facts together', '一起阅读真实的基金概况文件')}</h3><p>${T(`For any fund you discuss, its Fund Facts document shows the risk rating, year-by-year returns for up to ten years, the best and worst 3-month returns and its costs ${ref('osc-fees')}. Use the fund company’s own, current figures rather than recalculating them.`, `对于所讨论的任何基金，其基金概况文件列出风险评级、最多十年的逐年回报、最好和最差的三个月回报以及各项成本 ${ref('osc-fees')}。请使用基金公司本身最新的数字，而不要自行重新计算。`)}</p></article>
    <article><h3>${T('Distributions are taxable outside registered plans', '在注册计划以外，分派须缴税')}</h3><p>${T('Funds usually pay out income and realized gains, often once a year. In a non-registered account those distributions are taxable in the year they are paid even when they are reinvested, and even in a year when the fund’s value fell. Inside a TFSA or RRSP they are not taxed when paid.', '基金通常会派发收入和已实现的资本利得，往往一年一次。在非注册账户中，这些分派即使已再投资，即使基金价值当年下跌，也须在支付当年缴税。在TFSA或RRSP内，派发时不缴税。')}</p></article>
    <article><h3>${T('Compare like with like', '比较时要对等')}</h3><p>${T('Compare total returns over identical periods, after costs, in the same currency, and only between investments with similar objectives.', '比较时应使用相同期间、扣除成本后、以同一货币计算的总回报，并且只比较目标相近的投资。')}</p></article>
  </div></details>
  ${notes([[T('Try saying', '可以这样说'), T('“Even a balanced fund has down years. The average only shows up for people who stay in through the bumps, so let’s choose a mix you can stay with.”', '“即使是平衡型基金也会有下跌的年份。只有在起伏中坚持的人，才能得到那个平均值，所以我们要选一个您能坚持的组合。”')], [T('Keep it honest', '如实说明'), T('These numbers are invented. For a real fund, use its current Fund Facts and the fund company’s published returns, and remember past returns do not predict future returns.', '这些数字是虚构的。对于真实基金，请使用其最新的基金概况文件和基金公司公布的回报，并记住过去的回报不能预示未来的回报。')], [T('Ask', '可以问'), T('“Looking at the worst year here, how would you have felt, and what would you have done?”', '“看看这里最差的一年，您当时会有什么感受，又会怎么做？”')]])}` }),

section({ id: 'diversification', kicker: T('Diversification', '分散投资'), title: T('“Why not just buy the best few stocks?”', '“为什么不只买最好的几只股票？”'), lead: T('Owning many investments that don’t move in lockstep reduces the damage any one can do. It can’t remove the risk that the whole market falls, which is why the stock and bond mix matters too.', '持有许多走势不完全一致的投资，可以减少任何一项造成的损害。但它无法消除整个市场下跌的风险，所以股票和债券的比例也很重要。'),
  body: `${figure('diversification', { badge: 'illustration', caption: T('Volatility as equal holdings are added', '增加等权持仓时的波动率'), caveat: T('Your inputs in the standard portfolio formula. Real holdings differ.', '把您的输入代入标准投资组合公式。真实持仓会有所不同。'), note: T('Equal weights, equal volatility and the same correlation between every pair of holdings.', '假设各项持仓权重相同、波动率相同，任意两项之间的相关系数也相同。') })}
  ${figure('mix', { badge: 'illustration', caption: T('Stocks and bonds together', '股票与债券的组合'), caveat: T('Assumed inputs, not forecasts. Correlations change, and in some years stocks and bonds have fallen together.', '使用假设参数，并非预测。相关性会变化，有些年份股票和债券曾同时下跌。'), note: T('Stocks 6.5% return and 16% volatility, bonds 3.5% and 6%, correlation 0.2.', '股票回报6.5%、波动率16%；债券回报3.5%、波动率6%；相关系数0.2。') })}
  ${notes([[T('Try saying', '可以这样说'), T('“Diversification means no single company can sink the plan. It won’t stop a market-wide fall, so we also choose how much goes in stocks versus bonds.”', '“分散投资意味着没有任何一家公司能拖垮整个计划。但它挡不住整体市场下跌，所以我们还要决定股票和债券各占多少。”')], [T('Watch for', '留意'), T('Concentration that clients may not count: employer shares, a single sector, or one country. Look at the whole household picture.', '客户可能忽略的集中风险：雇主公司的股票、单一行业或单一国家。要看整个家庭的全貌。')]])}` }),

section({ id: 'asset-classes', kicker: T('Asset classes compared', '资产类别比较'), title: T('“Isn’t a balanced fund always safely in the middle?”', '“平衡型基金是不是总是稳稳地处于中间？”'), lead: T('A balanced portfolio blends bonds and stocks, so its range of outcomes is narrower than stocks alone. It can still lose money, and in a given year it can trail cash or sit near the bottom of the table.', '平衡型组合混合了债券和股票，因此结果的范围比单纯持有股票窄。但它仍可能亏损，而且在某一年里，它的表现可能落后于现金，或排在接近末尾的位置。'),
  body: `${figure('assetRange', { badge: 'illustration', caption: T('Assumed range of average yearly returns, by asset class', '各资产类别平均年回报的假设范围'), caveat: T('Hypothetical assumptions in Canadian dollars, before tax and costs. Not historical returns, not forecasts and not data for any index or fund.', '以加元计、未计税款和成本的假设数字。并非历史回报，并非预测，也不是任何指数或基金的数据。'), note: T(`The 8-in-10 range is the assumed average ± 1.28 × volatility ÷ √years, a normal approximation. The hypothetical balanced portfolio holds ${mixText}; its volatility comes from assumed correlations between the asset classes, so it is lower than the weighted average of their volatilities. Real returns have fatter tails than this approximation, and currency moves change foreign returns measured in Canadian dollars.`, `十分之八范围 = 假设平均值 ± 1.28 × 波动率 ÷ √年数，属于正态近似。假设的平衡型组合持有${mixText}；其波动率根据各资产类别之间的假设相关性计算，因此低于各类别波动率的加权平均。真实回报的极端值比这个近似更常见，而汇率变动也会改变以加元计的外国资产回报。`) })}
  ${figure('assetScenario', { badge: 'illustration', caption: T('One hypothetical year, five situations', '假设的一年：五种情境'), caveat: T('Invented one-year returns for stylized situations, not any actual year. The balanced portfolio’s return is the weighted blend of its pieces.', '为几种典型情境虚构的一年回报，并非任何实际年份。平衡型组合的回报是其各组成部分的加权混合。') })}
  ${notes([[T('Try saying', '可以这样说'), T('“A balanced fund smooths the ride but doesn’t remove it. In a year when stocks and bonds fall together, it falls too, and cash can come out ahead.”', '“平衡型基金让过程更平稳，但并不能消除起伏。在股票和债券同时下跌的年份，它也会下跌，而现金反而可能表现更好。”')], [T('Keep it honest', '如实说明'), T('These are teaching assumptions. For a real fund or index, use its own published results and compare like with like: same period, same currency, total return, after costs.', '这些是教学用的假设。对于真实的基金或指数，请使用其本身公布的结果，并进行对等比较：相同期间、相同货币、总回报、扣除成本后。')], [T('Ask', '可以问'), T('“Which of these years would worry you most, and what would you want to do in it?”', '“这些年份中，哪一种最让您担心？遇到时您会想怎么做？”')]])}` }),

section({ id: 'gic-vs-fund', kicker: T('After-tax comparison · BC 2026', '税后比较 · 卑诗省2026年'), title: T('“Why not just buy a GIC?”', '“为什么不干脆买GIC？”'), lead: T('A GIC (guaranteed investment certificate) offers a known rate. Eligible GIC deposits at an insured institution are protected, principal and interest, within deposit-insurance limits. A balanced fund offers growth potential with no guarantee. Outside registered accounts they are also taxed differently, which this tool shows.', 'GIC（担保投资证）提供确定的利率。在受保机构持有的合资格GIC存款，其本金和利息在存款保险限额内受保障。平衡型基金提供增长潜力，但没有保证。在注册账户以外，两者的税务处理也不同，本工具会显示这一点。'),
  body: `${figure('gic', { badge: 'illustration', lead: sampleCard, caption: T('GIC compared with a hypothetical balanced fund', 'GIC与假设的平衡型基金'), caveat: [T(`Future returns are your assumptions, net of the fund’s expenses. The split of the fund’s return into interest, dividends, foreign income and gains is a hypothetical tax assumption, not any fund’s actual distributions. Tax uses BC 2026 marginal rates held flat; income-tested credits and benefits and their phase-outs are not included. ${ref('cra-bpa')}`, `未来回报为您的假设，已扣除基金费用。基金回报中利息、股息、外国收入和资本利得的拆分只是假设的税务参数，并非任何基金的实际分派。税务按2026年卑诗省边际税率计算并保持不变；按收入审查的税收抵免和福利及其逐步取消未计入。${ref('cra-bpa')}`), T(`<strong>Deposit insurance.</strong> At a CDIC member (banks, federally regulated credit unions, trust and loan companies), eligible GICs are covered up to $100,000 of principal and interest combined, per insured category (for example, in your own name, in a TFSA or in an RRSP), per member institution. Other eligible deposits you hold in the same category at the same institution count toward the same limit. Amounts above that are not covered, so a larger deposit may need to be split across institutions or categories. ${ref('cdic', 'cdic-gic', 'cdic-members')} BC credit unions are not CDIC members: their deposits are guaranteed by CUDIC with no dollar limit. ${ref('cudic')} Mutual funds are covered by neither.`, `<strong>存款保险。</strong>在CDIC成员机构（银行、联邦监管的信用合作社、信托和贷款公司），合资格GIC的本金加利息合计，每个受保类别（例如个人名下、TFSA或RRSP）、每家成员机构最多保障$100,000。您在同一机构同一类别中持有的其他合资格存款也计入同一上限。超出部分不受保障，因此较大的存款可能需要分散到不同机构或类别。${ref('cdic', 'cdic-gic', 'cdic-members')}卑诗省信用合作社不是CDIC成员：其存款由CUDIC保障，没有金额上限。${ref('cudic')}共同基金两者都不保障。`)], note: T(`${BC_STATUS} Rates come from the 2026 federal and BC brackets ${ref('cra-brackets', 'bc-rates')} with the eligible-dividend gross-up and credits ${ref('cra-gross-up', 'cra-fdtc', 'bc-dtc')} and a one-half capital gains inclusion rate ${ref('pmo-cg')}; top-bracket results match KPMG’s published 2026 BC rates ${ref('kpmg-top')}. Each year’s tax is paid from the investment, and the fund’s after-tax distributions are reinvested and added to its adjusted cost base ${ref('cra-t4037')}. <strong>Limitations:</strong> one flat marginal rate is applied, so a large gain in one year could actually reach a higher bracket; credits such as the BC tax reduction and the federal basic personal amount phase-down ${ref('cra-bpa')}, OAS recovery and income-tested benefits are excluded; foreign withholding tax, return of capital, the value of capital losses ${ref('cra-capital-losses')} and year-to-year changes in a fund’s distributions are not modelled. A conversation aid, not a tax calculation.`, `${BC_STATUS} 税率来自2026年联邦和卑诗省税率级距 ${ref('cra-brackets', 'bc-rates')}，并计入合格股息的加计与税收抵免 ${ref('cra-gross-up', 'cra-fdtc', 'bc-dtc')}，以及二分之一的资本利得计入比例 ${ref('pmo-cg')}；最高级距的结果与毕马威公布的2026年卑诗省税率一致 ${ref('kpmg-top')}。每年的税款从投资中支付，基金的税后分派再投资并计入调整后成本基数 ${ref('cra-t4037')}。<strong>局限：</strong>本工具使用单一且不变的边际税率，某一年的大额增值实际上可能落入更高级距；卑诗省减税额、联邦基本个人免税额递减 ${ref('cra-bpa')}、老年保障金回收及按收入审查的福利均未计入；外国预扣税、资本返还、资本亏损的价值 ${ref('cra-capital-losses')}以及基金分派的逐年变化也未建模。本工具用于辅助沟通，并非税务计算。`) })}
  ${taxTable}
  ${notes([[T('Try saying', '可以这样说'), T('“A GIC tells you exactly what you’ll get. A balanced fund might earn more, but it can also lose, and nobody can promise which.”', '“GIC会明确告诉您能得到多少。平衡型基金可能赚得更多，但也可能亏损，没有人能保证结果。”')], [T('Keep it honest', '如实说明'), T('Any advantage for the fund here comes entirely from the return you assume. Try a low or negative return too, and point to the break-even rate.', '这里基金的任何优势完全来自您假设的回报。也试试较低或负的回报，并指出持平所需的回报率。')], [T('Ask', '可以问'), T('“If this money dropped 10% in the first year, would that change your plans?”', '“如果这笔钱在第一年下跌10%，会改变您的计划吗？”')]])}` })
].join('\n');

const intro = `<section class="pc-hero" id="top" aria-labelledby="pc-title"><div class="pc-hero__inner">
  <p class="pc-eyebrow">${T('Planner conversation toolkit · Canada and British Columbia', '理财沟通工具 · 加拿大与卑诗省')}</p>
  <h1 id="pc-title">${T('Explain investing clearly, and honestly.', '把投资讲清楚，也讲实话。')}</h1>
  <p class="pc-deck">${T('Seven short visual conversations. Pick the client’s question, adjust the chart together, and let the talking points guide you.', '七个简短的图解话题。选出客户关心的问题，一起调整图表，并参考谈话要点。')}</p>
  <ul class="pc-legend-badges" aria-label="${T('How to read the charts', '如何阅读图表')}"><li><span class="pc-badge pc-badge--history">${BADGE.history[1]}</span> ${T('published, dated and sourced', '已公布、注明日期并附来源')}</li><li><span class="pc-badge pc-badge--illustration">${BADGE.illustration[1]}</span> ${T('assumptions, not a forecast or history', '假设数字，并非预测或历史')}</li></ul>
</div></section>`;

const rail = `<nav class="pc-rail" id="topics" aria-label="${T('Conversation topics', '话题')}">
  <div class="pc-rail__bar"><p class="pc-rail__title">${T('Conversations', '话题')}</p><button class="pc-switch" type="button" id="notes-toggle" aria-pressed="false"><span class="pc-switch__track" aria-hidden="true"></span>${T('<span>Client<span class="pc-switch__word"> view</span></span>', '<span>客户视图</span>')}</button></div>
  <ol class="pc-topics">${topics.map(([id, q, label], i) => `<li><a href="#${id}"${i ? '' : ' aria-current="true"'}><span>${String(i + 1).padStart(2, '0')}</span><strong>${q}</strong><small>${label}</small></a></li>`).join('')}</ol>
  <a class="pc-rail__sources" href="#sources">${T('Sources and method', '来源与方法')}</a>
</nav>`;

const sourcesList = `<section class="pc-section pc-sources" id="sources" aria-labelledby="sources-title"><div class="pc-section__head"><h2 id="sources-title">${T('Sources and method', '来源与方法')}</h2><p class="pc-lead">${T(`Sources were retrieved on ${RETRIEVED.en}. Tax rules and rates change; check the linked source before relying on a figure.`, `来源检索日期为${RETRIEVED.zh}。税务规则和税率会变化；引用任何数字之前，请先查看所链接的来源。`)}</p></div>
<details class="pc-sources__list" id="source-list"><summary>${T(`All ${SOURCES.length} sources`, `全部${SOURCES.length}个来源`)}</summary><ol class="pc-source-list">${SOURCES.map(([k, text, url]) => `<li id="src-${k}">${esc(text)} <a href="${esc(url)}" rel="noopener noreferrer" target="_blank" hreflang="en">${T('Source', '来源')}<span class="sr-only">${T(' (opens in a new tab)', '（在新标签页中打开，英文）')}</span></a></li>`).join('')}</ol></details>
<details class="pc-method"><summary>${T('How the illustrations work', '示意图的计算方法')}</summary><ul>
  <li>${T('Returns are effective annual rates, compounded monthly for monthly plans and yearly elsewhere; contributions are made at each month-end.', '回报为实际年利率；每月供款按月复利，其他按年复利；供款在每月月底进行。')}</li>
  <li>${T('The outcome range uses independent, normally distributed annual log returns. Real markets have fatter tails: big moves happen more often than this model expects.', '结果范围假设每年对数回报相互独立并服从正态分布。真实市场的极端情况更常见：大幅波动出现的频率高于模型的预期。')}</li>
  <li>${T('Diversification uses portfolio volatility = σ × √(1/n + (1 − 1/n) × ρ) for equal holdings; the asset-class comparison uses σ = √(wᵀΣw) with assumed correlations.', '分散投资使用等权持仓的组合波动率公式 σ × √(1/n + (1 − 1/n) × ρ)；资产类别比较使用 σ = √(wᵀΣw)，并采用假设的相关系数。')}</li>
  <li>${T('The GIC comparison applies BC 2026 statutory marginal rates to each kind of income in the year it is taxed: interest and foreign income at the full rate, eligible dividends after the gross-up and both dividend tax credits, capital gains at a one-half inclusion rate. The GIC compounds yearly at its first-term rate, then renews at the assumed renewal rate at each maturity. The fund’s lower and higher results use the 8-in-10 range of its average yearly return (middle case ± 1.28 × the balanced portfolio’s assumed volatility ÷ √years). RRSP/RRIF results compare balances before withdrawal tax, because the contribution was deducted.', 'GIC比较按2026年卑诗省法定边际税率，对各类收入在应税年度计税：利息和外国收入按全额税率，合格股息按加计及联邦和省两项股息税收抵免后计算，资本利得按二分之一计入。GIC先按首期利率每年复利，每次到期后按假设的续期利率续期。基金的较低和较高结果采用其平均年回报的十分之八范围（中间情形 ± 1.28 × 平衡型组合的假设波动率 ÷ √年数）。RRSP/RRIF的结果比较提款缴税前的余额，因为供款已经扣税。')}</li>
</ul></details>
<p class="pc-scope">${T('General education to support a conversation, not personal financial, tax or investment advice, and not an offer of any product. It does not discuss or show the performance of any specific fund. Suitability depends on each client’s goals, time horizon, risk tolerance and full financial picture.', '本页为辅助沟通的一般教育内容，并非个人理财、税务或投资建议，也不构成任何产品的要约。本页不讨论也不显示任何特定基金的表现。是否合适，取决于每位客户的目标、投资期限、风险承受能力和整体财务状况。')}</p></section>
<section class="pc-section pc-more" aria-labelledby="more-title"><h2 id="more-title">${T('More from TickerLantern', 'TickerLantern的其他内容')}</h2><div class="pc-more__grid"><a href="/valuations"><strong>${T('Global index valuations', '全球指数估值')}</strong><span>${T('Forward P/E for 21 benchmarks and a ten-year return scenario lab.', '21个基准指数的预期市盈率，以及十年回报情景分析。')}</span></a><a href="/research/"><strong>${T('Financial planning guides', '财务规划指南')}</strong><span>${T('Visual guides on saving, housing, family protection, education and retirement.', '关于储蓄、住房、家庭保障、教育和退休的图解指南。')}</span></a><a href="/research/banks"><strong>${T('Canadian bank research', '加拿大银行研究')}</strong><span>${T('Valuation work on the big Canadian banks.', '加拿大大型银行的估值研究。')}</span></a></div></section>`;

const navItems = T('<a href="/" aria-current="page">Indices</a><a href="/research/">Financial planning</a><a class="research-note-link" href="/research/banks">Stock analysis</a><a href="/notes/research">Structured notes</a><a href="/gics">Equity-linked GICs</a>',
  '<a href="/" aria-current="page">指数</a><a href="/research/">财务规划</a><a class="research-note-link" href="/research/banks">股票分析</a><a href="/notes/research">结构化票据</a><a href="/gics">股票挂钩担保投资证</a>');
const print = T('Print / save PDF', '打印 / 保存PDF');
const header = `<a class="skip-link" href="#main">${T('Skip to content', '跳到正文')}</a><header class="tl-header"><div class="tl-header__inner"><a class="tl-brand" href="/" aria-label="${T('TickerLantern home', 'TickerLantern首页')}"><img src="/favicon.svg" width="34" height="34" alt=""><span>Ticker<span class="tl-brand__light">Lantern</span><small>${T('Independent research', '独立研究')}</small></span></a><nav class="tl-nav tl-nav--desktop" aria-label="${T('Main navigation', '主导航')}">${navItems}</nav><details class="tl-menu"><summary>${T('Menu', '菜单')}</summary><nav class="tl-nav" aria-label="${T('Mobile navigation', '移动端导航')}">${navItems}<button class="tl-menu__print" type="button" data-print>${print}</button></nav></details><button class="tl-print" type="button" data-print>${print}</button></div></header>`;

const title = T('Investing Conversation Toolkit for Canadian Financial Planners | TickerLantern', '加拿大理财顾问投资沟通工具 | TickerLantern');
const description = T('Interactive charts and talking points for Canadian and BC planners: inflation, monthly plans, volatility, diversification, asset classes and an after-tax GIC versus balanced fund comparison, with sources.', '供加拿大及卑诗省理财顾问使用的互动图表和谈话要点：通胀、每月供款、波动、分散投资、资产类别，以及GIC与平衡型基金的税后比较，并附来源。');
return `<!doctype html>
<html lang="${T('en', 'zh-Hans')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#102f50">
<meta name="google-site-verification" content="BmfsXlNCdI7LU_Irzf3c8nNsVAi7N7kLzxYcFAf2bJE">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="https://tickerlantern.com/">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://tickerlantern.com/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/site-theme.css">
<link rel="stylesheet" href="/planner.css">
<script src="/planner-boot.js"></script>
<script type="module" src="/planner.js"></script>
</head>
<body class="pc-page">
${header}
<main id="main" lang="${T('en', 'zh-Hans')}" data-planner-lang="${lang}" data-tl-ignore>
${intro}
<div class="pc-body">
<p class="pc-disclaimer">${T('<strong>For conversations, not promises.</strong> Investment returns and recoveries are not guaranteed, risk matters, and mutual funds are not suitable for everyone.', '<strong>用于沟通，而非承诺。</strong>投资回报和恢复都没有保证，风险不可忽视，共同基金也并非人人适合。')}</p>
<div class="pc-app">${rail}<div class="pc-stage">
${body}
</div></div>
${sourcesList}
</div>
</main>
<footer class="pc-footer"><div><a class="tl-brand" href="#top"><img src="/favicon.svg" alt="" width="28" height="28"><span>Ticker<span class="tl-brand__light">Lantern</span></span></a><p>${T('Independent educational research for Canadian financial conversations. Not affiliated with any fund company. Figures are illustrative unless marked as historical data.', '为加拿大理财沟通而做的独立教育研究。与任何基金公司无关联。除标明为历史数据者外，所有数字均为示意。')}</p></div></footer>
</body>
</html>
`;
}

await writeFile('dist/index.html', page('en'));
await mkdir('.build', { recursive: true });
await writeFile('.build/planner-zh.html', page('zh'));
for (const file of ['planner-boot.js', 'planner.js', 'planner.css', 'planner-math.js', 'planner-charts.js', 'planner-sections.js', 'planner-strings.js', 'planner-fund-sample.js']) await copyFile('src/' + file, 'dist/' + file);
console.log('Planner toolkit built (en, zh):', Object.keys(FIGURES).length, 'interactive figures');
