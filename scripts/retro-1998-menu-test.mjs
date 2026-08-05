import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const app = read("app.js");
const html = read("index.html");
const css = read("clean.css");
const worker = read("worker.mjs");
const build = read(path.join("scripts", "build-cloudflare.mjs"));
const challenge = read("challenge.js");
const challengeService = read("challenge-service.mjs");
const migration = read(path.join("migrations", "0017_retro_1998_achievements.sql"));

const context = vm.createContext({ console, Date, Math, Object, Set, Map });
vm.runInContext(`${[
  "retro-data.js", "data/retro/1998/squads.js", "data/retro/1998/schedule.js", "retro-engine.js",
].map(read).join("\n")}
globalThis.__data = RETRO_WORLD_CUPS[1998];
globalThis.__squads = RETRO_1998_SQUADS;
globalThis.__groupSchedule = RETRO_1998_GROUP_SCHEDULE;
globalThis.__knockoutSchedule = RETRO_1998_KNOCKOUT_SCHEDULE;
globalThis.__engine = RETRO_WORLD_CUP_ENGINE;`, context);

const data = context.__data;
const squads = context.__squads;
const engine = context.__engine;
assert.equal(data.teams.length, 32, "France 1998 must contain every finalist.");
assert.deepEqual([...new Set(data.teams.map((team) => team.group))], ["A", "B", "C", "D", "E", "F", "G", "H"]);
assert.equal(Object.keys(squads).length, 32, "France 1998 must have 32 isolated squads.");
assert.equal(Object.keys(context.__groupSchedule).length, 48, "France 1998 must have all 48 real group fixtures.");
assert.equal(Object.keys(context.__knockoutSchedule).length, 16, "France 1998 must expose the complete knockout schedule.");

for (const [team, squad] of Object.entries(squads)) {
  assert.equal(squad.players.length, 22, `${team} must have the official 22-player squad size.`);
  assert.equal(new Set(squad.players.map((player) => player.number)).size, 22, `${team} shirt numbers must be unique.`);
  assert.equal(squad.startingXI.length, 11, `${team} must have a realistic historical starting XI.`);
  assert.equal(new Set(squad.startingXI).size, 11, `${team} starting XI must contain unique players.`);
  assert.ok(squad.players.some((player) => player.position === "GK"), `${team} must contain a goalkeeper.`);
  assert.ok(squad.players.some((player) => player.captain), `${team} must identify its captain.`);
  assert.ok(squad.players.every((player) => player.club && Number.isFinite(player.overall)), `${team} players need clubs and custom ratings.`);
  assert.ok(squad.players.every((player) => /not an official EA rating/i.test(player.ratingJustification)), `${team} ratings must be labelled as custom.`);
  assert.ok(squad.penaltyTakers.length >= 3, `${team} must expose suitable penalty takers.`);
  assert.equal(engine.startingXI(1998, team).players.length, 11, `${team} lineup must resolve through the shared engine.`);
}

const tournament = engine.createTournament({ year: 1998, seed: 19980610, managedTeam: "France" });
assert.ok(engine.validate(tournament));
assert.deepEqual(
  JSON.parse(JSON.stringify(tournament.groupMatches.slice(0, 6).map((match) => `${match.home}|${match.away}`))),
  ["Brazil|Scotland", "Morocco|Norway", "Scotland|Norway", "Brazil|Morocco", "Brazil|Norway", "Scotland|Morocco"],
  "Group A must use the exact real fixture sequence.",
);
while (tournament.phase === "group") engine.simulateActiveStage(tournament);
const qualifiers = Object.fromEntries(["A", "B", "C", "D", "E", "F", "G", "H"].flatMap((group) => {
  const table = engine.groupStandings(tournament, group);
  return [[`${group}1`, table[0].name], [`${group}2`, table[1].name]];
}));
assert.deepEqual(
  JSON.parse(JSON.stringify(tournament.knockoutRounds[0].matches.map((match) => [match.home, match.away]))),
  [
    [qualifiers.A1, qualifiers.B2], [qualifiers.D1, qualifiers.C2],
    [qualifiers.E1, qualifiers.F2], [qualifiers.H1, qualifiers.G2],
    [qualifiers.B1, qualifiers.A2], [qualifiers.C1, qualifiers.D2],
    [qualifiers.F1, qualifiers.E2], [qualifiers.G1, qualifiers.H2],
  ],
  "France 98 must use its historical knockout bracket path.",
);
assert.equal(tournament.knockoutRounds[0].matches[0].schedule.stadium, "Parc des Princes");
assert.equal(tournament.knockoutRounds[0].matches[1].schedule.stadium, "Stade de France");
assert.equal(context.__knockoutSchedule["ko-r2-m1"].stadium, "Stade de la Beaujoire");
while (tournament.phase !== "complete") engine.simulateActiveStage(tournament);
assert.equal(tournament.knockoutRounds.length, 4);
assert.ok(tournament.knockoutRounds.at(-1).matches.some((match) => match.id === "ko-third-place"));
assert.ok(tournament.knockoutRounds.at(-1).matches.some((match) => match.id === "ko-final"));
assert.ok(engine.goldenBoot(tournament)[0]?.goals > 0);

assert.match(app, /1998:\s*"\/retro-98-world-cup"/);
assert.match(app, /classList\.toggle\("retro-1998-active"/);
assert.match(app, /if \(Number\(year\) === 1998\) return RETRO_1998_SQUADS/);
assert.match(app, /\["1998", "2002", "2006", "2010", "2014", "2018", "2022", "2024", "2026"\]/);
assert.match(app, /France 1998 World Cup/);
assert.match(app, /isFrance1998[\s\S]*managementAttack = isCopa2024 \? 0\.022 : isFrance1998 \? 0\.018/);
assert.match(app, /retroManagedTeamSheetImpact[\s\S]*fitScore[\s\S]*selectionScore[\s\S]*synergyScore/);
assert.match(html, /data\/retro\/1998\/squads\.js/);
assert.match(html, /data\/retro\/1998\/schedule\.js/);
assert.equal((html.match(/data-achievement-year="1998"/g) || []).length, 2);
assert.match(worker, /"\/retro-98-world-cup"/);
assert.match(build, /const retroDataRoot = join\(projectRoot, "data", "retro"\)/);
assert.match(build, /cpSync\(retroDataRoot, join\(outputRoot, "data", "retro"\)/);
assert.match(build, /france-98-bg-desktop\.png/);
assert.match(build, /france-98-bg-portrait\.png/);
assert.match(build, /retro-1998\/yugoslavia\.webp/);

const themeMarker = css.lastIndexOf("/* France 1998 absolute final palette guard. */");
assert.ok(themeMarker > 0, "France 1998 needs a final isolated palette guard.");
const menuParityMarker = css.lastIndexOf("/* France 1998 menu-parity visual lock:");
assert.ok(menuParityMarker > themeMarker, "The playable mode must extend the selector card's France 98 visual language.");
assert.match(css.slice(menuParityMarker), /--r98-sage-light:\s*#a4b9a0/);
assert.match(css.slice(menuParityMarker), /--r98-pink:\s*#d93763/);
assert.match(css.slice(menuParityMarker), /linear-gradient\(145deg,\s*#a4b9a0 0%,\s*#526d56 42%,\s*#314637 72%,\s*#5f334c 100%\)/);
const componentGuardMarker = css.lastIndexOf("/* France 1998 final component guard. */");
assert.ok(componentGuardMarker > menuParityMarker, "The final 1998 component guard must win over shared historical-mode styles.");
const componentGuard = css.slice(componentGuardMarker);
assert.match(componentGuard, /retro-tournament-heading[\s\S]*background:\s*transparent\s*!important/);
assert.match(componentGuard, /retro-tournament-heading\s*>\s*\*[^{]*\{\s*display:\s*none\s*!important/);
assert.match(componentGuard, /\.retro-scorers[\s\S]*background:\s*transparent\s*!important/);
assert.match(componentGuard, /search-result-popover[\s\S]*--r98-burgundy/);
assert.match(componentGuard, /standard-match-tactics[\s\S]*standard-tactic-buttons/);
assert.match(componentGuard, /match-commentary-feed[\s\S]*--r98-burgundy/);
assert.match(componentGuard, /snapshot-modal[\s\S]*champion-stage/);
assert.match(componentGuard, /match-penalty-targets[\s\S]*width:\s*30px\s*!important/);
assert.match(componentGuard, /retro-manager-pitch[\s\S]*repeating-linear-gradient/);
assert.match(componentGuard, /#mainContent button[\s\S]*border-radius:\s*3px\s*!important/);
assert.match(componentGuard, /\.retro-view-tabs\s*\{[\s\S]*border-radius:\s*6px\s*!important/);
const finalsPolishMarker = css.lastIndexOf("/* France 1998 finals, bracket and share-card correction pass. */");
assert.ok(finalsPolishMarker > componentGuardMarker, "France 1998 finals polish must override shared bracket and champions styling.");
const finalsPolish = css.slice(finalsPolishMarker);
assert.match(finalsPolish, /team-match-events\.away[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*18px/);
assert.match(finalsPolish, /#mainContent \.bracket-heads[\s\S]*#5f334c/);
assert.match(finalsPolish, /bracket-connector::before[\s\S]*border-top:\s*1px solid[\s\S]*background:\s*transparent\s*!important/);
assert.match(finalsPolish, /champion-stage \.champion-content[\s\S]*champion-save-button/);
assert.match(finalsPolish, /champion-stage \.champion-award[\s\S]*min-height:\s*72px\s*!important/);
assert.match(finalsPolish, /snapshot-modal \.snapshot-preview[\s\S]*#5f334c/);
const selectorHelpMarker = css.lastIndexOf("/* Keep the 1998/2002 menu artwork from escaping its card");
assert.ok(selectorHelpMarker > 0, "The 1998/2002 selector help panels need their scoped layer correction.");
const selectorHelp = css.slice(selectorHelpMarker);
assert.match(selectorHelp, /data-retro-edition="1998"/);
assert.match(selectorHelp, /data-retro-edition="2002"/);
assert.match(selectorHelp, /:has\(\.landing-setting-info\[open\]\)::after[\s\S]*opacity:\s*0/);
assert.match(selectorHelp, /\.retro-landing-settings:has\(\.landing-setting-info\[open\]\)[\s\S]*z-index:\s*20/);
assert.match(selectorHelp, /\.landing-setting-info,[\s\S]*\.landing-setting-info\[open\][\s\S]*position:\s*static/);
assert.match(app, /backgroundStart:\s*"#a4b9a0"[\s\S]*backgroundMiddle:\s*"#526d56"[\s\S]*backgroundEnd:\s*"#5f334c"/);
assert.match(app, /snapshotRoundedRect\(context, 55, 42, 1090, canvasHeight - 117, Number\(retroYear\) === 1998 \? 8 : 28\)/);
assert.match(app, /const isFrance1998 = Number\(year\) === 1998/);
assert.match(app, /!isFrance1998 && !isEuro2016 && player\.preferredFoot/);
const theme = css.slice(css.indexOf("/* France 1998 — isolated"));
[".retro-screen-header", ".retro-view-tabs", ".retro-group-table", ".retro-fixture", ".commentary-bar", ".tactic-button", ".lineup-pitch", ".bench-player", ".penalty-stage", ".match-penalty-targets", ".bracket-connector", ".champion-stage", ".snapshot-modal", "data-achievement-theme=\"1998\"", "feature-announcement-1998", "@media (max-width: 720px)"].forEach((token) => assert.ok(theme.includes(token), `France 1998 theme must cover ${token}.`));
assert.match(theme, /match-penalty-targets[^}]+border-radius:\s*50%\s*!important/s);
assert.doesNotMatch(css.slice(themeMarker), /#(?:006b3c|00843d|16834b|fcc40c|ffd34f|eb950e)\b/i, "The final France 1998 guard must not leak green, Brazil yellow or South Africa orange.");

assert.match(html, /id="retro1998AnnouncementModal"[\s\S]*World Cup 1998 is here[\s\S]*Play 1998 World Cup/);
assert.match(app, /RETRO_1998_ANNOUNCEMENT_KEY = "world-256-announcement-retro-1998-v1"/);
assert.match(app, /retro1998AnnouncementAction[\s\S]*setRetroWorldCupYear\("1998"\)[\s\S]*startRetroWorldCupButton/);
assert.match(challenge, /1998:\s*"FRANCE 1998"/);
assert.match(challenge, /"Yugoslavia":\s*"Serbia"/);
assert.match(challengeService, /id:\s*"retro-1998-world-tour"/);
assert.match(challengeService, /retro-\(1998\|2002\|2006\|2010\|2014\|2016\|2018\|2022\|2024\|2026\)/);
assert.match(migration, /CREATE TABLE IF NOT EXISTS retro_1998_attempts/);
assert.match(migration, /\bseed INTEGER NOT NULL\b/);
assert.doesNotMatch(migration, /tournament_seed/);

for (const asset of ["france-98-logo.webp", "france-98-bg-desktop.png", "france-98-bg-portrait.png", "yugoslavia.webp"]) {
  assert.ok(fs.statSync(path.join(root, "assets", "retro-1998", asset)).size > 10_000, `${asset} must be a real asset.`);
}
assert.match(app, /Yugoslavia:\s*"\.\/assets\/retro-1998\/yugoslavia\.webp"/);

console.log("France 1998 data, engine, route, management, theme, news and achievement checks passed.");
