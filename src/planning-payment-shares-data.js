// Reviewed small extract of public Bank of Canada Valet data.
export const paymentShareSource={
  "publisher": "Bank of Canada",
  "url": "https://www.bankofcanada.ca/banknotes/bank-notes-research-reports/methods-of-payment-survey/",
  "volumeCsvUrl": "https://www.bankofcanada.ca/valet/observations/group/METHODS_OF_PAYMENT_SURVEY_VOLUME_SHARES/csv",
  "valueCsvUrl": "https://www.bankofcanada.ca/valet/observations/group/METHODS_OF_PAYMENT_SURVEY_VALUE_SHARES/csv",
  "reportUrl": "https://www.bankofcanada.ca/2026/08/staff-analytical-paper-2026-36/",
  "reportPublicationMonth": "2026-08",
  "referenceYear": 2025,
  "reviewed": "2026-10-25",
  "unit": "Percent",
  "countCsvSha256": "421114cf7465c365da3991e362a4a0c02935f2d909205f642f40a8194ae6c0ed",
  "valueCsvSha256": "c109646029e450aa1d93861678805e373435197476407d651a97716136dff2fb",
  "scope": "Consumer purchase payment shares in the dashboard\u2019s 2025 survey data. Volume counts transactions; value weights purchase dollars. The dashboard describes a questionnaire and three-day diary. Not all payments in the economy, income shares, ownership rates or personal risk probabilities. Detailed latest sample/exclusions are not established from the reviewed HTML/CSV.",
  "categoryBreak": "In 2025 contactless physical cards and cards linked to mobile devices have separate bins. The 2025 mobile-app bin excludes mobile contactless card purchases; categories cannot be fully harmonized with earlier years. Standalone Credit/Debit bins do not include their separately listed contactless categories."
};
export const paymentShareRows=[
  {
    "label": "Cash",
    "key": "CASH",
    "countShare": 17.9,
    "valueShare": 9.6,
    "countSeries": "MOP_PAYMENT_VOLUME_CASH",
    "valueSeries": "MOP_PAYMENT_VALUE_CASH",
    "referenceYear": 2025,
    "apiDateKey": "2025-01-01"
  },
  {
    "label": "Credit",
    "key": "CREDIT",
    "countShare": 14.2,
    "valueShare": 26.2,
    "countSeries": "MOP_PAYMENT_VOLUME_CREDIT",
    "valueSeries": "MOP_PAYMENT_VALUE_CREDIT",
    "referenceYear": 2025,
    "apiDateKey": "2025-01-01"
  },
  {
    "label": "Contactless credit",
    "key": "CTCC",
    "countShare": 26.0,
    "valueShare": 26.2,
    "countSeries": "MOP_PAYMENT_VOLUME_CTCC",
    "valueSeries": "MOP_PAYMENT_VALUE_CTCC",
    "referenceYear": 2025,
    "apiDateKey": "2025-01-01"
  },
  {
    "label": "Contactless credit, mobile",
    "key": "CTCCM",
    "countShare": 8.0,
    "valueShare": 6.1,
    "countSeries": "MOP_PAYMENT_VOLUME_CTCCM",
    "valueSeries": "MOP_PAYMENT_VALUE_CTCCM",
    "referenceYear": 2025,
    "apiDateKey": "2025-01-01"
  },
  {
    "label": "Debit",
    "key": "DEBIT",
    "countShare": 6.7,
    "valueShare": 9.4,
    "countSeries": "MOP_PAYMENT_VOLUME_DEBIT",
    "valueSeries": "MOP_PAYMENT_VALUE_DEBIT",
    "referenceYear": 2025,
    "apiDateKey": "2025-01-01"
  },
  {
    "label": "Contactless debit",
    "key": "CTDC",
    "countShare": 16.0,
    "valueShare": 12.8,
    "countSeries": "MOP_PAYMENT_VOLUME_CTDC",
    "valueSeries": "MOP_PAYMENT_VALUE_CTDC",
    "referenceYear": 2025,
    "apiDateKey": "2025-01-01"
  },
  {
    "label": "Contactless debit, mobile",
    "key": "CTDCM",
    "countShare": 2.7,
    "valueShare": 2.0,
    "countSeries": "MOP_PAYMENT_VOLUME_CTDCM",
    "valueSeries": "MOP_PAYMENT_VALUE_CTDCM",
    "referenceYear": 2025,
    "apiDateKey": "2025-01-01"
  },
  {
    "label": "Mobile app",
    "key": "MOBILE",
    "countShare": 2.3,
    "valueShare": 1.3,
    "countSeries": "MOP_PAYMENT_VOLUME_MOBILE",
    "valueSeries": "MOP_PAYMENT_VALUE_MOBILE",
    "referenceYear": 2025,
    "apiDateKey": "2025-01-01"
  },
  {
    "label": "Other",
    "key": "OTHER",
    "countShare": 6.2,
    "valueShare": 6.5,
    "countSeries": "MOP_PAYMENT_VOLUME_OTHER",
    "valueSeries": "MOP_PAYMENT_VALUE_OTHER",
    "referenceYear": 2025,
    "apiDateKey": "2025-01-01"
  }
];
