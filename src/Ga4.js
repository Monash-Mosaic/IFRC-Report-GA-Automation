/**
 * Build the GA4 report request used for the monthly report.
 */
function buildGA4Request() {
  const dateRanges = [
    { name: 'current', startDate: '30daysAgo', endDate: 'yesterday' },
    { name: 'previous', startDate: '60daysAgo', endDate: '31daysAgo' },
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

  return mapGA4Response(response);
}

/** Map the GA4 response to [{ source, activeUsers, conversions }] */
function mapGA4Response(response) {
  if (!response || typeof response !== 'object') {
    throw new Error('GA4 response was empty or invalid');
  }

  if (response.error) {
    throw new Error('GA4 response contained an API error');
  }

  if (response.rows == null) {
    return [];
  }

  if (!Array.isArray(response.rows)) {
    throw new Error('GA4 response rows must be an array');
  }

  const dimensionIndexes = indexHeaders(response.dimensionHeaders);
  const metricIndexes = indexHeaders(response.metricHeaders);

  return response.rows.map(function(row, rowIndex) {
    if (!row || !Array.isArray(row.dimensionValues) ||
        !Array.isArray(row.metricValues)) {
      throw new Error('GA4 row ' + rowIndex + ' has an invalid shape');
    }

    const source = getRowValue(
      row.dimensionValues,
      dimensionIndexes.sessionSourceMedium,
      'sessionSourceMedium',
      rowIndex
    );
    const activeUsers = getNumericRowValue(
      row.metricValues,
      metricIndexes.activeUsers,
      'activeUsers',
      rowIndex
    );
    const conversions = getNumericRowValue(
      row.metricValues,
      metricIndexes.conversions,
      'conversions',
      rowIndex
    );

    return {
      source: source,
      activeUsers: activeUsers,
      conversions: conversions
    };
  });
}

/** Index the headers by name for efficient lookup. */
function indexHeaders(headers) {
  const indexes = {};

  if (!Array.isArray(headers)) {
    return indexes;
  }

  headers.forEach(function(header, index) {
    if (header && typeof header.name === 'string') {
      indexes[header.name] = index;
    }
  });

  return indexes;
}

/** Get the value of a row at the specified index. */
function getRowValue(values, index, name, rowIndex) {
  if (index == null || !values[index] ||
      values[index].value == null ||
      String(values[index].value).trim() === '') {
    throw new Error(
      'GA4 row ' + rowIndex + ' is missing dimension: ' + name
    );
  }

  return String(values[index].value);
}

/** Get the numeric value of a row at the specified index. */
function getNumericRowValue(values, index, name, rowIndex) {
  if (index == null || !values[index] || values[index].value == null ||
      String(values[index].value).trim() === '') {
    throw new Error(
      'GA4 row ' + rowIndex + ' is missing metric: ' + name
    );
  }

  const value = Number(values[index].value);

  if (!Number.isFinite(value)) {
    throw new Error(
      'GA4 row ' + rowIndex + ' has an invalid metric: ' + name
    );
  }

  return value;
}
