import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { handleChallengeRequest } from "../challenge-service.mjs";

await import(new URL("../career-engine.js", import.meta.url));

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
  const activeSessionCookie = response.headers.getSetCookie()
    .find((value) => /^__Host-world256_session=[A-Za-z0-9_-]{43};/.test(value));
  if (activeSessionCookie) sessionCookie = activeSessionCookie.split(";")[0];
  return { response, payload: await response.json() };
}

const unauthenticated = await request("/career", { session: false });
assert.equal(unauthenticated.response.status, 401, "career cloud slot requires the existing account session");

const registered = await request("/register", {
  method: "POST",
  session: false,
  body: {
    username: "career_sqlite_player",
    email: "career.sqlite@example.com",
    password: "a-secure-test-password",
  },
});
assert.equal(registered.response.status, 201);
assert.match(sessionCookie, /^__Host-world256_session=/);

const engine = globalThis.PlayerCareerEngine;
const academies = engine.academyOptions([], 2562026);
const save = engine.createCareer({
  fullName: "Samira Morgan",
  nationality: { id: "team-50", name: "England", code: "GB-ENG", flag: "" },
  position: "CM",
  preferredFoot: "Both",
  academyClubId: academies[0].id,
  clubs: engine.normalizeClubs([]),
  seed: 2562026,
});

const stored = await request("/career", { method: "PUT", body: { save } });
assert.equal(stored.response.status, 200);
assert.equal(stored.payload.slot, 1);
assert.equal(stored.payload.save.player.fullName, "Samira Morgan");
assert.ok(Number(stored.payload.updatedAt) >= Number(save.updatedAt));

const loaded = await request("/career");
assert.equal(loaded.response.status, 200);
assert.equal(loaded.payload.slot, 1);
assert.equal(loaded.payload.save.id, save.id);
assert.equal(loaded.payload.save.season.fixtures.length, save.season.fixtures.length);
assert.ok(engine.validate(loaded.payload.save));

const rejected = await request("/career", {
  method: "PUT",
  body: { save: { ...save, player: { ...save.player, overall: 120 } } },
});
assert.equal(rejected.response.status, 400, "server rejects tampered career ratings");

const deleted = await request("/career", { method: "DELETE" });
assert.equal(deleted.response.status, 200);
assert.equal(deleted.payload.deleted, true);
const empty = await request("/career");
assert.equal(empty.payload.save, null);

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const worker = fs.readFileSync(path.join(root, "worker.mjs"), "utf8");
const build = fs.readFileSync(path.join(root, "scripts", "build-cloudflare.mjs"), "utf8");
assert.match(index, /id="playerCareerScreen"/);
assert.doesNotMatch(index, /id="profileCareerSection"/, "player career is not shown inside the profile");
assert.match(index, /src="\.\/career-engine\.js/);
assert.match(index, /src="\.\/career\.js/);
assert.match(worker, /"\/player-career"/);
assert.match(build, /"career\.css"/);
assert.match(build, /"career-engine\.js"/);

sqlite.close();
console.log("Career cloud slot verified: auth, D1 migration, validation, save, load and delete.");
