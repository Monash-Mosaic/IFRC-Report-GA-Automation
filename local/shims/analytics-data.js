'use strict';

const { ga4BatchRunReports, ga4RunReport } = require('./stub-responses');

/**
 * Stub for the Analytics Data API advanced service (GA4).
 *
 * Does not call Google. Returns canned report objects.
 */

function installAnalyticsData(globalTarget = globalThis) {
  globalTarget.AnalyticsData = {
    Properties: {
      runReport(request, property) {
        console.log('[AnalyticsData.Properties.runReport] stub', property);
        return ga4RunReport();
      },
      batchRunReports(request, property) {
        console.log('[AnalyticsData.Properties.batchRunReports] stub', property);
        return ga4BatchRunReports();
      },
      runRealtimeReport(request, property) {
        console.log('[AnalyticsData.Properties.runRealtimeReport] stub', property);
        return ga4RunReport();
      },
      runPivotReport(request, property) {
        console.log('[AnalyticsData.Properties.runPivotReport] stub', property);
        return ga4RunReport();
      },
    },
  };
}

module.exports = { installAnalyticsData };
