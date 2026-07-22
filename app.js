const STORAGE_KEY = "world-256-tournament-v1";
const LEGACY_TOURNAMENT_SESSION_KEY = "world-256-legacy-tournament-v1";
const MATCH_SPEED_STORAGE_KEY = "world-256-match-speed";
const MATCH_HIGHLIGHT_MODE_STORAGE_KEY = "world-256-highlight-mode";
const ONLINE_ROOM_SESSION_KEY = "world-256-online-room-v1";
const ONLINE_PARTY_MODE_ENABLED = false;
const STATE_VERSION = 2;

const STANDARD_TACTICS = Object.freeze({
  balanced: { name: "Balanced", passMs: 900, turnover: 0.14, width: 1, line: 0, directness: 0.48, ownXg: 1, opponentXg: 1 },
  "tiki-taka": { name: "Tiki-taka", passMs: 650, turnover: 0.09, width: 0.86, line: 5, directness: 0.2, ownXg: 1.04, opponentXg: 0.95 },
  counter: { name: "Counter", passMs: 620, turnover: 0.17, width: 1.08, line: -8, directness: 0.88, ownXg: 1.07, opponentXg: 1.03 },
  "high-press": { name: "High press", passMs: 710, turnover: 0.21, width: 0.94, line: 9, directness: 0.62, ownXg: 1.09, opponentXg: 1.07 },
  defensive: { name: "Defensive", passMs: 980, turnover: 0.11, width: 0.88, line: -12, directness: 0.34, ownXg: 0.86, opponentXg: 0.8 },
});

const STANDARD_TACTIC_MATCHUPS = Object.freeze({
  balanced: Object.freeze({ balanced: 0, "tiki-taka": -0.03, counter: 0.04, "high-press": -0.03, defensive: 0.08 }),
  "tiki-taka": Object.freeze({ balanced: 0.05, "tiki-taka": 0, counter: -0.18, "high-press": -0.1, defensive: 0.22 }),
  counter: Object.freeze({ balanced: -0.05, "tiki-taka": 0.14, counter: 0, "high-press": 0.24, defensive: -0.22 }),
  "high-press": Object.freeze({ balanced: 0.03, "tiki-taka": 0.2, counter: -0.24, "high-press": 0, defensive: 0.08 }),
  defensive: Object.freeze({ balanced: -0.06, "tiki-taka": -0.22, counter: 0.14, "high-press": -0.08, defensive: -0.04 }),
});

const $ = (selector) => document.querySelector(selector);
const els = {
  roundNav: $("#roundNav"),
  progressPercent: $("#progressPercent"),
  progressBar: $("#progressBar"),
  progressCopy: $("#progressCopy"),
  pageKicker: $("#pageKicker"),
  pageTitle: $("#pageTitle"),
  pageHeading: $("#pageHeading"),
  matchStage: $("#matchStage"),
  matchContent: $("#matchContent"),
  championStage: $("#championStage"),
  championConfetti: $("#championConfetti"),
  championFlag: $("#championFlag"),
  championName: $("#championName"),
  championTopScorerAward: $("#championTopScorerAward"),
  championTopScorerName: $("#championTopScorerName"),
  championTopScorerFlag: $("#championTopScorerFlag"),
  championTopScorerTeam: $("#championTopScorerTeam"),
  championTopScorerGoals: $("#championTopScorerGoals"),
  matchNumber: $("#matchNumber"),
  stageRoundLabel: $("#stageRoundLabel"),
  homeSeed: $("#homeSeed"),
  awaySeed: $("#awaySeed"),
  homeFlag: $("#homeFlag"),
  awayFlag: $("#awayFlag"),
  homeName: $("#homeName"),
  awayName: $("#awayName"),
  homeDiscipline: $("#homeDiscipline"),
  awayDiscipline: $("#awayDiscipline"),
  homeScore: $("#homeScore"),
  awayScore: $("#awayScore"),
  resultNote: $("#resultNote"),
  spoilerPanel: $("#spoilerPanel"),
  spoilerTitle: $("#spoilerTitle"),
  spoilerCopy: $("#spoilerCopy"),
  liveClock: $("#liveClock"),
  livePhase: $("#livePhase"),
  pauseLiveButton: $("#pauseLiveButton"),
  speedButton: $("#speedButton"),
  skipLiveButton: $("#skipLiveButton"),
  homeEventSide: $("#homeEventSide"),
  awayEventSide: $("#awayEventSide"),
  eventLiveClock: $("#eventLiveClock"),
  standardMatchTactics: $("#standardMatchTactics"),
  standardTacticButtons: $("#standardTacticButtons"),
  match2dViewer: $("#match2dViewer"),
  matchCommentaryView: $("#matchCommentaryView"),
  matchCommentaryFeed: $("#matchCommentaryFeed"),
  match2dPitch: $("#match2dPitch"),
  match2dPlayers: $("#match2dPlayers"),
  match2dBall: $("#match2dBall"),
  match2dEvent: $("#match2dEvent"),
  match2dPossession: $("#match2dPossession"),
  match2dTacticLabel: $("#match2dTacticLabel"),
  match2dJumpLabel: $("#match2dJumpLabel"),
  matchHighlightMode: $("#matchHighlightMode"),
  matchAnalysis: $("#matchAnalysis"),
  matchStatsGrid: $("#matchStatsGrid"),
  matchLineups: $("#matchLineups"),
  eventControls: $("#eventControls"),
  skipControl: $("#skipControl"),
  penaltyStage: $("#penaltyStage"),
  penaltyScene: $("#penaltyScene"),
  penaltyHomeScore: $("#penaltyHomeScore"),
  penaltyAwayScore: $("#penaltyAwayScore"),
  penaltyKickNumber: $("#penaltyKickNumber"),
  penaltyPlayer: $("#penaltyPlayer"),
  penaltyOutcome: $("#penaltyOutcome"),
  penaltyHomeName: $("#penaltyHomeName"),
  penaltyAwayName: $("#penaltyAwayName"),
  penaltyHomeMarks: $("#penaltyHomeMarks"),
  penaltyAwayMarks: $("#penaltyAwayMarks"),
  stageAction: $("#stageAction"),
  playButton: $("#playButton"),
  revealButton: $("#revealButton"),
  chaosValue: $("#chaosValue"),
  chaosCopy: $("#chaosCopy"),
  boardTitle: $("#boardTitle"),
  roundBoard: $("#roundBoard"),
  historyRoundButton: $("#historyRoundButton"),
  newerRoundButton: $("#newerRoundButton"),
  fixtureGrid: $("#fixtureGrid"),
  loadMoreButton: $("#loadMoreButton"),
  simulateRoundButton: $("#simulateRoundButton"),
  unresolvedFilter: $("#unresolvedFilter"),
  tiesRemaining: $("#tiesRemaining"),
  matchQueue: $("#matchQueue"),
  goldenBootList: $("#goldenBootList"),
  bugReportButton: $("#bugReportButton"),
  onlineBugReportButton: $("#onlineBugReportButton"),
  bugReportModal: $("#bugReportModal"),
  bugReportCloseButton: $("#bugReportCloseButton"),
  bugReportForm: $("#bugReportForm"),
  bugReportMessage: $("#bugReportMessage"),
  bugReportSubmit: $("#bugReportSubmit"),
  bugReportStatus: $("#bugReportStatus"),
  plotList: $("#plotList"),
  settingsModal: $("#settingsModal"),
  settingsButton: $("#settingsButton"),
  onlineSettingsButton: $("#onlineSettingsButton"),
  realPlayersOnlySetting: $("#realPlayersOnlySetting"),
  resetModal: $("#resetModal"),
  simulateRoundModal: $("#simulateRoundModal"),
  snapshotModal: $("#snapshotModal"),
  snapshotModalKicker: $("#snapshotModalKicker"),
  snapshotModalTitle: $("#snapshotModalTitle"),
  snapshotImage: $("#snapshotImage"),
  snapshotButton: $("#snapshotButton"),
  copySnapshotButton: $("#copySnapshotButton"),
  shareSnapshotButton: $("#shareSnapshotButton"),
  saveSnapshotButton: $("#saveSnapshotButton"),
  simulateRoundConfirmCopy: $("#simulateRoundConfirmCopy"),
  teamSearch: $("#teamSearch"),
  teamFilterControl: $("#teamFilterControl"),
  teamFilterChip: $("#teamFilterChip"),
  toast: $("#toast"),
  sidebar: $("#sidebar"),
  fieldOverview: $("#fieldOverview"),
  mainContent: $("#mainContent"),
  appShell: $("#appShell"),
  startTournamentButton: $("#startTournamentButton"),
  homeRestartButton: $("#homeRestartButton"),
  startLegacyDraftButton: $("#startLegacyDraftButton"),
  restartLegacyDraftButton: $("#restartLegacyDraftButton"),
  legacyLandingSetup: $("#legacyLandingSetup"),
  legacyDraftScreen: $("#legacyDraftScreen"),
  legacyDraftBody: $("#legacyDraftBody"),
  legacyDraftBackButton: $("#legacyDraftBackButton"),
  legacyHeaderBackButton: $("#legacyHeaderBackButton"),
  overviewSearch: $("#overviewSearch"),
  participantSections: $("#participantSections"),
  predictionModal: $("#predictionModal"),
  predictionSearch: $("#predictionSearch"),
  predictionList: $("#predictionList"),
  clearPredictionButton: $("#clearPredictionButton"),
  spectatePickerButton: $("#spectatePickerButton"),
  spectatePickerMark: $("#spectatePickerMark"),
  spectatePickerLabel: $("#spectatePickerLabel"),
  spectatePickerHint: $("#spectatePickerHint"),
  spectateModal: $("#spectateModal"),
  spectateModalTitle: $("#spectateModalTitle"),
  spectateSearch: $("#spectateSearch"),
  spectateList: $("#spectateList"),
  spectateEliminationActions: $("#spectateEliminationActions"),
  eliminationTitle: $("#eliminationTitle"),
  eliminationCopy: $("#eliminationCopy"),
  continueNeutralButton: $("#continueNeutralButton"),
  replaySpectatedButton: $("#replaySpectatedButton"),
  soundToggleButton: $("#soundToggleButton"),
  soundToggleLabel: $("#soundToggleLabel"),
  championPredictionResult: $("#championPredictionResult"),
  matchPenaltyOverlay: $("#matchPenaltyOverlay"),
  matchPenaltyScene: $("#matchPenaltyScene"),
  matchPenaltyPlayer: $("#matchPenaltyPlayer"),
  createOnlineRoomButton: $("#createOnlineRoomButton"),
  joinOnlineRoomButton: $("#joinOnlineRoomButton"),
  onlineRoomScreen: $("#onlineRoomScreen"),
  closeOnlineScreenButton: $("#closeOnlineScreenButton"),
  onlineScreenBrand: $("#onlineScreenBrand"),
  onlineScreenHeading: $("#onlineScreenHeading"),
  onlineRoomTitle: $("#onlineRoomTitle"),
  onlineRoomEntry: $("#onlineRoomEntry"),
  onlineRoomLobby: $("#onlineRoomLobby"),
  onlineDraft: $("#onlineDraft"),
  onlineMatches: $("#onlineMatches"),
  createOnlineDisplayName: $("#createOnlineDisplayName"),
  joinOnlineDisplayName: $("#joinOnlineDisplayName"),
  onlineRoomCodeInput: $("#onlineRoomCodeInput"),
  confirmCreateRoomButton: $("#confirmCreateRoomButton"),
  confirmJoinRoomButton: $("#confirmJoinRoomButton"),
  onlineRoomCode: $("#onlineRoomCode"),
  copyOnlineRoomCodeButton: $("#copyOnlineRoomCodeButton"),
  onlineRoomCount: $("#onlineRoomCount"),
  onlineLobbyDisplayName: $("#onlineLobbyDisplayName"),
  updateOnlineDisplayNameButton: $("#updateOnlineDisplayNameButton"),
  onlineMemberList: $("#onlineMemberList"),
  startOnlineDraftButton: $("#startOnlineDraftButton"),
  onlineDraftTitle: $("#onlineDraftTitle"),
  onlineDraftHead: $("#onlineDraftHead"),
  onlineDraftTurn: $("#onlineDraftTurn"),
  onlineDraftProgress: $("#onlineDraftProgress"),
  onlineRoulette: $("#onlineRoulette"),
  onlineRoulettePlayer: $("#onlineRoulettePlayer"),
  onlineRouletteFlag: $("#onlineRouletteFlag"),
  onlineRouletteTeam: $("#onlineRouletteTeam"),
  onlineRouletteMeta: $("#onlineRouletteMeta"),
  onlineDraftRosters: $("#onlineDraftRosters"),
  closeOnlineDraftRoomButton: $("#closeOnlineDraftRoomButton"),
  leaveOnlineDraftRoomButton: $("#leaveOnlineDraftRoomButton"),
  onlineMatchRound: $("#onlineMatchRound"),
  onlineMatchStatus: $("#onlineMatchStatus"),
  onlinePenaltyTesterButton: $("#onlinePenaltyTesterButton"),
  onlineRoundNextButton: $("#onlineRoundNextButton"),
  onlineActiveTeam: $("#onlineActiveTeam"),
  onlineTactics: $("#onlineTactics"),
  onlineTacticName: $("#onlineTacticName"),
  onlineTacticCopy: $("#onlineTacticCopy"),
  onlineTacticSlider: $("#onlineTacticSlider"),
  onlineTacticButtons: $("#onlineTacticButtons"),
  onlineCurrentMatch: $("#onlineCurrentMatch"),
  onlineMatchHome: $("#onlineMatchHome"),
  onlineMatchAway: $("#onlineMatchAway"),
  onlineMatchScore: $("#onlineMatchScore"),
  onlineMatchPenaltyScore: $("#onlineMatchPenaltyScore"),
  onlineMatchMinute: $("#onlineMatchMinute"),
  onlineCardRound: $("#onlineCardRound"),
  onlineCardMatchNumber: $("#onlineCardMatchNumber"),
  onlineLiveLabel: $("#onlineLiveLabel"),
  onlineMatchClock: $("#onlineMatchClock"),
  onlineMatchPhase: $("#onlineMatchPhase"),
  onlinePauseMatchButton: $("#onlinePauseMatchButton"),
  onlinePauseCountdown: $("#onlinePauseCountdown"),
  onlineMatchSpeedButton: $("#onlineMatchSpeedButton"),
  onlineHomeScorers: $("#onlineHomeScorers"),
  onlineAwayScorers: $("#onlineAwayScorers"),
  onlineHomePenaltyMarks: $("#onlineHomePenaltyMarks"),
  onlineAwayPenaltyMarks: $("#onlineAwayPenaltyMarks"),
  onlineMatchEvents: $("#onlineMatchEvents"),
  onlineMatchPresentation: $("#onlineMatchPresentation"),
  onlineCommentaryFeed: $("#onlineCommentaryFeed"),
  onlineMatchSidebar: $("#onlineMatchSidebar"),
  onlineMatchStats: $("#onlineMatchStats"),
  onlineMatchStatsGrid: $("#onlineMatchStatsGrid"),
  onlineMatchPenaltyOverlay: $("#onlineMatchPenaltyOverlay"),
  onlineMatchPenaltyScene: $("#onlineMatchPenaltyScene"),
  onlineMatchPenaltyPlayer: $("#onlineMatchPenaltyPlayer"),
  onlineReadyPanel: $("#onlineReadyPanel"),
  onlineReadyButton: $("#onlineReadyButton"),
  onlineReadyButtonLabel: $("#onlineReadyButtonLabel"),
  onlinePenaltyControl: $("#onlinePenaltyControl"),
  onlinePenaltyScene: $("#onlinePenaltyScene"),
  onlinePenaltyPrompt: $("#onlinePenaltyPrompt"),
  onlinePenaltyFeedback: $("#onlinePenaltyFeedback"),
  onlineMyMatches: $("#onlineMyMatches"),
  onlineRoundMatches: $("#onlineRoundMatches"),
  onlineOtherMatchesTitle: $("#onlineOtherMatchesTitle"),
  onlineMatchFilter: $(".online-match-filter"),
  closeOnlineMatchRoomButton: $("#closeOnlineMatchRoomButton"),
  leaveOnlineMatchRoomButton: $("#leaveOnlineMatchRoomButton"),
  onlineTeamSelectDialog: $("#onlineTeamSelectDialog"),
  onlineTeamSelectList: $("#onlineTeamSelectList"),
  closeOnlineRoomButton: $("#closeOnlineRoomButton"),
  leaveOnlineRoomButton: $("#leaveOnlineRoomButton"),
  onlineRoomMessage: $("#onlineRoomMessage"),
  onlineModeStatus: $("#onlineModeStatus"),
  onlineModeCopy: $("#onlineModeCopy"),
  onlineModeActions: $("#onlineModeActions"),
  onlineModeComingSoon: $("#onlineModeComingSoon"),
};

if (typeof els.onlineMatchSidebar?.append === "function") {
  els.onlineMatchSidebar.append(els.onlineMatchStats, els.onlineTactics);
}

if (typeof els.onlineCurrentMatch?.append === "function") {
  els.onlineCurrentMatch.append(els.onlineReadyPanel, els.onlinePenaltyControl);
}

function syncOnlinePenaltyControlSlot() {
  els.onlineCurrentMatch?.classList.toggle("has-penalty-control", Boolean(els.onlinePenaltyControl && !els.onlinePenaltyControl.hidden));
}

if (typeof MutationObserver !== "undefined" && els.onlinePenaltyControl) {
  new MutationObserver(syncOnlinePenaltyControlSlot).observe(els.onlinePenaltyControl, {
    attributes: true,
    attributeFilter: ["hidden"],
  });
  syncOnlinePenaltyControlSlot();
}

const defaultSettings = {
  upset: "balanced",
  goals: "normal",
  realNames: true,
  realPlayersOnly: true,
  sound: true,
};

const FICTIONAL_PLAYER_NAMES = new Set(["The Conspiracy"]);

const TEAM_BY_ID = new Map(TEAMS.map((team) => [team.id, team]));
const LEGACY_FORMATIONS = Object.freeze({
  "433": {
    label: "4-3-3",
    lines: [["LW", "ST", "RW"], ["CM1", "CM2", "CM3"], ["LB", "CB1", "CB2", "RB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LB", label: "LB", accepts: ["LB", "LWB"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "RB", label: "RB", accepts: ["RB", "RWB"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM3", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "LW", label: "LW", accepts: ["LW", "LM"] },
      { id: "ST", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "RW", label: "RW", accepts: ["RW", "RM"] },
    ],
  },
  "442": {
    label: "4-4-2",
    lines: [["ST1", "ST2"], ["LM", "CM1", "CM2", "RM"], ["LB", "CB1", "CB2", "RB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LB", label: "LB", accepts: ["LB", "LWB"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "RB", label: "RB", accepts: ["RB", "RWB"] },
      { id: "LM", label: "LM", accepts: ["LM", "LW"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "RM", label: "RM", accepts: ["RM", "RW"] },
      { id: "ST1", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "ST2", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "352": {
    label: "3-5-2",
    lines: [["ST1", "ST2"], ["LM", "CM1", "CM2", "CAM", "RM"], ["CB1", "CB2", "CB3"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "CB3", label: "CB", accepts: ["CB"] },
      { id: "LM", label: "LM", accepts: ["LM", "LW", "LWB"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CAM", label: "CAM", accepts: ["CAM", "CM", "SS"] },
      { id: "RM", label: "RM", accepts: ["RM", "RW", "RWB"] },
      { id: "ST1", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "ST2", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "532": {
    label: "5-3-2",
    lines: [["ST1", "ST2"], ["CM1", "CM2", "CM3"], ["LWB", "CB1", "CB2", "CB3", "RWB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LWB", label: "LWB", accepts: ["LB", "LWB", "LM"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "CB3", label: "CB", accepts: ["CB"] },
      { id: "RWB", label: "RWB", accepts: ["RB", "RWB", "RM"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM3", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "ST1", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "ST2", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "4231": {
    label: "4-2-3-1",
    lines: [["ST"], ["LM", "CAM", "RM"], ["CDM1", "CDM2"], ["LB", "CB1", "CB2", "RB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LB", label: "LB", accepts: ["LB", "LWB"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "RB", label: "RB", accepts: ["RB", "RWB"] },
      { id: "CDM1", label: "CDM", accepts: ["CDM", "CM"] },
      { id: "CDM2", label: "CDM", accepts: ["CDM", "CM"] },
      { id: "LM", label: "LM", accepts: ["LM", "LW", "CAM"] },
      { id: "CAM", label: "CAM", accepts: ["CAM", "CM", "SS"] },
      { id: "RM", label: "RM", accepts: ["RM", "RW", "CAM"] },
      { id: "ST", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "41212": {
    label: "4-1-2-1-2",
    lines: [["ST1", "ST2"], ["CAM"], ["CM1", "CM2"], ["CDM"], ["LB", "CB1", "CB2", "RB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LB", label: "LB", accepts: ["LB", "LWB"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "RB", label: "RB", accepts: ["RB", "RWB"] },
      { id: "CDM", label: "CDM", accepts: ["CDM", "CM"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CAM", label: "CAM", accepts: ["CAM", "CM", "SS"] },
      { id: "ST1", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "ST2", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "4321": {
    label: "4-3-2-1",
    lines: [["ST"], ["LF", "RF"], ["CM1", "CM2", "CM3"], ["LB", "CB1", "CB2", "RB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LB", label: "LB", accepts: ["LB", "LWB"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "RB", label: "RB", accepts: ["RB", "RWB"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM3", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "LF", label: "CF", accepts: ["CF", "SS", "LW", "CAM"] },
      { id: "RF", label: "CF", accepts: ["CF", "SS", "RW", "CAM"] },
      { id: "ST", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "343": {
    label: "3-4-3",
    lines: [["LW", "ST", "RW"], ["LM", "CM1", "CM2", "RM"], ["CB1", "CB2", "CB3"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "CB3", label: "CB", accepts: ["CB"] },
      { id: "LM", label: "LM", accepts: ["LM", "LW", "LWB"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "RM", label: "RM", accepts: ["RM", "RW", "RWB"] },
      { id: "LW", label: "LW", accepts: ["LW", "LM", "CF"] },
      { id: "ST", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "RW", label: "RW", accepts: ["RW", "RM", "CF"] },
    ],
  },
});
const LEGACY_SECONDARY_POSITION_PENALTY = 2;
const LEGACY_OUT_OF_POSITION_PENALTY = 4;
let legacySetup = { mode: "classic", formationId: "433", nationId: "england", nationSearch: "" };
const LEGACY_DATABASE = window.LEGACY_HISTORIC_DATABASE || {};
const LEGACY_NATIONS = Object.freeze(Object.fromEntries(Object.entries(LEGACY_DATABASE).map(([nationId, nation]) => [
  nationId,
  {
    ...nation,
    squads: nation.squads.map((squad) => ({
      ...squad,
      players: squad.players.map((player) => ({
        ...player,
        id: `${nationId}-${squad.year}-${player.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        year: squad.year,
        position: player.primaryPosition,
        positions: [player.primaryPosition, ...(player.secondaryPositions || [])].filter(Boolean),
        rating: player.overall,
        stats: Number.isFinite(player.attack) && Number.isFinite(player.control) && Number.isFinite(player.defence) ? {
          attack: player.attack,
          control: player.control,
          defence: player.defence,
        } : null,
      })),
    })),
  },
])));
let legacyDraft = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem("legacyDraftState"));
    if (raw && raw.nationId && LEGACY_NATIONS[raw.nationId]) {
      const nation = LEGACY_NATIONS[raw.nationId];
      const allPlayers = nation.squads.flatMap(s => s.players);
      const findPlayer = (id) => allPlayers.find(p => p.id === id) || null;
      const lineup = {};
      if (raw.lineupSlots) {
        for (const [slotId, playerId] of Object.entries(raw.lineupSlots)) {
          const p = findPlayer(playerId);
          if (p) lineup[slotId] = p;
        }
      }
      const currentSquad = nation.squads.find((squad) => squad.year === raw.currentSquadYear) || null;
      const restoredOffers = (raw.offerIds || []).map(findPlayer).filter(Boolean);
      return {
        nationId: raw.nationId,
        mode: raw.mode || "classic",
        formationId: raw.formationId || "433",
        round: raw.round || 1,
        lineup,
        draftedIds: [...new Set([...(raw.draftedIds || []), ...Object.values(lineup).map((player) => player.id)])],
        selectedOfferId: null,
        movingSlotId: null,
        currentSquad,
        yearTicker: raw.yearTicker || currentSquad?.year || null,
        spinning: false,
        revealOffers: Boolean(currentSquad && restoredOffers.length),
        offers: currentSquad ? restoredOffers.filter((player) => player.year === currentSquad.year) : [],
        tournament: raw.tournament || null,
        blockedMessage: null,
        complete: Boolean(raw.complete),
        respinsLeft: Number.isInteger(raw.respinsLeft) ? Math.max(0, Math.min(1, raw.respinsLeft)) : 1,
        seed: raw.seed || Math.floor(Math.random() * 1_000_000_000),
        nation,
      };
    }
  } catch { /* ignore corrupt save */ }
  return null;
})();

function saveLegacyDraft() {
  if (!legacyDraft) { localStorage.removeItem("legacyDraftState"); return; }
  const lineupSlots = {};
  for (const [slotId, player] of Object.entries(legacyDraft.lineup || {})) {
    lineupSlots[slotId] = player.id;
  }
  localStorage.setItem("legacyDraftState", JSON.stringify({
    nationId: legacyDraft.nationId,
    mode: legacyDraft.mode,
    formationId: legacyDraft.formationId,
    round: legacyDraft.round,
    lineupSlots,
    draftedIds: legacyDraft.draftedIds,
    currentSquadYear: legacyDraft.currentSquad?.year || null,
    yearTicker: legacyDraft.yearTicker || null,
    offerIds: (legacyDraft.offers || []).map((player) => player.id),
    complete: legacyDraft.complete,
    respinsLeft: legacyDraft.respinsLeft,
    seed: legacyDraft.seed,
    tournament: legacyDraft.tournament,
  }));
}
let legacySpinTimer = null;
let legacySpinFinishTimer = null;

const FLAG_CODE_OVERRIDES = {
  "GB-ENG": "gb-eng",
  "GB-SCT": "gb-sct",
  "GB-WLS": "gb-wls",
  "GB-NIR": "gb-nir",
};

const FLAG_IMAGE_OVERRIDES = {
  Somaliland: `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">
      <rect width="300" height="200" fill="#fff"/>
      <rect width="300" height="66.666" fill="#00843d"/>
      <rect y="133.333" width="300" height="66.667" fill="#d21034"/>
      <polygon fill="#111827" points="150,78 162,119 204,119 170,143 183,184 150,159 117,184 130,143 96,119 138,119"/>
      <g fill="#fff" opacity=".92">
        <rect x="56" y="27" width="188" height="8" rx="4"/>
        <rect x="78" y="43" width="144" height="6" rx="3"/>
      </g>
    </svg>
  `)}`,
};

const TOP_SHOOTOUT_TEAM_IDS = new Set(
  [...TEAMS]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 20)
    .map((team) => team.id),
);

const LEFT_FOOTED_PENALTY_TAKERS = new Set([
  "Lionel Messi",
  "Nicolás González",
  "Lamine Yamal",
  "Mikel Oyarzabal",
  "Mikel Merino",
  "Fabián Ruiz",
  "Michael Olise",
  "Bukayo Saka",
  "Noni Madueke",
  "Cole Palmer",
  "Phil Foden",
  "Ethan Nwaneri",
  "Max Dowman",
  "Raphinha",
  "Endrick",
  "Luiz Henrique",
  "Francisco Trincão",
  "Pedro Neto",
  "Francisco Conceição",
  "Romelu Lukaku",
  "Dodi Lukébakio",
  "Charles De Ketelaere",
  "Kai Havertz",
  "Ante Budimir",
  "Marco Pašalić",
  "Amine Adli",
  "Kōki Ogawa",
  "Takefusa Kubo",
  "Alejandro Zendejas",
  "Cavan Sullivan",
  "Santiago Giménez",
  "Guillermo Martínez",
  "Rasmus Højlund",
  "Micky van de Ven",
  "Luka Sučić",
  "Bruno Durdov",
  "Joško Gvardiol",
  "Carlos Forbs",
  "Antoine Griezmann",
  "Riyad Mahrez",
  "Hakim Ziyech",
  "Mohamed Salah",
  "Leroy Sané",
  "Bernardo Silva",
  "David Silva",
  "Jordi Alba",
  "Marc Cucurella",
  "Alejandro Grimaldo",
  "Federico Dimarco",
  "Riccardo Calafiori",
  "Luke Shaw",
  "Andrew Robertson",
  "Olivier Giroud",
  "Juan Mata",
  "Roberto Carlos",
  "Rivaldo",
  "Adriano",
  "Diego Maradona",
  "Mario Kempes",
  "Ashley Cole",
  "Mesut Özil",
  "Lukas Podolski",
  "Giorgio Chiellini",
  "Arjen Robben",
  "Robin van Persie",
  "Gareth Bale",
  "Du\u0161an Vlahovi\u0107",
  "James Rodr\u00edguez",
  "\u00c1ngel Di Mar\u00eda",
  "Alphonso Davies",
].map(repairPlayerText));

const TWO_FOOTED_PENALTY_TAKERS = new Set([
  "Ousmane Dembélé",
  "Ivan Perišić",
  "Brahim Díaz",
  "Son Heung-min",
  "Pedro",
  "Santi Cazorla",
].map(repairPlayerText));

function preferredPenaltyFoot(team, player, random) {
  const cleanedPlayer = repairPlayerText(player);
  const profile = playerProfilesForTeam(team).find((candidate) => repairPlayerText(candidate.name) === cleanedPlayer);
  if (profile?.preferredFoot === "left") return "left";
  if (profile?.preferredFoot === "right") return "right";
  if (profile?.preferredFoot === "both") return random() < 0.5 ? "left" : "right";
  if (TWO_FOOTED_PENALTY_TAKERS.has(cleanedPlayer)) return random() < 0.5 ? "left" : "right";
  if (LEFT_FOOTED_PENALTY_TAKERS.has(cleanedPlayer)) return "left";
  if (profile?.generated) return stableHash(`${team.id}:${player}:foot`) % 5 === 0 ? "left" : "right";
  return "right";
}

function flagMarkup(team, className = "") {
  const imageOverride = FLAG_IMAGE_OVERRIDES[team.name];
  const code = FLAG_CODE_OVERRIDES[team.code] || team.code.toLowerCase();
  const fallback = `<span class="flag-fallback" aria-hidden="true">${team.flag}</span>`;
  if (imageOverride) {
    return `
      <span class="country-flag ${className}" role="img" aria-label="${team.name} flag">
        ${fallback}
        <img src="${imageOverride}" alt="" loading="lazy" />
      </span>
    `;
  }
  if (code === "xx") {
    return `<span class="country-flag ${className}" role="img" aria-label="${team.name} flag">${fallback}</span>`;
  }
  return `
    <span class="country-flag ${className}" role="img" aria-label="${team.name} flag">
      ${fallback}
      <img
        src="https://flagcdn.com/w160/${code}.png"
        srcset="https://flagcdn.com/w320/${code}.png 2x"
        alt=""
        loading="lazy"
      />
    </span>
  `;
}

function measureTeamName(element) {
  const label = element.querySelector("span");
  if (!label || !element.clientWidth) return;
  const overflow = Math.max(0, Math.ceil(label.scrollWidth - element.clientWidth));
  element.style.setProperty("--team-name-overflow", `${overflow}px`);
  element.style.setProperty("--team-name-duration", `${Math.min(11, 7.2 + overflow / 34)}s`);
  element.classList.toggle("is-overflowing", overflow > 2);
}

function setTeamName(element, name) {
  let label = element.querySelector("span");
  if (!label) {
    label = document.createElement("span");
    element.replaceChildren(label);
  }
  element.classList.remove("is-overflowing");
  element.classList.toggle("is-long", name.length >= 16);
  label.textContent = name;
  requestAnimationFrame(() => measureTeamName(element));
}

if (typeof ResizeObserver !== "undefined") {
  const teamNameObserver = new ResizeObserver((entries) => {
    entries.forEach(({ target }) => measureTeamName(target));
  });
  teamNameObserver.observe(els.homeName);
  teamNameObserver.observe(els.awayName);
}

document.addEventListener("error", (event) => {
  if (event.target instanceof HTMLImageElement && event.target.closest(".country-flag")) {
    event.target.remove();
  }
}, true);

const DEFAULT_FIXTURE_LIMIT = 24;
let fixtureLimit = DEFAULT_FIXTURE_LIMIT;
let filterUnresolved = false;
let toastTimer;
let searchPopover;
let teamFilterId = null;
let teamFilterReturn = null;
let livePlayback = null;
let match2dState = null;
const matchPresentationCache = new Map();
let spectatePickerMode = "all";
let onlineRoomSession = readOnlineRoomSession();
let onlineRoomPollTimer = null;
let onlineRoomBusy = false;
let latestOnlineRoom = null;
let onlineRoomStateVersion = 0;
let onlineLastSeenEventId = 0;
const onlineRoomEvents = new Map();
let onlineViewedMatchId = null;
let onlineMatchSelectionManual = false;
let onlineMatchPlayback = null;
let onlineMatchPlaybackTimer = null;
let onlineLivePresentation = null;
let onlineLivePresentationTimer = null;
let onlineServerOffsetMs = 0;
let onlineServerOffsetReady = false;
let onlineDisplayedRoundNumber = null;
let onlineRoundScoreTimer = null;
let onlineOtherMatchFilter = "friends";
const onlinePlayedMatchIds = new Set();
const onlineFinishedPlaybackIds = new Set();
const onlineReadyWaitingNotifications = new Set();
let onlineHistoryRoomCode = null;
let onlineAdvanceQueuedRoundNumber = null;
let onlinePenaltyAnimation = null;
let onlineObservedPenaltyPlaybackRunning = false;
const onlineObservedPenaltyQueue = [];
const onlineObservedPenaltyIds = new Set();
let onlinePenaltyTester = null;
let onlineDraftRunning = false;
let onlineDraftRunId = 0;
const savedMatchSpeed = Number(localStorage.getItem(MATCH_SPEED_STORAGE_KEY));
let preferredMatchSpeed = [1, 1.5, 2, 3, 5].includes(savedMatchSpeed) ? savedMatchSpeed : null;
let preferredHighlightMode = MATCH_HIGHLIGHT_MODES.includes(localStorage.getItem(MATCH_HIGHLIGHT_MODE_STORAGE_KEY))
  ? localStorage.getItem(MATCH_HIGHLIGHT_MODE_STORAGE_KEY)
  : "key";
const MATCH_SOUND_PATHS = {
  penaltyWhistle: "./assets/audio/penalty-whistle.mp3",
  fullTimeWhistle: "./assets/audio/full-time-whistle.mp3",
};
const activeMatchSounds = new Set();

function restoreOnlineMatchHistory(roomCode) {
  if (!roomCode || onlineHistoryRoomCode === roomCode) return;
  onlineHistoryRoomCode = roomCode;
  onlineMatchSelectionManual = false;
  onlinePlayedMatchIds.clear();
  onlineFinishedPlaybackIds.clear();
  try {
    const history = JSON.parse(sessionStorage.getItem(`world-256-online-watched-${roomCode}`) || "null");
    (history?.played || []).filter((id) => typeof id === "string").forEach((id) => onlinePlayedMatchIds.add(id));
    (history?.finished || []).filter((id) => typeof id === "string").forEach((id) => onlineFinishedPlaybackIds.add(id));
  } catch {
    // A blocked or malformed session store should not stop the room from working.
  }
}

function saveOnlineMatchHistory() {
  if (!onlineHistoryRoomCode) return;
  try {
    sessionStorage.setItem(`world-256-online-watched-${onlineHistoryRoomCode}`, JSON.stringify({
      played: [...onlinePlayedMatchIds],
      finished: [...onlineFinishedPlaybackIds],
    }));
  } catch {
    // Playback still works when private session storage is unavailable.
  }
}

function readOnlineRoomSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem(ONLINE_ROOM_SESSION_KEY) || "null");
    if (!session || !/^(?:\d{4}|[A-HJ-NP-Z2-9]{6})$/.test(session.code) || !/^[A-Za-z0-9_-]{43}$/.test(session.token)) {
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function saveOnlineRoomSession(session) {
  if (session?.code !== onlineRoomSession?.code) {
    onlineRoomStateVersion = 0;
    onlineLastSeenEventId = 0;
    onlineRoomEvents.clear();
    latestOnlineRoom = null;
    onlineServerOffsetMs = 0;
    onlineServerOffsetReady = false;
  }
  onlineRoomSession = session;
  try {
    if (session) sessionStorage.setItem(ONLINE_ROOM_SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(ONLINE_ROOM_SESSION_KEY);
  } catch {
    // The room still works for this page even when private storage is unavailable.
  }
  syncOnlineRoomCard();
}

function syncOnlineRoomCard() {
  els.createOnlineRoomButton.innerHTML = `Create room <span aria-hidden="true">→</span>`;
  const enabled = onlineModeAvailableLocally();
  els.onlineModeActions.hidden = !enabled;
  els.onlineModeActions.classList.toggle("has-active-room", enabled && Boolean(onlineRoomSession));
  els.joinOnlineRoomButton.hidden = !enabled;
  els.onlineModeComingSoon.hidden = enabled;
}

function onlineModeAvailableLocally() {
  return ONLINE_PARTY_MODE_ENABLED && (["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
    || new URLSearchParams(window.location.search).get("onlineDev") === "1");
}

function configureOnlineModeAvailability() {
  if (els.onlineModeStatus) {
    els.onlineModeStatus.textContent = "Online knockout";
    els.onlineModeStatus.classList.add("mode-status-online");
  }
  const enabled = onlineModeAvailableLocally();
  els.onlineModeCopy.textContent = enabled
    ? "Create a private knockout room and manage matches together in real time."
    : "Private rooms are being tuned before they come back.";
  syncOnlineRoomCard();
}

function currentAppMode() {
  const mode = new URLSearchParams(window.location.search).get("mode");
  return mode === "online" || mode === "standard" || mode === "legacy" ? mode : "home";
}

function setAppModeUrl(mode, { replace = false } = {}) {
  const url = new URL(window.location.href);
  if (mode === "online" || mode === "standard" || mode === "legacy") url.searchParams.set("mode", mode);
  else {
    url.searchParams.delete("mode");
    url.searchParams.delete("room");
  }
  if (mode !== "standard") url.searchParams.delete("legacyTournament");
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  const nextState = { ...(window.history.state || {}), appMode: mode };
  window.history[replace ? "replaceState" : "pushState"](nextState, "", nextUrl);
}

function setOnlineRoomMessage(message = "", error = false) {
  els.onlineRoomMessage.textContent = message;
  els.onlineRoomMessage.classList.toggle("is-error", error);
}

function setOnlineRoomBusy(busy) {
  onlineRoomBusy = busy;
  [els.confirmCreateRoomButton, els.confirmJoinRoomButton, els.closeOnlineRoomButton, els.leaveOnlineRoomButton,
    els.closeOnlineDraftRoomButton, els.leaveOnlineDraftRoomButton, els.updateOnlineDisplayNameButton,
    els.onlineReadyButton, els.onlinePauseMatchButton, els.onlineMatchSpeedButton,
    els.closeOnlineMatchRoomButton, els.leaveOnlineMatchRoomButton]
    .forEach((button) => { button.disabled = busy; });
  els.onlineTacticSlider.disabled = busy;
  els.onlinePenaltyControl.querySelectorAll("button").forEach((button) => { button.disabled = busy; });
  const needsOpponent = latestOnlineRoom?.status === "lobby" && latestOnlineRoom.memberCount < 2;
  els.startOnlineDraftButton.disabled = busy || needsOpponent;
  els.confirmCreateRoomButton.textContent = busy ? "Creating…" : "Create private room";
  els.confirmJoinRoomButton.textContent = busy ? "Joining…" : "Join room";
  els.updateOnlineDisplayNameButton.textContent = busy ? "Saving..." : "Update";
}

function showOnlineRoomEntry(preferJoin = false) {
  stopOnlineRoomPolling();
  stopOnlineMatchPlayback();
  stopOnlineLivePresentation();
  clearTimeout(onlineRoundScoreTimer);
  onlineRoundScoreTimer = null;
  onlineDisplayedRoundNumber = null;
  if (els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.close();
  els.onlineRoomEntry.hidden = false;
  els.onlineRoomLobby.hidden = true;
  els.onlineDraft.hidden = true;
  els.onlineMatches.hidden = true;
  els.onlineScreenHeading.hidden = false;
  stopOnlineDraftRun();
  els.onlineRoomTitle.textContent = "Create or join a room";
  const linkedCode = new URLSearchParams(window.location.search).get("room");
  if (linkedCode) els.onlineRoomCodeInput.value = normalizeOnlineRoomCode(linkedCode);
  requestAnimationFrame(() => (preferJoin ? els.joinOnlineDisplayName : els.createOnlineDisplayName).focus());
}

async function openOnlineRoom(preferJoin = false, { updateUrl = true } = {}) {
  if (!onlineModeAvailableLocally()) {
    if (updateUrl || currentAppMode() === "online") setAppModeUrl("home", { replace: true });
    configureOnlineModeAvailability();
    showToast("Online party mode is coming soon.");
    return;
  }
  if (updateUrl && currentAppMode() !== "online") setAppModeUrl("online");
  setOnlineRoomMessage();
  els.appShell.hidden = true;
  els.onlineRoomScreen.hidden = false;
  document.body.classList.add("online-screen-open");
  window.scrollTo({ top: 0, behavior: "auto" });
  if (!onlineRoomSession) {
    showOnlineRoomEntry(preferJoin);
    return;
  }
  showOnlineLobbyShell();
  await refreshOnlineRoom();
}

function closeOnlineScreen({ updateUrl = true, force = false } = {}) {
  if (onlineRoomBusy && !force) return;
  stopOnlineRoomPolling();
  stopOnlineDraftRun();
  stopOnlineMatchPlayback();
  stopOnlineLivePresentation();
  clearTimeout(onlineRoundScoreTimer);
  onlineRoundScoreTimer = null;
  onlineDisplayedRoundNumber = null;
  if (els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.close();
  els.onlineRoomScreen.hidden = true;
  els.appShell.hidden = false;
  document.body.classList.remove("online-screen-open");
  if (updateUrl) setAppModeUrl("home", { replace: true });
  requestAnimationFrame(() => {
    const returnButton = onlineRoomSession ? els.createOnlineRoomButton : els.joinOnlineRoomButton;
    if (!returnButton.hidden) returnButton.focus();
  });
}

function showOnlineLobbyShell() {
  els.onlineRoomEntry.hidden = true;
  els.onlineRoomLobby.hidden = false;
  els.onlineDraft.hidden = true;
  els.onlineMatches.hidden = true;
  els.onlineScreenHeading.hidden = true;
  els.onlineRoomTitle.textContent = "Private tournament lobby";
  els.onlineRoomCode.textContent = onlineRoomSession?.code || "------";
  startOnlineRoomPolling();
}

function renderOnlineLobby(room, memberId) {
  if (room.status === "matches" || room.status === "tournament-complete") {
    renderOnlineMatches(room, memberId);
    return;
  }
  if (room.status === "draft" || room.status === "draft-complete") {
    renderOnlineDraft(room, memberId);
    return;
  }
  latestOnlineRoom = room;
  els.onlineRoomLobby.hidden = false;
  els.onlineDraft.hidden = true;
  els.onlineMatches.hidden = true;
  els.onlineRoomCode.textContent = room.code;
  els.onlineRoomCount.textContent = `${room.memberCount} / ${room.maxMembers} players`;
  const currentMember = room.members.find((member) => member.id === memberId);
  if (document.activeElement !== els.onlineLobbyDisplayName) {
    els.onlineLobbyDisplayName.value = currentMember?.name || onlineRoomSession?.name || "";
  }
  els.closeOnlineRoomButton.hidden = !onlineRoomSession?.isHost;
  els.leaveOnlineRoomButton.hidden = Boolean(onlineRoomSession?.isHost);
  els.onlineMemberList.replaceChildren(...room.members.map((member) => {
    const row = document.createElement("div");
    row.className = "online-member";
    const avatar = document.createElement("span");
    avatar.className = "online-member-avatar";
    avatar.textContent = member.name.slice(0, 1).toUpperCase();
    avatar.setAttribute("aria-hidden", "true");
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = member.name;
    const role = document.createElement("small");
    role.textContent = member.isHost ? "Host" : member.isCpu ? "CPU opponent" : member.id === memberId ? "You" : "Player";
    copy.append(name, role);
    const state = document.createElement("i");
    state.textContent = "Ready";
    row.append(avatar, copy, state);
    return row;
  }));
  els.startOnlineDraftButton.hidden = !onlineRoomSession?.isHost;
  els.startOnlineDraftButton.disabled = onlineRoomBusy || room.memberCount < 2;
}

function renderOnlineDraftLegacy(room, memberId) {
  latestOnlineRoom = room;
  els.onlineRoomLobby.hidden = true;
  els.onlineMatches.hidden = true;
  els.onlineDraft.hidden = false;
  els.onlineRoomTitle.textContent = "Country draft";
  const draft = room.draft;
  const currentMember = room.members.find((member) => member.id === draft?.currentMemberId);
  const isComplete = draft?.status === "complete";
  const isMyTurn = draft?.currentMemberId === memberId;
  els.onlineDraftTitle.textContent = isComplete ? "Draft complete" : isMyTurn ? "Choose your country" : `${currentMember?.name || "Another player"} is choosing`;
  els.onlineDraftTurn.textContent = isComplete ? "Complete" : isMyTurn ? "Your turn" : `${currentMember?.name || "Player"}'s turn`;
  els.onlineDraftTurn.classList.toggle("is-waiting", !isComplete && !isMyTurn);
  els.onlineDraftTurn.classList.toggle("is-complete", isComplete);

  const picksByMember = new Map((draft?.picks || []).map((pick) => [pick.memberId, pick]));
  els.onlineDraftPicks.replaceChildren(...room.members.map((member) => {
    const pick = picksByMember.get(member.id);
    const team = pick ? TEAM_BY_ID.get(pick.teamId) : null;
    const card = document.createElement("div");
    card.className = "online-draft-pick";
    const flag = document.createElement("span");
    flag.className = "online-draft-pick-flag";
    if (team) flag.innerHTML = flagMarkup(team, "draft-pick-flag");
    else flag.textContent = "?";
    const copy = document.createElement("span");
    const name = document.createElement("small");
    name.textContent = member.isCpu ? "CPU" : member.name;
    const selection = document.createElement("strong");
    selection.textContent = team?.name || (draft?.currentMemberId === member.id ? "Choosing…" : "Waiting");
    copy.append(name, selection);
    card.append(flag, copy);
    return card;
  }));

  const claimed = new Set((draft?.picks || []).map((pick) => pick.teamId));
  const query = els.onlineDraftSearch.value.trim().toLocaleLowerCase();
  const listSignature = `${query}|${isMyTurn}|${isComplete}|${onlineRoomBusy}|${[...claimed].sort().join(",")}`;
  if (listSignature !== onlineDraftListSignature) {
    const teams = [...TEAMS]
      .sort(compareTeamsByOfficialFifaRank)
      .filter((team) => !query || team.name.toLocaleLowerCase().includes(query));
    els.onlineCountryList.replaceChildren(...teams.map((team) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "online-country-option";
      const taken = claimed.has(team.id);
      button.disabled = onlineRoomBusy || !isMyTurn || taken || isComplete;
      button.dataset.teamId = team.id;
      button.setAttribute("aria-label", `${team.name}, ${team.officialFifaRank ? `FIFA rank ${team.officialFifaRank}` : "unranked"}${taken ? ", already picked" : ""}`);
      const flag = document.createElement("span");
      flag.innerHTML = flagMarkup(team, "draft-country-flag");
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = team.name;
      const rank = document.createElement("small");
      rank.textContent = team.officialFifaRank ? `FIFA #${team.officialFifaRank}` : "Guest team";
      copy.append(name, rank);
      const state = document.createElement("i");
      state.textContent = taken ? "Picked" : "Choose";
      button.append(flag, copy, state);
      return button;
    }));
    onlineDraftListSignature = listSignature;
  }
  els.onlineDraftSearch.disabled = !isMyTurn || isComplete;
  els.closeOnlineDraftRoomButton.hidden = !onlineRoomSession?.isHost;
  els.leaveOnlineDraftRoomButton.hidden = Boolean(onlineRoomSession?.isHost);
}

function renderOnlineDraft(room, memberId) {
  latestOnlineRoom = room;
  els.onlineRoomLobby.hidden = true;
  els.onlineMatches.hidden = true;
  els.onlineDraft.hidden = false;
  els.onlineScreenHeading.hidden = true;
  els.onlineRoomTitle.textContent = "Snake draft";
  const draft = room.draft;
  const currentMember = room.members.find((member) => member.id === draft?.currentMemberId);
  const isComplete = draft?.status === "complete";
  els.onlineDraftHead.hidden = isComplete;
  const totalPicks = draft?.totalPicks || room.members.length * (draft?.picksPerMember || 5);
  const completedPicks = draft?.picks.length || 0;
  const roundNumber = Math.min(draft?.picksPerMember || 5, Math.floor(completedPicks / room.members.length) + 1);
  els.onlineDraftTitle.textContent = `Round ${roundNumber} of ${draft?.picksPerMember || 5}`;
  els.onlineDraftTurn.textContent = isComplete ? "Complete" : `Pick ${completedPicks + 1} of ${totalPicks}`;
  els.onlineDraftTurn.classList.toggle("is-waiting", false);
  els.onlineDraftTurn.classList.toggle("is-complete", isComplete);
  els.onlineDraftProgress.style.width = `${totalPicks ? Math.round((completedPicks / totalPicks) * 100) : 0}%`;

  const memberById = new Map(room.members.map((member) => [member.id, member]));
  const rosterOrder = (draft?.baseOrder || room.members.map((member) => member.id))
    .map((id) => memberById.get(id))
    .filter(Boolean);
  els.onlineDraftRosters.replaceChildren(...rosterOrder.map((member) => {
    const memberPicks = (draft?.picks || []).filter((pick) => pick.memberId === member.id);
    const roster = document.createElement("section");
    roster.className = "online-draft-roster";
    roster.classList.toggle("is-current", !isComplete && currentMember?.id === member.id);
    const head = document.createElement("div");
    head.className = "online-draft-roster-head";
    const identity = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = member.isCpu ? "CPU" : member.name;
    identity.append(name);
    const count = document.createElement("i");
    count.textContent = `${memberPicks.length} / ${draft?.picksPerMember || 5}`;
    head.append(identity, count);
    const countries = document.createElement("div");
    countries.className = "online-draft-roster-countries";
    for (let slot = 0; slot < (draft?.picksPerMember || 5); slot += 1) {
      const pick = memberPicks[slot];
      const team = pick ? TEAM_BY_ID.get(pick.teamId) : null;
      const country = document.createElement("div");
      country.className = "online-roster-country";
      country.classList.toggle("is-empty", !team);
      const flag = document.createElement("span");
      if (team) flag.innerHTML = flagMarkup(team, "roster-country-flag");
      else flag.textContent = String(slot + 1);
      const label = document.createElement("strong");
      label.className = "team-name online-roster-country-name";
      setTeamName(label, team?.name || "Waiting");
      country.append(flag, label);
      countries.append(country);
    }
    roster.append(head, countries);
    return roster;
  }));

  if (!onlineDraftRunning) {
    const lastPick = draft?.picks.at(-1);
    const lastTeam = lastPick ? TEAM_BY_ID.get(lastPick.teamId) : null;
    const displayMember = lastPick ? memberById.get(lastPick.memberId) : currentMember;
    if (lastTeam) showOnlineRouletteResult(displayMember, lastTeam, lastPick);
    else setOnlineRouletteSearching(currentMember, room, draft);
  }
  els.closeOnlineDraftRoomButton.hidden = !onlineRoomSession?.isHost;
  els.leaveOnlineDraftRoomButton.hidden = Boolean(onlineRoomSession?.isHost);
  if (isComplete) stopOnlineDraftRun();
  else if (onlineRoomSession?.isHost && !onlineDraftRunning && !els.onlineRoomScreen.hidden) {
    queueMicrotask(() => runOnlineSnakeDraft(room));
  } else if (!onlineRoomSession?.isHost && !onlineDraftRunning && !els.onlineRoomScreen.hidden) {
    queueMicrotask(() => runOnlineDraftSpectator(room));
  }
}

const ONLINE_TACTIC_OPTIONS = [
  { id: "balanced", name: "Balanced", copy: "No attacking or defensive modifier." },
  { id: "tiki-taka", name: "Tiki-taka", copy: "Patient possession play that creates openings through short combinations." },
  { id: "counter", name: "Counter", copy: "Defend compactly, then attack the space quickly when possession turns over." },
  { id: "high-press", name: "High press", copy: "Win the ball higher up the pitch at the cost of extra fatigue and risk." },
  { id: "defensive", name: "Defensive", copy: "A safer shape that concedes fewer chances but creates less going forward." },
];
const ONLINE_SHARED_PLAYBACK_MS = 30000;

function onlineRoundName(tournament, roundNumber) {
  const totalTeams = tournament?.participantTeamIds?.length || 256;
  const teamsRemaining = Math.max(2, Math.ceil(totalTeams / (2 ** Math.max(0, roundNumber - 1))));
  if (teamsRemaining === 2) return "Final";
  if (teamsRemaining === 4) return "Semi-finals";
  if (teamsRemaining === 8) return "Quarter-finals";
  return `Round of ${teamsRemaining}`;
}

function renderOnlineMatches(room, memberId) {
  restoreOnlineMatchHistory(room.code);
  const previousRoom = latestOnlineRoom;
  latestOnlineRoom = room;
  notifyOnlineReadyWaiting(room, memberId);
  if (onlinePenaltyTester) {
    renderOnlinePenaltyTester();
    return;
  }
  els.onlineRoomLobby.hidden = true;
  els.onlineDraft.hidden = true;
  els.onlineScreenHeading.hidden = true;
  els.onlineRoomTitle.textContent = "Online knockout";
  stopOnlineDraftRun();
  els.onlineMatches.hidden = false;
  els.onlineMatches.classList.remove("is-penalty-tester");

  const tournament = room.tournament;
  const latestRound = tournament?.rounds?.at(-1);
  if (!onlineDisplayedRoundNumber || !tournament?.rounds?.some((round) => round.number === onlineDisplayedRoundNumber)) {
    onlineDisplayedRoundNumber = latestRound?.number || 1;
  }
  const currentRound = tournament?.rounds?.find((round) => round.number === onlineDisplayedRoundNumber) || latestRound;
  els.onlinePenaltyTesterButton.hidden = true;
  els.onlinePenaltyTesterButton.textContent = "Test shootout";
  const isComplete = tournament?.status === "complete" && currentRound?.number === latestRound?.number;
  const surviving = new Set(tournament?.survivingTeamIds || []);
  const ownedTeamIds = Object.entries(tournament?.teamOwnerById || {})
    .filter(([, ownerId]) => ownerId === memberId)
    .map(([teamId]) => teamId);
  const ownedTeamIdSet = new Set(ownedTeamIds);
  const ownedMatches = currentRound?.matches.filter((match) => (
    ownedTeamIdSet.has(match.homeTeamId) || ownedTeamIdSet.has(match.awayTeamId)
  )) || [];
  const allMatches = tournament?.rounds?.flatMap((round) => round.matches) || [];
  const previousMatches = new Map((previousRoom?.tournament?.rounds || []).flatMap((round) => round.matches).map((match) => [match.id, match]));
  const newlyResolvedControlledMatch = allMatches.find((match) => {
    const previous = previousMatches.get(match.id);
    const sharedPlaybackActive = match.playback?.controllerMemberIds?.length === 2
      && (match.playback.positionMs || 0) < ONLINE_SHARED_PLAYBACK_MS;
    return ["complete", "penalties"].includes(match.status)
      && (ownedTeamIdSet.has(match.homeTeamId) || ownedTeamIdSet.has(match.awayTeamId))
      && !onlinePlayedMatchIds.has(match.id)
      && (previous?.status === "waiting" || (!previous && sharedPlaybackActive));
  });
  const penaltyMatch = ownedMatches.find((match) => (
    match.status === "penalties" && tournament?.teamOwnerById?.[match.penalty?.currentTeamId] === memberId
  ));
  const nextOwnedMatch = penaltyMatch
    || ownedMatches.find((match) => match.status === "live")
    || ownedMatches.find((match) => match.status === "waiting")
    || ownedMatches[0]
    || null;
  if (penaltyMatch) {
    onlineViewedMatchId = penaltyMatch.id;
  } else if (newlyResolvedControlledMatch) {
    onlineViewedMatchId = newlyResolvedControlledMatch.id;
  } else if (!onlineMatchSelectionManual && nextOwnedMatch) {
    onlineViewedMatchId = nextOwnedMatch.id;
  } else if (!onlineViewedMatchId || !allMatches.some((match) => match.id === onlineViewedMatchId)) {
    onlineViewedMatchId = nextOwnedMatch?.id || allMatches[0]?.id || null;
  }
  const viewedMatch = allMatches.find((match) => match.id === onlineViewedMatchId) || nextOwnedMatch || null;
  const controlledMatch = viewedMatch && (ownedTeamIdSet.has(viewedMatch.homeTeamId) || ownedTeamIdSet.has(viewedMatch.awayTeamId))
    ? viewedMatch
    : null;

  els.onlineMatchRound.textContent = isComplete ? "Tournament complete" : onlineRoundName(tournament, currentRound?.number || 1);
  els.onlineMatchStatus.hidden = true;
  renderOnlineCountries(ownedTeamIds, surviving, currentRound, tournament?.championTeamId);
  const matchPresentationFinished = Boolean(
    controlledMatch?.liveState?.status === "finished"
    || controlledMatch?.status === "complete"
  );
  const showTactics = Boolean(controlledMatch?.awayTeamId && !matchPresentationFinished);
  const tacticsEditable = Boolean(
    controlledMatch?.status === "waiting"
    || controlledMatch?.status === "live"
    || controlledMatch?.liveState?.status === "penalties"
    || onlineMatchPlayback?.matchId === controlledMatch?.id
  );
  renderOnlineTactics(tournament, memberId, showTactics, controlledMatch, tacticsEditable);
  if (onlineMatchPlayback?.matchId === viewedMatch?.id) syncOnlinePlaybackFromMatch(viewedMatch);
  renderOnlineCurrentMatch(room, memberId, viewedMatch, controlledMatch);
  const startsPlaybackNow = newlyResolvedControlledMatch && newlyResolvedControlledMatch.simulationVersion !== 2;
  if (!startsPlaybackNow) {
    renderOnlineRoundMatches(tournament?.rounds || [], tournament, memberId, room.members);
  }
  if (startsPlaybackNow) {
    startOnlineMatchPlayback(newlyResolvedControlledMatch);
    setTimeout(() => {
      if (!latestOnlineRoom || els.onlineRoomScreen.hidden || onlineMatchPlayback?.matchId !== newlyResolvedControlledMatch.id) return;
      renderOnlineRoundMatches(
        latestOnlineRoom.tournament?.rounds || [],
        latestOnlineRoom.tournament,
        onlineRoomSession.memberId,
        latestOnlineRoom.members,
      );
    }, 500);
  }
  updateOnlineRoundNextButton(currentRound, tournament, memberId);
  if (els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.close();

  els.closeOnlineMatchRoomButton.hidden = !onlineRoomSession?.isHost;
  els.leaveOnlineMatchRoomButton.hidden = Boolean(onlineRoomSession?.isHost);
}

function notifyOnlineReadyWaiting(room, memberId) {
  const activeNotifications = new Set();
  const memberById = new Map((room.members || []).map((member) => [member.id, member]));
  const matches = room.tournament?.rounds?.at(-1)?.matches || [];
  matches.forEach((match) => {
    if (match.status !== "waiting" || !match.requiredMemberIds?.includes(memberId)) return;
    const readyIds = new Set(match.readyMemberIds || []);
    if (readyIds.has(memberId)) return;
    match.requiredMemberIds.forEach((readyMemberId) => {
      const readyMember = memberById.get(readyMemberId);
      if (readyMemberId === memberId || !readyIds.has(readyMemberId) || !readyMember || readyMember.isCpu) return;
      const notificationKey = `${match.id}:${readyMemberId}`;
      activeNotifications.add(notificationKey);
      if (onlineReadyWaitingNotifications.has(notificationKey)) return;
      onlineReadyWaitingNotifications.add(notificationKey);
      showToast(`${readyMember.name} is waiting for the match`, 5000);
    });
  });
  [...onlineReadyWaitingNotifications].forEach((key) => {
    if (!activeNotifications.has(key)) onlineReadyWaitingNotifications.delete(key);
  });
}

function renderOnlinePenaltyTester() {
  const france = TEAMS.find((team) => team.name === "France");
  const spain = TEAMS.find((team) => team.name === "Spain");
  if (!france || !spain || !onlinePenaltyTester) return;
  els.onlineRoomLobby.hidden = true;
  els.onlineDraft.hidden = true;
  els.onlineScreenHeading.hidden = true;
  els.onlineMatches.hidden = false;
  els.onlineMatches.classList.add("is-penalty-tester");
  els.onlineMatchRound.textContent = "Penalty shootout tester";
  els.onlineMatchStatus.hidden = true;
  els.onlinePenaltyTesterButton.hidden = false;
  els.onlinePenaltyTesterButton.textContent = "Exit tester";
  els.onlineRoundNextButton.hidden = true;
  els.onlineActiveTeam.replaceChildren();
  els.onlineTactics.hidden = true;
  els.onlineCurrentMatch.classList.add("tactics-hidden");
  els.onlineCurrentMatch.hidden = false;
  els.onlineCurrentMatch.classList.add("is-penalty-tester");
  els.onlineCardRound.textContent = "FRANCE VS SPAIN";
  els.onlineCardMatchNumber.textContent = "SHOOTOUT TEST";
  els.onlineMatchHome.innerHTML = onlineMatchTeamMarkup(france.id, true);
  els.onlineMatchAway.innerHTML = onlineMatchTeamMarkup(spain.id);
  els.onlineMatchScore.textContent = "0–0";
  els.onlineMatchPenaltyScore.hidden = false;
  els.onlineMatchPenaltyScore.textContent = `PENS ${onlinePenaltyTester.homeScore}–${onlinePenaltyTester.awayScore}`;
  els.onlineMatchMinute.textContent = "PENALTIES";
  els.onlineMatchClock.textContent = "90:00";
  els.onlineMatchPhase.textContent = "PENALTY SHOOTOUT";
  els.onlineLiveLabel.hidden = true;
  els.onlinePauseMatchButton.hidden = true;
  els.onlineMatchSpeedButton.hidden = true;
  els.onlinePauseCountdown.hidden = true;
  els.onlineHomeScorers.replaceChildren();
  els.onlineAwayScorers.replaceChildren();
  renderOnlinePenaltyMarkResults(onlinePenaltyTester.homeResults, onlinePenaltyTester.awayResults);
  els.onlineMatchEvents.replaceChildren();
  els.onlineReadyPanel.hidden = true;
  els.onlinePenaltyControl.hidden = false;
  els.onlinePenaltyControl.classList.toggle("is-cpu-taking", onlinePenaltyTester.currentTeam === "away");
  els.onlinePenaltyPrompt.textContent = onlinePenaltyTester.complete
    ? `${onlinePenaltyTester.homeScore > onlinePenaltyTester.awayScore ? "France" : "Spain"} win`
    : `${onlinePenaltyTester.currentTeam === "home" ? "France" : "Spain"} to take`;
  els.onlinePenaltyFeedback.textContent = onlinePenaltyTester.complete
    ? "Exit and reopen the tester to start again."
    : onlinePenaltyTester.currentTeam === "home"
      ? "Choose one of the five targets"
      : "Spain are taking their penalty automatically";
  els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => {
    button.disabled = onlinePenaltyTester.complete
      || onlinePenaltyTester.currentTeam !== "home"
      || Boolean(onlinePenaltyAnimation);
  });
  els.onlineMyMatches.replaceChildren();
  els.onlineRoundMatches.replaceChildren();
}

function startOnlinePenaltyTester() {
  onlinePenaltyTester = {
    homeScore: 0,
    awayScore: 0,
    homeKicks: 0,
    awayKicks: 0,
    currentTeam: "home",
    complete: false,
    homeResults: [],
    awayResults: [],
  };
  stopOnlineRoomPolling();
  stopOnlineMatchPlayback();
  setPenaltySceneElement(els.onlinePenaltyScene, { direction: "centre", keeperDive: "centre", foot: "right" }, "setup");
  els.onlinePenaltyScene.dataset.target = "middle";
  renderOnlinePenaltyTester();
}

async function takeOnlineTesterPenalty(target, automatic = false) {
  if (!onlinePenaltyTester || onlinePenaltyTester.complete || onlinePenaltyAnimation) return;
  if (onlinePenaltyTester.currentTeam !== "home" && !automatic) return;
  const targets = ["top-left", "top-right", "middle", "bottom-left", "bottom-right"];
  const goalkeeperTarget = targets[Math.floor(Math.random() * targets.length)];
  const scored = Math.random() < (goalkeeperTarget === target ? 0.38 : 0.88);
  const takingSide = onlinePenaltyTester.currentTeam;
  onlinePenaltyAnimation = { matchId: "penalty-tester", target };
  els.onlinePenaltyScene.dataset.target = target;
  els.onlinePenaltyPrompt.textContent = `${takingSide === "home" ? "France" : "Spain"} take`;
  els.onlinePenaltyFeedback.textContent = "The goalkeeper waits…";
  els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = true; });
  const attempt = {
    direction: onlinePenaltyDirection(target),
    keeperDive: onlinePenaltyDirection(goalkeeperTarget),
    foot: "right",
    scored,
    missType: scored ? null : "save",
  };
  setPenaltySceneElement(els.onlinePenaltyScene, attempt, "setup");
  await waitForOnlinePenaltyFrame(80);
  setPenaltySceneElement(els.onlinePenaltyScene, attempt, "flight");
  await waitForOnlinePenaltyFrame(560);
  setPenaltySceneElement(els.onlinePenaltyScene, attempt, "result");
  if (takingSide === "home") {
    onlinePenaltyTester.homeKicks += 1;
    onlinePenaltyTester.homeResults.push(scored);
    if (scored) onlinePenaltyTester.homeScore += 1;
  } else {
    onlinePenaltyTester.awayKicks += 1;
    onlinePenaltyTester.awayResults.push(scored);
    if (scored) onlinePenaltyTester.awayScore += 1;
  }
  const equalKicks = onlinePenaltyTester.homeKicks === onlinePenaltyTester.awayKicks;
  onlinePenaltyTester.complete = equalKicks
    && onlinePenaltyTester.homeKicks >= 5
    && onlinePenaltyTester.homeScore !== onlinePenaltyTester.awayScore;
  onlinePenaltyTester.currentTeam = takingSide === "home" ? "away" : "home";
  els.onlineMatchPenaltyScore.textContent = `PENS ${onlinePenaltyTester.homeScore}–${onlinePenaltyTester.awayScore}`;
  els.onlinePenaltyPrompt.textContent = scored ? "Goal" : "Saved";
  els.onlinePenaltyFeedback.textContent = scored ? "Perfectly placed." : "The goalkeeper got there.";
  await waitForOnlinePenaltyFrame(760);
  onlinePenaltyAnimation = null;
  if (!onlinePenaltyTester) return;
  setPenaltySceneElement(els.onlinePenaltyScene, { direction: "centre", keeperDive: "centre", foot: "right" }, "setup");
  els.onlinePenaltyScene.dataset.target = "middle";
  renderOnlinePenaltyTester();
  if (!onlinePenaltyTester.complete && onlinePenaltyTester.currentTeam === "away") {
    await waitForOnlinePenaltyFrame(520);
    if (!onlinePenaltyTester || onlinePenaltyTester.currentTeam !== "away" || onlinePenaltyAnimation) return;
    const cpuTarget = targets[Math.floor(Math.random() * targets.length)];
    takeOnlineTesterPenalty(cpuTarget, true);
  }
}

function onlineSharedMatchState(match, now = Date.now()) {
  if (match.liveState?.simulationVersion === 2) {
    const live = match.liveState;
    return {
      homeScore: live.status === "waiting" ? "–" : live.homeScore,
      awayScore: live.status === "waiting" ? "–" : live.awayScore,
      penaltyText: live.penalty ? `PENS ${live.penalty.homeScore}–${live.penalty.awayScore}` : "",
      label: live.status === "finished" ? "FULL TIME" : live.status === "penalties" ? "SHOOTOUT" : `${Math.max(1, Math.floor(live.minute))}'`,
      minute: live.minute,
      live: !["waiting", "finished"].includes(live.status),
    };
  }
  if (match.status === "waiting") {
    return { homeScore: "–", awayScore: "–", label: match.readyMemberIds?.length ? "WAITING" : "NOT STARTED", minute: 0, live: false };
  }
  if (match.status === "complete" && onlineFinishedPlaybackIds.has(match.id)) {
    return {
      homeScore: match.homeScore ?? 0,
      awayScore: match.awayScore ?? 0,
      penaltyText: match.penalty ? `PENS ${match.penalty.homeScore ?? 0}–${match.penalty.awayScore ?? 0}` : "",
      label: "FULL TIME",
      minute: 90,
      live: false,
    };
  }
  const usesSharedClock = match.playback?.controllerMemberIds?.length === 2;
  const playbackUpdatedAt = Number(match.playback?.updatedAt) || now;
  const playbackPausedUntil = Number(match.playback?.pausedUntil) || 0;
  const playbackActiveStart = playbackPausedUntil > playbackUpdatedAt
    ? Math.max(playbackUpdatedAt, playbackPausedUntil)
    : playbackUpdatedAt;
  const projectedPlaybackMs = Math.min(
    ONLINE_SHARED_PLAYBACK_MS,
    Math.max(0, Number(match.playback?.positionMs) || 0)
      + Math.max(0, now - playbackActiveStart) * (match.playback?.effectiveSpeed || 1),
  );
  const elapsed = usesSharedClock ? projectedPlaybackMs : Math.max(0, now - (match.completedAt || 0));
  const minute = Math.min(90, (elapsed / ONLINE_SHARED_PLAYBACK_MS) * 90);
  const event = (match.events || []).filter((item) => item.minute <= minute).at(-1);
  const finished = elapsed >= ONLINE_SHARED_PLAYBACK_MS;
  if (match.penalty && (!usesSharedClock || finished)) {
    return {
      homeScore: match.homeScore ?? 0,
      awayScore: match.awayScore ?? 0,
      penaltyText: "",
      label: match.status === "penalties" ? "SHOOTOUT" : "FULL TIME",
      minute: 90,
      live: match.status === "penalties",
    };
  }
  return {
    homeScore: finished ? match.homeScore ?? 0 : event?.homeScore ?? 0,
    awayScore: finished ? match.awayScore ?? 0 : event?.awayScore ?? 0,
    label: finished ? "FULL TIME" : `${Math.max(1, Math.floor(minute))}'`,
    minute,
    live: !finished,
  };
}

function onlineRoundIsVisuallyComplete(round) {
  const now = Date.now();
  return Boolean(round?.matches?.every((match) => (
    match.status === "complete"
    && (!match.awayTeamId || !onlineSharedMatchState(match, now).live)
  )));
}

function updateOnlineRoundNextButton(round, tournament, memberId) {
  const ownedMatches = round?.matches?.filter((match) => (
    tournament?.teamOwnerById?.[match.homeTeamId] === memberId
    || tournament?.teamOwnerById?.[match.awayTeamId] === memberId
  )) || [];
  const ownPlaybackFinished = ownedMatches.every((match) => !match.awayTeamId || onlinePlayedMatchIds.has(match.id));
  const nextRoundReady = (tournament?.roundNumber || 0) > (round?.number || 0);
  const roundVisuallyComplete = onlineRoundIsVisuallyComplete(round);
  const canAdvance = !onlineMatchPlayback
    && ownPlaybackFinished
    && nextRoundReady
    && roundVisuallyComplete;
  els.onlineRoundNextButton.hidden = !round || tournament?.status === "complete";
  els.onlineRoundNextButton.disabled = !canAdvance;
  els.onlineRoundNextButton.classList.toggle("is-disabled", !canAdvance);
  els.onlineRoundNextButton.title = canAdvance
    ? "Go to the next round"
    : "Finish every match in this round first";
}

function advanceOnlineToAvailableRound() {
  const roundNumber = latestOnlineRoom?.tournament?.roundNumber;
  if (!roundNumber) return;
  stopOnlineMatchPlayback();
  onlineAdvanceQueuedRoundNumber = null;
  onlineDisplayedRoundNumber = roundNumber;
  onlineViewedMatchId = null;
  onlineMatchSelectionManual = false;
  renderOnlineMatches(latestOnlineRoom, onlineRoomSession.memberId);
  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderOnlineCountries(teamIds, surviving, currentRound, championTeamId) {
  els.onlineActiveTeam.replaceChildren();
  teamIds.forEach((teamId) => {
    const team = TEAM_BY_ID.get(teamId);
    if (!team) return;
    const match = currentRound?.matches.find((item) => item.homeTeamId === teamId || item.awayTeamId === teamId);
    const resultVisible = !match?.awayTeamId || onlineFinishedPlaybackIds.has(match?.id);
    const eliminated = resultVisible && !surviving.has(teamId);
    const champion = resultVisible && championTeamId === teamId;
    const card = document.createElement("div");
    card.className = "online-owned-country";
    card.classList.toggle("is-eliminated", eliminated);
    card.classList.toggle("is-champion", champion);
    const status = champion
      ? "Champion"
      : eliminated
        ? "Eliminated"
        : !match?.awayTeamId
          ? "Through on a bye"
          : !resultVisible || match.status === "waiting"
            ? ""
            : match.status === "penalties"
              ? "Penalty shootout"
              : "Still in";
    card.innerHTML = `${flagMarkup(team, "online-owned-flag")}<span><strong>${team.name}</strong>${status ? `<small>${status}</small>` : ""}</span>`;
    els.onlineActiveTeam.append(card);
  });
}

function renderOnlineTactics(tournament, memberId, visible, match = null, editable = false) {
  els.onlineTactics.hidden = !visible;
  els.onlineCurrentMatch?.classList.toggle("tactics-hidden", !visible);
  if (!visible) return;
  const teamId = [match?.homeTeamId, match?.awayTeamId].find((id) => tournament?.teamOwnerById?.[id] === memberId);
  const tacticId = tournament?.tacticsByTeam?.[teamId] || "balanced";
  const index = Math.max(0, ONLINE_TACTIC_OPTIONS.findIndex((option) => option.id === tacticId));
  if (document.activeElement !== els.onlineTacticSlider) els.onlineTacticSlider.value = String(index);
  els.onlineTacticSlider.dataset.teamId = teamId || "";
  els.onlineTacticSlider.disabled = onlineRoomBusy || !editable;
  els.onlineTacticName.textContent = ONLINE_TACTIC_OPTIONS[index].name;
  const opponentTeamId = match
    ? [match.homeTeamId, match.awayTeamId].find((id) => id && id !== teamId)
    : null;
  const opponentTacticId = tournament?.tacticsByTeam?.[opponentTeamId] || "balanced";
  const opponentTactic = ONLINE_TACTIC_OPTIONS.find((option) => option.id === opponentTacticId);
  els.onlineTacticCopy.textContent = `Opponent: ${opponentTactic?.name || "--"}`;
  els.onlineTacticButtons.dataset.teamId = teamId || "";
  els.onlineTacticButtons.querySelectorAll("[data-online-tactic]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.onlineTactic === tacticId);
    button.disabled = onlineRoomBusy || !editable;
  });
}

function onlineMatchTeamMarkup(teamId, isMine = false) {
  const team = TEAM_BY_ID.get(teamId);
  if (!team) return `<span class="online-match-bye">Bye</span>`;
  return `${flagMarkup(team, "online-match-flag")}<strong${isMine ? " class=\"is-mine\"" : ""}>${team.name}</strong>`;
}

function onlineReadyWaitingLabel(match) {
  if ((match?.requiredMemberIds?.length || 0) > 1) return "Waiting for opponent";
  if (Number.isInteger(match?.queuePosition) && match.queuePosition > 0) return "Waiting for match slot";
  return "Starting match…";
}

function renderOnlineCurrentMatchLegacy(room, memberId, match, isComplete) {
  els.onlineCurrentMatch.hidden = !match || isComplete;
  els.onlineReadyPanel.hidden = true;
  els.onlinePenaltyControl.hidden = true;
  if (!match || isComplete) return;
  els.onlineMatchHome.innerHTML = onlineMatchTeamMarkup(match.homeTeamId, room.tournament?.teamOwnerById?.[match.homeTeamId] === memberId);
  els.onlineMatchAway.innerHTML = onlineMatchTeamMarkup(match.awayTeamId, room.tournament?.teamOwnerById?.[match.awayTeamId] === memberId);
  els.onlineMatchScore.textContent = match.homeScore === null
    ? "–"
    : match.penalty
      ? `${match.homeScore}–${match.awayScore} (${match.penalty.homeScore}–${match.penalty.awayScore})`
      : `${match.homeScore}–${match.awayScore}`;

  if (match.status === "waiting" && match.requiredMemberIds.includes(memberId)) {
    const readyMembers = new Set(match.readyMemberIds);
    const requiredNames = match.requiredMemberIds.map((id) => room.members.find((member) => member.id === id)?.name || "Player");
    const isReady = readyMembers.has(memberId);
    els.onlineReadyPanel.hidden = false;
    els.onlineReadyTitle.textContent = isReady ? "You are ready" : "Ready to play?";
    els.onlineReadyCopy.textContent = match.requiredMemberIds.length > 1
      ? `${requiredNames.join(" and ")} must both be ready before kickoff.`
      : "Kickoff starts as soon as you are ready.";
    els.onlineReadyButton.textContent = isReady ? "Ready ✓" : "Ready";
    els.onlineReadyButton.disabled = onlineRoomBusy || isReady;
    els.onlineReadyButton.dataset.matchId = match.id;
  } else if (match.status === "penalties") {
    const myTurn = room.tournament.activeTeamByMember[memberId] === match.penalty?.currentTeamId;
    els.onlinePenaltyControl.hidden = !myTurn;
    els.onlineReadyPanel.hidden = myTurn;
    if (!myTurn) {
      els.onlineReadyPanel.hidden = false;
      els.onlineReadyTitle.textContent = "Penalty shootout";
      els.onlineReadyCopy.textContent = "Waiting for the current taker to choose a target.";
      els.onlineReadyButton.hidden = true;
    }
  }
  if (match.status !== "penalties") els.onlineReadyButton.hidden = false;
}

function renderOnlineRoundMatchesLegacy(matches) {
  els.onlineRoundMatches.replaceChildren(...matches.map((match) => {
    const row = document.createElement("div");
    row.className = "online-round-match";
    const home = TEAM_BY_ID.get(match.homeTeamId);
    const away = TEAM_BY_ID.get(match.awayTeamId);
    const names = document.createElement("span");
    names.textContent = `${home?.name || "Bye"}  vs  ${away?.name || "Bye"}`;
    const score = document.createElement("strong");
    score.textContent = match.homeScore === null ? "Waiting" : `${match.homeScore}–${match.awayScore}`;
    row.classList.toggle("is-complete", match.status === "complete");
    row.append(names, score);
    return row;
  }));
}

function renderOnlineCurrentMatch(room, memberId, viewedMatch, controlledMatch) {
  const animatingPenalty = onlinePenaltyAnimation?.matchId === viewedMatch?.id;
  els.onlineCurrentMatch.hidden = !viewedMatch;
  els.onlineReadyPanel.hidden = true;
  els.onlinePenaltyControl.hidden = !animatingPenalty;
  if (!viewedMatch) {
    stopOnlineLivePresentation();
    els.onlineCurrentMatch.classList.remove("has-penalty-control");
    delete els.onlineCurrentMatch.dataset.matchId;
    return;
  }
  els.onlineCurrentMatch.dataset.matchId = viewedMatch.id;
  const livePenaltyActive = viewedMatch.liveState?.status === "penalties" || Boolean(viewedMatch.liveState?.pendingDecision);
  const legacyPenaltyActive = viewedMatch.status === "penalties";
  els.onlineCurrentMatch.classList.toggle("has-penalty-control", livePenaltyActive || legacyPenaltyActive || !els.onlinePenaltyControl.hidden);
  const viewedRound = room.tournament.rounds.find((round) => round.matches.some((match) => match.id === viewedMatch.id));
  const viewedIndex = viewedRound?.matches.findIndex((match) => match.id === viewedMatch.id) ?? 0;
  els.onlineCardRound.textContent = onlineRoundName(room.tournament, viewedRound?.number || 1).toUpperCase();
  els.onlineCardMatchNumber.textContent = `${viewedIndex + 1}/${viewedRound?.matches.length || 1}`;
  const homeIsMine = room.tournament.teamOwnerById?.[viewedMatch.homeTeamId] === memberId;
  const awayIsMine = room.tournament.teamOwnerById?.[viewedMatch.awayTeamId] === memberId;
  els.onlineMatchHome.innerHTML = onlineMatchTeamMarkup(viewedMatch.homeTeamId, homeIsMine);
  els.onlineMatchAway.innerHTML = onlineMatchTeamMarkup(viewedMatch.awayTeamId, awayIsMine);
  renderOnlineMatchResult(viewedMatch);

  if (viewedMatch.liveState?.simulationVersion === 2) {
    const pending = viewedMatch.liveState.pendingDecision;
    const myTurn = pending?.memberId === memberId;
    const waitingForOpponent = livePenaltyActive && Boolean(pending) && !myTurn;
    els.onlinePenaltyControl.hidden = !myTurn && !waitingForOpponent && !animatingPenalty;
    if (myTurn && !animatingPenalty) {
      els.onlinePenaltyControl.classList.remove("is-cpu-taking");
      els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = onlineRoomBusy; });
      els.onlinePenaltyPrompt.textContent = "Pick your spot";
      const goalkeeperSide = pending.side === "home" ? "away" : "home";
      const tendency = viewedMatch.liveState.goalkeeperTendencies?.[goalkeeperSide]?.primaryTarget || "middle";
      const tendencyLabel = tendency === "middle" ? "the middle" : tendency.endsWith("left") ? "their left" : "their right";
      els.onlinePenaltyFeedback.textContent = `The goalkeeper favours ${tendencyLabel} and adapts to repeated shots`;
      els.onlinePenaltyControl.dataset.matchId = viewedMatch.id;
      els.onlinePenaltyControl.dataset.decisionId = pending.id;
      setPenaltySceneElement(els.onlinePenaltyScene, { direction: "centre", keeperDive: "centre", foot: "right" }, "setup");
    }
    if (waitingForOpponent && !animatingPenalty) {
      const team = TEAM_BY_ID.get(pending.teamId);
      els.onlinePenaltyControl.classList.add("is-cpu-taking");
      els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = true; });
      els.onlinePenaltyPrompt.textContent = `${team?.name || "Opponent"} to take`;
      els.onlinePenaltyFeedback.textContent = "Waiting for the penalty taker";
      els.onlinePenaltyControl.dataset.matchId = viewedMatch.id;
      delete els.onlinePenaltyControl.dataset.decisionId;
      els.onlinePenaltyScene.dataset.target = "middle";
      setPenaltySceneElement(els.onlinePenaltyScene, { direction: "centre", keeperDive: "centre", foot: "right" }, "setup");
    }
    if (controlledMatch?.status === "waiting" && controlledMatch.requiredMemberIds.includes(memberId)) {
      const readyMembers = new Set(controlledMatch.readyMemberIds);
      const isReady = readyMembers.has(memberId);
      els.onlineReadyPanel.hidden = false;
      els.onlineReadyButtonLabel.textContent = isReady ? onlineReadyWaitingLabel(controlledMatch) : "Play this tie";
      els.onlineReadyButton.disabled = onlineRoomBusy || isReady;
      els.onlineReadyButton.dataset.action = "ready";
      els.onlineReadyButton.dataset.matchId = controlledMatch.id;
      els.onlineReadyButton.hidden = false;
    }
    return;
  }
  if (onlineMatchPlayback) return;
  if (controlledMatch?.status === "waiting" && controlledMatch.requiredMemberIds.includes(memberId)) {
    const readyMembers = new Set(controlledMatch.readyMemberIds);
    const isReady = readyMembers.has(memberId);
    els.onlineReadyPanel.hidden = false;
    els.onlineReadyButtonLabel.textContent = isReady ? onlineReadyWaitingLabel(controlledMatch) : "Play this tie";
    els.onlineReadyButton.disabled = onlineRoomBusy || isReady;
    els.onlineReadyButton.dataset.action = "ready";
    els.onlineReadyButton.dataset.matchId = controlledMatch.id;
    els.onlineReadyButton.hidden = false;
  } else if (controlledMatch?.status === "penalties") {
    const myTurn = room.tournament.teamOwnerById[controlledMatch.penalty?.currentTeamId] === memberId;
    els.onlinePenaltyControl.hidden = !myTurn && !animatingPenalty;
    if (myTurn && !animatingPenalty) {
      els.onlinePenaltyControl.classList.remove("is-cpu-taking");
      els.onlinePenaltyPrompt.textContent = "Pick your spot";
      els.onlinePenaltyFeedback.textContent = "Choose one of the five targets";
      setPenaltySceneElement(els.onlinePenaltyScene, { direction: "centre", keeperDive: "centre", foot: "right" }, "setup");
      els.onlinePenaltyScene.dataset.target = "middle";
    }
    if (!myTurn) {
      els.onlineReadyButton.hidden = true;
    }
  }
}

function renderOnlineMatchResult(match) {
  els.onlinePauseMatchButton.dataset.matchId = "";
  els.onlineMatchSpeedButton.dataset.matchId = "";
  els.onlineMatchPenaltyScore.hidden = true;
  renderOnlinePenaltyMarkResults([], [], false);
  if (onlineMatchPlayback?.matchId === match.id) {
    renderOnlinePlaybackFrame();
    return;
  }
  if (match.liveState?.simulationVersion === 2) {
    const live = match.liveState;
    syncOnlineLivePresentation(match);
    const finished = live.status === "finished";
    const displayMinute = projectedOnlineLiveMinute(live);
    els.onlineMatchMinute.textContent = finished ? "FULL TIME" : live.status === "penalties" ? "PENALTIES" : "LIVE";
    els.onlineMatchScore.textContent = live.status === "waiting" ? "– –" : `${live.homeScore}–${live.awayScore}`;
    els.onlineMatchPenaltyScore.hidden = !live.penalty;
    els.onlineMatchPenaltyScore.textContent = live.penalty ? `PENS ${live.penalty.homeScore}–${live.penalty.awayScore}` : "";
    els.onlineMatchClock.textContent = clockText(displayMinute);
    els.onlineMatchPhase.textContent = phaseForLiveStatus(live.status);
    els.onlineLiveLabel.hidden = finished || live.status === "waiting";
    els.onlinePauseMatchButton.hidden = finished || live.status === "waiting";
    els.onlinePauseMatchButton.dataset.matchId = match.id;
    els.onlineMatchSpeedButton.hidden = finished || live.status === "waiting";
    els.onlineMatchSpeedButton.dataset.matchId = match.id;
    els.onlineMatchSpeedButton.textContent = `${live.clock?.effectiveSpeed || 1}×`;
    renderOnlinePauseState(live);
    renderOnlineScorerTimelines(match, displayMinute);
    renderOnlineMatchEvents(match, displayMinute, match.penalty?.kicks?.length || 0);
    renderOnlinePenaltyLedgers(match, match.penalty?.kicks?.length || 0);
    renderOnlineMatchStats(live);
    return;
  }
  if (onlineLivePresentation?.matchId === match.id) stopOnlineLivePresentation();
  els.onlineMatchMinute.textContent = match.status === "complete" ? "FULL TIME" : match.status === "penalties" ? "PENALTIES" : "PRE-MATCH";
  els.onlineMatchScore.textContent = match.status === "waiting" || match.homeScore === null
    ? "– –"
    : `${match.homeScore}–${match.awayScore}`;
  els.onlineMatchPenaltyScore.hidden = !match.penalty;
  els.onlineMatchPenaltyScore.textContent = match.penalty ? `PENS ${match.penalty.homeScore}–${match.penalty.awayScore}` : "";
  renderOnlinePenaltyLedgers(match, match.penalty?.kicks.length || 0);
  els.onlineMatchClock.textContent = match.status === "waiting" ? "00:00" : "90:00";
  els.onlineMatchPhase.textContent = match.status === "waiting" ? "FIRST HALF" : match.status === "penalties" ? "PENALTY SHOOTOUT" : "FULL TIME";
  els.onlineLiveLabel.hidden = true;
  els.onlinePauseMatchButton.hidden = true;
  els.onlineMatchSpeedButton.hidden = true;
  renderOnlineScorerTimelines(match, match.status === "waiting" ? 0 : 90);
  renderOnlineMatchEvents(match, 90, match.penalty?.kicks.length || 0);
}

function onlineServerNow() {
  return Date.now() + (onlineServerOffsetReady ? onlineServerOffsetMs : 0);
}

function renderOnlinePauseState(live) {
  if (!els.onlinePauseMatchButton || !els.onlinePauseCountdown || !live) return;
  const pausedUntil = Number(live.clock?.pausedUntil) || 0;
  const remainingSeconds = Math.max(0, Math.ceil((pausedUntil - onlineServerNow()) / 1000));
  const paused = remainingSeconds > 0;
  els.onlinePauseMatchButton.textContent = paused ? "Resume" : "Pause";
  els.onlinePauseMatchButton.setAttribute("aria-pressed", String(paused));
  els.onlinePauseCountdown.hidden = !paused;
  els.onlinePauseCountdown.textContent = `Auto resumes in ${remainingSeconds}s`;
}

function projectedOnlineLiveMinute(live) {
  if (!live || live.status === "waiting" || live.status === "finished" || live.pendingDecision) return live?.minute || 0;
  const now = onlineServerNow();
  if (live.clock?.pausedUntil && live.clock.pausedUntil > now) return live.minute || 0;
  const nextMinuteAt = Number(live.clock?.nextMinuteAt);
  if (!Number.isFinite(nextMinuteAt)) return live.minute || 0;
  const speed = [1, 2, 4].includes(live.clock?.effectiveSpeed) ? live.clock.effectiveSpeed : 1;
  const minuteDuration = 667 / speed;
  const projected = (live.minute || 0) + Math.max(0, now - (nextMinuteAt - minuteDuration)) / minuteDuration;
  const cap = ({
    firstHalf: 45,
    halfTime: 45,
    secondHalf: 90,
    extraTimeFirst: 105,
    extraTimeSecond: 120,
    penalties: 120,
  })[live.status] || 120;
  return Math.min(cap, projected);
}

function onlinePresentationType(event) {
  if (event.type === "penalty-kick") return event.scored ? "goal" : "penalty-miss";
  if (event.type === "red-card" || event.type === "second-yellow") return "red";
  return event.type;
}

function onlinePresentationEvent(match, event) {
  const type = onlinePresentationType(event);
  const metadata = {
    ...(event.metadata || {}),
    scorer: event.metadata?.scorer || event.player || null,
    scored: event.scored,
    missType: event.missType || null,
  };
  return MatchPresentation.createEvent({
    id: `online:${match.id}:${event.id ?? event.sequence}`,
    sequence: Number(event.id) || Number(event.sequence) || 0,
    minute: event.minute,
    addedTime: event.addedTime || 0,
    type,
    importance: event.importance || (type === "goal" ? "goal" : type === "red" ? "major" : "normal"),
    side: event.side,
    teamId: event.teamId,
    playerIds: [],
    scoreBefore: event.scoreBefore || { home: 0, away: 0 },
    scoreAfter: event.scoreAfter || { home: event.homeScore || 0, away: event.awayScore || 0 },
    phase: event.phase || "first-half",
    metadata,
  });
}

function onlineEventCommentary(match, event) {
  const presentationEvent = onlinePresentationEvent(match, event);
  const team = TEAM_BY_ID.get(event.teamId);
  const opponentId = event.side === "home" ? match.awayTeamId : match.homeTeamId;
  const opponent = TEAM_BY_ID.get(opponentId);
  const player = event.player || event.metadata?.player || event.metadata?.shooter || "A player";
  if (["goal", "penalty-miss", "shootout-kick"].includes(presentationEvent.type)) {
    return MatchPresentation.goalCommentary(presentationEvent, team?.name || "Team");
  }
  if (event.type === "penalty-awarded") return `PENALTY TO ${(team?.name || "THE ATTACKING TEAM").toUpperCase()}!`;
  if (event.type === "save") return `${opponent?.name || "The defending side"}'s goalkeeper is equal to ${player}'s effort.`;
  if (event.type === "shot-blocked") return `${player}'s effort is blocked before it can trouble the goalkeeper.`;
  if (event.type === "shot-missed") return `${player} sends the effort narrowly wide.`;
  if (event.type === "red-card") return `${player} is shown a straight red card!`;
  if (event.type === "second-yellow") return `${player} receives a second yellow and is sent off!`;
  if (event.type === "yellow-card") return `${player} goes into the referee's book.`;
  if (event.type === "substitution") return `${event.playerIn || event.metadata?.playerIn} replaces ${event.playerOut || event.metadata?.playerOut}.`;
  if (event.type === "half-time") return "Half-time. The players head down the tunnel.";
  if (event.type === "extra-time") return "The tie is level. Extra time begins.";
  if (event.type === "extra-time-break") return "Half-time in extra time.";
  if (event.type === "full-time") return "Full-time.";
  return "";
}

function renderOnlineCommentaryEvent(match, event) {
  if (!els.onlineCommentaryFeed || !event) return;
  const presentationEvent = onlinePresentationEvent(match, event);
  const text = onlineEventCommentary(match, event);
  if (!text) return;
  const line = document.createElement("div");
  line.className = `commentary-line ${presentationEvent.type}`;
  const copy = document.createElement("span");
  copy.textContent = presentationEvent.importance === "goal" ? text.toUpperCase() : text;
  line.append(copy);
  els.onlineCommentaryFeed.replaceChildren(line);
  els.onlineCommentaryFeed.classList.toggle("is-goal", presentationEvent.importance === "goal");
  els.onlineCommentaryFeed.classList.toggle("is-major", presentationEvent.importance === "major");
  if (presentationEvent.importance === "goal") flashOnlineGoalCommentary(event.teamId);
}

function flashOnlineGoalCommentary(teamId) {
  const team = TEAM_BY_ID.get(teamId);
  if (!team || !onlineLivePresentation || !els.onlineCommentaryFeed) return;
  const theme = getTeamGoalFlashTheme(team);
  clearTimeout(onlineLivePresentation.goalFlashTimer);
  els.onlineCommentaryFeed.style.setProperty("--goal-flash-color", theme.background);
  els.onlineCommentaryFeed.style.setProperty("--goal-flash-text-color", theme.text);
  els.onlineCommentaryFeed.style.background = theme.background;
  els.onlineCommentaryFeed.style.borderColor = theme.background;
  els.onlineCommentaryFeed.style.color = theme.text;
  els.onlineCommentaryFeed.classList.add("is-goal-flashing");
  onlineLivePresentation.goalFlashTimer = setTimeout(() => {
    if (!els.onlineCommentaryFeed) return;
    els.onlineCommentaryFeed.style.background = "";
    els.onlineCommentaryFeed.style.borderColor = "";
    els.onlineCommentaryFeed.style.color = "";
    els.onlineCommentaryFeed.classList.remove("is-goal-flashing");
  }, 1400);
}

function meaningfulOnlineEvents(match) {
  return (match.events || []).filter((event) => (
    event.importance && event.importance !== "silent"
  ));
}

function createOnlinePresentationScheduler(match) {
  return MatchPresentation.createScheduler({
    now: () => performance.now(),
    onShow: (presentationEvent) => {
      const event = meaningfulOnlineEvents(onlineLivePresentation?.match || match)
        .find((candidate) => `online:${match.id}:${candidate.id ?? candidate.sequence}` === presentationEvent.id);
      if (event && onlineLivePresentation?.matchId === match.id) renderOnlineCommentaryEvent(onlineLivePresentation.match, event);
    },
  });
}

function syncOnlineLivePresentation(match) {
  const live = match.liveState;
  if (!live || live.simulationVersion !== 2) return;
  if (!onlineLivePresentation || onlineLivePresentation.matchId !== match.id) {
    stopOnlineLivePresentation();
    const events = meaningfulOnlineEvents(match).toSorted((a, b) => (a.id || a.sequence) - (b.id || b.sequence));
    onlineLivePresentation = {
      matchId: match.id,
      match,
      scheduler: createOnlinePresentationScheduler(match),
      lastEventId: events.at(-1)?.id || events.at(-1)?.sequence || 0,
      displayedMinute: live.minute || 0,
      goalFlashTimer: null,
    };
    const latest = events.filter((event) => event.minute <= live.minute).at(-1);
    if (latest) renderOnlineCommentaryEvent(match, latest);
    else if (els.onlineCommentaryFeed) els.onlineCommentaryFeed.innerHTML = '<div class="commentary-line"><span>Waiting for the opening passage of play.</span></div>';
  } else {
    onlineLivePresentation.match = match;
    const fresh = meaningfulOnlineEvents(match)
      .filter((event) => (event.id || event.sequence || 0) > onlineLivePresentation.lastEventId)
      .toSorted((a, b) => (a.id || a.sequence) - (b.id || b.sequence));
    fresh.forEach((event) => {
      if (event.type === "shootout-kick") queueOnlineObservedPenalty(match, event);
      onlineLivePresentation.scheduler.enqueue(onlinePresentationEvent(match, event), {
        now: performance.now(),
        speed: live.clock?.effectiveSpeed || 1,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
      onlineLivePresentation.lastEventId = Math.max(onlineLivePresentation.lastEventId, event.id || event.sequence || 0);
    });
  }
  if (!onlineLivePresentationTimer && live.status !== "finished") {
    onlineLivePresentationTimer = requestAnimationFrame(stepOnlineLivePresentation);
  }
}

function stepOnlineLivePresentation() {
  onlineLivePresentationTimer = null;
  const presentation = onlineLivePresentation;
  if (!presentation || els.onlineRoomScreen.hidden) return;
  const live = presentation.match?.liveState;
  if (!live) return;
  const projected = projectedOnlineLiveMinute(live);
  presentation.displayedMinute = Math.max(presentation.displayedMinute || 0, projected);
  const displayMinute = live.status === "finished" ? live.minute : presentation.displayedMinute;
  if (els.onlineMatchClock) els.onlineMatchClock.textContent = clockText(displayMinute);
  if (els.onlineMatchPhase) els.onlineMatchPhase.textContent = phaseForLiveStatus(live.status);
  renderOnlinePauseState(live);
  renderOnlineMatchStats(live);
  presentation.scheduler.tick({
    now: performance.now(),
    speed: live.clock?.effectiveSpeed || 1,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  });
  if (live.status !== "finished" || presentation.scheduler.snapshot().queueLength) {
    onlineLivePresentationTimer = requestAnimationFrame(stepOnlineLivePresentation);
  }
}

function stopOnlineLivePresentation() {
  cancelAnimationFrame(onlineLivePresentationTimer);
  onlineLivePresentationTimer = null;
  if (onlineLivePresentation) {
    clearTimeout(onlineLivePresentation.goalFlashTimer);
    onlineLivePresentation.scheduler?.clear("online-match-change");
  }
  onlineLivePresentation = null;
}

function renderOnlineMatchStats(live) {
  if (!els.onlineMatchStatsGrid || !live) return;
  const totalPossession = (live.possession?.home || 0) + (live.possession?.away || 0);
  const homePossession = totalPossession
    ? Math.round(((live.possession?.home || 0) / totalPossession) * 100)
    : 50;
  const awayPossession = 100 - homePossession;
  const rows = [
    ["Possession", `${homePossession}%`, `${awayPossession}%`],
    ["xG", Number(live.homeXG || 0).toFixed(2), Number(live.awayXG || 0).toFixed(2)],
    ["Shots", live.shots?.home || 0, live.shots?.away || 0],
    ["On target", live.shotsOnTarget?.home || 0, live.shotsOnTarget?.away || 0],
    ["Red cards", live.homeRedCards || 0, live.awayRedCards || 0],
  ];
  const signature = rows.flat().join(":");
  if (els.onlineMatchStatsGrid.dataset.renderSignature === signature) return;
  els.onlineMatchStatsGrid.dataset.renderSignature = signature;
  els.onlineMatchStatsGrid.innerHTML = rows.map(([label, home, away]) => (
    `<div class="online-match-stat-row"><b>${home}</b><span>${label}</span><b>${away}</b></div>`
  )).join("");
}

function phaseForLiveStatus(status) {
  return ({
    waiting: "PRE-MATCH",
    firstHalf: "FIRST HALF",
    halfTime: "HALF TIME",
    secondHalf: "SECOND HALF",
    extraTimeFirst: "EXTRA TIME",
    extraTimeBreak: "EXTRA TIME BREAK",
    extraTimeSecond: "EXTRA TIME",
    penalties: "PENALTY SHOOTOUT",
    finished: "FULL TIME",
  })[status] || "LIVE";
}

function onlineGoalScorer(match, event, eventIndex) {
  if (event?.player) return event.player;
  const team = TEAM_BY_ID.get(event.teamId);
  if (!team) return "Goalscorer";
  const players = team.players?.length ? team.players : generatedPlayers(team);
  return players[stableHash(`${match.id}:${event.teamId}:${event.minute}:${eventIndex}`) % players.length];
}

function onlineGoalEvents(match) {
  return (match.events || [])
    .filter((event) => ["goal", "penalty", "penalty-kick"].includes(event.type || "goal") && event.scored !== false)
    .map((event, index) => ({
      ...event,
      type: ["penalty", "penalty-kick"].includes(event.type) ? "penalty" : "goal",
      side: event.teamId === match.homeTeamId ? "home" : "away",
      player: onlineGoalScorer(match, event, index),
    }));
}

function renderOnlineScorerTimelines(match, minute) {
  const events = onlineGoalEvents(match)
    .filter((event) => event.minute <= minute && event.scored !== false)
    .map((event) => ({ ...event, type: "goal", player: `${event.player}${event.type === "penalty" ? " (P)" : ""}` }));
  const signature = `${match.id}:${events.map((event) => `${event.side}:${event.minute}:${event.player}`).join("|")}`;
  if (els.onlineHomeScorers.dataset.renderSignature === signature) return;
  els.onlineHomeScorers.dataset.renderSignature = signature;
  els.onlineAwayScorers.dataset.renderSignature = signature;
  els.onlineHomeScorers.innerHTML = events
    .filter((event) => event.side === "home")
    .map((event) => timelineEventMarkup(event))
    .join("");
  els.onlineAwayScorers.innerHTML = events
    .filter((event) => event.side === "away")
    .map((event) => timelineEventMarkup(event, true))
    .join("");
}

function penaltyMarkResultsMarkup(results) {
  const slots = Math.max(5, results.length);
  return Array.from({ length: slots }, (_, index) => {
    const result = results[index];
    const state = result === true ? " goal" : result === false ? " miss" : "";
    const label = result === true ? "Scored" : result === false ? "Missed" : "Pending";
    return `<span class="penalty-mark${state}" aria-label="${label}"></span>`;
  }).join("");
}

function renderOnlinePenaltyMarkResults(homeResults, awayResults, visible = true) {
  els.onlineHomePenaltyMarks.hidden = !visible;
  els.onlineAwayPenaltyMarks.hidden = !visible;
  if (!visible) {
    els.onlineHomePenaltyMarks.replaceChildren();
    els.onlineAwayPenaltyMarks.replaceChildren();
    delete els.onlineHomePenaltyMarks.dataset.renderSignature;
    delete els.onlineAwayPenaltyMarks.dataset.renderSignature;
    return;
  }
  const signature = `${homeResults.map((result) => Number(result)).join("")}:${awayResults.map((result) => Number(result)).join("")}`;
  if (els.onlineHomePenaltyMarks.dataset.renderSignature === signature) return;
  els.onlineHomePenaltyMarks.dataset.renderSignature = signature;
  els.onlineAwayPenaltyMarks.dataset.renderSignature = signature;
  els.onlineHomePenaltyMarks.innerHTML = penaltyMarkResultsMarkup(homeResults);
  els.onlineAwayPenaltyMarks.innerHTML = penaltyMarkResultsMarkup(awayResults);
}

function renderOnlinePenaltyLedgers(match, kickCount) {
  if (!match.penalty) {
    renderOnlinePenaltyMarkResults([], [], false);
    return;
  }
  const visibleKicks = (match.penalty.kicks || []).slice(0, kickCount);
  renderOnlinePenaltyMarkResults(
    visibleKicks.filter((kick) => kick.teamId === match.homeTeamId).map((kick) => Boolean(kick.scored)),
    visibleKicks.filter((kick) => kick.teamId === match.awayTeamId).map((kick) => Boolean(kick.scored)),
  );
}

function renderOnlineMatchEvents(match, minute, penaltyKickCount) {
  const events = (match.events || []).filter((event) => event.minute <= minute);
  const signature = `${match.id}:${match.status}:${events.map((event) => `${event.type || "goal"}:${event.minute}:${event.teamId}:${event.scored}`).join("|")}:p${penaltyKickCount}`;
  if (els.onlineMatchEvents.dataset.renderSignature === signature) return;
  els.onlineMatchEvents.dataset.renderSignature = signature;
  const rows = events.map((event, index) => {
    const row = document.createElement("div");
    row.className = `online-match-event ${event.type === "penalty" ? "is-penalty" : "is-goal"} ${event.scored === false ? "is-missed" : ""}`;
    const eventMinute = document.createElement("span");
    eventMinute.textContent = `${event.minute}'`;
    const copy = document.createElement("strong");
    copy.textContent = event.type === "penalty"
      ? `Penalty — ${onlineGoalScorer(match, event, index)} — ${event.scored === false ? "Saved" : "Scored"}`
      : `Goal — ${onlineGoalScorer(match, event, index)}`;
    row.append(eventMinute, copy);
    return row;
  });
  (match.penalty?.kicks || []).slice(0, penaltyKickCount).forEach((kick, index) => {
    const row = document.createElement("div");
    row.className = `online-match-event is-penalty ${kick.scored ? "is-scored" : "is-missed"}`;
    const count = document.createElement("span");
    count.textContent = `P${index + 1}`;
    const copy = document.createElement("strong");
    copy.textContent = `${TEAM_BY_ID.get(kick.teamId)?.name || "Country"} — ${kick.scored ? "Scored" : "Saved"}`;
    row.append(count, copy);
    rows.push(row);
  });
  if (!rows.length) {
    const empty = document.createElement("span");
    empty.className = "online-match-events-empty";
    empty.textContent = match.status === "waiting" ? "The match has not started." : "No goals yet.";
    rows.push(empty);
  }
  els.onlineMatchEvents.replaceChildren(...rows);
  els.onlineMatchEvents.scrollTop = els.onlineMatchEvents.scrollHeight;
}

function onlineCentreMatchCard(match, tournament, memberId, memberById) {
    const isLive = onlineMatchPlayback?.matchId === match.id;
    const visibleEvents = isLive ? (match.events || []).filter((event) => event.minute <= onlineMatchPlayback.minute) : [];
    const liveScore = visibleEvents.at(-1) || { homeScore: 0, awayScore: 0 };
    const sharedState = onlineSharedMatchState(match);
    const cardIsLive = isLive || sharedState.live;
    const home = TEAM_BY_ID.get(match.homeTeamId);
    const away = TEAM_BY_ID.get(match.awayTeamId);
    const homeOwnerId = tournament?.teamOwnerById?.[match.homeTeamId];
    const awayOwnerId = tournament?.teamOwnerById?.[match.awayTeamId];
    const humanOwners = [...new Set([homeOwnerId, awayOwnerId])]
      .map((ownerId) => memberById.get(ownerId))
      .filter((member) => member && !member.isCpu);
    const status = !match.awayTeamId
      ? "THROUGH"
      : isLive
        ? "LIVE"
        : match.status === "waiting"
          ? match.readyMemberIds.length
            ? match.requiredMemberIds.length > 1 ? "WAITING FOR PLAYER" : match.queuePosition > 0 ? "QUEUED" : "STARTING"
            : "READY"
          : match.status === "penalties"
            ? sharedState.label
            : sharedState.label;
    const hasStarted = match.status !== "waiting";
    const homeScore = !hasStarted ? "–" : isLive ? liveScore.homeScore : sharedState.homeScore;
    const awayScore = !hasStarted ? "–" : isLive ? liveScore.awayScore : sharedState.awayScore;
    const winnerVisible = match.status === "complete" && !cardIsLive;
    const card = document.createElement("button");
    card.type = "button";
    card.dataset.matchId = match.id;
    card.className = "online-centre-match";
    card.classList.toggle("is-selected", match.id === onlineViewedMatchId);
    card.innerHTML = `
      <span class="online-centre-head">
        <span>${humanOwners.map((owner) => owner.name).join(" vs ") || "CPU match"}</span>
        <small class="${cardIsLive ? "is-live" : ""}">${cardIsLive ? "<i></i>" : ""}${sharedState.penaltyText || status}</small>
      </span>
      <span class="online-centre-team">
        ${home ? flagMarkup(home, "online-centre-flag") : ""}
        <strong class="${homeOwnerId === memberId ? "is-mine" : ""}">${home?.name || "Bye"}</strong>
        <b>${homeScore}${winnerVisible && match.winnerTeamId === match.homeTeamId ? " ◀" : ""}</b>
      </span>
      <span class="online-centre-team">
        ${away ? flagMarkup(away, "online-centre-flag") : ""}
        <strong class="${awayOwnerId === memberId ? "is-mine" : ""}">${away?.name || "Bye"}</strong>
        <b>${awayScore}${winnerVisible && match.winnerTeamId === match.awayTeamId ? " ◀" : ""}</b>
      </span>
    `;
    return card;
}

function onlineMatchListEmpty(copy) {
  const empty = document.createElement("div");
  empty.className = "online-match-list-empty";
  empty.textContent = copy;
  return empty;
}

function renderOnlineRoundMatches(rounds, tournament, memberId, members = []) {
  clearTimeout(onlineRoundScoreTimer);
  onlineRoundScoreTimer = null;
  const currentRound = rounds.find((round) => round.number === onlineDisplayedRoundNumber) || rounds.at(-1);
  if (!currentRound) {
    els.onlineMyMatches.replaceChildren();
    els.onlineRoundMatches.replaceChildren();
    return;
  }
  const memberById = new Map(members.map((member) => [member.id, member]));
  const isMine = (match) => [match.homeTeamId, match.awayTeamId]
    .some((teamId) => tournament?.teamOwnerById?.[teamId] === memberId);
  let historyChanged = false;
  currentRound.matches.forEach((match) => {
    if (isMine(match) || match.status !== "complete" || onlineSharedMatchState(match).live) return;
    if (!onlinePlayedMatchIds.has(match.id)) {
      onlinePlayedMatchIds.add(match.id);
      historyChanged = true;
    }
    if (!onlineFinishedPlaybackIds.has(match.id)) {
      onlineFinishedPlaybackIds.add(match.id);
      historyChanged = true;
    }
  });
  if (historyChanged) saveOnlineMatchHistory();
  const hasFriend = (match) => [match.homeTeamId, match.awayTeamId].some((teamId) => {
    const ownerId = tournament?.teamOwnerById?.[teamId];
    const owner = memberById.get(ownerId);
    return owner && !owner.isCpu && ownerId !== memberId;
  });
  const myMatches = currentRound.matches.filter(isMine);
  const otherMatches = onlineOtherMatchFilter === "all"
    ? currentRound.matches
    : currentRound.matches.filter((match) => !isMine(match) && hasFriend(match));
  const myCards = myMatches.map((match) => onlineCentreMatchCard(match, tournament, memberId, memberById));
  const otherCards = otherMatches.map((match) => onlineCentreMatchCard(match, tournament, memberId, memberById));
  els.onlineMyMatches.replaceChildren(...(myCards.length ? myCards : [onlineMatchListEmpty("No matches to play in this round.")]));
  els.onlineRoundMatches.replaceChildren(...(otherCards.length ? otherCards : [onlineMatchListEmpty("No friends' matches in this round.")]));
  els.onlineRoundMatches.classList.toggle("is-all-matches", onlineOtherMatchFilter === "all");
  els.onlineOtherMatchesTitle.textContent = onlineOtherMatchFilter === "all" ? "ALL MATCHES" : "FRIENDS' MATCHES";
  els.onlineMatchFilter.querySelectorAll("[data-online-match-filter]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.onlineMatchFilter === onlineOtherMatchFilter);
  });
  updateOnlineRoundNextButton(currentRound, tournament, memberId);
  const hasLiveScore = currentRound.matches.some((match) => match.status === "complete" && onlineSharedMatchState(match).live);
  if (hasLiveScore) {
    onlineRoundScoreTimer = setTimeout(() => {
      if (!latestOnlineRoom || els.onlineRoomScreen.hidden) return;
      renderOnlineRoundMatches(
        latestOnlineRoom.tournament?.rounds || [],
        latestOnlineRoom.tournament,
        onlineRoomSession.memberId,
        latestOnlineRoom.members,
      );
    }, 250);
  }
}

function startOnlineMatchPlayback(match) {
  stopOnlineMatchPlayback();
  onlineViewedMatchId = match.id;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shared = Boolean(
    match.playback?.controllerMemberIds?.length === 2
    && match.playback.controllerMemberIds.includes(onlineRoomSession?.memberId)
  );
  onlineMatchPlayback = {
    matchId: match.id,
    match,
    minute: 0,
    penaltyKickCount: 0,
    speed: 1,
    requestedSpeed: 1,
    paused: false,
    shared,
    sharedPositionMs: 0,
    sharedSnapshotAt: Date.now(),
    sharedPauseUntil: 0,
    reducedMotion,
    baseDuration: shared ? ONLINE_SHARED_PLAYBACK_MS : reducedMotion ? 10000 : ONLINE_SHARED_PLAYBACK_MS,
    lastTimestamp: 0,
    shootoutElapsed: 0,
    finishStarted: 0,
    shownRegulationPenalties: new Set(),
    regulationPenaltyTimers: [],
    regulationPenaltyActive: false,
  };
  if (shared) syncOnlinePlaybackFromMatch(match);
  els.onlineReadyPanel.hidden = true;
  els.onlinePenaltyControl.hidden = true;
  const tournament = latestOnlineRoom?.tournament;
  const memberId = onlineRoomSession?.memberId;
  const controlsTeam = [match.homeTeamId, match.awayTeamId]
    .some((teamId) => tournament?.teamOwnerById?.[teamId] === memberId);
  if (controlsTeam) renderOnlineTactics(tournament, memberId, true, match, true);
  renderOnlinePlaybackFrame();
  onlineMatchPlaybackTimer = requestAnimationFrame(stepOnlineMatchPlayback);
  if (shared) startOnlineRoomPolling();
}

function syncOnlinePlaybackFromMatch(match) {
  const playback = onlineMatchPlayback;
  const shared = match?.playback;
  if (!playback || playback.matchId !== match?.id || !playback.shared || !shared) return;
  const receivedAt = Date.now();
  const sharedUpdatedAt = Number(shared.updatedAt) || receivedAt;
  const sharedPausedUntil = Number(shared.pausedUntil) || 0;
  const nextSpeed = [1, 2, 4].includes(shared.effectiveSpeed) ? shared.effectiveSpeed : 1;
  const currentActiveStart = playback.sharedPauseUntil > playback.sharedSnapshotAt
    ? Math.max(playback.sharedSnapshotAt, playback.sharedPauseUntil)
    : playback.sharedSnapshotAt;
  const currentProjectedPosition = Math.min(
    playback.baseDuration,
    playback.sharedPositionMs + Math.max(0, receivedAt - currentActiveStart) * playback.speed,
  );
  const serverActiveStart = sharedPausedUntil > sharedUpdatedAt
    ? Math.max(sharedUpdatedAt, sharedPausedUntil)
    : sharedUpdatedAt;
  const serverProjectedPosition = Math.min(
    playback.baseDuration,
    Math.max(0, Number(shared.positionMs) || 0) + Math.max(0, receivedAt - serverActiveStart) * nextSpeed,
  );
  const serverRemainingPause = Math.max(0, sharedPausedUntil - receivedAt);
  playback.match = match;
  playback.sharedPositionMs = Math.max(0, serverRemainingPause ? serverProjectedPosition : Math.max(serverProjectedPosition, currentProjectedPosition));
  playback.sharedSnapshotAt = receivedAt;
  playback.sharedPauseUntil = receivedAt + serverRemainingPause;
  playback.speed = nextSpeed;
  playback.requestedSpeed = [1, 2, 4].includes(shared.speedByMemberId?.[onlineRoomSession?.memberId])
    ? shared.speedByMemberId[onlineRoomSession.memberId]
    : 1;
  playback.paused = playback.sharedPauseUntil > receivedAt;
}

function updateSharedOnlinePlaybackClock(playback) {
  const now = Date.now();
  const activeStart = playback.sharedPauseUntil > playback.sharedSnapshotAt
    ? Math.max(playback.sharedSnapshotAt, playback.sharedPauseUntil)
    : playback.sharedSnapshotAt;
  const activeElapsed = Math.max(0, now - activeStart);
  const positionMs = Math.min(playback.baseDuration, playback.sharedPositionMs + activeElapsed * playback.speed);
  playback.minute = Math.min(90, (positionMs / playback.baseDuration) * 90);
  playback.paused = playback.sharedPauseUntil > now;
}

function stepOnlineMatchPlayback(timestamp) {
  const playback = onlineMatchPlayback;
  if (!playback || els.onlineRoomScreen.hidden) {
    stopOnlineMatchPlayback();
    return;
  }
  if (playback.shared) {
    updateSharedOnlinePlaybackClock(playback);
    if (playback.paused) {
      playback.lastTimestamp = 0;
      renderOnlinePlaybackFrame();
      onlineMatchPlaybackTimer = requestAnimationFrame(stepOnlineMatchPlayback);
      return;
    }
  } else if (playback.paused) return;
  if (!playback.lastTimestamp) {
    playback.lastTimestamp = timestamp;
    onlineMatchPlaybackTimer = requestAnimationFrame(stepOnlineMatchPlayback);
    return;
  }
  const elapsed = Math.min(100, timestamp - playback.lastTimestamp);
  playback.lastTimestamp = timestamp;
  if (playback.minute < 90) {
    if (!playback.shared) {
      playback.minute = Math.min(90, playback.minute + (elapsed / playback.baseDuration) * 90 * playback.speed);
    }
  } else if (playback.penaltyKickCount < (playback.match.penalty?.kicks.length || 0)) {
    playback.shootoutElapsed += elapsed * playback.speed;
    playback.penaltyKickCount = Math.min(
      playback.match.penalty.kicks.length,
      Math.floor(playback.shootoutElapsed / (playback.reducedMotion ? 180 : 720)),
    );
  } else if (!playback.finishStarted) {
    playback.finishStarted = timestamp;
  } else if (timestamp - playback.finishStarted >= (playback.reducedMotion ? 120 : 900)) {
    onlinePlayedMatchIds.add(playback.matchId);
    onlineFinishedPlaybackIds.add(playback.matchId);
    saveOnlineMatchHistory();
    stopOnlineMatchPlayback();
    renderOnlineLobby(latestOnlineRoom, onlineRoomSession.memberId);
    return;
  }
  renderOnlinePlaybackFrame();
  onlineMatchPlaybackTimer = requestAnimationFrame(stepOnlineMatchPlayback);
}

function renderOnlinePlaybackFrame() {
  const playback = onlineMatchPlayback;
  if (!playback) return;
  const { match, minute, penaltyKickCount } = playback;
  const visibleEvents = (match.events || []).filter((event) => event.minute <= minute);
  const lastEvent = visibleEvents.at(-1);
  const homeScore = lastEvent?.homeScore || 0;
  const awayScore = lastEvent?.awayScore || 0;
  const visibleKicks = (match.penalty?.kicks || []).slice(0, penaltyKickCount);
  const homePenalties = visibleKicks.filter((kick) => kick.teamId === match.homeTeamId && kick.scored).length;
  const awayPenalties = visibleKicks.filter((kick) => kick.teamId === match.awayTeamId && kick.scored).length;
  els.onlineMatchMinute.textContent = minute < 90 ? "LIVE" : visibleKicks.length < (match.penalty?.kicks.length || 0) ? "PENALTIES" : "FULL TIME";
  els.onlineMatchScore.textContent = minute < 90 || !match.penalty
    ? `${homeScore}–${awayScore}`
    : `${match.homeScore}–${match.awayScore}`;
  els.onlineMatchPenaltyScore.hidden = !match.penalty || minute < 90;
  els.onlineMatchPenaltyScore.textContent = `PENS ${homePenalties}–${awayPenalties}`;
  els.onlineMatchClock.textContent = clockText(minute);
  els.onlineMatchPhase.textContent = phaseForMinute(minute, { extraTime: false, penalties: Boolean(match.penalty) });
  els.onlineLiveLabel.hidden = minute >= 90;
  els.onlinePauseMatchButton.hidden = false;
  els.onlinePauseMatchButton.textContent = playback.paused ? "Resume" : "Pause";
  const pauseSeconds = playback.shared && playback.paused
    ? Math.max(0, Math.ceil((playback.sharedPauseUntil - Date.now()) / 1000))
    : 0;
  els.onlinePauseCountdown.hidden = !pauseSeconds;
  els.onlinePauseCountdown.textContent = `${pauseSeconds}s`;
  els.onlineMatchSpeedButton.hidden = false;
  els.onlineMatchSpeedButton.textContent = `${playback.speed}×`;
  els.onlineMatchSpeedButton.title = playback.shared
    ? `Your choice: ${playback.requestedSpeed}× · Match speed: ${playback.speed}×`
    : `Match speed: ${playback.speed}×`;
  renderOnlineScorerTimelines(match, minute);
  renderOnlineMatchEvents(match, minute, penaltyKickCount);
  if (minute >= 90) renderOnlinePenaltyLedgers(match, penaltyKickCount);
  else renderOnlinePenaltyMarkResults([], [], false);
  showOnlineRegulationPenaltyIfNeeded(match, visibleEvents);
}

function showOnlineRegulationPenaltyIfNeeded(match, visibleEvents) {
  const playback = onlineMatchPlayback;
  if (!playback || playback.regulationPenaltyActive) return;
  const event = visibleEvents.find((item, index) => (
    item.type === "penalty"
    && !playback.shownRegulationPenalties.has(`${item.minute}:${item.teamId}:${index}`)
  ));
  if (!event) return;
  const eventIndex = (match.events || []).indexOf(event);
  const eventKey = `${event.minute}:${event.teamId}:${eventIndex}`;
  playback.shownRegulationPenalties.add(eventKey);
  playback.regulationPenaltyActive = true;
  const seed = stableHash(`${match.id}:${eventKey}`);
  const directions = ["left", "centre", "right"];
  const attempt = {
    direction: directions[seed % directions.length],
    keeperDive: directions[Math.floor(seed / 3) % directions.length],
    foot: seed % 2 ? "right" : "left",
    scored: event.scored !== false,
    missType: event.scored === false ? "save" : null,
  };
  els.onlineMatchPenaltyPlayer.textContent = onlineGoalScorer(match, event, eventIndex);
  els.onlineMatchPenaltyOverlay.hidden = false;
  setPenaltySceneElement(els.onlineMatchPenaltyScene, attempt, "setup");
  const flightTimer = setTimeout(() => setPenaltySceneElement(els.onlineMatchPenaltyScene, attempt, "flight"), 220);
  const resultTimer = setTimeout(() => setPenaltySceneElement(els.onlineMatchPenaltyScene, attempt, "result"), 760);
  const closeTimer = setTimeout(() => {
    els.onlineMatchPenaltyOverlay.hidden = true;
    if (onlineMatchPlayback) onlineMatchPlayback.regulationPenaltyActive = false;
  }, 1500);
  playback.regulationPenaltyTimers.push(flightTimer, resultTimer, closeTimer);
}

function stopOnlineMatchPlayback() {
  (onlineMatchPlayback?.regulationPenaltyTimers || []).forEach((timer) => clearTimeout(timer));
  els.onlineMatchPenaltyOverlay.hidden = true;
  cancelAnimationFrame(onlineMatchPlaybackTimer);
  onlineMatchPlaybackTimer = null;
  onlineMatchPlayback = null;
  if (els.onlinePauseMatchButton) els.onlinePauseMatchButton.hidden = true;
  if (els.onlinePauseCountdown) els.onlinePauseCountdown.hidden = true;
  if (els.onlineMatchSpeedButton) els.onlineMatchSpeedButton.hidden = true;
}

function renderOnlineTeamSelection(room, memberId) {
  const tournament = room.tournament;
  if (onlineMatchPlayback) {
    if (els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.close();
    return;
  }
  const mustChoose = tournament?.selectionRequired?.includes(memberId);
  if (!mustChoose) {
    if (els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.close();
    return;
  }
  const surviving = new Set(tournament.survivingTeamIds || []);
  const teamIds = [...surviving].filter((teamId) => tournament.teamOwnerById[teamId] === memberId);
  els.onlineTeamSelectList.replaceChildren(...teamIds.map((teamId) => {
    const team = TEAM_BY_ID.get(teamId);
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.teamId = teamId;
    button.innerHTML = `${flagMarkup(team, "online-select-flag")}<span><strong>${team.name}</strong><small>${team.officialFifaRank ? `FIFA #${team.officialFifaRank}` : "Guest team"}</small></span>`;
    return button;
  }));
  if (!els.onlineTeamSelectDialog.open) els.onlineTeamSelectDialog.showModal();
}

async function performOnlineMatchAction(path, body) {
  if (onlineRoomBusy || !onlineRoomSession) return;
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  try {
    const payload = await roomApi(`/api/rooms/${onlineRoomSession.code}/${path}`, { method: "POST", body });
    renderOnlineLobby(payload.room, payload.memberId);
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

function onlinePenaltyDirection(target) {
  if (target.endsWith("left")) return "left";
  if (target.endsWith("right")) return "right";
  return "centre";
}

function waitForOnlinePenaltyFrame(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function queueOnlineObservedPenalty(match, event) {
  const memberId = onlineRoomSession?.memberId;
  const ownerId = latestOnlineRoom?.tournament?.teamOwnerById?.[event.teamId];
  if (!match || !event || ownerId === memberId) return;
  const eventKey = `${match.id}:${event.id ?? event.sequence ?? `${event.side}:${event.round}`}`;
  if (onlineObservedPenaltyIds.has(eventKey)) return;
  onlineObservedPenaltyIds.add(eventKey);
  onlineObservedPenaltyQueue.push({ matchId: match.id, event });
  void playOnlineObservedPenaltyQueue();
}

async function playOnlineObservedPenaltyQueue() {
  if (onlineObservedPenaltyPlaybackRunning || onlinePenaltyAnimation) return;
  onlineObservedPenaltyPlaybackRunning = true;
  try {
    while (onlineObservedPenaltyQueue.length && !onlinePenaltyAnimation) {
      const item = onlineObservedPenaltyQueue.shift();
      if (els.onlineCurrentMatch?.dataset.matchId !== item.matchId || els.onlineCurrentMatch.hidden) continue;
      const { event } = item;
      const target = event.target || "middle";
      const team = TEAM_BY_ID.get(event.teamId);
      const wideDirection = target.endsWith("right") ? "wide-right" : "wide-left";
      const attempt = {
        direction: event.missType === "wide" ? wideDirection : onlinePenaltyDirection(target),
        keeperDive: onlinePenaltyDirection(event.goalkeeperTarget || "middle"),
        foot: "right",
        scored: Boolean(event.scored),
        missType: event.missType || (event.scored ? null : "save"),
      };
      onlinePenaltyAnimation = { matchId: item.matchId, target, observed: true };
      els.onlinePenaltyControl.hidden = false;
      els.onlinePenaltyControl.classList.add("is-cpu-taking");
      els.onlinePenaltyPrompt.textContent = `${team?.name || "Opponent"} take`;
      els.onlinePenaltyFeedback.textContent = "Watch the penalty";
      els.onlinePenaltyScene.dataset.target = target;
      els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = true; });
      setPenaltySceneElement(els.onlinePenaltyScene, attempt, "setup");
      await waitForOnlinePenaltyFrame(240);
      setPenaltySceneElement(els.onlinePenaltyScene, attempt, "flight");
      await waitForOnlinePenaltyFrame(560);
      setPenaltySceneElement(els.onlinePenaltyScene, attempt, "result");
      els.onlinePenaltyPrompt.textContent = event.scored ? "Goal" : event.missType === "wide" ? "Missed" : "Saved";
      els.onlinePenaltyFeedback.textContent = event.scored
        ? `${team?.name || "The opponent"} score.`
        : event.missType === "wide"
          ? "The kick goes wide."
          : "The goalkeeper makes the save.";
      await waitForOnlinePenaltyFrame(820);
      onlinePenaltyAnimation = null;
      els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = onlineRoomBusy; });
      if (latestOnlineRoom && onlineRoomSession) renderOnlineLobby(latestOnlineRoom, onlineRoomSession.memberId);
    }
  } finally {
    onlineObservedPenaltyPlaybackRunning = false;
  }
}

async function takeOnlineInteractivePenalty(match, target) {
  if (onlineRoomBusy || !onlineRoomSession || onlinePenaltyAnimation) return;
  onlinePenaltyAnimation = { matchId: match.id, target };
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  els.onlinePenaltyPrompt.textContent = "Taking penalty";
  els.onlinePenaltyFeedback.textContent = "The goalkeeper waits…";
  els.onlinePenaltyScene.dataset.target = target;
  els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = true; });
  try {
    const payload = await roomApi(`/api/rooms/${onlineRoomSession.code}/penalty-kick`, {
      method: "POST",
      body: { matchId: match.id, target, decisionId: match.liveState?.pendingDecision?.id || match.penalty?.decisionId },
    });
    const updatedMatch = payload.room.tournament?.rounds
      ?.flatMap((round) => round.matches)
      .find((item) => item.id === match.id);
    const kick = [...(updatedMatch?.penalty?.kicks || [])]
      .reverse()
      .find((item) => item.target === target) || updatedMatch?.penalty?.kicks?.at(-1);
    if (!kick) throw new Error("The penalty result could not be loaded.");
    const attempt = {
      direction: onlinePenaltyDirection(kick.target),
      keeperDive: onlinePenaltyDirection(kick.goalkeeperTarget),
      foot: "right",
      scored: kick.scored,
      missType: kick.scored ? null : "save",
    };
    setPenaltySceneElement(els.onlinePenaltyScene, attempt, "setup");
    await waitForOnlinePenaltyFrame(80);
    setPenaltySceneElement(els.onlinePenaltyScene, attempt, "flight");
    await waitForOnlinePenaltyFrame(560);
    setPenaltySceneElement(els.onlinePenaltyScene, attempt, "result");
    els.onlinePenaltyPrompt.textContent = kick.scored ? "Goal" : "Saved";
    els.onlinePenaltyFeedback.textContent = kick.scored ? "Perfectly placed." : "The goalkeeper got there.";
    await waitForOnlinePenaltyFrame(760);
    onlinePenaltyAnimation = null;
    renderOnlineLobby(payload.room, payload.memberId);
    void playOnlineObservedPenaltyQueue();
  } catch (error) {
    onlinePenaltyAnimation = null;
    setOnlineRoomMessage(error.message, true);
    if (latestOnlineRoom) renderOnlineLobby(latestOnlineRoom, onlineRoomSession.memberId);
  } finally {
    els.onlinePenaltyControl.querySelectorAll("[data-penalty-target]").forEach((button) => { button.disabled = false; });
    setOnlineRoomBusy(false);
    void playOnlineObservedPenaltyQueue();
  }
}

function setOnlineRouletteSearching(member, room, draft) {
  const round = Math.floor((draft?.turnIndex || 0) / Math.max(1, room.members.length)) + 1;
  els.onlineRoulettePlayer.textContent = `${member?.name || "Player"} · Round ${round}`;
  els.onlineRouletteFlag.textContent = "?";
  els.onlineRouletteTeam.textContent = "Country incoming";
  els.onlineRouletteMeta.textContent = "Searching the remaining countries…";
  els.onlineRoulette.classList.remove("is-revealed");
}

function showOnlineRouletteFrame(member, team, roundNumber) {
  els.onlineRoulettePlayer.textContent = `${member?.name || "Player"} · Round ${roundNumber}`;
  els.onlineRouletteFlag.innerHTML = flagMarkup(team, "roulette-country-flag");
  els.onlineRouletteTeam.textContent = team.name;
  els.onlineRouletteMeta.textContent = "Drawing…";
}

function showOnlineRouletteResult(member, team, pick) {
  els.onlineRoulettePlayer.textContent = `${member?.name || "Player"} receives`;
  els.onlineRouletteFlag.innerHTML = flagMarkup(team, "roulette-country-flag");
  els.onlineRouletteTeam.textContent = team.name;
  els.onlineRouletteMeta.textContent = team.officialFifaRank ? `FIFA #${team.officialFifaRank} · Pick ${pick.pickNumber}` : `Guest team · Pick ${pick.pickNumber}`;
  els.onlineRoulette.classList.remove("is-spinning");
  els.onlineRoulette.classList.add("is-revealed");
}

async function animateOnlineRoulette(member, room, draft, runId) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const frames = reduceMotion ? 2 : 11;
  const frameDelay = reduceMotion ? 70 : 72;
  const claimed = new Set((draft.picks || []).map((pick) => pick.teamId));
  const eligible = TEAMS;
  const ranked = eligible
    .filter((team) => Number.isInteger(team.officialFifaRank))
    .toSorted((a, b) => a.officialFifaRank - b.officialFifaRank);
  const playerCount = room.members.length;
  const roundIndex = Math.floor(draft.turnIndex / playerCount);
  const greatTeams = ranked.filter((team) => team.officialFifaRank <= 20);
  const midTeams = ranked.filter((team) => team.officialFifaRank >= 40 && team.officialFifaRank <= 90);
  const lowerTeams = eligible.filter((team) => !team.officialFifaRank || team.officialFifaRank >= 120);
  const drawPool = roundIndex === 0
    ? greatTeams
    : roundIndex <= 2
      ? midTeams
      : lowerTeams;
  const available = drawPool.filter((team) => !claimed.has(team.id));
  const roundNumber = Math.floor(draft.turnIndex / room.members.length) + 1;
  els.onlineRoulette.classList.remove("is-revealed");
  els.onlineRoulette.classList.add("is-spinning");
  for (let frame = 0; frame < frames; frame += 1) {
    if (runId !== onlineDraftRunId || els.onlineRoomScreen.hidden) return false;
    showOnlineRouletteFrame(member, available[Math.floor(Math.random() * available.length)], roundNumber);
    await waitForDraftBeat(frameDelay);
  }
  els.onlineRouletteTeam.textContent = "Locking in…";
  els.onlineRouletteMeta.textContent = "Country selected securely by the room server";
  return true;
}

async function runOnlineSnakeDraft(initialRoom) {
  if (onlineDraftRunning || !onlineRoomSession?.isHost || initialRoom.draft?.status !== "active") return;
  onlineDraftRunning = true;
  const runId = ++onlineDraftRunId;
  let room = initialRoom;
  try {
    while (room.draft?.status === "active" && runId === onlineDraftRunId && !els.onlineRoomScreen.hidden) {
      const member = room.members.find((item) => item.id === room.draft.currentMemberId);
      const animated = await animateOnlineRoulette(member, room, room.draft, runId);
      if (!animated) break;
      const payload = await roomApi(`/api/rooms/${onlineRoomSession.code}/draft-draw`, {
        method: "POST",
        body: { expectedTurnIndex: room.draft.turnIndex },
      });
      room = payload.room;
      latestOnlineRoom = room;
      const pick = room.draft.picks.at(-1);
      showOnlineRouletteResult(room.members.find((item) => item.id === pick.memberId), TEAM_BY_ID.get(pick.teamId), pick);
      renderOnlineDraft(room, payload.memberId);
      await waitForDraftBeat(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 90 : 450);
    }
    if (room.draft?.status === "complete") {
      showToast("Draft complete. Five countries each.");
      await waitForDraftBeat(550);
      renderOnlineLobby(room, onlineRoomSession.memberId);
    }
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    onlineDraftRunning = false;
    if (latestOnlineRoom?.draft?.status === "active" && onlineRoomSession?.isHost && !els.onlineRoomScreen.hidden) {
      setTimeout(() => runOnlineSnakeDraft(latestOnlineRoom), 500);
    }
  }
}

async function runOnlineDraftSpectator(initialRoom) {
  if (onlineDraftRunning || onlineRoomSession?.isHost || initialRoom.draft?.status !== "active") return;
  onlineDraftRunning = true;
  const runId = ++onlineDraftRunId;
  let room = initialRoom;
  try {
    while (room.draft?.status === "active" && runId === onlineDraftRunId && !els.onlineRoomScreen.hidden) {
      const watchedTurn = room.draft.turnIndex;
      const member = room.members.find((item) => item.id === room.draft.currentMemberId);
      const animated = await animateOnlineRoulette(member, room, room.draft, runId);
      if (!animated) break;
      let payload = await roomApi(`/api/rooms/${onlineRoomSession.code}`);
      room = payload.room;
      if (room.draft.turnIndex === watchedTurn) {
        els.onlineRouletteTeam.textContent = "Waiting for the host…";
        await waitForDraftBeat(220);
        continue;
      }
      latestOnlineRoom = room;
      const pick = room.draft.picks.at(-1);
      showOnlineRouletteResult(room.members.find((item) => item.id === pick.memberId), TEAM_BY_ID.get(pick.teamId), pick);
      renderOnlineDraft(room, payload.memberId);
      await waitForDraftBeat(window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 90 : 450);
    }
    if (room.draft?.status === "complete") {
      await waitForDraftBeat(550);
      renderOnlineLobby(room, onlineRoomSession.memberId);
    }
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    onlineDraftRunning = false;
    if (latestOnlineRoom?.draft?.status === "active" && !onlineRoomSession?.isHost && !els.onlineRoomScreen.hidden) {
      setTimeout(() => runOnlineDraftSpectator(latestOnlineRoom), 500);
    }
  }
}

function stopOnlineDraftRun() {
  onlineDraftRunId += 1;
  onlineDraftRunning = false;
  els.onlineRoulette?.classList.remove("is-spinning");
}

function waitForDraftBeat(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function startOnlineDraft() {
  if (!onlineRoomSession?.isHost || onlineRoomBusy) return;
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  try {
    const payload = await roomApi(`/api/rooms/${onlineRoomSession.code}/draft-start`, { method: "POST" });
    setOnlineRoomBusy(false);
    renderOnlineLobby(payload.room, payload.memberId);
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

async function roomApi(path, { method = "GET", body, token = onlineRoomSession?.token } = {}) {
  const mutating = !["GET", "HEAD"].includes(method);
  const requestBody = mutating ? { ...(body || {}), clientCommandId: body?.clientCommandId || makeOnlineCommandId() } : body;
  const headers = { Accept: "application/json" };
  if (requestBody) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(path, {
      method,
      headers,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch {
    throw new OnlineRoomError("Could not reach the room service. Check your connection.", 0);
  }
  const isJson = (response.headers.get("Content-Type") || "").toLowerCase().includes("application/json");
  if (!isJson) {
    throw new OnlineRoomError("Online rooms are not available on this version of the site yet.", response.status);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new OnlineRoomError(onlineRoomErrorMessage(payload.error), response.status);
  return applyOnlineRoomPayload(payload);
}

async function submitBugReport(event) {
  event.preventDefault();
  const message = els.bugReportMessage.value.trim();
  if (!message) {
    els.bugReportStatus.textContent = "Write a quick note first.";
    els.bugReportMessage.focus();
    return;
  }

  els.bugReportSubmit.disabled = true;
  els.bugReportStatus.textContent = "Sending...";
  try {
    const response = await fetch("/api/bug-report", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        path: window.location.pathname + window.location.search,
      }),
      cache: "no-store",
      credentials: "same-origin",
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Could not send that yet.");
    els.bugReportForm.reset();
    els.bugReportStatus.textContent = "Sent. Thank you.";
    showToast("Anonymous feedback sent.");
    setTimeout(() => {
      if (els.bugReportModal?.open) els.bugReportModal.close();
    }, 700);
  } catch (error) {
    els.bugReportStatus.textContent = error.message || "Could not send that yet.";
  } finally {
    els.bugReportSubmit.disabled = false;
  }
}

function applyOnlineRoomPayload(payload) {
  if (!payload || !payload.mode) return payload;
  if (Number.isFinite(Number(payload.serverNow))) {
    const sampleOffset = Number(payload.serverNow) - Date.now();
    onlineServerOffsetMs = onlineServerOffsetReady
      ? onlineServerOffsetMs * 0.8 + sampleOffset * 0.2
      : sampleOffset;
    onlineServerOffsetReady = true;
  }
  (payload.events || []).forEach((event) => {
    if (Number.isInteger(event.id)) onlineRoomEvents.set(event.id, event);
  });
  if (payload.mode === "snapshot" && payload.room) {
    latestOnlineRoom = payload.room;
  } else if (payload.mode === "delta" && latestOnlineRoom) {
    if (payload.roomPatch?.status) latestOnlineRoom.status = payload.roomPatch.status;
    if (latestOnlineRoom.tournament) {
      latestOnlineRoom.tournament.status = payload.roomPatch?.tournamentStatus || latestOnlineRoom.tournament.status;
      latestOnlineRoom.tournament.roundNumber = payload.roomPatch?.roundNumber || latestOnlineRoom.tournament.roundNumber;
      if (payload.roomPatch?.currentRound) {
        const roundIndex = latestOnlineRoom.tournament.rounds.findIndex((round) => round.number === payload.roomPatch.currentRound.number);
        if (roundIndex >= 0) latestOnlineRoom.tournament.rounds[roundIndex] = payload.roomPatch.currentRound;
        else latestOnlineRoom.tournament.rounds.push(payload.roomPatch.currentRound);
      }
      (payload.matches || []).forEach((changedMatch) => {
        let target = latestOnlineRoom.tournament.rounds
          .flatMap((round) => round.matches).find((match) => match.id === changedMatch.id);
        if (target) Object.assign(target, changedMatch);
        else {
          let round = latestOnlineRoom.tournament.rounds.find((item) => item.number === changedMatch.roundNumber);
          if (!round) {
            round = { number: changedMatch.roundNumber, matches: [] };
            latestOnlineRoom.tournament.rounds.push(round);
          }
          round.matches.push(changedMatch);
          target = changedMatch;
        }
      });
    }
    payload.room = latestOnlineRoom;
  } else if (payload.mode === "noop") {
    payload.room = latestOnlineRoom;
  }
  onlineRoomStateVersion = Number(payload.stateVersion) || onlineRoomStateVersion;
  onlineLastSeenEventId = Number(payload.lastEventId) || onlineLastSeenEventId;
  if (payload.room) hydrateOnlineRoomEvents(payload.room);
  return payload;
}

function hydrateOnlineRoomEvents(room) {
  const byMatch = new Map();
  [...onlineRoomEvents.values()].forEach((event) => {
    if (!event.matchId) return;
    if (!byMatch.has(event.matchId)) byMatch.set(event.matchId, []);
    byMatch.get(event.matchId).push(event);
  });
  room.tournament?.rounds.forEach((round) => round.matches.forEach((match) => {
    const events = (byMatch.get(match.id) || []).toSorted((a, b) => a.id - b.id);
    match.events = match.liveState?.simulationVersion === 2
      ? events
      : events.filter((event) => ["goal", "penalty-kick"].includes(event.type)).map((event) => ({
        ...event,
        scored: event.type === "goal" || event.scored,
        homeScore: event.homeScore,
        awayScore: event.awayScore,
      }));
    if (match.penalty) {
      match.penalty.kicks = events.filter((event) => event.type === "shootout-kick").map((event) => ({
        teamId: event.teamId,
        target: event.target,
        goalkeeperTarget: event.goalkeeperTarget,
        scored: event.scored,
        missType: event.missType,
      }));
    }
  }));
}

function makeOnlineAccessToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function makeOnlineCommandId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function makeOnlineRoomCode() {
  const values = new Uint32Array(1);
  const usableRange = 0x1_0000_0000 - (0x1_0000_0000 % 10_000);
  do crypto.getRandomValues(values); while (values[0] >= usableRange);
  return String(values[0] % 10_000).padStart(4, "0");
}

function onlineRoomErrorMessage(error) {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error.message === "string" && error.message.trim()) return error.message;
  return "The room request failed. Please try again.";
}

function setOnlineDisplayNames(name) {
  els.createOnlineDisplayName.value = name;
  els.joinOnlineDisplayName.value = name;
}

function readOnlineDisplayName(input) {
  const name = input.value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  input.value = name;
  if (!name) {
    setOnlineRoomMessage("Enter a display name for this player.", true);
    input.focus();
    return null;
  }
  if (name.length > 24 || !/^[\p{L}\p{N} ._'-]+$/u.test(name)) {
    setOnlineRoomMessage("Use up to 24 letters, numbers, spaces, apostrophes, dots, dashes or underscores.", true);
    input.focus();
    return null;
  }
  return name;
}

async function createOnlineRoom() {
  if (onlineRoomBusy) return;
  const name = readOnlineDisplayName(els.createOnlineDisplayName);
  if (!name) return;
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  try {
    const accessToken = makeOnlineAccessToken();
    let payload;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        payload = await roomApi("/api/rooms", {
          method: "POST",
          body: { name, accessToken, roomCode: makeOnlineRoomCode() },
          token: null,
        });
        break;
      } catch (error) {
        if (error?.status !== 409 || attempt === 7) throw error;
      }
    }
    if (!payload) throw new Error("Could not reserve a room code. Please try again.");
    saveOnlineRoomSession({
      code: payload.room.code,
      token: accessToken,
      memberId: payload.memberId,
      isHost: true,
      name,
    });
    showOnlineLobbyShell();
    renderOnlineLobby(payload.room, payload.memberId);
    showToast(`Room ${payload.room.code} created.`);
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

async function joinOnlineRoom() {
  if (onlineRoomBusy) return;
  const name = readOnlineDisplayName(els.joinOnlineDisplayName);
  if (!name) return;
  const code = normalizeOnlineRoomCode(els.onlineRoomCodeInput.value);
  els.onlineRoomCodeInput.value = code;
  if (!/^(?:\d{4}|[A-HJ-NP-Z2-9]{6})$/.test(code)) {
    setOnlineRoomMessage("Enter the four-digit room code.", true);
    els.onlineRoomCodeInput.focus();
    return;
  }
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  try {
    const accessToken = makeOnlineAccessToken();
    const payload = await roomApi(`/api/rooms/${code}/join`, { method: "POST", body: { name, accessToken }, token: null });
    saveOnlineRoomSession({
      code,
      token: accessToken,
      memberId: payload.memberId,
      isHost: false,
      name,
    });
    showOnlineLobbyShell();
    renderOnlineLobby(payload.room, payload.memberId);
    showToast(`Joined room ${code}.`);
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

async function updateOnlineDisplayName() {
  if (!onlineRoomSession || onlineRoomBusy || latestOnlineRoom?.status !== "lobby") return;
  const name = readOnlineDisplayName(els.onlineLobbyDisplayName);
  if (!name) return;
  setOnlineRoomBusy(true);
  setOnlineRoomMessage();
  try {
    const payload = await roomApi(`/api/rooms/${onlineRoomSession.code}/rename`, {
      method: "POST",
      body: { name },
    });
    saveOnlineRoomSession({ ...onlineRoomSession, name });
    setOnlineDisplayNames(name);
    renderOnlineLobby(payload.room, payload.memberId);
    showToast("Name updated.");
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

async function refreshOnlineRoom({ quiet = false } = {}) {
  if (!onlineRoomSession) return;
  try {
    const query = onlineRoomStateVersion
      ? `?afterStateVersion=${onlineRoomStateVersion}&lastSeenEventId=${onlineLastSeenEventId}`
      : "";
    const payload = await roomApi(`/api/rooms/${onlineRoomSession.code}${query}`);
    if (payload.room) renderOnlineLobby(payload.room, payload.memberId);
  } catch (error) {
    if ([401, 404].includes(error.status)) {
      const previousName = onlineRoomSession.name || "";
      saveOnlineRoomSession(null);
      setOnlineDisplayNames(previousName);
      showOnlineRoomEntry(true);
      setOnlineRoomMessage("That room has closed or expired.", true);
      return;
    }
    if (!quiet) setOnlineRoomMessage(error.message, true);
  }
}

function startOnlineRoomPolling() {
  stopOnlineRoomPolling();
  const poll = async () => {
    if (!onlineRoomSession || els.onlineRoomScreen.hidden || document.hidden) return;
    await refreshOnlineRoom({ quiet: true });
    onlineRoomPollTimer = setTimeout(poll, onlinePollingInterval());
  };
  onlineRoomPollTimer = setTimeout(poll, onlinePollingInterval());
}

function onlinePollingInterval() {
  const matches = latestOnlineRoom?.tournament?.rounds
    ?.flatMap((round) => round.matches) || [];
  const pending = matches
    .some((match) => match.liveState?.pendingDecision?.memberId === onlineRoomSession?.memberId);
  if (pending) return 400;
  const hasActiveProgressiveMatch = matches.some((match) => (
    match.simulationVersion === 2
    && match.liveState
    && !["waiting", "finished"].includes(match.liveState.status)
  ));
  if (onlineMatchPlayback || hasActiveProgressiveMatch) return 500;
  return 3000;
}

function stopOnlineRoomPolling() {
  clearTimeout(onlineRoomPollTimer);
  onlineRoomPollTimer = null;
}

async function leaveOnlineRoom() {
  if (!onlineRoomSession || onlineRoomBusy) return;
  setOnlineRoomBusy(true);
  try {
    await roomApi(`/api/rooms/${onlineRoomSession.code}/leave`, { method: "POST" });
    const previousName = onlineRoomSession.name || "";
    saveOnlineRoomSession(null);
    setOnlineDisplayNames(previousName);
    showOnlineRoomEntry();
    showToast("You left the online room.");
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

async function closeOnlineRoom() {
  if (!onlineRoomSession?.isHost || onlineRoomBusy) return;
  if (!window.confirm("Close this room for everyone? This cannot be undone.")) return;
  setOnlineRoomBusy(true);
  try {
    await roomApi(`/api/rooms/${onlineRoomSession.code}`, { method: "DELETE" });
    const previousName = onlineRoomSession.name || "";
    saveOnlineRoomSession(null);
    setOnlineDisplayNames(previousName);
    showOnlineRoomEntry();
    showToast("Online room closed.");
  } catch (error) {
    setOnlineRoomMessage(error.message, true);
  } finally {
    setOnlineRoomBusy(false);
  }
}

function normalizeOnlineRoomCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-HJ-NP-Z0-9]/g, "").slice(0, 6);
}

class OnlineRoomError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function audioIsEnabled() {
  return Boolean(state.settings.sound && !document.hidden);
}

function playAudioSample(path, volume, { delay = 0, duration = null } = {}) {
  if (!audioIsEnabled()) return;
  const start = () => {
    if (!audioIsEnabled()) return;
    const audio = new Audio(path);
    let stopTimer = null;
    audio.preload = "auto";
    audio.volume = volume;
    activeMatchSounds.add(audio);
    const cleanup = () => {
      if (stopTimer) clearTimeout(stopTimer);
      activeMatchSounds.delete(audio);
    };
    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });
    audio.play().catch(cleanup);
    if (duration) {
      stopTimer = setTimeout(() => {
        audio.pause();
        cleanup();
      }, duration);
    }
  };
  if (delay) setTimeout(start, delay);
  else start();
}

function primeMatchSounds() {
  if (!state.settings.sound) return;
  Object.values(MATCH_SOUND_PATHS).forEach((path) => {
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.load();
  });
}

function playWhistleSound() {
  playAudioSample(MATCH_SOUND_PATHS.penaltyWhistle, 0.16);
}

function playFullTimeWhistle() {
  playAudioSample(MATCH_SOUND_PATHS.fullTimeWhistle, 0.18);
}

function playFullTimeWhistleOnce() {
  if (!livePlayback || livePlayback.fullTimeWhistlePlayed) return;
  livePlayback.fullTimeWhistlePlayed = true;
  playFullTimeWhistle();
}

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function legacyEmptySlots(draft = legacyDraft) {
  return legacyFormationSlots(draft).filter((slot) => !draft?.lineup?.[slot.id]);
}

function legacyFormation(draft = legacyDraft) {
  return LEGACY_FORMATIONS[draft?.formationId || legacySetup.formationId] || LEGACY_FORMATIONS["433"];
}

function legacyFormationSlots(draft = legacyDraft) {
  return legacyFormation(draft).slots;
}

function legacyPlayerFit(player, slot) {
  if (!player || !slot) return null;
  if (slot.accepts.includes(player.primaryPosition || player.position)) return "natural";
  if ((player.secondaryPositions || []).some((position) => slot.accepts.includes(position))) return "secondary";
  const emergencyWidePositions = {
    LW: ["CAM", "RW", "RM", "ST", "CF", "SS"],
    RW: ["CAM", "LW", "LM", "ST", "CF", "SS"],
    LM: ["CAM", "RW", "RM", "ST", "CF", "SS"],
    RM: ["CAM", "LW", "LM", "ST", "CF", "SS"],
  }[slot.label] || [];
  const playerPositions = [player.primaryPosition || player.position, ...(player.secondaryPositions || [])];
  if (playerPositions.some((position) => emergencyWidePositions.includes(position))) return "out-of-position";
  return null;
}

function legacyPlayerFitsSlot(player, slot) {
  return Boolean(legacyPlayerFit(player, slot));
}

function legacyEffectiveValue(player, slot, value) {
  if (!Number.isFinite(value)) return null;
  const fit = legacyPlayerFit(player, slot);
  const penalty = fit === "secondary"
    ? LEGACY_SECONDARY_POSITION_PENALTY
    : fit === "out-of-position" ? LEGACY_OUT_OF_POSITION_PENALTY : 0;
  return Math.max(1, value - penalty);
}

function legacyEligibleSlots(player, draft = legacyDraft) {
  return legacyEmptySlots(draft).filter((slot) => legacyPlayerFitsSlot(player, slot));
}

function legacyDraftableSquads(nation) {
  return (nation?.squads || []).filter((squad) => squad.dataStatus === "ready");
}

function legacyPlayerAlreadyDrafted(player, draft = legacyDraft) {
  if (!player || !draft) return false;
  const identity = (name) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return draft.draftedIds.includes(player.id)
    || Object.values(draft.lineup).some((draftedPlayer) => identity(draftedPlayer.name) === identity(player.name));
}

function createLegacyDraft(nationId = "england") {
  const nation = LEGACY_NATIONS[nationId];
  if (!nation || !legacyDraftableSquads(nation).length) return null;
  return {
    nationId,
    mode: legacySetup.mode,
    formationId: legacySetup.formationId,
    round: 1,
    lineup: {},
    draftedIds: [],
    selectedOfferId: null,
    movingSlotId: null,
    currentSquad: null,
    yearTicker: null,
    spinning: false,
    revealOffers: false,
    offers: [],
    tournament: null,
    blockedMessage: null,
    complete: false,
    respinsLeft: 1,
    seed: Math.floor(Math.random() * 1_000_000_000),
    nation,
  };
}

function nextLegacyOffers({ excludeYear = null, seedOffset = 0 } = {}) {
  if (!legacyDraft || legacyEmptySlots().length === 0) {
    if (legacyDraft) {
      legacyDraft.complete = true;
      legacyDraft.offers = [];
      saveLegacyDraft();
    }
    return;
  }
  const random = mulberry32(legacyDraft.seed + legacyDraft.round * 9973 + seedOffset * 7919);
  const nation = legacyDraft.nation;
  const emptySlots = legacyEmptySlots();
  const availableSquads = legacyDraftableSquads(nation);
  const alternatives = excludeYear === null ? availableSquads : availableSquads.filter((candidate) => candidate.year !== excludeYear);
  const squads = shuffle(alternatives.length ? alternatives : availableSquads, random);
  const squad = squads.find((candidate) => candidate.players.some((player) => (
    !legacyPlayerAlreadyDrafted(player) && emptySlots.some((slot) => legacyPlayerFitsSlot(player, slot))
  )));
  if (!squad) {
    legacyDraft.spinning = false;
    legacyDraft.blockedMessage = "No remaining historic XI can fill the open positions with unique players.";
    legacyDraft.offers = [];
    saveLegacyDraft();
    return;
  }
  legacyDraft.currentSquad = squad;
  legacyDraft.yearTicker = squad.year;
  legacyDraft.offers = [...squad.players];
  legacyDraft.spinning = false;
  legacyDraft.revealOffers = true;
  legacyDraft.blockedMessage = null;
  saveLegacyDraft();
}

function startLegacyDraft(nationId = "england") {
  clearLegacySpinTimers();
  legacyDraft = createLegacyDraft(nationId);
  if (!legacyDraft) return;
  saveLegacyDraft();
  setAppModeUrl("legacy");
  render();
}

function clearLegacySpinTimers() {
  if (legacySpinTimer) clearInterval(legacySpinTimer);
  if (legacySpinFinishTimer) clearTimeout(legacySpinFinishTimer);
  legacySpinTimer = null;
  legacySpinFinishTimer = null;
}

function spinLegacySquad({ excludeYear = null, seedOffset = 0 } = {}) {
  if (!legacyDraft || legacyDraft.spinning || legacyDraft.offers.length || legacyDraft.complete) return;
  clearLegacySpinTimers();
  const availableYears = legacyDraftableSquads(legacyDraft.nation).map((squad) => squad.year);
  const alternativeYears = excludeYear === null ? availableYears : availableYears.filter((year) => year !== excludeYear);
  const years = alternativeYears.length ? alternativeYears : availableYears;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  legacyDraft.spinning = true;
  legacyDraft.revealOffers = false;
  legacyDraft.selectedOfferId = null;
  legacyDraft.movingSlotId = null;
  if (reduceMotion) {
    nextLegacyOffers({ excludeYear, seedOffset });
    renderLegacyDraftMode();
    return;
  }
  let tick = 0;
  legacySpinTimer = setInterval(() => {
    legacyDraft.yearTicker = years[tick % years.length];
    tick += 1;
    renderLegacyDraftMode();
  }, 85);
  legacySpinFinishTimer = setTimeout(() => {
    clearLegacySpinTimers();
    nextLegacyOffers({ excludeYear, seedOffset });
    renderLegacyDraftMode();
  }, 1700);
  renderLegacyDraftMode();
}

function respinLegacySquad() {
  if (!legacyDraft || legacyDraft.spinning || !legacyDraft.offers.length || legacyDraft.complete || legacyDraft.respinsLeft < 1) return;
  const excludeYear = legacyDraft.currentSquad?.year ?? null;
  legacyDraft.respinsLeft = 0;
  legacyDraft.offers = [];
  legacyDraft.revealOffers = false;
  legacyDraft.selectedOfferId = null;
  saveLegacyDraft();
  spinLegacySquad({ excludeYear, seedOffset: 1 });
}

function draftLegacyPlayer(playerId, slotId) {
  const player = legacyDraft?.offers.find((offer) => offer.id === playerId);
  const slot = legacyFormationSlots().find((item) => item.id === slotId);
  if (!player || !slot || legacyPlayerAlreadyDrafted(player) || legacyDraft.lineup[slot.id] || !legacyPlayerFitsSlot(player, slot)) return;
  legacyDraft.lineup[slot.id] = player;
  legacyDraft.draftedIds.push(player.id);
  legacyDraft.selectedOfferId = null;
  legacyDraft.movingSlotId = null;
  if (legacyEmptySlots().length === 0) {
    legacyDraft.complete = true;
    legacyDraft.offers = [];
  } else {
    legacyDraft.round += 1;
    legacyDraft.currentSquad = null;
    legacyDraft.yearTicker = null;
    legacyDraft.offers = [];
    legacyDraft.revealOffers = false;
  }
  saveLegacyDraft();
  renderLegacyDraftMode();
}

function selectLegacyOffer(playerId) {
  const player = legacyDraft?.offers.find((offer) => offer.id === playerId);
  if (!player || legacyPlayerAlreadyDrafted(player)) return;
  legacyDraft.selectedOfferId = legacyDraft.selectedOfferId === playerId ? null : playerId;
  legacyDraft.movingSlotId = null;
  renderLegacyDraftMode();
}

function selectLegacyFilledSlot(slotId) {
  if (!legacyDraft?.lineup?.[slotId]) return;
  legacyDraft.movingSlotId = legacyDraft.movingSlotId === slotId ? null : slotId;
  legacyDraft.selectedOfferId = null;
  renderLegacyDraftMode();
}

function handleLegacySlotClick(slotId) {
  const slot = legacyFormationSlots().find((item) => item.id === slotId);
  if (!slot || !legacyDraft) return;
  const currentPlayer = legacyDraft.lineup[slotId];
  if (legacyDraft.movingSlotId) {
    const sourceSlotId = legacyDraft.movingSlotId;
    const sourceSlot = legacyFormationSlots().find((item) => item.id === sourceSlotId);
    const movingPlayer = legacyDraft.lineup[sourceSlotId];
    if (sourceSlotId === slotId) {
      legacyDraft.movingSlotId = null;
      renderLegacyDraftMode();
      return;
    }
    const canMove = movingPlayer && legacyPlayerFitsSlot(movingPlayer, slot);
    const canSwap = currentPlayer && sourceSlot && legacyPlayerFitsSlot(currentPlayer, sourceSlot);
    if (canMove && (!currentPlayer || canSwap)) {
      if (currentPlayer) legacyDraft.lineup[sourceSlotId] = currentPlayer;
      else delete legacyDraft.lineup[sourceSlotId];
      legacyDraft.lineup[slotId] = movingPlayer;
      legacyDraft.movingSlotId = null;
      saveLegacyDraft();
      renderLegacyDraftMode();
    }
    return;
  }
  if (currentPlayer) {
    selectLegacyFilledSlot(slotId);
    return;
  }
  if (legacyDraft.selectedOfferId) draftLegacyPlayer(legacyDraft.selectedOfferId, slotId);
}

function legacyOverallRating() {
  const entries = legacyFormationSlots().map((slot) => ({ slot, player: legacyDraft?.lineup?.[slot.id] })).filter(({ player }) => player);
  return entries.length ? Math.round(entries.reduce((sum, { player, slot }) => sum + legacyEffectiveValue(player, slot, player.rating), 0) / entries.length) : 0;
}

function legacyChemistryScore() {
  const players = legacyFormationSlots().map((slot) => legacyDraft?.lineup?.[slot.id]).filter(Boolean);
  if (!players.length) return 0;
  const yearCounts = players.reduce((counts, player) => {
    counts[player.year] = (counts[player.year] || 0) + 1;
    return counts;
  }, {});
  const peakYearLinks = Math.max(...Object.values(yearCounts));
  const naturalFits = legacyFormationSlots().filter((slot) => legacyPlayerFit(legacyDraft.lineup[slot.id], slot) === "natural").length;
  const secondaryFits = legacyFormationSlots().filter((slot) => legacyPlayerFit(legacyDraft.lineup[slot.id], slot) === "secondary").length;
  return Math.min(100, Math.round(55 + peakYearLinks * 4 + naturalFits * 3 + secondaryFits * 2));
}

function legacyDraftTeam() {
  const nationTeam = TEAM_BY_ID.get(legacyDraft.nation.teamId) || TEAMS.find((team) => team.name === legacyDraft.nation.name) || TEAMS[0];
  const playersByLine = legacyFormationSlots().map((slot) => ({ slot, player: legacyDraft.lineup[slot.id] }));
  const attackers = playersByLine.filter(({ slot }) => ["ST", "CF", "SS", "LW", "RW", "LM", "RM"].includes(slot.label));
  const midfielders = playersByLine.filter(({ slot }) => ["CM", "CDM", "CAM", "LM", "RM"].includes(slot.label));
  const defenders = playersByLine.filter(({ slot }) => ["CB", "LB", "RB", "LWB", "RWB"].includes(slot.label));
  const average = (entries, score) => entries.length ? Math.round(entries.reduce((sum, entry) => sum + score(entry), 0) / entries.length) : legacyOverallRating();
  const overall = legacyOverallRating();
  const weighted = (attributes, weights) => Math.round(Object.entries(weights).reduce((sum, [key, weight]) => sum + (attributes[key] || overall) * weight, 0));
  const attackerStat = ({ player, slot }) => legacyEffectiveValue(player, slot, weighted(legacyPlayerAttributes(player), { shooting: 0.36, dribbling: 0.24, pace: 0.20, passing: 0.12, physical: 0.08 }));
  const midfielderStat = ({ player, slot }) => legacyEffectiveValue(player, slot, weighted(legacyPlayerAttributes(player), { passing: 0.31, dribbling: 0.22, defending: 0.17, physical: 0.13, shooting: 0.10, pace: 0.07 }));
  const defenderStat = ({ player, slot }) => legacyEffectiveValue(player, slot, weighted(legacyPlayerAttributes(player), { defending: 0.48, physical: 0.25, pace: 0.14, passing: 0.09, dribbling: 0.04 }));
  const attack = average(attackers, (entry) => attackerStat(entry));
  const midfield = average(midfielders, (entry) => midfielderStat(entry));
  const defence = average(defenders, (entry) => defenderStat(entry));
  const goalkeeperPlayer = legacyDraft.lineup.GK;
  const goalkeeperSlot = legacyFormationSlots().find((slot) => slot.id === "GK");
  const goalkeeper = goalkeeperPlayer
    ? legacyEffectiveValue(goalkeeperPlayer, goalkeeperSlot, weighted(legacyPlayerAttributes(goalkeeperPlayer), { diving: 0.24, handling: 0.18, kicking: 0.08, reflexes: 0.26, speed: 0.04, positioning: 0.20 }))
    : legacyOverallRating();
  const chemistry = legacyChemistryScore();
  return {
    ...nationTeam,
    id: `legacy-${legacyDraft.nationId}-xi`,
    name: `${legacyDraft.nation.name} Legacy XI`,
    playerProfiles: undefined,
    seed: 1,
    strength: overall,
    players: legacyFormationSlots().map((slot) => legacyDraft.lineup[slot.id].name),
    rating: overall,
    positionSuitability: playersByLine.map(({ slot, player }) => {
      const attributes = legacyPlayerAttributes(player);
      return {
        player: player.name,
        slot: slot.label,
        fit: legacyPlayerFit(player, slot),
        overall: legacyEffectiveValue(player, slot, player.rating),
        finishing: slot.label === "GK" ? 5 : attributes.shooting,
        pace: attributes.pace,
        shooting: slot.label === "GK" ? 5 : attributes.shooting,
        passing: attributes.passing,
        dribbling: attributes.dribbling,
        defending: attributes.defending,
        physical: attributes.physical,
        goalkeeping: slot.label === "GK"
          ? weighted(attributes, { diving: 0.24, handling: 0.18, kicking: 0.08, reflexes: 0.26, speed: 0.04, positioning: 0.20 })
          : 5,
      };
    }),
    simulationRatings: {
      overall,
      attack,
      midfield,
      defence,
      goalkeeper,
      squadDepth: overall,
      experience: Math.round((overall + chemistry) / 2),
      penalties: Math.round((attack + midfield) / 2),
      discipline: 70,
    },
  };
}

function nextLegacyTournamentSeed(previousSeed) {
  const maximumSeed = 2147483647;
  const fallbackSeed = legacyDraft?.seed || 1;
  const normalizedSeed = Math.abs(Math.trunc(Number(previousSeed) || fallbackSeed)) % maximumSeed;
  return (normalizedSeed + 104729) % maximumSeed || 1;
}

function createLegacyTournamentState() {
  const customTeam = legacyDraftTeam();
  TEAM_BY_ID.set(customTeam.id, customTeam);
  [...playerProfileCache.keys()]
    .filter((key) => key.startsWith(`${customTeam.id}:`))
    .forEach((key) => playerProfileCache.delete(key));
  const tournamentSeed = Number(legacyDraft.tournamentSeed) || legacyDraft.seed;
  const random = mulberry32(tournamentSeed + 77);
  const eliteNames = new Set(["Brazil", "France", "Germany", "Argentina", "Italy", "Netherlands", "Portugal", "Spain", "England"]);
  const customRating = customTeam.strength || customTeam.rating || 0;
  const available = TEAMS.filter((team) => team.name !== legacyDraft.nation.name);
  const ratingOf = (team) => team.strength || team.rating || 0;
  const selectedIds = new Set();
  const takeRandom = (candidates, count) => {
    const choices = shuffle(candidates.filter((team) => !selectedIds.has(team.id)), random).slice(0, count);
    choices.forEach((team) => selectedIds.add(team.id));
    return choices;
  };

  // Give an average draft a fair opening tie, then let the bracket ramp up toward elite opposition.
  const openingPool = available
    .filter((team) => !eliteNames.has(team.name) && ratingOf(team) >= customRating - 8 && ratingOf(team) <= customRating + 1)
    .sort((left, right) => Math.abs(ratingOf(left) - (customRating - 3)) - Math.abs(ratingOf(right) - (customRating - 3)))
    .slice(0, 16);
  const openingOpponent = takeRandom(openingPool.length ? openingPool : available.filter((team) => !eliteNames.has(team.name)), 1)[0];
  const quarterPool = available
    .filter((team) => !eliteNames.has(team.name) && ratingOf(team) <= customRating + 3)
    .sort((left, right) => Math.abs(ratingOf(left) - customRating) - Math.abs(ratingOf(right) - customRating))
    .slice(0, 24);
  const quarterOpponents = takeRandom(quarterPool, 2);
  const eliteOpponents = takeRandom(available.filter((team) => eliteNames.has(team.name)), 4);
  const remainingOpponents = takeRandom(
    available
      .filter((team) => !selectedIds.has(team.id))
      .sort((left, right) => ratingOf(right) - ratingOf(left))
      .slice(0, 32),
    8,
  );
  const laterRoundField = shuffle([...eliteOpponents, ...remainingOpponents], random);
  const entrants = [customTeam, openingOpponent, ...quarterOpponents, ...laterRoundField];
  const roundOf16Matches = [];
  for (let i = 0; i < 8; i += 1) {
    roundOf16Matches.push({ id: `legacy-${tournamentSeed}-r4-m${i}`, homeId: entrants[i * 2].id, awayId: entrants[i * 2 + 1].id, result: null });
  }
  const tournamentState = createInitialState();
  tournamentState.drawSeed = tournamentSeed;
  tournamentState.settings = { ...defaultSettings };
  tournamentState.rounds = [];
  for (let r = 0; r < 8; r += 1) tournamentState.rounds[r] = null;
  tournamentState.rounds[4] = roundOf16Matches;
  tournamentState.activeRound = 4;
  tournamentState.selectedMatch = Math.max(0, roundOf16Matches.findIndex((match) => match.homeId === customTeam.id || match.awayId === customTeam.id));
  tournamentState.championView = false;
  tournamentState.started = true;
  tournamentState.legacyTournament = true;
  tournamentState.spectateTeamId = customTeam.id;
  return tournamentState;
}

function runLegacyTournament() {
  if (!legacyDraft?.complete) return;
  legacyDraft.tournamentSeed = nextLegacyTournamentSeed(legacyDraft.tournamentSeed || legacyDraft.seed);
  state = createLegacyTournamentState();
  saveState();
  saveLegacyDraft();
  setAppModeUrl("standard");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function createFirstRound(drawSeed) {
  const random = mulberry32(drawSeed);
  const topHalf = shuffle(TEAMS.slice(0, 128), random);
  const bottomHalf = shuffle(TEAMS.slice(128), random);
  return topHalf.map((team, index) => ({
    id: `r0-m${index}`,
    homeId: team.id,
    awayId: bottomHalf[index].id,
    result: null,
  }));
}

function normalizeDistinctGoalMinutes(result) {
  if (!result) return;
  const events = [
    ...(result.homeEvents || []).map((event, order) => ({ event, order, side: "home" })),
    ...(result.awayEvents || []).map((event, order) => ({ event, order: order + 1000, side: "away" })),
  ].sort((a, b) => a.event.minute - b.event.minute || a.order - b.order);
  const usedMinutes = new Set();
  events.forEach(({ event, side }) => {
    const start = event.minute > 90 ? 91 : 2;
    const dismissal = (result.redCards || []).find((card) => card.side === side && card.player === event.scorer);
    const segmentEnd = event.minute > 90 ? 120 : 90;
    const end = dismissal ? Math.min(segmentEnd, dismissal.minute) : segmentEnd;
    let minute = Math.min(end, Math.max(start, event.minute));
    if (usedMinutes.has(minute)) {
      for (let offset = 1; offset <= end - start; offset += 1) {
        const later = minute + offset;
        const earlier = minute - offset;
        if (later <= end && !usedMinutes.has(later)) {
          minute = later;
          break;
        }
        if (earlier >= start && !usedMinutes.has(earlier)) {
          minute = earlier;
          break;
        }
      }
    }
    event.minute = minute;
    usedMinutes.add(minute);
  });
  result.homeEvents?.sort((a, b) => a.minute - b.minute);
  result.awayEvents?.sort((a, b) => a.minute - b.minute);
}

function createInitialState() {
  const drawSeed = Date.now() % 2147483647;
  return {
    version: STATE_VERSION,
    drawSeed,
    settings: { ...defaultSettings },
    rounds: [createFirstRound(drawSeed)],
    activeRound: 0,
    selectedMatch: 0,
    championView: false,
    started: false,
    predictionTeamId: null,
    spectateTeamId: null,
    neutralView: false,
    standardTactic: "balanced",
  };
}

function isValidLegacyTournamentState(candidate) {
  if (candidate?.legacyTournament !== true || !Array.isArray(candidate.rounds)) return false;
  const roundOf16 = candidate.rounds[4];
  if (!Array.isArray(roundOf16) || roundOf16.length !== 8 || Number(candidate.activeRound) < 4) return false;
  const teamIds = roundOf16.flatMap((match) => [match?.homeId, match?.awayId]).filter(Boolean);
  const legacyTeamId = typeof candidate.spectateTeamId === "string" && candidate.spectateTeamId.startsWith("legacy-")
    ? candidate.spectateTeamId
    : teamIds.find((teamId) => typeof teamId === "string" && teamId.startsWith("legacy-"));
  return Boolean(legacyTeamId && teamIds.includes(legacyTeamId));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const isLegacyTournament = isValidLegacyTournamentState(saved);
    if (
      saved?.version === STATE_VERSION &&
      Array.isArray(saved.rounds) &&
      (saved.rounds[0]?.length === 128 || isLegacyTournament)
    ) {
      if (typeof saved.started !== "boolean") {
        saved.started = false;
      }
      saved.settings = { ...defaultSettings, ...(saved.settings || {}) };
      saved.settings.realNames = true;
      if (!STANDARD_TACTICS[saved.standardTactic]) saved.standardTactic = "balanced";
      delete saved.settings.spoiler;
      const isSavedLegacyTeam = (teamId) => isLegacyTournament && typeof teamId === "string" && teamId.startsWith("legacy-");
      if (!TEAM_BY_ID.has(saved.predictionTeamId) && !isSavedLegacyTeam(saved.predictionTeamId)) saved.predictionTeamId = null;
      if (!TEAM_BY_ID.has(saved.spectateTeamId) && !isSavedLegacyTeam(saved.spectateTeamId)) saved.spectateTeamId = null;
      saved.rounds.flat().forEach((match) => normalizeDistinctGoalMinutes(match?.result));
      return saved;
    }
  } catch {
    // A corrupt save should never block the tournament.
  }
  return createInitialState();
}

let state = loadState();

const startupMode = currentAppMode();
const legacyTournamentMarker = new URLSearchParams(window.location.search).has("legacyTournament");
if (startupMode === "standard" && legacyTournamentMarker) {
  try {
    const legacySession = JSON.parse(localStorage.getItem(LEGACY_TOURNAMENT_SESSION_KEY));
    const validLegacySession = legacySession?.version === STATE_VERSION && isValidLegacyTournamentState(legacySession);
    if (validLegacySession) {
      legacySession.settings = { ...defaultSettings, ...(legacySession.settings || {}) };
      state = legacySession;
    } else if (legacySession) {
      localStorage.removeItem(LEGACY_TOURNAMENT_SESSION_KEY);
    }
  } catch {
    localStorage.removeItem(LEGACY_TOURNAMENT_SESSION_KEY);
  }
  if (!isValidLegacyTournamentState(state) && legacyDraft?.complete) {
    state = createLegacyTournamentState();
    saveState();
  }
}

// Restore the custom team only while an active Legacy Draft tournament is open.
if (state.legacyTournament && state.spectateTeamId?.startsWith("legacy-")) {
  if (!TEAM_BY_ID.has(state.spectateTeamId) && legacyDraft?.complete) {
    const team = legacyDraftTeam();
    TEAM_BY_ID.set(team.id, team);
  }
  if (!TEAM_BY_ID.has(state.spectateTeamId)) {
    // Last resort: rebuild legacy draft from saved slots if draft state missing
    try {
      const raw = JSON.parse(localStorage.getItem("legacyDraftState"));
      if (raw?.nationId && LEGACY_NATIONS[raw.nationId]) {
        const nation = LEGACY_NATIONS[raw.nationId];
        legacyDraft = {
          nationId: raw.nationId, mode: raw.mode || "classic", formationId: raw.formationId || "433",
          seed: raw.seed || 1, complete: true,
          nation, formation: legacyFormationById(raw.formationId || "433"),
          lineup: {}, offers: [], currentSquad: null,
        };
        TEAM_BY_ID.set(legacyDraftTeam().id, legacyDraftTeam());
      }
    } catch { /* cannot recover */ }
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (isValidLegacyTournamentState(state)) {
    localStorage.setItem(LEGACY_TOURNAMENT_SESSION_KEY, JSON.stringify(state));
  }
}

function teamById(id) {
  return TEAM_BY_ID.get(id);
}

function selectedRound() {
  return state.rounds[state.activeRound] || [];
}

function selectedMatch() {
  return selectedRound()[state.selectedMatch] || null;
}

function allMatches() {
  return state.rounds.flatMap((round) => round || []);
}

function spectatedTeam() {
  return state.spectateTeamId ? teamById(state.spectateTeamId) : null;
}

function teamElimination(teamId) {
  for (let roundIndex = 0; roundIndex < state.rounds.length; roundIndex += 1) {
    const match = (state.rounds[roundIndex] || []).find((item) => (
      item.result?.revealed
      && (item.homeId === teamId || item.awayId === teamId)
      && item.result.winnerId !== teamId
    ));
    if (match) return { match, roundIndex };
  }
  return null;
}

function teamIsAlive(teamId) {
  return !teamElimination(teamId);
}

function teamMatchIndex(roundIndex, teamId = state.spectateTeamId) {
  if (!teamId) return -1;
  return (state.rounds[roundIndex] || []).findIndex((match) => (
    match.homeId === teamId || match.awayId === teamId
  ));
}

function focusSpectatedTeam(roundIndex = currentTournamentRoundIndex()) {
  const matchIndex = teamMatchIndex(roundIndex);
  if (matchIndex < 0) return false;
  state.activeRound = roundIndex;
  state.selectedMatch = matchIndex;
  state.championView = false;
  fixtureLimit = DEFAULT_FIXTURE_LIMIT;
  filterUnresolved = false;
  return true;
}

function renderSpectatePicker() {
  const savedTeam = spectatedTeam();
  const team = savedTeam?.id?.startsWith("legacy-") ? null : savedTeam;
  els.spectatePickerButton.classList.toggle("has-team", Boolean(team));
  if (!team) {
    els.spectatePickerMark.textContent = "◎";
    els.spectatePickerLabel.textContent = "Neutral";
    els.spectatePickerHint.textContent = "Show every match as normal";
    els.spectatePickerButton.setAttribute("aria-label", "Choose a team to spectate. Current view: Neutral");
    return;
  }
  els.spectatePickerMark.innerHTML = flagMarkup(team, "spectate-picker-flag");
  els.spectatePickerLabel.textContent = team.name;
  els.spectatePickerHint.textContent = "Jump to this team every round";
  els.spectatePickerButton.setAttribute("aria-label", `Choose a team to spectate. Current team: ${team.name}`);
}

function compareTeamsByOfficialFifaRank(a, b) {
  const rankA = a.officialFifaRank ?? Number.POSITIVE_INFINITY;
  const rankB = b.officialFifaRank ?? Number.POSITIVE_INFINITY;
  return rankA - rankB || a.name.localeCompare(b.name);
}

function renderSpectateList(query = "") {
  const normalized = query.trim().toLowerCase();
  const onlyAlive = spectatePickerMode === "alive";
  const selectedTeamId = state.spectateTeamId?.startsWith("legacy-") ? null : state.spectateTeamId;
  const teams = TEAMS
    .filter((team) => (!onlyAlive || teamIsAlive(team.id)) && team.name.toLowerCase().includes(normalized))
    .sort(compareTeamsByOfficialFifaRank);
  const neutralOption = onlyAlive || normalized
    ? ""
    : `
      <button class="prediction-option spectate-neutral-option ${selectedTeamId ? "" : "selected"}" type="button" data-team-id="">
        <span class="spectate-neutral-mark" aria-hidden="true">◎</span>
        <span><strong>Neutral</strong><small>Show every match as normal</small></span>
        <i aria-hidden="true">${selectedTeamId ? "" : "✓"}</i>
      </button>
    `;
  els.spectateList.innerHTML = neutralOption + teams.map((team) => `
    <button class="prediction-option ${team.id === selectedTeamId ? "selected" : ""}" type="button" data-team-id="${team.id}">
      ${flagMarkup(team, "prediction-option-flag")}
      <span><strong>${team.name}</strong><small>${team.officialFifaRank ? `FIFA #${team.officialFifaRank}` : "Guest team"}</small></span>
      <i aria-hidden="true">${team.id === selectedTeamId ? "✓" : ""}</i>
    </button>
  `).join("") || `<div class="overview-empty">No available team matches that search.</div>`;
}

function openSpectatePicker(mode = "all") {
  spectatePickerMode = mode;
  els.spectateSearch.value = "";
  renderSpectateList();
  els.spectateModal.showModal();
  requestAnimationFrame(() => els.spectateSearch.focus());
}

function predictionProgress() {
  const team = state.predictionTeamId ? teamById(state.predictionTeamId) : null;
  if (!team) return null;
  for (let roundIndex = 0; roundIndex < state.rounds.length; roundIndex += 1) {
    const loss = (state.rounds[roundIndex] || []).find((match) => (
      match.result?.revealed
      && (match.homeId === team.id || match.awayId === team.id)
      && match.result.winnerId !== team.id
    ));
    if (loss) return { team, state: "eliminated", roundIndex, label: `Eliminated in ${ROUND_NAMES[roundIndex]}` };
  }
  const final = state.rounds[7]?.[0];
  if (final?.result?.revealed && final.result.winnerId === team.id) {
    return { team, state: "correct", roundIndex: 7, label: "Prediction correct" };
  }
  return { team, state: "alive", roundIndex: state.activeRound, label: "Still alive" };
}

function renderPredictionList(query = "") {
  const normalized = query.trim().toLowerCase();
  const teams = TEAMS
    .filter((team) => team.name.toLowerCase().includes(normalized))
    .sort(compareTeamsByOfficialFifaRank)
    .slice(0, normalized ? 80 : 40);
  els.predictionList.innerHTML = teams.map((team) => `
    <button class="prediction-option ${team.id === state.predictionTeamId ? "selected" : ""}" type="button" data-team-id="${team.id}">
      ${flagMarkup(team, "prediction-option-flag")}
      <span><strong>${team.name}</strong><small>${team.officialFifaRank ? `FIFA #${team.officialFifaRank}` : "Guest team"}</small></span>
      <i aria-hidden="true">${team.id === state.predictionTeamId ? "✓" : ""}</i>
    </button>
  `).join("") || `<div class="overview-empty">No team matches that search.</div>`;
  els.clearPredictionButton.hidden = !state.predictionTeamId;
}

function renderChampionPrediction(champion) {
  const progress = predictionProgress();
  els.championPredictionResult.hidden = !progress;
  if (!progress) return;
  const correct = progress.team.id === champion.id;
  els.championPredictionResult.classList.toggle("correct", correct);
  els.championPredictionResult.innerHTML = `
    ${flagMarkup(progress.team, "prediction-result-flag")}
    <span><small>YOUR PREDICTION</small><strong>${progress.team.name}</strong></span>
    <b>${correct ? "✓ CORRECT" : "MISSED"}</b>
  `;
}

function tournamentScoringForTeam(teamId) {
  const playerGoals = new Map();
  let teamGoals = 0;
  allMatches().forEach((match) => {
    if (!match?.result) return;
    const side = match.homeId === teamId ? "home" : match.awayId === teamId ? "away" : null;
    if (!side) return;
    teamGoals += side === "home" ? match.result.homeGoals : match.result.awayGoals;
    const events = side === "home" ? match.result.homeEvents : match.result.awayEvents;
    (events || []).forEach((event) => {
      if (event.goalType === "ownGoal" || event.ownGoal) return;
      playerGoals.set(event.scorer, (playerGoals.get(event.scorer) || 0) + 1);
    });
  });
  return { teamGoals, playerGoals };
}

function completedCount() {
  return allMatches().filter((match) => match?.result).length;
}

function calculateGoalscorerTable(rounds = state.rounds) {
  const scorers = new Map();
  const teamAppearances = new Map();
  rounds.forEach((round, roundIndex) => {
    (round || []).forEach((match) => {
      if (!match?.result?.revealed) return;
      teamAppearances.set(match.homeId, (teamAppearances.get(match.homeId) || 0) + 1);
      teamAppearances.set(match.awayId, (teamAppearances.get(match.awayId) || 0) + 1);
      const addGoals = (events, teamId) => {
        (events || []).forEach((event) => {
          if (event.goalType === "ownGoal" || event.ownGoal) return;
          const key = `${teamId}\u0000${event.scorer}`;
          const current = scorers.get(key) || {
            player: event.scorer,
            teamId,
            goals: 0,
            penalties: 0,
            latestRound: roundIndex,
          };
          current.goals += 1;
          if (event.goalType === "penalty") current.penalties += 1;
          current.latestRound = Math.max(current.latestRound, roundIndex);
          scorers.set(key, current);
        });
      };
      addGoals(match.result.homeEvents, match.homeId);
      addGoals(match.result.awayEvents, match.awayId);
    });
  });

  return [...scorers.values()].map((entry) => {
    const team = teamById(entry.teamId);
    const squadProfiles = playerProfilesForTeam(team);
    const profile = squadProfiles.find((player) => player.name === entry.player);
    const matches = teamAppearances.get(entry.teamId) || 0;
    return {
      ...entry,
      matches,
      minutes: profile ? Math.round(matches * 90 * profile.expectedMinutesShare) : matches * 90,
      position: profile?.position || "—",
      playerOverall: profile?.overall || team?.rating || 0,
      finishing: profile?.finishing || 0,
      attackingRole: profile?.attackingRole || "support",
      scorerWeight: profile ? calculateScorerWeight(profile, team, squadProfiles) : 0,
    };
  }).sort((a, b) => (
    b.goals - a.goals
    || b.latestRound - a.latestRound
    || a.player.localeCompare(b.player)
  ));
}

function calculateTopGoalscorer(rounds = state.rounds) {
  return calculateGoalscorerTable(rounds)[0] || null;
}

function showToast(message, duration = 2600) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), duration);
}

let snapshotBlob = null;
let snapshotObjectUrl = null;
let snapshotFilename = "world-256-snapshot.png";

function snapshotRoundedRect(context, x, y, width, height, radius) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
  context.closePath();
}

function snapshotText(context, text, x, y, maximumWidth, startingSize, options = {}) {
  const {
    minimumSize = 20,
    weight = 700,
    family = "Manrope, Arial, sans-serif",
    align = "center",
    color = "#f5f7fb",
  } = options;
  let size = startingSize;
  context.textAlign = align;
  context.textBaseline = "middle";
  context.fillStyle = color;
  do {
    context.font = `${weight} ${size}px ${family}`;
    if (context.measureText(text).width <= maximumWidth) break;
    size -= 2;
  } while (size > minimumSize);
  context.fillText(text, x, y);
}

function snapshotGoalLines(events) {
  const goals = (events || []).slice().sort((a, b) => a.minute - b.minute);
  const scorerMinutes = new Map();
  goals.forEach((event) => {
    if (!scorerMinutes.has(event.scorer)) scorerMinutes.set(event.scorer, []);
    scorerMinutes.get(event.scorer).push(`${event.minute}'`);
  });
  return [...scorerMinutes].map(([scorer, minutes]) => `${scorer}  ${minutes.join(", ")}`);
}

function snapshotMatchContext() {
  const roundIndex = state.championView ? 7 : state.activeRound;
  const match = state.championView ? state.rounds[7]?.[0] : selectedMatch();
  if (!match) return null;
  return {
    match,
    roundIndex,
    home: teamById(match.homeId),
    away: teamById(match.awayId),
  };
}

function drawSnapshotGoalLines(context, lines, x, y, align, maximumWidth = 420) {
  const spacing = lines.length > 6 ? 20 : lines.length > 4 ? 24 : 29;
  const fontSize = lines.length > 6 ? 15 : lines.length > 4 ? 17 : 19;
  lines.forEach((line, index) => snapshotText(context, line, x, y + index * spacing, maximumWidth, fontSize, {
    minimumSize: 13,
    weight: 600,
    align,
    color: "#aab4c4",
    family: "Manrope, Arial, sans-serif",
  }));
  return lines.length ? y + (lines.length - 1) * spacing : y;
}

function drawSnapshotShootout(context, attempts, x, y, align, maximumWidth = 360) {
  if (!attempts.length) return y;
  const nameX = align === "left" ? x + 22 : x - 22;
  attempts.forEach((attempt, index) => {
    const rowY = y + index * 28;
    context.beginPath();
    context.arc(x, rowY, 5, 0, Math.PI * 2);
    context.fillStyle = attempt.scored ? "#45d589" : "#ff626c";
    context.fill();
    snapshotText(context, attempt.player, nameX, rowY, maximumWidth - 24, 17, {
      minimumSize: 12,
      weight: 600,
      align,
      color: "#dce3ef",
      family: "Manrope, Arial, sans-serif",
    });
  });
  return y + (attempts.length - 1) * 28;
}

function drawSnapshotConfetti(context, championId) {
  const colours = ["#f2c45f", "#5f8cff", "#f4f7fb", "#34c77b", "#ef5b5b"];
  const random = mulberry32(stableHash(`${championId}-snapshot-confetti`));
  context.save();
  let placed = 0;
  let attempts = 0;
  while (placed < 46 && attempts < 240) {
    attempts += 1;
    const edge = random();
    const x = edge < 0.42
      ? 72 + random() * 180
      : edge < 0.84 ? 948 + random() * 180 : 250 + random() * 700;
    const y = edge < 0.84 ? 66 + random() * 460 : 58 + random() * 74;
    const overlapsGoalDetails = y >= 350 && y <= 575 && (x <= 450 || x >= 750);
    const overlapsChampionLabel = x >= 740 && y <= 128;
    if (overlapsGoalDetails || overlapsChampionLabel) continue;
    const width = 4 + random() * 6;
    const height = 9 + random() * 9;
    context.save();
    context.translate(x, y);
    context.rotate(random() * Math.PI);
    context.globalAlpha = 0.56 + random() * 0.34;
    context.fillStyle = colours[Math.floor(random() * colours.length)];
    context.fillRect(-width / 2, -height / 2, width, height);
    context.restore();
    placed += 1;
  }
  context.restore();
}

function drawSnapshotGoldenBoot(context, scorer, y = 438) {
  if (!scorer) return;
  const scorerTeam = teamById(scorer.teamId);
  snapshotRoundedRect(context, 414, y, 372, 116, 18);
  context.fillStyle = "rgba(17, 24, 36, 0.92)";
  context.fill();
  context.strokeStyle = "rgba(118, 145, 196, 0.24)";
  context.lineWidth = 1.5;
  context.stroke();
  snapshotText(context, "GOLDEN BOOT", 600, y + 21, 300, 14, {
    minimumSize: 12,
    weight: 800,
    color: "#779cff",
  });
  snapshotText(context, scorer.player, 600, y + 51, 330, 25, {
    minimumSize: 18,
    weight: 800,
  });
  snapshotText(context, `${scorerTeam.name} · ${scorer.goals} ${scorer.goals === 1 ? "GOAL" : "GOALS"}`, 600, y + 86, 330, 15, {
    minimumSize: 12,
    weight: 700,
    color: "#aab4c4",
  });
}

function loadSnapshotFlag(team) {
  const imageOverride = FLAG_IMAGE_OVERRIDES[team.name];
  const code = FLAG_CODE_OVERRIDES[team.code] || team.code.toLowerCase();
  if (!imageOverride && code === "xx") return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve(value);
    };
    const timeout = setTimeout(() => finish(null), 2500);
    image.crossOrigin = "anonymous";
    image.onload = () => finish(image);
    image.onerror = () => finish(null);
    image.src = imageOverride || `https://flagcdn.com/w320/${code}.png`;
  });
}

function drawSnapshotFlag(context, image, team, x, y) {
  snapshotRoundedRect(context, x - 82, y - 57, 164, 114, 13);
  context.fillStyle = "#192232";
  context.fill();
  if (image) {
    context.save();
    snapshotRoundedRect(context, x - 75, y - 50, 150, 100, 8);
    context.clip();
    context.drawImage(image, x - 75, y - 50, 150, 100);
    context.restore();
  } else {
    snapshotText(context, team.code === "XX" ? "W256" : team.code, x, y, 125, 42, {
      minimumSize: 30,
      weight: 800,
      color: "#8aa9ff",
      family: "Manrope, Arial, sans-serif",
    });
  }
}

async function createMatchSnapshotCanvas() {
  const snapshot = snapshotMatchContext();
  if (!snapshot) throw new Error("No match is selected.");
  const { match, roundIndex, home, away } = snapshot;
  const result = match.result;
  const revealed = Boolean(result?.revealed);
  const championSnapshot = Boolean(state.championView && revealed);
  const championId = championSnapshot ? result.winnerId : null;
  const goldenBootWinner = championSnapshot ? calculateTopGoalscorer() : null;
  const homeGoalLines = revealed ? snapshotGoalLines(result.homeEvents) : [];
  const awayGoalLines = revealed ? snapshotGoalLines(result.awayEvents) : [];
  const homeShootout = revealed
    ? (result.shootout || []).filter((attempt) => attempt.side === "home")
    : [];
  const awayShootout = revealed
    ? (result.shootout || []).filter((attempt) => attempt.side === "away")
    : [];
  const detailStartY = 365;
  const goalListBottom = (lines) => {
    if (!lines.length) return detailStartY;
    const spacing = lines.length > 6 ? 20 : lines.length > 4 ? 24 : 29;
    return detailStartY + (lines.length - 1) * spacing;
  };
  const shootoutStart = (goalLines, attempts) => (
    attempts.length ? goalListBottom(goalLines) + (goalLines.length ? 38 : 0) : null
  );
  const shootoutBottom = (goalLines, attempts) => {
    const start = shootoutStart(goalLines, attempts);
    return start === null ? goalListBottom(goalLines) : start + (attempts.length - 1) * 28;
  };
  const homeShootoutY = shootoutStart(homeGoalLines, homeShootout);
  const awayShootoutY = shootoutStart(awayGoalLines, awayShootout);
  const detailBottom = Math.max(
    shootoutBottom(homeGoalLines, homeShootout),
    shootoutBottom(awayGoalLines, awayShootout),
  );
  const goldenBootY = championSnapshot ? Math.max(438, detailBottom + 34) : null;
  const contentBottom = goldenBootY === null ? detailBottom : goldenBootY + 116;
  const canvasHeight = Math.max(675, Math.ceil(contentBottom + 110));
  const [homeFlagImage, awayFlagImage] = await Promise.all([
    loadSnapshotFlag(home),
    loadSnapshotFlag(away),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image creation is not supported in this browser.");

  const background = context.createLinearGradient(0, 0, 1200, canvasHeight);
  background.addColorStop(0, "#0b1018");
  background.addColorStop(0.55, "#111925");
  background.addColorStop(1, "#0b111b");
  context.fillStyle = background;
  context.fillRect(0, 0, 1200, canvasHeight);

  const glow = context.createRadialGradient(600, 250, 0, 600, 250, 530);
  glow.addColorStop(0, "rgba(31, 94, 255, 0.18)");
  glow.addColorStop(1, "rgba(31, 94, 255, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, 1200, canvasHeight);

  snapshotRoundedRect(context, 55, 42, 1090, canvasHeight - 117, 28);
  context.fillStyle = "rgba(17, 24, 36, 0.88)";
  context.fill();
  context.strokeStyle = "rgba(118, 145, 196, 0.24)";
  context.lineWidth = 2;
  context.stroke();

  if (championSnapshot) drawSnapshotConfetti(context, championId);

  snapshotText(context, championSnapshot ? "256 TEAMS WC CHAMPIONS" : ROUND_NAMES[roundIndex].toUpperCase(), 1110, 88, 360, 18, {
    minimumSize: 14,
    weight: 700,
    align: "right",
    color: "#779cff",
    family: "Manrope, Arial, sans-serif",
  });

  drawSnapshotFlag(context, homeFlagImage, home, 270, 205);
  drawSnapshotFlag(context, awayFlagImage, away, 930, 205);
  snapshotText(context, home.name, 270, 292, 390, 42, { minimumSize: 24, weight: 800 });
  snapshotText(context, away.name, 930, 292, 390, 42, { minimumSize: 24, weight: 800 });

  if (revealed) {
    snapshotText(context, String(result.homeGoals), 505, 300, 120, 88, {
      weight: 800,
      family: "Manrope, Arial, sans-serif",
    });
    snapshotText(context, "–", 600, 300, 80, 52, { color: "#65728a", weight: 400 });
    snapshotText(context, String(result.awayGoals), 695, 300, 120, 88, {
      weight: 800,
      family: "Manrope, Arial, sans-serif",
    });
    const resultLabel = result.penalties
      ? `PENALTIES ${result.penalties.home}–${result.penalties.away}`
      : result.extraTime ? "AFTER EXTRA TIME" : "FULL TIME";
    snapshotText(context, resultLabel, 600, 370, 380, 24, {
      minimumSize: 20,
      weight: 700,
      color: "#7e8ca3",
      family: "Manrope, Arial, sans-serif",
    });
    drawSnapshotGoalLines(context, homeGoalLines, 188, detailStartY, "left", championSnapshot ? 290 : 420);
    drawSnapshotGoalLines(context, awayGoalLines, 1012, detailStartY, "right", championSnapshot ? 290 : 420);
    if (homeShootoutY !== null) {
      drawSnapshotShootout(context, homeShootout, 188, homeShootoutY, "left", championSnapshot ? 290 : 420);
    }
    if (awayShootoutY !== null) {
      drawSnapshotShootout(context, awayShootout, 1012, awayShootoutY, "right", championSnapshot ? 290 : 420);
    }
    if (championSnapshot) drawSnapshotGoldenBoot(context, goldenBootWinner, goldenBootY);
  } else {
    snapshotText(context, "VS", 600, 307, 180, 52, {
      weight: 800,
      color: "#789cff",
      family: "Manrope, Arial, sans-serif",
    });
    snapshotText(context, result ? "RESULT HIDDEN" : "UPCOMING FIXTURE", 600, 370, 320, 18, {
      weight: 700,
      color: "#7e8ca3",
      family: "Manrope, Arial, sans-serif",
    });
  }

  const mode = state.settings.upset === "chaos" ? "PURE CHAOS" : state.settings.upset.toUpperCase();
  snapshotText(context, `${mode} · ${state.settings.goals.toUpperCase()} GOALS`, 84, canvasHeight - 43, 420, 15, {
    weight: 600,
    align: "left",
    color: "#69778e",
    family: "Manrope, Arial, sans-serif",
  });
  snapshotText(context, "256teams.com", 1116, canvasHeight - 43, 420, 15, {
    weight: 600,
    align: "right",
    color: "#69778e",
    family: "Manrope, Arial, sans-serif",
  });
  return canvas;
}

function drawLegacySnapshotPitch(context, formation, x, y, width, height, expert) {
  snapshotRoundedRect(context, x, y, width, height, 24);
  context.fillStyle = "#0d8448";
  context.fill();
  context.save();
  snapshotRoundedRect(context, x, y, width, height, 24);
  context.clip();
  const stripeHeight = height / 8;
  for (let index = 0; index < 8; index += 1) {
    context.fillStyle = index % 2 ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.035)";
    context.fillRect(x, y + index * stripeHeight, width, stripeHeight);
  }
  context.restore();

  context.strokeStyle = "rgba(211, 240, 222, 0.55)";
  context.lineWidth = 3;
  context.strokeRect(x + 2, y + 2, width - 4, height - 4);
  context.beginPath();
  context.moveTo(x, y + height / 2);
  context.lineTo(x + width, y + height / 2);
  context.stroke();
  context.beginPath();
  context.arc(x + width / 2, y + height / 2, 72, 0, Math.PI * 2);
  context.stroke();
  context.strokeRect(x + width * 0.28, y, width * 0.44, 92);
  context.strokeRect(x + width * 0.28, y + height - 92, width * 0.44, 92);
  context.strokeRect(x + width * 0.39, y, width * 0.22, 38);
  context.strokeRect(x + width * 0.39, y + height - 38, width * 0.22, 38);

  const lineGap = formation.lines.length > 1 ? (height - 150) / (formation.lines.length - 1) : 0;
  formation.lines.forEach((line, lineIndex) => {
    const lineY = y + 75 + lineIndex * lineGap;
    line.forEach((slotId, slotIndex) => {
      const slot = formation.slots.find((candidate) => candidate.id === slotId);
      const player = legacyDraft.lineup[slotId];
      const slotX = x + width * ((slotIndex + 1) / (line.length + 1));
      context.beginPath();
      context.arc(slotX, lineY, 35, 0, Math.PI * 2);
      context.fillStyle = "#075c34";
      context.fill();
      context.strokeStyle = "rgba(202, 238, 216, 0.72)";
      context.lineWidth = 3;
      context.stroke();
      snapshotText(context, expert ? slot.label : String(legacyEffectiveValue(player, slot, player.rating)), slotX, lineY, 58, 24, {
        minimumSize: 16,
        weight: 900,
      });
      snapshotText(context, player.name.split(/\s+/).at(-1), slotX, lineY + 49, 108, 15, {
        minimumSize: 10,
        weight: 800,
        color: "#f4f8f6",
      });
      snapshotText(context, String(player.year), slotX, lineY - 49, 70, 11, {
        minimumSize: 9,
        weight: 800,
        color: "#c8d7ff",
      });
    });
  });
}

function drawLegacySnapshotNationFlag(context, image, team, x, y) {
  snapshotRoundedRect(context, x, y, 88, 58, 8);
  context.fillStyle = "rgba(7, 20, 30, 0.72)";
  context.fill();
  if (image) {
    context.save();
    snapshotRoundedRect(context, x + 5, y + 5, 78, 48, 5);
    context.clip();
    context.drawImage(image, x + 5, y + 5, 78, 48);
    context.restore();
    return;
  }
  snapshotText(context, team.code, x + 44, y + 29, 66, 20, {
    minimumSize: 14,
    weight: 900,
    color: "#9bb7ff",
  });
}

async function createLegacyDraftSnapshotCanvas() {
  if (!legacyDraft?.complete) throw new Error("Finish the draft before taking a snapshot.");
  const formation = legacyFormation();
  const expert = legacyDraft.mode === "expert";
  const nationTeam = legacyNationTeam(legacyDraft.nation);
  const nationFlagImage = await loadSnapshotFlag(nationTeam);
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image creation is not supported in this browser.");

  const background = context.createLinearGradient(0, 0, 1200, 900);
  background.addColorStop(0, "#09101a");
  background.addColorStop(1, "#111b2a");
  context.fillStyle = background;
  context.fillRect(0, 0, 1200, 900);

  snapshotText(context, `${legacyDraft.nation.name} Legacy XI`, 55, 58, 330, 34, {
    minimumSize: 22,
    weight: 900,
    align: "left",
  });
  snapshotText(context, `${formation.label}  ·  ${expert ? "EXPERT" : "CLASSIC"}`, 55, 100, 330, 16, {
    minimumSize: 12,
    weight: 800,
    align: "left",
    color: "#80a2ff",
  });
  snapshotText(context, "WORLD CUP LEGACY DRAFT", 55, 137, 330, 13, {
    minimumSize: 10,
    weight: 800,
    align: "left",
    color: "#78869b",
  });

  legacyFormationSlots().forEach((slot, index) => {
    const player = legacyDraft.lineup[slot.id];
    const rowY = 190 + index * 54;
    snapshotText(context, slot.label, 55, rowY, 46, 14, {
      minimumSize: 11,
      weight: 900,
      align: "left",
      color: "#83adff",
    });
    snapshotText(context, player.name, 108, rowY, 205, 16, {
      minimumSize: 11,
      weight: 800,
      align: "left",
    });
    snapshotText(context, expert ? String(player.year) : String(legacyEffectiveValue(player, slot, player.rating)), 365, rowY, 55, 19, {
      minimumSize: 14,
      weight: 900,
      align: "right",
      color: expert ? "#9ca9bb" : "#57e694",
    });
  });

  drawLegacySnapshotPitch(context, formation, 420, 45, 730, 810, expert);
  drawLegacySnapshotNationFlag(context, nationFlagImage, nationTeam, 442, 67);
  snapshotText(context, "256teams.com", 55, 858, 330, 14, {
    minimumSize: 11,
    weight: 700,
    align: "left",
    color: "#66758b",
  });
  return canvas;
}

function canvasPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The snapshot could not be created."));
    }, "image/png");
  });
}

async function openSnapshotModal() {
  if (livePlayback) {
    showToast("Finish or skip the live match before taking a snapshot.");
    return;
  }
  els.snapshotButton.disabled = true;
  try {
    els.snapshotModalKicker.textContent = "SHARE THE MOMENT";
    els.snapshotModalTitle.textContent = "Match snapshot";
    snapshotBlob = await canvasPngBlob(await createMatchSnapshotCanvas());
    if (snapshotObjectUrl) URL.revokeObjectURL(snapshotObjectUrl);
    snapshotObjectUrl = URL.createObjectURL(snapshotBlob);
    els.snapshotImage.src = snapshotObjectUrl;
    const snapshot = snapshotMatchContext();
    snapshotFilename = `world-256-${snapshot.home.name}-vs-${snapshot.away.name}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + ".png";
    els.shareSnapshotButton.hidden = typeof navigator.share !== "function";
    els.snapshotModal.showModal();
  } catch (error) {
    showToast(error.message || "The snapshot could not be created.");
  } finally {
    els.snapshotButton.disabled = false;
  }
}

async function openLegacyDraftSnapshot(button) {
  if (button) button.disabled = true;
  try {
    els.snapshotModalKicker.textContent = "YOUR LEGACY XI";
    els.snapshotModalTitle.textContent = "Draft snapshot";
    snapshotBlob = await canvasPngBlob(await createLegacyDraftSnapshotCanvas());
    if (snapshotObjectUrl) URL.revokeObjectURL(snapshotObjectUrl);
    snapshotObjectUrl = URL.createObjectURL(snapshotBlob);
    els.snapshotImage.src = snapshotObjectUrl;
    snapshotFilename = `${legacyDraft.nation.name}-legacy-xi`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + ".png";
    els.shareSnapshotButton.hidden = typeof navigator.share !== "function";
    els.snapshotModal.showModal();
  } catch (error) {
    showToast(error.message || "The draft snapshot could not be created.");
  } finally {
    if (button) button.disabled = false;
  }
}

async function copySnapshotImage() {
  if (!snapshotBlob) return;
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    showToast("Image copying is unavailable here. Use Save image instead.");
    return;
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": snapshotBlob })]);
    showToast("Snapshot copied to your clipboard.");
  } catch {
    showToast("The browser blocked image copying. Try Save image.");
  }
}

async function shareSnapshotImage() {
  if (!snapshotBlob || typeof navigator.share !== "function") return;
  const file = new File([snapshotBlob], snapshotFilename, { type: "image/png" });
  try {
    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
      showToast("File sharing is unavailable here. Use Save image instead.");
      return;
    }
    await navigator.share({
      title: "256 TEAMS WC match snapshot",
      text: "256 TEAMS WC tournament result",
      files: [file],
    });
  } catch (error) {
    if (error.name !== "AbortError") showToast("The snapshot could not be shared.");
  }
}

function saveSnapshotImage() {
  if (!snapshotBlob) return;
  const link = document.createElement("a");
  link.href = snapshotObjectUrl;
  link.download = snapshotFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast("Snapshot saved as a PNG.");
}

function generatedPlayers(team) {
  const seed = stableHash(team.name);
  const culture = CULTURAL_NAME_POOLS[team.nameCulture] || CULTURAL_NAME_POOLS.british;
  const names = [];
  for (let index = 0; names.length < 11; index += 1) {
    const first = culture.first[(seed + index * 5) % culture.first.length];
    const last = culture.last[(seed + index * 7 + Math.floor(index / culture.first.length) + 3) % culture.last.length];
    const name = `${first} ${last}`;
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

function neutralPlayerLabels() {
  return Array.from({ length: 11 }, (_, index) => `Player ${index + 1}`);
}

const playerProfileCache = new Map();

function playerProfilesForTeam(team) {
  const useRealPlayers = Boolean(state.settings.realNames && team.players);
  const realPlayersOnly = state.settings.realPlayersOnly !== false;
  const playerMode = `${useRealPlayers ? "real" : "generated"}:${realPlayersOnly ? "real-only" : "all"}`;
  const cacheKey = `${team.id}:${playerMode}`;
  if (!playerProfileCache.has(cacheKey)) {
    let inputs = useRealPlayers
      ? team.playerProfiles?.length
        ? [
          ...team.playerProfiles.map((profile) => ({ ...profile })),
          ...team.players.filter((name) => !team.playerProfiles.some((profile) => profile.name === name)),
        ]
        : [...team.players]
      : generatedPlayers(team);
    if (realPlayersOnly) inputs = inputs.filter((entry) => !FICTIONAL_PLAYER_NAMES.has(typeof entry === "string" ? entry : entry.name));
    if (team.name === "Moldova" && !inputs.some((entry) => (typeof entry === "string" ? entry : entry.name) === "Amenyah")) {
      inputs = [{ name: "Amenyah", position: "ST" }, ...inputs];
    }
    if (team.name === "Jersey" && !inputs.some((entry) => (typeof entry === "string" ? entry : entry.name) === "ChrisMD")) {
      inputs = [{ name: "ChrisMD", position: "ST" }, ...inputs];
    }
    if (team.name === "Guernsey" && !inputs.some((entry) => (typeof entry === "string" ? entry : entry.name) === "Wroetoshaw")) {
      inputs = [{ name: "Wroetoshaw", position: "ST" }, ...inputs];
    }
    let profiles = buildPlayerProfiles(team, inputs, !useRealPlayers);
    if (useRealPlayers) {
      const requiredPositions = ["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CAM", "LW", "ST", "RW"];
      const requiredGroups = requiredPositions.reduce((counts, position) => {
        const group = possessionPositionGroup(position);
        counts[group] = (counts[group] || 0) + 1;
        return counts;
      }, {});
      const currentGroups = profiles.reduce((counts, profile) => {
        const group = possessionPositionGroup(profile.position);
        counts[group] = (counts[group] || 0) + 1;
        return counts;
      }, {});
      const usedNames = new Set(profiles.map((profile) => profile.name));
      const generatedNames = generatedPlayers(team).filter((name) => !usedNames.has(name));
      const supplements = [];
      Object.entries(requiredGroups).forEach(([group, required]) => {
        const groupSlots = requiredPositions.filter((position) => possessionPositionGroup(position) === group);
        for (let index = currentGroups[group] || 0; index < required; index += 1) {
          const name = generatedNames.shift() || `${team.name} Player ${profiles.length + supplements.length + 1}`;
          supplements.push({ name, position: groupSlots[index % groupSlots.length] });
        }
      });
      if (supplements.length) profiles = [...profiles, ...buildPlayerProfiles(team, supplements, true)];
    }
    profiles = profiles.map((profile, index) => {
      const preferredFoot = profile.preferredFoot
        || (TWO_FOOTED_PENALTY_TAKERS.has(profile.name) ? "both" : LEFT_FOOTED_PENALTY_TAKERS.has(profile.name) ? "left" : null);
      const draftedPosition = team.positionSuitability?.find((entry) => entry.player === profile.name);
      if (!draftedPosition) return { ...profile, preferredFoot };
      const position = draftedPosition.slot;
      const overall = draftedPosition.overall ?? profile.overall;
      return {
        ...profile,
        position,
        overall,
        finishing: position === "GK" ? 5 : draftedPosition.finishing ?? profile.finishing,
        pace: draftedPosition.pace ?? profile.pace,
        shooting: position === "GK" ? 5 : draftedPosition.shooting ?? draftedPosition.finishing ?? profile.shooting,
        passing: draftedPosition.passing ?? profile.passing,
        dribbling: draftedPosition.dribbling ?? profile.dribbling,
        defending: draftedPosition.defending ?? profile.defending,
        physical: draftedPosition.physical ?? profile.physical,
        goalkeeping: draftedPosition.goalkeeping ?? profile.goalkeeping,
        attackingRole: roleForProfile(position, index),
        penaltyTaker: position === "GK" ? false : profile.penaltyTaker,
        expectedMinutesShare: expectedMinutesForProfile(roleForProfile(position, index), position, index),
        preferredFoot,
      };
    });
    playerProfileCache.set(cacheKey, profiles);
  }
  return playerProfileCache.get(cacheKey);
}

function scorerPool(team, excludedPlayers = []) {
  const excluded = new Set(excludedPlayers);
  return playerProfilesForTeam(team)
    .map((profile) => profile.name)
    .filter((player) => !excluded.has(player));
}

function shootoutPosition(team, profile) {
  return team.positionSuitability?.find((entry) => entry.player === profile.name)?.slot || profile.position;
}

function shootoutPositionPriority(position) {
  if (["ST", "CF", "SS"].includes(position)) return 0;
  if (["LW", "RW", "LF", "RF", "CAM", "AM", "LM", "RM"].includes(position)) return 1;
  if (["CM", "LCM", "RCM"].includes(position)) return 2;
  if (["CDM", "DM"].includes(position)) return 3;
  if (["LB", "RB", "LWB", "RWB"].includes(position)) return 4;
  if (["CB", "SW"].includes(position)) return 5;
  if (position === "GK") return 99;
  return 6;
}

function shootoutTakerPool(team, excludedPlayers = []) {
  const excluded = new Set(excludedPlayers);
  return playerProfilesForTeam(team)
    .filter((profile) => !excluded.has(profile.name))
    .map((profile, index) => ({
      profile,
      index,
      priority: shootoutPositionPriority(shootoutPosition(team, profile)),
    }))
    .sort((left, right) => (
      left.priority - right.priority
      || Number(right.profile.penaltyTaker) - Number(left.profile.penaltyTaker)
      || right.profile.finishing - left.profile.finishing
      || right.profile.overall - left.profile.overall
      || left.index - right.index
    ))
    .map(({ profile }) => profile.name);
}

function poisson(lambda, random) {
  const limit = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit);
  return count - 1;
}

function scoringRunBrake() {
  // Tournament totals are never capped; repeat scoring is controlled per match.
  return 1;
}

function selectWeightedProfile(profiles, random, weightForProfile) {
  const weights = profiles.map((profile) => Math.max(0, weightForProfile(profile)));
  const weightTotal = weights.reduce((total, weight) => total + weight, 0);
  if (weightTotal <= 0) return profiles[0];
  let roll = random() * weightTotal;
  for (let index = 0; index < profiles.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return profiles[index];
  }
  return profiles[profiles.length - 1];
}

function eligibleScorerProfiles(team, minute, cards = [], suspendedPlayers = []) {
  const dismissed = new Set(
    cards.filter((card) => card.minute < minute).map((card) => card.player),
  );
  const unavailable = new Set([...suspendedPlayers, ...dismissed]);
  const profiles = playerProfilesForTeam(team).filter((profile) => (
    !unavailable.has(profile.name)
    && profile.position !== "GK"
    && minute <= Math.max(25, profile.expectedMinutesShare * 120)
  ));
  return profiles.length
    ? profiles
    : playerProfilesForTeam(team).filter((profile) => !unavailable.has(profile.name) && profile.position !== "GK");
}

function weightedScorer(
  team,
  random,
  excludedPlayers = [],
  inMatchGoals = new Map(),
  goalType = "openPlay",
  minute = 60,
  opponent = null,
  tournamentScoring = { teamGoals: 0, playerGoals: new Map() },
) {
  const squadProfiles = playerProfilesForTeam(team);
  const profiles = eligibleScorerProfiles(team, minute, [], excludedPlayers);
  return selectWeightedProfile(profiles, random, (profile) => scorerWeightForGoalType(
    profile,
    goalType,
    inMatchGoals.get(profile.name) || 0,
    {
      team,
      opponent,
      squadProfiles,
      tournamentTeamGoals: tournamentScoring.teamGoals || 0,
      tournamentPlayerGoals: (tournamentScoring.playerGoals?.get(profile.name) || 0)
        + (inMatchGoals.get(profile.name) || 0),
    },
  )).name;
}

function availableScorer(
  team,
  minute,
  cards,
  random,
  suspendedPlayers = [],
  inMatchGoals = new Map(),
  goalType = "openPlay",
  opponent = null,
  tournamentScoring = { teamGoals: 0, playerGoals: new Map() },
) {
  const squadProfiles = playerProfilesForTeam(team);
  const profiles = eligibleScorerProfiles(team, minute, cards, suspendedPlayers);
  return selectWeightedProfile(profiles, random, (profile) => scorerWeightForGoalType(
    profile,
    goalType,
    inMatchGoals.get(profile.name) || 0,
    {
      team,
      opponent,
      squadProfiles,
      tournamentTeamGoals: tournamentScoring.teamGoals || 0,
      tournamentPlayerGoals: (tournamentScoring.playerGoals?.get(profile.name) || 0)
        + (inMatchGoals.get(profile.name) || 0),
    },
  )).name;
}

function shuffledOutcomes(goals, kicks, random, forceLastGoal = false, forceLastMiss = false) {
  const outcomes = shuffle([
    ...Array(goals).fill(true),
    ...Array(Math.max(0, kicks - goals)).fill(false),
  ], random);
  if (forceLastGoal && goals > 0 && !outcomes[kicks - 1]) {
    const goalIndex = outcomes.indexOf(true);
    [outcomes[goalIndex], outcomes[kicks - 1]] = [outcomes[kicks - 1], outcomes[goalIndex]];
  }
  if (forceLastMiss && goals < kicks && outcomes[kicks - 1]) {
    const missIndex = outcomes.indexOf(false);
    [outcomes[missIndex], outcomes[kicks - 1]] = [outcomes[kicks - 1], outcomes[missIndex]];
  }
  return outcomes;
}

function missedPenaltyVisual(side, team, player, round, direction, keeperDive) {
  const visualSeed = stableHash(`${side}-${team.id}-${player}-${round}-penalty-miss`);
  if (visualSeed % 100 < 30) {
    return {
      direction: `wide-${visualSeed % 2 === 0 ? "left" : "right"}`,
      keeperDive,
      missType: "wide",
    };
  }
  return { direction, keeperDive: direction, missType: "save" };
}

function distinctKeeperDiveForGoal(direction, keeperDive, variation = 0) {
  if (keeperDive !== direction) return keeperDive;
  const alternatives = ["left", "centre", "right"].filter((candidate) => candidate !== direction);
  return alternatives[Math.abs(variation) % alternatives.length];
}

function createShootoutSequence(home, away, penalties, random, cards = [], suspendedPlayers = { home: [], away: [] }) {
  const rounds = Math.max(5, penalties.home, penalties.away);
  const homeWon = penalties.home > penalties.away;
  const homeOutcomes = shuffledOutcomes(penalties.home, rounds, random, homeWon, !homeWon);
  const awayOutcomes = shuffledOutcomes(penalties.away, rounds, random, !homeWon, homeWon);
  const pools = {
    home: shootoutTakerPool(home, [
      ...(suspendedPlayers.home || []),
      ...cards.filter((card) => card.side === "home").map((card) => card.player),
    ]),
    away: shootoutTakerPool(away, [
      ...(suspendedPlayers.away || []),
      ...cards.filter((card) => card.side === "away").map((card) => card.player),
    ]),
  };
  const directions = ["left", "centre", "right"];
  const sequence = [];

  for (let round = 0; round < rounds; round += 1) {
    for (const side of ["home", "away"]) {
      const scored = side === "home" ? homeOutcomes[round] : awayOutcomes[round];
      let direction = directions[Math.floor(random() * directions.length)];
      let keeperDive = directions[Math.floor(random() * directions.length)];
      const team = side === "home" ? home : away;
      const player = pools[side][round % pools[side].length];
      let missType = null;
      if (!scored) {
        ({ direction, keeperDive, missType } = missedPenaltyVisual(
          side,
          team,
          player,
          round + 1,
          direction,
          keeperDive,
        ));
      } else {
        keeperDive = distinctKeeperDiveForGoal(direction, keeperDive, round + Number(side === "away"));
      }
      sequence.push({
        side,
        player,
        foot: preferredPenaltyFoot(team, player, random),
        direction,
        keeperDive,
        scored,
        missType,
        round: round + 1,
        target: penaltyDirectionTarget(direction, random),
      });
    }
  }
  return sequence;
}

function createShootoutAttempt(side, team, player, scored, round, random) {
  const directions = ["left", "centre", "right"];
  let direction = directions[Math.floor(random() * directions.length)];
  let keeperDive = directions[Math.floor(random() * directions.length)];
  let missType = null;
  if (!scored) {
    ({ direction, keeperDive, missType } = missedPenaltyVisual(
      side,
      team,
      player,
      round,
      direction,
      keeperDive,
    ));
  } else {
    keeperDive = distinctKeeperDiveForGoal(direction, keeperDive, round + Number(side === "away"));
  }
  return {
    side,
    player,
    foot: preferredPenaltyFoot(team, player, random),
    direction,
    keeperDive,
    scored,
    missType,
    round,
    target: penaltyDirectionTarget(direction, random),
  };
}

function createInteractiveShootoutSequence(match, controlledSide, startRound = 1, roundCount = 60) {
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const result = match.result;
  const random = mulberry32(state.drawSeed + stableHash(`${match.id}-interactive-shootout-${startRound}`));
  const excluded = {
    home: [
      ...(result.suspendedPlayers?.home || []),
      ...(result.redCards || []).filter((card) => card.side === "home").map((card) => card.player),
    ],
    away: [
      ...(result.suspendedPlayers?.away || []),
      ...(result.redCards || []).filter((card) => card.side === "away").map((card) => card.player),
    ],
  };
  const pools = {
    home: shootoutTakerPool(home, excluded.home),
    away: shootoutTakerPool(away, excluded.away),
  };
  const conversion = {
    home: shootoutConversionChance(home, away, state.settings.upset),
    away: shootoutConversionChance(away, home, state.settings.upset),
  };
  const sequence = [];
  for (let round = startRound; round < startRound + roundCount; round += 1) {
    for (const side of ["home", "away"]) {
      const team = side === "home" ? home : away;
      const player = pools[side][(round - 1) % pools[side].length];
      if (side !== controlledSide) {
        sequence.push(createShootoutAttempt(side, team, player, random() < conversion[side], round, random));
        continue;
      }
      const goalkeeperTarget = STANDARD_PENALTY_TARGETS[Math.floor(random() * STANDARD_PENALTY_TARGETS.length)];
      sequence.push({
        side,
        player,
        foot: preferredPenaltyFoot(team, player, random),
        direction: "centre",
        keeperDive: onlinePenaltyDirection(goalkeeperTarget),
        goalkeeperTarget,
        conversionChance: conversion[side],
        outcomeRoll: random(),
        target: null,
        scored: null,
        missType: null,
        interactive: true,
        round,
      });
    }
  }
  return sequence;
}

function simulatePenaltyShootout(
  home,
  away,
  random,
  cards = [],
  suspendedPlayers = { home: [], away: [] },
  modeName = "balanced",
) {
  const excluded = {
    home: new Set([
      ...(suspendedPlayers.home || []),
      ...cards.filter((card) => card.side === "home").map((card) => card.player),
    ]),
    away: new Set([
      ...(suspendedPlayers.away || []),
      ...cards.filter((card) => card.side === "away").map((card) => card.player),
    ]),
  };
  const orderedTakers = (team, side) => {
    const squadProfiles = playerProfilesForTeam(team);
    return squadProfiles
      .filter((profile) => !excluded[side].has(profile.name))
      .sort((a, b) => Number(b.penaltyTaker) - Number(a.penaltyTaker)
        || calculateScorerWeight(b, team, squadProfiles) - calculateScorerWeight(a, team, squadProfiles));
  };
  const pools = { home: orderedTakers(home, "home"), away: orderedTakers(away, "away") };
  const conversion = {
    home: shootoutConversionChance(home, away, modeName),
    away: shootoutConversionChance(away, home, modeName),
  };
  const penalties = { home: 0, away: 0 };
  const sequence = [];

  const takeKick = (side, round) => {
    const team = side === "home" ? home : away;
    const pool = pools[side];
    const player = pool[(round - 1) % pool.length].name;
    const scored = random() < conversion[side];
    if (scored) penalties[side] += 1;
    sequence.push(createShootoutAttempt(side, team, player, scored, round, random));
  };

  for (let round = 1; round <= 5; round += 1) {
    takeKick("home", round);
    takeKick("away", round);
  }
  let round = 6;
  while (penalties.home === penalties.away && round <= 20) {
    takeKick("home", round);
    takeKick("away", round);
    round += 1;
  }

  // A 15-round tie is extraordinarily rare; settle it with one final quality-weighted pair.
  if (penalties.home === penalties.away) {
    const homeFavoured = random() < simulationClamp(
      0.5 + (calculateShootoutRating(home) - calculateShootoutRating(away)) * 0.005,
      0.38,
      0.62,
    );
    const winnerSide = homeFavoured ? "home" : "away";
    const loserSide = homeFavoured ? "away" : "home";
    const finalRound = 21;
    const loserTeam = loserSide === "home" ? home : away;
    const winnerTeam = winnerSide === "home" ? home : away;
    const loserPlayer = pools[loserSide][(finalRound - 1) % pools[loserSide].length].name;
    const winnerPlayer = pools[winnerSide][(finalRound - 1) % pools[winnerSide].length].name;
    sequence.push(createShootoutAttempt(loserSide, loserTeam, loserPlayer, false, finalRound, random));
    sequence.push(createShootoutAttempt(winnerSide, winnerTeam, winnerPlayer, true, finalRound, random));
    penalties[winnerSide] += 1;
  }

  return { penalties, sequence };
}

function chooseAssist(team, scorer, minute, cards, random, suspendedPlayers, goalType) {
  const assistChance = goalType === "openPlay" ? 0.68 : goalType === "setPiece" ? 0.42 : 0;
  if (random() >= assistChance) return null;
  const candidates = eligibleScorerProfiles(team, minute, cards, suspendedPlayers)
    .filter((profile) => profile.name !== scorer && profile.position !== "GK");
  if (!candidates.length) return null;
  return selectWeightedProfile(candidates, random, (profile) => (
    profile.overall * profile.expectedMinutesShare * (["CAM", "AM", "CM", "LW", "RW"].includes(profile.position) ? 1.35 : 1)
  )).name;
}

function ownGoalScorer(defendingTeam, minute, cards, random, suspendedPlayers = []) {
  const candidates = eligibleScorerProfiles(defendingTeam, minute, cards, suspendedPlayers)
    .filter((profile) => ["CB", "LB", "RB", "LWB", "RWB", "GK", "CDM"].includes(profile.position));
  const pool = candidates.length ? candidates : eligibleScorerProfiles(defendingTeam, minute, cards, suspendedPlayers);
  return pool[Math.floor(random() * pool.length)].name;
}

function goalEvents(
  team,
  defendingTeam,
  regulationCount,
  extraTimeCount,
  random,
  cards = [],
  suspendedPlayers = [],
  defendingCards = [],
  defendingSuspendedPlayers = [],
  usedMinutes = new Set(),
) {
  const events = [];
  const inMatchGoals = new Map();
  const priorTournamentScoring = tournamentScoringForTeam(team.id);
  let currentTeamGoals = 0;
  const uniqueGoalMinute = (start, end) => {
    const span = end - start + 1;
    const initial = start + Math.floor(random() * span);
    for (let offset = 0; offset < span; offset += 1) {
      const candidate = start + ((initial - start + offset) % span);
      if (usedMinutes.has(candidate)) continue;
      usedMinutes.add(candidate);
      return candidate;
    }
    return initial;
  };
  const addGoal = (minute) => {
    const goalType = chooseGoalType(random);
    if (goalType === "ownGoal") {
      const ownGoalBy = ownGoalScorer(
        defendingTeam,
        minute,
        defendingCards,
        random,
        defendingSuspendedPlayers,
      );
      events.push({ minute, scorer: `${ownGoalBy} (OG)`, ownGoalBy, goalType, ownGoal: true, type: "goal" });
      currentTeamGoals += 1;
      return;
    }
    const scorer = availableScorer(
      team,
      minute,
      cards,
      random,
      suspendedPlayers,
      inMatchGoals,
      goalType,
      defendingTeam,
      {
        teamGoals: priorTournamentScoring.teamGoals + currentTeamGoals,
        playerGoals: priorTournamentScoring.playerGoals,
      },
    );
    inMatchGoals.set(scorer, (inMatchGoals.get(scorer) || 0) + 1);
    const assist = chooseAssist(team, scorer, minute, cards, random, suspendedPlayers, goalType);
    events.push({ minute, scorer, assist, goalType, type: "goal" });
    currentTeamGoals += 1;
  };
  for (let index = 0; index < regulationCount; index += 1) {
    const minute = uniqueGoalMinute(2, 90);
    addGoal(minute);
  }
  for (let index = 0; index < extraTimeCount; index += 1) {
    const minute = uniqueGoalMinute(91, 120);
    addGoal(minute);
  }
  return events.sort((a, b) => a.minute - b.minute);
}

function createRedCard(team, side, random, suspendedPlayers = []) {
  const candidates = playerProfilesForTeam(team).filter((profile) => (
    !suspendedPlayers.includes(profile.name) && profile.position !== "GK"
  ));
  const player = selectWeightedProfile(candidates, random, (profile) => (
    ["CDM", "DM", "CB", "LB", "RB"].includes(profile.position) ? 1.35 : 1
  ));
  return {
    minute: 12 + Math.floor(random() * 77),
    player: player.name,
    teamId: team.id,
    side,
    type: "red",
  };
}

function applyScorelineCeiling(home, away, homeGoals, awayGoals) {
  if (homeGoals === awayGoals) return { homeGoals, awayGoals };
  const homeWon = homeGoals > awayGoals;
  const loser = homeWon ? away : home;
  if (!loser.fifaRank || loser.fifaRank > 175) return { homeGoals, awayGoals };
  const ceiling = loser.fifaRank <= 75 ? 5 : loser.fifaRank <= 125 ? 6 : 7;
  if (homeWon && homeGoals > ceiling) {
    homeGoals = ceiling;
    awayGoals = Math.min(awayGoals, ceiling - 1);
  } else if (!homeWon && awayGoals > ceiling) {
    awayGoals = ceiling;
    homeGoals = Math.min(homeGoals, ceiling - 1);
  }
  return { homeGoals, awayGoals };
}

function suspendedPlayersForTeam(teamId, roundIndex) {
  if (roundIndex <= 0) return [];
  const previousMatch = (state.rounds[roundIndex - 1] || []).find((match) => (
    match?.result?.winnerId === teamId
    && (match.homeId === teamId || match.awayId === teamId)
  ));
  if (!previousMatch) return [];
  return [...new Set((previousMatch.result.redCards || [])
    .filter((card) => card.teamId === teamId)
    .map((card) => card.player))];
}

function matchesPlayedForTeam(teamId, beforeRoundIndex) {
  return state.rounds.slice(0, beforeRoundIndex).reduce((total, round) => (
    total + (round || []).filter((match) => (
      match?.result && (match.homeId === teamId || match.awayId === teamId)
    )).length
  ), 0);
}

function momentumForTeam(teamId, nextOpponent, roundIndex) {
  if (roundIndex <= 0) return 1;
  const previousMatch = (state.rounds[roundIndex - 1] || []).find((match) => (
    match?.result?.winnerId === teamId
    && (match.homeId === teamId || match.awayId === teamId)
  ));
  if (!previousMatch) return 1;
  const defeatedTeamId = previousMatch.homeId === teamId ? previousMatch.awayId : previousMatch.homeId;
  const winner = teamById(teamId);
  const defeated = teamById(defeatedTeamId);
  return giantKillingMomentumMultiplier(
    teamSimulationRatings(winner).overall,
    teamSimulationRatings(defeated).overall,
    teamSimulationRatings(nextOpponent).overall,
  );
}

function opponentStandardTactic(match, controlledSide) {
  const controlled = teamById(controlledSide === "home" ? match.homeId : match.awayId);
  const opponent = teamById(controlledSide === "home" ? match.awayId : match.homeId);
  const ratingGap = teamSimulationRatings(opponent).overall - teamSimulationRatings(controlled).overall;
  const candidates = ratingGap >= 8
    ? ["high-press", "tiki-taka", "balanced"]
    : ratingGap <= -8
      ? ["counter", "defensive", "balanced"]
      : ["balanced", "tiki-taka", "counter", "high-press", "defensive"];
  return candidates[stableHash(`${match.id}-opponent-tactic`) % candidates.length];
}

function applyControlledTacticalMatchup(adjustedXG, match, controlledSide) {
  const tacticKey = STANDARD_TACTICS[state.standardTactic] ? state.standardTactic : "balanced";
  const opponentTacticKey = opponentStandardTactic(match, controlledSide);
  const tactic = STANDARD_TACTICS[tacticKey];
  const opponentTactic = STANDARD_TACTICS[opponentTacticKey];
  const edge = STANDARD_TACTIC_MATCHUPS[tacticKey]?.[opponentTacticKey] || 0;
  const controlledTeam = teamById(controlledSide === "home" ? match.homeId : match.awayId);
  const opponentTeam = teamById(controlledSide === "home" ? match.awayId : match.homeId);
  const ratingGap = Math.max(0, teamSimulationRatings(opponentTeam).overall - teamSimulationRatings(controlledTeam).overall);
  const underdogAttackBoost = edge > 0 ? 1 + Math.min(0.38, ratingGap * 0.012) * Math.min(1, edge / 0.2) : 1;
  const underdogDefenceBoost = edge > 0 ? 1 - Math.min(0.28, ratingGap * 0.008) * Math.min(1, edge / 0.2) : 1;
  const ownMultiplier = tactic.ownXg * opponentTactic.opponentXg * (1 + edge) * underdogAttackBoost;
  const opponentMultiplier = tactic.opponentXg * opponentTactic.ownXg * (1 - edge * 0.72) * underdogDefenceBoost;

  if (controlledSide === "home") {
    adjustedXG.homeXG *= ownMultiplier;
    adjustedXG.awayXG *= opponentMultiplier;
  } else {
    adjustedXG.awayXG *= ownMultiplier;
    adjustedXG.homeXG *= opponentMultiplier;
  }
  if (ratingGap >= 15 && edge >= 0.14) {
    const comebackFloor = 0.65 + edge * 2 + Math.min(0.35, ratingGap * 0.005);
    const favouriteCeiling = 3.2 - edge * 2;
    if (controlledSide === "home") {
      adjustedXG.homeXG = Math.max(adjustedXG.homeXG, comebackFloor);
      adjustedXG.awayXG = Math.min(adjustedXG.awayXG, favouriteCeiling);
    } else {
      adjustedXG.awayXG = Math.max(adjustedXG.awayXG, comebackFloor);
      adjustedXG.homeXG = Math.min(adjustedXG.homeXG, favouriteCeiling);
    }
  }
  return { adjustedXG, tacticKey, opponentTacticKey, edge };
}

function simulateMatch(match, roundIndex) {
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const randomSeed = state.drawSeed + stableHash(match.id) + roundIndex * 1009;
  const random = mulberry32(randomSeed);
  const suspendedPlayers = {
    home: suspendedPlayersForTeam(home.id, roundIndex),
    away: suspendedPlayersForTeam(away.id, roundIndex),
  };
  const modeName = state.settings.upset;
  const mode = SIMULATION_CONFIG.modes[modeName] || SIMULATION_CONFIG.modes.balanced;
  const goalConfig = SIMULATION_CONFIG.goals[state.settings.goals] || SIMULATION_CONFIG.goals.normal;
  const matchesPlayed = {
    home: matchesPlayedForTeam(home.id, roundIndex),
    away: matchesPlayedForTeam(away.id, roundIndex),
  };
  const expected = calculateExpectedGoals(
    home,
    away,
    roundIndex,
    modeName,
    state.settings.goals,
    matchesPlayed.home,
    matchesPlayed.away,
    momentumForTeam(home.id, away, roundIndex),
    momentumForTeam(away.id, home, roundIndex),
  );
  const redCards = [];
  let shock = false;

  if (random() < redCardChanceForTeam(home, modeName)) {
    redCards.push(createRedCard(home, "home", random, suspendedPlayers.home));
  }
  if (random() < redCardChanceForTeam(away, modeName)) {
    redCards.push(createRedCard(away, "away", random, suspendedPlayers.away));
  }

  let adjustedXG = { homeXG: expected.homeXG, awayXG: expected.awayXG };
  if (expected.ratingGap >= 18 && random() < mode.shockChance) {
    shock = true;
    if (teamSimulationRatings(home).overall > teamSimulationRatings(away).overall) {
      adjustedXG.homeXG *= mode.shockFavouriteReduction;
      adjustedXG.awayXG *= mode.shockUnderdogBoost;
    } else {
      adjustedXG.awayXG *= mode.shockFavouriteReduction;
      adjustedXG.homeXG *= mode.shockUnderdogBoost;
    }
  }

  redCards.forEach((card) => {
    adjustedXG = applyRedCardImpact(adjustedXG.homeXG, adjustedXG.awayXG, card);
  });
  const controlledSide = state.spectateTeamId === match.homeId
    ? "home"
    : state.spectateTeamId === match.awayId ? "away" : null;
  let tacticalMatchup = null;
  if (controlledSide) {
    const tacticalResult = applyControlledTacticalMatchup(adjustedXG, match, controlledSide);
    adjustedXG = tacticalResult.adjustedXG;
    tacticalMatchup = {
      selected: tacticalResult.tacticKey,
      opponent: tacticalResult.opponentTacticKey,
      edge: tacticalResult.edge,
    };
  }
  adjustedXG.homeXG = simulationClamp(adjustedXG.homeXG, mode.minimumXG, goalConfig.maximumXG);
  adjustedXG.awayXG = simulationClamp(adjustedXG.awayXG, mode.minimumXG, goalConfig.maximumXG);

  let homeGoals = poisson(adjustedXG.homeXG, random);
  let awayGoals = poisson(adjustedXG.awayXG, random);
  ({ homeGoals, awayGoals } = applyScorelineCeiling(home, away, homeGoals, awayGoals));
  const regulationHome = homeGoals;
  const regulationAway = awayGoals;
  let extraTime = false;
  let penalties = null;
  let shootout = null;

  if (homeGoals === awayGoals) {
    extraTime = true;
    const homeDepth = teamSimulationRatings(home).squadDepth;
    const awayDepth = teamSimulationRatings(away).squadDepth;
    const homeExtraTimeFactor = simulationClamp(0.97 - Math.max(0, 76 - homeDepth) * 0.0015, 0.86, 0.98);
    const awayExtraTimeFactor = simulationClamp(0.97 - Math.max(0, 76 - awayDepth) * 0.0015, 0.86, 0.98);
    homeGoals += poisson(adjustedXG.homeXG * 0.32 * homeExtraTimeFactor, random);
    awayGoals += poisson(adjustedXG.awayXG * 0.32 * awayExtraTimeFactor, random);
  }

  if (homeGoals === awayGoals) {
    const penaltyResult = simulatePenaltyShootout(
      home,
      away,
      random,
      redCards,
      suspendedPlayers,
      modeName,
    );
    penalties = penaltyResult.penalties;
    shootout = penaltyResult.sequence;
  }

  const winnerId = penalties
    ? penalties.home > penalties.away ? home.id : away.id
    : homeGoals > awayGoals ? home.id : away.id;

  const usedGoalMinutes = new Set();
  const homeEvents = goalEvents(
    home,
    away,
    regulationHome,
    homeGoals - regulationHome,
    random,
    redCards.filter((card) => card.side === "home"),
    suspendedPlayers.home,
    redCards.filter((card) => card.side === "away"),
    suspendedPlayers.away,
    usedGoalMinutes,
  );
  const awayEvents = goalEvents(
    away,
    home,
    regulationAway,
    awayGoals - regulationAway,
    random,
    redCards.filter((card) => card.side === "away"),
    suspendedPlayers.away,
    redCards.filter((card) => card.side === "home"),
    suspendedPlayers.home,
    usedGoalMinutes,
  );
  return {
    homeGoals,
    awayGoals,
    regulationHome,
    regulationAway,
    extraTime,
    penalties,
    shootout,
    winnerId,
    homeEvents,
    awayEvents,
    redCards: redCards.sort((a, b) => a.minute - b.minute),
    suspendedPlayers,
    shock,
    tacticalMatchup,
    expectedGoals: {
      home: Number(adjustedXG.homeXG.toFixed(3)),
      away: Number(adjustedXG.awayXG.toFixed(3)),
      homeFatigue: Number(expected.homeFatigue.toFixed(3)),
      awayFatigue: Number(expected.awayFatigue.toFixed(3)),
    },
    revealed: false,
  };
}

function createLiveMatchResult(match, roundIndex) {
  return {
    ...simulateMatch(match, roundIndex),
    engineVersion: 2,
    engineSeed: state.drawSeed + stableHash(`${match.id}-highlight-engine`),
    revealed: false,
  };
}

function buildNextRound(roundIndex) {
  if (roundIndex >= 7 || state.rounds[roundIndex + 1]) return;
  const round = state.rounds[roundIndex];
  if (!round.every((match) => match.result?.revealed)) return;
  const next = [];
  for (let index = 0; index < round.length; index += 2) {
    next.push({
      id: `r${roundIndex + 1}-m${index / 2}`,
      homeId: round[index].result.winnerId,
      awayId: round[index + 1].result.winnerId,
      result: null,
    });
  }
  state.rounds[roundIndex + 1] = next;
}

function firstUnplayedIndex(roundIndex = state.activeRound) {
  return (state.rounds[roundIndex] || []).findIndex((match) => !match.result);
}

function roundIsComplete(roundIndex) {
  const round = state.rounds[roundIndex];
  return Boolean(round?.length) && round.every((match) => match.result?.revealed);
}

function currentTournamentRoundIndex() {
  for (let index = state.rounds.length - 1; index >= 0; index -= 1) {
    if (state.rounds[index]?.some((match) => !match.result?.revealed)) return index;
  }
  return Math.max(0, state.rounds.length - 1);
}

function viewingRoundHistory() {
  return state.activeRound < currentTournamentRoundIndex() && roundIsComplete(state.activeRound);
}

function openRound(roundIndex, scrollToResults = false) {
  const round = state.rounds[roundIndex];
  if (!round) return;
  state.activeRound = roundIndex;
  state.selectedMatch = roundIsComplete(roundIndex)
    ? 0
    : Math.max(0, firstUnplayedIndex(roundIndex));
  state.championView = false;
  fixtureLimit = roundIsComplete(roundIndex) ? round.length : DEFAULT_FIXTURE_LIMIT;
  filterUnresolved = false;
  saveState();
  render();
  if (scrollToResults) els.roundBoard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function advanceSpectatedRun() {
  const team = spectatedTeam();
  if (!team) return false;
  if (!teamIsAlive(team.id)) {
    return true;
  }

  const matchIndex = teamMatchIndex(state.activeRound, team.id);
  if (matchIndex < 0) return false;
  const match = selectedRound()[matchIndex];
  state.selectedMatch = matchIndex;
  state.championView = false;
  if (!match.result?.revealed) {
    saveState();
    render();
    return true;
  }

  selectedRound().forEach((otherMatch) => {
    if (!otherMatch.result) otherMatch.result = simulateMatch(otherMatch, state.activeRound);
    otherMatch.result.revealed = true;
  });
  buildNextRound(state.activeRound);

  if (state.activeRound < 7) {
    state.activeRound += 1;
    const nextMatchIndex = teamMatchIndex(state.activeRound, team.id);
    state.selectedMatch = Math.max(0, nextMatchIndex);
    state.championView = false;
    fixtureLimit = DEFAULT_FIXTURE_LIMIT;
    filterUnresolved = false;
    showToast(`${team.name}'s ${ROUND_NAMES[state.activeRound]} match is ready.`);
  } else {
    state.championView = true;
  }
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  return true;
}

function goToNextTie() {
  if (state.spectateTeamId && !state.neutralView && advanceSpectatedRun()) return;
  const round = selectedRound();
  const next = round.findIndex((match) => !match.result);
  if (next >= 0) {
    state.selectedMatch = next;
    state.championView = false;
  } else if (state.activeRound < 7) {
    buildNextRound(state.activeRound);
    if (state.rounds[state.activeRound + 1]) {
      state.activeRound += 1;
      state.selectedMatch = 0;
      state.championView = false;
      fixtureLimit = DEFAULT_FIXTURE_LIMIT;
      filterUnresolved = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast(`${ROUND_NAMES[state.activeRound]} is ready.`);
    }
  } else {
    state.championView = true;
  }
  saveState();
  render();
}

function playbackEvents(match) {
  const result = match.result;
  const homeGoals = (result.homeEvents || []).map((event) => ({
    ...event,
    side: "home",
    teamId: match.homeId,
    player: event.scorer,
  }));
  const awayGoals = (result.awayEvents || []).map((event) => ({
    ...event,
    side: "away",
    teamId: match.awayId,
    player: event.scorer,
  }));
  const events = [...homeGoals, ...awayGoals, ...(result.redCards || [])]
    .sort((a, b) => a.minute - b.minute || (a.type === "red" ? -1 : 1));

  return events;
}

function clockText(minute) {
  const wholeMinute = Math.max(0, Math.floor(minute));
  const seconds = Math.floor((minute - wholeMinute) * 60);
  return `${String(wholeMinute).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function phaseForMinute(minute, result) {
  if (minute < 45) return "FIRST HALF";
  if (minute < 90) return "SECOND HALF";
  if (result.extraTime && minute < 105) return "EXTRA TIME - FIRST HALF";
  if (result.extraTime && minute < 120) return "EXTRA TIME - SECOND HALF";
  return result.penalties ? "PENALTY SHOOTOUT" : "FULL TIME";
}

function setMatch2dPosition(element, x, y, duration = 700) {
  if (!element) return;
  element.style.setProperty("--move-duration", `${Math.max(0, duration)}ms`);
  element.style.left = `${simulationClamp(x, 2.5, 97.5)}%`;
  element.style.top = `${simulationClamp(y, 5, 95)}%`;
}

function createMatch2dState(match) {
  if (!els.match2dPlayers || !els.match2dBall) return null;
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const controlledSide = state.spectateTeamId === match.homeId
    ? "home"
    : state.spectateTeamId === match.awayId ? "away" : null;
  const opponentKey = controlledSide ? opponentStandardTactic(match, controlledSide) : "balanced";
  const presentation = createMatchHighlightPresentation({
    seed: match.result.engineSeed || state.drawSeed + stableHash(`${match.id}-highlight-engine`),
    home,
    away,
    homeProfiles: playerProfilesForTeam(home),
    awayProfiles: playerProfilesForTeam(away),
    homeTactic: controlledSide === "home" ? state.standardTactic : controlledSide === "away" ? opponentKey : "balanced",
    awayTactic: controlledSide === "away" ? state.standardTactic : controlledSide === "home" ? opponentKey : "balanced",
    result: match.result,
  });
  match.result.matchStats = presentation.stats;
  const players = [];
  els.match2dPlayers.replaceChildren();
  [presentation.home, presentation.away].forEach((team) => {
    team.players.forEach((profile, index) => {
      const node = document.createElement("i");
      node.className = `match-2d-player is-${team.side}`;
      node.textContent = String(index + 1);
      node.setAttribute("aria-hidden", "true");
      node.title = `${profile.name} | ${profile.position} | ${profile.overall}`;
      setMatch2dPosition(node, profile.x, profile.y, 0);
      els.match2dPlayers.append(node);
      players.push({
        id: profile.id,
        node,
        x: profile.x,
        y: profile.y,
        targetX: profile.x,
        targetY: profile.y,
        vx: 0,
        vy: 0,
      });
    });
  });
  setMatch2dPosition(els.match2dBall, 50, 50, 0);
  return {
    matchId: match.id,
    engine: presentation,
    presentation,
    players,
    cursor: -1,
    activeHighlight: null,
    actionIndex: 0,
    leadInRemaining: 0,
    complete: false,
    playedEventKeys: new Set(),
    nextAction: performance.now() + 450,
    lockUntil: 0,
    lastVisualTimestamp: performance.now(),
    ballX: 50,
    ballY: 50,
    ballMotion: null,
  };
}

function mergeLiveTacticalResult(current, candidate, cutoffMinute, match) {
  const cutoff = simulationClamp(Number(cutoffMinute) || 0, 0, 120);
  const mergeEvents = (key) => [
    ...(current[key] || []).filter((event) => event.minute <= cutoff),
    ...(candidate[key] || []).filter((event) => event.minute > cutoff),
  ].sort((left, right) => left.minute - right.minute);
  let homeEvents = mergeEvents("homeEvents");
  let awayEvents = mergeEvents("awayEvents");
  let redCards = mergeEvents("redCards");
  const regulationHome = homeEvents.filter((event) => event.minute <= 90).length;
  const regulationAway = awayEvents.filter((event) => event.minute <= 90).length;
  const extraTime = regulationHome === regulationAway;

  if (!extraTime) {
    homeEvents = homeEvents.filter((event) => event.minute <= 90);
    awayEvents = awayEvents.filter((event) => event.minute <= 90);
    redCards = redCards.filter((event) => event.minute <= 90);
  }

  const homeGoals = homeEvents.length;
  const awayGoals = awayEvents.length;
  let penalties = null;
  let shootout = null;
  let winnerId;
  if (homeGoals === awayGoals) {
    const shootoutRandom = mulberry32(
      state.drawSeed + stableHash(`${match.id}-${state.standardTactic}-live-tactical-shootout`),
    );
    const penaltyResult = simulatePenaltyShootout(
      teamById(match.homeId),
      teamById(match.awayId),
      shootoutRandom,
      redCards,
      candidate.suspendedPlayers || current.suspendedPlayers || { home: [], away: [] },
      state.settings.upset,
    );
    penalties = penaltyResult.penalties;
    shootout = penaltyResult.sequence;
    winnerId = penalties.home > penalties.away ? match.homeId : match.awayId;
  } else {
    winnerId = homeGoals > awayGoals ? match.homeId : match.awayId;
  }

  return {
    ...current,
    ...candidate,
    homeEvents,
    awayEvents,
    redCards,
    homeGoals,
    awayGoals,
    regulationHome,
    regulationAway,
    extraTime,
    penalties,
    shootout,
    winnerId,
    engineVersion: current.engineVersion || 2,
    engineSeed: current.engineSeed || candidate.engineSeed,
    revealed: false,
    tacticalHistory: [...(current.tacticalHistory || []), {
      minute: Number(cutoff.toFixed(2)),
      tactic: state.standardTactic,
      opponent: candidate.tacticalMatchup?.opponent || "balanced",
      edge: candidate.tacticalMatchup?.edge || 0,
    }],
  };
}

function rebuildLiveMatchAfterTacticChange(match) {
  if (!livePlayback || !match2dState || livePlayback.matchId !== match.id) return false;
  if (match2dState.activeHighlight) {
    livePlayback.pendingTacticChange = true;
    return true;
  }
  livePlayback.pendingTacticChange = false;
  const cutoff = Math.max(
    Number(livePlayback.minute) || 0,
    Number(livePlayback.presentationClock?.snapshot().displayed) || 0,
    Number(match2dState.activeHighlight?.minute) || 0,
  );
  const candidate = createLiveMatchResult(match, livePlayback.roundIndex);
  match.result = mergeLiveTacticalResult(match.result, candidate, cutoff, match);
  const controlledSide = state.spectateTeamId === match.homeId ? "home" : "away";
  const opponentKey = match.result.tacticalMatchup?.opponent || opponentStandardTactic(match, controlledSide);
  const presentation = createMatchHighlightPresentation({
    seed: match.result.engineSeed,
    home: teamById(match.homeId),
    away: teamById(match.awayId),
    homeProfiles: playerProfilesForTeam(teamById(match.homeId)),
    awayProfiles: playerProfilesForTeam(teamById(match.awayId)),
    homeTactic: controlledSide === "home" ? state.standardTactic : opponentKey,
    awayTactic: controlledSide === "away" ? state.standardTactic : opponentKey,
    result: match.result,
  });
  match.result.matchStats = presentation.stats;
  match2dState.presentation = presentation;
  match2dState.engine = presentation;
  match2dState.cursor = presentation.highlights.findLastIndex((highlight) => highlight.minute <= cutoff);
  match2dState.activeHighlight = null;
  match2dState.actionIndex = 0;
  match2dState.complete = false;
  match2dState.nextAction = performance.now() + 180;
  livePlayback.maxMinute = match.result.extraTime ? 120 : 90;
  livePlayback.visibleStats = matchStatsAtMinute(presentation.stats, cutoff);
  livePlayback.presentationScheduler.clear("live-tactic-change");
  livePlayback.presentationClock = MatchPresentation.createClock({
    initialMinute: cutoff,
    maxMinute: livePlayback.maxMinute,
    speed: livePlayback.speed,
    now: performance.now(),
  });
  renderMatchAnalysis(match, true);
  return true;
}

function controlledMatchTactic(match) {
  const controlled = state.spectateTeamId
    && (match.homeId === state.spectateTeamId || match.awayId === state.spectateTeamId);
  return controlled ? (STANDARD_TACTICS[state.standardTactic] || STANDARD_TACTICS.balanced) : STANDARD_TACTICS.balanced;
}

function match2dTacticSummary(match) {
  const selected = controlledMatchTactic(match).name;
  const opponentKey = match?.result?.tacticalMatchup?.opponent;
  const opponent = STANDARD_TACTICS[opponentKey]?.name;
  return opponent ? `${selected} vs ${opponent}` : selected;
}

function syncMatch2dPlayers(duration, shape = null) {
  if (!match2dState) return;
  const enginePlayers = [...match2dState.presentation.home.players, ...match2dState.presentation.away.players];
  match2dState.players.forEach((visual) => {
    const { id } = visual;
    const player = enginePlayers.find((candidate) => candidate.id === id);
    const target = shape?.[id] || player;
    if (target) {
      visual.targetX = target.x;
      visual.targetY = target.y;
    }
  });
}

function animateMatch2dScene(timestamp) {
  if (!match2dState) return;
  const elapsed = Math.min(0.05, Math.max(0.001, (timestamp - match2dState.lastVisualTimestamp) / 1000));
  match2dState.lastVisualTimestamp = timestamp;
  const reducedMotion = Boolean(livePlayback?.reducedMotion);
  match2dState.players.forEach((visual) => {
    const dx = visual.targetX - visual.x;
    const dy = visual.targetY - visual.y;
    const distance = Math.hypot(dx, dy);
    if (reducedMotion) {
      visual.x = visual.targetX;
      visual.y = visual.targetY;
    } else {
      const desiredSpeed = Math.min(25, distance * 3.8);
      const desiredVx = distance > 0.01 ? (dx / distance) * desiredSpeed : 0;
      const desiredVy = distance > 0.01 ? (dy / distance) * desiredSpeed : 0;
      const acceleration = 1 - Math.exp(-8 * elapsed);
      visual.vx += (desiredVx - visual.vx) * acceleration;
      visual.vy += (desiredVy - visual.vy) * acceleration;
      visual.x += visual.vx * elapsed;
      visual.y += visual.vy * elapsed;
      if (distance < 0.15) {
        visual.x = visual.targetX;
        visual.y = visual.targetY;
        visual.vx *= 0.45;
        visual.vy *= 0.45;
      }
    }
    setMatch2dPosition(visual.node, visual.x, visual.y, reducedMotion ? 0 : 45);
  });

  const motion = match2dState.ballMotion;
  if (motion) {
    const progress = simulationClamp((timestamp - motion.startedAt) / motion.duration, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    match2dState.ballX = motion.from.x + (motion.to.x - motion.from.x) * eased;
    const bend = motion.arc * 4 * progress * (1 - progress);
    match2dState.ballY = motion.from.y + (motion.to.y - motion.from.y) * eased + bend;
    if (progress >= 1) match2dState.ballMotion = null;
  }
  setMatch2dPosition(els.match2dBall, match2dState.ballX, match2dState.ballY, reducedMotion ? 0 : 30);
}

function match2dActionCopy(action) {
  const actor = action.actor?.name || "Player";
  if (action.outcome === "goal" || action.event?.type === "goal") return `${actor} finds the net!`;
  if (action.outcome === "saved") {
    const keeper = action.goalkeeper?.name || "Goalkeeper";
    return action.penalty ? `${keeper} guesses correctly and saves the penalty!` : `${keeper} makes a strong save`;
  }
  if (action.outcome === "missed" && action.penalty) return `${actor} puts the penalty wide!`;
  if (action.outcome === "blocked") return `${action.target?.name || "Defender"} gets in the way`;
  if (action.outcome === "rebound") return `${action.target?.name || "The attack"} reacts first to the rebound`;
  if (action.outcome === "corner") return "A deflection takes it behind for a corner";
  if (action.outcome === "missed") return `${actor} sends it narrowly wide`;
  if (action.type === "foul" && action.outcome === "penalty") {
    const team = action.target?.side === "home" ? teamById(selectedMatch()?.homeId) : teamById(selectedMatch()?.awayId);
    return `PENALTY TO ${(team?.name || "TEAM").toUpperCase()}!`;
  }
  if (action.type === "foul") return `Foul on ${action.target?.name || actor}`;
  if (action.type === "tackle") return `${actor} times the challenge perfectly`;
  if (action.type === "interception") return `${actor} reads the pass and steps in`;
  if (action.type === "clearance") return `${actor} gets it away from danger`;
  if (action.type === "through-ball") return `${actor} threads a pass into the channel`;
  if (action.type === "progressive-pass") return `${actor} punches a pass through the lines`;
  if (action.type === "cross") return `${actor} delivers into the area`;
  if (action.type === "dribble") return `${actor} drives forward with the ball`;
  return `${actor} recycles possession`;
}

function recordPossessionGoal(event) {
  const match = selectedMatch();
  if (!match?.result) return;
  const eventsKey = event.side === "home" ? "homeEvents" : "awayEvents";
  const goalsKey = event.side === "home" ? "homeGoals" : "awayGoals";
  const regulationKey = event.side === "home" ? "regulationHome" : "regulationAway";
  match.result[eventsKey].push({
    type: "goal",
    scorer: event.player,
    minute: event.minute,
    goalType: event.goalType || "openPlay",
    xg: event.xg,
  });
  match.result[goalsKey] += 1;
  if (event.minute <= 90) match.result[regulationKey] += 1;
}

function match2dEventKey(event) {
  return `${event.type}:${event.side}:${event.minute}:${event.player || event.scorer || ""}`;
}

function processPossessionAction(action, timestamp, animate = true) {
  if (!action || !match2dState || !livePlayback) return;
  const match = selectedMatch();
  const speed = Math.max(0.5, livePlayback.speed || 1);
  const duration = Math.max(50, (action.duration || 300) / (speed * 2));
  if (animate) {
    syncMatch2dPlayers(duration, action.shape);
    const from = action.from || { x: match2dState.ballX, y: match2dState.ballY };
    const to = action.to || from;
    match2dState.ballX = from.x;
    match2dState.ballY = from.y;
    match2dState.ballMotion = {
      from: { ...from },
      to: { ...to },
      startedAt: timestamp,
      duration: Math.max(180, duration * 0.86),
      arc: ["cross", "through-ball", "clearance"].includes(action.type)
        ? (action.index % 2 === 0 ? -1.8 : 1.8)
        : 0,
    };
    els.match2dPossession.textContent = action.commentary || match2dActionCopy(action);
  }
  const isGoal = action.outcome === "goal" || action.event?.type === "goal";
  const isPenaltyGoal = isGoal && (action.event?.goalType === "penalty" || action.outcome === "penalty");
  const interactivePenalty = isPenaltyGoal && action.event && isControlledMatchPenalty(action.event);
  if (interactivePenalty) {
    const penaltyEvent = MatchPresentation.createEvent({
      ...action.presentationEvent,
      id: `${action.presentationEvent.id}:awarded`,
      type: "penalty-awarded",
      importance: "major",
      scoreAfter: action.presentationEvent.scoreBefore,
      metadata: { ...action.presentationEvent.metadata, commentary: `PENALTY TO ${teamById(action.event.teamId)?.name || "THE ATTACKING TEAM"}!` },
    });
    receivePresentationEvent(penaltyEvent, penaltyEvent.metadata.commentary, animate);
  } else {
    receivePresentationAction(action, animate);
  }
  if (isPenaltyGoal && action.event && !livePlayback.matchPenaltyActive) {
    startMatchPenaltyAnimation(action.event, action);
  }
  match2dState.nextAction = timestamp + duration + 90 / speed;
  els.match2dTacticLabel.textContent = match2dTacticSummary(match);
}

function highlightMatchesMode(highlight) {
  return preferredHighlightMode === "extended" || highlight.importance === "key";
}

function nextMatchHighlight() {
  if (!match2dState) return null;
  return match2dState.presentation.highlights.find((highlight) => (
    highlight.timelineIndex > match2dState.cursor
  )) || null;
}

function matchStatsAtMinute(stats, minute) {
  const progress = simulationClamp(minute / Math.max(1, stats.maxMinute), 0, 1);
  const countPair = (pair) => ({
    home: Math.min(pair.home, Math.floor(pair.home * progress + 0.35)),
    away: Math.min(pair.away, Math.floor(pair.away * progress + 0.35)),
  });
  return {
    ...stats,
    xg: {
      home: Number((stats.xg.home * progress).toFixed(2)),
      away: Number((stats.xg.away * progress).toFixed(2)),
    },
    shots: countPair(stats.shots),
    shotsOnTarget: countPair(stats.shotsOnTarget),
    yellowCards: countPair(stats.yellowCards),
    redCards: {
      home: livePlayback?.homeReds.length || 0,
      away: livePlayback?.awayReds.length || 0,
    },
  };
}

function beginMatchHighlight(highlight, timestamp) {
  const speed = Math.max(0.5, livePlayback.speed || 1);
  match2dState.cursor = highlight.timelineIndex;
  match2dState.activeHighlight = highlight;
  match2dState.actionIndex = 0;
  livePlayback.visibleStats = matchStatsAtMinute(match2dState.presentation.stats, highlight.minute);
  els.livePhase.textContent = phaseForMinute(Math.floor(livePlayback.minute), selectedMatch().result);
  els.match2dViewer.hidden = true;
  els.matchCommentaryView.hidden = false;
  renderMatchAnalysis(selectedMatch(), true);
  match2dState.nextAction = timestamp + (livePlayback.reducedMotion ? 8 : 12 / speed);
}

function fallbackPresentationEvent(action) {
  const match = selectedMatch();
  const rawEvent = action.event || {};
  const side = rawEvent.side || action.side || "home";
  const isGoal = action.outcome === "goal" || rawEvent.type === "goal";
  const scoreBefore = { home: livePlayback.homeScore, away: livePlayback.awayScore };
  const scoreAfter = { ...scoreBefore };
  if (isGoal) scoreAfter[side] += 1;
  livePlayback._presentationSequence += 1;
  return MatchPresentation.createEvent({
    ...rawEvent,
    id: rawEvent.id || `${livePlayback.matchId}:fallback:${livePlayback._presentationSequence}`,
    sequence: rawEvent.sequence || livePlayback._presentationSequence,
    minute: rawEvent.minute ?? livePlayback.minute,
    addedTime: rawEvent.addedTime || 0,
    type: rawEvent.type || action.type || "action",
    importance: actionEmphasis(action),
    side,
    teamId: rawEvent.teamId || (side === "home" ? match.homeId : match.awayId),
    playerIds: [action.actor?.id, action.target?.id].filter(Boolean),
    scoreBefore,
    scoreAfter,
    phase: rawEvent.phase || (livePlayback.minute > 90 ? "extra-time" : livePlayback.minute > 45 ? "second-half" : "first-half"),
    metadata: {
      scorer: rawEvent.scorer || rawEvent.player || action.actor?.name || null,
      goalType: rawEvent.goalType || null,
      ownGoal: Boolean(rawEvent.ownGoal),
      ownGoalBy: rawEvent.ownGoalBy || null,
      commentary: action.commentary || match2dActionCopy(action),
      authoritative: Boolean(rawEvent.authoritative),
    },
  });
}

function presentationDebug(label, event, reason = "") {
  if (!window.__MATCH_PRESENTATION_DEBUG__) return;
  const scheduler = livePlayback?.presentationScheduler?.snapshot();
  console.debug(label, {
    id: event?.id,
    sequence: event?.sequence,
    minute: event?.minute,
    wallClock: Date.now(),
    importance: event?.importance,
    scoreBefore: event?.scoreBefore,
    scoreAfter: event?.scoreAfter,
    queueLength: scheduler?.queueLength || 0,
    reason,
  });
}

function acceptPresentationEvent(event) {
  if (!livePlayback || !["goal", "red", "disallowed-goal", "penalty-miss"].includes(event.type)) return;
  match2dState?.playedEventKeys?.add(event.id);
  if (["goal", "red"].includes(event.type)) applyLiveEvent(event, Boolean(event.metadata.animate));
  presentationDebug(event.type === "goal" ? "[SCORE_UPDATE]" : "[SIM_EVENT]", event);
}

function showPresentationEvent(event) {
  if (!livePlayback) return;
  const team = teamById(event.teamId);
  const text = event.importance === "goal"
    ? MatchPresentation.goalCommentary(event, team?.name || "Team")
    : event.metadata.commentary || event.metadata.heading || event.type;
  livePlayback.commentaryFeed = [{
    minute: Math.floor(event.minute),
    text,
    type: event.type,
    emphasis: event.importance,
    eventId: event.id,
  }];
  if (event.type === "shootout-kick") livePlayback.shootoutCommentary = text;
  renderCommentaryFeed();
  if (event.importance === "goal") flashGoalCelebration(event);
  presentationDebug(event.importance === "goal" ? "[GOAL_PRESENTATION]" : "[PRESENTATION_SHOW]", event);
}

function createLivePresentationScheduler() {
  return MatchPresentation.createScheduler({
    now: () => performance.now(),
    onAccept: acceptPresentationEvent,
    onShow: showPresentationEvent,
    onDrop: (event, reason) => presentationDebug("[PRESENTATION_DROP]", event, reason),
  });
}

function receivePresentationEvent(baseEvent, commentary, animate = false) {
  if (!livePlayback) return "silent";
  const event = MatchPresentation.createEvent({
    ...baseEvent,
    metadata: {
      ...baseEvent.metadata,
      commentary: commentary || baseEvent.metadata.commentary || baseEvent.type,
      animate,
    },
  });
  const now = performance.now();
  livePlayback.presentationClock.sync(event.minute, now);
  livePlayback.minute = Math.max(livePlayback.minute, event.minute);
  presentationDebug("[PRESENTATION_ENQUEUE]", event);
  livePlayback.presentationScheduler.enqueue(event, {
    now,
    speed: livePlayback.speed,
    reducedMotion: livePlayback.reducedMotion,
  });
  return event.importance;
}

function receivePresentationAction(action, animate = false) {
  const baseEvent = action.presentationEvent || fallbackPresentationEvent(action);
  return receivePresentationEvent(
    baseEvent,
    action.commentary || baseEvent.metadata.commentary || match2dActionCopy(action),
    animate,
  );
}

function renderCommentaryFeed() {
  if (!els.matchCommentaryFeed) return;
  const feed = livePlayback?.commentaryFeed || [];
  const latest = feed[feed.length - 1];
  if (!latest) { els.matchCommentaryFeed.innerHTML = ""; return; }
  const isGoal = latest.emphasis === "goal";
  const isMajor = latest.emphasis === "major";
  els.matchCommentaryFeed.classList.remove("is-goal", "is-major");
  if (isGoal) els.matchCommentaryFeed.classList.add("is-goal");
  if (isMajor) els.matchCommentaryFeed.classList.add("is-major");
  let text = latest.text;
  if (isGoal) text = latest._goalText || text.toUpperCase();
  else if (isMajor && text.length < 60) text = text.toUpperCase();
  const line = document.createElement("div");
  line.className = `commentary-line ${latest.type || ""}`;
  const copy = document.createElement("span");
  copy.style.cssText = "display:block;width:100%;text-align:center;margin:0 auto";
  copy.textContent = text;
  line.append(copy);
  els.matchCommentaryFeed.replaceChildren(line);
}

function actionEmphasis(action) {
  if (!action) return "silent";
  if (action.presentationEvent?.importance) return action.presentationEvent.importance;
  if (action.outcome === "goal" || action.event?.type === "goal") return "goal";
  if (action.event?.type === "red") return "major";
  if (action.outcome === "penalty" || action.penalty) return "major";
  if (action.outcome === "saved" && (action.xg || 0) > 0.2) return "major";
  if (action.outcome === "saved") return "notable";
  if (action.outcome === "blocked" && (action.xg || 0) > 0.15) return "notable";
  if (action.outcome === "rebound" && (action.xg || 0) > 0.1) return "notable";
  if (action.type === "through-ball") return "notable";
  if (action.type === "cross" && action.outcome !== "complete") return "notable";
  if (action.type === "shot" && action.outcome !== "goal") return "notable";
  if (action.type === "foul") return "notable";
  if (action.type === "tackle" && action.outcome !== "complete") return "normal";
  if (action.type === "interception" && action.outcome !== "complete") return "normal";
  if (action.type === "clearance" && action.outcome !== "complete") return "normal";
  if (action.type === "progressive-pass") return "normal";
  if (action.type === "dribble" && action.commentary) return "normal";
  if (action.type === "cross" && action.commentary) return "normal";
  return "silent";
}

function flashGoalCelebration(event) {
  if (!els.matchCommentaryFeed || !event) return;
  const team = teamById(event.teamId);
  if (!team) return;
  const theme = getTeamGoalFlashTheme(team);
  els.matchCommentaryFeed.style.setProperty("--scoring-team-colour", theme.background);
  els.matchCommentaryFeed.style.setProperty("--goal-flash-color", theme.background);
  els.matchCommentaryFeed.style.setProperty("--goal-flash-text-color", theme.text);
  els.matchCommentaryFeed.style.background = theme.background;
  els.matchCommentaryFeed.style.borderColor = theme.background;
  els.matchCommentaryFeed.style.color = theme.text;
  els.matchCommentaryFeed.classList.add("is-goal-flashing");
  els.matchCommentaryFeed.style.animation = "none";
  void els.matchCommentaryFeed.offsetWidth;
  els.matchCommentaryFeed.style.animation = "goalPulse 0.5s ease-in-out 2, goalFlashBg 1.4s ease-out forwards";
  if (livePlayback._goalFlashTimer) clearTimeout(livePlayback._goalFlashTimer);
  livePlayback._goalFlashTimer = setTimeout(() => {
    if (!els.matchCommentaryFeed) return;
    els.matchCommentaryFeed.style.background = "";
    els.matchCommentaryFeed.style.borderColor = "";
    els.matchCommentaryFeed.style.color = "";
    els.matchCommentaryFeed.style.animation = "";
    els.matchCommentaryFeed.classList.remove("is-goal-flashing");
    els.matchCommentaryFeed.style.setProperty("--scoring-team-colour", "");
    els.matchCommentaryFeed.style.setProperty("--goal-flash-text-color", "");
  }, livePlayback?.reducedMotion ? 800 : 1800);
}

const TOP_50_GOAL_FLASH_COLORS = Object.freeze({
  AR: "#74ACDF", ES: "#AA151B", FR: "#002654", "GB-ENG": "#F4F6F8", PT: "#046A38",
  BR: "#FFDF00", MA: "#C1272D", NL: "#F36C21", BE: "#FDDA24", DE: "#F4F6F8",
  HR: "#D90F2F", IT: "#0066B3", CO: "#FCD116", MX: "#006847", SN: "#00853F",
  UY: "#5BC0EB", US: "#002868", JP: "#F4F6F8", CH: "#D52B1E", IR: "#239F40",
  DK: "#C60C30", TR: "#E30A17", EC: "#FFD100", AT: "#ED2939", KR: "#CD2E3A",
  NG: "#008753", AU: "#FFCD00", DZ: "#006633", EG: "#CE1126", CA: "#D80621",
  NO: "#BA0C2F", UA: "#0057B8", CI: "#F77F00", PA: "#D21034", RU: "#1C3578",
  PL: "#F4F6F8", "GB-WLS": "#D30731", SE: "#006AA7", HU: "#CE2939", CZ: "#11457E",
  PY: "#0038A8", "GB-SCT": "#003876", RS: "#C6363C", CM: "#007A5E", TN: "#E70013",
  CD: "#007FFF", SK: "#0B4EA2", GR: "#0D5EAF", VE: "#7B1E3A", UZ: "#0099B5",
});

function goalFlashContrastText(background) {
  const match = /^#([0-9a-f]{6})$/i.exec(background || "");
  if (!match) return "#FFFFFF";
  const channels = [0, 2, 4].map((offset) => parseInt(match[1].slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  const luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.05;
  return darkContrast >= whiteContrast ? "#07111F" : "#FFFFFF";
}

function getTeamGoalFlashTheme(team) {
  const background = TOP_50_GOAL_FLASH_COLORS[team?.code] || getTeamColorCSS(team);
  return Object.freeze({
    background,
    text: goalFlashContrastText(background),
  });
}

function getTeamColorCSS(team) {
  const colors = {
    BRA: "#FEDF00", ARG: "#75AADB", FRA: "#002395", GER: "#FFFFFF", ITA: "#0066CC",
    NED: "#F36C21", ESP: "#C60B1E", ENG: "#FFFFFF", POR: "#900000", BEL: "#FDDA24",
    URU: "#5B9BD5", CRO: "#FF0000", MAR: "#C1272D", JPN: "#000066", SEN: "#00853F",
    MEX: "#006847", USA: "#002868", CRC: "#CE1126", CAN: "#FF0000", KOR: "#C60C30",
    GHA: "#006B3F", CMR: "#007A5E", TUN: "#E70013", POL: "#DC143C", SRB: "#C6363C",
    SUI: "#FF0000", ECU: "#FFDD00", QAT: "#8A1538", IRN: "#239F40", KSA: "#006C35",
    AUS: "#FFCD00", WAL: "#D30731", DEN: "#C60C30", SCO: "#003876", AUT: "#ED2939",
    NOR: "#BA0C2F", SWE: "#004B87", RUS: "#D52B1E", CZE: "#11457E", HUN: "#CD2A3C",
    ROU: "#FCD116", BUL: "#00966E", SVK: "#034DA3", SVN: "#008080", BIH: "#001489",
    MNE: "#C41E3A", MKD: "#D82126", ALB: "#E41E20", ISL: "#003897", GEO: "#DA291C",
    ARM: "#0033A0", KAZ: "#00AEEF", AZE: "#00B9E4", FIN: "#002F6C", IRL: "#169B62",
    NIR: "#00A651", ISR: "#0038B8", BLR: "#CE1720", UKR: "#0057B7", MDA: "#003DA5",
    LUX: "#ED1C24", MLT: "#CF142B", CYP: "#006A4C", EST: "#0072CE", LVA: "#A4343A",
    LTU: "#FFB81C", FRO: "#0061B8", GIB: "#DA000C", LIE: "#002F6C", AND: "#FFCC00",
    SMR: "#5EB6E4", GRE: "#000080", TUR: "#C9072B", COL: "#FFCD00", CHI: "#DA291C",
    PER: "#D91023", PAR: "#0038A8", VEN: "#750000", BOL: "#007934", NGA: "#008753",
    ALG: "#006633", EGY: "#C8102E", CIV: "#F77F00", RSA: "#007749", COD: "#007FFF",
    ZAM: "#198A00", MLI: "#14B53A", BFA: "#009E49", GUI: "#CE1126", GAB: "#009E60",
    ANG: "#CC092F", TOG: "#006A4E", BEN: "#008751", NAM: "#003C78", MOZ: "#D21034",
    MAD: "#007E39", ZIM: "#FFD100", CGO: "#009543", UGA: "#FFDC00", TAN: "#1EB53A",
    RWA: "#20603D", KEN: "#BB0000", BOT: "#75AADB", MWI: "#CE1126", SUD: "#D21034",
    SWZ: "#3E5EB9", LES: "#00209F", MRI: "#EA2839", SEY: "#D62828", COM: "#3A75C4",
  };
  const c = colors[team.code] || colors[team.id];
  if (c) return c === "#FFFFFF" ? "#D0D0D0" : c;
  // Hash-based fallback: every team gets a unique, rich colour
  const hash = stableHash(team.id || team.name);
  const hue = hash % 360;
  return `hsl(${hue}, 65%, 38%)`;
}

function stepMatch2dViewer(timestamp) {
  if (!match2dState || !livePlayback || match2dState.matchId !== livePlayback.matchId) return;
  if (livePlayback.matchPenaltyActive && livePlayback.matchPenaltyContext) return;
  if (timestamp < match2dState.nextAction || timestamp < match2dState.lockUntil) return;
  const speed = Math.max(0.5, livePlayback.speed || 1);
  const active = match2dState.activeHighlight;
  // Process multiple cheap actions per frame, stop only for goals/major events
  while (active && match2dState.actionIndex < active.actions.length) {
    const action = active.actions[match2dState.actionIndex];
    match2dState.actionIndex += 1;
    const matchesMode = highlightMatchesMode(active);
    if (matchesMode) {
      processPossessionAction(action, timestamp, true);
      return;
    } else {
      const importance = receivePresentationAction(action, false);
      if (importance === "goal" || importance === "major") return;
    }
  }
  if (active && match2dState.actionIndex >= active.actions.length) {
    if (highlightMatchesMode(active)) {
      els.match2dViewer.hidden = true;
      els.matchCommentaryView.hidden = false;
    }
    match2dState.activeHighlight = null;
    if (livePlayback.pendingTacticChange) {
      rebuildLiveMatchAfterTacticChange(selectedMatch());
      return;
    }
    match2dState.nextAction = timestamp + (livePlayback.reducedMotion ? 8 : 16 / speed);
    return;
  }
  const highlight = nextMatchHighlight();
  if (!highlight) {
    match2dState.complete = true;
    return;
  }
  beginMatchHighlight(highlight, timestamp);
}

function showMatch2dEvent(event) {
  if (!match2dState || !els.match2dEvent) return;
  const label = event.type === "red" ? "RED CARD" : event.goalType === "penalty" ? "PENALTY" : "GOAL";
  els.match2dEvent.textContent = label;
  els.match2dEvent.hidden = false;
  if (event.type === "goal" && event.goalType !== "penalty" && !event.engineGenerated) {
    const goalX = event.side === "home" ? 98 : 2;
    setMatch2dPosition(els.match2dBall, goalX, 50, 520);
  }
  clearTimeout(match2dState.eventTimer);
  match2dState.eventTimer = setTimeout(() => {
    if (els.match2dEvent) els.match2dEvent.hidden = true;
  }, event.goalType === "penalty" ? 1200 : 760);
}

function timelineEventMarkup(event, away = false, animate = false) {
  if (!["goal", "red"].includes(event.type)) return "";
  const marker = event.type === "red" ? "<i></i>" : "";
  return `
    <div class="event timeline-event ${event.type === "red" ? "red-event" : "goal-event"} ${animate ? "event-enter" : ""}">
      ${away
    ? `<b>${event.minute}'</b><span>${event.player}</span>${marker}`
    : `${marker}<span>${event.player}</span><b>${event.minute}'</b>`}
    </div>
  `;
}

function disciplineMarkup(cards) {
  return cards.map((card) => `
    <span class="discipline-card">
      <i></i>
      <span>${card.player} · ${card.minute}'</span>
    </span>
  `).join("");
}

function renderLiveTimeline() {
  if (!livePlayback) return;
  const playedEvents = livePlayback.feed
    .filter((event) => ["goal", "red"].includes(event.type))
    .reverse();
  els.homeEventSide.innerHTML = playedEvents
    .filter((event) => event.side === "home")
    .map((event) => timelineEventMarkup(event))
    .join("");
  els.awayEventSide.innerHTML = playedEvents
    .filter((event) => event.side === "away")
    .map((event) => timelineEventMarkup(event, true))
    .join("");
}

function appendLiveTimelineEvent(event, animate = true) {
  if (!["goal", "red"].includes(event.type)) return;
  const target = event.side === "home" ? els.homeEventSide : els.awayEventSide;
  target.insertAdjacentHTML(
    "beforeend",
    timelineEventMarkup(event, event.side === "away", animate),
  );
}

function bumpScore(side) {
  const element = side === "home" ? els.homeScore : els.awayScore;
  element.classList.add("score-pop");
  setTimeout(() => element.classList.remove("score-pop"), 230);
}

function applyLiveEvent(event, animate = true) {
  if (!livePlayback) return;
  if (animate) showMatch2dEvent(event);
  if (event.type === "goal") {
    if (event.scoreAfter) {
      livePlayback.homeScore = event.scoreAfter.home;
      livePlayback.awayScore = event.scoreAfter.away;
    } else {
      livePlayback[`${event.side}Score`] += 1;
    }
    if (animate) {
      bumpScore(event.side);
    }
  }
  if (event.type === "red") {
    livePlayback[`${event.side}Reds`].push(event);
  }
  livePlayback.feed.unshift(event);
  els.homeScore.textContent = livePlayback.homeScore;
  els.awayScore.textContent = livePlayback.awayScore;
  els.homeDiscipline.innerHTML = disciplineMarkup(livePlayback.homeReds);
  els.awayDiscipline.innerHTML = disciplineMarkup(livePlayback.awayReds);
  appendLiveTimelineEvent(event, animate);
}

function ensureShootoutSequence(match) {
  if (!match.result?.penalties || match.result.shootout?.length) return;
  const random = mulberry32(state.drawSeed + stableHash(`${match.id}-shootout`));
  match.result.shootout = createShootoutSequence(
    teamById(match.homeId),
    teamById(match.awayId),
    match.result.penalties,
    random,
    match.result.redCards || [],
    match.result.suspendedPlayers || { home: [], away: [] },
  );
}

function penaltyDirectionCopy(direction) {
  if (direction === "wide-left") return "towards the left post";
  if (direction === "wide-right") return "towards the right post";
  return direction === "centre" ? "down the middle" : `to the ${direction}`;
}

function penaltyDirectionTarget(direction, random) {
  if (direction === "left") return random() < 0.5 ? "bottom-left" : "top-left";
  if (direction === "right") return random() < 0.5 ? "bottom-right" : "top-right";
  return "middle";
}

function penaltyMissCopy(attempt) {
  if (attempt.missType === "wide") {
    return attempt.direction === "wide-left"
      ? "WIDE · past the left post"
      : "WIDE · past the right post";
  }
  return `SAVED · keeper dives ${attempt.keeperDive}`;
}

function penaltyStepDelay(duration) {
  if (!livePlayback) return duration;
  if (livePlayback.reducedMotion) return Math.min(180, duration);
  return duration / livePlayback.speed;
}

const DEFAULT_SHOOTOUT_MARKS = 5;
const STANDARD_PENALTY_TARGETS = Object.freeze(["top-left", "top-right", "middle", "bottom-left", "bottom-right"]);

function shootoutMarkState(playback, side) {
  if (!playback?.shootout?.length) return { attempts: new Map(), slotCount: DEFAULT_SHOOTOUT_MARKS };
  const currentAttempt = playback.shootout[playback.shootoutIndex]
    || playback.shootout[playback.shootout.length - 1];
  const currentRound = currentAttempt?.round || Math.floor(playback.shootoutIndex / 2) + 1;
  const completedThrough = ["result", "complete"].includes(playback.shootoutStep)
    ? playback.shootoutIndex
    : playback.shootoutIndex - 1;

  const attempts = new Map(playback.shootout
    .map((attempt, index) => ({ attempt, index }))
    .filter(({ attempt, index }) => attempt.side === side && index <= completedThrough)
    .map(({ attempt }) => [attempt.round, attempt]));
  return { attempts, slotCount: Math.max(DEFAULT_SHOOTOUT_MARKS, currentRound) };
}

function shootoutMarksMarkup(playback, side) {
  const { attempts, slotCount } = shootoutMarkState(playback, side);
  return Array.from({ length: slotCount }, (_, index) => {
    const round = index + 1;
    const attempt = attempts.get(round);
    const state = attempt ? attempt.scored ? "goal" : "miss" : "pending";
    const label = attempt ? attempt.scored ? "Scored" : "Missed" : "Awaiting kick";
    return `<i class="penalty-mark ${state}" title="Kick ${round}: ${label}"></i>`;
  }).join("");
}

function penaltyMarksMarkup(side) {
  return shootoutMarksMarkup(livePlayback, side);
}

function setPenaltySceneElement(scene, attempt, step) {
  if (!attempt) return;
  if (step === "setup") {
    scene.classList.add("is-resetting");
    scene.dataset.state = "setup";
    scene.dataset.result = "pending";
    scene.dataset.direction = attempt.direction;
    scene.dataset.dive = attempt.keeperDive;
    scene.dataset.foot = attempt.foot || "right";
    void scene.offsetWidth;
    scene.classList.remove("is-resetting");
    return;
  }
  scene.dataset.state = step === "flight" ? "flight" : "result";
  scene.dataset.direction = attempt.direction;
  scene.dataset.dive = attempt.keeperDive;
  scene.dataset.foot = attempt.foot || "right";
  scene.dataset.result = attempt.scored ? "goal" : attempt.missType === "wide" ? "wide" : "save";
}

function setPenaltyScene(attempt, step) {
  els.penaltyScene.dataset.target = attempt?.target || "middle";
  setPenaltySceneElement(els.penaltyScene, attempt, step);
}

function controlledStandardShootoutSide(match) {
  if (!state.spectateTeamId) return null;
  if (match.homeId === state.spectateTeamId) return "home";
  if (match.awayId === state.spectateTeamId) return "away";
  return null;
}

function standardShootoutWinner({ homeScore, awayScore, homeKicks, awayKicks }) {
  const homeCannotCatch = awayKicks < 5 && homeScore > awayScore + (5 - awayKicks);
  const awayCannotCatch = homeKicks < 5 && awayScore > homeScore + (5 - homeKicks);
  if (homeCannotCatch) return "home";
  if (awayCannotCatch) return "away";
  if (homeKicks < 5 || awayKicks < 5 || homeKicks !== awayKicks || homeScore === awayScore) return null;
  return homeScore > awayScore ? "home" : "away";
}

function completedInteractiveShootoutState(playback) {
  const attempts = playback.shootout.slice(0, playback.shootoutIndex + 1)
    .filter((attempt) => typeof attempt.scored === "boolean");
  return {
    homeScore: attempts.filter((attempt) => attempt.side === "home" && attempt.scored).length,
    awayScore: attempts.filter((attempt) => attempt.side === "away" && attempt.scored).length,
    homeKicks: attempts.filter((attempt) => attempt.side === "home").length,
    awayKicks: attempts.filter((attempt) => attempt.side === "away").length,
  };
}

function finalizeInteractiveShootout(winnerSide) {
  if (!livePlayback?.interactiveShootout || !winnerSide) return;
  const match = state.rounds[livePlayback.roundIndex]?.[livePlayback.matchIndex];
  const shootout = livePlayback.shootout.slice(0, livePlayback.shootoutIndex + 1);
  match.result.shootout = shootout;
  match.result.penalties = {
    home: livePlayback.penaltyHomeScore,
    away: livePlayback.penaltyAwayScore,
  };
  match.result.winnerId = winnerSide === "home" ? match.homeId : match.awayId;
}

function chooseStandardPenaltyTarget(target) {
  if (!livePlayback || livePlayback.paused || livePlayback.phase !== "shootout") return;
  if (!STANDARD_PENALTY_TARGETS.includes(target)) return;
  const attempt = livePlayback.shootout[livePlayback.shootoutIndex];
  if (!attempt?.interactive || attempt.target || livePlayback.shootoutStep !== "setup") return;
  resolveManualPenaltyAttempt(attempt, target);
  renderPenaltyStage();
  schedulePenaltyStep(120);
}

function resolveManualPenaltyAttempt(attempt, target) {
  const goalkeeperMatched = attempt.goalkeeperTarget === target;
  const goalChance = manualPenaltyGoalChance(attempt.conversionChance, goalkeeperMatched);
  attempt.target = target;
  attempt.direction = onlinePenaltyDirection(target);
  attempt.keeperDive = onlinePenaltyDirection(attempt.goalkeeperTarget);
  attempt.scored = !goalkeeperMatched || attempt.outcomeRoll < goalChance;
  attempt.missType = attempt.scored ? null : "save";
  if (!attempt.scored) attempt.keeperDive = attempt.direction;
  return attempt;
}

function manualPenaltyGoalChance(conversionChance, goalkeeperMatched) {
  return goalkeeperMatched
    ? simulationClamp(conversionChance * 0.15, 0.05, 0.15)
    : 1;
}

function clearMatchPenaltyAnimation() {
  if (!livePlayback?.matchPenaltyTimers) return;
  livePlayback.matchPenaltyTimers.forEach((timer) => clearTimeout(timer));
  livePlayback.matchPenaltyTimers = [];
  livePlayback.matchPenaltyActive = false;
  livePlayback.matchPenaltyContext = null;
  els.matchPenaltyOverlay.hidden = true;
  els.matchPenaltyOverlay.classList.remove("is-awaiting-choice");
  els.matchStage.classList.remove("has-match-penalty");
}

function matchPenaltyAttempt(event, interactive = false) {
  const team = teamById(event.teamId);
  const opponent = teamById(event.side === "home" ? selectedMatch().awayId : selectedMatch().homeId);
  const random = mulberry32(state.drawSeed + stableHash(`${livePlayback.matchId}-${event.side}-${event.minute}-${event.player}-match-penalty`));
  if (interactive) {
    const goalkeeperTarget = STANDARD_PENALTY_TARGETS[Math.floor(random() * STANDARD_PENALTY_TARGETS.length)];
    return {
      player: event.player,
      side: event.side,
      scored: null,
      direction: "centre",
      keeperDive: onlinePenaltyDirection(goalkeeperTarget),
      goalkeeperTarget,
      conversionChance: shootoutConversionChance(team, opponent, state.settings.upset),
      outcomeRoll: random(),
      target: null,
      interactive: true,
      foot: preferredPenaltyFoot(team, event.player, random),
    };
  }
  const directions = ["left", "centre", "right"];
  if (event.authoritative) {
    const direction = directions[Math.floor(random() * directions.length)];
    const keeperDive = distinctKeeperDiveForGoal(
      direction,
      directions[Math.floor(random() * directions.length)],
      event.minute,
    );
    return {
      player: event.player,
      side: event.side,
      scored: true,
      direction,
      keeperDive,
      missType: null,
      foot: preferredPenaltyFoot(team, event.player, random),
    };
  }
  let direction = directions[Math.floor(random() * directions.length)];
  let keeperDive = directions[Math.floor(random() * directions.length)];
  const conversionChance = shootoutConversionChance(team, opponent, state.settings.upset);
  const scored = random() < (keeperDive === direction ? conversionChance * 0.5 : conversionChance);
  let missType = null;
  if (!scored) {
    ({ direction, keeperDive, missType } = missedPenaltyVisual(
      event.side,
      team,
      event.player,
      event.minute,
      direction,
      keeperDive,
    ));
  }
  return {
    player: event.player,
    side: event.side,
    scored,
    direction,
    keeperDive,
    missType,
    foot: preferredPenaltyFoot(team, event.player, random),
  };
}

function removeSavedPenaltyGoal(event) {
  const match = selectedMatch();
  if (!match?.result || !["home", "away"].includes(event.side)) return;
  const eventsKey = event.side === "home" ? "homeEvents" : "awayEvents";
  const goalsKey = event.side === "home" ? "homeGoals" : "awayGoals";
  const regulationKey = event.side === "home" ? "regulationHome" : "regulationAway";
  const storedEvents = match.result[eventsKey] || [];
  const storedIndex = storedEvents.findIndex((stored) => (
    stored.minute === event.minute
    && stored.scorer === event.player
    && stored.goalType === "penalty"
  ));
  if (storedIndex < 0) return;
  storedEvents.splice(storedIndex, 1);
  match.result[goalsKey] = Math.max(0, match.result[goalsKey] - 1);
  if (event.minute <= 90) {
    match.result[regulationKey] = Math.max(0, match.result[regulationKey] - 1);
  }
}

function isControlledMatchPenalty(event) {
  return Boolean(state.spectateTeamId && event.teamId === state.spectateTeamId);
}

function finishMatchPenaltyAnimation(playback, event, attempt, startDelay = 0, onDismiss = null) {
  const motionScale = playback.reducedMotion ? 0.15 : 1;
  const delay = (duration) => Math.max(40, duration * motionScale);
  const flightAt = startDelay;
  const resultAt = flightAt + delay(570);

  playback.matchPenaltyTimers.push(setTimeout(() => {
    if (livePlayback !== playback) return;
    setPenaltySceneElement(els.matchPenaltyScene, attempt, "flight");
  }, flightAt));

  playback.matchPenaltyTimers.push(setTimeout(() => {
    if (livePlayback !== playback) return;
    setPenaltySceneElement(els.matchPenaltyScene, attempt, "result");
    if (match2dState?.engine?.version === 1) {
      match2dState.engine.restart = null;
      if (attempt.scored) {
        match2dState.engine.score[event.side] += 1;
        recordPossessionGoal(event);
        resetPossessionKickoff(match2dState.engine, event.side === "home" ? "away" : "home");
      } else {
        const defending = possessionOpponent(match2dState.engine, event.side);
        const goalkeeper = defending.players.find((player) => player.position === "GK") || defending.players[0];
        switchPossession(match2dState.engine, goalkeeper, goalkeeper.x, goalkeeper.y, false);
      }
    }
    playback.eventIndex += 1;
  }, resultAt));

  playback.matchPenaltyTimers.push(setTimeout(() => {
    if (livePlayback !== playback) return;
    playback.matchPenaltyActive = false;
    playback.matchPenaltyTimers = [];
    playback.matchPenaltyContext = null;
    els.matchPenaltyOverlay.hidden = true;
    els.matchPenaltyOverlay.classList.remove("is-awaiting-choice");
    els.matchStage.classList.remove("has-match-penalty");
    if (typeof onDismiss === "function") onDismiss();
  }, resultAt + delay(630)));
}

function matchPenaltySceneTarget(attempt, interactive) {
  return interactive ? attempt?.target || "middle" : "";
}

function chooseMatchPenaltyTarget(target) {
  const context = livePlayback?.matchPenaltyContext;
  if (!context || !STANDARD_PENALTY_TARGETS.includes(target)) return;
  const { playback, event, attempt, action } = context;
  if (livePlayback !== playback || !attempt.interactive || attempt.target) return;
  resolveManualPenaltyAttempt(attempt, target);
  let publishResult;
  if (attempt.scored) {
    publishResult = () => receivePresentationAction(action, true);
  } else {
    removeSavedPenaltyGoal(event);
    const score = { home: playback.homeScore, away: playback.awayScore };
    const missedEvent = MatchPresentation.createEvent({
      ...event,
      id: `${event.id}:miss`,
      type: "penalty-miss",
      importance: "major",
      scoreBefore: score,
      scoreAfter: score,
      metadata: { ...event.metadata, scorer: event.player, goalType: "penalty", scored: false },
    });
    publishResult = () => receivePresentationEvent(
      missedEvent,
      `${event.player} misses from the spot.`,
      true,
    );
  }
  els.matchPenaltyScene.dataset.target = target;
  els.matchPenaltyPlayer.textContent = `${event.player} shoots`;
  els.matchPenaltyOverlay.classList.remove("is-awaiting-choice");
  playback.matchPenaltyContext = null;
  saveState();
  finishMatchPenaltyAnimation(playback, event, attempt, 120, publishResult);
}

function startMatchPenaltyAnimation(event, action) {
  if (!livePlayback || livePlayback.matchPenaltyActive) return;
  const playback = livePlayback;
  const interactive = isControlledMatchPenalty(event);
  const attempt = matchPenaltyAttempt(event, interactive);
  const motionScale = playback.reducedMotion ? 0.15 : 1;
  const delay = (duration) => Math.max(40, duration * motionScale);
  const whistleLeadIn = 1050;
  const setupHold = 1650;
  playback.matchPenaltyActive = true;
  playback.matchPenaltyTimers = [];
  playback.matchPenaltyContext = interactive ? { playback, event, attempt, action } : null;
  els.matchPenaltyPlayer.textContent = interactive
    ? `${event.player}: choose your target`
    : `${event.player} steps up`;
  playWhistleSound();

  playback.matchPenaltyTimers.push(setTimeout(() => {
    if (livePlayback !== playback) return;
    els.matchPenaltyOverlay.hidden = false;
    els.matchPenaltyOverlay.classList.toggle("is-awaiting-choice", interactive);
    els.matchStage.classList.add("has-match-penalty");
    els.matchPenaltyScene.dataset.target = matchPenaltySceneTarget(attempt, interactive);
    setPenaltySceneElement(els.matchPenaltyScene, attempt, "setup");
  }, whistleLeadIn));

  if (!interactive) {
    finishMatchPenaltyAnimation(playback, event, attempt, whistleLeadIn + setupHold);
  }
}

function renderPenaltyStage() {
  if (!livePlayback?.shootout?.length) return;
  const match = state.rounds[livePlayback.roundIndex]?.[livePlayback.matchIndex];
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const attempt = livePlayback.shootout[livePlayback.shootoutIndex];
  const step = livePlayback.shootoutStep;
  const awaitingChoice = Boolean(attempt?.interactive && !attempt.target && step === "setup");
  const motionScale = livePlayback.reducedMotion ? 0.02 : 1 / livePlayback.speed;

  els.penaltyStage.classList.toggle("is-awaiting-choice", awaitingChoice);
  els.penaltyStage.querySelectorAll("[data-standard-penalty-target]").forEach((button) => {
    button.disabled = !awaitingChoice || livePlayback.paused;
  });

  els.penaltyStage.style.setProperty("--penalty-flight-duration", `${540 * motionScale}ms`);
  els.penaltyStage.style.setProperty("--penalty-dive-duration", `${520 * motionScale}ms`);
  els.penaltyStage.style.setProperty("--penalty-kicker-duration", `${300 * motionScale}ms`);
  els.penaltyStage.style.setProperty("--penalty-fade-duration", `${200 * motionScale}ms`);

  els.penaltyHomeScore.textContent = livePlayback.penaltyHomeScore;
  els.penaltyAwayScore.textContent = livePlayback.penaltyAwayScore;
  els.penaltyHomeName.textContent = home.name;
  els.penaltyAwayName.textContent = away.name;
  els.penaltyHomeMarks.innerHTML = penaltyMarksMarkup("home");
  els.penaltyAwayMarks.innerHTML = penaltyMarksMarkup("away");
  els.penaltyKickNumber.textContent = step === "complete"
    ? "SHOOTOUT COMPLETE"
    : `KICK ${livePlayback.shootoutIndex + 1}`;

  if (step === "complete") {
    const winner = teamById(match.result.winnerId);
    els.penaltyPlayer.textContent = winner.name;
    els.penaltyOutcome.textContent = "WIN THE SHOOTOUT";
    return;
  }

  els.penaltyPlayer.textContent = attempt.player;
  els.penaltyOutcome.textContent = awaitingChoice
    ? `${attempt.side === "home" ? home.name : away.name} · pick your spot`
    : step === "setup"
      ? `${attempt.side === "home" ? home.name : away.name} · steps up · ${attempt.foot || "right"}-footed`
    : step === "flight"
      ? `Shoots ${penaltyDirectionCopy(attempt.direction)}…`
      : step === "result" && livePlayback.shootoutCommentary
        ? livePlayback.shootoutCommentary
      : attempt.scored
        ? `GOAL · ${penaltyDirectionCopy(attempt.direction)}`
        : penaltyMissCopy(attempt);
  setPenaltyScene(attempt, step);
}

function schedulePenaltyStep(duration) {
  if (!livePlayback || livePlayback.paused || livePlayback.phase !== "shootout") return;
  clearTimeout(livePlayback.penaltyTimer);
  livePlayback.penaltyTimer = setTimeout(advancePenaltyShootout, penaltyStepDelay(duration));
}

function finishPenaltyShootout() {
  if (!livePlayback) return;
  livePlayback.shootoutStep = "complete";
  livePlayback.ending = true;
  playFullTimeWhistleOnce();
  renderPenaltyStage();
  livePlayback.finishTimer = setTimeout(finishLivePlayback, penaltyStepDelay(1250));
}

function advancePenaltyShootout() {
  if (!livePlayback || livePlayback.paused || livePlayback.phase !== "shootout") return;
  const attempt = livePlayback.shootout[livePlayback.shootoutIndex];

  if (livePlayback.shootoutStep === "setup") {
    if (attempt.interactive && !attempt.target) {
      renderPenaltyStage();
      return;
    }
    livePlayback.shootoutStep = "flight";
    renderPenaltyStage();
    schedulePenaltyStep(650);
    return;
  }

  if (livePlayback.shootoutStep === "flight") {
    livePlayback.shootoutStep = "result";
    const match = state.rounds[livePlayback.roundIndex]?.[livePlayback.matchIndex];
    const scoreBefore = {
      home: livePlayback.penaltyHomeScore,
      away: livePlayback.penaltyAwayScore,
    };
    if (attempt.scored) {
      livePlayback[`penalty${attempt.side === "home" ? "Home" : "Away"}Score`] += 1;
    }
    const scoreAfter = {
      home: livePlayback.penaltyHomeScore,
      away: livePlayback.penaltyAwayScore,
    };
    const teamId = attempt.side === "home" ? match.homeId : match.awayId;
    const teamName = teamById(teamId)?.name || "Team";
    const shootoutEvent = MatchPresentation.createEvent({
      id: `${livePlayback.matchId}:shootout:${livePlayback.shootoutIndex}`,
      sequence: 100000 + livePlayback.shootoutIndex,
      minute: livePlayback.maxMinute,
      addedTime: 0,
      type: "shootout-kick",
      importance: attempt.scored ? "goal" : "major",
      side: attempt.side,
      teamId,
      playerIds: [],
      scoreBefore,
      scoreAfter,
      phase: "shootout",
      metadata: {
        scorer: attempt.player,
        scored: attempt.scored,
        teamName,
        commentary: attempt.scored
          ? `${attempt.player.toUpperCase()} SCORES FOR ${teamName.toUpperCase()} IN THE SHOOTOUT!`
          : `${attempt.player.toUpperCase()} MISSES FOR ${teamName.toUpperCase()} IN THE SHOOTOUT!`,
      },
    });
    livePlayback.shootoutCommentary = null;
    receivePresentationEvent(shootoutEvent, shootoutEvent.metadata.commentary, true);
    renderPenaltyStage();
    const score = attempt.side === "home" ? els.penaltyHomeScore : els.penaltyAwayScore;
    score.classList.add("score-pop");
    setTimeout(() => score.classList.remove("score-pop"), penaltyStepDelay(230));
    schedulePenaltyStep(900);
    return;
  }

  if (livePlayback.interactiveShootout) {
    const shootoutState = completedInteractiveShootoutState(livePlayback);
    const winnerSide = standardShootoutWinner(shootoutState);
    if (winnerSide) {
      finalizeInteractiveShootout(winnerSide);
      finishPenaltyShootout();
      return;
    }
  }

  if (livePlayback.shootoutIndex >= livePlayback.shootout.length - 1) {
    if (livePlayback.interactiveShootout) {
      const match = state.rounds[livePlayback.roundIndex]?.[livePlayback.matchIndex];
      livePlayback.shootout.push(...createInteractiveShootoutSequence(
        match,
        livePlayback.controlledShootoutSide,
        attempt.round + 1,
        20,
      ));
    } else {
      finishPenaltyShootout();
      return;
    }
  }

  livePlayback.shootoutIndex += 1;
  livePlayback.shootoutStep = "setup";
  renderPenaltyStage();
  schedulePenaltyStep(650);
}

function startPenaltyShootout() {
  if (!livePlayback) return;
  const match = state.rounds[livePlayback.roundIndex]?.[livePlayback.matchIndex];
  ensureShootoutSequence(match);
  const controlledSide = controlledStandardShootoutSide(match);
  if (controlledSide) {
    match.result.shootout = createInteractiveShootoutSequence(match, controlledSide);
  }
  livePlayback.phase = "shootout";
  livePlayback.speed = 1;
  livePlayback.shootout = match.result.shootout;
  livePlayback.interactiveShootout = Boolean(controlledSide);
  livePlayback.controlledShootoutSide = controlledSide;
  livePlayback.shootoutIndex = 0;
  livePlayback.shootoutStep = "setup";
  livePlayback.penaltyHomeScore = 0;
  livePlayback.penaltyAwayScore = 0;
  livePlayback.shootoutCommentary = null;
  livePlayback.lastTimestamp = 0;
  livePlayback.frame = null;
  render();
  schedulePenaltyStep(800);
}

function finishLivePlayback() {
  if (!livePlayback) return;
  playFullTimeWhistleOnce();
  const completed = livePlayback;
  const match = state.rounds[completed.roundIndex]?.[completed.matchIndex];
  if (!match?.result) {
    livePlayback = null;
    return;
  }

  clearMatchPenaltyAnimation();
  completed.presentationScheduler?.clear("match-finished");
  cancelAnimationFrame(completed.frame);
  clearTimeout(completed.finishTimer);
  clearTimeout(completed.penaltyTimer);
  if (match2dState?.eventTimer) clearTimeout(match2dState.eventTimer);
  match2dState = null;
  match.result.revealed = true;
  livePlayback = null;
  buildNextRound(completed.roundIndex);
  saveState();
  render();

  const winner = teamById(match.result.winnerId);
  const loser = winner.id === match.homeId ? teamById(match.awayId) : teamById(match.homeId);
  const isShock = loser.strength - winner.strength > 12;
  showToast(isShock ? `Giant-killing! ${winner.name} send ${loser.name} home.` : `${winner.name} advance.`);
}

function syncPossessionResultStats(result) {
  if (!match2dState?.presentation) return;
  result.matchStats = match2dState.presentation.stats;
  window.__lastMatchHighlightStats = result.matchStats;
}

function resolveInteractiveRegulation(match, playback) {
  const result = match.result;
  syncPossessionResultStats(result);
  result.regulationHome = (result.homeEvents || []).filter((event) => event.minute <= 90).length;
  result.regulationAway = (result.awayEvents || []).filter((event) => event.minute <= 90).length;
  playback.maxMinute = result.extraTime ? 120 : 90;
}

function resolveInteractiveExtraTime(match, playback) {
  const result = match.result;
  syncPossessionResultStats(result);
  result.homeGoals = (result.homeEvents || []).length;
  result.awayGoals = (result.awayEvents || []).length;
  result.regulationHome = (result.homeEvents || []).filter((event) => event.minute <= 90).length;
  result.regulationAway = (result.awayEvents || []).filter((event) => event.minute <= 90).length;
  if (result.regulationHome !== result.regulationAway) {
    result.homeEvents = (result.homeEvents || []).filter((event) => event.minute <= 90);
    result.awayEvents = (result.awayEvents || []).filter((event) => event.minute <= 90);
    result.homeGoals = result.regulationHome;
    result.awayGoals = result.regulationAway;
    result.extraTime = false;
    result.penalties = null;
    result.shootout = null;
    result.winnerId = result.homeGoals > result.awayGoals ? match.homeId : match.awayId;
    return;
  }
  result.extraTime = true;
  if (result.homeGoals !== result.awayGoals) {
    result.penalties = null;
    result.shootout = null;
    result.winnerId = result.homeGoals > result.awayGoals ? match.homeId : match.awayId;
    return;
  }
  if (result.penalties && result.shootout?.length) return;
  const random = mulberry32(state.drawSeed + stableHash(`${match.id}-interactive-shootout-result`));
  const penaltyResult = simulatePenaltyShootout(
    teamById(match.homeId),
    teamById(match.awayId),
    random,
    result.redCards || [],
    result.suspendedPlayers || { home: [], away: [] },
    state.settings.upset,
  );
  result.penalties = penaltyResult.penalties;
  result.shootout = penaltyResult.sequence;
  result.winnerId = result.penalties.home > result.penalties.away ? match.homeId : match.awayId;
}

function finalizeHighlightResult(match, playback) {
  resolveInteractiveRegulation(match, playback);
  resolveInteractiveExtraTime(match, playback);
  playback.homeScore = match.result.homeGoals;
  playback.awayScore = match.result.awayGoals;
  playback.visibleStats = match.result.matchStats;
  els.homeScore.textContent = playback.homeScore;
  els.awayScore.textContent = playback.awayScore;
  renderMatchAnalysis(match, true);
}

function stepLivePlayback(timestamp) {
  try {
    if (!window.__playbackDebug) window.__playbackDebug = {};
    window.__playbackDebug.frameCount = (window.__playbackDebug.frameCount || 0) + 1;
    window.__playbackDebug.lastFrameTimestamp = timestamp;
    window.__playbackDebug.minute = livePlayback?.minute;
    window.__playbackDebug.paused = livePlayback?.paused;
    window.__playbackDebug.ending = livePlayback?.ending;
    window.__playbackDebug.match2dComplete = match2dState?.complete;
    window.__playbackDebug.currentHighlightIndex = match2dState?.cursor;
    window.__playbackDebug.currentActionIndex = match2dState?.actionIndex;
    window.__playbackDebug.activeHighlight = !!match2dState?.activeHighlight;

    if (!livePlayback) { window.__playbackDebug.lastEarlyReturn = "no livePlayback"; return; }
    if (livePlayback.ending) { window.__playbackDebug.lastEarlyReturn = "ending"; return; }
    if (livePlayback.paused) { window.__playbackDebug.lastEarlyReturn = "paused"; return; }
    if (!livePlayback.lastTimestamp) {
      livePlayback.lastTimestamp = timestamp;
      livePlayback.frame = requestAnimationFrame(stepLivePlayback);
      window.__playbackDebug.lastEarlyReturn = "first tick";
      return;
    }

    stepMatch2dViewer(timestamp);
    livePlayback.lastTimestamp = timestamp;
    livePlayback.presentationScheduler.tick({
      now: timestamp,
      speed: livePlayback.speed,
      reducedMotion: livePlayback.reducedMotion,
    });
    const displayedMinute = livePlayback.presentationClock.read(timestamp);
    els.liveClock.textContent = clockText(displayedMinute);
    if (match2dState?.complete) {
      const match = selectedMatch();
      finalizeHighlightResult(match, livePlayback);
      saveState();
      livePlayback.minute = livePlayback.maxMinute;
      els.liveClock.textContent = clockText(livePlayback.presentationClock.finish(timestamp));
      if (match.result.penalties) {
        els.livePhase.textContent = "PENALTY SHOOTOUT";
        startPenaltyShootout();
        window.__playbackDebug.lastEarlyReturn = "shootout started";
        return;
      }
      livePlayback.ending = true;
      els.livePhase.textContent = "FULL TIME";
      playFullTimeWhistleOnce();
      livePlayback.finishTimer = setTimeout(finishLivePlayback, 900);
      window.__playbackDebug.lastEarlyReturn = "full time";
      return;
    }

    livePlayback.frame = requestAnimationFrame(stepLivePlayback);
    window.__playbackDebug.lastEarlyReturn = "frame scheduled";
  } catch (error) {
    window.__playbackDebug.lastError = { message: error.message, stack: error.stack };
    console.error("[PLAYBACK FATAL]", error);
  }
}

function startLivePlayback(match) {
  try {
  window.__playbackDebug = {
    startCalled: true,
    rafRequested: false,
    frameCount: 0,
    lastFrameTimestamp: 0,
    paused: false,
    ending: false,
    complete: false,
    match2dComplete: false,
    currentHighlightIndex: -1,
    currentActionIndex: 0,
    minute: 0,
    lastEarlyReturn: null,
    lastError: null,
  };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!match.result || match.result.engineVersion !== 2 || match.result.revealed) {
    match.result = createLiveMatchResult(match, state.activeRound);
    saveState();
  }
  livePlayback = {
    matchId: match.id,
    roundIndex: state.activeRound,
    matchIndex: state.selectedMatch,
    minute: 0,
    maxMinute: match.result.extraTime ? 120 : 90,
    regulationResolved: false,
    homeScore: 0,
    awayScore: 0,
    homeReds: [],
    awayReds: [],
    eventIndex: 0,
    events: [],
    feed: [{ type: "kickoff", minute: 0 }],
    phase: "match",
    shootout: [],
    shootoutIndex: 0,
    shootoutStep: "setup",
    penaltyHomeScore: 0,
    penaltyAwayScore: 0,
    speed: preferredMatchSpeed ?? (reducedMotion ? 1.5 : 1),
    reducedMotion,
    paused: false,
    highlightMode: preferredHighlightMode,
    commentaryFeed: [],
    _goalFlashTimer: null,
    visibleStats: null,
    lastTimestamp: 0,
    ending: false,
    fullTimeWhistlePlayed: false,
    frame: null,
    finishTimer: null,
    penaltyTimer: null,
    matchPenaltyActive: false,
    matchPenaltyTimers: [],
    matchPenaltyContext: null,
    pendingTacticChange: false,
    presentationClock: null,
    presentationScheduler: null,
    _presentationSequence: 0,
  };
  livePlayback.presentationClock = MatchPresentation.createClock({
    initialMinute: 0,
    maxMinute: livePlayback.maxMinute,
    speed: livePlayback.speed,
    now: performance.now(),
  });
  livePlayback.presentationScheduler = createLivePresentationScheduler();
  window.__playbackDebug._step = "livePlayback created";
  render();
  window.__playbackDebug._step = "render done";
  match2dState = createMatch2dState(match);
  window.__playbackDebug._step = "createMatch2dState done";
  window.__playbackDebug._hasMatch2d = !!match2dState;
  window.__playbackDebug._hasPresentation = !!match2dState?.presentation;
  window.__playbackDebug._highlightCount = match2dState?.presentation?.highlights?.length ?? 0;
  window.__playbackDebug._hasElsPlayers = !!els?.match2dPlayers;
  window.__playbackDebug._hasElsBall = !!els?.match2dBall;
  if (!match2dState || !match2dState.presentation?.highlights?.length) {
    window.__playbackDebug._earlyReturn = "no highlights";
    livePlayback = null;
    showToast("Could not generate match highlights.");
    return;
  }
  window.__playbackDebug._step = "passed highlight check";
  renderMatchAnalysis(match, true);
  window.__playbackDebug._step = "renderMatchAnalysis done";
  saveState();
  window.__playbackDebug._step = "saveState done";
  livePlayback.frame = requestAnimationFrame(stepLivePlayback);
  window.__playbackDebug._step = "raf scheduled";
  window.__playbackDebug.rafRequested = true;
  console.table({
    playing: true,
    paused: livePlayback.paused,
    complete: match2dState?.complete || false,
    match2dComplete: match2dState?.complete || false,
    highlightCount: match2dState?.presentation?.highlights?.length || 0,
    cursor: match2dState?.cursor ?? -1,
    minute: livePlayback.minute,
    speed: livePlayback.speed,
    highlightMode: livePlayback.highlightMode,
  });
  } catch (error) {
    window.__playbackDebug._earlyReturn = "exception";
    window.__playbackDebug._exception = { message: error.message, stack: error.stack };
    console.error("[START PLAYBACK FATAL]", error);
  }
}

function fastForwardPossessionEngine(targetMinute) {
  if (!livePlayback) return;
  livePlayback.minute = targetMinute;
}

function skipLivePlayback() {
  if (!livePlayback) return;

  if (livePlayback.matchPenaltyActive) {
    showToast("Let the penalty play out first.");
    return;
  }

  // A shootout is the suspenseful part: never skip its kick-by-kick playback.
  if (livePlayback.phase === "shootout") {
    showToast("The shootout must play out kick by kick.");
    return;
  }

  cancelAnimationFrame(livePlayback.frame);
  clearTimeout(livePlayback.finishTimer);
  clearTimeout(livePlayback.penaltyTimer);
  livePlayback.presentationScheduler?.clear("skip-to-full-time");
  presentationDebug("[QUEUE_CLEAR]", null, "skip-to-full-time");
  livePlayback.commentaryFeed = [];
  renderCommentaryFeed();
  const match = selectedMatch();
  const events = [
    ...(match.result.homeEvents || []).map((event) => ({ ...event, type: "goal", side: "home", player: event.scorer, teamId: match.homeId })),
    ...(match.result.awayEvents || []).map((event) => ({ ...event, type: "goal", side: "away", player: event.scorer, teamId: match.awayId })),
    ...(match.result.redCards || []),
  ].sort((left, right) => left.minute - right.minute);
  livePlayback.homeScore = 0;
  livePlayback.awayScore = 0;
  livePlayback.homeReds = [];
  livePlayback.awayReds = [];
  livePlayback.feed = [{ type: "kickoff", minute: 0 }];
  events.forEach((event) => applyLiveEvent(event, false));
  finalizeHighlightResult(match, livePlayback);
  fastForwardPossessionEngine(livePlayback.maxMinute);
  if (match2dState) match2dState.complete = true;
  livePlayback.lastTimestamp = 0;
  livePlayback.frame = null;
  els.liveClock.textContent = clockText(livePlayback.presentationClock.finish(performance.now()));
  saveState();

  if (match.result.penalties) {
    livePlayback.paused = false;
    els.livePhase.textContent = "PENALTY SHOOTOUT";
    startPenaltyShootout();
    return;
  }

  finishLivePlayback();
}

function cycleLiveSpeed() {
  if (!livePlayback) return;
  if (livePlayback.matchPenaltyActive) {
    showToast("Speed controls return after the penalty.");
    return;
  }
  if (livePlayback.phase === "shootout") {
    livePlayback.speed = livePlayback.speed === 1 ? 2 : livePlayback.speed === 2 ? 4 : 1;
    els.speedButton.textContent = `${livePlayback.speed}×`;
    renderPenaltyStage();
    showToast(`Shootout playback set to ${livePlayback.speed}× speed.`);
    return;
  }
  livePlayback.speed = livePlayback.speed === 1 ? 1.5 : livePlayback.speed === 1.5 ? 2 : livePlayback.speed === 2 ? 3 : livePlayback.speed === 3 ? 5 : 1;
  livePlayback.presentationClock?.setSpeed(livePlayback.speed, performance.now());
  preferredMatchSpeed = livePlayback.speed;
  localStorage.setItem(MATCH_SPEED_STORAGE_KEY, String(preferredMatchSpeed));
  els.speedButton.textContent = `${livePlayback.speed}×`;
  if (livePlayback.phase === "shootout") renderPenaltyStage();
  showToast(`Live simulation set to ${livePlayback.speed}× speed.`);
}

function toggleLivePause() {
  if (!livePlayback || livePlayback.ending) return;
  if (livePlayback.matchPenaltyActive) {
    showToast("Pause controls return after the penalty.");
    return;
  }
  livePlayback.paused = !livePlayback.paused;
  els.pauseLiveButton.setAttribute("aria-pressed", String(livePlayback.paused));

  if (livePlayback.phase === "shootout") {
    els.pauseLiveButton.textContent = livePlayback.paused ? "Resume" : "Pause";
    els.penaltyStage.classList.toggle("is-paused", livePlayback.paused);
    els.penaltyStage.getAnimations().forEach((animation) => {
      if (livePlayback.paused) animation.pause();
      else animation.play();
    });
    if (livePlayback.paused) {
      clearTimeout(livePlayback.penaltyTimer);
    } else {
      schedulePenaltyStep(300);
    }
    return;
  }

  if (livePlayback.paused) {
    livePlayback.presentationClock?.pause(performance.now());
    cancelAnimationFrame(livePlayback.frame);
    livePlayback.frame = null;
    els.pauseLiveButton.textContent = "Resume";
    return;
  }

  livePlayback.lastTimestamp = 0;
  livePlayback.presentationClock?.resume(performance.now());
  els.pauseLiveButton.textContent = "Pause";
  livePlayback.frame = requestAnimationFrame(stepLivePlayback);
}

function playSelected() {
  const match = selectedMatch();
  if (!match) return;
  if (livePlayback) return;
  if (match.result?.revealed) {
    goToNextTie();
    return;
  }
  if (match.result && !match.result.revealed) return;

  primeMatchSounds();
  match.result = createLiveMatchResult(match, state.activeRound);
  saveState();
  startLivePlayback(match);
}

function revealSelected() {
  if (livePlayback) return;
  const match = selectedMatch();
  if (!match?.result) return;
  match.result.revealed = true;
  buildNextRound(state.activeRound);
  saveState();
  render();

  const winner = teamById(match.result.winnerId);
  const loser = winner.id === match.homeId ? teamById(match.awayId) : teamById(match.homeId);
  const gap = loser.strength - winner.strength;
  showToast(gap > 12 ? `Huge upset — ${winner.name} knock out ${loser.name}!` : `${winner.name} advance.`);
}

function simulateCurrentRound() {
  if (livePlayback) {
    showToast("Finish or skip the live tie before simulating the round.");
    return;
  }
  const round = selectedRound();
  const watchedMatchIndex = teamMatchIndex(state.activeRound);
  if (watchedMatchIndex >= 0 && !round[watchedMatchIndex].result?.revealed) {
    round.forEach((match, index) => {
      if (index === watchedMatchIndex) return;
      if (!match.result) match.result = simulateMatch(match, state.activeRound);
      match.result.revealed = true;
    });
    state.selectedMatch = watchedMatchIndex;
    state.championView = false;
    saveState();
    render();
    showToast(`Other ${ROUND_NAMES[state.activeRound]} ties simulated. Your team's match is ready.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (state.spectateTeamId && watchedMatchIndex >= 0 && advanceSpectatedRun()) return;
  round.forEach((match) => {
    if (!match.result) match.result = simulateMatch(match, state.activeRound);
    match.result.revealed = true;
  });
  buildNextRound(state.activeRound);

  if (state.activeRound < 7) {
    state.activeRound += 1;
    state.selectedMatch = 0;
    state.championView = false;
    fixtureLimit = DEFAULT_FIXTURE_LIMIT;
    filterUnresolved = false;
    showToast(`${ROUND_NAMES[state.activeRound - 1]} complete. The next draw is ready.`);
  } else {
    state.championView = true;
  }

  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function requestRoundSimulation() {
  if (livePlayback) {
    showToast("Finish or skip the live tie before simulating the round.");
    return;
  }
  const watchedMatchIndex = teamMatchIndex(state.activeRound);
  const watchingActiveTeam = watchedMatchIndex >= 0 && !selectedRound()[watchedMatchIndex]?.result?.revealed;
  const matchLabel = state.activeRound === 7 ? "match" : "matches";
  els.simulateRoundConfirmCopy.textContent = watchingActiveTeam
    ? `Simulate every ${ROUND_NAMES[state.activeRound]} tie except your team's match?`
    : `Simulate the ${ROUND_NAMES[state.activeRound]} ${matchLabel}?`;
  els.simulateRoundModal.showModal();
}

function resultSuffix(result) {
  if (result.penalties) return `PENS ${result.penalties.home}-${result.penalties.away}`;
  if (result.extraTime) return "AFTER EXTRA TIME";
  return "FULL TIME";
}

function shootoutSummaryMarkup(result, side) {
  const attempts = (result.shootout || []).filter((attempt) => attempt.side === side);
  if (!attempts.length) return "";
  return `
    <div class="shootout-summary" aria-label="Penalty shootout takers">
      ${attempts.map((attempt) => `
        <div class="shootout-summary-row ${attempt.scored ? "scored" : "missed"}">
          <i role="img" aria-label="${attempt.scored ? "Scored" : "Missed"}"></i>
          <span>${attempt.player}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function analysisPresentationForMatch(match) {
  if (match2dState?.matchId === match.id) return match2dState.presentation;
  const result = match.result;
  if (!result) return null;
  const signature = [
    match.id,
    result.homeGoals,
    result.awayGoals,
    (result.homeEvents || []).map((event) => `${event.minute}:${event.scorer}`).join(","),
    (result.awayEvents || []).map((event) => `${event.minute}:${event.scorer}`).join(","),
    (result.redCards || []).map((event) => `${event.minute}:${event.player}`).join(","),
  ].join("|");
  if (matchPresentationCache.has(signature)) return matchPresentationCache.get(signature);
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const controlledSide = state.spectateTeamId === match.homeId
    ? "home"
    : state.spectateTeamId === match.awayId ? "away" : null;
  const opponentKey = controlledSide ? opponentStandardTactic(match, controlledSide) : "balanced";
  const presentation = createMatchHighlightPresentation({
    seed: result.engineSeed || state.drawSeed + stableHash(`${match.id}-highlight-engine`),
    home,
    away,
    homeProfiles: playerProfilesForTeam(home),
    awayProfiles: playerProfilesForTeam(away),
    homeTactic: controlledSide === "home" ? state.standardTactic : controlledSide === "away" ? opponentKey : "balanced",
    awayTactic: controlledSide === "away" ? state.standardTactic : controlledSide === "home" ? opponentKey : "balanced",
    result,
  });
  matchPresentationCache.clear();
  matchPresentationCache.set(signature, presentation);
  result.matchStats ||= presentation.stats;
  return presentation;
}

function matchStatValue(value, suffix = "") {
  return `${value}${suffix}`;
}

function renderMatchAnalysis(match, isLive = false) {
  if (!els.matchStatsGrid) return;
  if (!match?.result) { els.matchStatsGrid.innerHTML = '<div class="match-stat-row"><span style="grid-column:1/-1;color:#4a6080">No match selected</span></div>'; return; }
  const visible = isLive || match.result.revealed;
  if (!visible) { els.matchStatsGrid.innerHTML = ""; return; }
  const presentation = analysisPresentationForMatch(match);
  if (!presentation) return;
  const stats = isLive && livePlayback?.visibleStats
    ? livePlayback.visibleStats
    : match.result.matchStats || presentation.stats;
  const rows = [
    ["Possession", matchStatValue(stats.possession.home, "%"), matchStatValue(stats.possession.away, "%")],
    ["xG", Number(stats.xg.home).toFixed(2), Number(stats.xg.away).toFixed(2)],
    ["Shots", stats.shots.home, stats.shots.away],
    ["On target", stats.shotsOnTarget.home, stats.shotsOnTarget.away],
    ["Yellow cards", stats.yellowCards.home, stats.yellowCards.away],
    ["Red cards", stats.redCards.home, stats.redCards.away],
  ];
  els.matchStatsGrid.innerHTML = rows.map(([label, homeValue, awayValue]) => `
    <div class="match-stat-row">
      <b>${homeValue}</b>
      <span>${label}</span>
      <b>${awayValue}</b>
    </div>
  `).join("");
}

function renderHighlightModeControls() {
  if (!els.matchHighlightMode) return;
  els.matchHighlightMode.querySelectorAll("[data-highlight-mode]").forEach((button) => {
    const active = button.dataset.highlightMode === preferredHighlightMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function setMatchHighlightMode(mode) {
  if (!MATCH_HIGHLIGHT_MODES.includes(mode)) return;
  preferredHighlightMode = mode;
  localStorage.setItem(MATCH_HIGHLIGHT_MODE_STORAGE_KEY, mode);
  if (livePlayback) livePlayback.highlightMode = mode;
  renderHighlightModeControls();
  const labels = { commentary: "Commentary only.", key: "Showing key highlights.", extended: "Showing extended highlights." };
  showToast(labels[mode] || labels.key);
}

function renderEvents(match) {
  const result = match.result;
  els.eventControls.hidden = true;
  els.skipControl.hidden = true;
  if (!result?.revealed) {
    els.homeEventSide.innerHTML = "";
    els.awayEventSide.innerHTML = "";
    els.homeEventSide.hidden = true;
    els.awayEventSide.hidden = true;
    return;
  }
  const sideEvents = (side, goals) => [
    ...(goals || []).map((event) => ({ ...event, type: "goal", player: event.scorer })),
    ...(result.redCards || []).filter((event) => event.side === side),
  ].sort((a, b) => a.minute - b.minute);

  const homeList = sideEvents("home", result.homeEvents);
  const awayList = sideEvents("away", result.awayEvents);
  const homeEvents = (homeList.length
    ? homeList.map((event) => timelineEventMarkup(event)).join("")
    : `<div class="event">No major events</div>`) + shootoutSummaryMarkup(result, "home");
  const awayEvents = (awayList.length
    ? awayList.map((event) => timelineEventMarkup(event, true)).join("")
    : `<div class="event">No major events</div>`) + shootoutSummaryMarkup(result, "away");
  els.homeEventSide.innerHTML = homeEvents;
  els.awayEventSide.innerHTML = awayEvents;
  els.homeEventSide.hidden = false;
  els.awayEventSide.hidden = false;
  els.eventLiveClock.hidden = true;
}

let confettiChampionId = null;

function renderChampionConfetti(championId) {
  if (confettiChampionId === championId || !els.championConfetti) return;
  confettiChampionId = championId;
  const colours = ["#f2c45f", "#5f8cff", "#f4f7fb", "#34c77b", "#ef5b5b"];
  els.championConfetti.innerHTML = Array.from({ length: 120 }, (_, index) => {
    const random = mulberry32(stableHash(`${championId}-confetti-${index}`));
    const x = Math.round(random() * 100);
    const drift = Math.round((random() - 0.5) * 170);
    const delay = Math.floor(index / 12) * 1000 + Math.round(random() * 900);
    const duration = 1900 + Math.round(random() * 800);
    const spin = 320 + Math.round(random() * 760);
    const colour = colours[Math.floor(random() * colours.length)];
    const width = 5 + Math.round(random() * 4);
    const height = 9 + Math.round(random() * 7);
    return `<i style="--confetti-x:${x}%;--confetti-drift:${drift}px;--confetti-delay:${delay}ms;--confetti-duration:${duration}ms;--confetti-spin:${spin}deg;--confetti-colour:${colour};--confetti-width:${width}px;--confetti-height:${height}px"></i>`;
  }).join("");
}

function clearChampionConfetti() {
  if (!confettiChampionId || !els.championConfetti) return;
  confettiChampionId = null;
  els.championConfetti.replaceChildren();
}

function renderStage() {
  els.penaltyStage.hidden = true;
  els.standardMatchTactics.hidden = true;
  els.standardMatchTactics.closest(".insight-right")?.classList.add("tactics-hidden");
  els.match2dViewer.hidden = true;
  els.matchCommentaryView.hidden = true;
  els.matchPenaltyOverlay.hidden = !livePlayback?.matchPenaltyActive;
  els.matchStage.classList.remove("is-shootout");
  els.snapshotButton.hidden = true;
  els.spectateEliminationActions.hidden = true;
  els.stageAction.classList.remove("has-elimination-actions");
  els.playButton.hidden = false;
  if (state.championView) {
    const final = state.rounds[7]?.[0];
    const champion = final?.result ? teamById(final.result.winnerId) : null;
    if (champion) {
      const topScorer = calculateTopGoalscorer();
      els.matchContent.hidden = true;
      els.championStage.hidden = false;
      els.championFlag.innerHTML = flagMarkup(champion, "hero-flag");
      els.championName.textContent = champion.name;
      renderChampionConfetti(champion.id);
      els.snapshotButton.hidden = !final.result.revealed;
      els.championTopScorerAward.hidden = !topScorer;
      els.championTopScorerAward.style.display = topScorer ? "" : "none";
      if (topScorer) {
        const scorerTeam = teamById(topScorer.teamId);
        els.championTopScorerName.textContent = topScorer.player;
        els.championTopScorerFlag.innerHTML = flagMarkup(scorerTeam, "award-flag");
        els.championTopScorerTeam.textContent = scorerTeam.name;
        els.championTopScorerGoals.textContent = `${topScorer.goals} ${topScorer.goals === 1 ? "goal" : "goals"}`;
      }
      renderChampionPrediction(champion);
      return;
    }
  }

  els.matchContent.hidden = false;
  els.championStage.hidden = true;
  clearChampionConfetti();
  const match = selectedMatch();
  if (!match) return;
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const result = match.result;
  const revealed = result?.revealed;
  const isLive = livePlayback?.matchId === match.id;
  const isShootout = isLive && livePlayback.phase === "shootout";
  const pendingReveal = result && !revealed && !isLive;
  const isControlledMatch = Boolean(state.spectateTeamId)
    && (match.homeId === state.spectateTeamId || match.awayId === state.spectateTeamId);
  const controlledSide = state.spectateTeamId === match.homeId ? "home" : "away";
  const opponentTacticKey = result?.tacticalMatchup?.opponent
    || (isControlledMatch ? opponentStandardTactic(match, controlledSide) : null);
  const opponentTacticName = STANDARD_TACTICS[opponentTacticKey]?.name;
  const showStandardTactics = isControlledMatch && !revealed;
  els.standardMatchTactics.hidden = !showStandardTactics;
  els.standardMatchTactics.closest(".insight-right")?.classList.toggle("tactics-hidden", !showStandardTactics);
  els.standardMatchTactics.querySelector("span").textContent = opponentTacticName
    ? `Opponent: ${opponentTacticName}`
    : "";
  els.match2dViewer.hidden = true;
  els.matchCommentaryView.hidden = !isLive || isShootout;
  renderHighlightModeControls();
  els.standardTacticButtons.querySelectorAll("button").forEach((button) => {
    const active = button.dataset.standardTactic === state.standardTactic;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.disabled = Boolean(result && !isLive);
  });
  els.match2dTacticLabel.textContent = match2dTacticSummary(match);
  els.snapshotButton.hidden = !revealed || Boolean(isLive);
  renderMatchAnalysis(match, Boolean(isLive));

  els.matchNumber.textContent = `${state.selectedMatch + 1}/${selectedRound().length}`;
  els.stageRoundLabel.textContent = ROUND_NAMES[state.activeRound].toUpperCase();
  els.homeSeed.textContent = "";
  els.awaySeed.textContent = "";
  els.homeFlag.innerHTML = flagMarkup(home, "hero-flag");
  els.awayFlag.innerHTML = flagMarkup(away, "hero-flag");
  setTeamName(els.homeName, home.name);
  setTeamName(els.awayName, away.name);
  els.homeScore.textContent = isLive ? livePlayback.homeScore : revealed ? result.homeGoals : result ? "–" : "0";
  els.awayScore.textContent = isLive ? livePlayback.awayScore : revealed ? result.awayGoals : result ? "–" : "0";
  els.resultNote.hidden = isLive || !revealed;
  els.resultNote.textContent = revealed ? resultSuffix(result) : "";
  els.spoilerPanel.hidden = !pendingReveal;
  if (pendingReveal) {
    els.spoilerTitle.textContent = "Match interrupted";
    els.spoilerCopy.textContent = "Resume from kick-off without revealing the result.";
    els.revealButton.innerHTML = "Resume match <span>&rarr;</span>";
  }
  els.stageAction.hidden = pendingReveal || isLive;
  els.matchStage.classList.toggle("is-live", Boolean(isLive));
  els.matchStage.classList.toggle("is-shootout", Boolean(isShootout));
  els.penaltyStage.hidden = !isShootout;
  els.homeDiscipline.innerHTML = disciplineMarkup(
    isLive ? livePlayback.homeReds : revealed ? (result.redCards || []).filter((card) => card.side === "home") : [],
  );
  els.awayDiscipline.innerHTML = disciplineMarkup(
    isLive ? livePlayback.awayReds : revealed ? (result.redCards || []).filter((card) => card.side === "away") : [],
  );
  if (isLive) {
    els.homeEventSide.hidden = false;
    els.awayEventSide.hidden = false;
    els.eventLiveClock.hidden = isShootout;
    els.eventControls.hidden = false;
    els.skipControl.hidden = isShootout;
    els.liveClock.textContent = clockText(livePlayback.minute);
    els.livePhase.textContent = phaseForMinute(livePlayback.minute, result);
    els.pauseLiveButton.setAttribute("aria-pressed", String(livePlayback.paused));
    els.pauseLiveButton.textContent = livePlayback.paused ? "Resume" : "Pause";
    els.speedButton.disabled = false;
    els.speedButton.textContent = `${livePlayback.speed}×`;
    renderLiveTimeline();
    if (isShootout) renderPenaltyStage();
  }
  const isSpectatedMatch = state.spectateTeamId && !state.neutralView
    && (match.homeId === state.spectateTeamId || match.awayId === state.spectateTeamId);
  const spectatedWon = isSpectatedMatch && revealed && result.winnerId === state.spectateTeamId;
  const spectatedLost = isSpectatedMatch && revealed && result.winnerId !== state.spectateTeamId;
  const revealedAction = spectatedWon
    ? state.activeRound === 7 ? "Crown champion" : `Next ${spectatedTeam().name} match`
    : state.activeRound === 7 ? "Crown champion" : "Next game";
  els.playButton.innerHTML = revealed
    ? `${revealedAction} <span>→</span>`
    : `<span class="play-icon">▶</span> Play this tie`;
  if (spectatedLost) {
    const team = spectatedTeam();
    els.eliminationTitle.textContent = "ELIMINATED";
    els.eliminationCopy.textContent = "What next?";
    els.replaySpectatedButton.textContent = `Replay as ${team.name}`;
    els.playButton.hidden = true;
    els.spectateEliminationActions.hidden = false;
    els.stageAction.classList.add("has-elimination-actions");
  }
  if (!isLive) renderEvents(match);
}

function renderRoundNav() {
  els.roundNav.innerHTML = ROUND_NAMES.map((name, index) => {
    const round = state.rounds[index];
    const available = Boolean(round);
    const complete = available && round.every((match) => match.result?.revealed);
    return `
      <button
        class="round-link ${index === state.activeRound ? "active" : ""} ${complete ? "complete" : ""} ${available ? "available" : ""}"
        data-round="${index}"
        title="${complete ? `View all ${name} results` : name}"
        ${available ? "" : "disabled"}
      >
        <span class="round-index">${complete ? "✓" : String(index + 1).padStart(2, "0")}</span>
        <strong>${name}</strong>
        <small>${complete ? "Results" : (round ? round.length : 2 ** (7 - index))}</small>
      </button>
    `;
  }).join("");

}

function roundHistoryTargets() {
  const currentRound = currentTournamentRoundIndex();
  const historyMode = viewingRoundHistory();
  const olderStart = historyMode
    ? state.activeRound - 1
    : state.activeRound >= 4 ? 3 : state.activeRound - 1;
  let older = null;
  for (let index = olderStart; index >= 0; index -= 1) {
    if (roundIsComplete(index)) {
      older = index;
      break;
    }
  }

  const newer = historyMode
    ? state.activeRound === 3 && currentRound >= 4
      ? currentRound
      : state.activeRound + 1
    : null;
  return { older, newer };
}

function roundHistoryLabel(roundIndex) {
  return roundIndex >= 4 ? "View knockout bracket" : `View ${ROUND_NAMES[roundIndex]}`;
}

function renderRoundHistoryControl() {
  if (teamFilterId) {
    els.historyRoundButton.hidden = true;
    els.newerRoundButton.hidden = true;
    return;
  }
  const { older, newer } = roundHistoryTargets();

  els.historyRoundButton.hidden = older === null;
  if (older !== null) {
    els.historyRoundButton.textContent = roundHistoryLabel(older);
    els.historyRoundButton.dataset.round = String(older);
  }

  els.newerRoundButton.hidden = newer === null || !state.rounds[newer];
  if (newer !== null && state.rounds[newer]) {
    els.newerRoundButton.textContent = roundHistoryLabel(newer);
    els.newerRoundButton.dataset.round = String(newer);
  }
}

function fixtureScoreMarkup(result, side, revealed) {
  if (!revealed) return "–";
  const goals = side === "home" ? result.homeGoals : result.awayGoals;
  const shootout = result.penalties?.[side];
  return shootout === undefined ? String(goals) : `${goals}<small>(${shootout})</small>`;
}

function fixtureStatus(result, revealed, index) {
  if (result && !revealed) return "READY";
  if (!revealed) return `MATCH ${String(index + 1).padStart(2, "0")}`;
  if (result.penalties) return "PENALTIES";
  if (result.extraTime) return "AFTER EXTRA TIME";
  return "FULL TIME";
}

function fixtureMarkup(match, index, roundIndex = state.activeRound, options = {}) {
  const placeholder = !match;
  const home = placeholder ? null : teamById(match.homeId);
  const away = placeholder ? null : teamById(match.awayId);
  const result = match?.result;
  const revealed = result?.revealed;
  const winner = revealed ? result.winnerId : null;
  const selected = !placeholder
    && roundIndex === state.activeRound
    && index === state.selectedMatch
    && !state.championView;
  const style = options.row && options.column
    ? `style="grid-column:${options.column};grid-row:${options.row}"`
    : "";
  const connection = options.connects ? "data-connects=\"true\"" : "";
  const homeName = home?.name || "To be confirmed";
  const awayName = away?.name || "To be confirmed";
  const homeFlag = home ? flagMarkup(home, "fixture-flag") : `<span class="fixture-tbc-flag">?</span>`;
  const awayFlag = away ? flagMarkup(away, "fixture-flag") : `<span class="fixture-tbc-flag">?</span>`;

  return `
    <button
      class="fixture ${options.bracket ? "bracket-fixture" : ""} ${revealed ? "complete" : ""} ${selected ? "selected" : ""} ${placeholder ? "placeholder" : ""}"
      data-index="${index}"
      data-round="${roundIndex}"
      ${connection}
      ${style}
      ${placeholder ? "disabled" : ""}
    >
      ${options.bracket ? "" : `
        <span class="fixture-card-head">
          <span>${ROUND_NAMES[roundIndex]}</span>
          <small>${fixtureStatus(result, revealed, index)}</small>
        </span>
      `}
      <span class="fixture-teams">
        <span class="fixture-team ${winner === home?.id ? "winner" : ""}">
          <span class="flag">${homeFlag}</span>
          <span class="name">${homeName}</span>
          <b>${fixtureScoreMarkup(result, "home", revealed)}</b>
          <i class="fixture-winner-marker" aria-hidden="true"></i>
        </span>
        <span class="fixture-team ${winner === away?.id ? "winner" : ""}">
          <span class="flag">${awayFlag}</span>
          <span class="name">${awayName}</span>
          <b>${fixtureScoreMarkup(result, "away", revealed)}</b>
          <i class="fixture-winner-marker" aria-hidden="true"></i>
        </span>
      </span>
    </button>
  `;
}

function bracketMarkup() {
  const roundIndexes = [4, 5, 6, 7];
  const heads = roundIndexes
    .map((roundIndex) => `<span>${ROUND_NAMES[roundIndex]}</span>`)
    .join("");
  const cards = [];
  const connectors = [];

  roundIndexes.forEach((roundIndex, offset) => {
    const matches = state.rounds[roundIndex] || [];
    const matchCount = 2 ** (7 - roundIndex);
    const baseRow = 2 ** offset;
    const rowStep = 2 ** (offset + 1);
    for (let index = 0; index < matchCount; index += 1) {
      cards.push(fixtureMarkup(matches[index], index, roundIndex, {
        bracket: true,
        column: offset + 1,
        connects: offset < roundIndexes.length - 1,
        row: baseRow + index * rowStep,
      }));
    }

    if (offset < roundIndexes.length - 1) {
      for (let pair = 0; pair < matchCount / 2; pair += 1) {
        const firstRow = baseRow + pair * 2 * rowStep;
        const secondRow = firstRow + rowStep;
        const span = secondRow - firstRow + 1;
        connectors.push(`
          <i
            class="bracket-connector"
            aria-hidden="true"
            style="grid-column:${offset + 1};grid-row:${firstRow} / span ${span};--connector-inset:${50 / span}%"
          ></i>
        `);
      }
    }
  });

  return `
    <div class="bracket-shell">
      <div class="bracket-heads">${heads}</div>
      <div class="bracket-canvas">${cards.join("")}${connectors.join("")}</div>
    </div>
  `;
}

function bindFixtureNavigation() {
  els.fixtureGrid.querySelectorAll(".fixture:not(:disabled)").forEach((fixture) => {
    fixture.addEventListener("click", () => {
      if (livePlayback) {
        showToast("The live tie is still running.");
        return;
      }
      const roundIndex = Number(fixture.dataset.round);
      if (!state.rounds[roundIndex]) return;
      state.activeRound = roundIndex;
      state.selectedMatch = Number(fixture.dataset.index);
      state.championView = false;
      saveState();
      render();
      els.matchStage.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
}

function renderFixtures() {
  if (teamFilterId) {
    const journey = teamJourneyMatches(teamFilterId);
    els.fixtureGrid.classList.remove("bracket-mode");
    els.fixtureGrid.classList.add("team-journey-mode");
    els.unresolvedFilter.hidden = true;
    els.fixtureGrid.innerHTML = journey.map(({ match, matchIndex, roundIndex }) => (
      fixtureMarkup(match, matchIndex, roundIndex)
    )).join("") || `<div class="overview-empty">No matches found for this team.</div>`;
    els.loadMoreButton.hidden = true;
    bindFixtureNavigation();
    return;
  }

  els.fixtureGrid.classList.remove("team-journey-mode");
  const bracketMode = state.activeRound >= 4;
  const historyMode = viewingRoundHistory();
  els.fixtureGrid.classList.toggle("bracket-mode", bracketMode);
  els.unresolvedFilter.hidden = bracketMode || historyMode;

  if (bracketMode) {
    els.fixtureGrid.innerHTML = bracketMarkup();
    els.loadMoreButton.hidden = true;
    bindFixtureNavigation();
    return;
  }

  const round = selectedRound();
  const indexed = round.map((match, index) => ({ match, index }));
  const filtered = filterUnresolved
    ? indexed.filter(({ match }) => !match.result?.revealed)
    : indexed;
  const shown = filtered;
  els.fixtureGrid.innerHTML = shown.map(({ match, index }) => fixtureMarkup(match, index)).join("");
  bindFixtureNavigation();
  els.loadMoreButton.hidden = true;
}

function renderQueue() {
  if (!els.matchQueue && !els.tiesRemaining) return;
  const round = selectedRound();
  const unplayed = round
    .map((match, index) => ({ match, index }))
    .filter(({ match }) => !match.result)
    .slice(0, 5);
  if (els.tiesRemaining) els.tiesRemaining.textContent = `${round.filter((match) => !match.result?.revealed).length} ties left`;

  if (!unplayed.length) {
    if (els.matchQueue) els.matchQueue.innerHTML = `
      <div class="empty-story">
        <span>✓</span>
        <p>This round is complete.</p>
      </div>
    `;
    return;
  }

  if (els.matchQueue) els.matchQueue.innerHTML = unplayed.map(({ match, index }) => {
    const home = teamById(match.homeId);
    const away = teamById(match.awayId);
    return `
      <div class="queue-item ${index === state.selectedMatch ? "current" : ""}" data-index="${index}">
        <span class="queue-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="queue-pair">
          <span class="queue-team"><span>${flagMarkup(home, "queue-flag")}</span><span>${home.name}</span></span>
          <span class="queue-team"><span>${flagMarkup(away, "queue-flag")}</span><span>${away.name}</span></span>
        </span>
      </div>
    `;
  }).join("");

  if (els.matchQueue) els.matchQueue.querySelectorAll(".queue-item").forEach((item) => {
    item.addEventListener("click", () => {
      if (livePlayback) {
        showToast("The live tie is still running.");
        return;
      }
      state.selectedMatch = Number(item.dataset.index);
      state.championView = false;
      saveState();
      render();
    });
  });
}

function storylineFor(match) {
  if (!match.result?.revealed) return null;
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const winner = teamById(match.result.winnerId);
  const loser = winner.id === home.id ? away : home;
  const goals = match.result.homeGoals + match.result.awayGoals;

  if (loser.strength - winner.strength > 12) {
    return {
      icon: "⚡",
      title: `${winner.name} stun ${loser.name}`,
      copy: `${winner.name} send one of the tournament favourites home.`,
      priority: 4,
    };
  }
  if (match.result.penalties) {
    return {
      icon: "◎",
      title: `${winner.name} survive on penalties`,
      copy: `${match.result.penalties.home}–${match.result.penalties.away} in the shootout.`,
      priority: 3,
    };
  }
  if (goals >= 6) {
    return {
      icon: "✦",
      title: `${goals}-goal classic`,
      copy: `${home.name} and ${away.name} deliver a wild one.`,
      priority: 2,
    };
  }
  if ((match.result.redCards || []).length) {
    const card = match.result.redCards[0];
    const dismissedTeam = teamById(card.teamId);
    return {
      icon: "▮",
      title: `${dismissedTeam.name} see red`,
      copy: `${card.player} was dismissed in the ${card.minute}th minute.`,
      priority: 2,
    };
  }
  if (match.result.extraTime) {
    return {
      icon: "+",
      title: `${winner.name} need extra time`,
      copy: `${home.name} ${match.result.homeGoals}–${match.result.awayGoals} ${away.name}.`,
      priority: 1,
    };
  }
  return null;
}

function renderStorylines() {
  const stories = allMatches()
    .map((match, index) => ({ story: storylineFor(match), index }))
    .filter(({ story }) => story)
    .sort((a, b) => b.index - a.index || b.story.priority - a.story.priority)
    .slice(0, 5)
    .map(({ story }) => story);

  if (!stories.length) {
    els.plotList.innerHTML = `
      <div class="empty-story">
        <span>✦</span>
        <p>The first giant-killing, thriller and penalty shootout will appear here.</p>
      </div>
    `;
    return;
  }

  els.plotList.innerHTML = stories.map((story) => `
    <div class="plot-item">
      <span class="plot-icon">${story.icon}</span>
      <div><strong>${story.title}</strong><p>${story.copy}</p></div>
    </div>
  `).join("");
}

function renderGoldenBoot() {
  const rankedScorers = calculateGoalscorerTable().map((leader, index) => ({
    ...leader,
    goldenBootRank: index + 1,
  }));
  let leaders = rankedScorers.slice(0, 5);
  const championId = state.rounds[7]?.[0]?.result?.winnerId;
  const championLeader = championId
    ? rankedScorers.find((leader) => leader.teamId === championId)
    : null;
  if (championLeader && !leaders.some((leader) => leader.teamId === championId)) {
    leaders = [...leaders.slice(0, 4), championLeader];
  }
  if (!leaders.length) {
    els.goldenBootList.innerHTML = `
      <div class="golden-boot-empty">
        <span>01</span>
        <p>The race starts with the first goal.</p>
      </div>
    `;
    return;
  }

  els.goldenBootList.innerHTML = leaders.map((leader) => {
    const team = teamById(leader.teamId);
    return `
      <div class="golden-boot-row ${leader.goldenBootRank === 1 ? "leader" : ""}">
        <span class="golden-boot-rank">${leader.goldenBootRank}</span>
        <span class="golden-boot-player">
          <strong>${leader.player}</strong>
          <small>${flagMarkup(team, "golden-boot-flag")} ${team.name} · ${leader.matches} apps</small>
        </span>
        <b>${leader.goals}</b>
      </div>
    `;
  }).join("");
}

function renderProgress() {
  const complete = completedCount();
  const total = state.legacyTournament ? 15 : 255;
  const percent = Math.round((complete / total) * 100);
  els.progressPercent.textContent = `${percent}%`;
  els.progressBar.style.width = `${percent}%`;
  els.progressCopy.textContent = complete
    ? `${complete} played · ${total - complete} ties remaining`
    : state.legacyTournament ? "16 teams. 15 ties. One champion." : "256 teams. 255 ties. One champion.";
}

function renderSettingsSummary() {
  const copy = {
    realistic: ["Realistic", "favourites hold the edge"],
    balanced: ["Balanced", "upsets can happen"],
    chaos: ["Pure chaos", "anything can happen"],
  }[state.settings.upset];
  els.chaosValue.textContent = copy[0];
  els.chaosCopy.textContent = copy[1];
}

function renderParticipantOverview(query = "") {
  const normalized = query.trim().toLowerCase();
  const confederations = [
    ["UEFA", "Europe"],
    ["CONMEBOL", "South America"],
    ["CONCACAF", "North & Central America"],
    ["AFC", "Asia"],
    ["CAF", "Africa"],
    ["OFC", "Oceania"],
    ["INVITED", "Invited & non-FIFA"],
  ];

  els.participantSections.innerHTML = confederations.map(([code, label]) => {
    const teams = TEAMS
      .filter((team) => team.confed === code && team.name.toLowerCase().includes(normalized))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (!teams.length) return "";
    return `
      <section class="participant-group">
        <div class="participant-group-head">
          <h3>${label}</h3>
          <span>${teams.length} ${teams.length === 1 ? "team" : "teams"}</span>
        </div>
        <div class="participant-grid">
          ${teams.map((team) => `
            <div class="participant">
              <span class="participant-flag">${flagMarkup(team, "participant-flag-art")}</span>
              <span>
                <strong>${team.name}</strong>
                <small>${team.officialFifaRank ? `FIFA #${team.officialFifaRank}` : "Guest team"} · ${team.rating}/100</small>
              </span>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }).join("") || `<div class="overview-empty">No teams match that search.</div>`;
}

function legacyFormationPreviewMarkup(formation) {
  return `<span class="legacy-formation-preview" aria-hidden="true">${formation.lines.map((line) => `<span class="legacy-preview-line">${line.map(() => "<i></i>").join("")}</span>`).join("")}</span>`;
}

function legacyDerivedAttributes(player) {
  const overall = player.rating || player.overall || 70;
  const position = player.primaryPosition || player.position || "CM";
  const role = position === "GK" ? "GK"
    : ["CB"].includes(position) ? "CB"
    : ["LB", "RB", "LWB", "RWB"].includes(position) ? "FB"
    : position === "CDM" ? "CDM"
    : position === "CM" ? "CM"
    : position === "CAM" ? "CAM"
    : ["LM", "RM", "LW", "RW"].includes(position) ? "WIDE"
    : "FORWARD";
  const deltas = {
    CB: [-5, -42, -14, -17, 3, 2],
    FB: [4, -22, -5, -3, -1, 0],
    CDM: [-3, -12, 1, -2, 1, 2],
    CM: [-2, -6, 2, 1, -8, -2],
    CAM: [0, 0, 2, 3, -32, -8],
    WIDE: [5, -1, 0, 4, -30, -8],
    FORWARD: [1, 3, -6, 1, -42, 0],
  };
  const clamp = (value) => Math.max(1, Math.min(99, Math.round(value)));
  if (role === "GK") {
    return {
      diving: clamp(overall + 1), handling: clamp(overall - 2), kicking: clamp(overall - 7),
      reflexes: clamp(overall + 2), speed: clamp(overall - 25), positioning: clamp(overall),
    };
  }
  const values = deltas[role].map((delta) => clamp(overall + delta));
  return Object.fromEntries(["pace", "shooting", "passing", "dribbling", "defending", "physical"].map((key, index) => [key, values[index]]));
}

function legacyPlayerAttributes(player) {
  if ((player.primaryPosition || player.position) === "GK") {
    return player.goalkeeperAttributes || legacyDerivedAttributes(player);
  }
  return player.attributes || legacyDerivedAttributes(player);
}

function renderLegacyLandingSetup() {
  if (!els.legacyLandingSetup) return;
  const activeLegacySession = Boolean(legacyDraft) || Boolean(state.legacyTournament && state.started);
  if (legacyDraft) {
    legacySetup = {
      ...legacySetup,
      mode: legacyDraft.mode,
      nationId: legacyDraft.nationId,
      formationId: legacyDraft.formationId,
    };
  }
  const nations = Object.values(LEGACY_NATIONS)
    .filter((nation) => legacyDraftableSquads(nation).length)
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!LEGACY_NATIONS[legacySetup.nationId] && nations[0]) legacySetup.nationId = nations[0].id;
  const formation = LEGACY_FORMATIONS[legacySetup.formationId] || LEGACY_FORMATIONS["433"];
  const nation = LEGACY_NATIONS[legacySetup.nationId] || nations[0];
  els.legacyLandingSetup.innerHTML = `
    ${activeLegacySession ? `<div class="legacy-active-session"><strong>Active tournament</strong><span>${flagMarkup(legacyNationTeam(nation), "legacy-active-flag")} ${nation.name} · ${legacySetup.mode === "expert" ? "Expert" : "Classic"} · ${formation.label}</span></div>` : ""}
    <div class="legacy-landing-setting legacy-landing-mode-setting">
      <span>Draft mode</span>
      <div class="segmented legacy-landing-mode">
        <button type="button" data-legacy-landing-mode="classic" class="${legacySetup.mode === "classic" ? "active" : ""}" ${activeLegacySession ? "disabled" : ""}>Classic</button>
        <button type="button" data-legacy-landing-mode="expert" class="${legacySetup.mode === "expert" ? "active" : ""}" ${activeLegacySession ? "disabled" : ""}>Expert</button>
      </div>
    </div>
    <div class="legacy-landing-setting">
      <span>Nation</span>
      <div class="legacy-landing-picker">
        ${flagMarkup(legacyNationTeam(nation), "legacy-landing-flag")}
        <select data-legacy-landing-nation aria-label="Draft nation" ${activeLegacySession ? "disabled" : ""}>${nations.map((item) => `<option value="${item.id}" ${item.id === nation?.id ? "selected" : ""}>${item.name}</option>`).join("")}</select>
        <button type="button" data-legacy-landing-random-nation title="Random nation" aria-label="Random nation" ${activeLegacySession ? "disabled" : ""}>&#8635;</button>
      </div>
    </div>
    <div class="legacy-landing-setting">
      <span>Formation</span>
      <div class="legacy-landing-picker legacy-landing-formation">
        ${legacyFormationPreviewMarkup(formation)}
        <select data-legacy-landing-formation aria-label="Draft formation" ${activeLegacySession ? "disabled" : ""}>${Object.entries(LEGACY_FORMATIONS).map(([id, item]) => `<option value="${id}" ${id === legacySetup.formationId ? "selected" : ""}>${item.label}</option>`).join("")}</select>
        <button type="button" data-legacy-landing-random-formation title="Random formation" aria-label="Random formation" ${activeLegacySession ? "disabled" : ""}>&#8635;</button>
      </div>
    </div>`;
  els.legacyLandingSetup.querySelectorAll("[data-legacy-landing-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      legacySetup = { ...legacySetup, mode: button.dataset.legacyLandingMode };
      renderLegacyLandingSetup();
    });
  });
  els.legacyLandingSetup.querySelector("[data-legacy-landing-nation]")?.addEventListener("change", (event) => {
    legacySetup = { ...legacySetup, nationId: event.target.value };
    renderLegacyLandingSetup();
  });
  els.legacyLandingSetup.querySelector("[data-legacy-landing-formation]")?.addEventListener("change", (event) => {
    legacySetup = { ...legacySetup, formationId: event.target.value };
    renderLegacyLandingSetup();
  });
  els.legacyLandingSetup.querySelector("[data-legacy-landing-random-nation]")?.addEventListener("click", () => {
    if (!nations.length) return;
    legacySetup = { ...legacySetup, nationId: nations[Math.floor(Math.random() * nations.length)].id };
    renderLegacyLandingSetup();
  });
  els.legacyLandingSetup.querySelector("[data-legacy-landing-random-formation]")?.addEventListener("click", () => {
    const formationIds = Object.keys(LEGACY_FORMATIONS);
    legacySetup = { ...legacySetup, formationId: formationIds[Math.floor(Math.random() * formationIds.length)] };
    renderLegacyLandingSetup();
  });
}

function legacyNationTeam(nation) {
  return TEAMS.find((team) => team.name === nation.name) || {
    name: nation.name,
    code: nation.code,
    flag: "",
  };
}

function renderLegacyDraftMode() {
  const activeDraft = Boolean(legacyDraft);
  document.body.classList.add("legacy-mode-active");
  els.pageHeading.hidden = activeDraft;
  els.legacyDraftBackButton.hidden = false;
  els.legacyHeaderBackButton.hidden = false;
  els.fieldOverview.hidden = true;
  els.mainContent.hidden = true;
  els.legacyDraftScreen.hidden = false;
  document.body.classList.add("before-start");
  els.pageKicker.textContent = "OFFLINE MODE";
  els.pageTitle.textContent = "World Cup Legacy Draft";
  if (!legacyDraft) {
    setAppModeUrl("home", { replace: true });
    render();
    return;
  }
  const expert = legacyDraft.mode === "expert";
  const formation = legacyFormation();
  const playerPositions = (player) => [...new Set([player.primaryPosition, ...(player.secondaryPositions || [])].filter(Boolean))].join(" · ");
  const playerStats = (player) => {
    if (expert) return "";
    const attributes = legacyPlayerAttributes(player);
    const goalkeeper = (player.primaryPosition || player.position) === "GK";
    const keys = goalkeeper
      ? [["DIV", "diving"], ["HAN", "handling"], ["KIC", "kicking"], ["REF", "reflexes"], ["SPD", "speed"], ["POS", "positioning"]]
      : [["PAC", "pace"], ["SHO", "shooting"], ["PAS", "passing"], ["DRI", "dribbling"], ["DEF", "defending"], ["PHY", "physical"]];
    return `<div class="legacy-stats">${keys.map(([label, key]) => `<span title="${key[0].toUpperCase()}${key.slice(1)}">${label} <b>${attributes[key]}</b></span>`).join("")}</div>`;
  };
  const playerSurname = (player) => player.name.split(/\s+/).at(-1);
  const slotMarkup = (slot) => {
    const player = legacyDraft.lineup[slot.id];
    const selected = legacyDraft.movingSlotId === slot.id;
    const targetPlayer = legacyDraft.selectedOfferId
      ? legacyDraft.offers.find((offer) => offer.id === legacyDraft.selectedOfferId)
      : legacyDraft.movingSlotId ? legacyDraft.lineup[legacyDraft.movingSlotId] : null;
    const sourceSlot = legacyDraft.movingSlotId ? formation.slots.find((item) => item.id === legacyDraft.movingSlotId) : null;
    const canAccept = targetPlayer && legacyPlayerFitsSlot(targetPlayer, slot)
      && (!player || (sourceSlot && legacyPlayerFitsSlot(player, sourceSlot)));
    const fit = targetPlayer && canAccept ? legacyPlayerFit(targetPlayer, slot) : null;
    const effectiveRating = player ? legacyEffectiveValue(player, slot, player.rating) : null;
    const contents = player
      ? `<small class="legacy-pitch-year">${player.year}</small>${expert ? `<b class="legacy-pitch-filled-mark">${slot.label}</b>` : `<b class="legacy-pitch-rating">${effectiveRating}</b>`}<strong class="legacy-pitch-name">${playerSurname(player)}</strong>`
      : `<span class="legacy-pitch-position">${slot.label}</span>`;
    return `<button class="legacy-pitch-slot ${player ? "is-filled" : ""} ${expert ? "is-expert" : ""} ${selected ? "is-selected" : ""} ${canAccept ? `can-accept is-${fit}` : ""}" type="button" data-legacy-slot-click="${slot.id}" aria-label="${player ? `${player.name}, ${player.year}, ${slot.label}${expert ? "" : `, overall ${effectiveRating}`}` : `Empty ${slot.label} position`}">${contents}</button>`;
  };
  const pitchMarkup = `
    <section class="legacy-pitch-panel">
      <div class="legacy-pitch legacy-pitch-${formation.lines.length}-lines">
        <div class="legacy-pitch-nation-flag">${flagMarkup(legacyNationTeam(legacyDraft.nation), "legacy-pitch-nation-flag-art")}</div>
        ${formation.lines.map((line) => `<div class="legacy-pitch-line" style="--slot-count:${line.length}">${line.map((slotId) => slotMarkup(formation.slots.find((slot) => slot.id === slotId))).join("")}</div>`).join("")}
      </div>
    </section>`;
  const topMarkup = `
    <section class="legacy-draft-status">
      <div class="legacy-status-flag">${flagMarkup(legacyNationTeam(legacyDraft.nation), "legacy-status-flag-art")}</div>
      <div><span>World Cup year</span><strong class="${legacyDraft.spinning ? "is-spinning" : ""}">${legacyDraft.yearTicker || legacyDraft.currentSquad?.year || "-"}</strong></div>
      <div><span>Mode</span><strong>${legacyDraft.mode === "expert" ? "Expert" : "Classic"}</strong></div>
    </section>`;
  if (legacyDraft.complete) {
    const tournamentMarkup = legacyDraft.tournament ? legacyDraft.tournament.rounds.map((round, roundIndex) => `
      <section class="legacy-tournament-round">
        <h3>${["Quarter-finals", "Semi-finals", "Final"][roundIndex] || `Round ${roundIndex + 1}`}</h3>
        ${round.map((match) => `<div class="legacy-result"><span class="${match.result.winnerId === match.homeId ? "is-winner" : ""}">${teamById(match.homeId)?.name}</span><strong>${match.result.homeGoals}-${match.result.awayGoals}</strong><span class="${match.result.winnerId === match.awayId ? "is-winner" : ""}">${teamById(match.awayId)?.name}</span></div>`).join("")}
      </section>
    `).join("") : "";
    els.legacyDraftBody.innerHTML = `
      <div class="legacy-draft-grid legacy-complete-grid"><div class="legacy-left-panel legacy-complete-panel"><div class="legacy-actions"><button class="primary-button" data-legacy-action="run-tournament" type="button">${legacyDraft.tournament ? "Run again" : "Start 16-team tournament"}</button><button class="secondary-button" data-legacy-action="restart" type="button">Restart draft</button><button class="secondary-button" data-legacy-action="snapshot" type="button">Snapshot</button></div><div class="legacy-tournament">${tournamentMarkup}</div></div>${pitchMarkup}</div>`;
    els.legacyDraftBody.querySelector("[data-legacy-action='run-tournament']")?.addEventListener("click", runLegacyTournament);
    els.legacyDraftBody.querySelector("[data-legacy-action='restart']")?.addEventListener("click", () => {
      legacyDraft = null;
      localStorage.removeItem("legacyDraftState");
      renderLegacyDraftMode();
    });
    const legacySnapshotButton = els.legacyDraftBody.querySelector("[data-legacy-action='snapshot']");
    legacySnapshotButton?.addEventListener("click", () => openLegacyDraftSnapshot(legacySnapshotButton));
  } else {
    const openSlots = legacyEmptySlots();
    const sortedOffers = [...legacyDraft.offers].sort((left, right) => {
      const leftDrafted = legacyPlayerAlreadyDrafted(left);
      const rightDrafted = legacyPlayerAlreadyDrafted(right);
      if (leftDrafted !== rightDrafted) return leftDrafted ? 1 : -1;
      const leftFits = openSlots.some((slot) => legacyPlayerFitsSlot(left, slot));
      const rightFits = openSlots.some((slot) => legacyPlayerFitsSlot(right, slot));
      if (leftFits !== rightFits) return leftFits ? -1 : 1;
      return right.rating - left.rating || left.name.localeCompare(right.name);
    });
    const offerMarkup = (player) => {
      const drafted = legacyPlayerAlreadyDrafted(player);
      return `
      <button class="legacy-player-card ${legacyDraft.selectedOfferId === player.id ? "is-selected" : ""} ${drafted ? "is-drafted" : ""}" type="button" data-legacy-offer="${player.id}" ${drafted ? "disabled" : ""}>
        <span class="legacy-position-list">${playerPositions(player)}</span>
        <span class="legacy-player-info">
          <strong>${player.name}</strong>
          ${playerStats(player)}
        </span>
        ${expert ? "" : `<span class="legacy-rating-badge"><small>OVR</small><b>${player.rating}</b></span>`}
      </button>`;
    };
    els.legacyDraftBody.innerHTML = `
      <div class="legacy-draft-grid">
        <section class="legacy-left-panel">
          <section class="legacy-draft-status">
            <div class="legacy-status-flag">${flagMarkup(legacyNationTeam(legacyDraft.nation), "legacy-status-flag-art")}</div>
            <div><span>World Cup year</span><strong class="${legacyDraft.spinning ? "is-spinning" : ""}">${legacyDraft.yearTicker || legacyDraft.currentSquad?.year || "-"}</strong></div>
          </section>
          <div class="legacy-randomiser ${legacyDraft.offers.length ? "has-respin" : ""}">
            <button class="primary-button" type="button" data-legacy-action="spin" ${legacyDraft.spinning || legacyDraft.offers.length ? "disabled" : ""}>${legacyDraft.spinning ? "Spinning..." : "Spin"}</button>
            ${legacyDraft.offers.length ? `<button class="secondary-button legacy-respin-button" type="button" data-legacy-action="respin" ${legacyDraft.respinsLeft < 1 ? "disabled" : ""}>${legacyDraft.respinsLeft > 0 ? "1 respin left" : "0 respins left"}</button>` : ""}
          </div>
          ${legacyDraft.blockedMessage ? `<div class="legacy-helper"><strong>${legacyDraft.blockedMessage}</strong></div>` : ""}
          ${legacyDraft.offers.length ? `<div class="legacy-offer-grid ${legacyDraft.revealOffers ? "is-revealed" : ""}">
            ${sortedOffers.map(offerMarkup).join("")}
          </div>` : ""}
        </section>
        ${pitchMarkup}
      </div>`;
    els.legacyDraftBody.querySelector("[data-legacy-action='spin']")?.addEventListener("click", spinLegacySquad);
    els.legacyDraftBody.querySelector("[data-legacy-action='respin']")?.addEventListener("click", respinLegacySquad);
    els.legacyDraftBody.querySelectorAll("[data-legacy-offer]").forEach((button) => {
      button.addEventListener("click", () => selectLegacyOffer(button.dataset.legacyOffer));
    });
  }
  els.legacyDraftBody.querySelectorAll("[data-legacy-slot-click]").forEach((button) => {
    button.addEventListener("click", () => handleLegacySlotClick(button.dataset.legacySlotClick));
  });
}

function render() {
  if (currentAppMode() === "legacy") {
    renderLegacyDraftMode();
    return;
  }
  document.body.classList.remove("legacy-mode-active");
  els.legacyDraftScreen.hidden = true;
  els.legacyDraftBackButton.hidden = false;
  els.legacyHeaderBackButton.hidden = false;
  const beforeStart = currentAppMode() !== "standard" || !state.started;
  els.pageHeading.hidden = !beforeStart;
  renderSpectatePicker();
  syncSoundToggle();
  document.body.classList.toggle("before-start", beforeStart);
  els.fieldOverview.hidden = !beforeStart;
  els.mainContent.hidden = beforeStart;

  if (beforeStart) {
    els.legacyHeaderBackButton.hidden = true;
    els.legacyDraftBackButton.hidden = true;
    const standardTournamentActive = state.started && !state.legacyTournament;
    els.startTournamentButton.innerHTML = `${standardTournamentActive ? "Resume tournament" : "Start tournament"} <span aria-hidden="true">→</span>`;
    els.homeRestartButton.hidden = !standardTournamentActive;
    const activeLegacySession = Boolean(legacyDraft) || Boolean(state.legacyTournament && state.started);
    els.startLegacyDraftButton.innerHTML = `${activeLegacySession ? "Resume tournament" : "Start draft"} <span aria-hidden="true">→</span>`;
    els.restartLegacyDraftButton.hidden = !activeLegacySession;
    els.pageKicker.textContent = "256 TEAMS WC · NEW TOURNAMENT";
    els.pageTitle.textContent = "Choose your mode";
    syncLandingSettings();
    renderLegacyLandingSetup();
    renderParticipantOverview(els.overviewSearch.value);
    renderProgress();
    return;
  }

  const roundName = ROUND_NAMES[state.activeRound];
  const historyMode = viewingRoundHistory();
  els.pageKicker.textContent = state.legacyTournament
    ? "LEGACY DRAFT TOURNAMENT"
    : state.championView
    ? "TOURNAMENT COMPLETE"
    : historyMode ? "ROUND ARCHIVE" : "256 TEAMS WC KNOCKOUT";
  els.pageTitle.textContent = state.legacyTournament
    ? `${legacyDraft?.nation?.name || "Legacy"} XI`
    : state.championView
    ? "Final"
    : roundName;
  els.boardTitle.textContent = historyMode
    ? roundName
    : state.activeRound >= 4 ? "Knockout bracket" : `${roundName} fixtures`;
  if (teamFilterId) els.boardTitle.textContent = `${teamById(teamFilterId).name} matches`;
  const watchedMatchIndex = teamMatchIndex(state.activeRound);
  els.simulateRoundButton.textContent = watchedMatchIndex >= 0 && !selectedRound()[watchedMatchIndex]?.result?.revealed
    ? "Simulate other ties"
    : state.activeRound === 7 ? "Simulate final" : "Simulate round";
  els.simulateRoundButton.hidden = historyMode || Boolean(teamFilterId);
  renderRoundNav();
  renderRoundHistoryControl();
  renderProgress();
  renderSettingsSummary();
  renderTeamFilter();
  renderStage();
  renderFixtures();
  renderQueue();
  renderGoldenBoot();
  renderStorylines();
  els.unresolvedFilter.classList.toggle("active", filterUnresolved);
}

function syncSoundToggle() {
  const enabled = state.settings.sound !== false;
  els.soundToggleButton.setAttribute("aria-pressed", String(enabled));
  els.soundToggleButton.classList.toggle("is-enabled", enabled);
  els.soundToggleButton.title = enabled ? "Turn match sounds off" : "Turn match sounds on";
  els.soundToggleLabel.textContent = enabled ? "Sounds on" : "Sounds off";
}

function syncLandingSettings() {
  document.querySelectorAll(".landing-segmented").forEach((group) => {
    const setting = group.dataset.setting;
    group.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.dataset.value === state.settings[setting]);
    });
  });
}

function syncSettingsDialog() {
  const enabled = state.settings.realPlayersOnly !== false;
  els.realPlayersOnlySetting.setAttribute("aria-pressed", String(enabled));
  els.realPlayersOnlySetting.classList.toggle("is-enabled", enabled);
  syncSoundToggle();
}

function teamJourneyMatches(teamId) {
  return state.rounds.flatMap((round, roundIndex) => (round || [])
    .map((match, matchIndex) => ({ match, matchIndex, roundIndex }))
    .filter(({ match }) => match.homeId === teamId || match.awayId === teamId));
}

function renderTeamFilter() {
  const team = teamFilterId ? teamById(teamFilterId) : null;
  els.teamFilterControl.classList.toggle("active", Boolean(team));
  els.teamFilterChip.hidden = !team;
  if (!team) return;
  els.teamFilterChip.innerHTML = `
    <span class="team-filter-check" aria-hidden="true">✓</span>
    ${flagMarkup(team, "team-filter-flag")}
    <strong>${team.name}</strong>
    <span class="team-filter-clear" aria-hidden="true">×</span>
  `;
  els.teamFilterChip.setAttribute("aria-label", `Clear ${team.name} match filter`);
}

function selectTeamFilter(teamId) {
  if (!teamFilterId) {
    teamFilterReturn = {
      activeRound: state.activeRound,
      selectedMatch: state.selectedMatch,
      championView: state.championView,
      fixtureLimit,
      filterUnresolved,
    };
  }
  teamFilterId = teamId;
  els.teamSearch.value = "";
  closeSearch();
  render();
  els.roundBoard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearTeamFilter() {
  teamFilterId = null;
  if (teamFilterReturn) {
    state.activeRound = teamFilterReturn.activeRound;
    state.selectedMatch = teamFilterReturn.selectedMatch;
    state.championView = teamFilterReturn.championView;
    fixtureLimit = teamFilterReturn.fixtureLimit;
    filterUnresolved = teamFilterReturn.filterUnresolved;
  }
  teamFilterReturn = null;
  els.teamSearch.value = "";
  closeSearch();
  saveState();
  render();
  els.roundBoard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeSearch() {
  searchPopover?.remove();
  searchPopover = null;
}

function renderSearchResults(query) {
  closeSearch();
  if (!query.trim()) return;
  const results = TEAMS.filter((team) => team.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  searchPopover = document.createElement("div");
  searchPopover.className = "search-result-popover";
  searchPopover.innerHTML = results.length
    ? results.map((team) => {
      const journey = teamJourneyMatches(team.id);
      return `
        <button class="search-result" data-id="${team.id}">
          <span>${flagMarkup(team, "search-flag")}</span>
          <span><strong>${team.name}</strong><small>${journey.length} ${journey.length === 1 ? "match" : "matches"}</small></span>
        </button>
      `;
    }).join("")
    : `<div class="empty-story"><p>No team found.</p></div>`;
  els.teamFilterControl.appendChild(searchPopover);
  searchPopover.querySelectorAll(".search-result").forEach((button) => {
    button.addEventListener("click", () => {
      if (livePlayback) {
        showToast("The live tie is still running.");
        closeSearch();
        return;
      }
      selectTeamFilter(button.dataset.id);
    });
  });
}

document.addEventListener("click", (event) => {
  if (searchPopover && !els.teamFilterControl.contains(event.target)) {
    closeSearch();
  }
});

els.playButton.addEventListener("click", playSelected);
els.standardTacticButtons.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-standard-tactic]");
  if (!button || button.disabled || !STANDARD_TACTICS[button.dataset.standardTactic]) return;
  if (livePlayback?.matchPenaltyActive) {
    showToast("Choose your approach after the penalty finishes.");
    return;
  }
  if (button.dataset.standardTactic === state.standardTactic) return;
  state.standardTactic = button.dataset.standardTactic;
  const liveMatch = selectedMatch();
  if (livePlayback && match2dState?.engine && liveMatch) {
    rebuildLiveMatchAfterTacticChange(liveMatch);
  } else if (match2dState?.engine && liveMatch) {
    const controlledSide = state.spectateTeamId === liveMatch.homeId ? "home" : state.spectateTeamId === liveMatch.awayId ? "away" : null;
    if (controlledSide) possessionTeam(match2dState.engine, controlledSide).tacticKey = state.standardTactic;
  }
  saveState();
  render();
  showToast(`${STANDARD_TACTICS[state.standardTactic].name} selected.`);
});
els.revealButton.addEventListener("click", () => {
  const match = selectedMatch();
  if (match?.result && !match.result.revealed) {
    primeMatchSounds();
    startLivePlayback(match);
    return;
  }
  revealSelected();
});
els.matchHighlightMode?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-highlight-mode]");
  if (button) setMatchHighlightMode(button.dataset.highlightMode);
});
els.pauseLiveButton.addEventListener("click", toggleLivePause);
els.speedButton.addEventListener("click", cycleLiveSpeed);
els.skipLiveButton.addEventListener("click", skipLivePlayback);
els.simulateRoundButton.addEventListener("click", requestRoundSimulation);
$("#confirmSimulateRoundButton").addEventListener("click", simulateCurrentRound);
els.roundNav.addEventListener("click", (event) => {
  const button = event.target.closest(".round-link.available");
  if (!button) return;
  if (livePlayback) {
    showToast("The live tie is still running. Skip to full time before changing rounds.");
    return;
  }
  const roundIndex = Number(button.dataset.round);
  openRound(roundIndex, roundIsComplete(roundIndex));
  setMobileMenu(false);
});
els.historyRoundButton.addEventListener("click", () => {
  if (livePlayback) {
    showToast("Finish or skip the live tie before changing rounds.");
    return;
  }
  openRound(Number(els.historyRoundButton.dataset.round), true);
});
els.newerRoundButton.addEventListener("click", () => {
  if (livePlayback) {
    showToast("Finish or skip the live tie before changing rounds.");
    return;
  }
  openRound(Number(els.newerRoundButton.dataset.round), true);
});
els.loadMoreButton.addEventListener("click", () => {
  fixtureLimit += 24;
  renderFixtures();
});
els.unresolvedFilter.addEventListener("click", () => {
  filterUnresolved = !filterUnresolved;
  fixtureLimit = DEFAULT_FIXTURE_LIMIT;
  renderFixtures();
  els.unresolvedFilter.classList.toggle("active", filterUnresolved);
});

els.snapshotButton.addEventListener("click", openSnapshotModal);
els.copySnapshotButton.addEventListener("click", copySnapshotImage);
els.shareSnapshotButton.addEventListener("click", shareSnapshotImage);
els.saveSnapshotButton.addEventListener("click", saveSnapshotImage);

els.soundToggleButton.addEventListener("click", () => {
  state.settings.sound = !state.settings.sound;
  saveState();
  syncSoundToggle();
  showToast(state.settings.sound ? "Match sounds on." : "Match sounds off.");
});

els.settingsButton.addEventListener("click", () => {
  syncSettingsDialog();
  els.settingsModal.showModal();
});
els.onlineSettingsButton?.addEventListener("click", () => els.settingsButton.click());
els.realPlayersOnlySetting.addEventListener("click", () => {
  state.settings.realPlayersOnly = state.settings.realPlayersOnly === false;
  saveState();
  syncSettingsDialog();
});

els.createOnlineRoomButton.addEventListener("click", () => openOnlineRoom(false));
els.joinOnlineRoomButton.addEventListener("click", () => openOnlineRoom(true));
els.confirmCreateRoomButton.addEventListener("click", createOnlineRoom);
els.confirmJoinRoomButton.addEventListener("click", joinOnlineRoom);
els.updateOnlineDisplayNameButton.addEventListener("click", updateOnlineDisplayName);
els.leaveOnlineRoomButton.addEventListener("click", leaveOnlineRoom);
els.closeOnlineRoomButton.addEventListener("click", closeOnlineRoom);
els.startOnlineDraftButton.addEventListener("click", startOnlineDraft);
els.leaveOnlineDraftRoomButton.addEventListener("click", leaveOnlineRoom);
els.closeOnlineDraftRoomButton.addEventListener("click", closeOnlineRoom);
els.leaveOnlineMatchRoomButton.addEventListener("click", leaveOnlineRoom);
els.closeOnlineMatchRoomButton.addEventListener("click", closeOnlineRoom);
els.onlinePenaltyTesterButton.addEventListener("click", () => {
  if (onlinePenaltyTester) {
    onlinePenaltyTester = null;
    onlinePenaltyAnimation = null;
    els.onlineCurrentMatch.classList.remove("is-penalty-tester");
    renderOnlineMatches(latestOnlineRoom, onlineRoomSession.memberId);
    startOnlineRoomPolling();
    return;
  }
  startOnlinePenaltyTester();
});
els.onlineRoundNextButton.addEventListener("click", () => {
  if (els.onlineRoundNextButton.disabled) return;
  advanceOnlineToAvailableRound();
});
els.onlineReadyButton.addEventListener("click", () => {
  const matchId = els.onlineReadyButton.dataset.matchId;
  if (!matchId) return;
  if (els.onlineReadyButton.dataset.action === "playback") {
    const match = latestOnlineRoom?.tournament?.rounds?.flatMap((round) => round.matches).find((item) => item.id === matchId);
    if (match) startOnlineMatchPlayback(match);
    return;
  }
  performOnlineMatchAction("match-ready", { matchId });
});
els.onlineTacticSlider.addEventListener("input", () => {
  const tactic = ONLINE_TACTIC_OPTIONS[Number(els.onlineTacticSlider.value)] || ONLINE_TACTIC_OPTIONS[2];
  els.onlineTacticName.textContent = tactic.name;
  els.onlineTacticCopy.textContent = tactic.copy;
});
els.onlineTacticSlider.addEventListener("change", () => {
  const tactic = ONLINE_TACTIC_OPTIONS[Number(els.onlineTacticSlider.value)] || ONLINE_TACTIC_OPTIONS[2];
  const teamId = els.onlineTacticSlider.dataset.teamId;
  if (teamId) performOnlineMatchAction("match-tactic", { tactic: tactic.id, teamId });
});
els.onlineTacticButtons.addEventListener("click", (event) => {
  const button = event.target.closest("[data-online-tactic]");
  const teamId = els.onlineTacticButtons.dataset.teamId;
  if (!button || button.disabled || !teamId) return;
  performOnlineMatchAction("match-tactic", { tactic: button.dataset.onlineTactic, teamId });
});
els.penaltyStage.addEventListener("click", (event) => {
  const button = event.target.closest("[data-standard-penalty-target]");
  if (button && !button.disabled) chooseStandardPenaltyTarget(button.dataset.standardPenaltyTarget);
});
els.matchPenaltyOverlay.addEventListener("click", (event) => {
  const button = event.target.closest("[data-match-penalty-target]");
  if (button && !button.disabled) chooseMatchPenaltyTarget(button.dataset.matchPenaltyTarget);
});
els.onlinePenaltyControl.addEventListener("click", (event) => {
  const button = event.target.closest("[data-penalty-target]");
  if (button && !button.disabled && onlinePenaltyTester) {
    takeOnlineTesterPenalty(button.dataset.penaltyTarget);
    return;
  }
  const memberId = onlineRoomSession?.memberId;
  const match = latestOnlineRoom?.tournament?.rounds?.at(-1)?.matches.find((item) => (
    item.liveState?.pendingDecision?.memberId === memberId
    || (item.status === "penalties" && latestOnlineRoom?.tournament?.teamOwnerById?.[item.penalty?.currentTeamId] === memberId)
  ));
  if (button && !button.disabled && match) takeOnlineInteractivePenalty(match, button.dataset.penaltyTarget);
});
els.onlineTeamSelectList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-team-id]");
  if (button) performOnlineMatchAction("team-select", { teamId: button.dataset.teamId });
});
function selectOnlineMatchFromList(event) {
  const button = event.target.closest("[data-match-id]");
  if (!button || !latestOnlineRoom) return;
  onlineMatchSelectionManual = true;
  onlineViewedMatchId = button.dataset.matchId;
  stopOnlineMatchPlayback();
  renderOnlineMatches(latestOnlineRoom, onlineRoomSession.memberId);
}
els.onlineMyMatches.addEventListener("click", selectOnlineMatchFromList);
els.onlineRoundMatches.addEventListener("click", selectOnlineMatchFromList);
els.onlineMatchFilter.addEventListener("click", (event) => {
  const button = event.target.closest("[data-online-match-filter]");
  if (!button || !latestOnlineRoom) return;
  onlineOtherMatchFilter = button.dataset.onlineMatchFilter;
  renderOnlineMatches(latestOnlineRoom, onlineRoomSession.memberId);
});
els.onlinePauseMatchButton.addEventListener("click", () => {
  const authoritativeMatchId = els.onlinePauseMatchButton.dataset.matchId;
  if (authoritativeMatchId) {
    const match = latestOnlineRoom?.tournament?.rounds.flatMap((round) => round.matches).find((item) => item.id === authoritativeMatchId);
    const paused = Boolean(match?.liveState?.clock?.pausedUntil > onlineServerNow());
    performOnlineMatchAction("match-playback", { matchId: authoritativeMatchId, paused: !paused });
    return;
  }
  if (!onlineMatchPlayback) return;
  if (onlineMatchPlayback.shared) {
    performOnlineMatchAction("match-playback", {
      matchId: onlineMatchPlayback.matchId,
      paused: !onlineMatchPlayback.paused,
    });
    return;
  }
  onlineMatchPlayback.paused = !onlineMatchPlayback.paused;
  els.onlinePauseMatchButton.textContent = onlineMatchPlayback.paused ? "Resume" : "Pause";
  if (!onlineMatchPlayback.paused) {
    onlineMatchPlayback.lastTimestamp = 0;
    onlineMatchPlaybackTimer = requestAnimationFrame(stepOnlineMatchPlayback);
  }
});
els.onlineMatchSpeedButton.addEventListener("click", () => {
  const authoritativeMatchId = els.onlineMatchSpeedButton.dataset.matchId;
  if (authoritativeMatchId) {
    const match = latestOnlineRoom?.tournament?.rounds.flatMap((round) => round.matches).find((item) => item.id === authoritativeMatchId);
    const speed = match?.liveState?.clock?.speedByMemberId?.[onlineRoomSession?.memberId] || 1;
    performOnlineMatchAction("match-playback", { matchId: authoritativeMatchId, speed: speed === 1 ? 2 : speed === 2 ? 4 : 1 });
    return;
  }
  if (!onlineMatchPlayback) return;
  if (onlineMatchPlayback.shared) {
    const requestedSpeed = onlineMatchPlayback.requestedSpeed === 1 ? 2 : onlineMatchPlayback.requestedSpeed === 2 ? 4 : 1;
    performOnlineMatchAction("match-playback", { matchId: onlineMatchPlayback.matchId, speed: requestedSpeed });
    return;
  }
  onlineMatchPlayback.speed = onlineMatchPlayback.speed === 1 ? 2 : onlineMatchPlayback.speed === 2 ? 4 : 1;
  els.onlineMatchSpeedButton.textContent = `${onlineMatchPlayback.speed}×`;
});
els.onlineTeamSelectDialog.addEventListener("cancel", (event) => event.preventDefault());
els.closeOnlineScreenButton.addEventListener("click", () => closeOnlineScreen());
els.onlineScreenBrand.addEventListener("click", (event) => {
  event.preventDefault();
  closeOnlineScreen({ updateUrl: true });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.onlineRoomScreen.hidden) closeOnlineScreen();
});
els.onlineRoomCodeInput.addEventListener("input", (event) => {
  event.target.value = normalizeOnlineRoomCode(event.target.value);
});
els.onlineRoomCodeInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    joinOnlineRoom();
  }
});
els.createOnlineDisplayName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    createOnlineRoom();
  }
});
els.joinOnlineDisplayName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    if (els.onlineRoomCodeInput.value) joinOnlineRoom();
    else els.onlineRoomCodeInput.focus();
  }
});
els.onlineLobbyDisplayName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    updateOnlineDisplayName();
  }
});
els.copyOnlineRoomCodeButton.addEventListener("click", async () => {
  if (!onlineRoomSession) return;
  const code = onlineRoomSession.code;
  try {
    await navigator.clipboard.writeText(code);
    showToast("Room code copied.");
  } catch {
    const input = document.createElement("input");
    input.value = code;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.append(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    if (copied) showToast("Room code copied.");
    else setOnlineRoomMessage(`Room code: ${code}`);
  }
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && onlineRoomSession && !els.onlineRoomScreen.hidden) {
    refreshOnlineRoom({ quiet: true });
    startOnlineRoomPolling();
  }
});

els.predictionSearch.addEventListener("input", (event) => renderPredictionList(event.target.value));
els.predictionList.addEventListener("click", (event) => {
  const option = event.target.closest(".prediction-option");
  if (!option) return;
  state.predictionTeamId = option.dataset.teamId;
  saveState();
  els.predictionModal.close();
  showToast(`${teamById(state.predictionTeamId).name} is your champion prediction.`);
});
els.clearPredictionButton.addEventListener("click", () => {
  state.predictionTeamId = null;
  saveState();
  els.predictionModal.close();
  showToast("Champion prediction cleared.");
});

els.spectatePickerButton.addEventListener("click", () => openSpectatePicker("all"));
els.spectateSearch.addEventListener("input", (event) => renderSpectateList(event.target.value));
els.spectateList.addEventListener("click", (event) => {
  const option = event.target.closest(".prediction-option");
  if (!option) return;
  const teamId = option.dataset.teamId || null;
  state.spectateTeamId = teamId;
  state.neutralView = !teamId;
  if (state.started && teamId) focusSpectatedTeam();
  saveState();
  render();
  els.spectateModal.close();
  const team = spectatedTeam();
  showToast(team ? `Now following ${team.name}.` : "Neutral view selected.");
  if (state.started) window.scrollTo({ top: 0, behavior: "smooth" });
});

els.continueNeutralButton.addEventListener("click", () => {
  state.spectateTeamId = null;
  state.neutralView = true;
  saveState();
  render();
  showToast("Neutral view restored. Keep the tournament going.");
});

els.replaySpectatedButton.addEventListener("click", () => {
  const team = spectatedTeam();
  if (!team) return;
  const previousSettings = { ...state.settings };

  if (team.id.startsWith("legacy-")) {
    if (!legacyDraft?.complete) {
      showToast("The saved Legacy XI is unavailable.");
      return;
    }
    legacyDraft.tournamentSeed = nextLegacyTournamentSeed(state.drawSeed);
    state = createLegacyTournamentState();
    state.settings = previousSettings;
    state.neutralView = false;
    fixtureLimit = DEFAULT_FIXTURE_LIMIT;
    filterUnresolved = false;
    teamFilterId = null;
    teamFilterReturn = null;
    saveState();
    saveLegacyDraft();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast(`New tournament. ${team.name}'s Round of 16 match is ready.`);
    return;
  }

  state = createInitialState();
  state.settings = previousSettings;
  state.spectateTeamId = team.id;
  state.neutralView = false;
  state.started = true;
  focusSpectatedTeam(0);
  fixtureLimit = DEFAULT_FIXTURE_LIMIT;
  filterUnresolved = false;
  teamFilterId = null;
  teamFilterReturn = null;
  saveState();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast(`Fresh draw. ${team.name}'s opening match is ready.`);
});

$("#newTournamentButton").addEventListener("click", () => els.resetModal.showModal());
$("#championReset").addEventListener("click", () => els.resetModal.showModal());
els.homeRestartButton?.addEventListener("click", () => els.resetModal.showModal());
$("#confirmResetButton").addEventListener("click", () => {
  stopStandardPlaybackForNavigation();
  const previousSettings = { ...state.settings };
  const previousSpectateTeamId = state.spectateTeamId;
  state = createInitialState();
  state.settings = previousSettings;
  state.spectateTeamId = previousSpectateTeamId;
  fixtureLimit = DEFAULT_FIXTURE_LIMIT;
  filterUnresolved = false;
  teamFilterId = null;
  teamFilterReturn = null;
  closeSearch();
  saveState();
  setAppModeUrl("home", { replace: true });
  render();
  showToast("Fresh draw created. All 256 teams are back.");
});

document.querySelectorAll(".segmented").forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    group.querySelectorAll("button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

document.querySelectorAll(".landing-segmented").forEach((group) => {
  group.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    state.settings[group.dataset.setting] = button.dataset.value;
    saveState();
  });
});

els.overviewSearch.addEventListener("input", (event) => renderParticipantOverview(event.target.value));
els.teamSearch.addEventListener("input", (event) => renderSearchResults(event.target.value));
els.teamFilterChip.addEventListener("click", clearTeamFilter);
els.bugReportButton?.addEventListener("click", () => {
  els.bugReportStatus.textContent = "";
  els.bugReportModal.showModal();
  els.bugReportMessage.focus();
});
els.onlineBugReportButton?.addEventListener("click", () => els.bugReportButton.click());
els.bugReportCloseButton?.addEventListener("click", () => els.bugReportModal.close());
els.bugReportForm?.addEventListener("submit", submitBugReport);
$("#goToTopButton").addEventListener("click", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
});

els.startTournamentButton.addEventListener("click", () => {
  if (state.legacyTournament) {
    const previousSettings = { ...state.settings };
    const standardSpectateTeamId = state.spectateTeamId?.startsWith("legacy-") ? null : state.spectateTeamId;
    const standardPredictionTeamId = TEAM_BY_ID.has(state.predictionTeamId) && !state.predictionTeamId?.startsWith("legacy-")
      ? state.predictionTeamId
      : null;
    state = createInitialState();
    state.settings = previousSettings;
    state.spectateTeamId = standardSpectateTeamId;
    state.predictionTeamId = standardPredictionTeamId;
    state.neutralView = !standardSpectateTeamId;
  }
  // If resuming but the spectate team changed, force a fresh start
  if (state.started && state._activeSpectateId && state.spectateTeamId !== state._activeSpectateId) {
    els.resetModal.showModal();
    return;
  }
  if (!state.started) state._activeSpectateId = state.spectateTeamId;
  const resuming = state.started;
  state.started = true;
  if (!resuming && state.spectateTeamId) focusSpectatedTeam(0);
  saveState();
  setAppModeUrl("standard");
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (resuming) {
    showToast("Tournament resumed.");
    return;
  }
  const pick = state.predictionTeamId ? teamById(state.predictionTeamId) : null;
  const watched = spectatedTeam();
  showToast(watched
    ? `${watched.name}'s opening match is ready.`
    : pick ? `${pick.name} locked in. The draw is live.` : "The draw is live. Choose the opening tie.");
});

els.startLegacyDraftButton?.addEventListener("click", () => {
  if (state.legacyTournament && state.started) {
    if (!isValidLegacyTournamentState(state) && legacyDraft?.complete) {
      state = createLegacyTournamentState();
      saveState();
    }
    setAppModeUrl("standard");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (!state.legacyTournament && legacyDraft?.complete) {
    try {
      const savedLegacyTournament = JSON.parse(localStorage.getItem(LEGACY_TOURNAMENT_SESSION_KEY));
      if (savedLegacyTournament?.version === STATE_VERSION && isValidLegacyTournamentState(savedLegacyTournament)) {
        savedLegacyTournament.settings = { ...defaultSettings, ...(savedLegacyTournament.settings || {}) };
        state = savedLegacyTournament;
        const customTeam = legacyDraftTeam();
        TEAM_BY_ID.set(customTeam.id, customTeam);
        setAppModeUrl("standard");
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast("Legacy tournament resumed.");
        return;
      }
    } catch {
      localStorage.removeItem(LEGACY_TOURNAMENT_SESSION_KEY);
    }
  }
  if (legacyDraft) {
    setAppModeUrl("legacy");
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  legacyDraft = null;
  localStorage.removeItem("legacyDraftState");
  startLegacyDraft(legacySetup.nationId);
  window.scrollTo({ top: 0, behavior: "smooth" });
});

els.restartLegacyDraftButton?.addEventListener("click", () => {
  const legacyTeamId = legacyDraft?.nationId ? `legacy-${legacyDraft.nationId}-xi` : state.spectateTeamId;
  if (typeof legacyTeamId === "string" && legacyTeamId.startsWith("legacy-")) TEAM_BY_ID.delete(legacyTeamId);
  legacyDraft = null;
  localStorage.removeItem("legacyDraftState");
  localStorage.removeItem(LEGACY_TOURNAMENT_SESSION_KEY);
  if (state.legacyTournament) {
    const previousSettings = { ...state.settings };
    state = createInitialState();
    state.settings = previousSettings;
    saveState();
  }
  setAppModeUrl("home", { replace: true });
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Legacy tournament restarted.");
});

els.legacyDraftBackButton.addEventListener("click", () => {
  setAppModeUrl("home");
  render();
});

els.legacyHeaderBackButton.addEventListener("click", () => {
  setAppModeUrl("home");
  render();
});

document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  setMobileMenu(false);
  stopStandardPlaybackForNavigation();
  setAppModeUrl("home", { replace: true });
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function stopStandardPlaybackForNavigation() {
  if (!livePlayback) return;
  clearMatchPenaltyAnimation();
  livePlayback.presentationScheduler?.clear("navigation");
  if (match2dState?.eventTimer) clearTimeout(match2dState.eventTimer);
  match2dState = null;
  cancelAnimationFrame(livePlayback.frame);
  clearTimeout(livePlayback.finishTimer);
  clearTimeout(livePlayback.penaltyTimer);
  livePlayback = null;
}

const menuButton = $("#menuButton");
const menuBackdrop = $("#menuBackdrop");

function setMobileMenu(open) {
  const shouldOpen = Boolean(open && window.matchMedia("(max-width: 850px)").matches);
  els.sidebar.classList.toggle("open", shouldOpen);
  menuBackdrop.hidden = !shouldOpen;
  menuButton.setAttribute("aria-expanded", String(shouldOpen));
  menuButton.setAttribute("aria-label", shouldOpen ? "Close rounds" : "Open rounds");
  document.body.classList.toggle("mobile-menu-open", shouldOpen);
}

menuButton.addEventListener("click", () => setMobileMenu(!els.sidebar.classList.contains("open")));
menuBackdrop.addEventListener("click", () => setMobileMenu(false));
window.addEventListener("resize", () => {
  if (window.innerWidth > 850) setMobileMenu(false);
});
$("#fullscreenButton").addEventListener("click", async () => {
  try {
    els.settingsModal.close();
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch {
    showToast("Fullscreen is not available in this browser.");
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMobileMenu(false);
  if (
    event.key === " " &&
    !["INPUT", "BUTTON"].includes(document.activeElement.tagName) &&
    !document.querySelector("dialog[open]")
  ) {
    event.preventDefault();
    if (livePlayback) {
      showToast("Use the live controls to speed up or skip this tie.");
      return;
    }
    const match = selectedMatch();
    if (match?.result && !match.result.revealed) revealSelected();
    else playSelected();
  }
});

window.addEventListener("popstate", () => {
  const mode = currentAppMode();
  if (mode === "online") {
    if (onlineModeAvailableLocally()) {
      openOnlineRoom(false, { updateUrl: false });
    } else {
      setAppModeUrl("home", { replace: true });
      render();
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    return;
  }
  if (mode !== "standard") stopStandardPlaybackForNavigation();
  if (!els.onlineRoomScreen.hidden) closeOnlineScreen({ updateUrl: false, force: true });
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
});

if (onlineRoomSession?.name) setOnlineDisplayNames(onlineRoomSession.name);
const initialUrlParams = new URLSearchParams(window.location.search);
const linkedOnlineRoomCode = initialUrlParams.get("room");
if (linkedOnlineRoomCode) els.onlineRoomCodeInput.value = normalizeOnlineRoomCode(linkedOnlineRoomCode);
let initialAppMode = currentAppMode();
if (initialAppMode === "home" && state.started && !state.legacyTournament) {
  setAppModeUrl("standard", { replace: true });
  initialAppMode = "standard";
} else if (initialAppMode === "standard" && !state.started) {
  setAppModeUrl("home", { replace: true });
  initialAppMode = "home";
} else {
  window.history.replaceState(
    { ...(window.history.state || {}), appMode: initialAppMode },
    "",
    window.location.href,
  );
}
configureOnlineModeAvailability();
syncOnlineRoomCard();
render();
if (initialAppMode === "online") {
  if (onlineModeAvailableLocally()) openOnlineRoom(false, { updateUrl: false });
  else setAppModeUrl("home", { replace: true });
}
