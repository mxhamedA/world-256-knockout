const PREMIER_LEAGUE_2026_27_DATA_UPDATED = window.PREMIER_LEAGUE_2026_27_SQUADS_UPDATED || "8 August 2026";

const PREMIER_LEAGUE_2026_27_LATEST_TRANSFERS = Object.freeze([
  Object.freeze({
    player: "Ronald Araújo",
    fromName: "Barcelona",
    toId: "liverpool",
    toName: "Liverpool",
    date: "7 Aug 2026",
    sourceUrl: "https://cadenaser.com/nacional/2026/08/07/ronald-araujo-se-marcha-cedido-al-liverpool/",
  }),
  Object.freeze({
    player: "Bruno Guimarães",
    fromId: "newcastle-united",
    fromName: "Newcastle United",
    toId: "arsenal",
    toName: "Arsenal",
    date: "8 Aug 2026",
    sourceUrl: "https://cadenaser.com/nacional/2026/08/08/bruno-guimaraes-ficha-por-el-arsenal-por-87-millones-de-euros/",
  }),
  Object.freeze({
    player: "Ousmane Diomande",
    fromName: "Sporting CP",
    toId: "nottingham-forest",
    toName: "Nottingham Forest",
    date: "8 Aug 2026",
    sourceUrl: "https://www.nottinghamforest.news/2026/07/27/the-state-of-play-in-nottingham-forests-pursuit-of-sporting-cp-star-ousmane-diomande/",
  }),
  Object.freeze({
    player: "Christian Nørgaard",
    fromId: "arsenal",
    fromName: "Arsenal",
    toId: "everton",
    toName: "Everton",
    date: "5 Aug 2026",
    sourceUrl: "https://www.premierleague.com/en/transfers/2026-27/summer",
  }),
  Object.freeze({
    player: "Jordan Henderson",
    fromId: "brentford",
    fromName: "Brentford",
    toId: "chelsea",
    toName: "Chelsea",
    date: "3 Aug 2026",
    sourceUrl: "https://www.premierleague.com/en/transfers/2026-27/summer",
  }),
  Object.freeze({
    player: "Danny Welbeck",
    fromId: "brighton",
    fromName: "Brighton",
    toId: "chelsea",
    toName: "Chelsea",
    date: "2 Aug 2026",
    sourceUrl: "https://www.premierleague.com/en/transfers/2026-27/summer",
  }),
  Object.freeze({
    player: "Maxence Lacroix",
    fromId: "crystal-palace",
    fromName: "Crystal Palace",
    toId: "chelsea",
    toName: "Chelsea",
    date: "30 Jul 2026",
    sourceUrl: "https://www.chelseafc.com/en/news/article/maxence-lacroix-signs-for-chelsea",
  }),
  Object.freeze({
    player: "James Trafford",
    fromId: "manchester-city",
    fromName: "Manchester City",
    toId: "leeds-united",
    toName: "Leeds United",
    date: "29 Jul 2026",
    sourceUrl: "https://www.premierleague.com/en/transfers/2026-27/summer",
  }),
  Object.freeze({
    player: "Carl Rushworth",
    fromId: "brighton",
    fromName: "Brighton",
    toId: "coventry-city",
    toName: "Coventry City",
    date: "29 Jul 2026",
    sourceUrl: "https://www.premierleague.com/en/transfers/2026-27/summer",
  }),
  Object.freeze({
    player: "Harry Wilson",
    fromId: "fulham",
    fromName: "Fulham",
    toId: "leeds-united",
    toName: "Leeds United",
    date: "15 Jul 2026",
    sourceUrl: "https://www.premierleague.com/en/news/4679620/the-briefing-premier-league-duo-inspire-spain-haalands-fashion-show-and-more",
  }),
  Object.freeze({
    player: "Morgan Rogers",
    fromId: "aston-villa",
    fromName: "Aston Villa",
    toId: "chelsea",
    toName: "Chelsea",
    date: "21 Jul 2026",
    sourceUrl: "https://www.premierleague.com/en/news/4680249/why-have-chelsea-signed-rogers-and-what-does-he-bring",
  }),
  Object.freeze({
    player: "João Gomes",
    fromName: "Wolves",
    toId: "aston-villa",
    toName: "Aston Villa",
    date: "20 Jul 2026",
    sourceUrl: "https://www.premierleague.com/en/news/4680265/gomes-becomes-a-villan",
  }),
  Object.freeze({
    player: "Johan Manzambi",
    fromName: "Freiburg",
    toId: "aston-villa",
    toName: "Aston Villa",
    date: "18 Jul 2026",
    sourceUrl: "https://www.premierleague.com/en/news/4680006/manzambi-checks-in-at-bodymoor-heath",
  }),
  Object.freeze({
    player: "Youri Tielemans",
    fromId: "aston-villa",
    fromName: "Aston Villa",
    toId: "manchester-united",
    toName: "Manchester United",
    date: "14 Jul 2026",
    sourceUrl: "https://www.premierleague.com/en/news/4679511/man-utd-sign-youri-tielemans-from-aston-villa",
  }),
  Object.freeze({
    player: "Sandro Tonali",
    fromId: "newcastle-united",
    fromName: "Newcastle United",
    toId: "tottenham-hotspur",
    toName: "Tottenham Hotspur",
    date: "6 Jul 2026",
    sourceUrl: "https://www.premierleague.com/en/news/4678206/the-briefing-haalands-world-cup-heroics-spurs-welcome-special-tonali-and-more",
  }),
  Object.freeze({
    player: "Hayden Hackney",
    fromName: "Middlesbrough",
    toId: "everton",
    toName: "Everton",
    date: "3 Jul 2026",
    sourceUrl: "https://www.premierleague.com/en/news/4677798/the-premier-leagues-best-signings-from-the-efl",
  }),
  Object.freeze({
    player: "Mateus Fernandes",
    fromName: "West Ham United",
    toId: "tottenham-hotspur",
    toName: "Tottenham Hotspur",
    date: "2 Jul 2026",
    sourceUrl: "https://www.premierleague.com/en/news/4677623/the-briefing-big-day-of-transfers-premier-league-stars-reach-100-world-cup-goals-and-more",
  }),
  Object.freeze({
    player: "Elliot Anderson",
    fromId: "nottingham-forest",
    fromName: "Nottingham Forest",
    toId: "manchester-city",
    toName: "Manchester City",
    date: "2 Jul 2026",
    sourceUrl: "https://www.premierleague.com/en/news/4677648/man-city-reach-agreement-to-sign-anderson-from-nottingham-forest",
  }),
]);

const plPlayer = (name, position, overall, extra = {}) => Object.freeze({
  name,
  position,
  overall,
  simulatorRating: true,
  ...extra,
});

const plDepth = (entries) => Object.freeze(
  entries.map(([name, position, overall]) => plPlayer(name, position, overall)),
);

const normalizePremierLeaguePlayerRating = (value) => Math.max(
  67,
  Math.min(91, Math.round(67 + (Number(value || 64) - 64) * 0.8)),
);

const PREMIER_LEAGUE_2026_27_PLAYER_RATING_OVERRIDES = Object.freeze({
  "Gianluigi Donnarumma": 89,
  "James Trafford": 80,
  "Nico O'Reilly": 84,
  "Phil Foden": 85,
  "Elliot Anderson": 85,
  "Ronald Araújo": 87,
  "Ousmane Diomande": 82,
  "Bruno Guimarães Rodriguez Moura": 87,
});

// Completed 2026/27 moves kept as a defensive overlay. The generated FPL feed
// is authoritative when it already contains the move; this list also protects
// the simulator if a provider snapshot briefly lags behind an official deal.
const PREMIER_LEAGUE_2026_27_SQUAD_TRANSFERS = Object.freeze([
  Object.freeze({ player: "Danny Welbeck", fromId: "brighton", toId: "chelsea" }),
  Object.freeze({ player: "Maxence Lacroix", fromId: "crystal-palace", toId: "chelsea" }),
  Object.freeze({ player: "Jordan Henderson", fromId: "brentford", toId: "chelsea" }),
  Object.freeze({ player: "Carl Rushworth", fromId: "brighton", toId: "coventry-city" }),
  Object.freeze({ player: "Christian Nørgaard", fromId: "arsenal", toId: "everton" }),
  Object.freeze({ player: "James Trafford", fromId: "manchester-city", toId: "leeds-united" }),
  Object.freeze({ player: "Morgan Rogers", fromId: "aston-villa", toId: "chelsea" }),
  Object.freeze({ player: "Harry Wilson", fromId: "fulham", toId: "leeds-united" }),
  Object.freeze({ player: "Youri Tielemans", fromId: "aston-villa", toId: "manchester-united" }),
  Object.freeze({ player: "Sandro Tonali", fromId: "newcastle-united", toId: "tottenham-hotspur" }),
  Object.freeze({ player: "Elliot Anderson", fromId: "nottingham-forest", toId: "manchester-city" }),
  Object.freeze({ player: "Bruno Guimarães Rodriguez Moura", fromId: "newcastle-united", toId: "arsenal" }),
]);

// User-requested additions from outside the Premier League registration feed.
// Negative ids keep the simulator additions distinct from official FPL ids.
const PREMIER_LEAGUE_2026_27_MANUAL_SQUAD_ADDITIONS = Object.freeze([
  Object.freeze({
    toId: "liverpool",
    fplId: -1001,
    name: "Ronald Araújo",
    displayName: "Araújo",
    position: "CB",
    overall: 87,
  }),
  Object.freeze({
    toId: "nottingham-forest",
    fplId: -1002,
    name: "Ousmane Diomande",
    displayName: "Diomande",
    position: "CB",
    overall: 82,
  }),
]);

const normalizePremierLeaguePlayerName = (value) => String(value || "")
  .normalize("NFKD")
  .replace(/\p{Diacritic}/gu, "")
  .replace(/[^a-z0-9]+/gi, " ")
  .trim()
  .toLowerCase();

const premierLeaguePlayerNamesMatch = (candidateValue, targetValue) => {
  const candidate = normalizePremierLeaguePlayerName(candidateValue);
  const target = normalizePremierLeaguePlayerName(targetValue);
  if (!candidate || !target) return false;
  if (candidate === target) return true;
  const candidateTokens = candidate.split(/\s+/);
  const targetTokens = target.split(/\s+/);
  return targetTokens.every((token) => candidateTokens.includes(token))
    || candidateTokens.every((token) => targetTokens.includes(token));
};

const PREMIER_LEAGUE_PLAYER_DISPLAY_NAMES = Object.freeze({
  "ruben dos santos gato alves dias": "Rúben Dias",
  "bruno guimaraes rodriguez moura": "Bruno Guimarães",
  "andrey nascimento dos santos": "Andrey Santos",
  "estevao almeida de oliveira goncalves": "Estêvão",
});

const premierLeaguePlayerDisplayName = (value) => (
  PREMIER_LEAGUE_PLAYER_DISPLAY_NAMES[normalizePremierLeaguePlayerName(value)] || value
);

const PREMIER_LEAGUE_FC26_RATING_ENTRIES = Object.entries(window.PREMIER_LEAGUE_FC26_RATINGS || {})
  .map(([name, overall]) => [normalizePremierLeaguePlayerName(name), Number(overall)]);

function officialFc26RatingForPlayer(playerName) {
  const key = normalizePremierLeaguePlayerName(playerName);
  const exact = PREMIER_LEAGUE_FC26_RATING_ENTRIES.find(([candidate]) => candidate === key);
  if (exact) return exact[1];
  const tokens = key.split(/\s+/);
  const lastName = tokens.at(-1);
  if (!lastName || lastName.length < 4) return null;
  const candidates = PREMIER_LEAGUE_FC26_RATING_ENTRIES.filter(([candidate]) => {
    const candidateTokens = candidate.split(/\s+/);
    return candidateTokens.at(-1) === lastName
      || (candidate.length >= 5 && (candidate.includes(key) || key.includes(candidate)));
  });
  return candidates.length === 1 ? candidates[0][1] : null;
}

const PREMIER_LEAGUE_2026_27_PREFERRED_FORMATIONS = Object.freeze({
  arsenal: "4-3-3",
  "aston-villa": "4-2-3-1",
  bournemouth: "4-1-4-1",
  brentford: "4-2-3-1",
  brighton: "4-2-3-1",
  chelsea: "4-2-3-1",
  "coventry-city": "4-2-3-1",
  "crystal-palace": "3-4-2-1",
  everton: "4-2-3-1",
  fulham: "4-2-3-1",
  "hull-city": "4-2-3-1",
  "ipswich-town": "4-2-3-1",
  "leeds-united": "4-3-3",
  liverpool: "4-2-3-1",
  "manchester-city": "4-3-3",
  "manchester-united": "4-2-3-1",
  "newcastle-united": "4-3-3",
  "nottingham-forest": "4-2-3-1",
  sunderland: "4-3-3",
  "tottenham-hotspur": "4-3-3",
});

const PREMIER_LEAGUE_MOBILE_CLUB_NAMES = Object.freeze({
  brighton: "Brighton",
  "coventry-city": "Coventry",
  "hull-city": "Hull",
  "leeds-united": "Leeds",
  "manchester-city": "Man City",
  "manchester-united": "Man Utd",
  "newcastle-united": "Newcastle",
  "nottingham-forest": "Nott. Forest",
  "tottenham-hotspur": "Spurs",
});

const PREMIER_LEAGUE_2026_27_SQUAD_DEPTH = Object.freeze({
  arsenal: plDepth([
    ["Kepa Arrizabalaga", "GK", 82],
    ["Ben White", "RB", 84],
    ["Cristhian Mosquera", "CB", 82],
    ["Piero Hincapié", "CB", 83],
    ["Myles Lewis-Skelly", "LB", 82],
    ["Mikel Merino", "CM", 84],
    ["Gabriel Martinelli", "LW", 84],
    ["Leandro Trossard", "LW", 82],
  ]),
  "aston-villa": plDepth([
    ["Marco Bizot", "GK", 78],
    ["Lucas Digne", "LB", 80],
    ["Tyrone Mings", "CB", 80],
    ["Victor Lindelöf", "CB", 79],
    ["Andrés García", "RB", 77],
    ["Ross Barkley", "CM", 77],
    ["Emiliano Buendía", "CAM", 79],
    ["Evann Guessand", "RW", 80],
    ["Lamare Bogarde", "CDM", 75],
  ]),
  bournemouth: plDepth([
    ["Will Dennis", "GK", 72],
    ["Marcos Senesi", "CB", 81],
    ["Veljko Milosavljević", "CB", 75],
    ["Adam Smith", "RB", 75],
    ["Julio Soler", "LB", 75],
    ["Lewis Cook", "CM", 79],
    ["Ryan Christie", "CM", 78],
    ["Álex Jiménez", "RB", 77],
    ["Enes Ünal", "ST", 78],
    ["Junior Kroupi", "ST", 78],
  ]),
  brentford: plDepth([
    ["Hákon Valdimarsson", "GK", 76],
    ["Ellery Balcombe", "GK", 72],
    ["Kristoffer Ajer", "CB", 79],
    ["Ethan Pinnock", "CB", 79],
    ["Rico Henry", "LB", 77],
    ["Vitaly Janelt", "CDM", 78],
    ["Mathias Jensen", "CM", 78],
    ["Fábio Carvalho", "CAM", 78],
    ["Keane Lewis-Potter", "LW", 78],
    ["Frank Onyeka", "CM", 77],
  ]),
  brighton: plDepth([
    ["Jason Steele", "GK", 75],
    ["Carl Rushworth", "GK", 75],
    ["Joel Veltman", "RB", 78],
    ["Olivier Boscagli", "CB", 80],
    ["Yasin Ayari", "CM", 78],
    ["James Milner", "CM", 74],
    ["Solly March", "RW", 76],
    ["Brajan Gruda", "RW", 78],
    ["Stefanos Tzimas", "ST", 77],
  ]),
  chelsea: plDepth([
    ["Filip Jørgensen", "GK", 78],
    ["Tosin Adarabioyo", "CB", 79],
    ["Wesley Fofana", "CB", 81],
    ["Malo Gusto", "RB", 81],
    ["Romeo Lavia", "CDM", 82],
    ["Alejandro Garnacho", "LW", 82],
    ["Facundo Buonanotte", "CAM", 79],
    ["Tyrique George", "LW", 76],
    ["Josh Acheampong", "CB", 76],
  ]),
  "coventry-city": plDepth([
    ["Ben Wilson", "GK", 68],
    ["Jay Dasilva", "LB", 69],
    ["Joel Latibeaudiere", "CB", 70],
    ["Luis Binks", "CB", 68],
    ["Jamie Allen", "CM", 68],
    ["Brandon Thomas-Asante", "ST", 70],
    ["Fábio Tavares", "ST", 66],
    ["Raphael Borges Rodrigues", "LW", 68],
    ["Norman Bassette", "ST", 68],
    ["Kai Andrews", "CM", 66],
  ]),
  "crystal-palace": plDepth([
    ["Walter Benítez", "GK", 80],
    ["Remi Matthews", "GK", 70],
    ["Nathaniel Clyne", "RB", 75],
    ["Chadi Riad", "CB", 77],
    ["Borna Sosa", "LB", 78],
    ["Cheick Doucouré", "CDM", 81],
    ["Justin Devenny", "CM", 73],
    ["Eddie Nketiah", "ST", 79],
    ["Christantus Uche", "CAM", 79],
    ["Jesurun Rak-Sakyi", "RW", 75],
  ]),
  everton: plDepth([
    ["Mark Travers", "GK", 77],
    ["Séamus Coleman", "RB", 75],
    ["Nathan Patterson", "RB", 75],
    ["Michael Keane", "CB", 76],
    ["Vitaliy Mykolenko", "LB", 79],
    ["Tim Iroegbunam", "CM", 75],
    ["Merlin Röhl", "CM", 78],
    ["Jack Grealish", "LW", 82],
    ["Tyler Dibling", "RW", 78],
    ["Harrison Armstrong", "CM", 70],
  ]),
  fulham: plDepth([
    ["Benjamin Lecomte", "GK", 77],
    ["Timothy Castagne", "RB", 79],
    ["Issa Diop", "CB", 78],
    ["Jorge Cuenca", "CB", 77],
    ["Ryan Sessegnon", "LB", 78],
    ["Tom Cairney", "CM", 75],
    ["Harrison Reed", "CDM", 76],
    ["Samuel Chukwueze", "RW", 81],
    ["Adama Traoré", "RW", 79],
    ["Joshua King", "CAM", 75],
  ]),
  "hull-city": plDepth([
    ["Dillon Phillips", "GK", 70],
    ["Cody Drameh", "RB", 69],
    ["Sean McLoughlin", "CB", 68],
    ["John Egan", "CB", 70],
    ["Finley Burns", "CB", 66],
    ["Gustavo Puerta", "CM", 70],
    ["Kasey Palmer", "CAM", 71],
    ["Liam Millar", "LW", 70],
    ["Mason Burstow", "ST", 69],
    ["João Pedro", "ST", 72],
  ]),
  "ipswich-town": plDepth([
    ["Christian Walton", "GK", 73],
    ["Cieran Slicker", "GK", 67],
    ["Ben Johnson", "RB", 75],
    ["Luke Woolfenden", "CB", 73],
    ["Cameron Burgess", "CB", 73],
    ["Harry Clarke", "RB", 72],
    ["Conor Townsend", "LB", 71],
    ["Massimo Luongo", "CM", 72],
    ["Nathan Broadhead", "LW", 74],
    ["Ali Al-Hamadi", "ST", 71],
  ]),
  "leeds-united": plDepth([
    ["James Trafford", "GK", 80],
    ["Illan Meslier", "GK", 78],
    ["Karl Darlow", "GK", 75],
    ["Jaka Bijol", "CB", 80],
    ["Sebastiaan Bornauw", "CB", 78],
    ["James Justin", "RB", 79],
    ["Ilia Gruev", "CDM", 77],
    ["Sean Longstaff", "CM", 78],
    ["Jack Harrison", "LW", 78],
    ["Lukas Nmecha", "ST", 78],
    ["Sam Byram", "LB", 75],
  ]),
  liverpool: plDepth([
    ["Giorgi Mamardashvili", "GK", 84],
    ["Conor Bradley", "RB", 80],
    ["Ibrahima Konaté", "CB", 86],
    ["Joe Gomez", "CB", 80],
    ["Wataru Endo", "CDM", 78],
    ["Curtis Jones", "CM", 82],
    ["Dominik Szoboszlai", "CAM", 87],
    ["Mohamed Salah", "RW", 90],
    ["Trey Nyoni", "CM", 74],
  ]),
  "manchester-city": plDepth([
    ["John Stones", "CB", 83],
    ["Abdukodir Khusanov", "CB", 80],
    ["Nathan Aké", "CB", 82],
    ["Rico Lewis", "RB", 80],
    ["Nico González", "CDM", 81],
    ["Mateo Kovačić", "CM", 82],
    ["Oscar Bobb", "RW", 79],
    ["Omar Marmoush", "ST", 84],
  ]),
  "manchester-united": plDepth([
    ["Altay Bayındır", "GK", 76],
    ["Noussair Mazraoui", "RB", 81],
    ["Harry Maguire", "CB", 80],
    ["Luke Shaw", "LB", 80],
    ["Lisandro Martínez", "CB", 83],
    ["Casemiro", "CDM", 81],
    ["Mason Mount", "CAM", 80],
    ["Joshua Zirkzee", "CF", 80],
    ["Chido Obi", "ST", 74],
  ]),
  "newcastle-united": plDepth([
    ["Nick Pope", "GK", 82],
    ["Kieran Trippier", "RB", 80],
    ["Dan Burn", "CB", 79],
    ["Jamaal Lascelles", "CB", 75],
    ["Emil Krafth", "RB", 75],
    ["Joe Willock", "CM", 78],
    ["Lewis Miley", "CM", 78],
    ["William Osula", "ST", 76],
    ["Jacob Murphy", "RW", 78],
    ["Alex Murphy", "CB", 72],
  ]),
  "nottingham-forest": plDepth([
    ["Angus Gunn", "GK", 76],
    ["Carlos Miguel", "GK", 76],
    ["Morato", "CB", 79],
    ["Willy Boly", "CB", 77],
    ["Oleksandr Zinchenko", "LB", 80],
    ["Ibrahim Sangaré", "CDM", 79],
    ["Omari Hutchinson", "RW", 79],
    ["Dilane Bakwa", "RW", 78],
    ["Taiwo Awoniyi", "ST", 78],
    ["Arnaud Kalimuendo", "ST", 80],
  ]),
  sunderland: plDepth([
    ["Anthony Patterson", "GK", 75],
    ["Robin Roefs", "GK", 77],
    ["Nordi Mukiele", "RB", 80],
    ["Jenson Seelt", "CB", 72],
    ["Luke O'Nien", "CB", 74],
    ["Dennis Cirkin", "LB", 75],
    ["Chris Rigg", "CM", 76],
    ["Romaine Mundle", "LW", 74],
    ["Eliezer Mayenda", "ST", 75],
    ["Arthur Masuaku", "LB", 75],
  ]),
  "tottenham-hotspur": plDepth([
    ["Antonín Kinský", "GK", 78],
    ["Destiny Udogie", "LB", 82],
    ["Kevin Danso", "CB", 81],
    ["Archie Gray", "CM", 79],
    ["Lucas Bergvall", "CM", 80],
    ["Brennan Johnson", "RW", 82],
    ["Dejan Kulusevski", "RW", 84],
    ["Richarlison", "ST", 80],
    ["Pape Matar Sarr", "CM", 81],
  ]),
});

const plClub = ({
  id,
  name,
  code,
  rating,
  attack,
  midfield,
  defence,
  goalkeeper,
  depth,
  experience,
  arrivals = [],
  roster,
}) => {
  const normalizePlayerName = (value) => String(value || "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
  const roleOverrideEntries = [...roster, ...(PREMIER_LEAGUE_2026_27_SQUAD_DEPTH[id] || [])]
    .map((player) => [normalizePlayerName(player.name), player]);
  const roleOverrides = new Map(roleOverrideEntries);
  const likelyStarterEntries = roster.slice(0, 11);
  const namesMatch = (candidateValue, overrideValue) => {
    const candidate = normalizePlayerName(candidateValue);
    const override = normalizePlayerName(overrideValue);
    if (!candidate || !override) return false;
    if (candidate === override) return true;
    const candidateTokens = candidate.split(/\s+/);
    const overrideTokens = override.split(/\s+/);
    if (overrideTokens.length > 1 && overrideTokens.every((token) => candidateTokens.includes(token))) return true;
    const lastToken = overrideTokens.at(-1);
    return overrideTokens.length === 1 && lastToken.length >= 4 && candidateTokens.includes(lastToken);
  };
  const roleOverrideForPlayer = (player) => {
    const keys = [player.name, player.displayName]
      .map(normalizePlayerName)
      .filter(Boolean);
    const key = keys[0] || "";
    const exact = keys.map((candidate) => roleOverrides.get(candidate)).find(Boolean);
    if (exact) return { key: normalizePlayerName(exact.name), override: exact };
    const candidates = roleOverrideEntries.filter(([overrideKey]) => {
      return keys.some((candidate) => namesMatch(candidate, overrideKey));
    });
    const uniqueCandidates = [...new Map(candidates.map(([candidateKey, override]) => [candidateKey, override])).entries()];
    return uniqueCandidates.length === 1
      ? { key: uniqueCandidates[0][0], override: uniqueCandidates[0][1] }
      : { key, override: null };
  };
  const sourceSquads = window.PREMIER_LEAGUE_2026_27_CURRENT_SQUADS;
  const baseCurrentSquad = sourceSquads?.[id]
    ? [...sourceSquads[id]]
    : null;
  PREMIER_LEAGUE_2026_27_SQUAD_TRANSFERS.forEach((transfer) => {
    if (id === transfer.fromId && baseCurrentSquad) {
      const playerIndex = baseCurrentSquad.findIndex((player) => (
        [player.name, player.displayName]
          .some((candidate) => premierLeaguePlayerNamesMatch(candidate, transfer.player))
      ));
      if (playerIndex >= 0) baseCurrentSquad.splice(playerIndex, 1);
    }
    if (id === transfer.toId && baseCurrentSquad) {
      const transferredPlayer = sourceSquads?.[transfer.fromId]
        ?.find((player) => (
          [player.name, player.displayName]
            .some((candidate) => premierLeaguePlayerNamesMatch(candidate, transfer.player))
        ));
      if (transferredPlayer && !baseCurrentSquad.some((player) => (
        [player.name, player.displayName]
          .some((candidate) => premierLeaguePlayerNamesMatch(candidate, transfer.player))
      ))) {
        baseCurrentSquad.push(transferredPlayer);
      }
    }
  });
  const trafford = window.PREMIER_LEAGUE_2026_27_CURRENT_SQUADS?.["manchester-city"]
    ?.find((player) => normalizePlayerName(player.name) === "james trafford");
  const currentSquad = id === "manchester-city"
    ? baseCurrentSquad?.filter((player) => normalizePlayerName(player.name) !== "james trafford")
    : id === "leeds-united" && trafford
      ? [...(baseCurrentSquad || []), trafford]
      : baseCurrentSquad;
  if (Array.isArray(currentSquad)) {
    PREMIER_LEAGUE_2026_27_MANUAL_SQUAD_ADDITIONS
      .filter((addition) => addition.toId === id)
      .forEach(({ toId, ...addition }) => {
        if (!currentSquad.some((player) => (
          [player.name, player.displayName]
            .some((candidate) => premierLeaguePlayerNamesMatch(candidate, addition.name))
        ))) currentSquad.push(addition);
      });
  }
  if (!Array.isArray(currentSquad) || currentSquad.length < 20) {
    throw new Error(`Missing current 2026/27 Premier League squad for ${name}`);
  }
  const completeRoster = Object.freeze(currentSquad.map((player) => {
    const { key, override } = roleOverrideForPlayer(player);
    const likelyStarter = likelyStarterEntries.some((starter) => (
      [player.name, player.displayName, override?.name, key]
        .some((candidate) => namesMatch(candidate, starter.name))
    ));
    const explicitRating = PREMIER_LEAGUE_2026_27_PLAYER_RATING_OVERRIDES[player.name];
    const officialRating = officialFc26RatingForPlayer(player.name);
    const fplFallback = normalizePremierLeaguePlayerRating(player.overall);
    const calibratedFallback = override?.overall
      ? Math.round(fplFallback * 0.35 + Number(override.overall) * 0.65)
      : fplFallback;
    const registeredNameOverride = premierLeaguePlayerDisplayName(player.name);
    const displayName = override?.name?.trim()
      || (registeredNameOverride !== player.name
        ? registeredNameOverride
        : player.displayName?.trim().includes(" ")
          ? player.displayName
          : player.name);
    return plPlayer(
      displayName,
      override?.position || player.position,
      explicitRating ?? officialRating ?? Math.max(64, Math.min(90, calibratedFallback)),
      {
      fplId: player.fplId,
      positions: Object.freeze([
        ...new Set([override?.position, ...(override?.positions || []), player.position].filter(Boolean)),
      ]),
      startingXILikelihood: likelyStarter ? 1 : 0,
      startingXI: likelyStarter,
      ...(override?.captain ? { captain: true } : {}),
      ...(override?.penaltyTaker ? { penaltyTaker: true } : {}),
      },
    );
  }));
  const averageTop = (players, count, fallback) => {
    const ratings = players
      .map((player) => Number(player.overall) || 0)
      .sort((left, right) => right - left)
      .slice(0, count);
    return ratings.length
      ? ratings.reduce((total, value) => total + value, 0) / ratings.length
      : fallback;
  };
  const attackingPlayers = completeRoster.filter((player) => ["ST", "CF", "SS", "LW", "RW", "CAM", "AM"].includes(player.position));
  const midfieldPlayers = completeRoster.filter((player) => ["CDM", "CM", "CAM", "AM", "LM", "RM"].includes(player.position));
  const defensivePlayers = completeRoster.filter((player) => ["CB", "LB", "RB", "LWB", "RWB"].includes(player.position));
  const goalkeepers = completeRoster.filter((player) => player.position === "GK");
  const startingQuality = averageTop(completeRoster, 11, rating);
  const depthQuality = averageTop(completeRoster, 18, startingQuality);
  const derivedOverall = Math.round(startingQuality * 0.72 + depthQuality * 0.28);
  const derivedAttack = Math.round(averageTop(attackingPlayers, 5, derivedOverall));
  const derivedMidfield = Math.round(averageTop(midfieldPlayers, 5, derivedOverall));
  const derivedDefence = Math.round(averageTop(defensivePlayers, 5, derivedOverall));
  const derivedGoalkeeper = Math.round(averageTop(goalkeepers, 1, derivedOverall));
  const derivedDepth = Math.round(depthQuality);
  const leagueStrengthAdjustment = id === "nottingham-forest" ? -1 : 0;
  const adjustedRating = (value) => Math.max(60, Math.min(91, value + leagueStrengthAdjustment));
  return Object.freeze({
    id,
    name,
    mobileName: PREMIER_LEAGUE_MOBILE_CLUB_NAMES[id] || name,
    code,
    badge: `./assets/pl-26-27/badges/${id}.webp`,
    rating: adjustedRating(derivedOverall),
    strength: adjustedRating(derivedOverall),
    premierLeague: true,
    preferredFormation: PREMIER_LEAGUE_2026_27_PREFERRED_FORMATIONS[id] || "4-3-3",
    nameCulture: "british",
    fifaRank: 30,
    simulationRatings: Object.freeze({
      overall: adjustedRating(derivedOverall),
      attack: adjustedRating(derivedAttack),
      midfield: adjustedRating(derivedMidfield),
      defence: adjustedRating(derivedDefence),
      goalkeeper: adjustedRating(derivedGoalkeeper),
      squadDepth: adjustedRating(derivedDepth),
      experience,
      penalties: Math.round((attack + goalkeeper + experience) / 3),
      discipline: 68,
    }),
    arrivals: Object.freeze(arrivals),
    players: Object.freeze(completeRoster.map((player) => player.name)),
    playerProfiles: completeRoster,
  });
};

const PREMIER_LEAGUE_2026_27_CLUBS = Object.freeze([
  plClub({
    id: "arsenal", name: "Arsenal", code: "ARS", rating: 90,
    attack: 91, midfield: 91, defence: 92, goalkeeper: 88, depth: 89, experience: 90,
    arrivals: ["Bruno Guimarães"],
    roster: [
      plPlayer("Viktor Gyökeres", "ST", 90, { penaltyTaker: true }),
      plPlayer("Bukayo Saka", "RW", 93),
      plPlayer("Eberechi Eze", "LW", 88),
      plPlayer("Martin Ødegaard", "CAM", 89, { captain: true }),
      plPlayer("Declan Rice", "CM", 91),
      plPlayer("Martin Zubimendi", "CDM", 88),
      plPlayer("Jurrien Timber", "RB", 87),
      plPlayer("William Saliba", "CB", 91),
      plPlayer("Gabriel Magalhães", "CB", 90),
      plPlayer("Riccardo Calafiori", "LB", 86),
      plPlayer("David Raya", "GK", 88),
      plPlayer("Noni Madueke", "RW", 84),
      plPlayer("Kai Havertz", "CF", 85),
      plPlayer("Ethan Nwaneri", "CAM", 84),
      plPlayer("Max Dowman", "CAM", 82),
      plPlayer("Bruno Guimarães", "CM", 87),
    ],
  }),
  plClub({
    id: "aston-villa", name: "Aston Villa", code: "AVL", rating: 84,
    attack: 85, midfield: 83, defence: 83, goalkeeper: 87, depth: 82, experience: 86,
    arrivals: ["João Gomes", "Johan Manzambi"],
    roster: [
      plPlayer("Ollie Watkins", "ST", 86, { penaltyTaker: true }),
      plPlayer("Morgan Rogers", "LW", 86),
      plPlayer("Donyell Malen", "RW", 82),
      plPlayer("John McGinn", "CAM", 82, { captain: true }),
      plPlayer("Amadou Onana", "CM", 84),
      plPlayer("Boubacar Kamara", "CDM", 85),
      plPlayer("Matty Cash", "RB", 81),
      plPlayer("Ezri Konsa", "CB", 85),
      plPlayer("Pau Torres", "CB", 83),
      plPlayer("Ian Maatsen", "LB", 82),
      plPlayer("Emiliano Martínez", "GK", 87),
      plPlayer("Harvey Elliott", "CAM", 81),
      plPlayer("Jacob Ramsey", "CM", 81),
      plPlayer("Jadon Sancho", "RW", 81),
    ],
  }),
  plClub({
    id: "bournemouth", name: "Bournemouth", code: "BOU", rating: 81,
    attack: 82, midfield: 81, defence: 79, goalkeeper: 81, depth: 79, experience: 78,
    roster: [
      plPlayer("Evanilson", "ST", 82, { penaltyTaker: true }),
      plPlayer("Justin Kluivert", "LW", 83),
      plPlayer("Ben Doak", "RW", 80),
      plPlayer("Marcus Tavernier", "CAM", 80),
      plPlayer("Alex Scott", "CM", 81),
      plPlayer("Tyler Adams", "CDM", 81),
      plPlayer("Julián Araujo", "RB", 78),
      plPlayer("Bafodé Diakité", "CB", 81),
      plPlayer("James Hill", "CB", 77),
      plPlayer("Adrien Truffert", "LB", 81),
      plPlayer("Djordje Petrović", "GK", 81),
      plPlayer("Amine Adli", "RW", 80),
      plPlayer("David Brooks", "RW", 78),
    ],
  }),
  plClub({
    id: "brentford", name: "Brentford", code: "BRE", rating: 78,
    attack: 79, midfield: 78, defence: 77, goalkeeper: 81, depth: 77, experience: 80,
    roster: [
      plPlayer("Igor Thiago", "ST", 81, { penaltyTaker: true }),
      plPlayer("Kevin Schade", "LW", 80),
      plPlayer("Dango Ouattara", "RW", 81),
      plPlayer("Mikkel Damsgaard", "CAM", 81),
      plPlayer("Jordan Henderson", "CM", 78, { captain: true }),
      plPlayer("Yegor Yarmolyuk", "CDM", 77),
      plPlayer("Michael Kayode", "RB", 79),
      plPlayer("Nathan Collins", "CB", 81),
      plPlayer("Sepp van den Berg", "CB", 79),
      plPlayer("Aaron Hickey", "LB", 78),
      plPlayer("Caoimhín Kelleher", "GK", 81),
      plPlayer("Antoni Milambo", "CM", 78),
      plPlayer("Reiss Nelson", "RW", 78),
    ],
  }),
  plClub({
    id: "brighton", name: "Brighton & Hove Albion", code: "BHA", rating: 80,
    attack: 81, midfield: 81, defence: 78, goalkeeper: 80, depth: 82, experience: 77,
    roster: [
      plPlayer("Kaoru Mitoma", "LW", 83),
      plPlayer("Yankuba Minteh", "RW", 81),
      plPlayer("Georginio Rutter", "CAM", 82, { penaltyTaker: true }),
      plPlayer("Carlos Baleba", "CM", 84),
      plPlayer("Mats Wieffer", "CDM", 80),
      plPlayer("Maxim De Cuyper", "LB", 80),
      plPlayer("Lewis Dunk", "CB", 80, { captain: true }),
      plPlayer("Diego Coppola", "CB", 78),
      plPlayer("Ferdi Kadıoğlu", "RB", 81),
      plPlayer("Bart Verbruggen", "GK", 82),
      plPlayer("Charalampos Kostoulas", "CF", 78),
      plPlayer("Diego Gómez", "CM", 79),
      plPlayer("Yeremy Pino", "RW", 82),
    ],
  }),
  plClub({
    id: "chelsea", name: "Chelsea", code: "CHE", rating: 80,
    attack: 84, midfield: 83, defence: 78, goalkeeper: 78, depth: 86, experience: 77,
    arrivals: ["Morgan Rogers", "Danny Welbeck", "Maxence Lacroix", "Jordan Henderson"],
    roster: [
      plPlayer("João Pedro", "ST", 84, { penaltyTaker: true }),
      plPlayer("Pedro Neto", "LW", 83),
      plPlayer("Estêvão", "RW", 84),
      plPlayer("Cole Palmer", "CAM", 92),
      plPlayer("Enzo Fernández", "CM", 87),
      plPlayer("Moisés Caicedo", "CDM", 89),
      plPlayer("Reece James", "RB", 85, { captain: true }),
      plPlayer("Trevoh Chalobah", "CB", 81),
      plPlayer("Levi Colwill", "CB", 82),
      plPlayer("Valentín Barco", "LB", 80),
      plPlayer("Robert Sánchez", "GK", 78),
      plPlayer("Liam Delap", "ST", 81),
      plPlayer("Jamie Gittens", "LW", 80),
      plPlayer("Jorrel Hato", "CB", 81),
      plPlayer("Danny Welbeck", "ST", 80),
    ],
  }),
  plClub({
    id: "coventry-city", name: "Coventry City", code: "COV", rating: 69,
    attack: 71, midfield: 69, defence: 68, goalkeeper: 69, depth: 66, experience: 65,
    arrivals: ["Carl Rushworth"],
    roster: [
      plPlayer("Haji Wright", "ST", 74, { penaltyTaker: true }),
      plPlayer("Tatsuhiro Sakamoto", "RW", 71),
      plPlayer("Jack Rudoni", "CAM", 72),
      plPlayer("Ephron Mason-Clark", "LW", 70),
      plPlayer("Ben Sheaf", "CM", 72, { captain: true }),
      plPlayer("Victor Torp", "CDM", 70),
      plPlayer("Milan van Ewijk", "RB", 72),
      plPlayer("Bobby Thomas", "CB", 70),
      plPlayer("Liam Kitching", "CB", 69),
      plPlayer("Jake Bidwell", "LB", 68),
      plPlayer("Oliver Dovin", "GK", 70),
      plPlayer("Ellis Simms", "ST", 71),
      plPlayer("Josh Eccles", "CM", 68),
    ],
  }),
  plClub({
    id: "crystal-palace", name: "Crystal Palace", code: "CRY", rating: 78,
    attack: 78, midfield: 79, defence: 80, goalkeeper: 81, depth: 76, experience: 81,
    roster: [
      plPlayer("Jean-Philippe Mateta", "ST", 82, { penaltyTaker: true }),
      plPlayer("Ismaïla Sarr", "RW", 83),
      plPlayer("Daichi Kamada", "CAM", 79),
      plPlayer("Tyrick Mitchell", "LW", 77),
      plPlayer("Adam Wharton", "CM", 83),
      plPlayer("Jefferson Lerma", "CDM", 80),
      plPlayer("Daniel Muñoz", "RB", 83),
      plPlayer("Maxence Lacroix", "CB", 82),
      plPlayer("Marc Guéhi", "CB", 84, { captain: true }),
      plPlayer("Chris Richards", "LB", 79),
      plPlayer("Dean Henderson", "GK", 81),
      plPlayer("Romain Esse", "RW", 76),
      plPlayer("Will Hughes", "CM", 77),
    ],
  }),
  plClub({
    id: "everton", name: "Everton", code: "EVE", rating: 76,
    attack: 76, midfield: 77, defence: 80, goalkeeper: 84, depth: 74, experience: 82,
    arrivals: ["Hayden Hackney", "Christian Nørgaard"],
    roster: [
      plPlayer("Thierno Barry", "ST", 78, { penaltyTaker: true }),
      plPlayer("Iliman Ndiaye", "LW", 81),
      plPlayer("Dwight McNeil", "RW", 79),
      plPlayer("Kiernan Dewsbury-Hall", "CAM", 80),
      plPlayer("James Garner", "CM", 79),
      plPlayer("Idrissa Gana Gueye", "CDM", 78),
      plPlayer("Jake O'Brien", "RB", 78),
      plPlayer("James Tarkowski", "CB", 80, { captain: true }),
      plPlayer("Jarrad Branthwaite", "CB", 83),
      plPlayer("Adam Aznou", "LB", 76),
      plPlayer("Jordan Pickford", "GK", 84),
      plPlayer("Charly Alcaraz", "CAM", 77),
      plPlayer("Beto", "ST", 77),
    ],
  }),
  plClub({
    id: "fulham", name: "Fulham", code: "FUL", rating: 75,
    attack: 76, midfield: 77, defence: 75, goalkeeper: 79, depth: 74, experience: 82,
    roster: [
      plPlayer("Rodrigo Muniz", "ST", 79, { penaltyTaker: true }),
      plPlayer("Alex Iwobi", "LW", 80),
      plPlayer("Harry Wilson", "RW", 80),
      plPlayer("Emile Smith Rowe", "CAM", 79),
      plPlayer("Sander Berge", "CM", 79),
      plPlayer("Saša Lukić", "CDM", 77),
      plPlayer("Kenny Tete", "RB", 78),
      plPlayer("Joachim Andersen", "CB", 81, { captain: true }),
      plPlayer("Calvin Bassey", "CB", 79),
      plPlayer("Antonee Robinson", "LB", 82),
      plPlayer("Bernd Leno", "GK", 80),
      plPlayer("Kevin", "LW", 78),
      plPlayer("Raúl Jiménez", "ST", 77),
    ],
  }),
  plClub({
    id: "hull-city", name: "Hull City", code: "HUL", rating: 66,
    attack: 68, midfield: 66, defence: 65, goalkeeper: 67, depth: 63, experience: 67,
    roster: [
      plPlayer("Oli McBurnie", "ST", 71, { penaltyTaker: true }),
      plPlayer("Mohamed Belloumi", "RW", 70),
      plPlayer("Joe Gelhardt", "CF", 69),
      plPlayer("Abu Kamara", "LW", 68),
      plPlayer("Regan Slater", "CM", 68, { captain: true }),
      plPlayer("Steven Alzate", "CDM", 68),
      plPlayer("Lewie Coyle", "RB", 67),
      plPlayer("Alfie Jones", "CB", 68),
      plPlayer("Charlie Hughes", "CB", 69),
      plPlayer("Ryan Giles", "LB", 67),
      plPlayer("Ivor Pandur", "GK", 69),
      plPlayer("Kyle Joseph", "ST", 66),
      plPlayer("Matt Crooks", "CAM", 67),
    ],
  }),
  plClub({
    id: "ipswich-town", name: "Ipswich Town", code: "IPS", rating: 68,
    attack: 69, midfield: 69, defence: 68, goalkeeper: 68, depth: 66, experience: 69,
    roster: [
      plPlayer("George Hirst", "ST", 71, { penaltyTaker: true }),
      plPlayer("Sammie Szmodics", "LW", 72),
      plPlayer("Jaden Philogene", "RW", 73),
      plPlayer("Conor Chaplin", "CAM", 70),
      plPlayer("Jens Cajuste", "CM", 73),
      plPlayer("Sam Morsy", "CDM", 70, { captain: true }),
      plPlayer("Axel Tuanzebe", "RB", 71),
      plPlayer("Dara O'Shea", "CB", 72),
      plPlayer("Jacob Greaves", "CB", 72),
      plPlayer("Leif Davis", "LB", 73),
      plPlayer("Alex Palmer", "GK", 69),
      plPlayer("Jack Taylor", "CM", 68),
      plPlayer("Wes Burns", "RW", 69),
    ],
  }),
  plClub({
    id: "leeds-united", name: "Leeds United", code: "LEE", rating: 73,
    attack: 74, midfield: 75, defence: 73, goalkeeper: 74, depth: 72, experience: 74,
    arrivals: ["James Trafford", "Harry Wilson"],
    roster: [
      plPlayer("Dominic Calvert-Lewin", "ST", 77, { penaltyTaker: true }),
      plPlayer("Wilfried Gnonto", "LW", 77),
      plPlayer("Daniel James", "RW", 76),
      plPlayer("Noah Okafor", "CF", 77),
      plPlayer("Ao Tanaka", "CM", 78),
      plPlayer("Ethan Ampadu", "CDM", 78, { captain: true }),
      plPlayer("Jayden Bogle", "RB", 75),
      plPlayer("Joe Rodon", "CB", 77),
      plPlayer("Pascal Struijk", "CB", 77),
      plPlayer("Gabriel Gudmundsson", "LB", 74),
      plPlayer("Lucas Perri", "GK", 76),
      plPlayer("Anton Stach", "CM", 76),
      plPlayer("Brenden Aaronson", "CAM", 74),
    ],
  }),
  plClub({
    id: "liverpool", name: "Liverpool", code: "LIV", rating: 84,
    attack: 88, midfield: 85, defence: 83, goalkeeper: 88, depth: 85, experience: 87,
    arrivals: ["Victor Muñoz", "Jérémy Jacquet", "Ronald Araújo"],
    roster: [
      plPlayer("Alexander Isak", "ST", 91, { penaltyTaker: true }),
      plPlayer("Hugo Ekitiké", "LW", 86),
      plPlayer("Victor Muñoz", "RW", 82),
      plPlayer("Florian Wirtz", "CAM", 89),
      plPlayer("Alexis Mac Allister", "CM", 87),
      plPlayer("Ryan Gravenberch", "CDM", 86),
      plPlayer("Jeremie Frimpong", "RB", 85),
      plPlayer("Jérémy Jacquet", "CB", 81),
      plPlayer("Virgil van Dijk", "CB", 90, { captain: true }),
      plPlayer("Miloš Kerkez", "LB", 83),
      plPlayer("Alisson Becker", "GK", 89),
      plPlayer("Cody Gakpo", "LW", 84),
      plPlayer("Federico Chiesa", "RW", 82),
      plPlayer("Rio Ngumoha", "LW", 78),
      plPlayer("Ronald Araújo", "CB", 87),
    ],
  }),
  plClub({
    id: "manchester-city", name: "Manchester City", code: "MCI", rating: 88,
    attack: 92, midfield: 90, defence: 87, goalkeeper: 90, depth: 90, experience: 91,
    arrivals: ["Elliot Anderson"],
    roster: [
      plPlayer("Erling Haaland", "ST", 97, { penaltyTaker: true }),
      plPlayer("Antoine Semenyo", "LW", 88),
      plPlayer("Jérémy Doku", "RW", 85),
      plPlayer("Rayan Cherki", "CAM", 87),
      plPlayer("Elliot Anderson", "CM", 85),
      plPlayer("Rodri", "CDM", 91, { captain: true }),
      plPlayer("Matheus Nunes", "RB", 82),
      plPlayer("Rúben Dias", "CB", 89),
      plPlayer("Joško Gvardiol", "CB", 88),
      plPlayer("Rayan Aït-Nouri", "LB", 84),
      plPlayer("Gianluigi Donnarumma", "GK", 91),
      plPlayer("Tijjani Reijnders", "CM", 86),
      plPlayer("Phil Foden", "RW", 85),
      plPlayer("Savinho", "RW", 82),
    ],
  }),
  plClub({
    id: "manchester-united", name: "Manchester United", code: "MUN", rating: 86,
    attack: 86, midfield: 88, defence: 84, goalkeeper: 85, depth: 85, experience: 87,
    arrivals: ["Andrey Santos", "Youri Tielemans"],
    roster: [
      plPlayer("Benjamin Šeško", "ST", 84, { penaltyTaker: true }),
      plPlayer("Matheus Cunha", "LW", 85),
      plPlayer("Bryan Mbeumo", "RW", 86),
      plPlayer("Bruno Fernandes", "CAM", 91, { captain: true }),
      plPlayer("Youri Tielemans", "CM", 86),
      plPlayer("Andrey Santos", "CDM", 84),
      plPlayer("Diogo Dalot", "RB", 82),
      plPlayer("Matthijs de Ligt", "CB", 85),
      plPlayer("Leny Yoro", "CB", 84),
      plPlayer("Patrick Dorgu", "LB", 81),
      plPlayer("Senne Lammens", "GK", 85),
      plPlayer("Kobbie Mainoo", "CM", 83),
      plPlayer("Amad Diallo", "RW", 84),
      plPlayer("Manuel Ugarte", "CDM", 82),
    ],
  }),
  plClub({
    id: "newcastle-united", name: "Newcastle United", code: "NEW", rating: 80,
    attack: 82, midfield: 80, defence: 82, goalkeeper: 80, depth: 80, experience: 82,
    roster: [
      plPlayer("Nick Woltemade", "ST", 84, { penaltyTaker: true }),
      plPlayer("Anthony Gordon", "LW", 84),
      plPlayer("Anthony Elanga", "RW", 82),
      plPlayer("Jacob Ramsey", "CAM", 82),
      plPlayer("Bruno Guimarães", "CM", 87, { captain: true }),
      plPlayer("Joelinton", "CDM", 83),
      plPlayer("Tino Livramento", "RB", 82),
      plPlayer("Fabian Schär", "CB", 82),
      plPlayer("Sven Botman", "CB", 84),
      plPlayer("Lewis Hall", "LB", 81),
      plPlayer("Aaron Ramsdale", "GK", 80),
      plPlayer("Yoane Wissa", "ST", 82),
      plPlayer("Harvey Barnes", "LW", 81),
    ],
  }),
  plClub({
    id: "nottingham-forest", name: "Nottingham Forest", code: "NFO", rating: 75,
    attack: 77, midfield: 75, defence: 77, goalkeeper: 80, depth: 74, experience: 78,
    arrivals: ["Ousmane Diomande"],
    roster: [
      plPlayer("Igor Jesus", "ST", 78, { penaltyTaker: true }),
      plPlayer("Callum Hudson-Odoi", "LW", 79),
      plPlayer("Dan Ndoye", "RW", 79),
      plPlayer("Morgan Gibbs-White", "CAM", 84, { captain: true }),
      plPlayer("James McAtee", "CM", 79),
      plPlayer("Ryan Yates", "CDM", 76),
      plPlayer("Ola Aina", "RB", 80),
      plPlayer("Nikola Milenković", "CB", 81),
      plPlayer("Murillo", "CB", 83),
      plPlayer("Neco Williams", "LB", 78),
      plPlayer("Matz Sels", "GK", 81),
      plPlayer("Chris Wood", "ST", 78),
      plPlayer("Ousmane Diomande", "CB", 82),
      plPlayer("Nicolás Domínguez", "CM", 77),
    ],
  }),
  plClub({
    id: "sunderland", name: "Sunderland", code: "SUN", rating: 79,
    attack: 78, midfield: 81, defence: 79, goalkeeper: 80, depth: 78, experience: 82,
    arrivals: ["Jack Butland"],
    roster: [
      plPlayer("Brian Brobbey", "ST", 80, { penaltyTaker: true }),
      plPlayer("Simon Adingra", "LW", 80),
      plPlayer("Chemsdine Talbi", "RW", 79),
      plPlayer("Enzo Le Fée", "CAM", 81),
      plPlayer("Habib Diarra", "CM", 82),
      plPlayer("Granit Xhaka", "CDM", 84, { captain: true }),
      plPlayer("Trai Hume", "RB", 79),
      plPlayer("Dan Ballard", "CB", 79),
      plPlayer("Omar Alderete", "CB", 79),
      plPlayer("Reinildo Mandava", "LB", 78),
      plPlayer("Jack Butland", "GK", 80),
      plPlayer("Wilson Isidor", "ST", 79),
      plPlayer("Noah Sadiki", "CM", 78),
    ],
  }),
  plClub({
    id: "tottenham-hotspur", name: "Tottenham Hotspur", code: "TOT", rating: 78,
    attack: 82, midfield: 86, defence: 82, goalkeeper: 78, depth: 86, experience: 84,
    arrivals: ["Sandro Tonali", "Mateus Fernandes", "Andy Robertson", "Marcos Senesi", "Jan Paul van Hecke", "Martin Dúbravka"],
    roster: [
      plPlayer("Dominic Solanke", "ST", 82, { penaltyTaker: true }),
      plPlayer("Mathys Tel", "LW", 81),
      plPlayer("Mohammed Kudus", "RW", 84),
      plPlayer("Xavi Simons", "CAM", 85),
      plPlayer("Sandro Tonali", "CM", 88),
      plPlayer("Mateus Fernandes", "CDM", 82),
      plPlayer("Pedro Porro", "RB", 83),
      plPlayer("Jan Paul van Hecke", "CB", 83),
      plPlayer("Micky van de Ven", "CB", 86),
      plPlayer("Andy Robertson", "LB", 82),
      plPlayer("Guglielmo Vicario", "GK", 82),
      plPlayer("Cristian Romero", "CB", 86, { captain: true }),
      plPlayer("Marcos Senesi", "CB", 81),
      plPlayer("Martin Dúbravka", "GK", 78),
    ],
  }),
]);

function createPremierLeagueSchedule() {
  const openingPairs = [
    ["arsenal", "coventry-city"],
    ["hull-city", "manchester-united"],
    ["everton", "crystal-palace"],
    ["ipswich-town", "sunderland"],
    ["nottingham-forest", "leeds-united"],
    ["liverpool", "chelsea"],
    ["manchester-city", "newcastle-united"],
    ["brighton", "bournemouth"],
    ["brentford", "fulham"],
    ["tottenham-hotspur", "aston-villa"],
  ];
  let rotation = [
    ...openingPairs.map(([homeId]) => homeId),
    ...openingPairs.map(([, awayId]) => awayId).reverse(),
  ];
  const firstLeg = [];
  for (let roundIndex = 0; roundIndex < 19; roundIndex += 1) {
    const matches = [];
    for (let matchIndex = 0; matchIndex < 10; matchIndex += 1) {
      const firstId = rotation[matchIndex];
      const secondId = rotation[rotation.length - 1 - matchIndex];
      const reverseHome = roundIndex > 0 && (roundIndex + matchIndex) % 2 === 1;
      matches.push({
        id: `pl-mw-${roundIndex + 1}-${matchIndex + 1}`,
        homeId: reverseHome ? secondId : firstId,
        awayId: reverseHome ? firstId : secondId,
        allowDraw: true,
        result: null,
      });
    }
    firstLeg.push(matches);
    rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, -1)];
  }
  const secondLeg = firstLeg.map((matches, roundIndex) => matches.map((match, matchIndex) => ({
    id: `pl-mw-${roundIndex + 20}-${matchIndex + 1}`,
    homeId: match.awayId,
    awayId: match.homeId,
    allowDraw: true,
    result: null,
  })));
  return [...firstLeg, ...secondLeg];
}

window.PREMIER_LEAGUE_2026_27_DATA_UPDATED = PREMIER_LEAGUE_2026_27_DATA_UPDATED;
window.PREMIER_LEAGUE_2026_27_LATEST_TRANSFERS = PREMIER_LEAGUE_2026_27_LATEST_TRANSFERS;
window.PREMIER_LEAGUE_2026_27_MANUAL_SQUAD_ADDITIONS = PREMIER_LEAGUE_2026_27_MANUAL_SQUAD_ADDITIONS;
window.PREMIER_LEAGUE_2026_27_CLUBS = PREMIER_LEAGUE_2026_27_CLUBS;
window.createPremierLeagueSchedule = createPremierLeagueSchedule;
