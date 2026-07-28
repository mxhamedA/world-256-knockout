import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "clean.css"), "utf8");
const engine = fs.readFileSync(path.join(root, "simulation-engine.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const context = { console };
vm.createContext(context);
vm.runInContext(`${engine}\nglobalThis.__createSide = createPossessionSide;`, context);

const positions = ["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"];
const starters = positions.map((position, index) => ({
  id: `starter-${index}`,
  name: `Starter ${index + 1}`,
  position,
  overall: 74,
  startingXI: true,
}));
const bench = positions.slice(0, 7).map((position, index) => ({
  id: `bench-${index}`,
  name: `Bench ${index + 1}`,
  position,
  overall: 99,
  startingXI: false,
}));
const team = {
  id: "wc22-test",
  name: "WC22 Test",
  rating: 80,
  selectedFormation: "4-4-2",
  simulationRatings: {
    overall: 80, attack: 80, midfield: 80, defence: 80, goalkeeper: 80,
    squadDepth: 80, experience: 80, penalties: 80, discipline: 80,
  },
};
const side = context.__createSide(team, [...starters, ...bench], "home", "balanced");
assert.equal(side.formation, "4-4-2");
assert.deepEqual(
  Array.from(side.players, (player) => player.name).sort(),
  starters.map((player) => player.name).sort(),
  "The possession engine must use the chosen XI even when higher-rated bench players exist.",
);
for (const formation of ["4-1-2-1-2", "4-3-2-1", "4-1-4-1", "3-4-3", "5-3-2", "5-2-2-1", "5-2-3"]) {
  team.selectedFormation = formation;
  const formationSide = context.__createSide(team, [...starters, ...bench], "home", "balanced");
  assert.equal(formationSide.formation, formation);
  assert.equal(formationSide.players.length, 11);
}
team.selectedFormation = "4-3-3";
team.liveOrderedStarterNames = starters.map((player) => player.name);
[team.liveOrderedStarterNames[5], team.liveOrderedStarterNames[9]] = [
  team.liveOrderedStarterNames[9],
  team.liveOrderedStarterNames[5],
];
const swappedSide = context.__createSide(team, [...starters, ...bench], "home", "balanced");
assert.equal(swappedSide.players.find((player) => player.index === 5)?.name, "Starter 10");
assert.equal(swappedSide.players.find((player) => player.index === 9)?.name, "Starter 6");
team.liveMissingSlotIndexes = [9];
team.liveMissingPlayerNames = ["Starter 6"];
const reducedSide = context.__createSide(team, [...starters, ...bench], "home", "balanced");
assert.equal(reducedSide.players.length, 10, "A dismissal or unresolved injury must leave the side with ten players.");
assert.ok(!reducedSide.players.some((player) => player.name === "Starter 6"));
team.liveMissingSlotIndexes = [];
team.liveMissingPlayerNames = [];
team.liveOrderedStarterNames = [];

assert.match(app, /const RETRO_MANAGER_FORMATIONS = Object\.freeze\(\[[\s\S]*"4-1-2-1-2"[\s\S]*"3-4-3"[\s\S]*"5-2-2-1"[\s\S]*\]\)/);
assert.match(app, /retroTournament\.managerLineups \|\|= \{\}/);
assert.match(app, /function retroManagerLineupForTeam[\s\S]*\[2010, 2014, 2016, 2018, 2022\]\.includes/);
assert.match(app, /function retroManagerSquadForTeam[\s\S]*sameGroupPosition \|\| profile\?\.position[\s\S]*squadGroup: sourceGroup/);
assert.match(app, /function retroSelectBestStarterNumbers[\s\S]*Rectangular Hungarian assignment[\s\S]*playerIndexBySlot/);
assert.match(app, /const useTabbedManager = Boolean\(managedTeam && opponentTeam && retroManagerLineupForTeam\(managedTeam\)\)/);
assert.match(app, /const RETRO_MANAGER_PITCH_POSITIONS = Object\.freeze/);
assert.match(app, /const RETRO_LINEUP_SLOT_ORDER_VERSION = 4/);
assert.match(app, /function retroNormalizeStarterSlotOrder[\s\S]*retroOrderStarterNumbers\(selectedPlayers, formation\)/);
assert.match(app, /saved\.slotOrderVersion !== RETRO_LINEUP_SLOT_ORDER_VERSION[\s\S]*retroSelectBestStarterNumbers/);
assert.match(app, /const lineup = \{ formation, starters, slotOrderVersion: RETRO_LINEUP_SLOT_ORDER_VERSION \}/);
assert.match(app, /class="retro-pitch-player/);
assert.match(app, /data-retro-lineup-tab="managed"/);
assert.match(app, /data-retro-lineup-tab="opponent"/);
assert.match(app, /function retroOpponentPitchMarkup[\s\S]*retro-manager-layout[\s\S]*retro-manager-section is-bench/);
assert.match(app, /addEventListener\("dragstart"/);
assert.match(app, /addEventListener\("drop"/);
assert.match(app, /function applyRetroLineupSwap[\s\S]*lineup\.starters\[firstIndex\]/);
assert.match(app, /function commitRetroLineupChange[\s\S]*saveState\(\);[\s\S]*showToast\(message\)/);
assert.match(app, /initializeLivePlayerRatings\(match\)/);
assert.match(app, /adjustLivePlayerRating\(scorer, 1, "Goal"/);
assert.match(app, /adjustLivePlayerRating\(dismissed, -1\.5, "Sent off"\)/);
assert.match(app, /adjustLivePlayerRating\(goalkeeper\?\.name, 0\.15, "Save"/);
assert.match(app, /entry\.rating = Number\(simulationClamp\(entry\.rating \+ delta, 3, 10\)\.toFixed\(2\)\)/);
assert.match(app, /ratingActionIds: \[\.\.\.\(livePlayback\.ratingActionIds \|\| \[\]\)\]/);
assert.match(app, /const importance = receivePresentationAction\(action, false\);[\s\S]*updateLiveRatingsForAction\(action\)/);
assert.match(app, /function fastForwardLivePlayerRatings[\s\S]*updateLiveRatingsForAction\(action, false\)/);
assert.match(app, /fastForwardLivePlayerRatings\(\);[\s\S]*updateLiveRatingsForEvent\(event, false\)/);
assert.match(app, /if \(livePlayback\.playerRatings\) match\.result\.playerRatings = livePlayback\.playerRatings/);
assert.match(app, /function retroSortedBenchPlayers[\s\S]*positionOrder = \{ GK: 0, DF: 1, MF: 2, FW: 3 \}/);
assert.match(app, /function retroLivePitchRatingsSideMarkup[\s\S]*retro-manager-layout is-live/);
assert.match(app, /const previousBenchScroll = els\.retroMatchLineupsBody[\s\S]*nextBench\.scrollTop = previousBenchScroll/);
assert.doesNotMatch(app, /function retroPitchPlayerMarkup[\s\S]*delta\.toFixed\(2\)[\s\S]*function retroSortedBenchPlayers/);
assert.match(app, /function retroRatingTone[\s\S]*rating >= 8[\s\S]*rating >= 7[\s\S]*rating >= 6[\s\S]*rating < 6/);
assert.match(app, /starterSlots = starterSlots\.map[\s\S]*candidate\.name === player\.name[\s\S]*number: player\.number \?\? squadPlayer\?\.number/);
assert.match(app, /const shirtNumber = player\.number \?\? "—"/);
assert.doesNotMatch(app, /<span><small>YOU MANAGE<\/small>/);
assert.match(app, /class="retro-pitch-corner-control"[\s\S]*data-retro-manager-formation/);
assert.match(app, /const LIVE_MATCH_MANAGEMENT_UI_ENABLED = true/);
assert.doesNotMatch(app, /retro-pitch-corner-control[\s\S]{0,180}<span>Formation<\/span>/);
assert.match(app, /function retroOrderStartersForFormationChange[\s\S]*unchangedBackFive[\s\S]*nextSlots\.slice\(5\)/);
assert.match(app, /const RETRO_POSITION_FIT = Object\.freeze[\s\S]*LB: Object\.freeze[\s\S]*CDM: Object\.freeze[\s\S]*RW: Object\.freeze/);
assert.match(app, /function retroPlayerPositionFit[\s\S]*player\.positions[\s\S]*fitTable\[position\]/);
assert.match(app, /retroFormationDefenderCount\(currentFormation\) !== 4[\s\S]*retroFormationDefenderCount\(nextFormation\) !== 4/);
assert.match(app, /managerSubstitutions = \{[\s\S]*activeStarters:[\s\S]*used: 0,[\s\S]*stoppages: 0/);
assert.match(app, /function retroLiveSubstitutionLimits[\s\S]*substitutions: extraTimeActive \? 7 : 5[\s\S]*stoppages: extraTimeActive \? 4 : 3/);
assert.match(app, /function retroLiveSubstitutionIsFreeInterval[\s\S]*44\.5[\s\S]*89\.5[\s\S]*104\.5/);
assert.match(app, /data-retro-sub-role="out"/);
assert.match(app, /data-retro-sub-role="in"/);
assert.match(app, /stageRetroLiveSubstitution\(liveMatch, retroLiveSubOutNumber, number\)/);
assert.match(app, /function retroSubstitutionPositionsCompatible[\s\S]*outgoing\.position === "GK"[\s\S]*incoming\.position === "GK"/);
assert.match(app, /data-retro-sub-action="confirm"/);
assert.match(app, /data-retro-sub-action="cancel"/);
assert.match(app, /function retroPendingSubstitutionChanges[\s\S]*Array\.isArray\(retroLivePendingSubstitution\)/);
assert.match(app, /retroLivePendingSubstitution = \[\.\.\.pendingChanges, \{ outgoingNumber, incomingNumber \}\]/);
assert.match(app, /function applyRetroLiveSubstitutionBatch[\s\S]*substitutions\.used \+ validatedChanges\.length[\s\S]*substitutions\.stoppages \+= 1/);
assert.match(app, /data-retro-sub-action="confirm">Confirm all/);
assert.match(app, /data-retro-sub-undo-out[\s\S]*Pending substitution removed/);
assert.match(app, /retroLiveSubInNumber !== null[\s\S]*stageRetroLiveSubstitution\(liveMatch, number, retroLiveSubInNumber\)/);
assert.match(app, /retroLiveSubDrag = \{[\s\S]*dataset\.retroSubRole/);
assert.match(app, /function updateRetroOppositionManagement[\s\S]*retroPlayerPositionFit\(candidate, player\.position\)[\s\S]*fit >= 76/);
assert.match(app, /oppositionManagement = \{[\s\S]*nextSubIndex: 0/);
assert.match(app, /match\.result\.retroFinalManagement = Object\.fromEntries\(finalManagement\)/);
assert.match(app, /function liveSubstitutionExpectedGoalFactors[\s\S]*qualityDifference[\s\S]*freshness[\s\S]*for: simulationClamp[\s\S]*against: simulationClamp/);
assert.match(app, /const RETRO_FORMATION_TACTIC_SYNERGY = Object\.freeze[\s\S]*"4-3-3"[\s\S]*"5-3-2"/);
assert.match(app, /function retroManagedTeamSheetImpact[\s\S]*fitScore[\s\S]*selectionScore[\s\S]*synergyScore[\s\S]*underdogLeverage/);
assert.match(app, /function applyControlledTacticalMatchup[\s\S]*teamSheetImpact\.attack[\s\S]*teamSheetImpact\.defence/);
assert.match(app, /function liveSubstitutionExpectedGoalFactors[\s\S]*positionFit < 76[\s\S]*managedExecution[\s\S]*0\.78, 1\.25[\s\S]*0\.76, 1\.24/);
assert.match(app, /adjustedXG\.homeXG \*= homeSubstitutionImpact\.for \* awaySubstitutionImpact\.against/);
assert.match(app, /function applyRetroLivePositionSwap[\s\S]*activeStarters\[firstIndex\][\s\S]*activeStarters\[secondIndex\]/);
assert.match(app, /function rebuildLiveMatchAfterTacticChange[\s\S]*activeHighlight = null[\s\S]*const resultCutoff = displayedCutoff[\s\S]*livePlayback\.minute = displayedCutoff/);
assert.match(app, /match\.result = mergeLiveTacticalResult[\s\S]*repairLiveGoalParticipants\(match\)/);
assert.doesNotMatch(app, /function rebuildLiveMatchAfterTacticChange[\s\S]{0,900}Math\.max\([\s\S]{0,120}livePlayback\.minute/);
assert.match(app, /const previewSlots = \[\.\.\.starterSlots\][\s\S]*pendingChanges\.forEach[\s\S]*previewSlots\[slot\] = incoming/);
assert.match(app, /function retroPitchMissingPlayerMarkup[\s\S]*Sent off[\s\S]*Injured/);
assert.match(app, /match\.result\.substitutions\.push\(substitutionEvent\)[\s\S]*appendLiveTimelineEvent\(substitutionEvent\)/);
assert.match(app, /function isVisibleMatchFactEvent[\s\S]*\["goal", "red", "injury"\]/);
assert.doesNotMatch(app, /function isVisibleMatchFactEvent[\s\S]{0,160}substitution/);
assert.doesNotMatch(app, /function renderEvents[\s\S]*result\.substitutions[\s\S]*function renderChampionConfetti/);
assert.match(app, /function unavailablePlayersForTeam[\s\S]*suspendedPlayersForTeam[\s\S]*injuredPlayersForTeam/);
assert.match(app, /removeInjuries: false/);
assert.match(html, /id="removeInjuriesSetting"[\s\S]*Remove injuries[\s\S]*id="removeInjuriesLabel">Injuries on/);
assert.match(app, /state\.settings\.removeInjuries !== true && injuryRandom\(\) < 0\.075/);
assert.match(app, /function injuredPlayersForTeam[\s\S]*state\.settings\.removeInjuries === true\) return \[\]/);
assert.match(app, /removeInjuriesSetting\?\.addEventListener[\s\S]*REMOVE_INJURIES_STORAGE_KEY[\s\S]*Injuries removed/);
assert.match(app, /function onPitchPlayerProfiles[\s\S]*markedStarters\.length \? markedStarters : squadProfiles/);
assert.match(app, /function eligibleScorerProfiles[\s\S]*const activeProfiles = onPitchPlayerProfiles\(team\)/);
assert.match(app, /function createRedCard[\s\S]*onPitchPlayerProfiles\(team\)/);
assert.match(app, /function repairLiveGoalParticipants[\s\S]*retroPlayersOnPitchAtMinute[\s\S]*eligibleNames\.has\(event\.scorer\)/);
assert.match(app, /function startLivePlayback\(match\)[\s\S]*repairLiveGoalParticipants\(match\)[\s\S]*createMatch2dState\(match\)/);
assert.match(engine, /result\.injuries \|\| \[\][\s\S]*event: \{ \.\.\.event, authoritative: true \}/);
assert.match(app, /Live matchday squad/);
assert.match(engine, /"4-1-2-1-2": Object\.freeze/);
assert.match(engine, /"5-2-2-1": Object\.freeze/);
assert.match(engine, /wild: \{ baseXG: 1\.55, minimumXG: 0\.16, maximumXG: 6\.4 \}/);
assert.match(css, /Shared World Cup manager, recoloured and reshaped by each edition below/);
assert.match(css, /retro-2010-active[\s\S]*--q22-gold: #ffd34f/);
assert.match(css, /retro-2018-active[\s\S]*--q22-gold: #e9c477/);
assert.match(css, /Brazil 2014: deep green watercolor cards and rounded tournament controls/);
assert.match(css, /South Africa 2010: warm ticket-like panels and chunky orange controls/);
assert.match(css, /Russia 2018: folk-poster type, cream rules and compact badge shapes/);
assert.match(css, /\.retro-manager-pitch/);
assert.match(css, /\.retro-manager-layout[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(250px, 34%\)/);
assert.match(css, /\.retro-manager-section\.is-bench[\s\S]*border-left: 1px solid var\(--q22-line\)/);
assert.match(css, /\.retro-lineup-tabs/);
assert.match(css, /\.retro-pitch-player\.is-drop-target/);
assert.match(css, /\.retro-live-rating-row > b\.is-poor/);
assert.match(css, /\.retro-pitch-player i\.is-poor/);
assert.match(css, /\.retro-manager-section\.is-bench[\s\S]*height: 0;[\s\S]*min-height: 100%/);
assert.match(css, /\.retro-pitch-corner-control[\s\S]*position: absolute/);
assert.match(css, /\.retro-pitch-corner-control[\s\S]*left: 9px/);
assert.match(css, /\.retro-pitch-sub-counter[\s\S]*position: absolute/);
assert.match(css, /\.retro-pitch-sub-counter[\s\S]*"Manrope", system-ui, sans-serif/);
assert.match(css, /@media \(max-width: 1100px\)[\s\S]*\.retro-manager-layout[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);

console.log("World Cup manager and live-rating checks passed for every playable edition.");
