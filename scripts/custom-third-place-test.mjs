import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appSource = await readFile(new URL("../app.js", import.meta.url), "utf8");

assert.match(
  appSource,
  /function defaultCustomTournamentSetup[\s\S]*setupVersion: 3,[\s\S]*thirdPlace: true,/,
  "New custom tournaments must enable the third-place play-off by default.",
);
assert.match(
  appSource,
  /function tournamentHasThirdPlacePlayoff\(\)[\s\S]*return state\.customTournament\.thirdPlace === true;/,
  "Group-based custom tournaments must be allowed to generate a third-place play-off.",
);
assert.doesNotMatch(
  appSource,
  /customTournamentSetup\.structure === "knockout" && customTournamentSetup\.thirdPlace === true/,
  "The saved tournament must not restrict third place to knockout-only setups.",
);
assert.match(
  appSource,
  /class="custom-third-place-toggle[\s\S]*data-custom-action="third-place"/,
  "The third-place toggle must remain visible in every custom format.",
);
assert.match(
  appSource,
  /class="custom-group-knockout-stage"[\s\S]*\$\{customThirdPlacePreviewMarkup\(\)\}/,
  "Group formats must show third place inside their knockout-stage builder.",
);
assert.match(
  appSource,
  /function ensureThirdPlacePlayoffForSavedTournament[\s\S]*thirdPlaceAllFormatsVersion !== 1[\s\S]*thirdPlace = true/,
  "Saved group tournaments from the knockout-only version must be migrated safely.",
);
assert.match(
  appSource,
  /customGroupQualifierCount\(state\.customTournament\.teamCount\) - 1[\s\S]*Number\(state\.customTournament\.thirdPlace === true\)/,
  "Group-format progress totals must include the third-place fixture.",
);
assert.match(
  appSource,
  /const CUSTOM_TEAM_SOURCE_OPTIONS[\s\S]*\["2006", "World Cup 2006"\][\s\S]*\["2016", "UEFA Euro 2016"\]/,
  "The custom team library must expose the 2006 World Cup and Euro 2016 squads.",
);
assert.match(
  appSource,
  /if \(preset === "south-america"\) return TEAMS\.filter\(\(team\) => team\.confed === "CONMEBOL"\);/,
  "Custom tournament quick fill must support South American teams.",
);
assert.match(
  appSource,
  /if \(preset === "north-america"\) return TEAMS\.filter\(\(team\) => team\.confed === "CONCACAF"\);/,
  "Custom tournament quick fill must support North American teams.",
);
assert.match(
  appSource,
  /\[2006, 2010, 2014, 2016, 2018, 2022\]\.forEach\(\(year\) => installRetroTeams\(year\)\)/,
  "The 2006 and Euro 2016 historical datasets must be installed in the shared team pool.",
);
assert.match(
  appSource,
  /function customTeamCompetitionLabel[\s\S]*Number\(team\.retroYear\) === 2016 \? "UEFA Euro 2016"/,
  "Euro 2016 teams must be labelled as a European Championship rather than a World Cup.",
);

console.log("Custom third-place play-off checks passed.");
