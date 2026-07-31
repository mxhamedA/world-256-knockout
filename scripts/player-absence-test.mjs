import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

function functionSource(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} must exist.`);
  const open = app.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < app.length; index += 1) {
    if (app[index] === "{") depth += 1;
    if (app[index] === "}") {
      depth -= 1;
      if (depth === 0) return app.slice(start, index + 1);
    }
  }
  throw new Error(`Could not extract ${name}.`);
}

const context = { repairPlayerText: (value) => value };
vm.createContext(context);
vm.runInContext(`
  ${functionSource("removeImpossiblePlayerAbsenceEvents")}
  globalThis.cleanAbsences = removeImpossiblePlayerAbsenceEvents;
`, context);

const dismissedFirst = context.cleanAbsences(
  [{ side: "home", player: "Player A", minute: 28 }],
  [
    { side: "home", player: "Player A", minute: 64 },
    { side: "home", player: "Player B", minute: 71 },
    { side: "away", player: "Player A", minute: 75 },
  ],
);
assert.equal(dismissedFirst.redCards.length, 1);
assert.deepEqual(
  dismissedFirst.injuries.map((event) => `${event.side}:${event.player}`),
  ["home:Player B", "away:Player A"],
  "A dismissed player cannot be injured later, while other players remain eligible.",
);

const injuredFirst = context.cleanAbsences(
  [{ side: "home", player: "Player C", minute: 80 }],
  [{ side: "home", player: "Player C", minute: 15 }],
);
assert.equal(injuredFirst.redCards.length, 0, "An injured player cannot receive a later red card.");
assert.equal(injuredFirst.injuries.length, 1);

const sameMinute = context.cleanAbsences(
  [{ side: "away", player: "Player D", minute: 52 }],
  [{ side: "away", player: "Player D", minute: 52 }],
);
assert.equal(sameMinute.redCards.length, 1, "A same-minute conflict must retain the dismissal.");
assert.equal(sameMinute.injuries.length, 0);

assert.match(
  app,
  /\(\{ redCards, injuries \} = removeImpossiblePlayerAbsenceEvents\(redCards, injuries\)\);[\s\S]*?redCards\.forEach/,
  "Generated absences must be reconciled before their match impact is applied.",
);
assert.match(
  app,
  /function mergeLiveTacticalResult[\s\S]*?removeImpossiblePlayerAbsenceEvents\(redCards, injuries\)/,
  "Tactical re-simulation must reconcile absences from both timeline halves.",
);
assert.match(
  app,
  /function repairRetroResultPlayers[\s\S]*?removeImpossiblePlayerAbsenceEvents\(result\.redCards \|\| \[\], result\.injuries \|\| \[\]\)/,
  "Saved World Cup results must be repaired when loaded.",
);

const teams = new Map([
  ["home", { id: "home", playerProfiles: [
    { name: "Dismissed Striker", position: "ST", startingXI: true, expectedMinutesShare: 1 },
    { name: "Eligible Winger", position: "RW", startingXI: true, expectedMinutesShare: 1 },
  ] }],
  ["away", { id: "away", playerProfiles: [
    { name: "Dismissed Defender", position: "CB", startingXI: true, expectedMinutesShare: 1 },
    { name: "Eligible Defender", position: "LB", startingXI: true, expectedMinutesShare: 1 },
  ] }],
]);
Object.assign(context, {
  teamById: (id) => teams.get(id),
  stableHash: () => 0,
  eligibleScorerProfiles: (team, minute, cards) => team.playerProfiles.filter((profile) => (
    !cards.some((card) => card.player === profile.name && card.minute <= minute)
  )),
});
vm.runInContext(`
  ${functionSource("removeDismissedPlayersFromFutureGoals")}
  globalThis.repairDismissedGoals = removeDismissedPlayersFromFutureGoals;
`, context);

const match = { id: "red-card-regression", homeId: "home", awayId: "away" };
const cards = [
  { side: "home", teamId: "home", player: "Dismissed Striker", minute: 50 },
  { side: "away", teamId: "away", player: "Dismissed Defender", minute: 60 },
];
const repairedGoals = context.repairDismissedGoals([
  { minute: 40, scorer: "Dismissed Striker", type: "goal" },
  { minute: 70, scorer: "Dismissed Striker", type: "goal" },
  { minute: 75, scorer: "Dismissed Defender (OG)", ownGoalBy: "Dismissed Defender", ownGoal: true, type: "goal" },
], "home", cards, match, []);
assert.equal(repairedGoals[0].scorer, "Dismissed Striker", "A goal before a red card must remain valid.");
assert.equal(repairedGoals[1].scorer, "Eligible Winger", "A dismissed player cannot score later.");
assert.equal(repairedGoals[2].ownGoalBy, "Eligible Defender", "A dismissed defender cannot score a later own goal.");
assert.equal(repairedGoals[2].scorer, "Eligible Defender (OG)");

assert.match(
  app,
  /const end = dismissal \? Math\.min\(segmentEnd, Math\.max\(start, dismissal\.minute - 1\)\)/,
  "Loaded goal minutes must stay strictly before a scorer's dismissal.",
);
assert.match(
  app,
  /function repairDefaultKnockoutRosterResults[\s\S]*?removeDismissedPlayersFromFutureGoals/,
  "Saved knockout matches must repair post-dismissal goal participants.",
);
assert.match(
  app,
  /function repairRetroResultPlayers[\s\S]*?removeDismissedPlayersFromFutureGoals/,
  "Saved World Cup matches must repair post-dismissal goal participants.",
);

console.log("Red-card and injury chronology checks passed.");
