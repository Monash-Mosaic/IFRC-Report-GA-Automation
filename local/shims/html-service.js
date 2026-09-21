'use strict';

const fs = require('fs');
const path = require('path');

/**
 * HtmlService stub for HTML email bodies / templates.
 *
 * Scriptlets (`<? ... ?>`) are not evaluated. createTemplateFromFile
 * returns the raw file contents from src/.
 */

const SRC_DIR = path.resolve(__dirname, '..', '..', 'src');

function createHtmlOutput(html) {
  let content = html == null ? '' : String(html);
  let title = '';

  return {
    getContent() {
      return content;
    },
    setContent(next) {
      content = String(next);
      return this;
    },
    getTitle() {
      return title;
    },
    setTitle(next) {
      title = String(next);
      return this;
    },
  };
}

function createTemplate(html) {
  const source = html == null ? '' : String(html);

  return {
    evaluate() {
      console.log('[HtmlService.Template.evaluate] stub (scriptlets not run)');
      return createHtmlOutput(source);
    },
    getRawContent() {
      return source;
    },
  };
}

function readTemplateFile(filename) {
  const candidates = [
    path.join(SRC_DIR, filename),
    path.join(SRC_DIR, `${filename}.html`),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return fs.readFileSync(filePath, 'utf8');
    }
  }

  throw new Error(
    `HtmlService.createTemplateFromFile: file not found in src/: ${filename}`
  );
}

function installHtmlService(globalTarget = globalThis) {
  globalTarget.HtmlService = {
    createHtmlOutput,
    createHtmlOutputFromFile(filename) {
      return createHtmlOutput(readTemplateFile(filename));
    },
    createTemplate,
    createTemplateFromFile(filename) {
      return createTemplate(readTemplateFile(filename));
    },
  };
}

module.exports = { installHtmlService };
