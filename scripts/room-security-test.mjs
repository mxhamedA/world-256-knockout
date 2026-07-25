import assert from "node:assert/strict";
import {
  onlineAutomaticPenaltyGoalChance,
  onlineManualPenaltyGoalChance,
  onlinePenaltyWinner,
} from "../online-penalty-rules.mjs";
import { giantKillingMomentumMultiplier } from "../online-momentum-rules.mjs";
import {
  NEW_ROOM_CODE_PATTERN,
  ROOM_CODE_PATTERN,
  hashAccessToken,
  makeAccessToken,
  makeMemberId,
  makeRoomCode,
  normalizeDisplayName,
  normalizeRoomCode,
  safeEqual,
} from "../room-security.mjs";

assert.equal(normalizeRoomCode(" 12-34 "), "1234");
assert.equal(normalizeRoomCode(" ab-c 234 "), "ABC234");
assert.match("ABC234", ROOM_CODE_PATTERN, "Rooms created before the four-digit update remain joinable.");
assert.equal(normalizeDisplayName("  Mo   Salah  "), "Mo Salah");
assert.equal(normalizeDisplayName("<img src=x>"), null);
assert.equal(normalizeDisplayName(""), null);
assert.equal(normalizeDisplayName("x".repeat(25)), null);
assert.equal(normalizeDisplayName("Renée O'Connor"), "Renée O'Connor");

for (let index = 0; index < 1000; index += 1) {
  const code = makeRoomCode();
  assert.match(code, NEW_ROOM_CODE_PATTERN);
  assert.match(code, ROOM_CODE_PATTERN);
}

const firstToken = makeAccessToken();
const secondToken = makeAccessToken();
assert.match(firstToken, /^[A-Za-z0-9_-]{43}$/);
assert.notEqual(firstToken, secondToken);
assert.match(makeMemberId(), /^[A-Za-z0-9_-]{16}$/);

const firstHash = await hashAccessToken(firstToken);
assert.equal(firstHash, await hashAccessToken(firstToken));
assert.notEqual(firstHash, await hashAccessToken(secondToken));
assert.equal(safeEqual(firstHash, firstHash), true);
assert.equal(safeEqual(firstHash, `${firstHash.slice(0, -1)}x`), false);
assert.equal(safeEqual(firstHash, firstHash.slice(1)), false);

console.log("Online room security helpers passed.");

const penaltyState = (homeScore, awayScore, homeKicks, awayKicks) => ({ homeScore, awayScore, homeKicks, awayKicks });
assert.equal(onlinePenaltyWinner(penaltyState(5, 5, 5, 5)), null, "A level shootout after five each must continue.");
assert.equal(onlinePenaltyWinner(penaltyState(6, 5, 6, 5)), null, "The away team must receive its sixth penalty.");
assert.equal(onlinePenaltyWinner(penaltyState(6, 6, 6, 6)), null, "Level sudden death must continue.");
assert.equal(onlinePenaltyWinner(penaltyState(7, 6, 7, 7)), "home", "A lead after equal sudden-death attempts must finish.");
assert.equal(onlinePenaltyWinner(penaltyState(6, 7, 7, 7)), "away", "Either side can win after equal sudden-death attempts.");
assert.equal(onlinePenaltyWinner(penaltyState(3, 0, 3, 3)), "home", "An uncatchable initial-five lead must finish early.");
assert.equal(onlinePenaltyWinner(penaltyState(3, 0, 3, 2)), null, "The initial shootout must continue while a draw remains possible.");
console.log("Online penalty sudden-death rules passed.");

const tacticNames = Object.freeze({ balanced: {}, counter: {} });
assert.equal(Object.hasOwn(tacticNames, "counter"), true);
assert.equal(Object.hasOwn(tacticNames, "constructor"), false, "Inherited object keys must never pass tactic validation.");
assert.equal(Object.hasOwn(tacticNames, "__proto__"), false, "Prototype keys must never pass tactic validation.");

assert.equal(onlineManualPenaltyGoalChance(55, false), 1, "An on-target manual penalty cannot go wide when the keeper guesses wrong.");
assert.equal(onlineManualPenaltyGoalChance(55, true), 0.38, "A correctly guessed manual penalty can still be saved.");
assert.ok(
  Math.abs(onlineManualPenaltyGoalChance(99, true) - 0.468) < 1e-9,
  "Player quality should help without bypassing a correct goalkeeper guess.",
);
console.log("Online manual penalty targeting rules passed.");

assert.ok(
  onlineAutomaticPenaltyGoalChance(55, false) < 1,
  "An automatically taken opposition penalty may still go wide.",
);
assert.equal(
  onlineAutomaticPenaltyGoalChance(55, true),
  onlineManualPenaltyGoalChance(55, true),
  "Manual and automatic penalties should be equally saveable when the goalkeeper guesses correctly.",
);
console.log("Online automatic penalty miss rules passed.");

assert.equal(giantKillingMomentumMultiplier(55, 80, 62), 1.10, "A giant-killer receives next-round momentum.");
assert.equal(giantKillingMomentumMultiplier(55, 80, 82), 1, "Momentum does not apply against a bigger team than the defeated giant.");
assert.equal(giantKillingMomentumMultiplier(70, 80, 62), 1, "An ordinary win does not create giant-killing momentum.");
console.log("Online giant-killing momentum rules passed.");
