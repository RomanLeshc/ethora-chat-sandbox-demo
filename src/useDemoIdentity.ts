import { useCallback, useEffect, useState } from 'react';
import {
  DEMO_ACCOUNT,
  DEMO_CLIENT_TOKEN,
  DEMO_ROOM_JID,
  DEMO_TOKEN_ENDPOINT,
  DEMO_USER_PREFIX,
} from './demo-config';

const STORAGE_KEY = 'ethora-sandbox-identity-v1';
/** Re-mint this long before the token actually dies. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export type DemoMode = 'auto' | 'own';

export type DemoIdentity = {
  /** 'demo' means we can log in on our own, 'own' means show the login form. */
  status: 'loading' | 'demo' | 'own' | 'error';
  token?: string;
  /** Set instead of `token` when a shared email/password account is used. */
  account?: { email: string; password: string };
  userId?: string;
  roomJID?: string;
  error?: string;
  /** Endpoint configured, so "new user" is meaningful. */
  canMintUsers: boolean;
  newUser: () => void;
  useOwnAccount: () => void;
  backToDemo: () => void;
};

type Stored = { userId: string; token?: string; exp?: number; mode: DemoMode };

const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};
const param = (name: string): string => {
  try {
    return new URLSearchParams(window.location.search).get(name) ?? '';
  } catch {
    return '';
  }
};

const tokenEndpoint = () =>
  param('tokenUrl') || env.VITE_DEMO_TOKEN_URL || DEMO_TOKEN_ENDPOINT;
const staticToken = () =>
  param('token') || env.VITE_DEMO_CLIENT_TOKEN || DEMO_CLIENT_TOKEN;

/** `exp` out of a JWT payload, in ms. Undefined when the token has none. */
function tokenExpiry(token: string): number | undefined {
  try {
    const payload = token.replace(/^JWT\s+/i, '').split('.')[1];
    const json = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    ) as { exp?: number; data?: { userId?: string } };
    return payload && json.exp ? json.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function tokenUserId(token: string): string | undefined {
  try {
    const payload = token.replace(/^JWT\s+/i, '').split('.')[1];
    const json = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    ) as { data?: { userId?: string } };
    return json.data?.userId;
  } catch {
    return undefined;
  }
}

function read(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function write(value: Stored | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode: the session simply does not survive a reload */
  }
}

function newUserId(): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${DEMO_USER_PREFIX}-${rnd}`;
}

const isFresh = (exp?: number) => !exp || exp - Date.now() > REFRESH_MARGIN_MS;

/**
 * Resolves the identity the chat should run as, and keeps it in localStorage so
 * a reload does not send the visitor back to a login form.
 */
export function useDemoIdentity(): DemoIdentity {
  const [state, setState] = useState<
    Pick<DemoIdentity, 'status' | 'token' | 'account' | 'userId' | 'roomJID' | 'error'>
  >({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const stored = read();

      if (stored?.mode === 'own') {
        setState({ status: 'own' });
        return;
      }

      // A cached token that is still good: no round trip, no login form.
      if (stored?.token && isFresh(stored.exp)) {
        setState({
          status: 'demo',
          token: stored.token,
          userId: stored.userId,
          roomJID: DEMO_ROOM_JID || undefined,
        });
        return;
      }

      const endpoint = tokenEndpoint();
      if (endpoint) {
        const userId = stored?.userId || newUserId();
        setState({ status: 'loading' });
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          const data = (await res.json()) as { token?: string; roomJID?: string };
          if (!data.token) throw new Error('endpoint returned no token');
          if (cancelled) return;
          write({
            userId,
            token: data.token,
            exp: tokenExpiry(data.token),
            mode: 'auto',
          });
          setState({
            status: 'demo',
            token: data.token,
            userId,
            roomJID: data.roomJID || DEMO_ROOM_JID || undefined,
          });
        } catch (err) {
          if (cancelled) return;
          // A dead endpoint must not lock the visitor out: fall back to the
          // component's own login form instead of a broken screen.
          setState({
            status: 'own',
            error: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }

      const shared = staticToken();
      if (shared) {
        const exp = tokenExpiry(shared);
        if (!isFresh(exp)) {
          setState({ status: 'error', error: 'demo token expired, mint a new one' });
          return;
        }
        const userId = tokenUserId(shared) || 'demo';
        write({ userId, token: shared, exp, mode: 'auto' });
        setState({
          status: 'demo',
          token: shared,
          userId,
          roomJID: DEMO_ROOM_JID || undefined,
        });
        return;
      }

      if (DEMO_ACCOUNT.email && DEMO_ACCOUNT.password) {
        write({ userId: DEMO_ACCOUNT.email, mode: 'auto' });
        setState({
          status: 'demo',
          account: DEMO_ACCOUNT,
          userId: DEMO_ACCOUNT.email,
          roomJID: DEMO_ROOM_JID || undefined,
        });
        return;
      }

      setState({ status: 'own' });
    };

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const newUser = useCallback(() => {
    write(null);
    setNonce((n) => n + 1);
  }, []);

  const useOwnAccount = useCallback(() => {
    const stored = read();
    write({ userId: stored?.userId || '', mode: 'own' });
    setNonce((n) => n + 1);
  }, []);

  const backToDemo = useCallback(() => {
    write(null);
    setNonce((n) => n + 1);
  }, []);

  return {
    ...state,
    canMintUsers: Boolean(tokenEndpoint()),
    newUser,
    useOwnAccount,
    backToDemo,
  };
}
