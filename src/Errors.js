/** Handle a failure in the automation process. */
function handleAutomationFailure(error, config) {
  const message = getSafeErrorMessage(error, config);
  Logger.log('Monthly analytics automation failed: ' + message);

  const adminEmail = getAdminEmail(config);
  if (!adminEmail) {
    return false;
  }

  const notification = {
    to: adminEmail,
    subject: 'Monthly analytics automation failed',
    body: 'The monthly analytics automation failed. Check the Apps Script execution log.'
  };

  try {
    MailApp.sendEmail(notification);
    return true;
  } catch (notificationError) {
    Logger.log(
      'Failure notification could not be sent: ' +
      getSafeErrorMessage(notificationError, config)
    );
    return false;
  }
}

/** Get the admin email address from the configuration or script properties. */
function getAdminEmail(config) {
  if (config && Object.prototype.hasOwnProperty.call(config, 'adminEmail')) {
    if (typeof config.adminEmail !== 'string' ||
        config.adminEmail.trim() === '') {
      return null;
    }

    return config.adminEmail.trim();
  }

  const properties = PropertiesService.getScriptProperties();
  const value = properties.getProperty('ADMIN_EMAIL');

  if (value == null || String(value).trim() === '') {
    return null;
  }

  return String(value).trim();
}

/** Return a safe error message, with sensitive information redacted. */
function getSafeErrorMessage(error, config) {
  if (!error || typeof error.message !== 'string' ||
      error.message.trim() === '') {
    return 'Unknown error';
  }

  let message = error.message;

  // Redact the Gemini API key from the error message, if present.
  if (config && typeof config.geminiApiKey === 'string' &&
      config.geminiApiKey !== '') {
    message = message.split(config.geminiApiKey).join('[redacted]');
  }

  return message;
}
