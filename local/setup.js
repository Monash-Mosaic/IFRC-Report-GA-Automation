'use strict';

const path = require('path');
const { installPropertiesService } = require('./shims/properties-service');
const { installLogger } = require('./shims/logger');
const { installAnalyticsData } = require('./shims/analytics-data');
const { installUrlFetchApp } = require('./shims/url-fetch-app');
const { installGmailApp } = require('./shims/gmail-app');
const { installMailApp } = require('./shims/mail-app');
const { installScriptApp } = require('./shims/script-app');
const { installUtilities } = require('./shims/utilities');
const { installSession } = require('./shims/session');
const { installHtmlService } = require('./shims/html-service');
const { installMimeType } = require('./shims/mime-type');

/**
 * Install local-only Apps Script compatibility shims onto a global object.
 *
 * These are development substitutes. They log and return canned data;
 * they do not call Google APIs or send email.
 */
function setupLocalEnvironment(globalTarget = globalThis) {
  const env = require('dotenv').config({
    path: path.resolve(__dirname, '..', '.env'),
    quiet: true,
  });

  const initialProperties = env.parsed || {};

  installPropertiesService(globalTarget, initialProperties);
  installLogger(globalTarget);
  installAnalyticsData(globalTarget);
  installUrlFetchApp(globalTarget);
  installGmailApp(globalTarget);
  installMailApp(globalTarget);
  installScriptApp(globalTarget);
  installUtilities(globalTarget);
  installSession(globalTarget);
  installHtmlService(globalTarget);
  installMimeType(globalTarget);
}

module.exports = { setupLocalEnvironment };
