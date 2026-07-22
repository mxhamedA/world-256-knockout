const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const playerPoolSource = fs.readFileSync(path.join(root, "player-pools.generated.js"), "utf8");
const dataSource = fs.readFileSync(path.join(root, "data.js"), "utf8");
const presentationEngineSource = fs.readFileSync(path.join(root, "presentation-engine.js"), "utf8");
const simulationEngineSource = fs.readFileSync(path.join(root, "simulation-engine.js"), "utf8");
const legacyEnglandSource = fs.readFileSync(path.join(root, "legacy-data", "catalog.generated.js"), "utf8");
const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
const cleanCssSource = fs.readFileSync(path.join(root, "clean.css"), "utf8");
const htmlSource = fs.readFileSync(path.join(root, "index.html"), "utf8");
const draftCatalogSource = fs.readFileSync(path.join(root, "draft-team-catalog.generated.mjs"), "utf8");
const workerSource = fs.readFileSync(path.join(root, "worker.mjs"), "utf8");
const headersSource = fs.readFileSync(path.join(root, "_headers"), "utf8");
const wranglerSource = fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
const publicHtmlSources = ["index.html", "privacy.html", "terms.html", "disclaimer.html"]
  .map((file) => fs.readFileSync(path.join(root, file), "utf8"));

const context = { console };
vm.createContext(context);
vm.runInContext(
  `${playerPoolSource}\n${dataSource}\n;globalThis.__teams = TEAMS; globalThis.__rounds = ROUND_NAMES;`,
  context,
);

const teams = context.__teams;
assert.equal(teams.length, 256, "The tournament must contain exactly 256 teams.");
assert.doesNotMatch(appSource, /â€“|Ã—/, "Visible score and speed labels must not contain mojibake.");
assert.doesNotMatch(draftCatalogSource, /CÃ©dric|NathanaÃ«l/, "Generated player names must preserve Unicode.");
const drCongo = teams.find((team) => team.name === "DR Congo");
assert.equal(drCongo.playerProfiles.length, 26, "Recognised teams should expose a complete 26-player squad.");
assert.deepEqual(
  [...drCongo.playerProfiles.slice(0, 11).map((player) => player.position)],
  ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CAM", "LW", "ST", "RW"],
  "Structured XIs must cover a balanced 4-3-3 without role placeholders.",
);
assert.ok(drCongo.players.includes("Cédric Bakambu"), "Player names should be repaired before match events are generated.");
assert.match(draftCatalogSource, /export const DRAFT_TEAMS/);
assert.match(htmlSource, /id="startOnlineDraftButton"/);
assert.match(fs.readFileSync(path.join(root, "clean.css"), "utf8"), /\.online-lobby-controls button\[hidden\]/);
assert.match(
  fs.readFileSync(path.join(root, "clean.css"), "utf8"),
  /\.match-penalty-scene\[data-state="flight"\]\[data-target="top-left"\][\s\S]*translate\(-76px, -137px\)/,
  "Normal-time manual penalties must use the exact five-target ball paths.",
);
assert.match(htmlSource, /id="createOnlineDisplayName"/);
assert.match(htmlSource, /id="joinOnlineDisplayName"/);
assert.match(htmlSource, /id="onlineLobbyDisplayName"/);
assert.doesNotMatch(htmlSource, /id="onlineLobbyNextCopy"/);
assert.doesNotMatch(htmlSource, /id="onlinePlayerLimit"/);
assert.doesNotMatch(htmlSource, /id="onlineCountriesEach"/);
assert.match(htmlSource, />Start draft</);
assert.match(htmlSource, /id="onlineRouletteFlag"/);
assert.match(htmlSource, /id="onlineDraftRosters"/);
assert.match(htmlSource, /id="onlineMatches"/);
assert.match(htmlSource, /data-penalty-target="top-left"/);
assert.match(htmlSource, /data-standard-penalty-target="top-left"/);
assert.match(htmlSource, /data-match-penalty-target="top-left"/);
assert.match(htmlSource, /id="match2dViewer"/);
assert.match(htmlSource, /data-standard-tactic="tiki-taka"/);
assert.match(appSource, /const STANDARD_TACTICS = Object\.freeze/);
assert.match(appSource, /const STANDARD_TACTIC_MATCHUPS = Object\.freeze/);
assert.match(appSource, /function applyControlledTacticalMatchup[\s\S]*underdogAttackBoost[\s\S]*underdogDefenceBoost[\s\S]*comebackFloor/,
  "A correct tactical matchup must give underdogs a meaningful route into the tie.");
assert.match(appSource, /Opponent: \$\{opponentTacticName\}/,
  "Players must be able to scout the opponent's expected approach.");
assert.match(appSource, /preferredMatchSpeed = \[1, 1\.5, 2, 3, 5\]/,
  "The 2D viewer must support the full range of playback speeds.");
assert.match(htmlSource, /data-highlight-mode="key"/);
assert.match(htmlSource, /data-highlight-mode="extended"/);
assert.match(htmlSource, /id="matchStatsGrid"/);
assert.match(appSource, /function stepMatch2dViewer/);
assert.doesNotMatch(appSource, /function stepMatch2dGoalBuildUp/,
  "The 2D viewer must use coherent highlight sequences instead of a forced goal animation.");
assert.match(simulationEngineSource, /function createPossessionMatchEngine/);
assert.match(simulationEngineSource, /function advancePossessionMatchEngine/);
assert.match(simulationEngineSource, /function possessionShotQuality/);
assert.match(simulationEngineSource, /function createMatchHighlightPresentation/);
assert.match(simulationEngineSource, /function createAuthoritativeMatchStats/);
assert.match(simulationEngineSource, /MATCH_HIGHLIGHT_TYPES/);
assert.match(appSource, /function createLiveMatchResult[\s\S]*\.\.\.simulateMatch\(match, roundIndex\)[\s\S]*engineVersion:\s*2/,
  "A watched match must use the deterministic statistical result as its authority.");
assert.match(appSource, /createMatchHighlightPresentation\([\s\S]*result:\s*match\.result/,
  "The viewer must explain the authoritative result through deterministic highlights.");
assert.doesNotMatch(appSource, /advancePossessionMatchEngine\(match2dState\.engine, livePlayback\.minute\)/,
  "Watched matches must not run the continuous random action engine.");
assert.match(appSource, /highlight\.timelineIndex > match2dState\.cursor[\s\S]*highlightMatchesMode/,
  "Key and extended modes must filter one authoritative highlight timeline.");
assert.match(appSource, /receivePresentationEvent\(penaltyEvent[\s\S]*startMatchPenaltyAnimation\(action\.event, action\)/,
  "Normal-time penalties must enter the presentation pipeline before the kick animation starts.");
assert.doesNotMatch(appSource, /cancelAnimationFrame\(playback\.frame\)/,
  "Penalty suspense must not cancel the main animation loop.");
assert.match(cleanCssSource, /\.match-2d-pitch[\s\S]*aspect-ratio:\s*16\s*\/\s*8\.2/,
  "The 2D match viewer must keep a stable horizontal pitch shape.");
assert.match(htmlSource, /id="onlineTacticSlider"/);
assert.match(htmlSource, /id="onlineMatchMinute"/);
assert.match(htmlSource, /id="onlineMatchClock"/);
assert.match(htmlSource, /id="onlinePauseMatchButton"/);
assert.match(htmlSource, /id="onlineMatchSpeedButton"/);
assert.match(htmlSource, /id="onlineHomeScorers"/);
assert.match(htmlSource, /id="onlineMyMatches"/);
assert.match(htmlSource, /id="onlineTacticButtons"/);
assert.match(htmlSource, /data-online-match-filter="friends"/);
assert.doesNotMatch(htmlSource, /Every surviving country is yours to play/);
assert.match(htmlSource, /id="onlineMatchEvents"/);
assert.doesNotMatch(htmlSource, /id="onlineReplayMatchButton"/);
assert.match(htmlSource, /id="onlineReadyButtonLabel"/);
assert.match(htmlSource, /id="onlineTeamSelectDialog"/);
assert.doesNotMatch(htmlSource, /id="onlineDraftOrder"/);
assert.doesNotMatch(htmlSource, /id="onlineModeFeatures"/);
assert.match(htmlSource, /Private rooms are being tuned before they come back\./);
assert.match(htmlSource, /id="onlineModeComingSoon"[^>]*>Coming soon<\/button>/);
assert.match(htmlSource, /https:\/\/ko-fi\.com\/256teams/);
assert.ok(
  publicHtmlSources.every((source) => source.includes("ca-pub-6724809725459853")),
  "Every public HTML page must include the configured AdSense loader.",
);
assert.match(workerSource, /function serveHtmlAsset/);
assert.match(workerSource, /strict-dynamic/);
assert.match(workerSource, /element\.setAttribute\("nonce", nonce\)/);
assert.match(wranglerSource, /"run_worker_first": \["\/api\/\*", "\/", "\/\*\.html"\]/);
assert.match(htmlSource, /class="mode-card mode-card-legacy"/);
assert.match(htmlSource, /id="startLegacyDraftButton"/);
assert.match(htmlSource, /id="legacyDraftScreen"/);
assert.match(appSource, /data-legacy-action="snapshot"[^>]*>Snapshot<\/button>/);
assert.match(appSource, /function createLegacyDraftSnapshotCanvas/);
assert.match(appSource, /legacy-pitch-nation-flag/,
  "The Legacy pitch must show the selected nation's flag.");
assert.match(appSource, /drawLegacySnapshotNationFlag\(context, nationFlagImage, nationTeam/,
  "Legacy snapshots must include the selected nation's flag.");
assert.match(htmlSource, /id="continueNeutralButton"[^>]*>Continue neutrally<\/button>/);
assert.doesNotMatch(htmlSource, /id="chooseAnotherTeamButton"/);
assert.match(appSource, /World Cup Legacy Draft/);
assert.match(appSource, /LEGACY_NATIONS/);
assert.match(
  appSource,
  /match\?\.result && !match\.result\.revealed[\s\S]*startLivePlayback\(match\)/,
  "Interrupted offline matches must resume playback instead of revealing full time.",
);
assert.match(
  cleanCssSource,
  /standard-penalty-scene\[data-state="flight"\]\[data-target="top-left"\][\s\S]*?translate\(-76px, -115px\)/,
  "Standard and Legacy shootout goals must land inside the compact net.",
);
assert.match(
  cleanCssSource,
  /@media \(max-width: 640px\)[\s\S]*?standard-penalty-scene\[data-state="flight"\]\[data-target="top-left"\][\s\S]*?translate\(-65px, -90px\)/,
  "Mobile shootout goals must use mobile net coordinates.",
);
assert.match(
  appSource,
  /const draftedPosition = team\.positionSuitability\?\.find[\s\S]*position === "GK" \? 5/,
  "Legacy simulation profiles must use drafted positions instead of player-list order.",
);
assert.match(
  appSource,
  /profile\.position !== "GK"/,
  "Goalkeepers must be excluded from normal goalscorer selection.",
);
assert.match(
  appSource,
  /function chooseMatchPenaltyTarget[\s\S]*resolveManualPenaltyAttempt\(attempt, target\)[\s\S]*removeSavedPenaltyGoal\(event\)/,
  "Normal-match penalty choices must resolve a real outcome and remove saved goals when stopped.",
);
assert.match(
  appSource,
  /function finishMatchPenaltyAnimation\([^)]*onDismiss[\s\S]*matchPenaltyOverlay\.hidden = true[\s\S]*onDismiss\(\)/,
  "Controlled penalty commentary must be published only after the penalty overlay is dismissed.",
);
assert.doesNotMatch(
  appSource,
  /matchPenaltyPlayer\.textContent = attempt\.scored/,
  "The penalty overlay must not reveal the outcome in text before the animation finishes.",
);
assert.match(
  cleanCssSource,
  /\.match-stage\.has-match-penalty \.match-commentary-view\s*{[^}]*visibility:\s*hidden/,
  "The commentary bar must remain hidden while the normal-match penalty overlay is active.",
);
assert.match(
  appSource,
  /function resolveInteractiveRegulation[\s\S]*result\.regulationHome[\s\S]*playback\.maxMinute = result\.extraTime \? 120 : 90/,
  "A watched match must preserve the authoritative regulation and extra-time boundary.",
);
assert.doesNotMatch(appSource, /function appendInteractiveExtraTime/,
  "Extra-time goals must remain part of the deterministic match timeline.");
assert.match(
  appSource,
  /function resolveInteractiveExtraTime[\s\S]*simulatePenaltyShootout/,
  "Interactive matches still level after extra time must create a valid shootout.",
);
assert.match(
  appSource,
  /team\.id\.startsWith\("legacy-"\)[\s\S]*state = createLegacyTournamentState\(\)/,
  "Replaying a Legacy XI must rebuild the Legacy bracket from the saved draft.",
);
assert.match(
  appSource,
  /startTournamentButton\.addEventListener\("click"[\s\S]*if \(state\.legacyTournament\)[\s\S]*state = createInitialState\(\)/,
  "Default mode must never resume a Legacy Draft bracket.",
);
assert.match(
  appSource,
  /startLegacyDraftButton[\s\S]*LEGACY_TOURNAMENT_SESSION_KEY[\s\S]*Legacy tournament resumed/,
  "The Legacy card must restore its own saved tournament after Default mode starts.",
);
assert.match(
  appSource,
  /legacyDraft\.tournamentSeed = nextLegacyTournamentSeed\(state\.drawSeed\);[\s\S]*state = createLegacyTournamentState\(\)/,
  "A Legacy replay must rotate the tournament seed before rebuilding the bracket.",
);
assert.match(appSource, /state\.spectateTeamId && !state\.neutralView && advanceSpectatedRun\(\)/);
assert.match(appSource, /state\.neutralView = true;[\s\S]*Neutral view restored/);
assert.match(appSource, /state\.activeRound === 7 \? "Crown champion" : "Next game"/);
assert.match(htmlSource, /id="onlineRoomScreen"/);
assert.match(htmlSource, /id="settingsButton"/);
assert.match(htmlSource, /id="settingsModal"/);
assert.match(htmlSource, /id="realPlayersOnlySetting"/);
assert.doesNotMatch(htmlSource, /Removes The Conspiracy/);
assert.match(htmlSource, /id="pageHeading"/);
assert.match(
  cleanCssSource,
  /\.legacy-topbar-back\[hidden\]\s*\{\s*display:\s*none;/,
  "The mode chooser must not show its own Back to modes button.",
);
assert.match(
  cleanCssSource,
  /\.before-start:not\(\.legacy-mode-active\) \.topbar\s*\{\s*justify-content:\s*flex-start;/,
  "The mode chooser heading must align with the left edge of its content.",
);
assert.match(htmlSource, /<body class="before-start">/, "The initial document must render in landing-page mode before JavaScript runs.");
assert.match(htmlSource, /id="fieldOverview">/, "The mode chooser must be visible in the initial document.");
assert.match(htmlSource, /id="mainContent" hidden>/, "Tournament content must stay hidden until JavaScript starts a tournament.");
assert.doesNotMatch(htmlSource, /id="predictionPickerButton"/);
assert.match(htmlSource, /<aside class="sidebar"[\s\S]*id="newTournamentButton"[\s\S]*class="top-actions header-actions"[\s\S]*id="settingsButton"[\s\S]*id="bugReportButton"[\s\S]*header-donate-link[\s\S]*<\/aside>/);
assert.match(htmlSource, /id="settingsModal"[\s\S]*id="soundToggleButton"/);
assert.match(htmlSource, /id="menuBackdrop"/);
assert.match(htmlSource, /id="goToTopButton"[^>]*>[\s\S]*Go to top/);
assert.match(htmlSource, /id="fixtureGrid"[\s\S]*id="loadMoreButton"[\s\S]*id="goToTopButton"[\s\S]*<\/section>/);
assert.doesNotMatch(htmlSource, /<footer class="site-footer">[\s\S]*id="goToTopButton"/);
assert.match(appSource, /#goToTopButton[\s\S]*window\.scrollTo\(\{ top: 0/);
assert.match(appSource, /function setMobileMenu/);
assert.match(appSource, /menuBackdrop\.addEventListener\("click"/);
assert.match(
  fs.readFileSync(path.join(root, "clean.css"), "utf8"),
  /body\.before-start #menuButton\s*\{\s*display:\s*none/,
  "The inactive rounds menu must be hidden on the mobile home screen.",
);
assert.match(
  fs.readFileSync(path.join(root, "clean.css"), "utf8"),
  /\.legacy-left-panel\s*\{[\s\S]*?height:\s*720px;[\s\S]*?max-height:\s*720px;/,
  "The desktop Legacy player panel must stay level with the pitch instead of stretching the pitch to the full player list.",
);
assert.match(
  fs.readFileSync(path.join(root, "clean.css"), "utf8"),
  /@media \(max-width: 900px\)[\s\S]*?\.legacy-left-panel\s*\{[\s\S]*?height:\s*auto;[\s\S]*?max-height:\s*none;/,
  "Stacked Legacy layouts must return to natural panel heights.",
);
assert.match(
  fs.readFileSync(path.join(root, "clean.css"), "utf8"),
  /@media \(max-width: 640px\)[\s\S]*?\.legacy-pitch\s*\{[\s\S]*?height:\s*auto;[\s\S]*?min-height:\s*430px;/,
  "The mobile pitch must not inherit the fixed desktop height.",
);
assert.match(
  fs.readFileSync(path.join(root, "clean.css"), "utf8"),
  /body:not\(\.before-start\) \.topbar\s*\{\s*display:\s*none/,
  "The empty mobile tournament topbar must not leave a gap above the match card.",
);
assert.match(
  cleanCssSource,
  /body:not\(\.before-start\) \.insight-right\s*\{\s*display:\s*grid/,
  "Stats and Tactics must render side by side on mobile.",
);
assert.match(
  cleanCssSource,
  /@media \(max-width: 850px\)[\s\S]*grid-template-areas:\s*"stage"\s*"next"\s*"boot"\s*"board"/,
  "Stacked tournament layouts must keep Stats and Tactics visible on mobile.",
);
assert.match(
  appSource,
  /function syncSoundToggle[\s\S]*soundToggleButton\.setAttribute\("aria-pressed"/,
  "The sound setting must expose its current state accessibly.",
);
assert.match(headersSource, /img-src[^\n]*blob:/, "Snapshot blob previews must be allowed by the image CSP.");
assert.match(htmlSource, /<footer class="site-footer"[\s\S]*class="footer-last-updated"[\s\S]*<\/footer>/);
assert.doesNotMatch(htmlSource, /<aside class="sidebar"[\s\S]*class="last-updated"[\s\S]*<\/aside>/);
assert.doesNotMatch(htmlSource, /id="fieldButton"/);
assert.match(htmlSource, /id="closeOnlineScreenButton"/);
assert.doesNotMatch(htmlSource, /id="onlineRoomModal"/);
assert.match(appSource, /function renderOnlineDraft/);
assert.match(appSource, /function runOnlineSnakeDraft/);
assert.match(appSource, /function renderOnlineMatches/);
assert.match(appSource, /function startOnlineMatchPlayback/);
assert.match(appSource, /function stepOnlineMatchPlayback/);
assert.match(appSource, /function renderOnlineScorerTimelines/);
assert.match(appSource, /online-centre-match/);
assert.match(appSource, /world-256-legacy-tournament-v1/, "Legacy tournaments must use a dedicated persisted session.");
assert.match(appSource, /function isValidLegacyTournamentState/, "Legacy tournament saves must be structurally validated.");
assert.match(appSource, /if \(!isValidLegacyTournamentState\(state\) && legacyDraft\?\.complete\)/, "A marked Legacy URL must recover its tournament from the completed draft.");
assert.match(appSource, /activeLegacySession \? "Resume tournament" : "Start draft"/, "Active Legacy drafts must resume from mode selection.");
assert.match(htmlSource, /id="restartLegacyDraftButton"[^>]*hidden/, "Legacy restart must only appear for an active session.");
assert.match(appSource, /localStorage\.removeItem\(LEGACY_TOURNAMENT_SESSION_KEY\)/, "Restarting Legacy must clear its saved tournament.");
assert.doesNotMatch(appSource, /window\.location\.assign\(tournamentUrl\.href\)/, "Legacy tournament handoff must not depend on a page reload.");
assert.match(appSource, /state\.rounds\.flatMap\(\(round\) => round \|\| \[\]\)/, "Sparse Legacy rounds must not put null entries into match rendering.");
assert.match(appSource, /state\.rounds\[roundIndex \+ 1\] = next/, "Sparse tournaments must write the next round to its real round index.");
assert.match(appSource, /tournamentState\.rounds\[4\] = roundOf16Matches/, "Legacy tournaments must begin in the Round of 16.");
assert.match(appSource, /\[\.\.\.new Set\(/, "Legacy player position labels must not contain duplicates.");
assert.match(appSource, /onlineOtherMatchFilter/);
assert.doesNotMatch(appSource, /"Normal goals"/);
assert.match(appSource, /function renderOnlineMatchEvents/);
assert.match(appSource, /function chooseStandardPenaltyTarget/);
assert.match(appSource, /if \(attempt\.interactive && !attempt\.target\)/, "Interactive shootouts must wait for the user to pick a target.");
assert.match(appSource, /function chooseMatchPenaltyTarget/);
assert.match(appSource, /function isControlledMatchPenalty/);
assert.match(appSource, /function shootoutSummaryMarkup/);
assert.match(appSource, /function drawSnapshotShootout/);
assert.match(appSource, /canvas\.height = canvasHeight/);
assert.match(appSource, /online-roster-country-name/);
assert.match(appSource, /function closeOnlineScreen/);
assert.match(appSource, /function readOnlineDisplayName/);
assert.match(appSource, /Enter a display name for this player\./);
assert.match(appSource, /url\.searchParams\.set\("mode", mode\)/);
assert.match(appSource, /setAppModeUrl\("standard"\)/);
assert.match(appSource, /window\.history\[replace \? "replaceState" : "pushState"\]/);
assert.match(appSource, /window\.addEventListener\("popstate"/);
assert.doesNotMatch(
  appSource,
  /\(startupMode === "home" \|\| startupMode === "standard"\) && state\.started/,
  "Refreshing must not discard a saved standard tournament.",
);
assert.match(appSource, /initialAppMode === "home" && state\.started && !state\.legacyTournament[\s\S]*setAppModeUrl\("standard", \{ replace: true \}\)/,
  "A saved standard tournament must reopen its bracket after refresh.");
assert.match(appSource, /Resume tournament/);
assert.match(htmlSource, /<a class="brand" href="\/"/);
assert.match(htmlSource, /<a class="online-screen-brand"[^>]*href="\/"/);
assert.doesNotMatch(workerSource, /members: \[member, cpuMember\]/);
assert.match(appSource, /const roundIndex = Math\.floor\(draft\.turnIndex \/ playerCount\)/);
assert.match(workerSource, /const DEFAULT_DRAFT_PICKS_PER_MEMBER = 5/);
assert.match(workerSource, /team\.officialFifaRank >= 40 && team\.officialFifaRank <= 90/);
assert.match(workerSource, /!team\.officialFifaRank \|\| team\.officialFifaRank >= 120/);
assert.match(workerSource, /async rename\(request\)/);
assert.match(workerSource, /function settleOnlineTournament/);
assert.match(workerSource, /function createOnlineGoalEvents/);
assert.match(workerSource, /tacticsByTeam/);
assert.match(workerSource, /required\.every\(\(memberId\) => match\.readyMemberIds\.includes\(memberId\)\)/);
assert.match(workerSource, /goalkeeperTarget === target/);
assert.equal(teams.filter((team) => team.confed !== "INVITED").length, 211);
assert.equal(teams.filter((team) => team.confed === "INVITED").length, 45);
assert.equal(new Set(teams.map((team) => team.id)).size, 256, "Team IDs must be unique.");
assert.equal(new Set(teams.map((team) => team.name)).size, 256, "Team names must be unique.");
assert.equal(
  teams.map((team) => team.seed).join(","),
  Array.from({ length: 256 }, (_, index) => index + 1).join(","),
);
assert.equal(context.__rounds.length, 8);
assert.ok(
  teams.filter((team) => team.confed !== "INVITED").every((team) => team.players?.length >= 4),
  "Every established national team must have a recent real-player pool.",
);
const chilePlayers = teams.find((team) => team.name === "Chile").players;
assert.ok(chilePlayers.includes("Darío Osorio") && chilePlayers.includes("Lucas Cepeda"));
assert.ok(!chilePlayers.some((player) => /Smith|Williams|García/.test(player)));
const englandTeam = teams.find((team) => team.name === "England");
const englandPlayers = englandTeam.players;
assert.ok(["Jordan Pickford", "Declan Rice", "Jude Bellingham", "Bukayo Saka", "Harry Kane"].every((player) => englandPlayers.includes(player)));
assert.equal(englandTeam.playerProfiles[0].position, "GK");
assert.equal(englandTeam.playerProfiles.length, 26);
const austriaPlayers = teams.find((team) => team.name === "Austria").players;
const switzerlandPlayers = teams.find((team) => team.name === "Switzerland").players;
const brazilPlayers = teams.find((team) => team.name === "Brazil").players;
assert.ok(brazilPlayers.includes("Neymar"), "Brazil should list Neymar without a retirement suffix.");
assert.ok(!teams.flatMap((team) => team.players).some((player) => /\(RET\)|RET$/.test(player)));
assert.ok(austriaPlayers.includes("Christoph Baumgartner"));
assert.ok(switzerlandPlayers.includes("Johan Manzambi"));
assert.equal(teams.find((team) => team.name === "Kiribati").nameCulture, "micronesian");
assert.ok(teams.filter((team) => team.confed !== "INVITED" && team.playerProfiles?.length >= 11).length >= 200);

const htmlIds = new Set([...htmlSource.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const duplicateIds = [...htmlSource.matchAll(/\bid="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((id, index, all) => all.indexOf(id) !== index);
assert.deepEqual(duplicateIds, [], "HTML IDs must be unique.");

const staticSelectors = [...appSource.matchAll(/\$\("#([^"]+)"\)/g)]
  .map((match) => match[1].split(/[\s>+~.:[#]/)[0]);
const optionalStaticSelectors = new Set(["onlineModeStatus", "matchLineups", "tiesRemaining", "matchQueue"]);
const missingSelectors = staticSelectors.filter((id) => !htmlIds.has(id) && !optionalStaticSelectors.has(id));
assert.deepEqual(missingSelectors, [], `Missing HTML IDs: ${missingSelectors.join(", ")}`);
assert.ok(!htmlSource.includes("Access keys stay in this browser tab"));
assert.ok(!htmlSource.includes('placeholder="e.g. Mohamed"'));
assert.ok(appSource.includes("onlineRoomErrorMessage(payload.error)"), "Room API errors must be converted to readable text.");
assert.ok(htmlIds.has("snapshotButton") && htmlIds.has("snapshotModal") && htmlIds.has("snapshotImage"));
assert.ok(appSource.includes("new ClipboardItem") && appSource.includes("navigator.share"));
assert.ok(appSource.includes('canvas.toBlob') && appSource.includes('link.download = snapshotFilename'));
assert.ok(/id="snapshotButton"[^>]*hidden/.test(htmlSource), "The snapshot control must start hidden until a match is complete.");
assert.ok(appSource.includes("els.snapshotButton.hidden = !revealed"), "Only revealed finished matches should expose snapshots.");
assert.ok(appSource.includes("drawSnapshotGoldenBoot") && appSource.includes("drawSnapshotConfetti"), "Champion snapshots must include the Golden Boot and confetti.");

function mockElement() {
  return {
    hidden: false,
    innerHTML: "",
    textContent: "",
    value: "",
    checked: false,
    dataset: {},
    style: { setProperty() {} },
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; },
    },
    addEventListener() {},
    setAttribute() {},
    querySelectorAll() { return []; },
    querySelector() { return mockElement(); },
    appendChild() {},
    append() {},
    insertAdjacentHTML() {},
    remove() {},
    scrollIntoView() {},
    showModal() {},
    replaceChildren() {},
    children: [],
  };
}

const elementCache = new Map();
context.document = {
  querySelector(selector) {
    if (!elementCache.has(selector)) elementCache.set(selector, mockElement());
    return elementCache.get(selector);
  },
  querySelectorAll() { return []; },
  createElement() { return mockElement(); },
  addEventListener() {},
  body: mockElement(),
  documentElement: mockElement(),
  activeElement: { tagName: "BODY" },
  fullscreenElement: null,
};
context.window = {
  addEventListener() {},
  scrollTo() {},
  matchMedia() { return { matches: false }; },
  location: {
    href: "https://www.256teams.com/",
    pathname: "/",
    search: "",
    hash: "",
    origin: "https://www.256teams.com",
  },
  history: {
    state: null,
    pushState(state) { this.state = state; },
    replaceState(state) { this.state = state; },
  },
};
context.URL = URL;
context.URLSearchParams = URLSearchParams;
let fakeNow = 1e8;
context.fakeNow = fakeNow;
context.performance = { now() { return context.fakeNow; } };
const storage = new Map();
context.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
  removeItem(key) { storage.delete(key); },
};
context.sessionStorage = context.localStorage;
context.requestAnimationFrame = () => 1;
context.cancelAnimationFrame = () => {};
context.setTimeout = () => 1;
context.clearTimeout = () => {};
context.Audio = class { play() { return Promise.resolve(); } pause() {} load() {} addEventListener() {} removeEventListener() {} };
context.Promise = Promise;

vm.runInContext(
  `${presentationEngineSource}\n${simulationEngineSource}\n${legacyEnglandSource}\n${appSource}
  ;globalThis.__simulateMatch = simulateMatch;
  globalThis.__weightedScorer = weightedScorer;
  globalThis.__scoringRunBrake = scoringRunBrake;
  globalThis.__playerProfilesForTeam = playerProfilesForTeam;
  globalThis.__neutralPlayerLabels = neutralPlayerLabels;
  globalThis.__calculateScorerWeight = calculateScorerWeight;
  globalThis.__matchupScorerMultiplier = matchupScorerMultiplier;
  globalThis.__teamGoalShareMultiplier = teamGoalShareMultiplier;
  globalThis.__calculateExpectedGoals = calculateExpectedGoals;
  globalThis.__giantKillingMomentumMultiplier = giantKillingMomentumMultiplier;
  globalThis.__simulationConfig = SIMULATION_CONFIG;
  globalThis.__calculateTournamentFatigue = calculateTournamentFatigue;
  globalThis.__goalEvents = goalEvents;
  globalThis.__simulatePenaltyShootout = simulatePenaltyShootout;
  globalThis.__shootoutMarksMarkup = shootoutMarksMarkup;
  globalThis.__standardShootoutWinner = standardShootoutWinner;
  globalThis.__shootoutSummaryMarkup = shootoutSummaryMarkup;
  globalThis.__setPenaltySceneElement = setPenaltySceneElement;
  globalThis.__chooseGoalType = chooseGoalType;
  globalThis.__manualPenaltyGoalChance = manualPenaltyGoalChance;
  globalThis.__resolveManualPenaltyAttempt = resolveManualPenaltyAttempt;
  globalThis.__missedPenaltyVisual = missedPenaltyVisual;
  globalThis.__matchPenaltySceneTarget = matchPenaltySceneTarget;
  globalThis.__mergeLiveTacticalResult = mergeLiveTacticalResult;
  globalThis.__shootoutTakerPool = shootoutTakerPool;
  globalThis.__nextLegacyTournamentSeed = nextLegacyTournamentSeed;
  globalThis.__isControlledMatchPenalty = isControlledMatchPenalty;
  globalThis.__suspendedPlayersForTeam = suspendedPlayersForTeam;
  globalThis.__applyScorelineCeiling = applyScorelineCeiling;
  globalThis.__createFirstRound = createFirstRound;
  globalThis.__renderChampionConfetti = renderChampionConfetti;
  globalThis.__fixtureScoreMarkup = fixtureScoreMarkup;
  globalThis.__preferredPenaltyFoot = preferredPenaltyFoot;
  globalThis.__onlineSharedMatchState = onlineSharedMatchState;
  globalThis.__snapshotGoalLines = snapshotGoalLines;
  globalThis.__calculateGoalscorerTable = calculateGoalscorerTable;
  globalThis.__calculateTopGoalscorer = calculateTopGoalscorer;
  globalThis.__roundHistoryTargets = roundHistoryTargets;
  globalThis.__teamJourneyMatches = teamJourneyMatches;
  globalThis.__playbackEvents = playbackEvents;
  globalThis.__getTeamGoalFlashTheme = getTeamGoalFlashTheme;
  globalThis.__top50GoalFlashColors = TOP_50_GOAL_FLASH_COLORS;
  globalThis.__runtimeTeams = TEAMS;
  globalThis.__runtimeState = state;
  globalThis.__loadState = loadState;
  globalThis.__storageKey = STORAGE_KEY;
  globalThis.__tacticalUnderdogProof = () => {
    const underdog = TEAMS.find((team) => team.name === "Sealand");
    const favourite = TEAMS.find((team) => team.name === "France");
    const previousSpectateTeamId = state.spectateTeamId;
    const previousTactic = state.standardTactic;
    state.spectateTeamId = underdog.id;
    state.standardTactic = "counter";
    let match = null;
    for (let index = 0; index < 100; index += 1) {
      const candidate = { id: "tactical-proof-" + index, homeId: underdog.id, awayId: favourite.id };
      if (opponentStandardTactic(candidate, "home") === "high-press") {
        match = candidate;
        break;
      }
    }
    const proof = applyControlledTacticalMatchup({ homeXG: 0.2, awayXG: 5 }, match, "home");
    state.spectateTeamId = previousSpectateTeamId;
    state.standardTactic = previousTactic;
    return { homeXG: proof.adjustedXG.homeXG, awayXG: proof.adjustedXG.awayXG, edge: proof.edge };
  };
  globalThis.__legacyCatalogSummary = () => ({
    nations: Object.keys(LEGACY_NATIONS).length,
    squads: Object.values(LEGACY_NATIONS).reduce((sum, nation) => sum + nation.squads.length, 0),
    englandReady: legacyDraftableSquads(LEGACY_NATIONS.england).map((squad) => squad.year),
  });
  globalThis.__legacyIniesta2014Positions = () => {
    const iniesta = LEGACY_NATIONS.spain.squads
      .find((squad) => squad.year === 2014)
      .players.find((player) => player.name === "Andrés Iniesta");
    return [iniesta.primaryPosition, ...iniesta.secondaryPositions];
  };
  globalThis.__legacyFitProof = () => {
    const player = LEGACY_NATIONS.england.squads.flatMap((squad) => squad.players).find((candidate) => candidate.name === "Kieran Trippier" && candidate.secondaryPositions.includes("LB"));
    const striker = LEGACY_NATIONS.england.squads.flatMap((squad) => squad.players).find((candidate) => candidate.primaryPosition === "ST");
    const formation = LEGACY_FORMATIONS["433"];
    const rightBack = formation.slots.find((slot) => slot.id === "RB");
    const leftBack = formation.slots.find((slot) => slot.id === "LB");
    const goalkeeper = formation.slots.find((slot) => slot.id === "GK");
    const leftWing = formation.slots.find((slot) => slot.id === "LW");
    return {
      natural: legacyPlayerFit(player, rightBack),
      secondary: legacyPlayerFit(player, leftBack),
      invalid: legacyPlayerFit(player, goalkeeper),
      naturalRating: legacyEffectiveValue(player, rightBack, player.rating),
      secondaryRating: legacyEffectiveValue(player, leftBack, player.rating),
      wideEmergency: legacyPlayerFit(striker, leftWing),
      wideEmergencyPenalty: striker.rating - legacyEffectiveValue(striker, leftWing, striker.rating),
    };
  };
  globalThis.__legacyRespinProof = () => {
    legacySetup = { mode: "classic", formationId: "433", nationId: "england", nationSearch: "" };
    legacyDraft = createLegacyDraft("england");
    legacyDraft.seed = 551199;
    nextLegacyOffers();
    const firstYear = legacyDraft.currentSquad.year;
    legacyDraft.respinsLeft = 0;
    legacyDraft.offers = [];
    nextLegacyOffers({ excludeYear: firstYear, seedOffset: 1 });
    return { firstYear, secondYear: legacyDraft.currentSquad.year, respinsLeft: legacyDraft.respinsLeft };
  };
  globalThis.__exerciseLegacyDraft = (seed, formationId) => {
    legacySetup = { mode: "classic", formationId, nationId: "england", nationSearch: "" };
    legacyDraft = createLegacyDraft("england");
    legacyDraft.seed = seed;
    const offerSizes = [];
    while (!legacyDraft.complete && !legacyDraft.blockedMessage) {
      nextLegacyOffers();
      offerSizes.push(legacyDraft.offers.length);
      const allAvailable = legacyDraftableSquads(legacyDraft.nation)
        .flatMap((squad) => squad.players)
        .filter((player) => !legacyPlayerAlreadyDrafted(player));
      const pairs = [];
      for (const slot of legacyEmptySlots()) {
        const scarcity = new Set(allAvailable.filter((player) => legacyPlayerFitsSlot(player, slot)).map((player) => player.name)).size;
        for (const player of legacyDraft.offers) {
          if (!legacyPlayerAlreadyDrafted(player) && legacyPlayerFitsSlot(player, slot)) {
            pairs.push({ player, slot, scarcity, secondary: legacyPlayerFit(player, slot) === "secondary" });
          }
        }
      }
      pairs.sort((a, b) => a.scarcity - b.scarcity || Number(a.secondary) - Number(b.secondary) || a.player.name.localeCompare(b.player.name));
      if (!pairs.length) break;
      draftLegacyPlayer(pairs[0].player.id, pairs[0].slot.id);
    }
    return {
      complete: legacyDraft.complete,
      blockedMessage: legacyDraft.blockedMessage,
      offerSizes,
      names: Object.values(legacyDraft.lineup).map((player) => player.name),
      team: legacyDraft.complete ? legacyDraftTeam() : null,
    };
  };
  globalThis.__exerciseLegacyTournament = () => {
    const previousState = state;
    state = createLegacyTournamentState();
    const roundSizes = [];
    const controlledTeamId = state.spectateTeamId;
    for (let roundIndex = 4; roundIndex <= 7; roundIndex += 1) {
      roundSizes.push(state.rounds[roundIndex]?.length || 0);
      state.rounds[roundIndex].forEach((match) => {
        match.result = simulateMatch(match, roundIndex);
        match.result.revealed = true;
      });
      if (roundIndex < 7) buildNextRound(roundIndex);
    }
    const proof = {
      roundSizes,
      valid: isValidLegacyTournamentState(state),
      controlledTeamInRoundOf16: state.rounds[4].some((match) => match.homeId === controlledTeamId || match.awayId === controlledTeamId),
      championId: state.rounds[7][0].result.winnerId,
    };
    state = previousState;
    return proof;
  };
  globalThis.__simulateTournament = (drawSeed) => {
    state.drawSeed = drawSeed;
    state.settings = { ...defaultSettings, upset: "balanced", spoiler: false };
    state.rounds = [createFirstRound(drawSeed)];
    for (let roundIndex = 0; roundIndex < 7; roundIndex += 1) {
      state.activeRound = roundIndex;
      state.rounds[roundIndex].forEach((match) => {
        match.result = simulateMatch(match, roundIndex);
        match.result.revealed = true;
      });
      buildNextRound(roundIndex);
    }
    const lastEight = state.rounds[5].flatMap((match) => [match.homeId, match.awayId]);
    const final = state.rounds[7][0];
    return {
      lastEight,
      finalists: [final.homeId, final.awayId],
    };
  };
  globalThis.__simulateCompleteTournament = (drawSeed) => {
    state.drawSeed = drawSeed;
    state.settings = { ...defaultSettings, upset: "balanced", spoiler: false };
    state.rounds = [createFirstRound(drawSeed)];
    for (let roundIndex = 0; roundIndex < 8; roundIndex += 1) {
      state.activeRound = roundIndex;
      state.rounds[roundIndex].forEach((match) => {
        match.result = simulateMatch(match, roundIndex);
        match.result.revealed = true;
      });
      if (roundIndex < 7) buildNextRound(roundIndex);
    }
    return {
      championId: state.rounds[7][0].result.winnerId,
      winnerSignature: state.rounds.flat().map((match) => match.result.winnerId).join("|"),
    };
  };
  globalThis.__exerciseSpeedMemory = () => {
    preferredMatchSpeed = 1;
    livePlayback = { speed: 1, phase: "match" };
    cycleLiveSpeed();
    const remembered = preferredMatchSpeed;
    livePlayback = { speed: 1, phase: "shootout", shootout: [], shootoutIndex: 0, shootoutStep: "setup", penaltyHomeScore: 0, penaltyAwayScore: 0 };
    cycleLiveSpeed();
    const shootoutSpeed = livePlayback.speed;
    const preferenceAfterShootout = preferredMatchSpeed;
    livePlayback = null;
    return { remembered, shootoutSpeed, preferenceAfterShootout };
  };
  globalThis.__exercisePause = () => {
    livePlayback = {
      ending: false,
      paused: false,
      frame: 1,
      lastTimestamp: 24,
    };
    toggleLivePause();
    const paused = livePlayback.paused && livePlayback.frame === null;
    toggleLivePause();
    const resumed = !livePlayback.paused && livePlayback.lastTimestamp === 0;
    livePlayback = null;
    return { paused, resumed };
  };
  globalThis.__playbackRegressionTest = () => {
    const results = { commentaryAdvanced: false, commentaryMinute10: false, commentaryRendered: false, silentStall: false, keyAdvanced: false, extendedAdvanced: false, pauseWorks: false, resumeWorks: false, errors: [] };
    try {
      const home = TEAMS.find((team) => team.name === "France");
      const away = TEAMS.find((team) => team.name === "Sealand");
      const testMatch = { id: "playback-regression-test", homeId: home.id, awayId: away.id };
      const prevState = { activeRound: state.activeRound, selectedMatch: state.selectedMatch, rounds: state.rounds.map((round) => [...(round || [])]) };

      const runPlayback = (mode, targetMinute) => {
        state.activeRound = 0;
        state.selectedMatch = 0;
        state.rounds = [[testMatch]];
        setMatchHighlightMode(mode);
        testMatch.result = null;
        testMatch.result = createLiveMatchResult(testMatch, 0);
        livePlayback = null;
        match2dState = null;
        globalThis.fakeNow = 1e8;
        startLivePlayback(testMatch);
        if (!livePlayback) throw new Error(mode + ": startLivePlayback returned null (no livePlayback)");
        if (!match2dState) throw new Error(mode + ": startLivePlayback produced no match2dState");
        const hc = match2dState.presentation?.highlights?.length || 0;
        if (hc === 0) throw new Error(mode + ": zero highlights generated");
        globalThis.fakeNow += 5000;
        stepLivePlayback(globalThis.fakeNow); globalThis.fakeNow += 5000;
        stepLivePlayback(globalThis.fakeNow); globalThis.fakeNow += 5000;
        let steps = 0;
        let lastMinute = livePlayback.minute;
        while (livePlayback && livePlayback.frame && !match2dState?.complete && livePlayback.minute < Math.min(targetMinute, livePlayback.maxMinute)) {
          globalThis.fakeNow += 5000;
          stepLivePlayback(globalThis.fakeNow);
          steps += 1;
          if (steps > 5000) throw new Error(mode + ": exceeded 5000 steps at minute " + livePlayback.minute);
          if (livePlayback.minute === lastMinute && steps > 200) throw new Error(mode + ": clock stalled at minute " + livePlayback.minute + " after " + steps + " steps");
          lastMinute = livePlayback.minute;
        }
        return { minute: livePlayback.minute, feedLen: (livePlayback.commentaryFeed || []).length, steps };
      };

      const c = runPlayback("commentary", 90);
      results.commentaryAdvanced = c.minute > 0;
      results.commentaryMinute10 = c.minute >= 10;
      results.commentaryRendered = c.feedLen > 0;
      results.silentStall = c.minute > 0;
      livePlayback = null;
      match2dState = null;

      const k = runPlayback("key", 10);
      results.keyAdvanced = k.minute >= 5;
      livePlayback = null;
      match2dState = null;

      const e = runPlayback("extended", 10);
      results.extendedAdvanced = e.minute >= 5;
      livePlayback = null;
      match2dState = null;

      // Pause/resume
      setMatchHighlightMode("commentary");
      state.activeRound = 0;
      state.selectedMatch = 0;
      state.rounds = [[testMatch]];
      testMatch.result = null;
      testMatch.result = createLiveMatchResult(testMatch, 0);
      livePlayback = null;
      match2dState = null;
      globalThis.fakeNow = 1e8;
      startLivePlayback(testMatch);
      if (!match2dState) throw new Error("pause test: no match2dState");
      globalThis.fakeNow += 5000;
      stepLivePlayback(globalThis.fakeNow); globalThis.fakeNow += 5000;
      stepLivePlayback(globalThis.fakeNow); globalThis.fakeNow += 5000;
      for (let i = 0; i < 500; i += 1) {
        globalThis.fakeNow += 5000;
        stepLivePlayback(globalThis.fakeNow);
        if (livePlayback.minute >= 2) break;
      }
      const mbp = livePlayback.minute;
      toggleLivePause();
      results.pauseWorks = livePlayback.paused && livePlayback.frame === null;
      for (let i = 0; i < 20; i += 1) { globalThis.fakeNow += 5000; stepLivePlayback(globalThis.fakeNow); }
      const mwp = livePlayback.minute;
      toggleLivePause();
      results.resumeWorks = !livePlayback.paused && mwp === mbp;
      livePlayback = null;
      match2dState = null;

      // Restore state
      state.activeRound = prevState.activeRound;
      state.selectedMatch = prevState.selectedMatch;
      state.rounds = prevState.rounds;
      setMatchHighlightMode("key");
    } catch (err) {
      results.errors.push(err.message + " // " + (err.stack || "").replace(/\\n/g, " | "));
    }
    return results;
  };`,
  context,
);

assert.equal(Object.keys(context.__top50GoalFlashColors).length, 50, "The goal-flash palette must cover the current FIFA top 50.");
const brazilGoalTheme = context.__getTeamGoalFlashTheme(context.__runtimeTeams.find((team) => team.name === "Brazil"));
const franceGoalTheme = context.__getTeamGoalFlashTheme(context.__runtimeTeams.find((team) => team.name === "France"));
assert.equal(brazilGoalTheme.background, "#FFDF00");
assert.equal(brazilGoalTheme.text, "#07111F", "Bright goal colours must use dark text.");
assert.equal(franceGoalTheme.background, "#002654");
assert.equal(franceGoalTheme.text, "#FFFFFF", "Dark goal colours must use white text.");

const guestWithoutVerifiedPlayers = context.__runtimeTeams.find((team) => !team.players);
const tacticalUnderdogProof = context.__tacticalUnderdogProof();
assert.ok(tacticalUnderdogProof.edge >= 0.2, "Counter should strongly punish a favourite's high press.");
assert.ok(tacticalUnderdogProof.homeXG >= 1 && tacticalUnderdogProof.awayXG < 3,
  "A correctly managed underdog must have a realistic upset chance against an elite favourite.");
const tacticalEngland = context.__runtimeTeams.find((team) => team.name === "England");
const tacticalSealand = context.__runtimeTeams.find((team) => team.name === "Sealand");
const liveTacticalMerge = context.__mergeLiveTacticalResult({
  engineVersion: 2,
  engineSeed: 77,
  homeEvents: [{ minute: 12, scorer: "Played goal" }, { minute: 70, scorer: "Old future" }],
  awayEvents: [],
  redCards: [],
  tacticalHistory: [],
}, {
  homeEvents: [{ minute: 5, scorer: "Rewritten past" }, { minute: 75, scorer: "New future" }],
  awayEvents: [{ minute: 80, scorer: "Opponent future" }],
  redCards: [],
  suspendedPlayers: { home: [], away: [] },
  tacticalMatchup: { opponent: "high-press", edge: 0.24 },
}, 45, { id: "live-tactical-merge", homeId: tacticalEngland.id, awayId: tacticalSealand.id });
assert.deepEqual(
  JSON.parse(JSON.stringify(liveTacticalMerge.homeEvents.map((event) => event.scorer))),
  ["Played goal", "New future"],
  "A live tactic change must preserve played goals and replace only unseen events.",
);
assert.equal(liveTacticalMerge.awayEvents[0].scorer, "Opponent future");
assert.equal(liveTacticalMerge.engineSeed, 77, "Live tactical changes must retain the deterministic match seed.");
assert.equal(liveTacticalMerge.tacticalHistory.length, 1, "Live tactical changes must be recorded with the result.");
assert.match(
  appSource,
  /if \(match2dState\.activeHighlight\)[\s\S]*pendingTacticChange = true[\s\S]*if \(livePlayback\.pendingTacticChange\)[\s\S]*rebuildLiveMatchAfterTacticChange/,
  "A live tactical change must wait for the active passage to finish before rebuilding future events.",
);
const legacyCatalogSummary = context.__legacyCatalogSummary();
assert.deepEqual(JSON.parse(JSON.stringify(legacyCatalogSummary)), {
  nations: 10,
  squads: 87,
    englandReady: [1986, 1990, 1998, 2002, 2006, 2010, 2014, 2018, 2022],
});
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__legacyIniesta2014Positions())),
  ["LW", "CAM", "CM"],
  "Spain 2014 Iniesta must be eligible at left wing, attacking midfield and central midfield.",
);
const legacyFitProof = context.__legacyFitProof();
assert.equal(legacyFitProof.natural, "natural");
assert.equal(legacyFitProof.secondary, "secondary");
assert.equal(legacyFitProof.invalid, null);
assert.equal(legacyFitProof.naturalRating - legacyFitProof.secondaryRating, 2, "A secondary position must carry the configured two-point penalty.");
assert.equal(legacyFitProof.wideEmergency, "out-of-position");
assert.equal(legacyFitProof.wideEmergencyPenalty, 4, "A central attacker used on the wing must lose four rating points.");
const legacyRespinProof = context.__legacyRespinProof();
assert.notEqual(legacyRespinProof.firstYear, legacyRespinProof.secondYear, "The single Legacy respin should land on a different eligible World Cup year.");
assert.equal(legacyRespinProof.respinsLeft, 0);
for (const [index, formationId] of ["433", "442", "352", "532"].entries()) {
  const proof = context.__exerciseLegacyDraft(7410 + index, formationId);
  assert.equal(proof.complete, true, `${formationId}: automated Legacy Draft should fill all 11 positions.`);
  assert.equal(proof.blockedMessage, null, `${formationId}: draft should not dead-end.`);
  assert.ok(proof.offerSizes.every((size) => size === 11), `${formationId}: every spun year must expose its full starting XI.`);
  assert.equal(new Set(proof.names).size, 11, `${formationId}: drafted players must be unique by name.`);
  assert.ok(Object.values(proof.team.simulationRatings).every(Number.isFinite), `${formationId}: drafted attributes must produce finite simulator ratings.`);
}
const legacyTournamentProof = context.__exerciseLegacyTournament();
assert.deepEqual(JSON.parse(JSON.stringify(legacyTournamentProof.roundSizes)), [8, 4, 2, 1], "Legacy tournament rounds must progress from the Round of 16 through the final.");
assert.equal(legacyTournamentProof.valid, true);
assert.equal(legacyTournamentProof.controlledTeamInRoundOf16, true);
assert.ok(legacyTournamentProof.championId);
assert.ok(guestWithoutVerifiedPlayers, "At least one guest team must exercise generated player names.");
assert.ok(
  context.__playerProfilesForTeam(guestWithoutVerifiedPlayers).every((profile) => !/^Player \d+$/.test(profile.name)),
  "Real-player-only mode must not replace entire guest squads with numbered placeholders.",
);
assert.equal(context.__manualPenaltyGoalChance(0.78, false), 1, "A manually aimed shot cannot go wide.");
assert.ok(context.__manualPenaltyGoalChance(0.78, true) < 0.5, "A keeper matching the chosen target can save the shot.");
for (const target of ["top-left", "top-right", "middle", "bottom-left", "bottom-right"]) {
  const savedAttempt = context.__resolveManualPenaltyAttempt({
    conversionChance: 0.78,
    goalkeeperTarget: target,
    outcomeRoll: 0.99,
  }, target);
  assert.equal(savedAttempt.scored, false);
  assert.equal(savedAttempt.missType, "save", `${target}: a manually aimed miss must be a save.`);
  assert.ok(!savedAttempt.direction.startsWith("wide"), `${target}: a manually aimed kick must stay on target.`);
  const goalAttempt = context.__resolveManualPenaltyAttempt({
    conversionChance: 0.78,
    goalkeeperTarget: target === "middle" ? "top-left" : "middle",
    outcomeRoll: 0.999,
  }, target);
  assert.equal(goalAttempt.scored, true, `${target}: beating the goalkeeper must score.`);
  assert.equal(goalAttempt.missType, null);
}
const automaticPenaltyTeam = context.__runtimeTeams.find((team) => team.name === "England");
const automaticPenaltyMisses = Array.from({ length: 80 }, (_, index) => context.__missedPenaltyVisual(
  "home",
  automaticPenaltyTeam,
  "AI taker",
  index + 1,
  "left",
  "right",
));
assert.ok(automaticPenaltyMisses.some((attempt) => attempt.missType === "wide"),
  "Uncontrolled penalty takers must sometimes miss the target.");
assert.equal(context.__matchPenaltySceneTarget({ direction: "wide-right", missType: "wide" }, false), "",
  "An automatic wide miss must not inherit the middle target trajectory.");
assert.equal(context.__matchPenaltySceneTarget({ target: null }, true), "middle",
  "A controlled penalty must show the middle target while awaiting a choice.");
assert.equal(context.__matchPenaltySceneTarget({ target: "bottom-right" }, true), "bottom-right",
  "A controlled penalty must retain the selected target trajectory.");
assert.match(appSource, /function matchPenaltyAttempt[\s\S]*missedPenaltyVisual\(/,
  "AI normal-time penalty misses must use the deterministic saved-or-wide outcome.");
const legacyPenaltyOrder = context.__shootoutTakerPool({
  id: "legacy-penalty-order-proof",
  name: "Spain Legacy XI",
  rating: 88,
  players: ["Iker Casillas", "David Villa", "Xavi", "Sergio Ramos"],
  positionSuitability: [
    { player: "Iker Casillas", slot: "GK" },
    { player: "David Villa", slot: "ST" },
    { player: "Xavi", slot: "CM" },
    { player: "Sergio Ramos", slot: "CB" },
  ],
}, []);
assert.equal(legacyPenaltyOrder[0], "David Villa", "A striker must take the first Legacy penalty.");
assert.equal(legacyPenaltyOrder.at(-1), "Iker Casillas", "The goalkeeper must be last in the Legacy shootout order.");
const firstLegacyTournamentSeed = 1784567791;
const secondLegacyTournamentSeed = context.__nextLegacyTournamentSeed(firstLegacyTournamentSeed);
const thirdLegacyTournamentSeed = context.__nextLegacyTournamentSeed(secondLegacyTournamentSeed);
assert.notEqual(secondLegacyTournamentSeed, firstLegacyTournamentSeed, "Replay must use a new tournament seed.");
assert.notEqual(thirdLegacyTournamentSeed, secondLegacyTournamentSeed, "Repeated replays must continue rotating the tournament seed.");
const hiddenOnlineShootoutCard = context.__onlineSharedMatchState({
  id: "hidden-shootout",
  status: "complete",
  homeScore: 1,
  awayScore: 1,
  completedAt: 1,
  penalty: { homeScore: 5, awayScore: 4 },
}, 10000);
assert.equal(hiddenOnlineShootoutCard.penaltyText, "", "Online cards must not spoil a shootout score before playback finishes.");
const englandForPenaltyControl = context.__runtimeTeams.find((team) => team.name === "England");
context.__runtimeState.spectateTeamId = englandForPenaltyControl.id;
assert.equal(
  context.__isControlledMatchPenalty({ teamId: englandForPenaltyControl.id }),
  true,
  "A normal-time penalty for the selected team must wait for manual target selection.",
);
assert.equal(context.__isControlledMatchPenalty({ teamId: "france" }), false);
context.__runtimeState.spectateTeamId = null;

assert.equal(
  context.__fixtureScoreMarkup(
    { homeGoals: 1, awayGoals: 1, penalties: { home: 4, away: 2 } },
    "home",
    true,
  ),
  "1<small>(4)</small>",
  "Shootout scores must appear in brackets beside the tied match score.",
);

const franceForFootCheck = context.__runtimeTeams.find((team) => team.name === "France");
const spainForFootCheck = context.__runtimeTeams.find((team) => team.name === "Spain");
const englandForFootCheck = context.__runtimeTeams.find((team) => team.name === "England");
const moroccoForFootCheck = context.__runtimeTeams.find((team) => team.name === "Morocco");
const netherlandsForFootCheck = context.__runtimeTeams.find((team) => team.name === "Netherlands");
let penaltyRandomState = 918273645;
const penaltyRandom = () => {
  penaltyRandomState = (penaltyRandomState * 1664525 + 1013904223) >>> 0;
  return penaltyRandomState / 4294967296;
};
const penaltyDirectionProof = context.__simulatePenaltyShootout(englandForFootCheck, franceForFootCheck, penaltyRandom).sequence;
assert.ok(penaltyDirectionProof.some((attempt) => attempt.direction !== "centre"), "Automatic penalty takers must not always shoot down the middle.");
assert.ok(new Set(penaltyDirectionProof.map((attempt) => attempt.target)).size > 1, "Shootout attempts must use varied target areas.");
assert.equal(context.__preferredPenaltyFoot(franceForFootCheck, "Michael Olise", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(franceForFootCheck, "Kylian Mbappé", () => 0.1), "right");
assert.equal(context.__preferredPenaltyFoot(spainForFootCheck, "Lamine Yamal", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(spainForFootCheck, "Nico Williams", () => 0.1), "right");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Cole Palmer", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Ethan Nwaneri", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Max Dowman", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Rio Ngumoha", () => 0.9), "right");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Liam Delap", () => 0.1), "right");
assert.equal(context.__preferredPenaltyFoot(englandForFootCheck, "Kobbie Mainoo", () => 0.9), "right");
assert.equal(context.__preferredPenaltyFoot(moroccoForFootCheck, "Amine Adli", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(moroccoForFootCheck, "Bilal El Khannouss", () => 0.1), "right");
assert.equal(context.__preferredPenaltyFoot(moroccoForFootCheck, "Brahim Díaz", () => 0.1), "left");
assert.equal(context.__preferredPenaltyFoot(moroccoForFootCheck, "Brahim Díaz", () => 0.9), "right");
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__snapshotGoalLines([
    { minute: 47, scorer: "Leandro Trossard" },
    { minute: 7, scorer: "Leandro Trossard" },
    { minute: 14, scorer: "Leandro Trossard" },
    { minute: 62, scorer: "Kevin De Bruyne" },
  ]))),
  ["Leandro Trossard  7', 14', 47'", "Kevin De Bruyne  62'"],
  "Snapshot goals should group every scorer's minutes without a '+ more' line.",
);
assert.equal(context.__preferredPenaltyFoot(netherlandsForFootCheck, "Micky van de Ven", () => 0.9), "left");
assert.equal(context.__preferredPenaltyFoot(netherlandsForFootCheck, "Xavi Simons", () => 0.9), "right");
assert.equal(context.__preferredPenaltyFoot(netherlandsForFootCheck, "Ryan Gravenberch", () => 0.9), "right");
assert.ok(netherlandsForFootCheck.players.includes("Xavi Simons"));
assert.ok(netherlandsForFootCheck.players.includes("Micky van de Ven"));
assert.equal(netherlandsForFootCheck.playerProfiles[0].position, "GK");
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__exerciseSpeedMemory())),
  { remembered: 1.5, shootoutSpeed: 2, preferenceAfterShootout: 1.5 },
  "Shootouts should start at 1x, remain adjustable, and not overwrite the saved match speed.",
);

const runtimeTeams = context.__runtimeTeams;
const iranPlayers = runtimeTeams.find((team) => team.name === "Iran").players;
const turkeyPlayers = runtimeTeams.find((team) => team.name === "Türkiye").players;
const uruguayPlayers = runtimeTeams.find((team) => team.name === "Uruguay").players;
const ivoryCoastPlayers = runtimeTeams.find((team) => team.name === "Ivory Coast").players;
const usaPlayers = runtimeTeams.find((team) => team.name === "USA").players;
const italyPlayers = runtimeTeams.find((team) => team.name === "Italy").players;
const japanPlayers = runtimeTeams.find((team) => team.name === "Japan").players;
const scorerSampleRandom = (() => {
  let seed = 246813579;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
})();
const sampleScorers = (team, count = 5000) => Array.from(
  { length: count },
  () => context.__weightedScorer(team, scorerSampleRandom),
);
const croatiaScorerSample = sampleScorers(runtimeTeams.find((team) => team.name === "Croatia"));
const netherlandsScorerSample = sampleScorers(runtimeTeams.find((team) => team.name === "Netherlands"));
const spainScorerSample = sampleScorers(runtimeTeams.find((team) => team.name === "Spain"));
const countScorer = (sample, player) => sample.filter((name) => name === player).length;
const croatiaDefenderShare = croatiaScorerSample.filter((name) => ["Joško Gvardiol", "Luka Vušković"].includes(name)).length
  / croatiaScorerSample.length;
assert.ok(croatiaDefenderShare < 0.04, "Defenders must receive only a small open-play scorer share.");
assert.ok(countScorer(croatiaScorerSample, "Luka Vušković") > 0, "Luka Vušković must be capable of scoring.");
assert.ok(countScorer(netherlandsScorerSample, "Micky van de Ven") > 0, "Micky van de Ven must be capable of scoring.");
assert.ok(countScorer(croatiaScorerSample, "Bruno Durdov") > countScorer(croatiaScorerSample, "Luka Vušković"));
assert.ok(countScorer(netherlandsScorerSample, "Xavi Simons") > countScorer(netherlandsScorerSample, "Micky van de Ven"));
const spainProfilesForWeight = context.__playerProfilesForTeam(spainForFootCheck);
assert.ok(
  context.__calculateScorerWeight(spainProfilesForWeight.find((profile) => profile.name === "Lamine Yamal"))
    > context.__calculateScorerWeight(spainProfilesForWeight.find((profile) => profile.name === "Nico Williams")),
);

const franceExpected = context.__calculateExpectedGoals(franceForFootCheck, runtimeTeams.find((team) => team.name === "Sealand"), 0);
assert.ok(franceExpected.homeXG > franceExpected.awayXG, "An elite team must receive more xG than a weak opponent.");
assert.equal(context.__giantKillingMomentumMultiplier(55, 80, 62), 1.10);
assert.equal(context.__giantKillingMomentumMultiplier(55, 80, 82), 1);
assert.equal(context.__giantKillingMomentumMultiplier(70, 80, 62), 1);
const momentumBaseline = context.__calculateExpectedGoals(franceForFootCheck, franceForFootCheck, 1);
const momentumBoosted = context.__calculateExpectedGoals(
  franceForFootCheck,
  franceForFootCheck,
  1,
  "balanced",
  "normal",
  1,
  1,
  1.10,
  1,
);
assert.ok(momentumBoosted.homeXG > momentumBaseline.homeXG, "Giant-killing momentum must improve next-round attacking xG.");
assert.ok(Math.abs(momentumBoosted.awayXG - momentumBaseline.awayXG) < 0.000001, "Momentum must not boost the opponent.");
const chaosLateMismatch = context.__calculateExpectedGoals(
  franceForFootCheck,
  runtimeTeams.find((team) => team.name === "Sealand"),
  7,
  "chaos",
);
const balancedLateMismatch = context.__calculateExpectedGoals(
  franceForFootCheck,
  runtimeTeams.find((team) => team.name === "Sealand"),
  7,
  "balanced",
);
assert.ok(
  chaosLateMismatch.awayXG > balancedLateMismatch.awayXG * 2,
  "Pure Chaos must preserve substantially more late-round underdog xG.",
);
assert.ok(context.__simulationConfig.modes.chaos.shockChance >= 0.18);
assert.ok(context.__simulationConfig.modes.chaos.redCardChance >= 0.14);
const equalExpectedEarly = context.__calculateExpectedGoals(franceForFootCheck, franceForFootCheck, 0);
const equalExpectedLate = context.__calculateExpectedGoals(franceForFootCheck, franceForFootCheck, 7);
assert.ok(Math.abs(equalExpectedEarly.homeXG - equalExpectedEarly.awayXG) < 0.000001);
assert.ok(Math.abs(equalExpectedLate.homeXG - equalExpectedLate.awayXG) < 0.000001, "Round strength must not bias equal teams.");
const eliteEarly = context.__calculateExpectedGoals(franceForFootCheck, runtimeTeams.find((team) => team.name === "Iran"), 0);
const eliteLate = context.__calculateExpectedGoals(franceForFootCheck, runtimeTeams.find((team) => team.name === "Iran"), 7);
assert.ok(eliteLate.homeXG / eliteLate.awayXG > eliteEarly.homeXG / eliteEarly.awayXG, "Later rounds must strengthen a meaningful favourite.");
assert.ok(context.__calculateTournamentFatigue({ squadDepth: 55 }, 6) > 0.05);
assert.equal(context.__calculateTournamentFatigue({ squadDepth: 90 }, 6), 0);
assert.equal(context.__standardShootoutWinner({ homeScore: 5, awayScore: 5, homeKicks: 5, awayKicks: 5 }), null);
assert.equal(context.__standardShootoutWinner({ homeScore: 6, awayScore: 5, homeKicks: 6, awayKicks: 5 }), null);
assert.equal(context.__standardShootoutWinner({ homeScore: 7, awayScore: 6, homeKicks: 7, awayKicks: 7 }), "home");
assert.equal(context.__standardShootoutWinner({ homeScore: 0, awayScore: 3, homeKicks: 3, awayKicks: 3 }), "away");
const shootoutSummary = context.__shootoutSummaryMarkup({
  shootout: [
    { side: "home", player: "First Taker", scored: true },
    { side: "home", player: "Second Taker", scored: false },
  ],
}, "home");
assert.match(shootoutSummary, /First Taker/);
assert.match(shootoutSummary, /Second Taker/);
assert.doesNotMatch(shootoutSummary, />Goal<|>Saved</);
assert.doesNotMatch(shootoutSummary, /Penalty kicks/);
assert.doesNotMatch(shootoutSummary, />\d+\/\d+</);
assert.match(shootoutSummary, /aria-label="Scored"/);
assert.match(shootoutSummary, /aria-label="Missed"/);

const franceProfiles = context.__playerProfilesForTeam(franceForFootCheck);
const mbappeProfile = franceProfiles.find((profile) => profile.name === "Kylian Mbappé");
const syntheticDefender = { ...mbappeProfile, position: "CB", attackingRole: "defensive" };
const lowRatedStriker = { ...mbappeProfile, overall: 55, finishing: 55 };
assert.ok(context.__calculateScorerWeight(mbappeProfile) > context.__calculateScorerWeight(syntheticDefender));
assert.ok(context.__calculateScorerWeight(mbappeProfile) > context.__calculateScorerWeight(lowRatedStriker));
const englandProfilesForHierarchy = context.__playerProfilesForTeam(englandForFootCheck);
const englandScorerWeight = (name) => context.__calculateScorerWeight(
  englandProfilesForHierarchy.find((profile) => profile.name === name),
  englandForFootCheck,
  englandProfilesForHierarchy,
);
assert.ok(englandScorerWeight("Jude Bellingham") > englandScorerWeight("Bukayo Saka"));
assert.ok(englandScorerWeight("Bukayo Saka") > englandScorerWeight("Max Dowman"));
assert.ok(englandScorerWeight("Max Dowman") > englandScorerWeight("Phil Foden"));
const ghanaForHierarchy = runtimeTeams.find((team) => team.name === "Ghana");
assert.ok(
  !context.__playerProfilesForTeam(ghanaForHierarchy).some((profile) => profile.name === "The Conspiracy"),
  "Real-player-only mode must hide the fictional Ghana player by default.",
);
context.__runtimeState.settings.realPlayersOnly = false;
const ghanaProfilesForHierarchy = context.__playerProfilesForTeam(ghanaForHierarchy);
const ghanaScorerWeight = (name) => context.__calculateScorerWeight(
  ghanaProfilesForHierarchy.find((profile) => profile.name === name),
  ghanaForHierarchy,
  ghanaProfilesForHierarchy,
);
assert.ok(ghanaProfilesForHierarchy.some((profile) => profile.name === "Antoine Semenyo"));
assert.ok(!ghanaProfilesForHierarchy.some((profile) => profile.name === "The Conspiracy"));
assert.ok(ghanaScorerWeight("Antoine Semenyo") > ghanaScorerWeight("Jordan Ayew") * 5);
context.__runtimeState.settings.realPlayersOnly = true;
const norwayForWeight = runtimeTeams.find((team) => team.name === "Norway");
const australiaForWeight = runtimeTeams.find((team) => team.name === "Australia");
const iranForWeight = runtimeTeams.find((team) => team.name === "Iran");
const norwayProfiles = context.__playerProfilesForTeam(norwayForWeight);
const australiaProfiles = context.__playerProfilesForTeam(australiaForWeight);
const iranProfiles = context.__playerProfilesForTeam(iranForWeight);
const haalandProfile = norwayProfiles.find((profile) => profile.name === "Erling Haaland");
const dukeProfile = australiaProfiles.find((profile) => profile.name === "Mitchell Duke");
const alipourProfile = iranProfiles.find((profile) => profile.name === "Ali Alipour");
const hosseinzadehProfile = iranProfiles.find((profile) => profile.name === "Amirhossein Hosseinzadeh");
assert.deepEqual(
  {
    overall: hosseinzadehProfile.overall,
    finishing: hosseinzadehProfile.finishing,
    role: hosseinzadehProfile.attackingRole,
    penaltyTaker: hosseinzadehProfile.penaltyTaker,
  },
  { overall: 76, finishing: 74, role: "support", penaltyTaker: false },
  "Hosseinzadeh must remain a supporting scorer rather than Iran's elite focal point.",
);
const haalandWeight = context.__calculateScorerWeight(haalandProfile, norwayForWeight, norwayProfiles);
const dukeWeight = context.__calculateScorerWeight(dukeProfile, australiaForWeight, australiaProfiles);
const mbappeWeight = context.__calculateScorerWeight(mbappeProfile, franceForFootCheck, franceProfiles);
const alipourWeight = context.__calculateScorerWeight(alipourProfile, iranForWeight, iranProfiles);
assert.ok(haalandWeight > dukeWeight * 10, "Haaland must have a much higher base scorer weight than Mitchell Duke.");
assert.ok(mbappeWeight > alipourWeight * 4, "Mbappe must have a much higher base scorer weight than an average striker.");
assert.ok(
  context.__matchupScorerMultiplier(haalandProfile, norwayForWeight, runtimeTeams.find((team) => team.name === "Sealand")) > 1.5,
  "Elite finishers must gain a scorer bonus against extremely weak defences.",
);
assert.ok(
  context.__matchupScorerMultiplier(dukeProfile, australiaForWeight, runtimeTeams.find((team) => team.name === "Sealand")) <= 1,
  "Average finishers must not receive the elite weak-opponent bonus.",
);
assert.equal(context.__teamGoalShareMultiplier(dukeProfile, 4, 6), 0.58);
assert.equal(context.__teamGoalShareMultiplier(haalandProfile, 4, 6), 0.76);

const penaltySample = Array.from(
  { length: 3000 },
  () => context.__weightedScorer(franceForFootCheck, scorerSampleRandom, [], new Map(), "penalty"),
);
assert.ok(countScorer(penaltySample, "Kylian Mbappé") / penaltySample.length > 0.55, "The designated taker must receive most penalty goals.");
const savedRealNames = context.__runtimeState.settings.realNames;
context.__runtimeState.settings.realNames = false;
const generatedProfilesFirst = JSON.parse(JSON.stringify(context.__playerProfilesForTeam(franceForFootCheck)));
const generatedProfilesSecond = JSON.parse(JSON.stringify(context.__playerProfilesForTeam(franceForFootCheck)));
assert.deepEqual(generatedProfilesFirst, generatedProfilesSecond, "Generated player attributes must be stable.");
const generatedGoalkeepers = new Set(generatedProfilesFirst.filter((profile) => profile.position === "GK").map((profile) => profile.name));
const generatedScorers = sampleScorers(franceForFootCheck, 10000);
assert.ok(generatedScorers.filter((name) => generatedGoalkeepers.has(name)).length <= 1, "Goalkeepers must almost never score normal goals.");
context.__runtimeState.settings.realNames = savedRealNames;
const compatibleSave = JSON.parse(JSON.stringify(context.__runtimeState));
compatibleSave.settings = { realNames: false };
context.localStorage.setItem(context.__storageKey, JSON.stringify(compatibleSave));
const reloadedSave = context.__loadState();
assert.equal(reloadedSave.drawSeed, compatibleSave.drawSeed, "An existing version-2 save must reload with its seed intact.");
assert.equal(reloadedSave.rounds[0].length, 128, "An existing save must retain the complete opening round.");
assert.equal(reloadedSave.settings.realNames, true, "Real-name player profiles must remain enabled after reload.");
assert.equal(reloadedSave.settings.goals, "normal", "New default settings must merge into an existing save.");
assert.ok(turkeyPlayers.includes("Arda Güler"));
assert.ok(uruguayPlayers.includes("Federico Valverde"));
assert.ok(ivoryCoastPlayers.includes("Amad Diallo"));
assert.ok(usaPlayers.includes("Christian Pulisic"));
assert.equal(context.__preferredPenaltyFoot(runtimeTeams.find((team) => team.name === "USA"), "Cavan Sullivan", () => 0.9), "left");
assert.ok(italyPlayers.length >= 11);
assert.ok(japanPlayers.includes("Takefusa Kubo"));
assert.equal(context.__preferredPenaltyFoot(runtimeTeams.find((team) => team.name === "Japan"), "Takefusa Kubo", () => 0.9), "left");
assert.equal(context.__scoringRunBrake(10), 1, "Tournament totals must not be hard-capped.");
assert.doesNotThrow(() => context.__renderChampionConfetti("team-1"), "Champion confetti must render without crashing the winner screen.");
const portugalPlayers = runtimeTeams.find((team) => team.name === "Portugal").players;
assert.ok(portugalPlayers.includes("Carlos Forbs"));
assert.equal(context.__preferredPenaltyFoot(runtimeTeams.find((team) => team.name === "Portugal"), "Carlos Forbs", () => 0.9), "left");
const belgiumPlayers = runtimeTeams.find((team) => team.name === "Belgium").players;
assert.ok(belgiumPlayers.includes("Jérémy Doku") && belgiumPlayers.includes("Romelu Lukaku"));
assert.ok(runtimeTeams.find((team) => team.name === "England").players.includes("Bukayo Saka"));
assert.ok(runtimeTeams.find((team) => team.name === "Switzerland").players.includes("Breel Embolo"));
const spainPlayers = runtimeTeams.find((team) => team.name === "Spain").players;
assert.ok(spainPlayers.includes("Lamine Yamal") && spainPlayers.includes("Fabián Ruiz"));
const argentinaPlayers = runtimeTeams.find((team) => team.name === "Argentina").players;
const francePlayers = runtimeTeams.find((team) => team.name === "France").players;
const norwayPlayers = runtimeTeams.find((team) => team.name === "Norway").players;
const croatiaPlayers = runtimeTeams.find((team) => team.name === "Croatia").players;
assert.ok(argentinaPlayers.includes("Lionel Messi"));
assert.ok(francePlayers.includes("Kylian Mbappé"));
assert.ok(norwayPlayers.includes("Erling Haaland"));
assert.ok(croatiaPlayers.includes("Joško Gvardiol"));
const fifaTeams = runtimeTeams.filter((team) => team.confed !== "INVITED");
const guestTeams = runtimeTeams.filter((team) => team.confed === "INVITED");
assert.equal(fifaTeams.filter((team) => team.fifaRank).length, 211, "Every FIFA member needs a FIFA rank.");
assert.equal(fifaTeams.filter((team) => team.officialFifaRank).length, 211, "Every FIFA member needs an official display rank.");
assert.equal(new Set(fifaTeams.map((team) => team.officialFifaRank)).size, 211, "Official FIFA display ranks must be unique.");
assert.equal(fifaTeams.find((team) => team.name === "Argentina").officialFifaRank, 1);
assert.equal(fifaTeams.find((team) => team.name === "Portugal").officialFifaRank, 5);
assert.equal(fifaTeams.find((team) => team.name === "Brazil").officialFifaRank, 6);
assert.equal(fifaTeams.find((team) => team.name === "Germany").officialFifaRank, 10);
assert.equal(fifaTeams.find((team) => team.name === "Mexico").officialFifaRank, 14);
assert.ok(fifaTeams.every((team) => team.rating >= 35 && team.rating <= 100));
assert.ok(guestTeams.every((team) => team.rating >= 18 && team.rating <= 34));
const simulationRatingKeys = ["overall", "attack", "midfield", "defence", "goalkeeper", "squadDepth", "experience", "penalties", "discipline"];
assert.ok(runtimeTeams.every((team) => simulationRatingKeys.every((key) => Number.isFinite(team.simulationRatings[key]))));
assert.ok(runtimeTeams.every((team) => team.simulationRatings.discipline >= 35 && team.simulationRatings.discipline <= 95));
assert.equal(runtimeTeams.find((team) => team.name === "Argentina").rating, 90);
assert.equal(runtimeTeams.findIndex((team) => team.name === "Argentina") + 1, 8);
assert.equal(runtimeTeams.find((team) => team.name === "Germany").rating, 89);
assert.equal(runtimeTeams.find((team) => team.name === "Mexico").rating, 85);
assert.equal(runtimeTeams.find((team) => team.name === "Norway").rating, 88);
assert.equal(runtimeTeams.find((team) => team.name === "Iran").rating, 80);
assert.equal(runtimeTeams.find((team) => team.name === "Denmark").rating, 81);
assert.equal(runtimeTeams.find((team) => team.name === "Ecuador").rating, 81);
assert.ok(runtimeTeams.find((team) => team.name === "Argentina").rating < runtimeTeams.find((team) => team.name === "France").rating);
assert.ok(runtimeTeams.find((team) => team.name === "France").rating > runtimeTeams.find((team) => team.name === "Peru").rating);
assert.ok(runtimeTeams.find((team) => team.name === "Peru").rating > runtimeTeams.find((team) => team.name === "Sri Lanka").rating);
const england = runtimeTeams.find((team) => team.name === "England");
const sealand = runtimeTeams.find((team) => team.name === "Sealand");
const moldova = runtimeTeams.find((team) => team.name === "Moldova");
const israel = runtimeTeams.find((team) => team.name === "Israel");
const italy = runtimeTeams.find((team) => team.name === "Italy");
const ireland = runtimeTeams.find((team) => team.name === "Republic of Ireland");
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__applyScorelineCeiling(ireland, italy, 0, 8))),
  { homeGoals: 0, awayGoals: 5 },
  "Established countries must be protected from implausible eight-goal defeats.",
);
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__applyScorelineCeiling(sealand, italy, 0, 8))),
  { homeGoals: 0, awayGoals: 8 },
  "Huge scorelines should remain possible against guest and micronation teams.",
);
const roundsBeforeSuspensionCheck = context.__runtimeState.rounds;
context.__runtimeState.rounds = [[{
  homeId: england.id,
  awayId: sealand.id,
  result: {
    winnerId: england.id,
    redCards: [{ teamId: england.id, side: "home", player: "Cole Palmer", minute: 71 }],
  },
}]];
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__suspendedPlayersForTeam(england.id, 1))),
  ["Cole Palmer"],
  "A player sent off must be suspended for their team's next match.",
);
context.__runtimeState.rounds = roundsBeforeSuspensionCheck;
const goldenBootProof = context.__calculateTopGoalscorer([
  [{
    homeId: england.id,
    awayId: sealand.id,
    result: {
      revealed: true,
      homeEvents: [{ scorer: "Bukayo Saka" }, { scorer: "Bukayo Saka" }],
      awayEvents: [{ scorer: "Alex Mercer" }],
    },
  }],
  [{
    homeId: sealand.id,
    awayId: england.id,
    result: {
      revealed: true,
      homeEvents: [],
      awayEvents: [{ scorer: "Bukayo Saka" }],
      shootout: [{ player: "Alex Mercer", scored: true }],
    },
  }],
]);
assert.deepEqual(
  { player: goldenBootProof.player, teamId: goldenBootProof.teamId, goals: goldenBootProof.goals },
  { player: "Bukayo Saka", teamId: england.id, goals: 3 },
  "The Golden Boot must count match goals across rounds and exclude shootout kicks.",
);
const specialGoalTable = context.__calculateGoalscorerTable([[{
  homeId: england.id,
  awayId: sealand.id,
  result: {
    revealed: true,
    homeEvents: [
      { scorer: "Bukayo Saka", minute: 110, goalType: "openPlay" },
      { scorer: "Alex Mercer (OG)", minute: 72, goalType: "ownGoal", ownGoal: true },
    ],
    awayEvents: [],
  },
}]]);
assert.equal(specialGoalTable.find((entry) => entry.player === "Bukayo Saka").goals, 1, "Extra-time goals must count.");
assert.ok(!specialGoalTable.some((entry) => entry.player.includes("OG")), "Own goals must not enter Golden Boot totals.");
assert.deepEqual(
  JSON.parse(JSON.stringify(context.__calculateGoalscorerTable(JSON.parse(JSON.stringify([[{
    homeId: england.id,
    awayId: sealand.id,
    result: { revealed: true, homeEvents: [{ scorer: "Bukayo Saka" }], awayEvents: [] },
  }]]))))),
  JSON.parse(JSON.stringify(context.__calculateGoalscorerTable([[{
    homeId: england.id,
    awayId: sealand.id,
    result: { revealed: true, homeEvents: [{ scorer: "Bukayo Saka" }], awayEvents: [] },
  }]]))),
  "Serializing and restoring a tournament must not duplicate player statistics.",
);
assert.ok(context.__playerProfilesForTeam(moldova).some((profile) => profile.name === "Amenyah"), "Amenyah must be in Moldova's match pool.");
context.__runtimeState.settings.upset = "balanced";
context.__runtimeState.settings.goals = "normal";
assert.ok(
  context.__createFirstRound(12345).some((match) => match.homeId === israel.id || match.awayId === israel.id),
  "The default tournament draw must include every listed country.",
);
assert.ok(israel.rating <= 35, "Rating adjustments should keep Israel at the visible rating floor.");
assert.ok(israel.simulationRatings.attack <= 12, "Israel attack rating adjustment should use normal simulation ratings.");
assert.ok(israel.simulationRatings.defence <= 12, "Israel defence rating adjustment should use normal simulation ratings.");
assert.ok(israel.simulationRatings.goalkeeper <= 12, "Israel goalkeeper rating adjustment should use normal simulation ratings.");

const playbackMatch = { id: "live-fast-equivalence", homeId: england.id, awayId: sealand.id };
const playbackResult = context.__simulateMatch(playbackMatch, 0);
playbackMatch.result = playbackResult;
const playbackSnapshot = JSON.stringify(playbackResult);
const playbackEvents = context.__playbackEvents(playbackMatch);
assert.equal(JSON.stringify(playbackResult), playbackSnapshot, "Live playback must not resimulate or mutate the fast result.");
assert.equal(
  playbackEvents.filter((event) => event.type === "goal").length,
  playbackResult.homeGoals + playbackResult.awayGoals,
  "Live and fast simulation must use the same goal events.",
);

let sealandWins = 0;
let redCardMatches = 0;
let penaltyShootouts = 0;
let penaltyKicks = 0;
let scoredPenaltyKicks = 0;
let savedPenaltyMisses = 0;
let widePenaltyMisses = 0;
for (let index = 0; index < 500; index += 1) {
  const result = context.__simulateMatch({
    id: `giant-killing-proof-${index}`,
    homeId: england.id,
    awayId: sealand.id,
  }, 0);
  assert.equal(result.homeEvents.length, result.homeGoals);
  assert.equal(result.awayEvents.length, result.awayGoals);
  const goalMinutes = [...result.homeEvents, ...result.awayEvents].map((goal) => goal.minute);
  assert.equal(
    new Set(goalMinutes).size,
    goalMinutes.length,
    "Two goals in the same match must not share a displayed minute.",
  );
  for (const card of result.redCards) {
    const laterGoals = card.side === "home" ? result.homeEvents : result.awayEvents;
    assert.ok(
      !laterGoals.some((goal) => goal.minute > card.minute && goal.scorer === card.player),
      "A dismissed player cannot score later in the match.",
    );
  }
  if (result.winnerId === sealand.id) sealandWins += 1;
  if (result.redCards.length) redCardMatches += 1;
  if (result.penalties) {
    penaltyShootouts += 1;
    penaltyKicks += result.shootout.length;
    scoredPenaltyKicks += result.shootout.filter((kick) => kick.scored).length;
    assert.ok(result.shootout.length >= 10 && result.shootout.length % 2 === 0);
    assert.ok(result.shootout.every((kick, kickIndex) => (
      kick.side === (kickIndex % 2 === 0 ? "home" : "away")
      && ["left", "centre", "right", "wide-left", "wide-right"].includes(kick.direction)
      && ["left", "centre", "right"].includes(kick.keeperDive)
      && ["left", "right"].includes(kick.foot)
      && typeof kick.player === "string"
      && kick.player.length > 2
      && (kick.scored ? kick.missType === null : ["save", "wide"].includes(kick.missType))
    )));
    result.shootout.filter((kick) => kick.scored).forEach((kick) => {
      assert.notEqual(
        kick.direction,
        kick.keeperDive,
        "A successful penalty cannot show the keeper covering the shot direction.",
      );
    });
    result.shootout.filter((kick) => !kick.scored).forEach((kick) => {
      if (kick.missType === "wide") {
        widePenaltyMisses += 1;
        assert.ok(kick.direction === "wide-left" || kick.direction === "wide-right");
      } else {
        savedPenaltyMisses += 1;
        assert.equal(kick.direction, kick.keeperDive);
      }
    });
    assert.equal(result.shootout.filter((kick) => kick.side === "home" && kick.scored).length, result.penalties.home);
    assert.equal(result.shootout.filter((kick) => kick.side === "away" && kick.scored).length, result.penalties.away);
  }
}

assert.ok(sealandWins > 0, "Balanced mode must allow a minnow to eliminate England.");
assert.ok(sealandWins < 50, "Balanced mode must keep extreme upsets exceptional rather than routine.");
assert.ok(redCardMatches > 0, "The simulation must be capable of producing red cards.");
assert.ok(penaltyShootouts > 0, "The simulation must produce animated penalty sequences.");
assert.ok(savedPenaltyMisses > 0, "Shootouts must include visible goalkeeper saves.");
assert.ok(widePenaltyMisses > 0, "Shootouts must include penalties sent wide.");
assert.ok(scoredPenaltyKicks / penaltyKicks > 0.65 && scoredPenaltyKicks / penaltyKicks < 0.86, "Shootout conversion should remain plausible.");

const penaltySceneProof = mockElement();
const shootoutMarkProof = {
  shootout: Array.from({ length: 24 }, (_, index) => ({
    side: index % 2 === 0 ? "home" : "away",
    round: Math.floor(index / 2) + 1,
    scored: index % 3 !== 0,
  })),
  shootoutIndex: 0,
  shootoutStep: "setup",
};
let homeShootoutMarks = context.__shootoutMarksMarkup(shootoutMarkProof, "home");
let awayShootoutMarks = context.__shootoutMarksMarkup(shootoutMarkProof, "away");
assert.equal((homeShootoutMarks.match(/penalty-mark/g) || []).length, 5, "Shootouts should begin with five home markers.");
assert.equal((awayShootoutMarks.match(/penalty-mark/g) || []).length, 5, "Shootouts should begin with five away markers.");
assert.equal((homeShootoutMarks.match(/pending/g) || []).length, 5, "All opening home markers should begin empty.");
assert.equal((awayShootoutMarks.match(/pending/g) || []).length, 5, "All opening away markers should begin empty.");
shootoutMarkProof.shootoutStep = "result";
homeShootoutMarks = context.__shootoutMarksMarkup(shootoutMarkProof, "home");
awayShootoutMarks = context.__shootoutMarksMarkup(shootoutMarkProof, "away");
assert.equal((homeShootoutMarks.match(/penalty-mark/g) || []).length, 5);
assert.equal((homeShootoutMarks.match(/miss/g) || []).length, 1);
assert.equal((homeShootoutMarks.match(/pending/g) || []).length, 4);
assert.equal((awayShootoutMarks.match(/pending/g) || []).length, 5);
shootoutMarkProof.shootoutIndex = 10;
shootoutMarkProof.shootoutStep = "setup";
homeShootoutMarks = context.__shootoutMarksMarkup(shootoutMarkProof, "home");
awayShootoutMarks = context.__shootoutMarksMarkup(shootoutMarkProof, "away");
assert.equal((homeShootoutMarks.match(/penalty-mark/g) || []).length, 6, "Sudden death should add a sixth home marker.");
assert.equal((awayShootoutMarks.match(/penalty-mark/g) || []).length, 6, "Sudden death should add a sixth away marker.");
assert.equal((homeShootoutMarks.match(/pending/g) || []).length, 1);
assert.equal((awayShootoutMarks.match(/pending/g) || []).length, 1);
shootoutMarkProof.shootoutStep = "result";
homeShootoutMarks = context.__shootoutMarksMarkup(shootoutMarkProof, "home");
assert.equal((homeShootoutMarks.match(/penalty-mark/g) || []).length, 6);
assert.equal((homeShootoutMarks.match(/pending/g) || []).length, 0);
shootoutMarkProof.shootoutIndex = 20;
shootoutMarkProof.shootoutStep = "setup";
homeShootoutMarks = context.__shootoutMarksMarkup(shootoutMarkProof, "home");
assert.equal((homeShootoutMarks.match(/penalty-mark/g) || []).length, 11, "Long shootouts should retain prior markers and add the next sudden-death slot.");
assert.equal((homeShootoutMarks.match(/pending/g) || []).length, 1);
context.__setPenaltySceneElement(penaltySceneProof, {
  direction: "left", keeperDive: "left", foot: "right", scored: false, missType: "save",
}, "result");
assert.equal(penaltySceneProof.dataset.result, "save");
context.__setPenaltySceneElement(penaltySceneProof, {
  direction: "centre", keeperDive: "centre", foot: "right", scored: false, missType: "save",
}, "flight");
assert.equal(penaltySceneProof.dataset.result, "save", "A saved kick must use its save trajectory during ball flight.");
assert.equal(penaltySceneProof.dataset.direction, "centre");
assert.equal(penaltySceneProof.dataset.dive, "centre");
context.__setPenaltySceneElement(penaltySceneProof, {
  direction: "wide-right", keeperDive: "left", foot: "left", scored: false, missType: "wide",
}, "result");
assert.equal(penaltySceneProof.dataset.result, "wide");
assert.equal(penaltySceneProof.dataset.direction, "wide-right");
assert.match(cleanCssSource, /data-state="flight"\]\[data-result="save"\]\[data-direction="centre"\]/,
  "A middle save must visibly meet the goalkeeper instead of entering the net.");
const deterministicMatch = { id: "same-seed-scorer-proof", homeId: franceForFootCheck.id, awayId: sealand.id };
context.__runtimeState.drawSeed = 987654321;
const deterministicA = context.__simulateMatch(deterministicMatch, 0);
const deterministicB = context.__simulateMatch(deterministicMatch, 0);
assert.deepEqual(
  JSON.parse(JSON.stringify(deterministicA)),
  JSON.parse(JSON.stringify(deterministicB)),
  "The same seed, settings and fixture must reproduce the same score and scorer events.",
);
const pauseCheck = context.__exercisePause();
assert.equal(pauseCheck.paused, true, "Pausing must stop the live simulation frame.");
assert.equal(pauseCheck.resumed, true, "Resuming must preserve the simulation position.");

const playbackRegress = context.__playbackRegressionTest();
assert.equal(playbackRegress.commentaryAdvanced, true, "Commentary mode must advance beyond 00:00.");
assert.equal(playbackRegress.commentaryMinute10, true, "Commentary mode must reach at least minute 10.");
assert.equal(playbackRegress.commentaryRendered, true, "Commentary mode must render commentary lines.");
assert.equal(playbackRegress.silentStall, true, "Silent events must not cause the playback loop to stall.");
assert.equal(playbackRegress.keyAdvanced, true, "Key mode must advance the playback timeline.");
assert.equal(playbackRegress.extendedAdvanced, true, "Extended mode must advance the playback timeline.");
assert.equal(playbackRegress.pauseWorks, true, "Pausing must stop the playback frame.");
assert.equal(playbackRegress.resumeWorks, true, "Resuming must restart from the paused position.");
assert.equal(playbackRegress.errors.length, 0, "Playback regression test must produce zero errors.");

console.log("256 TEAMS WC smoke test passed.");
console.log("256 teams = 211 FIFA members + 45 guest sides.");
console.log(`Giant-killing proof: Sealand beat England ${sealandWins} times in 500 balanced simulations.`);
console.log(`Discipline proof: ${redCardMatches} of those simulations included a red card.`);
console.log(`Shootout proof: ${penaltyShootouts} included complete kick-by-kick penalty data.`);
console.log("Determinism proof: identical seed and fixture reproduced the complete score and scorer event stream.");
console.log("Save proof: the existing version-2 save shape reloaded and merged current defaults.");
