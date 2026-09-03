# Ethora chat component: live sandbox

Minimal Vite + React + TypeScript app that mounts [`@ethora/chat-component`](https://www.npmjs.com/package/@ethora/chat-component),
the open-source React chat and AI-agent UI by [Ethora](https://ethora.com).

## Open it online (no local setup)

Open `open-in-online-ide.html` from this folder in a browser and press one of the two buttons:

- Open in CodeSandbox (POSTs the project to the CodeSandbox define API)
- Open in StackBlitz (POSTs the project to StackBlitz)

Neither needs an account. The plain CodeSandbox link is also saved in `codesandbox-url.txt`.
Regenerate both after editing the demo: `node tools/make-launchers.mjs`.

## Run it

```bash
npm install
npm run dev
```

## No login screen in the way

Out of the box the component asks for an Ethora email and password, which is the wrong first
impression for a demo. `src/useDemoIdentity.ts` wraps it and resolves a session on load, then keeps
that identity in `localStorage`, so a reload never sends the visitor back to a login form. Pick one
mode in `src/demo-config.ts`:

| Mode | What the visitor gets | What it costs you |
| --- | --- | --- |
| `DEMO_TOKEN_ENDPOINT` | Own user, created on first visit, reused forever | Deploy `demo-token-server/` (holds the app secret) |
| `DEMO_CLIENT_TOKEN` | One shared demo user | Mint a token: `node --env-file=.env tools/make-demo-token.mjs --user ethora-demo --days 30 --write` |
| `DEMO_ACCOUNT` | One shared demo user | Sign up a throwaway account at [app.chat.ethora.com](https://app.chat.ethora.com), paste email + password |
| none of them | The component's own login form | Nothing |

Both shared modes put a working credential into public source, so use a throwaway identity and
rotate it. The endpoint mode is the only one that keeps the secret server-side and gives every
visitor a separate user, which is what you want if the sandbox is linked from docs or a blog post.

Runtime overrides, handy when you do not want to edit the source in a public sandbox:
`?tokenUrl=https://.../api/demo-token` or `?token=<client JWT>`.

The top bar shows which identity is live and lets the visitor mint a new demo user or switch to
their own Ethora account. Everything else (rooms, history, typing, media) works from there.

The chat connects to Ethora Cloud: `https://api.chat.ethora.com/v1` + `wss://xmpp.chat.ethora.com/ws`.

## The whole integration

```tsx
import { Chat, XmppProvider } from '@ethora/chat-component';

const config = { baseUrl: 'https://api.chat.ethora.com/v1' };

<XmppProvider config={config}>
  <Chat config={config} />
</XmppProvider>;
```

`src/App.tsx` has the commented list of the options worth trying first (theme, hide the room list,
typography, backgrounds, notifications). Full reference: the package
[README](https://github.com/dappros/ethora-chat-component#full-config-reference-iconfig).

## How this maps to a real product

The demo modes are the same auth hooks you would use in production:

```tsx
<Chat config={{ jwtLogin: { enabled: true, token: YOUR_CLIENT_JWT } }} />
// or userLogin (inject an already authenticated user) /
//    customLogin (your own async login) / googleLogin
```

Your backend mints the client JWT from your app secret exactly like
`demo-token-server/api/demo-token.js` does, so the visitor never sees an Ethora login screen.

## Other Ethora SDKs

- React Native: `@ethora/chat-component-rn`
- iOS (SwiftUI): [ethora-sdk-swift](https://github.com/dappros/ethora-sdk-swift)
- Android (Compose): [ethora-sdk-android](https://github.com/dappros/ethora-sdk-android)
- WordPress plugin: [Ethora Chat Assistant](https://wordpress.org/plugins/ethora-chat-assistant/)
