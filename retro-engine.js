const RETRO_WORLD_CUP_ENGINE = (() => {
  const VERSION = 2;
  const GROUP_FIXTURE_PATTERN = Object.freeze([
    [[0, 1], [2, 3]],
    [[0, 2], [3, 1]],
    [[3, 0], [1, 2]],
  ]);
  const ROUND_NAMES = Object.freeze(["Round of 16", "Quarter-finals", "Semi-finals", "Finals"]);
  const WORLD_CUP_2014_GOALS = Object.freeze({
    "jamesrodriguez": 6,
    "thomasmuller": 5,
    "lionelmessi": 4,
    "neymar": 4,
    "robinvanpersie": 4,
    "andreschurrle": 3,
    "arjenrobben": 3,
    "ennervalencia": 3,
    "karimbenzema": 3,
    "xherdanshaqiri": 3,
    "abdelmoumenedjabou": 2,
    "ahmedmusa": 2,
    "asamoahgyan": 2,
    "bryanruiz": 2,
    "clintdempsey": 2,
    "davidluiz": 2,
    "edinsoncavani": 2,
    "gervinho": 2,
    "gonzalohiguain": 1,
    "islamslimani": 2,
    "ivanperisic": 2,
    "jacksonmartinez": 2,
    "keisukehonda": 1,
    "luissuarez": 2,
    "mariomandzukic": 2,
    "mariogotze": 1,
    "matshummels": 2,
    "miroslavklose": 2,
    "mesutozil": 1,
    "oscar": 2,
    "timcahill": 2,
    "tonikroos": 2,
    "wilfriedbony": 2,
  });
  const WORLD_CUP_2010_GOALS = Object.freeze({
    "davidvilla": 5,
    "wesleysneijder": 5,
    "thomasmuller": 5,
    "diegoforlan": 5,
    "miroslavklose": 4,
    "robertvittek": 4,
    "gonzalohiguain": 4,
    "asamoahgyan": 3,
    "landondonovan": 3,
    "luisfabiano": 3,
    "luissuarez": 3,
    "lukaspodolski": 2,
    "carlostevez": 2,
    "samueletoo": 2,
    "robinho": 2,
  });
  const WORLD_CUP_2006_GOALS = Object.freeze({
    "miroslavklose": 5,
    "hernancrespo": 3,
    "ronaldo": 3,
    "thierryhenry": 3,
    "zinedinezidane": 3,
    "davidvilla": 3,
    "fernandotorres": 3,
    "lukaspodolski": 3,
    "maxirodriguez": 3,
    "andriyshevchenko": 2,
    "lucatoni": 2,
    "tomasrosicky": 2,
    "timcahill": 2,
  });
  const WORLD_CUP_2018_GOALS = Object.freeze({
    "harrykane": 6,
    "antoinegriezmann": 4,
    "cristianoronaldo": 4,
    "denischeryshev": 4,
    "kylianmbappe": 4,
    "romelulukaku": 4,
    "artemdzyuba": 3,
    "diegocosta": 3,
    "edinsoncavani": 3,
    "ivanperisic": 3,
    "mariomandzukic": 3,
    "yerrymina": 3,
    "ahmedmusa": 2,
    "edenhazard": 3,
    "johnstones": 2,
    "lukamodric": 2,
    "mohamedsalah": 2,
    "neymar": 2,
    "paulpogba": 1,
    "philippecoutinho": 2,
    "sonheungmin": 2,
    "takashiinui": 2,
  });
  const PENALTY_TAKERS_BY_YEAR = Object.freeze({
    2006: Object.fromEntries(Object.entries(typeof RETRO_2006_SQUADS !== "undefined" ? RETRO_2006_SQUADS : {})
      .map(([team, squad]) => [team, (squad.penaltyTakers || []).map((name) => normalizedPlayerName({ name }))])),
    2010: Object.fromEntries(Object.entries(typeof RETRO_2010_SQUADS !== "undefined" ? RETRO_2010_SQUADS : {})
      .map(([team, squad]) => [team, (squad.penaltyTakers || []).map((name) => normalizedPlayerName({ name }))])),
    2014: {
    Argentina: ["lionelmessi"],
    Brazil: ["neymar", "hulk"],
    Colombia: ["jamesrodriguez"],
    Germany: ["thomasmuller", "mesutozil"],
    Netherlands: ["robinvanpersie", "klaasjanhuntelaar"],
    Portugal: ["cristianoronaldo"],
    Spain: ["xabialonso", "davidsilva"],
    Uruguay: ["edinsoncavani", "luissuarez"],
    },
    2016: Object.fromEntries(Object.entries(typeof RETRO_EURO_2016_SQUADS !== "undefined" ? RETRO_EURO_2016_SQUADS : {})
      .map(([team, squad]) => [team, (squad.penaltyTakers || []).map((name) => normalizedPlayerName({ name }))])),
    2018: {
      Argentina: ["lionelmessi"],
      Belgium: ["edenhazard", "romelulukaku"],
      Brazil: ["neymar", "philippecoutinho"],
      Colombia: ["radamelfalcao", "juancuadrado"],
      Croatia: ["lukamodric", "ivanrakitic"],
      England: ["harrykane"],
      France: ["antoinegriezmann", "kylianmbappe"],
      Germany: ["tonikroos", "thomasmuller"],
      Portugal: ["cristianoronaldo"],
      Spain: ["sergioramos", "andresiniesta"],
      Uruguay: ["luissuarez", "edinsoncavani"],
    },
    2022: Object.fromEntries(Object.entries(typeof RETRO_2022_SQUADS !== "undefined" ? RETRO_2022_SQUADS : {})
      .map(([team, squad]) => [team, (squad.penaltyTakers || []).map((name) => normalizedPlayerName({ name }))])),
  });

  const EURO_2016_THIRD_PLACE_ASSIGNMENTS = Object.freeze({
    ABCD: Object.freeze({ A: "C", B: "D", C: "A", D: "B" }),
    ABCE: Object.freeze({ A: "C", B: "A", C: "B", D: "E" }),
    ABCF: Object.freeze({ A: "C", B: "A", C: "B", D: "F" }),
    ABDE: Object.freeze({ A: "D", B: "A", C: "B", D: "E" }),
    ABDF: Object.freeze({ A: "D", B: "A", C: "B", D: "F" }),
    ABEF: Object.freeze({ A: "E", B: "A", C: "B", D: "F" }),
    ACDE: Object.freeze({ A: "C", B: "D", C: "A", D: "E" }),
    ACDF: Object.freeze({ A: "C", B: "D", C: "A", D: "F" }),
    ACEF: Object.freeze({ A: "C", B: "A", C: "F", D: "E" }),
    ADEF: Object.freeze({ A: "D", B: "A", C: "F", D: "E" }),
    BCDE: Object.freeze({ A: "C", B: "D", C: "B", D: "E" }),
    BCDF: Object.freeze({ A: "C", B: "D", C: "B", D: "F" }),
    BCEF: Object.freeze({ A: "E", B: "C", C: "B", D: "F" }),
    BDEF: Object.freeze({ A: "E", B: "D", C: "B", D: "F" }),
    CDEF: Object.freeze({ A: "C", B: "D", C: "F", D: "E" }),
  });

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function stableHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < String(value).length; index += 1) {
      hash ^= String(value).charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    return function random() {
      let value = seed += 0x6D2B79F5;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function poisson(lambda, random) {
    const limit = Math.exp(-lambda);
    let product = 1;
    let count = 0;
    do {
      count += 1;
      product *= random();
    } while (product > limit && count < 12);
    return count - 1;
  }

  function weightedPick(items, random, weightFor) {
    if (!items.length) return null;
    const weights = items.map((item) => {
      const weight = Number(weightFor(item));
      return Number.isFinite(weight) ? Math.max(0.001, weight) : 0.001;
    });
    let roll = random() * weights.reduce((sum, weight) => sum + weight, 0);
    for (let index = 0; index < items.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) return items[index];
    }
    return items.at(-1);
  }

  function squadsForYear(year) {
    if (Number(year) === 2006) return typeof RETRO_2006_SQUADS !== "undefined" ? RETRO_2006_SQUADS : {};
    if (Number(year) === 2010) return typeof RETRO_2010_SQUADS !== "undefined" ? RETRO_2010_SQUADS : {};
    if (Number(year) === 2014) return typeof RETRO_2014_SQUADS !== "undefined" ? RETRO_2014_SQUADS : {};
    if (Number(year) === 2016) return typeof RETRO_EURO_2016_SQUADS !== "undefined" ? RETRO_EURO_2016_SQUADS : {};
    if (Number(year) === 2018) return typeof RETRO_2018_SQUADS !== "undefined" ? RETRO_2018_SQUADS : {};
    if (Number(year) === 2022) return typeof RETRO_2022_SQUADS !== "undefined" ? RETRO_2022_SQUADS : {};
    return {};
  }

  function groupScheduleForYear(year) {
    if (Number(year) === 2006) return RETRO_2006_GROUP_SCHEDULE;
    if (Number(year) === 2010) return RETRO_2010_GROUP_SCHEDULE;
    if (Number(year) === 2014) return RETRO_2014_GROUP_SCHEDULE;
    if (Number(year) === 2016) return RETRO_EURO_2016_GROUP_SCHEDULE;
    if (Number(year) === 2018) return RETRO_2018_GROUP_SCHEDULE;
    if (Number(year) === 2022) return RETRO_2022_GROUP_SCHEDULE;
    return {};
  }

  function knockoutScheduleForYear(year) {
    if (Number(year) === 2006) return RETRO_2006_KNOCKOUT_SCHEDULE;
    if (Number(year) === 2010) return RETRO_2010_KNOCKOUT_SCHEDULE;
    if (Number(year) === 2014) return RETRO_2014_KNOCKOUT_SCHEDULE;
    if (Number(year) === 2016) return RETRO_EURO_2016_KNOCKOUT_SCHEDULE;
    if (Number(year) === 2018) return RETRO_2018_KNOCKOUT_SCHEDULE;
    if (Number(year) === 2022) return RETRO_2022_KNOCKOUT_SCHEDULE;
    return {};
  }

  function teamEntry(year, name) {
    const entry = RETRO_WORLD_CUPS[year]?.teams.find((candidate) => candidate.name === name);
    const squad = squadsForYear(year)[name] || null;
    return entry ? { ...entry, squad } : null;
  }

  function startingXI(yearOrTeamName, maybeTeamName) {
    const year = maybeTeamName ? Number(yearOrTeamName) : 2014;
    const teamName = maybeTeamName || yearOrTeamName;
    const squadEntry = teamEntry(year, teamName)?.squad || null;
    const squad = squadEntry?.players || [];
    if (Array.isArray(squadEntry?.startingXI) && squadEntry.startingXI.length === 11) {
      const byNumber = new Map(squad.map((player) => [player.number, player]));
      const players = squadEntry.startingXI.map((number) => byNumber.get(number)).filter(Boolean);
      if (players.length === 11) {
        return {
          formation: squadEntry.formation || "4-3-3",
          players,
        };
      }
    }
    const remaining = [...squad];
    const take = (count, predicate) => remaining
      .filter(predicate)
      .sort((left, right) => right.overall - left.overall || left.number - right.number)
      .slice(0, count)
      .map((player) => {
        remaining.splice(remaining.indexOf(player), 1);
        return player;
      });
    const goalkeeper = take(1, (player) => player.position === "GK");
    const defenders = take(4, (player) => player.position === "DF");
    const midfielders = take(3, (player) => player.position === "MF");
    const forwards = take(3, (player) => player.position === "FW");
    const selected = [...goalkeeper, ...defenders, ...midfielders, ...forwards];
    if (selected.length < 11) {
      selected.push(...remaining
        .sort((left, right) => right.overall - left.overall || left.number - right.number)
        .slice(0, 11 - selected.length));
    }
    return {
      formation: "4-3-3",
      players: selected,
    };
  }

  function normalizedPlayerName(player) {
    return String(player?.name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  }

  function historicalGoals(yearOrPlayer, maybePlayer) {
    const year = maybePlayer ? Number(yearOrPlayer) : 2014;
    const player = maybePlayer || yearOrPlayer;
    if (year === 2022 && Number.isFinite(Number(player?.worldCupGoals))) {
      return Number(player.worldCupGoals);
    }
    if (year === 2016 && Number.isFinite(Number(player?.euroGoals))) {
      return Number(player.euroGoals);
    }
    const goals = year === 2006 ? WORLD_CUP_2006_GOALS
      : year === 2010 ? WORLD_CUP_2010_GOALS
      : year === 2018 ? WORLD_CUP_2018_GOALS : WORLD_CUP_2014_GOALS;
    return goals[normalizedPlayerName(player)] || 0;
  }

  function scoringWeight(year, player, isStarter = false) {
    const positions = player.positions || [player.position];
    const role = positions[0] || player.position;
    const is2022 = Number(year) === 2022;
    const roleWeight = role === "ST" || role === "CF" || role === "FW" ? (is2022 ? 0.9 : 1)
      : ["LW", "RW", "LM", "RM", "CAM"].includes(role) ? (is2022 ? 0.72 : 0.68)
      : ["CM", "CDM", "MF"].includes(role) ? (is2022 ? 0.18 : 0.12)
      : role === "GK" ? 0.002 : (is2022 ? 0.065 : 0.055);
    const tournamentGoals = historicalGoals(year, player);
    const shooting = player.attributes?.shooting || player.overall || 68;
    const qualityWeight = is2022
      ? Math.pow(clamp((Number(player.overall || 60) - 62) / 25, 0.14, 1.08), 1.35)
      : 1;
    const lowRatingWeight = is2022 && Number(player.overall || 0) < 72
      ? Math.pow(clamp((Number(player.overall || 0) - 64) / 8, 0.05, 1), 2.4)
      : 1;
    const internationalGoals = Number.isFinite(Number(player.internationalGoals))
      ? Number(player.internationalGoals)
      : 0;
    const tournamentFormWeight = tournamentGoals
      ? is2022
        ? 1.04 + Math.min(6, tournamentGoals) * 0.09
        : Number(year) === 2016
          ? 1.02 + Math.min(6, tournamentGoals) * 0.1
          : 1.05 + tournamentGoals * 0.18
      : is2022 ? 0.88 : Number(year) === 2016 ? 0.9 : 0.82;
    const internationalWeight = is2022
      ? 1 + Math.min(0.18, internationalGoals / 120)
      : 1 + Math.min(0.3, internationalGoals / 65);
    const scoringRoleMultiplier = is2022 && Number.isFinite(Number(player.scoringRoleMultiplier))
      ? clamp(Number(player.scoringRoleMultiplier), 0.5, 1.5)
      : 1;
    return roleWeight
      * (0.72 + Math.max(0, player.overall - 60) / 48)
      * (0.78 + Math.max(0, shooting - 45) / 95)
      * qualityWeight
      * lowRatingWeight
      * internationalWeight
      * tournamentFormWeight
      * scoringRoleMultiplier
      * (isStarter ? 1 : is2022 ? 0.22 : Number(year) === 2016 ? 0.09 : 0.16);
  }

  function penaltyScoringWeight(year, team, player, isStarter) {
    const takers = PENALTY_TAKERS_BY_YEAR[year]?.[team.name] || [];
    const order = takers.indexOf(normalizedPlayerName(player));
    const specialistBoost = order === 0 ? 8 : order === 1 ? 3.5 : 1;
    const shooting = player.attributes?.shooting || player.overall || 68;
    const penaltyAbility = Number.isFinite(Number(player.penaltyTakingAbility))
      ? Number(player.penaltyTakingAbility)
      : shooting;
    return scoringWeight(year, player, isStarter)
      * specialistBoost
      * (0.45 + shooting / 180 + penaltyAbility / 180);
  }

  function primaryPenaltyScorer(year, team, candidates) {
    const orderedTakers = PENALTY_TAKERS_BY_YEAR[year]?.[team.name] || [];
    for (const taker of orderedTakers) {
      const player = candidates.find((candidate) => normalizedPlayerName(candidate) === taker);
      if (player) return player;
    }
    return null;
  }

  function goalEvents(year, team, count, random, usedMinutes, penaltyMinutes, scorerTotals = new Map()) {
    const players = team.squad?.players || [];
    const candidates = players.filter((player) => player.position !== "GK");
    const starters = new Set(startingXI(year, team.name).players.map((player) => player.number));
    const events = [];
    for (let index = 0; index < count; index += 1) {
      let minute = 2 + Math.floor(random() * 89);
      while (usedMinutes.has(minute) && minute < 90) minute += 1;
      usedMinutes.add(minute);
      const penalty = random() < 0.065
        && penaltyMinutes.every((otherMinute) => Math.abs(otherMinute - minute) >= 12);
      if (penalty) penaltyMinutes.push(minute);
      const scorer = (penalty ? primaryPenaltyScorer(year, team, candidates) : null)
        || weightedPick(
          candidates,
          random,
          (player) => {
            const baseWeight = penalty
              ? penaltyScoringWeight(year, team, player, starters.has(player.number))
              : scoringWeight(year, player, starters.has(player.number));
            const existingGoals = scorerTotals.get(player.name) || 0;
            const diversityWeight = Number(year) === 2022
              ? 1 / (1 + Math.max(0, existingGoals - 2) * 0.18)
              : Number(year) === 2016
                ? 1 / (1 + Math.max(0, existingGoals - 2) * 0.25)
                : 1;
            return baseWeight * diversityWeight;
          },
        );
      if (scorer) scorerTotals.set(scorer.name, (scorerTotals.get(scorer.name) || 0) + 1);
      events.push({
        minute,
        scorer: scorer?.name || `${team.name} player`,
        number: scorer?.number || null,
        penalty,
      });
    }
    return events.sort((left, right) => left.minute - right.minute);
  }

  function scorerTotalsForTeam(tournament, teamName) {
    const totals = new Map();
    allMatches(tournament).forEach((match) => {
      if (!match.result) return;
      const side = match.home === teamName ? "home" : match.away === teamName ? "away" : null;
      if (!side) return;
      match.result[`${side}Events`].forEach((event) => {
        totals.set(event.scorer, (totals.get(event.scorer) || 0) + 1);
      });
    });
    return totals;
  }

  function expectedGoals(home, away, tournament = null) {
    const isEuro2016 = Number(tournament?.year) === 2016;
    const managedRatingBonus = (team) => {
      if (!isEuro2016 || !tournament?.managedTeam || team.name !== tournament.managedTeam) return 0;
      return clamp(4 + Math.max(0, 84 - team.rating) * 0.45, 4, 10);
    };
    const ratingGap = (
      home.rating + managedRatingBonus(home)
    ) - (
      away.rating + managedRatingBonus(away)
    );
    const base = isEuro2016 ? 1.08 : 1.18;
    const ratingScale = isEuro2016 ? 0.05 : 0.037;
    return {
      home: clamp(
        base + ratingGap * ratingScale,
        isEuro2016 ? 0.14 : 0.18,
        isEuro2016 ? 3.25 : 3.45,
      ),
      away: clamp(
        base - ratingGap * ratingScale,
        isEuro2016 ? 0.14 : 0.18,
        isEuro2016 ? 3.25 : 3.45,
      ),
    };
  }

  function penaltyShootout(home, away, random) {
    const homePenaltyRating = averagePenaltyRating(home);
    const awayPenaltyRating = averagePenaltyRating(away);
    let homeScore = 0;
    let awayScore = 0;
    let homeTaken = 0;
    let awayTaken = 0;
    const kicks = [];
    while (true) {
      const round = Math.max(homeTaken, awayTaken) + 1;
      const fatiguePenalty = Math.min(0.16, Math.max(0, round - 5) * 0.015);
      const homeScored = random() < clamp(
        0.71 + (homePenaltyRating - 75) * 0.006 - fatiguePenalty,
        0.58,
        0.88,
      );
      homeTaken += 1;
      if (homeScored) homeScore += 1;
      kicks.push({ side: "home", scored: homeScored });
      if (shootoutClinched(homeScore, awayScore, homeTaken, awayTaken)) break;

      const awayScored = random() < clamp(
        0.71 + (awayPenaltyRating - 75) * 0.006 - fatiguePenalty,
        0.58,
        0.88,
      );
      awayTaken += 1;
      if (awayScored) awayScore += 1;
      kicks.push({ side: "away", scored: awayScored });
      if (shootoutClinched(homeScore, awayScore, homeTaken, awayTaken)) break;
    }
    return { home: homeScore, away: awayScore, kicks };
  }

  function shootoutClinched(homeScore, awayScore, homeTaken, awayTaken) {
    if (homeTaken <= 5 || awayTaken <= 5) {
      const homeRemaining = Math.max(0, 5 - homeTaken);
      const awayRemaining = Math.max(0, 5 - awayTaken);
      return homeScore > awayScore + awayRemaining || awayScore > homeScore + homeRemaining;
    }
    return homeTaken === awayTaken && homeScore !== awayScore;
  }

  function averagePenaltyRating(team) {
    const outfield = (team.squad?.players || []).filter((player) => player.position !== "GK");
    if (outfield.some((player) => Number.isFinite(Number(player.penaltyTakingAbility)))) {
      const bestTakers = [...outfield]
        .sort((left, right) => Number(right.penaltyTakingAbility || 1) - Number(left.penaltyTakingAbility || 1))
        .slice(0, 5);
      return bestTakers.reduce((sum, player) => sum + Number(player.penaltyTakingAbility || 1), 0) / bestTakers.length;
    }
    const best = [...outfield].sort((left, right) => right.overall - left.overall).slice(0, 8);
    return best.length ? best.reduce((sum, player) => sum + player.overall, 0) / best.length : team.rating;
  }

  function simulateMatch(tournament, match) {
    if (match.result) return match.result;
    const home = teamEntry(tournament.year, match.home);
    const away = teamEntry(tournament.year, match.away);
    const random = mulberry32(tournament.seed + stableHash(match.id));
    const xg = expectedGoals(home, away, tournament);
    let homeGoals = poisson(xg.home, random);
    let awayGoals = poisson(xg.away, random);
    const regulationHome = homeGoals;
    const regulationAway = awayGoals;
    let extraTime = false;
    let penalties = null;

    if (match.stage !== "group" && homeGoals === awayGoals) {
      extraTime = true;
      homeGoals += poisson(xg.home * 0.27, random);
      awayGoals += poisson(xg.away * 0.27, random);
      if (homeGoals === awayGoals) penalties = penaltyShootout(home, away, random);
    }

    const usedMinutes = new Set();
    const penaltyMinutes = [];
    const homeEvents = goalEvents(
      tournament.year,
      home,
      homeGoals,
      random,
      usedMinutes,
      penaltyMinutes,
      scorerTotalsForTeam(tournament, home.name),
    );
    const awayEvents = goalEvents(
      tournament.year,
      away,
      awayGoals,
      random,
      usedMinutes,
      penaltyMinutes,
      scorerTotalsForTeam(tournament, away.name),
    );
    const winner = penalties
      ? penalties.home > penalties.away ? home.name : away.name
      : homeGoals === awayGoals ? null : homeGoals > awayGoals ? home.name : away.name;
    const totalXg = xg.home + xg.away;
    const homePossession = clamp(Math.round(50 + (home.rating - away.rating) * 0.65 + (random() - 0.5) * 10), 31, 69);
    const homeShots = Math.max(homeGoals, Math.round(xg.home * 4.5 + random() * 4));
    const awayShots = Math.max(awayGoals, Math.round(xg.away * 4.5 + random() * 4));

    match.result = {
      homeGoals,
      awayGoals,
      regulationHome,
      regulationAway,
      extraTime,
      penalties,
      winner,
      homeEvents,
      awayEvents,
      stats: {
        possession: [homePossession, 100 - homePossession],
        shots: [homeShots, awayShots],
        onTarget: [
          Math.min(homeShots, Math.max(homeGoals, Math.round(homeShots * (0.34 + random() * 0.18)))),
          Math.min(awayShots, Math.max(awayGoals, Math.round(awayShots * (0.34 + random() * 0.18)))),
        ],
        expectedGoals: [
          Number((xg.home * (0.88 + random() * 0.24)).toFixed(2)),
          Number((xg.away * (0.88 + random() * 0.24)).toFixed(2)),
        ],
      },
      totalExpectedGoals: Number(totalXg.toFixed(2)),
      revealed: true,
    };
    advanceTournament(tournament);
    return match.result;
  }

  function groupStandings(tournament, group) {
    const teamNames = RETRO_WORLD_CUPS[tournament.year].teams
      .filter((team) => team.group === group)
      .map((team) => team.name);
    const table = new Map(teamNames.map((name) => [name, {
      name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0,
    }]));
    tournament.groupMatches.filter((match) => match.group === group && match.result).forEach((match) => {
      const home = table.get(match.home);
      const away = table.get(match.away);
      home.played += 1;
      away.played += 1;
      home.gf += match.result.homeGoals;
      home.ga += match.result.awayGoals;
      away.gf += match.result.awayGoals;
      away.ga += match.result.homeGoals;
      if (match.result.homeGoals > match.result.awayGoals) {
        home.won += 1;
        away.lost += 1;
        home.points += 3;
      } else if (match.result.awayGoals > match.result.homeGoals) {
        away.won += 1;
        home.lost += 1;
        away.points += 3;
      } else {
        home.drawn += 1;
        away.drawn += 1;
        home.points += 1;
        away.points += 1;
      }
    });
    return [...table.values()]
      .map((row) => ({ ...row, gd: row.gf - row.ga }))
      .sort((left, right) => (
        right.points - left.points
        || right.gd - left.gd
        || right.gf - left.gf
        || teamEntry(tournament.year, right.name).rating - teamEntry(tournament.year, left.name).rating
        || left.name.localeCompare(right.name)
      ));
  }

  function groupLetters(year) {
    return [...new Set(RETRO_WORLD_CUPS[year].teams.map((team) => team.group))];
  }

  function buildGroupMatches(year) {
    return groupLetters(year).flatMap((group) => {
      const teams = RETRO_WORLD_CUPS[year].teams.filter((team) => team.group === group);
      return GROUP_FIXTURE_PATTERN.flatMap((fixtures, matchdayIndex) => fixtures.map(([homeIndex, awayIndex], fixtureIndex) => {
        const home = teams[homeIndex].name;
        const away = teams[awayIndex].name;
        const schedule = groupScheduleForYear(year);
        return {
          id: `g${group}-d${matchdayIndex + 1}-m${fixtureIndex + 1}`,
          stage: "group",
          group,
          matchday: matchdayIndex + 1,
          home,
          away,
          schedule: schedule[`${home}|${away}`] || schedule[`${away}|${home}`],
          result: null,
        };
      }));
    });
  }

  function buildWorldCupRoundOf16(tournament) {
    const qualifiers = Object.fromEntries(groupLetters(tournament.year).flatMap((group) => {
      const table = groupStandings(tournament, group);
      return [[`${group}1`, table[0].name], [`${group}2`, table[1].name]];
    }));
    const pairings = [
      ["A1", "B2"], ["C1", "D2"], ["E1", "F2"], ["G1", "H2"],
      ["B1", "A2"], ["D1", "C2"], ["F1", "E2"], ["H1", "G2"],
    ];
    tournament.knockoutRounds = [{
      name: ROUND_NAMES[0],
      matches: pairings.map(([homeKey, awayKey], index) => {
        const id = `ko-r16-m${index + 1}`;
        return {
          id,
          stage: "knockout",
          roundIndex: 0,
          home: qualifiers[homeKey],
          away: qualifiers[awayKey],
          schedule: knockoutScheduleForYear(tournament.year)[id],
          result: null,
        };
      }),
    }];
    tournament.phase = "knockout";
  }

  function buildEuro2016RoundOf16(tournament) {
    const tables = Object.fromEntries(groupLetters(tournament.year).map((group) => [
      group,
      groupStandings(tournament, group),
    ]));
    const bestThirds = Object.entries(tables)
      .map(([group, table]) => ({ group, ...table[2] }))
      .sort((left, right) => (
        right.points - left.points
        || right.gd - left.gd
        || right.gf - left.gf
        || teamEntry(tournament.year, right.name).rating - teamEntry(tournament.year, left.name).rating
        || left.group.localeCompare(right.group)
      ))
      .slice(0, 4);
    const thirdByGroup = Object.fromEntries(bestThirds.map((entry) => [entry.group, entry.name]));
    const combination = bestThirds.map((entry) => entry.group).sort().join("");
    const assignment = EURO_2016_THIRD_PLACE_ASSIGNMENTS[combination];
    if (!assignment) throw new Error(`Unsupported Euro 2016 third-place combination: ${combination}`);

    const pairings = [
      [tables.A[1].name, tables.C[1].name],
      [tables.D[0].name, thirdByGroup[assignment.D]],
      [tables.B[0].name, thirdByGroup[assignment.B]],
      [tables.F[0].name, tables.E[1].name],
      [tables.C[0].name, thirdByGroup[assignment.C]],
      [tables.E[0].name, tables.D[1].name],
      [tables.A[0].name, thirdByGroup[assignment.A]],
      [tables.B[1].name, tables.F[1].name],
    ];
    tournament.bestThirdPlaced = bestThirds.map((entry) => ({
      group: entry.group,
      team: entry.name,
      points: entry.points,
      goalDifference: entry.gd,
      goalsFor: entry.gf,
    }));
    tournament.knockoutRounds = [{
      name: ROUND_NAMES[0],
      matches: pairings.map(([home, away], index) => {
        const id = `ko-r16-m${index + 1}`;
        return {
          id,
          stage: "knockout",
          roundIndex: 0,
          home,
          away,
          schedule: knockoutScheduleForYear(tournament.year)[id],
          result: null,
        };
      }),
    }];
    tournament.phase = "knockout";
  }

  function buildRoundOf16(tournament) {
    if (Number(tournament.year) === 2016) {
      buildEuro2016RoundOf16(tournament);
      return;
    }
    buildWorldCupRoundOf16(tournament);
  }

  function buildNextKnockoutRound(tournament) {
    const current = tournament.knockoutRounds.at(-1);
    if (!current?.matches.every((match) => match.result)) return;
    if (current.name === "Finals") {
      tournament.phase = "complete";
      tournament.champion = current.matches.find((match) => match.id === "ko-final").result.winner;
      return;
    }
    if (current.name === "Semi-finals") {
      const winners = current.matches.map((match) => match.result.winner);
      if (Number(tournament.year) === 2016) {
        tournament.knockoutRounds.push({
          name: ROUND_NAMES[3],
          matches: [{
            id: "ko-final",
            label: "Final",
            stage: "knockout",
            roundIndex: 3,
            home: winners[0],
            away: winners[1],
            schedule: knockoutScheduleForYear(tournament.year)["ko-final"],
            result: null,
          }],
        });
        return;
      }
      const losers = current.matches.map((match) => (
        match.result.winner === match.home ? match.away : match.home
      ));
      tournament.knockoutRounds.push({
        name: ROUND_NAMES[3],
        matches: [
          {
            id: "ko-third-place",
            label: "Third-place play-off",
            stage: "knockout",
            roundIndex: 3,
            home: losers[0],
            away: losers[1],
            schedule: knockoutScheduleForYear(tournament.year)["ko-third-place"],
            result: null,
          },
          {
            id: "ko-final",
            label: "Final",
            stage: "knockout",
            roundIndex: 3,
            home: winners[0],
            away: winners[1],
            schedule: knockoutScheduleForYear(tournament.year)["ko-final"],
            result: null,
          },
        ],
      });
      return;
    }
    const nextIndex = tournament.knockoutRounds.length;
    const winners = current.matches.map((match) => match.result.winner);
    tournament.knockoutRounds.push({
      name: ROUND_NAMES[nextIndex],
      matches: Array.from({ length: winners.length / 2 }, (_, index) => {
        const id = `ko-r${nextIndex + 1}-m${index + 1}`;
        return {
          id,
          stage: "knockout",
          roundIndex: nextIndex,
          home: winners[index * 2],
          away: winners[index * 2 + 1],
          schedule: knockoutScheduleForYear(tournament.year)[id],
          result: null,
        };
      }),
    });
  }

  function advanceTournament(tournament) {
    if (tournament.phase === "group" && tournament.groupMatches.every((match) => match.result)) {
      buildRoundOf16(tournament);
    } else if (tournament.phase === "knockout") {
      buildNextKnockoutRound(tournament);
    }
  }

  function createTournament({ year = 2014, seed = Date.now(), managedTeam = null } = {}) {
    if (![2006, 2010, 2014, 2016, 2018, 2022].includes(Number(year)) || !RETRO_WORLD_CUPS[year] || !Object.keys(squadsForYear(year)).length) {
      throw new Error("That retro tournament is not playable yet.");
    }
    return {
      version: VERSION,
      year,
      seed: Number(seed) >>> 0,
      managedTeam,
      phase: "group",
      groupMatches: buildGroupMatches(year),
      knockoutRounds: [],
      champion: null,
      createdAt: new Date().toISOString(),
    };
  }

  function allMatches(tournament) {
    return [
      ...tournament.groupMatches,
      ...tournament.knockoutRounds.flatMap((round) => round.matches),
    ];
  }

  function activeMatches(tournament) {
    if (tournament.phase === "group") {
      const unresolved = tournament.groupMatches.find((match) => !match.result);
      const matchday = unresolved?.matchday || 3;
      return tournament.groupMatches.filter((match) => match.matchday === matchday);
    }
    return tournament.knockoutRounds.at(-1)?.matches || [];
  }

  function nextUnplayedMatch(tournament, preferredTeam = tournament.managedTeam) {
    const matches = activeMatches(tournament);
    return matches.find((match) => !match.result && preferredTeam && [match.home, match.away].includes(preferredTeam))
      || matches.find((match) => !match.result)
      || null;
  }

  function simulateActiveStage(tournament) {
    activeMatches(tournament).filter((match) => !match.result).forEach((match) => simulateMatch(tournament, match));
  }

  function goldenBoot(tournament) {
    const scorers = new Map();
    allMatches(tournament).forEach((match) => {
      if (!match.result) return;
      [["home", match.home], ["away", match.away]].forEach(([side, team]) => {
        (match.result[`${side}Events`] || []).forEach((event) => {
          const key = `${team}:${event.scorer}`;
          const current = scorers.get(key) || { player: event.scorer, team, goals: 0 };
          current.goals += 1;
          scorers.set(key, current);
        });
      });
    });
    return [...scorers.values()].sort((left, right) => right.goals - left.goals || left.player.localeCompare(right.player));
  }

  function validate(tournament) {
    const year = Number(tournament?.year);
    const expectedTeams = year === 2016 ? 24 : 32;
    const expectedGroupMatches = year === 2016 ? 36 : 48;
    return Boolean(
      tournament
      && tournament.version === VERSION
      && [2006, 2010, 2014, 2016, 2018, 2022].includes(year)
      && Array.isArray(tournament.groupMatches)
      && tournament.groupMatches.length === expectedGroupMatches
      && RETRO_WORLD_CUPS[tournament.year]?.teams.length === expectedTeams
      && Object.keys(squadsForYear(tournament.year)).length === expectedTeams
    );
  }

  return Object.freeze({
    VERSION,
    createTournament,
    simulateMatch,
    simulateActiveStage,
    advanceTournament,
    groupStandings,
    allMatches,
    activeMatches,
    nextUnplayedMatch,
    goldenBoot,
    historicalGoals,
    teamEntry,
    startingXI,
    validate,
  });
})();
