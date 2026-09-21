# IFRC-Report-GA-Automation
Automation for IFRC report GA analytics and email

## Local Apps Script Development

Google Apps Script source lives in `src/` and is deployed with clasp. The same files can also be executed locally in Node.js through a thin compatibility layer in `local/`.

`src/` is the production source of truth. Files there must remain valid Apps Script (no `import`/`export`/`require`, and no Node-only APIs). They should not inspect the environment with checks such as `process.env.NODE_ENV` or `isLocal`.

`local/` is never deployed. It exists only so developers can run Apps Script functions on a machine without the Apps Script runtime. Local shims are development substitutes, not a full emulation of Google’s Apps Script services. They log intended actions and return canned data. They do **not** download GA4, call Gemini, or send email.

Expected clasp config (do not commit `.clasp.json`; it is gitignored):

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "src"
}
```

### Setup

```bash
cp .env.example .env
npm install
```

`.env` is loaded by the local runner and is ignored by Git. Add keys there that production would store in Apps Script script properties.

### Run a function locally

```bash
npm run local -- testLocalEnvironment
```

That command:

1. Initialises local shims
2. Loads every `src/*.js` file into one shared VM context
3. Invokes the named global function

Source files are loaded in alphabetical order by filename (`en` locale). If declaration order becomes important later, add an explicit manifest instead of relying on filenames.

If you omit the function name, the runner prints usage. If the function does not exist, it exits with a non-zero status.

### Installed local shims

| Apps Script global | Local behaviour |
| --- | --- |
| `PropertiesService` | Reads/writes values from `.env` / the current process |
| `Logger` | Forwards to `console.log` |
| `AnalyticsData` | Returns a canned GA4 `runReport` payload |
| `UrlFetchApp` | No HTTP. Gemini and GA4 Data API URLs get canned JSON |
| `GmailApp` / `MailApp` | Logs the message; does not send |
| `ScriptApp` | Fake `getOAuthToken()` / `getScriptId()` |
| `Utilities` | `formatDate`, `sleep`, blobs, base64, `parseCsv`, `getUuid` |
| `Session` | Stub active/effective user email |
| `HtmlService` | HTML output/templates from `src/`; scriptlets are not run |
| `MimeType` | Common MIME constants |

There is no native `GeminiApp` in Apps Script. Call Gemini with `UrlFetchApp` the same way production will; the local `UrlFetchApp` stub recognises Generative Language / Vertex URLs and returns a fake `generateContent` body.

### Adding shims later

1. Add `local/shims/<service>.js` that installs the global onto a provided target object
2. Register it from `local/setup.js`
3. Keep `src/` using the Apps Script API unchanged
