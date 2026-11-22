// The one published fund figure the toolkit uses, at Ricky's instruction
// (2026-11-22): the fund's own 10-year trailing return as published by RBC
// Global Asset Management. It is copied, not calculated. It seeds the GIC
// comparison's fund-return slider as an illustrative, editable assumption.
// Verified on the official fund page (Series A selected), Trailing returns %
// table, 10 yr column. Update all fields together when the page changes.
// nameZh is this site's Simplified Chinese rendering: no RBC GAM Chinese name
// was found (2026-11-22), so the source list also keeps the official English name.
export const FUND_SAMPLE = {
  name: 'RBC Select Balanced Portfolio',
  nameZh: 'RBC精选平衡投资组合',
  series: 'A',
  code: 'RBF460',
  tenYearPct: 6.6,
  asOf: '2026-10-31',
  publisher: 'RBC Global Asset Management',
  url: 'https://www.rbcgam.com/en/ca/products/mutual-funds/RBF460/detail',
  retrieved: '2026-11-22',
  // The fund's monthly update (same as-of date), "Highest/lowest returns (%)"
  // table, 10 yr column, based on data since the fund's inception.
  monthly: {
    url: 'https://www.rbcgam.com/documents/fund-pages/monthly/rbf460_e.pdf',
    sha256: '28596bac4f03928515fa4e2e55109db0f25d70f24087acbb0e274c5bb1166392'
  },
  tenYearHistory: { inception: 1986, lowPct: 2.1, lowEnded: '2010-08', highPct: 10.5, highEnded: '2000-08', averagePct: 6.3, periods: 359 }
};
