'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Canned payloads for local shims.
 * These responses are loaded from local dummy data and are not live API data.
 */

/** Load a JSON fixture from the local dummy-data directory. */
function loadDummyResponse(filename) {
  const filePath = path.resolve(__dirname, '..', 'dummyData', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/** Return the expected readable report fixture for local tests. */
function expectedSummary() {
  return loadDummyResponse('expectedSummary.json');
}

/** Return a numbered monthly GA4 fixture for local report tests. */
function monthlyOverviewScenario(number) {
  return loadDummyResponse('monthly-overview' + number + '.json');
}

/** Return a numbered expected report fixture for local report tests. */
function expectedSummaryScenario(number) {
  return loadDummyResponse('expectedSummary' + number + '.json');
}

/** Return the metrics-by-page GA4 fixture for a single report. */
function ga4RunReport() {
  return loadDummyResponse('metrics-by-page.json');
}

/** Return the monthly-overview GA4 fixture for a batch report. */
function ga4BatchRunReports() {
  return loadDummyResponse('monthly-overview.json');
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
  expectedSummary,
  monthlyOverviewScenario,
  expectedSummaryScenario,
};
