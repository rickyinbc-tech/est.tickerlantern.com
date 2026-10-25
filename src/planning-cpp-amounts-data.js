// Curated public-source figures; reproduce with scripts/extract-planning-cpp-amounts.py.
export const cppAmounts = {
  "publisher": "Employment and Social Development Canada / Service Canada",
  "reviewed": "2026-10-25",
  "unit": "Nominal CAD per month",
  "age": 65,
  "scope": "Retirement pension at age 65 only; average for new beneficiaries in July 2026; maximum for a new pension starting in each labelled month. Not all existing recipients and not a personal entitlement.",
  "average": {
    "reference": "2026-07",
    "population": "New beneficiaries; retirement pension at age 65",
    "value": 858.34,
    "url": "https://www.canada.ca/en/services/benefits/publicpensions/cpp/payment-amounts.html",
    "sha256": "306d489991c3baff794ec97d36103a04c9a6eb0db97af1b071031b5d19dad3d2"
  },
  "maximumSource": {
    "url": "https://open.canada.ca/data/dataset/e547539b-7fc6-4879-be54-3d1f80ac9e9e/resource/b47a541b-2e8a-46e1-9586-4e4b0496eaa7/download/20260101-ntauxm-nmonthrate.csv",
    "dataset": "https://open.canada.ca/data/en/dataset/e547539b-7fc6-4879-be54-3d1f80ac9e9e",
    "sha256": "ba69cb2015745bd5be8d2008d373b34d9a2828bf42f8d3d1361bb4b628fe59c7",
    "encoding": "Windows-1252",
    "column": "Retirement Pension",
    "selection": "2026 January–October. November–December published rows are deliberately omitted from this as-of-October display."
  },
  "maximumRows": [
    {
      "month": 1,
      "reference": "2026-01",
      "sourceMonth": "Jan. / jan.",
      "value": 1507.65
    },
    {
      "month": 2,
      "reference": "2026-02",
      "sourceMonth": "Feb. / fév.",
      "value": 1509.2
    },
    {
      "month": 3,
      "reference": "2026-03",
      "sourceMonth": "Mar. / mar.",
      "value": 1510.76
    },
    {
      "month": 4,
      "reference": "2026-04",
      "sourceMonth": "Apr. / avr.",
      "value": 1512.32
    },
    {
      "month": 5,
      "reference": "2026-05",
      "sourceMonth": "May / mai",
      "value": 1513.88
    },
    {
      "month": 6,
      "reference": "2026-06",
      "sourceMonth": "June / juin",
      "value": 1515.44
    },
    {
      "month": 7,
      "reference": "2026-07",
      "sourceMonth": "Jul. / juil.",
      "value": 1516.99
    },
    {
      "month": 8,
      "reference": "2026-08",
      "sourceMonth": "Aug. / août",
      "value": 1518.55
    },
    {
      "month": 9,
      "reference": "2026-09",
      "sourceMonth": "Sept. / sept.",
      "value": 1520.11
    },
    {
      "month": 10,
      "reference": "2026-10",
      "sourceMonth": "Oct. / oct.",
      "value": 1521.67
    }
  ]
};
