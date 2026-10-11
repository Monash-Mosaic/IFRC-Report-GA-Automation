'use strict';

/**
 * Canned payloads for local shims.
 * These are structurally similar to real GA4 / Gemini responses so future
 * src/ code can parse them locally. They are not live API data.
 */

function ga4RunReport() {
  return {
    dimensionHeaders: [{ name: 'sessionSourceMedium' }],
    metricHeaders: [
      { name: 'activeUsers', type: 'TYPE_INTEGER' },
      { name: 'conversions', type: 'TYPE_FLOAT' },
    ],
    rows: [
      {
        dimensionValues: [{ value: 'google / organic' }],
        metricValues: [{ value: '80' }, { value: '12' }],
      },
      {
        dimensionValues: [{ value: '(direct) / (none)' }],
        metricValues: [{ value: '70' }, { value: '8' }],
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
