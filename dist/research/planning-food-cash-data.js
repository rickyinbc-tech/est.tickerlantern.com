// Reviewed small extract of public official CSV; no private household records.
export const foodSecuritySource={
  "publisher": "Statistics Canada",
  "table": "13-10-0835-01",
  "url": "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1310083501",
  "csvUrl": "https://www150.statcan.gc.ca/n1/tbl/csv/13100835-eng.zip",
  "releaseUrl": "https://www150.statcan.gc.ca/n1/daily-quotidien/260429/dq260429a-eng.htm",
  "released": "2026-04-29",
  "reviewed": "2026-10-25",
  "geography": "Canada",
  "demographic": "All persons",
  "unit": "Percentage of persons",
  "sourceCsvSha256": "024f3363b787f269a5b3472dedfa21c45e919ec6dceb7a32d884c5bc96d9d0db",
  "seriesMetadata": {
    "total": {
      "vector": "v1529611793",
      "coordinate": "1.1.6.2",
      "unit": "Percent",
      "scalar": "units"
    },
    "marginal": {
      "vector": "v1288342807",
      "coordinate": "1.1.2.2",
      "unit": "Percent",
      "scalar": "units"
    },
    "moderate": {
      "vector": "v1288342811",
      "coordinate": "1.1.4.2",
      "unit": "Percent",
      "scalar": "units"
    },
    "severe": {
      "vector": "v1288342813",
      "coordinate": "1.1.5.2",
      "unit": "Percent",
      "scalar": "units"
    },
    "moderateSevere": {
      "vector": "v1288342809",
      "coordinate": "1.1.3.2",
      "unit": "Percent",
      "scalar": "units"
    }
  },
  "latestFoodInsecurePersons": 9755600,
  "latestCountQuality": "A",
  "scope": "Persons living in households classified by food security status. Current revised 2018\u20132024 series; national estimates include territories. Reference-year 2024 responses were collected January\u2013June 2025 about the previous twelve months. Not percentages of households or individual risk probabilities."
};
export const foodSecurityRows=[
  {
    "year": 2018,
    "total": 16.8,
    "marginal": 5.2,
    "moderate": 8.0,
    "severe": 3.6,
    "moderateSevere": 11.7,
    "quality": {
      "total": "B",
      "marginal": "C",
      "moderate": "B",
      "severe": "B",
      "moderateSevere": "B"
    }
  },
  {
    "year": 2019,
    "total": 16.0,
    "marginal": 5.1,
    "moderate": 7.6,
    "severe": 3.3,
    "moderateSevere": 10.9,
    "quality": {
      "total": "B",
      "marginal": "C",
      "moderate": "B",
      "severe": "C",
      "moderateSevere": "B"
    }
  },
  {
    "year": 2020,
    "total": 15.8,
    "marginal": 4.6,
    "moderate": 7.6,
    "severe": 3.6,
    "moderateSevere": 11.2,
    "quality": {
      "total": "B",
      "marginal": "B",
      "moderate": "B",
      "severe": "C",
      "moderateSevere": "B"
    }
  },
  {
    "year": 2021,
    "total": 18.5,
    "marginal": 5.6,
    "moderate": 8.9,
    "severe": 4.0,
    "moderateSevere": 12.9,
    "quality": {
      "total": "A",
      "marginal": "B",
      "moderate": "B",
      "severe": "C",
      "moderateSevere": "B"
    }
  },
  {
    "year": 2022,
    "total": 23.1,
    "marginal": 6.0,
    "moderate": 11.0,
    "severe": 6.1,
    "moderateSevere": 17.0,
    "quality": {
      "total": "A",
      "marginal": "B",
      "moderate": "B",
      "severe": "B",
      "moderateSevere": "A"
    }
  },
  {
    "year": 2023,
    "total": 25.7,
    "marginal": 6.3,
    "moderate": 12.5,
    "severe": 6.9,
    "moderateSevere": 19.4,
    "quality": {
      "total": "A",
      "marginal": "B",
      "moderate": "B",
      "severe": "B",
      "moderateSevere": "A"
    }
  },
  {
    "year": 2024,
    "total": 24.0,
    "marginal": 5.6,
    "moderate": 11.9,
    "severe": 6.5,
    "moderateSevere": 18.4,
    "quality": {
      "total": "A",
      "marginal": "B",
      "moderate": "B",
      "severe": "B",
      "moderateSevere": "B"
    }
  }
];
