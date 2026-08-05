import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

function functionSource(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} must exist.`);
  const open = app.indexOf("{", start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = open; index < app.length; index += 1) {
    const character = app[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote) {
      if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return app.slice(start, index + 1);
    }
  }
  throw new Error(`Could not extract ${name}.`);
}

const context = {};
vm.createContext(context);
vm.runInContext(`
  function stableHash(value) {
    return [...String(value)].reduce(
      (hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0,
      2166136261,
    );
  }
  ${functionSource("mulberry32")}
  ${functionSource("poisson")}
  ${functionSource("matchGoalRandom")}
  globalThis.score = (seed, matchId, side, lambda) => poisson(
    lambda,
    matchGoalRandom(seed, matchId, side),
  );
`, context);

for (let seed = 1; seed <= 500; seed += 1) {
  const lowAttack = context.score(seed, "tactical-test", "home", 1.1);
  const highAttack = context.score(seed, "tactical-test", "home", 2.1);
  assert.ok(
    highAttack >= lowAttack,
    "Improving one team's xG with the same match seed must not reduce its goals through random-stream drift.",
  );
  const awayBefore = context.score(seed, "tactical-test", "away", 1.4);
  context.score(seed, "tactical-test", "home", 3.2);
  const awayAfter = context.score(seed, "tactical-test", "away", 1.4);
  assert.equal(
    awayAfter,
    awayBefore,
    "Changing the controlled team's attack must not change the opponent's random goal draw.",
  );
}

assert.match(app, /const homeGoalRandom = matchGoalRandom\(randomSeed, match\.id, "home"\)/);
assert.match(app, /const awayGoalRandom = matchGoalRandom\(randomSeed, match\.id, "away"\)/);
assert.match(app, /els\.standardTacticOpponent\.textContent = state\.premierLeagueSeason/);
assert.match(app, /\? opponentTacticName \? `Tactics · Opponent: \$\{opponentTacticName\}` : "Tactics"/);
assert.match(app, /: opponentTacticName \? `Opponent: \$\{opponentTacticName\}` : ""/);
assert.match(app, /els\.standardTacticFeedback\.textContent = tacticalFeedback\?\.label \|\| ""/);
assert.match(
  html,
  /id="standardTacticOpponent"[\s\S]*id="standardTacticButtons"[\s\S]*id="standardTacticFeedback"/,
  "The tactical matchup helper must occupy its own bottom row after the tactic buttons.",
);
assert.match(
  app,
  /liveMatch\.result\.engineVersion !== 2[\s\S]*liveMatch\.result = null/,
  "A stale hidden result must be invalidated when the pre-match strategy changes.",
);
const managedRetroBoostSource = functionSource("managedRetroTacticalBoost");
assert.match(
  managedRetroBoostSource,
  /Number\(retroTournament\.year\) === 2002/,
  "Korea/Japan 2002 should receive its managed-team baseline assistance.",
);
assert.match(
  managedRetroBoostSource,
  /managementAttack = isCopa2024 \? 0\.022 : isFrance1998 \? 0\.018 : isKoreaJapan2002 \? 0\.025 : 0/,
  "Copa América, France 1998 and Korea/Japan 2002 management attack boosts should remain modest and bounded.",
);
assert.match(
  managedRetroBoostSource,
  /managementDefence = isCopa2024 \? 0\.016 : isFrance1998 \? 0\.012 : isKoreaJapan2002 \? 0\.015 : 0/,
  "Copa América, France 1998 and Korea/Japan 2002 management defence boosts should remain modest and bounded.",
);
const france98BoostContext = {
  retroTournament: { year: 1998, managedTeam: "France" },
  isRetroSimulatorState: () => true,
};
vm.createContext(france98BoostContext);
vm.runInContext(`${managedRetroBoostSource}\nglobalThis.boost = managedRetroTacticalBoost;`, france98BoostContext);
const france98BaselineBoost = france98BoostContext.boost(0, 0);
assert.equal(france98BaselineBoost.attack, 1.018, "Managing a France 1998 team needs the small baseline attack boost.");
assert.equal(france98BaselineBoost.defence, 0.988, "Managing a France 1998 team needs the small baseline defensive boost.");
const france98UnderdogEdge = france98BoostContext.boost(18, 0.2);
assert.ok(france98UnderdogEdge.attack > france98BaselineBoost.attack, "A correct tactic must provide more attacking leverage to a major underdog.");
assert.ok(france98UnderdogEdge.defence < france98BaselineBoost.defence, "A correct tactic must provide more defensive leverage to a major underdog.");
assert.match(
  functionSource("simulateMatch"),
  /const controlledSide = state\.spectateTeamId === match\.homeId[\s\S]*if \(controlledSide\)[\s\S]*applyControlledTacticalMatchup/,
  "Tactical assistance must only enter the simulation through the selected managed side.",
);
assert.match(
  functionSource("retroManagedTeamSheetImpact"),
  /team\?\.name !== retroTournament\?\.managedTeam/,
  "Team-sheet assistance must reject every team except the chosen managed team.",
);
assert.match(html, /app\.js\?v=[a-z0-9-]+/);

console.log("Tactical causality, feedback, and stale-result checks passed.");
