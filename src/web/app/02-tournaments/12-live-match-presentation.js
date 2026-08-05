
function nextMatchHighlight() {
  if (!match2dState) return null;
  return match2dState.presentation.highlights.find((highlight) => (
    highlight.timelineIndex > match2dState.cursor
    && highlight.minute <= (livePlayback?.maxMinute ?? 120)
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
  livePlayback.presentationClock.sync(highlight.minute, timestamp);
  livePlayback.minute = Math.max(livePlayback.minute, highlight.minute);
  livePlayback.visibleStats = matchStatsAtMinute(match2dState.presentation.stats, highlight.minute);
  els.livePhase.textContent = phaseForMinute(displayedLiveMinute(), selectedMatch().result);
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
  if (!livePlayback || !["goal", "red", "injury", "disallowed-goal", "penalty-miss"].includes(event.type)) return;
  const eventKey = match2dEventKey(event);
  if (
    match2dState?.playedEventKeys?.has(event.id)
    || match2dState?.playedEventKeys?.has(eventKey)
  ) {
    presentationDebug("[PRESENTATION_DROP]", event, "already-played");
    return;
  }
  match2dState?.playedEventKeys?.add(event.id);
  match2dState?.playedEventKeys?.add(eventKey);
  if (["goal", "red", "injury"].includes(event.type)) applyLiveEvent(event, Boolean(event.metadata.animate));
  updateLiveRatingsForEvent(event);
  presentationDebug(event.type === "goal" ? "[SCORE_UPDATE]" : "[SIM_EVENT]", event);
}

function showPresentationEvent(event) {
  if (!livePlayback) return;
  const team = teamById(event.teamId);
  const injuredPlayer = event.metadata?.scorer || "A player";
  const text = event.importance === "goal"
    ? MatchPresentation.goalCommentary(event, team?.name || "Team")
    : event.type === "injury"
      ? `${injuredPlayer} cannot continue and leaves ${team?.name || "his team"} a player short.`
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
  const scoreCorrection = livePlayback.penaltyScoreCorrections || { home: 0, away: 0 };
  const correctScore = (score) => {
    if (!score || baseEvent.metadata?.scoreCorrected) return score;
    return {
      home: Math.max(0, score.home - scoreCorrection.home),
      away: Math.max(0, score.away - scoreCorrection.away),
    };
  };
  const event = MatchPresentation.createEvent({
    ...baseEvent,
    scoreBefore: correctScore(baseEvent.scoreBefore),
    scoreAfter: correctScore(baseEvent.scoreAfter),
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

function publishLiveManagementCommentary(entry) {
  if (!livePlayback?.commentaryFeed) return false;
  const latest = livePlayback.commentaryFeed.at(-1);
  const goalIsStillBeingCalled = latest?.emphasis === "goal"
    && Number(latest.minute) >= Number(entry.minute) - 1;
  if (goalIsStillBeingCalled) return false;
  livePlayback.commentaryFeed.push(entry);
  renderCommentaryFeed();
  return true;
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
  if (livePlayback.matchPenaltyActive || livePlayback.matchPenaltyContext || els.matchStage.classList.contains("has-match-penalty")) return;
  if (timestamp < match2dState.nextAction || timestamp < match2dState.lockUntil) return;
  const speed = Math.max(0.5, livePlayback.speed || 1);
  const active = match2dState.activeHighlight;
  // Keep commentary tied to the match clock, while letting routine play flow smoothly.
  while (active && match2dState.actionIndex < active.actions.length) {
    const action = active.actions[match2dState.actionIndex];
    const actionMinute = Number(
      action.presentationEvent?.minute
      ?? action.event?.minute
      ?? active.minute,
    );
    const eventType = action.presentationEvent?.type || action.event?.type || "";
    const timingSensitive = action.outcome === "goal"
      || action.outcome === "penalty"
      || Boolean(action.penalty)
      || ["goal", "red", "penalty", "penalty-kick", "penalty-miss", "disallowed-goal"].includes(eventType);
    const visibleMinute = livePlayback.presentationClock?.read(timestamp) ?? displayedLiveMinute();
    if (timingSensitive && visibleMinute + 0.02 < actionMinute) {
      match2dState.nextAction = timestamp + Math.max(8, 16 / speed);
      return;
    }
    match2dState.actionIndex += 1;
    const matchesMode = highlightMatchesMode(active);
    if (matchesMode) {
      processPossessionAction(action, timestamp, true);
      return;
    } else {
      const importance = receivePresentationAction(action, false);
      updateLiveRatingsForAction(action);
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
    const finalMinute = livePlayback.maxMinute;
    if (!match2dState.fullTimeClockQueued) {
      livePlayback.presentationClock.sync(finalMinute, timestamp);
      match2dState.fullTimeClockQueued = true;
    }
    const visibleMinute = livePlayback.presentationClock.read(timestamp);
    livePlayback.minute = Math.max(livePlayback.minute, visibleMinute);
    livePlayback.visibleStats = matchStatsAtMinute(match2dState.presentation.stats, visibleMinute);
    if (visibleMinute + 0.02 < finalMinute) {
      match2dState.nextAction = timestamp + Math.max(8, 24 / speed);
      return;
    }
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

function isPenaltyGoalEvent(event) {
  return event?.goalType === "penalty"
    || event?.metadata?.goalType === "penalty"
    || ["penalty", "penalty-kick"].includes(event?.type);
}

function goalMinuteText(event) {
  return `${event.minute}'${isPenaltyGoalEvent(event) ? " (P)" : ""}`;
}

function isVisibleMatchFactEvent(event) {
  return ["goal", "red", "injury"].includes(event?.type);
}

function timelineEventMarkup(event, away = false, animate = false) {
  if (!isVisibleMatchFactEvent(event)) return "";
  const marker = event.type === "red" ? "<i></i>" : "";
  const minute = event.type === "goal" ? goalMinuteText(event) : `${event.minute}'`;
  const label = event.type === "injury"
    ? `${event.player || event.metadata?.scorer} injured`
    : event.player || event.metadata?.scorer;
  return `
    <div class="event timeline-event ${event.type}-event ${animate ? "event-enter" : ""}">
      ${away
    ? `<b>${minute}</b><span>${escapeHtml(label)}</span>${marker}`
    : `${marker}<span>${escapeHtml(label)}</span><b>${minute}</b>`}
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
    .filter(isVisibleMatchFactEvent)
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
  if (!isVisibleMatchFactEvent(event)) return;
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
  if (["red", "injury"].includes(event.type)) {
    applyRetroLivePlayerAbsence(selectedMatch(), {
      ...event,
      player: event.player || event.metadata?.scorer,
    });
  }
  livePlayback.feed.unshift(event);
  els.homeScore.textContent = livePlayback.homeScore;
  els.awayScore.textContent = livePlayback.awayScore;
  els.homeDiscipline.innerHTML = disciplineMarkup(livePlayback.homeReds);
  els.awayDiscipline.innerHTML = disciplineMarkup(livePlayback.awayReds);
  appendLiveTimelineEvent(event, animate);
  saveLiveMatchCheckpoint();
  if (state?.uclSeason && event.type === "goal") {
    window.UclSeason?.renderEngineTable?.();
  } else if (state?.premierLeagueSeason && event.type === "goal") {
    window.PremierLeagueSeason?.renderEngineTable?.();
  }
  if (isRetroSimulatorState() && retroGroupStageDisplayActive()) {
    renderGoldenBoot();
  }
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
    {
      home: shootoutUnavailablePlayers(match.result, "home"),
      away: shootoutUnavailablePlayers(match.result, "away"),
    },
  );
}

function repairSavedShootoutSequence(match) {
  const sequence = match?.result?.shootout;
  if (!Array.isArray(sequence) || !sequence.length) return;
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const cards = match.result.redCards || [];
  const suspendedPlayers = {
    home: shootoutUnavailablePlayers(match.result, "home"),
    away: shootoutUnavailablePlayers(match.result, "away"),
  };
  const validTakers = {
    home: new Set(shootoutTakerPool(
      home,
      suspendedPlayers.home || [],
      cards.filter((card) => card.side === "home").map((card) => card.player),
    )),
    away: new Set(shootoutTakerPool(
      away,
      suspendedPlayers.away || [],
      cards.filter((card) => card.side === "away").map((card) => card.player),
    )),
  };
  if (sequence.some((attempt) => !validTakers[attempt.side]?.has(attempt.player))) {
    const random = mulberry32(state.drawSeed + stableHash(`${match.id}-shootout`));
    match.result.shootout = createShootoutSequence(
      home,
      away,
      match.result.penalties,
      random,
      cards,
      suspendedPlayers,
    );
    return;
  }
  let repaired = false;
  sequence.forEach((attempt) => {
    if (
      attempt?.scored === false
      && attempt.missType !== "wide"
      && attempt.direction === "centre"
      && attempt.keeperDive !== "centre"
    ) {
      attempt.scored = true;
      attempt.missType = null;
      repaired = true;
    }
  });
  if (!repaired) return;

  let homeScore = 0;
  let awayScore = 0;
  let homeKicks = 0;
  let awayKicks = 0;
  let winnerSide = null;
  let finalIndex = sequence.length - 1;
  sequence.some((attempt, index) => {
    if (attempt.side === "home") {
      homeKicks += 1;
      if (attempt.scored) homeScore += 1;
    } else {
      awayKicks += 1;
      if (attempt.scored) awayScore += 1;
    }
    winnerSide = standardShootoutWinner({ homeScore, awayScore, homeKicks, awayKicks });
    if (!winnerSide) return false;
    finalIndex = index;
    return true;
  });
  match.result.shootout = sequence.slice(0, finalIndex + 1);
  match.result.penalties = { home: homeScore, away: awayScore };
  if (winnerSide) {
    match.result.winnerId = winnerSide === "home" ? match.homeId : match.awayId;
  }
}

function penaltyDirectionCopy(direction) {
  if (direction === "wide-left") return "towards the left post";
  if (direction === "wide-right") return "towards the right post";
  return direction === "centre" ? "down the middle" : `to the ${direction}`;
}

function penaltyDirectionTarget(direction, random) {
  if (direction === "left") return random() < 0.5 ? "bottom-left" : "top-left";
  if (direction === "right") return random() < 0.5 ? "bottom-right" : "top-right";
  if (direction === "wide-left" || direction === "wide-right") return direction;
  return "middle";
}

function normalizePenaltyAttemptVisual(attempt) {
  if (!attempt) return attempt;
  const saved = attempt.scored === false && attempt.missType !== "wide";
  if (saved) {
    attempt.keeperDive = attempt.direction;
  } else if (attempt.scored && !attempt.preserveKeeperDive) {
    attempt.keeperDive = distinctKeeperDiveForGoal(
      attempt.direction,
      attempt.keeperDive,
      attempt.round || 0,
    );
  }

  if (String(attempt.direction || "").startsWith("wide")) {
    attempt.target = attempt.direction;
  } else if (typeof attempt.scored === "boolean") {
    const targetDirection = STANDARD_PENALTY_TARGETS.includes(attempt.target)
      ? onlinePenaltyDirection(attempt.target)
      : null;
    if (!targetDirection || targetDirection !== attempt.direction) {
      attempt.target = penaltyDirectionTarget(attempt.direction || "centre", () => 0);
    }
  }
  return attempt;
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
  normalizePenaltyAttemptVisual(attempt);
  scene.dataset.target = attempt.target || "middle";
  scene.dataset.keeperTarget = attempt.goalkeeperTarget || attempt.keeperDive || "centre";
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
  if (attempt.interactionRole === "keeper") resolveKeeperPenaltyAttempt(attempt, target);
  else resolveManualPenaltyAttempt(attempt, target);
  renderPenaltyStage();
  schedulePenaltyStep(120);
}

function resolveManualPenaltyAttempt(attempt, target) {
  const goalkeeperMatched = attempt.goalkeeperTarget === target;
  const goalChance = manualPenaltyGoalChance(attempt.conversionChance, goalkeeperMatched);
  attempt.target = target;
  attempt.direction = onlinePenaltyDirection(target);
  attempt.keeperDive = onlinePenaltyDirection(attempt.goalkeeperTarget);
  attempt.scored = attempt.outcomeRoll < goalChance;
  attempt.missType = attempt.scored ? null : "save";
  attempt.keeperDive = attempt.scored
    ? distinctKeeperDiveForGoal(attempt.direction, attempt.keeperDive, attempt.round || 0)
    : attempt.direction;
  return attempt;
}

function manualPenaltyGoalChance(conversionChance, goalkeeperMatched) {
  return goalkeeperMatched
    ? 0
    : 1;
}

function keeperPenaltyGoalChance(conversionChance, goalkeeperMatched) {
  if (goalkeeperMatched) return 0;
  const baseChance = Number.isFinite(Number(conversionChance))
    ? Number(conversionChance)
    : 0.745;
  return simulationClamp(baseChance / 0.8, 0.72, 0.985);
}

function resolveKeeperPenaltyAttempt(attempt, goalkeeperTarget) {
  const shotTarget = STANDARD_PENALTY_TARGETS.includes(attempt.shotTarget)
    ? attempt.shotTarget
    : "middle";
  const goalkeeperMatched = goalkeeperTarget === shotTarget;
  const goalChance = keeperPenaltyGoalChance(attempt.conversionChance, goalkeeperMatched);
  const outcomeRoll = Number.isFinite(Number(attempt.outcomeRoll))
    ? Number(attempt.outcomeRoll)
    : 0;
  attempt.target = shotTarget;
  attempt.direction = onlinePenaltyDirection(shotTarget);
  attempt.goalkeeperTarget = goalkeeperTarget;
  attempt.keeperDive = onlinePenaltyDirection(goalkeeperTarget);
  attempt.scored = outcomeRoll < goalChance;
  attempt.missType = attempt.scored ? null : goalkeeperMatched ? "save" : "wide";
  if (attempt.missType === "wide") {
    attempt.direction = `wide-${outcomeRoll * 1000 % 2 < 1 ? "left" : "right"}`;
    attempt.target = attempt.direction;
  }
  attempt.preserveKeeperDive = true;
  return attempt;
}

function shootoutRoundConversionChance(conversionChance, round) {
  const suddenDeathRounds = Math.max(0, Number(round || 1) - 5);
  const fatiguePenalty = Math.min(0.16, suddenDeathRounds * 0.015);
  return Math.max(0.58, Number(conversionChance || 0.74) - fatiguePenalty);
}

function clearMatchPenaltyAnimation() {
  if (!livePlayback?.matchPenaltyTimers) return;
  livePlayback.matchPenaltyTimers.forEach((timer) => clearTimeout(timer));
  livePlayback.matchPenaltyTimers = [];
  livePlayback.matchPenaltyActive = false;
  livePlayback.matchPenaltyContext = null;
  els.matchPenaltyOverlay.hidden = true;
  els.matchPenaltyOverlay.classList.remove("is-awaiting-choice", "is-keeper-choice");
  els.matchStage.classList.remove("has-match-penalty");
}

function matchPenaltyAttempt(event, interactionRole = null) {
  const savedDecision = selectedMatch()?.result?.interactivePenaltyDecisions?.[event.id];
  if (savedDecision && savedDecision.interactionRole === interactionRole) {
    return { ...savedDecision };
  }
  const team = teamById(event.teamId);
  const opponent = teamById(event.side === "home" ? selectedMatch().awayId : selectedMatch().homeId);
  const random = mulberry32(state.drawSeed + stableHash(`${livePlayback.matchId}-${event.side}-${event.minute}-${event.player}-match-penalty`));
  if (interactionRole === "taker") {
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
      interactionRole,
      foot: preferredPenaltyFoot(team, event.player, random),
    };
  }
  if (interactionRole === "keeper") {
    const shotTarget = STANDARD_PENALTY_TARGETS[Math.floor(random() * STANDARD_PENALTY_TARGETS.length)];
    return {
      player: event.player,
      side: event.side,
      scored: null,
      direction: "centre",
      keeperDive: "centre",
      goalkeeperTarget: null,
      shotTarget,
      conversionChance: shootoutConversionChance(team, opponent, state.settings.upset),
      outcomeRoll: random(),
      target: null,
      interactive: true,
      interactionRole,
      foot: preferredPenaltyFoot(team, event.player, random),
    };
  }
  const directions = ["left", "centre", "right"];
  const conversionChance = shootoutConversionChance(team, opponent, state.settings.upset);
  const scored = random() < conversionChance;
  let direction = directions[Math.floor(random() * directions.length)];
  let keeperDive = directions[Math.floor(random() * directions.length)];
  let missType = null;
  if (scored) {
    keeperDive = distinctKeeperDiveForGoal(direction, keeperDive, event.minute);
  } else {
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
    target: penaltyDirectionTarget(direction, random),
    foot: preferredPenaltyFoot(team, event.player, random),
  };
}

function saveInteractivePenaltyDecision(event, attempt) {
  const match = selectedMatch();
  if (!match?.result || !event?.id || !attempt?.interactionRole || !attempt.target) return;
  match.result.interactivePenaltyDecisions ||= {};
  match.result.interactivePenaltyDecisions[event.id] = {
    player: attempt.player,
    side: attempt.side,
    scored: attempt.scored,
    direction: attempt.direction,
    keeperDive: attempt.keeperDive,
    goalkeeperTarget: attempt.goalkeeperTarget || null,
    shotTarget: attempt.shotTarget || null,
    conversionChance: attempt.conversionChance,
    outcomeRoll: attempt.outcomeRoll,
    target: attempt.target,
    interactive: true,
    interactionRole: attempt.interactionRole,
    missType: attempt.missType || null,
    preserveKeeperDive: Boolean(attempt.preserveKeeperDive),
    foot: attempt.foot,
  };
}

function removeSavedPenaltyGoal(event) {
  const match = selectedMatch();
  if (!match?.result || !["home", "away"].includes(event.side)) return false;
  const eventsKey = event.side === "home" ? "homeEvents" : "awayEvents";
  const goalsKey = event.side === "home" ? "homeGoals" : "awayGoals";
  const regulationKey = event.side === "home" ? "regulationHome" : "regulationAway";
  const storedEvents = match.result[eventsKey] || [];
  const storedIndex = storedEvents.findIndex((stored) => (
    stored.minute === event.minute
    && stored.scorer === event.player
    && stored.goalType === "penalty"
  ));
  if (storedIndex < 0) return false;
  storedEvents.splice(storedIndex, 1);
  match.result[goalsKey] = Math.max(0, match.result[goalsKey] - 1);
  if (event.minute <= 90) {
    match.result[regulationKey] = Math.max(0, match.result[regulationKey] - 1);
  }
  match.result.winnerId = match.result.homeGoals === match.result.awayGoals
    ? null
    : match.result.homeGoals > match.result.awayGoals ? match.homeId : match.awayId;
  if (livePlayback) {
    livePlayback.penaltyScoreCorrections ||= { home: 0, away: 0 };
    livePlayback.penaltyScoreCorrections[event.side] += 1;
  }
  if (event.minute <= 90) reconcileInteractiveMatchBoundary(match, livePlayback);
  return true;
}

function matchPenaltyResultPublisher(playback, event, attempt, action) {
  if (attempt.scored) return () => receivePresentationAction(action, true);
  removeSavedPenaltyGoal(event);
  const score = { home: playback.homeScore, away: playback.awayScore };
  const missedEvent = MatchPresentation.createEvent({
    ...event,
    id: `${event.id}:miss`,
    type: "penalty-miss",
    importance: "major",
    scoreBefore: score,
    scoreAfter: score,
    metadata: {
      ...event.metadata,
      scorer: event.player,
      goalType: "penalty",
      scored: false,
      scoreCorrected: true,
    },
  });
  const commentary = attempt.missType === "wide"
    ? `${event.player} sends the penalty wide.`
    : `${event.player}'s penalty is saved.`;
  return () => receivePresentationEvent(missedEvent, commentary, true);
}

function controlledMatchPenaltyRole(event) {
  if (!state.spectateTeamId) return null;
  const match = selectedMatch();
  if (![match?.homeId, match?.awayId].includes(state.spectateTeamId)) return null;
  return event.teamId === state.spectateTeamId ? "taker" : "keeper";
}

function isControlledMatchPenalty(event) {
  return Boolean(controlledMatchPenaltyRole(event));
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
    els.matchPenaltyOverlay.classList.remove("is-awaiting-choice", "is-keeper-choice");
    els.matchStage.classList.remove("has-match-penalty");
    if (typeof onDismiss === "function") onDismiss();
  }, resultAt + delay(1300)));
}

function matchPenaltySceneTarget(attempt, interactive) {
  return attempt?.target || (interactive ? "middle" : penaltyDirectionTarget(attempt?.direction || "centre", () => 0));
}

function chooseMatchPenaltyTarget(target) {
  const context = livePlayback?.matchPenaltyContext;
  if (!context || !STANDARD_PENALTY_TARGETS.includes(target)) return;
  const { playback, event, attempt, action } = context;
  if (livePlayback !== playback || !attempt.interactive || attempt.target) return;
  if (attempt.interactionRole === "keeper") resolveKeeperPenaltyAttempt(attempt, target);
  else resolveManualPenaltyAttempt(attempt, target);
  saveInteractivePenaltyDecision(event, attempt);
  const publishResult = matchPenaltyResultPublisher(playback, event, attempt, action);
  els.matchPenaltyScene.dataset.target = target;
  els.matchPenaltyPlayer.textContent = attempt.interactionRole === "keeper"
    ? `${event.player} takes the penalty`
    : `${event.player} shoots`;
  els.matchPenaltyOverlay.classList.remove("is-awaiting-choice");
  playback.matchPenaltyContext = null;
  saveState();
  saveLiveMatchCheckpoint();
  finishMatchPenaltyAnimation(playback, event, attempt, 120, publishResult);
}

function startMatchPenaltyAnimation(event, action) {
  if (!livePlayback || livePlayback.matchPenaltyActive) return;
  const playback = livePlayback;
  const interactionRole = controlledMatchPenaltyRole(event);
  const interactive = Boolean(interactionRole);
  const attempt = matchPenaltyAttempt(event, interactionRole);
  const decisionLocked = interactive && Boolean(attempt.target);
  const awaitingChoice = interactive && !decisionLocked;
  const motionScale = playback.reducedMotion ? 0.15 : 1;
  const delay = (duration) => Math.max(40, duration * motionScale);
  const whistleLeadIn = 1050;
  const setupHold = 1650;
  playback.matchPenaltyActive = true;
  playback.matchPenaltyTimers = [];
  playback.matchPenaltyContext = awaitingChoice ? { playback, event, attempt, action } : null;
  els.matchPenaltyPlayer.textContent = awaitingChoice
    ? interactionRole === "keeper"
      ? `${event.player}: choose where to dive`
      : `${event.player}: choose your target`
    : `${event.player} steps up`;
  if (els.matchPenaltyTitle) {
    els.matchPenaltyTitle.textContent = interactionRole === "keeper" ? "MAKE THE SAVE" : "PENALTY";
  }
  playWhistleSound();

  playback.matchPenaltyTimers.push(setTimeout(() => {
    if (livePlayback !== playback) return;
    els.matchPenaltyOverlay.hidden = false;
    els.matchPenaltyOverlay.classList.toggle("is-awaiting-choice", awaitingChoice);
    els.matchPenaltyOverlay.classList.toggle("is-keeper-choice", interactionRole === "keeper");
    els.matchPenaltyOverlay.querySelector(".match-penalty-targets")
      ?.setAttribute("aria-label", interactionRole === "keeper" ? "Choose where to dive" : "Choose where to shoot");
    els.matchStage.classList.add("has-match-penalty");
    els.matchPenaltyScene.dataset.target = matchPenaltySceneTarget(attempt, awaitingChoice);
    setPenaltySceneElement(els.matchPenaltyScene, attempt, "setup");
  }, whistleLeadIn));

  if (!awaitingChoice) {
    const publishResult = matchPenaltyResultPublisher(playback, event, attempt, action);
    finishMatchPenaltyAnimation(
      playback,
      event,
      attempt,
      whistleLeadIn + setupHold,
      publishResult,
    );
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
  const keeperView = Boolean(attempt?.interactive && attempt.interactionRole === "keeper" && step !== "complete");
  const keeperChoice = awaitingChoice && keeperView;
  const motionScale = livePlayback.reducedMotion ? 0.02 : 1 / livePlayback.speed;

  els.penaltyStage.classList.toggle("is-awaiting-choice", awaitingChoice);
  els.penaltyStage.classList.toggle("is-keeper-choice", keeperView);
  els.penaltyStage.querySelector(".standard-penalty-targets")
    ?.setAttribute("aria-label", keeperChoice ? "Choose where to dive" : "Choose where to shoot");
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
    saveLiveMatchCheckpoint();
    return;
  }

  els.penaltyPlayer.textContent = attempt.player;
  els.penaltyOutcome.textContent = "";
  setPenaltyScene(attempt, step);
  saveLiveMatchCheckpoint();
}

function schedulePenaltyStep(duration) {
  if (!livePlayback || livePlayback.paused || livePlayback.phase !== "shootout") return;
  clearTimeout(livePlayback.penaltyTimer);
  livePlayback.penaltyTimer = setTimeout(advancePenaltyShootout, penaltyStepDelay(duration));
}

function finishPenaltyShootout(delay = 1250) {
  if (!livePlayback) return;
  livePlayback.shootoutStep = "complete";
  livePlayback.ending = true;
  playFullTimeWhistleOnce();
  renderPenaltyStage();
  livePlayback.finishTimer = setTimeout(finishLivePlayback, penaltyStepDelay(delay));
}

function isDefault256KnockoutState(candidate = state) {
  return Boolean(
    candidate?.started
    && !candidate.retroWorldCup
    && !candidate.customTournament
    && !candidate.legacyTournament
    && candidate.rounds?.[0]?.length === 128
  );
}

function canSkipPenaltyShootout() {
  return Boolean(
    livePlayback
    && livePlayback.phase === "shootout"
    && !livePlayback.ending,
  );
}

function completedShootoutPrefix(playback) {
  if (!playback?.shootout?.length) return [];
  const currentAttempt = playback.shootout[playback.shootoutIndex];
  const includeCurrent = ["result", "complete"].includes(playback.shootoutStep)
    || (
      playback.shootoutStep === "flight"
      && typeof currentAttempt?.scored === "boolean"
    );
  const completedCount = Math.min(
    playback.shootout.length,
    Math.max(0, playback.shootoutIndex + Number(includeCurrent)),
  );
  return playback.shootout
    .slice(0, completedCount)
    .filter((attempt) => typeof attempt?.scored === "boolean")
    .map((attempt) => ({ ...attempt, interactive: false }));
}

function simulatePenaltyShootoutContinuation(
  home,
  away,
  random,
  completedAttempts,
  cards = [],
  suspendedPlayers = { home: [], away: [] },
  modeName = "balanced",
) {
  const dismissed = {
    home: cards.filter((card) => card.side === "home").map((card) => card.player),
    away: cards.filter((card) => card.side === "away").map((card) => card.player),
  };
  const pools = {
    home: shootoutTakerPool(home, suspendedPlayers.home || [], dismissed.home),
    away: shootoutTakerPool(away, suspendedPlayers.away || [], dismissed.away),
  };
  const conversion = {
    home: shootoutConversionChance(home, away, modeName),
    away: shootoutConversionChance(away, home, modeName),
  };
  const sequence = completedAttempts.map((attempt) => ({ ...attempt, interactive: false }));
  const penalties = {
    home: sequence.filter((attempt) => attempt.side === "home" && attempt.scored).length,
    away: sequence.filter((attempt) => attempt.side === "away" && attempt.scored).length,
  };
  const kicks = {
    home: sequence.filter((attempt) => attempt.side === "home").length,
    away: sequence.filter((attempt) => attempt.side === "away").length,
  };

  const shootoutState = () => ({
    homeScore: penalties.home,
    awayScore: penalties.away,
    homeKicks: kicks.home,
    awayKicks: kicks.away,
  });
  const takeKick = (side, forcedOutcome = null) => {
    const team = side === "home" ? home : away;
    const pool = pools[side];
    const round = kicks[side] + 1;
    const player = pool[(round - 1) % pool.length];
    const scored = typeof forcedOutcome === "boolean"
      ? forcedOutcome
      : random() < shootoutRoundConversionChance(conversion[side], round);
    if (scored) penalties[side] += 1;
    kicks[side] += 1;
    sequence.push(createShootoutAttempt(side, team, player, scored, round, random));
  };

  let winnerSide = standardShootoutWinner(shootoutState());
  while (!winnerSide && sequence.length < 120) {
    takeKick(kicks.home <= kicks.away ? "home" : "away");
    winnerSide = standardShootoutWinner(shootoutState());
  }

  if (!winnerSide) {
    while (kicks.home !== kicks.away) {
      takeKick(kicks.home < kicks.away ? "home" : "away");
    }
    const homeFavoured = random() < simulationClamp(
      0.5 + (calculateShootoutRating(home) - calculateShootoutRating(away)) * 0.005,
      0.38,
      0.62,
    );
    takeKick("home", homeFavoured);
    takeKick("away", !homeFavoured);
    winnerSide = homeFavoured ? "home" : "away";
  }

  return { penalties, sequence, winnerSide };
}

function skipPenaltyShootout() {
  if (!canSkipPenaltyShootout()) return false;
  const match = state.rounds[livePlayback.roundIndex]?.[livePlayback.matchIndex];
  if (!match?.result || !livePlayback.shootout.length) return false;

  clearTimeout(livePlayback.penaltyTimer);
  clearTimeout(livePlayback.finishTimer);
  livePlayback.presentationScheduler?.clear("skip-shootout");
  if (livePlayback.interactiveShootout) {
    const completedAttempts = completedShootoutPrefix(livePlayback);
    const random = mulberry32(state.drawSeed + stableHash(`${match.id}-skipped-shootout`));
    const automated = simulatePenaltyShootoutContinuation(
      teamById(match.homeId),
      teamById(match.awayId),
      random,
      completedAttempts,
      match.result.redCards || [],
      {
        home: shootoutUnavailablePlayers(match.result, "home"),
        away: shootoutUnavailablePlayers(match.result, "away"),
      },
      state.settings.upset,
    );
    match.result.penalties = automated.penalties;
    match.result.shootout = automated.sequence;
    match.result.winnerId = automated.winnerSide === "home" ? match.homeId : match.awayId;
    livePlayback.shootout = automated.sequence;
    livePlayback.interactiveShootout = false;
  }
  if (!match.result.penalties || !livePlayback.shootout.length) return false;
  livePlayback.paused = false;
  livePlayback.shootoutIndex = livePlayback.shootout.length - 1;
  livePlayback.penaltyHomeScore = match.result.penalties.home;
  livePlayback.penaltyAwayScore = match.result.penalties.away;
  finishPenaltyShootout(220);
  return true;
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
    schedulePenaltyStep(1500);
    return;
  }

  const shootoutState = completedInteractiveShootoutState(livePlayback);
  const winnerSide = standardShootoutWinner(shootoutState);
  if (winnerSide) {
    if (livePlayback.interactiveShootout) finalizeInteractiveShootout(winnerSide);
    finishPenaltyShootout();
    return;
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

function startPenaltyShootout(resumeCheckpoint = null) {
  if (!livePlayback) return;
  const match = state.rounds[livePlayback.roundIndex]?.[livePlayback.matchIndex];
  if (resumeCheckpoint?.shootout?.length) {
    match.result.shootout = resumeCheckpoint.shootout;
  }
  ensureShootoutSequence(match);
  repairSavedShootoutSequence(match);
  const controlledSide = controlledStandardShootoutSide(match);
  if (controlledSide && !resumeCheckpoint) {
    match.result.shootout = createInteractiveShootoutSequence(match, controlledSide);
  }
  livePlayback.phase = "shootout";
  livePlayback.speed = 1;
  livePlayback.shootout = match.result.shootout;
  livePlayback.interactiveShootout = Boolean(controlledSide);
  livePlayback.controlledShootoutSide = controlledSide;
  livePlayback.shootoutIndex = Math.min(
    Number(resumeCheckpoint?.shootoutIndex) || 0,
    Math.max(0, livePlayback.shootout.length - 1),
  );
  livePlayback.shootoutStep = resumeCheckpoint?.shootoutStep || "setup";
  livePlayback.penaltyHomeScore = Number(resumeCheckpoint?.penaltyHomeScore) || 0;
  livePlayback.penaltyAwayScore = Number(resumeCheckpoint?.penaltyAwayScore) || 0;
  livePlayback.shootoutCommentary = null;
  livePlayback.lastTimestamp = 0;
  livePlayback.frame = null;
  render();
  saveLiveMatchCheckpoint();
  schedulePenaltyStep(800);
}

function commentaryTeamRating(team) {
  if (!team) return 0;
  return Number(teamSimulationRatings(team)?.overall)
    || Number(team.strength)
    || Number(team.rating)
    || 0;
}

function groupCommentaryContext(match, roundIndex) {
  const isCustomGroup = Number.isInteger(match?.customGroupIndex);
  const isNamedGroup = match?.stage === "group" || Boolean(match?.group);
  if (!isCustomGroup && !isNamedGroup) return null;

  const groupMatches = state.rounds.flat().filter((candidate) => {
    if (isCustomGroup) return candidate.customGroupIndex === match.customGroupIndex;
    return (candidate.stage === "group" || candidate.allowDraw) && candidate.group === match.group;
  });
  const teamIds = [...new Set(groupMatches.flatMap((candidate) => [candidate.homeId, candidate.awayId]))];
  const rows = new Map(teamIds.map((teamId) => [teamId, {
    teamId,
    played: 0,
    gf: 0,
    ga: 0,
    points: 0,
  }]));
  groupMatches.forEach((candidate) => {
    if (!candidate.result?.revealed) return;
    const home = rows.get(candidate.homeId);
    const away = rows.get(candidate.awayId);
    if (!home || !away) return;
    const homeGoals = Number(candidate.result.homeGoals) || 0;
    const awayGoals = Number(candidate.result.awayGoals) || 0;
    home.played += 1;
    away.played += 1;
    home.gf += homeGoals;
    home.ga += awayGoals;
    away.gf += awayGoals;
    away.ga += homeGoals;
    if (homeGoals > awayGoals) home.points += 3;
    else if (awayGoals > homeGoals) away.points += 3;
    else {
      home.points += 1;
      away.points += 1;
    }
  });
  const table = [...rows.values()]
    .map((row) => ({ ...row, gd: row.gf - row.ga }))
    .sort((left, right) => (
      right.points - left.points
      || right.gd - left.gd
      || right.gf - left.gf
      || commentaryTeamRating(teamById(right.teamId)) - commentaryTeamRating(teamById(left.teamId))
    ));
  const rawLabel = isCustomGroup ? match.customGroupLabel : match.group;
  const groupLabel = String(rawLabel || "").toLowerCase().startsWith("group")
    ? String(rawLabel)
    : `Group ${rawLabel || ""}`.trim();
  return {
    groupLabel,
    matchday: Number(match.matchday) || (isCustomGroup ? customGroupMatchday(match) + 1 : Number(roundIndex) + 1),
    table,
    complete: groupMatches.length > 0 && groupMatches.every((candidate) => candidate.result?.revealed),
  };
}

function groupResultCommentary(match, winner, loser, roundIndex) {
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const context = groupCommentaryContext(match, roundIndex);
  if (!context) return null;

  const homePosition = context.table.findIndex((row) => row.teamId === match.homeId) + 1;
  const awayPosition = context.table.findIndex((row) => row.teamId === match.awayId) + 1;
  const upset = winner && loser
    ? commentaryTeamRating(loser) - commentaryTeamRating(winner) >= 7
    : false;

  if (!winner) {
    if (context.matchday <= 1) {
      return `${home.name} and ${away.name} share the points; ${context.groupLabel} starts wide open.`;
    }
    if (context.matchday >= 3 && context.complete) {
      if (homePosition <= 2 && awayPosition <= 2) {
        return `${home.name} and ${away.name} both book their places in the knockouts.`;
      }
      if (homePosition <= 2 || awayPosition <= 2) {
        const qualifier = homePosition <= 2 ? home : away;
        return `The points are shared, and ${qualifier.name} secure a knockout place.`;
      }
      return `${home.name} and ${away.name} share the points as ${context.groupLabel} is decided.`;
    }
    if (context.matchday >= 3) {
      return `${home.name} and ${away.name} share the points, leaving qualification in the balance.`;
    }
    return `${home.name} and ${away.name} share the points; everything remains to play for in ${context.groupLabel}.`;
  }

  const winnerPosition = context.table.findIndex((row) => row.teamId === winner.id) + 1;
  if (context.matchday <= 1) {
    return upset
      ? `Statement win! ${winner.name} upset ${loser.name} to make the perfect start in ${context.groupLabel}.`
      : `${winner.name} open ${context.groupLabel} with three points.`;
  }
  if (context.matchday === 2) {
    if (winnerPosition <= 2) {
      return upset
        ? `${winner.name} shake up ${context.groupLabel} and move into the qualifying places.`
        : `${winner.name} take control of their qualification push in ${context.groupLabel}.`;
    }
    return `${winner.name} keep their qualification hopes alive with a vital win.`;
  }
  if (context.complete && winnerPosition <= 2) {
    return `${winner.name} seal a place in the knockouts with victory over ${loser.name}.`;
  }
  if (context.complete) {
    return `${winner.name} finish the group stage with a win over ${loser.name}.`;
  }
  return upset
    ? `${winner.name} turn ${context.groupLabel} on its head, with qualification still to be settled.`
    : `${winner.name} take a crucial win as qualification goes down to the wire.`;
}

function matchResultCommentary(match, roundIndex = state.activeRound) {
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const winner = match.result?.winnerId
    ? teamById(match.result.winnerId)
    : Number(match.result?.homeGoals) > Number(match.result?.awayGoals)
      ? home
      : Number(match.result?.awayGoals) > Number(match.result?.homeGoals) ? away : null;
  const loser = winner ? (winner.id === match.homeId ? away : home) : null;

  if (state?.premierLeagueSeason) {
    return window.PremierLeagueSeason?.resultCommentary?.(match, roundIndex)
      || (winner ? `${winner.name} take all three points.` : `${home.name} and ${away.name} share the points.`);
  }

  const groupCopy = groupResultCommentary(match, winner, loser, roundIndex);
  if (groupCopy) return groupCopy;
  if (!winner) return `${home.name} and ${away.name} share the points.`;
  if (roundIndex >= tournamentFinalRoundIndex() && !isThirdPlacePlayoff(match)) {
    return `${winner.name} are champions!`;
  }
  const isShock = commentaryTeamRating(loser) - commentaryTeamRating(winner) >= 7;
  return isShock
    ? `Huge upset — ${winner.name} knock out ${loser.name}!`
    : `${winner.name} advance.`;
}

function finishLivePlayback() {
  if (!livePlayback) return;
  playFullTimeWhistleOnce();
  const completed = livePlayback;
  const match = state.rounds[completed.roundIndex]?.[completed.matchIndex];
  if (!match?.result) {
    clearLiveMatchCheckpoint(completed.matchId);
    livePlayback = null;
    return;
  }

  clearMatchPenaltyAnimation();
  completed.presentationScheduler?.clear("match-finished");
  cancelAnimationFrame(completed.frame);
  clearTimeout(completed.finishTimer);
  clearTimeout(completed.penaltyTimer);
  if (match2dState?.eventTimer) clearTimeout(match2dState.eventTimer);
  finalizeAndStoreLivePlayerRatings(match);
  const finalManagement = [completed.managerSubstitutions, completed.oppositionManagement]
    .filter(Boolean)
    .map((management) => [management.teamId, {
      formation: management.formation,
      activeStarters: [...management.activeStarters],
      slotOrderVersion: RETRO_LINEUP_SLOT_ORDER_VERSION,
      subbedOut: [...management.subbedOut],
      unavailableNumbers: [...(management.unavailableNumbers || [])],
      missingSlots: { ...(management.missingSlots || {}) },
      used: management.used,
    }]);
  if (finalManagement.length) match.result.retroFinalManagement = Object.fromEntries(finalManagement);
  match2dState = null;
  match.result.revealed = true;
  const resultToast = matchResultCommentary(match, completed.roundIndex);
  clearLiveMatchCheckpoint(match.id);
  livePlayback = null;
  buildNextRound(completed.roundIndex);
  saveState();
  render();
  showToast(resultToast);
}

function syncPossessionResultStats(result) {
  if (!match2dState?.presentation) return;
  result.matchStats = match2dState.presentation.stats;
  window.__lastMatchHighlightStats = result.matchStats;
}

function reconcileInteractiveMatchBoundary(match, playback) {
  const result = match.result;
  result.regulationHome = (result.homeEvents || []).filter((event) => event.minute <= 90).length;
  result.regulationAway = (result.awayEvents || []).filter((event) => event.minute <= 90).length;
  const extraTime = retroMatchAllowsExtraTime(match) && decidingMatchIsLevel(match, result.regulationHome, result.regulationAway);
  result.extraTime = extraTime;
  if (!extraTime) {
    result.homeEvents = (result.homeEvents || []).filter((event) => event.minute <= 90);
    result.awayEvents = (result.awayEvents || []).filter((event) => event.minute <= 90);
    result.homeGoals = result.regulationHome;
    result.awayGoals = result.regulationAway;
    result.penalties = null;
    result.shootout = null;
    result.winnerId = match.allowDraw
      ? result.homeGoals === result.awayGoals
        ? null
        : result.homeGoals > result.awayGoals ? match.homeId : match.awayId
      : decidingMatchWinnerId(match, result.homeGoals, result.awayGoals);
  }
  if (playback) playback.maxMinute = extraTime ? 120 : 90;
  return extraTime;
}

function resolveInteractiveRegulation(match, playback) {
  const result = match.result;
  syncPossessionResultStats(result);
  reconcileInteractiveMatchBoundary(match, playback);
}

function resolveInteractiveExtraTime(match, playback) {
  const result = match.result;
  syncPossessionResultStats(result);
  result.homeGoals = (result.homeEvents || []).length;
  result.awayGoals = (result.awayEvents || []).length;
  result.regulationHome = (result.homeEvents || []).filter((event) => event.minute <= 90).length;
 result.regulationAway = (result.awayEvents || []).filter((event) => event.minute <= 90).length;
  const runInteractiveShootout = () => {
    if (result.penalties && result.shootout?.length) return;
    const random = mulberry32(state.drawSeed + stableHash(`${match.id}-interactive-shootout-result`));
    const penaltyResult = simulatePenaltyShootout(
      teamById(match.homeId),
      teamById(match.awayId),
      random,
      result.redCards || [],
      {
        home: shootoutUnavailablePlayers(result, "home"),
        away: shootoutUnavailablePlayers(result, "away"),
      },
      state.settings.upset,
    );
    result.penalties = penaltyResult.penalties;
    result.shootout = penaltyResult.sequence;
    result.winnerId = result.penalties.home > result.penalties.away ? match.homeId : match.awayId;
  };
 if (match.allowDraw) {
    result.homeEvents = (result.homeEvents || []).filter((event) => event.minute <= 90);
    result.awayEvents = (result.awayEvents || []).filter((event) => event.minute <= 90);
    result.homeGoals = result.regulationHome;
    result.awayGoals = result.regulationAway;
    result.extraTime = false;
    result.penalties = null;
    result.shootout = null;
    result.winnerId = result.homeGoals === result.awayGoals
      ? null
      : result.homeGoals > result.awayGoals ? match.homeId : match.awayId;
    return;
  }
  const canExtraTime = retroMatchAllowsExtraTime(match);
  const regulationIsLevel = decidingMatchIsLevel(match, result.regulationHome, result.regulationAway);
  if (!canExtraTime || !regulationIsLevel) {
   result.homeEvents = (result.homeEvents || []).filter((event) => event.minute <= 90);
   result.awayEvents = (result.awayEvents || []).filter((event) => event.minute <= 90);
   result.homeGoals = result.regulationHome;
   result.awayGoals = result.regulationAway;
   result.extraTime = false;
    result.penalties = null;
    result.shootout = null;
    if (!canExtraTime && regulationIsLevel) runInteractiveShootout();
    else result.winnerId = decidingMatchWinnerId(match, result.homeGoals, result.awayGoals);
   return;
 }
  result.extraTime = true;
  if (!decidingMatchIsLevel(match, result.homeGoals, result.awayGoals)) {
    result.penalties = null;
    result.shootout = null;
    result.winnerId = decidingMatchWinnerId(match, result.homeGoals, result.awayGoals);
    return;
  }
  runInteractiveShootout();
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
    updateRetroOppositionManagement(selectedMatch());
    const displayedClock = clockText(displayedMinute);
    if (displayedClock !== livePlayback.lastClockText) {
      els.liveClock.textContent = displayedClock;
      els.livePhase.textContent = phaseForMinute(displayedMinute, selectedMatch().result);
      livePlayback.lastClockText = displayedClock;
      saveLiveMatchCheckpoint();
    }
    if (match2dState?.complete) {
      const match = selectedMatch();
      finalizeHighlightResult(match, livePlayback);
      finalizeAndStoreLivePlayerRatings(match);
      renderRetroMatchLineupsPanel(match);
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
  retroLiveSubOutNumber = null;
  retroLiveSubInNumber = null;
  retroLivePendingSubstitution = null;
  retroLiveSubDrag = null;
  if (livePlayback) {
    cancelAnimationFrame(livePlayback.frame);
    clearTimeout(livePlayback.finishTimer);
    clearTimeout(livePlayback.penaltyTimer);
    livePlayback.matchPenaltyTimers?.forEach((timer) => clearTimeout(timer));
    livePlayback.presentationScheduler?.clear("new-match");
    livePlayback.commentaryFeed = [];
  }
  if (match2dState?.eventTimer) clearTimeout(match2dState.eventTimer);
  match2dState = null;
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
  let resumeCheckpoint = match.result && !match.result.revealed
    ? readLiveMatchCheckpoint(match)
    : null;
  if (!match.result || match.result.engineVersion !== 2 || match.result.revealed) {
    clearLiveMatchCheckpoint(match.id);
    match.result = createLiveMatchResult(match, state.activeRound);
    resumeCheckpoint = null;
    saveState();
  }
  const resumeMinute = simulationClamp(Number(resumeCheckpoint?.displayedMinute) || 0, 0, match.result.extraTime ? 120 : 90);
  livePlayback = {
    matchId: match.id,
    roundIndex: state.activeRound,
    matchIndex: state.selectedMatch,
    minute: Number(resumeCheckpoint?.minute) || resumeMinute,
    maxMinute: match.result.extraTime ? 120 : 90,
    regulationResolved: false,
    homeScore: Number(resumeCheckpoint?.homeScore) || 0,
    awayScore: Number(resumeCheckpoint?.awayScore) || 0,
    homeReds: resumeCheckpoint?.homeReds || [],
    awayReds: resumeCheckpoint?.awayReds || [],
    eventIndex: 0,
    events: [],
    feed: resumeCheckpoint?.feed || [{ type: "kickoff", minute: 0 }],
    phase: resumeCheckpoint?.phase || "match",
    shootout: [],
    shootoutIndex: 0,
    shootoutStep: "setup",
    penaltyHomeScore: 0,
    penaltyAwayScore: 0,
    speed: Number(resumeCheckpoint?.speed) || preferredMatchSpeed || (reducedMotion ? 1.5 : 1),
    reducedMotion,
    paused: false,
    highlightMode: preferredHighlightMode,
    commentaryFeed: resumeCheckpoint?.commentaryFeed || [{
      minute: 0,
      text: `${teamById(match.homeId).name} get the match under way against ${teamById(match.awayId).name}.`,
      type: "kickoff",
      emphasis: "normal",
      eventId: `${match.id}:kickoff`,
    }],
    _goalFlashTimer: null,
    visibleStats: null,
    lastClockText: "",
    lastTimestamp: 0,
    ending: false,
    fullTimeWhistlePlayed: false,
    frame: null,
    finishTimer: null,
    penaltyTimer: null,
    matchPenaltyActive: false,
    matchPenaltyTimers: [],
    matchPenaltyContext: null,
    penaltyScoreCorrections: resumeCheckpoint?.penaltyScoreCorrections || { home: 0, away: 0 },
    pendingTacticChange: false,
    presentationClock: null,
    presentationScheduler: null,
    _presentationSequence: 0,
  };
  if (sharedLineupManagerSupported()) {
    const managedTeam = [teamById(match.homeId), teamById(match.awayId)]
      .find((team) => sharedLineupManagedTeamMatches(team));
    const managerLineup = retroManagerLineupForTeam(managedTeam);
    if (managedTeam && managerLineup) {
      livePlayback.managerSubstitutions = {
        teamId: managedTeam.id,
        formation: managerLineup.formation,
        activeStarters: [...managerLineup.starters],
        slotOrderVersion: RETRO_LINEUP_SLOT_ORDER_VERSION,
        used: 0,
        stoppages: 0,
        windowOpen: false,
        subbedOut: [],
        unavailableNumbers: [],
        missingSlots: {},
        history: [],
      };
      const opponentTeam = managedTeam.id === match.homeId ? teamById(match.awayId) : teamById(match.homeId);
      const opponentLineup = sharedLineupDefaultForTeam(opponentTeam);
      const opponentFormation = RETRO_MANAGER_FORMATIONS.includes(opponentLineup.formation)
        ? opponentLineup.formation
        : "4-3-3";
      const opponentSquad = retroManagerSquadForTeam(opponentTeam);
      const opponentUnavailable = new Set(unavailablePlayersForTeam(opponentTeam.id, state.activeRound));
      const opponentAvailablePlayers = (opponentSquad?.players || opponentLineup.players)
        .filter((player) => !opponentUnavailable.has(player.name));
      const opponentPreferredNumbers = opponentLineup.players.map((player) => player.number);
      livePlayback.oppositionManagement = {
        teamId: opponentTeam.id,
        formation: opponentFormation,
        activeStarters: retroSelectAvailableStarterNumbers(
          opponentAvailablePlayers,
          opponentPreferredNumbers,
          opponentFormation,
        ),
        slotOrderVersion: RETRO_LINEUP_SLOT_ORDER_VERSION,
        used: 0,
        nextSubIndex: 0,
        subbedOut: [],
        unavailableNumbers: [],
        missingSlots: {},
        history: [],
      };
    }
  }
  if (resumeCheckpoint?.managerSubstitutions) {
    livePlayback.managerSubstitutions = resumeCheckpoint.managerSubstitutions;
  }
  if (resumeCheckpoint?.oppositionManagement) {
    livePlayback.oppositionManagement = resumeCheckpoint.oppositionManagement;
  }
  upgradeRetroLiveManagementSlotOrder(livePlayback.managerSubstitutions);
  upgradeRetroLiveManagementSlotOrder(livePlayback.oppositionManagement);
  repairLiveGoalParticipants(match);
  livePlayback.presentationClock = MatchPresentation.createClock({
    initialMinute: resumeMinute,
    maxMinute: livePlayback.maxMinute,
    speed: livePlayback.speed,
    now: performance.now(),
  });
  livePlayback.presentationScheduler = createLivePresentationScheduler();
  window.__playbackDebug._step = "livePlayback created";
  render();
  window.__playbackDebug._step = "render done";
  if (match.result.penaltiesOnly) {
    els.liveClock.textContent = "PEN";
    els.livePhase.textContent = "PENALTY SHOOTOUT";
    startPenaltyShootout();
    saveState();
    window.__playbackDebug._step = "penalties-only shootout started";
    return;
  }
  match2dState = createMatch2dState(match);
  initializeLivePlayerRatings(match);
  if (resumeCheckpoint && match2dState) {
    if (resumeCheckpoint.playerRatings) livePlayback.playerRatings = resumeCheckpoint.playerRatings;
    livePlayback.ratingEventIds = new Set(resumeCheckpoint.ratingEventIds || []);
    livePlayback.ratingActionIds = new Set(resumeCheckpoint.ratingActionIds || []);
    livePlayback.visibleStats = matchStatsAtMinute(match2dState.presentation.stats, resumeMinute);
    match2dState.cursor = Number.isInteger(resumeCheckpoint.cursor)
      ? resumeCheckpoint.cursor
      : match2dState.presentation.highlights.findLastIndex((highlight) => highlight.minute < resumeMinute);
    match2dState.activeHighlight = resumeCheckpoint.activeHighlightIndex === null
      ? null
      : match2dState.presentation.highlights.find(
          (highlight) => highlight.timelineIndex === resumeCheckpoint.activeHighlightIndex,
        ) || null;
    match2dState.actionIndex = match2dState.activeHighlight
      ? Math.min(
          Number(resumeCheckpoint.actionIndex) || 0,
          match2dState.activeHighlight.actions.length,
        )
      : 0;
    match2dState.playedEventKeys = new Set(resumeCheckpoint.playedEventKeys || []);
    livePlayback.feed
      .filter(isVisibleMatchFactEvent)
      .forEach((event) => match2dState.playedEventKeys.add(match2dEventKey(event)));
    match2dState.nextAction = performance.now() + 180;
    livePlayback.lastClockText = clockText(resumeMinute);
  }
  renderRetroMatchLineupsPanel(match);
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
  if (resumeCheckpoint?.phase === "shootout") {
    startPenaltyShootout(resumeCheckpoint);
    showToast("Penalty shootout resumed.");
    return;
  }
  renderMatchAnalysis(match, true);
  renderLiveTimeline();
  renderCommentaryFeed();
  window.__playbackDebug._step = "renderMatchAnalysis done";
  saveState();
  saveLiveMatchCheckpoint();
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
  if (resumeCheckpoint && resumeMinute > 0) {
    showToast(`Match resumed at ${clockText(resumeMinute)}.`);
  }
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

  if (livePlayback.phase === "shootout") {
    if (skipPenaltyShootout()) return;
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
    ...(match.result.injuries || []),
    ...(match.result.substitutions || []),
  ].sort((left, right) => left.minute - right.minute);
  livePlayback.homeScore = 0;
  livePlayback.awayScore = 0;
  livePlayback.homeReds = [];
  livePlayback.awayReds = [];
  livePlayback.feed = [{ type: "kickoff", minute: 0 }];
  fastForwardLivePlayerRatings();
  events.forEach((event) => {
    applyLiveEvent(event, false);
    updateLiveRatingsForEvent(event, false);
  });
  finalizeHighlightResult(match, livePlayback);
  finalizeAndStoreLivePlayerRatings(match);
  renderRetroMatchLineupsPanel(match);
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
    saveLiveMatchCheckpoint();
    return;
  }

  if (livePlayback.paused) {
    livePlayback.presentationClock?.pause(performance.now());
    cancelAnimationFrame(livePlayback.frame);
    livePlayback.frame = null;
    els.pauseLiveButton.textContent = "Resume";
    saveLiveMatchCheckpoint();
    return;
  }

  if (livePlayback.managerSubstitutions?.windowOpen) {
    livePlayback.managerSubstitutions.windowOpen = false;
    retroLiveSubOutNumber = null;
    retroLiveSubInNumber = null;
    retroLivePendingSubstitution = null;
    renderRetroMatchLineupsPanel(selectedMatch());
  }
  livePlayback.lastTimestamp = 0;
  livePlayback.presentationClock?.resume(performance.now());
  els.pauseLiveButton.textContent = "Pause";
  livePlayback.frame = requestAnimationFrame(stepLivePlayback);
  saveLiveMatchCheckpoint();
}

function playSelected() {
  const match = selectedMatch();
  if (!match) return;
  if (livePlayback) return;
  if (managedDefaultFinalSkipsThirdPlace(match)) {
    const thirdPlaceMatch = tournamentThirdPlaceMatch();
    if (thirdPlaceMatch && !thirdPlaceMatch.result?.revealed) {
      simulateAndRevealMatch(thirdPlaceMatch, tournamentFinalRoundIndex());
      saveState();
    }
  }
  if (finalBlockedByThirdPlace(match)) {
    showToast("Play the third-place play-off before the final.");
    return;
  }
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
  const resultToast = matchResultCommentary(match, state.activeRound);
  buildNextRound(state.activeRound);
  saveState();
  render();
  showToast(resultToast);
}
