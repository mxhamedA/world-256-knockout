(function attachPlayerCareerEngine(global) {
  "use strict";

  const VERSION = 1;
  const POSITIONS = Object.freeze(["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"]);
  const FEET = Object.freeze(["Left", "Right", "Both"]);
  const ATTRIBUTES = Object.freeze(["pace", "shooting", "passing", "dribbling", "defending", "physical"]);
  const EFFORTS = Object.freeze({
    light: Object.freeze({ label: "Light", basePoints: 2, fatigue: 2 }),
    medium: Object.freeze({ label: "Medium", basePoints: 4, fatigue: 6 }),
    intense: Object.freeze({ label: "Intense", basePoints: 7, fatigue: 13 }),
  });
  const POSITION_WEIGHTS = Object.freeze({
    GK: Object.freeze({ pace: 0.08, shooting: 0.04, passing: 0.18, dribbling: 0.08, defending: 0.38, physical: 0.24 }),
    CB: Object.freeze({ pace: 0.12, shooting: 0.04, passing: 0.12, dribbling: 0.08, defending: 0.40, physical: 0.26 }),
    LB: Object.freeze({ pace: 0.23, shooting: 0.05, passing: 0.16, dribbling: 0.14, defending: 0.25, physical: 0.17 }),
    RB: Object.freeze({ pace: 0.23, shooting: 0.05, passing: 0.16, dribbling: 0.14, defending: 0.25, physical: 0.17 }),
    CDM: Object.freeze({ pace: 0.10, shooting: 0.07, passing: 0.24, dribbling: 0.12, defending: 0.28, physical: 0.19 }),
    CM: Object.freeze({ pace: 0.12, shooting: 0.12, passing: 0.28, dribbling: 0.22, defending: 0.12, physical: 0.14 }),
    CAM: Object.freeze({ pace: 0.15, shooting: 0.19, passing: 0.27, dribbling: 0.27, defending: 0.03, physical: 0.09 }),
    LW: Object.freeze({ pace: 0.27, shooting: 0.21, passing: 0.15, dribbling: 0.27, defending: 0.02, physical: 0.08 }),
    RW: Object.freeze({ pace: 0.27, shooting: 0.21, passing: 0.15, dribbling: 0.27, defending: 0.02, physical: 0.08 }),
    ST: Object.freeze({ pace: 0.18, shooting: 0.36, passing: 0.10, dribbling: 0.19, defending: 0.02, physical: 0.15 }),
  });
  const POSITION_ATTRIBUTE_BONUSES = Object.freeze({
    GK: Object.freeze({ defending: 5, physical: 3, passing: 2 }),
    CB: Object.freeze({ defending: 5, physical: 4, pace: 1 }),
    LB: Object.freeze({ pace: 5, defending: 4, passing: 2 }),
    RB: Object.freeze({ pace: 5, defending: 4, passing: 2 }),
    CDM: Object.freeze({ defending: 4, passing: 4, physical: 3 }),
    CM: Object.freeze({ passing: 5, dribbling: 3, physical: 2 }),
    CAM: Object.freeze({ passing: 5, dribbling: 5, shooting: 2 }),
    LW: Object.freeze({ pace: 5, dribbling: 5, shooting: 3 }),
    RW: Object.freeze({ pace: 5, dribbling: 5, shooting: 3 }),
    ST: Object.freeze({ shooting: 5, pace: 3, physical: 3 }),
  });
  const MONTH_NAMES = Object.freeze(["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]);

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function round(value, precision = 0) {
    const factor = 10 ** precision;
    return Math.round(Number(value || 0) * factor) / factor;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function stableHash(value) {
    let hash = 2166136261;
    const text = String(value ?? "");
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    let value = Number(seed) >>> 0;
    return () => {
      value = (value + 0x6d2b79f5) >>> 0;
      let mixed = value;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  function randomFor(state, label) {
    return mulberry32((Number(state.seed) + stableHash(label) + Number(state.actionIndex || 0) * 2654435761) >>> 0);
  }

  function randomInteger(random, minimum, maximum) {
    return Math.floor(random() * (maximum - minimum + 1)) + minimum;
  }

  function pick(random, values) {
    return values[Math.floor(random() * values.length)];
  }

  function shuffled(random, values) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  }

  function poisson(mean, random) {
    const limit = Math.exp(-Math.max(0.05, mean));
    let product = 1;
    let count = 0;
    do {
      count += 1;
      product *= random();
    } while (product > limit && count < 12);
    return count - 1;
  }

  function isoDate(year, month, day) {
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function addDays(dateString, days) {
    const date = new Date(`${dateString}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function dateMonthKey(dateString) {
    return String(dateString || "").slice(0, 7);
  }

  function dateLabel(dateString) {
    const date = new Date(`${dateString}T12:00:00Z`);
    if (Number.isNaN(date.getTime())) return dateString;
    return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  }

  function weekKey(dateString) {
    const date = new Date(`${dateString}T12:00:00Z`);
    const first = Date.UTC(date.getUTCFullYear(), 0, 1);
    const day = Math.floor((date.getTime() - first) / 86400000);
    return `${date.getUTCFullYear()}-W${String(Math.floor((day + new Date(first).getUTCDay()) / 7) + 1).padStart(2, "0")}`;
  }

  function normalizeClub(club, index = 0) {
    const id = String(club?.id || `club-${index + 1}`).toLowerCase().replace(/[^a-z0-9-]/g, "-");
    return {
      id,
      name: String(club?.name || `Club ${index + 1}`).trim().slice(0, 70),
      code: String(club?.code || String(club?.name || "CLB").slice(0, 3)).trim().toUpperCase().slice(0, 4),
      rating: clamp(Math.round(Number(club?.simulationRatings?.overall || club?.rating || 75)), 60, 95),
      badge: String(club?.badge || `./assets/pl-26-27/badges/${id}.webp`),
    };
  }

  function normalizeClubs(clubs) {
    const normalized = Array.isArray(clubs) ? clubs.map(normalizeClub).filter((club) => club.name) : [];
    if (normalized.length >= 8) return normalized;
    const fallback = [
      ["arsenal", "Arsenal", "ARS", 90], ["aston-villa", "Aston Villa", "AVL", 84],
      ["bournemouth", "Bournemouth", "BOU", 81], ["brentford", "Brentford", "BRE", 78],
      ["brighton", "Brighton & Hove Albion", "BHA", 80], ["chelsea", "Chelsea", "CHE", 88],
      ["crystal-palace", "Crystal Palace", "CRY", 82], ["everton", "Everton", "EVE", 78],
      ["fulham", "Fulham", "FUL", 79], ["leeds-united", "Leeds United", "LEE", 75],
      ["liverpool", "Liverpool", "LIV", 91], ["manchester-city", "Manchester City", "MCI", 92],
      ["manchester-united", "Manchester United", "MUN", 84], ["newcastle-united", "Newcastle United", "NEW", 85],
      ["nottingham-forest", "Nottingham Forest", "NFO", 81], ["sunderland", "Sunderland", "SUN", 72],
      ["tottenham-hotspur", "Tottenham Hotspur", "TOT", 85], ["west-ham-united", "West Ham United", "WHU", 80],
      ["wolverhampton", "Wolverhampton Wanderers", "WOL", 77], ["ipswich-town", "Ipswich Town", "IPS", 73],
    ];
    return fallback.map(([id, name, code, rating], index) => normalizeClub({ id, name, code, rating }, index));
  }

  function academyOptions(clubs, seed = Date.now()) {
    const list = normalizeClubs(clubs);
    const random = mulberry32((Number(seed) || Date.now()) >>> 0);
    const elite = list.filter((club) => club.rating >= 87);
    const established = list.filter((club) => club.rating >= 80 && club.rating < 87);
    const pathway = list.filter((club) => club.rating < 80);
    const selected = [];
    [pathway, established, elite].forEach((tier) => {
      const available = tier.filter((club) => !selected.some((entry) => entry.id === club.id));
      if (available.length) selected.push(pick(random, available));
    });
    while (selected.length < 3) {
      const available = list.filter((club) => !selected.some((entry) => entry.id === club.id));
      if (!available.length) break;
      selected.push(pick(random, available));
    }
    return shuffled(random, selected).map((club) => ({
      ...club,
      academyName: `${club.name} Academy`,
      pathway: club.rating >= 87 ? "Elite facilities · harder first-team pathway" : club.rating >= 80 ? "Category One academy · balanced pathway" : "Clear pathway · more academy minutes",
    }));
  }

  function calculateOverall(position, attributes) {
    const weights = POSITION_WEIGHTS[position] || POSITION_WEIGHTS.CM;
    return clamp(Math.round(ATTRIBUTES.reduce((total, key) => total + Number(attributes?.[key] || 0) * weights[key], 0)), 1, 99);
  }

  function generateAttributes(position, nationalityName, seed) {
    const random = mulberry32((Number(seed) + stableHash(`${position}:${nationalityName}`)) >>> 0);
    const bonuses = POSITION_ATTRIBUTE_BONUSES[position] || POSITION_ATTRIBUTE_BONUSES.CM;
    const attributes = {};
    ATTRIBUTES.forEach((key) => {
      const base = randomInteger(random, 40, 50);
      attributes[key] = clamp(base + Number(bonuses[key] || 0) + randomInteger(random, 0, 2), 40, 55);
    });
    return attributes;
  }

  function publicNationality(value) {
    return {
      id: String(value?.id || "").slice(0, 40),
      name: String(value?.name || "Unknown").trim().slice(0, 70),
      code: String(value?.code || "").trim().slice(0, 10),
      flag: String(value?.flag || "").trim().slice(0, 12),
    };
  }

  function roleForClub(player, club) {
    const reputation = Number(player.reputation || 0);
    const readiness = Number(player.overall || 45) + reputation / 16;
    const demand = Number(club.rating || 75) - 28;
    if (readiness >= demand + 8) return "Starter";
    if (readiness >= demand + 2) return "Rotation";
    return "Squad";
  }

  function leagueForClub(player, club) {
    return player.age < 18 && player.overall < 62 ? "U18 Premier League" : "Premier League";
  }

  function continentalCompetition(club) {
    if (club.rating >= 87) return "UEFA Champions League";
    if (club.rating >= 83) return "UEFA Europa League";
    if (club.rating >= 80) return "UEFA Conference League";
    return null;
  }

  function makeFixture(id, date, competition, stage, club, opponent, isHome, knockout = false) {
    return {
      id,
      date,
      month: dateMonthKey(date),
      competition,
      stage,
      homeClubId: isHome ? club.id : opponent.id,
      homeClubName: isHome ? club.name : opponent.name,
      awayClubId: isHome ? opponent.id : club.id,
      awayClubName: isHome ? opponent.name : club.name,
      opponentId: opponent.id,
      opponentName: opponent.name,
      isHome,
      knockout,
      status: "scheduled",
      result: null,
    };
  }

  function buildSeasonFixtures(clubs, club, startYear, seed, leagueName) {
    const random = mulberry32((Number(seed) + stableHash(`${club.id}:${startYear}:schedule`)) >>> 0);
    const opponents = shuffled(random, clubs.filter((entry) => entry.id !== club.id));
    const fixtures = [];
    const seasonStart = isoDate(startYear, 8, 8);
    opponents.forEach((opponent, index) => {
      const firstHome = (index + startYear) % 2 === 0;
      fixtures.push(makeFixture(`league-${startYear}-${index + 1}`, addDays(seasonStart, index * 7), leagueName, `Matchweek ${index + 1}`, club, opponent, firstHome));
    });
    opponents.forEach((opponent, index) => {
      const round = opponents.length + index + 1;
      const firstHome = (index + startYear) % 2 === 0;
      fixtures.push(makeFixture(`league-${startYear}-${round}`, addDays(seasonStart, (opponents.length + index) * 7), leagueName, `Matchweek ${round}`, club, opponent, !firstHome));
    });

    const cupName = leagueName.startsWith("U18") ? "FA Youth Cup" : "FA Cup";
    const cupRounds = [
      [9, 23, "Third round"], [11, 4, "Fourth round"], [1, 13, "Quarter-final"], [3, 10, "Semi-final"], [5, 12, "Final"],
    ];
    cupRounds.forEach(([month, day, stage], index) => {
      const year = month < 7 ? startYear + 1 : startYear;
      const opponent = pick(random, opponents);
      fixtures.push(makeFixture(`cup-${startYear}-${index + 1}`, isoDate(year, month, day), cupName, stage, club, opponent, random() > 0.5, true));
    });

    const continental = continentalCompetition(club);
    if (continental) {
      const leagueDates = [
        [9, 16], [10, 7], [10, 28], [11, 18], [12, 9], [1, 20], [2, 3], [2, 17],
      ];
      leagueDates.forEach(([month, day], index) => {
        const year = month < 7 ? startYear + 1 : startYear;
        fixtures.push(makeFixture(`continental-${startYear}-league-${index + 1}`, isoDate(year, month, day), continental, `League phase · Match ${index + 1}`, club, pick(random, opponents), random() > 0.5));
      });
      [[3, 3, "Round of 16"], [4, 7, "Quarter-final"], [4, 28, "Semi-final"], [5, 24, "Final"]].forEach(([month, day, stage], index) => {
        fixtures.push(makeFixture(`continental-${startYear}-ko-${index + 1}`, isoDate(startYear + 1, month, day), continental, stage, club, pick(random, opponents), random() > 0.5, true));
      });
    }

    return fixtures.sort((left, right) => left.date.localeCompare(right.date) || left.competition.localeCompare(right.competition));
  }

  function emptySeasonStats() {
    return {
      appearances: 0,
      starts: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      saves: 0,
      tackles: 0,
      dribbles: 0,
      minutes: 0,
      ratingTotal: 0,
      averageRating: 0,
      wins: 0,
      draws: 0,
      losses: 0,
    };
  }

  function objectiveFor(position, seed) {
    const random = mulberry32((Number(seed) + stableHash(`objective:${position}`)) >>> 0);
    const common = [
      { type: "rating", target: 7.5, label: "Earn a 7.5+ match rating" },
      { type: "win", target: 1, label: "Help your club win your next appearance" },
      { type: "assist", target: 1, label: "Record an assist in your next appearance" },
    ];
    const specialist = position === "GK"
      ? { type: "cleanSheet", target: 1, label: "Keep a clean sheet in your next appearance" }
      : ["ST", "LW", "RW", "CAM"].includes(position)
        ? { type: "goal", target: 1, label: "Score in your next appearance" }
        : { type: "tackles", target: 3, label: "Make 3 tackles in your next appearance" };
    return { ...pick(random, [...common, specialist]), reward: 25, complete: false };
  }

  function initialNews(player, club) {
    return [
      {
        id: `news-created-${Date.now()}`,
        date: "2026-01-01",
        tone: "major",
        headline: `${player.fullName} joins ${club.name}'s academy`,
        body: `The 15-year-old ${player.position} has signed a first development deal and will begin pre-season with the ${club.name} pathway squad.`,
      },
      {
        id: `news-scout-${Date.now()}`,
        date: "2026-01-01",
        tone: "standard",
        headline: "A clean slate",
        body: "Coaches say training and match performances—not reputation—will decide how quickly first-team opportunities arrive.",
      },
    ];
  }

  function createCareer(input = {}) {
    const fullName = String(input.fullName || "").trim().replace(/\s+/g, " ").slice(0, 60);
    const position = String(input.position || "CM").toUpperCase();
    const preferredFoot = String(input.preferredFoot || "Right");
    const clubs = normalizeClubs(input.clubs);
    const club = clubs.find((entry) => entry.id === input.academyClubId);
    if (fullName.split(" ").length < 2) throw new Error("Enter your player's first and last name.");
    if (!POSITIONS.includes(position)) throw new Error("Choose a valid position.");
    if (!FEET.includes(preferredFoot)) throw new Error("Choose a preferred foot.");
    if (!club) throw new Error("Choose one of the offered academy clubs.");
    const nationality = publicNationality(input.nationality);
    if (!nationality.id || !nationality.name) throw new Error("Choose a nationality.");
    const seed = (Number(input.seed) || stableHash(`${fullName}:${nationality.id}:${Date.now()}`)) >>> 0;
    const attributes = generateAttributes(position, nationality.name, seed);
    const player = {
      fullName,
      nationality,
      position,
      preferredFoot,
      birthDate: "2011-01-01",
      careerStartDate: "2026-01-01",
      age: 15,
      attributes,
      overall: calculateOverall(position, attributes),
      peakOverall: 0,
      peakAge: 15,
      form: "steady",
      ratingHistory: [],
      reputation: 4,
      fatigue: 0,
      clubId: club.id,
      clubName: club.name,
      clubCode: club.code,
      clubBadge: club.badge,
      clubRating: club.rating,
      league: "U18 Premier League",
      squadLevel: "academy",
      contract: {
        weeklyWage: 120,
        role: club.rating >= 87 ? "Squad" : club.rating >= 80 ? "Rotation" : "Starter",
        length: 2,
        positionRole: `${position} development pathway`,
      },
      careerStats: emptySeasonStats(),
    };
    player.peakOverall = player.overall;
    const fixtures = buildSeasonFixtures(clubs, club, 2026, seed, player.league);
    const now = Date.now();
    return {
      version: VERSION,
      id: `career-${seed.toString(36)}-${now.toString(36)}`,
      seed,
      actionIndex: 0,
      createdAt: now,
      updatedAt: now,
      player,
      world: { clubs },
      season: {
        number: 1,
        label: "2026/27",
        startYear: 2026,
        currentDate: "2026-08-01",
        status: "active",
        fixtures,
        stats: emptySeasonStats(),
        trophies: [],
        continentalPoints: 0,
        endSummary: null,
      },
      training: { points: 0, completedWeeks: [], latestSession: null },
      coins: { balance: 10, lastDailyClaim: "2026-01-01", objective: objectiveFor(position, seed) },
      news: initialNews(player, club),
      history: [],
      transfer: null,
    };
  }

  function playerClub(state) {
    return state.world.clubs.find((club) => club.id === state.player.clubId) || normalizeClub({
      id: state.player.clubId,
      name: state.player.clubName,
      code: state.player.clubCode,
      rating: state.player.clubRating,
      badge: state.player.clubBadge,
    });
  }

  function nextFixture(state) {
    return state.season.fixtures.find((fixture) => fixture.status === "scheduled" && !fixture.result) || null;
  }

  function monthGroups(state) {
    const groups = [];
    state.season.fixtures.filter((fixture) => fixture.status !== "cancelled").forEach((fixture) => {
      let group = groups.find((entry) => entry.key === fixture.month);
      if (!group) {
        const [year, month] = fixture.month.split("-").map(Number);
        group = { key: fixture.month, label: `${MONTH_NAMES[month - 1]} ${year}`, fixtures: [] };
        groups.push(group);
      }
      group.fixtures.push(fixture);
    });
    return groups;
  }

  function appearanceChance(player) {
    const byRole = { Starter: 0.88, Rotation: 0.68, Squad: 0.46 };
    const base = byRole[player.contract?.role] || 0.58;
    const form = player.form === "hot" ? 0.08 : player.form === "cold" ? -0.09 : 0;
    const fatigue = Number(player.fatigue || 0) > 70 ? -0.18 : Number(player.fatigue || 0) > 45 ? -0.08 : 0;
    return clamp(base + form + fatigue, 0.24, 0.96);
  }

  function formFromRatings(ratings) {
    const usable = ratings.filter(Number.isFinite);
    const recentThree = usable.slice(-3);
    if (recentThree.length === 3 && recentThree.every((rating) => rating >= 7.5)) return "hot";
    if (recentThree.length === 3 && recentThree.every((rating) => rating < 6)) return "cold";
    const recent = usable.slice(-6);
    if (recent.length >= 4) {
      const average = recent.reduce((total, rating) => total + rating, 0) / recent.length;
      const deviation = Math.sqrt(recent.reduce((total, rating) => total + (rating - average) ** 2, 0) / recent.length);
      if (deviation <= 0.48) return "consistent";
      if (deviation >= 1.15) return "inconsistent";
    }
    return "steady";
  }

  function goalMinute(random, used) {
    let minute = randomInteger(random, 3, 89);
    while (used.has(minute)) minute = minute >= 89 ? 3 : minute + 1;
    used.add(minute);
    return minute;
  }

  function simulateScore(random, homeRating, awayRating, knockout) {
    const ratingGap = (homeRating - awayRating) / 28;
    const homeXg = clamp(1.32 + ratingGap + 0.18 + (random() - 0.5) * 0.32, 0.25, 3.5);
    const awayXg = clamp(1.17 - ratingGap + (random() - 0.5) * 0.32, 0.2, 3.3);
    let homeGoals = poisson(homeXg, random);
    let awayGoals = poisson(awayXg, random);
    let penalties = null;
    let extraTime = false;
    if (knockout && homeGoals === awayGoals) {
      extraTime = true;
      if (random() < 0.62) {
        if (random() < 0.5) homeGoals += 1;
        else awayGoals += 1;
      } else {
        const homePenalties = randomInteger(random, 3, 6);
        let awayPenalties = randomInteger(random, 3, 6);
        if (awayPenalties === homePenalties) awayPenalties = homePenalties === 6 ? 5 : homePenalties + 1;
        penalties = { home: homePenalties, away: awayPenalties };
      }
    }
    const homeShots = Math.max(homeGoals, randomInteger(random, 7, 17));
    const awayShots = Math.max(awayGoals, randomInteger(random, 6, 16));
    return {
      homeGoals,
      awayGoals,
      homeXg: round(homeXg, 2),
      awayXg: round(awayXg, 2),
      homeShots,
      awayShots,
      homeOnTarget: clamp(randomInteger(random, homeGoals, Math.max(homeGoals, Math.ceil(homeShots * 0.62))), homeGoals, homeShots),
      awayOnTarget: clamp(randomInteger(random, awayGoals, Math.max(awayGoals, Math.ceil(awayShots * 0.62))), awayGoals, awayShots),
      homePossession: clamp(Math.round(51 + ratingGap * 5 + (random() - 0.5) * 12), 32, 68),
      extraTime,
      penalties,
    };
  }

  function matchWonByPlayer(fixture, score, clubId) {
    if (score.penalties && score.homeGoals === score.awayGoals) {
      return fixture.homeClubId === clubId ? score.penalties.home > score.penalties.away : score.penalties.away > score.penalties.home;
    }
    const playerGoals = fixture.homeClubId === clubId ? score.homeGoals : score.awayGoals;
    const opponentGoals = fixture.homeClubId === clubId ? score.awayGoals : score.homeGoals;
    return playerGoals > opponentGoals;
  }

  function matchDrawn(score) {
    return !score.penalties && score.homeGoals === score.awayGoals;
  }

  function playerContribution(random, player, teamGoals, opponentOnTarget, conceded, started) {
    const position = player.position;
    const attackShare = { GK: 0.01, CB: 0.04, LB: 0.06, RB: 0.06, CDM: 0.08, CM: 0.12, CAM: 0.22, LW: 0.28, RW: 0.28, ST: 0.38 }[position] || 0.12;
    const assistShare = { GK: 0.01, CB: 0.03, LB: 0.14, RB: 0.14, CDM: 0.15, CM: 0.25, CAM: 0.32, LW: 0.25, RW: 0.25, ST: 0.13 }[position] || 0.14;
    let goals = 0;
    let assists = 0;
    for (let index = 0; index < teamGoals; index += 1) {
      if (random() < attackShare + (player.attributes.shooting - 45) * 0.006) goals += 1;
      else if (random() < assistShare + (player.attributes.passing - 45) * 0.006) assists += 1;
    }
    goals = Math.min(teamGoals, goals);
    assists = Math.min(Math.max(0, teamGoals - goals), assists);
    const defensive = ["GK", "CB", "LB", "RB", "CDM"].includes(position);
    const saves = position === "GK" ? Math.max(0, opponentOnTarget - conceded) : 0;
    const tackles = position === "GK" ? 0 : randomInteger(random, defensive ? 2 : 0, defensive ? 7 : 4);
    const dribbles = position === "GK" ? 0 : randomInteger(random, ["CAM", "LW", "RW", "ST"].includes(position) ? 2 : 0, ["CAM", "LW", "RW", "ST"].includes(position) ? 8 : 5);
    const minutes = started ? randomInteger(random, 72, 96) : randomInteger(random, 16, 43);
    return { goals, assists, saves, tackles, dribbles, minutes };
  }

  function performanceRating(random, state, contribution, teamGoals, conceded, won, started) {
    const player = state.player;
    const keyQuality = calculateOverall(player.position, player.attributes);
    let rating = 6.05 + (keyQuality - 48) * 0.025 + (random() - 0.5) * 1.55;
    rating += contribution.goals * 1.05 + contribution.assists * 0.68;
    rating += Math.min(0.8, contribution.saves * 0.09) + Math.min(0.45, contribution.tackles * 0.055) + Math.min(0.4, contribution.dribbles * 0.045);
    if (player.position === "GK" && conceded === 0) rating += 0.62;
    if (["CB", "LB", "RB", "CDM"].includes(player.position) && conceded === 0) rating += 0.35;
    if (won) rating += 0.22;
    if (!started) rating -= 0.12;
    if (teamGoals === 0 && ["CAM", "LW", "RW", "ST"].includes(player.position)) rating -= 0.18;
    rating -= Number(player.fatigue || 0) > 65 ? 0.42 : Number(player.fatigue || 0) > 40 ? 0.18 : 0;
    return clamp(round(rating, 1), 4, 10);
  }

  function commentaryForMatch(random, state, fixture, score, appeared, contribution, rating) {
    const player = state.player;
    const club = playerClub(state);
    const homeName = fixture.homeClubName;
    const awayName = fixture.awayClubName;
    const playerSide = fixture.homeClubId === club.id ? "home" : "away";
    const used = new Set();
    const events = [
      { minute: 0, type: "kickoff", importance: "major", text: `Kick-off: ${homeName} face ${awayName}.` },
      { minute: 7, type: "build-up", importance: "normal", text: `${homeName} settle into possession and look for an early opening.` },
    ];
    if (!appeared) {
      events.push({ minute: 18, type: "selection", importance: "normal", text: `${player.fullName} watches from the bench as the match takes shape.` });
    } else {
      const actionMinute = randomInteger(random, 8, 22);
      if (player.position === "GK") events.push({ minute: actionMinute, type: "save", importance: "notable", text: `${player.fullName} reads the shot early and makes a firm save.` });
      else if (["CB", "LB", "RB", "CDM"].includes(player.position)) events.push({ minute: actionMinute, type: "tackle", importance: "notable", text: `${player.fullName} times the challenge perfectly and wins possession.` });
      else events.push({ minute: actionMinute, type: "dribble", importance: "notable", text: `${player.fullName} beats a defender and drives into the final third.` });
    }
    const goalEvents = [];
    const makeGoals = (side, count, teamName) => {
      for (let index = 0; index < count; index += 1) {
        const minute = goalMinute(random, used);
        const playerScores = appeared && side === playerSide && index < contribution.goals;
        const playerAssists = appeared && side === playerSide && !playerScores && index < contribution.goals + contribution.assists;
        const scorer = playerScores ? player.fullName : `${teamName} ${pick(random, ["forward", "midfielder", "captain", "winger"])}`;
        const assist = playerAssists ? `, created by ${player.fullName}` : "";
        goalEvents.push({ minute, type: "goal", importance: "goal", text: `GOAL! ${scorer} scores for ${teamName}${assist}.` });
      }
    };
    makeGoals("home", score.homeGoals, homeName);
    makeGoals("away", score.awayGoals, awayName);
    events.push(...goalEvents);
    events.push({ minute: 45, type: "half-time", importance: "major", text: `Half-time at ${score.homeGoals || score.awayGoals ? "a lively ground" : "a tense contest"}.` });
    if (appeared) {
      const secondHalfMinute = randomInteger(random, 54, 78);
      if (player.position === "GK") events.push({ minute: secondHalfMinute, type: "save", importance: "notable", text: `${player.fullName} reacts sharply at close range and turns it away.` });
      else if (contribution.assists > 0) events.push({ minute: secondHalfMinute, type: "pass", importance: "notable", text: `${player.fullName} keeps finding space between the lines.` });
      else if (contribution.tackles >= 3) events.push({ minute: secondHalfMinute, type: "tackle", importance: "normal", text: `${player.fullName} wins another duel and launches the counter.` });
      else events.push({ minute: secondHalfMinute, type: "dribble", importance: "normal", text: `${player.fullName} carries the ball through pressure and keeps the move alive.` });
    }
    if (score.extraTime) events.push({ minute: 91, type: "extra-time", importance: "major", text: "Extra time is required after a level 90 minutes." });
    if (score.penalties) events.push({ minute: 121, type: "shootout", importance: "major", text: `${score.penalties.home}-${score.penalties.away} in the penalty shootout.` });
    events.push({ minute: score.extraTime ? 120 : 90, type: "full-time", importance: "major", text: `Full time: ${homeName} ${score.homeGoals}-${score.awayGoals} ${awayName}${appeared ? `. ${player.fullName} is rated ${rating.toFixed(1)}.` : "."}` });
    return events.sort((left, right) => left.minute - right.minute || (left.type === "full-time" ? 1 : -1));
  }

  function evaluateObjective(objective, result, won) {
    if (!objective || objective.complete || !result.appeared) return false;
    if (objective.type === "goal") return result.player.goals >= objective.target;
    if (objective.type === "assist") return result.player.assists >= objective.target;
    if (objective.type === "rating") return Number(result.player.rating) >= objective.target;
    if (objective.type === "cleanSheet") return result.player.cleanSheet;
    if (objective.type === "tackles") return result.player.tackles >= objective.target;
    if (objective.type === "win") return won;
    return false;
  }

  function pushNews(state, headline, body, tone = "standard") {
    state.news.unshift({
      id: `news-${state.actionIndex}-${stableHash(`${headline}:${state.season.currentDate}`)}`,
      date: state.season.currentDate,
      tone,
      headline,
      body,
    });
    state.news = state.news.slice(0, 24);
  }

  function updateAggregateStats(target, result, won, drawn) {
    if (!result.appeared) return;
    target.appearances += 1;
    if (result.player.started) target.starts += 1;
    target.goals += result.player.goals;
    target.assists += result.player.assists;
    target.cleanSheets += result.player.cleanSheet ? 1 : 0;
    target.saves += result.player.saves;
    target.tackles += result.player.tackles;
    target.dribbles += result.player.dribbles;
    target.minutes += result.player.minutes;
    target.ratingTotal = round(target.ratingTotal + result.player.rating, 2);
    target.averageRating = round(target.ratingTotal / target.appearances, 2);
    if (won) target.wins += 1;
    else if (drawn) target.draws += 1;
    else target.losses += 1;
  }

  function cancelFutureKnockoutFixtures(state, fixture) {
    state.season.fixtures.forEach((candidate) => {
      if (candidate.date > fixture.date && candidate.competition === fixture.competition && candidate.knockout && !candidate.result) {
        candidate.status = "cancelled";
      }
    });
  }

  function handleCompetitionProgress(state, fixture, score, won) {
    const club = playerClub(state);
    const playerGoals = fixture.homeClubId === club.id ? score.homeGoals : score.awayGoals;
    const opponentGoals = fixture.homeClubId === club.id ? score.awayGoals : score.homeGoals;
    if (fixture.competition === state.player.league) return;
    if (!fixture.knockout && fixture.competition.startsWith("UEFA")) {
      state.season.continentalPoints += won ? 3 : playerGoals === opponentGoals ? 1 : 0;
      const leaguePhaseRemaining = state.season.fixtures.some((candidate) => candidate.competition === fixture.competition && !candidate.knockout && candidate.status === "scheduled" && !candidate.result);
      if (!leaguePhaseRemaining && state.season.continentalPoints < 10) cancelFutureKnockoutFixtures(state, fixture);
      return;
    }
    if (fixture.knockout && !won) cancelFutureKnockoutFixtures(state, fixture);
    if (fixture.knockout && won && fixture.stage === "Final") {
      state.season.trophies.push(fixture.competition);
      const reward = fixture.competition.includes("Champions") ? 100 : fixture.competition.startsWith("UEFA") ? 75 : 50;
      state.coins.balance += reward;
      pushNews(state, `${state.player.clubName} lift the ${fixture.competition}`, `${state.player.fullName} ends the night with a winner's medal and earns ${reward} coins.`, "major");
    }
  }

  function transferOffers(state) {
    const random = randomFor(state, `transfers:${state.season.startYear}`);
    const current = playerClub(state);
    const average = Number(state.season.stats.averageRating || 6.2);
    const formBoost = state.player.form === "hot" ? 4 : state.player.form === "cold" ? -4 : 0;
    const interestCeiling = current.rating + clamp(Math.round((average - 6.4) * 4 + state.player.reputation / 18 + formBoost), -5, 9);
    const pool = shuffled(random, state.world.clubs.filter((club) => club.id !== current.id && club.rating <= interestCeiling + 4));
    const fallback = shuffled(random, state.world.clubs.filter((club) => club.id !== current.id));
    const unique = [...pool, ...fallback].filter((club, index, values) => values.findIndex((entry) => entry.id === club.id) === index).slice(0, 8);
    const selected = [];
    if (unique.length) selected.push(unique[Math.min(unique.length - 1, Math.floor(unique.length * 0.3))]);
    if (unique.length > 1) selected.push(unique[Math.min(unique.length - 1, Math.floor(unique.length * 0.62))]);
    if (unique.length > 2) selected.push([...unique].sort((left, right) => right.rating - left.rating)[0]);
    return selected.slice(0, 3).map((club, index) => {
      const role = roleForClub(state.player, club);
      const wageBase = 140 + state.player.overall * 11 + state.player.reputation * 7 + club.rating * 4;
      return {
        id: `offer-${state.season.startYear}-${index + 1}-${club.id}`,
        clubId: club.id,
        clubName: club.name,
        clubCode: club.code,
        clubBadge: club.badge,
        clubRating: club.rating,
        weeklyWage: Math.round((wageBase * (1 + index * 0.18) + randomInteger(random, 0, 180)) / 10) * 10,
        role,
        contractLength: randomInteger(random, 2, 5),
        positionRole: role === "Starter" ? `First-choice ${state.player.position}` : role === "Rotation" ? `${state.player.position} rotation option` : `${state.player.position} development role`,
        locked: index === 2,
      };
    });
  }

  function prepareSeasonEnd(state) {
    if (state.season.status === "transfer") return;
    state.season.status = "transfer";
    state.coins.balance += 50;
    const stats = state.season.stats;
    state.season.endSummary = {
      label: state.season.label,
      clubId: state.player.clubId,
      clubName: state.player.clubName,
      overall: state.player.overall,
      age: state.player.age,
      stats: clone(stats),
      trophies: [...state.season.trophies],
    };
    state.transfer = { offers: transferOffers(state), thirdUnlocked: false, rerolls: 0 };
    pushNews(state, "Contract decisions await", `The ${state.season.label} season is complete. Two clubs have made formal offers, with one additional option held back.`, "major");
  }

  function simulateFixture(source, fixtureId) {
    const state = clone(source);
    if (state.season.status !== "active") throw new Error("The season is not active.");
    const fixture = state.season.fixtures.find((candidate) => candidate.id === fixtureId);
    if (!fixture || fixture.status !== "scheduled" || fixture.result) throw new Error("That fixture cannot be played.");
    const club = playerClub(state);
    const opponent = state.world.clubs.find((candidate) => candidate.id === fixture.opponentId) || normalizeClub({ id: fixture.opponentId, name: fixture.opponentName, rating: club.rating });
    const random = randomFor(state, fixture.id);
    const homeRating = fixture.homeClubId === club.id ? club.rating : opponent.rating;
    const awayRating = fixture.awayClubId === club.id ? club.rating : opponent.rating;
    const score = simulateScore(random, homeRating, awayRating, fixture.knockout);
    const appeared = random() < appearanceChance(state.player);
    const started = appeared && random() < (state.player.contract.role === "Starter" ? 0.82 : state.player.contract.role === "Rotation" ? 0.48 : 0.25);
    const playerTeamGoals = fixture.homeClubId === club.id ? score.homeGoals : score.awayGoals;
    const conceded = fixture.homeClubId === club.id ? score.awayGoals : score.homeGoals;
    const opponentOnTarget = fixture.homeClubId === club.id ? score.awayOnTarget : score.homeOnTarget;
    const won = matchWonByPlayer(fixture, score, club.id);
    const drawn = matchDrawn(score);
    const contribution = appeared
      ? playerContribution(random, state.player, playerTeamGoals, opponentOnTarget, conceded, started)
      : { goals: 0, assists: 0, saves: 0, tackles: 0, dribbles: 0, minutes: 0 };
    const rating = appeared ? performanceRating(random, state, contribution, playerTeamGoals, conceded, won, started) : null;
    const result = {
      homeGoals: score.homeGoals,
      awayGoals: score.awayGoals,
      extraTime: score.extraTime,
      penalties: score.penalties,
      stats: {
        possession: [score.homePossession, 100 - score.homePossession],
        expectedGoals: [score.homeXg, score.awayXg],
        shots: [score.homeShots, score.awayShots],
        onTarget: [score.homeOnTarget, score.awayOnTarget],
      },
      appeared,
      player: {
        started,
        minutes: contribution.minutes,
        goals: contribution.goals,
        assists: contribution.assists,
        saves: contribution.saves,
        tackles: contribution.tackles,
        dribbles: contribution.dribbles,
        cleanSheet: appeared && conceded === 0,
        rating,
      },
      commentary: commentaryForMatch(random, state, fixture, score, appeared, contribution, rating || 0),
      playedAt: Date.now(),
    };
    fixture.result = result;
    fixture.status = "played";
    state.season.currentDate = fixture.date;
    state.player.fatigue = clamp(Math.round(Number(state.player.fatigue || 0) * 0.62 + (appeared ? contribution.minutes / 8 : 0)), 0, 100);
    if (appeared) {
      state.player.ratingHistory = [...state.player.ratingHistory, rating].slice(-10);
      state.player.form = formFromRatings(state.player.ratingHistory);
      const reputationChange = rating >= 8 ? 3 : rating >= 7 ? 1 : rating < 5.8 ? -1 : 0;
      state.player.reputation = clamp(state.player.reputation + reputationChange, 0, 100);
      updateAggregateStats(state.season.stats, result, won, drawn);
      updateAggregateStats(state.player.careerStats, result, won, drawn);
      if (rating >= 8) pushNews(state, `${state.player.fullName} named in Team of the Week`, `A ${rating.toFixed(1)} performance has put the ${state.player.position} among the weekend's standout academy players.`, "positive");
      if (state.player.form === "hot") pushNews(state, `Scouts track ${state.player.fullName}'s hot streak`, "Representatives from rival Premier League clubs were in attendance after a third elite performance in a row.", "positive");
      if (state.player.form === "cold") pushNews(state, "Coaches back youngster to respond", `${state.player.fullName}'s recent ratings have dipped, but the staff insist patience is part of the development plan.`, "warning");
    }
    if (evaluateObjective(state.coins.objective, result, won)) {
      state.coins.objective.complete = true;
      state.coins.balance += Number(state.coins.objective.reward || 25);
      pushNews(state, "Daily objective complete", `${state.coins.objective.label} · ${state.coins.objective.reward} coins earned.`, "positive");
    }
    handleCompetitionProgress(state, fixture, score, won);
    state.actionIndex += 1;
    state.updatedAt = Date.now();
    if (!nextFixture(state)) prepareSeasonEnd(state);
    return { state, result, fixture: clone(fixture) };
  }

  function simulateMonth(source, monthKey) {
    let state = clone(source);
    const results = [];
    const fixtures = state.season.fixtures.filter((fixture) => fixture.month === monthKey && fixture.status === "scheduled" && !fixture.result);
    for (const fixture of fixtures) {
      if (state.season.status !== "active") break;
      const outcome = simulateFixture(state, fixture.id);
      state = outcome.state;
      results.push({ fixture: outcome.fixture, result: outcome.result });
    }
    return { state, results };
  }

  function trainingCost(rating) {
    const value = Number(rating || 0);
    if (value < 60) return 3;
    if (value < 70) return 5;
    if (value < 80) return 8;
    if (value < 85) return 12;
    return 18 + Math.floor((value - 85) / 2) * 2;
  }

  function currentTrainingWeek(state) {
    return weekKey(nextFixture(state)?.date || state.season.currentDate);
  }

  function runTraining(source, focus, effort) {
    const state = clone(source);
    if (state.season.status !== "active") throw new Error("Training resumes when the next season starts.");
    if (!ATTRIBUTES.includes(focus)) throw new Error("Choose a valid training focus.");
    if (!Object.hasOwn(EFFORTS, effort)) throw new Error("Choose a valid effort level.");
    const currentWeek = currentTrainingWeek(state);
    if (state.training.completedWeeks.includes(currentWeek)) throw new Error("This week's training session is already complete.");
    const random = randomFor(state, `training:${currentWeek}:${focus}:${effort}`);
    const config = EFFORTS[effort];
    const performanceBonus = state.player.form === "hot" ? 2 : state.player.form === "cold" ? 0 : 1;
    const earned = config.basePoints + performanceBonus + randomInteger(random, 0, effort === "intense" ? 2 : 1);
    state.training.points += earned;
    state.training.completedWeeks.push(currentWeek);
    state.training.latestSession = { week: currentWeek, focus, effort, earned, completedAt: Date.now() };
    state.player.fatigue = clamp(state.player.fatigue + config.fatigue, 0, 100);
    state.actionIndex += 1;
    state.updatedAt = Date.now();
    pushNews(state, `${config.label} ${focus} session completed`, `${state.player.fullName} banked ${earned} Training Points.`, "standard");
    return { state, earned };
  }

  function upgradeAttribute(source, attribute) {
    const state = clone(source);
    if (!ATTRIBUTES.includes(attribute)) throw new Error("Choose a valid attribute.");
    const current = Number(state.player.attributes[attribute] || 0);
    if (current >= 99) throw new Error("That attribute is already maxed out.");
    const cost = trainingCost(current);
    if (state.training.points < cost) throw new Error(`You need ${cost} Training Points.`);
    state.training.points -= cost;
    state.player.attributes[attribute] = current + 1;
    state.player.overall = calculateOverall(state.player.position, state.player.attributes);
    if (state.player.overall > state.player.peakOverall) {
      state.player.peakOverall = state.player.overall;
      state.player.peakAge = state.player.age;
    }
    state.actionIndex += 1;
    state.updatedAt = Date.now();
    return { state, cost };
  }

  function buyAttributeBoost(source, attribute) {
    const state = clone(source);
    if (!ATTRIBUTES.includes(attribute)) throw new Error("Choose a valid attribute.");
    if (state.coins.balance < 50) throw new Error("You need 50 coins.");
    if (state.player.attributes[attribute] >= 99) throw new Error("That attribute is already maxed out.");
    state.coins.balance -= 50;
    state.player.attributes[attribute] += 1;
    state.player.overall = calculateOverall(state.player.position, state.player.attributes);
    state.player.peakOverall = Math.max(state.player.peakOverall, state.player.overall);
    if (state.player.peakOverall === state.player.overall) state.player.peakAge = state.player.age;
    state.actionIndex += 1;
    state.updatedAt = Date.now();
    return state;
  }

  function claimDailyLogin(source, dateKeyValue) {
    const state = clone(source);
    const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(String(dateKeyValue || "")) ? String(dateKeyValue) : new Date().toISOString().slice(0, 10);
    if (state.coins.lastDailyClaim === dateKey) return { state, claimed: false };
    state.coins.lastDailyClaim = dateKey;
    state.coins.balance += 10;
    state.updatedAt = Date.now();
    pushNews(state, "Daily login reward", "10 coins have been added to your career balance.", "positive");
    return { state, claimed: true };
  }

  function unlockThirdOffer(source) {
    const state = clone(source);
    if (state.season.status !== "transfer" || !state.transfer) throw new Error("There are no transfer offers to unlock.");
    if (state.transfer.thirdUnlocked) return state;
    if (state.coins.balance < 100) throw new Error("You need 100 coins to unlock the third offer.");
    state.coins.balance -= 100;
    state.transfer.thirdUnlocked = true;
    state.transfer.offers.forEach((offer, index) => { offer.locked = index === 2 ? false : offer.locked; });
    state.updatedAt = Date.now();
    return state;
  }

  function unlockThirdOfferByReward(source) {
    const state = clone(source);
    if (state.season.status !== "transfer" || !state.transfer) throw new Error("There are no transfer offers to unlock.");
    state.transfer.thirdUnlocked = true;
    state.transfer.offers.forEach((offer, index) => { offer.locked = index === 2 ? false : offer.locked; });
    state.updatedAt = Date.now();
    return state;
  }

  function rerollOffers(source) {
    const state = clone(source);
    if (state.season.status !== "transfer" || !state.transfer) throw new Error("There are no offers to reroll.");
    if (state.coins.balance < 40) throw new Error("You need 40 coins to reroll your offers.");
    state.coins.balance -= 40;
    state.actionIndex += 1;
    state.transfer.rerolls += 1;
    state.transfer.offers = transferOffers(state).map((offer, index) => ({ ...offer, locked: index === 2 && !state.transfer.thirdUnlocked }));
    state.updatedAt = Date.now();
    return state;
  }

  function automaticDevelopment(state) {
    const average = Number(state.season.stats.averageRating || 6.2);
    const age = Number(state.player.age || 15);
    let budget = age <= 21 ? 4 : age <= 25 ? 3 : age <= 29 ? 2 : age <= 32 ? 1 : -2;
    budget += average >= 7.4 ? 2 : average >= 6.8 ? 1 : average < 6 ? -1 : 0;
    const random = randomFor(state, `development:${state.season.startYear}`);
    if (budget >= 0) {
      for (let index = 0; index < budget; index += 1) {
        const attribute = pick(random, ATTRIBUTES);
        state.player.attributes[attribute] = clamp(state.player.attributes[attribute] + 1, 1, 99);
      }
    } else {
      for (let index = 0; index < Math.abs(budget); index += 1) {
        const attribute = pick(random, ATTRIBUTES);
        state.player.attributes[attribute] = clamp(state.player.attributes[attribute] - 1, 1, 99);
      }
    }
    state.player.overall = calculateOverall(state.player.position, state.player.attributes);
    if (state.player.overall > state.player.peakOverall) {
      state.player.peakOverall = state.player.overall;
      state.player.peakAge = state.player.age + 1;
    }
  }

  function beginNextSeason(source, offerId = "stay") {
    const state = clone(source);
    if (state.season.status !== "transfer" || !state.transfer) throw new Error("Finish the season before choosing a contract.");
    const current = playerClub(state);
    let selectedClub = current;
    let contract = {
      weeklyWage: Math.round(Number(state.player.contract.weeklyWage || 120) * 1.2 / 10) * 10,
      role: roleForClub(state.player, current),
      length: Math.max(1, Number(state.player.contract.length || 2)),
      positionRole: `${state.player.position} development pathway`,
    };
    if (offerId !== "stay") {
      const offer = state.transfer.offers.find((candidate) => candidate.id === offerId);
      if (!offer) throw new Error("Choose a valid contract offer.");
      if (offer.locked && !state.transfer.thirdUnlocked) throw new Error("Unlock the third offer first.");
      selectedClub = state.world.clubs.find((club) => club.id === offer.clubId) || normalizeClub(offer);
      contract = {
        weeklyWage: offer.weeklyWage,
        role: offer.role,
        length: offer.contractLength,
        positionRole: offer.positionRole,
      };
    }
    state.history.push(clone(state.season.endSummary));
    automaticDevelopment(state);
    state.player.age += 1;
    state.player.clubId = selectedClub.id;
    state.player.clubName = selectedClub.name;
    state.player.clubCode = selectedClub.code;
    state.player.clubBadge = selectedClub.badge;
    state.player.clubRating = selectedClub.rating;
    state.player.league = leagueForClub(state.player, selectedClub);
    state.player.squadLevel = state.player.league.startsWith("U18") ? "academy" : "senior";
    state.player.contract = contract;
    state.player.ratingHistory = [];
    state.player.form = "steady";
    state.player.fatigue = 0;
    const startYear = state.season.startYear + 1;
    state.season = {
      number: state.season.number + 1,
      label: `${startYear}/${String(startYear + 1).slice(-2)}`,
      startYear,
      currentDate: isoDate(startYear, 8, 1),
      status: "active",
      fixtures: buildSeasonFixtures(state.world.clubs, selectedClub, startYear, state.seed + state.actionIndex + 1, state.player.league),
      stats: emptySeasonStats(),
      trophies: [],
      continentalPoints: 0,
      endSummary: null,
    };
    state.training.completedWeeks = [];
    state.training.latestSession = null;
    state.coins.objective = objectiveFor(state.player.position, state.seed + startYear);
    state.transfer = null;
    state.actionIndex += 1;
    state.updatedAt = Date.now();
    pushNews(state, offerId === "stay" ? `${state.player.fullName} commits to ${selectedClub.name}` : `${state.player.fullName} completes ${selectedClub.name} move`, `${contract.role} role · £${contract.weeklyWage.toLocaleString("en-GB")} per week · ${contract.length}-year deal.`, "major");
    return state;
  }

  function careerSummary(state) {
    const season = state.season;
    return {
      id: state.id,
      playerName: state.player.fullName,
      nationality: clone(state.player.nationality),
      position: state.player.position,
      age: state.player.age,
      overall: state.player.overall,
      clubId: state.player.clubId,
      clubName: state.player.clubName,
      clubBadge: state.player.clubBadge,
      league: state.player.league,
      form: state.player.form,
      season: season.label,
      stats: clone(season.stats),
      updatedAt: state.updatedAt,
    };
  }

  function validate(state) {
    return Boolean(
      state
      && Number(state.version) === VERSION
      && typeof state.id === "string"
      && typeof state.player?.fullName === "string"
      && POSITIONS.includes(state.player?.position)
      && FEET.includes(state.player?.preferredFoot)
      && ATTRIBUTES.every((key) => Number.isFinite(Number(state.player?.attributes?.[key])))
      && Array.isArray(state.world?.clubs)
      && state.world.clubs.length >= 8
      && Array.isArray(state.season?.fixtures)
      && Array.isArray(state.news)
      && Array.isArray(state.history)
    );
  }

  global.PlayerCareerEngine = Object.freeze({
    VERSION,
    POSITIONS,
    FEET,
    ATTRIBUTES,
    EFFORTS,
    academyOptions,
    beginNextSeason,
    buyAttributeBoost,
    calculateOverall,
    careerSummary,
    claimDailyLogin,
    createCareer,
    currentTrainingWeek,
    dateLabel,
    dateMonthKey,
    formFromRatings,
    monthGroups,
    nextFixture,
    normalizeClubs,
    rerollOffers,
    runTraining,
    simulateFixture,
    simulateMonth,
    trainingCost,
    unlockThirdOffer,
    unlockThirdOfferByReward,
    upgradeAttribute,
    validate,
  });
})(globalThis);
