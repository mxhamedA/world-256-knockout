import assert from "node:assert/strict";

const baseUrl = process.argv[2] || process.env.CHALLENGE_TEST_URL || "http://127.0.0.1:8793";
const username = `player_${Date.now().toString(36)}`;
const email = `${username}@example.com`;
const password = "a-secure-test-password";
let cookie = "";

async function request(path = "", { method = "GET", body, session = true } = {}) {
  const response = await fetch(`${baseUrl}/api/challenge${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(session && cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const activeSessionCookie = response.headers.getSetCookie()
    .find((value) => /^__Host-world256_session=[A-Za-z0-9_-]{43};/.test(value));
  if (activeSessionCookie) cookie = activeSessionCookie.split(";")[0];
  return { response, payload: await response.json() };
}

const publicDashboard = await request();
assert.equal(publicDashboard.response.status, 200);
assert.equal(publicDashboard.payload.challenge.locked.team, "Palestine");
assert.equal(publicDashboard.payload.challenge.locked.simulation, "Standard");
assert.equal(publicDashboard.payload.challenge.locked.goalLevel, "Normal");
assert.equal(publicDashboard.payload.account, null);
assert.equal(typeof publicDashboard.payload.auth.googleEnabled, "boolean");
if (!publicDashboard.payload.auth.googleEnabled) {
  const googleUnavailable = await request("/google/start?returnTo=/", { session: false });
  assert.equal(googleUnavailable.response.status, 503);
}

const registered = await request("/register", { method: "POST", body: { email, username, password }, session: false });
assert.equal(registered.response.status, 201);
assert.equal(registered.payload.account.username, username);
assert.match(cookie, /^__Host-world256_session=[A-Za-z0-9_-]{43}$/);

const duplicate = await request("/register", { method: "POST", body: { email: `other-${email}`, username, password }, session: false });
assert.equal(duplicate.response.status, 409);
const duplicateEmail = await request("/register", {
  method: "POST",
  body: { email: email.toUpperCase(), username: `${username}_2`.slice(0, 20), password },
  session: false,
});
assert.equal(duplicateEmail.response.status, 409);
assert.match(duplicateEmail.payload.error, /email/i);

const authenticatedDashboard = await request();
assert.equal(authenticatedDashboard.payload.account.username, username);

const profile = await request("/profile");
assert.equal(profile.response.status, 200);
assert.equal(profile.payload.account.username, username);
assert.ok(profile.payload.countries.some((country) => country.id === "team-131"));

const usernameOnly = `${username}_r`.slice(0, 20);
const usernameOnlyProfile = await request("/profile", { method: "PATCH", body: { username: usernameOnly } });
assert.equal(usernameOnlyProfile.response.status, 200);
assert.equal(usernameOnlyProfile.payload.account.username, usernameOnly);

const updatedUsername = `${username}_x`.slice(0, 20);
const updatedProfile = await request("/profile", { method: "PATCH", body: { username: updatedUsername, profileCountryId: "team-131" } });
assert.equal(updatedProfile.response.status, 200);
assert.equal(updatedProfile.payload.account.username, updatedUsername);
assert.equal(updatedProfile.payload.account.profileCountryId, "team-131");

const duplicateProfile = await request("/profile", { method: "PATCH", body: { username: "bad name", profileCountryId: "team-131" } });
assert.equal(duplicateProfile.response.status, 400);

const deletionRequest = await request("/profile/deletion-request", {
  method: "POST",
  body: { reason: "technical", details: "Integration test request" },
});
assert.equal(deletionRequest.response.status, 201);
assert.equal(deletionRequest.payload.deletionRequest.status, "pending");

const profileWithDeletionRequest = await request("/profile");
assert.equal(profileWithDeletionRequest.payload.deletionRequest.reason, "technical");
assert.equal(profileWithDeletionRequest.payload.deletionRequest.status, "pending");

const retroSeed = Date.now();
const southAfricaStarted = await request("/achievements/retro-2010", {
  method: "POST",
  body: { seed: retroSeed, teamName: "South Africa", phase: "start", champion: null },
});
assert.equal(southAfricaStarted.response.status, 200);
assert.equal(southAfricaStarted.payload.unlockedTeam.teamName, "South Africa");
assert.equal(southAfricaStarted.payload.unlockedTeam.attempts, 1);

const southAfricaCompleted = await request("/achievements/retro-2010", {
  method: "POST",
  body: { seed: retroSeed, teamName: "South Africa", phase: "complete", champion: "South Africa" },
});
assert.equal(southAfricaCompleted.response.status, 200);
assert.equal(southAfricaCompleted.payload.unlockedTeam.won, true);
assert.equal(southAfricaCompleted.payload.countryUnlocked, true);
assert.equal(southAfricaCompleted.payload.achievement.id, "retro-2010-world-tour");
assert.equal(southAfricaCompleted.payload.achievement.title, "South Africa 2010 World Tour");
assert.equal(southAfricaCompleted.payload.achievement.year, 2010);
assert.equal(southAfricaCompleted.payload.achievement.completed, 1);
assert.equal(southAfricaCompleted.payload.achievement.total, 32);
assert.equal(southAfricaCompleted.payload.unlockedTeam.points, 10);
assert.equal(southAfricaCompleted.payload.achievement.completedPoints, southAfricaCompleted.payload.unlockedTeam.points);

const southAfricaProgress = await request("/achievements/retro-2010");
assert.equal(southAfricaProgress.response.status, 200);
assert.equal(southAfricaProgress.payload.achievement.completed, 1);
assert.equal(southAfricaProgress.payload.achievement.total, 32);
assert.equal(
  southAfricaProgress.payload.achievement.teams.find((team) => team.teamName === "South Africa")?.won,
  true,
);

const southAfricaDuplicateCompletion = await request("/achievements/retro-2010", {
  method: "POST",
  body: { seed: retroSeed, teamName: "South Africa", phase: "complete", champion: "South Africa" },
});
assert.equal(southAfricaDuplicateCompletion.response.status, 200);
assert.equal(southAfricaDuplicateCompletion.payload.countryUnlocked, false);
assert.equal(southAfricaDuplicateCompletion.payload.unlockedTeam.attempts, 1);
assert.equal(southAfricaDuplicateCompletion.payload.achievement.completed, 1);

const invalid2010Team = await request("/achievements/retro-2010", {
  method: "POST",
  body: { seed: retroSeed + 100, teamName: "Brazil 2026", phase: "complete", champion: "Brazil 2026" },
});
assert.equal(invalid2010Team.response.status, 400);

const retroStarted = await request("/achievements/retro-2014", {
  method: "POST",
  body: { seed: retroSeed + 1, teamName: "Brazil", phase: "start", champion: null },
});
assert.equal(retroStarted.response.status, 200);
assert.equal(retroStarted.payload.unlockedTeam.attempts, 1);

const retroCompleted = await request("/achievements/retro-2014", {
  method: "POST",
  body: { seed: retroSeed + 1, teamName: "Brazil", phase: "complete", champion: "Brazil" },
});
assert.equal(retroCompleted.response.status, 200);
assert.equal(retroCompleted.payload.unlockedTeam.won, true);

const russiaSeed = retroSeed + 2;
const russiaStarted = await request("/achievements/retro-2018", {
  method: "POST",
  body: { seed: russiaSeed, teamName: "Russia", phase: "start", champion: null },
});
assert.equal(russiaStarted.response.status, 200);
assert.equal(russiaStarted.payload.unlockedTeam.teamName, "Russia");
assert.equal(russiaStarted.payload.unlockedTeam.attempts, 1);

const russiaCompleted = await request("/achievements/retro-2018", {
  method: "POST",
  body: { seed: russiaSeed, teamName: "Russia", phase: "complete", champion: "Russia" },
});
assert.equal(russiaCompleted.response.status, 200);
assert.equal(russiaCompleted.payload.unlockedTeam.teamName, "Russia");
assert.equal(russiaCompleted.payload.unlockedTeam.won, true);

const qatarSeed = retroSeed + 3;
const qatarStarted = await request("/achievements/retro-2022", {
  method: "POST",
  body: { seed: qatarSeed, teamName: "Qatar", phase: "start", champion: null },
});
assert.equal(qatarStarted.response.status, 200);
assert.equal(qatarStarted.payload.unlockedTeam.teamName, "Qatar");
assert.equal(qatarStarted.payload.unlockedTeam.attempts, 1);

const qatarCompleted = await request("/achievements/retro-2022", {
  method: "POST",
  body: { seed: qatarSeed, teamName: "Qatar", phase: "complete", champion: "Qatar" },
});
assert.equal(qatarCompleted.response.status, 200);
assert.equal(qatarCompleted.payload.unlockedTeam.won, true);
assert.equal(qatarCompleted.payload.achievement.id, "retro-2022-world-tour");
assert.equal(qatarCompleted.payload.achievement.year, 2022);
assert.equal(qatarCompleted.payload.achievement.total, 32);

const euroSeed = retroSeed + 4;
const franceEuroStarted = await request("/achievements/retro-2016", {
  method: "POST",
  body: { seed: euroSeed, teamName: "France", phase: "start", champion: null },
});
assert.equal(franceEuroStarted.response.status, 200);
assert.equal(franceEuroStarted.payload.unlockedTeam.attempts, 1);

const franceEuroCompleted = await request("/achievements/retro-2016", {
  method: "POST",
  body: { seed: euroSeed, teamName: "France", phase: "complete", champion: "France" },
});
assert.equal(franceEuroCompleted.response.status, 200);
assert.equal(franceEuroCompleted.payload.countryUnlocked, true);
assert.equal(franceEuroCompleted.payload.unlockedTeam.won, true);
assert.equal(franceEuroCompleted.payload.achievement.id, "retro-2016-european-tour");
assert.equal(franceEuroCompleted.payload.achievement.title, "UEFA Euro 2016 Tour");
assert.equal(franceEuroCompleted.payload.achievement.total, 24);

const knockoutSeed = retroSeed + 10;
const strongTeamMiss = await request("/achievements/knockout-256", {
  method: "POST",
  body: {
    seed: knockoutSeed,
    teamId: "team-50",
    bestRoundIndex: 7,
    championTeamId: "team-1",
    phase: "complete",
  },
});
assert.equal(strongTeamMiss.response.status, 200);
assert.equal(strongTeamMiss.payload.unlockedTeam.complete, false);
assert.equal(strongTeamMiss.payload.unlockedTeam.attempts, 1);

const strongTeamWin = await request("/achievements/knockout-256", {
  method: "POST",
  body: {
    seed: knockoutSeed + 1,
    teamId: "team-50",
    bestRoundIndex: 7,
    championTeamId: "team-50",
    phase: "complete",
  },
});
assert.equal(strongTeamWin.response.status, 200);
assert.equal(strongTeamWin.payload.countryUnlocked, true);
assert.equal(strongTeamWin.payload.unlockedTeam.complete, true);
assert.equal(strongTeamWin.payload.unlockedTeam.attempts, 2);
assert.equal(strongTeamWin.payload.unlockedTeam.achievedOnAttempt, 2);

const repeatedStrongTeamWin = await request("/achievements/knockout-256", {
  method: "POST",
  body: {
    seed: knockoutSeed + 1,
    teamId: "team-50",
    bestRoundIndex: 7,
    championTeamId: "team-50",
    phase: "complete",
  },
});
assert.equal(repeatedStrongTeamWin.response.status, 200);
assert.equal(repeatedStrongTeamWin.payload.countryUnlocked, false);
assert.equal(repeatedStrongTeamWin.payload.unlockedTeam.attempts, 2);

const hardTeamProgress = await request("/achievements/knockout-256", {
  method: "POST",
  body: {
    seed: knockoutSeed + 2,
    teamId: "team-221",
    bestRoundIndex: 4,
    championTeamId: null,
    phase: "progress",
  },
});
assert.equal(hardTeamProgress.response.status, 200);
assert.equal(hardTeamProgress.payload.countryUnlocked, true);
assert.equal(hardTeamProgress.payload.unlockedTeam.complete, true);
assert.equal(hardTeamProgress.payload.unlockedTeam.objectiveLabel, "Reach the Round of 16");

const knockoutProgress = await request("/achievements/knockout-256");
assert.equal(knockoutProgress.response.status, 200);
assert.equal(knockoutProgress.payload.achievement.completed, 2);
assert.equal(knockoutProgress.payload.achievement.total, 256);
assert.equal(knockoutProgress.payload.achievement.teams.length, 256);

const achievementBoard = await request("/achievements/leaderboard");
assert.equal(achievementBoard.response.status, 200);
assert.equal(achievementBoard.payload.currentUser.achievements, 7);
assert.equal(achievementBoard.payload.totalAchievements, 408);
assert.equal(achievementBoard.payload.leaderboard.some((entry) => entry.username === updatedUsername), true);

const tampered = await request("/runs", {
  method: "POST",
  body: { clientCommandId: crypto.randomUUID(), teamId: "team-1", simulation: "chaos", goalLevel: "wild" },
});
assert.equal(tampered.response.status, 403);

const startCommand = crypto.randomUUID();
const started = await request("/runs", { method: "POST", body: { clientCommandId: startCommand } });
assert.equal(started.response.status, 201);
assert.equal(started.payload.run.round, "Round of 256");

const replayedStart = await request("/runs", { method: "POST", body: { clientCommandId: startCommand } });
assert.equal(replayedStart.response.status, 200);
assert.equal(replayedStart.payload.run.id, started.payload.run.id);

const secondStart = await request("/runs", { method: "POST", body: { clientCommandId: crypto.randomUUID() } });
assert.equal(secondStart.response.status, 200);
assert.equal(secondStart.payload.resumed, true);

const played = await request(`/runs/${started.payload.run.id}/play`, { method: "POST", body: { clientCommandId: crypto.randomUUID() } });
assert.equal(played.response.status, 200);
assert.equal(played.payload.run.roundIndex, 1);
assert.ok(played.payload.run.latestMatch.homeId === "team-131" || played.payload.run.latestMatch.awayId === "team-131");

if (played.payload.run.status === "active") {
  const tooFast = await request(`/runs/${started.payload.run.id}/play`, { method: "POST", body: { clientCommandId: crypto.randomUUID() } });
  assert.equal(tooFast.response.status, 429);
  assert.ok(tooFast.payload.retryAfterMs > 0);
}

const loggedOut = await request("/logout", { method: "POST", body: {} });
assert.equal(loggedOut.response.status, 200);
const loggedOutDashboard = await request();
assert.equal(loggedOutDashboard.payload.account, null);

const badLogin = await request("/login", { method: "POST", body: { identifier: email, password: "incorrect-password" }, session: false });
assert.equal(badLogin.response.status, 401);
const login = await request("/login", { method: "POST", body: { identifier: email.toUpperCase(), password }, session: false });
assert.equal(login.response.status, 200);
assert.equal(login.payload.account.username, updatedUsername);

console.log("Palestine Challenge API integration tests passed.");
