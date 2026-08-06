function render() {
  forceUnlockStartupState();
  syncSavedTournamentDeleteActions();
  const premierLeagueMatchActive = state?.premierLeagueSeason === true;
  if (premierLeagueMatchActive) {
    document.body.classList.add("pl-match-mode-active");
    document.body.classList.remove("pl-season-open");
  }
  document.body.classList.toggle("ucl-match-mode-active", state?.uclSeason === true);
  enforceModeScreenVisibility(premierLeagueMatchActive ? "standard" : currentAppMode());
  if (!premierLeagueMatchActive && currentAppMode() === "retro") {
    document.body.classList.remove("legacy-mode-active", "achievements-mode-active");
    els.legacyDraftScreen.hidden = true;
    els.achievementsScreen.hidden = true;
    try {
      renderRetroWorldCupMode();
    } catch (error) {
      recoverFromStartupError(error, "retro-render");
    }
    enforceModeScreenVisibility(currentAppMode());
    return;
  }
  if (isRetroSimulatorState() && livePlayback) stopStandardPlaybackForNavigation();
  restoreSharedMainContent();
  restoreStandardTournamentState();
  if (repairDefaultKnockoutRosterResults(state)) saveState();
  ensureThirdPlacePlayoffForSavedTournament();
  retroBottomGroupsVisible = false;
  retroBottomGroupMatchesVisible = false;
  els.fixtureGrid.classList.remove("retro-group-tables");
  els.fixtureGrid.classList.remove("retro-group-match-history");
  els.teamFilterControl.hidden = false;
  els.unresolvedFilter.hidden = false;
  document.body.classList.remove("retro-mode-active", "retro-1998-active", "retro-2002-active", "retro-2006-active", "retro-2010-active", "retro-euro-2016-active", "retro-2018-active", "retro-2022-active", "retro-copa-2024-active", "retro-2026-active");
  els.retroWorldCupScreen.hidden = true;
  const mode = premierLeagueMatchActive ? "standard" : currentAppMode();
  if (mode !== "custom") customTournamentSetupViewOpen = false;
  if (mode !== "customMatch") customMatchSetupViewOpen = false;
  const customTournamentActive = mode === "custom"
    && isValidCustomTournamentState(state)
    && state.customTournament?.customMatch !== true
    && state.started
    && !customTournamentSetupViewOpen;
  const customMatchActive = mode === "customMatch"
    && isValidCustomTournamentState(state)
    && state.customTournament?.customMatch === true
    && state.started
    && !customMatchSetupViewOpen;
  els.roundNav.hidden = customMatchActive;
  els.roundBoard.hidden = customMatchActive;
  if (els.goldenBootPanel) els.goldenBootPanel.hidden = customMatchActive;
  const sharedBackLabel = els.legacyDraftBackButton.querySelector(".legacy-back-label");
  const savedTournamentActive = state?.savedTournamentView === true;
  if (savedTournamentActive) {
    els.legacyDraftBackButton.dataset.savedTournament = "true";
    els.legacyDraftBackButton.setAttribute("aria-label", "Back to saved tournaments");
    if (sharedBackLabel) sharedBackLabel.textContent = "Back to saved tournaments";
  } else if (customTournamentActive || customMatchActive) {
    delete els.legacyDraftBackButton.dataset.savedTournament;
    els.legacyDraftBackButton.dataset.customSettings = "true";
    els.legacyDraftBackButton.setAttribute("aria-label", "Back to settings");
    if (sharedBackLabel) sharedBackLabel.textContent = "Back to settings";
  } else {
    delete els.legacyDraftBackButton.dataset.savedTournament;
    delete els.legacyDraftBackButton.dataset.customSettings;
    els.legacyDraftBackButton.setAttribute("aria-label", "Back to modes");
    if (sharedBackLabel) sharedBackLabel.textContent = "Back to modes";
  }
  els.customTournamentScreen.hidden = mode !== "custom" || customTournamentActive;
  if (els.customMatchScreen) els.customMatchScreen.hidden = mode !== "customMatch" || customMatchActive;
  document.body.classList.toggle("custom-tournament-mode-active", mode === "custom" || mode === "customMatch");
  document.body.classList.toggle("custom-match-mode-active", mode === "customMatch");
  if (els.customLiveBackButton) els.customLiveBackButton.hidden = !(customTournamentActive || customMatchActive);
  if (mode === "custom" && !customTournamentActive) {
    els.pageHeading.hidden = true;
    els.fieldOverview.hidden = true;
    els.achievementsScreen.hidden = true;
    els.legacyDraftScreen.hidden = true;
    els.legacyDraftBackButton.hidden = true;
    els.legacyHeaderBackButton.hidden = true;
    els.mainContent.hidden = true;
    renderCustomTournamentSetup();
    return;
  }
  if (mode === "customMatch" && !customMatchActive) {
    els.pageHeading.hidden = true;
    els.fieldOverview.hidden = true;
    els.achievementsScreen.hidden = true;
    els.legacyDraftScreen.hidden = true;
    els.legacyDraftBackButton.hidden = true;
    els.legacyHeaderBackButton.hidden = true;
    els.mainContent.hidden = true;
    renderCustomMatchSetup();
    return;
  }
  if (currentAppMode() === "legacy") {
    document.body.classList.remove("achievements-mode-active");
    els.achievementsScreen.hidden = true;
    renderLegacyDraftMode();
    return;
  }
  document.body.classList.remove("legacy-mode-active");
  els.legacyDraftScreen.hidden = true;
  els.legacyDraftBackButton.hidden = false;
  els.legacyHeaderBackButton.hidden = false;
  const achievementsMode = mode === "achievements";
  const beforeStart = (!savedTournamentActive && mode !== "standard" && !customTournamentActive && !customMatchActive) || !state.started;
  els.pageHeading.hidden = !beforeStart;
  renderSpectatePicker();
  syncSoundToggle();
  document.body.classList.toggle("before-start", beforeStart);
  document.body.classList.toggle("achievements-mode-active", achievementsMode);
  els.fieldOverview.hidden = !beforeStart || achievementsMode;
  els.achievementsScreen.hidden = !achievementsMode;
  els.mainContent.hidden = beforeStart;

  if (beforeStart) {
    els.legacyHeaderBackButton.hidden = true;
    els.legacyDraftBackButton.hidden = true;
  if (achievementsMode) {
    els.pageHeading.hidden = true;
    renderProgress();
    return;
  }
    const standardTournamentActive = state.started && !state.legacyTournament && !state.customTournament;
    els.startTournamentButton.innerHTML = `${standardTournamentActive ? "Resume tournament" : "Start tournament"} <span aria-hidden="true">→</span>`;
    els.homeRestartButton.hidden = !standardTournamentActive;
    if (els.openCustomTournamentButton) {
      const customActive = isValidCustomTournamentState(customTournamentState) && customTournamentState.started;
      els.openCustomTournamentButton.innerHTML = `${customActive ? "Resume tournament" : "Build tournament"} <span aria-hidden="true">&rarr;</span>`;
      if (els.restartCustomTournamentButton) els.restartCustomTournamentButton.hidden = !customActive;
    }
    if (els.openCustomMatchButton) {
      const matchActive = customMatchCanResume();
      els.openCustomMatchButton.innerHTML = `${matchActive ? "Resume match" : "Set up match"} <span aria-hidden="true">&rarr;</span>`;
      if (els.restartCustomMatchButton) els.restartCustomMatchButton.hidden = !matchActive;
    }
    const activeLegacySession = Boolean(legacyDraft) || Boolean(state.legacyTournament && state.started);
    els.startLegacyDraftButton.innerHTML = `${activeLegacySession ? "Resume tournament" : "Start tournament"} <span aria-hidden="true">→</span>`;
    els.restartLegacyDraftButton.hidden = !activeLegacySession;
    syncRetroWorldCupCardAction();
    els.pageKicker.textContent = "256 TEAMS WC · NEW TOURNAMENT";
    els.pageTitle.textContent = "Choose your mode";
    syncLandingSettings();
    syncStandardTournamentCardLock();
    renderUclTeamPicker();
    renderLegacyLandingSetup();
    renderParticipantOverview(els.overviewSearch.value);
    renderProgress();
    return;
  }

  const roundName = tournamentRoundName();
  const historyMode = viewingRoundHistory();
  els.pageKicker.textContent = savedTournamentActive
    ? `SAVED TOURNAMENT · ${state.savedTournamentEditionLabel || "TOURNAMENT ARCHIVE"}`
    : state.uclSeason
    ? "UEFA CHAMPIONS LEAGUE · LEAGUE PHASE"
    : state.premierLeagueSeason
    ? "PL 26/27 · LEAGUE SEASON"
    : state.legacyTournament
    ? "LEGACY DRAFT TOURNAMENT"
    : state.championView
    ? "TOURNAMENT COMPLETE"
    : historyMode ? "ROUND ARCHIVE" : state.customTournament
      ? state.customTournament.customMatch ? "CUSTOM MATCH" : `${state.customTournament.teamCount} TEAM CUSTOM ${state.customTournament.structure === "groups" ? "TOURNAMENT" : "KNOCKOUT"}`
      : "256 TEAMS WC KNOCKOUT";
  els.pageTitle.textContent = state.uclSeason
    ? roundName
    : state.premierLeagueSeason
    ? roundName
    : state.legacyTournament
    ? `${legacyDraft?.nation?.name || "Legacy"} XI`
    : state.championView
    ? state.customTournament?.customMatch === true ? "Custom match" : "Final"
    : roundName;
  els.boardTitle.textContent = state.uclSeason
    ? `${roundName} fixtures`
    : state.premierLeagueSeason
    ? `${roundName} fixtures`
    : historyMode
    ? roundName
    : state.customTournament?.structure === "groups" && state.activeRound === 0
      ? "Group tables"
      : state.activeRound >= Math.max(state.customTournament?.structure === "groups" ? 1 : 0, tournamentFinalRoundIndex() - 3)
        ? "Knockout bracket"
        : `${roundName} fixtures`;
  if (teamFilterId) els.boardTitle.textContent = `${teamById(teamFilterId).name} matches`;
  const watchedMatchIndex = teamMatchIndex(state.activeRound);
  const completedCustomGroupStage = isCustomGroupStageRound()
    && pendingCustomGroupMatchday(selectedRound()) < 0;
  const finalRoundIncludesThirdPlace = state.activeRound === tournamentFinalRoundIndex()
    && selectedRound().some((match) => isThirdPlacePlayoff(match));
  els.simulateRoundButton.textContent = state.premierLeagueSeason
    ? watchedMatchIndex >= 0 && !selectedRound()[watchedMatchIndex]?.result?.revealed
      ? "Simulate other matches"
      : "Simulate matchweek"
    : completedCustomGroupStage
    ? `Continue to ${tournamentRoundName(1)}`
    : watchedMatchIndex >= 0 && !selectedRound()[watchedMatchIndex]?.result?.revealed
    ? isCustomGroupStageRound() ? "Simulate other matches" : "Simulate other ties"
    : finalRoundIncludesThirdPlace ? "Simulate final round"
      : state.activeRound === tournamentFinalRoundIndex() ? "Simulate final"
        : isCustomGroupStageRound() ? "Simulate matchday" : "Simulate round";
  els.simulateRoundButton.hidden = savedTournamentActive || historyMode || Boolean(teamFilterId);
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
  if (state.uclSeason) window.UclSeason?.renderEngineTable?.();
  else if (state.premierLeagueSeason) window.PremierLeagueSeason?.renderEngineTable?.();
  els.unresolvedFilter.classList.toggle(
    "active",
    state.customTournament?.structure === "groups" && state.activeRound === 0
      ? customGroupTablesCollapsed
      : filterUnresolved,
  );
}

function syncSoundToggle() {
  const enabled = matchSoundsAreEnabled();
  els.soundToggleButton.setAttribute("aria-pressed", String(enabled));
  els.soundToggleButton.classList.toggle("is-enabled", enabled);
  els.soundToggleButton.title = enabled ? "Turn match sounds off" : "Turn match sounds on";
  els.soundToggleLabel.textContent = enabled ? "Sounds on" : "Sounds off";
}

function syncLandingSettings() {
  document.querySelectorAll(".landing-segmented").forEach((group) => {
    const setting = group.dataset.setting;
    const isRetro = group.dataset.settingsScope === "retro";
    const isPremierLeague = group.dataset.settingsScope === "premier-league";
    const activeTournament = isRetro
      ? retroTournamentForYear(selectedRetroTournamentYear())
      : null;
    const settings = activeTournament
      ? retroTournamentLockedSetup(activeTournament)
      : isRetro ? retroMenuSettings
        : isPremierLeague ? premierLeagueMenuSetup
          : state.settings;
    group.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("active", button.dataset.value === settings[setting]);
    });
  });
}

function standardTournamentSetupLocked(candidate = state) {
  return Boolean(
    candidate?.started
    && !candidate.retroWorldCup
    && !candidate.customTournament
    && !candidate.legacyTournament
    && candidate.rounds?.[0]?.length === 128
  );
}

function syncStandardTournamentCardLock() {
  const setupLocked = standardTournamentSetupLocked();
  els.defaultModeCard?.classList.toggle("is-setup-locked", setupLocked);
  document.querySelectorAll(".mode-card-default .landing-segmented").forEach((group) => {
    group.classList.toggle("standard-locked-control", setupLocked);
    group.querySelectorAll("button").forEach((button) => {
      button.disabled = setupLocked;
    });
  });
  if (els.spectatePickerButton) {
    els.spectatePickerButton.disabled = setupLocked;
    els.spectatePickerButton.title = setupLocked ? "Restart the tournament to change your managed team" : "";
  }
}

function readRetroWorldCupSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(RETRO_SETTINGS_STORAGE_KEY) || "null");
    return {
      upset: SIMULATION_CONFIG.modes[saved?.upset] ? saved.upset : defaultSettings.upset,
      goals: SIMULATION_CONFIG.goals[saved?.goals] ? saved.goals : defaultSettings.goals,
    };
  } catch {
    return { upset: defaultSettings.upset, goals: defaultSettings.goals };
  }
}

function saveRetroWorldCupSettings() {
  try {
    localStorage.setItem(RETRO_SETTINGS_STORAGE_KEY, JSON.stringify(retroMenuSettings));
  } catch {
    // The controls remain usable when storage is unavailable.
  }
}

function readRetroWorldCupYear() {
  const pathYear = retroWorldCupYearFromPath();
  if (pathYear) return pathYear;
  try {
    const year = localStorage.getItem(RETRO_WORLD_CUP_YEAR_KEY);
    return RETRO_WORLD_CUP_EDITIONS[year] && year !== "2016" ? year : "2014";
  } catch {
    return "2014";
  }
}

function setRetroWorldCupYear(year) {
  const selectedYear = RETRO_WORLD_CUP_EDITIONS[year] ? String(year) : "2014";
  const edition = RETRO_WORLD_CUP_EDITIONS[selectedYear];
  els.retroModeCard?.style.setProperty("--retro-accent", edition.accent);
  els.retroModeCard?.style.setProperty("--retro-accent-text", edition.accentText);
  if (els.retroModeCard) els.retroModeCard.dataset.retroEdition = selectedYear;
  document.body.classList.toggle("retro-2006-menu-theme", selectedYear === "2006" && readRetroCompetition() === "wc");
  if (els.retroWorldCupLogo) els.retroWorldCupLogo.src = edition.logo;
  if (els.retroTeamPickerButton) els.retroTeamPickerButton.disabled = !retroWorldCupMenuTeams(selectedYear).length;
  renderRetroWorldCupTeamPicker(selectedYear);
  els.retroWorldCupYearSwitch?.querySelectorAll("[data-retro-year]").forEach((button) => {
    const isActive = button.dataset.retroYear === selectedYear;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  try {
    if (selectedYear !== "2016") localStorage.setItem(RETRO_WORLD_CUP_YEAR_KEY, selectedYear);
  } catch {
    // The selector still works when storage is unavailable.
  }
  if (els.retroWorldCupScreen?.hidden !== false) {
    retroTournament = readRetroTournamentState(selectedYear);
    retroSquadTeamName = retroTournament?.managedTeam || edition.host;
  }
  syncRetroWorldCupCardAction(selectedYear);
}

function setRetroCompetition(competition) {
  const selectedCompetition = ["euros", "copa"].includes(competition) ? competition : "wc";
  const isEuros = selectedCompetition === "euros";
  const isCopa = selectedCompetition === "copa";
  try {
    localStorage.setItem(RETRO_COMPETITION_KEY, selectedCompetition);
  } catch {
    // The selector still works when storage is unavailable.
  }
  els.retroCompetitionSwitch?.querySelectorAll("[data-retro-competition]").forEach((button) => {
    const isActive = button.dataset.retroCompetition === selectedCompetition;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  els.retroWorldCupYearSwitch?.querySelectorAll("[data-retro-year]").forEach((button) => {
    button.hidden = isEuros || isCopa;
  });
  els.retroWorldCupYearSwitch?.querySelectorAll("[data-euro-year]").forEach((button) => {
    button.hidden = !isEuros;
    button.classList.toggle("active", isEuros);
    button.setAttribute("aria-pressed", String(isEuros));
  });
  els.retroWorldCupYearSwitch?.querySelectorAll("[data-copa-year]").forEach((button) => {
    button.hidden = !isCopa;
    button.classList.toggle("active", isCopa);
    button.setAttribute("aria-pressed", String(isCopa));
  });
  if (els.retroWorldCupYearSwitch) {
    els.retroWorldCupYearSwitch.dataset.competition = selectedCompetition;
    els.retroWorldCupYearSwitch.setAttribute(
      "aria-label",
      isCopa ? "Copa América year" : isEuros ? "Euros year" : "World Cup year",
    );
  }
  if (els.retroModeCard) {
    els.retroModeCard.dataset.retroCompetition = selectedCompetition;
  }
  document.body.classList.toggle(
    "retro-2006-menu-theme",
    selectedCompetition === "wc" && readRetroWorldCupYear() === "2006",
  );
  if (els.retroCompetitionTitle) {
    els.retroCompetitionTitle.textContent = isCopa
      ? "Copa Simulator"
      : isEuros
        ? "Euros Simulator"
        : "WC Simulator";
  }
  const copaComingSoon = isCopa && !RETRO_COPA_2024_PLAYABLE;
  els.retroCopaComingSoon?.setAttribute("aria-hidden", String(!copaComingSoon));
  if (els.retroCopaComingSoon) els.retroCopaComingSoon.hidden = !copaComingSoon;
  if (isCopa) {
    els.retroModeCard?.style.setProperty("--retro-accent", RETRO_COPA_2024.accent);
    els.retroModeCard?.style.setProperty("--retro-accent-text", RETRO_COPA_2024.accentText);
    if (els.retroModeCard) els.retroModeCard.dataset.retroEdition = RETRO_COPA_2024.year;
    if (els.retroWorldCupLogo) els.retroWorldCupLogo.src = RETRO_COPA_2024.logo;
    renderRetroWorldCupTeamPicker(RETRO_COPA_2024.year);
    syncRetroWorldCupCardAction(RETRO_COPA_2024.year);
    return;
  }
  if (isEuros) {
    els.retroModeCard?.style.setProperty("--retro-accent", RETRO_EURO_2016.accent);
    els.retroModeCard?.style.setProperty("--retro-accent-text", RETRO_EURO_2016.accentText);
    if (els.retroModeCard) els.retroModeCard.dataset.retroEdition = RETRO_EURO_2016.year;
    if (els.retroWorldCupLogo) els.retroWorldCupLogo.src = RETRO_EURO_2016.logo;
    if (els.retroWorldCupScreen?.hidden !== false) {
      retroTournament = readRetroTournamentState(RETRO_EURO_2016.year);
      retroSquadTeamName = retroTournament?.managedTeam || RETRO_EURO_2016.teams[0].name;
    }
    renderRetroWorldCupTeamPicker(RETRO_EURO_2016.year);
    syncRetroWorldCupCardAction(RETRO_EURO_2016.year);
    return;
  }
  const worldCupYear = readRetroWorldCupYear();
  setRetroWorldCupYear(worldCupYear === "2024" ? "2014" : worldCupYear);
}

function retroTournamentStorageKey(year) {
  return Number(year) === 2014
    ? RETRO_TOURNAMENT_STORAGE_KEY
    : `${RETRO_TOURNAMENT_STORAGE_KEY}-${year}`;
}

function readRetroTournamentState(year = readRetroWorldCupYear()) {
  try {
    const saved = JSON.parse(localStorage.getItem(retroTournamentStorageKey(year)) || "null");
    return typeof RETRO_WORLD_CUP_ENGINE !== "undefined" && RETRO_WORLD_CUP_ENGINE.validate(saved) ? saved : null;
  } catch {
    return null;
  }
}

function saveRetroTournamentState() {
  if (retroTournament?.savedTournamentView) return;
  try {
    const year = retroTournament?.year || Number(readRetroWorldCupYear());
    const key = retroTournamentStorageKey(year);
    if (retroTournament) localStorage.setItem(key, JSON.stringify(retroTournament));
    else localStorage.removeItem(key);
  } catch {
    // The current tournament remains playable when storage is unavailable.
  }
  if (retroTournament) {
    window.AccountAchievements?.trackRetroTournament(retroTournament);
    window.dispatchEvent(new CustomEvent("retro-tournament-saved", {
      detail: retroTournament,
    }));
  }
}

function savedRetroAchievementTournamentStates() {
  return readTournamentHistoryRecords()
    .filter((record) => (
      record?.mode === "retro"
      && [1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2024, 2026].includes(Number(record.year))
      && record.managedTeamId
      && record.championId
    ))
    .map((record) => {
      const sourceKeyParts = String(record.sourceKey || "").split(":");
      const seed = Number(sourceKeyParts[2]);
      const managedTeam = record.teams?.[record.managedTeamId]?.name;
      const champion = record.teams?.[record.championId]?.name;
      const final = (record.rounds || [])
        .flatMap((round) => round || [])
        .find((match) => match?.id === "ko-final");
      if (
        !Number.isInteger(seed)
        || !managedTeam
        || !champion
        || final?.result?.revealed !== true
        || final.result.winnerId !== record.championId
      ) return null;
      return {
        year: Number(record.year),
        seed,
        managedTeam,
        phase: "complete",
        champion,
        knockoutRounds: [{
          name: "Finals",
          matches: [{
            id: "ko-final",
            result: { winner: champion, revealed: true },
          }],
        }],
      };
    })
    .filter(Boolean);
}

window.getRetroAchievementTournamentStates = () => {
  const tournaments = [
    ...[1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2024, 2026]
      .map((year) => readRetroTournamentState(year))
      .filter(Boolean),
    ...savedRetroAchievementTournamentStates(),
  ];
  const unique = new Map();
  tournaments.forEach((tournament) => {
    const key = `${tournament.year}:${tournament.seed}:${tournament.managedTeam}:${tournament.champion || ""}`;
    unique.set(key, tournament);
  });
  return [...unique.values()];
};

function retroTournamentHasProgress() {
  return Boolean(
    retroTournament
    && RETRO_WORLD_CUP_ENGINE.allMatches(retroTournament).some((match) => match.result),
  );
}

function syncRetroWorldCupCardAction(year = readRetroWorldCupYear()) {
  if (!els.startRetroWorldCupButton) return;
  const selectedCompetition = readRetroCompetition();
  const isEuros = selectedCompetition === "euros";
  const isCopa = selectedCompetition === "copa";
  const selectedYear = isCopa ? 2024 : isEuros ? RETRO_EURO_2016.year : year;
  const playable = isCopa
    ? RETRO_COPA_2024_PLAYABLE
    : isEuros || ["1998", "2002", "2006", "2010", "2014", "2018", "2022", "2024", "2026"].includes(String(selectedYear));
  const hasTeamField = playable && (isCopa
    ? Boolean(RETRO_COPA_2024.teams.length)
    : isEuros
    ? Boolean(RETRO_EURO_2016.teams.length)
    : Boolean(retroWorldCupMenuTeams(year).length));
  const savedTournament = playable ? retroTournamentForYear(selectedYear) : null;
  const setupLocked = Boolean(savedTournament);
  document.querySelectorAll('[data-settings-scope="retro"]').forEach((group) => {
    group.classList.toggle("retro-locked-control", setupLocked);
    group.querySelectorAll("button").forEach((button) => {
      button.disabled = setupLocked || !playable;
    });
  });
  if (els.retroTeamPickerButton) {
    els.retroTeamPickerButton.disabled = setupLocked || !hasTeamField;
    els.retroTeamPickerButton.title = setupLocked ? `Restart this ${isEuros ? "Euro" : "World Cup"} to change team` : "";
  }
  syncLandingSettings();
  els.startRetroWorldCupButton.disabled = !playable;
  els.startRetroWorldCupButton.innerHTML = playable
    ? `${savedTournament ? "Resume" : "Start"} ${isCopa ? "Copa América 2024" : isEuros ? "Euro 2016" : "World Cup"} <span aria-hidden="true">&rarr;</span>`
    : "Coming soon";
  els.restartRetroWorldCupButton.hidden = !playable || !savedTournament;
}

function retroTeamForFlag(name) {
  const aliases = {
    "Cabo Verde": "Cape Verde",
    "Congo DR": "DR Congo",
    "Côte d'Ivoire": "Ivory Coast",
    "Czech Republic": "Czechia",
    "IR Iran": "Iran",
    "Korea Republic": "South Korea",
    "México": "Mexico",
    "Serbia and Montenegro": "Serbia",
    "Turkey": "Türkiye",
    "United States": "USA",
  };
  const sourceName = aliases[name] || (name === "Yugoslavia" ? "Serbia" : name);
  const team = TEAMS.find((candidate) => candidate.name === sourceName);
  return team ? { ...team, name } : { name, code: "XX", flag: "" };
}

function retroFlag(name, className = "") {
  if (state?.premierLeagueSeason) {
    const club = sharedLineupTeamByName(name);
    if (club) return flagMarkup(club, className);
  }
  return flagMarkup(retroTeamForFlag(name), className);
}

function retroMatchById(matchId) {
  return retroTournament ? RETRO_WORLD_CUP_ENGINE.allMatches(retroTournament).find((match) => match.id === matchId) : null;
}

function retroMatchStageLabel(match) {
  if (match.label) return match.label;
  if (match.stage === "group") return `Group ${match.group} · Matchday ${match.matchday}`;
  return retroTournament.knockoutRounds.find((round) => round.matches.some((candidate) => candidate.id === match.id))?.name || "Knockout";
}

function retroScheduleDetails(match) {
  if (!match?.schedule) return null;
  if (Number(retroTournament?.year) === 2024) {
    const [year, month, day] = String(match.schedule.date || "").split("-").map(Number);
    const localDate = Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day)
      ? new Date(Date.UTC(year, month - 1, day, 12))
      : null;
    return {
      date: localDate
        ? new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(localDate)
        : String(match.schedule.date || ""),
      time: String(match.schedule.localTime || ""),
      stadium: match.schedule.stadium,
      city: match.schedule.city,
    };
  }
  const kickoff = new Date(`${match.schedule.date}T${match.schedule.localTime}:00${match.schedule.utcOffset}`);
  return {
    date: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(kickoff),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(kickoff),
    stadium: match.schedule.stadium,
    city: match.schedule.city,
  };
}

function retroScheduleMarkup(match, compact = false) {
  const details = retroScheduleDetails(match);
  if (!details) return "";
  const localKickoff = Number(retroTournament?.year) === 2024 && details.time
    ? `${details.time} local`
    : "";
  if (compact) {
    return `<small class="retro-fixture-details">
      <span>${escapeHtml(details.date)}</span>
      ${localKickoff ? `<span>${escapeHtml(localKickoff)}</span>` : ""}
      <span>${escapeHtml(details.stadium)} · ${escapeHtml(details.city)}</span>
    </small>`;
  }
  return `<div class="retro-match-schedule">
    <span><b>${escapeHtml(details.date)}</b></span>
    <span><b>${escapeHtml(details.stadium)}</b><small>${escapeHtml(details.city)}${localKickoff ? ` · ${escapeHtml(localKickoff)}` : ""}</small></span>
  </div>`;
}

function retroScoreLabel(match) {
  if (!match.result) return "–";
  const penalties = match.result.penalties
    ? ` <small>(${match.result.penalties.home}-${match.result.penalties.away} pens)</small>`
    : "";
  return `${match.result.homeGoals}-${match.result.awayGoals}${penalties}`;
}

function retroScorersMarkup(events = []) {
  if (!events.length) return `<span class="retro-no-scorers">No goals</span>`;
  return events.map((event) => `
    <span>${escapeHtml(event.scorer)} <b>${event.minute}'${event.penalty ? " (P)" : ""}</b></span>
  `).join("");
}

function retroCurrentMatch() {
  const selected = retroMatchById(retroSelectedMatchId);
  if (selected) return selected;
  const next = RETRO_WORLD_CUP_ENGINE.nextUnplayedMatch(retroTournament);
  if (next) {
    retroSelectedMatchId = next.id;
    return next;
  }
  const matches = RETRO_WORLD_CUP_ENGINE.allMatches(retroTournament);
  const latest = [...matches].reverse().find((match) => match.result) || matches[0] || null;
  retroSelectedMatchId = latest?.id || null;
  return latest;
}

function retroMatchStageMarkup(match) {
  if (!match && retroTournament.phase === "complete") {
    return `
      <section class="retro-champion">
        ${retroFlag(retroTournament.champion, "retro-champion-flag")}
        <span>${Number(retroTournament.year) === 2016 ? "EUROPEAN CHAMPIONS" : Number(retroTournament.year) === 2024 ? "COPA AMÉRICA USA 2024 CHAMPIONS" : "WORLD CHAMPIONS"}</span>
        <h2>${escapeHtml(retroTournament.champion)}</h2>
      </section>`;
  }
  if (!match) return "";
  const result = match.result;
  const nextMatch = result ? RETRO_WORLD_CUP_ENGINE.nextUnplayedMatch(retroTournament) : null;
  return `
    <section class="retro-match-stage">
      <span class="retro-stage-label">${retroMatchStageLabel(match)}</span>
      ${retroScheduleMarkup(match)}
      <div class="retro-match-teams">
        <div class="retro-match-team">
          ${retroFlag(match.home, "retro-stage-flag")}
          <h2>${escapeHtml(match.home)}</h2>
          <div class="retro-scorers">${result ? retroScorersMarkup(result.homeEvents) : ""}</div>
        </div>
        <div class="retro-match-score">
          <strong>${retroScoreLabel(match)}</strong>
          <span>${result ? result.penalties ? "After penalties" : result.extraTime ? "After extra time" : "Full time" : "Pre-match"}</span>
        </div>
        <div class="retro-match-team">
          ${retroFlag(match.away, "retro-stage-flag")}
          <h2>${escapeHtml(match.away)}</h2>
          <div class="retro-scorers">${result ? retroScorersMarkup(result.awayEvents) : ""}</div>
        </div>
      </div>
      <div class="retro-stage-actions">
        ${result
          ? nextMatch ? `<button class="primary-button" type="button" data-retro-action="next-match">Next match <span aria-hidden="true">&rarr;</span></button>` : ""
          : `<button class="primary-button" type="button" data-retro-action="simulate-match">Simulate match</button>`}
      </div>
      ${result ? `
        <div class="retro-match-stats">
          <div><strong>${result.stats.possession[0]}%</strong><span>Possession</span><strong>${result.stats.possession[1]}%</strong></div>
          <div><strong>${result.stats.expectedGoals[0]}</strong><span>xG</span><strong>${result.stats.expectedGoals[1]}</strong></div>
          <div><strong>${result.stats.shots[0]}</strong><span>Shots</span><strong>${result.stats.shots[1]}</strong></div>
          <div><strong>${result.stats.onTarget[0]}</strong><span>On target</span><strong>${result.stats.onTarget[1]}</strong></div>
        </div>` : ""}
    </section>`;
}

function retroFixtureButtonMarkup(match) {
  return `
    <button class="retro-fixture ${match.id === retroSelectedMatchId ? "selected" : ""}" type="button" data-retro-match-id="${match.id}">
      <span>${retroFlag(match.home, "retro-fixture-flag")}<strong>${escapeHtml(match.home)}</strong></span>
      <b>${retroScoreLabel(match)}</b>
      <span>${retroFlag(match.away, "retro-fixture-flag")}<strong>${escapeHtml(match.away)}</strong></span>
      ${retroScheduleMarkup(match, true)}
    </button>`;
}

function renderRetroMatchesView() {
  const selectedMatch = retroCurrentMatch();
  const activeMatches = RETRO_WORLD_CUP_ENGINE.activeMatches(retroTournament);
  const unresolved = activeMatches.filter((match) => !match.result);
  const boot = RETRO_WORLD_CUP_ENGINE.goldenBoot(retroTournament).slice(0, 5);
  els.retroTournamentBody.innerHTML = `
    <div class="retro-match-layout">
      <div class="retro-match-primary">
        ${retroMatchStageMarkup(selectedMatch)}
        ${retroTournament.phase !== "complete" ? `
          <section class="retro-active-fixtures">
            <div class="retro-section-heading">
              <h2>${retroTournament.phase === "group" ? `Matchday ${activeMatches[0]?.matchday || 3}` : retroTournament.knockoutRounds.at(-1)?.name}</h2>
              ${unresolved.length ? `<button class="secondary-button" type="button" data-retro-action="simulate-stage">Simulate ${retroTournament.phase === "group" ? "matchday" : "round"}</button>` : ""}
            </div>
            <div class="retro-fixture-list">${activeMatches.map(retroFixtureButtonMarkup).join("")}</div>
          </section>` : ""}
      </div>
      <aside class="retro-golden-boot">
        <span>GOLDEN BOOT</span>
        ${boot.length ? boot.map((entry, index) => `
          <div><b>${index + 1}</b>${retroFlag(entry.team, "retro-boot-flag")}<span><strong>${escapeHtml(entry.player)}</strong><small>${escapeHtml(entry.team)}</small></span><em>${entry.goals}</em></div>
        `).join("") : `<p>The race starts with the first goal.</p>`}
      </aside>
    </div>`;
}

function retroGroupTableMarkup(group) {
  const rows = retroVisibleGroupStandings(group);
  const complete = rows.every((row) => row.played === 3);
  const bestThirdNames = new Set((retroTournament.bestThirdPlaced || []).map((entry) => entry.team));
  return `
    <section class="retro-group-table">
      <h2>Group ${group}</h2>
      <div class="retro-table-head"><span>Team</span><b>P</b><b>GD</b><b>Pts</b></div>
      ${rows.map((row, index) => `
        <div class="retro-table-row ${complete && (index < 2 || bestThirdNames.has(row.name)) ? "qualified" : ""} ${complete && index === 2 && bestThirdNames.has(row.name) ? "best-third" : ""}">
          <span>${retroFlag(row.name, "retro-table-flag")}<strong>${escapeHtml(row.name)}</strong></span>
          <b>${row.played}</b><b>${row.gd > 0 ? `+${row.gd}` : row.gd}</b><b>${row.points}</b>
        </div>
      `).join("")}
    </section>`;
}

function retroGroupLetters() {
  return [...new Set(RETRO_WORLD_CUPS[retroTournament.year].teams.map((team) => team.group))];
}

function renderRetroGroupsView() {
  restoreSharedMainContent();
  els.retroTournamentBody.innerHTML = `
    <div class="retro-groups-grid">${retroGroupLetters().map(retroGroupTableMarkup).join("")}</div>`;
}

function renderRetroSquadsView() {
  restoreSharedMainContent();
  const year = retroTournament.year;
  const isFrance1998 = Number(year) === 1998;
  const isEuro2016 = Number(year) === 2016;
  const isCopa2024 = Number(year) === 2024;
  const isWorldCup2026 = Number(year) === 2026;
  const available = RETRO_WORLD_CUPS[year].teams;
  const squads = retroSquadsForYear(year);
  if (!squads[retroSquadTeamName]) retroSquadTeamName = retroTournament.managedTeam || available[0].name;
  const squad = squads[retroSquadTeamName];
  const startingNumbers = new Set(squad.startingXI || []);
  const positionGroups = [
    ["Goalkeepers", "GK"],
    ["Defenders", "DF"],
    ["Midfielders", "MF"],
    ["Attackers", "FW"],
  ];
  els.retroTournamentBody.innerHTML = `
    <section class="retro-squad-view${isEuro2016 ? " is-compact-squad" : ""}${isWorldCup2026 ? " is-2026-squad" : ""}">
      <div class="retro-squad-heading">
        <div>${retroFlag(retroSquadTeamName, "retro-squad-flag")}<span>${isEuro2016
          ? `<small>UEFA EURO 2016 · Official ${squad.players.length}-player squad</small><strong>${escapeHtml(retroSquadTeamName)}</strong><em>Coach ${escapeHtml(squad.coach)}</em>`
          : `<small>Coach · ${squad.players.length}-player official squad</small><strong>${escapeHtml(squad.coach)}</strong><em>${escapeHtml(squad.formation)}${isWorldCup2026 ? "" : ` · Captain ${escapeHtml(squad.captain || "—")}`}</em>`
        }</span></div>
        <label>
          <span>Country</span>
          <select id="retroSquadTeamSelect">${available.map((team) => `<option value="${escapeHtml(team.name)}" ${team.name === retroSquadTeamName ? "selected" : ""}>${escapeHtml(team.name)}</option>`).join("")}</select>
        </label>
      </div>
      <div class="retro-squad-groups">
        ${positionGroups.map(([label, position]) => {
          const players = squad.players.filter((player) => retroBroadPosition(player.position) === position);
          return `
            <section class="retro-squad-position-group">
              <h2><span>${label}</span><b>${players.length}</b></h2>
              <div class="retro-squad-list">
                ${players.map((player) => `
                  <div class="retro-squad-row${!isEuro2016 && !isWorldCup2026 && startingNumbers.has(player.number) ? " is-likely-starter" : ""}"${!isEuro2016 && !isWorldCup2026 && player.ratingJustification ? ` title="${escapeHtml(player.ratingJustification)}"` : ""}>
                    <b class="retro-squad-number">${player.number}</b>
                    <span>
                      <strong>${escapeHtml(player.name)}${player.captain && !isWorldCup2026 ? " (C)" : ""}</strong>
                      ${isWorldCup2026 ? "" : `<small>${escapeHtml(player.club || player.position)}${!isFrance1998 && !isEuro2016 && !isCopa2024 && player.preferredFoot ? ` · ${escapeHtml(player.preferredFoot)} foot` : ""}</small>`}
                    </span>
                    ${isEuro2016 || isWorldCup2026 ? "" : `<em>${escapeHtml(player.position)}</em><i>${player.overall}</i>`}
                  </div>
                `).join("")}
              </div>
            </section>`;
        }).join("")}
      </div>
    </section>`;
}

const RETRO_MANAGER_FORMATIONS = Object.freeze([
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
]);
const RETRO_LINEUP_SLOT_ORDER_VERSION = 10;
const RETRO_MANAGER_SLOT_POSITIONS = Object.freeze({
  "4-3-3": Object.freeze(["GK", "LB", "CB", "CB", "RB", "LCM", "CM", "RCM", "LW", "ST", "RW"]),
  "4-2-3-1": Object.freeze(["GK", "LB", "CB", "CB", "RB", "CDM", "CDM", "LW", "CAM", "RW", "ST"]),
  "4-4-2": Object.freeze(["GK", "LB", "CB", "CB", "RB", "LM", "CM", "CM", "RM", "ST", "ST"]),
  "4-3-1-2": Object.freeze(["GK", "LB", "CB", "CB", "RB", "CM", "CDM", "CM", "CAM", "ST", "ST"]),
  "4-1-2-1-2": Object.freeze(["GK", "LB", "CB", "CB", "RB", "CDM", "CM", "CM", "CAM", "ST", "ST"]),
  "4-3-2-1": Object.freeze(["GK", "LB", "CB", "CB", "RB", "CM", "CDM", "CM", "LW", "RW", "ST"]),
  "4-1-4-1": Object.freeze(["GK", "LB", "CB", "CB", "RB", "CDM", "LM", "CM", "CM", "RM", "ST"]),
  "3-5-2": Object.freeze(["GK", "CB", "CB", "CB", "LWB", "CM", "CDM", "CM", "RWB", "ST", "ST"]),
  "3-4-1-2": Object.freeze(["GK", "CB", "CB", "CB", "LM", "CM", "CM", "RM", "CAM", "ST", "ST"]),
  "3-4-2-1": Object.freeze(["GK", "CB", "CB", "CB", "LWB", "CM", "CM", "RWB", "CAM", "CAM", "ST"]),
  "3-4-3": Object.freeze(["GK", "CB", "CB", "CB", "LM", "CM", "CM", "RM", "LW", "ST", "RW"]),
  "3-3-1-3": Object.freeze(["GK", "CB", "CB", "CB", "LM", "CM", "RM", "CAM", "LW", "ST", "RW"]),
  "5-3-2": Object.freeze(["GK", "LWB", "CB", "CB", "CB", "RWB", "CM", "CDM", "CM", "ST", "ST"]),
  "5-4-1": Object.freeze(["GK", "LWB", "CB", "CB", "CB", "RWB", "LM", "CM", "CM", "RM", "ST"]),
  "5-2-2-1": Object.freeze(["GK", "LWB", "CB", "CB", "CB", "RWB", "CM", "CM", "LM", "RM", "ST"]),
  "5-2-3": Object.freeze(["GK", "LWB", "CB", "CB", "CB", "RWB", "CM", "CM", "LW", "ST", "RW"]),
});
const RETRO_MANAGER_PITCH_POSITIONS = Object.freeze({
  "4-3-3": Object.freeze([[50, 89], [14, 68], [38, 68], [62, 68], [86, 68], [23, 43], [50, 47], [77, 43], [18, 29], [50, 13], [82, 29]]),
  "4-2-3-1": Object.freeze([[50, 89], [14, 70], [38, 70], [62, 70], [86, 70], [35, 53], [65, 53], [18, 34], [50, 32], [82, 34], [50, 12]]),
  "4-4-2": Object.freeze([[50, 89], [14, 70], [38, 70], [62, 70], [86, 70], [14, 44], [38, 47], [62, 47], [86, 44], [37, 17], [63, 17]]),
  "4-3-1-2": Object.freeze([[50, 89], [14, 70], [38, 70], [62, 70], [86, 70], [26, 47], [50, 52], [74, 47], [50, 31], [37, 14], [63, 14]]),
  "4-1-2-1-2": Object.freeze([[50, 89], [14, 70], [38, 70], [62, 70], [86, 70], [50, 55], [30, 42], [70, 42], [50, 29], [37, 13], [63, 13]]),
  "4-3-2-1": Object.freeze([[50, 89], [14, 70], [38, 70], [62, 70], [86, 70], [23, 49], [50, 53], [77, 49], [34, 29], [66, 29], [50, 11]]),
  "4-1-4-1": Object.freeze([[50, 89], [14, 70], [38, 70], [62, 70], [86, 70], [50, 57], [14, 39], [38, 42], [62, 42], [86, 39], [50, 12]]),
  "3-5-2": Object.freeze([[50, 89], [25, 70], [50, 72], [75, 70], [10, 47], [33, 46], [50, 51], [67, 46], [90, 47], [37, 17], [63, 17]]),
  "3-4-1-2": Object.freeze([[50, 89], [25, 70], [50, 72], [75, 70], [12, 46], [38, 49], [62, 49], [88, 46], [50, 30], [37, 14], [63, 14]]),
  "3-4-2-1": Object.freeze([[50, 89], [25, 70], [50, 72], [75, 70], [10, 47], [38, 49], [62, 49], [90, 47], [35, 27], [65, 27], [50, 10]]),
  "3-4-3": Object.freeze([[50, 89], [25, 70], [50, 72], [75, 70], [12, 45], [39, 48], [61, 48], [88, 45], [18, 29], [50, 12], [82, 29]]),
  "3-3-1-3": Object.freeze([[50, 89], [25, 71], [50, 73], [75, 71], [16, 49], [50, 52], [84, 49], [50, 34], [18, 20], [50, 12], [82, 20]]),
  "5-3-2": Object.freeze([[50, 89], [10, 68], [30, 72], [50, 74], [70, 72], [90, 68], [25, 45], [50, 49], [75, 45], [37, 14], [63, 14]]),
  "5-4-1": Object.freeze([[50, 89], [10, 69], [30, 73], [50, 75], [70, 73], [90, 69], [14, 43], [39, 47], [61, 47], [86, 43], [50, 12]]),
  "5-2-2-1": Object.freeze([[50, 89], [10, 69], [30, 73], [50, 75], [70, 73], [90, 69], [35, 48], [65, 48], [25, 28], [75, 28], [50, 10]]),
  "5-2-3": Object.freeze([[50, 89], [10, 69], [30, 73], [50, 75], [70, 73], [90, 69], [35, 45], [65, 45], [18, 29], [50, 11], [82, 29]]),
});

function retroBroadPosition(position) {
  if (position === "GK") return "GK";
  if (["CB", "LB", "RB", "LWB", "RWB", "SW", "DF"].includes(position)) return "DF";
  if (["CDM", "DM", "CM", "LCM", "RCM", "CAM", "AM", "LM", "RM", "MF"].includes(position)) return "MF";
  if (["ST", "CF", "SS", "LW", "RW", "LF", "RF", "FW"].includes(position)) return "FW";
  return "MF";
}

function sharedLineupManagerSupported(candidate = state) {
  if (candidate?.premierLeagueSeason) return Boolean(candidate.spectateTeamId);
  return Boolean(
    isRetroSimulatorState(candidate)
    && [1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2024, 2026].includes(Number(retroTournament?.year))
    && retroTournament?.managedTeam,
  );
}

function sharedLineupManagedTeamMatches(team) {
  if (!team || !sharedLineupManagerSupported()) return false;
  if (state?.premierLeagueSeason) return team.id === state.spectateTeamId;
  return team.name === retroTournament?.managedTeam;
}

function sharedLineupTeamByName(name) {
  const currentMatch = selectedMatch();
  const currentTeams = currentMatch
    ? [teamById(currentMatch.homeId), teamById(currentMatch.awayId)]
    : [];
  return currentTeams.find((team) => team?.name === name)
    || [...TEAM_BY_ID.values()].find((team) => team?.name === name)
    || null;
}

function premierLeagueManagerSquad(team) {
  if (!state?.premierLeagueSeason || !team) return null;
  const players = (team.playerProfiles || []).map((profile, index) => ({
    ...profile,
    number: Number.isInteger(profile.number) ? profile.number : index + 1,
    club: team.name,
    positions: [...new Set([profile.position, ...(profile.positions || [])].filter(Boolean))],
    overall: Number(profile.overall) || Number(team.rating) || 70,
  }));
  if (!players.length) return null;
  return {
    team: team.name,
    formation: sharedLineupManagedTeamMatches(team)
      ? standardFormationKey(state.standardFormation)
      : standardFormationKey(team.preferredFormation),
    players,
  };
}

function retroManagerSquadForTeam(teamOrName) {
  if (state?.premierLeagueSeason) {
    const team = typeof teamOrName === "string"
      ? sharedLineupTeamByName(teamOrName)
      : teamOrName;
    return premierLeagueManagerSquad(team);
  }
  if (!isRetroSimulatorState()) return null;
  const year = Number(retroTournament?.year);
  const teamName = typeof teamOrName === "string" ? teamOrName : teamOrName?.name;
  const source = retroSquadsForYear(year)?.[teamName];
  if (!source?.players?.length) return source;
  const team = typeof teamOrName === "string"
    ? teamById(retroTeamId(teamName, year))
    : teamOrName;
  const profiles = team?.playerProfiles || [];
  return {
    ...source,
    players: source.players.map((player) => {
      const profile = profiles.find((candidate) => (
        candidate.number === player.number || candidate.name === player.name
      ));
      const sourcePositions = [player.position, ...(player.positions || [])].filter(Boolean);
      const detailedPositions = sourcePositions.filter((position) => !["DF", "MF", "FW"].includes(position));
      const sourceGroup = player.squadGroup || retroBroadPosition(player.position);
      const sameGroupPosition = detailedPositions.find((position) => retroBroadPosition(position) === sourceGroup);
      const position = ["DF", "MF", "FW"].includes(player.position)
        ? sameGroupPosition || profile?.position || detailedPositions[0] || player.position
        : player.position;
      const positions = [...new Set([position, ...detailedPositions, ...sourcePositions])];
      return { ...player, position, positions, squadGroup: sourceGroup };
    }),
  };
}

const RETRO_POSITION_FIT = Object.freeze({
  GK: Object.freeze({ GK: 140 }),
  LB: Object.freeze({ LB: 140, LWB: 124, CB: 30, RB: 16, LM: 28 }),
  RB: Object.freeze({ RB: 140, RWB: 124, CB: 30, LB: 16, RM: 28 }),
  CB: Object.freeze({ CB: 140, LB: 24, RB: 24, CDM: 54, LWB: 18, RWB: 18 }),
  LWB: Object.freeze({ LWB: 140, LB: 132, LM: 106, LW: 78, CB: 50 }),
  RWB: Object.freeze({ RWB: 140, RB: 132, RM: 106, RW: 78, CB: 50 }),
  CDM: Object.freeze({ CDM: 140, DM: 140, CM: 112, CB: 92, CAM: 42 }),
  CM: Object.freeze({ CM: 140, CDM: 120, DM: 120, CAM: 112, LM: 92, RM: 92 }),
  LCM: Object.freeze({ CM: 140, CDM: 126, DM: 126, CAM: 122, AM: 122, LM: 118, RM: 72 }),
  RCM: Object.freeze({ CM: 140, CDM: 126, DM: 126, CAM: 122, AM: 122, RM: 118, LM: 72 }),
  CAM: Object.freeze({ CAM: 140, AM: 140, CM: 112, CF: 108, LW: 82, RW: 82, ST: 64 }),
  LM: Object.freeze({ LM: 140, LW: 126, LWB: 108, CM: 96, CAM: 86 }),
  RM: Object.freeze({ RM: 140, RW: 126, RWB: 108, CM: 96, CAM: 86 }),
  LW: Object.freeze({ LW: 140, LM: 124, RM: 110, CAM: 102, CF: 94, ST: 76, FW: 76, LWB: 58 }),
  RW: Object.freeze({ RW: 140, RM: 124, LM: 110, CAM: 102, CF: 94, ST: 76, FW: 76, RWB: 58 }),
  ST: Object.freeze({ ST: 140, CF: 128, SS: 120, LW: 78, RW: 78, CAM: 68 }),
  CF: Object.freeze({ CF: 140, ST: 126, SS: 124, CAM: 114, LW: 98, RW: 98 }),
  SS: Object.freeze({ SS: 140, CF: 132, ST: 118, CAM: 116, LW: 92, RW: 92 }),
});

function retroPlayerPositionFit(player, slotPosition) {
  const positions = [...new Set([player.position, ...(player.positions || [])].filter(Boolean))];
  const fitTable = RETRO_POSITION_FIT[slotPosition] || {};
  const detailedFit = positions.reduce((best, position, index) => (
    Math.max(best, (fitTable[position] || 0) - index * 3)
  ), 0);
  if (detailedFit) return detailedFit;
  const playerGroup = retroBroadPosition(player.position);
  const slotGroup = retroBroadPosition(slotPosition);
  if (playerGroup === slotGroup) return 46;
  if (playerGroup === "GK" || slotGroup === "GK") return -100;
  if (playerGroup === "MF") return 24;
  if (playerGroup === "FW" && slotGroup === "MF") return 14;
  return 0;
}

function retroPlayerSlotAssignmentScore(player, slot) {
  const fit = retroPlayerPositionFit(player, slot);
  const slotGroup = retroBroadPosition(slot);
  const primaryGroup = player.squadGroup || retroBroadPosition(player.position);
  const positions = [player.position, ...(player.positions || [])].filter(Boolean);
  const listedGroups = new Set(
    positions.map(retroBroadPosition),
  );
  const naturalWideEquivalent = (
    (slot === "LW" && positions.includes("LM"))
    || (slot === "RW" && positions.includes("RM"))
    || (slot === "LM" && positions.includes("LW"))
    || (slot === "RM" && positions.includes("RW"))
  );
  const crossedWideEquivalent = (
    (slot === "LW" && positions.includes("RM"))
    || (slot === "RW" && positions.includes("LM"))
  );
  const exactWideRole = ["LW", "RW", "LM", "RM"].includes(slot) && positions.includes(slot);
  const centralAttackerInWideSlot = ["LW", "RW"].includes(slot)
    && !exactWideRole
    && !naturalWideEquivalent
    && !crossedWideEquivalent;
  const primaryPosition = positions[0];
  let groupFit;
  if (slot === "CB") {
    groupFit = positions.includes("CB") ? 280 : primaryPosition === "DF" ? 180 : primaryGroup === "DF" ? 20 : 0;
  } else if (slot === "LB" || slot === "LWB") {
    groupFit = positions.some((position) => ["LB", "LWB"].includes(position))
      ? 270 : primaryPosition === "DF" ? 160 : primaryGroup === "DF" ? 24 : 0;
  } else if (slot === "RB" || slot === "RWB") {
    groupFit = positions.some((position) => ["RB", "RWB"].includes(position))
      ? 270 : primaryPosition === "DF" ? 160 : primaryGroup === "DF" ? 24 : 0;
  } else if (slot === "CM") {
    groupFit = ["CM", "CDM", "DM"].includes(primaryPosition)
      ? 230
      : ["CAM", "AM"].includes(primaryPosition) ? 40 : 120;
  } else if (["LCM", "RCM"].includes(slot)) {
    groupFit = primaryPosition === "CM"
      ? 230
      : ["CDM", "DM"].includes(primaryPosition) ? 205
        : ["CAM", "AM"].includes(primaryPosition) ? 165 : 120;
  } else {
    groupFit = exactWideRole || naturalWideEquivalent
      ? 190
      : crossedWideEquivalent
        ? 150
      : centralAttackerInWideSlot
        ? 30
      : primaryGroup === slotGroup
        ? 180
        : listedGroups.has(slotGroup) ? 70 : 0;
  }
  return fit + groupFit;
}

function retroOrderPlayersForSlots(players, slots) {
  if (players.length !== slots.length || players.length > 20) {
    const remaining = [...players];
    return slots.map((slot) => {
      const best = remaining
        .map((player, index) => ({ player, index, fit: retroPlayerPositionFit(player, slot) }))
        .sort((left, right) => right.fit - left.fit || right.player.overall - left.player.overall)[0];
      if (!best) return null;
      remaining.splice(best.index, 1);
      return best.player.number;
    }).filter((number) => number !== null);
  }

  const memo = new Map();
  const solve = (slotIndex, usedMask) => {
    if (slotIndex === slots.length) return { score: 0, numbers: [] };
    const key = `${slotIndex}:${usedMask}`;
    if (memo.has(key)) return memo.get(key);
    let best = null;
    players.forEach((player, playerIndex) => {
      const playerBit = 1 << playerIndex;
      if (usedMask & playerBit) return;
      const remainder = solve(slotIndex + 1, usedMask | playerBit);
      const slot = slots[slotIndex];
      const score = retroPlayerSlotAssignmentScore(player, slot) * 1000
        + (Number(player.overall) || 0)
        + remainder.score;
      if (!best || score > best.score) {
        best = { score, numbers: [player.number, ...remainder.numbers] };
      }
    });
    memo.set(key, best);
    return best;
  };
  return solve(0, 0)?.numbers || [];
}

function retroOrderStarterNumbers(players, formation) {
  const slots = RETRO_MANAGER_SLOT_POSITIONS[formation] || RETRO_MANAGER_SLOT_POSITIONS["4-3-3"];
  return retroOrderPlayersForSlots(players, slots);
}

function retroNormalizeStarterSlotOrder(players, starterNumbers, formation) {
  const byNumber = new Map(players.map((player) => [player.number, player]));
  const selectedPlayers = starterNumbers
    .map((number) => byNumber.get(number))
    .filter(Boolean);
  return selectedPlayers.length === starterNumbers.length
    ? retroOrderStarterNumbers(selectedPlayers, formation)
    : starterNumbers;
}

function retroSelectBestStarterNumbers(players, preferredNumbers, formation) {
  const slots = RETRO_MANAGER_SLOT_POSITIONS[formation] || RETRO_MANAGER_SLOT_POSITIONS["4-3-3"];
  if (players.length < slots.length) return [];
  const preferred = new Set(preferredNumbers || []);
  const england2026Midfield = new Set(["Declan Rice", "Jude Bellingham", "Elliot Anderson"]);
  const lockEngland2026Midfield = [...england2026Midfield].every(
    (name) => players.some((player) => player.name === name),
  );
  const eligibleForSlot = (player, slot) => {
    const slotGroup = retroBroadPosition(slot);
    const primaryGroup = player.squadGroup || retroBroadPosition(player.position);
    const positions = [player.position, ...(player.positions || [])].filter(Boolean);
    const listedGroups = new Set(positions.map(retroBroadPosition));
    if (slotGroup === "GK") return primaryGroup === "GK";
    if (primaryGroup === "GK") return false;
    if (slotGroup === "DF") return primaryGroup === "DF" || listedGroups.has("DF");
    if (slotGroup === "MF") {
      return primaryGroup === "MF"
        || listedGroups.has("MF")
        || (["LM", "RM"].includes(slot) && listedGroups.has("FW"));
    }
    return primaryGroup === "FW"
      || listedGroups.has("FW")
      || (slot === "LW" && positions.some((position) => ["LM", "RM"].includes(position)))
      || (slot === "RW" && positions.some((position) => ["RM", "LM"].includes(position)));
  };
  const scores = slots.map((slot) => players.map((player) => {
    if (!eligibleForSlot(player, slot)) return -1_000_000_000;
    return retroPlayerSlotAssignmentScore(player, slot) * 1000
      + (preferred.has(player.number) ? 26000 : 0)
      + (lockEngland2026Midfield && england2026Midfield.has(player.name) ? 300000 : 0)
      + (Number(player.startingXILikelihood) || 0) * 5000
      + (Number(player.overall) || 0) * 10;
  }));

  // Rectangular Hungarian assignment: every pitch slot gets one unique player.
  const slotCount = slots.length;
  const playerCount = players.length;
  const rowPotential = Array(slotCount + 1).fill(0);
  const columnPotential = Array(playerCount + 1).fill(0);
  const matchedRow = Array(playerCount + 1).fill(0);
  const previousColumn = Array(playerCount + 1).fill(0);
  for (let row = 1; row <= slotCount; row += 1) {
    matchedRow[0] = row;
    let column = 0;
    const minimum = Array(playerCount + 1).fill(Number.POSITIVE_INFINITY);
    const used = Array(playerCount + 1).fill(false);
    do {
      used[column] = true;
      const activeRow = matchedRow[column];
      let delta = Number.POSITIVE_INFINITY;
      let nextColumn = 0;
      for (let candidate = 1; candidate <= playerCount; candidate += 1) {
        if (used[candidate]) continue;
        const cost = -scores[activeRow - 1][candidate - 1]
          - rowPotential[activeRow]
          - columnPotential[candidate];
        if (cost < minimum[candidate]) {
          minimum[candidate] = cost;
          previousColumn[candidate] = column;
        }
        if (minimum[candidate] < delta) {
          delta = minimum[candidate];
          nextColumn = candidate;
        }
      }
      for (let candidate = 0; candidate <= playerCount; candidate += 1) {
        if (used[candidate]) {
          rowPotential[matchedRow[candidate]] += delta;
          columnPotential[candidate] -= delta;
        } else {
          minimum[candidate] -= delta;
        }
      }
      column = nextColumn;
    } while (matchedRow[column] !== 0);
    do {
      const prior = previousColumn[column];
      matchedRow[column] = matchedRow[prior];
      column = prior;
    } while (column !== 0);
  }
  const playerIndexBySlot = Array(slotCount).fill(-1);
  for (let column = 1; column <= playerCount; column += 1) {
    if (matchedRow[column]) playerIndexBySlot[matchedRow[column] - 1] = column - 1;
  }
  if (playerIndexBySlot.some((playerIndex, slotIndex) => (
    playerIndex < 0 || scores[slotIndex][playerIndex] <= -1_000_000_000
  ))) return [];
  return playerIndexBySlot.map((playerIndex) => players[playerIndex].number);
}

function retroSelectAvailableStarterNumbers(availablePlayers, preferredNumbers, formation) {
  const slots = RETRO_MANAGER_SLOT_POSITIONS[formation] || RETRO_MANAGER_SLOT_POSITIONS["4-3-3"];
  const byNumber = new Map(availablePlayers.map((player) => [player.number, player]));
  const used = new Set();
  return slots.map((slot, index) => {
    const preferred = byNumber.get(preferredNumbers[index]);
    if (preferred && !used.has(preferred.number)) {
      used.add(preferred.number);
      return preferred.number;
    }
    const replacement = availablePlayers
      .filter((player) => !used.has(player.number))
      .map((player) => ({ player, fit: retroPlayerPositionFit(player, slot) }))
      .sort((left, right) => right.fit - left.fit || right.player.overall - left.player.overall)[0]
      ?.player;
    if (!replacement) return null;
    used.add(replacement.number);
    return replacement.number;
  }).filter((number) => number !== null);
}

function sharedLineupDefaultForTeam(team) {
  if (!team) return null;
  if (state?.premierLeagueSeason) {
    const squad = retroManagerSquadForTeam(team);
    if (!squad?.players?.length) return null;
    const requestedFormation = sharedLineupManagedTeamMatches(team)
      ? state.managerLineups?.[team.id]?.formation || state.standardFormation
      : team.selectedFormation || team.preferredFormation;
    const formation = standardFormationKey(requestedFormation || squad.formation || "4-3-3");
    const unavailable = new Set(unavailablePlayersForTeam(team.id, state.activeRound));
    const availablePlayers = squad.players.filter((player) => !unavailable.has(player.name));
    const preferredNumbers = squad.players
      .filter((player) => Number(player.startingXILikelihood) > 0)
      .map((player) => player.number);
    const starterNumbers = retroSelectBestStarterNumbers(
      availablePlayers,
      preferredNumbers,
      formation,
    );
    return {
      formation,
      players: starterNumbers
        .map((number) => availablePlayers.find((player) => player.number === number))
        .filter(Boolean),
    };
  }
  const year = Number(retroTournament?.year);
  const lineup = RETRO_WORLD_CUP_ENGINE.startingXI(year, team.name);
  const squad = retroManagerSquadForTeam(team);
  const formation = RETRO_MANAGER_FORMATIONS.includes(lineup?.formation) ? lineup.formation : "4-3-3";
  const preferredNumbers = lineup.players.map((player) => player.number);
  const orderedNumbers = retroSelectBestStarterNumbers(squad?.players || lineup.players, preferredNumbers, formation);
  return {
    ...lineup,
    formation,
    players: orderedNumbers
      .map((number) => squad?.players.find((player) => player.number === number))
      .filter(Boolean),
  };
}

function retroFormationDefenderCount(formation) {
  const slots = RETRO_MANAGER_SLOT_POSITIONS[formation] || [];
  return slots.filter((slot) => possessionPositionGroup(slot) === "defender").length;
}

function retroRemapMissingSlots(management, missingEntries = Object.values(management?.missingSlots || {})) {
  if (!management) return;
  management.missingSlots = Object.fromEntries(
    missingEntries
      .map((missing) => [management.activeStarters.indexOf(missing.number), missing])
      .filter(([index]) => index >= 0),
  );
}

function retroOrderStartersForFormationChange(players, currentNumbers, currentFormation, nextFormation) {
  const nextSlots = RETRO_MANAGER_SLOT_POSITIONS[nextFormation] || RETRO_MANAGER_SLOT_POSITIONS["4-3-3"];
  if (retroFormationDefenderCount(currentFormation) !== 4 || retroFormationDefenderCount(nextFormation) !== 4) {
    return retroOrderPlayersForSlots(players, nextSlots);
  }
  const playersByNumber = new Map(players.map((player) => [player.number, player]));
  const unchangedBackFive = currentNumbers.slice(0, 5).filter((number) => playersByNumber.has(number));
  if (unchangedBackFive.length !== 5) return retroOrderPlayersForSlots(players, nextSlots);
  const unchangedNumbers = new Set(unchangedBackFive);
  const remainingPlayers = players.filter((player) => !unchangedNumbers.has(player.number));
  return [
    ...unchangedBackFive,
    ...retroOrderPlayersForSlots(remainingPlayers, nextSlots.slice(5)),
  ];
}

function retroManagerLineupForTeam(team) {
  if (state?.premierLeagueSeason) {
    if (!team || !sharedLineupManagedTeamMatches(team)) return null;
    const squad = retroManagerSquadForTeam(team);
    if (!squad?.players?.length) return null;
    state.managerLineups ||= {};
    const saved = state.managerLineups[team.id] || {};
    const formation = RETRO_MANAGER_FORMATIONS.includes(saved.formation)
      ? saved.formation
      : standardFormationKey(state.standardFormation || squad.formation);
    const unavailableNames = new Set(unavailablePlayersForTeam(team.id, state.activeRound));
    const availablePlayers = squad.players.filter((player) => !unavailableNames.has(player.name));
    const validNumbers = new Set(availablePlayers.map((player) => player.number));
    const savedStarters = Array.isArray(saved.starters) ? saved.starters : [];
    const defaultLineup = sharedLineupDefaultForTeam(team);
    const defaultStarters = defaultLineup?.players.map((player) => player.number) || [];
    let preferredStarters = savedStarters.length === 11 && new Set(savedStarters).size === 11
      ? savedStarters
      : defaultStarters;
    if (saved.slotOrderVersion !== RETRO_LINEUP_SLOT_ORDER_VERSION) {
      preferredStarters = retroSelectBestStarterNumbers(
        squad.players,
        preferredStarters,
        formation,
      );
    }
    const starters = preferredStarters.length === 11
      && preferredStarters.every((number) => validNumbers.has(number))
      ? preferredStarters
      : retroSelectAvailableStarterNumbers(availablePlayers, preferredStarters, formation);
    const lineup = { formation, starters, slotOrderVersion: RETRO_LINEUP_SLOT_ORDER_VERSION };
    state.managerLineups[team.id] = lineup;
    state.standardFormation = formation;
    team.selectedFormation = formation;
    return lineup;
  }
  if (
    !team
    || !isRetroSimulatorState()
    || ![1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2024, 2026].includes(Number(retroTournament?.year))
    || team.name !== retroTournament?.managedTeam
  ) return null;
  const squad = retroManagerSquadForTeam(team);
  if (!squad?.players?.length) return null;
  retroTournament.managerLineups ||= {};
  const saved = retroTournament.managerLineups[team.name] || {};
  const unavailableNames = new Set(unavailablePlayersForTeam(team.id, state.activeRound));
  const availablePlayers = squad.players.filter((player) => !unavailableNames.has(player.name));
  const validNumbers = new Set(availablePlayers.map((player) => player.number));
  const savedStarters = Array.isArray(saved.starters) ? saved.starters : [];
  const defaultStarters = RETRO_WORLD_CUP_ENGINE.startingXI(Number(retroTournament.year), team.name).players
    .map((player) => player.number);
  const formation = RETRO_MANAGER_FORMATIONS.includes(saved.formation)
    ? saved.formation
    : RETRO_MANAGER_FORMATIONS.includes(squad.formation) ? squad.formation : "4-3-3";
  let preferredStarters = savedStarters.length === 11 && new Set(savedStarters).size === 11
    ? savedStarters
    : defaultStarters;
  if (saved.slotOrderVersion !== RETRO_LINEUP_SLOT_ORDER_VERSION) {
    preferredStarters = retroSelectBestStarterNumbers(
      squad.players,
      preferredStarters,
      formation,
    );
  }
  const starters = preferredStarters.every((number) => validNumbers.has(number))
    ? preferredStarters
    : retroSelectAvailableStarterNumbers(availablePlayers, preferredStarters, formation);
  const lineup = { formation, starters, slotOrderVersion: RETRO_LINEUP_SLOT_ORDER_VERSION };
  retroTournament.managerLineups[team.name] = lineup;
  return lineup;
}

function retroManagerCanEditMatch(match) {
  if (state?.premierLeagueSeason) {
    return Boolean(
      state.spectateTeamId
      && !match?.result?.revealed
      && [match?.homeId, match?.awayId].includes(state.spectateTeamId),
    );
  }
  return Boolean(
    isRetroSimulatorState()
    && [1998, 2002, 2006, 2010, 2014, 2016, 2018, 2022, 2024, 2026].includes(Number(retroTournament?.year))
    && retroTournament?.managedTeam
    && !match?.result?.revealed
    && [match?.home, match?.away, teamById(match?.homeId)?.name, teamById(match?.awayId)?.name]
      .includes(retroTournament.managedTeam),
  );
}

function retroManagerPlayerMarkup(
  player,
  starting,
  selected,
  disabled,
  { substitution = false, previewOutgoing = false } = {},
) {
  const playerContext = player.club || player.position;
  const interactionAttribute = previewOutgoing
    ? `data-retro-sub-undo-out="${player.number}"`
    : substitution
    ? `data-retro-sub-player="${player.number}" data-retro-sub-role="in"`
    : `data-retro-lineup-player="${player.number}"`;
  return `
    <button
      class="retro-manager-player ${starting ? "is-starter" : "is-bench"} ${selected ? "is-selected" : ""} ${previewOutgoing ? "is-preview-out" : ""}"
      type="button"
      ${interactionAttribute}
      aria-pressed="${selected}"
      draggable="${!disabled && !previewOutgoing}"
      ${disabled ? "disabled" : ""}
      ${previewOutgoing ? `aria-label="Undo substitution for ${escapeHtml(player.name)}"` : ""}
    >
      <b>${player.number}</b>
      <span><strong>${escapeHtml(player.name)}</strong><small>${previewOutgoing ? "Tap to undo change" : escapeHtml(playerContext)}</small></span>
      <em>${previewOutgoing ? "UNDO" : player.position}</em>
      <i>${player.overall}</i>
    </button>`;
}

function retroPitchPlayerMarkup(
  player,
  index,
  formation,
  { managed = false, disabled = false, ratingEntry = null, substitution = false, previewIncoming = false } = {},
) {
  const positions = RETRO_MANAGER_PITCH_POSITIONS[formation] || RETRO_MANAGER_PITCH_POSITIONS["4-3-3"];
  const [x, y] = positions[index] || [50, 50];
  const selected = Number(substitution ? retroLiveSubOutNumber : retroLineupSwapNumber) === player.number;
  const interactionAttributes = substitution
    ? `data-retro-sub-player="${player.number}" data-retro-sub-role="out" aria-pressed="${selected}" draggable="${!disabled}"`
    : managed
      ? `data-retro-lineup-player="${player.number}" data-retro-lineup-slot="${index}" aria-pressed="${selected}" draggable="${!disabled}"`
      : "disabled";
  const shirtNumber = player.number ?? "—";
  const rating = Number(ratingEntry?.rating);
  const metric = Number.isFinite(rating) ? rating.toFixed(1) : player.overall;
  const metricClass = Number.isFinite(rating) ? retroRatingTone(rating) : "";
  return `
    <button
      class="retro-pitch-player ${selected ? "is-selected" : ""} ${previewIncoming ? "is-preview-in" : ""} ${Number.isFinite(rating) ? "has-rating" : ""}"
      type="button"
      style="--pitch-x:${x}%;--pitch-y:${y}%"
      ${interactionAttributes}
      ${disabled && (managed || substitution) ? "disabled" : ""}
      title="${escapeHtml(player.name)} · ${player.position} · ${player.overall}"
    >
      <b>${shirtNumber}</b>
      <span>${escapeHtml(player.name.split(" ").at(-1))}</span>
      <i class="${metricClass}">${metric}</i>
    </button>`;
}

function retroPitchMissingPlayerMarkup(missing, index, formation, canReplace = false) {
  const positions = RETRO_MANAGER_PITCH_POSITIONS[formation] || RETRO_MANAGER_PITCH_POSITIONS["4-3-3"];
  const [x, y] = positions[index] || [50, 50];
  const injuryCanBeReplaced = canReplace && missing.type === "injury";
  return `
    <button
      class="retro-pitch-player is-missing ${missing.type === "red" ? "is-dismissed" : "is-injured"}"
      type="button"
      style="--pitch-x:${x}%;--pitch-y:${y}%"
      ${injuryCanBeReplaced
        ? `data-retro-sub-player="${missing.number}" data-retro-sub-role="out" draggable="true"`
        : "disabled"}
      title="${escapeHtml(missing.name)} · ${missing.type === "red" ? "Sent off" : "Injured"}"
    >
      <b>${missing.type === "red" ? "RC" : "+"}</b>
      <span>${escapeHtml(missing.name.split(" ").at(-1))}</span>
      <i>${missing.type === "red" ? "Sent off" : "Injured"}</i>
    </button>`;
}

function retroSortedBenchPlayers(squad, starters) {
  const starterNumbers = new Set(starters.map((player) => player.number));
  const starterNames = new Set(starters.map((player) => player.name));
  const positionOrder = { GK: 0, DF: 1, MF: 2, FW: 3 };
  return (squad?.players || [])
    .filter((player) => !starterNumbers.has(player.number) && !starterNames.has(player.name))
    .sort((left, right) => (
      (positionOrder[retroBroadPosition(left.position)] ?? 4) - (positionOrder[retroBroadPosition(right.position)] ?? 4)
      || right.overall - left.overall
      || left.number - right.number
    ));
}

function retroOpponentPitchMarkup(teamName) {
  const team = state?.premierLeagueSeason
    ? sharedLineupTeamByName(teamName)
    : teamById(retroTeamId(teamName, Number(retroTournament?.year)));
  const squad = retroManagerSquadForTeam(team);
  const lineup = sharedLineupDefaultForTeam(team);
  if (!team || !squad || !lineup) return "";
  const supportedFormation = RETRO_MANAGER_FORMATIONS.includes(lineup.formation) ? lineup.formation : "4-3-3";
  const unavailable = new Set(unavailablePlayersForTeam(team?.id, state.activeRound));
  const available = (squad?.players || lineup.players).filter((player) => !unavailable.has(player.name));
  const orderedNumbers = retroSelectAvailableStarterNumbers(
    available,
    lineup.players.map((player) => player.number),
    supportedFormation,
  );
  const players = orderedNumbers
    .map((number) => available.find((player) => player.number === number))
    .filter(Boolean);
  const bench = retroSortedBenchPlayers(squad, players)
    .filter((player) => !unavailable.has(player.name));
  return `
    <section class="retro-manager-lineup is-opponent">
      <div class="retro-manager-layout">
        <div class="retro-manager-pitch-box">
          <div class="retro-pitch-corner-control">
            <b class="retro-formation-badge">${escapeHtml(lineup.formation)}</b>
          </div>
          <div class="retro-manager-pitch" aria-label="${escapeHtml(teamName)} starting formation">
            <span class="retro-pitch-halfway" aria-hidden="true"></span>
            <span class="retro-pitch-circle" aria-hidden="true"></span>
            ${players.map((player, index) => retroPitchPlayerMarkup(player, index, supportedFormation)).join("")}
          </div>
        </div>
        <div class="retro-manager-section is-bench">
          <div class="retro-manager-section-title">
            <strong>Bench</strong>
            <span>${bench.length} players</span>
          </div>
          <div class="retro-manager-player-list is-bench-list">
            ${bench.map((player) => retroManagerPlayerMarkup(
              player,
              false,
              false,
              true,
            )).join("")}
          </div>
        </div>
      </div>
    </section>`;
}

function retroManagerLineupMarkup(teamName, match) {
  const team = state?.premierLeagueSeason
    ? sharedLineupTeamByName(teamName)
    : teamById(retroTeamId(teamName, Number(retroTournament?.year)));
  const lineup = retroManagerLineupForTeam(team);
  const squad = retroManagerSquadForTeam(team);
  if (!lineup || !squad) return retroLineupSideMarkup(teamName);
  const starters = lineup.starters
    .map((number) => squad.players.find((player) => player.number === number))
    .filter(Boolean);
  const unavailableNames = new Set(unavailablePlayersForTeam(team.id, state.activeRound));
  const bench = retroSortedBenchPlayers(squad, starters)
    .filter((player) => !unavailableNames.has(player.name));
  const live = Boolean(livePlayback?.matchId === match.id);
  return `
    <section class="retro-manager-lineup" data-team-name="${escapeHtml(teamName)}">
      <p class="retro-manager-hint">${live
        ? "Formation changes apply from the next passage of play."
        : retroLineupSwapNumber
          ? "Drop or choose the player to swap with."
          : "Drag players between the pitch and bench, or choose two players to swap."}</p>
      <div class="retro-manager-layout">
        <div class="retro-manager-pitch-box">
          <div class="retro-pitch-corner-control">
            <label>
              <select data-retro-manager-formation aria-label="${escapeHtml(teamName)} formation">
                ${RETRO_MANAGER_FORMATIONS.map((formation) => (
                  `<option value="${formation}" ${formation === lineup.formation ? "selected" : ""}>${formation}</option>`
                )).join("")}
              </select>
            </label>
          </div>
          <div class="retro-manager-pitch" aria-label="${escapeHtml(teamName)} starting formation">
            <span class="retro-pitch-halfway" aria-hidden="true"></span>
            <span class="retro-pitch-circle" aria-hidden="true"></span>
            ${starters.map((player, index) => retroPitchPlayerMarkup(
              player,
              index,
              lineup.formation,
              { managed: true, disabled: live },
            )).join("")}
          </div>
        </div>
        <div class="retro-manager-section is-bench">
          <div class="retro-manager-section-title"><strong>Bench</strong><span>${bench.length} players</span></div>
          <div class="retro-manager-player-list is-bench-list">
            ${bench.map((player) => retroManagerPlayerMarkup(
              player,
              false,
              Number(retroLineupSwapNumber) === player.number,
              live,
            )).join("")}
          </div>
        </div>
      </div>
    </section>`;
}

function retroRatingTone(rating) {
  if (rating >= 8) return "is-excellent";
  if (rating >= 7) return "is-good";
  if (rating >= 6) return "is-average";
  if (rating < 6) return "is-poor";
  return "is-average";
}

function retroDisplayedRatingEntry(match, side, ratings, player) {
  const matched = livePlayerRatingEntry(ratings, player);
  const matchedRating = Number(matched?.rating);
  if (
    livePlayback
    || !match?.result?.revealed
    || (Number.isFinite(matchedRating) && Math.abs(matchedRating - 6.5) >= 0.01)
  ) return matched || { rating: 6.5, delta: 0, reason: "" };

  const result = match.result;
  const teamId = side === "home" ? match.homeId : match.awayId;
  const goalsAgainst = Number(side === "home" ? result.awayGoals : result.homeGoals) || 0;
  const goalEvents = side === "home" ? result.homeEvents || [] : result.awayEvents || [];
  const playerKey = liveRatingNameKey(player.name);
  const scored = goalEvents.filter((event) => liveRatingNameKey(event.scorer) === playerKey).length;
  const assisted = goalEvents.filter((event) => liveRatingNameKey(event.assist) === playerKey).length;
  const won = result.winnerId === teamId;
  const lost = Boolean(result.winnerId && !won);
  const positionGroup = possessionPositionGroup(player.position);
  const variation = ((stableHash(`${match.id}:${side}:${player.name}`) % 9) - 4) * 0.04;
  let rating = 6.25 + (won ? 0.35 : lost ? -0.15 : 0.05) + variation + scored * 0.95 + assisted * 0.42;
  let reason = won ? "Winning performance" : lost ? "Defeat" : "Full time";
  if (goalsAgainst === 0 && ["goalkeeper", "defender"].includes(positionGroup)) {
    rating += positionGroup === "goalkeeper" ? 0.42 : 0.3;
    if (!scored && !assisted) reason = "Clean sheet";
  } else if (goalsAgainst > 1 && ["goalkeeper", "defender"].includes(positionGroup)) {
    rating -= Math.min(0.45, (goalsAgainst - 1) * 0.12);
  }
  if (scored) reason = scored > 1 ? `${scored} goals` : "Goal";
  else if (assisted) reason = assisted > 1 ? `${assisted} assists` : "Assist";
  const finalRating = Number(simulationClamp(rating, 3, 10).toFixed(2));
  return {
    ...(matched || {}),
    rating: finalRating,
    delta: Number((finalRating - 6.5).toFixed(2)),
    reason,
    playerNumber: matched?.playerNumber ?? player.number ?? null,
  };
}

function retroLiveRatingsSideMarkup(teamName, side, ratings, match) {
  const team = teamById(side === "home" ? match.homeId : match.awayId);
  const orderedProfiles = match2dState?.presentation?.[side]?.players
    || playerProfilesForTeam(team).filter((profile) => livePlayerRatingEntry(ratings, profile));
  const managed = sharedLineupManagedTeamMatches(team);
  const lineup = managed ? retroManagerLineupForTeam(team) : null;
  return `
    <section class="retro-live-ratings-side">
      <header>
        ${retroFlag(teamName, "retro-lineup-flag")}
        <span><small>${livePlayback ? "LIVE RATINGS" : "MATCH RATINGS"}</small><strong>${escapeHtml(teamName)}</strong></span>
        ${managed && lineup ? `
          <label>
            <span>Formation</span>
            <select data-retro-manager-formation aria-label="${escapeHtml(teamName)} formation">
              ${RETRO_MANAGER_FORMATIONS.map((formation) => (
                `<option value="${formation}" ${formation === lineup.formation ? "selected" : ""}>${formation}</option>`
              )).join("")}
            </select>
          </label>` : ""}
      </header>
      <div class="retro-live-rating-list">
        ${orderedProfiles.map((profile) => {
          const entry = retroDisplayedRatingEntry(match, side, ratings, profile);
          return `
            <div class="retro-live-rating-row">
              <span><strong>${escapeHtml(profile.name)}</strong><small>${escapeHtml(entry.reason || profile.position)}</small></span>
              <b class="${retroRatingTone(entry.rating)}">${Number(entry.rating).toFixed(1)}</b>
            </div>`;
        }).join("")}
      </div>
    </section>`;
}

function retroLivePitchRatingsSideMarkup(teamName, side, ratings, match) {
  const team = teamById(side === "home" ? match.homeId : match.awayId);
  const squad = retroManagerSquadForTeam(team);
  const presentationSide = match2dState?.presentation?.[side];
  const managed = sharedLineupManagedTeamMatches(team);
  const lineup = managed ? retroManagerLineupForTeam(team) : null;
  const teamManagement = retroLiveTeamManagement(team.id) || match.result?.retroFinalManagement?.[team.id];
  const substitutions = managed ? retroLiveSubstitutionState(match) : null;
  const fallback = sharedLineupDefaultForTeam(team);
  if (!fallback) return "";
  const requestedFormation = teamManagement?.formation || lineup?.formation || presentationSide?.formation || fallback.formation;
  const formation = RETRO_MANAGER_FORMATIONS.includes(requestedFormation) ? requestedFormation : "4-3-3";
  let starterSlots = teamManagement?.activeStarters?.length === 11 && squad
    ? teamManagement.activeStarters
      .map((number) => squad.players.find((player) => player.number === number) || null)
    : presentationSide?.players?.length === 11 ? [...presentationSide.players] : [];
  if (starterSlots.length !== 11 && lineup && squad) {
    starterSlots = lineup.starters
      .map((number) => squad.players.find((player) => player.number === number) || null);
  }
  if (starterSlots.length !== 11) {
    const orderedNumbers = retroOrderStarterNumbers(fallback.players, formation);
    starterSlots = orderedNumbers
      .map((number) => fallback.players.find((player) => player.number === number) || null);
  }
  starterSlots = starterSlots.map((player) => {
    if (!player) return null;
    const squadPlayer = squad?.players?.find((candidate) => (
      candidate.number === player.number || candidate.name === player.name
    ));
    return {
      ...squadPlayer,
      ...player,
      number: player.number ?? squadPlayer?.number ?? "—",
    };
  });
  const pendingChanges = managed ? retroPendingSubstitutionChanges() : [];
  const pendingOutgoingNumbers = new Set(pendingChanges.map((change) => change.outgoingNumber));
  const pendingIncomingNumbers = new Set(pendingChanges.map((change) => change.incomingNumber));
  const previewSlots = [...starterSlots];
  const pendingSlots = new Map();
  pendingChanges.forEach((change) => {
    const slot = teamManagement?.activeStarters.indexOf(change.outgoingNumber) ?? -1;
    const incoming = squad?.players.find((player) => player.number === change.incomingNumber);
    if (slot >= 0 && incoming) {
      previewSlots[slot] = incoming;
      pendingSlots.set(slot, change);
    }
  });
  const unavailableNumbers = new Set([
    ...(teamManagement?.subbedOut || []),
    ...((teamManagement?.unavailableNumbers || []).filter((number) => (
      !pendingOutgoingNumbers.has(number)
      || teamManagement?.missingSlots?.[teamManagement.activeStarters.indexOf(number)]?.type === "red"
    ))),
  ]);
  const unavailableNames = new Set(unavailablePlayersForTeam(team.id, state.activeRound));
  const bench = retroSortedBenchPlayers(squad, previewSlots.filter(Boolean))
    .filter((player) => !unavailableNumbers.has(player.number) && !unavailableNames.has(player.name));
  const limits = substitutions ? retroLiveSubstitutionLimits(match) : null;
  const canSubstitute = Boolean(managed && substitutions && livePlayback?.phase === "match");
  const selectedOutgoing = retroLiveSubOutNumber === null
    ? null
    : squad?.players.find((player) => player.number === retroLiveSubOutNumber);
  return `
    <section class="retro-manager-lineup is-live-ratings">
      <div class="retro-manager-layout is-live">
        <div class="retro-manager-pitch-box">
          <div class="retro-pitch-corner-control">
            ${managed && livePlayback ? `
              <label>
                <select data-retro-manager-formation aria-label="${escapeHtml(teamName)} formation">
                  ${RETRO_MANAGER_FORMATIONS.map((option) => (
                    `<option value="${option}" ${option === formation ? "selected" : ""}>${option}</option>`
                  )).join("")}
                </select>
              </label>` : `<b class="retro-formation-badge">${escapeHtml(formation)}</b>`}
          </div>
          ${substitutions ? pendingChanges.length ? `
            <div class="retro-pitch-sub-counter is-pending" aria-label="Confirm substitution batch">
              <span>${pendingChanges.length} change${pendingChanges.length === 1 ? "" : "s"}</span>
              <button type="button" data-retro-sub-action="cancel">Cancel</button>
              <button type="button" data-retro-sub-action="confirm">Confirm all</button>
            </div>` : `
            <div class="retro-pitch-sub-counter" aria-label="Substitution allowances">
              <span>${substitutions.used}/${limits.substitutions} subs</span>
              <span>${substitutions.stoppages}/${limits.stoppages} stoppages</span>
            </div>` : ""}
          <div class="retro-manager-pitch" aria-label="${escapeHtml(teamName)} match ratings formation">
            <span class="retro-pitch-halfway" aria-hidden="true"></span>
            <span class="retro-pitch-circle" aria-hidden="true"></span>
            ${previewSlots.map((player, index) => {
              const missing = teamManagement?.missingSlots?.[index];
              if (missing && !pendingSlots.has(index)) {
                return retroPitchMissingPlayerMarkup(missing, index, formation, canSubstitute);
              }
              if (!player) return "";
              return retroPitchPlayerMarkup(
                player,
                index,
                formation,
                {
                  disabled: !canSubstitute || pendingIncomingNumbers.has(player.number),
                  substitution: canSubstitute,
                  previewIncoming: pendingSlots.has(index),
                  ratingEntry: retroDisplayedRatingEntry(match, side, ratings, player),
                },
              );
            }).join("")}
          </div>
        </div>
        <div class="retro-manager-section is-bench">
          <div class="retro-manager-section-title">
            <strong>Bench</strong>
            <span>${bench.length} players</span>
          </div>
          <div class="retro-manager-player-list is-bench-list">
            ${bench.map((player) => retroManagerPlayerMarkup(
              player,
              false,
              player.number === retroLiveSubInNumber,
              !canSubstitute
                || (
                  !pendingOutgoingNumbers.has(player.number)
                  && Boolean(selectedOutgoing && !retroSubstitutionPositionsCompatible(selectedOutgoing, player))
                ),
              {
                substitution: canSubstitute,
                previewOutgoing: pendingOutgoingNumbers.has(player.number),
              },
            )).join("")}
          </div>
        </div>
      </div>
    </section>`;
}

function retroLineupTabsMarkup(managedTeam, opponentTeam) {
  return `
    <div class="retro-lineup-tabs" role="tablist" aria-label="Team sheet">
      <button type="button" role="tab" data-retro-lineup-tab="managed" aria-selected="${retroLineupPanelView === "managed"}" class="${retroLineupPanelView === "managed" ? "active" : ""}">
        ${retroFlag(managedTeam.name, "retro-lineup-tab-flag")}<span>Your XI</span>
      </button>
      <button type="button" role="tab" data-retro-lineup-tab="opponent" aria-selected="${retroLineupPanelView === "opponent"}" class="${retroLineupPanelView === "opponent" ? "active" : ""}">
        ${retroFlag(opponentTeam.name, "retro-lineup-tab-flag")}<span>Opposition</span>
      </button>
    </div>`;
}

function renderRetroMatchLineupsPanel(match) {
  const premierLeagueManagerMatch = Boolean(
    state?.premierLeagueSeason
    && state.spectateTeamId
    && [match?.homeId, match?.awayId].includes(state.spectateTeamId),
  );
  if (
    !els.retroMatchLineupsPanel
    || !els.retroMatchLineupsBody
    || (!isRetroSimulatorState() && !premierLeagueManagerMatch)
    || !match
  ) return;
  repairFlatSavedPlayerRatings(match);
  const previousBenchScroll = els.retroMatchLineupsBody
    .querySelector(".retro-manager-section.is-bench .retro-manager-player-list")
    ?.scrollTop || 0;
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const ratings = livePlayback?.matchId === match.id
    ? livePlayback.playerRatings
    : match.result?.playerRatings;
  const wasOpen = els.retroMatchLineupsPanel.open;
  const managedTeam = [home, away].find((team) => sharedLineupManagedTeamMatches(team));
  const opponentTeam = managedTeam ? (managedTeam.id === home.id ? away : home) : null;
  const managedSide = managedTeam?.id === home.id ? "home" : "away";
  const opponentSide = managedSide === "home" ? "away" : "home";
  const useTabbedManager = Boolean(managedTeam && opponentTeam && retroManagerLineupForTeam(managedTeam));
  if (ratings && useTabbedManager) {
    els.retroMatchLineupsPanel.querySelector("summary").textContent = livePlayback ? "Live matchday squad" : "Match ratings";
    els.retroMatchLineupsBody.innerHTML = `
      <section class="retro-lineup-workspace">
        ${retroLineupTabsMarkup(managedTeam, opponentTeam)}
        ${retroLineupPanelView === "managed"
          ? retroLivePitchRatingsSideMarkup(managedTeam.name, managedSide, ratings[managedSide] || {}, match)
          : retroLivePitchRatingsSideMarkup(opponentTeam.name, opponentSide, ratings[opponentSide] || {}, match)}
      </section>
    `;
  } else if (useTabbedManager) {
    const editable = retroManagerCanEditMatch(match);
    els.retroMatchLineupsPanel.querySelector("summary").textContent = editable ? "Manage starting XI" : "Starting XI";
    els.retroMatchLineupsBody.innerHTML = `
      <section class="retro-lineup-workspace">
        ${retroLineupTabsMarkup(managedTeam, opponentTeam)}
        ${retroLineupPanelView === "managed"
          ? retroManagerLineupMarkup(managedTeam.name, match)
          : retroOpponentPitchMarkup(opponentTeam.name)}
      </section>
    `;
  } else if (ratings) {
    els.retroMatchLineupsPanel.querySelector("summary").textContent = livePlayback ? "Live matchday squad" : "Match ratings";
    els.retroMatchLineupsBody.innerHTML = `
      ${retroLiveRatingsSideMarkup(home.name, "home", ratings.home || {}, match)}
      ${retroLiveRatingsSideMarkup(away.name, "away", ratings.away || {}, match)}
    `;
  } else {
    const editable = retroManagerCanEditMatch(match);
    els.retroMatchLineupsPanel.querySelector("summary").textContent = editable ? "Manage starting XI" : "Starting XI";
    els.retroMatchLineupsBody.innerHTML = state?.premierLeagueSeason
      ? `<section class="retro-lineup-workspace">
          ${retroLineupTabsMarkup(managedTeam, opponentTeam)}
          ${retroLineupPanelView === "managed"
            ? retroManagerLineupMarkup(managedTeam.name, match)
            : retroOpponentPitchMarkup(opponentTeam.name)}
        </section>`
      : `
        ${editable && sharedLineupManagedTeamMatches(home) ? retroManagerLineupMarkup(home.name, match) : retroLineupSideMarkup(home.name)}
        ${editable && sharedLineupManagedTeamMatches(away) ? retroManagerLineupMarkup(away.name, match) : retroLineupSideMarkup(away.name)}
      `;
  }
  els.retroMatchLineupsPanel.open = wasOpen || (
    retroManagerCanEditMatch(match)
    && !match.result
  );
  const nextBench = els.retroMatchLineupsBody
    .querySelector(".retro-manager-section.is-bench .retro-manager-player-list");
  if (nextBench && previousBenchScroll > 0) nextBench.scrollTop = previousBenchScroll;
}

function retroLineupSideMarkup(teamName) {
  const lineup = RETRO_WORLD_CUP_ENGINE.startingXI(retroTournament.year, teamName);
  const positionOrder = { GK: 0, DF: 1, MF: 2, FW: 3 };
  const players = [...lineup.players].sort((left, right) =>
    (positionOrder[retroBroadPosition(left.position)] ?? 4) - (positionOrder[retroBroadPosition(right.position)] ?? 4)
    || left.number - right.number
  );
  return `
    <section class="retro-lineup-side">
      <header>
        ${retroFlag(teamName, "retro-lineup-flag")}
        <span><small>${lineup.formation}</small><strong>${escapeHtml(teamName)}</strong></span>
      </header>
      <ol>
        ${players.map((player) => `
          <li>
            <b>${player.number}</b>
            <span><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.club)}</small></span>
            <em>${player.position}</em>
          </li>
        `).join("")}
      </ol>
    </section>`;
}

function retroFormationSideMarkup(teamName) {
  const lineup = RETRO_WORLD_CUP_ENGINE.startingXI(retroTournament.year, teamName);
  const rows = {
    GK: [{ x: 50, y: 88 }],
    DF: [{ x: 16, y: 67 }, { x: 39, y: 67 }, { x: 61, y: 67 }, { x: 84, y: 67 }],
    MF: [{ x: 24, y: 43 }, { x: 50, y: 49 }, { x: 76, y: 43 }],
    FW: [{ x: 22, y: 18 }, { x: 50, y: 13 }, { x: 78, y: 18 }],
  };
  const used = { GK: 0, DF: 0, MF: 0, FW: 0 };
  const players = lineup.players.map((player) => {
    const group = retroBroadPosition(player.position);
    const slots = rows[group];
    const slot = slots[Math.min(used[group], slots.length - 1)];
    used[group] += 1;
    return { player, ...slot };
  });
  return `
    <section class="retro-formation-side">
      <header>
        ${retroFlag(teamName, "retro-lineup-flag")}
        <span><strong>${escapeHtml(teamName)}</strong><small>${lineup.formation}</small></span>
      </header>
      <div class="retro-formation-pitch">
        ${players.map(({ player, x, y }) => `
          <div class="retro-formation-player" style="--player-x:${x}%;--player-y:${y}%">
            <b>${player.number}</b>
            <span>${escapeHtml(player.name)}</span>
          </div>
        `).join("")}
      </div>
    </section>`;
}

function renderRetroLineupsView() {
  restoreSharedMainContent();
  const match = retroCurrentMatch();
  if (!match) {
    els.retroTournamentBody.innerHTML = "";
    return;
  }
  els.retroTournamentBody.innerHTML = `
    <section class="retro-lineups-view">
      <div class="retro-lineups-heading">
        <span>${retroMatchStageLabel(match)}</span>
        <h2>Starting XI</h2>
        ${retroScheduleMarkup(match)}
      </div>
      <div class="retro-lineups-grid">
        ${retroLineupSideMarkup(match.home)}
        ${retroLineupSideMarkup(match.away)}
      </div>
    </section>`;
}

function renderRetroTournamentProgress() {
  const allMatches = RETRO_WORLD_CUP_ENGINE.allMatches(retroTournament);
  const played = allMatches.filter((match) => match.result).length;
  if (retroTournament.phase === "complete") {
    els.retroTournamentProgress.innerHTML = `<span>Champion</span><strong>${escapeHtml(retroTournament.champion)}</strong>`;
    return;
  }
  if (retroTournament.phase === "group") {
    const next = retroTournament.groupMatches.find((match) => !match.result);
    els.retroTournamentProgress.innerHTML = `<span>Group stage</span><strong>Matchday ${next?.matchday || 3} · ${played}/${retroTournament.groupMatches.length} played</strong>`;
    return;
  }
  const round = retroTournament.knockoutRounds.at(-1);
  els.retroTournamentProgress.innerHTML = `<span>Knockout stage</span><strong>${round.name} · ${round.matches.filter((match) => match.result).length}/${round.matches.length}</strong>`;
}

function renderRetroSharedMatchesView() {
  els.retroTournamentBody.replaceChildren(els.mainContent);
  els.mainContent.hidden = false;
  els.boardTitle.textContent = state.activeRound >= tournamentFinalRoundIndex() - 3
    ? "Knockout bracket"
    : `${tournamentRoundName()} fixtures`;
  els.simulateRoundButton.textContent = state.activeRound < 3 ? "Simulate matchday" : "Simulate round";
  els.simulateRoundButton.hidden = viewingRoundHistory();
  renderTeamFilter();
  renderRoundHistoryControl();
  renderSettingsSummary();
  renderStage();
  els.fixtureGrid.classList.toggle("retro-group-tables", retroBottomGroupsVisible);
  els.fixtureGrid.classList.toggle("retro-group-match-history", retroBottomGroupMatchesVisible);
  els.teamFilterControl.hidden = retroBottomGroupsVisible;
  els.unresolvedFilter.hidden = retroBottomGroupsVisible;
  if (retroBottomGroupsVisible) {
    els.boardTitle.textContent = "Group tables";
    els.fixtureGrid.innerHTML = `
      <div class="retro-groups-grid">${retroGroupLetters().map(retroGroupTableMarkup).join("")}</div>
    `;
    els.loadMoreButton.hidden = true;
    els.simulateRoundButton.hidden = true;
  } else if (retroBottomGroupMatchesVisible) {
    els.boardTitle.textContent = "Group stage matches";
    els.fixtureGrid.classList.remove("bracket-mode", "team-journey-mode");
    els.fixtureGrid.innerHTML = state.rounds.slice(0, 3).flatMap((round, roundIndex) => (
      round.map((match, matchIndex) => fixtureMarkup(match, matchIndex, roundIndex))
    )).join("");
    els.loadMoreButton.hidden = true;
    els.simulateRoundButton.hidden = true;
    els.unresolvedFilter.hidden = true;
    bindFixtureNavigation();
  } else {
    renderFixtures();
  }
  renderQueue();
  renderGoldenBoot();
  renderStorylines();
  els.unresolvedFilter.classList.toggle("active", filterUnresolved);
}
