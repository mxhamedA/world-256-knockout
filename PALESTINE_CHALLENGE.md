# Palestine Challenge

## Architecture

- `challenge-engine.mjs` owns deterministic bracket simulation and server-side scoring.
- `challenge-auth.mjs` owns password hashing and secure session cookies.
- `challenge-service.mjs` exposes the challenge API and is the only code allowed to create results or scores.
- Cloudflare D1 stores accounts, sessions, challenge configuration, runs, match audit records, command receipts, and leaderboard totals.
- Google sign-in uses Authorization Code flow with PKCE, one-time server state, nonce validation, and server-side JWT signature verification.
- `challenge.js` renders the dedicated `/palestine-challenge` experience. It never submits a score, opponent, result, team, simulation style, or goal level.

The server locks Palestine, Standard simulation, and Normal goals. Every play command is authenticated, idempotent, version checked, and throttled. Only the best 25 completed runs contribute to a player's total.

## Configure The Event

Before the first production migration, update the seeded challenge in `migrations/0001_palestine_challenge.sql`:

- `starts_at` and `ends_at` are Unix timestamps in milliseconds.
- `prizes_json` controls the three prize labels shown on the page.
- The locked team and gameplay settings should remain unchanged.

After production data exists, change event dates or prizes with a D1 query instead of editing client files.

## Deploy

1. Create the production database:

   `npx wrangler d1 create 256teams-accounts`

2. Replace the placeholder `database_id` for `CHALLENGE_DB` in `wrangler.jsonc` with the returned ID.

3. Apply the schema and event configuration:

   `npx wrangler d1 migrations apply 256teams-accounts --remote`

4. In Google Cloud, create a Web OAuth client and add this authorized redirect URI:

   `https://www.256teams.com/api/challenge/google/callback`

5. Store the Google credentials as encrypted Worker secrets:

   `npx wrangler secret put GOOGLE_CLIENT_ID`

   `npx wrangler secret put GOOGLE_CLIENT_SECRET`

6. Verify locally:

   `npm run test:challenge`

   `npm run test:challenge:integration`

   `npm run build`

7. Keep the public route disabled until launch:

   `PALESTINE_CHALLENGE_ENABLED=false`

8. Deploy only when the event dates and prizes are final:

   `npx wrangler deploy`

9. To launch the mode later, unhide the homepage card and change the Worker variable:

   `PALESTINE_CHALLENGE_ENABLED=true`

The public leaderboard remains readable after the configured end time, while new runs and match commands are rejected and the totals stay frozen.
