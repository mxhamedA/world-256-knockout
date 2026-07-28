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

console.log("Custom third-place play-off checks passed.");
