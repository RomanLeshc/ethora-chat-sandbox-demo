/**
 * POST /api/demo-token  ->  { userId, token, roomJID }
 *
 * Mints a login-free session for the sandbox: creates the user if it is new,
 * makes sure the shared demo room exists, grants access, and returns the
 * client token the chat component exchanges via `config.jwtLogin`.
 *
 * The app secret stays here, on the server. The browser only ever sees a token
 * scoped to one demo user.
 *
 * Deploy anywhere that runs Node functions (Vercel, Netlify, Cloudflare with a
 * Node shim, your own Express app: the handler is plain req/res).
 */
import { getEthoraSDKService } from '@ethora/sdk-backend';

const ROOM_ID = process.env.DEMO_ROOM_ID || 'ethora-sandbox-demo-room';
const ROOM_TITLE = process.env.DEMO_ROOM_TITLE || 'Ethora sandbox demo';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
/** Per-IP cap, so a public endpoint cannot be turned into a user factory. */
const MAX_PER_HOUR = Number(process.env.MAX_USERS_PER_HOUR || 20);
const USER_ID_RE = /^[a-z0-9][a-z0-9-]{2,63}$/;

const hits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const window = 60 * 60 * 1000;
  const seen = (hits.get(ip) || []).filter((t) => now - t < window);
  seen.push(now);
  hits.set(ip, seen);
  return seen.length > MAX_PER_HOUR;
}

let sdk;
function getSdk() {
  if (!sdk) {
    if (!process.env.ETHORA_CHAT_APP_ID || !process.env.ETHORA_CHAT_APP_SECRET) {
      throw new Error('ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET are required');
    }
    process.env.ETHORA_CHAT_API_URL ||= 'https://api.chat.ethora.com';
    process.env.ETHORA_XMPP_DEV_SERVER ||= 'wss://xmpp.chat.ethora.com/ws';
    sdk = getEthoraSDKService();
  }
  return sdk;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'too many demo users from this address' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const requested = String(body.userId || '').toLowerCase();
  const userId = USER_ID_RE.test(requested)
    ? requested
    : `sandbox-${Math.random().toString(36).slice(2, 10)}`;

  try {
    const chat = getSdk();

    // All three are idempotent: a returning visitor just gets a fresh token.
    try {
      await chat.createUser(userId, {
        firstName: 'Sandbox',
        lastName: userId.replace(/^sandbox-/, ''),
      });
    } catch (err) {
      console.warn('createUser (may already exist):', err?.message || err);
    }

    try {
      await chat.createChatRoom(ROOM_ID, {
        title: ROOM_TITLE,
        uuid: ROOM_ID,
        type: 'group',
      });
    } catch (err) {
      console.warn('createChatRoom (may already exist):', err?.message || err);
    }

    try {
      await chat.grantUserAccessToChatRoom(ROOM_ID, userId);
    } catch (err) {
      console.warn('grantUserAccess (may already be granted):', err?.message || err);
    }

    return res.status(200).json({
      userId,
      token: chat.createChatUserJwtToken(userId),
      roomJID: chat.createChatName(ROOM_ID, true),
    });
  } catch (err) {
    console.error('demo-token failed:', err);
    return res.status(500).json({ error: err?.message || 'failed to mint demo session' });
  }
}
