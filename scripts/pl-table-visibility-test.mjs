import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [seasonSource, css] = await Promise.all([
  readFile(new URL("../premier-league.js", import.meta.url), "utf8"),
  readFile(new URL("../premier-league.css", import.meta.url), "utf8"),
]);

assert.doesNotMatch(
  seasonSource,
  /includeLive|activeLiveMatch/,
  "Premier League standings must never include an unrevealed live match.",
);
assert.match(
  seasonSource,
  /function renderEngineTable\(\)[\s\S]*?const fullTable = leagueTable\(\)/,
  "The in-match mini table must use completed results only.",
);
assert.match(
  css,
  /\.pl-overview-grid \.pl-table-head,[\s\S]*?grid-template-columns:[^;]+;[\s\S]*?\.pl-overview-grid \.pl-table-row > :nth-child\(n \+ 4\):nth-child\(-n \+ 8\)[\s\S]*?display:\s*none/,
  "The Overview table must use a compact layout that keeps its Points column visible.",
);

const helperStart = seasonSource.indexOf("function leagueTable(");
const helperEnd = seasonSource.indexOf("function ordinalPosition(", helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, "The league-table helper must be available for regression testing.");

const clubs = [{ id: "alpha", name: "Alpha" }, { id: "beta", name: "Beta" }];
const season = {
  rounds: [[
    { id: "finished", homeId: "alpha", awayId: "beta", result: { homeGoals: 1, awayGoals: 1, revealed: true } },
    { id: "hidden", homeId: "alpha", awayId: "beta", result: { homeGoals: 4, awayGoals: 0, revealed: false } },
  ]],
};
const leagueTable = new Function("clubs", "season", `${seasonSource.slice(helperStart, helperEnd)}; return leagueTable;`)(clubs, season);
const table = leagueTable();
assert.equal(table.find((row) => row.club.id === "alpha").points, 1, "An unrevealed win must not add three points.");
assert.equal(table.find((row) => row.club.id === "alpha").played, 1, "An unrevealed match must not count as played.");
assert.equal(table.find((row) => row.club.id === "beta").points, 1);

console.log("Premier League table visibility and no-spoiler checks passed.");
