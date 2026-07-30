import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { DRAFT_TEAMS } from "../draft-team-catalog.generated.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generated = fs.readFileSync(path.join(root, "player-pools.generated.js"), "utf8");
const data = fs.readFileSync(path.join(root, "data.js"), "utf8");
const simulationEngine = fs.readFileSync(path.join(root, "simulation-engine.js"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const context = {};
vm.createContext(context);
vm.runInContext(`${generated}\n${data}\n${simulationEngine}\nglobalThis.__rosterQa = {
  teams: TEAMS,
  pools: RECENT_NATIONAL_TEAM_PLAYERS,
  profiles: RECENT_NATIONAL_TEAM_PLAYER_PROFILES,
  sources: NATIONAL_TEAM_PLAYER_SOURCES,
  bulgariaProfiles: buildPlayerProfiles(
    TEAMS.find((team) => team.name === "Bulgaria"),
    TEAMS.find((team) => team.name === "Bulgaria").players,
    false,
  ),
};`, context);

const { teams, pools, profiles, sources, bulgariaProfiles } = context.__rosterQa;
const recognised = teams.filter((team) => team.confed !== "INVITED");
const completePositions = ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CAM", "LW", "ST", "RW"];

recognised.forEach((team) => {
  assert.ok(Array.isArray(pools[team.name]) && pools[team.name].length >= 4, `${team.name} needs a sourced recent-player pool.`);
  assert.ok(sources[team.name], `${team.name} needs a traceable roster source.`);
  assert.equal(new Set(pools[team.name]).size, pools[team.name].length, `${team.name} contains duplicate player names.`);
});

Object.entries(profiles).forEach(([team, xi]) => {
  assert.ok(xi.length >= 11 && xi.length <= 26, `${team} must have a structured squad of 11-26 players.`);
  assert.deepEqual(Array.from(xi.slice(0, 11), (player) => player.position), completePositions, `${team} has invalid XI positions.`);
  assert.equal(new Set(xi.map((player) => player.name)).size, xi.length, `${team} has duplicate squad players.`);
  xi.forEach((player) => {
    assert.ok(player.name && !/^Player \d+$/i.test(player.name), `${team} contains a placeholder player.`);
    assert.ok(["GK", "DF", "MF", "FW"].includes(player.sourcePosition), `${team}: ${player.name} has no source position group.`);
  });
});

teams.forEach((team) => {
  const currentNames = new Set(team.players || []);
  (team.playerProfiles || []).forEach((profile) => {
    assert.ok(currentNames.has(profile.name), `${team.name}: ${profile.name} is not in the current player pool.`);
  });
});

const germany = teams.find((team) => team.name === "Germany");
assert.ok(germany?.players?.length >= 26, "Germany needs a full 26-player recent squad.");
assert.ok(!germany.players.some((name) => /^Germany Player \d+$/i.test(name)), "Germany must not contain numbered placeholders.");

const danielNaumov = bulgariaProfiles.find((profile) => profile.name === "Daniel Naumov");
assert.equal(danielNaumov?.position, "GK", "Bulgaria goalkeeper Daniel Naumov must not be assigned as a striker.");
assert.equal(danielNaumov?.finishing, 5, "Daniel Naumov must retain goalkeeper-level finishing.");
assert.equal(danielNaumov?.penaltyTaker, false, "Daniel Naumov must not become Bulgaria's default penalty taker.");

const brazil = teams.find((team) => team.name === "Brazil");
const retiredBrazilPlayers = new Set(["Kaká", "Kaka", "Robinho", "Cafu", "Roberto Carlos", "Rivaldo", "Ronaldinho"]);
assert.ok(brazil?.players?.length >= 20, "Brazil needs a complete recent squad.");
assert.ok(
  brazil.players.every((name) => !retiredBrazilPlayers.has(name)),
  "Brazil's current squad must not contain historical players.",
);
assert.ok(
  brazil.playerProfiles.every((profile) => brazil.players.includes(profile.name)),
  "Brazil's structured squad must only use its current player pool.",
);
const rosterNameKey = (value) => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]/gi, "")
  .toLocaleLowerCase();
const retiredInternationalLeakChecks = new Map([
  ["Serbia", ["Dusan Tadic"]],
  ["Cameroon", ["Karl Toko Ekambi"]],
  ["Germany", ["Manuel Neuer"]],
  ["Czechia", ["Patrik Schick"]],
  ["Mexico", ["Guillermo Ochoa"]],
  ["Algeria", ["Riyad Mahrez"]],
  ["Ecuador", ["Enner Valencia"]],
  ["Argentina", ["Nicolas Otamendi"]],
  ["Austria", ["Marko Arnautovic"]],
  ["Senegal", ["Sadio Mane"]],
  ["Scotland", ["Craig Gordon"]],
  ["Ivory Coast", ["Jean Michael Seri"]],
  ["Brazil", ["Neymar"]],
  ["Japan", ["Wataru Endo"]],
  ["England", ["Kyle Walker"]],
]);
retiredInternationalLeakChecks.forEach((retiredPlayers, teamName) => {
  const team = teams.find((candidate) => candidate.name === teamName);
  const currentPlayerKeys = new Set((team?.players || []).map(rosterNameKey));
  assert.ok(
    retiredPlayers.every((player) => !currentPlayerKeys.has(rosterNameKey(player))),
    `${teamName}'s current squad must not inherit retired players from the legacy fallback.`,
  );
});
assert.match(
  data,
  /const recentPlayers = RECENT_NATIONAL_TEAM_PLAYERS\[name\] \|\| \[\];[\s\S]*const sourcePlayers = recentPlayers\.length \? recentPlayers : \(REAL_PLAYERS\[name\] \|\| \[\]\);/,
  "A sourced current roster must replace, rather than merge with, the legacy familiar-player fallback.",
);
const updater = fs.readFileSync(path.join(root, "scripts", "update-national-team-players.mjs"), "utf8");
assert.match(
  updater,
  /if \(\/\(\?:\^\|\[\\s\|=\]\)RET/,
  "The roster updater must discard recent-call-up rows marked as retired.",
);
assert.match(
  updater,
  /retiredInternationalPlayerKeys\.has\(playerKey\)/,
  "The roster updater must compare excluded players through encoding-safe lookup keys.",
);
assert.match(
  html,
  /player-pools\.generated\.js\?v=current-rosters-/,
  "Current squad data needs a cache-busting asset version.",
);

function functionSource(name) {
  const start = app.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist in app.js.`);
  const bodyStart = app.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < app.length; index += 1) {
    if (app[index] === "{") depth += 1;
    if (app[index] === "}") depth -= 1;
    if (depth === 0) return app.slice(start, index + 1);
  }
  throw new Error(`Could not parse ${name} from app.js.`);
}

const profileResolverSource = functionSource("playerProfilesForTeam");
assert.match(
  profileResolverSource,
  /TEAMS\.find\(\(candidate\) => candidate\.name === team\.name\)/,
  "Non-retro matches must resolve players from the canonical current national team.",
);
assert.match(
  profileResolverSource,
  /current-roster-3:/,
  "The player-profile cache must be separated from older roster revisions.",
);
const eligibleScorerSource = functionSource("eligibleScorerProfiles");
assert.match(
  eligibleScorerSource,
  /profile\.position !== "GK"/,
  "Goalkeepers must be excluded from normal goal-scorer selection.",
);
const canonicalRosterSource = functionSource("canonicalCurrentRosterNames");
assert.match(
  canonicalRosterSource,
  /buildPlayerProfiles\(rosterTeam,\s*rosterTeam\?\.players \|\| \[\],\s*false\)/,
  "Saved current tournaments must infer positions before repairing invalid scorers.",
);
const customSourcePoolSource = functionSource("customTeamSourcePool");
assert.match(
  customSourcePoolSource,
  /if \(source === "current"\) return \[\.\.\.TEAMS\]/,
  "Current custom-tournament countries must come from the canonical current-team collection.",
);

const rosterRepairContext = vm.createContext({});
vm.runInContext(`
  const repairPlayerText = (value) => String(value || "");
  const stableHash = (value) => [...String(value)].reduce((hash, character) => hash + character.charCodeAt(0), 0);
  const TEAM_BY_ID = new Map();
  const TEAMS = [];
  ${functionSource("removeImpossiblePlayerAbsenceEvents")}
  ${functionSource("canonicalCurrentRosterNames")}
  ${functionSource("repairDefaultKnockoutRosterResults")}
  ${functionSource("checkpointUsesCurrentRosters")}
  globalThis.repair = repairDefaultKnockoutRosterResults;
  globalThis.checkpointIsCurrent = checkpointUsesCurrentRosters;
  globalThis.setTeams = (entries) => entries.forEach((team) => TEAM_BY_ID.set(team.id, team));
`, rosterRepairContext);
const currentBrazilProfiles = Array.from(brazil.playerProfiles, (profile) => ({ ...profile }));
const portugal = teams.find((team) => team.name === "Portugal");
assert.ok(portugal?.players?.length >= 20, "Portugal needs a complete recent squad.");
assert.ok(!portugal.players.includes("Deco"), "Portugal's current squad must not contain Deco.");
const currentPortugalProfiles = Array.from(portugal.playerProfiles, (profile) => ({ ...profile }));
const spain = teams.find((team) => team.name === "Spain");
const currentSpainProfiles = Array.from(spain.playerProfiles, (profile) => ({ ...profile }));
assert.ok(currentSpainProfiles.length >= 20, "Spain needs a complete current squad.");
const opponentProfiles = Array.from(
  teams.find((team) => !["Brazil", "Portugal"].includes(team.name) && team.playerProfiles?.length)?.playerProfiles || [],
  (profile) => ({ ...profile }),
);
rosterRepairContext.setTeams([
  { id: "brazil", playerProfiles: currentBrazilProfiles },
  { id: "bulgaria", playerProfiles: Array.from(bulgariaProfiles, (profile) => ({ ...profile })) },
  { id: "portugal", playerProfiles: currentPortugalProfiles },
  { id: "spain", playerProfiles: currentSpainProfiles },
  { id: "opponent", playerProfiles: opponentProfiles },
]);
const savedMatches = Array.from({ length: 128 }, (_, index) => {
  if (index === 0) {
    return {
      id: "r0-m0",
      homeId: "brazil",
      awayId: "opponent",
      result: {
        homeGoals: 1,
        awayGoals: 0,
        winnerId: "brazil",
        homeEvents: [{ minute: 42, scorer: "Kaká" }],
        awayEvents: [],
      },
    };
  }
  if (index === 1) {
    return {
      id: "r0-m1",
      homeId: "opponent",
      awayId: "portugal",
      result: {
        homeGoals: 0,
        awayGoals: 1,
        winnerId: "portugal",
        homeEvents: [],
        awayEvents: [{ minute: 61, scorer: "Deco" }],
        redCards: [{ side: "away", teamId: "portugal", player: "Deco" }],
        injuries: [{ side: "away", teamId: "portugal", player: "Deco" }],
        shootout: [{ side: "away", player: "Deco", scored: true }],
      },
    };
  }
  if (index === 2) {
    return {
      id: "r0-m2",
      homeId: "bulgaria",
      awayId: "opponent",
      result: {
        homeGoals: 1,
        awayGoals: 0,
        winnerId: "bulgaria",
        homeEvents: [{ minute: 54, scorer: "Daniel Naumov" }],
        awayEvents: [],
      },
    };
  }
  return { id: `r0-m${index}`, homeId: "brazil", awayId: "opponent", result: null };
});
const savedTournament = { started: true, rounds: [savedMatches] };
assert.equal(rosterRepairContext.repair(savedTournament), true, "A stale historical scorer must be repaired.");
assert.ok(
  currentBrazilProfiles.some((profile) => profile.name === savedTournament.rounds[0][0].result.homeEvents[0].scorer),
  "A repaired scorer must belong to Brazil's current squad.",
);
assert.equal(savedTournament.rounds[0][0].result.homeGoals, 1, "Roster repair must preserve the score.");
assert.equal(savedTournament.rounds[0][0].result.winnerId, "brazil", "Roster repair must preserve the winner.");
const repairedPortugalResult = savedTournament.rounds[0][1].result;
assert.ok(
  currentPortugalProfiles.some((profile) => profile.name === repairedPortugalResult.awayEvents[0].scorer),
  "Portugal's stale Deco scorer must be replaced with a current player.",
);
assert.ok(
  [repairedPortugalResult.redCards[0].player, repairedPortugalResult.injuries[0].player, repairedPortugalResult.shootout[0].player]
    .every((name) => currentPortugalProfiles.some((profile) => profile.name === name)),
  "Portugal's cards, injuries and shootout takers must all use current players.",
);
assert.equal(repairedPortugalResult.awayGoals, 1, "Portugal roster repair must preserve the score.");
assert.equal(repairedPortugalResult.winnerId, "portugal", "Portugal roster repair must preserve the winner.");
assert.notEqual(
  savedTournament.rounds[0][2].result.homeEvents[0].scorer,
  "Daniel Naumov",
  "A saved Daniel Naumov goal must be reassigned to a Bulgarian outfield player.",
);
assert.ok(
  bulgariaProfiles.some((profile) => (
    profile.position !== "GK"
    && profile.name === savedTournament.rounds[0][2].result.homeEvents[0].scorer
  )),
  "The replacement Bulgaria scorer must be a real outfield player.",
);

const savedGroupTournament = {
  started: true,
  customTournament: { active: true, structure: "groups", teamCount: 32 },
  rounds: [[{
    id: "group-a-match-1",
    homeId: "brazil",
    awayId: "opponent",
    result: {
      homeGoals: 2,
      awayGoals: 0,
      winnerId: "brazil",
      homeEvents: [
        { minute: 10, scorer: "Robinho" },
        { minute: 14, scorer: "Kaká" },
      ],
      awayEvents: [],
    },
  }, {
    id: "group-a-match-2",
    homeId: "spain",
    awayId: "opponent",
    result: {
      homeGoals: 1,
      awayGoals: 0,
      winnerId: "spain",
      homeEvents: [{ minute: 67, scorer: "David Villa", assist: "Xavi" }],
      awayEvents: [],
      substitutions: [{
        side: "home",
        teamId: "spain",
        player: "Andres Iniesta",
        playerIn: "Andres Iniesta",
        playerOut: "Xabi Alonso",
      }],
      playerRatings: {
        home: { "Iker Casillas": { rating: 8.1 } },
        away: {},
      },
    },
  }]],
};
assert.equal(
  rosterRepairContext.repair(savedGroupTournament),
  true,
  "A saved group-format tournament must also repair historical scorers.",
);
assert.ok(
  savedGroupTournament.rounds[0][0].result.homeEvents.every((event) => (
    currentBrazilProfiles.some((profile) => profile.name === event.scorer)
  )),
  "Every repaired group-stage scorer must belong to Brazil's current squad.",
);
const repairedSpainResult = savedGroupTournament.rounds[0][1].result;
assert.ok(
  [repairedSpainResult.homeEvents[0].scorer, repairedSpainResult.homeEvents[0].assist]
    .every((name) => currentSpainProfiles.some((profile) => profile.name === name)),
  "A normal custom Spain match must replace 2010-era scorers and assists.",
);
assert.ok(
  [
    repairedSpainResult.substitutions[0].player,
    repairedSpainResult.substitutions[0].playerIn,
    repairedSpainResult.substitutions[0].playerOut,
  ].every((name) => currentSpainProfiles.some((profile) => profile.name === name)),
  "A normal custom Spain match must replace 2010-era substitution names.",
);
assert.ok(
  Object.keys(repairedSpainResult.playerRatings.home)
    .every((name) => currentSpainProfiles.some((profile) => profile.name === name)),
  "A normal custom Spain match must replace 2010-era player-rating keys.",
);

assert.equal(rosterRepairContext.checkpointIsCurrent({
  scope: "standard",
  shootout: [{ side: "away", player: "Deco" }],
}, savedMatches[1]), false, "A checkpoint containing Deco must not restore into current Portugal.");
assert.equal(rosterRepairContext.checkpointIsCurrent({
  scope: "standard",
  feed: [{ side: "home", type: "goal", player: "Kaká" }],
}, savedMatches[0]), false, "A checkpoint containing Kaká must not restore into current Brazil.");
assert.equal(rosterRepairContext.checkpointIsCurrent({
  scope: "standard",
  shootout: [{ side: "away", player: currentPortugalProfiles[0].name }],
}, savedMatches[1]), true, "A checkpoint using Portugal's current squad must remain resumable.");
assert.equal(rosterRepairContext.checkpointIsCurrent({
  scope: "standard",
  playerRatings: { home: { Xavi: { rating: 8.5 } }, away: {} },
}, savedGroupTournament.rounds[0][1]), false, "A checkpoint containing a 2010 Spain rating must be discarded.");

const retroSquadResolverSource = functionSource("retroManagerSquadForTeam");
assert.match(
  retroSquadResolverSource,
  /if \(!isRetroSimulatorState\(\)\) return null;/,
  "Historical squad resolution must be disabled outside an active retro tournament.",
);
const retroLineupResolverSource = functionSource("retroManagerLineupForTeam");
assert.match(
  retroLineupResolverSource,
  /\|\| !isRetroSimulatorState\(\)/,
  "Historical lineup resolution must be disabled outside an active retro tournament.",
);
const renderSource = functionSource("render");
assert.match(
  renderSource,
  /restoreStandardTournamentState\(\);[\s\S]*repairDefaultKnockoutRosterResults\(state\)/,
  "Normal and custom tournament results must be repaired whenever their state becomes active.",
);

DRAFT_TEAMS.forEach((team) => {
  assert.equal(team.players.length, 26, `${team.name} needs a complete 26-player online squad.`);
  assert.equal(new Set(team.players).size, 26, `${team.name} has duplicate online squad names.`);
  assert.ok(!team.players.some((name) => /(?:^|\s)Player\s+\d+$/i.test(name)), `${team.name} contains a numbered placeholder.`);
});

assert.equal(Object.keys(pools).length, recognised.length, "Every recognised team needs a recent-player pool.");
assert.ok(Object.keys(profiles).length >= 195, "Structured source coverage unexpectedly dropped.");
console.log(`Roster data: ${Object.keys(pools).length} sourced pools, ${Object.keys(profiles).length} structured squads.`);
