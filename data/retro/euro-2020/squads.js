/*
 * UEFA Euro 2020 mode squad adapter.
 * Reuses the closest existing historical squad profiles where available so
 * the established player simulation remains intact. The three nations not
 * present in those archives use a compact Euro 2020 roster mapped onto the
 * same positional/rating shape.
 */
const RETRO_EURO_2020_FALLBACK_NAMES = Object.freeze({
  Finland: Object.freeze([
    "Lukas Hradecky", "Jesse Joronen", "Anssi Jaakkola", "Jukka Raitala", "Paulus Arajuuri", "Daniel O'Shaughnessy",
    "Joona Toivio", "Sauli Vaisanen", "Jere Uronen", "Nikolai Alho", "Robert Ivanov", "Tim Sparv", "Glen Kamara",
    "Robin Lod", "Rasmus Schuller", "Onni Valakari", "Pyry Soiri", "Joni Kauko", "Fredrik Jensen", "Lassi Lappalainen",
    "Teemu Pukki", "Joel Pohjanpalo", "Marcus Forss",
  ]),
  "North Macedonia": Object.freeze([
    "Stole Dimitrievski", "Damjan Siskovski", "Risto Jankov", "Stefan Ristovski", "Kire Ristevski", "Visar Musliu",
    "Darko Velkovski", "Ezgjian Alioski", "Gjoko Zajkov", "Ivan Trichkovski", "Boban Nikolov", "Arijan Ademi",
    "Enis Bardhi", "Elif Elmas", "Tihomir Kostadinov", "Stefan Spirovski", "Darko Churlinov", "Aleksandar Trajkovski",
    "Goran Pandev", "Ilija Nestorovski", "Milan Ristovski", "Krste Velkoski", "Vlatko Stojanovski",
  ]),
  Scotland: Object.freeze([
    "David Marshall", "Craig Gordon", "Jon McLaughlin", "Andy Robertson", "Kieran Tierney", "Grant Hanley",
    "Liam Cooper", "Scott McKenna", "Jack Hendry", "Stephen O'Donnell", "Nathan Patterson", "Scott McTominay",
    "John McGinn", "Callum McGregor", "Stuart Armstrong", "Ryan Christie", "Billy Gilmour", "John Fleck",
    "James Forrest", "Ryan Fraser", "Lyndon Dykes", "Che Adams", "Kevin Nisbet",
  ]),
});

const RETRO_EURO_2020_TEMPLATE_BY_TEAM = Object.freeze({
  Finland: "Iceland",
  "North Macedonia": "Albania",
  Scotland: "Republic of Ireland",
});

const RETRO_EURO_2020_COACHES = Object.freeze({
  Finland: "Markku Kanerva",
  "North Macedonia": "Igor Angelovski",
  Scotland: "Steve Clarke",
});

/* Keep retired and non-selected players out of Euro 2020 reports while
 * retaining the existing rating and positional profiles. */
const RETRO_EURO_2020_PLAYER_RENAMES = Object.freeze({
  Spain: Object.freeze({
    "Gerard Piqué": "Pau Torres",
    "Andrés Iniesta": "Pedri",
    "David Silva": "Ferran Torres",
    Isco: "Dani Olmo",
    "Diego Costa": "Álvaro Morata",
    "Pepe Reina": "Unai Simón",
    "Dani Carvajal": "Marcos Llorente",
    Nacho: "Aymeric Laporte",
    Saúl: "Rodri",
    Rodrigo: "Mikel Oyarzabal",
    "Lucas Vázquez": "Adama Traoré",
    "Álvaro Odriozola": "Eric García",
    "Kepa Arrizabalaga": "Robert Sánchez",
    "Sergio Ramos": "Diego Llorente",
    "Nacho Monreal": "José Gayà",
    "Iago Aspas": "Gerard Moreno",
    "Marco Asensio": "Pablo Sarabia",
  }),
  Wales: Object.freeze({
    "David Edwards": "Kieffer Moore",
    "David Vaughan": "Ethan Ampadu",
    "Simon Church": "Harry Wilson",
  }),
  Croatia: Object.freeze({
    "Ivan Rakitić": "Nikola Vlašić",
    "Mario Mandžukić": "Bruno Petković",
    "Danijel Subašić": "Simon Sluga",
  }),
  Russia: Object.freeze({
    "Fyodor Smolov": "Rifat Zhemaletdinov",
    "Aleksandr Samedov": "Aleksandr Sobolev",
  }),
  Austria: Object.freeze({
    "Marc Janko": "Michael Gregoritsch",
  }),
  Italy: Object.freeze({
    "Gianluigi Buffon": "Gianluigi Donnarumma",
    "Mattia De Sciglio": "Giovanni Di Lorenzo",
    "Matteo Darmian": "Emerson",
    "Angelo Ogbonna": "Francesco Acerbi",
    "Antonio Candreva": "Domenico Berardi",
    "Simone Zaza": "Manuel Locatelli",
    "Thiago Motta": "Marco Verratti",
    "Federico Marchetti": "Alex Meret",
    "Stefano Sturaro": "Nicolò Barella",
    "Andrea Barzagli": "Alessandro Bastoni",
    "Daniele De Rossi": "Jorginho",
    "Graziano Pellè": "Andrea Belotti",
    Éder: "Federico Chiesa",
    "Marco Parolo": "Matteo Pessina",
    "Stephan El Shaarawy": "Giacomo Raspadori",
    "Emanuele Giaccherini": "Leonardo Spinazzola",
  }),
  England: Object.freeze({
    "Danny Rose": "Luke Shaw",
    "Eric Dier": "Declan Rice",
    "Jesse Lingard": "Bukayo Saka",
    "Jamie Vardy": "Jadon Sancho",
    "Jack Butland": "Dean Henderson",
    "Danny Welbeck": "Jack Grealish",
    "Gary Cahill": "Conor Coady",
    "Phil Jones": "Tyrone Mings",
    "Fabian Delph": "Kalvin Phillips",
    "Ashley Young": "Reece James",
    "Dele Alli": "Mason Mount",
    "Ruben Loftus-Cheek": "Phil Foden",
    "Nick Pope": "Sam Johnstone",
  }),
  Turkey: Object.freeze({
    "Cenk Tosun": "Kenan Karaman",
  }),
  Netherlands: Object.freeze({
    "Remko Pasveer": "Maarten Stekelenburg",
    "Virgil van Dijk": "Joël Veltman",
    "Steven Bergwijn": "Donyell Malen",
    "Noa Lang": "Quincy Promes",
    "Tyrell Malacia": "Owen Wijndal",
    "Vincent Janssen": "Ryan Gravenberch",
    "Andries Noppert": "Tim Krul",
  }),
  Belgium: Object.freeze({
    "Vincent Kompany": "Jason Denayer",
    "Marouane Fellaini": "Hans Vanaken",
    "Adnan Januzaj": "Leandro Trossard",
    "Mousa Dembélé": "Dennis Praet",
  }),
  France: Object.freeze({
    "Samuel Umtiti": "Jules Koundé",
    "Blaise Matuidi": "Adrien Rabiot",
    "Steven Nzonzi": "Moussa Sissoko",
    "Adil Rami": "Kurt Zouma",
    "Nabil Fekir": "Karim Benzema",
    "Djibril Sidibé": "Léo Dubois",
    "Florian Thauvin": "Kingsley Coman",
    "Benjamin Mendy": "Lucas Digne",
  }),
  Germany: Object.freeze({
    "Marvin Plattenhardt": "Robin Gosens",
    "Jonas Hector": "Lukas Klostermann",
    "Sami Khedira": "Florian Neuhaus",
    "Julian Draxler": "Kai Havertz",
    "Mesut Özil": "Serge Gnabry",
    "Marco Reus": "Jamal Musiala",
    "Jérôme Boateng": "Robin Koch",
    "Sebastian Rudy": "Emre Can",
    "Julian Brandt": "Leroy Sané",
    "Marc-André ter Stegen": "Bernd Leno",
    "Mario Gómez": "Kevin Volland",
  }),
  Denmark: Object.freeze({
    "Michael Krohn-Dehli": "Joakim Mæhle",
    "Jonas Knudsen": "Rasmus Kristensen",
    "William Kvist": "Pierre-Emile Højbjerg",
    "Viktor Fischer": "Mikkel Damsgaard",
    "Jonas Lössl": "Oliver Christensen",
    "Lukas Lerager": "Christian Nørgaard",
    "Lasse Schöne": "Mathias Jensen",
    "Pione Sisto": "Robert Skov",
  }),
  "Czech Republic": Object.freeze({
    "Petr Čech": "Jiří Pavlenka",
    "Michal Kadlec": "Jakub Brabec",
    "Theodor Gebre Selassie": "Vladimír Coufal",
    "Roman Hubník": "Ondřej Čelůstka",
    "Tomáš Sivok": "Tomáš Kalas",
    "Tomáš Necid": "Patrik Schick",
    "David Limberský": "Jan Bořil",
    "Bořek Dočkal": "Tomáš Souček",
    "Tomáš Rosický": "Antonín Barák",
    "Daniel Pudil": "Petr Ševčík",
    "Milan Škoda": "Michael Krmenčík",
    "Jaroslav Plašil": "Alex Král",
    "Daniel Kolář": "Jakub Jankto",
    "Marek Suchý": "David Zima",
    "Josef Šural": "Matěj Vydra",
    "Ladislav Krejčí": "Lukáš Masopust",
    "Jiří Skalák": "Tomáš Holeš",
    "David Lafata": "Adam Hložek",
  }),
});

const RETRO_EURO_2020_TEAM_NAMES = Object.freeze([
  "Turkey", "Italy", "Wales", "Switzerland", "Denmark", "Finland", "Belgium", "Russia",
  "Netherlands", "Ukraine", "Austria", "North Macedonia", "England", "Croatia", "Scotland",
  "Czech Republic", "Spain", "Sweden", "Poland", "Slovakia", "Hungary", "Portugal", "France", "Germany",
]);

/* FIFA 21 uses a tighter player scale than the tournament engine's team
 * strength scale. These targets keep each squad's XI centred on its 2020/21
 * quality, then the named overrides capture elite players and EURO standouts. */
const RETRO_EURO_2020_XI_TARGETS = Object.freeze({
  Turkey: 77, Italy: 84, Wales: 78, Switzerland: 81, Denmark: 82, Finland: 72,
  Belgium: 84, Russia: 77, Netherlands: 82, Ukraine: 78, Austria: 79,
  "North Macedonia": 70, England: 84, Croatia: 81, Scotland: 76,
  "Czech Republic": 79, Spain: 84, Sweden: 79, Poland: 80, Slovakia: 75,
  Hungary: 76, Portugal: 84, France: 85, Germany: 84,
});

const RETRO_EURO_2020_PLAYER_RATINGS = Object.freeze({
  Italy: Object.freeze({
    "Gianluigi Donnarumma": 86, "Giorgio Chiellini": 87, "Leonardo Bonucci": 86,
    Jorginho: 86, "Marco Verratti": 86, "Lorenzo Insigne": 85, "Ciro Immobile": 84,
    "Federico Chiesa": 85, "Nicolò Barella": 85, "Leonardo Spinazzola": 84,
    "Manuel Locatelli": 83, "Andrea Belotti": 82,
  }),
  England: Object.freeze({
    "Harry Kane": 89, "Raheem Sterling": 87, "Jordan Henderson": 85, "Kyle Walker": 85,
    "Harry Maguire": 84, "John Stones": 84, "Luke Shaw": 84, "Jack Grealish": 84,
    "Mason Mount": 84, "Jordan Pickford": 83, "Bukayo Saka": 83,
    "Declan Rice": 83, "Kalvin Phillips": 83, "Marcus Rashford": 85,
    "Jadon Sancho": 87, "Phil Foden": 85, "Reece James": 83,
    "Conor Coady": 79, "Tyrone Mings": 79,
  }),
  Belgium: Object.freeze({
    "Kevin De Bruyne": 91, "Thibaut Courtois": 89, "Romelu Lukaku": 89,
    "Eden Hazard": 87, "Dries Mertens": 84, "Youri Tielemans": 84,
    "Toby Alderweireld": 84, "Jan Vertonghen": 83, "Axel Witsel": 84,
  }),
  France: Object.freeze({
    "Kylian Mbappé": 90, "N'Golo Kanté": 89, "Karim Benzema": 89,
    "Antoine Griezmann": 88, "Paul Pogba": 87, "Raphaël Varane": 86,
    "Hugo Lloris": 86, "Kingsley Coman": 85, "Lucas Hernández": 84,
  }),
  Spain: Object.freeze({
    "Sergio Busquets": 86, "Jordi Alba": 86, Thiago: 85, Koke: 85,
    "César Azpilicueta": 84, Pedri: 84, "Álvaro Morata": 84,
    "Ferran Torres": 84, "Dani Olmo": 83, "Pau Torres": 83, "Unai Simón": 83,
    "Aymeric Laporte": 86, Rodri: 85, "Marcos Llorente": 84, "Mikel Oyarzabal": 84,
    "Gerard Moreno": 84, "Pablo Sarabia": 82, "Eric García": 80,
  }),
  Portugal: Object.freeze({
    "Cristiano Ronaldo": 92, "Bruno Fernandes": 89, "Bernardo Silva": 88,
    "Rúben Dias": 87, "João Cancelo": 86, Pepe: 84, "Diogo Jota": 84,
    "Rui Patrício": 84, "Renato Sanches": 83,
  }),
  Germany: Object.freeze({
    "Manuel Neuer": 89, "Joshua Kimmich": 89, "Toni Kroos": 88, "Thomas Müller": 87,
    "Leon Goretzka": 86, "İlkay Gündoğan": 86, "Kai Havertz": 85,
    "Serge Gnabry": 85, "Antonio Rüdiger": 85, "Timo Werner": 84,
  }),
  Denmark: Object.freeze({
    "Christian Eriksen": 86, "Kasper Schmeichel": 85, "Pierre-Emile Højbjerg": 84,
    "Simon Kjær": 84, "Andreas Christensen": 83, "Joakim Mæhle": 83,
    "Kasper Dolberg": 82, "Yussuf Poulsen": 81,
  }),
  Netherlands: Object.freeze({
    "Frenkie de Jong": 86, "Matthijs de Ligt": 85, "Memphis Depay": 85,
    "Georginio Wijnaldum": 84, "Stefan de Vrij": 84, "Denzel Dumfries": 83,
  }),
  Switzerland: Object.freeze({
    "Yann Sommer": 86, "Xherdan Shaqiri": 84, "Granit Xhaka": 84,
    "Manuel Akanji": 83, "Haris Seferovic": 82,
  }),
  Croatia: Object.freeze({
    "Luka Modrić": 88, "Ivan Perišić": 84, "Mateo Kovačić": 84,
    "Marcelo Brozović": 84, "Andrej Kramarić": 82,
  }),
  Poland: Object.freeze({ "Robert Lewandowski": 92, "Wojciech Szczęsny": 87, "Piotr Zieliński": 83 }),
  Sweden: Object.freeze({ "Emil Forsberg": 83, "Victor Lindelöf": 82, "Alexander Isak": 82 }),
  Wales: Object.freeze({ "Gareth Bale": 85, "Aaron Ramsey": 83, "Daniel James": 81, "Kieffer Moore": 80 }),
  "Czech Republic": Object.freeze({ "Patrik Schick": 84, "Tomáš Souček": 84, "Vladimír Coufal": 82 }),
  Ukraine: Object.freeze({ "Andriy Yarmolenko": 82, "Oleksandr Zinchenko": 82, "Roman Yaremchuk": 81 }),
  Austria: Object.freeze({ "David Alaba": 85, "Marcel Sabitzer": 84, "Marko Arnautović": 82 }),
  Hungary: Object.freeze({ "Péter Gulácsi": 85, "Willi Orbán": 82, "Ádám Szalai": 79 }),
  Finland: Object.freeze({ "Lukas Hradecky": 83, "Teemu Pukki": 79, "Glen Kamara": 77 }),
  "North Macedonia": Object.freeze({ "Elif Elmas": 79, "Enis Bardhi": 78, "Goran Pandev": 78 }),
});

function retroEuro2020Clamp(value, minimum = 1, maximum = 99) {
  return Math.max(minimum, Math.min(maximum, Math.round(Number(value) || minimum)));
}

function retroEuro2020AdjustedRatings(player, overall) {
  const difference = overall - Number(player.overall || overall);
  const adjustBlock = (block) => block && Object.fromEntries(Object.entries(block).map(([key, value]) => [
    key,
    Number.isFinite(Number(value)) ? retroEuro2020Clamp(Number(value) + difference * 0.72) : value,
  ]));
  return {
    attributes: adjustBlock(player.attributes),
    goalkeeping: adjustBlock(player.goalkeeping),
    penaltyTakingAbility: Number.isFinite(Number(player.penaltyTakingAbility))
      ? retroEuro2020Clamp(Number(player.penaltyTakingAbility) + difference * 0.55)
      : player.penaltyTakingAbility,
  };
}

function retroEuro2020SourceSquad(teamName) {
  const templateName = RETRO_EURO_2020_TEMPLATE_BY_TEAM[teamName] || teamName;
  return (typeof RETRO_2018_SQUADS !== "undefined" && RETRO_2018_SQUADS[templateName])
    || (typeof RETRO_EURO_2016_SQUADS !== "undefined" && RETRO_EURO_2016_SQUADS[templateName])
    || (typeof RETRO_2022_SQUADS !== "undefined" && RETRO_2022_SQUADS[templateName]);
}

function retroEuro2020Squad(teamName) {
  const source = retroEuro2020SourceSquad(teamName);
  if (!source) throw new Error(`Missing Euro 2020 squad template for ${teamName}`);
  const replacementNames = RETRO_EURO_2020_FALLBACK_NAMES[teamName] || null;
  const renamedPlayers = RETRO_EURO_2020_PLAYER_RENAMES[teamName] || {};
  const sourceXI = source.players.filter((player) => (source.startingXI || []).includes(player.number));
  const sourceXIAverage = sourceXI.reduce((total, player) => total + Number(player.overall || 70), 0) / Math.max(1, sourceXI.length);
  const squadShift = Number(RETRO_EURO_2020_XI_TARGETS[teamName] || sourceXIAverage) - sourceXIAverage;
  const explicitRatings = RETRO_EURO_2020_PLAYER_RATINGS[teamName] || {};
  const players = source.players.slice(0, 23).map((player, index) => {
    const name = replacementNames?.[index] || renamedPlayers[player.name] || player.name;
    const overall = retroEuro2020Clamp(
      explicitRatings[name] ?? (Number(player.overall || 70) + squadShift),
      60,
      92,
    );
    const adjusted = retroEuro2020AdjustedRatings(player, overall);
    return Object.freeze({
      ...player,
      ...adjusted,
      name,
      displayName: name,
      overall,
      euroGoals: 0,
      ratingJustification: `Euro 2020 retrospective blend: FIFA 21-era ability, 2020/21 form and tournament performance. Final rating: ${overall}.`,
      sources: Object.freeze([...(player.sources || []), "fifa21_rating_baseline", "uefa_euro_2020_performance_review", "2020_21_form_review"]),
    });
  });
  return Object.freeze({
    ...source,
    coach: RETRO_EURO_2020_COACHES[teamName] || source.coach,
    players: Object.freeze(players),
    startingXI: Object.freeze((source.startingXI || []).filter((number) => players.some((player) => player.number === number)).slice(0, 11)),
    penaltyTakers: Object.freeze((source.penaltyTakers || [])
      .map((name) => renamedPlayers[name] || name)
      .filter((name) => players.some((player) => player.name === name))),
  });
}

const RETRO_EURO_2020_SQUADS = Object.freeze(Object.fromEntries(
  RETRO_EURO_2020_TEAM_NAMES.map((teamName) => [teamName, retroEuro2020Squad(teamName)]),
));
