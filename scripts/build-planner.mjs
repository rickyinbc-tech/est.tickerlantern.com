// Builds the planner conversation toolkit at / (dist/index.html). Every chart
// is pre-rendered from the same functions the browser uses, so the page reads
// fully without JavaScript and the first paint needs no client work.
import { writeFile, copyFile } from 'node:fs/promises';
import { renderFigure, FIGURES, defaults } from '../src/planner-sections.js';
import { TAX_2026 } from '../src/planner-math.js';

const day = iso => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const month = ym => new Date(ym + '-01T00:00:00Z').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', timeZone: 'UTC' });
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const RETRIEVED = '21 November 2026';

// Numbered sources. Cite with ref('key'); the list renders in this order.
const SOURCES = [
  ['statcan-cpi', 'Statistics Canada, Table 18-10-0005-01: Consumer Price Index, annual average, not seasonally adjusted (Canada and British Columbia, all-items, 2002 = 100).', 'https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1810000501'],
  ['statcan-oct', 'Statistics Canada, The Daily, “Consumer Price Index, October 2026” (released 16 November 2026): all-items CPI up 3.1% year over year.', 'https://www150.statcan.gc.ca/n1/daily-quotidien/261116/dq261116a-eng.htm'],
  ['boc-target', 'Bank of Canada, Inflation-control target (2% midpoint of a 1% to 3% range).', 'https://www.bankofcanada.ca/rates/indicators/key-variables/inflation-control-target/'],
  ['cra-limits', 'Canada Revenue Agency, MP, DB, RRSP, DPSP, ALDA, TFSA limits, YMPE and YAMPE: 2026 RRSP dollar limit $33,810; 2026 TFSA dollar limit $7,000.', 'https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html'],
  ['cra-tfsa', 'Canada Revenue Agency, Tax-free savings account (TFSA) topic pages.', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account.html'],
  ['cra-tfsa-what', 'Canada Revenue Agency, What is a TFSA: income earned in a TFSA and withdrawals do not affect eligibility for federal income-tested benefits and credits such as OAS and GIS.', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/what.html'],
  ['cra-resp-pay', 'Canada Revenue Agency, RESP payments: an educational assistance payment is taxable income for the beneficiary; contributions withdrawn are not taxed.', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/registered-education-savings-plans-resps/payments-resp.html'],
  ['cra-rrsp', 'Canada Revenue Agency, How contributions affect your RRSP deduction limit (18% of prior-year earned income, up to the annual limit).', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html'],
  ['cra-fhsa', 'Canada Revenue Agency, Contributing to your FHSA ($8,000 annual participation room, $40,000 lifetime limit, carry-forward up to $8,000).', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account/contributing-your-fhsa.html'],
  ['cra-cesg', 'Canada Revenue Agency, Canada Education Savings Grant (20% on the first $2,500 of annual contributions, $7,200 lifetime per beneficiary).', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/registered-education-savings-plans-resps/canada-education-savings-programs-cesp/canada-education-savings-grant-cesg.html'],
  ['bc-tesg', 'Government of British Columbia, BC Training and Education Savings Grant ($1,200 for children born in 2007 or later; apply from age 6 until the day before age 9).', 'https://www2.gov.bc.ca/gov/content/education-training/k-12/support/scholarships/bc-training-and-education-savings-grant'],
  ['cra-brackets', 'Canada Revenue Agency, Tax rates and income brackets for individuals: current year (2026 federal and BC tables).', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html'],
  ['bc-rates', 'Government of British Columbia, B.C. basic personal income tax rates (2026 brackets; updated 17 April 2026).', 'https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/tax-rates'],
  ['bc-budget', 'Government of British Columbia, Budget tax changes (updated 26 February 2026): lowest personal income tax rate rises from 5.06% to 5.60% for 2026 and later years. The page still says Bill 2 is subject to the legislature’s approval; see the legislative record below.', 'https://www2.gov.bc.ca/gov/content/taxes/tax-updates/budget-changes'],
  ['bc-bill2', 'Legislative Assembly of British Columbia, Bill 2 – 2026, Budget Measures Implementation Act, 2026 (third reading text): section 37 replaces “5.06%” with “5.6%” in section 4.1(1)(a) of the Income Tax Act; the commencement table brings sections 37 to 40 into force on January 1, 2026.', 'https://lims.leg.bc.ca/pdms/ldp/43rd2nd/3rd_read/gov02-3.htm'],
  ['bc-hansard-ra', 'Legislative Assembly of British Columbia, Hansard, 16 April 2026 (afternoon, issue 155): Royal Assent given to the Budget Measures Implementation Act, 2026.', 'https://lims.leg.bc.ca/hdms/file/Debates/43rd2nd/20260416pm-Hansard-n155.html'],
  ['bc-dtc', 'Government of British Columbia, B.C. basic personal income tax credits: 2026 dividend tax credit 12% (eligible) and 1.96% (other) of the taxable amount; 2026 BC tax reduction up to $690, reduced by 3.56% of net income over $25,570 (nil at $44,952).', 'https://www2.gov.bc.ca/gov/content/taxes/income-taxes/personal/credits/basic'],
  ['cra-gross-up', 'Canada Revenue Agency, Line 12000: taxable amount of dividends (eligible dividends grossed up by 38%, other-than-eligible by 15%).', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/personal-income/line-12000-taxable-amount-dividends-eligible-other-than-eligible-taxable-canadian-corporations.html'],
  ['cra-fdtc', 'Canada Revenue Agency, Line 40425: federal dividend tax credit. The toolkit uses 15.0198% (eligible) and 9.0301% (other) of the taxable amount; with the rates above these reproduce KPMG’s published 2026 BC top rates of 36.54% and 48.89%.', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-40425-federal-dividend-tax-credit.html'],
  ['cra-bpa', 'Canada Revenue Agency, Line 30000: basic personal amount. The federal amount is reduced for higher net incomes; the page currently shows the 2025 range ($177,882 to $253,414).', 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-30000-basic-personal-amount.html'],
  ['pmo-cg', 'Prime Minister of Canada, 21 March 2025: cancellation of the proposed increase to the capital gains inclusion rate (the inclusion rate remains one-half).', 'https://www.pm.gc.ca/en/news/news-releases/2025/03/21/prime-minister-mark-carney-cancels-proposed-capital-gains-tax-increase'],
  ['kpmg-top', 'KPMG, Combined top marginal tax rates for individuals: 2026 (used to check this toolkit’s BC calculations).', 'https://assets.kpmg.com/content/dam/kpmgsites/ca/pdf/services/tax/personal-tables/ca-combined-top-marginal-tax-rates-for-individuals-2026.pdf.coredownload.inline.pdf'],
  ['osc-fees', 'Ontario Securities Commission, GetSmarterAboutMoney: Mutual fund fees (MER, trailing commissions, sales charges).', 'https://www.getsmarteraboutmoney.ca/learning-path/mutual-funds-segregated-funds/mutual-fund-fees/'],
  ['cdic', 'Canada Deposit Insurance Corporation, What’s covered: mutual funds, stocks, bonds and ETFs are listed as products that are not eligible for deposit insurance.', 'https://www.cdic.ca/your-coverage/whats-covered/'],
  ['osc-mf', 'Ontario Securities Commission, GetSmarterAboutMoney: Mutual funds and segregated funds.', 'https://www.getsmarteraboutmoney.ca/learning-path/mutual-funds-segregated-funds/']
];
const order = Object.fromEntries(SOURCES.map(([k], i) => [k, i + 1]));
const ref = (...keys) => [...keys].sort((a, b) => order[a] - order[b]).map(k => { if (!order[k]) throw Error('Unknown source ' + k); return `<a class="pc-cite" href="#src-${k}" aria-label="Source ${order[k]}">[${order[k]}]</a>`; }).join('');

const FIELDS = {
  amount: ['Amount', '$', 1], from: ['Starting year', '', 1], region: ['Price index'], cash: ['Savings balance', '$', 100], rate: ['Annual return', '%', 0.1], infl: ['Inflation a year', '%', 0.1], years: ['Years', '', 1],
  initial: ['Starting amount', '$', 100], monthly: ['Monthly contribution', '$', 25], delay: ['Years of waiting', '', 1], preset: ['Portfolio mix (assumed)'], drop: ['Size of the fall', '%', 1], ret: ['Return while recovering', '%', 0.5],
  sigma: ['Volatility of one holding', '%', 1], rho: ['Correlation between holdings', '', 0.05], n: ['Number of holdings', '', 1], equity: ['Stocks in the mix', '%', 5], feeA: ['Higher annual fee', '%', 0.05], feeB: ['Lower annual fee', '%', 0.05],
  invest: ['Amount invested', '$', 100], nav: ['Unit value (NAV)', '$', 0.01], pretax: ['Pre-tax income to save', '$', 500], incomeNow: ['Taxable income now', '$', 1000], incomeLater: ['Other taxable income each withdrawal year', '$', 1000], spread: ['Years to withdraw the RRSP', '', 1], income: ['Taxable income', '$', 1000],
  fee: ['Annual fee', '%', 0.05]
};
const OPTION_LABELS = { canada: 'Canada', bc: 'British Columbia', cautious: 'Cautious (assumed 4% median, 6% volatility)', balanced: 'Balanced (assumed 5% median, 10% volatility)', growth: 'Growth (assumed 6.5% median, 15% volatility)', on: 'Show', off: 'Hide' };
// Sliders for bounded settings people nudge live; typed boxes for dollar amounts.
const RANGE = new Set(['n', 'equity', 'years', 'delay', 'spread', 'rate', 'infl', 'fee', 'feeA', 'feeB', 'drop', 'ret', 'sigma', 'rho']);
// The settings shown up front; the rest sit under "More settings".
const PRIMARY = { cash: ['rate', 'infl', 'years'], compounding: ['monthly', 'rate', 'delay'], diversification: ['n'], fees: ['feeA', 'feeB', 'years'], rrsp: ['incomeNow', 'incomeLater', 'pretax'] };

function control(fig, key) {
  const spec = FIGURES[fig].inputs[key], [label, unit, step] = FIELDS[key], id = `${fig}-${key}`, d = defaults(fig)[key];
  if (Array.isArray(spec[1])) return `<div class="pc-field"><label for="${id}">${label}</label><select id="${id}" name="${key}">${spec[1].map(o => `<option value="${o}"${o === d ? ' selected' : ''}>${OPTION_LABELS[o]}</option>`).join('')}</select></div>`;
  if (key === 'from' || key === 'start') {
    const [, min, max] = spec, opts = []; for (let y = max; y >= min; y--) opts.push(`<option value="${y}"${y === d ? ' selected' : ''}>${y}</option>`);
    return `<div class="pc-field"><label for="${id}">${label}</label><select id="${id}" name="${key}">${opts.join('')}</select></div>`;
  }
  const [, min, max] = spec, suffix = unit && unit !== '$' ? unit : '';
  if (RANGE.has(key)) return `<div class="pc-field pc-field--range"><label for="${id}"><span>${label}</span><output for="${id}" data-echo="${key}" data-unit="${suffix}">${d}${suffix}</output></label><input id="${id}" name="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${d}"><span class="pc-range-ends" aria-hidden="true"><span>${min}${suffix}</span><span>${max}${suffix}</span></span></div>`;
  const prefix = unit === '$' ? '<span aria-hidden="true">$</span>' : '';
  return `<div class="pc-field"><label for="${id}">${label}</label><div class="pc-input">${prefix}<input id="${id}" name="${key}" type="number" inputmode="decimal" min="${min}" max="${max}" step="${step}" value="${d}"></div></div>`;
}

function controls(fig) {
  const keys = Object.keys(FIGURES[fig].inputs);
  if (!keys.length) return '';
  const first = PRIMARY[fig] || keys, rest = keys.filter(k => !first.includes(k));
  return `<form class="pc-controls" data-figure="${fig}" novalidate>${first.map(k => control(fig, k)).join('')}${rest.length ? `<details class="pc-more-inputs"><summary>More settings <span>(${rest.length})</span></summary><div>${rest.map(k => control(fig, k)).join('')}</div></details>` : ''}<button class="pc-reset" type="reset">Reset</button></form>`;
}

const BADGE = { history: ['pc-badge--history', 'Historical data'], illustration: ['pc-badge--illustration', 'Illustration'], rules: ['pc-badge--rules', '2026 rules'] };
// `caveat` stays visible beside the result; `note` (longer method and sources) sits in the disclosure.
function figure(fig, { badge, caveat = '', note = '', caption = '' }) {
  const r = renderFigure(fig, {}), [cls, text] = BADGE[badge], caveatHtml = caveat ? `<p class="pc-caveat">${caveat}</p>` : '';
  const about = [r.assumptions ? `<p class="pc-assumptions" data-out="assumptions">${esc(r.assumptions)}</p>` : '', note ? `<p class="pc-note">${note}</p>` : '', r.table ? `<div class="pc-data" data-out="table">${r.table}</div>` : ''].join('');
  return `<figure class="pc-figure${r.chart ? '' : ' pc-figure--plain'}" data-figure="${fig}" id="fig-${fig}-wrap">
  <div class="pc-figure__head"><span class="pc-badge ${cls}">${text}</span>${caption ? `<figcaption>${caption}</figcaption>` : ''}</div>
  <div class="pc-figure__body">
    ${r.chart ? `<div class="pc-figure__visual"><div class="pc-chart" data-out="chart">${r.chart}</div><div data-out="legend">${r.legend || ''}</div><p class="pc-readout" data-out="readout" aria-hidden="true"></p>${caveatHtml}</div>` : ''}
    <div class="pc-figure__side">${controls(fig)}
      <p class="pc-summary" data-out="summary" aria-live="polite">${esc(r.summary)}</p>
      ${r.chart ? '' : caveatHtml}
    </div>
  </div>
  ${about ? `<details class="pc-about"><summary>${r.table ? 'Numbers, assumptions and sources' : 'Assumptions and sources'}</summary>${about}</details>` : ''}
</figure>`;
}

const notes = (items) => `<aside class="pc-notes" aria-label="Talking points"><h3>Talking points <span>Hidden in client view</span></h3><dl>${items.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></aside>`;
const section = ({ id, num, kicker, title, lead, body }) => `<section class="pc-section pc-panel${id === topics[0][0] ? ' is-active' : ''}" id="${id}" aria-labelledby="${id}-title"><div class="pc-section__head"><p class="pc-kicker"><span>${num}</span>${kicker}</p><h2 id="${id}-title" tabindex="-1">${title}</h2><p class="pc-lead">${lead}</p></div>${body}${pager(id)}</section>`;
function pager(id) {
  const i = topics.findIndex(t => t[0] === id), prev = topics[i - 1], next = topics[i + 1];
  const link = (t, dir) => t ? `<a class="pc-pager__${dir}" href="#${t[0]}"><small>${dir === 'prev' ? 'Previous' : 'Next'}</small><span>${t[1]}</span></a>` : '<span></span>';
  return `<nav class="pc-pager" aria-label="Previous and next conversation">${link(prev, 'prev')}${link(next, 'next')}</nav>`;
}

const topics = [['why', 'Why invest at all?', 'Inflation and cash'], ['compounding', 'Why start early?', 'Compounding'], ['contributions', 'Why a monthly plan?', 'Regular contributions'], ['volatility', 'What if markets fall?', 'Volatility and recovery'], ['balanced-example', 'What does the ride feel like?', 'A hypothetical balanced fund'], ['diversification', 'Why not just pick winners?', 'Diversification'], ['fees', 'What do fees cost?', 'Fees'], ['mutual-funds', 'What is a mutual fund?', 'How funds work'], ['accounts', 'Which account first?', 'TFSA, RRSP, FHSA, RESP, tax']];

const BC_STATUS = `<strong>BC rate status:</strong> the 5.60% lowest BC rate is law for 2026. Bill 2, the Budget Measures Implementation Act, 2026, received Royal Assent on 16 April 2026, with the rate change in force from January 1, 2026 ${ref('bc-bill2', 'bc-hansard-ra', 'bc-budget')}. It applies to BC taxable income up to $50,363.`;

const body = [
section({ id: 'why', num: '01', kicker: 'Inflation and cash', title: '“Why not just keep it in savings?”', lead: 'Cash is the right home for an emergency fund and money needed soon. Over longer periods, rising prices quietly shrink what savings can buy.',
  body: `${figure('inflation', { badge: 'history', caption: 'What the same basket of goods and services cost over time', caveat: `Statistics Canada annual-average Consumer Price Index ${ref('statcan-cpi')}. A personal basket can differ from the index.`, note: `In October 2026 the all-items CPI was up 3.1% from a year earlier ${ref('statcan-oct')}.` })}
  ${figure('cash', { badge: 'illustration', caption: 'Interest compared with inflation', caveat: 'Your inputs, not a forecast.', note: `The Bank of Canada aims to keep inflation at 2%, the middle of a 1% to 3% range ${ref('boc-target')}; actual inflation has been well above and below that.` })}
  ${notes([['Try saying', '“A savings account keeps your dollars safe, but inflation can shrink what they buy. Investing aims for growth that can help offset inflation over time, with the risk that values fall, especially over short periods.”'], ['Keep it balanced', 'Cash and GICs have a real job: stability and money you will need soon. Investing makes sense for money that can stay put through ups and downs.'], ['Ask', '“Which part of this money might you need in the next two or three years?”']])}` }),

section({ id: 'compounding', num: '02', kicker: 'Compounding', title: '“Why does starting now matter so much?”', lead: 'Growth earns growth. The earlier money goes in, the more years it has to compound, so a delay can cost more than the contributions missed.',
  body: `${figure('compounding', { badge: 'illustration', caption: 'Same monthly amount, same end date, different start', caveat: 'A steady assumed return. Real returns vary from year to year and can be negative; no rate of return is guaranteed.', note: 'Fees and taxes are not deducted here.' })}
  ${notes([['Try saying', '“Look at how much of each line comes from growth rather than deposits, and how much less there is when we wait.”'], ['Watch for', 'Choosing a high rate makes any plan look good. Run a cautious rate too, and show the client both.'], ['Ask', '“What would starting with even a smaller amount this month look like?”']])}` }),

section({ id: 'contributions', num: '03', kicker: 'Regular contributions', title: '“Why set up a monthly plan instead of waiting?”', lead: 'A pre-authorized contribution plan (PAC) turns investing into a habit. Buying the same dollar amount each month also means more units are bought when prices are lower.',
  body: `${figure('contributions', { badge: 'illustration', caption: 'What a monthly plan could add up to', caveat: 'A steady assumed return, contributions at each month-end, before fees and taxes.' })}
  ${figure('dca', { badge: 'illustration', caption: 'Same dollars each month, changing prices', caveat: 'Invented prices that fall and recover to where they started. Regular buying lowers the average cost compared with the average price, but it does not guarantee a gain.', note: 'If prices only rise, money invested sooner would have bought more units at the start.' })}
  ${notes([['Try saying', '“You don’t have to guess the right day. The plan buys a little every month, including the months that feel uncomfortable.”'], ['Keep it honest', 'A monthly plan is mostly about habit and cash flow. With a lump sum already in hand, investing it now gives every dollar more time invested, while spreading it out can feel easier but leaves cash waiting. Neither approach is guaranteed to come out ahead.'], ['Practical', 'Line the PAC up with payday, and revisit the amount when income changes.']])}` }),

section({ id: 'volatility', num: '04', kicker: 'Volatility and recovery', title: '“What happens when the market drops?”', lead: 'Falls are a normal part of investing, and the range of outcomes is widest over short periods. A plan a client can stick with through a decline matters more than one that looks best on paper.',
  body: `${figure('volatility', { badge: 'illustration', caption: 'How wide the range of outcomes can be', caveat: 'A statistical teaching model with assumed inputs, not market history and not a forecast for any fund.' })}
  ${figure('recovery', { badge: 'illustration', caption: 'Why losses take bigger gains to repair', caveat: 'Pure arithmetic. Real recoveries depend on what markets actually do; some have taken months and others many years.' })}
  ${notes([['Try saying', '“A 30% drop needs about a 43% gain to get back. That is why we match the mix to how much of a fall you can live with, not just the return you want.”'], ['Keep it honest', 'Recoveries have happened after past declines, but they are not guaranteed, and they can be slow. Someone who needs the money during a decline can lock in a loss.'], ['Ask', '“If this account fell by a fifth next year, what would you want to do?”']])}` }),

section({ id: 'balanced-example', num: '05', kicker: 'A hypothetical balanced fund', title: '“What does the ride actually feel like?”', lead: 'An average return sounds smooth; year-by-year results are not. This hypothetical example uses invented returns to show the difference between the average and the path.',
  body: `${figure('hypoReturns', { badge: 'illustration', caption: 'Invented year-by-year returns', caveat: 'Hypothetical and invented for teaching. Not the results of any real fund, index or period.' })}
  ${figure('hypoPath', { badge: 'illustration', caption: 'Same average, very different journey', caveat: 'Uses the invented returns above, reduced each year by the fee you choose.', note: 'Real results depend on the fund, the period, fees and taxes.' })}
  <details class="pc-reading"><summary>Before looking at a real fund</summary><div class="pc-cards">
    <article><h3>Read the real Fund Facts together</h3><p>For any fund you discuss, its Fund Facts document shows the risk rating, year-by-year returns for up to ten years, the best and worst 3-month returns, the MER, trading expenses and any trailing commission ${ref('osc-fees')}. Use the fund company’s own, current figures rather than recalculating them.</p></article>
    <article><h3>Distributions are taxable outside registered plans</h3><p>Funds usually pay out income and realized gains, often once a year. In a non-registered account those distributions are taxable in the year they are paid even when they are reinvested, and even in a year when the fund’s value fell. Inside a TFSA or RRSP they are not taxed when paid.</p></article>
    <article><h3>Compare like with like</h3><p>Compare total returns over identical periods, after fees, in the same currency, and only between investments with similar objectives. An after-fee fund return compared with a before-fee index return is not a fair comparison.</p></article>
  </div></details>
  ${notes([['Try saying', '“Even a balanced fund has down years. The average only shows up for people who stay in through the bumps, so let’s choose a mix you can stay with.”'], ['Keep it honest', 'These numbers are invented. For a real fund, use its current Fund Facts and the fund company’s published returns, and remember past returns do not predict future returns.'], ['Ask', '“Looking at the worst year here, how would you have felt, and what would you have done?”']])}` }),

section({ id: 'diversification', num: '06', kicker: 'Diversification', title: '“Why not just buy the best few stocks?”', lead: 'Owning many investments that don’t move in lockstep reduces the damage any one can do. It can’t remove the risk that the whole market falls, which is why the stock and bond mix matters too.',
  body: `${figure('diversification', { badge: 'illustration', caption: 'Volatility as equal holdings are added', caveat: 'Your inputs in the standard portfolio formula. Real holdings differ.', note: 'Equal weights, equal volatility and the same correlation between every pair of holdings.' })}
  ${figure('mix', { badge: 'illustration', caption: 'Stocks and bonds together', caveat: 'Assumed inputs, not forecasts. Correlations change, and in some years stocks and bonds have fallen together.', note: 'Stocks 6.5% return and 16% volatility, bonds 3.5% and 6%, correlation 0.2.' })}
  ${notes([['Try saying', '“Diversification means no single company can sink the plan. It won’t stop a market-wide fall, so we also choose how much goes in stocks versus bonds.”'], ['Watch for', 'Concentration that clients may not count: employer shares, a single sector, or one country. Look at the whole household picture.']])}` }),

section({ id: 'fees', num: '07', kicker: 'Fees', title: '“How much do fees really cost me?”', lead: 'Fees come out every year whether returns are good or bad, so small differences compound. They also pay for portfolio management, administration and, in many series, ongoing advice. The question is value, not just price.',
  body: `${figure('fees', { badge: 'illustration', caption: 'Same investment, two fee levels', caveat: `The return before fees is your assumption. Use the fund’s actual MER from its Fund Facts ${ref('osc-fees')}.`, note: 'Fees are applied as a percentage of assets each year: net growth = (1 + return before fees) × (1 − fee).' })}
  ${notes([['Try saying', '“A 1% difference in fees can add up to a large amount over 25 years. Let’s make sure you know what you are paying and what you get for it.”'], ['Point to', 'Fund Facts show the MER, trading expense ratio, any trailing commission and sales charges in dollars per $1,000 invested.'], ['Keep it balanced', 'The lowest fee is not always the best choice. Advice that keeps a client invested, saving and in the right accounts can be worth more than its cost, but that has to be shown, not assumed.']])}` }),

section({ id: 'mutual-funds', num: '08', kicker: 'How funds work', title: '“What am I actually buying in a mutual fund?”', lead: 'A mutual fund pools money from many investors and a professional manager invests it. Each investor owns units; the unit value (net asset value, or NAV) is calculated once a day.',
  body: `<div class="pc-split">${figure('units', { badge: 'illustration', caption: 'Units and unit value' })}
  <div class="pc-explain"><h3>Explain it in four points</h3><ol><li><strong>Pooled and diversified.</strong> One purchase can spread money across hundreds of holdings ${ref('osc-mf')}.</li><li><strong>Priced once a day.</strong> Orders are generally filled at the NAV calculated after markets close that day, not at intraday prices.</li><li><strong>Costs are inside the fund.</strong> The MER reduces returns rather than appearing as a bill; series differ in fees and in whether advice is included ${ref('osc-fees')}.</li><li><strong>Not guaranteed.</strong> Mutual funds are not covered by the Canada Deposit Insurance Corporation, and their values change frequently ${ref('cdic')}.</li></ol>
  <details><summary>When a mutual fund may not be the right fit</summary><ul><li>The money is needed within a year or two, or the client can’t accept any loss.</li><li>The client wants a guaranteed amount; GICs or high-interest savings may fit better.</li><li>The client wants to direct every holding themselves, or is focused mainly on the lowest possible cost.</li><li>High-interest debt is outstanding, or there is no emergency fund yet.</li></ul></details></div></div>
  ${notes([['Try saying', '“You’re buying a slice of a managed portfolio. When its holdings go up or down, the value of your slice does too.”'], ['Point to', 'The Fund Facts document: two to four pages covering risk, past returns, costs and who the fund is for.']])}` }),

section({ id: 'accounts', num: '09', kicker: 'Accounts and tax · BC 2026', title: '“Which account should this money go in?”', lead: 'The investment and the account are separate choices. The same fund can sit in a TFSA, RRSP, FHSA, RESP or non-registered account, and the account decides how the growth is taxed.',
  body: `<div class="pc-table-wrap" tabindex="0" role="region" aria-label="Comparison of Canadian accounts, 2026"><table class="pc-table pc-accounts"><caption>Canadian accounts at a glance, 2026</caption><thead><tr><th scope="col">Account</th><th scope="col">2026 limit</th><th scope="col">Going in</th><th scope="col">Coming out</th><th scope="col">Often useful for</th></tr></thead><tbody>
    <tr><th scope="row">TFSA</th><td data-label="2026 limit">$7,000 new room; unused room carries forward ${ref('cra-limits')}</td><td data-label="Going in">No deduction</td><td data-label="Coming out">Tax-free; withdrawals are added back to room the next year ${ref('cra-tfsa')}</td><td data-label="Often useful for">Flexible goals; savers expecting similar or higher income later</td></tr>
    <tr><th scope="row">RRSP</th><td data-label="2026 limit">18% of last year’s earned income, up to $33,810 ${ref('cra-limits', 'cra-rrsp')}</td><td data-label="Going in">Deductible</td><td data-label="Coming out">Taxed as income</td><td data-label="Often useful for">Retirement, especially when today’s tax rate is higher than the expected rate later</td></tr>
    <tr><th scope="row">FHSA</th><td data-label="2026 limit">$8,000 a year, $40,000 lifetime ${ref('cra-fhsa')}</td><td data-label="Going in">Deductible</td><td data-label="Coming out">Tax-free for a qualifying first home</td><td data-label="Often useful for">First-time home buyers</td></tr>
    <tr><th scope="row">RESP</th><td data-label="2026 limit">CESG 20% on the first $2,500 a year, up to $7,200 per child ${ref('cra-cesg')}; BC adds a one-time $1,200 BCTESG for eligible children ${ref('bc-tesg')}</td><td data-label="Going in">No deduction</td><td data-label="Coming out">Growth and grants taxed to the student when paid out for school; contributions come back tax-free ${ref('cra-resp-pay')}</td><td data-label="Often useful for">Children’s post-secondary education</td></tr>
    <tr><th scope="row">Non-registered</th><td data-label="2026 limit">No limit</td><td data-label="Going in">No deduction</td><td data-label="Coming out">Interest, dividends and realized gains taxed each year; distributions are taxable even when reinvested</td><td data-label="Often useful for">Savings beyond registered room</td></tr>
  </tbody></table></div>
  ${figure('rrsp', { badge: 'rules', caption: 'TFSA or RRSP for the same pre-tax dollars?', caveat: `${BC_STATUS} <strong>Excludes all tax credits and benefit effects.</strong>`, note: `Tax is calculated across the 2026 federal and BC brackets ${ref('cra-brackets', 'bc-rates')}, not at one marginal rate: the contribution’s tax is the difference between tax with and without it, and each withdrawal year is taxed on top of your other income. It assumes the RRSP refund is invested too and holds 2026 brackets constant, although brackets are normally indexed and growth here is in future dollars, so large balances can overstate the later tax. <strong>It excludes all tax credits</strong> (basic personal amounts, age and pension credits, the BC tax reduction) <strong>and benefit effects</strong>: RRSP and RRIF withdrawals count as income and can reduce OAS (recovery tax) and income-tested benefits such as GIS, while TFSA income and withdrawals do not ${ref('cra-tfsa-what')}. A rough guide, not a tax calculation.` })}
  ${figure('taxtypes', { badge: 'rules', caption: 'Non-registered: tax on the next dollar by income type', caveat: `${BC_STATUS} <strong>Credits are excluded, so results at or below $44,952 are flagged.</strong>`, note: `Statutory 2026 federal and BC bracket rates ${ref('cra-brackets', 'bc-rates')} with the dividend gross-up and tax credits ${ref('cra-gross-up', 'cra-fdtc', 'bc-dtc')} and a one-half capital gains inclusion rate ${ref('pmo-cg')}. The top-bracket results match KPMG’s published 2026 BC rates ${ref('kpmg-top')}. The BC tax reduction (up to $690, phasing out at 3.56% of income over $25,570) and basic personal amounts change actual rates at lower incomes ${ref('bc-dtc')}. The federal basic personal amount also phases down at higher incomes (2025: $177,882 to $253,414) ${ref('cra-bpa')}. OAS recovery and income-tested benefits are also excluded, so a client’s actual marginal rate can differ. A negative rate means the dividend credit also reduces tax on other income.` })}
  ${notes([['Try saying', '“The fund decides how the money is invested; the account decides how it’s taxed. Let’s use the accounts that fit your goals first.”'], ['Watch for', 'Over-contributions (CRA charges a penalty tax), and RRSP withdrawals that push income into a higher bracket or reduce benefits.'], ['Keep it honest', 'This is a conversation aid, not tax advice. Confirm room on CRA My Account and bring in a tax professional for complex situations.']])}` })
].join('\n');

const toolkitIntro = `<section class="pc-hero" id="top" aria-labelledby="pc-title"><div class="pc-hero__inner">
  <p class="pc-eyebrow">Planner conversation toolkit · Canada and British Columbia</p>
  <h1 id="pc-title">Explain investing clearly, and honestly.</h1>
  <p class="pc-deck">Nine short visual conversations. Pick the client’s question, adjust the chart together, and let the talking points guide you.</p>
  <ul class="pc-legend-badges" aria-label="How to read the charts"><li><span class="pc-badge pc-badge--history">Historical data</span> published, dated and sourced</li><li><span class="pc-badge pc-badge--illustration">Illustration</span> your assumptions, not a forecast</li><li><span class="pc-badge pc-badge--rules">2026 rules</span> current limits and tax rates</li></ul>
</div></section>`;

const rail = `<nav class="pc-rail" id="topics" aria-label="Conversation topics">
  <div class="pc-rail__bar"><p class="pc-rail__title">Conversations</p><button class="pc-switch" type="button" id="notes-toggle" aria-pressed="false"><span class="pc-switch__track" aria-hidden="true"></span><span>Client<span class="pc-switch__word"> view</span></span></button></div>
  <ol class="pc-topics">${topics.map(([id, q, label], i) => `<li><a href="#${id}"${i ? '' : ' aria-current="true"'}><span>${String(i + 1).padStart(2, '0')}</span><strong>${q}</strong><small>${label}</small></a></li>`).join('')}</ol>
  <a class="pc-rail__sources" href="#sources">Sources and method</a>
</nav>`;

const sourcesList = `<section class="pc-section pc-sources" id="sources" aria-labelledby="sources-title"><div class="pc-section__head"><h2 id="sources-title">Sources and method</h2><p class="pc-lead">Sources were retrieved on ${RETRIEVED}. Tax rules, limits and fund data change; check the linked source before relying on a figure.</p></div>
<details class="pc-sources__list" id="source-list"><summary>All ${SOURCES.length} sources</summary><ol class="pc-source-list">${SOURCES.map(([k, text, url]) => `<li id="src-${k}">${esc(text)} <a href="${esc(url)}" rel="noopener noreferrer" target="_blank">Source<span class="sr-only"> (opens in a new tab)</span></a></li>`).join('')}</ol></details>
<details class="pc-method"><summary>How the illustrations work</summary><ul><li>Returns are effective annual rates, compounded monthly; contributions are made at each month-end.</li><li>Fees are a share of assets each year: (1 + return) × (1 − fee).</li><li>The outcome range uses independent, normally distributed annual log returns. Real markets have fatter tails: big moves happen more often than this model expects.</li><li>Diversification uses portfolio volatility = σ × √(1/n + (1 − 1/n) × ρ) for equal holdings.</li><li>Marginal tax rates are statutory 2026 federal plus BC bracket rates; dividend rates apply the gross-up and both dividend tax credits; capital gains use a one-half inclusion rate.</li></ul></details>
<p class="pc-scope">General education to support a conversation, not personal financial, tax or investment advice, and not an offer of any product. It does not discuss or show the performance of any specific fund. Suitability depends on each client’s goals, time horizon, risk tolerance and full financial picture.</p></section>
<section class="pc-section pc-more" aria-labelledby="more-title"><h2 id="more-title">More from TickerLantern</h2><div class="pc-more__grid"><a href="/valuations"><strong>Global index valuations</strong><span>Forward P/E for 21 benchmarks and a ten-year return scenario lab.</span></a><a href="/research/"><strong>Financial planning guides</strong><span>Visual guides on saving, housing, family protection, education and retirement.</span></a><a href="/research/banks"><strong>Canadian bank research</strong><span>Valuation work on the big Canadian banks.</span></a></div></section>`;

const header = `<a class="skip-link" href="#main">Skip to content</a><header class="tl-header"><div class="tl-header__inner"><a class="tl-brand" href="/" aria-label="TickerLantern home"><img src="/favicon.svg" width="34" height="34" alt=""><span>Ticker<span class="tl-brand__light">Lantern</span><small>Independent research</small></span></a><nav class="tl-nav tl-nav--desktop" aria-label="Main navigation"><a href="/" aria-current="page">Indices</a><a href="/research/">Financial planning</a><a class="research-note-link" href="/research/banks">Stock analysis</a><a href="/notes/research">Structured notes</a><a href="/gics">Equity-linked GICs</a></nav><details class="tl-menu"><summary>Menu</summary><nav class="tl-nav" aria-label="Mobile navigation"><a href="/" aria-current="page">Indices</a><a href="/research/">Financial planning</a><a class="research-note-link" href="/research/banks">Stock analysis</a><a href="/notes/research">Structured notes</a><a href="/gics">Equity-linked GICs</a><button class="tl-menu__print" type="button" data-print>Print / save PDF</button></nav></details><button class="tl-print" type="button" data-print>Print / save PDF</button></div></header>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#102f50">
<meta name="google-site-verification" content="BmfsXlNCdI7LU_Irzf3c8nNsVAi7N7kLzxYcFAf2bJE">
<title>Investing Conversation Toolkit for Canadian Financial Planners | TickerLantern</title>
<meta name="description" content="Interactive charts and talking points for Canadian and BC planners: inflation, compounding, monthly plans, volatility, diversification, fees, mutual funds, TFSA, RRSP and 2026 tax, with sources.">
<link rel="canonical" href="https://tickerlantern.com/">
<meta property="og:title" content="Investing Conversation Toolkit for Canadian Financial Planners | TickerLantern">
<meta property="og:description" content="Honest, sourced charts for explaining why clients invest, how mutual funds work and why staying invested matters.">
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
<main id="main" lang="en" data-tl-ignore>
${toolkitIntro}
<div class="pc-body">
<p class="pc-disclaimer"><strong>For conversations, not promises.</strong> Investment returns and recoveries are not guaranteed, fees and risk matter, and mutual funds are not suitable for everyone.</p>
<div class="pc-app">${rail}<div class="pc-stage">
${body}
</div></div>
${sourcesList}
</div>
</main>
<footer class="pc-footer"><div><a class="tl-brand" href="#top"><img src="/favicon.svg" alt="" width="28" height="28"><span>Ticker<span class="tl-brand__light">Lantern</span></span></a><p>Independent educational research for Canadian financial conversations. Not affiliated with any fund company. Figures are illustrative unless marked as historical data.</p></div></footer>
</body>
</html>
`;

await writeFile('dist/index.html', html);
for (const file of ['planner-boot.js', 'planner.js', 'planner.css', 'planner-math.js', 'planner-charts.js', 'planner-sections.js', 'planner-strings.js']) await copyFile('src/' + file, 'dist/' + file);
console.log('Planner toolkit built:', Object.keys(FIGURES).length, 'interactive figures,', SOURCES.length, 'sources');
