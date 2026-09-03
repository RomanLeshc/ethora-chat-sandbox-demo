/**
 * How the sandbox gets a session without asking the visitor to log in.
 *
 * Ethora exchanges a "client token" (a JWT signed with your app secret) for a
 * real chat session: POST /v1/users/client. The component does that for you
 * through `config.jwtLogin`. Signing needs the secret, so the token is minted
 * either ahead of time (shared demo user) or by a tiny endpoint of yours
 * (a fresh user per visitor).
 *
 * Fill in ONE of the two. Both can also be passed at runtime:
 *   ?tokenUrl=https://...   or   ?token=JWT...
 * and through Vite env vars VITE_DEMO_TOKEN_URL / VITE_DEMO_CLIENT_TOKEN.
 */

/**
 * 1) Auto-create a user per visitor (recommended).
 *
 * Endpoint that accepts `{ userId }` and answers `{ token, roomJID? }`.
 * A ready-to-deploy implementation lives in `demo-token-server/`.
 * The sandbox remembers the userId it was given, so the same visitor keeps
 * the same identity and history across reloads.
 */
export const DEMO_TOKEN_ENDPOINT = '';

/**
 * 2) Or: one shared "default" demo user, no server at all.
 *
 * Mint it with:  node --env-file=.env tools/make-demo-token.mjs --user ethora-demo --days 30
 * Anyone who opens the sandbox is that user, so use a throwaway account and
 * keep the lifetime short.
 */
export const DEMO_CLIENT_TOKEN = '';

/**
 * 3) Or, with no secrets at all: a normal Ethora account used as the shared
 * "default" demo user. Sign one up at https://app.chat.ethora.com, put its
 * credentials here, and the component logs in with them on load.
 *
 * The password sits in public source, so use a throwaway account, keep it out
 * of anything that matters, and rotate it when the demo is done.
 */
export const DEMO_ACCOUNT = { email: '', password: '' };

/** Optional: drop the demo user straight into one room. */
export const DEMO_ROOM_JID = '';

/** Shown in the top bar so it is obvious which identity is in use. */
export const DEMO_USER_PREFIX = 'sandbox';
