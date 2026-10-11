/**
 * Validate normalized GA4 metric rows before report calculations.
 */
function validateMetrics(metrics) {
  if (!Array.isArray(metrics)) {
    throw new Error('Metrics must be an array');
  }

  metrics.forEach(function(metric, index) {
    if (!metric || typeof metric !== 'object') {
      throw new Error('Metric row ' + index + ' must be an object');
    }

    if (typeof metric.source !== 'string' ||
        metric.source.trim() === '') {
      throw new Error('Metric row ' + index + ' is missing source');
    }

    if (!Number.isFinite(metric.activeUsers)) {
      throw new Error(
        'Metric row ' + index + ' has an invalid activeUsers value'
      );
    }

    if (!Number.isFinite(metric.conversions)) {
      throw new Error(
        'Metric row ' + index + ' has an invalid conversions value'
      );
    }
  });

  return true;
}

/**
 * Calculate deterministic report data for the plain-language prompt.
 */
function summarizeMetrics(metrics) {
  validateMetrics(metrics);

  const summary = {
    hasData: metrics.length > 0,
    totalActiveUsers: 0,
    totalConversions: 0,
    sourcesByActiveUsers: sortSources(metrics)
  };

  metrics.forEach(function(metric) {
    summary.totalActiveUsers += metric.activeUsers;
    summary.totalConversions += metric.conversions;
  });

  return summary;
}

/**
 * Return source rows ordered by active users, preserving input order for ties.
 */
function sortSources(metrics) {
  validateMetrics(metrics);

  return metrics
    .map(function(metric, index) {
      return {
        source: metric.source,
        activeUsers: metric.activeUsers,
        conversions: metric.conversions,
        inputIndex: index
      };
    })
    .sort(function(left, right) {
      if (right.activeUsers !== left.activeUsers) {
        return right.activeUsers - left.activeUsers;
      }

      return left.inputIndex - right.inputIndex;
    })
    .map(function(metric) {
      return {
        source: metric.source,
        activeUsers: metric.activeUsers,
        conversions: metric.conversions
      };
    });
}
