/** Load and validate configuration from Apps Script properties. */
function getConfig() {
  const properties = PropertiesService.getScriptProperties();

  const propertyId = requireConfigProperty(properties, 'GA4_PROPERTY_ID');
  const geminiApiKey = requireConfigProperty(properties, 'GEMINI_API_KEY');
  const emailTo = requireConfigProperty(properties, 'REPORT_EMAIL_TO');

  return {
    propertyId: normalizePropertyId(propertyId),
    geminiApiKey: geminiApiKey,
    emailTo: emailTo,
    adminEmail: getOptionalConfigProperty(properties, 'ADMIN_EMAIL')
  };
}

/** Get a required configuration property. */
function requireConfigProperty(properties, key) {
  const value = properties.getProperty(key);

  if (value == null || String(value).trim() === '') {
    throw new Error('Missing required script property: ' + key);
  }

  return String(value).trim();
}

/** Get an optional configuration property. */
function getOptionalConfigProperty(properties, key) {
  const value = properties.getProperty(key);

  if (value == null || String(value).trim() === '') {
    return null;
  }

  return String(value).trim();
}

/** Remove the 'properties/' prefix from a property ID, if present. */
function normalizePropertyId(value) {
  const prefix = 'properties/';
  const normalized = value.indexOf(prefix) === 0
    ? value.substring(prefix.length)
    : value;

  if (!/^[0-9]+$/.test(normalized)) {
    throw new Error(
      'GA4_PROPERTY_ID must contain a numeric property ID'
    );
  }

  return normalized;
}
