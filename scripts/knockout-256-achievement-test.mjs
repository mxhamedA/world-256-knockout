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
assert.ok(definitions.every((entry) => entry.points >= 1 && entry.points <= 5));
assert.ok(definitions.some((entry) => entry.objective === "champion"));
assert.ok(definitions.some((entry) => entry.objectiveLabel === "Reach the final"));
assert.ok(definitions.some((entry) => entry.objectiveLabel === "Reach the semi-finals"));
assert.ok(definitions.some((entry) => entry.objectiveLabel === "Reach the quarter-finals"));
assert.ok(definitions.some((entry) => entry.objectiveLabel === "Reach the Round of 16"));
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
assert.match(challengeSource, /challengeApi\("\/achievements\/knockout-256"/);
assert.match(challengeSource, /function knockoutObjectiveForTeam\(team\)/);
assert.match(challengeSource, /Lose in the Round of 256/);
assert.doesNotMatch(challengeSource, /Loading objective/);
assert.doesNotMatch(challengeSource, /Progress sync unavailable/);
assert.match(challengeSource, /activeAchievementYear === 256 \? 256[\s\S]*activeAchievementYear === 2016 \? 24[\s\S]*: 32/);
assert.match(htmlSource, /data-achievement-year="256"[^>]*>256 KO<\/button>/);

console.log("256 knockout achievement checks passed.");
