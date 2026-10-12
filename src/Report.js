/**
 * Convert raw GA4 batch reports into descriptive data for Gemini.
 */
function summarizeMetrics(response) {
  validateGA4ReportData(response);

  const reports = response.reports;
  const summary = {
    hasData: reports.some(function(report) {
      return report.rows.length > 0;
    }),
    pagePerformanceTotals: mapTotals(
      reports[0],
      ['screenPageViews', 'activeUsers', 'sessions',
        'userEngagementDuration'],
      {
        screenPageViews: 'pageViews',
        activeUsers: 'activeUsers',
        sessions: 'sessions',
        userEngagementDuration: 'engagementTimeSeconds'
      }
    ),
    pagePerformance: mapReport(
      reports[0],
      'pageTitle',
      ['screenPageViews', 'activeUsers', 'sessions', 'userEngagementDuration'],
      {
        pageTitle: 'pageTitle',
        screenPageViews: 'pageViews',
        activeUsers: 'activeUsers',
        sessions: 'sessions',
        userEngagementDuration: 'engagementTimeSeconds'
      }
    ),
    countryPerformance: mapReport(
      reports[1],
      'country',
      ['screenPageViews', 'activeUsers', 'userEngagementDuration'],
      {
        country: 'country',
        screenPageViews: 'pageViews',
        activeUsers: 'activeUsers',
        userEngagementDuration: 'engagementTimeSeconds'
      }
    ),
    engagementEvents: mapReport(
      reports[2],
      'eventName',
      ['eventCount'],
      { eventName: 'eventName', eventCount: 'eventCount' }
    ),
    downloadedFiles: mapReport(
      reports[3],
      'fileName',
      ['eventCount'],
      { fileName: 'fileName', eventCount: 'downloadCount' }
    )
  };

  return summary;
}

/**
 * Validate the expected four-report GA4 batch response.
 */
function validateGA4ReportData(response) {
  if (!response || !Array.isArray(response.reports)) {
    throw new Error('GA4 report data must contain a reports array');
  }

  if (response.reports.length !== 4) {
    throw new Error('GA4 report data must contain four reports');
  }

  response.reports.forEach(function(report, index) {
    if (!report || !Array.isArray(report.dimensionHeaders) ||
        !Array.isArray(report.metricHeaders) ||
        !Array.isArray(report.rows)) {
      throw new Error('GA4 report ' + index + ' has an invalid shape');
    }
  });

  return true;
}

/**
 * Map one GA4 report into rows with readable metric names.
 */
function mapReport(report, dimensionName, metricNames, outputNames) {
  const dimensions = indexHeaders(report.dimensionHeaders);
  const metrics = indexHeaders(report.metricHeaders);

  metricNames.forEach(function(metricName) {
    if (metrics[metricName] == null) {
      throw new Error('GA4 report is missing metric: ' + metricName);
    }
  });

  if (dimensions[dimensionName] == null ||
      dimensions.dateRange == null) {
    throw new Error(
      'GA4 report is missing dimensions: ' + dimensionName + ', dateRange'
    );
  }

  // Map each row into a descriptive object with readable metric names.
  return report.rows.map(function(row, rowIndex) {
    if (!row || !Array.isArray(row.dimensionValues) ||
        !Array.isArray(row.metricValues)) {
      throw new Error('GA4 row ' + rowIndex + ' has an invalid shape');
    }

    const mapped = {};
    mapped[outputNames[dimensionName]] = getDimension(
      row.dimensionValues,
      dimensions[dimensionName],
      dimensionName,
      rowIndex,
      dimensionName === 'fileName' ? 'Unknown file' : null
    );
    mapped.period = getDimension(
      row.dimensionValues,
      dimensions.dateRange,
      'dateRange',
      rowIndex
    );

    metricNames.forEach(function(metricName) {
      mapped[outputNames[metricName]] = getMetric(
        row.metricValues,
        metrics[metricName],
        metricName,
        rowIndex
      );
    });

    return mapped;
  });
}

/** Map aggregate GA4 totals into readable period-based metrics. */
function mapTotals(report, metricNames, outputNames) {
  if (!Array.isArray(report.totals)) {
    throw new Error('GA4 report totals must be an array');
  }

  const dimensions = indexHeaders(report.dimensionHeaders);
  const metrics = indexHeaders(report.metricHeaders);

  if (dimensions.dateRange == null) {
    throw new Error('GA4 report totals are missing dimension: dateRange');
  }

  metricNames.forEach(function(metricName) {
    if (metrics[metricName] == null) {
      throw new Error('GA4 report totals are missing metric: ' + metricName);
    }
  });

  return report.totals.map(function(total, totalIndex) {
    if (!total || !Array.isArray(total.dimensionValues) ||
        !Array.isArray(total.metricValues)) {
      throw new Error('GA4 total ' + totalIndex + ' has an invalid shape');
    }

    const mapped = {
      period: getDimension(
        total.dimensionValues,
        dimensions.dateRange,
        'dateRange',
        totalIndex
      )
    };

    metricNames.forEach(function(metricName) {
      mapped[outputNames[metricName]] = getMetric(
        total.metricValues,
        metrics[metricName],
        metricName,
        totalIndex
      );
    });

    return mapped;
  });
}

/** Index response headers by their names. */
function indexHeaders(headers) {
  const indexes = {};

  headers.forEach(function(header, index) {
    if (header && typeof header.name === 'string') {
      indexes[header.name] = index;
    }
  });

  return indexes;
}

/** Read a dimension value, allowing blank file names as an explicit label. */
function getDimension(values, index, name, rowIndex, blankLabel) {
  if (index == null || !values[index] || values[index].value == null) {
    throw new Error('GA4 row ' + rowIndex + ' is missing dimension: ' + name);
  }

  const value = String(values[index].value).trim();
  if (value === '' && blankLabel) {
    // Value can be empty for download fileName dimension, so provide a default label for it.
    return blankLabel;
  }
  if (value === '') {
    throw new Error('GA4 row ' + rowIndex + ' is missing dimension: ' + name);
  }
  return value;
}

/** Read and validate a numeric metric value. */
function getMetric(values, index, name, rowIndex) {
  if (index == null || !values[index] || values[index].value == null ||
      String(values[index].value).trim() === '') {
    throw new Error('GA4 row ' + rowIndex + ' is missing metric: ' + name);
  }

  const value = Number(values[index].value);
  if (!Number.isFinite(value)) {
    throw new Error('GA4 row ' + rowIndex + ' has an invalid metric: ' + name);
      }
  return value;
}
