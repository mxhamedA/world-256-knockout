function renderRetroWorldCupMode() {
  if (!retroTournament) {
    setAppModeUrl("home", { replace: true });
    render();
    return;
  }
  if (Number(retroTournament.year) === 2024 && !RETRO_COPA_2024_PLAYABLE) {
    retroTournament = null;
    setAppModeUrl("home", { replace: true });
    render();
    return;
  }
  activateRetroSimulatorState();
  const isEuros = [2016, 2020].includes(Number(retroTournament.year));
  const isEuro2020 = Number(retroTournament.year) === 2020;
  const isCopa = Number(retroTournament.year) === 2024;
  const isWorldCup = [1998, 2002, 2006, 2010, 2014, 2018, 2022, 2026].includes(Number(retroTournament.year));
  const customMatchThemeEnabled = document.documentElement.dataset.tournamentTheme !== "off";
  document.body.classList.add("retro-mode-active");
  document.body.classList.toggle("authentic-tournament-theme-active", isWorldCup && customMatchThemeEnabled);
  document.body.classList.remove("tournament-theme-shared-shell-active");
  // The custom-theme sync deliberately clears presentation classes when the
  // override is off. Restore the tournament's native edition skin so direct
  // subview renders (for example, opening Groups) keep their layout and theme.
  syncTournamentThemePresentationClasses();
  enforceModeScreenVisibility("retro");
  if (!isWorldCup) {
    document.body.classList.add("retro-mode-active");
    document.body.classList.toggle("retro-euro-2016-active", Number(retroTournament.year) === 2016);
    document.body.classList.toggle("retro-euro-2020-active", isEuro2020);
  }
  document.body.classList.toggle("retro-copa-2024-active", isCopa);
  els.retroWorldCupScreen.hidden = false;
  els.retroTournamentKicker.textContent = RETRO_WORLD_CUP_EDITIONS[retroTournament.year].label.toUpperCase();
  els.retroTournamentTitle.textContent = isEuros
    ? `UEFA Euro ${retroTournament.year}`
    : isCopa ? "Copa América USA 2024"
    : Number(retroTournament.year) === 1998 ? "France 1998 World Cup" : `World Cup ${retroTournament.year}`;
  if (els.retroAchievementsButton) {
    els.retroAchievementsButton.hidden = false;
  }
  els.retroWorldCupRestartButton.hidden = !retroTournamentHasProgress();
  if (retroTournament.phase === "complete" && !retroTournament.savedTournamentView) {
    maybeShowPostWinDonation(
      `retro-${retroTournament.year}:${retroTournament.seed || "seed"}:${retroTournament.champion || "champion"}`,
    );
  }
  document.querySelectorAll("[data-retro-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.retroView === retroTournamentView);
  });
  renderRetroTournamentProgress();
  if (retroTournamentView === "groups") renderRetroGroupsView();
  else if (retroTournamentView === "bracket") renderEuro2020BracketView();
  else if (retroTournamentView === "lineups") renderRetroLineupsView();
  else if (retroTournamentView === "squads") renderRetroSquadsView();
  else renderRetroSharedMatchesView();
}

function startRetroWorldCup() {
  const year = selectedRetroTournamentYear();
  const isEuros = [2016, 2020].includes(year);
  const isCopa = year === 2024;
  if (isCopa && !RETRO_COPA_2024_PLAYABLE) {
    showToast("Copa América 2024 is coming soon.");
    setAppModeUrl("home", { replace: true });
    render();
    return;
  }
  if (![1998, 2002, 2006, 2010, 2014, 2016, 2018, 2020, 2022, 2024, 2026].includes(year)) {
    showToast(`The ${year} tournament is coming soon.`);
    return;
  }
  const managedTeam = isEuros ? readRetroEuroTeam(year) : isCopa ? readRetroCopaTeam() : readRetroWorldCupTeam(String(year));
  retroTournament = readRetroTournamentState(year);
  if (!retroTournament) {
    retroTournament = RETRO_WORLD_CUP_ENGINE.createTournament({
      year,
      seed: Date.now(),
      managedTeam,
    });
    lockRetroTournamentSetup(retroTournament, {
      managedTeam,
      upset: retroMenuSettings.upset,
      goals: retroMenuSettings.goals,
    });
    saveRetroTournamentState();
  } else {
    lockRetroTournamentSetup(retroTournament);
    saveRetroTournamentState();
  }
  retroTournamentView = "matches";
  retroBottomGroupsVisible = false;
  retroBottomGroupMatchesVisible = false;
  retroSelectedMatchId = RETRO_WORLD_CUP_ENGINE.nextUnplayedMatch(retroTournament)?.id || null;
  setAppModeUrl("retro");
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function restartRetroWorldCup() {
  const requestedYear = Number(els.retroRestartModal.dataset.restartYear)
    || Number(retroTournament?.year)
    || selectedRetroTournamentYear();
  stopStandardPlaybackForNavigation();
  const returnHome = els.retroRestartModal.dataset.returnHome === "true";
  const returnSetup = els.retroRestartModal.dataset.returnSetup === "true";
  delete els.retroRestartModal.dataset.returnHome;
  delete els.retroRestartModal.dataset.returnSetup;
  delete els.retroRestartModal.dataset.restartYear;
  els.retroRestartModal.close();
  if (isRetroSimulatorState()) restoreStandardTournamentState();

  if (returnHome || returnSetup) {
    const resetYear = requestedYear;
    restoreSharedMainContent();
    retroTournament = null;
    retroSimulatorState = null;
    retroTournamentView = "matches";
    retroBottomGroupsVisible = false;
    retroBottomGroupMatchesVisible = false;
    retroSelectedMatchId = null;
    try {
      localStorage.removeItem(retroTournamentStorageKey(resetYear));
    } catch {
      // The in-memory reset still succeeds when storage is unavailable.
    }
    syncRetroWorldCupCardAction(String(resetYear));
    if (returnSetup) {
      document.body.dataset.desktopModeSetup = "retro";
      setAppModeUrl("retro", { replace: true });
    } else {
      setAppModeUrl("home", { replace: true });
    }
    render();
    window.scrollTo({ top: 0, behavior: "auto" });
    showToast(`${[2016, 2020].includes(Number(resetYear)) ? `Euro ${resetYear}` : Number(resetYear) === 2024 ? "Copa América 2024" : `World Cup ${resetYear}`} reset.`);
    return;
  }

  const year = retroTournament?.year || Number(readRetroWorldCupYear());
  const lockedSetup = retroTournamentLockedSetup(retroTournament);
  const managedTeam = lockedSetup?.managedTeam || null;
  retroTournament = RETRO_WORLD_CUP_ENGINE.createTournament({
    year,
    seed: Date.now(),
    managedTeam,
  });
  lockRetroTournamentSetup(retroTournament, lockedSetup);
  retroSimulatorState = null;
  retroTournamentUiState = {
    fixtureLimit: DEFAULT_FIXTURE_LIMIT,
    filterUnresolved: false,
    teamFilterId: null,
    teamFilterReturn: null,
  };
  retroTournamentView = "matches";
  retroBottomGroupsVisible = false;
  retroBottomGroupMatchesVisible = false;
  retroSelectedMatchId = RETRO_WORLD_CUP_ENGINE.nextUnplayedMatch(retroTournament)?.id || null;
  retroSquadTeamName = managedTeam || RETRO_WORLD_CUPS[year].teams[0].name;
  saveRetroTournamentState();
  syncRetroWorldCupCardAction(String(year));
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
  showToast(`${[2016, 2020].includes(Number(year)) ? `Euro ${year}` : Number(year) === 2024 ? "Copa América 2024" : `World Cup ${year}`} restarted.`);
}

function syncSettingsDialog() {
  const tournamentTheme = MATCH_SCREEN_THEMES[document.documentElement.dataset.tournamentTheme]
    ? document.documentElement.dataset.tournamentTheme
    : "off";
  const themeDetails = MATCH_SCREEN_THEMES[tournamentTheme];
  document.querySelectorAll("[data-tournament-theme-option]").forEach((button) => {
    const selected = button.dataset.tournamentThemeOption === tournamentTheme;
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("is-selected", selected);
  });
  const tournamentThemeStatus = document.querySelector("#tournamentThemeStatus");
  if (tournamentThemeStatus) tournamentThemeStatus.textContent = themeDetails.label;
  document.querySelectorAll("[data-tournament-theme-label]").forEach((label) => {
    label.textContent = themeDetails.label;
  });
  const lightModeEnabled = document.documentElement.classList.contains("light-mode");
  els.lightModeSetting?.setAttribute("aria-pressed", String(lightModeEnabled));
  els.lightModeSetting?.classList.toggle("is-enabled", lightModeEnabled);
  if (els.lightModeLabel) els.lightModeLabel.textContent = lightModeEnabled ? "Light appearance" : "Dark appearance";
  const enabled = state.settings.realPlayersOnly !== false;
  els.realPlayersOnlySetting.setAttribute("aria-pressed", String(enabled));
  els.realPlayersOnlySetting.classList.toggle("is-enabled", enabled);
  state.settings = normalizeSettings(state.settings);
  const injuriesRemoved = state.settings.removeInjuries === true;
  els.removeInjuriesSetting?.setAttribute("aria-pressed", String(injuriesRemoved));
  els.removeInjuriesSetting?.classList.toggle("is-enabled", injuriesRemoved);
  if (els.removeInjuriesLabel) {
    els.removeInjuriesLabel.textContent = injuriesRemoved ? "Injuries off" : "Injuries on";
  }
  const keybindsEnabled = state.settings.keybinds.enabled !== false;
  els.keybindsToggleButton?.setAttribute("aria-pressed", String(keybindsEnabled));
  els.keybindsToggleButton?.classList.toggle("is-enabled", keybindsEnabled);
  if (els.keybindsToggleLabel) els.keybindsToggleLabel.textContent = keybindsEnabled ? "Shortcuts on" : "Shortcuts off";
  els.keybindSettingsList?.classList.toggle("is-disabled", !keybindsEnabled);
  els.keybindSettingsList?.querySelectorAll("[data-keybind-action]").forEach((button) => {
    const listening = keybindCaptureAction === button.dataset.keybindAction;
    button.textContent = listening ? "Press key..." : keybindDisplayName(state.settings.keybinds[button.dataset.keybindAction]);
    button.classList.toggle("is-listening", listening);
  });
  syncSoundToggle();
}

function applyTournamentTheme(theme, { persist = true, announce = true } = {}) {
  const migratedTheme = theme === "wc" ? "2014" : theme === "euros" ? "2016" : String(theme || "");
  const nextTheme = MATCH_SCREEN_THEMES[migratedTheme] ? migratedTheme : "off";
  document.documentElement.dataset.tournamentTheme = nextTheme;
  syncTournamentThemePresentationClasses();
  if (persist) {
    try {
      localStorage.setItem(TOURNAMENT_THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The selected theme still applies for this visit when storage is unavailable.
    }
    document.cookie = `${TOURNAMENT_THEME_STORAGE_KEY}=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
  }
  const isLight = document.documentElement.classList.contains("light-mode");
  const themeColour = isLight ? "#f4f6fa" : MATCH_SCREEN_THEMES[nextTheme].colour;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColour);
  syncSettingsDialog();
  if (announce) {
    showToast(nextTheme === "off"
      ? "Custom match theme turned off."
      : `${MATCH_SCREEN_THEMES[nextTheme].label} match UI applied to supported tournament modes.`);
  }
}

const TOURNAMENT_THEME_PRESENTATION_CLASSES = Object.freeze({
  "1998": "retro-1998-active",
  "2002": "retro-2002-active",
  "2006": "retro-2006-active",
  "2010": "retro-2010-active",
  "2016": "retro-euro-2016-active",
  "2018": "retro-2018-active",
  "2022": "retro-2022-active",
  "2026": "retro-2026-active",
});

function syncTournamentThemePresentationClasses() {
  const selectedTheme = MATCH_SCREEN_THEMES[document.documentElement.dataset.tournamentTheme]
    ? document.documentElement.dataset.tournamentTheme
    : "off";
  const active = selectedTheme !== "off" && document.body.classList.contains("authentic-tournament-theme-active");
  document.body.classList.toggle("retro-mode-active", active);
  Object.entries(TOURNAMENT_THEME_PRESENTATION_CLASSES).forEach(([theme, className]) => {
    document.body.classList.toggle(className, active && selectedTheme === theme);
  });
}

function isTextEntryTarget(target) {
  const tagName = target?.tagName;
  return target?.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(tagName);
}

function isShortcutControlTarget(target) {
  return Boolean(target?.closest?.("a, button, input, select, textarea, [contenteditable='true']"));
}

function confirmOpenDialogShortcut(event) {
  const dialog = document.querySelector("dialog.confirm-modal[open]");
  if (!dialog) return false;
  if (event.key === "Escape") {
    event.preventDefault();
    dialog.close("cancel");
    return true;
  }
  if (event.key !== "Enter" || isTextEntryTarget(event.target)) return false;
  const confirmButton = dialog.querySelector(".danger-button, .primary-button, [value='default']");
  if (!confirmButton || confirmButton.disabled) return false;
  event.preventDefault();
  confirmButton.click();
  return true;
}

function captureKeybindShortcut(event) {
  if (!keybindCaptureAction) return false;
  event.preventDefault();
  event.stopPropagation();
  if (event.key === "Escape") {
    keybindCaptureAction = null;
    syncSettingsDialog();
    return true;
  }
  if (["Alt", "CapsLock", "Control", "Meta", "Shift", "Tab"].includes(event.key)) return true;
  state.settings = normalizeSettings(state.settings);
  state.settings.keybinds[keybindCaptureAction] = normalizedKeybindKey(event.key);
  const actionLabel = {
    nextMatch: "Next match",
    pauseResume: "Resume / pause",
    skipToFullTime: "Skip to full time",
    restartTournament: "Restart tournament",
  }[keybindCaptureAction];
  showToast(`${actionLabel} set to ${keybindDisplayName(event.key)}.`);
  keybindCaptureAction = null;
  saveState();
  syncSettingsDialog();
  return true;
}

function openRestartConfirmation() {
  if (isRetroSimulatorState()) {
    const title = els.retroRestartModal.querySelector("h2");
    const year = Number(retroTournament?.year || 2014);
    if (title) title.textContent = `Restart ${[2016, 2020].includes(year) ? `Euro ${year}` : year === 2024 ? "Copa América 2024" : `World Cup ${year}`}?`;
    els.retroRestartModal.dataset.returnHome = "false";
    els.retroRestartModal.showModal();
    return;
  }
  openDefaultResetModal(false);
}

function openDefaultResetModal(returnToSetup = false) {
  const customMatch = state.customTournament?.customMatch === true || currentAppMode() === "customMatch";
  els.resetModalTitle.textContent = customMatch ? "Start a fresh custom match?" : "Start a fresh tournament?";
  els.resetModalCopy.textContent = customMatch
    ? "This clears the current match and returns to custom match setup."
    : "This clears every result and creates a fresh opening draw.";
  els.resetModalCancelButton.textContent = customMatch ? "Keep this match" : "Keep this one";
  els.resetModal.dataset.returnToSetup = String(returnToSetup);
  els.resetModal.showModal();
}

function runNextMatchShortcut() {
  if (!state.started && currentAppMode() !== "standard") return false;
  if (livePlayback) {
    showToast("Pause with Space or let this tie finish first.");
    return true;
  }
  const match = selectedMatch();
  if (!match && !state.championView) return false;
  if (match?.result && !match.result.revealed) revealSelected();
  else playSelected();
  return true;
}

function runKeybindShortcut(event) {
  state.settings = normalizeSettings(state.settings);
  const keybinds = state.settings.keybinds;
  if (
    isShortcutControlTarget(event.target)
    || document.querySelector("dialog[open]")
    || !els.onlineRoomScreen.hidden
  ) return false;
  const key = normalizedKeybindKey(event.key);
  if (key === "Enter" && canSkipPenaltyShootout()) {
    event.preventDefault();
    skipPenaltyShootout();
    return true;
  }
  if (keybinds.enabled === false) return false;
  if (key === keybinds.skipToFullTime && livePlayback) {
    event.preventDefault();
    skipLivePlayback();
    return true;
  }
  if (key === keybinds.pauseResume) {
    event.preventDefault();
    if (livePlayback) toggleLivePause();
    else showToast("No live match is running.");
    return true;
  }
  if (key === keybinds.nextMatch) {
    event.preventDefault();
    return runNextMatchShortcut();
  }
  if (key === keybinds.restartTournament) {
    const customBuilderOpen = currentAppMode() === "custom"
      && !(isValidCustomTournamentState(state) && state.started);
    if (customBuilderOpen) return false;
    event.preventDefault();
    openRestartConfirmation();
    return true;
  }
  return false;
}

function teamJourneyMatches(teamId) {
  return state.rounds.flatMap((round, roundIndex) => (round || [])
    .map((match, matchIndex) => ({ match, matchIndex, roundIndex }))
    .filter(({ match }) => match.homeId === teamId || match.awayId === teamId));
}

function activeTournamentTeamIds() {
  return new Set(
    (state?.rounds || []).flatMap((round) => (round || [])
      .flatMap((match) => [match?.homeId, match?.awayId])
      .filter(Boolean)),
  );
}

function searchableTeamsForCurrentMode() {
  if (isRetroSimulatorState()) {
    return RETRO_WORLD_CUPS[retroTournament.year].teams
      .map((entry) => teamById(retroTeamId(entry.name, retroTournament.year)))
      .filter(Boolean);
  }
  return [...activeTournamentTeamIds()]
    .map((teamId) => teamById(teamId))
    .filter(Boolean)
    .sort((left, right) => left.name.localeCompare(right.name));
}

function renderTeamFilter() {
  if (teamFilterId && !activeTournamentTeamIds().has(teamFilterId)) {
    teamFilterId = null;
    teamFilterReturn = null;
  }
  els.teamSearch.placeholder = state?.premierLeagueSeason ? "Filter by club" : "Filter by team";
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
  const searchableTeams = searchableTeamsForCurrentMode();
  const results = searchableTeams
    .filter((team) => team.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);
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
    : `<div class="empty-story"><p>${state?.premierLeagueSeason ? "No club found." : "No team found."}</p></div>`;
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
  if (isRetroSimulatorState() && retroTournament) {
    retroTournament.managerTactic = state.standardTactic;
  }
  const liveMatch = selectedMatch();
  if (
    !livePlayback
    && liveMatch?.result
    && !liveMatch.result.revealed
    && liveMatch.result.engineVersion !== 2
  ) {
    liveMatch.result = null;
    clearLiveMatchCheckpoint(liveMatch.id);
  }
  if (livePlayback && match2dState?.engine && liveMatch) {
    rebuildLiveMatchAfterTacticChange(liveMatch);
  } else if (match2dState?.engine && liveMatch) {
    const controlledSide = state.spectateTeamId === liveMatch.homeId ? "home" : state.spectateTeamId === liveMatch.awayId ? "away" : null;
    if (controlledSide) possessionTeam(match2dState.engine, controlledSide).tacticKey = state.standardTactic;
  }
  saveState();
  render();
  const controlledSide = liveMatch && state.spectateTeamId === liveMatch.homeId ? "home" : "away";
  const opponentKey = liveMatch ? opponentStandardTactic(liveMatch, controlledSide) : "balanced";
  const feedback = standardTacticalFeedback(state.standardTactic, opponentKey);
  showToast(`${STANDARD_TACTICS[state.standardTactic].name} selected · ${feedback.label}.`);
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
els.skipShootoutButton.addEventListener("click", skipPenaltyShootout);
function switchUclKnockoutLeg(direction) {
  const metadata = state?.uclKnockoutMatch;
  const availableLegs = Array.isArray(metadata?.availableLegIndices)
    ? metadata.availableLegIndices.map(Number).filter(Number.isInteger).sort((a, b) => a - b)
    : [];
  const currentPosition = availableLegs.indexOf(Number(metadata?.legIndex));
  const targetLeg = availableLegs[currentPosition + direction];
  if (!metadata || !Number.isInteger(targetLeg) || livePlayback) return;
  window.UclSeason?.openKnockoutMatch?.(metadata.roundKey, metadata.tieId, {
    legIndex: targetLeg,
    reviewOnly: true,
  });
}
els.uclPreviousLegButton?.addEventListener("click", () => switchUclKnockoutLeg(-1));
els.uclNextLegButton?.addEventListener("click", () => switchUclKnockoutLeg(1));
els.simulateRoundButton.addEventListener("click", () => {
  if (state?.uclSeason) {
    if (state.uclKnockoutMatch && !livePlayback) {
      if (window.UclSeason?.finishManagedKnockoutMatch?.(state.activeRound, state.selectedMatch)) return;
      window.UclSeason?.returnToSimulator?.({ view: "knockout" });
      return;
    }
    simulateCurrentRound();
    return;
  }
  requestRoundSimulation();
});
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
  if (isRetroSimulatorState() && els.historyRoundButton.dataset.retroGroups) {
    const closingGroups = retroBottomGroupsVisible;
    retroBottomGroupsVisible = !closingGroups;
    retroBottomGroupMatchesVisible = false;
    if (closingGroups && (retroTournament.phase === "knockout" || retroTournament.phase === "complete")) {
      state.activeRound = retroTournamentRoundIndex();
      state.selectedMatch = Math.min(
        state.selectedMatch,
        Math.max(0, (state.rounds[state.activeRound]?.length || 1) - 1),
      );
      state.championView = retroTournament.phase === "complete";
    }
    renderRetroWorldCupMode();
    els.roundBoard.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  openRound(Number(els.historyRoundButton.dataset.round), true);
});
els.newerRoundButton.addEventListener("click", () => {
  if (livePlayback) {
    showToast("Finish or skip the live tie before changing rounds.");
    return;
  }
  if (isRetroSimulatorState() && els.newerRoundButton.dataset.retroGroupMatches) {
    const openingGroupMatches = els.newerRoundButton.dataset.retroGroupMatches === "open";
    retroBottomGroupMatchesVisible = openingGroupMatches;
    retroBottomGroupsVisible = false;
    if (!openingGroupMatches) {
      state.activeRound = retroTournamentRoundIndex();
      state.selectedMatch = Math.min(
        state.selectedMatch,
        Math.max(0, (state.rounds[state.activeRound]?.length || 1) - 1),
      );
      state.championView = retroTournament.phase === "complete";
    }
    renderRetroWorldCupMode();
    els.roundBoard.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  openRound(Number(els.newerRoundButton.dataset.round), true);
});
els.loadMoreButton.addEventListener("click", () => {
  fixtureLimit += 24;
  renderFixtures();
});
els.unresolvedFilter.addEventListener("click", () => {
  if (state.customTournament?.structure === "groups" && state.activeRound === 0 && !teamFilterId) {
    customGroupTablesCollapsed = !customGroupTablesCollapsed;
    renderFixtures();
    return;
  }
  filterUnresolved = !filterUnresolved;
  fixtureLimit = DEFAULT_FIXTURE_LIMIT;
  renderFixtures();
  els.unresolvedFilter.classList.toggle("active", filterUnresolved);
});

els.snapshotButton.addEventListener("click", openSnapshotModal);
els.onlineSnapshotButton.addEventListener("click", openOnlineSnapshotModal);
els.copySnapshotButton.addEventListener("click", copySnapshotImage);
els.shareSnapshotButton.addEventListener("click", shareSnapshotImage);
els.saveSnapshotButton.addEventListener("click", saveSnapshotImage);

els.soundToggleButton.addEventListener("click", () => {
  setMatchSoundsEnabled(!matchSoundsAreEnabled());
  saveState();
  syncSoundToggle();
  showToast(matchSoundsAreEnabled() ? "Match sounds on." : "Match sounds off.");
});

els.settingsButton.addEventListener("click", () => {
  syncSettingsDialog();
  els.settingsModal.showModal();
});
document.querySelectorAll("[data-open-tournament-theme]").forEach((button) => {
  button.addEventListener("click", () => els.settingsButton.click());
});
document.querySelectorAll("[data-tournament-theme-option]").forEach((button) => {
  button.addEventListener("click", () => applyTournamentTheme(button.dataset.tournamentThemeOption));
});
applyTournamentTheme(document.documentElement.dataset.tournamentTheme, { persist: false, announce: false });
els.onlineSettingsButton?.addEventListener("click", () => els.settingsButton.click());
$("#profileSettingsButton")?.addEventListener("click", () => els.settingsButton.click());
els.newsButton?.addEventListener("click", () => els.retroEuro2020AnnouncementModal?.showModal());
