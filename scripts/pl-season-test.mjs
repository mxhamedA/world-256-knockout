import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataSource = fs.readFileSync(path.join(root, "premier-league-data.js"), "utf8");
const seasonSource = fs.readFileSync(path.join(root, "premier-league.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const workerSource = fs.readFileSync(path.join(root, "worker.mjs"), "utf8");
const wranglerSource = fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "premier-league.css"), "utf8");
const menuCss = fs.readFileSync(path.join(root, "clean.css"), "utf8");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(dataSource, context);

const clubs = context.window.PREMIER_LEAGUE_2026_27_CLUBS;
const schedule = context.window.createPremierLeagueSchedule();
assert.equal(clubs.length, 20, "The season must contain 20 clubs");
assert.equal(new Set(clubs.map((club) => club.id)).size, 20, "Club ids must be unique");
assert.ok(clubs.every((club) => club.playerProfiles.length >= 13), "Every club needs a usable match-engine squad");
assert.ok(clubs.every((club) => club.rating >= 60 && club.rating <= 95), "Club ratings must stay in range");
assert.ok(clubs.every((club) => fs.existsSync(path.join(root, club.badge.replace("./", "")))), "Every club badge must exist");
assert.equal(schedule.length, 38, "The season must contain 38 matchweeks");
assert.ok(schedule.every((round) => round.length === 10), "Every matchweek must contain 10 fixtures");
assert.equal(schedule.flat().length, 380, "The season must contain 380 fixtures");
const pairCounts = new Map();
schedule.flat().forEach((match) => {
  assert.notEqual(match.homeId, match.awayId, "A club cannot play itself");
  const pair = [match.homeId, match.awayId].sort().join(":");
  pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
});
assert.equal(pairCounts.size, 190, "Every unique club pairing must be scheduled");
assert.ok([...pairCounts.values()].every((count) => count === 2), "Every pairing must be played home and away");

for (const transfer of [
  ["liverpool", "Victor Muñoz"],
  ["manchester-city", "Elliot Anderson"],
  ["manchester-united", "Andrey Santos"],
  ["manchester-united", "Youri Tielemans"],
  ["tottenham-hotspur", "Sandro Tonali"],
]) {
  const club = clubs.find((candidate) => candidate.id === transfer[0]);
  assert.ok(club?.arrivals.includes(transfer[1]), `${transfer[1]} should be recorded for ${transfer[0]}`);
  assert.ok(club?.players.includes(transfer[1]), `${transfer[1]} should be in the match-engine squad`);
}

assert.match(seasonSource, /simulateMatch\(match, roundIndex\)/, "PL mode must reuse the existing match engine");
assert.match(seasonSource, /rounds\.length !== 38/, "PL season must validate 38 matchweeks");
assert.match(seasonSource, /round\.length === 10/, "Each matchweek must contain 10 matches");
assert.ok(schedule.flat().every((match) => match.allowDraw === true), "League matches must allow draws");
assert.match(html, /id="premierLeagueSeasonScreen"/, "PL screen is missing");
assert.match(html, /id="startPremierLeagueSeasonButton"/, "PL start action is missing");
assert.doesNotMatch(html, /20 clubs &middot; 380 matches/, "The PL menu card should not repeat the season totals");
assert.doesNotMatch(html, />38 matchweeks</, "The PL menu start button should stay compact");
assert.match(
  html,
  /id="startPremierLeagueSeasonButton"[^>]*disabled[^>]*>[\s\S]*?Coming soon/,
  "The PL menu must remain visibly unavailable.",
);
assert.match(
  html,
  /class="landing-settings premier-league-settings"[^>]*>[\s\S]*data-settings-scope="premier-league"[\s\S]*id="premierLeagueTeamPickerButton"/,
  "The PL options and team picker should remain visible while launch is unavailable.",
);
assert.match(html, /id="retroMatchLineupsPanel"/, "The shared matchday squad manager is missing");
assert.doesNotMatch(html, /id="standardFormationSelect"/, "The old PL-only formation preview must be removed");
assert.match(css, /--pl-bg:\s*#1e0021/, "PL background colour is incorrect");
assert.match(css, /--pl-surface-light:\s*#381d53/, "PL lighter purple is incorrect");
assert.match(css, /\.pl-season-open #appShell\s*\{[\s\S]*?display:\s*none !important/, "Opening PL mode must hide the main app shell");
assert.match(css, /body\.pl-match-mode-active #roundBoard #simulateRoundButton/, "PL fixture controls must use the purple theme");
assert.match(css, /#teamFilterControl \.search-result-popover[\s\S]*?background:\s*#28002d/, "The PL club filter must use the purple theme");
assert.match(appSource, /function searchableTeamsForCurrentMode\(\)[\s\S]*?state\?\.premierLeagueSeason[\s\S]*?activeTournamentTeamIds/, "The PL filter must use active league clubs");
assert.match(appSource, /state\?\.premierLeagueSeason\s*\?\s*"Filter by club"/, "The PL filter must be labelled for clubs");
assert.match(css, /body\.pl-match-mode-active \.score-live-controls\s*\{[\s\S]*?transform:\s*translateY\(-4px\)/, "PL live controls need score clearance");
assert.match(css, /\.match-stage\.pl-full-time \.event-live-clock\[hidden\][\s\S]*?display:\s*none !important/, "PL full-time layout must remove invisible live rows");
assert.match(css, /body\.pl-match-mode-active #snapshotButton\s*\{[\s\S]*?background:\s*#381d53/, "PL snapshot control must use the purple theme");
assert.match(css, /body\.pl-match-mode-active \.team-match-events\s*\{[\s\S]*?display:\s*grid !important/, "PL scorer lines must be visible below each club");
assert.match(css, /body\.pl-match-mode-active \.team-match-events \.timeline-event\s*\{[\s\S]*?font-family:\s*"Manrope", system-ui, sans-serif[\s\S]*?font-weight:\s*800/, "PL scorer lines must use the standard match font");
assert.match(css, /body\.pl-match-mode-active \.match-score\s*\{[\s\S]*?font-family:\s*"DM Mono", monospace[\s\S]*?font-weight:\s*500/, "PL score numerals must use the standard match font");
assert.match(css, /\.insight-right,[\s\S]*?\.insight-left\s*\{[\s\S]*?margin-top:\s*70px/, "PL side panels must clear the back-button row");
assert.match(css, /\.pl-match-detail-active \.insight-right\s*\{[\s\S]*?margin-top:\s*86px/, "Starting a PL match must not pull Stats and Tactics upward");
assert.match(css, /\.pl-live-back-button\s*\{[\s\S]*?margin-left:\s*-262px/, "The PL back button must use the freed left-side space");
assert.match(appSource, /premierLeague:\s*"\/pl-simulator"/, "The app router must expose /pl-simulator");
assert.match(appSource, /premierLeagueFormationTacticalImpact/, "PL formations must affect the match engine");
assert.match(appSource, /sharedLineupManagerSupported/, "PL mode must use the shared WC lineup manager");
assert.match(appSource, /state\?\.premierLeagueSeason[\s\S]*state\.managerLineups/, "PL lineups must persist with the season");
assert.match(css, /body\.pl-match-mode-active #retroMatchLineupsPanel/, "The shared lineup manager needs a PL theme");
assert.match(menuCss, /\.mode-card-premier-league \.premier-league-team-picker\.has-team[\s\S]*?background:\s*rgba\(62, 25, 82, 0\.82\)/, "The PL menu picker should stay purple when a club is selected");
assert.match(menuCss, /\.mode-card-premier-league \.premier-league-team-mark[\s\S]*?border:\s*0[\s\S]*?background:\s*transparent/, "Installed club badges should not sit inside a box");
assert.match(appSource, /premierLeagueAssetsInstalled[\s\S]*?team\?\.badge/, "PL snapshots must load installed club badges");
assert.match(appSource, /PL 26\/27 SIMULATION/, "PL snapshots must carry the season footer");
assert.match(appSource, /home\.name === "Manchester United"[\s\S]*?\? "Man United"/, "PL snapshots must shorten Manchester United");
assert.match(appSource, /homeSnapshotName,\s*325,\s*250[\s\S]*?align:\s*"right"/, "PL snapshot home names must sit beside their badge");
assert.match(appSource, /awaySnapshotName,\s*875,\s*250[\s\S]*?align:\s*"left"/, "PL snapshot away names must sit beside their badge");
assert.match(workerSource, /"\/pl-simulator"/, "The Worker must serve the PL clean URL");
assert.match(wranglerSource, /"\/pl-simulator"/, "Cloudflare must route /pl-simulator through the Worker");
assert.match(seasonSource, /currentAppMode\(\)\s*===\s*"premierLeague"/, "Direct PL links must open the season screen");
assert.match(seasonSource, /matchViewActive:\s*false/, "New PL seasons must start on the season screen");
assert.match(seasonSource, /restoreMatch[\s\S]*season\.matchViewActive[\s\S]*openMatch\(season\.selectedMatch/, "Refreshing a PL match must restore its match screen");
assert.match(seasonSource, /MATCH_VIEW_STORAGE_KEY[\s\S]*saveActiveMatchView\(selectedRoundIndex, selectedMatchIndex\)/, "Opening a PL match must save a dedicated refresh marker");
assert.match(seasonSource, /readActiveMatchView\(\)[\s\S]*saved\.matchViewActive = true/, "Loading a PL season must restore the marked match");
assert.match(seasonSource, /season\.matchViewActive = false;[\s\S]*clearActiveMatchView\(\)/, "Returning to the PL season must clear the refresh marker");
assert.match(seasonSource, /season\.matchViewActive = true;[\s\S]*saveSeason\(\);[\s\S]*state = season/, "Opening a PL match must persist the active match view");
assert.match(seasonSource, /season\.matchViewActive = false;[\s\S]*syncEngineProgress/, "Returning to the season must clear the active match view");

const listeners = new Map();
const classList = () => ({ add() {}, remove() {}, toggle() {} });
const fakeElement = (name) => ({
  name,
  hidden: name === "screen",
  disabled: false,
  dataset: {},
  style: { width: "" },
  classList: classList(),
  innerHTML: "",
  textContent: "",
  addEventListener(type, listener) {
    listeners.set(`${name}:${type}`, listener);
  },
  setAttribute() {},
  closest() { return null; },
});
const elements = {
  screen: fakeElement("screen"),
  appShell: fakeElement("appShell"),
  content: fakeElement("content"),
  start: fakeElement("start"),
  back: fakeElement("back"),
  restart: fakeElement("restart"),
  simulate: fakeElement("simulate"),
  progressLabel: fakeElement("progressLabel"),
  progressBar: fakeElement("progressBar"),
  title: fakeElement("title"),
  summary: fakeElement("summary"),
  kicker: fakeElement("kicker"),
};
const selectorElements = new Map([
  ["#premierLeagueSeasonScreen", elements.screen],
  ["#appShell", elements.appShell],
  ["#plSeasonContent", elements.content],
  ["#startPremierLeagueSeasonButton", elements.start],
  ["#plSeasonBackButton", elements.back],
  ["#plRestartSeasonButton", elements.restart],
  ["#plSimulateMatchweekButton", elements.simulate],
  ["#plSeasonProgressLabel", elements.progressLabel],
  ["#plSeasonProgressBar", elements.progressBar],
  ["#plSeasonTitle", elements.title],
  ["#plSeasonSummary", elements.summary],
  ["#plSeasonKicker", elements.kicker],
]);
const tabs = ["overview", "matches", "table", "squads"].map((view) => ({
  ...fakeElement(`tab-${view}`),
  dataset: { plView: view },
}));
const savedValues = new Map();
const uiWindow = {
  PREMIER_LEAGUE_2026_27_CLUBS: clubs,
  PREMIER_LEAGUE_2026_27_DATA_UPDATED: context.window.PREMIER_LEAGUE_2026_27_DATA_UPDATED,
  createPremierLeagueSchedule: context.window.createPremierLeagueSchedule,
  addEventListener() {},
  confirm: () => true,
  scrollTo() {},
};
const uiContext = {
  window: uiWindow,
  document: {
    body: { classList: classList() },
    querySelector: (selector) => selectorElements.get(selector) || null,
    querySelectorAll: (selector) => selector === "[data-pl-view]" ? tabs : [],
  },
  TEAM_BY_ID: new Map(),
  clearPlayerProfileCacheForTeam() {},
  normalizeSettings: (settings = {}) => ({ upset: "balanced", goals: "normal", ...settings }),
  premierLeagueMenuSetup: { upset: "balanced", goals: "normal", teamId: "arsenal" },
  premierLeagueAssetsInstalled: true,
  state: { original: true },
  simulateMatch: () => ({
    homeGoals: 2,
    awayGoals: 1,
    winnerId: "arsenal",
    homeEvents: [],
    awayEvents: [],
    redCards: [],
    injuries: [],
  }),
  stopStandardPlaybackForNavigation() {},
  closeOpenDialogsAndMenus() {},
  showToast() {},
  escapeHtml: (value) => String(value),
  localStorage: {
    getItem: (key) => savedValues.get(key) || null,
    setItem: (key, value) => savedValues.set(key, value),
    removeItem: (key) => savedValues.delete(key),
  },
  console,
  Date,
  Intl,
  Math,
  Map,
  Set,
  JSON,
};
vm.createContext(uiContext);
vm.runInContext(seasonSource, uiContext);
listeners.get("start:click")();
assert.equal(elements.screen.hidden, false, "Starting the season should open the PL screen");
assert.equal(elements.appShell.hidden, true, "Starting the season should hide the mode menu");
assert.match(elements.content.innerHTML, /Matchweek 1/, "The opening matchweek should render");
listeners.get("simulate:click")();
const storedSeason = JSON.parse(savedValues.get("world-256-pl-26-27-season-v1"));
assert.equal(storedSeason.standardFormation, "4-3-3", "A new PL season should start in a 4-3-3");
assert.ok(storedSeason.rounds[0].every((match) => match.result?.revealed), "Simulating should complete all ten fixtures");
assert.equal(storedSeason.activeRound, 1, "The season should advance to matchweek two");

console.log("PL 26/27 season tests passed.");
