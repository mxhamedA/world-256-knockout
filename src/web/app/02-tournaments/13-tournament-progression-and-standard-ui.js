function simulateCurrentRound() {
  if (livePlayback) {
    showToast("Finish or skip the live tie before simulating the round.");
    return;
  }
  const round = selectedRound();
  if (state?.premierLeagueSeason) {
    const watchedMatchIndex = teamMatchIndex(state.activeRound);
    const watchedMatchReady = watchedMatchIndex >= 0 && !round[watchedMatchIndex]?.result?.revealed;
    round.forEach((match, index) => {
      if (watchedMatchReady && index === watchedMatchIndex) return;
      simulateAndRevealMatch(match, state.activeRound);
    });
    if (watchedMatchReady) {
      state.selectedMatch = watchedMatchIndex;
      state.championView = false;
      showToast(`Other ${tournamentRoundName()} matches simulated. Your match is ready.`);
    } else {
      const nextRoundIndex = state.rounds.findIndex((candidate, index) => (
        index > state.activeRound && candidate.some((match) => !match.result?.revealed)
      ));
      if (nextRoundIndex >= 0) {
        state.activeRound = nextRoundIndex;
        state.viewRound = nextRoundIndex;
        state.selectedMatch = Math.max(0, state.rounds[nextRoundIndex].findIndex((match) => !match.result?.revealed));
        showToast(`${tournamentRoundName()} is ready.`);
      } else {
        showToast("The Premier League season is complete.");
      }
    }
    saveState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (isCustomGroupStageRound()) {
    const matchday = pendingCustomGroupMatchday(round);
    if (matchday < 0) {
      buildNextRound(0);
      const knockoutRound = state.rounds[1];
      if (!Array.isArray(knockoutRound) || knockoutRound.length === 0) {
        showToast("The group stage is complete, but the knockout fixtures could not be created.");
        return;
      }
      state.activeRound = 1;
      const managedMatchIndex = teamMatchIndex(1);
      state.selectedMatch = Math.max(0, managedMatchIndex);
      state.championView = false;
      fixtureLimit = DEFAULT_FIXTURE_LIMIT;
      filterUnresolved = false;
      if (state.spectateTeamId && managedMatchIndex < 0) {
        state.neutralView = true;
        showToast(`${spectatedTeam()?.name || "Your team"} are out after the group stage. Continuing neutrally.`);
      } else {
        showToast("Group stage complete. The knockout fixtures are ready.");
      }
      saveState();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const watchedMatchIndex = teamMatchIndex(state.activeRound);
    const watchedMatch = round[watchedMatchIndex];
    const watchingActiveTeam = watchedMatch
      && customGroupMatchday(watchedMatch) === matchday
      && !watchedMatch.result?.revealed;

    round.forEach((match, index) => {
      if (customGroupMatchday(match) !== matchday) return;
      if (watchingActiveTeam && index === watchedMatchIndex) return;
      simulateAndRevealMatch(match, state.activeRound);
    });

    if (watchingActiveTeam) {
      state.selectedMatch = watchedMatchIndex;
      state.championView = false;
      showToast(`Other matchday ${matchday + 1} fixtures simulated. Your team's match is ready.`);
    } else if (pendingCustomGroupMatchday(round) >= 0) {
      const nextMatchIndex = teamMatchIndex(state.activeRound);
      state.selectedMatch = nextMatchIndex >= 0
        ? nextMatchIndex
        : round.findIndex((match) => !match.result?.revealed);
      showToast(`Group-stage matchday ${matchday + 1} complete.`);
    } else {
      buildNextRound(0);
      const managedMatchIndex = teamMatchIndex(1);
      state.activeRound = 1;
      state.selectedMatch = Math.max(0, managedMatchIndex);
      state.championView = false;
      fixtureLimit = DEFAULT_FIXTURE_LIMIT;
      filterUnresolved = false;
      if (state.spectateTeamId && managedMatchIndex < 0) {
        state.neutralView = true;
        showToast(`${spectatedTeam()?.name || "Your team"} are out after the group stage. Continuing neutrally.`);
      } else {
        showToast("Group stage complete. The knockout fixtures are ready.");
      }
    }
    saveState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const watchedMatchIndex = teamMatchIndex(state.activeRound);
  if (watchedMatchIndex >= 0 && !round[watchedMatchIndex].result?.revealed) {
    round.forEach((match, index) => {
      if (index === watchedMatchIndex) return;
      simulateAndRevealMatch(match, state.activeRound);
    });
    state.selectedMatch = watchedMatchIndex;
    state.championView = false;
    saveState();
    render();
    showToast(`Other ${tournamentRoundName()} ties simulated. Your team's match is ready.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  if (state.spectateTeamId && watchedMatchIndex >= 0 && advanceSpectatedRun()) return;
  round.forEach((match) => {
    simulateAndRevealMatch(match, state.activeRound);
  });
  buildNextRound(state.activeRound);

  if (state.activeRound < tournamentFinalRoundIndex()) {
    state.activeRound += 1;
    state.selectedMatch = 0;
    state.championView = false;
    fixtureLimit = DEFAULT_FIXTURE_LIMIT;
    filterUnresolved = false;
    showToast(`${tournamentRoundName(state.activeRound - 1)} complete. The next fixtures are ready.`);
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
  if (isCustomGroupStageRound() && pendingCustomGroupMatchday(selectedRound()) < 0) {
    simulateCurrentRound();
    return;
  }
  const watchedMatchIndex = teamMatchIndex(state.activeRound);
  const watchingActiveTeam = watchedMatchIndex >= 0 && !selectedRound()[watchedMatchIndex]?.result?.revealed;
  const customMatchday = isCustomGroupStageRound()
    ? pendingCustomGroupMatchday(selectedRound()) + 1
    : 0;
  const matchLabel = state.activeRound === tournamentFinalRoundIndex() && selectedRound().length === 1
    ? "match"
    : "matches";
  els.simulateRoundConfirmCopy.textContent = customMatchday && watchingActiveTeam
    ? `Simulate every matchday ${customMatchday} fixture except your team's match?`
    : customMatchday
      ? `Simulate group-stage matchday ${customMatchday}?`
      : watchingActiveTeam
    ? `Simulate every ${tournamentRoundName()} tie except your team's match?`
    : `Simulate the ${tournamentRoundName()} ${matchLabel}?`;
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
    (result.injuries || []).map((event) => `${event.minute}:${event.player}`).join(","),
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
  const numeric = Number(value);
  return `${Number.isFinite(numeric) ? numeric : 0}${suffix}`;
}

function normalizedMatchStats(stats = {}, fallback = {}) {
  const finite = (value) => value === null || value === undefined || value === ""
    ? null
    : Number.isFinite(Number(value)) ? Number(value) : null;
  const pair = (key, defaultHome = 0, defaultAway = 0) => {
    const home = finite(stats?.[key]?.home);
    const away = finite(stats?.[key]?.away);
    const fallbackHome = finite(fallback?.[key]?.home);
    const fallbackAway = finite(fallback?.[key]?.away);
    return {
      home: home ?? fallbackHome ?? defaultHome,
      away: away ?? fallbackAway ?? defaultAway,
    };
  };
  let possession = pair("possession", 50, 50);
  const possessionTotal = possession.home + possession.away;
  if (possessionTotal <= 0) {
    possession = { home: 50, away: 50 };
  } else if (Math.abs(possessionTotal - 100) > 0.01) {
    const home = Math.round((possession.home / possessionTotal) * 100);
    possession = { home, away: 100 - home };
  }
  return {
    possession,
    xg: pair("xg"),
    shots: pair("shots"),
    shotsOnTarget: pair("shotsOnTarget"),
    yellowCards: pair("yellowCards"),
    redCards: pair("redCards"),
  };
}

function renderMatchAnalysis(match, isLive = false) {
  if (!els.matchStatsGrid) return;
  if (!match?.result) {
    els.matchStatsGrid.innerHTML = `<div class="match-stat-row match-stats-empty"><span>${state?.premierLeagueSeason ? "Live stats appear at kick-off" : "No match selected"}</span></div>`;
    return;
  }
  const visible = isLive || match.result.revealed;
  if (!visible) {
    els.matchStatsGrid.innerHTML = `<div class="match-stat-row match-stats-empty"><span>${state?.premierLeagueSeason ? "Live stats appear when the match resumes" : "Stats hidden until the result is revealed"}</span></div>`;
    return;
  }
  const presentation = analysisPresentationForMatch(match);
  if (!presentation) return;
  const rawStats = isLive && livePlayback?.visibleStats
    ? livePlayback.visibleStats
    : match.result.matchStats || presentation.stats;
  const stats = normalizedMatchStats(rawStats, presentation.stats);
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
    ...(result.injuries || []).filter((event) => event.side === side),
  ].sort((a, b) => a.minute - b.minute);

  const homeList = sideEvents("home", result.homeEvents);
  const awayList = sideEvents("away", result.awayEvents);
  const emptyEventsMarkup = state.premierLeagueSeason ? "" : `<div class="event">No major events</div>`;
  const homeEvents = (homeList.length
    ? homeList.map((event) => timelineEventMarkup(event)).join("")
    : emptyEventsMarkup) + shootoutSummaryMarkup(result, "home");
  const awayEvents = (awayList.length
    ? awayList.map((event) => timelineEventMarkup(event, true)).join("")
    : emptyEventsMarkup) + shootoutSummaryMarkup(result, "away");
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
  const retroYear = isRetroSimulatorState() ? Number(retroTournament?.year) : 0;
  const colours = retroYear === 1998
    ? ["#0b3f96", "#c92f4f", "#ffffff", "#8fa9c6", "#041c4b"]
    : retroYear === 2002
    ? ["#ef233c", "#ffd21f", "#075891", "#fff8e7", "#ff4055"]
    : retroYear === 2006
    ? ["#f3d566", "#d8eff7", "#78b0c7", "#f4fbff", "#0b5274"]
    : retroYear === 2026
      ? ["#ff9e2f", "#3768ff", "#ffffff", "#10286f", "#f0442f"]
      : ["#f2c45f", "#5f8cff", "#f4f7fb", "#34c77b", "#ef5b5b"];
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

function completedTournamentHonours() {
  const finalRoundIndex = tournamentFinalRoundIndex();
  const finalRound = state.rounds[finalRoundIndex] || [];
  const final = tournamentFinalMatch(finalRound);
  const thirdPlacePlayoff = finalRound.find((match) => isThirdPlacePlayoff(match));
  if (!final?.result?.winnerId) return null;

  const loserId = final.result.winnerId === final.homeId ? final.awayId : final.homeId;
  const podium = [
    { place: 1, label: "Champions", team: teamById(final.result.winnerId) },
    { place: 2, label: "Runners-up", team: teamById(loserId) },
  ];
  if (thirdPlacePlayoff?.result?.winnerId) {
    podium.push({
      place: 3,
      label: "Third place",
      team: teamById(thirdPlacePlayoff.result.winnerId),
    });
  } else if (isRetroSimulatorState() && Number(retroTournament.year) === 2016) {
    const semiFinals = state.rounds[finalRoundIndex - 1] || [];
    const semiFinalists = semiFinals
      .filter((match) => match?.result?.winnerId)
      .map((match) => (
        match.result.winnerId === match.homeId ? match.awayId : match.homeId
      ))
      .filter(Boolean);
    semiFinalists.forEach((teamId) => {
      podium.push({
        place: 3,
        rankLabel: "SF",
        label: "Semi-finalist",
        team: teamById(teamId),
      });
    });
  } else {
    return null;
  }

  if (podium.some((entry) => !entry.team)) return null;
  const goalkeeperRows = new Map();
  allMatches().filter((match) => match?.result?.revealed && !match.result.bye).forEach((match) => {
    [[match.homeId, match.result.awayGoals], [match.awayId, match.result.homeGoals]].forEach(([teamId, conceded]) => {
      if (!teamId) return;
      const row = goalkeeperRows.get(teamId) || { teamId, cleanSheets: 0, conceded: 0, appearances: 0 };
      row.appearances += 1;
      row.conceded += Number(conceded) || 0;
      if (conceded === 0) row.cleanSheets += 1;
      goalkeeperRows.set(teamId, row);
    });
  });
  const goldenGlove = [...goalkeeperRows.values()]
    .sort((left, right) => (
      right.cleanSheets - left.cleanSheets
      || left.conceded - right.conceded
      || right.appearances - left.appearances
      || (teamById(right.teamId)?.rating || 0) - (teamById(left.teamId)?.rating || 0)
      || (teamById(left.teamId)?.name || "").localeCompare(teamById(right.teamId)?.name || "")
    ))[0];
  if (!goldenGlove) return null;
  const goalkeeperTeam = teamById(goldenGlove.teamId);
  const goalkeeper = playerProfilesForTeam(goalkeeperTeam)
    .filter((player) => player.position === "GK")
    .sort((left, right) => right.overall - left.overall || left.name.localeCompare(right.name))[0];

  return {
    podium,
    goldenGlove: {
      player: goalkeeper?.name || `${goalkeeperTeam.name} goalkeeper`,
      team: goalkeeperTeam,
      ...goldenGlove,
    },
  };
}

function renderChampionHonours() {
  const honours = completedTournamentHonours();
  els.championPodium.hidden = !honours;
  els.championExtraAwards.hidden = !honours;
  if (!honours) {
    els.championPodium.replaceChildren();
    els.championExtraAwards.replaceChildren();
    return;
  }

  els.championPodium.innerHTML = `
    <span class="champion-section-label">FINAL STANDINGS</span>
    <div class="champion-podium-grid${honours.podium.length > 3 ? " has-four-places" : ""}">
      ${honours.podium.map((entry) => `
        <article class="champion-place place-${entry.place}">
          <b>${entry.rankLabel || entry.place}</b>
          ${flagMarkup(entry.team, "champion-place-flag")}
          <span><strong>${escapeHtml(entry.team.name)}</strong><small>${entry.label}</small></span>
        </article>
      `).join("")}
    </div>`;

  els.championExtraAwards.innerHTML = `
    <article class="champion-award champion-glove-award">
      <div class="champion-award-mark" aria-hidden="true">&#129508;</div>
      <div class="champion-award-copy">
        <span>GOLDEN GLOVE</span>
        <strong>${escapeHtml(honours.goldenGlove.player)}</strong>
        <small>
          <span class="champion-award-flag">${flagMarkup(honours.goldenGlove.team, "award-flag")}</span>
          <span>${escapeHtml(honours.goldenGlove.team.name)}</span>
          <b>${honours.goldenGlove.cleanSheets} clean sheets</b>
        </small>
      </div>
    </article>`;
}

function renderStage() {
  placeSnapshotButtonOnChampionScreen(false);
  els.stageRoundLabel.hidden = Boolean(state.championView);
  els.penaltyStage.hidden = true;
  els.standardMatchTactics.hidden = true;
  if (els.plWatchTactics) els.plWatchTactics.hidden = true;
  els.standardMatchTactics.closest(".insight-right")?.classList.add("tactics-hidden");
  els.match2dViewer.hidden = true;
  els.matchCommentaryView.hidden = true;
  els.matchPenaltyOverlay.hidden = !livePlayback?.matchPenaltyActive;
  els.matchStage.classList.remove("is-shootout", "pl-full-time");
  if (els.uclLegSwitcher) els.uclLegSwitcher.hidden = true;
  els.snapshotButton.hidden = true;
  if (els.retroMatchLineupsPanel) els.retroMatchLineupsPanel.hidden = true;
  els.spectateEliminationActions.hidden = true;
  els.stageAction.classList.remove("has-elimination-actions");
  els.playButton.hidden = false;
  if (state.championView) {
    const finalRound = state.rounds[tournamentFinalRoundIndex()] || [];
    const final = tournamentFinalMatch(finalRound);
    const champion = final?.result ? teamById(final.result.winnerId) : null;
    if (champion) {
      const customMatch = state.customTournament?.customMatch === true;
      const topScorer = customMatch ? null : calculateTopGoalscorer();
      placeSnapshotButtonOnChampionScreen(true);
      const trophy = els.championStage.querySelector(".trophy");
      const summary = els.championStage.querySelector(".champion-content > p");
      if (trophy) {
        trophy.textContent = isRetroSimulatorState()
          ? Number(retroTournament.year) === 2016
            ? "FRANCE 2016 EUROPEAN CHAMPIONS"
            : `${RETRO_WORLD_CUP_EDITIONS[retroTournament.year].host.toUpperCase()} ${retroTournament.year} WORLD CHAMPIONS`
          : isValidCustomTournamentState(state)
            ? state.customTournament.customMatch ? "CUSTOM MATCH WINNER" : `${state.customTournament.teamCount} TEAM CUSTOM TOURNAMENT CHAMPIONS`
          : "256 TEAMS WC CHAMPIONS";
      }
      if (summary) {
        const customChampionMatches = isValidCustomTournamentState(state)
          ? state.rounds.flat().filter((match) => (
            match?.result
            && (match.homeId === champion.id || match.awayId === champion.id)
          )).length
          : 0;
        summary.textContent = isRetroSimulatorState()
          ? Number(retroTournament.year) === 2016
            ? "Seven matches. One unforgettable European Championship."
            : "Seven matches. One unforgettable World Cup."
          : isValidCustomTournamentState(state)
            ? state.customTournament.customMatch ? "One match, one winner." : `${customChampionMatches} ${customChampionMatches === 1 ? "match" : "matches"}. A field of ${state.customTournament.teamCount} conquered.`
          : "Eight wins. A field of 256 conquered.";
      }
      els.matchContent.hidden = true;
      els.championStage.hidden = false;
      els.championFlag.innerHTML = flagMarkup(champion, "hero-flag");
      els.championName.textContent = champion.name;
      renderChampionConfetti(champion.id);
      els.snapshotButton.hidden = !final.result.revealed;
      els.championTeamJourney.hidden = customMatch;
      els.championAwardsGrid.hidden = customMatch;
      els.championTopScorerAward.hidden = !topScorer;
      els.championTopScorerAward.style.display = topScorer ? "" : "none";
      if (topScorer) {
        const scorerTeam = teamById(topScorer.teamId);
        els.championTopScorerName.textContent = topScorer.player;
        els.championTopScorerFlag.innerHTML = flagMarkup(scorerTeam, "award-flag");
        els.championTopScorerTeam.textContent = scorerTeam.name;
        els.championTopScorerGoals.textContent = `${topScorer.goals} ${topScorer.goals === 1 ? "goal" : "goals"}`;
      }
      renderChampionHonours();
      renderChampionPrediction(champion);
      syncChampionTournamentHistoryButton();
      if (!state.savedTournamentView) {
        const mode = isRetroSimulatorState()
          ? `retro-${retroTournament?.year || "world-cup"}`
          : isValidCustomTournamentState(state)
            ? `custom-${state.customTournament.teamCount}`
            : "knockout-256";
        maybeShowPostWinDonation(`${mode}:${state.drawSeed || "seed"}:${champion.id}`);
      }
      if (isRetroSimulatorState() && !state.savedTournamentView && retroTournament?.managedTeam) {
        window.AccountAchievements?.trackRetroTournament(retroTournament);
      }
      return;
    }
  }

  els.matchContent.hidden = false;
  els.championStage.hidden = true;
  renderChampionHonours();
  clearChampionConfetti();
  const match = selectedMatch();
  if (!match) return;
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const result = match.result;
  const revealed = result?.revealed;
  const isLive = livePlayback?.matchId === match.id;
  const premierLeagueFullTime = Boolean(state.premierLeagueSeason && revealed && !isLive);
  const premierLeaguePrematch = Boolean(state.premierLeagueSeason && !result && !isLive);
  const isShootout = isLive && livePlayback.phase === "shootout";
  const pendingReveal = result && !revealed && !isLive;
  const isControlledMatch = Boolean(state.spectateTeamId)
    && (match.homeId === state.spectateTeamId || match.awayId === state.spectateTeamId);
  const controlledSide = state.spectateTeamId === match.homeId ? "home" : "away";
  const opponentTacticKey = result?.tacticalMatchup?.opponent
    || (isControlledMatch ? opponentStandardTactic(match, controlledSide) : null);
  const opponentTacticName = STANDARD_TACTICS[opponentTacticKey]?.name;
  const tacticalFeedback = opponentTacticKey
    ? standardTacticalFeedback(state.standardTactic, opponentTacticKey)
    : null;
  const showStandardTactics = LIVE_MATCH_MANAGEMENT_UI_ENABLED
    && isControlledMatch
    && !revealed;
  const showPremierLeagueWatchTactics = LIVE_MATCH_MANAGEMENT_UI_ENABLED
    && Boolean(state.premierLeagueSeason && !isControlledMatch);
  els.standardMatchTactics.hidden = !showStandardTactics;
  if (state.premierLeagueSeason && isControlledMatch) applyPremierLeagueFormationToManagedTeam(match);
  if (els.plWatchTactics) {
    els.plWatchTactics.hidden = !showPremierLeagueWatchTactics;
    if (showPremierLeagueWatchTactics && els.plWatchTacticsCopy) {
      const managedClub = teamById(state.spectateTeamId);
      els.plWatchTacticsCopy.textContent = managedClub
        ? `Available when ${managedClub.name} play.`
        : "Choose a club to control tactics in its matches.";
    }
  }
  els.standardMatchTactics.closest(".insight-right")?.classList.toggle(
    "tactics-hidden",
    !showStandardTactics && !showPremierLeagueWatchTactics,
  );
  els.standardTacticOpponent.textContent = state.premierLeagueSeason
    ? opponentTacticName ? `Tactics · Opponent: ${opponentTacticName}` : "Tactics"
    : opponentTacticName ? `Opponent: ${opponentTacticName}` : "";
  els.standardTacticFeedback.textContent = tacticalFeedback?.label || "";
  els.match2dViewer.hidden = true;
  els.matchCommentaryView.hidden = !isLive || isShootout;
  renderHighlightModeControls();
  els.standardTacticButtons.querySelectorAll("button").forEach((button) => {
    const active = button.dataset.standardTactic === state.standardTactic;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
    button.disabled = Boolean(result && !isLive && result.engineVersion === 2);
  });
  els.match2dTacticLabel.textContent = match2dTacticSummary(match);
  els.snapshotButton.hidden = !revealed || Boolean(isLive);
  const showSharedLineupPanel = Boolean(
    els.retroMatchLineupsPanel
    && els.retroMatchLineupsBody
    && isRetroSimulatorState()
    && (LIVE_MATCH_MANAGEMENT_UI_ENABLED || (!isLive && !result))
  );
  if (els.retroMatchLineupsPanel) els.retroMatchLineupsPanel.hidden = !showSharedLineupPanel;
  if (showSharedLineupPanel) {
    const matchChanged = els.retroMatchLineupsPanel.dataset.matchId !== match.id;
    if (matchChanged) {
      retroLineupPanelView = "managed";
      retroLineupSwapNumber = null;
    }
    els.retroMatchLineupsPanel.hidden = false;
    els.retroMatchLineupsPanel.dataset.matchId = match.id;
    renderRetroMatchLineupsPanel(match);
    if ((isLive || result) && matchChanged) els.retroMatchLineupsPanel.open = false;
  }
  renderMatchAnalysis(match, Boolean(isLive));
  document.body.classList.toggle("pl-match-detail-active", Boolean(
    state.premierLeagueSeason && (isLive || revealed || result),
  ));
  els.matchStage.classList.toggle("pl-prematch", premierLeaguePrematch);

  els.matchNumber.textContent = `${state.selectedMatch + 1}/${selectedRound().length}`;
  els.stageRoundLabel.textContent = tournamentMatchRoundName(match).toUpperCase();
  els.homeSeed.textContent = "";
  els.awaySeed.textContent = "";
  els.homeFlag.innerHTML = flagMarkup(home, "hero-flag");
  els.awayFlag.innerHTML = flagMarkup(away, "hero-flag");
  setTeamName(els.homeName, premierLeagueResponsiveTeamName(home));
  setTeamName(els.awayName, premierLeagueResponsiveTeamName(away));
  els.homeScore.textContent = premierLeaguePrematch
    ? state.uclSeason ? "20:00" : window.PremierLeagueSeason?.kickoffForMatch?.(state.selectedMatch) || "15:00"
    : isLive ? livePlayback.homeScore : revealed ? result.homeGoals : result ? "–" : "0";
  els.awayScore.textContent = premierLeaguePrematch
    ? ""
    : isLive ? livePlayback.awayScore : revealed ? result.awayGoals : result ? "–" : "0";
  els.resultNote.hidden = isLive || !revealed;
  els.resultNote.textContent = revealed ? resultSuffix(result) : "";
  const knockoutLeg = state?.uclKnockoutMatch;
  const availableLegs = Array.isArray(knockoutLeg?.availableLegIndices)
    ? knockoutLeg.availableLegIndices.map(Number).filter(Number.isInteger)
    : [];
  const showLegSwitcher = Boolean(
    knockoutLeg?.reviewOnly
    && Number(knockoutLeg.legCount) > 1
    && availableLegs.length > 1
    && revealed
    && !isLive,
  );
  if (els.uclLegSwitcher) {
    els.uclLegSwitcher.hidden = !showLegSwitcher;
    if (showLegSwitcher) {
      const currentLeg = Number(knockoutLeg.legIndex) || 0;
      els.uclLegSwitcherLabel.textContent = `Leg ${currentLeg + 1} of ${knockoutLeg.legCount}`;
      els.uclPreviousLegButton.disabled = !availableLegs.some((legIndex) => legIndex < currentLeg);
      els.uclNextLegButton.disabled = !availableLegs.some((legIndex) => legIndex > currentLeg);
    }
  }
  els.spoilerPanel.hidden = !pendingReveal;
  if (pendingReveal) {
    const checkpoint = readLiveMatchCheckpoint(match);
    const resumeMinute = Number(checkpoint?.displayedMinute) || 0;
    els.spoilerTitle.textContent = checkpoint ? "Match paused" : "Match interrupted";
    els.spoilerCopy.textContent = checkpoint
      ? `Continue from ${clockText(resumeMinute)} with the score and match state preserved.`
      : "Resume without revealing the result.";
    els.revealButton.innerHTML = "Resume match <span>&rarr;</span>";
  }
  els.stageAction.hidden = pendingReveal || isLive;
  els.matchStage.classList.toggle("is-live", Boolean(isLive));
  els.matchStage.classList.toggle("is-shootout", Boolean(isShootout));
  els.matchStage.classList.toggle("pl-full-time", premierLeagueFullTime);
  const premierLeagueResultEventRows = premierLeagueFullTime
    ? Math.max(
      (result.homeEvents || []).length
        + (result.redCards || []).filter((event) => event.side === "home").length
        + (result.injuries || []).filter((event) => event.side === "home").length,
      (result.awayEvents || []).length
        + (result.redCards || []).filter((event) => event.side === "away").length
        + (result.injuries || []).filter((event) => event.side === "away").length,
    )
    : 0;
  els.matchStage.style.setProperty(
    "--pl-result-event-clearance",
    `${Math.max(0, premierLeagueResultEventRows - 2) * 24}px`,
  );
  els.penaltyStage.hidden = !isShootout;
  els.homeDiscipline.innerHTML = disciplineMarkup(
    isLive ? livePlayback.homeReds : revealed ? (result.redCards || []).filter((card) => card.side === "home") : [],
  );
  els.awayDiscipline.innerHTML = disciplineMarkup(
    isLive ? livePlayback.awayReds : revealed ? (result.redCards || []).filter((card) => card.side === "away") : [],
  );
  if (isLive) {
    const displayedMinute = displayedLiveMinute();
    els.homeEventSide.hidden = false;
    els.awayEventSide.hidden = false;
    els.eventLiveClock.hidden = isShootout;
    els.eventControls.hidden = false;
    els.skipControl.hidden = isShootout;
    els.shootoutSkipControl.hidden = !isShootout || !canSkipPenaltyShootout();
    els.liveClock.textContent = clockText(displayedMinute);
    els.livePhase.textContent = phaseForMinute(displayedMinute, result);
    els.pauseLiveButton.setAttribute("aria-pressed", String(livePlayback.paused));
    els.pauseLiveButton.textContent = livePlayback.paused ? "Resume" : "Pause";
    els.speedButton.disabled = false;
    els.speedButton.textContent = `${livePlayback.speed}×`;
    renderLiveTimeline();
    if (isShootout) renderPenaltyStage();
  }
  const isSpectatedMatch = state.spectateTeamId && !state.neutralView
    && (match.homeId === state.spectateTeamId || match.awayId === state.spectateTeamId);
  const thirdPlacePlayoff = isThirdPlacePlayoff(match);
  const spectatedWon = isSpectatedMatch && revealed && result.winnerId === state.spectateTeamId;
  const spectatedHasThirdPlace = isSpectatedMatch
    && revealed
    && teamHasPendingThirdPlace(state.spectateTeamId);
  const retroGroupEliminationPending = Boolean(
    isRetroSimulatorState()
    && retroTournament?.pendingEliminationDecision
    && retroTournament.pendingEliminationDecision.teamName === spectatedTeam()?.name
    && retroTournament.pendingEliminationDecision.matchId === match.id,
  );
  const spectatedLost = !state.premierLeagueSeason && (retroGroupEliminationPending || (
    isSpectatedMatch
    && revealed
    && !thirdPlacePlayoff
    && state.activeRound !== tournamentFinalRoundIndex()
    && !spectatedHasThirdPlace
    && !match.allowDraw
    && result.winnerId !== state.spectateTeamId
  ));
  const revealedAction = state.uclSeason
    ? state.uclKnockoutMatch ? "Back to knockouts" : isControlledMatch ? "Complete matchday" : "Back to your match"
    : state.premierLeagueSeason
    ? "Next match"
    : thirdPlacePlayoff
    ? "Next game"
    : spectatedWon || spectatedHasThirdPlace
    ? state.activeRound === tournamentFinalRoundIndex() ? "Crown champion" : `Next ${spectatedTeam().name} match`
    : state.activeRound === tournamentFinalRoundIndex() ? "Crown champion" : "Next game";
  els.playButton.innerHTML = revealed
    ? `${revealedAction} <span>→</span>`
    : `<span class="play-icon">▶</span> ${state.premierLeagueSeason
      ? isControlledMatch ? "Play match" : "Watch match"
      : "Play this tie"}`;
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
  els.roundNav.innerHTML = tournamentRoundNames().map((name, index) => {
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
        <small>${complete ? "Results" : state.uclSeason ? "18 matches" : state.premierLeagueSeason ? "10 matches" : (round ? round.length : 2 ** (tournamentFinalRoundIndex() - index))}</small>
      </button>
    `;
  }).join("");

}

function roundHistoryTargets() {
  const currentRound = currentTournamentRoundIndex();
  const historyMode = viewingRoundHistory();
  const olderStart = historyMode
    ? state.activeRound - 1
    : state.activeRound >= Math.max(0, tournamentFinalRoundIndex() - 3)
      ? Math.max(0, tournamentFinalRoundIndex() - 4)
      : state.activeRound - 1;
  let older = null;
  for (let index = olderStart; index >= 0; index -= 1) {
    if (roundIsComplete(index)) {
      older = index;
      break;
    }
  }

  const newer = historyMode
    ? !state.uclSeason && state.activeRound === 3 && currentRound >= 4
      ? currentRound
      : state.activeRound + 1
    : null;
  return { older, newer };
}

function roundHistoryLabel(roundIndex) {
  if (state?.uclSeason) return `View Matchday ${roundIndex + 1}`;
  return roundIndex >= (isRetroSimulatorState() ? 3 : 4)
    ? "View knockout bracket"
    : `View ${tournamentRoundName(roundIndex)}`;
}

function renderRoundHistoryControl() {
  if (teamFilterId) {
    els.historyRoundButton.hidden = true;
    els.newerRoundButton.hidden = true;
    return;
  }
  if (isRetroSimulatorState()) {
    els.historyRoundButton.hidden = false;
    els.historyRoundButton.textContent = retroBottomGroupsVisible ? "Matches" : "Groups";
    els.historyRoundButton.dataset.retroGroups = retroBottomGroupsVisible ? "close" : "open";
    const knockoutStarted = retroTournament?.phase === "knockout" || retroTournament?.phase === "complete";
    els.newerRoundButton.hidden = retroBottomGroupsVisible || !knockoutStarted;
    if (knockoutStarted && !retroBottomGroupsVisible) {
      const viewingGroupHistory = retroBottomGroupMatchesVisible || state.activeRound < 3;
      els.newerRoundButton.textContent = viewingGroupHistory
        ? "Knockout bracket"
        : "Group matches";
      els.newerRoundButton.dataset.retroGroupMatches = viewingGroupHistory ? "close" : "open";
    }
    return;
  }
  delete els.historyRoundButton.dataset.retroGroups;
  delete els.newerRoundButton.dataset.retroGroupMatches;
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
  if (result.bye) return side === "home" ? "BYE" : "";
  const goals = side === "home" ? result.homeGoals : result.awayGoals;
  const shootout = result.penalties?.[side];
  return shootout === undefined ? String(goals) : `${goals}<small>(${shootout})</small>`;
}

function fixtureStatus(match, result, revealed, index) {
  if (result && !revealed) return "READY";
  if (!revealed) {
    const matchNumber = isRetroSimulatorState() && Number.isFinite(Number(match?.schedule?.matchNumber))
      ? Number(match.schedule.matchNumber)
      : index + 1;
    return `MATCH ${String(matchNumber).padStart(2, "0")}`;
  }
  if (result.bye) return "SEEDED BYE";
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
  const chronologyBlocked = finalBlockedByThirdPlace(match, roundIndex);
  const winner = revealed ? result.winnerId : null;
  const selected = !placeholder
    && !result?.bye
    && roundIndex === state.activeRound
    && index === state.selectedMatch
    && !state.championView;
  const style = options.row && options.column
    ? `style="grid-column:${options.column};grid-row:${options.row}"`
    : "";
  const connection = options.connects ? "data-connects=\"true\"" : "";
  const homeName = home ? premierLeagueResponsiveTeamName(home) : "To be confirmed";
  const awayName = result?.bye
    ? "Seeded bye"
    : away ? premierLeagueResponsiveTeamName(away) : "To be confirmed";
  const homeFlag = home ? flagMarkup(home, "fixture-flag") : `<span class="fixture-tbc-flag">?</span>`;
  const awayFlag = away
    ? flagMarkup(away, "fixture-flag")
    : result?.bye ? `<span class="fixture-tbc-flag">&mdash;</span>` : `<span class="fixture-tbc-flag">?</span>`;

  return `
    <button
      class="fixture ${options.bracket ? "bracket-fixture" : ""} ${revealed ? "complete" : ""} ${selected ? "selected" : ""} ${placeholder ? "placeholder" : ""}"
      data-index="${index}"
      data-round="${roundIndex}"
      ${connection}
      ${style}
      ${placeholder || result?.bye || chronologyBlocked ? "disabled" : ""}
    >
      ${options.bracket ? "" : `
        <span class="fixture-card-head">
          <span>${tournamentMatchRoundName(match, roundIndex)}</span>
          <small>${fixtureStatus(match, result, revealed, index)}</small>
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
      ${isRetroSimulatorState() && match?.schedule ? `
        <span class="retro-standard-fixture-meta">
          ${escapeHtml([
            match.schedule.dateLabel,
            [match.schedule.stadium, match.schedule.city].filter(Boolean).join(", "),
          ].filter(Boolean).join(" · "))}
        </span>
      ` : ""}
    </button>
  `;
}

function bracketMarkup() {
  const finalRoundIndex = tournamentFinalRoundIndex();
  const firstRoundIndex = Math.max(0, finalRoundIndex - 3);
  const roundIndexes = Array.from(
    { length: finalRoundIndex - firstRoundIndex + 1 },
    (_, index) => firstRoundIndex + index,
  );
  const roundNames = tournamentRoundNames();
  const heads = roundIndexes
    .map((roundIndex) => `<span>${roundNames[roundIndex]}</span>`)
    .join("");
  const cards = [];
  const connectors = [];

  roundIndexes.forEach((roundIndex, offset) => {
    const matches = state.rounds[roundIndex] || [];
    const matchCount = 2 ** (finalRoundIndex - roundIndex);
    const baseRow = 2 ** offset;
    const rowStep = 2 ** (offset + 1);
    for (let index = 0; index < matchCount; index += 1) {
      const matchIndex = roundIndex === finalRoundIndex
        ? Math.max(0, matches.indexOf(tournamentFinalMatch(matches)))
        : index;
      cards.push(fixtureMarkup(matches[matchIndex], matchIndex, roundIndex, {
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

  const thirdPlaceIndex = (state.rounds[finalRoundIndex] || [])
    .findIndex((match) => isThirdPlacePlayoff(match));
  const thirdPlaceMatch = thirdPlaceIndex >= 0 ? state.rounds[finalRoundIndex][thirdPlaceIndex] : null;
  return `
    <div class="bracket-shell">
      <div class="bracket-heads" style="grid-template-columns:repeat(${roundIndexes.length}, minmax(190px, 1fr))">${heads}</div>
      <div class="bracket-canvas" style="grid-template-columns:repeat(${roundIndexes.length}, minmax(190px, 1fr))">
        ${cards.join("")}${connectors.join("")}
        ${thirdPlaceMatch ? `
          <section class="retro-third-place-playoff">
            <span>THIRD-PLACE PLAY-OFF</span>
            <div class="retro-third-place-card">
              ${fixtureMarkup(thirdPlaceMatch, thirdPlaceIndex, finalRoundIndex, {
                bracket: true,
                column: 1,
                row: 1,
              })}
            </div>
          </section>
        ` : ""}
      </div>
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

function customGroupTablesMarkup() {
  const groupCount = state.customTournament.teamCount / 4;
  const complete = roundIsComplete(0);
  const qualifiedIds = complete ? new Set(customGroupQualifiers().map((row) => row.teamId)) : new Set();
  return `
    <div class="custom-live-groups-shell ${customGroupTablesCollapsed ? "is-collapsed" : ""}">
      <div class="custom-live-groups">
        ${Array.from({ length: groupCount }, (_, groupIndex) => {
          const table = customGroupStandings(groupIndex);
          return `<section class="custom-live-group">
            <header><strong>${customGroupLabel(groupIndex)}</strong><span>P</span><span>GD</span><span>PTS</span></header>
            ${table.map((row, position) => {
              const team = teamById(row.teamId);
              return `<div class="${qualifiedIds.has(row.teamId) ? "qualified" : ""}">
                <b>${position + 1}</b>
                ${flagMarkup(team, "custom-group-flag")}
                <span>${escapeHtml(team.name)}</span>
                <i>${row.played}</i>
                <i>${row.gd > 0 ? "+" : ""}${row.gd}</i>
                <strong>${row.points}</strong>
              </div>`;
            }).join("")}
          </section>`;
        }).join("")}
      </div>
    </div>
    <div class="custom-group-fixture-heading"><strong>Group fixtures</strong><span>${state.rounds[0].filter((match) => match.result?.revealed).length}/${state.rounds[0].length} played</span></div>
  `;
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
  const customGroupStage = state.customTournament?.structure === "groups" && state.activeRound === 0;
  const firstKnockoutRound = state.customTournament?.structure === "groups" ? 1 : 0;
  const bracketMode = !state.premierLeagueSeason && !customGroupStage
    && state.activeRound >= Math.max(firstKnockoutRound, tournamentFinalRoundIndex() - 3);
  const historyMode = viewingRoundHistory();
  els.fixtureGrid.classList.toggle("bracket-mode", bracketMode);
  els.fixtureGrid.classList.toggle("custom-group-stage-mode", customGroupStage);
  if (customGroupStage) {
    els.unresolvedFilter.hidden = false;
    els.unresolvedFilter.textContent = customGroupTablesCollapsed ? "Show groups" : "Hide groups";
    els.unresolvedFilter.setAttribute("aria-expanded", String(!customGroupTablesCollapsed));
    els.unresolvedFilter.classList.toggle("active", customGroupTablesCollapsed);
  } else {
    els.unresolvedFilter.hidden = bracketMode || historyMode;
    els.unresolvedFilter.textContent = "Unplayed only";
    els.unresolvedFilter.removeAttribute("aria-expanded");
    els.unresolvedFilter.classList.toggle("active", filterUnresolved);
  }

  if (customGroupStage) {
    const round = selectedRound();
    const indexed = round.map((match, index) => ({ match, index }));
    els.fixtureGrid.innerHTML = `${customGroupTablesMarkup()}<div class="custom-group-fixtures">${indexed.map(({ match, index }) => fixtureMarkup(match, index)).join("")}</div>`;
    els.loadMoreButton.hidden = true;
    bindFixtureNavigation();
    return;
  }

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
  if (!match.result?.revealed || match.result.bye) return null;
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const winner = match.result.winnerId ? teamById(match.result.winnerId) : null;
  const loser = winner ? (winner.id === home.id ? away : home) : null;
  const roundIndex = state.rounds.findIndex((round) => round.includes(match));
  const leagueCopy = state.premierLeagueSeason
    ? window.PremierLeagueSeason?.resultCommentary?.(match, Math.max(0, roundIndex))
    : null;
  if (leagueCopy) {
    const upset = winner && commentaryTeamRating(loser) - commentaryTeamRating(winner) >= 7;
    return {
      icon: upset ? "⚡" : winner ? "↑" : "=",
      title: winner ? `${winner.name} beat ${loser.name}` : `${home.name} and ${away.name} draw`,
      copy: leagueCopy,
      priority: upset ? 4 : 1,
    };
  }
  const groupCopy = groupResultCommentary(match, winner, loser, Math.max(0, roundIndex));
  if (groupCopy) {
    const upset = winner && commentaryTeamRating(loser) - commentaryTeamRating(winner) >= 7;
    return {
      icon: upset ? "⚡" : winner ? "↑" : "=",
      title: winner ? `${winner.name} beat ${loser.name}` : `${home.name} and ${away.name} draw`,
      copy: groupCopy,
      priority: upset ? 4 : 1,
    };
  }
  if (!winner) {
    return {
      icon: "=",
      title: `${home.name} and ${away.name} draw`,
      copy: `The points are shared after a level group-stage match.`,
      priority: 1,
    };
  }
  const goals = match.result.homeGoals + match.result.awayGoals;

  if (commentaryTeamRating(loser) - commentaryTeamRating(winner) >= 7) {
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

function applyRetroGroupScore(table, match, homeGoals, awayGoals) {
  const home = table.get(match.home);
  const away = table.get(match.away);
  if (!home || !away) return;
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
}

function retroVisibleGroupStandings(group) {
  const teams = RETRO_WORLD_CUPS[retroTournament.year].teams.filter((team) => team.group === group);
  const seedOrder = new Map(teams.map((team, index) => [team.name, index]));
  const table = new Map(teams.map((team) => [team.name, {
    name: team.name,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
  }]));

  retroTournament.groupMatches
    .filter((match) => match.group === group && match.result?.revealed)
    .forEach((match) => {
      applyRetroGroupScore(table, match, match.result.homeGoals, match.result.awayGoals);
    });

  const liveMatch = livePlayback ? retroMatchById(livePlayback.matchId) : null;
  if (
    liveMatch?.stage === "group"
    && liveMatch.group === group
    && !liveMatch.result?.revealed
  ) {
    applyRetroGroupScore(
      table,
      liveMatch,
      Number(livePlayback.homeScore) || 0,
      Number(livePlayback.awayScore) || 0,
    );
  }

  return [...table.values()]
    .map((row) => ({ ...row, gd: row.gf - row.ga }))
    .sort((left, right) => (
      right.points - left.points
      || right.gd - left.gd
      || right.gf - left.gf
      || seedOrder.get(left.name) - seedOrder.get(right.name)
    ));
}

function retroActiveGroup() {
  const liveMatch = livePlayback ? retroMatchById(livePlayback.matchId) : null;
  if (liveMatch?.stage === "group") return liveMatch.group;
  const match = selectedMatch();
  if (match?.stage === "group") return match.group;
  const managedTeam = RETRO_WORLD_CUPS[retroTournament.year].teams
    .find((team) => team.name === retroTournament.managedTeam);
  return managedTeam?.group || "A";
}

function renderRetroLiveGroupTable() {
  const group = retroActiveGroup();
  const rows = retroVisibleGroupStandings(group);
  const isLive = Boolean(livePlayback && retroMatchById(livePlayback.matchId)?.group === group);
  els.goldenBootTitle.textContent = `GROUP ${group}${isLive ? " · LIVE" : ""}`;
  els.goldenBootList.innerHTML = `
    <div class="retro-live-table-head">
      <span>Team</span><b>P</b><b>GD</b><b>Pts</b>
    </div>
    ${rows.map((row, index) => `
      <div class="retro-live-table-row ${index < 2 ? "qualification-place" : ""}">
        <span>
          <em>${index + 1}</em>
          ${retroFlag(row.name, "retro-live-table-flag")}
          <strong>${escapeHtml(row.name)}</strong>
        </span>
        <b>${row.played}</b>
        <b>${row.gd > 0 ? `+${row.gd}` : row.gd}</b>
        <b>${row.points}</b>
      </div>
    `).join("")}
  `;
}

function retroGroupStageDisplayActive() {
  return Boolean(
    retroTournament
    && retroTournament.groupMatches.some((match) => !match.result?.revealed),
  );
}

function renderGoldenBoot() {
  if (isRetroSimulatorState() && retroGroupStageDisplayActive()) {
    renderRetroLiveGroupTable();
    return;
  }
  els.goldenBootTitle.textContent = state?.uclSeason ? "TOP SCORERS" : "GOLDEN BOOT";
  const competitionScorers = state?.uclSeason && window.UclSeason?.topScorerRows
    ? window.UclSeason.topScorerRows(500)
    : calculateGoalscorerTable();
  const rankedScorers = competitionScorers.map((leader, index) => ({
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
  const total = isRetroSimulatorState()
    ? 64
    : state.legacyTournament
      ? 16
      : state.customTournament
      ? state.customTournament.structure === "groups"
        ? (state.customTournament.teamCount / 4) * 6
          + customGroupQualifierCount(state.customTournament.teamCount) - 1
          + Number(state.customTournament.thirdPlace === true)
        : state.customTournament.teamCount - 1 + Number(state.customTournament.thirdPlace === true)
      : state.premierLeagueSeason
        ? 380
        : 256;
  const percent = Math.round((complete / total) * 100);
  els.progressPercent.textContent = `${percent}%`;
  els.progressBar.style.width = `${percent}%`;
  els.progressCopy.textContent = complete
    ? `${complete} played · ${total - complete} ties remaining`
    : state.premierLeagueSeason
      ? "20 clubs. 380 matches. One champion."
      : state.legacyTournament
      ? "16 teams. 16 ties including the third-place play-off."
      : state.customTournament
        ? `${state.customTournament.teamCount} teams. ${total} ties. One champion.`
        : "256 teams. 256 ties. One champion.";
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

const CUSTOM_TEAM_SOURCE_OPTIONS = Object.freeze([
  ["current", "Current teams"],
  ["premier-league", "Premier League clubs"],
  ["custom", "My custom teams"],
  ["2006", "World Cup 2006"],
  ["2010", "World Cup 2010"],
  ["2014", "World Cup 2014"],
  ["2016", "UEFA Euro 2016"],
  ["2018", "World Cup 2018"],
  ["2022", "World Cup 2022"],
  ["all-retro", "All retro teams"],
]);

const CUSTOM_TEAM_SOURCE_IDS = new Set(CUSTOM_TEAM_SOURCE_OPTIONS.map(([value]) => value));
