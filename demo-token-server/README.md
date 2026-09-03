# Demo token endpoint

Gives the sandbox a session without a login form: it creates a user on first
visit, keeps the shared demo room in place, and returns the client token the
chat component exchanges through `config.jwtLogin`.

The Ethora app secret is what signs those tokens, so it must live on a server.
This is the smallest server that does the job.

## Deploy (Vercel)

```bash
cd demo-token-server
npm install
npx vercel deploy --prod
```

Set `ETHORA_CHAT_APP_ID` and `ETHORA_CHAT_APP_SECRET` in the project's
environment variables (see `.env.example` for the optional ones).

Then point the sandbox at it, in `src/demo-config.ts`:

```ts
export const DEMO_TOKEN_ENDPOINT = 'https://your-deployment.vercel.app/api/demo-token';
```

or, without touching the code, open the sandbox with
`?tokenUrl=https://your-deployment.vercel.app/api/demo-token`.

## Contract

```
POST /api/demo-token   { "userId": "sandbox-ab12cd34" }   // userId optional
200  { "userId": "...", "token": "eyJ...", "roomJID": "...@conference.xmpp.chat.ethora.com" }
```

The sandbox stores the `userId` it was given in localStorage and sends it back
on later visits, so the same visitor keeps the same identity and history while
the token itself is re-minted whenever it is close to expiring.

`ALLOWED_ORIGIN` defaults to `*` because a sandbox has no stable origin. Narrow
it once you host the demo yourself, and keep `MAX_USERS_PER_HOUR` low.
