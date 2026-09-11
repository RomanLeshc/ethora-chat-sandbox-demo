import fs from 'node:fs';
import path from 'node:path';

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

// --- CodeSandbox: GitHub import, NOT the sandboxes/define API ----------
// `sandboxes/define` (the old POST-files API) creates a client-side-only
// "Nodebox" sandbox: it resolves bare imports (react, @ethora/chat-component,
// its ~15 transitive deps) through a CDN on the fly instead of a real
// `npm install`, and silently fails to mount anything for a dependency tree
// this size (confirmed: #root stays at 0 children, zero console errors).
// CodeSandbox's GitHub-import flow spins up a real VM-backed Devbox that
// actually runs `.codesandbox/tasks.json` (npm install && npm run dev), which
// is what this demo needs. That means the source of truth now has to be a
// real, pushed GitHub repo, not an inline file payload.
const GITHUB_REPO = 'RomanLeshc/ethora-chat-sandbox-demo';
const GITHUB_BRANCH = 'master';
const csUrl = `https://codesandbox.io/p/github/${GITHUB_REPO}/${GITHUB_BRANCH}`;

fs.writeFileSync(path.join(ROOT, 'codesandbox-url.txt'), csUrl + '\n');
console.log('CodeSandbox URL (GitHub import):', csUrl);
console.log(
  'Reminder: this only stays correct if',
  GITHUB_REPO,
  '(branch',
  GITHUB_BRANCH + ')',
  'is kept in sync with this demo.'
);

// --- StackBlitz (POST form) ---------------------------------------------
const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const sbInputs = FILES.map(
  (f) => `      <input type="hidden" name="project[files][${esc(f)}]" value="${esc(read(f))}">`
).join('\n');

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
      <a href="${csUrl}" target="_blank" rel="noreferrer">
        <button type="button">Open in CodeSandbox</button>
      </a>
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
