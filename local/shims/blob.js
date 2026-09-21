'use strict';

/**
 * Minimal Apps Script Blob stand-in used by Utilities, UrlFetchApp, and email.
 */

function createBlob(data, contentType, name) {
  let bytes;

  if (data == null) {
    bytes = Buffer.alloc(0);
  } else if (Buffer.isBuffer(data)) {
    bytes = data;
  } else if (Array.isArray(data)) {
    bytes = Buffer.from(data);
  } else {
    bytes = Buffer.from(String(data), 'utf8');
  }

  let type = contentType || 'application/octet-stream';
  let blobName = name || '';

  return {
    getBytes() {
      return Array.from(bytes);
    },
    getDataAsString() {
      return bytes.toString('utf8');
    },
    getName() {
      return blobName;
    },
    getContentType() {
      return type;
    },
    setName(nextName) {
      blobName = nextName || '';
      return this;
    },
    setContentType(nextType) {
      type = nextType || 'application/octet-stream';
      return this;
    },
    copyBlob() {
      return createBlob(bytes, type, blobName);
    },
  };
}

module.exports = { createBlob };
