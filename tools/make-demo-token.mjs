#!/usr/bin/env node
/**
 * Mints an Ethora "client token" for the sandbox's shared demo user.
 *
 *   node --env-file=../sdk-playground/.env.local tools/make-demo-token.mjs \
 *        --user ethora-demo --days 30 --write
 *
 * Needs ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET in the environment. The
 * secret never leaves your machine: what ends up in the sandbox is the signed
 * token, which the component exchanges for a session via POST /v1/users/client
 * (`config.jwtLogin`).
 *
 * The user must exist in that app. Either create it once through the Ethora
 * admin/API, or run the endpoint in demo-token-server/, which creates users on
 * demand and needs no token pasted into the source at all.
 *
 * No dependencies: HS256 is 10 lines of node:crypto.
 */
import { createHmac } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const appId = arg('app-id', process.env.ETHORA_CHAT_APP_ID);
const secret = process.env.ETHORA_CHAT_APP_SECRET;
const userId = arg('user', 'ethora-demo');
const days = Number(arg('days', '30'));

if (!appId || !secret) {
  console.error(
    'ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET must be set (use node --env-file=...)'
  );
  process.exit(1);
}

const b64 = (obj) =>
  Buffer.from(JSON.stringify(obj))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const iat = Math.floor(Date.now() / 1000);
const head = b64({ alg: 'HS256', typ: 'JWT' });
const body = b64({
  data: { type: 'client', userId, appId },
  iat,
  exp: iat + days * 24 * 60 * 60,
});
const sig = createHmac('sha256', secret)
  .update(`${head}.${body}`)
  .digest('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const token = `${head}.${body}.${sig}`;

if (process.argv.includes('--write')) {
  const file = path.join(ROOT, 'src/demo-config.ts');
  const src = readFileSync(file, 'utf8');
  const next = src.replace(
    /export const DEMO_CLIENT_TOKEN = '[^']*';/,
    `export const DEMO_CLIENT_TOKEN = '${token}';`
  );
  if (next === src) {
    console.error('could not find DEMO_CLIENT_TOKEN in src/demo-config.ts');
    process.exit(1);
  }
  writeFileSync(file, next);
  console.log(`Wrote a ${days}-day token for "${userId}" into src/demo-config.ts`);
  console.log('Remember: that token is public once the sandbox is public.');
} else {
  console.log(token);
}
