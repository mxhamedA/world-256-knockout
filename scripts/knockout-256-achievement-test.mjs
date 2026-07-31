import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  knockout256AchievementDefinition,
  knockout256ObjectiveAchieved,
} from "../challenge-service.mjs";
import { DRAFT_TEAMS } from "../draft-team-catalog.generated.mjs";

const [appSource, challengeSource, htmlSource] = await Promise.all([
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../challenge.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
]);

assert.equal(DRAFT_TEAMS.length, 256);
const definitions = DRAFT_TEAMS.map((team) => knockout256AchievementDefinition(team.id));
assert.equal(definitions.filter(Boolean).length, 256);
assert.equal(new Set(definitions.map((entry) => entry.teamId)).size, 256);
assert.ok(definitions.every((entry) => entry.points >= 1 && entry.points <= 8));
assert.ok(definitions.some((entry) => entry.objective === "champion"));
assert.ok(definitions.some((entry) => entry.objectiveLabel === "Reach the semi-finals"));
assert.ok(definitions.some((entry) => entry.objectiveLabel === "Reach the quarter-finals"));
assert.ok(definitions.some((entry) => entry.objectiveLabel === "Reach the Round of 16"));
assert.ok(definitions.some((entry) => entry.objectiveLabel === "Reach the Round of 32"));
assert.ok(definitions.some((entry) => entry.objectiveLabel === "Reach the Round of 64"));

const expectedBoundaries = [
  ["Spain", "Win the tournament", 1],
  ["Ghana", "Win the tournament", 2],
  ["Honduras", "Reach the semi-finals", 3],
  ["Vanuatu", "Reach the semi-finals", 4],
  ["Malta", "Reach the quarter-finals", 5],
  ["Chad", "Reach the quarter-finals", 5],
  ["Eritrea", "Reach the Round of 16", 8],
  ["Norfolk Island", "Reach the Round of 32", 8],
];
for (const [teamName, objectiveLabel, points] of expectedBoundaries) {
  const team = DRAFT_TEAMS.find((entry) => entry.name === teamName);
  const definition = knockout256AchievementDefinition(team.id);
  assert.equal(definition.objectiveLabel, objectiveLabel, `${teamName} has the wrong objective.`);
  assert.equal(definition.points, points, `${teamName} has the wrong points value.`);
}

assert.deepEqual(
  definitions.slice(182).reduce((counts, definition) => {
    counts[definition.objectiveLabel] = (counts[definition.objectiveLabel] || 0) + 1;
    return counts;
  }, {}),
  {
    "Reach the Round of 16": 25,
    "Reach the Round of 32": 25,
    "Reach the Round of 64": 23,
    "Lose in the Round of 256": 1,
  },
);

const eritrea = knockout256AchievementDefinition(DRAFT_TEAMS.find((team) => team.name === "Eritrea").id);
assert.equal(knockout256ObjectiveAchieved(eritrea, { bestRoundIndex: 3 }), 0);
assert.equal(knockout256ObjectiveAchieved(eritrea, { bestRoundIndex: 4 }), 1);

const israel = knockout256AchievementDefinition("team-25");
assert.deepEqual(israel, {
  teamId: "team-25",
  teamName: "Israel",
  objective: "lose-round-256",
  objectiveLabel: "Lose in the Round of 256",
  targetRoundIndex: 0,
  points: 4,
});
assert.equal(knockout256ObjectiveAchieved(israel, {
  bestRoundIndex: 0,
  phase: "progress",
}), 0, "Starting the first round must not unlock Israel's objective.");
assert.equal(knockout256ObjectiveAchieved(israel, {
  bestRoundIndex: 0,
  phase: "complete",
}), 1, "Losing in the Round of 256 should unlock Israel's objective.");
assert.equal(knockout256ObjectiveAchieved(israel, {
  bestRoundIndex: 1,
  phase: "complete",
}), 0, "Losing in a later round must not unlock Israel's objective.");

assert.match(appSource, /function standardKnockoutAchievementState\(candidate = state\)/);
assert.match(appSource, /window\.AccountAchievements\?\.trackKnockoutTournament\(knockoutAchievement\)/);
assert.match(challengeSource, /async function trackKnockoutTournament\(tournament\)/);
assert.match(challengeSource, /submitAchievementPhase\("\/achievements\/knockout-256"/);
assert.match(challengeSource, /function knockoutObjectiveForTeam\(team, teamIndex = -1\)/);
assert.match(challengeSource, /Reach the Round of 64/);
assert.doesNotMatch(challengeSource, /Loading objective/);
assert.doesNotMatch(challengeSource, /Progress sync unavailable/);
assert.match(challengeSource, /activeAchievementYear === 256 \? 256[\s\S]*activeAchievementYear === 2016 \? 24[\s\S]*: 32/);
assert.match(htmlSource, /data-achievement-year="256"[^>]*>256 KO<\/button>/);

console.log("256 knockout achievement checks passed.");
