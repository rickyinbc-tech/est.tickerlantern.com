// Generated from the public CSCE 2026 Q3 report and its linked categorical AI-work groups.
export const aiTimeSource = {
  "reportUrl": "https://www.bankofcanada.ca/2026/10/canadian-survey-of-consumer-expectations-third-quarter-of-2026/",
  "reportSha256": "dc1006f9ca985657780003b4d48940ca555ba0ee0ca26be8c0863a5ea64fb5c4",
  "releaseDate": "2026-10-19",
  "referenceQuarter": "2026 Q3",
  "onlineCollection": [
    "2026-08-05",
    "2026-08-27"
  ],
  "followUpInterviews": [
    "2026-08-24",
    "2026-09-04"
  ],
  "retrieved": "2026-10-25",
  "grain": "Categorical panel rows, not daily observations; k is the Category dimension.",
  "groups": [
    {
      "id": "CSCE_2026Q3_C1A",
      "url": "https://www.bankofcanada.ca/valet/observations/group/CSCE_2026Q3_C1A/json",
      "sha256": "de7ac650c675b3dc700d98ba6b06d8603bcc83567b4a987411095f9e59855867",
      "title": "Chart 1-A: Workers who use AI say it saves them hours of work",
      "seriesId": "CSCE_2026Q3_C1A_S1",
      "sourceUnits": "Hours per week",
      "dimension": {
        "key": "k",
        "name": "Category"
      },
      "apiDateFormatHint": "daily",
      "questionAndStatistic": "How often do you usually use AI for your main job in a typical week? On average, how much time did you spend actively using AI at work for your main job? Imagine that in a usual week (Monday to Sunday) you did not have access to AI. How many additional hours of work would you have needed to complete the same amount of work? (Hours per week, interpolated median)",
      "notes": "Note: Weekly active time using artificial intelligence (AI) is estimated for each respondent by multiplying the midpoint of their reported time spent actively using AI per day at their main job by how often they typically use AI in a week at that job. For the open-ended category of more than 6 hours, 7.5 hours is used. The chart shows the interpolated median of these weekly estimates.",
      "rows": [
        {
          "label": "Active time using AI",
          "value": 2.8,
          "publishedText": "2.8"
        },
        {
          "label": "Additional time needed to complete tasks without AI",
          "value": 4.7,
          "publishedText": "4.7"
        }
      ]
    },
    {
      "id": "CSCE_2026Q3_C1B",
      "url": "https://www.bankofcanada.ca/valet/observations/group/CSCE_2026Q3_C1B/json",
      "sha256": "045e9ec88a36e68eab61a925eb7e3e7287491e2148c3c08e9c16d2312b0ddda3",
      "title": "Chart 1-B: Workers use saved time to increase the quality and quantity of their work",
      "seriesId": "CSCE_2026Q3_C1B_S1",
      "sourceUnits": "Share of respondents",
      "dimension": {
        "key": "k",
        "name": "Category"
      },
      "apiDateFormatHint": "daily",
      "questionAndStatistic": "How have you leveraged the extra time AI has helped you save? Please check all that apply.  (Share of respondents)",
      "notes": "",
      "rows": [
        {
          "label": "Improve the quality of my tasks",
          "value": 54.64,
          "publishedText": "54.64"
        },
        {
          "label": "Take on more tasks",
          "value": 53.0,
          "publishedText": "53.00"
        },
        {
          "label": "Improve work-life balance",
          "value": 36.62,
          "publishedText": "36.62"
        },
        {
          "label": "Spend more time learning or training others",
          "value": 35.23,
          "publishedText": "35.23"
        },
        {
          "label": "Do more innovative or creative work",
          "value": 29.71,
          "publishedText": "29.71"
        }
      ]
    }
  ]
};
