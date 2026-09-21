'use strict';

/**
 * PropertiesService shim.
 *
 * Locally, script/user/document properties are backed by values loaded
 * from .env (plus any setProperty calls in the current process).
 * Missing keys return null, matching Apps Script.
 */

function createPropertyStore(initial) {
  const store = { ...initial };

  return {
    getProperty(key) {
      if (key == null || key === '') {
        return null;
      }

      if (Object.prototype.hasOwnProperty.call(store, key)) {
        return store[key];
      }

      const value = process.env[key];
      return value === undefined ? null : value;
    },
    setProperty(key, value) {
      const next = value == null ? '' : String(value);
      store[key] = next;
      process.env[key] = next;
      return this;
    },
    getProperties() {
      return { ...store };
    },
    getKeys() {
      return Object.keys(store);
    },
    deleteProperty(key) {
      delete store[key];
      return this;
    },
    deleteAllProperties() {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
      return this;
    },
    setProperties(properties, deleteAllOthers) {
      if (deleteAllOthers) {
        for (const key of Object.keys(store)) {
          delete store[key];
        }
      }

      for (const [key, value] of Object.entries(properties || {})) {
        this.setProperty(key, value);
      }

      return this;
    },
  };
}

function installPropertiesService(globalTarget = globalThis, initial = {}) {
  const scriptProperties = createPropertyStore(initial);
  const userProperties = createPropertyStore(initial);
  const documentProperties = createPropertyStore(initial);

  globalTarget.PropertiesService = {
    getScriptProperties() {
      return scriptProperties;
    },
    getUserProperties() {
      return userProperties;
    },
    getDocumentProperties() {
      return documentProperties;
    },
  };
}

module.exports = { installPropertiesService };
