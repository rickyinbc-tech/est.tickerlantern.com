# Temporary pension expiry, withdrawal allocation and debt protection

The federal pension article is explicitly titled as a monthly CPP reserve calendar
and links to the broader annual pension-bridge guide added concurrently. Its
income amounts stay flat while spending growth is separate; the annual guide
uses a common increase. This preserves a clear scope for each page.

Three English articles add twelve interactive figures with accessible data
tables. All numerical cases are hypothetical. Public rules explain the
mechanics; the figures do not reproduce a household record or a product quote.

## Public source review: 25 October 2026

- [Treasury Board: reaching age 65](https://www.canada.ca/en/treasury-board-secretariat/services/pension-plan/retired-members/reaching-age-65-pension.html): federal public-service lifetime pension and bridge; ordinary bridge termination the first of the month after the 65th birthday, with an earlier CPP/QPP disability exception. Ordinary termination does not move with CPP retirement claiming. The model uses a December birthday, five full calendar years from January age 60, and excludes disability.
- [Service Canada: CPP start timing](https://www.canada.ca/en/services/benefits/publicpensions/cpp/when-start.html): current page dated 2 October 2026. Real benefit amounts depend on start timing; the model instead requires an independent net-cash amount and does not calculate an age adjustment. The sensitivity grid holds that amount unchanged to isolate timing.
- [SEC: rebalancing](https://www.investor.gov/introduction-investing/investing-basics/glossary/rebalancing) and [asset allocation](https://www.investor.gov/introduction-investing/getting-started/asset-allocation): general concepts and the relevance of horizon and risk tolerance. The constrained withdrawal-source calculation is independent arithmetic, not an SEC-prescribed method or a suitable target allocation.
- [FCAC: optional mortgage insurance products](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/optional-insurance-products.html): general debt-linked versus individual-life benefit structure, beneficiary and premium distinctions. Both contracts, limits, flat premiums and eligibility assumptions in the model are hypothetical.
- [FCAC: mortgage-life rights](https://www.canada.ca/en/financial-consumer-agency/services/rights-responsibilities/rights-mortgages/rights-mortgage-life-insurance.html): page dated 15 October 2025. Supports distinguishing optional mortgage life from default insurance and applicable disclosure, consent and cancellation information. No personal insurance entitlement or replacement recommendation is inferred.

## Arithmetic checks

`tests/planning-pension-withdrawal-protection.test.mjs` independently checks:

- Bridge expiry at month 61 and CPP at month 85 for the default January-age-67 receipt. The first 60 months draw CAD 6,000; the next 24 draw CAD 19,200. Required opening cash is CAD 25,200, CAD 5,200 above the entered reserve, despite a positive CAD 14,000 terminal balance. Annual spending growth does not index income.
- The default CAD 30,000 withdrawal from CAD 300,000 at 70/30 leaves CAD 270,000. Proportional selling preserves 70%; the directed sale leaves 66.67% equity and an explicit CAD 18,000 residual equity surplus. A CAD 75,000 withdrawal reaches 60%. Feasible sale bounds, sampled alternative sale splits and complete depletion are checked.
- Mortgage payment and 120-month debt against independent annuity algebra. CAD 400,000, 25 years and a 5% semiannual-compounded quote leave CAD 295,184.58 after ten years. Premium alternatives accumulate CAD 7,200 and CAD 4,800. Tests cover zero interest, early payoff, no debt and insufficient level benefit.
- Four finite figures with data tables at each supported field extreme and 300/760-pixel render widths. Calendar fields reject fractional ages or years. Related links resolve, articles exceed 700 prose words, and each has six substantive sections.
- Per-article publication/review dates, legacy-date preservation and rejection of invalid or reversed dates.

The full suite passed 638 tests before the final wording clarification. The
subsequent targeted suite and production build are recorded in the release
checks. Generated files are rebuilt before publication.

## Browser checks

An isolated agent-browser session loaded the locally built article pages.
Desktop width 1440 and phone width 390 were inspected. All twelve figure text
bounds fit their SVG view boxes; document width matched the phone viewport.
Screenshots were visually reviewed for the reserve path, residual-allocation
matrix, holdings comparison and mortgage-benefit curves. The browser reported
no page errors.

Controls were exercised for the pension start at 70, invalid fractional age and
reset; a CAD 75,000 withdrawal reaching 60%; a request exceeding the portfolio
showing an unavailable remaining weight and CAD 100,000 unfunded; and a smaller
life benefit showing a negative funding gap. Rendering was allowed to finish
before reading changed results. Screenshots stay under ignored `qa/`.

Final publication checks compare the three live HTML pages and JavaScript
modules with the built bytes, confirm links in the homepage, library and
sitemap, and retain the three previously published wealth/career articles.
The ongoing hourly authoring heartbeat remains active after this batch.
