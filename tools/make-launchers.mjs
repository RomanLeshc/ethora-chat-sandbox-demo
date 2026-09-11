import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// --- All three launchers point at the real GitHub repo now, not an -----
// --- inline file payload. -----------------------------------------------
//
// `sandboxes/define` (CodeSandbox's old POST-files API) creates a
// client-side-only "Nodebox" sandbox: it resolves bare imports (react,
// @ethora/chat-component, its ~15 transitive deps) through a CDN on the fly
// instead of a real `npm install`, and silently fails to mount anything for
// a dependency tree this size (confirmed: #root stays at 0 children, zero
// console errors). CodeSandbox's GitHub-import flow spins up a real
// VM-backed Devbox that actually runs `.codesandbox/tasks.json`
// (npm install && npm run dev), which is what this demo needs.
//
// StackBlitz's `/run` POST API creates an ephemeral, unsaved session (its
// own UI warns "not saved on StackBlitz, use Fork to share"); the
// `~/github.com/...` import URL instead creates a real git-connected
// project, which is what was actually verified end to end (auth, XMPP
// presence, message send/receive all confirmed working through this URL).
//
// Gitpod uses the same idea: prefix the repo URL, driven by `.gitpod.yml`
// at the repo root (npm install && npm run dev, port 5173 public).
//
// All three need the source of truth to be a real, pushed GitHub repo, not
// an inline file payload, so the exported build script below stays a lot
// smaller than the old base64-payload version.
const GITHUB_REPO = 'RomanLeshc/ethora-chat-sandbox-demo';
const GITHUB_BRANCH = 'master';
const csUrl = `https://codesandbox.io/p/github/${GITHUB_REPO}/${GITHUB_BRANCH}`;
const sbUrl = `https://stackblitz.com/~/github.com/${GITHUB_REPO}`;
const gpUrl = `https://gitpod.io/#https://github.com/${GITHUB_REPO}`;

fs.writeFileSync(path.join(ROOT, 'codesandbox-url.txt'), csUrl + '\n');
console.log('CodeSandbox URL (GitHub import):', csUrl);
console.log('StackBlitz URL (GitHub import):', sbUrl);
console.log('Gitpod URL:', gpUrl);
console.log(
  'Reminder: all three only stay correct if',
  GITHUB_REPO,
  '(branch',
  GITHUB_BRANCH + ')',
  'is kept in sync with this demo (push after every change).'
);

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
  button.gitpod { background:#ffae33; color:#1a1a1a; }
  code { background:#0a204e; padding:2px 6px; border-radius:4px; }
  .note { color:#6f86b3; font-size:13px; margin-top:16px; }
</style>
</head>
<body>
  <div class="card">
    <h1>Ethora chat component: live sandbox</h1>
    <p>One click opens this Vite + React + TypeScript demo of
      <code>@ethora/chat-component</code> in an online IDE. It installs the package,
      runs the dev server and shows the chat, signed in automatically with a
      demo account (no login form). Want your own identity instead?
      Get a free account at
      <a style="color:#7fb0ff" href="https://app.chat.ethora.com" target="_blank" rel="noreferrer">app.chat.ethora.com</a>.</p>
    <div class="row">
      <a href="${sbUrl}" target="_blank" rel="noreferrer">
        <button class="alt" type="button">Open in StackBlitz</button>
      </a>
      <a href="${gpUrl}" target="_blank" rel="noreferrer">
        <button class="gitpod" type="button">Open in Gitpod</button>
      </a>
      <a href="${csUrl}" target="_blank" rel="noreferrer">
        <button type="button">Open in CodeSandbox</button>
      </a>
    </div>
    <p class="note">StackBlitz needs no account and runs entirely in your browser (fastest, free). Gitpod needs a free GitHub/GitLab login (real VM, ~50 free hours/month). CodeSandbox needs a paid plan for the real VM runtime (its free tier's Sandbox mode can't run this demo's dependency tree) — pick "Devbox" when it asks.</p>
  </div>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, 'open-in-online-ide.html'), html);
console.log('Wrote open-in-online-ide.html', html.length, 'bytes');
