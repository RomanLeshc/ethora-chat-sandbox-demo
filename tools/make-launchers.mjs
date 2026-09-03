import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// lz-string is not a dependency of the demo itself (the online sandbox should
// stay minimal), so resolve it from wherever it already exists in the workspace.
const require = createRequire(import.meta.url);
let LZString;
for (const from of ['lz-string', '../../ethora-chat-component/node_modules/lz-string']) {
  try {
    LZString = require(from);
    break;
  } catch {
    /* try next */
  }
}
if (!LZString) throw new Error('lz-string not found: npm i -D lz-string, then rerun');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FILES = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'index.html',
  'sandbox.config.json',
  '.codesandbox/tasks.json',
  'src/main.tsx',
  'src/App.tsx',
  'src/demo-config.ts',
  'src/useDemoIdentity.ts',
  'src/styles.css',
  'README.md',
];

const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// --- CodeSandbox define API ---------------------------------------------
const csFiles = {};
for (const f of FILES) csFiles[f] = { content: read(f) };
const parameters = LZString.compressToBase64(JSON.stringify({ files: csFiles, template: 'node' }))
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');
const csUrl =
  'https://codesandbox.io/api/v1/sandboxes/define?parameters=' +
  parameters +
  '&query=' +
  encodeURIComponent('file=/src/App.tsx');

fs.writeFileSync(path.join(ROOT, 'codesandbox-url.txt'), csUrl + '\n');
console.log('CodeSandbox URL length:', csUrl.length);

// --- StackBlitz (POST form) ---------------------------------------------
const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const sbInputs = FILES.map(
  (f) => `      <input type="hidden" name="project[files][${esc(f)}]" value="${esc(read(f))}">`
).join('\n');

const csInputs = `      <input type="hidden" name="parameters" value="${esc(parameters)}">
      <input type="hidden" name="query" value="file=/src/App.tsx">`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ethora chat component: open in an online IDE</title>
<style>
  body { margin:0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
         background:#061430; color:#fff; display:flex; min-height:100vh; align-items:center; justify-content:center; }
  .card { max-width: 560px; padding: 40px; }
  h1 { font-size: 24px; margin: 0 0 8px; }
  p { color:#9db2d8; line-height:1.6; }
  .row { display:flex; gap:12px; flex-wrap:wrap; margin-top:24px; }
  button { font: inherit; font-weight:600; padding:12px 20px; border:0; border-radius:8px;
           background:#2775ea; color:#fff; cursor:pointer; }
  button.alt { background:#12305f; }
  code { background:#0a204e; padding:2px 6px; border-radius:4px; }
</style>
</head>
<body>
  <div class="card">
    <h1>Ethora chat component: live sandbox</h1>
    <p>One click uploads this Vite + React + TypeScript demo of
      <code>@ethora/chat-component</code> to an online IDE. It installs the package,
      runs the dev server and shows the chat. Log in with a free account from
      <a style="color:#7fb0ff" href="https://app.chat.ethora.com" target="_blank" rel="noreferrer">app.chat.ethora.com</a>.</p>
    <div class="row">
      <form action="https://codesandbox.io/api/v1/sandboxes/define" method="POST" target="_blank">
${csInputs}
        <button type="submit">Open in CodeSandbox</button>
      </form>
      <form action="https://stackblitz.com/run" method="POST" target="_blank">
        <input type="hidden" name="project[title]" value="Ethora chat component: live sandbox">
        <input type="hidden" name="project[description]" value="React chat + AI agents SDK by Ethora">
        <input type="hidden" name="project[template]" value="node">
${sbInputs}
        <button class="alt" type="submit">Open in StackBlitz</button>
      </form>
    </div>
  </div>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'open-in-online-ide.html'), html);
console.log('Wrote open-in-online-ide.html', html.length, 'bytes');
