// Bounded extract of public Bank of Canada CSCE observations; no respondent records.
export const paymentPerceptionSource = {
  "surveyUrl": "https://www.bankofcanada.ca/publications/canadian-survey-of-consumer-expectations/canadian-survey-of-consumer-expectations-survey-data/",
  "dataUrl": "https://www.bankofcanada.ca/valet/observations/group/CES_C14_DEMOGRAPHICS/json?start_date=2025-07-01&end_date=2026-09-30",
  "reportUrl": "https://www.bankofcanada.ca/2026/10/canadian-survey-of-consumer-expectations-third-quarter-of-2026/",
  "methodologyUrl": "https://www.bankofcanada.ca/wp-content/uploads/2025/07/sdp2025-11.pdf#page=20",
  "methodologyLocation": "Table A-1, printed page 17; PDF page 20, visually inspected 25 October 2026",
  "methodologyPdfSha256": "c11f0954cf9a0aaf58ea0c973b207555a116fd56049550751fdedb64a9178054",
  "statistic": "Interpolated median of respondents’ self-assessed probabilities; raw probability, without the inversion used in the composite index",
  "series": "CES_C14_MISS_DEBT",
  "questionHorizon": "Next three months",
  "sourceUnits": "Percent, not fractions",
  "referenceQuarter": "2026 Q3",
  "releaseDate": "2026-10-19",
  "onlineCollection": [
    "2026-08-05",
    "2026-08-27"
  ],
  "followUpInterviews": [
    "2026-08-24",
    "2026-09-04"
  ],
  "retrieved": "2026-10-25",
  "dateKeyMeaning": "Quarter-start index key, not interview or publication date",
  "surveyHtmlSha256": "49e427e5a2f710ab541643bc7a5966ba40a767314e7cc079fcfa8a7db80cc4c2",
  "dataJsonSha256": "d624286c5c6822349ee5ef03fbda7d29cf583c5bd18e179791b314f8ecba5484",
  "reportHtmlSha256": "dc1006f9ca985657780003b4d48940ca555ba0ee0ca26be8c0863a5ea64fb5c4",
  "rows": [
    {
      "dateKey": "2025-07-01",
      "quarter": "2025 Q3",
      "value": 5.78
    },
    {
      "dateKey": "2025-10-01",
      "quarter": "2025 Q4",
      "value": 9.49
    },
    {
      "dateKey": "2026-01-01",
      "quarter": "2026 Q1",
      "value": 9.24
    },
    {
      "dateKey": "2026-04-01",
      "quarter": "2026 Q2",
      "value": 7.37
    },
    {
      "dateKey": "2026-07-01",
      "quarter": "2026 Q3",
      "value": 5.29
    }
  ]
};
