import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.join(root, "tmp", "fjelstul-worldcup", "data-csv");
const outputPath = path.join(root, "data/retro/2002/squads.js");
const officialClubsPath = path.join(root, "data/retro/2002/clubs.generated.json");
const officialClubs = JSON.parse(fs.readFileSync(officialClubsPath, "utf8"));

// Pre-tournament simulator ratings: 15 May 2002 FIFA ranking strength, then
// a small 2001/02 squad-quality adjustment. The rating notes below keep those
// assumptions visible instead of presenting them as an official EA export.
const TEAM_RATINGS = Object.freeze({
  France: 90, Senegal: 77, Uruguay: 76, Denmark: 81,
  Spain: 86, Slovenia: 72, Paraguay: 78, "South Africa": 72,
  Brazil: 91, Turkey: 81, China: 67, "Costa Rica": 73,
  "South Korea": 78, Poland: 74, "United States": 80, Portugal: 87,
  Germany: 84, "Saudi Arabia": 67, "Republic of Ireland": 79, Cameroon: 75,
  Argentina: 89, Nigeria: 77, England: 85, Sweden: 81,
  Italy: 87, Ecuador: 74, Croatia: 78, Mexico: 82,
  Japan: 76, Belgium: 77, Russia: 75, Tunisia: 70,
});

// FIFA/Coca-Cola ranking published 15 May 2002 (the final list before the
// Korea/Japan tournament). Argentina and Brazil were tied at number two.
const FIFA_RANKING = Object.freeze({
  France: { rank: 1, points: 802 }, Brazil: { rank: 2, points: 784 }, Argentina: { rank: 2, points: 784 },
  Portugal: { rank: 5, points: 726 }, Italy: { rank: 6, points: 717 }, Mexico: { rank: 7, points: 716 },
  Spain: { rank: 8, points: 713 }, Germany: { rank: 11, points: 695 }, England: { rank: 12, points: 694 },
  "United States": { rank: 13, points: 690 }, "Republic of Ireland": { rank: 15, points: 674 },
  Cameroon: { rank: 17, points: 672 }, Paraguay: { rank: 18, points: 671 }, Sweden: { rank: 19, points: 665 },
  Denmark: { rank: 20, points: 657 }, Croatia: { rank: 21, points: 655 }, Turkey: { rank: 22, points: 654 },
  Belgium: { rank: 23, points: 653 }, Uruguay: { rank: 24, points: 652 }, Slovenia: { rank: 25, points: 649 },
  Nigeria: { rank: 27, points: 644 }, Russia: { rank: 27, points: 644 }, "Costa Rica": { rank: 29, points: 643 },
  Tunisia: { rank: 30, points: 635 }, Japan: { rank: 32, points: 634 }, "Saudi Arabia": { rank: 34, points: 627 },
  Ecuador: { rank: 35, points: 624 }, "South Africa": { rank: 37, points: 623 }, Poland: { rank: 38, points: 615 },
  "South Korea": { rank: 40, points: 603 }, Senegal: { rank: 42, points: 599 }, China: { rank: 50, points: 566 },
});

const GROUPS = Object.freeze({
  France: "A", Senegal: "A", Uruguay: "A", Denmark: "A",
  Spain: "B", Slovenia: "B", Paraguay: "B", "South Africa": "B",
  Brazil: "C", Turkey: "C", China: "C", "Costa Rica": "C",
  "South Korea": "D", Poland: "D", "United States": "D", Portugal: "D",
  Germany: "E", "Saudi Arabia": "E", "Republic of Ireland": "E", Cameroon: "E",
  Argentina: "F", Nigeria: "F", England: "F", Sweden: "F",
  Italy: "G", Ecuador: "G", Croatia: "G", Mexico: "G",
  Japan: "H", Belgium: "H", Russia: "H", Tunisia: "H",
});

// FIFA Soccer 2002 guide anchors (where published) plus season-context anchors
// for the most prominent 2002 players. Keys are normalized names; the explicit
// anchor flag means "manually anchored", not that EA published a complete
// historical database for every player.
const PLAYER_RATINGS = Object.freeze({
  oliverkahn: { overall: 94, fifaRating: 94 }, fabienbarthez: { overall: 90, fifaRating: 92 },
  ikercasillas: { overall: 85, fifaRating: 83 }, gianluigibuffon: { overall: 92, fifaRating: 91 },
  shaygiven: { overall: 86, fifaRating: 84 }, bradfriedel: { overall: 86, fifaRating: 84 },
  germanburgos: { overall: 81, fifaRating: 81 },
  robertoayala: { overall: 87, fifaRating: 88 }, javierzanetti: { overall: 89, fifaRating: 89 },
  juansebastianveron: { overall: 86, fifaRating: 87 }, gabrielbatistuta: { overall: 87, fifaRating: 90 },
  arielortega: { overall: 84, fifaRating: 88 }, pabloaimar: { overall: 85, fifaRating: 90 },
  hernancrespo: { overall: 90, fifaRating: 91 }, diegosimeone: { overall: 84, fifaRating: 87 },
  kilygonzalez: { overall: 82, fifaRating: 84 }, marcelogallardo: { overall: 82, fifaRating: 84 },
  claudiolopez: { overall: 82, fifaRating: 84 },
  patrickvieira: { overall: 88, fifaRating: 86 }, zinedinezidane: { overall: 93, fifaRating: 94 },
  thierryhenry: { overall: 90, fifaRating: 88 }, bixentelizarazu: { overall: 86, fifaRating: 87 },
  marceldesailly: { overall: 87, fifaRating: 88 }, lilianthuram: { overall: 89, fifaRating: 88 },
  claudemakelele: { overall: 88, fifaRating: 87 }, davidtrezeguet: { overall: 87, fifaRating: 88 },
  sylvainwiltord: { overall: 84, fifaRating: 85 }, youridjorkaeff: { overall: 82, fifaRating: 85 },
  willysagnol: { overall: 83, fifaRating: 80 },
  ronaldo: { overall: 96, fifaRating: 95 }, rivaldo: { overall: 94, fifaRating: 88 },
  ronaldinho: { overall: 87, fifaRating: 84 }, cafu: { overall: 90, fifaRating: 90 },
  robertocarlos: { overall: 92, fifaRating: 94 }, lucio: { overall: 89, fifaRating: 90 },
  edmilson: { overall: 86, fifaRating: 84 }, gilbertosilva: { overall: 85, fifaRating: 82 },
  marcos: { overall: 87, fifaRating: 84 }, dida: { overall: 83, fifaRating: 82 },
  kleberson: { overall: 84, fifaRating: 78 }, juninhopaulista: { overall: 82, fifaRating: 84 },
  denilson: { overall: 81, fifaRating: 84 }, roquejunior: { overall: 82, fifaRating: 79 }, luizao: { overall: 81, fifaRating: 80 },
  michaelballack: { overall: 89, fifaRating: 90 }, miroslavklose: { overall: 86, fifaRating: 88 },
  dieterhamann: { overall: 85, fifaRating: 85 }, jensjeremies: { overall: 84, fifaRating: 87 },
  christianziege: { overall: 82, fifaRating: 85 }, torstenfrings: { overall: 84, fifaRating: 84 },
  christophmetzelder: { overall: 83, fifaRating: 82 }, thomaslinke: { overall: 82, fifaRating: 83 },
  carstenjancker: { overall: 80, fifaRating: 82 }, oliverneuville: { overall: 80, fifaRating: 81 },
  jenslehmann: { overall: 84, fifaRating: 84 }, berndschneider: { overall: 82, fifaRating: 82 },
  paolomaldini: { overall: 91, fifaRating: 92 }, alessandronesta: { overall: 93, fifaRating: 94 },
  fabiocannavaro: { overall: 89, fifaRating: 90 }, gianlucazambrotta: { overall: 88, fifaRating: 87 },
  gennarogattuso: { overall: 88, fifaRating: 90 }, francescototti: { overall: 92, fifaRating: 93 },
  christianvieri: { overall: 89, fifaRating: 88 }, alessandrodelpiero: { overall: 88, fifaRating: 90 },
  filippoinzaghi: { overall: 84, fifaRating: 86 }, vincenzomontella: { overall: 83, fifaRating: 86 },
  christianpanucci: { overall: 84, fifaRating: 85 }, francescotoldo: { overall: 87, fifaRating: 88 },
  luigidibiagio: { overall: 83, fifaRating: 86 },
  luisfigo: { overall: 95, fifaRating: 97 }, ruicosta: { overall: 88, fifaRating: 88 }, pauleta: { overall: 88, fifaRating: 86 },
  joaopinto: { overall: 83, fifaRating: 85 }, fernandocouto: { overall: 85, fifaRating: 89 }, vitorbaia: { overall: 85, fifaRating: 88 },
  capucho: { overall: 81, fifaRating: 83 }, nunogomes: { overall: 82, fifaRating: 83 }, sergioconceicao: { overall: 80, fifaRating: 82 },
  raul: { overall: 90, fifaRating: 90 }, fernandohierro: { overall: 88, fifaRating: 94 }, ivanhelguera: { overall: 87, fifaRating: 91 },
  fernandomorientes: { overall: 87, fifaRating: 86 }, gaizkamendieta: { overall: 86, fifaRating: 88 }, juancarlosvaleron: { overall: 84, fifaRating: 85 },
  xavi: { overall: 83, fifaRating: 84 }, carlespuyol: { overall: 84, fifaRating: 83 }, rubenbaraja: { overall: 84, fifaRating: 84 },
  joaquin: { overall: 82, fifaRating: 81 }, albertluque: { overall: 80, fifaRating: 80 },
  davidbeckham: { overall: 88, fifaRating: 85 }, michaelowen: { overall: 88, fifaRating: 90 }, solcampbell: { overall: 87, fifaRating: 88 },
  rioferdinand: { overall: 88, fifaRating: 87 }, paulscholes: { overall: 87, fifaRating: 88 }, stevengerrard: { overall: 85, fifaRating: 88 },
  davidseaman: { overall: 85, fifaRating: 86 }, ashleycole: { overall: 84, fifaRating: 84 }, emileheskey: { overall: 80, fifaRating: 82 },
  nickybutt: { overall: 80, fifaRating: 82 }, teddysheringham: { overall: 79, fifaRating: 80 },
  henriklarsson: { overall: 89, fifaRating: 92 }, freddieljungberg: { overall: 86, fifaRating: 86 }, marcusallback: { overall: 81, fifaRating: 82 },
  olofmellberg: { overall: 84, fifaRating: 84 }, magnushedman: { overall: 81, fifaRating: 82 }, tobiaslinderoth: { overall: 79, fifaRating: 78 },
  zlatanibrahimovic: { overall: 77, fifaRating: 78 }, jondahltomasson: { overall: 85, fifaRating: 84 }, ebbesand: { overall: 82, fifaRating: 84 },
  thomassorensen: { overall: 83, fifaRating: 83 }, thomasgravesen: { overall: 81, fifaRating: 80 }, thomashelveg: { overall: 81, fifaRating: 81 },
  renehenriksen: { overall: 80, fifaRating: 80 }, jespergronkjaer: { overall: 81, fifaRating: 82 },
  rusturecber: { overall: 86, fifaRating: 86 }, hakansukur: { overall: 84, fifaRating: 84 }, hassansas: { overall: 84, fifaRating: 84 },
  emrebelzoglu: { overall: 82, fifaRating: 82 }, yildiraybasturk: { overall: 83, fifaRating: 83 }, bulentkorkmaz: { overall: 81, fifaRating: 81 },
  alpayozalan: { overall: 82, fifaRating: 82 }, okanburuk: { overall: 80, fifaRating: 80 }, nihatkahveci: { overall: 80, fifaRating: 80 },
  ilhanmansiz: { overall: 81, fifaRating: 78 },
  samueletoo: { overall: 83, fifaRating: 84 }, patrickmboma: { overall: 82, fifaRating: 88 }, geremi: { overall: 82, fifaRating: 83 },
  marcvivienfoe: { overall: 81, fifaRating: 82 }, rigobertsong: { overall: 81, fifaRating: 84 }, lauren: { overall: 80, fifaRating: 80 }, pierrewome: { overall: 78, fifaRating: 78 },
  elhadjidiouf: { overall: 84, fifaRating: 84 }, henricamara: { overall: 80, fifaRating: 80 },
  papaboubadiop: { overall: 81, fifaRating: 80 }, salifdiao: { overall: 80, fifaRating: 80 }, khaliloufadiga: { overall: 82, fifaRating: 82 },
  tonysylva: { overall: 79, fifaRating: 78 }, ferdinandcoly: { overall: 78, fifaRating: 78 }, habibeye: { overall: 78, fifaRating: 78 },
  parkjisung: { overall: 83, fifaRating: 82 }, jisungpark: { overall: 83, fifaRating: 82 }, hongmyungbo: { overall: 82, fifaRating: 82 },
  youngpyolee: { overall: 81, fifaRating: 80 }, ahnjunghwan: { overall: 82, fifaRating: 81 }, junghwanahn: { overall: 82, fifaRating: 81 },
  hwangsunhong: { overall: 79, fifaRating: 80 }, sunhonghwang: { overall: 79, fifaRating: 80 }, kimnamil: { overall: 80, fifaRating: 78 },
  woonjaelee: { overall: 81, fifaRating: 80 }, yoosangchul: { overall: 81, fifaRating: 80 }, songjongguk: { overall: 79, fifaRating: 78 },
  choiyongsoo: { overall: 78, fifaRating: 78 }, clauswilmots: { overall: 83, fifaRating: 84 }, danielvanbuyten: { overall: 81, fifaRating: 80 },
  timmysimons: { overall: 79, fifaRating: 77 }, gertverheyen: { overall: 78, fifaRating: 77 }, ericdeflandre: { overall: 79, fifaRating: 78 },
  bartgoor: { overall: 78, fifaRating: 78 }, mbompenza: { overall: 79, fifaRating: 79 }, geertdevlieger: { overall: 76, fifaRating: 76 },
  valerykarpin: { overall: 84, fifaRating: 88 }, aleksandrmostovoi: { overall: 84, fifaRating: 87 }, yegortitov: { overall: 82, fifaRating: 83 },
  viktoronopko: { overall: 81, fifaRating: 83 }, dmitrialenichev: { overall: 82, fifaRating: 84 }, alexeysmertin: { overall: 81, fifaRating: 80 },
  vladimirbeschastnykh: { overall: 79, fifaRating: 80 }, dmitrikhokhlov: { overall: 79, fifaRating: 80 },
  joseluischilavert: { overall: 88, fifaRating: 89 }, carlosgamarra: { overall: 85, fifaRating: 87 }, celsoayala: { overall: 83, fifaRating: 86 },
  franciscoarce: { overall: 82, fifaRating: 84 }, roquesantacruz: { overall: 81, fifaRating: 80 }, josecardozo: { overall: 83, fifaRating: 87 },
  robertoacuna: { overall: 80, fifaRating: 82 }, nelsoncuevas: { overall: 78, fifaRating: 77 }, rafaelmarquez: { overall: 86, fifaRating: 84 },
  jaredborgetti: { overall: 84, fifaRating: 84 }, cuauhtemocblanco: { overall: 84, fifaRating: 86 }, oswaldosanchez: { overall: 81, fifaRating: 80 },
  gerardotorrado: { overall: 80, fifaRating: 79 }, ramonmorales: { overall: 78, fifaRating: 78 }, jesusarellano: { overall: 79, fifaRating: 80 },
  luishernandez: { overall: 77, fifaRating: 80 }, hidetoshinakata: { overall: 86, fifaRating: 84 }, shinjiono: { overall: 81, fifaRating: 80 },
  junichiinamoto: { overall: 80, fifaRating: 76 }, masashinakayama: { overall: 78, fifaRating: 80 }, takayukisuzuki: { overall: 78, fifaRating: 76 },
  yoshikatsukawaguchi: { overall: 78, fifaRating: 78 }, tsuneyasumiyamoto: { overall: 78, fifaRating: 76 }, alessandrosantos: { overall: 79, fifaRating: 78 },
  claudioreyna: { overall: 85, fifaRating: 84 }, johnobrien: { overall: 82, fifaRating: 81 }, brianmcbride: { overall: 82, fifaRating: 81 },
  landondonovan: { overall: 81, fifaRating: 80 }, clintmathis: { overall: 80, fifaRating: 79 }, damarcusbeasley: { overall: 79, fifaRating: 78 }, eddiepope: { overall: 81, fifaRating: 80 },
  paolomontero: { overall: 84, fifaRating: 88 }, alvarorecoba: { overall: 86, fifaRating: 87 }, diegoforlan: { overall: 80, fifaRating: 78 },
  fabianoneill: { overall: 80, fifaRating: 83 }, dariosilva: { overall: 80, fifaRating: 80 }, sebastianabreu: { overall: 81, fifaRating: 82 },
  fabiancarini: { overall: 80, fifaRating: 79 }, alejandrolembo: { overall: 80, fifaRating: 79 }, agustindelgado: { overall: 81, fifaRating: 80 },
  alexaguinaga: { overall: 82, fifaRating: 84 }, ivanhurtado: { overall: 80, fifaRating: 79 }, ulisesdelacruz: { overall: 79, fifaRating: 77 },
  josefranciscocevallos: { overall: 78, fifaRating: 77 }, ivankaviedes: { overall: 78, fifaRating: 80 }, edisonmendez: { overall: 78, fifaRating: 78 },
  okocha: { overall: 87, fifaRating: 89 }, nwankwokanu: { overall: 84, fifaRating: 88 }, taribowest: { overall: 82, fifaRating: 84 },
  josephyobo: { overall: 80, fifaRating: 78 }, celestinebabayaro: { overall: 80, fifaRating: 80 }, juliusaghahowa: { overall: 79, fifaRating: 79 }, garbalawal: { overall: 78, fifaRating: 78 },
  jerzydudek: { overall: 82, fifaRating: 82 }, emmanuelolisadebe: { overall: 82, fifaRating: 80 }, jacekkrzynowek: { overall: 80, fifaRating: 79 },
  maciejzurawski: { overall: 79, fifaRating: 79 }, tomaszhajto: { overall: 78, fifaRating: 80 }, radoslawkaluzny: { overall: 78, fifaRating: 78 },
  mohamedaldeayea: { overall: 82, fifaRating: 82 }, samialjaber: { overall: 80, fifaRating: 79 }, mohammadalshalhoub: { overall: 77, fifaRating: 75 },
  mohammednoor: { overall: 77, fifaRating: 76 }, paulowanchope: { overall: 82, fifaRating: 83 }, waltercenteno: { overall: 79, fifaRating: 80 },
  rolandofonseca: { overall: 78, fifaRating: 79 }, luismarin: { overall: 79, fifaRating: 78 }, ericklonnis: { overall: 77, fifaRating: 76 },
  bennimccarthy: { overall: 84, fifaRating: 84 }, quintonfortune: { overall: 80, fifaRating: 82 }, lucasradebe: { overall: 81, fifaRating: 80 },
  siyabonganomvethe: { overall: 78, fifaRating: 77 }, stevenpienaar: { overall: 77, fifaRating: 75 }, hansvonk: { overall: 77, fifaRating: 78 },
  zlatkozahovic: { overall: 83, fifaRating: 86 }, milenkoacimovic: { overall: 82, fifaRating: 82 }, alesceh: { overall: 80, fifaRating: 81 },
  aleksanderknavs: { overall: 80, fifaRating: 78 }, zeljkomilinovic: { overall: 78, fifaRating: 78 }, milanosterc: { overall: 77, fifaRating: 77 },
  stipepletikosa: { overall: 82, fifaRating: 80 }, robertprosinecki: { overall: 80, fifaRating: 87 }, davorsuker: { overall: 84, fifaRating: 90 },
  nikokovac: { overall: 83, fifaRating: 84 }, robertkovac: { overall: 83, fifaRating: 84 }, milanrapaic: { overall: 81, fifaRating: 84 },
  alenboksic: { overall: 79, fifaRating: 85 }, josipsimunic: { overall: 82, fifaRating: 82 },
  khaledbadra: { overall: 78, fifaRating: 78 }, zoubeirbaya: { overall: 80, fifaRating: 82 }, hatemtrabelsi: { overall: 82, fifaRating: 83 },
  ziadjaziri: { overall: 79, fifaRating: 77 }, radhijaidi: { overall: 80, fifaRating: 78 }, aliboumnijel: { overall: 77, fifaRating: 75 },
  roykeane: { overall: 87, fifaRating: 89 }, damienduff: { overall: 86, fifaRating: 84 }, robbiekeane: { overall: 83, fifaRating: 82 },
  stevefinnan: { overall: 82, fifaRating: 80 }, stevestaunton: { overall: 80, fifaRating: 82 }, mattholland: { overall: 80, fifaRating: 81 },
});

const CAPTAINS = Object.freeze({
  Argentina: "Roberto Ayala", Belgium: "Marc Wilmots", Brazil: "Cafu", Cameroon: "Rigobert Song", China: "Zhiyi Fan",
  "Costa Rica": "Rolando Fonseca", Croatia: "Robert Kovač", Denmark: "Jan Heintze", Ecuador: "Iván Hurtado",
  England: "David Beckham", France: "Marcel Desailly", Germany: "Oliver Kahn", Italy: "Paolo Maldini", Japan: "Ryuzo Morioka",
  Mexico: "Rafael Márquez", Nigeria: "Jay-Jay Okocha", Paraguay: "José Luis Chilavert", Poland: "Tomasz Wałdoch",
  Portugal: "Fernando Couto", "Republic of Ireland": "Roy Keane", Russia: "Viktor Onopko", "Saudi Arabia": "Sami Al-Jaber",
  Senegal: "Aliou Cissé", Slovenia: "Zlatko Zahovič", "South Africa": "Lucas Radebe", "South Korea": "Myung-bo Hong",
  Spain: "Fernando Hierro", Sweden: "Johan Mjällby", Tunisia: "Khaled Badra", Turkey: "Bülent Korkmaz",
  "United States": "Claudio Reyna", Uruguay: "Paolo Montero",
});

const PENALTY_TAKERS = Object.freeze({
  Argentina: ["Hernán Crespo", "Juan Sebastián Verón", "Ariel Ortega"], Brazil: ["Ronaldo", "Rivaldo", "Ronaldinho"],
  England: ["David Beckham", "Michael Owen", "Paul Scholes"], France: ["Zinedine Zidane", "David Trezeguet", "Thierry Henry"],
  Germany: ["Michael Ballack", "Miroslav Klose", "Bernd Schneider"], Italy: ["Francesco Totti", "Alessandro Del Piero", "Christian Vieri"],
  Portugal: ["Luís Figo", "Rui Costa", "Pauleta"], Spain: ["Raúl", "Gaizka Mendieta", "Fernando Morientes"],
  Turkey: ["Hakan Şükür", "Yıldıray Baştürk", "Hasan Şaş"], "United States": ["Claudio Reyna", "Landon Donovan", "Brian McBride"],
});

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') { field += '"'; index += 1; } else quoted = !quoted;
    } else if (character === "," && !quoted) { row.push(field); field = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(field); if (row.some(Boolean)) rows.push(row); row = []; field = "";
    } else field += character;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
}

function readCsv(name) { return parseCsv(fs.readFileSync(path.join(sourceRoot, `${name}.csv`), "utf8")); }
function fullName(row) { return row.given_name === "not applicable" ? row.family_name : `${row.given_name} ${row.family_name}`; }
function normalize(value) { return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function clamp(value, minimum, maximum) { return Math.max(minimum, Math.min(maximum, value)); }
function broadPosition(code) {
  if (code === "GK") return "GK";
  if (["CB", "LB", "RB", "SW", "DF"].includes(code)) return "DF";
  if (["CF", "SS", "LW", "RW", "LF", "RF", "FW"].includes(code)) return "FW";
  return "MF";
}
function playerAttributes(position, overall) {
  const profiles = { GK: [35, 45, 40, 42, 55, 64], DF: [66, 52, 61, 58, 82, 78], MF: [70, 68, 78, 77, 64, 70], FW: [78, 82, 66, 79, 38, 70] };
  const [pace, shooting, passing, dribbling, defending, physic] = profiles[position];
  const shift = overall - 76;
  return {
    pace: clamp(pace + Math.round(shift * 0.55), 35, 96), shooting: clamp(shooting + Math.round(shift * 0.72), 18, 96),
    passing: clamp(passing + Math.round(shift * 0.66), 25, 96), dribbling: clamp(dribbling + Math.round(shift * 0.68), 25, 97),
    defending: clamp(defending + Math.round(shift * 0.64), 18, 97), physic: clamp(physic + Math.round(shift * 0.55), 35, 96),
    ...(position === "GK" ? {
      goalkeeping_diving: clamp(overall + 1, 45, 96), goalkeeping_handling: clamp(overall - 1, 45, 96),
      goalkeeping_kicking: clamp(overall - 4, 42, 94), goalkeeping_positioning: clamp(overall, 45, 96), goalkeeping_reflexes: clamp(overall + 2, 45, 97),
    } : {}),
  };
}
function inferFormation(starters) {
  const counts = starters.reduce((result, player) => { result[broadPosition(player.position_code)] += 1; return result; }, { GK: 0, DF: 0, MF: 0, FW: 0 });
  const shape = `${counts.DF}-${counts.MF}-${counts.FW}`;
  if (["4-4-2", "4-3-3", "3-5-2", "3-4-3", "5-3-2", "5-4-1"].includes(shape)) return shape;
  if (shape === "4-5-1") return "4-2-3-1";
  if (shape === "4-2-4") return "4-2-3-1";
  if (shape === "3-6-1") return "3-4-2-1";
  return "4-4-2";
}

const squadRows = readCsv("squads").filter((row) => row.tournament_id === "WC-2002");
const appearanceRows = readCsv("player_appearances").filter((row) => row.tournament_id === "WC-2002");
const goalRows = readCsv("goals").filter((row) => row.tournament_id === "WC-2002" && row.own_goal !== "1");
const managerRows = readCsv("manager_appointments").filter((row) => row.tournament_id === "WC-2002");

const squads = Object.fromEntries([...new Set(squadRows.map((row) => row.team_name))].map((teamName) => {
  const teamSquad = squadRows.filter((row) => row.team_name === teamName);
  const appearances = appearanceRows.filter((row) => row.team_name === teamName);
  const firstMatchId = [...new Set(appearances.map((row) => row.match_id))].sort()[0];
  const firstStarters = appearances.filter((row) => row.match_id === firstMatchId && row.starter === "1");
  const appearanceByPlayer = new Map();
  appearances.forEach((row) => {
    const current = appearanceByPlayer.get(row.player_id) || { appearances: 0, starts: 0, positions: new Map() };
    current.appearances += 1; current.starts += Number(row.starter);
    current.positions.set(row.position_code, (current.positions.get(row.position_code) || 0) + 1);
    appearanceByPlayer.set(row.player_id, current);
  });
  const goalsByPlayer = new Map();
  goalRows.filter((row) => row.player_team_name === teamName).forEach((row) => goalsByPlayer.set(row.player_id, (goalsByPlayer.get(row.player_id) || 0) + 1));
  const teamRating = TEAM_RATINGS[teamName];
  const players = teamSquad.map((row) => {
    const stats = appearanceByPlayer.get(row.player_id) || { appearances: 0, starts: 0, positions: new Map() };
    const detailedPosition = [...stats.positions.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || row.position_code;
    const position = broadPosition(detailedPosition);
    const name = fullName(row);
    const anchor = PLAYER_RATINGS[normalize(name)];
    const goals = goalsByPlayer.get(row.player_id) || 0;
    const involvement = Math.min(5, stats.starts) + Math.min(2, Math.max(0, stats.appearances - stats.starts)) * 0.5;
    const positionBoost = position === "GK" && stats.starts > 0 ? 1 : position === "FW" ? 1 : 0;
    const estimatedOverall = clamp(Math.round(teamRating - 8 + involvement * 0.65 + Math.min(3, goals * 0.5) + positionBoost), 55, 88);
    const overall = anchor?.overall || estimatedOverall;
    return {
      number: Number(row.shirt_number), name, displayName: name, position, positions: [detailedPosition],
      club: officialClubs[teamName]?.[String(Number(row.shirt_number))] || null,
      overall, fifaRating: anchor?.fifaRating || overall, fifaRatingIsAnchor: Boolean(anchor), preferredFoot: null,
      captain: CAPTAINS[teamName] === name, worldCupAppearances: stats.appearances, worldCupStarts: stats.starts, worldCupGoals: goals,
      ratingConfidence: anchor ? "high" : "medium",
      ratingSource: anchor ? "FIFA Soccer 2002-era/season-context anchor, 2001/02 form and tournament role" : "Historical 2001/02 estimate calibrated to FIFA ranking, role and tournament usage",
      ratingJustification: anchor ? `FIFA-era/season-context anchor (${anchor.fifaRating}) blended with 2001/02 form and Korea/Japan 2002 role` : "Team strength, 2001/02 role, appearances, starts and World Cup production blend",
      attributes: playerAttributes(position, overall),
    };
  }).sort((left, right) => left.number - right.number);
  const managers = managerRows.filter((row) => row.team_name === teamName).map(fullName).filter((name, index, names) => names.indexOf(name) === index);
  return [teamName, {
    group: GROUPS[teamName], coach: managers.join(" & "), formation: inferFormation(firstStarters), startingXI: firstStarters.map((row) => Number(row.shirt_number)),
    penaltyTakers: PENALTY_TAKERS[teamName] || players.filter((player) => player.position !== "GK").sort((left, right) => right.overall - left.overall).slice(0, 3).map((player) => player.name),
    fifaRanking: FIFA_RANKING[teamName],
    teamRatings: {
      overall: teamRating, attack: clamp(teamRating + 1, 60, 95), midfield: teamRating, defence: clamp(teamRating + (["Italy", "France"].includes(teamName) ? 2 : 0), 60, 95),
      goalkeeper: teamRating, squadDepth: clamp(teamRating - 1, 58, 94), experience: clamp(teamRating + (["France", "Italy"].includes(teamName) ? 2 : 0), 60, 95), penalties: clamp(teamRating - 1, 58, 94), discipline: 72,
    },
    players,
  }];
}));

if (Object.keys(squads).length !== 32) throw new Error("Korea/Japan 2002 generation requires exactly 32 squads.");
Object.entries(squads).forEach(([team, squad]) => {
  if (squad.players.length !== 23) throw new Error(`${team} requires exactly 23 players.`);
  if (squad.players.filter((player) => player.position === "GK").length !== 3) throw new Error(`${team} requires exactly three goalkeepers.`);
  if (squad.startingXI.length !== 11 || new Set(squad.startingXI).size !== 11) throw new Error(`${team} requires a valid opening-match XI.`);
  if (squad.players.some((player) => !player.club)) throw new Error(`${team} requires a dated tournament-time club for every player.`);
  if (!squad.fifaRanking || !GROUPS[team] || !Number.isFinite(squad.teamRatings.overall)) throw new Error(`${team} is missing 2002 metadata.`);
});

fs.writeFileSync(outputPath, `/* Official Korea/Japan 2002 23-player squads and opening XIs from the Fjelstul World Cup Database (CC-BY-SA-4.0). Clubs are dated to 31 May 2002 from the historical squad tables; ratings are transparent FIFA Soccer 2002-era anchors plus 2001/02 and tournament-role calibration. */\nconst RETRO_2002_SQUADS = Object.freeze(${JSON.stringify(squads, null, 2)});\n`, "utf8");
console.log(`Generated ${Object.keys(squads).length} Korea/Japan 2002 squads and ${Object.values(squads).reduce((sum, squad) => sum + squad.players.length, 0)} players.`);
