var REPORT_EMAIL_SUBJECT = 'Your Monthly Website Performance Update';

/** Build an email message for the monthly report. */
function buildReportEmail(summary, config) {
  if (!config || typeof config.emailTo !== 'string' ||
      config.emailTo.trim() === '') {
    throw new Error('Email configuration requires a recipient');
  }

  if (typeof summary !== 'string' || summary.trim() === '') {
    throw new Error('Report summary must be a non-empty string');
  }

  return {
    to: config.emailTo.trim(),
    subject: REPORT_EMAIL_SUBJECT,
    body: summary
  };
}

/** Send the monthly report email. */
function sendReportEmail(summary, config) {
  const message = buildReportEmail(summary, config);
  MailApp.sendEmail(message);
}
