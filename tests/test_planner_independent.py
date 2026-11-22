"""Independent re-implementation of the planner toolkit's new calculations.

Written separately from src/planner-math.js (different language, different
structure) and compared with it over a grid of inputs, so a mistake in one is
unlikely to be repeated in the other.
"""
import itertools
import json
import math
import subprocess
import unittest

# 2026 statutory brackets: (upper bound inclusive, rate). CRA current-year table and gov.bc.ca.
FEDERAL = [(58523, .14), (117045, .205), (181440, .26), (258482, .29), (math.inf, .33)]
BC = [(50363, .056), (100728, .077), (115648, .105), (140430, .1229), (190405, .147), (265545, .168), (math.inf, .205)]


def bracket(table, income):
    for top, rate in table:
        if income <= top:
            return rate
    return table[-1][1]


def marginal(income):
    ordinary = bracket(FEDERAL, income) + bracket(BC, income)
    # Eligible dividends: 38% gross-up; credits 15.0198% federal, 12% BC of the grossed-up amount.
    eligible = 1.38 * ordinary - 1.38 * (0.150198 + 0.12)
    return {"ordinary": ordinary, "eligible": eligible, "capitalGains": ordinary / 2}


def model(amount, years, gic_rate, fund, account, rates, withdrawal, sell, term=None, renewal=None, detail=False):
    """Year-by-year ledger. Returns (gic_after_tax, fund_after_tax), or a dict with balances and loss if detail."""
    term = term or years
    renewal = gic_rate if renewal is None else renewal
    gic = amount
    units_value = amount
    cost_base = amount
    for year in range(1, years + 1):
        # The first term earns gic_rate; every later term (after a maturity) earns the renewal rate.
        rate = gic_rate if year <= term else renewal
        if account == "nonreg":
            gic = gic + gic * rate - gic * rate * rates["ordinary"]
        else:
            gic = gic * (1 + rate)
        paid = {k: units_value * fund[k] for k in ("interest", "dividends", "foreign", "realized")}
        if account == "nonreg":
            tax = ((paid["interest"] + paid["foreign"]) * rates["ordinary"]
                   + paid["dividends"] * rates["eligible"]
                   + paid["realized"] * rates["capitalGains"])
        else:
            tax = 0.0
        reinvest = sum(paid.values()) - tax
        units_value = units_value * (1 + fund["growth"]) + reinvest
        cost_base += reinvest
    if account == "rrsp":
        out = (gic * (1 - withdrawal), units_value * (1 - withdrawal))
    elif account == "tfsa":
        out = (gic, units_value)
    else:
        deferred = max(0.0, units_value - cost_base) * rates["capitalGains"] if sell else 0.0
        out = (gic, units_value - deferred)
    if not detail:
        return out
    loss = max(0.0, cost_base - units_value) if account == "nonreg" and sell else 0.0
    return {"gic": out[0], "fund": out[1], "gicBalance": gic, "fundBalance": units_value, "loss": loss}


def js(script):
    out = subprocess.run(["node", "--input-type=module", "-e", script], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


class IndependentPlannerMath(unittest.TestCase):
    def test_marginal_rates_match(self):
        incomes = [30000, 44952, 50363, 58523, 75000, 100000, 116000, 130000, 160000, 200000, 260000, 400000]
        got = js("import {bcMarginalRates} from './src/planner-math.js';"
                 f"console.log(JSON.stringify({incomes}.map(i => bcMarginalRates(i))))")
        for income, row in zip(incomes, got):
            mine = marginal(income)
            for key in mine:
                self.assertAlmostEqual(row[key], mine[key], places=12, msg=f"{income} {key}")
        # KPMG's published 2026 BC top rates: ordinary 53.50%, eligible 36.54%.
        self.assertAlmostEqual(marginal(400000)["ordinary"], .535, places=10)
        self.assertAlmostEqual(round(marginal(400000)["eligible"], 4), .3654, places=10)

    def test_gic_versus_fund_grid(self):
        cases = []
        for account, years, gic_rate, total, income, sell in itertools.product(
                ["nonreg", "tfsa", "rrsp"], [1, 5, 10, 30], [0.0, .0325, .06], [-.08, .02, .05, .1],
                [40000, 100000, 300000], [True, False]):
            fund = {"interest": .01, "dividends": .008, "foreign": .006, "realized": .01}
            fund["growth"] = total - sum(fund.values())
            cases.append(dict(amount=50000, years=years, gicRate=gic_rate, fund=fund, account=account,
                              income=income, withdrawalRate=.3, sellAtEnd=sell))
        got = js("import {gicVsFund, bcMarginalRates} from './src/planner-math.js';"
                 f"const cases = {json.dumps(cases)};"
                 "console.log(JSON.stringify(cases.map(c => { const r = gicVsFund({...c, rates: bcMarginalRates(c.income)}); return [r.gicAfterTax, r.fundAfterTax]; })))")
        self.assertEqual(len(got), len(cases))
        for c, (g, f) in zip(cases, got):
            mg, mf = model(c["amount"], c["years"], c["gicRate"], c["fund"], c["account"], marginal(c["income"]),
                           c["withdrawalRate"], c["sellAtEnd"])
            self.assertAlmostEqual(g, mg, delta=1e-6 * max(1, mg), msg=str(c))
            self.assertAlmostEqual(f, mf, delta=1e-6 * max(1, abs(mf)), msg=str(c))

    def test_renewals_balances_and_losses(self):
        """GIC renewals at a different rate, pre-tax balances and unused capital losses match the ledger."""
        cases = []
        for account, years, term, renew, total in itertools.product(
                ["nonreg", "tfsa", "rrsp"], [1, 4, 5, 7, 30], [1, 3, 5], [0.0, .02, .05], [-.06, .004, .04]):
            fund = {"interest": .01, "dividends": .008, "foreign": .006, "realized": .01}
            fund["growth"] = total - sum(fund.values())
            cases.append(dict(amount=50000, years=years, term=term, renewalRate=renew, gicRate=.0325, fund=fund,
                              account=account, income=100000, withdrawalRate=.3, sellAtEnd=True))
        got = js("import {gicVsFund, bcMarginalRates} from './src/planner-math.js';"
                 f"const cases = {json.dumps(cases)};"
                 "console.log(JSON.stringify(cases.map(c => { const r = gicVsFund({...c, rates: bcMarginalRates(c.income)});"
                 " return [r.gicAfterTax, r.fundAfterTax, r.gicBalance, r.fundBalance, r.capitalLoss, r.rows.filter(x => x.maturity).map(x => x.year)]; })))")
        for c, (g, f, gb, fb, loss, mats) in zip(cases, got):
            m = model(c["amount"], c["years"], c["gicRate"], c["fund"], c["account"], marginal(c["income"]),
                      c["withdrawalRate"], True, c["term"], c["renewalRate"], detail=True)
            for got_v, want in [(g, m["gic"]), (f, m["fund"]), (gb, m["gicBalance"]), (fb, m["fundBalance"]), (loss, m["loss"])]:
                self.assertAlmostEqual(got_v, want, delta=1e-6 * max(1, abs(want)), msg=str(c))
            self.assertEqual(mats, [y for y in range(1, c["years"] + 1) if y % c["term"] == 0], msg=str(c))

    def test_page_default_numbers(self):
        """The default GIC summary numbers, range and break-even inputs equal the independent ledger."""
        def fund_at(total):
            f = {"interest": .01, "dividends": .008, "foreign": .006, "realized": .01}
            f["growth"] = total - sum(f.values())
            return f
        # Balanced portfolio volatility from the asset-class assumptions: sqrt(w' S w).
        w = [0, .40, 0, .20, .25, .10, .05]
        vol = [.01, .06, .10, .15, .16, .16, .22]
        corr = [[1, 0, 0, 0, 0, 0, 0], [0, 1, .3, .1, .1, .1, .1], [0, .3, 1, .6, .6, .6, .6], [0, .1, .6, 1, .7, .65, .65],
                [0, .1, .6, .7, 1, .75, .65], [0, .1, .6, .65, .75, 1, .75], [0, .1, .6, .65, .65, .75, 1]]
        sigma = math.sqrt(sum(w[i] * w[j] * vol[i] * vol[j] * corr[i][j] for i in range(7) for j in range(7)))
        z = 1.2815515655446004
        rendered = js("import {renderFigure} from './src/planner-sections.js';"
                      "console.log(JSON.stringify(['nonreg','tfsa','rrsp'].map(a => renderFigure('gic', {account: a}).summary)))")
        for account, summary in zip(["nonreg", "tfsa", "rrsp"], rendered):
            lo, hi = .04 - z * sigma / math.sqrt(10), .04 + z * sigma / math.sqrt(10)
            mid = model(50000, 10, .0325, fund_at(.04), account, marginal(100000), .3, True, 5, .0325, detail=True)
            low = model(50000, 10, .0325, fund_at(lo), account, marginal(100000), .3, True, 5, .0325, detail=True)
            high = model(50000, 10, .0325, fund_at(hi), account, marginal(100000), .3, True, 5, .0325, detail=True)
            # RRSP/RRIF compares balances before withdrawal tax; other accounts compare values after any tax.
            key = ("gicBalance", "fundBalance") if account == "rrsp" else ("gic", "fund")
            for value in (mid[key[0]], mid[key[1]], low[key[1]], high[key[1]]):
                self.assertIn(f"${round(value):,}", summary, msg=account)
            self.assertIn(f"{lo * 100:.1f}% to {hi * 100:.1f}%", summary, msg=account)

    def test_portfolio_and_scenarios(self):
        got = js("import {ASSETS, assetStats, scenarioReturns, SCENARIOS} from './src/planner-sections.js';"
                 "console.log(JSON.stringify({a: ASSETS, s: assetStats(), sc: Object.fromEntries(Object.keys(SCENARIOS).map(k => [k, scenarioReturns(k)])), raw: SCENARIOS}))")
        a = got["a"]
        w, mu, sd, corr = a["weights"], a["means"], a["vols"], a["corr"]
        n = len(w)
        for i in range(n):
            self.assertEqual(corr[i][i], 1)
            for j in range(n):
                self.assertEqual(corr[i][j], corr[j][i])
        mean = sum(w[i] * mu[i] for i in range(n))
        var = sum(w[i] * w[j] * sd[i] * sd[j] * corr[i][j] for i in range(n) for j in range(n))
        self.assertAlmostEqual(got["s"]["mean"], mean, places=12)
        self.assertAlmostEqual(got["s"]["vol"], math.sqrt(var), places=12)
        self.assertLess(got["s"]["vol"], sum(w[i] * sd[i] for i in range(n)))
        # One-year loss probability quoted on the page: Phi(-mean/vol).
        loss = 0.5 * (1 + math.erf(-mean / math.sqrt(var) / math.sqrt(2)))
        summary = js("import {renderFigure} from './src/planner-sections.js'; console.log(JSON.stringify(renderFigure('assetRange', {years: 1}).summary))")
        self.assertIn(f"roughly {round(loss * 100)}%", summary)
        for name, rows in got["sc"].items():
            blend = sum(wi * ri for wi, ri in zip(w, got["raw"][name]))
            self.assertAlmostEqual(rows[-1]["value"], round(blend, 2), places=9, msg=name)


if __name__ == "__main__":
    unittest.main()
