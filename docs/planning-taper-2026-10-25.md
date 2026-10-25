# A complete raise across a hypothetical benefit phase-out

The English guide `/research/pay-rise-tax-benefit-phaseout-incremental-income` adds four charts/tables. OECD's 13 October 2026 work-incentive explanation was reviewed on 25 October for general context only. No country tax rate, benefit rule, household estimate, labour-cost tax wedge or behavioural result is reproduced.

This invented monthly system taxes all gross earnings at a flat entered rate and separately phases out a nontaxable entered benefit above CAD 1,500, stopping at zero. Receipts are assumed in the same month; there is no assessment lag, payroll contribution, withholding settlement, tax bracket, actual eligibility or household spending model. Resource levels are gross minus the flat tax plus the benefit. Full-change offsets and local right-hand offsets have different definitions. Zero raises keep the ratio undefined; negative gains under extreme combined assumptions are retained.

Default gross CAD 2,000 produces tax CAD 400, benefit CAD 50 and resources CAD 1,650. After a CAD 200 gross raise, tax is CAD 440, benefit zero and resources CAD 1,760. Gain CAD 110 = 200 − 40 − 50. Local starting offset is 70%, while the complete-raise offset is 45% because benefit is exhausted at gross CAD 2,100. The profile inserts both exact slope changes rather than interpolating across them.

Validation:

- All 1,395 Node tests passed for the implementation. A later prose-only reserve-companion refinement was rebuilt and passed both affected model suites plus SEO checks.
- Seven focused model tests verify before/after conservation, loss capped at remaining benefit, right-hand boundaries, zero benefit/phase-out/raise, undefined denominator, negative change at a 160% offset, exact kink insertion, matrix replacement assumptions and supported finite renderings.
- Independent piecewise-slope integration over 504 combinations of tax/phase-out/benefit/start/increase matches endpoint changes.
- `tests/browser_taper.py` passed at desktop and 390px mobile: English, four accessible figures/tables, SVG descriptions/text bounds, no overflow, default complete-raise ratio, zero-raise N/A, a negative CAD 60 gain, 160% offset, invalid-rate retention, reset and component-table reconciliation.
- Mobile raise-waterfall and change-matrix screenshots were visually inspected.
