/** Generate a monthly summary of GA4 metrics. */
function generateMonthlySummary() {
  let config;

  try {
    config = getConfig();
    const ga4Response = fetchGA4Metrics(config);
    const reportData = summarizeMetrics(ga4Response);
    const prompt = buildSummaryPrompt(reportData);
    const summary = callGemini(prompt, config);

    sendReportEmail(summary, config);
    Logger.log('Monthly summary generated and emailed successfully');

    return summary;
  } catch (error) {
    handleAutomationFailure(error, config);
    throw error;
  }
}

function myFunction() {
  Logger.log('Hi MOSAIC Report Analystics Automation');
}

function testLocalEnvironment() {
  const environment = getLocalTestValue();
  console.log("Environment:", environment);
  return environment;
}

function getLocalTestValue() {
  return PropertiesService
    .getScriptProperties()
    .getProperty("TEST_VALUE");
}
