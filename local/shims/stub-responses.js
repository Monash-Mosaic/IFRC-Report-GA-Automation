'use strict';

/**
 * Canned payloads for local shims.
 * These are structurally similar to real GA4 / Gemini responses so future
 * src/ code can parse them locally. They are not live API data.
 */

function ga4RunReport() {
  return {
    dimensionHeaders: [{ name: 'date' }, { name: 'sessionDefaultChannelGroup' }],
    metricHeaders: [
      { name: 'sessions', type: 'TYPE_INTEGER' },
      { name: 'activeUsers', type: 'TYPE_INTEGER' },
      { name: 'screenPageViews', type: 'TYPE_INTEGER' },
    ],
    rows: [
      {
        dimensionValues: [{ value: '20260901' }, { value: 'Organic Search' }],
        metricValues: [{ value: '120' }, { value: '80' }, { value: '340' }],
      },
      {
        dimensionValues: [{ value: '20260902' }, { value: 'Direct' }],
        metricValues: [{ value: '95' }, { value: '70' }, { value: '210' }],
      },
    ],
    rowCount: 2,
    metadata: {
      currencyCode: 'AUD',
      timeZone: 'Australia/Melbourne',
    },
    kind: 'analyticsData#runReport',
  };
}

function ga4BatchRunReports() {
  return { reports: [ga4RunReport()] };
}

function geminiGenerateContent() {
  return {
    candidates: [
      {
        content: {
          role: 'model',
          parts: [
            {
              text: 'Local Gemini stub: a report summary would be generated here from the GA4 rows.',
            },
          ],
        },
        finishReason: 'STOP',
      },
    ],
    usageMetadata: {
      promptTokenCount: 1,
      candidatesTokenCount: 1,
      totalTokenCount: 2,
    },
  };
}

module.exports = {
  ga4RunReport,
  ga4BatchRunReports,
  geminiGenerateContent,
};
