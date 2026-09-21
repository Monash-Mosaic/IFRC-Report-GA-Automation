'use strict';

const { createBlob } = require('./blob');

/**
 * Utilities stub covering the subset likely needed for GA4 date ranges,
 * Gemini request encoding, and email attachments.
 */

function pad(value, width = 2) {
  return String(value).padStart(width, '0');
}

function formatDate(date, timeZone, format) {
  const value = date instanceof Date ? date : new Date(date);
  const pattern = format || 'yyyy-MM-dd';

  console.log('[Utilities.formatDate] stub timezone', timeZone || '(none)');

  return pattern
    .replace(/yyyy/g, String(value.getFullYear()))
    .replace(/MM/g, pad(value.getMonth() + 1))
    .replace(/dd/g, pad(value.getDate()))
    .replace(/HH/g, pad(value.getHours()))
    .replace(/mm/g, pad(value.getMinutes()))
    .replace(/ss/g, pad(value.getSeconds()));
}

function toBuffer(data) {
  if (Buffer.isBuffer(data)) {
    return data;
  }
  if (Array.isArray(data)) {
    return Buffer.from(data);
  }
  return Buffer.from(String(data ?? ''), 'utf8');
}

function sleep(milliseconds) {
  const ms = Number(milliseconds) || 0;
  if (ms <= 0) {
    return;
  }

  const lock = new Int32Array(new SharedArrayBuffer(4));
  Atomics.wait(lock, 0, 0, ms);
}

function installUtilities(globalTarget = globalThis) {
  globalTarget.Utilities = {
    formatDate,
    sleep,
    newBlob(data, contentType, name) {
      return createBlob(data, contentType, name);
    },
    base64Encode(data) {
      return toBuffer(data).toString('base64');
    },
    base64Decode(encoded) {
      return Array.from(Buffer.from(String(encoded || ''), 'base64'));
    },
    formatString(template, ...args) {
      let index = 0;
      return String(template).replace(/%[sdjf]/g, () => String(args[index++]));
    },
    parseCsv(csv) {
      return String(csv)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .filter((line, i, lines) => line !== '' || i < lines.length - 1)
        .map((line) => line.split(','));
    },
    getUuid() {
      return require('crypto').randomUUID();
    },
  };
}

module.exports = { installUtilities };
