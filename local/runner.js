'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { setupLocalEnvironment } = require('./setup');

const SRC_DIR = path.resolve(__dirname, '..', 'src');

/**
 * Source load order: alphabetical by filename using English localeCompare.
 *
 * Apps Script also shares one global scope across files, but does not
 * guarantee this exact order. If declaration order becomes important,
 * introduce an explicit manifest rather than relying on filenames.
 */
function listSourceFiles(srcDir) {
  let entries;

  try {
    entries = fs.readdirSync(srcDir, { withFileTypes: true });
  } catch (err) {
    console.error(`Failed to read source directory: ${srcDir}`);
    console.error(err.message);
    process.exit(1);
  }

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'en'));
}

function loadSourceFiles(srcDir, sandbox) {
  const files = listSourceFiles(srcDir);

  if (files.length === 0) {
    console.error(`No .js source files found in ${srcDir}`);
    process.exit(1);
  }

  for (const fileName of files) {
    const filePath = path.join(srcDir, fileName);
    let code;

    try {
      code = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error(`Failed to read Apps Script source file: ${filePath}`);
      console.error(err.message);
      process.exit(1);
    }

    try {
      const script = new vm.Script(code, { filename: filePath });
      script.runInContext(sandbox);
    } catch (err) {
      console.error(`Failed to load Apps Script source file: ${filePath}`);
      console.error(err);
      process.exit(1);
    }
  }
}

function printUsage() {
  console.error(`Usage: npm run local -- <functionName>

Runs a Google Apps Script function from src/ in a local Node.js environment.

src/*.js files are loaded into a shared global context (alphabetical by
filename) after local Apps Script shims are installed.

Examples:
  npm run local -- testLocalEnvironment
`);
}

function listLoadedFunctions(sandbox, namesBeforeLoad) {
  return Object.getOwnPropertyNames(sandbox)
    .filter((name) => !namesBeforeLoad.has(name))
    .filter((name) => typeof sandbox[name] === 'function')
    .sort((a, b) => a.localeCompare(b, 'en'));
}

async function main() {
  const functionName = process.argv[2];

  if (!functionName) {
    printUsage();
    process.exit(1);
  }

  const sandbox = vm.createContext(Object.create(null));

  sandbox.console = console;
  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;

  setupLocalEnvironment(sandbox);

  const namesBeforeLoad = new Set(Object.getOwnPropertyNames(sandbox));
  loadSourceFiles(SRC_DIR, sandbox);

  const fn = sandbox[functionName];

  if (typeof fn !== 'function') {
    const available = listLoadedFunctions(sandbox, namesBeforeLoad);
    console.error(`Function not found: ${functionName}`);

    if (available.length > 0) {
      console.error(`Available functions: ${available.join(', ')}`);
    }

    process.exit(1);
  }

  try {
    const result = fn();

    if (result && typeof result.then === 'function') {
      await result;
    }
  } catch (err) {
    console.error(`Function ${functionName} threw an error:`);
    console.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
