(() => {
  const STORAGE_KEY = "world-256-pl-26-27-season-v1";
  const MATCH_VIEW_STORAGE_KEY = "world-256-pl-26-27-active-match-v1";
  const clubs = window.PREMIER_LEAGUE_2026_27_CLUBS || [];
  const latestTransfers = window.PREMIER_LEAGUE_2026_27_LATEST_TRANSFERS || [];
  if (clubs.length !== 20) return;

  const screen = document.querySelector("#premierLeagueSeasonScreen");
  const appShell = document.querySelector("#appShell");
  const content = document.querySelector("#plSeasonContent");
  const startButton = document.querySelector("#startPremierLeagueSeasonButton");
  const menuRestartButton = document.querySelector("#restartPremierLeagueSeasonButton");
  const menuCard = document.querySelector("#premierLeagueModeCard");
  const backButton = document.querySelector("#plSeasonBackButton");
  const restartButton = document.querySelector("#plRestartSeasonButton");
  const restartModal = document.querySelector("#plRestartModal");
  const confirmRestartButton = document.querySelector("#confirmPlRestartButton");
  const simulateButton = document.querySelector("#plSimulateMatchweekButton");
  const progressLabel = document.querySelector("#plSeasonProgressLabel");
  const progressBar = document.querySelector("#plSeasonProgressBar");
  const seasonTitle = document.querySelector("#plSeasonTitle");
  const seasonSummary = document.querySelector("#plSeasonSummary");
  const seasonKicker = document.querySelector("#plSeasonKicker");
  const seasonDate = document.querySelector("#plSeasonDate");
  const seasonMatchweek = document.querySelector("#plSeasonMatchweek");
  const liveBackButton = document.querySelector("#plLiveBackButton");
  const engineTablePanel = document.querySelector("#plEngineTablePanel");
  const engineTable = document.querySelector("#plEngineTable");
  const engineFullTableButton = document.querySelector("#plEngineFullTableButton");
  const seasonSettingsButton = document.querySelector("#plSeasonSettingsButton");
  const seasonFeedbackButton = document.querySelector("#plSeasonFeedbackButton");
  const seasonAchievementsButton = document.querySelector("#plSeasonAchievementsButton");
  const seasonDonateButton = document.querySelector("#plSeasonDonateButton");
  const seasonAccountButton = document.querySelector("#plSeasonAccountButton");
  const seasonAccountLabel = document.querySelector("#plSeasonAccountLabel");
  const tabs = [...document.querySelectorAll("[data-pl-view]")];
  const clubById = new Map(clubs.map((club) => [club.id, club]));
  const youngPlayerCandidateNames = Object.freeze([
    "Max Dowman", "Ethan Nwaneri", "Myles Lewis-Skelly", "Josh Acheampong",
    "Tyrique George", "Estêvão",
    "Nico O'Reilly", "Rico Lewis", "Claudio Echeverri", "Leny Yoro",
    "Kobbie Mainoo", "Chido Obi",
    "Patrick Dorgu", "Harry Amass", "Ayden Heaven", "Rio Ngumoha", "Trey Nyoni",
    "Lewis Miley", "Archie Gray", "Lucas Bergvall", "Mikey Moore", "Wilson Odobert",
    "Chris Rigg", "Junior Kroupi",
    "Stefanos Tzimas",
  ]);
  const registeredPremierLeaguePlayerNames = new Set(
    clubs.flatMap((club) => club.playerProfiles.map((player) => player.name)),
  );
  const youngPlayerNames = new Set(
    youngPlayerCandidateNames.filter((name) => registeredPremierLeaguePlayerNames.has(name)),
  );
  clubs.forEach((club) => {
    TEAM_BY_ID.set(club.id, club);
    clearPlayerProfileCacheForTeam(club.id);
  });

  let activeView = "overview";
  let expandedSquadId = null;
  let season = readSeason();
  let standardStateBeforeMatch = null;
  let dynamicMatchClubIds = [];
  let restartFromMenu = false;
  let savedHistorySession = null;

  function ratingHash(seed, value) {
    let hash = (Number(seed) || 1) ^ 0x9e3779b9;
    for (const character of String(value)) {
      hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
      hash ^= hash >>> 13;
    }
    return (hash >>> 0) / 4294967295;
  }

  function playerRatingKey(player) {
    return String(player.fplId || player.name);
  }

  function createRatingModel(seed) {
    const players = {};
    const clubPaths = {};
    clubs.forEach((club) => {
      clubPaths[club.id] = {
        start: 0,
        target: 0,
      };
      players[club.id] = Object.fromEntries(club.playerProfiles.map((player) => {
        const key = playerRatingKey(player);
        const startDelta = 0;
        const potentialDelta = Math.round(ratingHash(seed, `${club.id}:${key}:potential`) * 3);
        return [key, {
          startDelta,
          potential: Math.max(player.overall, Math.min(92, player.overall + potentialDelta)),
          curve: 1,
        }];
      }));
    });
    return { version: 2, players, clubPaths };
  }

  function ensureRatingModel(candidate) {
    if (
      candidate.ratingModel?.version !== 2
      || !candidate.ratingModel?.players
      || !candidate.ratingModel?.clubPaths
    ) {
      candidate.ratingModel = createRatingModel(candidate.drawSeed);
    }
  }

  function playerRatingAtRound(club, player, roundIndex) {
    const model = season?.ratingModel?.players?.[club.id]?.[playerRatingKey(player)];
    if (!model) return { overall: player.overall, potential: player.overall };
    const progress = Math.max(0, Math.min(1, Number(roundIndex) / 37));
    const start = player.overall + model.startDelta;
    const developed = start + (model.potential - start) * (progress ** model.curve);
    return {
      overall: Math.max(67, Math.min(92, Math.round(developed))),
      potential: model.potential,
    };
  }

  function dynamicClubForRound(club, roundIndex) {
    const profiles = club.playerProfiles.map((player) => ({
      ...player,
      ...playerRatingAtRound(club, player, roundIndex),
    }));
    const progress = Math.max(0, Math.min(1, Number(roundIndex) / 37));
    const path = season?.ratingModel?.clubPaths?.[club.id] || { start: 0, target: 0 };
    const clubDelta = path.start + (path.target - path.start) * progress;
    const baseOverallByPlayer = new Map(club.playerProfiles.map((player) => [playerRatingKey(player), player.overall]));
    const playerDelta = profiles
      .slice()
      .sort((left, right) => right.overall - left.overall)
      .slice(0, 16)
      .reduce((total, player) => (
        total + player.overall - (baseOverallByPlayer.get(playerRatingKey(player)) || player.overall)
      ), 0) / 16;
    const shift = Math.round(clubDelta + playerDelta * 0.55);
    const adjust = (value) => Math.max(55, Math.min(96, Number(value) + shift));
    return {
      ...club,
      rating: adjust(club.rating),
      strength: adjust(club.strength),
      playerProfiles: profiles,
      simulationRatings: {
        ...club.simulationRatings,
        overall: adjust(club.simulationRatings.overall),
        attack: adjust(club.simulationRatings.attack),
        midfield: adjust(club.simulationRatings.midfield),
        defence: adjust(club.simulationRatings.defence),
        goalkeeper: adjust(club.simulationRatings.goalkeeper),
        squadDepth: adjust(club.simulationRatings.squadDepth),
      },
    };
  }

  function installDynamicClubs(roundIndex, clubIds) {
    clubIds.forEach((clubId) => {
      const baseClub = clubById.get(clubId);
      if (!baseClub) return;
      TEAM_BY_ID.set(clubId, dynamicClubForRound(baseClub, roundIndex));
      clearPlayerProfileCacheForTeam(clubId);
    });
  }

  function restoreBaseClubs(clubIds) {
    clubIds.forEach((clubId) => {
      const baseClub = clubById.get(clubId);
      if (!baseClub) return;
      TEAM_BY_ID.set(clubId, baseClub);
      clearPlayerProfileCacheForTeam(clubId);
    });
  }

  function readActiveMatchView() {
    try {
      const saved = JSON.parse(localStorage.getItem(MATCH_VIEW_STORAGE_KEY));
      const roundIndex = Number(saved?.roundIndex);
      const matchIndex = Number(saved?.matchIndex);
      if (
        Number.isInteger(roundIndex)
        && roundIndex >= 0
        && roundIndex < 38
        && Number.isInteger(matchIndex)
        && matchIndex >= 0
        && matchIndex < 10
      ) {
        return { roundIndex, matchIndex };
      }
    } catch {
      // Ignore a damaged view marker and fall back to the season screen.
    }
    return null;
  }

  function saveActiveMatchView(roundIndex, matchIndex) {
    localStorage.setItem(MATCH_VIEW_STORAGE_KEY, JSON.stringify({ roundIndex, matchIndex }));
  }

  function clearActiveMatchView() {
    localStorage.removeItem(MATCH_VIEW_STORAGE_KEY);
  }

  function newSeason() {
    const drawSeed = Math.floor(Math.random() * 2_000_000_000);
    const freshSeason = {
      version: 1,
      drawSeed,
      settings: {
        ...normalizeSettings(),
        upset: premierLeagueMenuSetup.upset || "balanced",
        goals: premierLeagueMenuSetup.goals || "normal",
        realNames: true,
        realPlayersOnly: true,
      },
      rounds: window.createPremierLeagueSchedule(),
      activeRound: 0,
      viewRound: 0,
      selectedMatch: 0,
      matchViewActive: false,
      championView: false,
      started: true,
      predictionTeamId: null,
      spectateTeamId: premierLeagueMenuSetup.teamId || null,
      neutralView: !premierLeagueMenuSetup.teamId,
      standardTactic: "balanced",
      standardFormation: clubById.get(premierLeagueMenuSetup.teamId)?.preferredFormation || "4-3-3",
      managerLineups: {},
      premierLeagueSeason: true,
    };
    freshSeason.ratingModel = createRatingModel(drawSeed);
    return freshSeason;
  }

  function validSeason(candidate) {
    if (candidate?.version !== 1 || !Array.isArray(candidate.rounds) || candidate.rounds.length !== 38) return false;
    if (!candidate.rounds.every((round) => Array.isArray(round) && round.length === 10)) return false;
    return candidate.rounds.flat().every((match) => clubById.has(match.homeId) && clubById.has(match.awayId));
  }

  function readSeason() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (validSeason(saved)) {
        saved.settings = {
          ...normalizeSettings(saved.settings),
          realNames: true,
          realPlayersOnly: true,
        };
        saved.premierLeagueSeason = true;
        saved.standardTactic = typeof STANDARD_TACTICS !== "undefined" && STANDARD_TACTICS[saved.standardTactic]
          ? saved.standardTactic
          : "balanced";
        ensureRatingModel(saved);
        saved.standardFormation = [
          "4-3-3",
          "4-2-3-1",
          "4-4-2",
          "4-3-1-2",
          "4-1-2-1-2",
          "4-3-2-1",
          "4-1-4-1",
          "3-5-2",
          "3-4-1-2",
          "3-4-2-1",
          "3-4-3",
          "3-3-1-3",
          "5-3-2",
          "5-4-1",
          "5-2-2-1",
          "5-2-3",
        ].includes(saved.standardFormation) ? saved.standardFormation : "4-3-3";
        saved.managerLineups = saved.managerLineups && typeof saved.managerLineups === "object"
          ? saved.managerLineups
          : {};
        if (!saved.managerLineups?.[saved.spectateTeamId]?.formation) {
          saved.standardFormation = clubById.get(saved.spectateTeamId)?.preferredFormation
            || saved.standardFormation;
        }
        saved.matchViewActive = saved.matchViewActive === true;
        saved.selectedMatch = Math.max(0, Math.min(
          9,
          Number(saved.selectedMatch) || 0,
        ));
        saved.activeRound = Math.max(0, Math.min(38, Number(saved.activeRound) || 0));
        saved.viewRound = Math.max(0, Math.min(37, Number(saved.viewRound) || saved.activeRound || 0));
        const activeMatchView = readActiveMatchView();
        if (activeMatchView && saved.rounds[activeMatchView.roundIndex]?.[activeMatchView.matchIndex]) {
          saved.viewRound = activeMatchView.roundIndex;
          saved.selectedMatch = activeMatchView.matchIndex;
          saved.matchViewActive = true;
        }
        return saved;
      }
    } catch {
      // A damaged local season should never block a new one.
    }
    return null;
  }

  function saveSeason() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(season));
    syncMenuState();
  }

  function achievementState() {
    if (!season?.spectateTeamId || !Number.isSafeInteger(Number(season.drawSeed))) return null;
    const finished = completedMatchweeks() === 38;
    const finalPosition = finished
      ? leagueTable().findIndex((row) => row.club.id === season.spectateTeamId) + 1
      : null;
    return {
      seed: Number(season.drawSeed),
      clubId: season.spectateTeamId,
      phase: finished && finalPosition > 0 ? "complete" : "start",
      finalPosition: finished && finalPosition > 0 ? finalPosition : null,
    };
  }

  function syncAchievementState() {
    const detail = achievementState();
    if (!detail) return;
    window.AccountAchievements?.trackPremierLeagueSeason?.(detail);
    if (typeof window.CustomEvent === "function") {
      window.dispatchEvent(new window.CustomEvent("premier-league-achievement-state", { detail }));
    }
  }

  function syncMenuState() {
    const hasSeason = validSeason(season);
    if (startButton) {
      startButton.innerHTML = `
        <span class="premier-league-launch-beta">BETA</span>
        ${hasSeason ? "Resume season" : "Start season"}
        <span class="premier-league-launch-arrow" aria-hidden="true">&rarr;</span>
      `;
    }
    if (menuRestartButton) menuRestartButton.hidden = !hasSeason;
    if (menuCard) menuCard.classList.toggle("is-season-started", hasSeason);
    const picker = document.querySelector("#premierLeagueTeamPickerButton");
    if (picker) {
      picker.disabled = hasSeason;
      picker.title = hasSeason ? "Restart the season before changing clubs." : "";
    }
    document.querySelectorAll('[data-settings-scope="premier-league"] button').forEach((button) => {
      button.disabled = hasSeason;
    });
    if (typeof window.CustomEvent === "function") {
      window.dispatchEvent(new window.CustomEvent("premier-league-season-state", {
        detail: { started: hasSeason, clubId: season?.spectateTeamId || null },
      }));
    }
  }

  function completedMatchweeks() {
    if (!season) return 0;
    return season.rounds.filter((round) => round.every((match) => match.result?.revealed)).length;
  }

  function firstIncompleteMatchweek() {
    return season?.rounds.findIndex((round) => round.some((match) => !match.result?.revealed)) ?? -1;
  }

  function simulateLeagueMatch(match, roundIndex) {
    const previousState = state;
    const matchClubIds = [match.homeId, match.awayId];
    installDynamicClubs(roundIndex, matchClubIds);
    state = season;
    try {
      const result = simulateMatch(match, roundIndex);
      result.revealed = true;
      return result;
    } finally {
      state = previousState;
      restoreBaseClubs(matchClubIds);
    }
  }

  function simulateMatchweek(roundIndex, { persist = true } = {}) {
    const round = season.rounds[roundIndex];
    if (!round) return;
    round.forEach((match) => {
      if (!match.result) match.result = simulateLeagueMatch(match, roundIndex);
      match.result.revealed = true;
    });
    const next = firstIncompleteMatchweek();
    season.activeRound = next < 0 ? 38 : next;
    season.viewRound = roundIndex;
    if (next < 0) activeView = "overview";
    if (persist) saveSeason();
  }

  function badgeMarkup(club, className = "") {
    if (premierLeagueAssetsInstalled) {
      return `<img class="${className}" src="${club.badge}" alt="" loading="lazy" decoding="async" />`;
    }
    return `<span class="pl-club-code ${className}" aria-hidden="true">${club.code}</span>`;
  }

  function clubDisplayName(club) {
    const mobile = window.matchMedia?.("(max-width: 850px)")?.matches === true;
    return mobile ? club.mobileName || club.name : club.name;
  }

  function matchDate(roundIndex) {
    const date = new Date(Date.UTC(2026, 7, 21 + roundIndex * 7));
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(date);
  }

  function matchKickoff(matchIndex) {
    return ["20:00", "12:30", "15:00", "15:00", "15:00", "15:00", "17:30", "14:00", "14:00", "16:30"][matchIndex] || "15:00";
  }

  function fixtureMarkup(match, matchIndex) {
    const home = clubById.get(match.homeId);
    const away = clubById.get(match.awayId);
    const played = Boolean(match.result?.revealed);
    const managed = Boolean(season.spectateTeamId)
      && (match.homeId === season.spectateTeamId || match.awayId === season.spectateTeamId);
    const score = played ? `${match.result.homeGoals}–${match.result.awayGoals}` : matchKickoff(matchIndex);
    const locked = !played && season.viewRound !== season.activeRound;
    const actionLabel = played ? "View match" : locked ? "Locked" : managed ? "Play match" : "Watch match";
    return `
      <article class="pl-fixture-row ${managed ? "is-managed-match" : ""}">
        <div class="pl-fixture-team home">
          <span>${escapeHtml(clubDisplayName(home))}</span>
          ${badgeMarkup(home)}
        </div>
        <div class="pl-fixture-score">
          <strong>${score}</strong>
          <small>${played ? "FULL TIME" : "UK TIME"}</small>
        </div>
        <div class="pl-fixture-team away">
          ${badgeMarkup(away)}
          <span>${escapeHtml(clubDisplayName(away))}</span>
        </div>
        <button class="pl-fixture-play" type="button" data-pl-play-match="${matchIndex}" ${locked ? 'disabled title="Reach this matchweek before opening the fixture."' : ""}>
          ${actionLabel}
        </button>
      </article>
    `;
  }

  function orderedRoundFixtures(round) {
    return round
      .map((match, matchIndex) => ({
        match,
        matchIndex,
        managed: Boolean(season.spectateTeamId)
          && (match.homeId === season.spectateTeamId || match.awayId === season.spectateTeamId),
      }))
      .sort((left, right) => Number(right.managed) - Number(left.managed));
  }

  function leagueTable() {
    const rows = new Map(clubs.map((club) => [club.id, {
      club,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
    }]));
    season?.rounds.forEach((round) => round.forEach((match) => {
      if (!match.result?.revealed) return;
      const home = rows.get(match.homeId);
      const away = rows.get(match.awayId);
      const homeGoals = Number(match.result.homeGoals) || 0;
      const awayGoals = Number(match.result.awayGoals) || 0;
      home.played += 1;
      away.played += 1;
      home.gf += homeGoals;
      home.ga += awayGoals;
      away.gf += awayGoals;
      away.ga += homeGoals;
      if (homeGoals > awayGoals) {
        home.won += 1;
        away.lost += 1;
        home.points += 3;
      } else if (awayGoals > homeGoals) {
        away.won += 1;
        home.lost += 1;
        away.points += 3;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    }));
    return [...rows.values()]
      .map((row) => ({ ...row, gd: row.gf - row.ga }))
      .sort((left, right) => (
        right.points - left.points
        || right.gd - left.gd
        || right.gf - left.gf
        || left.club.name.localeCompare(right.club.name)
      ));
  }

  function ordinalPosition(position) {
    const value = Number(position);
    const teen = value % 100;
    if (teen >= 11 && teen <= 13) return `${value}th`;
    if (value % 10 === 1) return `${value}st`;
    if (value % 10 === 2) return `${value}nd`;
    if (value % 10 === 3) return `${value}rd`;
    return `${value}th`;
  }

  function resultCommentary(match, roundIndex = season?.activeRound || 0) {
    if (!match?.result) return "The result is in.";
    const home = clubById.get(match.homeId);
    const away = clubById.get(match.awayId);
    if (!home || !away) return "The result is in.";

    const table = leagueTable();
    const homePosition = table.findIndex((row) => row.club.id === home.id) + 1;
    const awayPosition = table.findIndex((row) => row.club.id === away.id) + 1;
    const matchweek = Math.max(1, Math.min(38, Number(roundIndex) + 1));
    const lateSeason = matchweek >= 28;
    const homeGoals = Number(match.result.homeGoals) || 0;
    const awayGoals = Number(match.result.awayGoals) || 0;

    if (homeGoals === awayGoals) {
      const bestPosition = Math.min(homePosition, awayPosition);
      const worstPosition = Math.max(homePosition, awayPosition);
      if (lateSeason && bestPosition <= 4 && worstPosition >= 17) {
        const contender = homePosition < awayPosition ? home : away;
        const survivor = contender.id === home.id ? away : home;
        return `${survivor.name} frustrate ${contender.name} in a result that matters at both ends of the table.`;
      }
      if (lateSeason && homePosition <= 6 && awayPosition <= 6) {
        return `${home.name} and ${away.name} give up no ground in a tight race for Europe.`;
      }
      if (lateSeason && homePosition >= 16 && awayPosition >= 16) {
        return `A tense point apiece for ${home.name} and ${away.name} in the survival fight.`;
      }
      if (matchweek <= 5) {
        return `${home.name} and ${away.name} share the points as the early table takes shape.`;
      }
      return `${home.name} and ${away.name} share the points.`;
    }

    const winner = homeGoals > awayGoals ? home : away;
    const loser = winner.id === home.id ? away : home;
    const winnerPosition = winner.id === home.id ? homePosition : awayPosition;
    const loserPosition = loser.id === home.id ? homePosition : awayPosition;
    const winnerRating = Number(winner.simulationRatings?.overall) || Number(winner.rating) || 0;
    const loserRating = Number(loser.simulationRatings?.overall) || Number(loser.rating) || 0;
    const upset = loserRating - winnerRating >= 7;

    if (matchweek === 38 && winnerPosition === 1) {
      return `${winner.name} finish the season as Premier League champions!`;
    }
    if (lateSeason && winnerPosition === 1) {
      return `${winner.name} keep control of the title race with a vital win.`;
    }
    if (lateSeason && winnerPosition >= 16) {
      return `A huge survival win for ${winner.name} against ${loser.name}.`;
    }
    if (lateSeason && loserPosition >= 18) {
      return `${winner.name} pile more relegation pressure on ${loser.name}.`;
    }
    if (upset && winnerPosition <= 10) {
      return `Big result! ${winner.name} stun ${loser.name} and strengthen their top-half push.`;
    }
    if (upset) {
      return `Premier League upset! ${winner.name} stun ${loser.name}.`;
    }
    if (winnerPosition <= 4 && matchweek >= 8) {
      return `${winner.name} strengthen their place in the top four.`;
    }
    if (winnerPosition <= 7 && matchweek >= 12) {
      return `${winner.name} boost their push for European football.`;
    }
    if (matchweek <= 5) {
      return `${winner.name} collect three early-season points against ${loser.name}.`;
    }
    return `${winner.name} take all three points and sit ${ordinalPosition(winnerPosition)}.`;
  }

  function tableMarkup({ limit = 20, showHeader = true, ordinalPositions = false } = {}) {
    const rows = leagueTable().slice(0, limit);
    return `
      <div class="pl-table" role="table" aria-label="Premier League table">
        ${showHeader ? `<div class="pl-table-head" role="row">
          <span>Pos</span><span>Team</span><span>Pl</span><span>W</span><span>D</span><span>L</span><span>GF</span><span>GA</span><span>GD</span><span>Pts</span>
        </div>` : ""}
        ${rows.map((row, index) => `
          <div class="pl-table-row ${index < 4 ? "is-champions-league" : ""} ${index >= 17 ? "is-relegation" : ""} ${row.club.id === season.spectateTeamId ? "is-selected" : ""}" role="row">
            <span>${ordinalPositions ? ordinalPosition(index + 1) : String(index + 1).padStart(2, "0")}</span>
            <span class="pl-table-team">${badgeMarkup(row.club)}<b>${escapeHtml(clubDisplayName(row.club))}</b></span>
            <span>${row.played}</span>
            <span>${row.won}</span>
            <span>${row.drawn}</span>
            <span>${row.lost}</span>
            <span>${row.gf}</span>
            <span>${row.ga}</span>
            <span>${row.gd > 0 ? "+" : ""}${row.gd}</span>
            <strong>${row.points}</strong>
          </div>
        `).join("")}
      </div>
    `;
  }

  function seasonPlayerAwards() {
    const playerRows = new Map();
    const goalkeeperRows = new Map();
    const table = leagueTable();
    const tableByClub = new Map(table.map((row) => [row.club.id, row]));
    const ensurePlayerRow = (teamId, player) => {
      const key = `${teamId}:${player}`;
      const row = playerRows.get(key) || {
        player,
        teamId,
        goals: 0,
        assists: 0,
        appearances: 0,
        cleanSheets: 0,
      };
      playerRows.set(key, row);
      return row;
    };
    clubs.forEach((club) => club.playerProfiles.forEach((player) => {
      if (youngPlayerNames.has(player.name)) ensurePlayerRow(club.id, player.name);
    }));
    const addPlayerEvent = (teamId, event) => {
      if (!event || event.goalType === "ownGoal" || event.ownGoal) return;
      const scorerKey = `${teamId}:${event.scorer}`;
      const scorer = ensurePlayerRow(teamId, event.scorer);
      scorer.goals += 1;
      playerRows.set(scorerKey, scorer);
      const assistName = event.assist || event.metadata?.assist || null;
      if (assistName && assistName !== event.scorer) {
        const assistKey = `${teamId}:${assistName}`;
        const assister = ensurePlayerRow(teamId, assistName);
        assister.assists += 1;
        playerRows.set(assistKey, assister);
      }
    };
    const awardAppearancesForMatch = (match, roundIndex) => {
      if (
        Array.isArray(match.result?.playerAppearances?.home)
        && Array.isArray(match.result?.playerAppearances?.away)
      ) return match.result.playerAppearances;

      // The shared appearance helper reads the active tournament state. Award
      // calculations can run while the main app state is active, so temporarily
      // expose this Premier League season while generating any missing line-ups.
      const previousState = state;
      state = season;
      try {
        const generated = ensurePremierLeaguePlayerAppearances(match, roundIndex);
        if (generated) return generated;
      } finally {
        state = previousState;
      }

      // Old/corrupt saves may not contain line-ups. At minimum, credit players
      // who are recorded as having directly contributed in this match.
      const involvedPlayers = (events) => [...new Set(events.flatMap((event) => (
        event?.goalType === "ownGoal" || event?.ownGoal
          ? []
          : [event?.scorer, event?.assist || event?.metadata?.assist].filter(Boolean)
      )))];
      return {
        home: involvedPlayers(match.result?.homeEvents || []),
        away: involvedPlayers(match.result?.awayEvents || []),
      };
    };

    season.rounds.forEach((round, roundIndex) => round.forEach((match) => {
      if (!match.result?.revealed) return;
      (match.result.homeEvents || []).forEach((event) => addPlayerEvent(match.homeId, event));
      (match.result.awayEvents || []).forEach((event) => addPlayerEvent(match.awayId, event));
      const appearances = awardAppearancesForMatch(match, roundIndex);
      [
        [match.homeId, appearances?.home || []],
        [match.awayId, appearances?.away || []],
      ].forEach(([teamId, names]) => names.forEach((name) => {
        if (!youngPlayerNames.has(name)) return;
        const playerRow = ensurePlayerRow(teamId, name);
        playerRow.appearances += 1;
        const conceded = teamId === match.homeId
          ? Number(match.result.awayGoals) || 0
          : Number(match.result.homeGoals) || 0;
        if (conceded === 0) playerRow.cleanSheets += 1;
      }));
      [
        [match.homeId, Number(match.result.awayGoals) || 0],
        [match.awayId, Number(match.result.homeGoals) || 0],
      ].forEach(([teamId, conceded]) => {
        const row = goalkeeperRows.get(teamId) || {
          teamId,
          cleanSheets: 0,
          conceded: 0,
          appearances: 0,
        };
        row.appearances += 1;
        row.conceded += conceded;
        if (conceded === 0) row.cleanSheets += 1;
        goalkeeperRows.set(teamId, row);
      });
    }));

    const enrichedPlayers = [...playerRows.values()].map((row) => {
      const team = clubById.get(row.teamId);
      const profile = team?.playerProfiles.find((player) => player.name === row.player);
      const clubPoints = tableByClub.get(row.teamId)?.points || 0;
      const cleanSheets = row.cleanSheets || 0;
      return {
        ...row,
        team,
        profile,
        overall: Number(profile?.overall) || Number(team?.rating) || 0,
        cleanSheets,
        awardScore: row.goals * 4 + row.assists * 2.2 + clubPoints * 0.08 + (Number(profile?.overall) || 0) * 0.06,
        youngAwardScore: premierLeagueYoungPlayerAwardScore({
          profile,
          goals: row.goals,
          assists: row.assists,
          appearances: row.appearances,
          cleanSheets,
          clubPoints,
        }),
      };
    });
    const byGoals = (left, right) => (
      right.goals - left.goals
      || right.assists - left.assists
      || right.overall - left.overall
      || left.player.localeCompare(right.player)
    );
    const goldenBoot = enrichedPlayers.slice().sort(byGoals)[0] || null;
    const playerOfTheYear = enrichedPlayers
      .slice()
      .sort((left, right) => right.awardScore - left.awardScore || byGoals(left, right))[0]
      || goldenBoot;
    const youngPlayerStatRows = enrichedPlayers
      .filter((row) => youngPlayerNames.has(row.player) && row.appearances > 0);
    const qualifiedYoungPlayers = youngPlayerStatRows
      .filter((row) => row.appearances >= 8);
    const youngPlayerOfTheYear = (qualifiedYoungPlayers.length
      ? qualifiedYoungPlayers
      : youngPlayerStatRows
    ).sort((left, right) => (
      right.youngAwardScore - left.youngAwardScore
      || byGoals(left, right)
    ))[0] || null;
    const gloveRow = [...goalkeeperRows.values()].sort((left, right) => (
      right.cleanSheets - left.cleanSheets
      || left.conceded - right.conceded
      || (clubById.get(right.teamId)?.simulationRatings.goalkeeper || 0)
        - (clubById.get(left.teamId)?.simulationRatings.goalkeeper || 0)
    ))[0];
    const gloveTeam = clubById.get(gloveRow?.teamId);
    const goalkeeper = gloveTeam?.playerProfiles
      .filter((player) => player.position === "GK")
      .sort((left, right) => right.overall - left.overall || left.name.localeCompare(right.name))[0];
    const goldenGlove = gloveRow && gloveTeam ? {
      ...gloveRow,
      player: goalkeeper?.name || `${gloveTeam.name} goalkeeper`,
      team: gloveTeam,
    } : null;

    return {
      table,
      goldenBoot,
      goldenGlove,
      playerOfTheYear,
      youngPlayerOfTheYear,
    };
  }

  function finaleAwardMarkup(label, award, mark, detail) {
    if (!award) return "";
    return `
      <article class="pl-finale-award">
        <div class="pl-finale-award-mark" aria-hidden="true">${mark}</div>
        <div class="pl-finale-award-copy">
          <span>${label}</span>
          <strong>${escapeHtml(award.player)}</strong>
          <small>${badgeMarkup(award.team)} ${escapeHtml(clubDisplayName(award.team))} · ${escapeHtml(detail(award))}</small>
        </div>
      </article>
    `;
  }

  function youngPlayerAwardDetail(award) {
    const defensive = ["CB", "LB", "RB", "LWB", "RWB", "CDM", "DM"]
      .includes(award.profile?.position);
    return defensive
      ? `${award.appearances} apps · ${award.cleanSheets} clean sheets while playing`
      : `${award.appearances} apps · ${award.goals} goals · ${award.assists} assists`;
  }

  function premierLeagueHistorySourceKey() {
    const championId = leagueTable()[0]?.club?.id || "unfinished";
    return `premier-league:2026-27:${Number(season?.drawSeed) || 0}:${championId}`;
  }

  function seasonFinaleMarkup() {
    const awards = seasonPlayerAwards();
    const champion = awards.table[0]?.club;
    if (!champion) return "";
    const podium = awards.table.slice(0, 3);
    const saved = window.TournamentHistory?.has?.(premierLeagueHistorySourceKey()) === true;
    return `
      <section class="pl-season-finale">
        <header class="pl-finale-hero">
          <span>2026/27 PREMIER LEAGUE CHAMPIONS</span>
          ${badgeMarkup(champion)}
          <h1>${escapeHtml(clubDisplayName(champion))}</h1>
          <p>${awards.table[0].points} points · ${awards.table[0].won} wins · ${awards.table[0].gf} goals</p>
        </header>
        <div class="pl-finale-body">
          <span class="pl-finale-section-title">FINAL STANDINGS</span>
          <div class="pl-finale-podium">
            ${podium.map((row, index) => `
              <article class="pl-finale-place">
                <b>${index + 1}</b>
                ${badgeMarkup(row.club)}
                <span><strong>${escapeHtml(clubDisplayName(row.club))}</strong><small>${row.points} PTS</small></span>
              </article>
            `).join("")}
          </div>
          <div class="pl-finale-awards">
            ${finaleAwardMarkup("GOLDEN BOOT", awards.goldenBoot, "⚽", (award) => `${award.goals} goals`)}
            ${finaleAwardMarkup("GOLDEN GLOVE", awards.goldenGlove, "🧤", (award) => `${award.cleanSheets} clean sheets`)}
            ${finaleAwardMarkup("PLAYER OF THE SEASON", awards.playerOfTheYear, "🏆", (award) => `${award.goals} goals · ${award.assists} assists`)}
            ${finaleAwardMarkup("YOUNG PLAYER OF THE SEASON", awards.youngPlayerOfTheYear, "🌟", youngPlayerAwardDetail)}
          </div>
          <div class="pl-finale-actions">
            <button class="is-primary" type="button" data-pl-finale-action="snapshot">Create snapshot</button>
            ${season.savedTournamentView ? "" : `<button type="button" data-pl-finale-action="save" ${saved ? "disabled" : ""}>${saved ? "League saved" : "Save league"}</button>`}
            <button type="button" data-pl-finale-action="table">View final table</button>
            ${season.savedTournamentView ? "" : '<button type="button" data-pl-finale-action="restart">Run it back</button>'}
          </div>
        </div>
      </section>
    `;
  }

  function renderSeasonFinale() {
    content.innerHTML = seasonFinaleMarkup();
  }

  function transferClubMarkup(clubId, clubName) {
    const club = clubById.get(clubId);
    if (club) {
      return `${badgeMarkup(club, "pl-club-flag")}<span>${escapeHtml(clubDisplayName(club))}</span>`;
    }
    const initials = String(clubName || "?")
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
    return `<span class="pl-transfer-monogram" aria-hidden="true">${escapeHtml(initials)}</span><span>${escapeHtml(clubName)}</span>`;
  }

  function latestTransfersMarkup() {
    if (!latestTransfers.length) return "";
    return `
      <section class="pl-panel pl-latest-transfers-panel">
        <header class="pl-panel-heading">
          <div>
            <span>SUMMER 2026 · UPDATED ${escapeHtml(window.PREMIER_LEAGUE_2026_27_DATA_UPDATED.toUpperCase())}</span>
            <h2>Latest transfers</h2>
          </div>
          <a href="https://www.premierleague.com/en/transfers/2026-27/summer" target="_blank" rel="noreferrer">All transfers &rarr;</a>
        </header>
        <div class="pl-transfer-list">
          ${latestTransfers.map((transfer) => {
            const [day, month] = transfer.date.split(" ");
            return `
            <a class="pl-transfer-row" href="${escapeHtml(transfer.sourceUrl)}" target="_blank" rel="noreferrer">
              <time datetime="${escapeHtml(transfer.date)}">
                <b>${escapeHtml(day)}</b>
                <span>${escapeHtml(month)}</span>
              </time>
              <span class="pl-transfer-copy">
                <strong>${escapeHtml(transfer.player)}</strong>
                <span class="pl-transfer-route">
                  <span class="pl-transfer-club">${transferClubMarkup(transfer.fromId, transfer.fromName)}</span>
                  <b aria-label="transferred to">&rarr;</b>
                  <span class="pl-transfer-club is-destination">${transferClubMarkup(transfer.toId, transfer.toName)}</span>
                </span>
              </span>
              <span class="pl-transfer-open" aria-hidden="true">&nearr;</span>
            </a>
          `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderOverview() {
    if (completedMatchweeks() === 38) {
      renderSeasonFinale();
      return;
    }
    const roundIndex = Math.min(37, season.viewRound);
    const round = season.rounds[roundIndex];
    const orderedFixtures = orderedRoundFixtures(round);
    content.innerHTML = `
      <div class="pl-overview-grid">
        <section class="pl-panel">
          <div class="pl-fixture-list">
            ${orderedFixtures.slice(0, 5).map(({ match, matchIndex }) => fixtureMarkup(match, matchIndex)).join("")}
          </div>
          <footer class="pl-panel-footer"><button type="button" data-pl-open-view="matches">View all matches &rarr;</button></footer>
        </section>
        <section class="pl-panel">
          ${tableMarkup({ limit: 10 })}
          <footer class="pl-panel-footer"><button type="button" data-pl-open-view="table">Full table &rarr;</button></footer>
        </section>
      </div>
      ${latestTransfersMarkup()}
    `;
  }

  function renderMatches() {
    const roundIndex = Math.min(37, season.viewRound);
    const round = season.rounds[roundIndex];
    const orderedFixtures = orderedRoundFixtures(round);
    content.innerHTML = `
      <div class="pl-matchweek-toolbar pl-matchweek-toolbar-nav-only">
        <div class="pl-matchweek-nav">
          <button type="button" data-pl-round="-1" ${roundIndex === 0 ? "disabled" : ""} aria-label="Previous matchweek">&larr;</button>
          <button type="button" data-pl-round="1" ${roundIndex === 37 ? "disabled" : ""} aria-label="Next matchweek">&rarr;</button>
        </div>
      </div>
      <section class="pl-panel pl-matches-panel">
        <div class="pl-fixture-list">${orderedFixtures.map(({ match, matchIndex }) => fixtureMarkup(match, matchIndex)).join("")}</div>
      </section>
    `;
  }

  function renderTable() {
    content.innerHTML = `
      <section class="pl-panel pl-full-table-panel">
        ${tableMarkup({ showHeader: false, ordinalPositions: true })}
      </section>
    `;
  }

  function renderSquads() {
    content.innerHTML = `
      <section class="pl-squad-grid">
        ${clubs.map((club) => {
          const open = club.id === expandedSquadId;
          const dynamicClub = dynamicClubForRound(club, Math.min(37, season.activeRound));
          return `
            <article class="pl-squad-card" data-pl-squad="${club.id}">
              ${badgeMarkup(club)}
              <div class="pl-squad-card-copy">
                <strong>${escapeHtml(clubDisplayName(club))}</strong>
                <small>${club.playerProfiles.length} players · current 2026/27 squad</small>
              </div>
              <div class="pl-squad-rating"><span>RATING</span><strong>${dynamicClub.rating}</strong></div>
              <div class="pl-squad-detail" ${open ? "" : "hidden"}>
                ${club.arrivals.length ? `
                  <div class="pl-squad-arrivals">
                    ${club.arrivals.map((arrival) => `<span>NEW · ${escapeHtml(arrival)}</span>`).join("")}
                  </div>
                ` : ""}
                <div class="pl-player-list">
                  ${dynamicClub.playerProfiles.map((player) => `
                    <span><b>${escapeHtml(player.name)}</b><i>${escapeHtml(player.position)} · ${player.overall}</i></span>
                  `).join("")}
                </div>
              </div>
            </article>
          `;
        }).join("")}
      </section>
    `;
  }

  function updateHeader() {
    const completed = completedMatchweeks();
    const finished = completed === 38;
    const table = season ? leagueTable() : [];
    const leader = table[0]?.club;
    if (progressLabel) progressLabel.textContent = finished ? "Season complete" : `Matchweek ${season.activeRound + 1} of 38`;
    if (progressBar) progressBar.style.width = `${(completed / 38) * 100}%`;
    if (seasonKicker) seasonKicker.textContent = finished ? "THE SEASON IS COMPLETE" : "PL 26/27 SIMULATOR";
    if (seasonTitle) seasonTitle.textContent = finished && leader ? `${leader.name} are champions.` : `Matchweek ${Math.min(38, season.activeRound + 1)}`;
    if (seasonSummary) {
      seasonSummary.textContent = finished
        ? `${leader?.name || "The champions"} finish top after 380 matches.`
        : "Fixtures, live matches and the latest league table.";
    }
    const headerRound = Math.min(37, season.viewRound);
    if (seasonDate) seasonDate.textContent = matchDate(headerRound).toUpperCase();
    if (seasonMatchweek) seasonMatchweek.textContent = `Matchweek ${headerRound + 1}`;
    if (finished && leader && !season.savedTournamentView) {
      window.maybeShowPostWinDonation?.(`premier-league:${season.drawSeed}:${leader.id}`);
      syncAchievementState();
    }

    if (finished) {
      simulateButton.textContent = "Season complete";
      simulateButton.disabled = true;
    } else if (season.viewRound !== season.activeRound) {
      simulateButton.textContent = `Go to matchweek ${season.activeRound + 1}`;
      simulateButton.disabled = false;
    } else {
      simulateButton.textContent = `Simulate matchweek ${season.viewRound + 1}`;
      simulateButton.disabled = false;
    }
  }

  function renderSeason() {
    if (!season) season = newSeason();
    screen.classList.toggle("is-saved-history", season.savedTournamentView === true);
    restartButton.hidden = season.savedTournamentView === true;
    syncSeasonUtilityHeader();
    screen.classList.remove("is-complete");
    tabs.forEach((tab) => {
      const selected = tab.dataset.plView === activeView;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-current", selected ? "page" : "false");
    });
    updateHeader();
    if (activeView === "matches") renderMatches();
    else if (activeView === "table") renderTable();
    else if (activeView === "squads") renderSquads();
    else renderOverview();
  }

  function syncSeasonUtilityHeader() {
    const sourceButton = document.querySelector("#mainAccountButton");
    const sourceLabel = document.querySelector("#mainAccountLabel");
    if (seasonAccountLabel) seasonAccountLabel.textContent = sourceLabel?.textContent || "Log in";
    if (seasonAccountButton && sourceButton) {
      const label = sourceButton.getAttribute("aria-label") || sourceLabel?.textContent || "Log in";
      seasonAccountButton.setAttribute("aria-label", label);
      seasonAccountButton.title = sourceButton.title || label;
    }
  }

  function savedHistorySeed(record) {
    const sourceSeed = Number.parseInt(
      String(record?.sourceKey || "").match(/^premier-league:2026-27:(\d+):/)?.[1] || "",
      10,
    );
    return Number.isSafeInteger(sourceSeed) ? sourceSeed : Math.abs(stableHash(record?.id || "saved-league"));
  }

  function openSavedHistory(record) {
    if (
      record?.mode !== "premier-league"
      || !Array.isArray(record.rounds)
      || record.rounds.length !== 38
    ) return false;
    if (savedHistorySession) closeSavedHistory();
    savedHistorySession = {
      season,
      activeView,
      expandedSquadId,
    };
    const savedSeason = {
      version: 1,
      drawSeed: savedHistorySeed(record),
      settings: {
        ...normalizeSettings(),
        realNames: true,
        realPlayersOnly: true,
      },
      rounds: structuredClone(record.rounds),
      activeRound: 38,
      viewRound: 37,
      selectedMatch: 0,
      matchViewActive: false,
      championView: true,
      started: true,
      predictionTeamId: null,
      spectateTeamId: record.managedTeamId || null,
      neutralView: !record.managedTeamId,
      standardTactic: "balanced",
      standardFormation: clubById.get(record.managedTeamId)?.preferredFormation || "4-3-3",
      managerLineups: {},
      premierLeagueSeason: true,
      savedTournamentView: true,
      savedTournamentRecordId: record.id,
    };
    savedSeason.ratingModel = createRatingModel(savedSeason.drawSeed);
    season = savedSeason;
    activeView = "overview";
    expandedSquadId = null;
    stopStandardPlaybackForNavigation();
    closeOpenDialogsAndMenus();
    appShell.hidden = true;
    screen.hidden = false;
    document.body.classList.add("pl-season-open");
    document.body.classList.remove("pl-match-mode-active", "pl-match-detail-active");
    const backLabel = backButton?.querySelector("span:last-child");
    if (backLabel) backLabel.textContent = "Back to saved leagues";
    renderSeason();
    document.documentElement.classList.remove("route-pl-loading");
    window.scrollTo({ top: 0, behavior: "auto" });
    return true;
  }

  function closeSavedHistory() {
    if (!savedHistorySession) return false;
    stopStandardPlaybackForNavigation();
    restoreBaseClubs(dynamicMatchClubIds);
    dynamicMatchClubIds = [];
    standardStateBeforeMatch = null;
    screen.hidden = true;
    document.body.classList.remove("pl-season-open", "pl-match-mode-active", "pl-match-detail-active");
    screen.classList.remove("is-saved-history");
    const previous = savedHistorySession;
    savedHistorySession = null;
    season = previous.season;
    activeView = previous.activeView;
    expandedSquadId = previous.expandedSquadId;
    const backLabel = backButton?.querySelector("span:last-child");
    if (backLabel) backLabel.textContent = "Back to modes";
    restartButton.hidden = false;
    return true;
  }

  function openSeason({ updateUrl = true, restoreMatch = true } = {}) {
    if (!season) {
      clearActiveMatchView();
      season = newSeason();
      saveSeason();
      syncAchievementState();
    }
    if (
      restoreMatch
      && season.matchViewActive
      && season.rounds[season.viewRound]?.[season.selectedMatch]
    ) {
      openMatch(season.selectedMatch, { roundIndex: season.viewRound });
      return;
    }
    if (season.matchViewActive) {
      season.matchViewActive = false;
      saveSeason();
    }
    stopStandardPlaybackForNavigation();
    closeOpenDialogsAndMenus();
    appShell.hidden = true;
    screen.hidden = false;
    document.body.classList.add("pl-season-open");
    document.body.classList.remove("pl-match-mode-active");
    document.body.classList.remove("pl-match-detail-active");
    if (
      updateUrl
      && typeof currentAppMode === "function"
      && typeof setAppModeUrl === "function"
      && currentAppMode() !== "premierLeague"
    ) {
      setAppModeUrl("premierLeague");
    }
    activeView = completedMatchweeks() === 38 ? "overview" : "matches";
    renderSeason();
    document.documentElement.classList.remove("route-pl-loading");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function closeSeason({ updateUrl = true } = {}) {
    stopStandardPlaybackForNavigation();
    restoreBaseClubs(dynamicMatchClubIds);
    dynamicMatchClubIds = [];
    if (state?.premierLeagueSeason) {
      season = state;
      season.matchViewActive = false;
      clearActiveMatchView();
      saveSeason();
      state = standardStateBeforeMatch || standardTournamentState;
    }
    standardStateBeforeMatch = null;
    screen.hidden = true;
    appShell.hidden = false;
    document.body.classList.remove("pl-season-open");
    document.body.classList.remove("pl-match-detail-active");
    document.body.classList.remove("pl-match-mode-active");
    liveBackButton.hidden = true;
    engineTablePanel.hidden = true;
    if (
      updateUrl
      && typeof currentAppMode === "function"
      && typeof setAppModeUrl === "function"
      && currentAppMode() === "premierLeague"
    ) {
      setAppModeUrl("home");
    }
    if (typeof render === "function") render();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function syncEngineProgress(
    roundIndex = season?.activeRound || 0,
    { preserveEngineRound = document.body.classList.contains?.("pl-match-mode-active") === true } = {},
  ) {
    if (!season) return;
    const selectedRound = Math.max(0, Math.min(37, Number(roundIndex) || 0));
    if (preserveEngineRound) {
      season.activeRound = selectedRound;
      season.viewRound = selectedRound;
      saveSeason();
      return;
    }
    const next = firstIncompleteMatchweek();
    season.activeRound = next < 0 ? 38 : next;
    season.viewRound = selectedRound;
    saveSeason();
  }

  function renderEngineTable() {
    if (!engineTablePanel || !engineTable) return;
    const active = Boolean(state?.premierLeagueSeason);
    engineTablePanel.hidden = !active;
    liveBackButton.hidden = !active;
    if (!active) return;
    const fullTable = leagueTable();
    const selectedIndex = season.spectateTeamId
      ? fullTable.findIndex((row) => row.club.id === season.spectateTeamId)
      : -1;
    const startIndex = selectedIndex >= 0
      ? Math.max(0, Math.min(fullTable.length - 6, selectedIndex - 3))
      : 0;
    const rows = fullTable.slice(startIndex, startIndex + 6);
    engineTable.innerHTML = `
      <div class="pl-engine-table-head"><span>Pos</span><span>Club</span><span>GD</span><span>Pts</span></div>
      ${rows.map((row, index) => `
        <div class="pl-engine-table-row ${row.club.id === season.spectateTeamId ? "is-selected" : ""}">
          <b>${startIndex + index + 1}</b>
          <span>${badgeMarkup(row.club)}<strong>${escapeHtml(clubDisplayName(row.club))}</strong></span>
          <i>${row.gd > 0 ? "+" : ""}${row.gd}</i>
          <strong>${row.points}</strong>
        </div>
      `).join("")}
    `;
  }

  function openMatch(matchIndex, { roundIndex = season?.viewRound } = {}) {
    if (!season) return;
    const selectedRoundIndex = Math.max(0, Math.min(37, Number(roundIndex) || 0));
    const selectedMatchIndex = Math.max(0, Math.min(9, Number(matchIndex) || 0));
    const match = season.rounds[selectedRoundIndex]?.[selectedMatchIndex];
    if (!match) return;
    if (!match.result?.revealed && selectedRoundIndex !== season.activeRound) {
      showToast(`Matchweek ${selectedRoundIndex + 1} is locked. Play matchweek ${season.activeRound + 1} first.`);
      return;
    }
    stopStandardPlaybackForNavigation();
    restoreBaseClubs(dynamicMatchClubIds);
    dynamicMatchClubIds = [match.homeId, match.awayId];
    installDynamicClubs(selectedRoundIndex, dynamicMatchClubIds);
    standardStateBeforeMatch = state;
    season.premierLeagueSeason = true;
    season.activeRound = selectedRoundIndex;
    season.viewRound = selectedRoundIndex;
    season.selectedMatch = selectedMatchIndex;
    season.matchViewActive = true;
    season.championView = false;
    if (!season.savedTournamentView) {
      saveActiveMatchView(selectedRoundIndex, selectedMatchIndex);
      saveSeason();
    }
    state = season;
    screen.hidden = true;
    appShell.hidden = false;
    document.body.classList.remove("pl-season-open");
    document.body.classList.add("pl-match-mode-active");
    render();
    document.documentElement.classList.remove("route-pl-loading");
    liveBackButton.hidden = false;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function returnToSeason({ view = "matches" } = {}) {
    if (!state?.premierLeagueSeason && !document.body.classList.contains("pl-match-mode-active")) return;
    stopStandardPlaybackForNavigation();
    restoreBaseClubs(dynamicMatchClubIds);
    dynamicMatchClubIds = [];
    if (state?.premierLeagueSeason) season = state;
    if (season?.savedTournamentView) {
      season.matchViewActive = false;
      state = standardStateBeforeMatch || standardTournamentState;
      standardStateBeforeMatch = null;
      document.body.classList.remove("pl-match-mode-active", "pl-match-detail-active");
      document.body.classList.add("pl-season-open");
      liveBackButton.hidden = true;
      engineTablePanel.hidden = true;
      appShell.hidden = true;
      screen.hidden = false;
      activeView = view;
      renderSeason();
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    if (season) {
      season.matchViewActive = false;
      clearActiveMatchView();
      saveSeason();
    }
    syncEngineProgress(season?.activeRound || 0, { preserveEngineRound: false });
    state = standardStateBeforeMatch || standardTournamentState;
    standardStateBeforeMatch = null;
    document.body.classList.remove("pl-match-mode-active");
    document.body.classList.remove("pl-match-detail-active");
    document.body.classList.add("pl-season-open");
    liveBackButton.hidden = true;
    engineTablePanel.hidden = true;
    appShell.hidden = true;
    screen.hidden = false;
    activeView = view;
    renderSeason();
    if (document.activeElement && !screen.contains(document.activeElement)) {
      document.activeElement.blur?.();
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function finishManagedMatchweek(roundIndex, matchIndex) {
    if (!state?.premierLeagueSeason || !season) return false;
    const completedRoundIndex = Math.max(0, Math.min(37, Number(roundIndex) || 0));
    const round = season.rounds[completedRoundIndex];
    const managedMatch = round?.[Number(matchIndex)];
    if (
      !managedMatch?.result?.revealed
      || !season.spectateTeamId
      || (managedMatch.homeId !== season.spectateTeamId && managedMatch.awayId !== season.spectateTeamId)
    ) return false;

    round.forEach((match, index) => {
      if (index === Number(matchIndex)) return;
      if (!match.result) match.result = simulateMatch(match, completedRoundIndex);
      match.result.revealed = true;
    });

    const nextRoundIndex = completedRoundIndex + 1;
    if (nextRoundIndex < 38) {
      season.activeRound = nextRoundIndex;
      season.viewRound = nextRoundIndex;
      season.selectedMatch = Math.max(
        0,
        season.rounds[nextRoundIndex].findIndex((match) => (
          match.homeId === season.spectateTeamId || match.awayId === season.spectateTeamId
        )),
      );
    } else {
      season.activeRound = 38;
      season.viewRound = 37;
    }
    saveSeason();
    returnToSeason({ view: "overview" });
    showToast(nextRoundIndex < 38
      ? `Matchweek ${completedRoundIndex + 1} complete. Matchweek ${nextRoundIndex + 1} is ready.`
      : "The Premier League season is complete.");
    return true;
  }

  window.PremierLeagueSeason = {
    openSeason,
    closeSeason,
    isOpen() {
      return !screen.hidden
        || document.body.classList.contains("pl-season-open")
        || document.body.classList.contains("pl-match-mode-active");
    },
    saveEngineState(candidate) {
      if (candidate?.savedTournamentView) return;
      season = candidate;
      if (
        season?.matchViewActive
        && season.rounds?.[season.activeRound]?.[season.selectedMatch]
      ) {
        season.viewRound = season.activeRound;
        const selected = season.rounds[season.activeRound][season.selectedMatch];
        const selectedClubIds = [selected.homeId, selected.awayId];
        if (selectedClubIds.some((clubId) => !dynamicMatchClubIds.includes(clubId))) {
          restoreBaseClubs(dynamicMatchClubIds);
          dynamicMatchClubIds = selectedClubIds;
          installDynamicClubs(season.activeRound, dynamicMatchClubIds);
        }
        saveActiveMatchView(season.activeRound, season.selectedMatch);
      } else if (!season?.matchViewActive) {
        clearActiveMatchView();
      }
      saveSeason();
      renderEngineTable();
    },
    syncEngineProgress,
    renderEngineTable,
    returnToSeason,
    finishManagedMatchweek,
    kickoffForMatch: matchKickoff,
    resultCommentary,
    achievementState,
    hasStarted() {
      return validSeason(season);
    },
    openSavedHistory,
    closeSavedHistory,
  };

  startButton?.addEventListener("click", () => openSeason());
  backButton?.addEventListener("click", () => {
    if (savedHistorySession) {
      window.TournamentHistory?.close?.();
      return;
    }
    closeSeason();
  });
  seasonSettingsButton?.addEventListener("click", () => document.querySelector("#settingsButton")?.click());
  seasonFeedbackButton?.addEventListener("click", () => document.querySelector("#bugReportButton")?.click());
  seasonAchievementsButton?.addEventListener("click", () => {
    window.AccountAchievements?.openRetroModal("pl");
  });
  seasonDonateButton?.addEventListener("click", () => document.querySelector("#donateButton")?.click());
  seasonAccountButton?.addEventListener("click", () => document.querySelector("#mainAccountButton")?.click());
  liveBackButton?.addEventListener("click", () => returnToSeason());
  engineFullTableButton?.addEventListener("click", () => returnToSeason({ view: "table" }));
  window.addEventListener("tournament-history-changed", () => {
    if (!screen.hidden && completedMatchweeks() === 38) renderSeason();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key !== "Enter"
      || event.repeat
      || event.isComposing
      || event.altKey
      || event.ctrlKey
      || event.metaKey
      || event.shiftKey
      || screen.hidden
      || !["overview", "matches"].includes(activeView)
      || !season?.spectateTeamId
      || season.viewRound !== season.activeRound
      || document.querySelector("dialog[open]")
      || (
        screen.contains(event.target)
        && event.target?.closest?.("button, a, input, select, textarea, [contenteditable='true']")
      )
    ) return;
    const managedMatchIndex = season.rounds[season.viewRound]?.findIndex((match) => (
      (match.homeId === season.spectateTeamId || match.awayId === season.spectateTeamId)
      && !match.result?.revealed
    ));
    if (managedMatchIndex < 0) return;
    event.preventDefault();
    event.stopPropagation();
    openMatch(managedMatchIndex, { roundIndex: season.viewRound });
  });
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    activeView = tab.dataset.plView;
    renderSeason();
  }));

  simulateButton?.addEventListener("click", () => {
    if (!season || season.activeRound >= 38) return;
    if (season.viewRound !== season.activeRound) {
      season.viewRound = season.activeRound;
      saveSeason();
      renderSeason();
      return;
    }
    simulateMatchweek(season.viewRound);
    renderSeason();
    showToast(`Matchweek ${season.viewRound + 1} complete.`);
  });

  function restartSeason() {
    clearActiveMatchView();
    season = newSeason();
    activeView = "overview";
    expandedSquadId = null;
    saveSeason();
    syncAchievementState();
    renderSeason();
    showToast("A fresh PL 26/27 season is ready.");
  }

  restartButton?.addEventListener("click", () => {
    restartFromMenu = false;
    restartModal?.showModal();
  });
  menuRestartButton?.addEventListener("click", () => {
    restartFromMenu = true;
    restartModal?.showModal();
  });
  confirmRestartButton?.addEventListener("click", () => {
    if (!restartFromMenu) {
      restartSeason();
      return;
    }
    restartFromMenu = false;
    clearActiveMatchView();
    localStorage.removeItem(STORAGE_KEY);
    season = null;
    activeView = "overview";
    expandedSquadId = null;
    syncMenuState();
    showToast("Season cleared. Choose a club and start again.");
  });

  content?.addEventListener("click", (event) => {
    const finaleAction = event.target.closest("[data-pl-finale-action]")?.dataset.plFinaleAction;
    if (finaleAction === "snapshot") {
      const awards = seasonPlayerAwards();
      window.openPremierLeagueSeasonSnapshotModal?.({
        champion: awards.table[0],
        podium: awards.table.slice(0, 3),
        goldenBoot: awards.goldenBoot,
        goldenGlove: awards.goldenGlove,
        playerOfTheYear: awards.playerOfTheYear,
        youngPlayerOfTheYear: awards.youngPlayerOfTheYear,
        settings: {
          upset: season.settings?.upset || "balanced",
          goals: season.settings?.goals || "normal",
        },
      }, event.target.closest("button"));
      return;
    }
    if (finaleAction === "save") {
      const awards = seasonPlayerAwards();
      const record = window.TournamentHistory?.savePremierLeague?.({
        sourceKey: premierLeagueHistorySourceKey(),
        drawSeed: season.drawSeed,
        rounds: season.rounds,
        teams: clubs,
        table: awards.table,
        managedTeamId: season.spectateTeamId || null,
        topScorer: awards.goldenBoot,
      });
      if (record) renderSeason();
      return;
    }
    if (finaleAction === "table") {
      activeView = "table";
      renderSeason();
      return;
    }
    if (finaleAction === "restart") {
      restartModal?.showModal();
      return;
    }
    const openView = event.target.closest("[data-pl-open-view]")?.dataset.plOpenView;
    if (openView) {
      activeView = openView;
      renderSeason();
      return;
    }
    const playMatchButton = event.target.closest("[data-pl-play-match]");
    if (playMatchButton) {
      openMatch(Number(playMatchButton.dataset.plPlayMatch));
      return;
    }
    const roundButton = event.target.closest("[data-pl-round]");
    if (roundButton && !roundButton.disabled) {
      season.viewRound = Math.max(0, Math.min(37, season.viewRound + Number(roundButton.dataset.plRound)));
      saveSeason();
      renderSeason();
      return;
    }
    const squadCard = event.target.closest("[data-pl-squad]");
    if (squadCard) {
      expandedSquadId = expandedSquadId === squadCard.dataset.plSquad ? null : squadCard.dataset.plSquad;
      renderSquads();
    }
  });

  window.addEventListener("accountstatechange", () => {
    syncSeasonUtilityHeader();
    if (!screen?.hidden) renderSeason();
  });

  if (typeof currentAppMode === "function" && currentAppMode() === "premierLeague") {
    openSeason({ updateUrl: false });
  }
  syncMenuState();
})();
