'use strict';

const { createBlob } = require('./blob');
const {
  ga4RunReport,
  geminiGenerateContent,
} = require('./stub-responses');

/**
 * UrlFetchApp stub. Never performs a real HTTP request.
 *
 * Routes canned JSON by URL so local GA4 REST or Gemini calls can still
 * parse a plausible body. Unknown URLs get `{ "ok": true, "stub": true }`.
 */

function createHttpResponse(body, responseCode = 200, headers = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);

  return {
    getContentText() {
      return text;
    },
    getContent() {
      return Array.from(Buffer.from(text, 'utf8'));
    },
    getResponseCode() {
      return responseCode;
    },
    getHeaders() {
      return { ...headers };
    },
    getAllHeaders() {
      return { ...headers };
    },
    getBlob() {
      return createBlob(text, headers['Content-Type'] || 'application/json');
    },
  };
}

function stubBodyForUrl(url) {
  const target = String(url || '');

  if (
    target.includes('generativelanguage.googleapis.com') ||
    target.includes('aiplatform.googleapis.com') ||
    target.includes('generateContent')
  ) {
    return geminiGenerateContent();
  }

  if (target.includes('analyticsdata.googleapis.com')) {
    return ga4RunReport();
  }

  return { ok: true, stub: true };
}

function normalizeRequest(urlOrRequest, params) {
  if (urlOrRequest && typeof urlOrRequest === 'object') {
    return {
      url: urlOrRequest.url,
      params: urlOrRequest,
    };
  }

  return { url: urlOrRequest, params: params || {} };
}

function fetch(urlOrRequest, params) {
  const request = normalizeRequest(urlOrRequest, params);
  const method = String(request.params.method || 'get').toLowerCase();

  console.log('[UrlFetchApp.fetch] stub', method.toUpperCase(), request.url);

  return createHttpResponse(stubBodyForUrl(request.url), 200, {
    'Content-Type': 'application/json',
  });
}

function installUrlFetchApp(globalTarget = globalThis) {
  globalTarget.UrlFetchApp = {
    fetch,
    fetchAll(requests) {
      return (requests || []).map((request) => fetch(request));
    },
  };
}

module.exports = { installUrlFetchApp };
