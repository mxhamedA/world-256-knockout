function applyRetroLineupSwap(lineup, firstNumber, secondNumber) {
  const firstIndex = lineup.starters.indexOf(Number(firstNumber));
  const secondIndex = lineup.starters.indexOf(Number(secondNumber));
  if (firstIndex < 0 && secondIndex < 0) return false;
  if (firstIndex >= 0 && secondIndex >= 0) {
    [lineup.starters[firstIndex], lineup.starters[secondIndex]] = [
      lineup.starters[secondIndex],
      lineup.starters[firstIndex],
    ];
  } else if (firstIndex >= 0) {
    lineup.starters.splice(firstIndex, 1, Number(secondNumber));
  } else {
    lineup.starters.splice(secondIndex, 1, Number(firstNumber));
  }
  return true;
}

function commitRetroLineupChange(team, match, message = "Starting XI updated.") {
  retroLineupSwapNumber = null;
  clearPlayerProfileCacheForTeam(team.id);
  saveState();
  renderRetroMatchLineupsPanel(match);
  showToast(message);
}

els.retroMatchLineupsBody?.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-retro-lineup-tab]");
  if (tab) {
    retroLineupPanelView = tab.dataset.retroLineupTab === "opponent" ? "opponent" : "managed";
    retroLineupSwapNumber = null;
    retroLiveSubOutNumber = null;
    retroLiveSubInNumber = null;
    retroLivePendingSubstitution = null;
    renderRetroMatchLineupsPanel(selectedMatch());
    return;
  }
  const substitutionAction = event.target.closest("[data-retro-sub-action]");
  const actionMatch = selectedMatch();
  if (substitutionAction && actionMatch) {
    if (substitutionAction.dataset.retroSubAction === "confirm" && retroPendingSubstitutionChanges().length) {
      applyRetroLiveSubstitutionBatch(actionMatch);
    } else {
      retroLiveSubOutNumber = null;
      retroLiveSubInNumber = null;
      retroLivePendingSubstitution = null;
      renderRetroMatchLineupsPanel(actionMatch);
    }
    return;
  }
  const undoPendingSubstitution = event.target.closest("[data-retro-sub-undo-out]");
  const undoMatch = selectedMatch();
  if (undoPendingSubstitution && undoMatch) {
    const outgoingNumber = Number(undoPendingSubstitution.dataset.retroSubUndoOut);
    const remainingChanges = retroPendingSubstitutionChanges()
      .filter((change) => change.outgoingNumber !== outgoingNumber);
    retroLivePendingSubstitution = remainingChanges.length ? remainingChanges : null;
    retroLiveSubOutNumber = null;
    retroLiveSubInNumber = null;
    renderRetroMatchLineupsPanel(undoMatch);
    showToast("Pending substitution removed.");
    return;
  }
  const substitutionButton = event.target.closest("[data-retro-sub-player]");
  const liveMatch = selectedMatch();
  if (substitutionButton && liveMatch && livePlayback?.matchId === liveMatch.id) {
    const number = Number(substitutionButton.dataset.retroSubPlayer);
    const role = substitutionButton.dataset.retroSubRole;
    if (!Number.isInteger(number)) return;
    if (role === "out") {
      if (retroLiveSubOutNumber === number) {
        retroLiveSubOutNumber = null;
        retroLiveSubInNumber = null;
        renderRetroMatchLineupsPanel(liveMatch);
        return;
      }
      if (retroLiveSubInNumber !== null) {
        stageRetroLiveSubstitution(liveMatch, number, retroLiveSubInNumber);
        return;
      }
      if (retroLiveSubOutNumber !== null) {
        applyRetroLivePositionSwap(liveMatch, retroLiveSubOutNumber, number);
        return;
      }
      retroLiveSubOutNumber = number;
      renderRetroMatchLineupsPanel(liveMatch);
      return;
    }
    if (role === "in" && retroLiveSubOutNumber === null) {
      retroLiveSubInNumber = retroLiveSubInNumber === number ? null : number;
      renderRetroMatchLineupsPanel(liveMatch);
      return;
    }
    if (role === "in") stageRetroLiveSubstitution(liveMatch, retroLiveSubOutNumber, number);
    return;
  }
  const button = event.target.closest("[data-retro-lineup-player]");
  const match = selectedMatch();
  if (!button || !match || livePlayback || !retroManagerCanEditMatch(match)) return;
  const team = spectatedTeam();
  const lineup = retroManagerLineupForTeam(team);
  const number = Number(button.dataset.retroLineupPlayer);
  if (!lineup || !Number.isInteger(number)) return;
  if (retroLineupSwapNumber === null) {
    retroLineupSwapNumber = number;
    renderRetroMatchLineupsPanel(match);
    return;
  }
  if (retroLineupSwapNumber === number) {
    retroLineupSwapNumber = null;
    renderRetroMatchLineupsPanel(match);
    return;
  }
  if (!applyRetroLineupSwap(lineup, retroLineupSwapNumber, number)) {
    retroLineupSwapNumber = number;
    renderRetroMatchLineupsPanel(match);
    return;
  }
  commitRetroLineupChange(team, match);
});

els.retroMatchLineupsBody?.addEventListener("dragstart", (event) => {
  const substitutionPlayer = event.target.closest("[data-retro-sub-player]");
  if (substitutionPlayer && livePlayback && retroLineupPanelView === "managed") {
    retroLiveSubDrag = {
      number: Number(substitutionPlayer.dataset.retroSubPlayer),
      role: substitutionPlayer.dataset.retroSubRole,
    };
    substitutionPlayer.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(retroLiveSubDrag.number));
    return;
  }
  const player = event.target.closest("[data-retro-lineup-player]");
  if (!player || livePlayback || retroLineupPanelView !== "managed") return;
  retroLineupDragNumber = Number(player.dataset.retroLineupPlayer);
  player.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", String(retroLineupDragNumber));
});

function retroLineupDropTarget(event) {
  const directTarget = event.target.closest("[data-retro-lineup-player]");
  if (directTarget) return directTarget;
  const region = event.target.closest(".retro-manager-pitch, .retro-manager-player-list.is-bench-list");
  if (!region) return null;
  const candidates = [...region.querySelectorAll("[data-retro-lineup-player]:not(:disabled)")];
  if (!candidates.length) return null;
  return candidates.reduce((closest, candidate) => {
    const bounds = candidate.getBoundingClientRect();
    const distance = ((bounds.left + bounds.width / 2) - event.clientX) ** 2
      + ((bounds.top + bounds.height / 2) - event.clientY) ** 2;
    return !closest || distance < closest.distance ? { candidate, distance } : closest;
  }, null)?.candidate || null;
}

els.retroMatchLineupsBody?.addEventListener("dragover", (event) => {
  const substitutionTarget = event.target.closest("[data-retro-sub-player]");
  if (
    substitutionTarget
    && retroLiveSubDrag
    && (
      substitutionTarget.dataset.retroSubRole !== retroLiveSubDrag.role
      || substitutionTarget.dataset.retroSubRole === "out"
    )
  ) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    substitutionTarget.classList.add("is-drop-target");
    return;
  }
  const target = retroLineupDropTarget(event);
  if (!target || retroLineupDragNumber === null) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  els.retroMatchLineupsBody.querySelectorAll("[data-retro-lineup-player].is-drop-target").forEach((node) => {
    if (node !== target) node.classList.remove("is-drop-target");
  });
  target.classList.add("is-drop-target");
});

els.retroMatchLineupsBody?.addEventListener("dragleave", (event) => {
  event.target.closest("[data-retro-sub-player]")?.classList.remove("is-drop-target");
});

els.retroMatchLineupsBody?.addEventListener("drop", (event) => {
  const substitutionTarget = event.target.closest("[data-retro-sub-player]");
  const liveMatch = selectedMatch();
  if (
    substitutionTarget
    && liveMatch
    && retroLiveSubDrag
    && (
      substitutionTarget.dataset.retroSubRole !== retroLiveSubDrag.role
      || substitutionTarget.dataset.retroSubRole === "out"
    )
  ) {
    event.preventDefault();
    const targetNumber = Number(substitutionTarget.dataset.retroSubPlayer);
    substitutionTarget.classList.remove("is-drop-target");
    if (retroLiveSubDrag.role === "out" && substitutionTarget.dataset.retroSubRole === "out") {
      applyRetroLivePositionSwap(liveMatch, retroLiveSubDrag.number, targetNumber);
    } else {
      const outgoingNumber = retroLiveSubDrag.role === "out" ? retroLiveSubDrag.number : targetNumber;
      const incomingNumber = retroLiveSubDrag.role === "in" ? retroLiveSubDrag.number : targetNumber;
      stageRetroLiveSubstitution(liveMatch, outgoingNumber, incomingNumber);
    }
    retroLiveSubDrag = null;
    return;
  }
  const target = retroLineupDropTarget(event);
  const match = selectedMatch();
  const team = spectatedTeam();
  const lineup = retroManagerLineupForTeam(team);
  if (!target || !match || !lineup || retroLineupDragNumber === null) return;
  event.preventDefault();
  const targetNumber = Number(target.dataset.retroLineupPlayer);
  els.retroMatchLineupsBody.querySelectorAll("[data-retro-lineup-player].is-drop-target")
    .forEach((node) => node.classList.remove("is-drop-target"));
  if (targetNumber !== retroLineupDragNumber && applyRetroLineupSwap(lineup, retroLineupDragNumber, targetNumber)) {
    commitRetroLineupChange(team, match, "Lineup position updated.");
  }
  retroLineupDragNumber = null;
});

els.retroMatchLineupsBody?.addEventListener("dragend", (event) => {
  retroLiveSubDrag = null;
  retroLineupDragNumber = null;
  event.target.closest("[data-retro-sub-player]")?.classList.remove("is-dragging");
  event.target.closest("[data-retro-lineup-player]")?.classList.remove("is-dragging");
  els.retroMatchLineupsBody.querySelectorAll(".is-drop-target").forEach((node) => node.classList.remove("is-drop-target"));
});

els.retroMatchLineupsBody?.addEventListener("change", (event) => {
  const select = event.target.closest("[data-retro-manager-formation]");
  const match = selectedMatch();
  const team = spectatedTeam();
  const lineup = retroManagerLineupForTeam(team);
  if (!select || !match || !lineup || !RETRO_MANAGER_FORMATIONS.includes(select.value)) return;
  const squad = retroManagerSquadForTeam(team);
  if (!squad) return;
  const currentFormation = lineup.formation;
  const nextFormation = select.value;
  lineup.starters = retroOrderStartersForFormationChange(
    lineup.starters.map((number) => squad.players.find((player) => player.number === number)).filter(Boolean),
    lineup.starters,
    currentFormation,
    nextFormation,
  );
  const substitutions = retroLiveSubstitutionState(match);
  if (substitutions?.activeStarters?.length === 11) {
    const missingEntries = Object.values(substitutions.missingSlots || {});
    substitutions.activeStarters = retroOrderStartersForFormationChange(
      substitutions.activeStarters
        .map((number) => squad.players.find((player) => player.number === number))
        .filter(Boolean),
      substitutions.activeStarters,
      currentFormation,
      nextFormation,
    );
    substitutions.formation = nextFormation;
    retroRemapMissingSlots(substitutions, missingEntries);
  }
  lineup.formation = nextFormation;
  if (state?.premierLeagueSeason) state.standardFormation = nextFormation;
  team.selectedFormation = nextFormation;
  clearPlayerProfileCacheForTeam(team.id);
  saveState();
  if (livePlayback?.matchId === match.id) rebuildLiveMatchAfterTacticChange(match);
  renderRetroMatchLineupsPanel(match);
  saveLiveMatchCheckpoint();
  showToast(`${nextFormation} formation selected.`);
});

els.continueNeutralButton.addEventListener("click", () => {
  if (isRetroSimulatorState() && retroTournament?.pendingEliminationDecision) {
    delete retroTournament.pendingEliminationDecision;
    retroTournament.neutralView = true;
    state.spectateTeamId = null;
    state.neutralView = true;
    state.activeRound = Math.min(3, Math.max(0, state.rounds.length - 1));
    state.selectedMatch = Math.max(0, firstUnplayedIndex(state.activeRound));
    state.championView = false;
    fixtureLimit = DEFAULT_FIXTURE_LIMIT;
    filterUnresolved = false;
    saveRetroTournamentState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("Neutral view restored. Keep the tournament going.");
    return;
  }
  if (isRetroSimulatorState() && retroTournament) retroTournament.neutralView = true;
  state.spectateTeamId = null;
  state.neutralView = true;
  goToNextTie();
  showToast("Neutral view restored. Keep the tournament going.");
});

els.replaySpectatedButton.addEventListener("click", () => {
  const team = spectatedTeam();
  if (!team) return;
  const previousSettings = { ...state.settings };

  if (isRetroSimulatorState()) {
    stopStandardPlaybackForNavigation();
    const year = retroTournament.year;
    retroTournament = RETRO_WORLD_CUP_ENGINE.createTournament({
      year,
      seed: Date.now(),
      managedTeam: team.name,
    });
    lockRetroTournamentSetup(retroTournament, {
      managedTeam: team.name,
      upset: previousSettings.upset,
      goals: previousSettings.goals,
    });
    retroSimulatorState = null;
    retroTournamentUiState = {
      fixtureLimit: DEFAULT_FIXTURE_LIMIT,
      filterUnresolved: false,
      teamFilterId: null,
      teamFilterReturn: null,
    };
    ({ fixtureLimit, filterUnresolved, teamFilterId, teamFilterReturn } = retroTournamentUiState);
    retroTournamentView = "matches";
    retroSelectedMatchId = RETRO_WORLD_CUP_ENGINE.nextUnplayedMatch(retroTournament)?.id || null;
    retroSquadTeamName = team.name;
    saveRetroTournamentState();
    syncRetroWorldCupCardAction(String(year));
    activateRetroSimulatorState();
    state.settings = previousSettings;
    state.spectateTeamId = retroTeamId(team.name, year);
    state.neutralView = false;
    focusSpectatedTeam(0);
    retroSimulatorState = state;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast(`Fresh World Cup. ${team.name}'s opening match is ready.`);
    return;
  }

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

$("#newTournamentButton").addEventListener("click", () => openDefaultResetModal(false));
els.championSaveTournament?.addEventListener("click", () => {
  const savedRecord = currentTournamentHistoryRecord();
  if (savedRecord) {
    openTournamentHistory(savedRecord.id, els.championSaveTournament);
    return;
  }
  saveCurrentTournamentToHistory();
});
els.tournamentHistoryClose?.addEventListener("click", closeTournamentHistory);
els.savedTournamentDeleteButton?.addEventListener("click", openSavedTournamentDeleteModal);
els.retroSavedTournamentDeleteButton?.addEventListener("click", openSavedTournamentDeleteModal);
els.confirmSavedTournamentDeleteButton?.addEventListener("click", confirmSavedTournamentDelete);
els.tournamentHistoryRounds?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-history-round]");
  if (!button || !activeTournamentHistoryRecord) return;
  const roundIndex = Number(button.dataset.historyRound);
  if (!Number.isInteger(roundIndex) || !activeTournamentHistoryRecord.rounds[roundIndex]) return;
  activeTournamentHistoryRound = roundIndex;
  const round = activeTournamentHistoryRecord.rounds[roundIndex];
  activeTournamentHistoryMatch = Math.max(0, round.findIndex((match) => !match.thirdPlacePlayoff));
  renderTournamentHistoryRounds();
  renderTournamentHistorySelectedMatch();
  renderTournamentHistoryFixtures();
  els.tournamentHistoryRoundTitle.scrollIntoView({ behavior: "auto", block: "nearest" });
});
els.tournamentHistoryFixtures?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-history-match]");
  if (!button || !activeTournamentHistoryRecord) return;
  const matchIndex = Number(button.dataset.historyMatch);
  if (!Number.isInteger(matchIndex)
    || !activeTournamentHistoryRecord.rounds[activeTournamentHistoryRound]?.[matchIndex]) return;
  activeTournamentHistoryMatch = matchIndex;
  renderTournamentHistorySelectedMatch();
  renderTournamentHistoryFixtures();
  els.tournamentHistoryMatch.scrollIntoView({
    behavior: event.detail === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    block: "center",
  });
});
$("#championReset").addEventListener("click", () => {
  if (isRetroSimulatorState()) {
    const year = retroTournament?.year || Number(readRetroWorldCupYear());
    const title = els.retroRestartModal.querySelector("h2");
    if (title) title.textContent = `Restart ${Number(year) === 2016 ? "Euro 2016" : `World Cup ${year}`}?`;
    els.retroRestartModal.dataset.returnHome = "false";
    els.retroRestartModal.showModal();
    return;
  }
  openDefaultResetModal(false);
});
els.championTeamJourney?.addEventListener("click", () => {
  els.roundBoard.scrollIntoView({ behavior: "smooth", block: "start" });
  requestAnimationFrame(() => els.teamSearch.focus({ preventScroll: true }));
});
els.homeRestartButton?.addEventListener("click", () => openDefaultResetModal(true));
$("#confirmResetButton").addEventListener("click", () => {
  stopStandardPlaybackForNavigation();
  const returnToSetup = els.resetModal.dataset.returnToSetup === "true";
  delete els.resetModal.dataset.returnToSetup;
  const wasCustomTournament = isValidCustomTournamentState(state);
  const wasCustomMatch = wasCustomTournament && state.customTournament?.customMatch === true;
  const wasDefaultKnockout = Boolean(
    state.started
    && !state.retroWorldCup
    && !state.customTournament
    && !state.legacyTournament
    && state.rounds?.[0]?.length === 128
  );
  const restartDefaultInPlace = wasDefaultKnockout && !returnToSetup;
  const previousSettings = { ...state.settings };
  const previousSpectateTeamId = state._activeSpectateId || state.spectateTeamId;
  if (wasCustomTournament) {
    if (wasCustomMatch) customMatchState = null;
    else customTournamentState = null;
  }
  state = createInitialState();
  state.settings = previousSettings;
  state.spectateTeamId = previousSpectateTeamId;
  state.neutralView = !previousSpectateTeamId;
  fixtureLimit = DEFAULT_FIXTURE_LIMIT;
  filterUnresolved = false;
  teamFilterId = null;
  teamFilterReturn = null;
  closeSearch();
  if (restartDefaultInPlace) {
    state.started = true;
    state._activeSpectateId = previousSpectateTeamId;
    if (previousSpectateTeamId) focusSpectatedTeam(0);
  }
  saveState();
  if (wasCustomMatch) customMatchSetupViewOpen = true;
  setAppModeUrl(wasCustomMatch ? "customMatch" : wasCustomTournament ? "custom" : restartDefaultInPlace ? "standard" : "home", { replace: true });
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (wasCustomTournament) {
    showToast(wasCustomMatch ? "Custom match returned to setup." : "Custom tournament returned to the builder.");
  } else if (returnToSetup && wasDefaultKnockout) {
    showToast("Tournament reset. Change your team or settings when you're ready.");
  } else if (restartDefaultInPlace && previousSpectateTeamId) {
    const managedTeam = teamById(previousSpectateTeamId);
    showToast(`Fresh draw. ${managedTeam?.name || "Your team's"} opening match is ready.`);
  } else {
    showToast("Fresh draw created. All 256 teams are back.");
  }
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
    if (group.dataset.settingsScope === "retro") {
      const year = selectedRetroTournamentYear();
      if (retroTournamentForYear(year)) {
        syncLandingSettings();
        showToast(`Restart this ${year === 2016 ? "Euro" : "World Cup"} before changing its simulation settings.`);
        return;
      }
      retroMenuSettings[group.dataset.setting] = button.dataset.value;
      if (retroSimulatorState?.settings) {
        retroSimulatorState.settings[group.dataset.setting] = button.dataset.value;
      }
      saveRetroWorldCupSettings();
    } else if (group.dataset.settingsScope === "premier-league") {
      premierLeagueMenuSetup[group.dataset.setting] = button.dataset.value;
      savePremierLeagueMenuSetup();
    } else {
      if (standardTournamentSetupLocked()) {
        syncLandingSettings();
        showToast("Restart the tournament before changing its simulation settings.");
        return;
      }
      state.settings[group.dataset.setting] = button.dataset.value;
      saveState();
    }
    syncLandingSettings();
  });
});

document.querySelectorAll(".landing-setting-info").forEach((details) => {
  details.addEventListener("toggle", () => {
    if (!details.open) return;
    document.querySelectorAll(".landing-setting-info[open]").forEach((other) => {
      if (other !== details) other.open = false;
    });
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".landing-setting-info")) return;
  document.querySelectorAll(".landing-setting-info[open]").forEach((details) => {
    details.open = false;
  });
});

els.retroWorldCupYearSwitch?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-retro-year]");
  if (button) setRetroWorldCupYear(button.dataset.retroYear);
});
els.retroCompetitionSwitch?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-retro-competition]");
  if (button) setRetroCompetition(button.dataset.retroCompetition);
});

els.startRetroWorldCupButton?.addEventListener("click", startRetroWorldCup);
els.restartRetroWorldCupButton?.addEventListener("click", () => {
  const year = selectedRetroTournamentYear();
  const title = els.retroRestartModal.querySelector("h2");
  if (title) title.textContent = `Restart ${year === 2016 ? "Euro 2016" : `World Cup ${year}`}?`;
  els.retroRestartModal.dataset.returnHome = "true";
  els.retroRestartModal.dataset.restartYear = String(year);
  els.retroRestartModal.showModal();
});
els.retroWorldCupRestartButton?.addEventListener("click", () => {
  const title = els.retroRestartModal.querySelector("h2");
  const year = Number(retroTournament?.year || 2014);
  if (title) title.textContent = `Restart ${year === 2016 ? "Euro 2016" : `World Cup ${year}`}?`;
  els.retroRestartModal.dataset.returnHome = "false";
  els.retroRestartModal.showModal();
});
els.confirmRetroRestartButton?.addEventListener("click", restartRetroWorldCup);
document.querySelectorAll("[data-retro-view]").forEach((button) => {
  button.addEventListener("click", () => {
    retroTournamentView = button.dataset.retroView;
    if (retroTournamentView !== "matches") {
      retroBottomGroupsVisible = false;
      retroBottomGroupMatchesVisible = false;
    }
    renderRetroWorldCupMode();
  });
});
els.retroTournamentBody?.addEventListener("click", (event) => {
  const matchButton = event.target.closest("[data-retro-match-id]");
  if (matchButton) {
    retroSelectedMatchId = matchButton.dataset.retroMatchId;
    retroTournamentView = "matches";
    retroBottomGroupsVisible = false;
    retroBottomGroupMatchesVisible = false;
    renderRetroWorldCupMode();
    return;
  }
  const action = event.target.closest("[data-retro-action]")?.dataset.retroAction;
  if (!action || !retroTournament) return;
  if (action === "simulate-match") {
    const match = retroCurrentMatch();
    if (match && !match.result) RETRO_WORLD_CUP_ENGINE.simulateMatch(retroTournament, match);
  } else if (action === "simulate-stage") {
    const stageMatches = RETRO_WORLD_CUP_ENGINE.activeMatches(retroTournament);
    RETRO_WORLD_CUP_ENGINE.simulateActiveStage(retroTournament);
    if (retroTournament.phase === "complete") {
      retroSelectedMatchId = stageMatches.at(-1)?.id || retroSelectedMatchId;
    }
  } else if (action === "next-match") {
    retroSelectedMatchId = RETRO_WORLD_CUP_ENGINE.nextUnplayedMatch(retroTournament)?.id || retroSelectedMatchId;
  }
  saveRetroTournamentState();
  renderRetroWorldCupMode();
});
els.retroTournamentBody?.addEventListener("change", (event) => {
  if (event.target.id !== "retroSquadTeamSelect") return;
  retroSquadTeamName = event.target.value;
  renderRetroSquadsView();
