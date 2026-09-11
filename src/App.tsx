import { useMemo } from 'react';
import { Chat, XmppProvider } from '@ethora/chat-component';
import { useDemoIdentity } from './useDemoIdentity';

/**
 * Ethora chat component: live sandbox.
 *
 * The chat itself is the four lines at the bottom of this file. Everything
 * around it exists so that a visitor is not stopped by a login form:
 * `useDemoIdentity` either mints a fresh user (when a token endpoint is
 * configured in src/demo-config.ts) or reuses a shared demo user, and keeps
 * that identity in localStorage so reloads do not lose the session.
 *
 * Docs: https://github.com/dappros/ethora-chat-component
 */
export default function App() {
  const identity = useDemoIdentity();

  // One memoized object shared by the provider and the chat: a new identity on
  // every render would re-trigger the XMPP init.
  const config = useMemo(
    () => ({
      // Ethora Cloud production endpoint (the package default).
      baseUrl: 'https://api.chat.ethora.com/v1',

      // The published @ethora/chat-component bundle resolves its XMPP
      // service URL from `import.meta.env.VITE_*` at the LIBRARY's own
      // build time (when it was built and published to npm), not at this
      // app's build time. Vite inlines/replaces import.meta.env inside a
      // published dist bundle permanently, so a .env file in THIS project
      // can never reach it (confirmed: the shipped dist literally has
      // `env = {}` baked in). xmppSettings is the documented runtime
      // escape hatch for exactly this case; without it xmpp.client() gets
      // service: '' and throws "No compatible connection method found".
      xmppSettings: {
        devServer: 'wss://xmpp.chat.ethora.com/ws',
        host: 'xmpp.chat.ethora.com',
        conference: 'conference.xmpp.chat.ethora.com',
      },

      // With a demo token the component logs in on its own. Without one it
      // falls back to its built-in email/password form.
      ...(identity.token
        ? { jwtLogin: { enabled: true, token: identity.token } }
        : {}),

      // Theme. `primary` also drives icon colours and sender names.
      colors: {
        primary: '#0052CD',
        secondary: '#DBEAFE',
      },

      // Try these:
      // disableHeader: true,
      // disableRooms: true,        // single-room / widget style
      // disableMedia: true,
      // disableNewChatButton: true,
      // disableTypingIndicator: true,
      // typography: { googleFontsFamily: 'Inter', fontSize: 15 },
      // backgroundChat: { color: '#F7F9FC' },
      // hiddenRooms: { titles: ['Main chat'] },
      // inAppNotifications: { enabled: true, position: 'top-right' },
    }),
    [identity.token]
  );

  return (
    <div className="page">
      <header className="topbar">
        <span className="dot" />
        <strong>@ethora/chat-component</strong>
        <span className="muted">React chat + AI agents SDK</span>

        <span className="session">
          {identity.status === 'loading' && 'starting a session...'}
          {identity.status === 'demo' && (
            <>
              signed in as <code>{identity.userId}</code>
            </>
          )}
          {identity.status === 'own' && 'sign in with your Ethora account'}
          {identity.status === 'error' && `demo session failed: ${identity.error}`}
        </span>

        {identity.status === 'demo' && identity.canMintUsers && (
          <button onClick={identity.newUser}>New demo user</button>
        )}
        {identity.status === 'demo' && (
          <button onClick={identity.useOwnAccount}>Use my account</button>
        )}
        {identity.status !== 'demo' && (identity.canMintUsers || identity.error) && (
          <button onClick={identity.backToDemo}>Back to demo user</button>
        )}

        <a
          className="link"
          href="https://github.com/dappros/ethora-chat-component"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </header>

      <main className="chat-shell">
        {identity.status === 'loading' ? (
          <div className="placeholder">Creating a demo user...</div>
        ) : (
          <XmppProvider key={identity.userId ?? 'anon'} config={config}>
            <Chat
              config={config}
              user={identity.account}
              roomJID={identity.roomJID}
              MainComponentStyles={{ height: '100%' }}
            />
          </XmppProvider>
        )}
      </main>
    </div>
  );
}
