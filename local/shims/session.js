'use strict';

/**
 * Session stub for the effective/active Apps Script user.
 */

function createUser(email) {
  return {
    getEmail() {
      return email;
    },
  };
}

function installSession(globalTarget = globalThis) {
  const email = process.env.SESSION_USER_EMAIL || 'local-dev@example.com';

  globalTarget.Session = {
    getActiveUser() {
      return createUser(email);
    },
    getEffectiveUser() {
      return createUser(email);
    },
    getScriptTimeZone() {
      return process.env.TZ || 'Australia/Melbourne';
    },
  };
}

module.exports = { installSession };
