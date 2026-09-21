'use strict';

/**
 * Minimal Logger shim.
 *
 * Forwards Logger.log(...) to the Node console. console.log / warn / error
 * are already available on the shared global and need no extra wrapping.
 */

function installLogger(globalTarget = globalThis) {
  globalTarget.Logger = {
    log(...args) {
      console.log(...args);
    },
  };
}

module.exports = { installLogger };
