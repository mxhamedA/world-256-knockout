import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const squadSource = fs.readFileSync(path.join(root, "premier-league-squads.generated.js"), "utf8");
const fc26Source = fs.readFileSync(path.join(root, "premier-league-fc26-ratings.js"), "utf8");
const dataSource = fs.readFileSync(path.join(root, "premier-league-data.js"), "utf8");
const seasonSource = fs.readFileSync(path.join(root, "premier-league.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const workerSource = fs.readFileSync(path.join(root, "worker.mjs"), "utf8");
const wranglerSource = fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "premier-league.css"), "utf8");
const menuCss = fs.readFileSync(path.join(root, "clean.css"), "utf8");
assert.match(
  seasonSource,
  /seasonAchievementsButton\?\.addEventListener\("click",[\s\S]*openRetroModal\(2026\)/,
  "The PL season header must open the PL achievements popup.",
);
assert.match(
  appSource,
  /state\?\.premierLeagueSeason[\s\S]*openRetroModal\(2026\)/,
  "The shared match header must keep PL achievements in the popup.",
);
assert.doesNotMatch(
  appSource,
  /const premierLeagueManagementHidden = Boolean\(state\.premierLeagueSeason\)/,
  "PL mode must not hide tactics for the managed club.",
);
assert.match(
  appSource,
  /const showStandardTactics = LIVE_MATCH_MANAGEMENT_UI_ENABLED\s*&& isControlledMatch\s*&& !revealed/,
  "Managed PL fixtures must expose the existing tactical presets.",
);
assert.doesNotMatch(
  appSource,
  /state\?\.premierLeagueSeason \? `\$\{standardFormationKey\(\)\}/,
  "The PL tactics summary must not expose formations.",
);
assert.match(
  seasonSource,
  /saved\.standardTactic = typeof STANDARD_TACTICS[\s\S]*STANDARD_TACTICS\[saved\.standardTactic\][\s\S]*\? saved\.standardTactic/,
  "The selected PL tactic must survive refreshes.",
);
assert.match(html, /id="startPremierLeagueSeasonButton"[\s\S]*premier-league-launch-beta">BETA</,
  "The PL launch button must carry its beta label.");
assert.match(seasonSource, /premier-league-launch-beta">BETA</,
  "The beta label must survive Start/Resume button updates.");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(squadSource, context);
vm.runInContext(fc26Source, context);
vm.runInContext(dataSource, context);

assert.match(css, /\.pl-fixture-score small\s*\{[\s\S]*?font:\s*700 9px "Manrope", system-ui, sans-serif;/,
  "Premier League fixture status labels must use the normal UI font.");

const clubs = context.window.PREMIER_LEAGUE_2026_27_CLUBS;
const schedule = context.window.createPremierLeagueSchedule();
assert.equal(clubs.length, 20, "The season must contain 20 clubs");
assert.equal(new Set(clubs.map((club) => club.id)).size, 20, "Club ids must be unique");
assert.equal(clubs.reduce((total, club) => total + club.playerProfiles.length, 0), 564, "The simulator must include every player in the current official FPL feed");
assert.equal(new Set(clubs.flatMap((club) => club.playerProfiles.map((player) => player.fplId))).size, 564, "Official FPL player ids must be unique across all clubs");
assert.ok(clubs.every((club) => club.playerProfiles.length >= 20), "Every club needs its full current squad");
assert.ok(clubs.every((club) => club.playerProfiles.some((player) => player.position === "GK")), "Every club needs goalkeeper coverage");
assert.ok(clubs.every((club) => new Set(club.players).size === club.players.length), "Club squads must not repeat players");
assert.ok(clubs.every((club) => club.rating >= 60 && club.rating <= 95), "Club ratings must stay in range");
assert.equal(Object.keys(context.window.PREMIER_LEAGUE_FC26_RATINGS).length, 540,
  "The complete official FC 26 Premier League ratings import must be available.");
assert.ok(clubs.every((club) => club.playerProfiles.every((player) => player.overall >= 60 && player.overall <= 91)),
  "PL player ratings must stay on the official FC 26 scale.");
assert.ok(clubs.every((club) => club.preferredFormation), "Every club needs a real-world preferred formation");
assert.ok(clubs.every((club) => fs.existsSync(path.join(root, club.badge.replace("./", "")))), "Every club badge must exist");
const manCity = clubs.find((club) => club.id === "manchester-city");
const manUnited = clubs.find((club) => club.id === "manchester-united");
const leeds = clubs.find((club) => club.id === "leeds-united");
const newcastle = clubs.find((club) => club.id === "newcastle-united");
const forest = clubs.find((club) => club.id === "nottingham-forest");
const arsenal = clubs.find((club) => club.id === "arsenal");
assert.ok(arsenal.playerProfiles.some((player) => player.name === "Gabriel Magalhães"),
  "Arsenal's squad must use Gabriel Magalhães's familiar short name.");
assert.ok(!arsenal.playerProfiles.some((player) => player.name === "Gabriel dos Santos Magalhães"),
  "Gabriel Magalhães's full legal name must not be shown in the simulator.");
assert.equal(manCity.playerProfiles.find((player) => player.name === "Antoine Semenyo")?.position, "LW",
  "Semenyo must retain his real winger role instead of the broad FPL midfield category.");
assert.equal(manCity.playerProfiles.find((player) => player.name === "Erling Haaland")?.position, "ST",
  "Haaland must remain the centre-forward.");
assert.equal(manCity.playerProfiles.find((player) => player.name === "Erling Haaland")?.overall, 90,
  "Haaland must use his official FC 26 rating.");
assert.equal(manCity.playerProfiles.find((player) => player.name === "Antoine Semenyo")?.overall, 80,
  "Semenyo must use his official FC 26 rating.");
assert.equal(manCity.playerProfiles.find((player) => player.name === "Phil Foden")?.overall, 85,
  "Foden must use his requested 85 rating.");
assert.equal(manCity.playerProfiles.find((player) => player.name === "Elliot Anderson")?.overall, 85,
  "Elliot Anderson must use his requested 85 rating.");
assert.equal(manCity.playerProfiles.find((player) => player.name === "Nico O'Reilly")?.overall, 84,
  "Nico O'Reilly must use his requested 84 rating.");
assert.ok(manCity.playerProfiles.some((player) => player.name === "Rúben Dias"),
  "Manchester City's squad must use Rúben Dias's familiar short name.");
assert.ok(!manCity.playerProfiles.some((player) => player.name === "Rúben dos Santos Gato Alves Dias"),
  "Rúben Dias's full legal name must not be shown in the simulator.");
assert.ok(newcastle.playerProfiles.some((player) => player.name === "Bruno Guimarães"),
  "Newcastle's squad must use Bruno Guimarães's familiar short name.");
assert.ok(!newcastle.playerProfiles.some((player) => player.name === "Bruno Guimarães Rodriguez Moura"),
  "Bruno Guimarães's full legal name must not be shown in the simulator.");
assert.ok(manUnited.playerProfiles.some((player) => player.name === "Andrey Santos"),
  "Manchester United's squad must use Andrey Santos's familiar short name.");
assert.ok(!manUnited.playerProfiles.some((player) => player.name === "Andrey Nascimento dos Santos"),
  "Andrey Santos's full legal name must not be shown in the simulator.");
assert.ok(manUnited.playerProfiles.some((player) => player.name === "Bruno Fernandes"),
  "Manchester United's squad must use Bruno Fernandes's familiar short name.");
assert.ok(!manUnited.playerProfiles.some((player) => player.name === "Bruno Borges Fernandes"),
  "Bruno Fernandes's extended name must not be shown in the simulator.");
assert.ok(manCity.playerProfiles.some((player) => player.name === "Rodri"),
  "Manchester City's squad must use Rodri's familiar short name.");
assert.ok(!manCity.playerProfiles.some((player) => player.name === "Rodrigo 'Rodri' Hernandez Cascante"),
  "Rodri's extended name must not be shown in the simulator.");
assert.equal(manCity.playerProfiles.find((player) => player.name === "Gianluigi Donnarumma")?.overall, 89,
  "Donnarumma must use his official FC 26 elite goalkeeper rating.");
assert.equal(manCity.playerProfiles.some((player) => player.name === "James Trafford"), false,
  "Trafford must no longer appear in Manchester City's squad.");
assert.equal(leeds.playerProfiles.find((player) => player.name === "James Trafford")?.overall, 80,
  "Trafford must appear in Leeds United's squad with his intended rating.");
assert.equal(forest.rating, 79,
  "Nottingham Forest must receive the small league-strength reduction requested for balance.");
assert.equal(manCity.preferredFormation, "4-3-3", "Manchester City should default to their real-world 4-3-3.");
assert.equal(clubs.find((club) => club.id === "crystal-palace")?.preferredFormation, "3-4-2-1",
  "Crystal Palace should retain their real-world back-three shape.");

const lineupContext = vm.createContext({ console, Math, Object, Set, Map });
const lineupHelperStart = appSource.indexOf("const RETRO_MANAGER_SLOT_POSITIONS");
const lineupHelperEnd = appSource.indexOf("function retroSelectAvailableStarterNumbers");
assert.ok(lineupHelperStart >= 0 && lineupHelperEnd > lineupHelperStart);
vm.runInContext(`${appSource.slice(lineupHelperStart, lineupHelperEnd)}
globalThis.__plLineup = {
  slots: RETRO_MANAGER_SLOT_POSITIONS,
  select: retroSelectBestStarterNumbers,
  score: retroPlayerSlotAssignmentScore,
};`, lineupContext);
clubs.forEach((club) => {
  const players = club.playerProfiles.map((player, index) => ({
    ...player,
    number: index + 1,
    positions: [...new Set([player.position, ...(player.positions || [])])],
  }));
  const preferredNumbers = players
    .filter((player) => Number(player.startingXILikelihood) > 0)
    .map((player) => player.number);
  const selectedNumbers = lineupContext.__plLineup.select(
    players,
    preferredNumbers,
    club.preferredFormation,
  );
  const slots = lineupContext.__plLineup.slots[club.preferredFormation];
  assert.equal(selectedNumbers.length, 11, `${club.name} should generate a complete starting XI`);
  assert.equal(new Set(selectedNumbers).size, 11, `${club.name} should not repeat a starter`);
  selectedNumbers.forEach((number, slotIndex) => {
    const player = players.find((candidate) => candidate.number === number);
    assert.ok(
      lineupContext.__plLineup.score(player, slots[slotIndex]) >= 100,
      `${club.name}: ${player.name} must be credible at ${slots[slotIndex]}`,
    );
  });
  if (club.id === "manchester-city") {
    const playerAt = (slot) => players.find(
      (player) => player.number === selectedNumbers[slots.indexOf(slot)],
    );
    assert.equal(playerAt("LW")?.name, "Antoine Semenyo", "Semenyo should line up on City's left wing.");
    assert.equal(playerAt("ST")?.name, "Erling Haaland", "Haaland should line up as City's striker.");
  }
});
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

for (const [clubId, playerName] of [
  ["chelsea", "Morgan Rogers"],
  ["aston-villa", "Joao Gomes"],
  ["liverpool", "Victor Munoz"],
  ["manchester-city", "Elliot Anderson"],
  ["manchester-united", "Youri Tielemans"],
  ["tottenham-hotspur", "Sandro Tonali"],
]) {
  const club = clubs.find((candidate) => candidate.id === clubId);
  const normalizedPlayers = club?.players.map((name) => name.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase()) || [];
  assert.ok(normalizedPlayers.some((name) => name.includes(playerName.toLowerCase())), `${playerName} should be in ${clubId}'s current squad`);
}

assert.match(seasonSource, /simulateMatch\(match, roundIndex\)/, "PL mode must reuse the existing match engine");
assert.match(
  fs.readFileSync(path.join(root, "simulation-engine.js"), "utf8"),
  /home\?\.premierLeague && away\?\.premierLeague[\s\S]*?homeXG \*= 1\.38 \* 1\.1;[\s\S]*?awayXG \*= 1\.38 \* 0\.94;/,
  "Premier League matches must apply a restrained, PL-only home advantage.",
);
assert.match(seasonSource, /function createRatingModel\(seed\)/,
  "Every new season must create seeded current-ability and potential paths.");
assert.match(
  seasonSource,
  /function renderTable\(\)[\s\S]*tableMarkup\(\{ showHeader: false, ordinalPositions: true \}\)/,
  "The full table must begin immediately with ordinal position rows.",
);
assert.doesNotMatch(
  seasonSource,
  /AFTER \$\{completedMatchweeks\(\)\} MATCHWEEKS|Simulate full season|data-pl-action="simulate-season"/,
  "The full table must not show progress copy or a full-season shortcut above the standings.",
);
assert.match(
  seasonSource,
  /function orderedRoundFixtures\(round\)[\s\S]*?Number\(right\.managed\) - Number\(left\.managed\)/,
  "The managed fixture must always sort to the top of a matchweek.",
);
assert.doesNotMatch(seasonSource, /YOUR MATCH|pl-your-match-label/,
  "Managed fixtures must not show a separate YOUR MATCH label.");
assert.doesNotMatch(seasonSource, /function championMarkup|pl-season-champion/,
  "The old champion banner must be removed.");
assert.match(seasonSource, /function seasonFinaleMarkup\(\)[\s\S]*?GOLDEN BOOT[\s\S]*?GOLDEN GLOVE[\s\S]*?PLAYER OF THE SEASON[\s\S]*?YOUNG PLAYER OF THE SEASON/,
  "A completed PL season must render the full awards screen.");
assert.match(
  seasonSource,
  /function renderOverview\(\)[\s\S]*?completedMatchweeks\(\) === 38[\s\S]*?renderSeasonFinale\(\)/,
  "The completed-season presentation must render inside the Overview tab.",
);
assert.doesNotMatch(
  css,
  /\.pl-season-screen\.is-complete \.pl-season-tabs\s*\{\s*display:\s*none/,
  "Completing a season must not hide the Overview navigation and turn the finale into a separate screen.",
);
assert.match(seasonSource, /data-pl-finale-action="save"[\s\S]*?Save league/,
  "The completed-season presentation must offer a Save league action.");
assert.match(appSource, /function savePremierLeagueToHistory\([\s\S]*?mode:\s*"premier-league"[\s\S]*?roundNames:\s*rounds\.map/,
  "Completed Premier League seasons must be converted into saved tournament records.");
assert.match(appSource, /savePremierLeague:\s*savePremierLeagueToHistory/,
  "The tournament history API must expose Premier League saving.");
assert.match(
  seasonSource,
  /function finishManagedMatchweek\([\s\S]*?round\.forEach[\s\S]*?simulateMatch\(match, completedRoundIndex\)[\s\S]*?returnToSeason\(\{ view: "overview" \}\)/,
  "Finishing the managed fixture must complete the matchweek and return to the next gameweek's Overview.",
);
assert.match(
  seasonSource,
  /document\.addEventListener\("keydown"[\s\S]*?event\.key !== "Enter"[\s\S]*?!\["overview", "matches"\]\.includes\(activeView\)[\s\S]*?managedMatchIndex[\s\S]*?openMatch\(managedMatchIndex, \{ roundIndex: season\.viewRound \}\)/,
  "Pressing Enter on the current Overview or Matches screen must open the managed club's fixture.",
);
assert.match(
  seasonSource,
  /managedMatchIndex < 0[\s\S]*?event\.preventDefault\(\);[\s\S]*?event\.stopPropagation\(\);[\s\S]*?openMatch/,
  "The PL Enter shortcut must not bubble into the shared next-match shortcut.",
);
assert.match(
  seasonSource,
  /document\.activeElement[\s\S]*?!screen\.contains\(document\.activeElement\)[\s\S]*?blur\?\.\(\)/,
  "Returning from a match must clear focus left on the hidden match screen.",
);
assert.match(
  seasonSource,
  /screen\.contains\(event\.target\)[\s\S]*?event\.target\?\.closest/,
  "Only interactive controls inside the visible PL screen may suppress its Enter shortcut.",
);
assert.match(
  appSource,
  /function goToNextTie\(\)[\s\S]*?completedManagedMatch[\s\S]*?PremierLeagueSeason\?\.finishManagedMatchweek/,
  "Continuing from a completed managed PL match must return through the season Overview flow.",
);
const finishLivePlaybackSource = appSource.slice(
  appSource.indexOf("function finishLivePlayback()"),
  appSource.indexOf("function syncPossessionResultStats"),
);
assert.doesNotMatch(
  finishLivePlaybackSource,
  /finishManagedMatchweek/,
  "Reaching full time must leave the result visible until the user continues.",
);
assert.match(appSource, /function createPremierLeagueSeasonSnapshotCanvas\([\s\S]*?openPremierLeagueSeasonSnapshotModal/,
  "The PL winners screen must support a dedicated snapshot.");
assert.match(css, /\.pl-fixture-play\s*\{[\s\S]*?width:\s*96px/,
  "Play, watch, and view buttons must share one fixed alignment width.");
assert.match(css, /\.pl-matchweek-toolbar > \.pl-matchweek-nav\s*\{[\s\S]*?display:\s*flex/,
  "Matchweek arrow buttons must sit alongside each other.");
assert.match(seasonSource, /const locked = !played && season\.viewRound !== season\.activeRound/,
  "Unplayed fixtures outside the current matchweek must be locked.");
assert.match(seasonSource, /selectedRoundIndex !== season\.activeRound/,
  "The match opener must reject future matchweeks even when called directly.");
assert.match(seasonSource, /rounds\.length !== 38/, "PL season must validate 38 matchweeks");
assert.match(seasonSource, /round\.length === 10/, "Each matchweek must contain 10 matches");
assert.match(
  seasonSource,
  /saved\.managerLineups\?\.\[saved\.spectateTeamId\]\?\.formation[\s\S]*preferredFormation/,
  "Existing seasons without a custom formation must migrate to the club's real-world shape.",
);
assert.ok(schedule.flat().every((match) => match.allowDraw === true), "League matches must allow draws");
assert.match(html, /id="premierLeagueSeasonScreen"/, "PL screen is missing");
assert.match(html, /initialPath === "\/pl-simulator"[\s\S]*?route-pl-loading/,
  "Direct PL refreshes must suppress the home shell before first paint.");
assert.match(html, /class="pl-season-header-left"[\s\S]*?id="plRestartSeasonButton"[\s\S]*?id="plSeasonSettingsButton"/,
  "Restart and Settings must sit together on the left side of the PL header.");
assert.match(html, /id="plRestartModal"[\s\S]*?id="confirmPlRestartButton"/,
  "PL restart must use a functional confirmation dialog.");
assert.match(html, /id="startPremierLeagueSeasonButton"/, "PL start action is missing");
assert.match(html, /id="plSeasonDate"[\s\S]*?id="plSeasonMatchweek"/,
  "The current fixture date and matchweek must sit in the centre action bar.");
assert.match(html, /class="pl-season-header-left"[\s\S]*?id="plSeasonSettingsButton"[\s\S]*?class="pl-season-site-brand"[\s\S]*?id="plSeasonFeedbackButton"[\s\S]*?id="plSeasonAchievementsButton"[\s\S]*?id="plSeasonDonateButton"[\s\S]*?id="plSeasonAccountButton"/,
  "The PL season header must mirror the World Cup utility header.");
assert.match(html, /premier-league-squads\.generated\.js\?v=pl-live-squads-2[\s\S]*?premier-league-fc26-ratings\.js\?v=fc26-official-1[\s\S]*?premier-league-data\.js\?v=pl-mobile-club-names-1/,
  "Official FC 26 ratings must load between the current squads and PL data assembly.");
assert.doesNotMatch(html, /20 clubs &middot; 380 matches/, "The PL menu card should not repeat the season totals");
assert.doesNotMatch(html, />38 matchweeks</, "The PL menu start button should stay compact");
assert.match(
  html,
  /id="startPremierLeagueSeasonButton"[^>]*type="button"[^>]*>[\s\S]*?Start season[\s\S]*?&rarr;/,
  "The released PL menu must expose an enabled Start season action.",
);
assert.doesNotMatch(
  html,
  /id="startPremierLeagueSeasonButton"[^>]*(?:disabled|online-coming-soon)/,
  "The released PL start action must not retain its coming-soon state.",
);
assert.match(
  html,
  /class="landing-settings premier-league-settings"[^>]*>[\s\S]*data-settings-scope="premier-league"[\s\S]*id="premierLeagueTeamPickerButton"/,
  "The released PL menu must expose its options and club picker.",
);
assert.doesNotMatch(
  html,
  /class="landing-settings premier-league-settings"[^>]*hidden/,
  "The released PL settings must no longer be hidden.",
);
assert.match(html, /id="retroMatchLineupsPanel"/, "World Cup modes still need their shared matchday squad manager");
assert.doesNotMatch(html, /id="standardFormationSelect"/, "The old PL-only formation preview must be removed");
assert.match(css, /--pl-bg:\s*#1e0021/, "PL background colour is incorrect");
assert.match(css, /--pl-surface-light:\s*#381d53/, "PL lighter purple is incorrect");
assert.match(css, /body\.pl-match-mode-active \.brand-mark,[\s\S]*?background:\s*#75418f/, "The PL match header brand must use the purple palette");
assert.match(css, /\.pl-season-utility-actions \.header-donate-link\s*\{[\s\S]*?background:\s*#75418f/, "The PL season utility header must use the purple palette");
assert.match(css, /grid-template-areas:\s*"next stage table"\s*"board board boot"/, "The PL match screen must place the table above the Golden Boot panel");
assert.match(css, /\.pl-transfer-list\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2/, "The overview must include a restrained two-column latest-transfers feed");
assert.match(css, /\.pl-squad-grid\s*\{[\s\S]*?align-items:\s*start/,
  "Opening one squad must not stretch the neighbouring card.");
assert.match(css, /\.pl-season-open #appShell\s*\{[\s\S]*?display:\s*none !important/, "Opening PL mode must hide the main app shell");
assert.match(css, /body\.pl-match-mode-active #roundBoard #simulateRoundButton/, "PL fixture controls must use the purple theme");
assert.match(css, /#teamFilterControl \.search-result-popover[\s\S]*?background:\s*#28002d/, "The PL club filter must use the purple theme");
assert.match(appSource, /function searchableTeamsForCurrentMode\(\)[\s\S]*?state\?\.premierLeagueSeason[\s\S]*?activeTournamentTeamIds/, "The PL filter must use active league clubs");
assert.match(appSource, /state\?\.premierLeagueSeason\s*\?\s*"Filter by club"/, "The PL filter must be labelled for clubs");
assert.match(
  appSource,
  /function premierLeagueAppearanceRoster\([\s\S]*?startingXI[\s\S]*?restChance[\s\S]*?targetCount/,
  "PL match results must generate rotated player appearance rosters.",
);
assert.match(
  appSource,
  /function calculateGoalscorerTable\([\s\S]*?playerAppearances[\s\S]*?ensurePremierLeaguePlayerAppearances[\s\S]*?playerAppearances\.get/,
  "The Golden Boot table must count player appearances rather than club matches.",
);
assert.match(
  appSource,
  /function compactTournamentHistoryResult\([\s\S]*?playerAppearances/,
  "Saved Premier League seasons must preserve player appearance records.",
);
assert.match(css, /body\.pl-match-mode-active \.score-live-controls\s*\{[\s\S]*?transform:\s*translateY\(-4px\)/, "PL live controls need score clearance");
assert.match(css, /\.match-stage\.pl-full-time \.event-live-clock\[hidden\][\s\S]*?display:\s*none !important/, "PL full-time layout must remove invisible live rows");
assert.match(css, /body\.pl-match-mode-active #snapshotButton\s*\{[\s\S]*?background:\s*#381d53/, "PL snapshot control must use the purple theme");
assert.match(css, /body\.pl-match-mode-active \.team-match-events\s*\{[\s\S]*?display:\s*grid !important/, "PL scorer lines must be visible below each club");
assert.match(css, /body\.pl-match-mode-active \.team-match-events \.timeline-event\s*\{[\s\S]*?font-family:\s*"Manrope", system-ui, sans-serif[\s\S]*?font-weight:\s*800/, "PL scorer lines must use the standard match font");
assert.match(css, /body\.pl-match-mode-active \.team-away \.team-match-events \.timeline-event\s*\{[\s\S]*?justify-self:\s*start/, "The away scorer line must stay aligned toward the score like the home scorer line");
assert.match(css, /body\.pl-match-mode-active \.match-score\s*\{[\s\S]*?font-family:\s*"DM Mono", monospace[\s\S]*?font-weight:\s*500/, "PL score numerals must use the standard match font");
assert.match(css, /\.insight-right,[\s\S]*?\.insight-left\s*\{[\s\S]*?margin-top:\s*70px/, "PL side panels must clear the back-button row");
assert.match(css, /\.pl-match-detail-active \.insight-right\s*\{[\s\S]*?margin-top:\s*86px/, "Starting a PL match must not pull Stats and Tactics upward");
assert.match(css, /\.pl-live-back-button\s*\{[\s\S]*?margin-left:\s*-262px/, "The PL back button must use the freed left-side space");
assert.match(
  css,
  /Preserve the desktop-style row on mobile[\s\S]*@media \(max-width: 850px\)[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+80px\s+minmax\(0,\s*1fr\)[\s\S]*max-width:\s*calc\(100%\s*-\s*48px\)/,
  "The mobile PL match row must keep both teams inside symmetrical columns.",
);
assert.match(
  css,
  /team-home \.flag-orb[\s\S]*translateX\(8px\)[\s\S]*team-away \.flag-orb[\s\S]*translateX\(-8px\)/,
  "Both mobile PL club badges must move symmetrically toward the scoreline.",
);
assert.match(
  appSource,
  /assetsWereInstalled !== premierLeagueAssetsInstalled[\s\S]*pl-match-mode-active[\s\S]*requestAnimationFrame[\s\S]*render\(\)/,
  "A restored PL match must rerender when the signed-in asset pack finishes loading.",
);
assert.match(
  dataSource,
  /"manchester-city":\s*"Man City"[\s\S]*"manchester-united":\s*"Man Utd"[\s\S]*"nottingham-forest":\s*"Nott\. Forest"[\s\S]*"tottenham-hotspur":\s*"Spurs"/,
  "The four long Premier League club names must have mobile aliases.",
);
assert.match(
  seasonSource,
  /function clubDisplayName\(club\)[\s\S]*matchMedia\?\.\("\(max-width: 850px\)"\)[\s\S]*club\.mobileName \|\| club\.name/,
  "Premier League season screens must use mobile club aliases only at mobile width.",
);
assert.match(
  appSource,
  /function premierLeagueResponsiveTeamName\(team\)[\s\S]*state\?\.premierLeagueSeason[\s\S]*matchMedia\?\.\("\(max-width: 850px\)"\)[\s\S]*team\.mobileName \|\| team\.name/,
  "The shared PL match screen must use the same mobile club aliases.",
);
assert.match(
  dataSource,
  /"estevao almeida de oliveira goncalves":\s*"Estêvão"/,
  "Estêvão must use his short display name.",
);
assert.match(appSource, /premierLeague:\s*"\/pl-simulator"/, "The app router must expose /pl-simulator");
assert.match(appSource, /premierLeagueFormationTacticalImpact/, "PL formations must affect the match engine");
assert.match(appSource, /sharedLineupManagerSupported/, "PL mode must use the shared WC lineup manager");
assert.match(appSource, /function sharedLineupDefaultForTeam[\s\S]*retroSelectBestStarterNumbers\([\s\S]*availablePlayers/,
  "PL default elevens must use the World Cup position-aware assignment algorithm.");
assert.match(appSource, /state\?\.premierLeagueSeason[\s\S]*state\.managerLineups/, "PL lineups must persist with the season");
assert.match(appSource, /premierLeagueMatchActive[\s\S]*classList\.add\("pl-match-mode-active"\)/, "Every PL engine render must restore the purple match shell");
assert.match(
  appSource,
  /const showSharedLineupPanel = Boolean\([\s\S]*&& isRetroSimulatorState\(\)/,
  "PL Starting XIs must remain hidden without affecting World Cup lineups.",
);
assert.match(menuCss, /\.mode-card-premier-league \.premier-league-team-picker\.has-team[\s\S]*?background:\s*rgba\(62, 25, 82, 0\.82\)/, "The PL menu picker should stay purple when a club is selected");
assert.match(menuCss, /\.mode-card-premier-league \.premier-league-team-mark[\s\S]*?border:\s*0[\s\S]*?background:\s*transparent/, "Installed club badges should not sit inside a box");
assert.match(appSource, /premierLeagueAssetsInstalled[\s\S]*?team\?\.badge/, "PL snapshots must load installed club badges");
assert.match(appSource, /PL 26\/27 SIMULATION/, "PL snapshots must carry the season footer");
assert.match(seasonSource, /settings:\s*\{[\s\S]*?upset:\s*season\.settings\?\.upset[\s\S]*?goals:\s*season\.settings\?\.goals/,
  "PL snapshot summaries must carry the season's selected simulation settings");
assert.match(appSource, /realistic:\s*"REALISTIC"[\s\S]*?balanced:\s*"STANDARD"[\s\S]*?chaos:\s*"PURE CHAOS"/,
  "PL snapshots must label every simulation style");
assert.match(appSource, /tight:\s*"TIGHT"[\s\S]*?normal:\s*"NORMAL"[\s\S]*?wild:\s*"GOAL FEST"/,
  "PL snapshots must label every goal level");
assert.match(seasonSource, /GOLDEN GLOVE[\s\S]*?🧤[\s\S]*?PLAYER OF THE SEASON[\s\S]*?🏆[\s\S]*?YOUNG PLAYER OF THE SEASON[\s\S]*?🌟/,
  "The winners screen must use distinct award emojis");
assert.match(appSource, /GOLDEN GLOVE[\s\S]*?🧤[\s\S]*?PLAYER OF THE SEASON[\s\S]*?🏆[\s\S]*?YOUNG PLAYER OF THE SEASON[\s\S]*?🌟/,
  "The winners snapshot must use the same distinct award emojis");
assert.doesNotMatch(appSource, /context\.arc\(600,\s*40,\s*430/, "PL winners snapshots must not use the oversized background circle");
assert.match(appSource, /podium\.map\(\(row\)\s*=>\s*loadSnapshotFlag\(row\.club,[\s\S]*?podiumBadges\[index\]/,
  "PL winners snapshots must load and draw badges for every podium club");
assert.match(appSource, /home\.name === "Manchester United"[\s\S]*?\? "Man United"/, "PL snapshots must shorten Manchester United");
assert.match(appSource, /homeSnapshotName,\s*325,\s*250[\s\S]*?align:\s*"right"/, "PL snapshot home names must sit beside their badge");
assert.match(appSource, /awaySnapshotName,\s*875,\s*250[\s\S]*?align:\s*"left"/, "PL snapshot away names must sit beside their badge");
assert.match(workerSource, /"\/pl-simulator"/, "The Worker must serve the PL clean URL");
assert.match(wranglerSource, /"\/pl-simulator"/, "Cloudflare must route /pl-simulator through the Worker");
assert.match(seasonSource, /currentAppMode\(\)\s*===\s*"premierLeague"/, "Direct PL links must open the season screen");
assert.match(seasonSource, /seasonSettingsButton\?\.addEventListener[\s\S]*?#settingsButton[\s\S]*?seasonAccountButton\?\.addEventListener[\s\S]*?#mainAccountButton/, "The PL season utility controls must reuse the main app actions");
assert.match(seasonSource, /function latestTransfersMarkup\(\)[\s\S]*?Latest transfers[\s\S]*?All transfers/, "The Overview must render the latest confirmed transfers");
assert.match(seasonSource, /event\.assist\s*\|\|\s*event\.metadata\?\.assist/,
  "Season awards must aggregate assists from simulated and watched match events");
assert.doesNotMatch(seasonSource, /OFFICIAL FPL DATA|Squads and ratings/, "The squad view must start directly with the squad cards");
assert.doesNotMatch(seasonSource, />PA \$\{player\.potential\}</, "Squad rows must not expose PA labels");
assert.match(seasonSource, /matchViewActive:\s*false/, "New PL seasons must start on the season screen");
assert.match(seasonSource, /restoreMatch[\s\S]*season\.matchViewActive[\s\S]*openMatch\(season\.selectedMatch/, "Refreshing a PL match must restore its match screen");
assert.match(seasonSource, /MATCH_VIEW_STORAGE_KEY[\s\S]*saveActiveMatchView\(selectedRoundIndex, selectedMatchIndex\)/, "Opening a PL match must save a dedicated refresh marker");
assert.match(seasonSource, /readActiveMatchView\(\)[\s\S]*saved\.matchViewActive = true/, "Loading a PL season must restore the marked match");
assert.match(seasonSource, /season\.matchViewActive = false;[\s\S]*clearActiveMatchView\(\)/, "Returning to the PL season must clear the refresh marker");
assert.match(seasonSource, /season\.matchViewActive = true;[\s\S]*saveSeason\(\);[\s\S]*state = season/, "Opening a PL match must persist the active match view");
assert.match(seasonSource, /season\.matchViewActive = false;[\s\S]*syncEngineProgress/, "Returning to the season must clear the active match view");
const closeSeasonSource = seasonSource.slice(
  seasonSource.indexOf("function closeSeason"),
  seasonSource.indexOf("function syncEngineProgress"),
);
assert.doesNotMatch(closeSeasonSource, /returnToSeason\(/,
  "Back to modes must not bounce through the PL match dashboard");
assert.match(closeSeasonSource, /setAppModeUrl\("home"\)[\s\S]*?render\(\)/,
  "Back to modes must rerender the real mode menu instead of revealing stale match markup");
assert.match(appSource, /legacyDraftBackButton\.addEventListener[\s\S]*?state\?\.premierLeagueSeason[\s\S]*?PremierLeagueSeason\?\.returnToSeason/,
  "The shared match-dashboard back button must return PL matches to the PL season");

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
  contains(target) { return target === this; },
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
  date: fakeElement("date"),
  matchweek: fakeElement("matchweek"),
  liveBack: fakeElement("liveBack"),
  engineTablePanel: fakeElement("engineTablePanel"),
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
  ["#plSeasonDate", elements.date],
  ["#plSeasonMatchweek", elements.matchweek],
  ["#plLiveBackButton", elements.liveBack],
  ["#plEngineTablePanel", elements.engineTablePanel],
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
    documentElement: { classList: classList() },
    addEventListener(type, listener) {
      listeners.set(`document:${type}`, listener);
    },
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
  render() {},
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
assert.equal(Object.keys(storedSeason.ratingModel.players).length, 20, "Dynamic ratings must cover all clubs.");
assert.equal(storedSeason.ratingModel.version, 2, "New seasons must use the normalized rating model.");
assert.equal(storedSeason.standardTactic, "balanced", "PL seasons must remain on balanced tactics while controls are hidden.");
assert.equal(
  Object.values(storedSeason.ratingModel.players).reduce((total, players) => total + Object.keys(players).length, 0),
  564,
  "Dynamic ratings must cover every current squad player.",
);
assert.match(elements.date.textContent, /^[A-Z]{3} \d{1,2} [A-Z]{3}$/, "The centre action bar must show the fixture date.");
assert.match(elements.matchweek.textContent, /^Matchweek \d+$/, "The centre action bar must show the viewed matchweek.");
assert.ok(storedSeason.rounds[0].every((match) => match.result?.revealed), "Simulating should complete all ten fixtures");
assert.equal(storedSeason.activeRound, 1, "The season should advance to matchweek two");
listeners.get("simulate:click")();

const pressEnter = () => {
  let prevented = false;
  let stopped = false;
  listeners.get("document:keydown")({
    key: "Enter",
    repeat: false,
    isComposing: false,
    target: { closest: () => null },
    preventDefault() { prevented = true; },
    stopPropagation() { stopped = true; },
  });
  assert.equal(prevented, true, "The PL Enter shortcut must consume the key press.");
  assert.equal(stopped, true, "The PL Enter shortcut must not reach the shared keybind handler.");
  assert.equal(elements.screen.hidden, true, "Enter must open the managed match screen.");
  assert.equal(elements.appShell.hidden, false, "Enter must reveal the shared match engine.");
};
pressEnter();
uiWindow.PremierLeagueSeason.returnToSeason({ view: "overview" });
assert.equal(elements.screen.hidden, false, "Returning from the match must reveal the season Overview.");
pressEnter();
uiWindow.PremierLeagueSeason.returnToSeason({ view: "overview" });

storedSeason.matchViewActive = true;
storedSeason.activeRound = 1;
storedSeason.viewRound = 1;
storedSeason.selectedMatch = 1;
uiWindow.PremierLeagueSeason.saveEngineState(storedSeason);
assert.deepEqual(
  JSON.parse(savedValues.get("world-256-pl-26-27-active-match-v1")),
  { roundIndex: 1, matchIndex: 1 },
  "Changing matches in the engine must update the PL refresh marker instead of restoring the previous match",
);

console.log("PL 26/27 season tests passed.");
