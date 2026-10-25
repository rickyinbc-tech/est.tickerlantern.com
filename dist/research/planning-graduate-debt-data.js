export const graduateDebtSource={
  "table": "37-10-0255-01",
  "releaseDate": "2025-05-02",
  "retrieved": "2026-10-25",
  "classYear": 2020,
  "interviewYear": 2023,
  "url": "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=3710025501",
  "download": "https://www150.statcan.gc.ca/n1/tbl/csv/37100255-eng.zip",
  "csvSha256": "dc36b43d3717c70bc0b4e9f712b1ae54d0fe3a7b43f784f25a9f4ecfa4326741",
  "provinceOfStudy": "Canada (includes the three territories at the national level)",
  "field": "All fields of study",
  "gender": "Total - Gender",
  "debtSource": "Graduates who owed money for their education to any source (government or non-government)",
  "observations": 36,
  "qualityCodes": {
    "A": "Excellent: CV at most 5%",
    "B": "Very good: CV above 5% and at most 15%",
    "C": "Good: CV above 15% and at most 25%"
  },
  "acknowledgement": "Adapted from Statistics Canada, Table 37-10-0255-01. This does not constitute an endorsement by Statistics Canada of this product."
};
export const graduateDebtMeasures={
  "debtShare": "Percentage of graduates who owed debt to the source at graduation",
  "meanAtGrad": "Average debt owed to the source at graduation",
  "medianAtGrad": "Median debt owed to the source at graduation",
  "paidOffShare": "Percentage of graduates with debt who had paid it off at time of interview",
  "meanRemaining": "Average debt remaining at time of interview for those who still owed",
  "medianRemaining": "Median debt remaining at time of interview for those who still owed"
};
export const graduateDebtLevels=[
  {
    "id": 1,
    "label": "All levels of study",
    "short": "All levels",
    "debtShare": {
      "value": 47,
      "quality": "A",
      "vector": "v1583539630",
      "coordinate": "1.1.1.1.1.1",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanAtGrad": {
      "value": 25200,
      "quality": "A",
      "vector": "v1583539631",
      "coordinate": "1.1.1.1.1.2",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianAtGrad": {
      "value": 18800,
      "quality": "A",
      "vector": "v1583539632",
      "coordinate": "1.1.1.1.1.3",
      "unit": "Dollars",
      "decimals": "0"
    },
    "paidOffShare": {
      "value": 33,
      "quality": "A",
      "vector": "v1583539634",
      "coordinate": "1.1.1.1.1.5",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanRemaining": {
      "value": 21600,
      "quality": "A",
      "vector": "v1583539635",
      "coordinate": "1.1.1.1.1.6",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianRemaining": {
      "value": 15000,
      "quality": "A",
      "vector": "v1583539636",
      "coordinate": "1.1.1.1.1.7",
      "unit": "Dollars",
      "decimals": "0"
    }
  },
  {
    "id": 2,
    "label": "College",
    "short": "College",
    "debtShare": {
      "value": 46,
      "quality": "A",
      "vector": "v1583540575",
      "coordinate": "1.2.1.1.1.1",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanAtGrad": {
      "value": 16700,
      "quality": "A",
      "vector": "v1583540576",
      "coordinate": "1.2.1.1.1.2",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianAtGrad": {
      "value": 13500,
      "quality": "B",
      "vector": "v1583540577",
      "coordinate": "1.2.1.1.1.3",
      "unit": "Dollars",
      "decimals": "0"
    },
    "paidOffShare": {
      "value": 32,
      "quality": "A",
      "vector": "v1583540579",
      "coordinate": "1.2.1.1.1.5",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanRemaining": {
      "value": 14200,
      "quality": "A",
      "vector": "v1583540580",
      "coordinate": "1.2.1.1.1.6",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianRemaining": {
      "value": 10000,
      "quality": "A",
      "vector": "v1583540581",
      "coordinate": "1.2.1.1.1.7",
      "unit": "Dollars",
      "decimals": "0"
    }
  },
  {
    "id": 3,
    "label": "Bachelor's",
    "short": "Bachelor's",
    "debtShare": {
      "value": 51,
      "quality": "A",
      "vector": "v1583541520",
      "coordinate": "1.3.1.1.1.1",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanAtGrad": {
      "value": 27900,
      "quality": "A",
      "vector": "v1583541521",
      "coordinate": "1.3.1.1.1.2",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianAtGrad": {
      "value": 21700,
      "quality": "B",
      "vector": "v1583541522",
      "coordinate": "1.3.1.1.1.3",
      "unit": "Dollars",
      "decimals": "0"
    },
    "paidOffShare": {
      "value": 34,
      "quality": "A",
      "vector": "v1583541524",
      "coordinate": "1.3.1.1.1.5",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanRemaining": {
      "value": 23400,
      "quality": "A",
      "vector": "v1583541525",
      "coordinate": "1.3.1.1.1.6",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianRemaining": {
      "value": 17000,
      "quality": "B",
      "vector": "v1583541526",
      "coordinate": "1.3.1.1.1.7",
      "unit": "Dollars",
      "decimals": "0"
    }
  },
  {
    "id": 4,
    "label": "Professional",
    "short": "Professional",
    "debtShare": {
      "value": 80,
      "quality": "B",
      "vector": "v1583542465",
      "coordinate": "1.4.1.1.1.1",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanAtGrad": {
      "value": 86200,
      "quality": "B",
      "vector": "v1583542466",
      "coordinate": "1.4.1.1.1.2",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianAtGrad": {
      "value": 65000,
      "quality": "C",
      "vector": "v1583542467",
      "coordinate": "1.4.1.1.1.3",
      "unit": "Dollars",
      "decimals": "0"
    },
    "paidOffShare": {
      "value": 33,
      "quality": "B",
      "vector": "v1583542469",
      "coordinate": "1.4.1.1.1.5",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanRemaining": {
      "value": 73300,
      "quality": "B",
      "vector": "v1583542470",
      "coordinate": "1.4.1.1.1.6",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianRemaining": {
      "value": 48000,
      "quality": "C",
      "vector": "v1583542471",
      "coordinate": "1.4.1.1.1.7",
      "unit": "Dollars",
      "decimals": "0"
    }
  },
  {
    "id": 5,
    "label": "Master's",
    "short": "Master's",
    "debtShare": {
      "value": 44,
      "quality": "A",
      "vector": "v1583543410",
      "coordinate": "1.5.1.1.1.1",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanAtGrad": {
      "value": 33300,
      "quality": "A",
      "vector": "v1583543411",
      "coordinate": "1.5.1.1.1.2",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianAtGrad": {
      "value": 25000,
      "quality": "A",
      "vector": "v1583543412",
      "coordinate": "1.5.1.1.1.3",
      "unit": "Dollars",
      "decimals": "0"
    },
    "paidOffShare": {
      "value": 34,
      "quality": "A",
      "vector": "v1583543414",
      "coordinate": "1.5.1.1.1.5",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanRemaining": {
      "value": 30100,
      "quality": "B",
      "vector": "v1583543415",
      "coordinate": "1.5.1.1.1.6",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianRemaining": {
      "value": 20000,
      "quality": "A",
      "vector": "v1583543416",
      "coordinate": "1.5.1.1.1.7",
      "unit": "Dollars",
      "decimals": "0"
    }
  },
  {
    "id": 6,
    "label": "Doctorate",
    "short": "Doctorate",
    "debtShare": {
      "value": 32,
      "quality": "A",
      "vector": "v1583544355",
      "coordinate": "1.6.1.1.1.1",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanAtGrad": {
      "value": 38200,
      "quality": "A",
      "vector": "v1583544356",
      "coordinate": "1.6.1.1.1.2",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianAtGrad": {
      "value": 27000,
      "quality": "A",
      "vector": "v1583544357",
      "coordinate": "1.6.1.1.1.3",
      "unit": "Dollars",
      "decimals": "0"
    },
    "paidOffShare": {
      "value": 30,
      "quality": "A",
      "vector": "v1583544359",
      "coordinate": "1.6.1.1.1.5",
      "unit": "Percent",
      "decimals": "0"
    },
    "meanRemaining": {
      "value": 34400,
      "quality": "A",
      "vector": "v1583544360",
      "coordinate": "1.6.1.1.1.6",
      "unit": "Dollars",
      "decimals": "0"
    },
    "medianRemaining": {
      "value": 21000,
      "quality": "B",
      "vector": "v1583544361",
      "coordinate": "1.6.1.1.1.7",
      "unit": "Dollars",
      "decimals": "0"
    }
  }
];
