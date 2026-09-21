'use strict';

/**
 * ScriptApp stub.
 *
 * getOAuthToken() returns a fake token so UrlFetchApp-based Google API
 * calls can be written the same way as in production. The UrlFetchApp
 * shim never uses the token to make a real request.
 */

function installScriptApp(globalTarget = globalThis) {
  globalTarget.ScriptApp = {
    getOAuthToken() {
      return process.env.SCRIPT_OAUTH_TOKEN || 'local-oauth-token';
    },
    getScriptId() {
      return process.env.SCRIPT_ID || 'local-script-id';
    },
  };
}

module.exports = { installScriptApp };
