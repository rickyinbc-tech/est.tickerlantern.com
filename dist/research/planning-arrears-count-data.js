// Reviewed small public Valet extract, no private credit records.
export const arrearsCountSource={
  "publisher": "Bank of Canada",
  "url": "https://www.bankofcanada.ca/rates/indicators/financial-stability-indicators/",
  "notesUrl": "https://www.bankofcanada.ca/rates/indicators/financial-stability-indicators/notes-on-the-financial-stability-indicators/",
  "csvUrl": "https://www.bankofcanada.ca/valet/observations/group/FVI_HOUSEHOLD_CREDIT_PERFORMANCE/csv",
  "jsonUrl": "https://www.bankofcanada.ca/valet/observations/group/FVI_HOUSEHOLD_CREDIT_PERFORMANCE/json",
  "updated": "2026-09-25",
  "reviewed": "2026-10-25",
  "group": {
    "label": "Household credit performance",
    "description": "Sources: TransUnion and Bank of Canada calculations",
    "link": "https://www.bankofcanada.ca/?p=229200",
    "metadata": {}
  },
  "latestQuarter": "2026Q2",
  "unit": "Percent",
  "provider": "TransUnion and Bank of Canada calculations",
  "adjustment": "X-13 seasonal adjustment by Bank of Canada",
  "sourceCsvSha256": "5ba4fe1d341b1f0cf257aae2498b54409d64c7e3afd771111d53a2726d3706b1",
  "seriesMetadata": {
    "FVI_FIN_STRESS": {
      "label": "Rates of financial stress",
      "description": "Share of indebted households behind on payments for at least 60 days in any credit category (%)",
      "dimension": {
        "key": "d",
        "name": "Date"
      },
      "dateFormat": "quarterly",
      "metadata": {}
    },
    "FVI_LOANS_ARR_MTG": {
      "label": "Mortgages",
      "description": "Rates of loans in arrears (%), by product type\u2014Mortgages",
      "dimension": {
        "key": "d",
        "name": "Date"
      },
      "dateFormat": "quarterly",
      "metadata": {}
    },
    "FVI_LOANS_ARR_AUTO": {
      "label": "Automobile loans",
      "description": "Rates of loans in arrears (%), by product type\u2014Automobile loans",
      "dimension": {
        "key": "d",
        "name": "Date"
      },
      "dateFormat": "quarterly",
      "metadata": {}
    },
    "FVI_LOANS_ARR_CC": {
      "label": "Credit cards",
      "description": "Rates of loans in arrears (%), by product type\u2014Credit cards",
      "dimension": {
        "key": "d",
        "name": "Date"
      },
      "dateFormat": "quarterly",
      "metadata": {}
    },
    "FVI_LOANS_ARR_HELOC": {
      "label": "Home equity lines of credit",
      "description": "Rates of loans in arrears (%), by product type\u2014Home equity lines of credit",
      "dimension": {
        "key": "d",
        "name": "Date"
      },
      "dateFormat": "quarterly",
      "metadata": {}
    },
    "FVI_LOANS_ARR_LOC": {
      "label": "Unsecured lines of credit",
      "description": "Rates of loans in arrears (%), by product type\u2014Unsecured lines of credit",
      "dimension": {
        "key": "d",
        "name": "Date"
      },
      "dateFormat": "quarterly",
      "metadata": {}
    },
    "FVI_LOANS_ARR_INSTALL": {
      "label": "Instalment loans",
      "description": "Rates of loans in arrears (%), by product type\u2014Instalment loans",
      "dimension": {
        "key": "d",
        "name": "Date"
      },
      "dateFormat": "quarterly",
      "metadata": {}
    }
  },
  "definition": "Current public chart: share of indebted borrowers with at least one account 60+ days late. Product rates: share of loans in each product class 90+ days late.",
  "namingCaveat": "FVI_FIN_STRESS downloadable description uses households; the current public chart explicitly defines indebted borrowers. No household aggregation is reconstructed.",
  "coverageLimitations": "Exact lender list, coverage fraction, joint-account handling, original counts, detailed population exclusions and within-quarter timing are not established in these public notes. These are published TransUnion-based Canadian indicators, not all lenders/all Canadians or CBA-equivalent counts."
};
export const arrearsCountRows=[
  {
    "quarter": "2023Q3",
    "apiDateKey": "2023-07-01",
    "values": {
      "FVI_FIN_STRESS": 1.83,
      "FVI_LOANS_ARR_MTG": 0.13,
      "FVI_LOANS_ARR_AUTO": 0.61,
      "FVI_LOANS_ARR_CC": 0.66,
      "FVI_LOANS_ARR_HELOC": 0.11,
      "FVI_LOANS_ARR_LOC": 0.26,
      "FVI_LOANS_ARR_INSTALL": 1.77
    }
  },
  {
    "quarter": "2023Q4",
    "apiDateKey": "2023-10-01",
    "values": {
      "FVI_FIN_STRESS": 1.88,
      "FVI_LOANS_ARR_MTG": 0.14,
      "FVI_LOANS_ARR_AUTO": 0.62,
      "FVI_LOANS_ARR_CC": 0.68,
      "FVI_LOANS_ARR_HELOC": 0.11,
      "FVI_LOANS_ARR_LOC": 0.28,
      "FVI_LOANS_ARR_INSTALL": 1.82
    }
  },
  {
    "quarter": "2024Q1",
    "apiDateKey": "2024-01-01",
    "values": {
      "FVI_FIN_STRESS": 1.93,
      "FVI_LOANS_ARR_MTG": 0.15,
      "FVI_LOANS_ARR_AUTO": 0.6,
      "FVI_LOANS_ARR_CC": 0.71,
      "FVI_LOANS_ARR_HELOC": 0.12,
      "FVI_LOANS_ARR_LOC": 0.3,
      "FVI_LOANS_ARR_INSTALL": 1.83
    }
  },
  {
    "quarter": "2024Q2",
    "apiDateKey": "2024-04-01",
    "values": {
      "FVI_FIN_STRESS": 2.0,
      "FVI_LOANS_ARR_MTG": 0.15,
      "FVI_LOANS_ARR_AUTO": 0.6,
      "FVI_LOANS_ARR_CC": 0.74,
      "FVI_LOANS_ARR_HELOC": 0.12,
      "FVI_LOANS_ARR_LOC": 0.33,
      "FVI_LOANS_ARR_INSTALL": 1.91
    }
  },
  {
    "quarter": "2024Q3",
    "apiDateKey": "2024-07-01",
    "values": {
      "FVI_FIN_STRESS": 2.05,
      "FVI_LOANS_ARR_MTG": 0.16,
      "FVI_LOANS_ARR_AUTO": 0.63,
      "FVI_LOANS_ARR_CC": 0.75,
      "FVI_LOANS_ARR_HELOC": 0.12,
      "FVI_LOANS_ARR_LOC": 0.36,
      "FVI_LOANS_ARR_INSTALL": 2.05
    }
  },
  {
    "quarter": "2024Q4",
    "apiDateKey": "2024-10-01",
    "values": {
      "FVI_FIN_STRESS": 2.08,
      "FVI_LOANS_ARR_MTG": 0.17,
      "FVI_LOANS_ARR_AUTO": 0.68,
      "FVI_LOANS_ARR_CC": 0.76,
      "FVI_LOANS_ARR_HELOC": 0.12,
      "FVI_LOANS_ARR_LOC": 0.37,
      "FVI_LOANS_ARR_INSTALL": 2.19
    }
  },
  {
    "quarter": "2025Q1",
    "apiDateKey": "2025-01-01",
    "values": {
      "FVI_FIN_STRESS": 2.13,
      "FVI_LOANS_ARR_MTG": 0.18,
      "FVI_LOANS_ARR_AUTO": 0.72,
      "FVI_LOANS_ARR_CC": 0.77,
      "FVI_LOANS_ARR_HELOC": 0.11,
      "FVI_LOANS_ARR_LOC": 0.37,
      "FVI_LOANS_ARR_INSTALL": 2.28
    }
  },
  {
    "quarter": "2025Q2",
    "apiDateKey": "2025-04-01",
    "values": {
      "FVI_FIN_STRESS": 2.1,
      "FVI_LOANS_ARR_MTG": 0.19,
      "FVI_LOANS_ARR_AUTO": 0.71,
      "FVI_LOANS_ARR_CC": 0.76,
      "FVI_LOANS_ARR_HELOC": 0.11,
      "FVI_LOANS_ARR_LOC": 0.38,
      "FVI_LOANS_ARR_INSTALL": 2.29
    }
  },
  {
    "quarter": "2025Q3",
    "apiDateKey": "2025-07-01",
    "values": {
      "FVI_FIN_STRESS": 2.11,
      "FVI_LOANS_ARR_MTG": 0.2,
      "FVI_LOANS_ARR_AUTO": 0.74,
      "FVI_LOANS_ARR_CC": 0.76,
      "FVI_LOANS_ARR_HELOC": 0.11,
      "FVI_LOANS_ARR_LOC": 0.37,
      "FVI_LOANS_ARR_INSTALL": 2.4
    }
  },
  {
    "quarter": "2025Q4",
    "apiDateKey": "2025-10-01",
    "values": {
      "FVI_FIN_STRESS": 2.16,
      "FVI_LOANS_ARR_MTG": 0.21,
      "FVI_LOANS_ARR_AUTO": 0.76,
      "FVI_LOANS_ARR_CC": 0.78,
      "FVI_LOANS_ARR_HELOC": 0.11,
      "FVI_LOANS_ARR_LOC": 0.38,
      "FVI_LOANS_ARR_INSTALL": 2.48
    }
  },
  {
    "quarter": "2026Q1",
    "apiDateKey": "2026-01-01",
    "values": {
      "FVI_FIN_STRESS": 2.16,
      "FVI_LOANS_ARR_MTG": 0.22,
      "FVI_LOANS_ARR_AUTO": 0.8,
      "FVI_LOANS_ARR_CC": 0.78,
      "FVI_LOANS_ARR_HELOC": 0.11,
      "FVI_LOANS_ARR_LOC": 0.39,
      "FVI_LOANS_ARR_INSTALL": 2.52
    }
  },
  {
    "quarter": "2026Q2",
    "apiDateKey": "2026-04-01",
    "values": {
      "FVI_FIN_STRESS": 2.23,
      "FVI_LOANS_ARR_MTG": 0.23,
      "FVI_LOANS_ARR_AUTO": 0.87,
      "FVI_LOANS_ARR_CC": 0.8,
      "FVI_LOANS_ARR_HELOC": 0.11,
      "FVI_LOANS_ARR_LOC": 0.4,
      "FVI_LOANS_ARR_INSTALL": 2.95
    }
  }
];
