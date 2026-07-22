import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const presentationSource = fs.readFileSync(path.join(root, "presentation-engine.js"), "utf8");
const source = fs.readFileSync(path.join(root, "simulation-engine.js"), "utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(`${presentationSource}\n${source}\nglobalThis.__createHighlights = createMatchHighlightPresentation;`, context);

function team(id, name, rating) {
  return {
    id,
    name,
    rating,
    simulationRatings: {
      overall: rating,
      attack: rating,
      midfield: rating,
      defence: rating,
      goalkeeper: rating,
      squadDepth: rating,
      experience: rating,
      penalties: rating,
      discipline: 72,
    },
  };
}

const positions = [
  "GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CAM", "LW", "ST", "RW",
  "GK", "CB", "RB", "CM", "CM", "CAM", "ST",
];
function profiles(id, rating) {
  return positions.map((position, index) => ({
    id: `${id}-${index}`,
    name: `${id} ${position} ${index + 1}`,
    position,
    overall: rating - (index % 3),
    pace: rating,
    passing: rating,
    dribbling: rating,
    shooting: position === "GK" ? 5 : rating - 5,
    finishing: position === "GK" ? 5 : rating - 5,
    defending: ["LB", "CB", "RB", "CDM"].includes(position) ? rating : rating - 24,
    physical: rating,
    goalkeeping: position === "GK" ? rating : 5,
  }));
}

const home = team("home", "Home", 86);
const away = team("away", "Away", 82);
const result = {
  homeGoals: 2,
  awayGoals: 1,
  regulationHome: 2,
  regulationAway: 1,
  extraTime: false,
  expectedGoals: { home: 1.74, away: 1.12 },
  homeEvents: [
    { minute: 17, scorer: "home ST 10", assist: "home CAM 8", goalType: "openPlay", type: "goal" },
    { minute: 74, scorer: "home CB 3", assist: "home RW 11", goalType: "setPiece", type: "goal" },
  ],
  awayEvents: [
    { minute: 51, scorer: "away LW 9", assist: "away CM 7", goalType: "openPlay", type: "goal" },
  ],
  redCards: [{ minute: 83, player: "away CB 4", side: "away", teamId: "away", type: "red" }],
};

function createFor(matchResult = result, seed = 782331) {
  return context.__createHighlights({
    seed,
    home,
    away,
    homeProfiles: profiles("home", 86),
    awayProfiles: profiles("away", 82),
    homeTactic: "balanced",
    awayTactic: "balanced",
    result: matchResult,
  });
}

function create() {
  return createFor();
}

const first = JSON.parse(JSON.stringify(create()));
const replay = JSON.parse(JSON.stringify(create()));
assert.deepEqual(replay, first, "A highlight reel must replay identically from the same seed and result.");
assert.equal(first.version, 2);
assert.equal(first.home.players.length, 11);
assert.equal(first.away.players.length, 11);
assert.equal(first.stats.possession.home + first.stats.possession.away, 100);
assert.ok(first.stats.shots.home >= result.homeGoals);
assert.ok(first.stats.shots.away >= result.awayGoals);
assert.ok(first.stats.shotsOnTarget.home >= result.homeGoals);
assert.ok(first.stats.shotsOnTarget.away >= result.awayGoals);
assert.ok(first.highlights.length >= 9 && first.highlights.length <= 20);
assert.deepEqual(
  first.highlights.filter((highlight) => highlight.event?.type === "goal").map((highlight) => highlight.event.scorer).sort(),
  [...result.homeEvents, ...result.awayEvents].map((event) => event.scorer).sort(),
  "Every authoritative goal must have exactly one matching highlight.",
);
first.highlights.forEach((highlight) => {
  assert.ok(highlight.actions.length >= 5 && highlight.actions.length <= 12, `${highlight.sequenceType} must contain 5-12 linked actions.`);
  assert.ok(highlight.actions.every((action) => action.from && action.to && action.shape));
  assert.ok(highlight.actions.every((action) => Object.keys(action.shape).length === 22));
  highlight.actions.forEach((action, index) => {
    assert.equal(action.index, index, "Action indexes must remain stable for deterministic ball arcs.");
    if (index > 0) assert.deepEqual(action.from, highlight.actions[index - 1].to, "The ball must not teleport inside a highlight.");
    if (action.type !== "shot") return;
    const edgeDistance = Math.min(action.to.x, 100 - action.to.x);
    if (action.outcome === "goal") {
      assert.ok(edgeDistance <= 1 && action.to.y >= 39 && action.to.y <= 61, "A goal must finish inside the goal mouth.");
    } else if (action.outcome === "missed") {
      assert.ok(action.to.y <= 29 || action.to.y >= 71, "A missed shot must visibly finish outside the goal mouth.");
    } else if (action.outcome === "blocked") {
      assert.ok(edgeDistance >= 12, "A blocked shot must stop before reaching the goal line.");
    } else if (action.outcome === "corner") {
      assert.ok(edgeDistance <= 1 && (action.to.y <= 7 || action.to.y >= 93), "A corner must deflect beyond the byline.");
    }
  });
});
assert.ok(first.highlights.some((highlight) => highlight.sequenceType === "patient-build-up"));
assert.ok(first.highlights.filter((highlight) => highlight.importance === "key").every((highlight) => highlight.outcome !== "turnover" || highlight.event));
const redHighlight = first.highlights.find((highlight) => highlight.event?.type === "red");
assert.equal(redHighlight.actions.at(-1).type, "foul");
assert.equal(redHighlight.actions.at(-1).actor.name, result.redCards[0].player);

const penaltyResult = {
  ...result,
  homeGoals: 1,
  awayGoals: 0,
  regulationHome: 1,
  regulationAway: 0,
  expectedGoals: { home: 1.18, away: 0.71 },
  homeEvents: [{ minute: 32, scorer: "home ST 10", goalType: "penalty", type: "goal" }],
  awayEvents: [],
  redCards: [],
};
const penaltyPresentation = createFor(penaltyResult, 448811);
const penaltyHighlight = penaltyPresentation.highlights.find((highlight) => highlight.event?.goalType === "penalty");
assert.ok(penaltyHighlight, "An authoritative penalty needs a matching highlight.");
assert.equal(penaltyHighlight.actions.at(-1).type, "foul");
assert.equal(penaltyHighlight.actions.at(-1).outcome, "penalty");
assert.equal(penaltyHighlight.actions.at(-1).event.scorer, "home ST 10");

const substituteResult = {
  ...penaltyResult,
  homeEvents: [{ minute: 68, scorer: "Impact Substitute", goalType: "openPlay", type: "goal" }],
};
const substituteHighlight = createFor(substituteResult, 983144).highlights.find((highlight) => highlight.event?.scorer === "Impact Substitute");
assert.equal(substituteHighlight.actions.findLast((action) => action.type === "shot").actor.name, "Impact Substitute");
if (process.env.HIGHLIGHT_REPORT === "1") {
  const balancedSequence = first.highlights.find((highlight) => highlight.sequenceType === "patient-build-up");
  console.log(`Balanced sequence: ${balancedSequence.minute}' ${balancedSequence.heading}`);
  balancedSequence.actions.forEach((action, index) => {
    console.log(`${index + 1}. ${action.type}: ${action.commentary} (${action.from.x.toFixed(0)},${action.from.y.toFixed(0)} -> ${action.to.x.toFixed(0)},${action.to.y.toFixed(0)})`);
  });
}
console.log(`Highlight engine: ${first.highlights.length} deterministic sequences, ${first.highlights.reduce((sum, highlight) => sum + highlight.actions.length, 0)} linked actions.`);
