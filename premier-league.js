(() => {
  const STORAGE_KEY = "world-256-pl-26-27-season-v1";
  const MATCH_VIEW_STORAGE_KEY = "world-256-pl-26-27-active-match-v1";
  const clubs = window.PREMIER_LEAGUE_2026_27_CLUBS || [];
  if (clubs.length !== 20) return;

  const screen = document.querySelector("#premierLeagueSeasonScreen");
  const appShell = document.querySelector("#appShell");
  const content = document.querySelector("#plSeasonContent");
  const startButton = document.querySelector("#startPremierLeagueSeasonButton");
  const backButton = document.querySelector("#plSeasonBackButton");
  const restartButton = document.querySelector("#plRestartSeasonButton");
  const simulateButton = document.querySelector("#plSimulateMatchweekButton");
  const progressLabel = document.querySelector("#plSeasonProgressLabel");
  const progressBar = document.querySelector("#plSeasonProgressBar");
  const seasonTitle = document.querySelector("#plSeasonTitle");
  const seasonSummary = document.querySelector("#plSeasonSummary");
  const seasonKicker = document.querySelector("#plSeasonKicker");
  const liveBackButton = document.querySelector("#plLiveBackButton");
  const engineTablePanel = document.querySelector("#plEngineTablePanel");
  const engineTable = document.querySelector("#plEngineTable");
  const engineFullTableButton = document.querySelector("#plEngineFullTableButton");
  const tabs = [...document.querySelectorAll("[data-pl-view]")];
  const clubById = new Map(clubs.map((club) => [club.id, club]));

  clubs.forEach((club) => {
    TEAM_BY_ID.set(club.id, club);
    clearPlayerProfileCacheForTeam(club.id);
  });

  let activeView = "overview";
  let expandedSquadId = null;
  let season = readSeason();
  let standardStateBeforeMatch = null;

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
    return {
      version: 1,
      drawSeed: Math.floor(Math.random() * 2_000_000_000),
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
      standardFormation: "4-3-3",
      managerLineups: {},
      premierLeagueSeason: true,
    };
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
        saved.standardFormation = [
          "4-3-3",
          "4-2-3-1",
          "4-4-2",
          "4-1-2-1-2",
          "4-3-2-1",
          "4-1-4-1",
          "3-5-2",
          "3-4-3",
          "5-3-2",
          "5-2-2-1",
          "5-2-3",
        ].includes(saved.standardFormation) ? saved.standardFormation : "4-3-3";
        saved.managerLineups = saved.managerLineups && typeof saved.managerLineups === "object"
          ? saved.managerLineups
          : {};
        saved.matchViewActive = saved.matchViewActive === true;
        saved.selectedMatch = Math.max(0, Math.min(
          9,
          Number(saved.selectedMatch) || 0,
        ));
        saved.activeRound = Math.max(0, Math.min(38, Number(saved.activeRound) || 0));
        saved.viewRound = Math.max(0, Math.min(37, Number(saved.viewRound) || saved.activeRound || 0));
        const activeMatchView = readActiveMatchView();
        if (activeMatchView && saved.rounds[activeMatchView.roundIndex]?.[activeMatchView.matchIndex]) {
          saved.activeRound = activeMatchView.roundIndex;
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
    state = season;
    try {
      const result = simulateMatch(match, roundIndex);
      result.revealed = true;
      return result;
    } finally {
      state = previousState;
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
    if (persist) saveSeason();
  }

  function simulateRemainingSeason() {
    for (let roundIndex = 0; roundIndex < season.rounds.length; roundIndex += 1) {
      if (season.rounds[roundIndex].some((match) => !match.result?.revealed)) {
        simulateMatchweek(roundIndex, { persist: false });
      }
    }
    season.activeRound = 38;
    season.viewRound = 37;
    saveSeason();
  }

  function badgeMarkup(club, className = "") {
    if (premierLeagueAssetsInstalled) {
      return `<img class="${className}" src="${club.badge}" alt="" loading="lazy" decoding="async" />`;
    }
    return `<span class="pl-club-code ${className}" aria-hidden="true">${club.code}</span>`;
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
    const actionLabel = played ? "View match" : managed ? "Play match" : "Watch match";
    return `
      <article class="pl-fixture-row ${managed ? "is-managed-match" : ""}">
        ${managed ? '<span class="pl-your-match-label">YOUR MATCH</span>' : ""}
        <div class="pl-fixture-team home">
          <span>${escapeHtml(home.name)}</span>
          ${badgeMarkup(home)}
        </div>
        <div class="pl-fixture-score">
          <strong>${score}</strong>
          <small>${played ? "FULL TIME" : "UK TIME"}</small>
        </div>
        <div class="pl-fixture-team away">
          ${badgeMarkup(away)}
          <span>${escapeHtml(away.name)}</span>
        </div>
        <button class="pl-fixture-play" type="button" data-pl-play-match="${matchIndex}">
          ${actionLabel}
        </button>
      </article>
    `;
  }

  function leagueTable({ includeLive = false } = {}) {
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
      const activeLiveMatch = includeLive
        && !match.result?.revealed
        && typeof livePlayback !== "undefined"
        && livePlayback?.matchId === match.id;
      if (!match.result?.revealed && !activeLiveMatch) return;
      const home = rows.get(match.homeId);
      const away = rows.get(match.awayId);
      const homeGoals = activeLiveMatch ? Number(livePlayback.homeScore) || 0 : Number(match.result.homeGoals) || 0;
      const awayGoals = activeLiveMatch ? Number(livePlayback.awayScore) || 0 : Number(match.result.awayGoals) || 0;
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

  function tableMarkup({ limit = 20 } = {}) {
    const rows = leagueTable().slice(0, limit);
    return `
      <div class="pl-table" role="table" aria-label="Premier League table">
        <div class="pl-table-head" role="row">
          <span>Pos</span><span>Team</span><span>Pl</span><span>W</span><span>D</span><span>L</span><span>GF</span><span>GA</span><span>GD</span><span>Pts</span>
        </div>
        ${rows.map((row, index) => `
          <div class="pl-table-row ${index < 4 ? "is-champions-league" : ""} ${index >= 17 ? "is-relegation" : ""} ${row.club.id === season.spectateTeamId ? "is-selected" : ""}" role="row">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <span class="pl-table-team">${badgeMarkup(row.club)}<b>${escapeHtml(row.club.name)}</b></span>
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

  function championMarkup() {
    if (completedMatchweeks() !== 38) return "";
    const champion = leagueTable()[0]?.club;
    if (!champion) return "";
    return `
      <section class="pl-season-champion">
        <span>2026/27 CHAMPIONS</span>
        <div>${badgeMarkup(champion)}<strong>${escapeHtml(champion.name)}</strong></div>
      </section>
    `;
  }

  function renderOverview() {
    const roundIndex = Math.min(37, season.viewRound);
    const round = season.rounds[roundIndex];
    content.innerHTML = `
      ${championMarkup()}
      <div class="pl-overview-grid">
        <section class="pl-panel">
          <header class="pl-panel-heading">
            <div>
              <span>${escapeHtml(matchDate(roundIndex).toUpperCase())}</span>
              <h2>Matchweek ${roundIndex + 1}</h2>
            </div>
            <button type="button" data-pl-open-view="matches">View all matches &rarr;</button>
          </header>
          <div class="pl-fixture-list">
            ${round.slice(0, 5).map(fixtureMarkup).join("")}
          </div>
        </section>
        <section class="pl-panel">
          <header class="pl-panel-heading">
            <div>
              <span>LIVE STANDINGS</span>
              <h2>Premier League table</h2>
            </div>
            <button type="button" data-pl-open-view="table">Full table &rarr;</button>
          </header>
          ${tableMarkup({ limit: 10 })}
        </section>
      </div>
    `;
  }

  function renderMatches() {
    const roundIndex = Math.min(37, season.viewRound);
    const round = season.rounds[roundIndex];
    content.innerHTML = `
      <div class="pl-matchweek-toolbar">
        <div>
          <span>${escapeHtml(matchDate(roundIndex).toUpperCase())}</span>
          <h2>Matchweek ${roundIndex + 1}</h2>
        </div>
        <div class="pl-matchweek-nav">
          <button type="button" data-pl-round="-1" ${roundIndex === 0 ? "disabled" : ""} aria-label="Previous matchweek">&larr;</button>
          <button type="button" data-pl-round="1" ${roundIndex === 37 ? "disabled" : ""} aria-label="Next matchweek">&rarr;</button>
        </div>
      </div>
      <section class="pl-panel pl-matches-panel">
        <div class="pl-fixture-list">${round.map(fixtureMarkup).join("")}</div>
      </section>
    `;
  }

  function renderTable() {
    content.innerHTML = `
      ${championMarkup()}
      <section class="pl-panel pl-full-table-panel">
        <header class="pl-panel-heading">
          <div>
            <span>AFTER ${completedMatchweeks()} MATCHWEEKS</span>
            <h2>Premier League table</h2>
          </div>
          ${completedMatchweeks() < 38 ? '<button type="button" data-pl-action="simulate-season">Simulate full season &rarr;</button>' : ""}
        </header>
        ${tableMarkup()}
      </section>
    `;
  }

  function renderSquads() {
    content.innerHTML = `
      <div class="pl-matchweek-toolbar">
        <div>
          <span>PROVISIONAL DATA · UPDATED ${escapeHtml(window.PREMIER_LEAGUE_2026_27_DATA_UPDATED.toUpperCase())}</span>
          <h2>Squads and ratings</h2>
        </div>
      </div>
      <section class="pl-squad-grid">
        ${clubs.map((club) => {
          const open = club.id === expandedSquadId;
          return `
            <article class="pl-squad-card" data-pl-squad="${club.id}">
              ${badgeMarkup(club)}
              <div class="pl-squad-card-copy">
                <strong>${escapeHtml(club.name)}</strong>
                <small>${club.playerProfiles.length} players · provisional 2026/27 squad</small>
              </div>
              <div class="pl-squad-rating"><span>RATING</span><strong>${club.rating}</strong></div>
              <div class="pl-squad-detail" ${open ? "" : "hidden"}>
                ${club.arrivals.length ? `
                  <div class="pl-squad-arrivals">
                    ${club.arrivals.map((arrival) => `<span>NEW · ${escapeHtml(arrival)}</span>`).join("")}
                  </div>
                ` : ""}
                <div class="pl-player-list">
                  ${club.playerProfiles.map((player) => `
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
    if (finished && leader) {
      window.maybeShowPostWinDonation?.(`premier-league:${season.drawSeed}:${leader.id}`);
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

  function openSeason({ updateUrl = true, restoreMatch = true } = {}) {
    if (!season) {
      clearActiveMatchView();
      season = newSeason();
      saveSeason();
    }
    season.spectateTeamId = premierLeagueMenuSetup.teamId || season.spectateTeamId || null;
    season.neutralView = !season.spectateTeamId;
    season.settings.upset = premierLeagueMenuSetup.upset || season.settings.upset;
    season.settings.goals = premierLeagueMenuSetup.goals || season.settings.goals;
    saveSeason();
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
    activeView = "matches";
    renderSeason();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function closeSeason({ updateUrl = true } = {}) {
    if (state?.premierLeagueSeason || document.body.classList.contains("pl-match-mode-active")) {
      returnToSeason({ view: "matches" });
    }
    screen.hidden = true;
    appShell.hidden = false;
    document.body.classList.remove("pl-season-open");
    document.body.classList.remove("pl-match-detail-active");
    document.body.classList.remove("pl-match-mode-active");
    if (
      updateUrl
      && typeof currentAppMode === "function"
      && typeof setAppModeUrl === "function"
      && currentAppMode() === "premierLeague"
    ) {
      setAppModeUrl("home");
    }
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
    const fullTable = leagueTable({ includeLive: true });
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
          <span>${badgeMarkup(row.club)}<strong>${escapeHtml(row.club.shortName || row.club.name)}</strong></span>
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
    stopStandardPlaybackForNavigation();
    standardStateBeforeMatch = state;
    season.premierLeagueSeason = true;
    season.activeRound = selectedRoundIndex;
    season.viewRound = selectedRoundIndex;
    season.selectedMatch = selectedMatchIndex;
    season.matchViewActive = true;
    season.championView = false;
    saveActiveMatchView(selectedRoundIndex, selectedMatchIndex);
    saveSeason();
    state = season;
    screen.hidden = true;
    appShell.hidden = false;
    document.body.classList.remove("pl-season-open");
    document.body.classList.add("pl-match-mode-active");
    render();
    liveBackButton.hidden = false;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function returnToSeason({ view = "matches" } = {}) {
    if (!state?.premierLeagueSeason && !document.body.classList.contains("pl-match-mode-active")) return;
    stopStandardPlaybackForNavigation();
    if (state?.premierLeagueSeason) season = state;
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
    window.scrollTo({ top: 0, behavior: "auto" });
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
      const activeMatchView = readActiveMatchView();
      season = candidate;
      if (activeMatchView && season?.rounds?.[activeMatchView.roundIndex]?.[activeMatchView.matchIndex]) {
        season.activeRound = activeMatchView.roundIndex;
        season.viewRound = activeMatchView.roundIndex;
        season.selectedMatch = activeMatchView.matchIndex;
        season.matchViewActive = true;
      }
      saveSeason();
      renderEngineTable();
    },
    syncEngineProgress,
    renderEngineTable,
    returnToSeason,
    kickoffForMatch: matchKickoff,
  };

  startButton?.addEventListener("click", () => openSeason());
  backButton?.addEventListener("click", () => closeSeason());
  liveBackButton?.addEventListener("click", () => returnToSeason());
  engineFullTableButton?.addEventListener("click", () => returnToSeason({ view: "table" }));
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

  restartButton?.addEventListener("click", () => {
    if (!window.confirm("Restart the PL 26/27 season and clear every result?")) return;
    clearActiveMatchView();
    season = newSeason();
    activeView = "overview";
    expandedSquadId = null;
    saveSeason();
    renderSeason();
    showToast("A fresh PL 26/27 season is ready.");
  });

  content?.addEventListener("click", (event) => {
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
    if (event.target.closest('[data-pl-action="simulate-season"]')) {
      if (!window.confirm("Simulate every remaining Premier League match?")) return;
      simulateRemainingSeason();
      renderSeason();
      showToast("The PL 26/27 season is complete.");
      return;
    }
    const squadCard = event.target.closest("[data-pl-squad]");
    if (squadCard) {
      expandedSquadId = expandedSquadId === squadCard.dataset.plSquad ? null : squadCard.dataset.plSquad;
      renderSquads();
    }
  });

  window.addEventListener("accountstatechange", () => {
    if (!screen?.hidden) renderSeason();
  });

  if (typeof currentAppMode === "function" && currentAppMode() === "premierLeague") {
    openSeason({ updateUrl: false });
  }
})();
