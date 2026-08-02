(function initUclSquadCalibration(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root?.UCL_FC27_SQUADS) api.apply(root.UCL_FC27_SQUADS, root.UclEngine);
  if (root) root.UclSquadCalibration = api;
}(typeof window !== "undefined" ? window : globalThis, function createUclSquadCalibration() {
  "use strict";

  const preferredXIs = Object.freeze({
    "real-madrid": ["Thibaut Courtois", "Ibrahima Konaté", "Éder Militão", "Marc Cucurella", "Trent Alexander-Arnold", "Aurélien Tchouaméni", "Federico Valverde", "Jude Bellingham", "Vinicius Junior", "Rodrygo", "Kylian Mbappé"],
    "manchester-city": ["Gianluigi Donnarumma", "Rúben Dias", "Josko Gvardiol", "Rayan Aït-Nouri", "Matheus Nunes", "Rodri", "Tijjani Reijnders", "Phil Foden", "Jérémy Doku", "Antoine Semenyo", "Erling Haaland"],
    "bayern-munich": ["Manuel Neuer", "Dayot Upamecano", "Jonathan Tah", "Alphonso Davies", "Konrad Laimer", "Joshua Kimmich", "Aleksandar Pavlovic", "Jamal Musiala", "Luis Díaz", "Michael Olise", "Harry Kane"],
    "paris-saint-germain": ["Lucas Chevalier", "Willian Pacho", "Marquinhos", "Nuno Mendes", "Achraf Hakimi", "Vitinha", "João Neves", "Fabián Ruiz", "Khvicha Kvaratskhelia", "Désiré Doué", "Ousmane Dembélé"],
    liverpool: ["Alisson", "Jérémy Jacquet", "Virgil van Dijk", "Milos Kerkez", "Jeremie Frimpong", "Ryan Gravenberch", "Alexis Mac Allister", "Florian Wirtz", "Cody Gakpo", "Hugo Ekitiké", "Alexander Isak"],
    barcelona: ["Joan García", "Pau Cubarsí", "Ronald Araujo", "Alejandro Balde", "Jules Koundé", "Pedri", "Frenkie de Jong", "Dani Olmo", "Raphinha", "Lamine Yamal", "Ferran Torres"],
    "inter-milan": ["Josep Martínez", "Alessandro Bastoni", "Manuel Akanji", "Benjamin Pavard", "Federico Dimarco", "Luis Henrique", "Hakan Çalhanoğlu", "Nicolò Barella", "Petar Sučić", "Lautaro Martínez", "Marcus Thuram"],
    arsenal: ["David Raya", "William Saliba", "Gabriel", "Riccardo Calafiori", "Jurriën Timber", "Martín Zubimendi", "Declan Rice", "Martin Ødegaard", "Gabriel Martinelli", "Bukayo Saka", "Viktor Gyökeres"],
    "atletico-madrid": ["Jan Oblak", "Dávid Hancko", "José María Giménez", "Alejandro Grimaldo", "Marcos Llorente", "Morten Hjulmand", "Pablo Barrios", "Álex Baena", "Ademola Lookman", "Giuliano Simeone", "Julián Alvarez"],
    "borussia-dortmund": ["Gregor Kobel", "Nico Schlotterbeck", "Waldemar Anton", "Emre Can", "Daniel Svensson", "Julian Ryerson", "Felix Nmecha", "Marcel Sabitzer", "Maximilian Beier", "Fábio Silva", "Serhou Guirassy"],
    napoli: ["Alex Meret", "Alessandro Buongiorno", "Amir Rrahmani", "Miguel Gutiérrez", "Giovanni Di Lorenzo", "Stanislav Lobotka", "Scott McTominay", "Kevin De Bruyne", "David Neres", "Matteo Politano", "Rasmus Højlund"],
    "manchester-united": ["Senne Lammens", "Leny Yoro", "Matthijs de Ligt", "Lisandro Martínez", "Patrick Dorgu", "Diogo Dalot", "Manuel Ugarte", "Kobbie Mainoo", "Bruno Fernandes", "Bryan Mbeumo", "Matheus Cunha"],
    "rb-leipzig": ["Péter Gulácsi", "Castello Lukeba", "Willi Orbán", "David Raum", "Benjamin Henrichs", "Nicolas Seiwald", "Arthur Vermeeren", "Christoph Baumgartner", "Antonio Nusa", "Yan Diomande", "Rômulo"],
    "sporting-cp": ["Rui Silva", "Ousmane Diomande", "Gonçalo Inácio", "Zeno Debast", "Maxi Araújo", "Iván Fresneda", "Daniel Bragança", "Pedro Gonçalves", "Geny Catamo", "Fotis Ioannidis", "Luis Suárez"],
    porto: ["Diogo Costa", "Jakub Kiwior", "Jan Bednarek", "Francisco Moura", "Alberto Costa", "Alan Varela", "Victor Froholdt", "Gabri Veiga", "Borja Sainz", "Pepê", "Samu Aghehowa"],
    villarreal: ["Luiz Júnior", "Renato Veiga", "Juan Foyth", "Sergi Cardona", "Santiago Mouriño", "Pape Gueye", "Santi Comesaña", "Alberto Moleiro", "Ilias Akhomach", "Nicolas Pépé", "Georges Mikautadze"],
    roma: ["Mile Svilar", "Evan Ndicka", "Gianluca Mancini", "Mario Hermoso", "Angeliño", "Wesley", "Bryan Cristante", "Manu Koné", "Matías Soulé", "Paulo Dybala", "Donyell Malen"],
    "aston-villa": ["Emiliano Martínez", "Ezri Konsa", "Pau Torres", "Ian Maatsen", "Matty Cash", "Amadou Onana", "Boubacar Kamara", "John McGinn", "Alejandro Garnacho", "Leon Bailey", "Ollie Watkins"],
    galatasaray: ["Uğurcan Çakır", "Davinson Sánchez", "Abdülkerim Bardakcı", "Ismail Jakobs", "Wilfried Singo", "Lucas Torreira", "Gabriel Sara", "İlkay Gündoğan", "Barış Alper Yılmaz", "Leroy Sané", "Victor Osimhen"],
  });

  const ratingOverrides = Object.freeze({
    "Vinicius Junior": 90, "Ibrahima Konaté": 85, "Marc Cucurella": 83, "Bernardo Silva": 87,
    "Brahim Díaz": 82, Endrick: 79, "Gonzalo García": 78, "Thiago Pitarch": 71, "Manuel Ángel": 70,
    "Issa Kaboré": 74, "Kalvin Phillips": 75, "Elliot Anderson": 82, "Vitor Reis": 76,
    "Juma Bah": 72, "Claudio Echeverri": 77, "Min-jae Kim": 83, "João Palhinha": 82,
    "Sacha Boey": 78, "Alessandro Longoni": 65, "Ilya Zabarnyi": 82, "Randal Kolo Muani": 81,
    "Jérémy Jacquet": 79, "Konstantinos Tsimikas": 78, "Harvey Elliott": 80, "Víctor Muñoz": 72,
    "Marc-André ter Stegen": 84, "Alejandro Balde": 83, "Fermín López": 84, "Anthony Gordon": 84,
    "Karim Adeyemi": 82, "Alessandro Bastoni": 86, "Nicolò Barella": 86, "Hakan Çalhanoğlu": 85,
    "Federico Dimarco": 84, "Lautaro Martínez": 88, "Marcus Thuram": 84, "Manuel Akanji": 83,
    "Benjamin Pavard": 83, "Petar Sučić": 80, "Luis Henrique": 79, "Martín Zubimendi": 85,
    "Ben White": 82, "Ethan Nwaneri": 79, "Max Dowman": 70, "Alejandro Grimaldo": 84,
    "Morten Hjulmand": 83, "Carlos Martín": 76, "Mussa Kaba": 67, "Justin Lerma": 72,
    "Mathis Albert": 70, "Samuele Inácio": 72, "Jens Cajuste": 78, "Noa Lang": 81,
    "Lorenzo Lucca": 79, "Harry Amass": 72, "Toby Collyer": 72, "Tyler Fletcher": 67,
    "Jack Fletcher": 68, "Shea Lacey": 70, "Suleman Sani": 72, "Ayodele Thomas": 68,
    "Robert Ramsak": 69, "Silas Andersen": 72, "Jesse Derry": 68, "Souleymane Faye": 74,
    "Samu Aghehowa": 81, "Gabriel Veron": 76, "Carlos Macià": 70, "Thiago Fernández": 74,
    "Ilias Akhomach": 78, "Mattia Mannini": 69, "Luigi Cherubini": 72, "Santiago Castro": 79,
    "Modou Kéba Cissé": 72, "Kosta Nedeljkovic": 73, "Johan Manzambi": 74,
    "Samuel Iling-Junior": 76, "Evann Guessand": 80, "Berat Luş": 68, "Armando Güner": 69,
  });

  const selectionExclusions = Object.freeze({
    "real-madrid": new Set(["Thiago Pitarch", "Manuel Ángel"]),
  });

  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, Math.round(value)));
  const average = (players, fallback) => players.length
    ? players.reduce((sum, player) => sum + Number(player.overall || 0), 0) / players.length
    : fallback;

  function calibratedEstimate(player, teamAnchor, preferred) {
    if (Number.isFinite(ratingOverrides[player.name])) return ratingOverrides[player.name];
    const current = Number(player.overall) || teamAnchor - 10;
    if (preferred) return clamp(Math.min(current, teamAnchor - 5), 64, 85);
    return clamp(Math.min(current, teamAnchor - 10, 80), 58, 80);
  }

  function roleMinutes(player, starters, bestOverall) {
    if (starters.has(player.name)) {
      if (player.position === "GK") return 0.96;
      return Number((0.82 + Math.max(0, player.overall - (bestOverall - 5)) * 0.018).toFixed(2));
    }
    if (player.position === "GK") return 0.08;
    const gap = Math.max(0, bestOverall - player.overall);
    return Number(clamp(52 - gap * 4, 10, 52) / 100);
  }

  function deriveRatings(players, teamAnchor) {
    const starters = players.filter((player) => player.startingXI);
    const line = (positions, fallback = teamAnchor) => average(starters.filter((player) => positions.includes(player.position)), fallback);
    const rawOverall = average(starters, teamAnchor);
    const overall = clamp(teamAnchor * 0.65 + rawOverall * 0.35, 58, 94);
    const blendLine = (value) => clamp(overall * 0.62 + value * 0.38, 55, 96);
    const depthRaw = average(players.slice().sort((a, b) => b.overall - a.overall).slice(0, 18), rawOverall - 2);
    return {
      overall,
      attack: blendLine(line(["LW", "RW", "CF", "ST", "CAM"])),
      midfield: blendLine(line(["CDM", "CM", "LM", "RM", "CAM"])),
      defence: blendLine(line(["CB", "LB", "RB", "LWB", "RWB"])),
      goalkeeper: blendLine(line(["GK"])),
      squadDepth: clamp(overall * 0.6 + depthRaw * 0.4, 55, 94),
      experience: clamp(overall, 55, 94),
      penalties: clamp(overall + 1, 55, 94),
      discipline: 72,
    };
  }

  function apply(squads, engine = null) {
    const issues = [];
    Object.entries(squads || {}).forEach(([teamId, squad]) => {
      const teamAnchor = Number(engine?.team?.(teamId)?.rating) || Number(squad.simulationRatings?.overall) || 75;
      const configuredXI = preferredXIs[teamId];
      const starters = new Set(configuredXI || squad.players.filter((player) => player.startingXI).map((player) => player.name));
      if (configuredXI) {
        configuredXI.filter((name) => !squad.players.some((player) => player.name === name))
          .forEach((name) => issues.push(`${teamId}: missing ${name}`));
      }
      squad.players.forEach((player) => {
        const estimated = /position estimate/i.test(player.ratingSource || "");
        if (estimated) {
          const nextOverall = calibratedEstimate(player, teamAnchor, starters.has(player.name));
          const difference = nextOverall - player.overall;
          player.overall = nextOverall;
          ["pace", "shooting", "passing", "dribbling", "defending", "physical"].forEach((key) => {
            if (Number.isFinite(player[key])) player[key] = clamp(player[key] + difference, 5, 95);
          });
          if (player.position === "GK") player.goalkeeping = nextOverall;
          player.finishing = player.position === "GK" ? 5 : clamp((Number(player.finishing) || nextOverall) + difference, 5, 95);
          player.ratingSource = `${player.ratingSource}; role-calibrated`;
        }
        player.startingXI = starters.has(player.name);
        player.selectionEligible = !selectionExclusions[teamId]?.has(player.name);
      });
      const bestOverall = Math.max(...squad.players.map((player) => Number(player.overall) || 0));
      squad.players.forEach((player) => {
        player.expectedMinutesShare = player.selectionEligible === false ? 0 : roleMinutes(player, starters, bestOverall);
        player.squadRole = starters.has(player.name) ? "starter" : player.expectedMinutesShare >= 0.38 ? "rotation" : "squad";
      });
      if (squad.players.filter((player) => player.startingXI).length !== 11) {
        issues.push(`${teamId}: expected 11 starters`);
      }
      squad.simulationRatings = deriveRatings(squad.players, teamAnchor);
    });
    return issues;
  }

  return Object.freeze({ apply, preferredXIs, ratingOverrides });
}));
