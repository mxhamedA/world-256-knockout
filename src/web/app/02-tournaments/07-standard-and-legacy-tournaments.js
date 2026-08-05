function matchSoundsAreEnabled() {
  return matchSoundsEnabled ?? state.settings.sound !== false;
}

function stopActiveMatchSounds() {
  activeMatchSounds.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeMatchSounds.clear();
}

function setMatchSoundsEnabled(enabled) {
  matchSoundsEnabled = Boolean(enabled);
  state.settings.sound = matchSoundsEnabled;
  if (standardTournamentState?.settings) standardTournamentState.settings.sound = matchSoundsEnabled;
  if (retroSimulatorState?.settings) retroSimulatorState.settings.sound = matchSoundsEnabled;
  localStorage.setItem(MATCH_SOUND_STORAGE_KEY, String(matchSoundsEnabled));
  if (!matchSoundsEnabled) stopActiveMatchSounds();
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
  if (!matchSoundsAreEnabled()) return;
  Object.values(MATCH_SOUND_PATHS).forEach((path) => {
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.load();
  });
}

function playWhistleSound() {
  playMatchWhistle(MATCH_SOUND_PATHS.penaltyWhistle, 0.16);
}

function playFullTimeWhistle() {
  playMatchWhistle(MATCH_SOUND_PATHS.fullTimeWhistle, 0.18);
}

function playMatchWhistle(path, volume) {
  if (!audioIsEnabled()) return;
  const now = Date.now();
  if (now - lastMatchWhistleAt < MATCH_WHISTLE_COOLDOWN_MS) return;
  lastMatchWhistleAt = now;
  stopActiveMatchSounds();
  playAudioSample(path, volume);
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
  clearPlayerProfileCacheForTeam(customTeam.id);
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
  tournamentState.settings = normalizeSettings();
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
    // A scorer's goal must remain strictly before their dismissal. Keeping both
    // events on the same minute can render the red card first in the timeline.
    const end = dismissal ? Math.min(segmentEnd, Math.max(start, dismissal.minute - 1)) : segmentEnd;
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
    settings: normalizeSettings(),
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

function customTournamentBracketSize(teamCount = state?.customTournament?.teamCount || 32) {
  return 2 ** Math.ceil(Math.log2(Math.max(2, Number(teamCount) || 32)));
}

function customGroupQualifierCount(teamCount) {
  if (Number(teamCount) === 24) return 16;
  if (Number(teamCount) === 48) return 32;
  return Math.max(4, Number(teamCount) / 2);
}

function customTournamentRequiresGroups(teamCount) {
  return Number(teamCount) === 24;
}

function customRoundNames(teamCount = 32, structure = "knockout") {
  if (structure === "groups") {
    return ["Group stage", ...customRoundNames(customGroupQualifierCount(teamCount), "knockout")];
  }
  const count = customTournamentBracketSize(teamCount);
  const names = [];
  for (let teams = count; teams >= 2; teams /= 2) {
    if (teams === 2) names.push("Final");
    else if (teams === 4) names.push("Semi-Final");
    else if (teams === 8) names.push("Quarter-Final");
    else names.push(`Round of ${teams}`);
  }
  return names;
}

function isValidCustomTournamentState(candidate) {
  const count = Number(candidate?.customTournament?.teamCount);
  const structure = candidate?.customTournament?.structure === "groups" ? "groups" : "knockout";
  const openingMatchCount = structure === "groups" ? (count / 4) * 6 : customTournamentBracketSize(count) / 2;
  return candidate?.customTournament?.active === true
    && (CUSTOM_TOURNAMENT_TEAM_COUNTS.includes(count) || (count === 2 && candidate.customTournament.customMatch === true))
    && Array.isArray(candidate.rounds)
    && candidate.rounds[0]?.length === openingMatchCount;
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

function isDefaultKnockoutState(candidate) {
  return Boolean(
    candidate
    && !candidate.retroWorldCup
    && !candidate.customTournament
    && !candidate.legacyTournament
    && Array.isArray(candidate.rounds)
    && candidate.rounds[0]?.length === 128
  );
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const isLegacyTournament = isValidLegacyTournamentState(saved);
    const isCustomTournament = isValidCustomTournamentState(saved);
    if (
      saved?.version === STATE_VERSION &&
      Array.isArray(saved.rounds) &&
      (saved.rounds[0]?.length === 128 || isLegacyTournament || isCustomTournament)
    ) {
      if (typeof saved.started !== "boolean") {
        saved.started = false;
      }
      saved.settings = normalizeSettings(saved.settings);
      if (!STANDARD_TACTICS[saved.standardTactic]) saved.standardTactic = "balanced";
      delete saved.settings.spoiler;
      const isSavedLegacyTeam = (teamId) => isLegacyTournament && typeof teamId === "string" && teamId.startsWith("legacy-");
      const isSavedCustomTeam = (teamId) => isCustomTournament && saved.rounds.flat().some((match) => (
        match?.homeId === teamId || match?.awayId === teamId
      ));
      if (!TEAM_BY_ID.has(saved.predictionTeamId) && !isSavedLegacyTeam(saved.predictionTeamId)) saved.predictionTeamId = null;
      if (!TEAM_BY_ID.has(saved.spectateTeamId) && !isSavedLegacyTeam(saved.spectateTeamId) && !isSavedCustomTeam(saved.spectateTeamId)) saved.spectateTeamId = null;
      saved.rounds.flat().forEach((match) => normalizeDistinctGoalMinutes(match?.result));
      return saved;
    }
  } catch {
    // A corrupt save should never block the tournament.
  }
  return createInitialState();
}

let state = loadState();
if (matchSoundsEnabled === null) {
  matchSoundsEnabled = state.settings.sound !== false;
  localStorage.setItem(MATCH_SOUND_STORAGE_KEY, String(matchSoundsEnabled));
}
let standardTournamentState = state;
let defaultKnockoutState = isDefaultKnockoutState(state) ? state : null;
let customTournamentState = isValidCustomTournamentState(state) ? state : null;
let customMatchState = isValidCustomTournamentState(state) && state.customTournament?.customMatch === true ? state : null;
if (customMatchState) customTournamentState = null;
let retroSimulatorState = null;
let activeTournamentHistoryRecord = null;
let activeTournamentHistoryRound = 0;
let activeTournamentHistoryMatch = 0;
let tournamentHistoryReturnState = null;
let tournamentHistoryReturnFocus = null;
let tournamentHistoryReturnUrl = null;
let tournamentHistoryTemporaryTeamIds = [];
let keybindCaptureAction = null;
let standardTournamentUiState = null;
let retroLineupSwapNumber = null;
let retroLineupPanelView = "managed";
let retroLineupDragNumber = null;
let retroLiveSubOutNumber = null;
let retroLiveSubInNumber = null;
let retroLivePendingSubstitution = null;
let retroLiveSubDrag = null;
let retroTournamentUiState = {
  fixtureLimit: DEFAULT_FIXTURE_LIMIT,
  filterUnresolved: false,
  teamFilterId: null,
  teamFilterReturn: null,
};
const sharedMainContentHome = els.mainContent.parentElement;
const sharedMainContentMarker = document.createComment("shared-main-content-home");
els.mainContent.after(sharedMainContentMarker);
const snapshotButtonHome = els.snapshotButton.parentElement;
const snapshotButtonMarker = document.createComment("snapshot-button-home");
els.snapshotButton.after(snapshotButtonMarker);

function placeSnapshotButtonOnChampionScreen(championScreen) {
  if (championScreen) {
    if (els.snapshotButton.parentElement !== els.championStage) {
      els.championStage.append(els.snapshotButton);
    }
    return;
  }
  if (els.snapshotButton.parentElement !== snapshotButtonHome) {
    snapshotButtonMarker.parentNode?.insertBefore(els.snapshotButton, snapshotButtonMarker);
  }
}

function isRetroSimulatorState(candidate = state) {
  return candidate?.retroWorldCup === true;
}
