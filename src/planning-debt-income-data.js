// Reviewed extract of public official statistics; no private household data.
export const householdDebtSource={
  "publisher": "Statistics Canada",
  "debtTable": "38-10-0238-01",
  "incomeTable": "36-10-0112-01",
  "debtUrl": "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3810023801",
  "incomeUrl": "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3610011201",
  "releaseUrl": "https://www150.statcan.gc.ca/n1/daily-quotidien/260911/dq260911a-eng.htm",
  "debtReleased": "2026-09-11",
  "incomeReleased": "2026-08-28",
  "reviewed": "2026-10-25",
  "geography": "Canada",
  "debtCsvSha256": "bdcb680c7320aa2e671463d4420160bb410b17c5dec6c745d771b96281ba6569",
  "incomeCsvSha256": "5cfe7a3c5a9cd3610faa2d7fd19b591b1cfed01750d0c493568f0c1f25cc7d97",
  "scope": "Credit-market debt is the seasonally adjusted household-sector stock; disposable income is the current-quarter flow at a seasonally adjusted annual rate. This is a ratio of aggregate totals, not a typical household or personal payment burden. Historical values may be revised.",
  "series": {
    "ratio": {
      "source": "debt",
      "dimension": "Categories",
      "label": "Credit market debt to disposable income",
      "vector": "v1038036698",
      "coordinate": "1.11",
      "uom": "Ratio",
      "uom_id": "271",
      "scalar": "units",
      "scalar_id": "0",
      "decimals": "2"
    },
    "debt": {
      "source": "debt",
      "dimension": "Categories",
      "label": "Credit market debt - national balance sheet",
      "vector": "v1038036700",
      "coordinate": "1.13",
      "uom": "Dollars",
      "uom_id": "81",
      "scalar": "millions",
      "scalar_id": "6",
      "decimals": "0"
    },
    "consumer": {
      "source": "debt",
      "dimension": "Categories",
      "label": "Consumer credit - national balance sheet",
      "vector": "v1038036701",
      "coordinate": "1.14",
      "uom": "Dollars",
      "uom_id": "81",
      "scalar": "millions",
      "scalar_id": "6",
      "decimals": "0"
    },
    "nonMortgage": {
      "source": "debt",
      "dimension": "Categories",
      "label": "Non-mortgage loans - national balance sheet",
      "vector": "v1038036702",
      "coordinate": "1.15",
      "uom": "Dollars",
      "uom_id": "81",
      "scalar": "millions",
      "scalar_id": "6",
      "decimals": "0"
    },
    "mortgage": {
      "source": "debt",
      "dimension": "Categories",
      "label": "Mortgages - national balance sheet",
      "vector": "v1038036703",
      "coordinate": "1.16",
      "uom": "Dollars",
      "uom_id": "81",
      "scalar": "millions",
      "scalar_id": "6",
      "decimals": "0"
    },
    "borrowing": {
      "source": "debt",
      "dimension": "Categories",
      "label": "Credit market debt - financial flow",
      "vector": "v95701115",
      "coordinate": "1.7",
      "uom": "Dollars",
      "uom_id": "81",
      "scalar": "millions",
      "scalar_id": "6",
      "decimals": "0"
    },
    "income": {
      "source": "income",
      "dimension": "Estimates",
      "label": "Household disposable income",
      "seasonal_adjustment": "Seasonally adjusted at annual rates",
      "vector": "v62305981",
      "coordinate": "1.1.30",
      "uom": "Dollars",
      "uom_id": "81",
      "scalar": "millions",
      "scalar_id": "6",
      "decimals": "0"
    }
  }
};
export const householdDebtRows=[
  {
    "quarter": "2023 Q3",
    "refDate": "2023-07",
    "ratio": 180.69,
    "debt": 2928056,
    "consumer": 607871,
    "nonMortgage": 133613,
    "mortgage": 2186572,
    "borrowing": 27439,
    "income": 1620528
  },
  {
    "quarter": "2023 Q4",
    "refDate": "2023-10",
    "ratio": 179.93,
    "debt": 2954300,
    "consumer": 615659,
    "nonMortgage": 134162,
    "mortgage": 2204479,
    "borrowing": 27308,
    "income": 1641912
  },
  {
    "quarter": "2024 Q1",
    "refDate": "2024-01",
    "ratio": 179.66,
    "debt": 2979389,
    "consumer": 621261,
    "nonMortgage": 136621,
    "mortgage": 2221507,
    "borrowing": 29516,
    "income": 1658352
  },
  {
    "quarter": "2024 Q2",
    "refDate": "2024-04",
    "ratio": 176.77,
    "debt": 3009203,
    "consumer": 626008,
    "nonMortgage": 139010,
    "mortgage": 2244185,
    "borrowing": 30577,
    "income": 1702296
  },
  {
    "quarter": "2024 Q3",
    "refDate": "2024-07",
    "ratio": 174.13,
    "debt": 3044147,
    "consumer": 633421,
    "nonMortgage": 141366,
    "mortgage": 2269360,
    "borrowing": 36101,
    "income": 1748196
  },
  {
    "quarter": "2024 Q4",
    "refDate": "2024-10",
    "ratio": 174.78,
    "debt": 3085637,
    "consumer": 643200,
    "nonMortgage": 144107,
    "mortgage": 2298330,
    "borrowing": 41353,
    "income": 1765468
  },
  {
    "quarter": "2025 Q1",
    "refDate": "2025-01",
    "ratio": 175.35,
    "debt": 3115474,
    "consumer": 647189,
    "nonMortgage": 143935,
    "mortgage": 2324350,
    "borrowing": 31254,
    "income": 1776756
  },
  {
    "quarter": "2025 Q2",
    "refDate": "2025-04",
    "ratio": 177.34,
    "debt": 3149291,
    "consumer": 652538,
    "nonMortgage": 143783,
    "mortgage": 2352970,
    "borrowing": 35391,
    "income": 1775844
  },
  {
    "quarter": "2025 Q3",
    "refDate": "2025-07",
    "ratio": 177.95,
    "debt": 3185846,
    "consumer": 660559,
    "nonMortgage": 146143,
    "mortgage": 2379144,
    "borrowing": 37456,
    "income": 1790264
  },
  {
    "quarter": "2025 Q4",
    "refDate": "2025-10",
    "ratio": 178.69,
    "debt": 3218940,
    "consumer": 666237,
    "nonMortgage": 147317,
    "mortgage": 2405386,
    "borrowing": 34460,
    "income": 1801452
  },
  {
    "quarter": "2026 Q1",
    "refDate": "2026-01",
    "ratio": 178.55,
    "debt": 3252456,
    "consumer": 672436,
    "nonMortgage": 152465,
    "mortgage": 2427555,
    "borrowing": 34435,
    "income": 1821552
  },
  {
    "quarter": "2026 Q2",
    "refDate": "2026-04",
    "ratio": 176.37,
    "debt": 3280888,
    "consumer": 678683,
    "nonMortgage": 155326,
    "mortgage": 2446879,
    "borrowing": 29421,
    "income": 1860216
  }
];
