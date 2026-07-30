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

const context = {
  repairPlayerText: (value) => value,
  simulationClamp: (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value)),
  stableHash: (value) => [...String(value)].reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 0),
  teamById: (id) => ({ id }),
  playerProfilesForTeam: (team) => team.id === "home"
    ? [
        { name: "Home Scorer", number: 9, position: "ST" },
        { name: "Home Keeper", number: 1, position: "GK" },
      ]
    : [
        { name: "Away Forward", number: 10, position: "ST" },
        { name: "Away Defender", number: 5, position: "CB" },
      ],
  possessionPositionGroup: (position) => (
    position === "GK" ? "goalkeeper"
      : ["CB", "LB", "RB"].includes(position) ? "defender"
        : ["ST", "LW", "RW"].includes(position) ? "forward"
          : "midfielder"
  ),
};
vm.createContext(context);
vm.runInContext(`
  var livePlayback = {
    playerRatings: {
      home: {
        "Jose Alvarez": { rating: 6.5, delta: 0, reason: "Kick-off", playerNumber: 9 },
        "Home Defender": { rating: 6.5, delta: 0, reason: "Kick-off", playerNumber: 4 }
      },
      away: {
        "Away Forward": { rating: 6.5, delta: 0, reason: "Kick-off", playerNumber: 10 },
        "Away Defender": { rating: 6.5, delta: 0, reason: "Kick-off", playerNumber: 5 }
      }
    }
  };
  var match2dState = {
    presentation: {
      home: { players: [
        { name: "José Álvarez", number: 9, position: "ST" },
        { name: "Home Defender", number: 4, position: "CB" }
      ] },
      away: { players: [
        { name: "Away Forward", number: 10, position: "ST" },
        { name: "Away Defender", number: 5, position: "CB" }
      ] }
    }
  };
  ${functionSource("liveRatingNameKey")}
  ${functionSource("livePlayerRatingEntry")}
  ${functionSource("livePlayerRatingKey")}
  ${functionSource("liveRatingSideForPlayer")}
  ${functionSource("adjustLivePlayerRating")}
  ${functionSource("finalizeLivePlayerRatings")}
  ${functionSource("finalizeAndStoreLivePlayerRatings")}
  ${functionSource("repairFlatSavedPlayerRatings")}
  globalThis.runRatingTest = (match) => {
    finalizeLivePlayerRatings(match);
    return livePlayback.playerRatings;
  };
  globalThis.repairSavedRatings = repairFlatSavedPlayerRatings;
  globalThis.adjustRating = adjustLivePlayerRating;
  globalThis.getLiveRatings = () => livePlayback.playerRatings;
`, context);

context.adjustRating("José Álvarez", 0.25, "Live contribution", "home");
assert.equal(
  context.getLiveRatings().home["Jose Alvarez"].rating,
  6.75,
  "Live ratings must match accent-normalized player names instead of staying at 6.5.",
);

const ratings = context.runRatingTest({
  homeId: "home",
  awayId: "away",
  result: {
    homeGoals: 2,
    awayGoals: 0,
    winnerId: "home",
    homeEvents: [
      { scorer: "José Álvarez", assist: "Home Defender" },
      { scorer: "José Álvarez", assist: null },
    ],
    awayEvents: [],
    redCards: [{ side: "away", player: "Away Defender" }],
  },
});

assert.ok(ratings.home["Jose Alvarez"].rating >= 8.5, "A two-goal scorer must not remain at 6.5.");
assert.ok(ratings.home["Home Defender"].rating > 6.5, "A winning defender with an assist and clean sheet must improve.");
assert.ok(ratings.away["Away Forward"].rating < 6.5, "A player on the losing side must reflect the result.");
assert.ok(ratings.away["Away Defender"].rating <= 5, "A sent-off player must receive a poor rating.");
assert.match(
  app,
  /finalizeHighlightResult\(match,\s*livePlayback\);\s*finalizeAndStoreLivePlayerRatings\(match\);\s*renderRetroMatchLineupsPanel\(match\);/,
  "Skip-to-full-time must finalize and display ratings before the full-time screen is rendered.",
);
assert.match(
  app,
  /if \(!livePlayback \|\| livePlayback\.ratingsFinalized\) return;/,
  "Full-time ratings must only be finalized once.",
);
assert.equal(
  (app.match(/retroDisplayedRatingEntry\(match,\s*side,\s*ratings,/g) || []).length,
  3,
  "Both completed-match rating layouts must use the non-flat display fallback.",
);

const savedMatch = {
  id: "old-saved-final",
  homeId: "home",
  awayId: "away",
  result: {
    homeGoals: 1,
    awayGoals: 0,
    winnerId: "home",
    homeEvents: [{ scorer: "Home Scorer", assist: null }],
    awayEvents: [],
    redCards: [],
    playerRatings: {
      home: {
        "Home Scorer": { rating: 6.5, delta: 0, reason: "Full time" },
        "Home Keeper": { rating: 6.5, delta: 0, reason: "Full time" },
      },
      away: {
        "Away Forward": { rating: 6.5, delta: 0, reason: "Full time" },
        "Away Defender": { rating: 6.5, delta: 0, reason: "Full time" },
      },
    },
  },
};
assert.equal(context.repairSavedRatings(savedMatch), true, "Old flat saved ratings must be repaired.");
assert.ok(savedMatch.result.playerRatings.home["Home Scorer"].rating > 7, "Old saved scorers need a real rating.");
assert.ok(savedMatch.result.playerRatings.home["Home Keeper"].rating > 6.5, "Old clean sheets need a real rating.");
assert.ok(
  new Set(Object.values(savedMatch.result.playerRatings.home).map((entry) => entry.rating)).size > 1,
  "A repaired saved team sheet must not remain flat.",
);

console.log("Player rating calculation, saved-rating repair, and lineup matching checks passed.");
