// Runtime strings for the planner toolkit charts, summaries and tables.
// Placeholders in {braces} are filled by planner-sections.js. The toolkit is
// English-only until a reviewed Chinese edition exists; /zh/ shows this English
// page under the site's untranslated-page banner.
export const STRINGS = {
    'region.canada': 'Canada', 'region.bc': 'British Columbia',
    'axis.dollars': 'Dollars', 'axis.years': 'Years from today', 'axis.yearN': 'Yr {n}',
    'col.year': 'Year', 'col.cpi': 'CPI (2002 = 100)', 'col.needed': 'Dollars needed',

    'inflation.title': 'What {amount} of {from} purchases cost each year to {to} ({region})',
    'inflation.series': 'Dollars needed for the same purchases',
    'inflation.ref': '{amount} in {from}',
    'inflation.summary': 'Purchases that cost {amount} in {from} cost about {end} in {to}, {more} more. That is {rate} a year on average ({region}, annual average CPI).',
    'inflation.table': 'Annual average CPI and dollars needed, {region}',

    'cash.title': 'Savings earning interest, before and after inflation',
    'cash.nominal': 'Account balance', 'cash.real': 'Balance in today’s dollars', 'cash.ref': 'Starting amount',
    'cash.summary': 'At {rate} interest, {cash} grows to {nominal} in {years} years. If prices rise {infl} a year, that buys what {real} buys today. Tax on the interest would reduce it further.',

    'comp.title': 'Starting now compared with starting later, same monthly amount',
    'comp.now': 'Start now', 'comp.late': 'Start in {delay} years',
    'comp.summary': 'At an assumed {rate} a year, starting now could reach {now} after {years} years ({nowIn} contributed, so growth is {share} of the balance). Waiting {delay} years could reach {late} ({lateIn} contributed), about {gap} less.',

    'pac.title': 'Monthly contributions and illustrative growth',
    'pac.contributed': 'Total contributed', 'pac.value': 'Illustrative balance', 'pac.growth': 'Growth',
    'pac.summary': '{monthly} a month for {years} years is {contributed} of contributions. At an assumed {rate} a year it could grow to {value}; growth would be {growth}, or {share} of the balance.',

    'dca.title': 'Units bought each month with the same dollars (invented prices)',
    'dca.units': 'Units bought', 'dca.month': 'Mo {n}', 'dca.monthCol': 'Month', 'dca.price': 'Unit price',
    'dca.summary': 'Investing {amount} every month buys more units when prices are low. The average cost is {avgCost} a unit against an average price of {avgPrice}. The price ends where it started ({last}), yet {invested} invested is worth {end}.',

    'preset.cautious': 'cautious mix', 'preset.balanced': 'balanced mix', 'preset.growth': 'growth mix',
    'vol.title': 'Model range of outcomes for {amount}, {mix}',
    'vol.median': 'Middle outcome', 'vol.inner': 'Middle half of outcomes', 'vol.outer': '8 in 10 outcomes', 'vol.start': 'Amount invested',
    'vol.p10': 'Low (10th percentile)', 'vol.p90': 'High (90th percentile)', 'vol.lossCol': 'Model chance below start',
    'vol.summary': 'In this model, after {years} years the middle outcome is {mid}, and 8 in 10 outcomes fall between {lo} and {hi}. The model’s chance of ending below {amount} is about {loss}.',
    'vol.assumptions': 'Model assumptions for the {mix}: {median} median annual return and {sigma} annual volatility, independent normal log returns, no fees, taxes or withdrawals. These are illustrative inputs, not data for any fund. Real markets have had larger falls and longer recoveries than this model suggests.',

    'rec.title': 'Gain needed to get back to the starting value after a fall',
    'rec.gain': 'Gain needed to recover', 'rec.cat': '−{d}%', 'rec.dropCol': 'Fall', 'rec.yearsCol': 'Years at {ret} a year',
    'rec.summary': 'After a {drop} fall, the portfolio needs a {gain} gain to get back to where it was. At a steady {ret} a year that would take about {years} years. Real recoveries have been faster or much slower.',

    'div.title': 'Illustrative volatility as holdings are added',
    'div.series': 'Portfolio volatility', 'div.x': 'Number of holdings', 'div.y': 'Annual volatility',
    'div.marker': '{n} holdings: {vol}', 'div.floor': 'Shared market risk: {floor}',
    'div.summary': 'If each holding has {one} volatility and pairs move together with correlation {rho}, {n} equal holdings give about {vol}. Adding more cannot go below about {floor}: diversification reduces company-specific risk, not market risk.',

    'mix.title': 'Illustrative trade-off between stocks and bonds',
    'mix.series': 'Mixes from 0% to 100% stocks', 'mix.x': 'Annual volatility', 'mix.y': 'Assumed annual return', 'mix.equityCol': 'Stocks',
    'mix.marker': '{equity}% stocks', 'mix.summary': 'With these assumptions, a mix of {equity}% stocks and {bonds}% bonds has about {ret} assumed return and {vol} volatility.',

    'hypo.returnsTitle': 'Hypothetical balanced fund: invented returns before fees, ten years',
    'hypo.returnCol': 'Invented return before fees', 'hypo.year': 'Year {n}', 'hypo.yearCol': 'Year',
    'hypo.returnsSummary': 'These invented returns range from {worst} to {best}, with {down} down years out of {n}. They show how uneven a balanced fund’s ride can be; they are not data for any real fund and say nothing about future returns.',
    'hypo.pathTitle': 'Hypothetical balanced fund: the bumpy path compared with a smooth average',
    'hypo.bumpy': 'Hypothetical bumpy path', 'hypo.smooth': 'Smooth {avg} a year, same end point', 'hypo.start': 'Start', 'hypo.invested': 'Amount invested', 'hypo.yearsLabel': 'Years (invented returns)',
    'hypo.pathSummary': 'Using the invented returns with a {fee} annual fee, {amount} would end at {end}, the same as a smooth {avg} a year. Along the way it would dip as low as {low}. The average hides the bumps; staying invested through them is what delivers the average.',

    'fees.title': 'The same investment at two fee levels',
    'fees.seriesA': '{feeA} annual fee', 'fees.seriesB': '{feeB} annual fee', 'fees.gapCol': 'Difference',
    'fees.lowerMore': 'more with the lower fee', 'fees.higherMore': 'more with the higher fee',
    'fees.summary': 'With the same contributions ({invested} in total) and the same return before fees, after {years} years the {feeB} option could hold {b} and the {feeA} option {a}: {gap} {more}. Fees are only one part of value; compare what each option includes.',

    'units.summary': '{invest} at a unit value (NAV) of {nav} buys {units} units. If the fund’s holdings rise 10%, those units are worth about {up}; if they fall 10%, about {down}.',

    'rrsp.title': 'After-tax value of the same pre-tax dollars',
    'rrsp.measure': 'Measure', 'rrsp.tfsa': 'TFSA', 'rrsp.rrsp': 'RRSP', 'rrsp.afterTax': 'After-tax value', 'rrsp.rowRateNow': 'Average tax rate on the contribution today', 'rrsp.rowRateLater': 'Average tax rate on RRSP withdrawals',
    'rrsp.tie': 'they come out the same', 'rrsp.rrspAhead': 'the RRSP comes out ahead', 'rrsp.tfsaAhead': 'the TFSA comes out ahead', 'rrsp.by': ' by {diff}',
    'rrsp.summary': '{caution}Rough guide, not a tax calculation: {pretax} of pre-tax income over {years} years gives TFSA {tfsa} and RRSP {rrsp} after tax, so {winner}. Tax is worked out bracket by bracket, about {now} on the contribution today and about {later} on the {balance} RRSP balance withdrawn {spread}, with no credits or benefit effects.',

    'tax.title': 'BC 2026 combined marginal rate on the next dollar at {income} taxable income',
    'tax.ordinary': 'Interest / regular income', 'tax.eligible': 'Eligible dividends', 'tax.other': 'Other dividends', 'tax.capitalGains': 'Capital gains',
    'tax.short.ordinary': 'Interest', 'tax.short.eligible': 'Eligible div.', 'tax.short.other': 'Other div.', 'tax.short.capitalGains': 'Capital gains',
    'tax.rate': 'Combined marginal rate', 'tax.incomeCol': 'Taxable income', 'tax.tableCaption': 'BC 2026 combined statutory marginal rates by income type (incomes outside the credit phase-out ranges)',
    'tax.summary': '{caution}At {income} taxable income in BC for 2026, the statutory rate on the next dollar of interest is about {ordinary}, eligible Canadian dividends {eligible}, other dividends {other}, and capital gains {capitalGains}.',
    'caution.low': 'Caution: at or below $44,952 these figures can mislead. The BC tax reduction raises the actual BC marginal rate by up to 3.56 points as it phases out, and basic personal amounts can make actual tax zero.',
    'caution.rrsp.low': 'Caution: {sides} reaches $44,952 or less, where the BC tax reduction (phasing out between $25,570 and $44,952) and basic personal amounts change actual tax, so these figures can mislead.',
    'caution.rrsp.bpa': 'Caution: {sides} overlaps about $181,440 to $258,482, where the federal basic personal amount phases down, so actual tax there is slightly higher than shown.',
    'caution.rrsp.low.plural': 'Caution: {sides} reach $44,952 or less, where the BC tax reduction (phasing out between $25,570 and $44,952) and basic personal amounts change actual tax, so these figures can mislead.',
    'caution.rrsp.bpa.plural': 'Caution: {sides} overlap about $181,440 to $258,482, where the federal basic personal amount phases down, so actual tax there is slightly higher than shown.',
    'caution.side.contribution': 'the income range the contribution is deducted from ({lo} to {hi})',
    'caution.side.withdrawal': 'each withdrawal year’s income range ({lo} to {hi})',
    'caution.and': ' and ',
    'caution.bpa': 'Caution: between about $181,440 and $258,482 the federal basic personal amount phases down, so the actual marginal rate is slightly higher than shown.',
};
