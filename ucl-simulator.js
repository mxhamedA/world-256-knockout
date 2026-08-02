(() => {
  "use strict";

  const Engine = window.UclEngine;
  if (!Engine) return;

  const STORAGE_KEY = "world-256-ucl-2026-27-season-v4";
  const MENU_TEAM_KEY = "world-256-ucl-2026-27-team-v1";
  const AUDIO_PREFS_KEY = "world-256-ucl-audio-prefs-v1";
  const MUSIC_DATABASE = "world-256-ucl-music-addon";
  const MUSIC_STORE = "addons";
  const MUSIC_RECORD_KEY = "active";
  const MAX_MUSIC_BYTES = 25 * 1024 * 1024;
  const BUNDLED_ADDON = Object.freeze({
    name: "UEFA Champions League Legacy Anthem",
    url: "./assets/audio/ucl-legacy-anthem.mp3",
    size: 1_670_791,
    ownerProvided: true,
  });

  const $ = (selector) => document.querySelector(selector);
  const screen = $("#uclSimulatorScreen");
  const appShell = $("#appShell");
  const content = $("#uclSimulatorContent");
  const startButton = $("#startUclSimulatorButton");
  const menuRestartButton = $("#restartUclSimulatorButton");
  const menuCard = $("#uclModeCard");
  const settingsButton = $("#uclSettingsButton");
  const backButton = $("#uclBackButton");
  const restartButton = $("#uclRestartButton");
  const feedbackButton = $("#uclFeedbackButton");
  const achievementsButton = $("#uclAchievementsButton");
  const donateButton = $("#uclDonateButton");
  const accountButton = $("#uclAccountButton");
  const accountLabel = $("#uclAccountLabel");
  const restartModal = $("#uclRestartModal");
  const confirmRestartButton = $("#confirmUclRestartButton");
  const primaryActionButton = $("#uclPrimaryActionButton");
  const simulateAllButton = $("#uclSimulateAllButton");
  const actionRow = document.querySelector(".ucl-action-row");
  const stageKicker = $("#uclStageKicker");
  const stageTitle = $("#uclStageTitle");
  const matchdayDate = $("#uclMatchdayDate");
  const progressLabel = $("#uclProgressLabel");
  const tabs = [...document.querySelectorAll("[data-ucl-view]")];
  const fastModeButton = $("#uclFastModeButton");
  const soundButton = $("#uclSoundButton");
  const musicButton = $("#uclMusicButton");
  const musicDialog = $("#uclMusicDialog");
  const musicCloseButton = $("#uclMusicCloseButton");
  const musicFileInput = $("#uclMusicFileInput");
  const musicFileName = $("#uclMusicFileName");
  const musicFileMeta = $("#uclMusicFileMeta");
  const musicStatusTitle = $("#uclMusicStatusTitle");
  const musicStatusCopy = $("#uclMusicStatusCopy");
  const musicMessage = $("#uclMusicMessage");
  const musicVolume = $("#uclMusicVolume");
  const musicVolumeLabel = $("#uclMusicVolumeLabel");
  const removeMusicButton = $("#uclRemoveMusicButton");
  const drawStage = $("#uclDrawStage");
  const drawKicker = $("#uclDrawKicker");
  const drawTitle = $("#uclDrawTitle");
  const drawStatus = $("#uclDrawStatus");
  const drawCount = $("#uclDrawCount");
  const drawTotal = $("#uclDrawTotal");
  const pauseDrawButton = $("#uclPauseDrawButton");
  const pauseDrawLabel = $("#uclPauseDrawLabel");
  const skipDrawButton = $("#uclSkipDrawButton");
  const ceremonyScene = $("#uclCeremonyScene");
  const potBalls = $("#uclPotBalls");
  const drawnStrip = $("#uclDrawnStrip");
  const revealMeta = $("#uclRevealMeta");
  const revealName = $("#uclRevealName");
  const revealBadge = $("#uclRevealBadge");
  const broadcastLayer = $("#uclBroadcastLayer");
  const skipRevealsButton = $("#uclSkipRevealsButton");
  const momentOverlay = $("#uclMomentOverlay");
  const momentCard = $("#uclMomentCard");
  const championOverlay = $("#uclChampionOverlay");
  const championBadge = $("#uclChampionBadge");
  const championName = $("#uclChampionName");
  const championDetail = $("#uclChampionDetail");
  const championShareButton = $("#uclChampionShareButton");
  const championBracketButton = $("#uclChampionBracketButton");
  const championRestartButton = $("#uclChampionRestartButton");
  const confetti = $("#uclConfetti");
  const liveBackButton = $("#uclLiveBackButton");
  const engineTablePanel = $("#uclEngineTablePanel");
  const engineTable = $("#uclEngineTable");
  const engineFullTableButton = $("#uclEngineFullTableButton");

  if (!screen || !content || !startButton) return;

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)") || { matches: false };
  let season = readSeason();
  let activeView = "overview";
  let animationToken = 0;
  let currentDraw = null;
  let revealRun = null;
  let skipAutomaticReveal = false;
  let restartFromMenu = false;
  let customMusicRecord = null;
  let customMusicUrl = null;
  let musicLoadPromise = null;
  let audioPrefs = readAudioPrefs();
  let standardStateBeforeMatch = null;
  const displacedEngineTeams = new Map();
  const UCL_STAGE_5_CLUBS = new Set([
    "real-madrid", "manchester-city", "bayern-munich", "paris-saint-germain", "liverpool", "barcelona",
  ]);
  const UCL_STAGE_4_CLUBS = new Set(["inter-milan", "arsenal", "atletico-madrid"]);
  const UCL_STAGE_3_CLUBS = new Set(["borussia-dortmund", "napoli", "manchester-united", "rb-leipzig"]);
  const UCL_STAGE_2_CLUBS = new Set(["sporting-cp", "porto", "villarreal", "roma", "psv-eindhoven", "aston-villa"]);
  const UCL_STAGE_1_CLUBS = new Set([
    "galatasaray", "feyenoord", "stuttgart", "lille", "fenerbahce", "olympique-lyonnais",
  ]);
  const UCL_YOUNG_PLAYER_NAMES = new Set([
    "Lamine Yamal", "Pau Cubarsí", "Gavi", "Arda Güler", "Endrick", "Franco Mastantuono",
    "Désiré Doué", "Warren Zaïre-Emery", "João Neves", "Senny Mayulu", "Lennart Karl",
    "Aleksandar Pavlović", "Jobe Bellingham", "Ethan Nwaneri", "Myles Lewis-Skelly", "Max Dowman",
    "Leny Yoro", "Kobbie Mainoo", "Nico O'Reilly", "Rico Lewis", "Claudio Echeverri",
    "Nico Paz", "Assane Diao", "Geovany Quenda", "Rodrigo Mora", "Antonio Nusa",
  ]);

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ordinal(value) {
    const number = Number(value);
    const mod100 = number % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${number}th`;
    if (number % 10 === 1) return `${number}st`;
    if (number % 10 === 2) return `${number}nd`;
    if (number % 10 === 3) return `${number}rd`;
    return `${number}th`;
  }

  function formatBytes(bytes) {
    const value = Number(bytes) || 0;
    if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  function readSeason() {
    try {
      const candidate = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!Engine.validSeason(candidate)) return null;
      ["quarter-finals", "semi-finals", "final"].forEach((key) => {
        const round = candidate.knockout?.rounds?.[key];
        if (!round) return;
        round.drawComplete = true;
        round.drawnCount = round.ties.length * 2;
      });
      return candidate;
    } catch {
      return null;
    }
  }

  function saveSeason() {
    if (!season || season.savedHistoryView) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(season));
    } catch {
      // The current session remains usable when browser storage is unavailable.
    }
    syncMenuState();
    const currentAchievementState = achievementState();
    if (currentAchievementState) window.AccountAchievements?.trackUclSeason?.(currentAchievementState);
  }

  function selectedMenuTeamId() {
    try {
      const id = localStorage.getItem(MENU_TEAM_KEY);
      return Engine.team(id)?.provisional ? null : (Engine.team(id)?.id || null);
    } catch {
      return null;
    }
  }

  function newSeason() {
    return Engine.createSeason(selectedMenuTeamId());
  }

  function uclTargetStageIndex(teamId) {
    if (UCL_STAGE_5_CLUBS.has(teamId)) return 5;
    if (UCL_STAGE_4_CLUBS.has(teamId)) return 4;
    if (UCL_STAGE_3_CLUBS.has(teamId)) return 3;
    if (UCL_STAGE_2_CLUBS.has(teamId)) return 2;
    if (UCL_STAGE_1_CLUBS.has(teamId)) return 1;
    return 0;
  }

  function uclBestStageIndex() {
    if (!season?.managedTeamId || season.phase === "league") return -1;
    const managedTeamId = season.managedTeamId;
    const status = Engine.qualificationStatus(season, managedTeamId);
    let bestStageIndex = status.key === "qualified" ? 1 : status.key === "playoffs" ? 0 : -1;
    const roundStageIndexes = [
      ["playoffs", 0],
      ["round-of-16", 1],
      ["quarter-finals", 2],
      ["semi-finals", 3],
      ["final", 4],
    ];
    roundStageIndexes.forEach(([roundKey, stageIndex]) => {
      const tie = season.knockout?.rounds?.[roundKey]?.ties?.find((candidate) => (
        candidate.teamAId === managedTeamId || candidate.teamBId === managedTeamId
      ));
      if (tie) bestStageIndex = Math.max(bestStageIndex, stageIndex);
    });
    if (season.phase === "complete" && season.championId === managedTeamId) return 5;
    return bestStageIndex;
  }

  function uclManagedTeamEliminated() {
    if (!season?.managedTeamId || season.phase === "league") return false;
    if (Engine.qualificationStatus(season, season.managedTeamId).key === "eliminated") return true;
    return Object.values(season.knockout?.rounds || {}).some((round) => round.ties?.some((tie) => (
      (tie.teamAId === season.managedTeamId || tie.teamBId === season.managedTeamId)
      && tie.result
      && tie.winnerId !== season.managedTeamId
    )));
  }

  function achievementState() {
    if (!season?.managedTeamId || !Number.isSafeInteger(Number(season.seed))) return null;
    const bestStageIndex = uclBestStageIndex();
    const targetStageIndex = uclTargetStageIndex(season.managedTeamId);
    const complete = bestStageIndex >= targetStageIndex
      || uclManagedTeamEliminated()
      || season.phase === "complete";
    return {
      seed: Number(season.seed),
      clubId: season.managedTeamId,
      phase: complete ? "complete" : "start",
      bestStageIndex,
    };
  }

  function readAudioPrefs() {
    try {
      const saved = JSON.parse(localStorage.getItem(AUDIO_PREFS_KEY) || "null") || {};
      const savedVolume = Number(saved.musicVolume);
      return {
        enabled: saved.enabled !== false,
        fastMode: false,
        musicVolume: saved.musicVolume !== null
          && saved.musicVolume !== undefined
          && Number.isFinite(savedVolume)
          ? Math.max(0, Math.min(24, savedVolume))
          : 10,
      };
    } catch {
      return { enabled: true, fastMode: false, musicVolume: 10 };
    }
  }

  function saveAudioPrefs() {
    try {
      localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(audioPrefs));
    } catch {
      // Audio preferences can remain in memory when storage is unavailable.
    }
  }

  function showToastMessage(message) {
    if (typeof window.showToast === "function") window.showToast(message);
  }

  function teamMark(team, size = "small", { eager = false } = {}) {
    if (!team) return `<span class="ucl-team-mark-${size} has-generic"><span class="ucl-team-monogram">?</span></span>`;
    if (!team.badge) {
      return `<span class="ucl-team-mark-${size} has-generic has-code" aria-hidden="true"><span class="ucl-team-monogram">${escapeHtml(team.code)}</span></span>`;
    }
    return `
      <span class="ucl-team-mark-${size}" data-team-id="${escapeHtml(team.id)}" aria-hidden="true">
        <img src="${escapeHtml(team.badge)}" alt="" loading="${eager ? "eager" : "lazy"}" decoding="async" />
      </span>
    `;
  }

  function installEngineTeam(team) {
    if (!team || typeof TEAM_BY_ID === "undefined") return;
    if (!displacedEngineTeams.has(team.id)) {
      displacedEngineTeams.set(team.id, TEAM_BY_ID.has(team.id) ? TEAM_BY_ID.get(team.id) : null);
    }
    const squadPack = typeof UCL_FC27_SQUADS !== "undefined" ? UCL_FC27_SQUADS[team.id] : null;
    const playerProfiles = Array.isArray(squadPack?.players)
      ? squadPack.players.map((profile) => ({ ...profile }))
      : Array.isArray(team.playerProfiles) ? team.playerProfiles.map((profile) => ({ ...profile })) : [];
    const playerNames = playerProfiles.map((profile) => profile.name).filter(Boolean);
    const squadRatings = squadPack?.simulationRatings || {};
    const rating = Math.max(55, Math.min(96, Number(squadRatings.overall) || Number(team.rating) || 75));
    Engine.applySimulationRatings?.(team.id, squadRatings);
    TEAM_BY_ID.set(team.id, {
      ...team,
      flag: "",
      confed: "UEFA",
      strength: rating,
      premierLeague: true,
      uclClub: true,
      players: playerNames,
      playerProfiles,
      simulationRatings: {
        overall: rating,
        attack: Math.max(55, Math.min(96, Number(squadRatings.attack) || rating)),
        midfield: Math.max(55, Math.min(96, Number(squadRatings.midfield) || rating)),
        defence: Math.max(55, Math.min(96, Number(squadRatings.defence) || rating)),
        goalkeeper: Math.max(55, Math.min(96, Number(squadRatings.goalkeeper) || rating)),
        squadDepth: Math.max(55, Math.min(94, Number(squadRatings.squadDepth) || rating)),
        experience: Math.max(55, Math.min(94, Number(squadRatings.experience) || rating)),
        penalties: Math.max(55, Math.min(94, Number(squadRatings.penalties) || rating)),
        discipline: Math.max(55, Math.min(90, Number(squadRatings.discipline) || 72)),
      },
    });
    clearPlayerProfileCacheForTeam?.(team.id);
  }

  function restoreEngineTeams() {
    if (typeof TEAM_BY_ID === "undefined") return;
    displacedEngineTeams.forEach((original, teamId) => {
      if (original) TEAM_BY_ID.set(teamId, original);
      else TEAM_BY_ID.delete(teamId);
      clearPlayerProfileCacheForTeam?.(teamId);
    });
    displacedEngineTeams.clear();
  }

  function syncEngineSquadRatings() {
    if (typeof UCL_FC27_SQUADS === "undefined" || typeof Engine.applySimulationRatings !== "function") return;
    Engine.TEAM_DATA.forEach((team) => {
      const ratings = UCL_FC27_SQUADS[team.id]?.simulationRatings;
      if (ratings) Engine.applySimulationRatings(team.id, ratings);
    });
  }

  syncEngineSquadRatings();

  function engineResultToLeagueResult(match) {
    if (!match?.result) return;
    const homeGoals = Number(match.result.homeGoals ?? match.result.home);
    const awayGoals = Number(match.result.awayGoals ?? match.result.away);
    if (Number.isFinite(homeGoals)) {
      match.result.home = homeGoals;
      match.result.homeGoals = homeGoals;
    }
    if (Number.isFinite(awayGoals)) {
      match.result.away = awayGoals;
      match.result.awayGoals = awayGoals;
    }
    if (!match.result.winnerId && homeGoals !== awayGoals) {
      match.result.winnerId = homeGoals > awayGoals ? match.homeId : match.awayId;
    }
    match.result.upset = Boolean(match.result.shock || (
      match.result.winnerId
      && Engine.team(match.result.winnerId)
      && Math.abs(Engine.team(match.homeId).rating - Engine.team(match.awayId).rating) >= 6
    ));
  }

  function uclScorerHash(value) {
    let hash = 2166136261;
    for (const character of String(value)) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function uclScorerCandidates(teamId) {
    const squad = typeof UCL_FC27_SQUADS !== "undefined" ? UCL_FC27_SQUADS[teamId] : null;
    return (squad?.players || [])
      .filter((player) => player?.name && player.position !== "GK")
      .sort((left, right) => (
        ((Number(right.overall) || 0) + (Number(right.finishing) || Number(right.shooting) || 0) * 0.45)
        - ((Number(left.overall) || 0) + (Number(left.finishing) || Number(left.shooting) || 0) * 0.45)
        || String(left.name).localeCompare(String(right.name))
      ));
  }

  function uclGoldenBootRows(limit = 5) {
    const scorers = new Map();
    const add = (teamId, name, goals) => {
      if (!teamId || !name || !goals) return;
      const key = `${teamId}:${name}`;
      const current = scorers.get(key) || { teamId, name, goals: 0 };
      current.goals += Number(goals) || 0;
      scorers.set(key, current);
    };
    season?.league?.flat().forEach((match) => {
      const result = match.result;
      if (!result?.revealed) return;
      ["home", "away"].forEach((side) => {
        const teamId = side === "home" ? match.homeId : match.awayId;
        const events = Array.isArray(result[`${side}Events`]) ? result[`${side}Events`] : [];
        const goalTotal = Number(result[side === "home" ? "home" : "away"] ?? result[`${side}Goals`]) || 0;
        const creditedEvents = events.filter((event) => event?.type !== "ownGoal" && event?.ownGoal !== true && event?.scorer);
        creditedEvents.forEach((event) => add(teamId, event.scorer, 1));
        const candidates = uclScorerCandidates(teamId);
        const fallback = candidates[0]?.name || `${Engine.team(teamId)?.name || "Club"} Player`;
        for (let goalIndex = creditedEvents.length; goalIndex < goalTotal; goalIndex += 1) {
          const candidate = candidates[(uclScorerHash(`${match.id}:${side}:${goalIndex}`) % Math.max(1, Math.min(5, candidates.length)))]?.name || fallback;
          add(teamId, candidate, 1);
        }
      });
    });
    return [...scorers.values()]
      .sort((left, right) => right.goals - left.goals || left.name.localeCompare(right.name))
      .slice(0, Math.max(1, Number(limit) || 5));
  }

  function uclGoldenBootMarkup(limit = 5, variant = "") {
    const rows = uclGoldenBootRows(limit);
    return `
      <section class="ucl-golden-boot ${variant ? `is-${variant}` : ""}">
        <header><h3>Top Scorer</h3></header>
        ${rows.length ? `<div class="ucl-golden-boot-list">${rows.map((row, index) => `
          <div class="ucl-golden-boot-row">
            <b>${index + 1}</b>
            <span>${teamMark(Engine.team(row.teamId), "small")}<strong>${escapeHtml(row.name)}</strong><small>${escapeHtml(Engine.team(row.teamId)?.name || "Club")}</small></span>
            <i>${row.goals}</i>
          </div>
        `).join("")}</div>` : '<p class="ucl-golden-boot-empty">Goals will appear here after the first results.</p>'}
      </section>
    `;
  }

  function renderEngineTable() {
    if (!engineTablePanel || !engineTable) return;
    const active = Boolean(state?.uclSeason && season);
    engineTablePanel.hidden = !active;
    if (liveBackButton) liveBackButton.hidden = !active;
    if (!active) return;
    season.league?.flat().filter((match) => match.result?.revealed).forEach(engineResultToLeagueResult);
    const rows = Engine.leagueTable(season);
    const selectedIndex = Math.max(0, rows.findIndex((row) => row.team.id === season.managedTeamId));
    const start = Math.max(0, Math.min(rows.length - 6, selectedIndex - 3));
    engineTable.innerHTML = `
      <div class="pl-engine-table-head"><span>Pos</span><span>Club</span><span>GD</span><span>Pts</span></div>
      ${rows.slice(start, start + 6).map((row, index) => `
        <div class="pl-engine-table-row ${row.team.id === season.managedTeamId ? "is-selected" : ""}">
          <b>${start + index + 1}</b>
          <span>${teamMark(row.team)}<strong>${escapeHtml(row.team.name)}</strong></span>
          <i>${row.gd > 0 ? "+" : ""}${row.gd}</i>
          <strong>${row.points}</strong>
        </div>
      `).join("")}
    `;
  }

  function openManagedMatchday() {
    if (!season?.managedTeamId || season.phase !== "league") return false;
    const roundIndex = season.activeMatchday;
    const round = season.league?.[roundIndex];
    const matchIndex = round?.findIndex((match) => [match.homeId, match.awayId].includes(season.managedTeamId)) ?? -1;
    if (matchIndex < 0) return false;
    const match = round[matchIndex];
    if (match.result && !match.result.revealed) match.result = null;
    stopStandardPlaybackForNavigation?.();
    restoreEngineTeams();
    season.leagueTeamIds.forEach((teamId) => installEngineTeam(Engine.team(teamId)));
    window.repairDefaultKnockoutRosterResults?.(season);
    standardStateBeforeMatch = state;
    season.rounds = season.league;
    season.drawSeed = season.seed;
    season.settings = {
      ...normalizeSettings?.(),
      ...(season.settings || {}),
      realNames: true,
      realPlayersOnly: true,
    };
    season.activeRound = roundIndex;
    season.viewRound = roundIndex;
    season.selectedMatch = matchIndex;
    season.spectateTeamId = season.managedTeamId;
    season.neutralView = false;
    season.standardTactic ||= "balanced";
    season.standardFormation ||= "4-3-3";
    season.managerLineups ||= {};
    season.started = true;
    season.championView = false;
    season.matchViewActive = true;
    season.uclSeason = true;
    season.premierLeagueSeason = true;
    match.allowDraw = true;
    saveSeason();
    state = season;
    screen.hidden = true;
    appShell.hidden = false;
    document.body.classList.remove("ucl-simulator-open");
    document.body.classList.add("pl-match-mode-active", "ucl-match-mode-active");
    if ($("#plLiveBackButton")) $("#plLiveBackButton").hidden = true;
    if ($("#plEngineTablePanel")) $("#plEngineTablePanel").hidden = true;
    window.render?.();
    renderEngineTable();
    window.scrollTo({ top: 0, behavior: "auto" });
    return true;
  }

  function openLeagueFixtureResult(roundIndex, matchId) {
    if (!season?.managedTeamId) return false;
    const index = Number(roundIndex);
    const round = season.league?.[index];
    const matchIndex = round?.findIndex((match) => match.id === matchId) ?? -1;
    const match = round?.[matchIndex];
    if (!match?.result?.revealed) return false;
    season.league.flat().filter((fixture) => fixture.result?.revealed).forEach(engineResultToLeagueResult);
    stopStandardPlaybackForNavigation?.();
    restoreEngineTeams();
    season.leagueTeamIds.forEach((teamId) => installEngineTeam(Engine.team(teamId)));
    window.repairDefaultKnockoutRosterResults?.(season);
    standardStateBeforeMatch = state;
    season.rounds = season.league;
    season.drawSeed = season.seed;
    season.settings = {
      ...normalizeSettings?.(),
      ...(season.settings || {}),
      realNames: true,
      realPlayersOnly: true,
    };
    season.activeRound = index;
    season.viewRound = index;
    season.selectedMatch = matchIndex;
    season.spectateTeamId = [match.homeId, match.awayId].includes(season.managedTeamId)
      ? season.managedTeamId
      : null;
    season.neutralView = !season.spectateTeamId;
    season.started = true;
    season.championView = false;
    season.matchViewActive = true;
    season.uclSeason = true;
    season.premierLeagueSeason = true;
    match.allowDraw = true;
    saveSeason();
    state = season;
    screen.hidden = true;
    appShell.hidden = false;
    document.body.classList.remove("ucl-simulator-open");
    document.body.classList.add("pl-match-mode-active", "ucl-match-mode-active");
    if ($("#plLiveBackButton")) $("#plLiveBackButton").hidden = true;
    window.render?.();
    renderEngineTable();
    window.scrollTo({ top: 0, behavior: "auto" });
    return true;
  }

  function knockoutLegFixture(round, tie, legIndex) {
    if (round.legs === 1) return { homeId: tie.teamAId, awayId: tie.teamBId };
    return legIndex === 0
      ? { homeId: tie.teamBId, awayId: tie.teamAId }
      : { homeId: tie.teamAId, awayId: tie.teamBId };
  }

  function knockoutLegMatch(round, tie, legIndex) {
    const fixture = knockoutLegFixture(round, tie, legIndex);
    const playedLeg = tie.playedLegs?.[legIndex]
      || (tie.revealed ? tie.result?.legs?.[legIndex] : null);
    const homeGoals = Number(playedLeg?.home) || 0;
    const awayGoals = Number(playedLeg?.away) || 0;
    return {
      id: `${tie.id}:leg-${legIndex + 1}`,
      homeId: fixture.homeId,
      awayId: fixture.awayId,
      stage: round.key,
      uclKnockoutLeg: true,
      allowDraw: round.legs === 2,
      result: playedLeg ? {
        home: homeGoals,
        away: awayGoals,
        homeGoals,
        awayGoals,
        winnerId: homeGoals === awayGoals ? null : homeGoals > awayGoals ? fixture.homeId : fixture.awayId,
        revealed: true,
        homeEvents: [],
        awayEvents: [],
      } : null,
    };
  }

  function openManagedKnockoutMatch(roundKey, tieId) {
    if (!season?.managedTeamId || season.phase === "complete") return false;
    const round = season.knockout?.rounds?.[roundKey];
    const tie = round?.ties?.find((candidate) => candidate.id === tieId);
    if (!round || !tie || !knockoutTiePlayable(roundKey, tie)) return false;
    const legIndex = tie.playedLegs?.length || 0;
    if (legIndex >= round.legs) return false;
    const fixture = knockoutLegFixture(round, tie, legIndex);
    const knockoutMatches = round.ties.map((candidate) => knockoutLegMatch(round, candidate, legIndex));
    const selectedMatchIndex = round.ties.findIndex((candidate) => candidate.id === tie.id);
    const match = knockoutMatches[selectedMatchIndex];
    stopStandardPlaybackForNavigation?.();
    restoreEngineTeams();
    season.leagueTeamIds.forEach((teamId) => installEngineTeam(Engine.team(teamId)));
    window.repairDefaultKnockoutRosterResults?.(season);
    standardStateBeforeMatch = state;
    season.rounds = [knockoutMatches];
    season.drawSeed = season.seed;
    season.settings = {
      ...normalizeSettings?.(),
      ...(season.settings || {}),
      realNames: true,
      realPlayersOnly: true,
    };
    season.activeRound = 0;
    season.viewRound = 0;
    season.selectedMatch = selectedMatchIndex;
    season.spectateTeamId = season.managedTeamId;
    season.neutralView = false;
    season.standardTactic ||= "balanced";
    season.standardFormation ||= "4-3-3";
    season.managerLineups ||= {};
    season.started = true;
    season.championView = false;
    season.matchViewActive = true;
    season.uclSeason = true;
    season.premierLeagueSeason = true;
    season.uclKnockoutMatch = {
      roundKey,
      tieId,
      legIndex,
      roundLabel: round.legs === 2 ? `${round.label} · Leg ${legIndex + 1}` : round.label,
      homeId: fixture.homeId,
      awayId: fixture.awayId,
    };
    saveSeason();
    state = season;
    screen.hidden = true;
    appShell.hidden = false;
    document.body.classList.remove("ucl-simulator-open");
    document.body.classList.add("pl-match-mode-active", "ucl-match-mode-active");
    if ($("#plLiveBackButton")) $("#plLiveBackButton").hidden = true;
    if ($("#plEngineTablePanel")) $("#plEngineTablePanel").hidden = true;
    window.render?.();
    renderEngineTable();
    window.scrollTo({ top: 0, behavior: "auto" });
    return true;
  }

  function managedKnockoutTieResult(round, tie, legs) {
    const normalizedLegs = legs.map((leg) => ({ ...leg }));
    const aggregateA = round.legs === 1
      ? (normalizedLegs[0].homeId === tie.teamAId ? normalizedLegs[0].home : normalizedLegs[0].away)
      : (normalizedLegs[0].awayId === tie.teamAId ? normalizedLegs[0].away : normalizedLegs[0].home)
        + (normalizedLegs[1].homeId === tie.teamAId ? normalizedLegs[1].home : normalizedLegs[1].away);
    const aggregateB = round.legs === 1
      ? (normalizedLegs[0].homeId === tie.teamBId ? normalizedLegs[0].home : normalizedLegs[0].away)
      : (normalizedLegs[0].awayId === tie.teamBId ? normalizedLegs[0].away : normalizedLegs[0].home)
        + (normalizedLegs[1].homeId === tie.teamBId ? normalizedLegs[1].home : normalizedLegs[1].away);
    let penalties = null;
    if (aggregateA === aggregateB) {
      const finalLeg = normalizedLegs.at(-1);
      if (finalLeg?.penalties) {
        penalties = {
          teamA: finalLeg.homeId === tie.teamAId ? finalLeg.penalties.home : finalLeg.penalties.away,
          teamB: finalLeg.homeId === tie.teamBId ? finalLeg.penalties.home : finalLeg.penalties.away,
        };
      } else {
        const base = 3 + (uclScorerHash(`${season.seed}:${tie.id}:managed-penalties`) % 2);
        const teamAWins = uclScorerHash(`${season.seed}:${tie.id}:managed-penalty-winner`) % 2 === 0;
        penalties = teamAWins
          ? { teamA: base + 1, teamB: base }
          : { teamA: base, teamB: base + 1 };
      }
    }
    const winnerId = aggregateA !== aggregateB
      ? aggregateA > aggregateB ? tie.teamAId : tie.teamBId
      : penalties.teamA > penalties.teamB ? tie.teamAId : tie.teamBId;
    const winner = Engine.team(winnerId);
    const loser = Engine.team(winnerId === tie.teamAId ? tie.teamBId : tie.teamAId);
    const decidedBy = aggregateA !== aggregateB
      ? round.legs === 2 ? "aggregate" : normalizedLegs[0].extraTime ? "extra time" : "90 minutes"
      : "penalties";
    return {
      legs: normalizedLegs,
      aggregateA,
      aggregateB,
      decidedBy,
      penalties,
      upset: Boolean(winner && loser && loser.rating - winner.rating >= 6),
    };
  }

  function finishManagedKnockoutMatch(roundIndex, matchIndex) {
    if (!state?.uclSeason || !season?.uclKnockoutMatch) return false;
    const metadata = season.uclKnockoutMatch;
    const round = season.knockout?.rounds?.[metadata.roundKey];
    const tie = round?.ties?.find((candidate) => candidate.id === metadata.tieId);
    const match = state.rounds?.[Number(roundIndex)]?.[Number(matchIndex)];
    if (
      !round
      || !tie
      || !match?.result?.revealed
      || match.homeId !== metadata.homeId
      || match.awayId !== metadata.awayId
    ) return false;
    engineResultToLeagueResult(match);
    const result = match.result;
    const leg = {
      homeId: match.homeId,
      awayId: match.awayId,
      home: Number(result.homeGoals ?? result.home) || 0,
      away: Number(result.awayGoals ?? result.away) || 0,
      regulationHome: Number(result.regulationHome ?? result.homeGoals ?? result.home) || 0,
      regulationAway: Number(result.regulationAway ?? result.awayGoals ?? result.away) || 0,
      extraTime: result.extraTime === true,
      penalties: result.penalties ? { ...result.penalties } : null,
      shootout: Array.isArray(result.shootout) ? result.shootout.map((attempt) => ({ ...attempt })) : null,
    };
    tie.playedLegs = [...(tie.playedLegs || [])];
    tie.playedLegs[metadata.legIndex] = leg;
    const completedLegs = tie.playedLegs.filter(Boolean);
    if (completedLegs.length < round.legs) {
      saveSeason();
      returnToSimulator({ view: "knockout" });
      showToastMessage(`${metadata.legIndex === 0 ? "First" : "Next"} leg complete. The next leg is ready.`);
      return true;
    }
    tie.result = managedKnockoutTieResult(round, tie, completedLegs);
    tie.winnerId = tie.result.aggregateA === tie.result.aggregateB
      ? tie.result.penalties.teamA > tie.result.penalties.teamB ? tie.teamAId : tie.teamBId
      : tie.result.aggregateA > tie.result.aggregateB ? tie.teamAId : tie.teamBId;
    tie.revealed = true;
    const roundComplete = round.ties.every((candidate) => candidate.result && candidate.winnerId);
    if (roundComplete) Engine.completeKnockoutRound(season, round.key);
    saveSeason();
    const managedWon = tie.winnerId === season.managedTeamId;
    returnToSimulator({ view: "knockout" });
    showToastMessage(roundComplete
      ? managedWon ? `${Engine.team(season.managedTeamId)?.name || "Your club"} advance to the next round.` : "The knockout round is complete."
      : managedWon ? "Your tie is complete. Reveal the other ties when you are ready." : "Your knockout tie is complete.");
    if (season.phase === "complete") window.setTimeout(showChampionMoment, motionDuration(500, 40));
    return true;
  }

  function returnToSimulator({ view = "overview" } = {}) {
    if (!state?.uclSeason && !document.body.classList.contains("ucl-match-mode-active")) return false;
    stopStandardPlaybackForNavigation?.();
    if (state?.uclSeason) season = state;
    season.matchViewActive = false;
    if (season?.uclSeason) {
      season.rounds = season.league;
      delete season.uclKnockoutMatch;
    }
    saveSeason();
    restoreEngineTeams();
    state = standardStateBeforeMatch || standardTournamentState;
    standardStateBeforeMatch = null;
    document.body.classList.remove("pl-match-mode-active", "pl-match-detail-active", "ucl-match-mode-active");
    document.body.classList.add("ucl-simulator-open");
    if (liveBackButton) liveBackButton.hidden = true;
    if (engineTablePanel) engineTablePanel.hidden = true;
    appShell.hidden = true;
    screen.hidden = false;
    activeView = view;
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
    return true;
  }

  function finishManagedMatchday(roundIndex, matchIndex) {
    if (!state?.uclSeason || !season) return false;
    const round = season.league?.[Number(roundIndex)];
    const managedMatch = round?.[Number(matchIndex)];
    if (!managedMatch?.result?.revealed || ![managedMatch.homeId, managedMatch.awayId].includes(season.managedTeamId)) return false;
    engineResultToLeagueResult(managedMatch);
    Engine.ensureMatchdayResults(season, Number(roundIndex)).forEach((match) => {
      engineResultToLeagueResult(match);
      Engine.revealMatch(match);
    });
    Engine.completeMatchday(season, Number(roundIndex));
    saveSeason();
    const leagueComplete = season.phase !== "league";
    returnToSimulator({ view: "overview" });
    showToastMessage(leagueComplete
      ? "The Champions League league phase is complete."
      : `Matchday ${Number(roundIndex) + 1} complete. Matchday ${Number(roundIndex) + 2} is ready.`);
    if (leagueComplete) window.setTimeout(showLeaguePhaseMoment, motionDuration(500, 40));
    return true;
  }

  function returnToManagedMatchday(roundIndex, matchIndex) {
    if (!state?.uclSeason || !season) return false;
    const index = Number(roundIndex);
    const round = season.league?.[index];
    const watchedMatch = round?.[Number(matchIndex)];
    if (
      !round
      || !watchedMatch
      || [watchedMatch.homeId, watchedMatch.awayId].includes(season.managedTeamId)
      || !watchedMatch.result?.revealed
    ) return false;

    engineResultToLeagueResult(watchedMatch);
    Engine.revealMatch(watchedMatch);
    const managedIndex = round.findIndex((match) => (
      match.homeId === season.managedTeamId || match.awayId === season.managedTeamId
    ));
    if (managedIndex < 0) return false;

    season.activeRound = index;
    season.viewRound = index;
    season.selectedMatch = managedIndex;
    season.championView = false;
    state.activeRound = index;
    state.selectedMatch = managedIndex;
    state.championView = false;
    saveSeason();
    window.render?.();
    renderEngineTable();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToastMessage("Back to your match.");
    return true;
  }

  function currentMatchdayIndex() {
    return Math.max(0, Math.min(7, season?.activeMatchday || 0));
  }

  function currentKnockoutRound() {
    const key = season?.knockout?.currentKey;
    return key ? season.knockout.rounds[key] || null : null;
  }

  function completedMatchdays() {
    return season?.league?.filter((round) => round.every((match) => match.result?.revealed)).length || 0;
  }

  function abortAnimations() {
    animationToken += 1;
    currentDraw = null;
    updateDrawPauseUi();
    if (revealRun) revealRun.skip = true;
    revealRun = null;
    skipAutomaticReveal = false;
    broadcastLayer.innerHTML = "";
    skipRevealsButton.hidden = true;
    ceremonyScene.removeAttribute("data-phase");
  }

  function delay(duration, token) {
    const ms = Math.max(0, Number(duration) || 0);
    return new Promise((resolve) => {
      window.setTimeout(() => resolve(token === animationToken), ms);
    });
  }

  async function drawDelay(duration, token) {
    let remaining = Math.max(0, Number(duration) || 0);
    while (remaining > 0 && token === animationToken) {
      if (currentDraw?.paused) {
        if (!(await delay(80, token))) return false;
        continue;
      }
      const slice = Math.min(50, remaining);
      if (!(await delay(slice, token))) return false;
      if (!currentDraw?.paused) remaining -= slice;
    }
    return token === animationToken;
  }

  function setDrawStatus(status) {
    if (currentDraw) currentDraw.statusText = status;
    if (!currentDraw?.paused) drawStatus.textContent = status;
  }

  function updateDrawPauseUi() {
    const paused = Boolean(currentDraw?.paused && !drawStage.hidden);
    drawStage.classList.toggle("is-paused", paused);
    pauseDrawButton?.setAttribute("aria-pressed", String(paused));
    if (pauseDrawLabel) pauseDrawLabel.textContent = paused ? "Resume draw" : "Pause draw";
    if (!currentDraw) return;
    drawStatus.textContent = paused
      ? "Draw paused · Press Space to resume"
      : currentDraw.statusText || "The draw is live";
  }

  function toggleDrawPause() {
    if (!currentDraw || drawStage.hidden) return false;
    currentDraw.paused = !currentDraw.paused;
    updateDrawPauseUi();
    return true;
  }

  async function skippableDelay(duration, token, run) {
    let remaining = Math.max(0, Number(duration) || 0);
    while (remaining > 0 && token === animationToken && !run?.skip) {
      const slice = Math.min(60, remaining);
      if (!(await delay(slice, token))) return false;
      remaining -= slice;
    }
    return token === animationToken;
  }

  function motionDuration(normal, fast = 70) {
    return audioPrefs.fastMode || prefersReducedMotion.matches ? fast : normal;
  }

  function roundContainsManagedTeam(round) {
    return Boolean(season?.managedTeamId && round?.ties.some((tie) => (
      tie.teamAId === season.managedTeamId || tie.teamBId === season.managedTeamId
    )));
  }

  function musicMomentActive() {
    return Boolean(
      currentDraw
      || !momentOverlay.hidden
      || !championOverlay.hidden
      || (revealRun?.type === "knockout" && currentKnockoutRound()?.key === "final")
    );
  }

  class UclSoundscape {
    constructor() {
      this.context = null;
      this.master = null;
      this.crowd = null;
      this.music = new Audio();
      this.music.loop = true;
      this.music.preload = "none";
      this.music.volume = 0;
      this.musicSourceKey = null;
      this.musicFadeToken = 0;
      this.musicDuckTimer = null;
      this.musicBlocked = false;
    }

    async unlock() {
      if (!audioPrefs.enabled) return false;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0.36;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === "suspended") await this.context.resume().catch(() => {});
      return this.context.state === "running";
    }

    noiseBuffer(seconds = 1) {
      if (!this.context) return null;
      const frameCount = Math.max(1, Math.floor(this.context.sampleRate * seconds));
      const buffer = this.context.createBuffer(1, frameCount, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1;
      return buffer;
    }

    async startCrowd() {
      if (!(await this.unlock()) || this.crowd) return;
      const source = this.context.createBufferSource();
      source.buffer = this.noiseBuffer(2.4);
      source.loop = true;
      const lowPass = this.context.createBiquadFilter();
      lowPass.type = "bandpass";
      lowPass.frequency.value = 520;
      lowPass.Q.value = 0.55;
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(0.0001, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.022, this.context.currentTime + 1.4);
      source.connect(lowPass).connect(gain).connect(this.master);
      source.start();
      this.crowd = { source, gain };
    }

    stopCrowd(fadeSeconds = 0.6) {
      if (!this.crowd || !this.context) return;
      const { source, gain } = this.crowd;
      this.crowd = null;
      const now = this.context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeSeconds);
      window.setTimeout(() => {
        try { source.stop(); } catch { /* Already stopped. */ }
      }, fadeSeconds * 1000 + 80);
    }

    async noisePulse({ duration = 0.35, frequency = 1100, gainValue = 0.045, type = "bandpass" } = {}) {
      if (!(await this.unlock())) return;
      const source = this.context.createBufferSource();
      source.buffer = this.noiseBuffer(duration + 0.08);
      const filter = this.context.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = frequency;
      const gain = this.context.createGain();
      const now = this.context.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter).connect(gain).connect(this.master);
      source.start(now);
      source.stop(now + duration + 0.06);
    }

    paper() {
      this.noisePulse({ duration: 0.42, frequency: 1750, gainValue: 0.052, type: "highpass" });
    }

    async whistle() {
      if (!(await this.unlock())) return;
      const gain = this.context.createGain();
      const first = this.context.createOscillator();
      const second = this.context.createOscillator();
      const now = this.context.currentTime;
      first.type = "sine";
      second.type = "sine";
      first.frequency.setValueAtTime(2350, now);
      first.frequency.exponentialRampToValueAtTime(2750, now + 0.34);
      second.frequency.setValueAtTime(2470, now);
      second.frequency.exponentialRampToValueAtTime(2890, now + 0.34);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.048, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      first.connect(gain);
      second.connect(gain);
      gain.connect(this.master);
      first.start(now);
      second.start(now);
      first.stop(now + 0.46);
      second.stop(now + 0.46);
    }

    goal() {
      this.noisePulse({ duration: 0.75, frequency: 720, gainValue: 0.075 });
    }

    gasp() {
      this.noisePulse({ duration: 0.52, frequency: 1250, gainValue: 0.058, type: "lowpass" });
    }

    async tension() {
      if (!(await this.unlock())) return;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const now = this.context.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(52, now);
      oscillator.frequency.exponentialRampToValueAtTime(78, now + 1.8);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 1.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(now);
      oscillator.stop(now + 2.05);
    }

    musicSource() {
      if (customMusicRecord && customMusicUrl) {
        return { key: `custom:${customMusicRecord.name}:${customMusicRecord.size}`, url: customMusicUrl };
      }
      return { key: "bundled", url: BUNDLED_ADDON.url };
    }

    async playMusic() {
      if (!audioPrefs.enabled) return;
      await ensureMusicLoaded();
      const source = this.musicSource();
      if (!source) {
        this.setMusicBlocked(false);
        return false;
      }
      if (this.musicSourceKey !== source.key) {
        this.music.pause();
        this.music.src = source.url;
        this.music.currentTime = 0;
        this.musicSourceKey = source.key;
      }
      const target = audioPrefs.musicVolume / 100;
      this.music.volume = Math.min(this.music.volume, target);
      try {
        await this.music.play();
      } catch {
        this.setMusicBlocked(true);
        return false;
      }
      this.setMusicBlocked(false);
      this.fadeMusic(target, 850);
      return true;
    }

    fadeMusic(target, duration = 500, { pauseAfter = false } = {}) {
      this.musicFadeToken += 1;
      const token = this.musicFadeToken;
      const from = this.music.volume;
      const start = performance.now();
      const tick = (now) => {
        if (token !== this.musicFadeToken) return;
        const progress = Math.min(1, (now - start) / Math.max(1, duration));
        this.music.volume = Math.max(0, Math.min(0.24, from + (target - from) * progress));
        if (progress < 1) requestAnimationFrame(tick);
        else if (pauseAfter) this.music.pause();
      };
      requestAnimationFrame(tick);
    }

    clearMusicDuck() {
      if (this.musicDuckTimer !== null) window.clearTimeout(this.musicDuckTimer);
      this.musicDuckTimer = null;
    }

    setMusicBlocked(blocked) {
      this.musicBlocked = Boolean(blocked);
      musicButton?.classList.toggle("needs-gesture", this.musicBlocked);
      const label = this.musicBlocked ? "Music addon — tap to enable" : "Music addon";
      musicButton?.setAttribute("aria-label", label);
      if (musicButton) musicButton.title = label;
    }

    stopMusic({ immediate = false } = {}) {
      this.clearMusicDuck();
      this.setMusicBlocked(false);
      if (immediate) {
        this.musicFadeToken += 1;
        this.music.pause();
        this.music.volume = 0;
        return;
      }
      this.fadeMusic(0, 650, { pauseAfter: true });
    }

    duckMusic(duration = 850) {
      if (this.music.paused) return;
      this.clearMusicDuck();
      const target = audioPrefs.musicVolume / 100;
      this.fadeMusic(Math.min(0.035, target * 0.36), 130);
      this.musicDuckTimer = window.setTimeout(() => {
        this.musicDuckTimer = null;
        if (audioPrefs.enabled && !this.music.paused) this.fadeMusic(target, 420);
      }, duration);
    }

    dispose() {
      this.stopCrowd(0.08);
      this.stopMusic({ immediate: true });
    }
  }

  const sounds = new UclSoundscape();

  function openMusicDatabase() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("This browser does not support local music storage."));
        return;
      }
      const request = indexedDB.open(MUSIC_DATABASE, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(MUSIC_STORE)) request.result.createObjectStore(MUSIC_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Music storage could not be opened."));
    });
  }

  async function musicTransaction(mode, action) {
    const database = await openMusicDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(MUSIC_STORE, mode);
      const store = transaction.objectStore(MUSIC_STORE);
      let request;
      try {
        request = action(store);
      } catch (error) {
        database.close();
        reject(error);
        return;
      }
      transaction.oncomplete = () => {
        database.close();
        resolve(request?.result ?? null);
      };
      transaction.onerror = () => {
        const error = transaction.error || new Error("The music addon could not be saved.");
        database.close();
        reject(error);
      };
    });
  }

  async function ensureMusicLoaded() {
    if (musicLoadPromise) return musicLoadPromise;
    musicLoadPromise = (async () => {
      try {
        customMusicRecord = await musicTransaction("readonly", (store) => store.get(MUSIC_RECORD_KEY));
        if (customMusicRecord?.blob) {
          if (customMusicUrl) URL.revokeObjectURL(customMusicUrl);
          customMusicUrl = URL.createObjectURL(customMusicRecord.blob);
        }
      } catch {
        customMusicRecord = null;
      }
      renderMusicState();
      return customMusicRecord;
    })();
    return musicLoadPromise;
  }

  function activeMusicDetails() {
    if (customMusicRecord?.blob) {
      return {
        name: customMusicRecord.name,
        size: customMusicRecord.size,
        type: "Imported on this device",
      };
    }
    return {
      name: BUNDLED_ADDON.name,
      size: BUNDLED_ADDON.size,
      type: "Bundled UCL music",
    };
  }

  function renderMusicState() {
    const details = activeMusicDetails();
    musicButton?.classList.toggle("is-installed", Boolean(details));
    musicDialog.classList.toggle("has-music", Boolean(details));
    musicStatusTitle.textContent = details ? "Music addon installed" : "No music addon installed";
    musicStatusCopy.textContent = details
      ? "It plays quietly during draws, qualification moments and the final."
      : "The simulator stays silent apart from built-in crowd ambience and effects.";
    musicFileName.textContent = details?.name || "Choose your own soundtrack";
    musicFileMeta.textContent = details ? `${details.type} · ${formatBytes(details.size)}` : "Stored only on this device";
    removeMusicButton.hidden = !customMusicRecord?.blob;
    musicVolume.value = String(audioPrefs.musicVolume);
    musicVolumeLabel.textContent = `${audioPrefs.musicVolume}% · ${audioPrefs.musicVolume <= 12 ? "Quiet" : audioPrefs.musicVolume <= 18 ? "Low" : "Moderate"}`;
    const soundLabel = audioPrefs.enabled ? "Sound on" : "Sound off";
    soundButton?.setAttribute("aria-pressed", String(audioPrefs.enabled));
    soundButton?.setAttribute("aria-label", soundLabel);
    if (soundButton) soundButton.title = soundLabel;
    const soundButtonLabel = soundButton?.querySelector("span:last-child");
    if (soundButtonLabel) soundButtonLabel.textContent = soundLabel;
    fastModeButton?.setAttribute("aria-pressed", String(audioPrefs.fastMode));
    document.body.classList.toggle("ucl-fast-mode", audioPrefs.fastMode);
  }

  async function importMusicFile(file) {
    if (!file) return;
    const extensionOk = file.name.toLowerCase().endsWith(".mp3");
    if (!extensionOk) {
      musicMessage.textContent = "Choose an .mp3 audio file.";
      return;
    }
    if (file.size <= 0 || file.size > MAX_MUSIC_BYTES) {
      musicMessage.textContent = "The addon must be an .mp3 smaller than 25 MB.";
      return;
    }
    musicMessage.textContent = "Installing music addon…";
    try {
      const record = {
        id: MUSIC_RECORD_KEY,
        name: file.name.replace(/\.mp3$/i, ""),
        size: file.size,
        type: file.type || "audio/mpeg",
        installedAt: new Date().toISOString(),
        blob: file,
      };
      await musicTransaction("readwrite", (store) => store.put(record));
      customMusicRecord = record;
      if (customMusicUrl) URL.revokeObjectURL(customMusicUrl);
      customMusicUrl = URL.createObjectURL(file);
      sounds.musicSourceKey = null;
      saveAudioPrefs();
      renderMusicState();
      musicMessage.textContent = "Installed. Playback is capped at a quiet level.";
      showToastMessage("UCL music addon installed on this device.");
    } catch (error) {
      musicMessage.textContent = error.message || "The music addon could not be installed.";
    } finally {
      musicFileInput.value = "";
    }
  }

  async function removeMusicAddon() {
    sounds.stopMusic({ immediate: true });
    try {
      await musicTransaction("readwrite", (store) => store.delete(MUSIC_RECORD_KEY));
    } catch {
      // Removing the in-memory source still takes effect for this page.
    }
    customMusicRecord = null;
    if (customMusicUrl) URL.revokeObjectURL(customMusicUrl);
    customMusicUrl = null;
    sounds.musicSourceKey = null;
    saveAudioPrefs();
    renderMusicState();
    musicMessage.textContent = "Imported music removed. The bundled UCL music has been restored.";
  }

  function syncMenuState() {
    const hasSeason = Engine.validSeason(season);
    startButton.textContent = "Coming soon";
    startButton.disabled = true;
    startButton.setAttribute("aria-disabled", "true");
    menuRestartButton.hidden = true;
    menuCard?.classList.toggle("is-season-started", hasSeason);
    const picker = $("#uclTeamPickerButton");
    if (picker) {
      picker.disabled = hasSeason;
      picker.title = hasSeason ? "Restart the competition before changing clubs." : "";
    }
    window.dispatchEvent(new CustomEvent("ucl-season-state", {
      detail: { started: hasSeason, teamId: season?.managedTeamId || null },
    }));
  }

  function renderTeamTable({ limit = 36, compact = false } = {}) {
    const rows = Engine.leagueTable(season).slice(0, limit);
    return `
      <div class="ucl-table-wrap">
        <table class="ucl-table${compact ? " is-compact" : ""}">
          <thead><tr><th>Pos</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead>
          <tbody>
            ${rows.map((row) => {
              const zone = row.position <= 8 ? "direct" : row.position <= 24 ? "playoff" : "out";
              const divider = row.position === 9 || row.position === 25 ? " zone-divider" : "";
              const managed = row.team.id === season.managedTeamId ? " is-managed" : "";
              return `
                <tr class="${managed}${divider}" data-ucl-table-team="${row.team.id}" data-zone="${zone}">
                  <td>${row.position}</td>
                  <td><span class="ucl-table-club">${teamMark(row.team)}<strong>${escapeHtml(row.team.name)}</strong></span></td>
                  <td>${row.played}</td><td>${row.won}</td><td>${row.drawn}</td><td>${row.lost}</td>
                  <td>${row.gd > 0 ? "+" : ""}${row.gd}</td><td class="ucl-table-points">${row.points}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="ucl-table-legend"><span>Direct to round of 16</span><span>Knockout play-offs</span><span>Eliminated</span></div>
    `;
  }

  function fixtureRow(match, roundIndex, { showMatchday = true } = {}) {
    const home = Engine.team(match.homeId);
    const away = Engine.team(match.awayId);
    const managed = season.managedTeamId && [match.homeId, match.awayId].includes(season.managedTeamId);
    const result = match.result?.revealed ? `<span class="ucl-score">${match.result.home}–${match.result.away}</span>` : '<span class="ucl-kickoff">20:00</span>';
    const viewable = Boolean(match.result?.revealed);
    const viewAttributes = viewable
      ? ` data-ucl-fixture-round="${roundIndex}" data-ucl-fixture-id="${escapeHtml(match.id)}" role="button" tabindex="0" aria-label="View ${escapeHtml(home.name)} against ${escapeHtml(away.name)} result"`
      : "";
    return `
      <article class="ucl-fixture-row${managed ? " is-managed" : ""}${showMatchday ? "" : " is-no-matchday"}${viewable ? " is-viewable" : ""}"${viewAttributes}>
        ${showMatchday ? `<span class="ucl-fixture-md"><b>MD ${roundIndex + 1}</b><small>${escapeHtml(Engine.MATCHDAY_DATES[roundIndex].split(" ").slice(-2).join(" "))}</small></span>` : ""}
        <span class="ucl-fixture-team">${teamMark(home)}<strong>${escapeHtml(home.name)}</strong></span>
        ${result}
        <span class="ucl-fixture-team is-away">${teamMark(away)}<strong>${escapeHtml(away.name)}</strong></span>
      </article>
    `;
  }

  function managedOpponentMarkup() {
    const fixtures = Engine.managedFixtures(season);
    return fixtures.map((match) => {
      const isHome = match.homeId === season.managedTeamId;
      const opponent = Engine.team(isHome ? match.awayId : match.homeId);
      const played = Boolean(match.result?.revealed);
      const managedGoals = played ? Number(isHome ? match.result.home : match.result.away) : 0;
      const opponentGoals = played ? Number(isHome ? match.result.away : match.result.home) : 0;
      const resultTone = !played
        ? ""
        : managedGoals > opponentGoals
          ? "is-win"
          : managedGoals < opponentGoals
            ? "is-loss"
            : "is-draw";
      const score = played
        ? `${isHome ? match.result.home : match.result.away}–${isHome ? match.result.away : match.result.home}`
        : "";
      return `
        <article class="ucl-opponent-card">
          <span class="ucl-opponent-number">MD ${match.roundIndex + 1}</span>
          ${teamMark(opponent, "medium")}
          <span class="ucl-opponent-copy">
            <strong>${escapeHtml(opponent.name)}</strong>
            <small class="ucl-opponent-venue-label">${isHome ? "HOME" : "AWAY"}</small>
          </span>
          ${played ? `<span class="ucl-opponent-score ${resultTone}">${escapeHtml(score)}</span>` : ""}
        </article>
      `;
    }).join("");
  }

  function renderLeagueOverview() {
    const roundIndex = Math.min(7, season.activeMatchday);
    const round = season.league[roundIndex];
    const teamMode = Boolean(season.managedTeamId);
    return `
      <div class="ucl-overview-grid${teamMode ? " has-golden-boot" : ""}">
        <section class="ucl-panel">
          <header>
            <div>${teamMode ? "<h2>Your opponents</h2>" : `<span class="ucl-panel-kicker">MATCHDAY ${roundIndex + 1}</span><h2>League phase fixtures</h2>`}</div>
            ${teamMode ? "" : `<button type="button" data-ucl-open-view="fixtures">All 18 matches</button>`}
          </header>
          <div class="${teamMode ? "ucl-opponent-list" : "ucl-fixture-list"}">
            ${teamMode ? managedOpponentMarkup() : round.slice(0, 8).map((match) => fixtureRow(match, roundIndex, { showMatchday: false })).join("")}
          </div>
          ${teamMode ? "" : '<footer class="ucl-panel-footer"><button type="button" data-ucl-open-view="fixtures">View the full matchday &rarr;</button></footer>'}
        </section>
        ${teamMode ? uclGoldenBootMarkup(10, "overview") : ""}
        <section class="ucl-panel">
          <header><div><h2>League phase table</h2></div><button type="button" data-ucl-open-view="table">Full table</button></header>
          ${renderTeamTable({ limit: 12, compact: true })}
        </section>
      </div>
    `;
  }

  function renderPostLeagueOverview() {
    if (season.phase === "complete" && season.championId) {
      const champion = Engine.team(season.championId);
      return `
        <section class="ucl-panel ucl-champion-overview">
          <article class="ucl-champion-card is-embedded" aria-labelledby="uclEmbeddedChampionName">
            <span class="ucl-champion-kicker">2026/27 CHAMPIONS OF EUROPE</span>
            <div class="ucl-trophy" aria-hidden="true">
              <svg viewBox="0 0 180 250" focusable="false">
                <path d="M53 20h74v34c0 44-13 78-37 88-24-10-37-44-37-88V20Z" />
                <path d="M53 39H24c0 43 15 70 47 78M127 39h29c0 43-15 70-47 78" />
                <path d="M90 141v53M62 220h56M72 194h36l10 26H62l10-26Z" />
              </svg>
            </div>
            <div class="ucl-champion-badge">${teamMark(champion, "large", { eager: true })}</div>
            <h1 id="uclEmbeddedChampionName">${escapeHtml(champion.name)}</h1>
            <p>${escapeHtml(championDetailCopy())}</p>
            <div class="ucl-champion-actions">
              <button class="ucl-primary-action" type="button" data-ucl-champion-action="share">Share image</button>
              <button class="ucl-secondary-action" type="button" data-ucl-champion-action="bracket">View the bracket</button>
            </div>
          </article>
        </section>
      `;
    }
    const table = Engine.leagueTable(season);
    const managedStatus = season.managedTeamId ? Engine.qualificationStatus(season, season.managedTeamId) : null;
    const current = currentKnockoutRound();
    return `
      <div class="ucl-overview-grid">
        <section class="ucl-panel">
          <header><div><span class="ucl-panel-kicker">LEAGUE PHASE COMPLETE</span><h2>${managedStatus ? `${ordinal(managedStatus.position)} · ${managedStatus.label}` : "The knockout field"}</h2></div></header>
          <div class="ucl-opponent-list">
            ${table.slice(0, 8).map((row) => `
              <article class="ucl-opponent-card">
                <span class="ucl-opponent-number">${row.position}</span>${teamMark(row.team, "medium")}
                <span class="ucl-opponent-copy"><strong>${escapeHtml(row.team.name)}</strong><small>${row.points} pts · ${row.gd >= 0 ? "+" : ""}${row.gd} GD</small></span>
                <span class="ucl-opponent-venue">R16</span>
              </article>
            `).join("")}
          </div>
          <footer class="ucl-panel-footer"><button type="button" data-ucl-open-view="table">View final league table &rarr;</button></footer>
        </section>
        <section class="ucl-panel">
          <header><div><span class="ucl-panel-kicker">NEXT UP</span><h2>${escapeHtml(current?.label || "Knockout phase")}</h2></div></header>
          <div class="ucl-empty-state" style="min-height: 330px; border: 0; border-radius: 0;">
            <div><img src="./assets/ucl-starball-white.png" alt="" /><h2>${current?.drawComplete ? "The ties are set" : "A new draw awaits"}</h2><p>${current?.drawComplete ? "Open the knockout bracket, then reveal every aggregate score." : "The smaller knockout draw pairs the surviving clubs before the next round begins."}</p><button class="ucl-primary-action" type="button" data-ucl-open-view="knockout">Open knockouts</button></div>
          </div>
        </section>
      </div>
    `;
  }

  function renderOverview() {
    content.innerHTML = season.phase === "league" ? renderLeagueOverview() : renderPostLeagueOverview();
  }

  function renderFixtures() {
    const roundIndex = Math.max(0, Math.min(7, Number(season.viewMatchday) || 0));
    content.innerHTML = `
      <div class="ucl-matchday-toolbar is-controls-only">
        <div class="ucl-matchday-nav"><button type="button" data-ucl-matchday="-1" ${roundIndex === 0 ? "disabled" : ""} aria-label="Previous matchday">&larr;</button><button type="button" data-ucl-matchday="1" ${roundIndex === 7 ? "disabled" : ""} aria-label="Next matchday">&rarr;</button></div>
      </div>
      <section class="ucl-panel"><div class="ucl-fixture-list ucl-fixture-grid">${season.league[roundIndex].map((match) => fixtureRow(match, roundIndex, { showMatchday: false })).join("")}</div></section>
    `;
  }

  function renderTable() {
    content.innerHTML = `<section class="ucl-panel"><header><div><h2>League phase standings</h2></div></header>${renderTeamTable()}</section>`;
  }

  function knockoutTieAggregateScore(tie, side) {
    if (tie?.result) return side === "a" ? tie.result.aggregateA : tie.result.aggregateB;
    const teamId = side === "a" ? tie?.teamAId : tie?.teamBId;
    return (tie?.playedLegs || []).reduce((total, leg) => total + (
      leg.homeId === teamId ? Number(leg.home) || 0 : Number(leg.away) || 0
    ), 0);
  }

  function managedKnockoutTie(round = currentKnockoutRound()) {
    if (!round || !season?.managedTeamId) return null;
    return round.ties.find((tie) => [tie.teamAId, tie.teamBId].includes(season.managedTeamId)) || null;
  }

  function knockoutTiePlayable(roundKey, tie) {
    const round = season?.knockout?.rounds?.[roundKey];
    return Boolean(
      season?.managedTeamId
      && round
      && round.drawComplete
      && !round.complete
      && !revealRun
      && tie
      && [tie.teamAId, tie.teamBId].includes(season.managedTeamId)
      && !tie.result,
    );
  }

  function bracketTeamMarkup(teamId, tie, side) {
    const team = Engine.team(teamId);
    const won = tie.winnerId === teamId;
    const score = tie.result || tie.playedLegs?.length
      ? knockoutTieAggregateScore(tie, side)
      : "–";
    return `<div class="ucl-bracket-team${won ? " is-winner" : ""}">${teamMark(team)}<strong>${escapeHtml(team.name)}</strong><b>${score}</b></div>`;
  }

  function penaltyAdvancementNote(tie) {
    const penalties = tie?.result?.penalties;
    const winner = Engine.team(tie?.winnerId);
    if (!penalties || !winner) return "Decided on penalties";
    const teamAScore = Number(penalties.teamA ?? penalties.home);
    const teamBScore = Number(penalties.teamB ?? penalties.away);
    if (!Number.isFinite(teamAScore) || !Number.isFinite(teamBScore)) return `${winner.name} through on pens`;
    const winnerIsTeamA = tie.winnerId === tie.teamAId;
    const winnerScore = winnerIsTeamA ? teamAScore : teamBScore;
    const loserScore = winnerIsTeamA ? teamBScore : teamAScore;
    return `${winner.name} through on pens ${winnerScore}–${loserScore}`;
  }

  function bracketTieMarkup(tie, roundKey) {
    if (!tie) return '<article class="ucl-bracket-tie"><div class="ucl-bracket-team"><span></span><strong>To be drawn</strong><b>–</b></div><div class="ucl-bracket-team"><span></span><strong>To be drawn</strong><b>–</b></div></article>';
    const partial = !tie.result && (tie.playedLegs?.length || 0) > 0;
    const visible = Boolean(tie.result && (tie.revealed || season.phase === "complete")) || partial;
    const displayTie = visible ? tie : { ...tie, result: null, winnerId: null, playedLegs: [] };
    const note = visible && tie.result
      ? tie.result.decidedBy === "penalties" ? penaltyAdvancementNote(tie) : tie.result.decidedBy === "extra time" ? "Decided after extra time" : tie.result.legs.length === 2 ? "Aggregate score" : "Full time"
      : partial
        ? `Leg ${tie.playedLegs.length} complete · ${tie.playedLegs.length === 1 ? "second leg ready" : "tie ready"}`
      : tie.teamAId ? "Tie ready" : "Awaiting draw";
    const playable = knockoutTiePlayable(roundKey, tie);
    const attributes = playable
      ? ` data-ucl-knockout-tie="${escapeHtml(tie.id)}" data-ucl-knockout-round="${escapeHtml(roundKey)}" role="button" tabindex="0" aria-label="Play ${escapeHtml(Engine.team(season.managedTeamId)?.name || "your club")} knockout match"`
      : "";
    const classes = [
      "ucl-bracket-tie",
      visible && tie.result ? "is-revealed" : "",
      partial ? "is-partial" : "",
      playable ? "is-playable" : "",
    ].filter(Boolean).join(" ");
    return `<article class="${classes}"${attributes}>${bracketTeamMarkup(tie.teamAId, displayTie, "a")}${bracketTeamMarkup(tie.teamBId, displayTie, "b")}<div class="ucl-bracket-decider">${note}</div></article>`;
  }

  function bracketMarkup() {
    return `
      <div class="ucl-bracket-shell"><div class="ucl-bracket">
        ${Engine.ROUND_CONFIG.map((config) => {
          const round = season.knockout.rounds[config.key];
          const ties = round?.ties || Array.from({ length: config.tieCount }, () => null);
          return `<section class="ucl-bracket-stage"><header><span>${config.key === "final" ? "5 JUN · MADRID" : "KNOCKOUT PHASE"}</span><strong>${escapeHtml(config.shortLabel)}</strong></header><div class="ucl-bracket-ties">${ties.map((tie) => bracketTieMarkup(tie, config.key)).join("")}</div></section>`;
        }).join("")}
      </div></div>
    `;
  }

  function renderKnockout() {
    if (season.phase === "league") {
      content.innerHTML = '<div class="ucl-empty-state"><div><img src="./assets/ucl-starball-white.png" alt="" /><h2>The bracket is waiting</h2><p>Finish all eight league-phase matchdays to reveal the automatic qualifiers, knockout play-off clubs and eliminated teams.</p><button class="ucl-primary-action" type="button" data-ucl-open-view="overview">Return to league phase</button></div></div>';
      return;
    }
    content.innerHTML = `
      ${bracketMarkup()}
    `;
  }

  function animateTableFrom(previousPositions) {
    if (!previousPositions) return;
    const rows = [...content.querySelectorAll("[data-ucl-table-team]")];
    rows.forEach((row) => {
      const previous = previousPositions.get(row.dataset.uclTableTeam);
      const next = Number(row.firstElementChild?.textContent);
      if (!previous || previous === next) return;
      row.style.transition = "none";
      row.style.transform = `translate3d(0, ${(previous - next) * 47}px, 0)`;
      row.style.opacity = "0.74";
    });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      rows.forEach((row) => {
        row.style.removeProperty("transition");
        row.style.transform = "translate3d(0, 0, 0)";
        row.style.opacity = "1";
      });
    }));
  }

  function updateHeader() {
    const completed = completedMatchdays();
    const knockoutRound = currentKnockoutRound();
    const finalComplete = season.phase === "complete";
    const centeredKnockoutRound = Boolean(knockoutRound && !finalComplete);
    actionRow?.classList.toggle("is-league-phase", season.phase === "league");
    actionRow?.classList.toggle("is-fixed-knockout", season.phase !== "league" && centeredKnockoutRound);
    if (season.phase === "league") {
      const index = Math.min(7, season.activeMatchday);
      stageKicker.textContent = "LEAGUE PHASE";
      stageTitle.textContent = `Matchday ${index + 1}`;
      matchdayDate.textContent = Engine.MATCHDAY_DATES[index].toUpperCase();
      progressLabel.textContent = `Matchday ${index + 1}`;
      primaryActionButton.textContent = `${season.managedTeamId ? "Play" : "Simulate"} matchday ${index + 1}`;
      primaryActionButton.disabled = revealRun !== null;
      simulateAllButton.hidden = !season.neutralMode;
      simulateAllButton.disabled = revealRun !== null;
    } else {
      stageKicker.textContent = finalComplete ? "CHAMPIONS OF EUROPE" : "";
      stageTitle.textContent = finalComplete ? Engine.team(season.championId)?.name || "Champions" : knockoutRound?.shortLabel || "Knockouts";
      matchdayDate.textContent = finalComplete ? "5 JUN 2027 · MADRID" : "";
      progressLabel.textContent = finalComplete ? "Competition complete" : "";
      simulateAllButton.hidden = true;
      primaryActionButton.disabled = revealRun !== null;
      const managedTie = managedKnockoutTie(knockoutRound);
      const managedTieReady = Boolean(knockoutRound?.drawComplete && managedTie && !managedTie.result);
      primaryActionButton.textContent = finalComplete
        ? "Show champions"
        : !knockoutRound?.drawComplete
          ? "Begin knockout draw"
          : !knockoutRound?.complete
            ? managedTieReady
              ? managedTie.playedLegs?.length ? "Play second leg" : "Play your match"
              : `Reveal ${knockoutRound.shortLabel.toLowerCase()} scores`
            : "Continue";
    }
  }

  function syncUclUtilityHeader() {
    const sourceButton = document.querySelector("#mainAccountButton");
    const sourceLabel = document.querySelector("#mainAccountLabel");
    if (accountLabel) accountLabel.textContent = sourceLabel?.textContent || "Log in";
    if (accountButton && sourceButton) {
      const label = sourceButton.getAttribute("aria-label") || sourceLabel?.textContent || "Log in";
      accountButton.setAttribute("aria-label", label);
      accountButton.title = sourceButton.title || label;
    }
  }

  function render(previousPositions = null) {
    if (!season) return;
    syncUclUtilityHeader();
    tabs.forEach((tab) => {
      const active = tab.dataset.uclView === activeView;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-current", active ? "page" : "false");
    });
    updateHeader();
    if (activeView === "fixtures") renderFixtures();
    else if (activeView === "table") renderTable();
    else if (activeView === "knockout") renderKnockout();
    else renderOverview();
    animateTableFrom(previousPositions);
  }

  function renderPotBalls(total = 36, drawn = 0) {
    potBalls.innerHTML = Array.from({ length: 36 }, (_, index) => {
      const x = ((index * 67) % 235) - 118;
      const y = 44 + ((index * 41) % 52);
      const z = ((index * 29) % 60) - 30;
      const scale = (0.72 + ((index * 13) % 26) / 100).toFixed(2);
      const lift = 6 + ((index * 17) % 13);
      const drift = ((index * 19) % 17) - 8;
      const duration = 2400 + ((index * 83) % 1200);
      const animationDelay = -((index * 137) % 2800);
      const active = index < total;
      return `<span class="ucl-mini-ball${index < drawn || !active ? " is-drawn" : ""}" style="--ball-x:${x}px;--ball-y:${y}px;--ball-z:${z}px;--ball-scale:${scale};--ball-lift:${lift}px;--ball-drift:${drift}px;--ball-duration:${duration}ms;--ball-delay:${animationDelay}ms;--ball-opacity:${active ? 1 : 0}"></span>`;
    }).join("");
  }

  function drawnTeamChip(team, index, meta = "") {
    return `<article class="ucl-drawn-team">${teamMark(team)}<span><strong>${escapeHtml(team.name)}</strong><small>${escapeHtml(meta || `POS ${String(index + 1).padStart(2, "0")} · POT ${team.pot}`)}</small></span></article>`;
  }

  function setDrawReveal(team, meta) {
    revealMeta.textContent = meta;
    revealName.textContent = team.name;
    revealBadge.innerHTML = teamMark(team, "large", { eager: true });
  }

  function preloadBadge(team) {
    if (!team?.badge) return;
    const image = new Image();
    image.decoding = "async";
    image.src = team.badge;
  }

  function prepareDrawStage({ type, title, kicker, total, drawn = 0 }) {
    const initialStatus = type === "league" ? "The 36-club draw is ready" : "The knockout pots are ready";
    currentDraw = { type, paused: false, statusText: initialStatus };
    drawStage.hidden = false;
    drawStage.classList.toggle("is-knockout", type === "knockout");
    screen.hidden = true;
    drawTitle.textContent = title;
    drawKicker.textContent = kicker;
    drawTotal.textContent = String(total);
    drawCount.textContent = String(drawn);
    drawStatus.textContent = initialStatus;
    updateDrawPauseUi();
    drawnStrip.innerHTML = "";
    ceremonyScene.dataset.phase = "idle";
    revealMeta.textContent = "";
    revealName.textContent = "";
    revealBadge.innerHTML = "";
    renderPotBalls(total, drawn);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function animateDrawItem(team, index, total, token, { meta, knockout = false, opponentDraw = false } = {}) {
    if (token !== animationToken) return false;
    preloadBadge(team);
    setDrawStatus(knockout
      ? `Drawing tie ${Math.ceil((index + 1) / 2)}`
      : opponentDraw
        ? `Revealing opponent ${index + 1} of ${total}`
        : `Drawing league position ${index + 1}`);
    ceremonyScene.dataset.phase = "idle";
    setDrawReveal(team, meta);
    if (!(await drawDelay(motionDuration(knockout ? 180 : 95, 30), token))) return false;
    ceremonyScene.dataset.phase = "selecting";
    if (!(await drawDelay(motionDuration(knockout ? 520 : 320, 45), token))) return false;
    ceremonyScene.dataset.phase = "launching";
    if (!(await drawDelay(motionDuration(knockout ? 900 : 720, 65), token))) return false;
    ceremonyScene.dataset.phase = "bouncing";
    if (!(await drawDelay(motionDuration(knockout ? 680 : 560, 55), token))) return false;
    ceremonyScene.dataset.phase = "revealed";
    const isTopSeed = Engine.TOP_SEED_IDS.includes(team.id);
    const revealPause = (knockout ? 1080 : 820) + (isTopSeed ? 320 : 0) + (index === 0 ? 260 : 0);
    if (!(await drawDelay(motionDuration(revealPause, 55), token))) return false;
    const miniBall = potBalls.children[index];
    miniBall?.classList.add("is-drawn");
    drawCount.textContent = String(index + 1);
    drawnStrip.insertAdjacentHTML("beforeend", drawnTeamChip(team, index, meta));
    drawnStrip.scrollTo({ left: drawnStrip.scrollWidth, behavior: audioPrefs.fastMode ? "auto" : "smooth" });
    if (!(await drawDelay(motionDuration(knockout ? 560 : 420, 120), token))) return false;
    ceremonyScene.dataset.phase = "resetting";
    if (!(await drawDelay(prefersReducedMotion.matches ? 80 : 380, token))) return false;
    revealMeta.textContent = "";
    revealName.textContent = "";
    revealBadge.innerHTML = "";
    return true;
  }

  async function startLeagueDraw() {
    if (!season || season.drawComplete) return;
    abortAnimations();
    const token = animationToken;
    if (season.managedTeamId) {
      const entries = Engine.managedFixtures(season).map((match) => {
        const isHome = match.homeId === season.managedTeamId;
        return {
          teamId: isHome ? match.awayId : match.homeId,
          meta: `MATCHDAY ${match.roundIndex + 1} \u00b7 ${isHome ? "HOME" : "AWAY"}`,
        };
      });
      const drawnCount = Math.min(entries.length, season.drawnCount || 0);
      prepareDrawStage({
        type: "league",
        title: "Your league phase opponents",
        kicker: "TEAM MODE \u00b7 8 OPPONENTS",
        total: entries.length,
        drawn: drawnCount,
      });
      entries.slice(0, drawnCount).forEach((entry, index) => {
        drawnStrip.insertAdjacentHTML("beforeend", drawnTeamChip(Engine.team(entry.teamId), index, entry.meta));
      });
      await sounds.unlock();
      if (token !== animationToken) return;
      sounds.playMusic();
      for (let index = drawnCount; index < entries.length; index += 1) {
        const entry = entries[index];
        const complete = await animateDrawItem(Engine.team(entry.teamId), index, entries.length, token, {
          meta: entry.meta,
          opponentDraw: true,
        });
        if (!complete || token !== animationToken) return;
        season.drawnCount = index + 1;
        saveSeason();
      }
      finishLeagueDraw();
      return;
    }
    prepareDrawStage({ type: "league", title: "The league phase draw", kicker: "2026/27 · 36 CLUBS", total: 36, drawn: season.drawnCount || 0 });
    const alreadyDrawn = season.drawOrder.slice(0, season.drawnCount || 0);
    alreadyDrawn.forEach((teamId, index) => drawnStrip.insertAdjacentHTML("beforeend", drawnTeamChip(Engine.team(teamId), index)));
    await sounds.unlock();
    if (token !== animationToken) return;
    sounds.playMusic();
    for (let index = season.drawnCount || 0; index < season.drawOrder.length; index += 1) {
      const team = Engine.team(season.drawOrder[index]);
      const complete = await animateDrawItem(team, index, 36, token, {
        meta: `POSITION ${String(index + 1).padStart(2, "0")} · POT ${team.pot}`,
      });
      if (!complete || token !== animationToken) return;
      season.drawnCount = index + 1;
      saveSeason();
    }
    finishLeagueDraw();
  }

  function finishLeagueDraw() {
    if (!season) return;
    animationToken += 1;
    season.drawnCount = season.managedTeamId ? 8 : 36;
    season.drawComplete = true;
    saveSeason();
    currentDraw = null;
    updateDrawPauseUi();
    drawStatus.textContent = "League phase draw complete";
    sounds.stopCrowd();
    sounds.stopMusic();
    drawStage.hidden = true;
    screen.hidden = false;
    activeView = season.managedTeamId ? "overview" : "table";
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
    showToastMessage("The Champions League league phase is ready.");
  }

  async function startKnockoutDraw(round = currentKnockoutRound()) {
    if (!round || round.drawComplete) return;
    abortAnimations();
    const token = animationToken;
    const order = round.ties.flatMap((tie) => [tie.teamAId, tie.teamBId]);
    const drawnCount = Math.max(0, Math.min(order.length, round.drawnCount || 0));
    prepareDrawStage({ type: "knockout", title: round.label, kicker: "KNOCKOUT DRAW · LIVE", total: order.length, drawn: drawnCount });
    order.slice(0, drawnCount).forEach((teamId, index) => {
      const tieNumber = Math.floor(index / 2) + 1;
      const side = index % 2 === 0 ? "TEAM A" : "TEAM B";
      drawnStrip.insertAdjacentHTML("beforeend", drawnTeamChip(Engine.team(teamId), index, `TIE ${String(tieNumber).padStart(2, "0")} · ${side}`));
    });
    await sounds.unlock();
    if (token !== animationToken) return;
    sounds.playMusic();
    for (let index = drawnCount; index < order.length; index += 1) {
      const team = Engine.team(order[index]);
      const tieNumber = Math.floor(index / 2) + 1;
      const side = index % 2 === 0 ? "TEAM A" : "TEAM B";
      const complete = await animateDrawItem(team, index, order.length, token, {
        knockout: true,
        meta: `TIE ${String(tieNumber).padStart(2, "0")} · ${side}`,
      });
      if (!complete || token !== animationToken) return;
      round.drawnCount = index + 1;
      saveSeason();
    }
    round.drawnCount = order.length;
    round.drawComplete = true;
    saveSeason();
    animationToken += 1;
    currentDraw = null;
    updateDrawPauseUi();
    sounds.stopCrowd();
    sounds.stopMusic();
    drawStage.hidden = true;
    screen.hidden = false;
    activeView = "knockout";
    render();
    showToastMessage(`${round.shortLabel} draw complete.`);
  }

  function skipCurrentDraw() {
    if (!currentDraw || !season) return;
    if (currentDraw.type === "league") {
      finishLeagueDraw();
      return;
    }
    const round = currentKnockoutRound();
    if (round) {
      round.drawnCount = round.ties.length * 2;
      round.drawComplete = true;
    }
    animationToken += 1;
    currentDraw = null;
    updateDrawPauseUi();
    saveSeason();
    sounds.stopCrowd(0.1);
    sounds.stopMusic({ immediate: true });
    drawStage.hidden = true;
    screen.hidden = false;
    activeView = "knockout";
    render();
  }

  function tablePositionMap() {
    return new Map(Engine.leagueTable(season).map((row) => [row.team.id, row.position]));
  }

  function resultOrder(round) {
    const matches = [...round];
    if (!season.managedTeamId) return matches;
    return matches.sort((left, right) => {
      const leftManaged = [left.homeId, left.awayId].includes(season.managedTeamId);
      const rightManaged = [right.homeId, right.awayId].includes(season.managedTeamId);
      return Number(leftManaged) - Number(rightManaged);
    });
  }

  function resultNote(match, roundIndex) {
    if (match.result.upset) return "UPSET · THE LEAGUE PHASE DELIVERS";
    if ([match.homeId, match.awayId].includes(season.managedTeamId)) return `YOUR RESULT · MATCHDAY ${roundIndex + 1}`;
    if ([match.homeId, match.awayId].some((id) => Engine.TOP_SEED_IDS.includes(id))) return "TOP-SEED RESULT";
    return `FULL TIME · MATCHDAY ${roundIndex + 1}`;
  }

  function showMatchBroadcast(match, roundIndex) {
    const home = Engine.team(match.homeId);
    const away = Engine.team(match.awayId);
    broadcastLayer.innerHTML = `
      <article class="ucl-tv-scorebar">
        <div class="ucl-tv-topline"><span>UEFA CHAMPIONS LEAGUE</span><span>FULL TIME</span></div>
        <div class="ucl-tv-score"><span class="ucl-tv-team">${teamMark(home)}<strong>${escapeHtml(home.name)}</strong></span><b class="ucl-tv-numbers">${match.result.home}–${match.result.away}</b><span class="ucl-tv-team is-away">${teamMark(away)}<strong>${escapeHtml(away.name)}</strong></span></div>
        <div class="ucl-tv-note">${escapeHtml(resultNote(match, roundIndex))}</div>
      </article>
    `;
    const bar = broadcastLayer.firstElementChild;
    requestAnimationFrame(() => bar?.classList.add("is-visible"));
    return bar;
  }

  function showTieBroadcast(tie, round) {
    const teamA = Engine.team(tie.teamAId);
    const teamB = Engine.team(tie.teamBId);
    const result = tie.result;
    const penaltyNote = result.penalties
      ? result.penalties.teamA !== undefined
        ? `${result.penalties.teamA}–${result.penalties.teamB} ON PENALTIES`
        : `${result.penalties.home}–${result.penalties.away} ON PENALTIES`
      : result.decidedBy === "extra time" ? "AFTER EXTRA TIME" : result.legs.length === 2 ? "AGGREGATE" : "FULL TIME";
    broadcastLayer.innerHTML = `
      <article class="ucl-tv-scorebar">
        <div class="ucl-tv-topline"><span>${escapeHtml(round.shortLabel.toUpperCase())}</span><span>${result.legs.length === 2 ? "TIE COMPLETE" : "FINAL"}</span></div>
        <div class="ucl-tv-score"><span class="ucl-tv-team">${teamMark(teamA)}<strong>${escapeHtml(teamA.name)}</strong></span><b class="ucl-tv-numbers">${result.aggregateA}–${result.aggregateB}</b><span class="ucl-tv-team is-away">${teamMark(teamB)}<strong>${escapeHtml(teamB.name)}</strong></span></div>
        <div class="ucl-tv-note">${escapeHtml(result.upset ? `UPSET · ${penaltyNote}` : penaltyNote)}</div>
      </article>
    `;
    const bar = broadcastLayer.firstElementChild;
    requestAnimationFrame(() => bar?.classList.add("is-visible"));
    return bar;
  }

  async function hideBroadcast(bar, token) {
    bar?.classList.add("is-leaving");
    if (!(await delay(motionDuration(270, 25), token))) return false;
    if (broadcastLayer.contains(bar)) broadcastLayer.innerHTML = "";
    return token === animationToken;
  }

  async function revealMatchday(roundIndex, { automatic = false } = {}) {
    if (!season || revealRun || roundIndex >= 8) return false;
    const previousPositions = tablePositionMap();
    const round = Engine.ensureMatchdayResults(season, roundIndex);
    saveSeason();
    const token = animationToken;
    const run = { type: "league", skip: automatic && skipAutomaticReveal, automatic };
    revealRun = run;
    skipRevealsButton.textContent = "Skip result reveals";
    skipRevealsButton.hidden = false;
    updateHeader();
    await sounds.unlock();
    if (token !== animationToken) return false;
    const unrevealed = resultOrder(round).filter((match) => !match.result.revealed);
    for (const match of unrevealed) {
      if (token !== animationToken) return false;
      if (run.skip) {
        Engine.revealMatch(match);
        continue;
      }
      const topSeedResult = [match.homeId, match.awayId].some((id) => Engine.TOP_SEED_IDS.includes(id));
      if (!(await skippableDelay(motionDuration(topSeedResult ? 620 : 260, 25), token, run))) return false;
      if (run.skip) {
        Engine.revealMatch(match);
        continue;
      }
      Engine.revealMatch(match);
      saveSeason();
      const bar = showMatchBroadcast(match, roundIndex);
      const managed = [match.homeId, match.awayId].includes(season.managedTeamId);
      const hold = topSeedResult || managed ? 1120 : 720;
      if (!(await skippableDelay(motionDuration(hold, 45), token, run))) return false;
      if (!(await hideBroadcast(bar, token))) return false;
    }
    if (token !== animationToken) return false;
    round.filter((match) => !match.result.revealed).forEach(Engine.revealMatch);
    Engine.completeMatchday(season, roundIndex);
    saveSeason();
    revealRun = null;
    skipRevealsButton.hidden = true;
    sounds.stopCrowd(0.35);
    activeView = season.managedTeamId ? "overview" : "table";
    render(previousPositions);
    if (season.phase !== "league") {
      if (!(await delay(motionDuration(760, 80), token))) return false;
      showLeaguePhaseMoment();
    }
    return true;
  }

  async function simulateRemainingLeague() {
    if (!season || revealRun || season.phase !== "league") return;
    const batchToken = animationToken;
    skipAutomaticReveal = false;
    for (let roundIndex = season.activeMatchday; roundIndex < 8 && season.phase === "league"; roundIndex += 1) {
      const complete = await revealMatchday(roundIndex, { automatic: true });
      if (!complete || batchToken !== animationToken) {
        skipAutomaticReveal = false;
        return;
      }
      if (season.phase === "league" && !(await delay(motionDuration(820, 60), batchToken))) {
        skipAutomaticReveal = false;
        return;
      }
    }
    skipAutomaticReveal = false;
  }

  function showLeaguePhaseMoment() {
    if (!season?.managedTeamId || season.moments?.leagueShown) return;
    const team = Engine.team(season.managedTeamId);
    const status = Engine.qualificationStatus(season, team.id);
    season.moments ||= {};
    season.moments.leagueShown = true;
    saveSeason();
    const eliminated = status.key === "eliminated";
    momentCard.className = `ucl-moment-card${eliminated ? " is-eliminated" : ""}`;
    momentCard.innerHTML = `
      ${teamMark(team, "large", { eager: true })}
      <span>${eliminated ? "LEAGUE PHASE COMPLETE" : "THE JOURNEY CONTINUES"}</span>
      <h1 id="uclMomentTitle">${escapeHtml(status.label)}</h1>
      <div class="ucl-moment-position">${ordinal(status.position)} PLACE · ${Engine.leagueTable(season).find((row) => row.team.id === team.id)?.points || 0} PTS</div>
      <p>${eliminated ? `${team.name} finish outside the top 24 and leave the competition.` : status.key === "qualified" ? `${team.name} finish in the top eight and advance directly to the round of 16.` : `${team.name} finish between ninth and 24th and enter the knockout phase play-offs.`}</p>
      <button class="ucl-primary-action" type="button" data-ucl-moment-action="continue">${eliminated ? "Watch the knockouts" : "Continue to the knockout draw"}</button>
    `;
    momentOverlay.hidden = false;
    sounds.playMusic();
  }

  function maybeShowManagedKnockoutExit(round) {
    if (!season.managedTeamId || !roundContainsManagedTeam(round)) return;
    const tie = round.ties.find((candidate) => [candidate.teamAId, candidate.teamBId].includes(season.managedTeamId));
    if (!tie || tie.winnerId === season.managedTeamId) return;
    season.moments ||= {};
    const key = `exit:${round.key}`;
    if (season.moments[key]) return;
    season.moments[key] = true;
    saveSeason();
    const team = Engine.team(season.managedTeamId);
    momentCard.className = "ucl-moment-card is-eliminated";
    momentCard.innerHTML = `
      ${teamMark(team, "large", { eager: true })}<span>${escapeHtml(round.shortLabel.toUpperCase())}</span>
      <h1 id="uclMomentTitle">The journey ends</h1>
      <p>${escapeHtml(team.name)} are eliminated by ${escapeHtml(Engine.team(tie.winnerId).name)}. The rest of the road to Madrid can still be simulated.</p>
      <button class="ucl-primary-action" type="button" data-ucl-moment-action="continue">Continue the tournament</button>
    `;
    momentOverlay.hidden = false;
  }

  async function revealKnockoutRound(round = currentKnockoutRound()) {
    if (!round || !round.drawComplete || round.complete || revealRun) return;
    const managedTie = managedKnockoutTie(round);
    const holdManagedTie = Boolean(managedTie && !managedTie.result);
    Engine.ensureKnockoutResults(season, round.key, {
      excludeIds: holdManagedTie ? [managedTie.id] : [],
    });
    saveSeason();
    const token = animationToken;
    const run = { type: "knockout", skip: false };
    revealRun = run;
    skipRevealsButton.textContent = "Skip result reveals";
    skipRevealsButton.hidden = false;
    updateHeader();
    await sounds.unlock();
    if (token !== animationToken) return;
    if (round.key === "final") {
      sounds.playMusic();
      if (!(await skippableDelay(motionDuration(1750, 120), token, run))) return;
    }
    broadcastLayer.innerHTML = "";
    for (const tie of round.ties.filter((candidate) => candidate.result && !candidate.revealed)) {
      if (token !== animationToken) return;
      if (run.skip) {
        tie.revealed = true;
        continue;
      }
      const topSeed = [tie.teamAId, tie.teamBId].some((id) => Engine.TOP_SEED_IDS.includes(id));
      const progressiveDelay = round.key === "quarter-finals" ? 480 : round.key === "semi-finals" ? 720 : round.key === "final" ? 1100 : 280;
      if (!(await skippableDelay(motionDuration(progressiveDelay + (topSeed ? 260 : 0), 35), token, run))) return;
      if (run.skip) {
        tie.revealed = true;
        continue;
      }
      tie.revealed = true;
      saveSeason();
      activeView = "knockout";
      render();
      const hold = round.key === "final" ? 2100 : round.key === "semi-finals" ? 1450 : round.key === "quarter-finals" ? 1180 : 880;
      if (!(await skippableDelay(motionDuration(hold, 55), token, run))) return;
    }
    if (token !== animationToken) return;
    round.ties.filter((tie) => tie.result).forEach((tie) => { tie.revealed = true; });
    if (!round.ties.every((tie) => tie.result && tie.winnerId)) {
      saveSeason();
      revealRun = null;
      skipRevealsButton.hidden = true;
      sounds.stopCrowd(0.4);
      sounds.stopMusic();
      activeView = "knockout";
      render();
      if (holdManagedTie) showToastMessage("The other ties are revealed. Play your knockout match from the bracket.");
      return;
    }
    Engine.completeKnockoutRound(season, round.key);
    saveSeason();
    revealRun = null;
    skipRevealsButton.hidden = true;
    sounds.stopCrowd(0.4);
    sounds.stopMusic();
    activeView = "knockout";
    render();
    if (round.key === "final") {
      if (!(await delay(motionDuration(650, 80), token))) return;
      showChampionMoment();
    } else {
      maybeShowManagedKnockoutExit(round);
    }
  }

  function createConfetti() {
    const colors = ["#f1d178", "#ffffff", "#557df0", "#89a7ff", "#dce5ff"];
    confetti.innerHTML = Array.from({ length: 54 }, (_, index) => {
      const left = (index * 37) % 100;
      const width = 5 + (index * 7) % 7;
      const height = 8 + (index * 11) % 13;
      const duration = 3.2 + ((index * 13) % 23) / 10;
      const delayValue = -((index * 17) % 50) / 10;
      const drift = ((index * 29) % 120) - 60;
      return `<span style="--confetti-left:${left}%;--confetti-width:${width}px;--confetti-height:${height}px;--confetti-color:${colors[index % colors.length]};--confetti-duration:${duration}s;--confetti-delay:${delayValue}s;--confetti-drift:${drift}px;--confetti-rotation:${(index * 47) % 360}deg"></span>`;
    }).join("");
  }

  function showChampionMoment() {
    const champion = Engine.team(season?.championId);
    if (!champion) return;
    championBadge.innerHTML = teamMark(champion, "large", { eager: true });
    championName.textContent = champion.name;
    championDetail.textContent = championDetailCopy();
    createConfetti();
    championOverlay.hidden = false;
    sounds.playMusic();
  }

  function championDetailCopy() {
    const finalTie = season?.knockout?.rounds?.final?.ties?.[0];
    return finalTie?.result?.decidedBy === "penalties"
      ? "Champions of Europe after a final decided on penalties."
      : "The road to Madrid is complete. Champions of Europe.";
  }

  function uclChampionSnapshotSummary() {
    const champion = Engine.team(season?.championId);
    const scorerRows = uclGoldenBootRows(500);
    const scorerByPlayer = new Map(scorerRows.map((row) => [`${row.teamId}:${row.name}`, row.goals]));
    const awardRows = season.leagueTeamIds.flatMap((teamId) => {
      const team = Engine.team(teamId);
      const players = typeof UCL_FC27_SQUADS !== "undefined" ? UCL_FC27_SQUADS[teamId]?.players || [] : [];
      return players.filter((player) => player.position !== "GK").map((player) => ({
        player: player.name,
        team,
        goals: scorerByPlayer.get(`${teamId}:${player.name}`) || 0,
        overall: Number(player.overall) || 0,
        young: UCL_YOUNG_PLAYER_NAMES.has(player.name),
        awardScore: (scorerByPlayer.get(`${teamId}:${player.name}`) || 0) * 25
          + (Number(player.overall) || 0)
          + (teamId === champion?.id ? 8 : 0),
      }));
    });
    const byAwardScore = (left, right) => right.awardScore - left.awardScore
      || right.goals - left.goals
      || right.overall - left.overall
      || left.player.localeCompare(right.player);
    const playerOfTheSeason = awardRows.slice().sort(byAwardScore)[0] || null;
    const youngPlayerOfTheSeason = awardRows.filter((row) => row.young).sort(byAwardScore)[0] || null;
    const topScorerRow = scorerRows[0] || null;
    return {
      champion,
      playerOfTheSeason,
      youngPlayerOfTheSeason,
      topScorer: topScorerRow ? {
        player: topScorerRow.name,
        goals: topScorerRow.goals,
        team: Engine.team(topScorerRow.teamId),
      } : null,
    };
  }

  function handleKnockoutAction() {
    if (season.phase === "complete") {
      showChampionMoment();
      return;
    }
    const round = currentKnockoutRound();
    if (!round) return;
    if (!round.drawComplete) startKnockoutDraw(round);
    else if (!round.complete) {
      const managedTie = managedKnockoutTie(round);
      if (knockoutTiePlayable(round.key, managedTie)) openManagedKnockoutMatch(round.key, managedTie.id);
      else revealKnockoutRound(round);
    }
  }

  async function openSimulator({ updateUrl = true } = {}) {
    if (!season) {
      season = newSeason();
      saveSeason();
    }
    if (typeof window.closeOpenDialogsAndMenus === "function") window.closeOpenDialogsAndMenus();
    appShell.hidden = true;
    screen.hidden = false;
    document.body.classList.add("ucl-simulator-open");
    if (typeof window.currentAppMode === "function" && typeof window.setAppModeUrl === "function" && updateUrl && window.currentAppMode() !== "ucl") {
      window.setAppModeUrl("ucl");
    }
    activeView = season.phase === "league"
      ? (season.managedTeamId ? "overview" : "table")
      : "knockout";
    render();
    document.documentElement.classList.remove("route-ucl-loading");
    window.scrollTo({ top: 0, behavior: "auto" });
    const openToken = animationToken;
    await ensureMusicLoaded();
    if (openToken !== animationToken || screen.hidden || !document.body.classList.contains("ucl-simulator-open")) return;
    await sounds.unlock();
    if (openToken !== animationToken || screen.hidden || !document.body.classList.contains("ucl-simulator-open")) return;
    if (!season.drawComplete) startLeagueDraw();
    else if (season.phase === "complete" && season.championId) showChampionMoment();
  }

  function closeSimulator({ updateUrl = true } = {}) {
    abortAnimations();
    sounds.dispose();
    drawStage.hidden = true;
    momentOverlay.hidden = true;
    championOverlay.hidden = true;
    screen.hidden = true;
    appShell.hidden = false;
    document.body.classList.remove("ucl-simulator-open");
    document.documentElement.classList.remove("route-ucl-loading");
    if (updateUrl && typeof window.currentAppMode === "function" && typeof window.setAppModeUrl === "function" && window.currentAppMode() === "ucl") {
      window.setAppModeUrl("home");
    }
    syncMenuState();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function restartCompetition({ fromMenu = false } = {}) {
    abortAnimations();
    sounds.dispose();
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Ignore unavailable storage. */ }
    season = null;
    activeView = "overview";
    momentOverlay.hidden = true;
    championOverlay.hidden = true;
    drawStage.hidden = true;
    syncMenuState();
    if (fromMenu) {
      showToastMessage("Champions League progress cleared. Choose a club and begin a new draw.");
      return;
    }
    season = newSeason();
    saveSeason();
    screen.hidden = false;
    render();
    startLeagueDraw();
  }

  startButton.addEventListener("click", () => openSimulator());
  settingsButton?.addEventListener("click", () => document.querySelector("#settingsButton")?.click());
  backButton?.addEventListener("click", () => closeSimulator());
  feedbackButton?.addEventListener("click", () => document.querySelector("#bugReportButton")?.click());
  achievementsButton?.addEventListener("click", () => window.AccountAchievements?.openRetroModal("ucl"));
  donateButton?.addEventListener("click", () => document.querySelector("#donateButton")?.click());
  accountButton?.addEventListener("click", () => document.querySelector("#mainAccountButton")?.click());
  restartButton?.addEventListener("click", () => {
    restartFromMenu = false;
    restartModal?.showModal();
  });
  menuRestartButton?.addEventListener("click", () => {
    restartFromMenu = true;
    restartModal?.showModal();
  });
  confirmRestartButton?.addEventListener("click", () => {
    const fromMenu = restartFromMenu;
    restartFromMenu = false;
    window.setTimeout(() => restartCompetition({ fromMenu }), 0);
  });
  pauseDrawButton?.addEventListener("click", toggleDrawPause);
  skipDrawButton?.addEventListener("click", skipCurrentDraw);
  document.addEventListener("keydown", (event) => {
    if (event.code !== "Space" || event.repeat || event.defaultPrevented || !currentDraw || drawStage.hidden) return;
    const target = event.target;
    const tagName = String(target?.tagName || "").toUpperCase();
    if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tagName)) return;
    event.preventDefault();
    toggleDrawPause();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.repeat || event.defaultPrevented || screen.hidden) return;
    const target = event.target;
    const tagName = String(target?.tagName || "").toUpperCase();
    if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(tagName)) return;
    if (activeView === "overview" && season?.phase === "league" && season?.managedTeamId && !primaryActionButton?.disabled) {
      event.preventDefault();
      openManagedMatchday();
      return;
    }
    if (activeView === "knockout" && season?.phase !== "league" && !primaryActionButton?.disabled && !revealRun) {
      event.preventDefault();
      handleKnockoutAction();
    }
  });
  skipRevealsButton?.addEventListener("click", () => {
    if (revealRun) {
      revealRun.skip = true;
      if (revealRun.automatic) skipAutomaticReveal = true;
    }
    broadcastLayer.firstElementChild?.classList.add("is-leaving");
    skipRevealsButton.textContent = "Skipping…";
  });

  window.UclSeason = {
    achievementState,
    saveEngineState(candidate) {
      if (!candidate?.uclSeason) return;
      season = candidate;
      saveSeason();
      renderEngineTable();
    },
    syncEngineProgress() {
      if (!season) return;
      saveSeason();
      renderEngineTable();
    },
    renderEngineTable,
    returnToSimulator,
    finishManagedMatchday,
    finishManagedKnockoutMatch,
    returnToManagedMatchday,
    openManagedKnockoutMatch,
  };

  liveBackButton?.addEventListener("click", () => returnToSimulator());
  engineFullTableButton?.addEventListener("click", () => returnToSimulator({ view: "table" }));

  primaryActionButton?.addEventListener("click", () => {
    sounds.unlock();
    if (season.phase === "league" && season.managedTeamId) openManagedMatchday();
    else if (season.phase === "league") revealMatchday(season.activeMatchday);
    else handleKnockoutAction();
  });
  simulateAllButton?.addEventListener("click", () => {
    sounds.unlock();
    simulateRemainingLeague();
  });

  tabs.forEach((tab) => tab.addEventListener("click", () => {
    activeView = tab.dataset.uclView;
    render();
  }));

  content.addEventListener("click", (event) => {
    const championAction = event.target.closest("[data-ucl-champion-action]")?.dataset.uclChampionAction;
    if (championAction === "share") {
      window.openUclSeasonSnapshotModal?.(uclChampionSnapshotSummary(), event.target.closest("button"));
      return;
    }
    if (championAction === "bracket") {
      activeView = "knockout";
      render();
      return;
    }
    const openView = event.target.closest("[data-ucl-open-view]")?.dataset.uclOpenView;
    if (openView) {
      activeView = openView;
      render();
      return;
    }
    const matchdayButton = event.target.closest("[data-ucl-matchday]");
    if (matchdayButton && !matchdayButton.disabled) {
      season.viewMatchday = Math.max(0, Math.min(7, Number(season.viewMatchday || 0) + Number(matchdayButton.dataset.uclMatchday)));
      saveSeason();
      renderFixtures();
      return;
    }
    const fixture = event.target.closest("[data-ucl-fixture-id]");
    if (fixture) {
      openLeagueFixtureResult(fixture.dataset.uclFixtureRound, fixture.dataset.uclFixtureId);
      return;
    }
    const knockoutTie = event.target.closest("[data-ucl-knockout-tie]");
    if (knockoutTie) {
      openManagedKnockoutMatch(knockoutTie.dataset.uclKnockoutRound, knockoutTie.dataset.uclKnockoutTie);
      return;
    }
    if (event.target.closest("[data-ucl-knockout-simulate-others]")) {
      revealKnockoutRound();
      return;
    }
    if (event.target.closest("[data-ucl-knockout-action]")) handleKnockoutAction();
  });

  content.addEventListener("keydown", (event) => {
    if (!event.target.closest("[data-ucl-fixture-id]") || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    event.target.closest("[data-ucl-fixture-id]").click();
  });

  momentOverlay.addEventListener("click", (event) => {
    if (!event.target.closest("[data-ucl-moment-action]")) return;
    momentOverlay.hidden = true;
    sounds.stopMusic();
    activeView = "knockout";
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  championBracketButton?.addEventListener("click", () => {
    championOverlay.hidden = true;
    sounds.stopMusic();
    activeView = "knockout";
    render();
  });
  championShareButton?.addEventListener("click", () => {
    window.openUclSeasonSnapshotModal?.(uclChampionSnapshotSummary(), championShareButton);
  });
  championRestartButton?.addEventListener("click", () => {
    championOverlay.hidden = true;
    sounds.stopMusic();
    restartFromMenu = false;
    restartModal?.showModal();
  });

  fastModeButton?.addEventListener("click", () => {
    audioPrefs.fastMode = !audioPrefs.fastMode;
    saveAudioPrefs();
    renderMusicState();
    showToastMessage(audioPrefs.fastMode ? "Fast mode on. Cinematic pauses are shortened." : "Fast mode off. Cinematic pacing restored.");
  });
  soundButton?.addEventListener("click", async () => {
    audioPrefs.enabled = !audioPrefs.enabled;
    saveAudioPrefs();
    if (!audioPrefs.enabled) sounds.dispose();
    else await sounds.unlock();
    renderMusicState();
  });
  musicButton?.addEventListener("click", async () => {
    await ensureMusicLoaded();
    musicMessage.textContent = "";
    renderMusicState();
    musicDialog?.showModal();
  });
  musicCloseButton?.addEventListener("click", () => musicDialog?.close());
  musicFileInput?.addEventListener("change", (event) => importMusicFile(event.target.files?.[0]));
  removeMusicButton?.addEventListener("click", removeMusicAddon);
  musicVolume?.addEventListener("input", () => {
    audioPrefs.musicVolume = Math.max(0, Math.min(24, Number(musicVolume.value) || 0));
    sounds.music.volume = audioPrefs.musicVolume / 100;
    saveAudioPrefs();
    renderMusicState();
  });

  window.addEventListener("accountstatechange", () => {
    syncUclUtilityHeader();
    if (!screen?.hidden) render();
  });

  document.addEventListener("pointerdown", () => {
    if (!document.body.classList.contains("ucl-simulator-open") || !musicMomentActive()) return;
    sounds.unlock();
    sounds.playMusic();
  }, { passive: true, capture: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      sounds.stopCrowd(0.12);
      sounds.stopMusic({ immediate: true });
      return;
    }
    if (musicMomentActive()) sounds.playMusic();
  });
  window.addEventListener("pagehide", () => sounds.dispose());
  window.addEventListener("popstate", () => {
    const isUclRoute = typeof window.currentAppMode === "function" && window.currentAppMode() === "ucl";
    if (isUclRoute && screen.hidden) openSimulator({ updateUrl: false });
    else if (!isUclRoute && (!screen.hidden || !drawStage.hidden)) closeSimulator({ updateUrl: false });
  });

  window.UclSimulator = Object.freeze({
    open: openSimulator,
    close: closeSimulator,
    hasStarted: () => Engine.validSeason(season),
    getState: () => season,
    restart: restartCompetition,
  });

  ensureMusicLoaded();
  renderMusicState();
  syncMenuState();
  if (typeof window.currentAppMode === "function" && window.currentAppMode() === "ucl") openSimulator({ updateUrl: false });
})();
