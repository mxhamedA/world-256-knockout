import assert from "node:assert/strict";

await import(new URL("../career-engine.js", import.meta.url));

const engine = globalThis.PlayerCareerEngine;
assert.ok(engine, "career engine attaches to globalThis");

const academies = engine.academyOptions([], 256);
assert.equal(academies.length, 3, "three academy options are generated");
assert.equal(new Set(academies.map((club) => club.id)).size, 3, "academy options are unique");

let career = engine.createCareer({
  fullName: "Amir Hassan",
  nationality: { id: "team-1", name: "England", code: "GB-ENG", flag: "🏴" },
  position: "CAM",
  preferredFoot: "Left",
  academyClubId: academies[0].id,
  clubs: engine.normalizeClubs([]),
  seed: 256,
});

assert.ok(engine.validate(career), "new career validates");
assert.equal(career.player.age, 15);
assert.equal(career.player.careerStartDate, "2026-01-01");
assert.ok(Object.values(career.player.attributes).every((rating) => rating >= 40 && rating <= 55));
assert.ok(career.season.fixtures.length >= 43, "full league and cup calendar is generated");
assert.equal(career.coins.balance, 10, "first daily reward is included");

const firstWeek = engine.currentTrainingWeek(career);
const training = engine.runTraining(career, "passing", "intense");
career = training.state;
assert.ok(training.earned >= 7);
assert.ok(career.training.completedWeeks.includes(firstWeek));
assert.throws(() => engine.runTraining(career, "passing", "light"), /already complete/i);

const attributeBefore = career.player.attributes.passing;
career.training.points = Math.max(career.training.points, engine.trainingCost(attributeBefore));
career = engine.upgradeAttribute(career, "passing").state;
assert.equal(career.player.attributes.passing, attributeBefore + 1);

let playedMatches = 0;
while (career.season.status === "active") {
  const fixture = engine.nextFixture(career);
  assert.ok(fixture, "active season always has a next fixture");
  const outcome = engine.simulateFixture(career, fixture.id);
  career = outcome.state;
  playedMatches += 1;
  assert.ok(Array.isArray(outcome.result.commentary) && outcome.result.commentary.length >= 5);
  assert.ok(outcome.result.player.rating === null || (outcome.result.player.rating >= 4 && outcome.result.player.rating <= 10));
  assert.ok(playedMatches < 80, "season terminates");
}

assert.equal(career.season.status, "transfer");
assert.equal(career.transfer.offers.length, 3);
assert.equal(career.transfer.offers[2].locked, true);
assert.ok(career.season.endSummary);

career.coins.balance = 150;
career = engine.unlockThirdOffer(career);
assert.equal(career.transfer.thirdUnlocked, true);
assert.equal(career.coins.balance, 50);

career = engine.beginNextSeason(career, career.transfer.offers[2].id);
assert.equal(career.season.number, 2);
assert.equal(career.player.age, 16);
assert.equal(career.history.length, 1);
assert.equal(career.season.status, "active");
assert.ok(engine.validate(career));

assert.equal(engine.formFromRatings([7.6, 7.8, 8.1]), "hot");
assert.equal(engine.formFromRatings([5.4, 5.7, 5.8]), "cold");

console.log(`Career engine verified: ${playedMatches} fixtures, transfer, training and season rollover.`);
