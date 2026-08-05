import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import {
  accountForGoogleClaims,
  handleChallengeRequest,
  knockout256AchievementDefinition,
  premierLeagueAchievementDefinition,
  retroAchievementPoints,
  uclAchievementDefinition,
} from "../challenge-service.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const challengeServiceSource = fs.readFileSync(path.join(root, "challenge-service.mjs"), "utf8");
const premierLeagueTitleClubs = [
  "arsenal",
  "chelsea",
  "liverpool",
  "manchester-city",
  "manchester-united",
  "tottenham-hotspur",
];
premierLeagueTitleClubs.forEach((clubId) => {
  assert.equal(
    premierLeagueAchievementDefinition(clubId)?.objectiveLabel,
    "Win the Premier League",
    `${clubId} must require winning the league.`,
  );
});
["leeds-united", "sunderland"].forEach((clubId) => {
  const definition = premierLeagueAchievementDefinition(clubId);
  assert.equal(definition?.targetPosition, 10, `${clubId} must require a top-half finish.`);
  assert.equal(definition?.objectiveLabel, "Finish in the top half");
});
assert.equal(premierLeagueAchievementDefinition("ipswich-town")?.targetPosition, 17);
assert.equal(premierLeagueAchievementDefinition("ipswich-town")?.objectiveLabel, "Avoid relegation");
assert.equal(premierLeagueAchievementDefinition("ipswich-town")?.points, 8);
assert.equal(premierLeagueAchievementDefinition("hull-city")?.targetPosition, 17);
assert.equal(premierLeagueAchievementDefinition("hull-city")?.objectiveLabel, "Avoid relegation");
assert.equal(premierLeagueAchievementDefinition("coventry-city")?.targetPosition, 17);
assert.equal(premierLeagueAchievementDefinition("coventry-city")?.objectiveLabel, "Avoid relegation");
assert.deepEqual(
  {
    objective: uclAchievementDefinition("real-madrid").objectiveLabel,
    targetStageIndex: uclAchievementDefinition("real-madrid").targetStageIndex,
    points: uclAchievementDefinition("real-madrid").points,
  },
  { objective: "Win the UCL", targetStageIndex: 5, points: 2 },
);
assert.deepEqual(
  {
    objective: uclAchievementDefinition("nk-celje").objectiveLabel,
    targetStageIndex: uclAchievementDefinition("nk-celje").targetStageIndex,
    points: uclAchievementDefinition("nk-celje").points,
  },
  { objective: "Finish in the top 24", targetStageIndex: 0, points: 9 },
);
const leaderboardSource = challengeServiceSource.slice(
  challengeServiceSource.indexOf("async function achievementLeaderboard"),
  challengeServiceSource.indexOf("async function knockout256Achievement(request"),
);
assert.match(leaderboardSource, /Promise\.all\(\[/);
assert.doesNotMatch(
  leaderboardSource,
  /retro_2022_attempts[\s\S]*UNION ALL[\s\S]*knockout_256_attempts/,
  "The D1 leaderboard must not exceed Cloudflare's five-term compound SELECT limit.",
);
const leaderboardQueries = [...leaderboardSource.matchAll(
  /env\.CHALLENGE_DB\.prepare\(`([\s\S]*?)`\)\.all\(\)/g,
)].map((match) => match[1]);
assert.ok(
  leaderboardQueries.every((query) => (query.match(/\bUNION ALL\b/g) || []).length < 5),
  "Every production D1 leaderboard query must stay below the five-UNION compound SELECT limit.",
);
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

assert.equal(retroAchievementPoints(2010, "Spain"), 1);
assert.equal(retroAchievementPoints(2010, "North Korea"), 10);
assert.equal(retroAchievementPoints(1998, "France"), 2);
assert.equal(retroAchievementPoints(1998, "Jamaica"), 10);
assert.equal(retroAchievementPoints(2006, "Italy"), 1);
assert.equal(retroAchievementPoints(2006, "Saudi Arabia"), 10);
assert.equal(retroAchievementPoints(2022, "France"), 1);
assert.equal(retroAchievementPoints(2022, "Qatar"), 8);
assert.equal(retroAchievementPoints(2026, "Australia"), 5);
assert.deepEqual(
  {
    objective: knockout256AchievementDefinition("team-50").objectiveLabel,
    points: knockout256AchievementDefinition("team-50").points,
  },
  { objective: "Win the tournament", points: 1 },
);
assert.deepEqual(
  {
    objective: knockout256AchievementDefinition("team-221").objectiveLabel,
    points: knockout256AchievementDefinition("team-221").points,
  },
  { objective: "Reach the Round of 64", points: 8 },
);

async function request(pathname, { method = "GET", body, session = true, cookie = null } = {}) {
  const url = new URL(`https://example.com/api/challenge${pathname}`);
  const response = await handleChallengeRequest(new Request(url, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : session && sessionCookie ? { Cookie: sessionCookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }), env, url);
  const setCookies = response.headers.getSetCookie();
  const activeSessionCookie = setCookies.find((value) => /^__Host-world256_session=[A-Za-z0-9_-]{43};/.test(value));
  if (activeSessionCookie) sessionCookie = activeSessionCookie.split(";")[0];
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
assert.match(sessionCookie, /^__Host-world256_session=[A-Za-z0-9_-]{43}$/);

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
assert.equal(emailLogin.response.headers.getSetCookie().length, 3);
assert.match(emailLogin.response.headers.getSetCookie()[0], /^palestine_session=.*SameSite=Lax; Max-Age=0/);
assert.match(emailLogin.response.headers.getSetCookie()[1], /Partitioned; Max-Age=0/);
assert.match(emailLogin.response.headers.getSetCookie()[2], /^__Host-world256_session=.*SameSite=Lax/);

const duplicateCookieProfile = await request("/profile", {
  cookie: `palestine_session=${"z".repeat(43)}; ${sessionCookie}`,
});
assert.equal(duplicateCookieProfile.response.status, 200);
assert.equal(duplicateCookieProfile.payload.account.username, username);

await request("/logout", { method: "POST", body: {} });
sessionCookie = "";
const usernameLogin = await request("/login", {
  method: "POST",
  body: { identifier: username.toUpperCase(), password },
  session: false,
});
assert.equal(usernameLogin.response.status, 200);
assert.deepEqual(usernameLogin.payload.account.assetPacks, []);

const accountCustomTeam = {
  id: "custom-cloud-abc123",
  name: "Cloud United",
  simulationRatings: { overall: 82, attack: 84, midfield: 83, defence: 81, goalkeeper: 79 },
  playerProfiles: Array.from({ length: 11 }, (_, index) => ({
    name: `Cloud Player ${index + 1}`,
    position: index === 0 ? "GK" : index < 5 ? "CB" : index < 9 ? "CM" : "ST",
    overall: 80 + (index % 3),
  })),
};
const savedCustomTeam = await request("/custom-teams", { method: "POST", body: { team: accountCustomTeam } });
assert.equal(savedCustomTeam.response.status, 200);
assert.equal(savedCustomTeam.payload.team.name, "Cloud United");
const accountCustomTeams = await request("/custom-teams");
assert.equal(accountCustomTeams.response.status, 200);
assert.equal(accountCustomTeams.payload.teams.length, 1);
assert.equal(accountCustomTeams.payload.teams[0].id, accountCustomTeam.id);
const deletedCustomTeam = await request(`/custom-teams/${accountCustomTeam.id}`, { method: "DELETE" });
assert.equal(deletedCustomTeam.response.status, 200);
assert.equal(deletedCustomTeam.payload.deleted, true);
assert.equal((await request("/custom-teams")).payload.teams.length, 0);

const anonymousAssetInstall = await request("/assets/pl-26-27", {
  method: "POST",
  body: {},
  session: false,
});
assert.equal(anonymousAssetInstall.response.status, 401);

const installedAssetPack = await request("/assets/pl-26-27", {
  method: "POST",
  body: {},
});
assert.equal(installedAssetPack.response.status, 200);
assert.equal(installedAssetPack.payload.assetPack.id, "pl-26-27");
assert.equal(installedAssetPack.payload.assetPack.installed, true);
assert.deepEqual(installedAssetPack.payload.account.assetPacks, ["pl-26-27"]);

const duplicateAssetInstall = await request("/assets/pl-26-27", {
  method: "POST",
  body: {},
});
assert.equal(duplicateAssetInstall.response.status, 200);
assert.equal(
  duplicateAssetInstall.payload.assetPack.installedAt,
  installedAssetPack.payload.assetPack.installedAt,
);

const installedUclAssetPack = await request("/assets/ucl-26-27", {
  method: "POST",
  body: {},
});
assert.equal(installedUclAssetPack.response.status, 200);
assert.equal(installedUclAssetPack.payload.assetPack.id, "ucl-26-27");
assert.equal(installedUclAssetPack.payload.assetPack.installed, true);
assert.deepEqual(installedUclAssetPack.payload.account.assetPacks, ["pl-26-27", "ucl-26-27"]);

const dashboardWithAssets = await request("");
assert.deepEqual(dashboardWithAssets.payload.account.assetPacks, ["pl-26-27", "ucl-26-27"]);

const retro2006FirstSeed = 2006060901;
const retro2006Started = await request("/achievements/retro-2006", {
  method: "POST",
  body: { seed: retro2006FirstSeed, teamName: "Argentina", phase: "start", champion: null },
});
assert.equal(retro2006Started.response.status, 200);
assert.equal(retro2006Started.payload.achievement.id, "retro-2006-world-tour");
assert.equal(retro2006Started.payload.achievement.total, 32);
assert.equal(retro2006Started.payload.unlockedTeam.attempts, 1);
assert.equal(retro2006Started.payload.unlockedTeam.won, false);

const retro2006Loss = await request("/achievements/retro-2006", {
  method: "POST",
  body: { seed: retro2006FirstSeed, teamName: "Argentina", phase: "complete", champion: "Italy" },
});
assert.equal(retro2006Loss.response.status, 200);
assert.equal(retro2006Loss.payload.countryUnlocked, false);
assert.equal(retro2006Loss.payload.challengeUnlocked, false);
assert.equal(retro2006Loss.payload.unlockedTeam.won, false);

const retro2006WinningSeed = retro2006FirstSeed + 1;
const retro2006Retry = await request("/achievements/retro-2006", {
  method: "POST",
  body: { seed: retro2006WinningSeed, teamName: "Argentina", phase: "start", champion: null },
});
assert.equal(retro2006Retry.payload.unlockedTeam.attempts, 2);

const retro2006Win = await request("/achievements/retro-2006", {
  method: "POST",
  body: { seed: retro2006WinningSeed, teamName: "Argentina", phase: "complete", champion: "Argentina" },
});
assert.equal(retro2006Win.response.status, 200);
assert.equal(retro2006Win.payload.countryUnlocked, true);
assert.equal(retro2006Win.payload.challengeUnlocked, false);
assert.equal(retro2006Win.payload.unlockedTeam.won, true);
assert.equal(retro2006Win.payload.unlockedTeam.wonOnAttempt, 2);
assert.equal(retro2006Win.payload.achievement.completed, 1);
assert.equal(retro2006Win.payload.achievement.completedPoints, retro2006Win.payload.unlockedTeam.points);

const retro2006Duplicate = await request("/achievements/retro-2006", {
  method: "POST",
  body: { seed: retro2006WinningSeed, teamName: "Argentina", phase: "complete", champion: "Argentina" },
});
assert.equal(retro2006Duplicate.response.status, 200);
assert.equal(retro2006Duplicate.payload.countryUnlocked, false);
assert.equal(retro2006Duplicate.payload.unlockedTeam.attempts, 2);
assert.equal(retro2006Duplicate.payload.unlockedTeam.wonOnAttempt, 2);

const retro2006Persisted = await request("/achievements/retro-2006");
assert.equal(retro2006Persisted.response.status, 200);
assert.equal(retro2006Persisted.payload.achievement.completed, 1);
assert.equal(
  retro2006Persisted.payload.achievement.teams.find((team) => team.teamName === "Argentina")?.wonOnAttempt,
  2,
);

const retro2006InvalidTeam = await request("/achievements/retro-2006", {
  method: "POST",
  body: { seed: retro2006WinningSeed + 1, teamName: "Norway", phase: "complete", champion: "Norway" },
});
assert.equal(retro2006InvalidTeam.response.status, 400);

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
assert.equal(completed.payload.unlockedTeam.points, 8);
assert.equal(completed.payload.achievement.completedPoints, completed.payload.unlockedTeam.points);

const retro2026Seed = 2026061101;
const retro2026Started = await request("/achievements/retro-2026", {
  method: "POST",
  body: { seed: retro2026Seed, teamName: "Cabo Verde", phase: "start", champion: null },
});
assert.equal(retro2026Started.response.status, 200);
assert.equal(retro2026Started.payload.unlockedTeam.attempts, 1);
assert.equal(retro2026Started.payload.achievement.total, 48);

const retro2026Completed = await request("/achievements/retro-2026", {
  method: "POST",
  body: { seed: retro2026Seed, teamName: "Cabo Verde", phase: "complete", champion: "Cabo Verde" },
});
assert.equal(retro2026Completed.response.status, 200);
assert.equal(retro2026Completed.payload.countryUnlocked, true);
assert.equal(retro2026Completed.payload.unlockedTeam.won, true);
assert.equal(retro2026Completed.payload.achievement.id, "retro-2026-world-tour");
assert.equal(retro2026Completed.payload.achievement.completed, 1);
assert.equal(retro2026Completed.payload.achievement.total, 48);

const copaPublicProgress = await request("/achievements/retro-2024", { session: false });
assert.equal(copaPublicProgress.response.status, 200, "the Copa achievement GET endpoint must be public");
assert.equal(copaPublicProgress.payload.achievement.total, 16);
assert.equal(copaPublicProgress.payload.achievement.teams.length, 16);

const copaArgentinaSeed = 2024062001;
const copaArgentinaStarted = await request("/achievements/retro-2024", {
  method: "POST",
  body: { seed: copaArgentinaSeed, teamName: "Argentina", phase: "start", champion: null },
});
assert.equal(copaArgentinaStarted.response.status, 200);
assert.equal(copaArgentinaStarted.payload.achievement.id, "retro-2024-copa-america-tour");
assert.equal(copaArgentinaStarted.payload.unlockedTeam.attempts, 1);
assert.equal(copaArgentinaStarted.payload.unlockedTeam.won, false);

const copaArgentinaLoss = await request("/achievements/retro-2024", {
  method: "POST",
  body: { seed: copaArgentinaSeed, teamName: "Argentina", phase: "complete", champion: "Uruguay" },
});
assert.equal(copaArgentinaLoss.response.status, 200);
assert.equal(copaArgentinaLoss.payload.countryUnlocked, false);
assert.equal(copaArgentinaLoss.payload.unlockedTeam.won, false);

const copaArgentinaWinningSeed = copaArgentinaSeed + 1;
const copaArgentinaRetry = await request("/achievements/retro-2024", {
  method: "POST",
  body: { seed: copaArgentinaWinningSeed, teamName: "Argentina", phase: "start", champion: null },
});
assert.equal(copaArgentinaRetry.payload.unlockedTeam.attempts, 2);
const copaArgentinaWin = await request("/achievements/retro-2024", {
  method: "POST",
  body: { seed: copaArgentinaWinningSeed, teamName: "Argentina", phase: "complete", champion: "Argentina" },
});
assert.equal(copaArgentinaWin.response.status, 200);
assert.equal(copaArgentinaWin.payload.countryUnlocked, true);
assert.equal(copaArgentinaWin.payload.unlockedTeam.won, true);
assert.equal(copaArgentinaWin.payload.unlockedTeam.wonOnAttempt, 2);
assert.equal(copaArgentinaWin.payload.achievement.completed, 1);
assert.equal(copaArgentinaWin.payload.unlockedTeam.points, 1);

const copaArgentinaDuplicate = await request("/achievements/retro-2024", {
  method: "POST",
  body: { seed: copaArgentinaWinningSeed, teamName: "Argentina", phase: "complete", champion: "Argentina" },
});
assert.equal(copaArgentinaDuplicate.response.status, 200);
assert.equal(copaArgentinaDuplicate.payload.countryUnlocked, false);
assert.equal(copaArgentinaDuplicate.payload.unlockedTeam.attempts, 2);

const copaPersisted = await request("/achievements/retro-2024");
assert.equal(copaPersisted.payload.achievement.completed, 1);
assert.equal(copaPersisted.payload.achievement.teams.find((team) => team.teamName === "Argentina")?.won, true);

const euro2016Teams = [
  "France", "Romania", "Albania", "Switzerland",
  "England", "Russia", "Wales", "Slovakia",
  "Germany", "Ukraine", "Poland", "Northern Ireland",
  "Spain", "Czech Republic", "Turkey", "Croatia",
  "Belgium", "Italy", "Republic of Ireland", "Sweden",
  "Portugal", "Iceland", "Austria", "Hungary",
];
let euroMastered = null;
for (const [index, teamName] of euro2016Teams.entries()) {
  const euroSeed = 2016061001 + index;
  const euroStarted = await request("/achievements/retro-2016", {
    method: "POST",
    body: { seed: euroSeed, teamName, phase: "start", champion: null },
  });
  assert.equal(euroStarted.response.status, 200, `${teamName} Euro attempt should start`);
  assert.equal(euroStarted.payload.unlockedTeam.teamName, teamName);
  assert.equal(euroStarted.payload.unlockedTeam.won, false);

  if (teamName === "Albania") {
    const euroLoss = await request("/achievements/retro-2016", {
      method: "POST",
      body: { seed: euroSeed, teamName, phase: "complete", champion: "France" },
    });
    assert.equal(euroLoss.response.status, 200);
    assert.equal(euroLoss.payload.countryUnlocked, false);
    assert.equal(euroLoss.payload.unlockedTeam.won, false);

    const retryStarted = await request("/achievements/retro-2016", {
      method: "POST",
      body: { seed: euroSeed + 1000, teamName, phase: "start", champion: null },
    });
    assert.equal(retryStarted.payload.unlockedTeam.attempts, 2);
  }

  const winningSeed = teamName === "Albania" ? euroSeed + 1000 : euroSeed;
  const euroCompleted = await request("/achievements/retro-2016", {
    method: "POST",
    body: { seed: winningSeed, teamName, phase: "complete", champion: teamName },
  });
  assert.equal(euroCompleted.response.status, 200, `${teamName} Euro win should save`);
  assert.equal(euroCompleted.payload.countryUnlocked, true, `${teamName} should unlock once`);
  assert.equal(euroCompleted.payload.unlockedTeam.won, true);
  assert.equal(euroCompleted.payload.achievement.id, "retro-2016-european-tour");
  assert.equal(euroCompleted.payload.achievement.total, 24);
  assert.equal(euroCompleted.payload.achievement.completed, index + 1);
  assert.equal(euroCompleted.payload.challengeUnlocked, index === euro2016Teams.length - 1);
  euroMastered = euroCompleted.payload.achievement;
}

assert.equal(euroMastered.unlocked, true);
assert.equal(euroMastered.teams.length, 24);
assert.equal(euroMastered.teams.every((team) => team.won), true);
assert.equal(euroMastered.teams.find((team) => team.teamName === "Albania")?.wonOnAttempt, 2);
assert.equal(
  euroMastered.completedPoints,
  euroMastered.teams.reduce((total, team) => total + team.points, 0),
);

const duplicateEuroCompletion = await request("/achievements/retro-2016", {
  method: "POST",
  body: { seed: 2016061024, teamName: "Hungary", phase: "complete", champion: "Hungary" },
});
assert.equal(duplicateEuroCompletion.response.status, 200);
assert.equal(duplicateEuroCompletion.payload.countryUnlocked, false);
assert.equal(duplicateEuroCompletion.payload.challengeUnlocked, false);
assert.equal(duplicateEuroCompletion.payload.achievement.completed, 24);

const invalidEuroTeam = await request("/achievements/retro-2016", {
  method: "POST",
  body: { seed: 2016063000, teamName: "Netherlands", phase: "complete", champion: "Netherlands" },
});
assert.equal(invalidEuroTeam.response.status, 400);

const persistedEuroProgress = await request("/achievements/retro-2016");
assert.equal(persistedEuroProgress.response.status, 200);
assert.equal(persistedEuroProgress.payload.achievement.unlocked, true);
assert.equal(persistedEuroProgress.payload.achievement.completed, 24);

const spainFinalist = await request("/achievements/knockout-256", {
  method: "POST",
  body: {
    seed: 256001,
    teamId: "team-50",
    bestRoundIndex: 7,
    championTeamId: "team-1",
    phase: "complete",
  },
});
assert.equal(spainFinalist.response.status, 200);
assert.equal(spainFinalist.payload.unlockedTeam.complete, false);
assert.equal(spainFinalist.payload.unlockedTeam.attempts, 1);
assert.equal(spainFinalist.payload.unlockedTeam.achievedOnAttempt, null);

// A malformed/stale stored flag must never turn a favourite's runner-up finish
// into a completed achievement or leaderboard points.
sqlite.prepare(`
  UPDATE knockout_256_attempts
  SET achieved = 1, champion = 0
  WHERE account_id = (SELECT id FROM accounts WHERE username = ?)
    AND tournament_seed = ?
    AND team_id = 'team-50'
`).run(username, 256001);
const hardenedFinalistProgress = await request("/achievements/knockout-256");
assert.equal(
  hardenedFinalistProgress.payload.achievement.teams.find((team) => team.teamId === "team-50")?.complete,
  false,
);
const hardenedFinalistBoard = await request("/achievements/leaderboard");
assert.equal(hardenedFinalistBoard.payload.currentUser.achievements, 28);
assert.equal(
  hardenedFinalistBoard.payload.currentUser.points,
  retro2006Win.payload.unlockedTeam.points
    + completed.payload.unlockedTeam.points
    + copaArgentinaWin.payload.unlockedTeam.points
    + retro2026Completed.payload.unlockedTeam.points
    + euroMastered.completedPoints,
);

const spainChampion = await request("/achievements/knockout-256", {
  method: "POST",
  body: {
    seed: 256002,
    teamId: "team-50",
    bestRoundIndex: 7,
    championTeamId: "team-50",
    phase: "complete",
  },
});
assert.equal(spainChampion.response.status, 200);
assert.equal(spainChampion.payload.countryUnlocked, true);
assert.equal(spainChampion.payload.unlockedTeam.complete, true);
assert.equal(spainChampion.payload.unlockedTeam.attempts, 2);
assert.equal(spainChampion.payload.unlockedTeam.achievedOnAttempt, 2);

const duplicateSpainCompletion = await request("/achievements/knockout-256", {
  method: "POST",
  body: {
    seed: 256002,
    teamId: "team-50",
    bestRoundIndex: 7,
    championTeamId: "team-50",
    phase: "complete",
  },
});
assert.equal(duplicateSpainCompletion.response.status, 200);
assert.equal(duplicateSpainCompletion.payload.countryUnlocked, false);
assert.equal(duplicateSpainCompletion.payload.unlockedTeam.attempts, 2);
assert.equal(duplicateSpainCompletion.payload.unlockedTeam.achievedOnAttempt, 2);

const nauruRoundOf16 = await request("/achievements/knockout-256", {
  method: "POST",
  body: {
    seed: 256003,
    teamId: "team-221",
    bestRoundIndex: 4,
    championTeamId: null,
    phase: "progress",
  },
});
assert.equal(nauruRoundOf16.response.status, 200);
assert.equal(nauruRoundOf16.payload.countryUnlocked, true);
assert.equal(nauruRoundOf16.payload.unlockedTeam.complete, true);
assert.equal(nauruRoundOf16.payload.achievement.completed, 2);
assert.equal(nauruRoundOf16.payload.achievement.total, 256);
assert.equal(nauruRoundOf16.payload.unlockedTeam.attempts, 1);
assert.equal(nauruRoundOf16.payload.unlockedTeam.achievedOnAttempt, 1);

const invalidKnockoutTeam = await request("/achievements/knockout-256", {
  method: "POST",
  body: {
    seed: 256004,
    teamId: "team-999",
    bestRoundIndex: 7,
    championTeamId: "team-999",
    phase: "complete",
  },
});
assert.equal(invalidKnockoutTeam.response.status, 400);

const invalidKnockoutRound = await request("/achievements/knockout-256", {
  method: "POST",
  body: {
    seed: 256005,
    teamId: "team-221",
    bestRoundIndex: 8,
    championTeamId: null,
    phase: "progress",
  },
});
assert.equal(invalidKnockoutRound.response.status, 400);

const knockoutProgress = await request("/achievements/knockout-256");
assert.equal(knockoutProgress.response.status, 200);
assert.equal(knockoutProgress.payload.achievement.completed, 2);
assert.equal(
  knockoutProgress.payload.achievement.teams.find((team) => team.teamId === "team-50")?.achievedOnAttempt,
  2,
);
assert.equal(
  knockoutProgress.payload.achievement.completedPoints,
  spainChampion.payload.unlockedTeam.points + nauruRoundOf16.payload.unlockedTeam.points,
);

const publicKnockoutAchievements = await request("/achievements/knockout-256", { session: false });
assert.equal(publicKnockoutAchievements.response.status, 200);
assert.equal(publicKnockoutAchievements.payload.achievement.completed, 0);
assert.equal(publicKnockoutAchievements.payload.achievement.total, 256);
assert.equal(publicKnockoutAchievements.payload.achievement.teams.length, 256);

const premierLeagueStarted = await request("/achievements/premier-league", {
  method: "POST",
  body: { seed: 26001, clubId: "arsenal", phase: "start" },
});
assert.equal(premierLeagueStarted.response.status, 200);
assert.equal(premierLeagueStarted.payload.countryUnlocked, false);
assert.equal(
  premierLeagueStarted.payload.achievement.teams.find((team) => team.clubId === "arsenal").complete,
  false,
);

const premierLeagueMissedTarget = await request("/achievements/premier-league", {
  method: "POST",
  body: { seed: 26001, clubId: "arsenal", phase: "complete", finalPosition: 2 },
});
assert.equal(premierLeagueMissedTarget.response.status, 200);
assert.equal(premierLeagueMissedTarget.payload.countryUnlocked, false);

const premierLeagueWon = await request("/achievements/premier-league", {
  method: "POST",
  body: { seed: 26002, clubId: "arsenal", phase: "complete", finalPosition: 1 },
});
assert.equal(premierLeagueWon.response.status, 200);
assert.equal(premierLeagueWon.payload.countryUnlocked, true);
assert.equal(premierLeagueWon.payload.unlockedTeam.objectiveLabel, "Win the Premier League");
assert.equal(premierLeagueWon.payload.unlockedTeam.points, 2);
assert.equal(premierLeagueWon.payload.achievement.completedPoints, 2);

const ipswichSurvived = await request("/achievements/premier-league", {
  method: "POST",
  body: { seed: 26003, clubId: "ipswich-town", phase: "complete", finalPosition: 17 },
});
assert.equal(ipswichSurvived.response.status, 200);
assert.equal(ipswichSurvived.payload.countryUnlocked, true);
assert.equal(ipswichSurvived.payload.unlockedTeam.objectiveLabel, "Avoid relegation");
assert.equal(ipswichSurvived.payload.unlockedTeam.targetPosition, 17);
assert.equal(ipswichSurvived.payload.unlockedTeam.points, 8);
assert.equal(ipswichSurvived.payload.achievement.completedPoints, 10);

const accountId = sqlite.prepare("SELECT id FROM accounts WHERE username = ?").get(username).id;
sqlite.prepare(`
  INSERT INTO premier_league_attempts
    (account_id, season_seed, club_id, final_position, achieved, started_at, completed_at)
  VALUES (?, 26004, 'ipswich-town', 16, 0, 1000, 2000)
`).run(accountId);
sqlite.exec(fs.readFileSync(path.join(root, "migrations", "0018_ipswich_avoid_relegation.sql"), "utf8"));
assert.equal(
  sqlite.prepare("SELECT achieved FROM premier_league_attempts WHERE account_id = ? AND season_seed = 26004 AND club_id = 'ipswich-town'").get(accountId).achieved,
  1,
  "The Ipswich rule change must backfill previously completed survival seasons.",
);
sqlite.prepare("DELETE FROM premier_league_attempts WHERE account_id = ? AND season_seed = 26004 AND club_id = 'ipswich-town'").run(accountId);

const uclRealStarted = await request("/achievements/ucl", {
  method: "POST",
  body: { seed: 27001, clubId: "real-madrid", phase: "start", bestStageIndex: -1 },
});
assert.equal(uclRealStarted.response.status, 200);
assert.equal(uclRealStarted.payload.clubUnlocked, false);
assert.equal(uclRealStarted.payload.achievement.total, 39);
assert.equal(uclRealStarted.payload.unlockedTeam.targetStageIndex, 5);
assert.equal(uclRealStarted.payload.unlockedTeam.attempts, 1);

const uclRealFinalist = await request("/achievements/ucl", {
  method: "POST",
  body: { seed: 27001, clubId: "real-madrid", phase: "complete", bestStageIndex: 4 },
});
assert.equal(uclRealFinalist.response.status, 200);
assert.equal(uclRealFinalist.payload.clubUnlocked, false);
assert.equal(uclRealFinalist.payload.unlockedTeam.bestStageIndex, 4);

const uclRealChampion = await request("/achievements/ucl", {
  method: "POST",
  body: { seed: 27002, clubId: "real-madrid", phase: "complete", bestStageIndex: 5 },
});
assert.equal(uclRealChampion.response.status, 200);
assert.equal(uclRealChampion.payload.clubUnlocked, true);
assert.equal(uclRealChampion.payload.unlockedTeam.complete, true);
assert.equal(uclRealChampion.payload.unlockedTeam.attempts, 2);
assert.equal(uclRealChampion.payload.unlockedTeam.achievedOnAttempt, 2);
assert.equal(uclRealChampion.payload.unlockedTeam.points, 2);

const uclArsenalFinal = await request("/achievements/ucl", {
  method: "POST",
  body: { seed: 27003, clubId: "arsenal", phase: "complete", bestStageIndex: 4 },
});
assert.equal(uclArsenalFinal.response.status, 200);
assert.equal(uclArsenalFinal.payload.clubUnlocked, true);
assert.equal(uclArsenalFinal.payload.unlockedTeam.complete, true);
assert.equal(uclArsenalFinal.payload.unlockedTeam.achievedOnAttempt, 1);

const uclCeljeTop24 = await request("/achievements/ucl", {
  method: "POST",
  body: { seed: 27004, clubId: "nk-celje", phase: "complete", bestStageIndex: 0 },
});
assert.equal(uclCeljeTop24.response.status, 200);
assert.equal(uclCeljeTop24.payload.clubUnlocked, true);
assert.equal(uclCeljeTop24.payload.unlockedTeam.complete, true);
assert.equal(uclCeljeTop24.payload.unlockedTeam.objectiveLabel, "Finish in the top 24");
assert.equal(uclCeljeTop24.payload.unlockedTeam.points, 9);

const invalidUclStage = await request("/achievements/ucl", {
  method: "POST",
  body: { seed: 27005, clubId: "nk-celje", phase: "complete", bestStageIndex: 6 },
});
assert.equal(invalidUclStage.response.status, 400);

const uclProgress = await request("/achievements/ucl");
assert.equal(uclProgress.response.status, 200);
assert.equal(uclProgress.payload.achievement.completed, 3);
assert.equal(uclProgress.payload.achievement.total, 39);
assert.equal(
  uclProgress.payload.achievement.completedPoints,
  uclRealChampion.payload.unlockedTeam.points
    + uclArsenalFinal.payload.unlockedTeam.points
    + uclCeljeTop24.payload.unlockedTeam.points,
);

const achievementBoard = await request("/achievements/leaderboard");
assert.equal(achievementBoard.response.status, 200);
assert.equal(achievementBoard.payload.leaderboard[0].username, username);
assert.equal(achievementBoard.payload.leaderboard[0].achievements, 35);
assert.equal(
  achievementBoard.payload.leaderboard[0].points,
  retro2006Win.payload.unlockedTeam.points
    + completed.payload.unlockedTeam.points
    + copaArgentinaWin.payload.unlockedTeam.points
    + retro2026Completed.payload.unlockedTeam.points
    + euroMastered.completedPoints
    + spainChampion.payload.unlockedTeam.points
    + nauruRoundOf16.payload.unlockedTeam.points
    + premierLeagueWon.payload.unlockedTeam.points
    + ipswichSurvived.payload.unlockedTeam.points
    + uclRealChampion.payload.unlockedTeam.points
    + uclArsenalFinal.payload.unlockedTeam.points
    + uclCeljeTop24.payload.unlockedTeam.points,
);
assert.equal(achievementBoard.payload.currentUser.rank, 1);
assert.equal(achievementBoard.payload.totalAchievements, 627);

const publicAchievementBoard = await request("/achievements/leaderboard", { session: false });
assert.equal(publicAchievementBoard.response.status, 200);
assert.equal(publicAchievementBoard.payload.currentUser, null);

const publicAchievementPoints = await request("/achievements/retro-2010", { session: false });
assert.equal(publicAchievementPoints.response.status, 200);
assert.equal(publicAchievementPoints.payload.achievement.completed, 0);
assert.equal(
  publicAchievementPoints.payload.achievement.teams.find((team) => team.teamName === "North Korea").points,
  10,
);

const publicRetro1998 = await request("/achievements/retro-1998", { session: false });
assert.equal(publicRetro1998.response.status, 200);
assert.equal(publicRetro1998.payload.achievement.id, "retro-1998-world-tour");
assert.equal(publicRetro1998.payload.achievement.total, 32);
assert.equal(publicRetro1998.payload.achievement.completed, 0);

const remainingRetro2006Teams = retro2006Persisted.payload.achievement.teams
  .map((team) => team.teamName)
  .filter((teamName) => teamName !== "Argentina");
let retro2006Mastered = null;
for (const [index, teamName] of remainingRetro2006Teams.entries()) {
  const teamSeed = 2006070000 + index;
  const teamStarted = await request("/achievements/retro-2006", {
    method: "POST",
    body: { seed: teamSeed, teamName, phase: "start", champion: null },
  });
  assert.equal(teamStarted.response.status, 200, `${teamName} 2006 attempt should start`);
  assert.equal(teamStarted.payload.countryUnlocked, false);

  const teamWon = await request("/achievements/retro-2006", {
    method: "POST",
    body: { seed: teamSeed, teamName, phase: "complete", champion: teamName },
  });
  assert.equal(teamWon.response.status, 200, `${teamName} 2006 win should save`);
  assert.equal(teamWon.payload.countryUnlocked, true, `${teamName} should unlock once`);
  assert.equal(teamWon.payload.achievement.completed, index + 2);
  assert.equal(teamWon.payload.challengeUnlocked, index === remainingRetro2006Teams.length - 1);
  retro2006Mastered = teamWon.payload.achievement;
}

assert.equal(retro2006Mastered.unlocked, true);
assert.equal(retro2006Mastered.completed, 32);
assert.equal(retro2006Mastered.teams.length, 32);
assert.equal(retro2006Mastered.teams.every((team) => team.won), true);
assert.equal(retro2006Mastered.teams.find((team) => team.teamName === "Argentina")?.wonOnAttempt, 2);
assert.equal(
  retro2006Mastered.completedPoints,
  retro2006Mastered.teams.reduce((total, team) => total + team.points, 0),
);

const retro2006MasteryDuplicate = await request("/achievements/retro-2006", {
  method: "POST",
  body: {
    seed: 2006070000 + remainingRetro2006Teams.length - 1,
    teamName: remainingRetro2006Teams.at(-1),
    phase: "complete",
    champion: remainingRetro2006Teams.at(-1),
  },
});
assert.equal(retro2006MasteryDuplicate.payload.countryUnlocked, false);
assert.equal(retro2006MasteryDuplicate.payload.challengeUnlocked, false);
assert.equal(retro2006MasteryDuplicate.payload.achievement.completed, 32);

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
assert.equal(
  sqlite.prepare("SELECT COUNT(*) AS total FROM retro_2026_attempts WHERE account_id = (SELECT id FROM accounts WHERE username = ?)").get(username).total,
  1,
);
assert.equal(
  sqlite.prepare("SELECT COUNT(*) AS total FROM retro_2016_attempts WHERE account_id = (SELECT id FROM accounts WHERE username = ?)").get(username).total,
  25,
);
assert.equal(
  sqlite.prepare("SELECT COUNT(*) AS total FROM retro_2006_attempts WHERE account_id = (SELECT id FROM accounts WHERE username = ?)").get(username).total,
  33,
);

const retro2002BrazilWin = await request("/achievements/retro-2002", {
  method: "POST",
  body: { seed: 2002063001, teamName: "Brazil", phase: "complete", champion: "Brazil" },
});
assert.equal(retro2002BrazilWin.response.status, 200);
assert.equal(retro2002BrazilWin.payload.countryUnlocked, true);
assert.equal(retro2002BrazilWin.payload.unlockedTeam.teamName, "Brazil");
assert.equal(retro2002BrazilWin.payload.unlockedTeam.won, true);
assert.equal(retro2002BrazilWin.payload.achievement.id, "retro-2002-world-tour");
assert.equal(
  sqlite.prepare("SELECT won FROM retro_2002_attempts WHERE account_id = (SELECT id FROM accounts WHERE username = ?) AND seed = ? AND team_name = 'Brazil'").get(username, 2002063001).won,
  1,
);

const retro1998Seed = 1998061001;
const retro1998Started = await request("/achievements/retro-1998", {
  method: "POST",
  body: { seed: retro1998Seed, teamName: "France", phase: "start", champion: null },
});
assert.equal(retro1998Started.response.status, 200);
assert.equal(retro1998Started.payload.unlockedTeam.attempts, 1);
assert.equal(retro1998Started.payload.unlockedTeam.won, false);

const retro1998Won = await request("/achievements/retro-1998", {
  method: "POST",
  body: { seed: retro1998Seed, teamName: "France", phase: "complete", champion: "France" },
});
assert.equal(retro1998Won.response.status, 200);
assert.equal(retro1998Won.payload.countryUnlocked, true);
assert.equal(retro1998Won.payload.unlockedTeam.teamName, "France");
assert.equal(retro1998Won.payload.unlockedTeam.won, true);

const retro1998Duplicate = await request("/achievements/retro-1998", {
  method: "POST",
  body: { seed: retro1998Seed, teamName: "France", phase: "complete", champion: "France" },
});
assert.equal(retro1998Duplicate.response.status, 200);
assert.equal(retro1998Duplicate.payload.countryUnlocked, false);
assert.equal(retro1998Duplicate.payload.unlockedTeam.attempts, 1);
assert.equal(
  sqlite.prepare("SELECT COUNT(*) AS total, MAX(won) AS won FROM retro_1998_attempts WHERE account_id = (SELECT id FROM accounts WHERE username = ?) AND seed = ? AND team_name = 'France'").get(username, retro1998Seed).total,
  1,
);

sqlite.close();
console.log("Challenge SQLite integration tests passed.");
