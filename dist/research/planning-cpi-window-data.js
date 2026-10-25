// Curated public CPI snapshot; reproduce with scripts/extract-planning-cpi-window.py.
export const cpiWindowData = {
  "publisher": "Statistics Canada; monthly series republished by Bank of Canada",
  "released": "2026-10-19",
  "reviewed": "2026-10-25",
  "retrieved": "2026-10-25T13:52:56.572693-07:00",
  "geography": "Canada",
  "aggregate": "All-items",
  "indexUnit": "Index, 2002=100",
  "precision": "Original source indices and published percentage changes retained at one decimal place.",
  "series": {
    "nsa": "V41690973",
    "sa": "V41690914",
    "publishedYear": "STATIC_TOTALCPICHANGE"
  },
  "scope": "Monthly reference periods September 2025–September 2026. YYYY-MM-01 source dates label monthly periods, not day-one price observations. SA r=1 is a revision flag. Core inflation series are excluded.",
  "sources": [
    {
      "url": "https://www.bankofcanada.ca/valet/observations/group/CPI_MONTHLY/json?start_date=2025-09-01&end_date=2026-09-30",
      "sha256": "0f1f46b3bc12096e69aa21137eeb6ea0b6b71ec7a8bd77834c424924b39395f3"
    },
    {
      "url": "https://www150.statcan.gc.ca/n1/daily-quotidien/261019/t001a-eng.htm",
      "sha256": "19c4b819bc52764b8f09b62e050c201314a394198cec7669df0d337eb83cadf9"
    },
    {
      "url": "https://www150.statcan.gc.ca/n1/daily-quotidien/261019/t003a-eng.htm",
      "sha256": "b584c30337952cd073568efcf87d231be4342123efbd80bb698720ec7953cc7f"
    },
    {
      "url": "https://www150.statcan.gc.ca/n1/daily-quotidien/261019/dq261019a-eng.htm",
      "sha256": "186c1512338294ab1b9ea9e77bbcf56aa345936e6f8c1b8048eda015c1df6077"
    },
    {
      "url": "https://www.bankofcanada.ca/stats/cpi",
      "sha256": "7113d0ee1edf94eb14495286406d31b5a23e6181cc3d84e7a3e5398f5e32dbca"
    },
    {
      "url": "https://www.statcan.gc.ca/en/subjects-start/prices_and_price_indexes/consumer_price_indexes/faq",
      "sha256": "bf806004f8411562e27922a4f01d0b390c2dbbbeb07386bd7a061b4643d95de8"
    }
  ],
  "rows": [
    {
      "reference": "2025-09",
      "nsa": {
        "value": 164.9,
        "original": "164.9",
        "flags": {}
      },
      "sa": {
        "value": 165.0,
        "original": "165.0",
        "flags": {}
      },
      "publishedYear": {
        "value": 2.4,
        "original": "2.4",
        "flags": {}
      }
    },
    {
      "reference": "2025-10",
      "nsa": {
        "value": 165.3,
        "original": "165.3",
        "flags": {}
      },
      "sa": {
        "value": 165.2,
        "original": "165.2",
        "flags": {}
      },
      "publishedYear": {
        "value": 2.2,
        "original": "2.2",
        "flags": {}
      }
    },
    {
      "reference": "2025-11",
      "nsa": {
        "value": 165.4,
        "original": "165.4",
        "flags": {}
      },
      "sa": {
        "value": 165.6,
        "original": "165.6",
        "flags": {}
      },
      "publishedYear": {
        "value": 2.2,
        "original": "2.2",
        "flags": {}
      }
    },
    {
      "reference": "2025-12",
      "nsa": {
        "value": 165.0,
        "original": "165.0",
        "flags": {}
      },
      "sa": {
        "value": 166.1,
        "original": "166.1",
        "flags": {}
      },
      "publishedYear": {
        "value": 2.4,
        "original": "2.4",
        "flags": {}
      }
    },
    {
      "reference": "2026-01",
      "nsa": {
        "value": 165.0,
        "original": "165.0",
        "flags": {}
      },
      "sa": {
        "value": 166.2,
        "original": "166.2",
        "flags": {}
      },
      "publishedYear": {
        "value": 2.3,
        "original": "2.3",
        "flags": {}
      }
    },
    {
      "reference": "2026-02",
      "nsa": {
        "value": 165.9,
        "original": "165.9",
        "flags": {}
      },
      "sa": {
        "value": 166.5,
        "original": "166.5",
        "flags": {}
      },
      "publishedYear": {
        "value": 1.8,
        "original": "1.8",
        "flags": {}
      }
    },
    {
      "reference": "2026-03",
      "nsa": {
        "value": 167.4,
        "original": "167.4",
        "flags": {}
      },
      "sa": {
        "value": 167.3,
        "original": "167.3",
        "flags": {}
      },
      "publishedYear": {
        "value": 2.4,
        "original": "2.4",
        "flags": {}
      }
    },
    {
      "reference": "2026-04",
      "nsa": {
        "value": 168.0,
        "original": "168.0",
        "flags": {}
      },
      "sa": {
        "value": 167.9,
        "original": "167.9",
        "flags": {}
      },
      "publishedYear": {
        "value": 2.8,
        "original": "2.8",
        "flags": {}
      }
    },
    {
      "reference": "2026-05",
      "nsa": {
        "value": 169.6,
        "original": "169.6",
        "flags": {}
      },
      "sa": {
        "value": 168.6,
        "original": "168.6",
        "flags": {}
      },
      "publishedYear": {
        "value": 3.2,
        "original": "3.2",
        "flags": {}
      }
    },
    {
      "reference": "2026-06",
      "nsa": {
        "value": 169.0,
        "original": "169.0",
        "flags": {}
      },
      "sa": {
        "value": 168.5,
        "original": "168.5",
        "flags": {}
      },
      "publishedYear": {
        "value": 2.8,
        "original": "2.8",
        "flags": {}
      }
    },
    {
      "reference": "2026-07",
      "nsa": {
        "value": 169.9,
        "original": "169.9",
        "flags": {}
      },
      "sa": {
        "value": 168.9,
        "original": "168.9",
        "flags": {}
      },
      "publishedYear": {
        "value": 3.0,
        "original": "3.0",
        "flags": {}
      }
    },
    {
      "reference": "2026-08",
      "nsa": {
        "value": 169.8,
        "original": "169.8",
        "flags": {}
      },
      "sa": {
        "value": 169.4,
        "original": "169.4",
        "flags": {
          "r": 1
        }
      },
      "publishedYear": {
        "value": 3.0,
        "original": "3.0",
        "flags": {}
      }
    },
    {
      "reference": "2026-09",
      "nsa": {
        "value": 170.0,
        "original": "170.0",
        "flags": {}
      },
      "sa": {
        "value": 170.0,
        "original": "170.0",
        "flags": {}
      },
      "publishedYear": {
        "value": 3.1,
        "original": "3.1",
        "flags": {}
      }
    }
  ],
  "publishedRates": [
    {
      "label": "September 2026 · 12-month NSA",
      "value": 3.1,
      "original": "3.1",
      "window": "2025-09 to 2026-09",
      "adjustment": "Not seasonally adjusted"
    },
    {
      "label": "September 2026 · 1-month NSA",
      "value": 0.1,
      "original": "0.1",
      "window": "2026-08 to 2026-09",
      "adjustment": "Not seasonally adjusted"
    },
    {
      "label": "September 2026 · 1-month SA",
      "value": 0.4,
      "original": "0.4",
      "window": "2026-08 to 2026-09",
      "adjustment": "Seasonally adjusted"
    }
  ]
};
