'use strict';

/**
 * MimeType constants used when attaching or naming generated report files.
 */

function installMimeType(globalTarget = globalThis) {
  globalTarget.MimeType = {
    CSV: 'text/csv',
    HTML: 'text/html',
    JPEG: 'image/jpeg',
    JSON: 'application/json',
    PDF: 'application/pdf',
    PLAIN_TEXT: 'text/plain',
    PNG: 'image/png',
    ZIP: 'application/zip',
    GOOGLE_DOCS: 'application/vnd.google-apps.document',
    GOOGLE_SHEETS: 'application/vnd.google-apps.spreadsheet',
  };
}

module.exports = { installMimeType };
