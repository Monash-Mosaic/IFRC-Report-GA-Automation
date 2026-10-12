/**
 * Build the GA4 report request used for the monthly report.
 */
function buildGA4Request() {
  const dateRanges = [
    { name: 'current', startDate: '28daysAgo', endDate: 'yesterday' },
    { name: 'previous', startDate: '56daysAgo', endDate: '29daysAgo' },
  ];
  return [
    // Metrics by Page Title
    {
      dateRanges,
      dimensions: [{ name: 'pageTitle' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'userEngagementDuration' },
      ],
      metricAggregations: ['TOTAL'],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 100,
    },
    // Metrics by Country
    {
      dateRanges,
      dimensions: [{ name: 'country' }],
      metrics: [
        { name: 'screenPageViews' }, 
        { name: 'activeUsers' },
        { name: 'userEngagementDuration' }
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 100,
    },
    // Download and share count
    {
      dateRanges,
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: { fieldName: 'eventName', inListFilter: { values: ['file_download', 'share'] } },
      },
    },
    // Downloaded files
    {
      dateRanges,
      dimensions: [{ name: 'fileName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'file_download' } },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 100,
    },
  ];
}

/**
 * Fetch metrics from GA4 for the given configuration.
 */
function fetchGA4Metrics(config) {
  if (!config || !config.propertyId) {
    throw new Error('GA4 configuration requires propertyId');
  }

  const response = AnalyticsData.Properties.batchRunReports(
    buildGA4Request(),
    'properties/' + config.propertyId
  );

  return validateGA4Response(response);
}

/** Validate and return the raw GA4 batch response for report mapping. */
function validateGA4Response(response) {
  if (!response || typeof response !== 'object') {
    throw new Error('GA4 response was empty or invalid');
  }

  if (response.error) {
    throw new Error('GA4 response contained an API error');
  }

  if (!Array.isArray(response.reports)) {
    throw new Error('GA4 batch response reports must be an array');
  }

  response.reports.forEach(function(report, reportIndex) {
    if (!report || typeof report !== 'object' ||
        !Array.isArray(report.rows)) {
      throw new Error(
        'GA4 report ' + reportIndex + ' rows must be an array'
      );
    }
  });

  return response;
}
