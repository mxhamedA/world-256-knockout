import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { accountForGoogleClaims, handleChallengeRequest } from "../challenge-service.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sqlite = new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys = ON;");

fs.readdirSync(path.join(root, "migrations"))
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .forEach((file) => sqlite.exec(fs.readFileSync(path.join(root, "migrations", file), "utf8")));

class D1Statement {
  constructor(database, sql, values = []) {
    this.database = database;
    this.sql = sql;
    this.values = values;
  }

  bind(...values) {
    return new D1Statement(this.database, this.sql, values);
  }

  first() {
    return this.database.prepare(this.sql).get(...this.values) || null;
  }

  all() {
    return { results: this.database.prepare(this.sql).all(...this.values) };
  }

  run() {
    const result = this.database.prepare(this.sql).run(...this.values);
    return { meta: { changes: Number(result.changes) } };
  }
}

const db = {
  prepare(sql) {
    return new D1Statement(sqlite, sql);
  },
  batch(statements) {
    sqlite.exec("BEGIN IMMEDIATE;");
    try {
      const results = statements.map((statement) => statement.run());
      sqlite.exec("COMMIT;");
      return results;
    } catch (error) {
      sqlite.exec("ROLLBACK;");
      throw error;
    }
  },
};

const env = { CHALLENGE_DB: db };
let sessionCookie = "";

async function request(pathname, { method = "GET", body, session = true } = {}) {
  const url = new URL(`https://example.com/api/challenge${pathname}`);
  const response = await handleChallengeRequest(new Request(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(session && sessionCookie ? { Cookie: sessionCookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }), env, url);
  const setCookie = response.headers.get("Set-Cookie");
  if (setCookie) sessionCookie = setCookie.split(";")[0];
  return { response, payload: await response.json() };
}

const username = "sqlite_player";
const email = "sqlite.player@example.com";
const password = "a-secure-test-password";

const invalidEmail = await request("/register", {
  method: "POST",
  body: { email: "invalid", username, password },
  session: false,
});
assert.equal(invalidEmail.response.status, 400);
assert.match(invalidEmail.payload.error, /valid email/i);

const registered = await request("/register", {
  method: "POST",
  body: { email: `  ${email.toUpperCase()} `, username, password },
  session: false,
});
assert.equal(registered.response.status, 201);
assert.equal(registered.payload.account.username, username);
assert.match(sessionCookie, /^palestine_session=[A-Za-z0-9_-]{43}$/);

const duplicateEmail = await request("/register", {
  method: "POST",
  body: { email, username: "another_player", password },
  session: false,
});
assert.equal(duplicateEmail.response.status, 409);
assert.match(duplicateEmail.payload.error, /email/i);

const loggedOut = await request("/logout", { method: "POST", body: {} });
assert.equal(loggedOut.response.status, 200);
sessionCookie = "";

const emailLogin = await request("/login", {
  method: "POST",
  body: { identifier: email.toUpperCase(), password },
  session: false,
});
assert.equal(emailLogin.response.status, 200);
assert.equal(emailLogin.payload.account.username, username);

await request("/logout", { method: "POST", body: {} });
sessionCookie = "";
const usernameLogin = await request("/login", {
  method: "POST",
  body: { identifier: username.toUpperCase(), password },
  session: false,
});
assert.equal(usernameLogin.response.status, 200);

const seed = 2022112001;
const started = await request("/achievements/retro-2022", {
  method: "POST",
  body: { seed, teamName: "Qatar", phase: "start", champion: null },
});
assert.equal(started.response.status, 200);
assert.equal(started.payload.unlockedTeam.attempts, 1);

const completed = await request("/achievements/retro-2022", {
  method: "POST",
  body: { seed, teamName: "Qatar", phase: "complete", champion: "Qatar" },
});
assert.equal(completed.response.status, 200);
assert.equal(completed.payload.unlockedTeam.won, true);
assert.equal(completed.payload.achievement.id, "retro-2022-world-tour");
assert.equal(completed.payload.achievement.completed, 1);
assert.equal(completed.payload.achievement.total, 32);

const storedEmail = sqlite.prepare("SELECT email FROM accounts WHERE username = ?").get(username);
assert.equal(storedEmail.email, email);
const linkedAccount = await accountForGoogleClaims(db, { sub: "google-subject-sqlite", email });
assert.equal(linkedAccount.username, username);
assert.ok(
  sqlite.prepare("SELECT email_verified_at FROM accounts WHERE username = ?").get(username).email_verified_at,
  "A verified Google login should verify the matching local account email.",
);
assert.equal(
  sqlite.prepare("SELECT account_id FROM auth_identities WHERE provider = 'google' AND provider_subject = ?").get("google-subject-sqlite").account_id,
  linkedAccount.id,
);
assert.equal((await accountForGoogleClaims(db, { sub: "google-subject-sqlite", email })).id, linkedAccount.id);
assert.equal(
  sqlite.prepare("SELECT COUNT(*) AS total FROM retro_2022_attempts WHERE account_id = (SELECT id FROM accounts WHERE username = ?)").get(username).total,
  1,
);

sqlite.close();
console.log("Challenge SQLite integration tests passed.");
