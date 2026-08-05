const LEGACY_FORMATIONS = Object.freeze({
  "433": {
    label: "4-3-3",
    lines: [["LW", "ST", "RW"], ["CM1", "CM2", "CM3"], ["LB", "CB1", "CB2", "RB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LB", label: "LB", accepts: ["LB", "LWB"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "RB", label: "RB", accepts: ["RB", "RWB"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM3", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "LW", label: "LW", accepts: ["LW", "LM"] },
      { id: "ST", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "RW", label: "RW", accepts: ["RW", "RM"] },
    ],
  },
  "442": {
    label: "4-4-2",
    lines: [["ST1", "ST2"], ["LM", "CM1", "CM2", "RM"], ["LB", "CB1", "CB2", "RB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LB", label: "LB", accepts: ["LB", "LWB"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "RB", label: "RB", accepts: ["RB", "RWB"] },
      { id: "LM", label: "LM", accepts: ["LM", "LW"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "RM", label: "RM", accepts: ["RM", "RW"] },
      { id: "ST1", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "ST2", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "352": {
    label: "3-5-2",
    lines: [["ST1", "ST2"], ["LM", "CM1", "CM2", "CAM", "RM"], ["CB1", "CB2", "CB3"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "CB3", label: "CB", accepts: ["CB"] },
      { id: "LM", label: "LM", accepts: ["LM", "LW", "LWB"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CAM", label: "CAM", accepts: ["CAM", "CM", "SS"] },
      { id: "RM", label: "RM", accepts: ["RM", "RW", "RWB"] },
      { id: "ST1", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "ST2", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "532": {
    label: "5-3-2",
    lines: [["ST1", "ST2"], ["CM1", "CM2", "CM3"], ["LWB", "CB1", "CB2", "CB3", "RWB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LWB", label: "LWB", accepts: ["LB", "LWB", "LM"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "CB3", label: "CB", accepts: ["CB"] },
      { id: "RWB", label: "RWB", accepts: ["RB", "RWB", "RM"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM3", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "ST1", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "ST2", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "4231": {
    label: "4-2-3-1",
    lines: [["ST"], ["LM", "CAM", "RM"], ["CDM1", "CDM2"], ["LB", "CB1", "CB2", "RB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LB", label: "LB", accepts: ["LB", "LWB"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "RB", label: "RB", accepts: ["RB", "RWB"] },
      { id: "CDM1", label: "CDM", accepts: ["CDM", "CM"] },
      { id: "CDM2", label: "CDM", accepts: ["CDM", "CM"] },
      { id: "LM", label: "LM", accepts: ["LM", "LW", "CAM"] },
      { id: "CAM", label: "CAM", accepts: ["CAM", "CM", "SS"] },
      { id: "RM", label: "RM", accepts: ["RM", "RW", "CAM"] },
      { id: "ST", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "41212": {
    label: "4-1-2-1-2",
    lines: [["ST1", "ST2"], ["CAM"], ["CM1", "CM2"], ["CDM"], ["LB", "CB1", "CB2", "RB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LB", label: "LB", accepts: ["LB", "LWB"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "RB", label: "RB", accepts: ["RB", "RWB"] },
      { id: "CDM", label: "CDM", accepts: ["CDM", "CM"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CAM", label: "CAM", accepts: ["CAM", "CM", "SS"] },
      { id: "ST1", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "ST2", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "4321": {
    label: "4-3-2-1",
    lines: [["ST"], ["LF", "RF"], ["CM1", "CM2", "CM3"], ["LB", "CB1", "CB2", "RB"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "LB", label: "LB", accepts: ["LB", "LWB"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "RB", label: "RB", accepts: ["RB", "RWB"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM3", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "LF", label: "CF", accepts: ["CF", "SS", "LW", "CAM"] },
      { id: "RF", label: "CF", accepts: ["CF", "SS", "RW", "CAM"] },
      { id: "ST", label: "ST", accepts: ["ST", "CF", "SS"] },
    ],
  },
  "343": {
    label: "3-4-3",
    lines: [["LW", "ST", "RW"], ["LM", "CM1", "CM2", "RM"], ["CB1", "CB2", "CB3"], ["GK"]],
    slots: [
      { id: "GK", label: "GK", accepts: ["GK"] },
      { id: "CB1", label: "CB", accepts: ["CB"] },
      { id: "CB2", label: "CB", accepts: ["CB"] },
      { id: "CB3", label: "CB", accepts: ["CB"] },
      { id: "LM", label: "LM", accepts: ["LM", "LW", "LWB"] },
      { id: "CM1", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "CM2", label: "CM", accepts: ["CM", "CDM", "CAM"] },
      { id: "RM", label: "RM", accepts: ["RM", "RW", "RWB"] },
      { id: "LW", label: "LW", accepts: ["LW", "LM", "CF"] },
      { id: "ST", label: "ST", accepts: ["ST", "CF", "SS"] },
      { id: "RW", label: "RW", accepts: ["RW", "RM", "CF"] },
    ],
  },
});
const LEGACY_SECONDARY_POSITION_PENALTY = 2;
const LEGACY_OUT_OF_POSITION_PENALTY = 4;
let legacySetup = { mode: "classic", formationId: "433", nationId: "england", nationSearch: "" };
const LEGACY_DATABASE = window.LEGACY_HISTORIC_DATABASE || {};
const LEGACY_NATIONS = Object.freeze(Object.fromEntries(Object.entries(LEGACY_DATABASE).map(([nationId, nation]) => [
  nationId,
  {
    ...nation,
    squads: nation.squads.map((squad) => ({
      ...squad,
      players: squad.players.map((player) => ({
        ...player,
        id: `${nationId}-${squad.year}-${player.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        year: squad.year,
        position: player.primaryPosition,
        positions: [player.primaryPosition, ...(player.secondaryPositions || [])].filter(Boolean),
        rating: player.overall,
        stats: Number.isFinite(player.attack) && Number.isFinite(player.control) && Number.isFinite(player.defence) ? {
          attack: player.attack,
          control: player.control,
          defence: player.defence,
        } : null,
      })),
    })),
  },
])));
let legacyDraft = (() => {
  try {
    const raw = JSON.parse(localStorage.getItem("legacyDraftState"));
    if (raw && raw.nationId && LEGACY_NATIONS[raw.nationId]) {
      const nation = LEGACY_NATIONS[raw.nationId];
      const allPlayers = nation.squads.flatMap(s => s.players);
      const findPlayer = (id) => allPlayers.find(p => p.id === id) || null;
      const lineup = {};
      if (raw.lineupSlots) {
        for (const [slotId, playerId] of Object.entries(raw.lineupSlots)) {
          const p = findPlayer(playerId);
          if (p) lineup[slotId] = p;
        }
      }
      const currentSquad = nation.squads.find((squad) => squad.year === raw.currentSquadYear) || null;
      const restoredOffers = (raw.offerIds || []).map(findPlayer).filter(Boolean);
      return {
        nationId: raw.nationId,
        mode: raw.mode || "classic",
        formationId: raw.formationId || "433",
        round: raw.round || 1,
        lineup,
        draftedIds: [...new Set([...(raw.draftedIds || []), ...Object.values(lineup).map((player) => player.id)])],
        selectedOfferId: null,
        movingSlotId: null,
        currentSquad,
        yearTicker: raw.yearTicker || currentSquad?.year || null,
        spinning: false,
        revealOffers: Boolean(currentSquad && restoredOffers.length),
        offers: currentSquad ? restoredOffers.filter((player) => player.year === currentSquad.year) : [],
        tournament: raw.tournament || null,
        blockedMessage: null,
        complete: Boolean(raw.complete),
        respinsLeft: Number.isInteger(raw.respinsLeft) ? Math.max(0, Math.min(1, raw.respinsLeft)) : 1,
        seed: raw.seed || Math.floor(Math.random() * 1_000_000_000),
        nation,
      };
    }
  } catch { /* ignore corrupt save */ }
  return null;
})();

function saveLegacyDraft() {
  if (!legacyDraft) { localStorage.removeItem("legacyDraftState"); return; }
  const lineupSlots = {};
  for (const [slotId, player] of Object.entries(legacyDraft.lineup || {})) {
    lineupSlots[slotId] = player.id;
  }
  localStorage.setItem("legacyDraftState", JSON.stringify({
    nationId: legacyDraft.nationId,
    mode: legacyDraft.mode,
    formationId: legacyDraft.formationId,
    round: legacyDraft.round,
    lineupSlots,
    draftedIds: legacyDraft.draftedIds,
    currentSquadYear: legacyDraft.currentSquad?.year || null,
    yearTicker: legacyDraft.yearTicker || null,
    offerIds: (legacyDraft.offers || []).map((player) => player.id),
    complete: legacyDraft.complete,
    respinsLeft: legacyDraft.respinsLeft,
    seed: legacyDraft.seed,
    tournament: legacyDraft.tournament,
  }));
}
let legacySpinTimer = null;
let legacySpinFinishTimer = null;

const FLAG_CODE_OVERRIDES = {
  "GB-ENG": "gb-eng",
  "GB-SCT": "gb-sct",
  "GB-WLS": "gb-wls",
  "GB-NIR": "gb-nir",
};

const FLAG_IMAGE_OVERRIDES = {
  Belarus: "./assets/flags/belarus.svg?v=3",
  Yugoslavia: "./assets/retro-1998/yugoslavia.webp",
  Kurdistan: `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">
      <rect width="300" height="66.667" fill="#ed1c24"/>
      <rect y="66.667" width="300" height="66.666" fill="#fff"/>
      <rect y="133.333" width="300" height="66.667" fill="#278e43"/>
      <g fill="#f8d20f" transform="translate(150 100)">
        <circle r="25"/>
        <g>
          <path d="M0,-55 5,-28 -5,-28z"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(17.142857)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(34.285714)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(51.428571)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(68.571429)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(85.714286)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(102.857143)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(120)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(137.142857)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(154.285714)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(171.428571)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(188.571429)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(205.714286)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(222.857143)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(240)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(257.142857)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(274.285714)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(291.428571)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(308.571429)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(325.714286)"/>
          <path d="M0,-55 5,-28 -5,-28z" transform="rotate(342.857143)"/>
        </g>
      </g>
    </svg>
  `)}`,
  Somaliland: "./assets/flags/somaliland.svg",
};

const TOP_SHOOTOUT_TEAM_IDS = new Set(
  [...TEAMS]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 20)
    .map((team) => team.id),
);

const LEFT_FOOTED_PENALTY_TAKERS = new Set([
  "Lionel Messi",
  "Nicolás González",
  "Lamine Yamal",
  "Mikel Oyarzabal",
  "Mikel Merino",
  "Fabián Ruiz",
  "Michael Olise",
  "Bukayo Saka",
  "Noni Madueke",
  "Cole Palmer",
  "Phil Foden",
  "Ethan Nwaneri",
  "Max Dowman",
  "Raphinha",
  "Endrick",
  "Luiz Henrique",
  "Francisco Trincão",
  "Pedro Neto",
  "Francisco Conceição",
  "Romelu Lukaku",
  "Dodi Lukébakio",
  "Charles De Ketelaere",
  "Kai Havertz",
  "Ante Budimir",
  "Marco Pašalić",
  "Amine Adli",
  "Kōki Ogawa",
  "Takefusa Kubo",
  "Alejandro Zendejas",
  "Cavan Sullivan",
  "Santiago Giménez",
  "Guillermo Martínez",
  "Rasmus Højlund",
  "Micky van de Ven",
  "Luka Sučić",
  "Bruno Durdov",
  "Joško Gvardiol",
  "Carlos Forbs",
  "Antoine Griezmann",
  "Riyad Mahrez",
  "Hakim Ziyech",
  "Mohamed Salah",
  "Leroy Sané",
  "Bernardo Silva",
  "David Silva",
  "Jordi Alba",
  "Marc Cucurella",
  "Alejandro Grimaldo",
  "Federico Dimarco",
  "Riccardo Calafiori",
  "Luke Shaw",
  "Andrew Robertson",
  "Olivier Giroud",
  "Juan Mata",
  "Roberto Carlos",
  "Rivaldo",
  "Adriano",
  "Diego Maradona",
  "Mario Kempes",
  "Ashley Cole",
  "Mesut Özil",
  "Lukas Podolski",
  "Giorgio Chiellini",
  "Arjen Robben",
  "Robin van Persie",
  "Gareth Bale",
  "Du\u0161an Vlahovi\u0107",
  "James Rodr\u00edguez",
  "\u00c1ngel Di Mar\u00eda",
  "Alphonso Davies",
].map(repairPlayerText));

const TWO_FOOTED_PENALTY_TAKERS = new Set([
  "Ousmane Dembélé",
  "Ivan Perišić",
  "Brahim Díaz",
  "Son Heung-min",
  "Pedro",
  "Santi Cazorla",
].map(repairPlayerText));

const PREFERRED_FOOT_OVERRIDES = new Map([
  ["Erling Haaland", "left"],
  ["Mohamed Salah", "left"],
  ["Bukayo Saka", "left"],
  ["Phil Foden", "left"],
  ["Cole Palmer", "left"],
  ["Lamine Yamal", "left"],
  ["Lionel Messi", "left"],
  ["Michael Olise", "left"],
  ["Antoine Griezmann", "left"],
  ["Romelu Lukaku", "left"],
  ["Riyad Mahrez", "left"],
  ["Hakim Ziyech", "left"],
  ["Bernardo Silva", "left"],
  ["Raphinha", "left"],
  ["Ousmane Dembélé", "both"],
  ["Ivan Perišić", "both"],
  ["Brahim Díaz", "both"],
].map(([name, foot]) => [repairPlayerText(name), foot]));

function preferredPenaltyFoot(team, player, random) {
  const cleanedPlayer = repairPlayerText(player);
  const profile = playerProfilesForTeam(team).find((candidate) => repairPlayerText(candidate.name) === cleanedPlayer);
  if (PREFERRED_FOOT_OVERRIDES.has(cleanedPlayer)) return PREFERRED_FOOT_OVERRIDES.get(cleanedPlayer) === "both"
    ? random() < 0.5 ? "left" : "right"
    : PREFERRED_FOOT_OVERRIDES.get(cleanedPlayer);
  if (profile?.preferredFoot === "left") return "left";
  if (profile?.preferredFoot === "right") return "right";
  if (profile?.preferredFoot === "both") return random() < 0.5 ? "left" : "right";
  if (TWO_FOOTED_PENALTY_TAKERS.has(cleanedPlayer)) return random() < 0.5 ? "left" : "right";
  if (LEFT_FOOTED_PENALTY_TAKERS.has(cleanedPlayer)) return "left";
  if (profile?.generated) return stableHash(`${team.id}:${player}:foot`) % 5 === 0 ? "left" : "right";
  return "right";
}

function flagMarkup(team, className = "") {
  if (team?.uclClub && team?.badge) {
    const classes = ["country-flag", "pl-club-flag", "ucl-club-flag", className].filter(Boolean).join(" ");
    return `<span class="${classes}" data-team-id="${escapeHtml(team.id)}" role="img" aria-label="${escapeHtml(team.name)} badge"><img src="${team.badge}" alt="" loading="lazy" decoding="async" /></span>`;
  }
  if (team?.premierLeague && team?.badge) {
    const classes = ["country-flag", "pl-club-flag", className].filter(Boolean).join(" ");
    const fallback = `<span class="flag-fallback pl-club-code" aria-hidden="true">${escapeHtml(team.code || "PL")}</span>`;
    if (!premierLeagueAssetsInstalled) {
      return `<span class="${classes}" role="img" aria-label="${escapeHtml(team.name)} badge">${fallback}</span>`;
    }
    return `
      <span class="${classes}" role="img" aria-label="${escapeHtml(team.name)} badge">
        <img src="${team.badge}" alt="" loading="lazy" decoding="async" />
      </span>
    `;
  }
  if (team?.customFlag) {
    const isBadge = team.customFlagShape === "square";
    const classes = ["country-flag", "custom-uploaded-flag", isBadge ? "custom-uploaded-badge" : "", className].filter(Boolean).join(" ");
    return `<span class="${classes}" role="img" aria-label="${escapeHtml(team.name)} ${isBadge ? "badge" : "flag"}"><span class="flag-fallback" aria-hidden="true">${escapeHtml(team.flag || "⚑")}</span><img src="${team.customFlag}" alt="" loading="lazy" /></span>`;
  }
  const imageOverride = FLAG_IMAGE_OVERRIDES[team.name];
  const imageClassName = team.name === "Belarus" ? "flag-belarus" : "";
  const classes = ["country-flag", className, imageClassName].filter(Boolean).join(" ");
  const code = FLAG_CODE_OVERRIDES[team.code] || team.code.toLowerCase();
  const fallback = `<span class="flag-fallback" aria-hidden="true">${team.flag}</span>`;
  if (imageOverride) {
    return `
      <span class="${classes}" role="img" aria-label="${team.name} flag">
        ${fallback}
        <img src="${imageOverride}" alt="" loading="lazy" />
      </span>
    `;
  }
  if (code === "xx") {
    return `<span class="${classes}" role="img" aria-label="${team.name} flag">${fallback}</span>`;
  }
  return `
    <span class="${classes}" role="img" aria-label="${team.name} flag">
      ${fallback}
      <img
        src="https://flagcdn.com/w160/${code}.png"
        srcset="https://flagcdn.com/w320/${code}.png 2x"
        alt=""
        loading="lazy"
      />
    </span>
  `;
}

function premierLeagueResponsiveTeamName(team) {
  if (!state?.premierLeagueSeason || !team) return team?.name || "";
  const mobile = window.matchMedia?.("(max-width: 850px)")?.matches === true;
  const currentClub = window.PREMIER_LEAGUE_2026_27_CLUBS
    ?.find((club) => club.id === team.id);
  return mobile ? currentClub?.mobileName || team.mobileName || team.name : team.name;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function measureTeamName(element) {
  const label = element.querySelector("span");
  if (!label || !element.clientWidth) return;
  const overflow = Math.max(0, Math.ceil(label.scrollWidth - element.clientWidth));
  element.style.setProperty("--team-name-overflow", `${overflow}px`);
