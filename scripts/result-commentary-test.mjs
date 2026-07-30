import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const premierLeagueSource = fs.readFileSync(new URL("../premier-league.js", import.meta.url), "utf8");

assert.match(appSource, /function groupResultCommentary\(/);
assert.match(appSource, /Statement win!/);
assert.match(appSource, /qualification hopes alive/);
assert.match(appSource, /seal a place in the knockouts/);
assert.match(appSource, /qualification still to be settled/);
assert.doesNotMatch(appSource, /Giant-killing! \$\{winner\.name\} send \$\{loser\.name\} home/);
const storylineSection = appSource.slice(
  appSource.indexOf("function storylineFor(match)"),
  appSource.indexOf("function renderSpotlight"),
);
assert.match(storylineSection, /groupResultCommentary\(match, winner, loser/);
assert.match(storylineSection, /PremierLeagueSeason\?\.resultCommentary/);
assert.match(storylineSection, /title: winner \? `\$\{winner\.name\} beat \$\{loser\.name\}`/);

assert.match(premierLeagueSource, /function resultCommentary\(/);
assert.match(premierLeagueSource, /title race with a vital win/);
assert.match(premierLeagueSource, /survival win/);
assert.match(premierLeagueSource, /tight race for Europe/);
assert.match(premierLeagueSource, /Premier League upset!/);
assert.match(premierLeagueSource, /resultCommentary,/);

const finishSection = appSource.slice(
  appSource.indexOf("function finishLivePlayback()"),
  appSource.indexOf("function syncPossessionResultStats"),
);
const revealSection = appSource.slice(
  appSource.indexOf("function revealSelected()"),
  appSource.indexOf("function simulateCurrentRound()"),
);
assert.match(finishSection, /matchResultCommentary\(match, completed\.roundIndex\)/);
assert.match(revealSection, /matchResultCommentary\(match, state\.activeRound\)/);
assert.doesNotMatch(finishSection, /send .* home/);
assert.doesNotMatch(revealSection, /knock out/);

console.log("Context-aware result commentary checks passed.");
