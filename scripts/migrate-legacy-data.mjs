import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const nationsRoot = join(root, "legacy-data", "nations");

// Position archetypes for attack/control/defence derivation
const POS = {
  GK:{a:0.30,c:0.60,d:1.15}, CB:{a:0.50,c:0.70,d:1.15},
  RB:{a:0.75,c:0.85,d:0.95}, LB:{a:0.75,c:0.85,d:0.95},
  RWB:{a:0.85,c:0.80,d:0.85}, LWB:{a:0.85,c:0.80,d:0.85},
  CDM:{a:0.60,c:0.85,d:1.05}, CM:{a:0.75,c:1.00,d:0.75},
  CAM:{a:1.05,c:1.00,d:0.45}, LM:{a:0.90,c:0.85,d:0.65},
  RM:{a:0.90,c:0.85,d:0.65}, LW:{a:1.10,c:0.85,d:0.40},
  RW:{a:1.10,c:0.85,d:0.40}, ST:{a:1.15,c:0.70,d:0.35},
  CF:{a:1.10,c:0.80,d:0.35}, SS:{a:1.10,c:0.85,d:0.35},
};

function derive(pos, ovr) {
  const p = POS[pos] || POS.CM;
  const c = v => Math.max(1, Math.min(99, Math.round(v)));
  return { attack: c(ovr * p.a), control: c(ovr * p.c), defence: c(ovr * p.d) };
}

function resolvePos(p) {
  if (p.primaryPosition) return p.primaryPosition;
  const m = {GK:"GK",DF:"CB",SW:"CB",MF:"CM",FW:"ST",DM:"CDM",AM:"CAM",WF:"LW"};
  return m[p.sourcePosition] || "CM";
}

function resolveSec(p, primary) {
  if (p.secondaryPositions?.length) return p.secondaryPositions;
  const sp = p.sourcePosition;
  if (!sp) return [];
  const e = new Set(["GK","CB","RB","LB","RWB","LWB","CDM","CM","CAM","LM","RM","LW","RW","ST","CF","SS"]);
  if (e.has(sp) && sp !== primary) return [sp];
  if (sp === "DF") return primary === "CB" ? ["LB","RB"] : ["CB"];
  if (sp === "MF") return primary === "CM" ? ["CDM","CAM"] : primary === "CDM" ? ["CM"] : primary === "CAM" ? ["CM"] : ["CM"];
  if (sp === "FW") return primary === "ST" ? ["CF"] : primary === "CF" ? ["ST"] : ["ST", "CF"];
  if (sp === "SW") return ["CB"];
  if (sp === "AM") return ["CM","CAM"];
  if (sp === "DM") return ["CM","CDM"];
  if (sp === "WF") return ["LW","RW"];
  return [];
}

// Nation base rating tier
const nationTiers = {
  argentina:85, belgium:79, brazil:86, england:82, france:83,
  germany:85, italy:84, netherlands:83, portugal:79, spain:82,
};

function eraMod(year) {
  if (year < 1990) return -4;
  if (year < 1994) return -3;
  if (year < 1998) return -1;
  return 0;
}

// World Cup result modifier
const wcResults = {
  "argentina:1986":"won","argentina:1990":"final","argentina:2014":"final","argentina:2022":"won",
  "belgium:2018":"sf","belgium:1986":"sf",
  "brazil:1994":"won","brazil:1998":"final","brazil:2002":"won",
  "england:1990":"sf","england:2018":"sf",
  "france:1998":"won","france:2006":"final","france:2018":"won","france:2022":"final",
  "germany:1986":"final","germany:1990":"won","germany:2002":"final","germany:2006":"sf","germany:2010":"sf","germany:2014":"won",
  "italy:1990":"sf","italy:1994":"final","italy:2006":"won",
  "netherlands:1998":"sf","netherlands:2010":"final","netherlands:2014":"sf",
  "portugal:2006":"sf",
  "spain:2010":"won",
};

function wcMod(nationId, year) {
  const r = wcResults[nationId+":"+year];
  if (r === "won") return 2;
  if (r === "final") return 2;
  if (r === "sf") return 1;
  return 0;
}

// Player tier overrides - adjustment from nation base tier
// addTier(nation, year, name, adjustment, confidence, basis)
const playerTiers = {};

function addTier(nation, year, name, adj, conf, basis) {
  playerTiers[nation+":"+name+":"+year] = [adj, conf, basis];
}

// === ARGENTINA ===
addTier("argentina",1986,"Diego Maradona",11,"high","Peak Maradona; greatest individual WC performance ever");
addTier("argentina",1986,"Jorge Valdano",4,"low","Real Madrid star, scored in 1986 final");
addTier("argentina",1986,"Jorge Burruchaga",2,"low","Scored winning goal in 1986 final");
addTier("argentina",1990,"Diego Maradona",8,"high","Still world-class despite injury; dragged Argentina to final");
addTier("argentina",1994,"Gabriel Batistuta",5,"high","Elite Fiorentina striker, hat-trick vs Greece");
addTier("argentina",1994,"Diego Maradona",4,"high","Still brilliant before suspension");
addTier("argentina",1994,"Fernando Redondo",3,"medium","Elite Real Madrid holding midfielder");
addTier("argentina",1994,"Diego Simeone",0,"medium","Emerging midfield enforcer, future Atletico legend");
addTier("argentina",1998,"Gabriel Batistuta",6,"high","FIFA 99; hat-trick vs Jamaica, 5 goals total");
addTier("argentina",1998,"Javier Zanetti",2,"high","FIFA 99; Inter tireless right-back/wing-back");
addTier("argentina",1998,"Diego Simeone",1,"medium","FIFA 99 era; Inter midfield general");
addTier("argentina",1998,"Ariel Ortega",1,"medium","FIFA 99 era; Sampdoria creative force");
addTier("argentina",2002,"Gabriel Batistuta",3,"high","FIFA 03; declining from peak but still elite");
addTier("argentina",2002,"Javier Zanetti",4,"high","FIFA 03; Inter captain, world-class right-back");
addTier("argentina",2002,"Juan Sebastián Verón",2,"high","FIFA 03; better for country than Man United");
addTier("argentina",2002,"Juan Pablo Sorín",0,"medium","FIFA 03 era; Lazio/Cruzeiro attacking full-back");
addTier("argentina",2006,"Hernán Crespo",2,"high","FIFA 07; Chelsea elite marksman, 3 goals in 2006");
addTier("argentina",2006,"Juan Román Riquelme",4,"high","FIFA 07; Villarreal magician, tournament standout");
addTier("argentina",2010,"Lionel Messi",7,"high","FIFA 10; Barcelona genius, 0 goals but constant threat");
addTier("argentina",2010,"Carlos Tevez",2,"high","FIFA 10; Man City warrior, 2 goals");
addTier("argentina",2010,"Javier Mascherano",3,"high","FIFA 10; Liverpool captain, world-class DM");
addTier("argentina",2014,"Lionel Messi",10,"high","FIFA 14; Golden Ball winner, 4 goals, carried to final");
addTier("argentina",2014,"Sergio Agüero",4,"high","FIFA 14; Man City elite striker, limited by injury");
addTier("argentina",2014,"Ángel Di María",3,"high","FIFA 14; Real Madrid standout until injured");
addTier("argentina",2018,"Lionel Messi",11,"high","FIFA 18; Barcelona GOAT despite team dysfunction");
addTier("argentina",2018,"Sergio Agüero",5,"high","FIFA 18; Man City, scored 2 goals");
addTier("argentina",2018,"Nicolás Otamendi",1,"high","FIFA 18; Man City title-winning defender");
addTier("argentina",2022,"Lionel Messi",10,"high","FIFA 23; 7 goals, 3 assists, Golden Ball, champion");
addTier("argentina",2022,"Emiliano Martínez",2,"high","FIFA 23; Aston Villa, Golden Glove, penalty hero");
addTier("argentina",2022,"Lautaro Martínez",3,"high","FIFA 23; Inter Milan, struggled but worked hard");
addTier("argentina",2022,"Ángel Di María",2,"high","FIFA 23; Juventus, scored beautiful final goal");
addTier("argentina",2022,"Rodrigo De Paul",1,"high","FIFA 23; Atletico Madrid tireless engine");
addTier("argentina",2022,"Cristian Romero",1,"high","FIFA 23; Tottenham aggressive defender");
addTier("argentina",2022,"Nicolás Otamendi",0,"high","FIFA 23; Benfica veteran leader at the back");
addTier("argentina",2014,"Javier Mascherano",2,"high","FIFA 14; Barcelona CB, heroic defensive tournament");
addTier("argentina",2018,"Nicolás Tagliafico",0,"medium","FIFA 18 era; Ajax attack-minded left-back");

// === BELGIUM ===
addTier("belgium",1986,"Enzo Scifo",5,"medium","Teenage prodigy, 1986 breakout star");
addTier("belgium",1986,"Jan Ceulemans",3,"low","Club Brugge legend, Golden Generation leader");
addTier("belgium",1986,"Jean-Marie Pfaff",2,"low","Bayern Munich world-class goalkeeper");
addTier("belgium",1990,"Enzo Scifo",5,"medium","Auxerre playmaker, world-class peak");
addTier("belgium",1994,"Michel Preud'homme",4,"medium","1994 Golden Glove winner, conceded 1 in group");
addTier("belgium",1994,"Enzo Scifo",4,"medium","Monaco playmaker, still elite");
addTier("belgium",2002,"Marc Wilmots",2,"medium","FIFA 03 era; Schalke, 3 goals in 2002");
addTier("belgium",2014,"Eden Hazard",6,"high","FIFA 14; Chelsea PFA Young Player of Year");
addTier("belgium",2014,"Vincent Kompany",5,"high","FIFA 14; Man City captain, world-class CB");
addTier("belgium",2014,"Thibaut Courtois",4,"high","FIFA 14; Atletico elite young GK");
addTier("belgium",2014,"Kevin De Bruyne",1,"high","FIFA 14; emerging Wolfsburg playmaker");
addTier("belgium",2018,"Eden Hazard",9,"high","FIFA 18; Silver Ball winner, tournament star");
addTier("belgium",2018,"Kevin De Bruyne",9,"high","FIFA 18; Man City assist king, world-class");
addTier("belgium",2018,"Thibaut Courtois",8,"high","FIFA 18; Chelsea, Golden Glove, world's best GK");
addTier("belgium",2018,"Romelu Lukaku",5,"high","FIFA 18; Man United, 4 goals, Bronze Boot");
addTier("belgium",2022,"Kevin De Bruyne",9,"high","FIFA 23; Man City, world's best midfielder");
addTier("belgium",2022,"Thibaut Courtois",8,"high","FIFA 23; Real Madrid, still elite");
addTier("belgium",2022,"Eden Hazard",1,"high","FIFA 23; rapidly declined, disappointing");
addTier("belgium",2022,"Youri Tielemans",2,"high","FIFA 23; Leicester quality box-to-box");
addTier("belgium",2018,"Dries Mertens",4,"high","FIFA 18; Napoli, scored 1 goal");
addTier("belgium",2018,"Yannick Carrasco",1,"high","FIFA 18; pacey winger");

// === BRAZIL ===
addTier("brazil",1986,"Sócrates",5,"low","Fiorentina genius, 1982/1986 star, fading from peak");
addTier("brazil",1986,"Careca",4,"low","Napoli legend, 5 goals in 1986");
addTier("brazil",1986,"Júnior",2,"low","Flamengo legend, 1982 star, versatile");
addTier("brazil",1990,"Careca",2,"low","Napoli, 2 goals, still clinical");
addTier("brazil",1990,"Dunga",1,"low","Fiorentina, emerging midfield leader");
addTier("brazil",1994,"Romário",9,"medium","Barcelona, Player of Tournament, 5 goals, Ballon d'Or");
addTier("brazil",1994,"Bebeto",2,"medium","Deportivo, 3 goals, iconic celebration");
addTier("brazil",1994,"Dunga",2,"low","Captain, 1994 champion, midfield leader");
addTier("brazil",1998,"Ronaldo",11,"high","FIFA 99; Ballon d'Or, 4 goals, mysterious final illness");
addTier("brazil",1998,"Rivaldo",4,"high","FIFA 99; Barcelona world-class, 3 goals");
addTier("brazil",1998,"Roberto Carlos",4,"high","FIFA 99; Real Madrid, world's best LB");
addTier("brazil",1998,"Cafu",3,"high","FIFA 99 era; Roma emerging world-class RWB");
addTier("brazil",2002,"Ronaldo",9,"high","FIFA 03; Golden Boot 8 goals, redemption story");
addTier("brazil",2002,"Rivaldo",5,"high","FIFA 03; Barcelona, 5 goals, legendary trio");
addTier("brazil",2002,"Ronaldinho",5,"high","FIFA 03; PSG, 2 goals, breakout star");
addTier("brazil",2002,"Cafu",4,"high","FIFA 03; Roma, captain, 3rd straight final");
addTier("brazil",2002,"Roberto Carlos",3,"high","FIFA 03; Real Madrid, still world-class LB");
addTier("brazil",2006,"Ronaldinho",7,"high","FIFA 07; Ballon d'Or holder, disappointing tournament");
addTier("brazil",2006,"Ronaldo",5,"high","FIFA 07; all-time WC top scorer at the time, 3 goals");
addTier("brazil",2006,"Kaká",5,"high","FIFA 07; emerging Ballon d'Or material");
addTier("brazil",2006,"Adriano",2,"high","FIFA 07; peak Emperor, 2 goals");
addTier("brazil",2010,"Júlio César",4,"high","FIFA 10; Inter treble-winning GK");
addTier("brazil",2010,"Maicon",4,"high","FIFA 10; Inter, world's best RB");
addTier("brazil",2010,"Lúcio",4,"high","FIFA 10; Inter treble-winning captain CB");
addTier("brazil",2010,"Kaká",4,"high","FIFA 10; Real Madrid, struggling with injury");
addTier("brazil",2010,"Luís Fabiano",1,"high","FIFA 10; Sevilla, 3 goals");
addTier("brazil",2014,"Neymar",4,"high","FIFA 14; Barcelona, 4 goals, injured before semifinal");
addTier("brazil",2014,"Thiago Silva",5,"high","FIFA 14; PSG world-class CB, missed semifinal");
addTier("brazil",2018,"Neymar",8,"high","FIFA 18; PSG, 2 goals, constant threat");
addTier("brazil",2018,"Alisson",3,"high","FIFA 18; Roma emerging world-class GK");
addTier("brazil",2018,"Casemiro",3,"high","FIFA 18; Real Madrid elite DM, suspended vs Belgium");
addTier("brazil",2018,"Philippe Coutinho",3,"high","FIFA 18; Barcelona, scored 2 goals");
addTier("brazil",2018,"Marcelo",4,"high","FIFA 18; Real Madrid elite attacking LB");
addTier("brazil",2018,"Thiago Silva",4,"high","FIFA 18; PSG, captain, scored 2 goals");
addTier("brazil",2022,"Neymar",7,"high","FIFA 23; PSG, 2 goals, GOAT-level talent");
addTier("brazil",2022,"Alisson",6,"high","FIFA 23; Liverpool world-class goalkeeper");
addTier("brazil",2022,"Casemiro",5,"high","FIFA 23; Man United, scored vs Switzerland");
addTier("brazil",2022,"Vinícius Júnior",3,"high","FIFA 23; Real Madrid emerging world-class");
addTier("brazil",2022,"Marquinhos",3,"high","FIFA 23; PSG top centre-back");
addTier("brazil",2022,"Richarlison",-1,"high","FIFA 23; Tottenham, 3 goals including bicycle kick");
addTier("brazil",2022,"Raphinha",2,"high","FIFA 23; Barcelona pacey winger");
addTier("brazil",2002,"Gilberto Silva",-2,"medium","FIFA 03 era; emerging holding midfielder, future Arsenal");
addTier("brazil",2002,"Lúcio",1,"high","FIFA 03; Leverkusen aggressive CB, champion");
addTier("brazil",2002,"Marcos",2,"high","FIFA 03; Palmeiras, goalkeeper of the tournament");

// === ENGLAND (already-rated ones keep their ratings) ===
addTier("england",1986,"Gary Lineker",5,"low","Everton/Barcelona, Golden Boot 6 goals");
addTier("england",1986,"Bryan Robson",4,"low","Man United captain, world-class box-to-box");
addTier("england",1986,"Glenn Hoddle",2,"low","Tottenham midfield genius");
addTier("england",1986,"Peter Shilton",2,"low","England's greatest ever goalkeeper");
addTier("england",1990,"Paul Gascoigne",5,"medium","Tottenham breakout star, tears in semifinal");
addTier("england",1990,"Gary Lineker",4,"low","Tottenham, 4 goals, 10 career WC goals");
addTier("england",1990,"John Barnes",2,"low","Liverpool powerful winger at his peak");
addTier("england",1990,"Stuart Pearce",1,"low","Nottingham Forest Psycho, powerful LB");
addTier("england",1998,"Alan Shearer",4,"high","FIFA 99; Newcastle, scored 2 goals");
addTier("england",1998,"David Seaman",3,"high","FIFA 99; Arsenal veteran goalkeeper");
addTier("england",1998,"Sol Campbell",1,"high","FIFA 99; Tottenham/Arsenal solid CB");
addTier("england",1998,"Paul Scholes",0,"high","FIFA 99; Man United emerging midfield star");
addTier("england",1998,"Tony Adams",1,"high","FIFA 99; Arsenal defensive rock");
addTier("england",2002,"Michael Owen",5,"high","FIFA 03; Liverpool, scored vs Denmark and Argentina");
addTier("england",2002,"David Beckham",4,"high","FIFA 03; Man United, redemption penalty vs Argentina");
addTier("england",2002,"Rio Ferdinand",1,"high","FIFA 03; Leeds/Man United emerging world-class CB");
addTier("england",2002,"Paul Scholes",3,"high","FIFA 03; Man United, brilliant tournament");
addTier("england",2002,"Ashley Cole",0,"high","FIFA 03; Arsenal emerging world-class LB");
addTier("england",2002,"Darius Vassell",-3,"medium","FIFA 03 era; Aston Villa young speedster");
addTier("england",2006,"Steven Gerrard",5,"high","FIFA 07; Liverpool, scored in group stage");
addTier("england",2006,"Frank Lampard",4,"high","FIFA 07; Chelsea, 0 goals, disappointing tournament");
addTier("england",2006,"Rio Ferdinand",4,"high","FIFA 07; Man United, world-class CB");
addTier("england",2006,"John Terry",3,"high","FIFA 07; Chelsea captain, solid CB");
addTier("england",2006,"Wayne Rooney",8,"high","FIFA 07; Man United, sent off vs Portugal");
addTier("england",2006,"Ashley Cole",3,"high","FIFA 07; Arsenal/Chelsea world-class LB");
addTier("england",2006,"Michael Owen",2,"high","FIFA 07; injured early, fading from peak");
addTier("england",2010,"Wayne Rooney",6,"high","FIFA 10; Man United, 0 goals, below his best");
addTier("england",2010,"Steven Gerrard",4,"high","FIFA 10; Liverpool, tournament captain");
addTier("england",2010,"Frank Lampard",2,"high","FIFA 10; Chelsea, ghost goal vs Germany");
addTier("england",2010,"Ashley Cole",1,"high","FIFA 10; Chelsea, world's best LB at the time");
addTier("england",2010,"Robert Green",-6,"high","FIFA 10; West Ham, infamous howler vs USA");
addTier("england",2010,"Ledley King",0,"high","FIFA 10; Tottenham elegant but injury-prone CB");
addTier("england",2014,"Wayne Rooney",4,"high","FIFA 14; Man United, scored vs Uruguay");
addTier("england",2014,"Steven Gerrard",0,"high","FIFA 14; Liverpool fading legend, error vs Uruguay");
addTier("england",2014,"Daniel Sturridge",-2,"high","FIFA 14; Liverpool, scored vs Italy");
addTier("england",2014,"Raheem Sterling",-2,"high","FIFA 14; Liverpool emerging speedster");
addTier("england",2018,"Harry Kane",4,"high","FIFA 18; Tottenham, Golden Boot 6 goals");
addTier("england",2018,"Raheem Sterling",2,"high","FIFA 18; Man City, 0 goals but dangerous");
addTier("england",2018,"Jordan Pickford",-2,"high","FIFA 18; Everton, Golden Glove, penalty hero");
addTier("england",2018,"Kieran Trippier",-3,"high","FIFA 18; Tottenham, scored free kick in semifinal");
addTier("england",2018,"Harry Maguire",-2,"high","FIFA 18; Leicester, scored in quarterfinal");
addTier("england",2018,"Dele Alli",2,"high","FIFA 18; Tottenham, scored vs Sweden");
addTier("england",2018,"John Stones",-2,"high","FIFA 18; Man City, scored 2 goals");
addTier("england",2022,"Harry Kane",7,"high","FIFA 23; Tottenham, scored 2 goals, missed pen vs France");
addTier("england",2022,"Jude Bellingham",2,"high","FIFA 23; Dortmund, brilliant at 19 years old");
addTier("england",2022,"Declan Rice",2,"high","FIFA 23; West Ham solid defensive midfielder");
addTier("england",2022,"Bukayo Saka",0,"high","FIFA 23; Arsenal, scored 3 goals");
addTier("england",2022,"Raheem Sterling",4,"high","FIFA 23; Chelsea/Man City, 1 goal");
addTier("england",2022,"Jordan Pickford",0,"high","FIFA 23; Everton, solid tournament");
addTier("england",2022,"Kieran Trippier",2,"high","FIFA 23; Newcastle, solid RB");
addTier("england",2022,"Luke Shaw",-1,"high","FIFA 23; Man United consistent LB");
addTier("england",2022,"Mason Mount",2,"high","FIFA 23; Chelsea creative midfielder");

// === FRANCE ===
addTier("france",1986,"Michel Platini",9,"medium","Juventus, 3x Ballon d'Or, fading but still genius");
addTier("france",1986,"Alain Giresse",4,"low","Bordeaux magical playmaker, Magic Square");
addTier("france",1986,"Jean Tigana",3,"low","Bordeaux elite box-to-box, Magic Square");
addTier("france",1986,"Luis Fernández",1,"low","PSG tenacious midfielder");
addTier("france",1998,"Zinedine Zidane",10,"high","FIFA 99; Juventus, 2 headed goals in final, Ballon d'Or year");
addTier("france",1998,"Lilian Thuram",4,"high","FIFA 99; Parma, 2 goals vs Croatia in semifinal");
addTier("france",1998,"Marcel Desailly",4,"high","FIFA 99; AC Milan/Chelsea defensive rock");
addTier("france",1998,"Didier Deschamps",3,"high","FIFA 99; Juventus, captain, lifted the trophy");
addTier("france",1998,"Fabien Barthez",4,"high","FIFA 99; Monaco, conceded only 2 in tournament");
addTier("france",1998,"Laurent Blanc",2,"high","FIFA 99; Marseille/Inter, golden goal vs Paraguay");
addTier("france",1998,"Thierry Henry",1,"high","FIFA 99; emerging Monaco star, 3 goals on the wing");
addTier("france",1998,"Emmanuel Petit",2,"high","FIFA 99; Arsenal, 2 goals including sealing final");
addTier("france",2002,"Thierry Henry",8,"high","FIFA 03; Arsenal Golden Boot winner, sent off, 0 goals");
addTier("france",2002,"Patrick Vieira",5,"high","FIFA 03; Arsenal, world's best box-to-box");
addTier("france",2002,"David Trezeguet",3,"high","FIFA 03; Juventus Capocannoniere, 0 goals");
addTier("france",2006,"Zinedine Zidane",8,"high","FIFA 07; Real Madrid, Golden Ball, 3 goals, headbutt final");
addTier("france",2006,"Thierry Henry",6,"high","FIFA 07; Arsenal, 3 goals");
addTier("france",2006,"Patrick Vieira",3,"high","FIFA 07; Juventus/Inter, 2 goals");
addTier("france",2006,"Franck Ribéry",1,"high","FIFA 07; Marseille, 1 goal, breakout star");
addTier("france",2006,"Claude Makélélé",2,"high","FIFA 07; Chelsea, position named after him");
addTier("france",2010,"Franck Ribéry",4,"high","FIFA 10; Bayern, disappointing mutiny tournament");
addTier("france",2014,"Karim Benzema",4,"high","FIFA 14; Real Madrid, 3 goals, best France tournament");
addTier("france",2014,"Paul Pogba",2,"high","FIFA 14; Juventus, Best Young Player, scored 1 goal");
addTier("france",2014,"Hugo Lloris",3,"high","FIFA 14; Tottenham world-class goalkeeper");
addTier("france",2014,"Antoine Griezmann",0,"high","FIFA 14; Real Sociedad emerging star");
addTier("france",2018,"Kylian Mbappé",5,"high","FIFA 18; PSG, 4 goals, Best Young Player");
addTier("france",2018,"Antoine Griezmann",8,"high","FIFA 18; Atletico, 4 goals, Silver Ball");
addTier("france",2018,"N'Golo Kanté",6,"high","FIFA 18; Chelsea, world's best DM");
addTier("france",2018,"Paul Pogba",6,"high","FIFA 18; Man United, scored in final, dominant");
addTier("france",2018,"Raphaël Varane",5,"high","FIFA 18; Real Madrid, world-class CB");
addTier("france",2018,"Hugo Lloris",5,"high","FIFA 18; Tottenham, captain, lifted trophy");
addTier("france",2018,"Samuel Umtiti",3,"high","FIFA 18; Barcelona, scored semifinal winner");
addTier("france",2022,"Kylian Mbappé",9,"high","FIFA 23; PSG, Golden Boot 8 goals, hat-trick in final");
addTier("france",2022,"Antoine Griezmann",5,"high","FIFA 23; Atletico, reinvented as midfielder, excellent");
addTier("france",2022,"Olivier Giroud",1,"high","FIFA 23; AC Milan, 4 goals, France all-time top scorer");
addTier("france",2022,"Aurélien Tchouaméni",2,"high","FIFA 23; Real Madrid, scored vs England");
addTier("france",2022,"Dayot Upamecano",2,"high","FIFA 23; Bayern Munich, strong CB");
addTier("france",2022,"Ousmane Dembélé",2,"high","FIFA 23; Barcelona, hooked after 40 min in final");
addTier("france",2022,"Ibrahima Konaté",1,"high","FIFA 23; Liverpool, replaced Upamecano");

// === GERMANY ===
addTier("germany",1986,"Lothar Matthäus",3,"low","Bayern Munich, emerging world-class midfielder");
addTier("germany",1986,"Rudi Völler",1,"low","Werder Bremen/Roma clinical striker");
addTier("germany",1986,"Andreas Brehme",0,"low","Kaiserslautern world-class full-back");
addTier("germany",1990,"Lothar Matthäus",7,"medium","Inter Milan, Ballon d'Or, captain, 4 goals");
addTier("germany",1990,"Jürgen Klinsmann",3,"low","Inter Milan, 3 goals, elite striker");
addTier("germany",1990,"Andreas Brehme",3,"low","Inter Milan, scored winning penalty");
addTier("germany",1990,"Rudi Völler",1,"low","Roma, 3 goals, 1990 champion");
addTier("germany",1994,"Jürgen Klinsmann",3,"low","Monaco/Tottenham, 5 goals");
addTier("germany",1994,"Lothar Matthäus",5,"medium","Bayern, converted to sweeper, still elite");
addTier("germany",1994,"Jürgen Kohler",2,"low","Juventus/Dortmund world-class stopper");
addTier("germany",2002,"Oliver Kahn",8,"high","FIFA 03; Bayern, Golden Ball, carried to final");
addTier("germany",2002,"Michael Ballack",6,"high","FIFA 03; Leverkusen, 3 goals, suspended for final");
addTier("germany",2002,"Miroslav Klose",-2,"high","FIFA 03; Kaiserslautern, 5 headed goals, Silver Boot");
addTier("germany",2006,"Miroslav Klose",2,"high","FIFA 07; Werder Bremen, Golden Boot 5 goals");
addTier("germany",2006,"Philipp Lahm",1,"high","FIFA 07; Bayern, scored opening goal, emerging star");
addTier("germany",2006,"Jens Lehmann",3,"high","FIFA 07; Arsenal, penalty hero vs Argentina");
addTier("germany",2006,"Bastian Schweinsteiger",-1,"high","FIFA 07; Bayern, 2 goals in 3rd place match");
addTier("germany",2006,"Lukas Podolski",-1,"high","FIFA 07; Köln/Bayern, Best Young Player, 3 goals");
addTier("germany",2010,"Thomas Müller",0,"high","FIFA 10; Bayern, Golden Boot 5 goals, Best Young Player");
addTier("germany",2010,"Bastian Schweinsteiger",3,"high","FIFA 10; Bayern, transitioned to world-class CM");
addTier("germany",2010,"Philipp Lahm",4,"high","FIFA 10; Bayern captain, world's best full-back");
addTier("germany",2010,"Manuel Neuer",4,"high","FIFA 10; Schalke, breakout tournament");
addTier("germany",2010,"Mesut Özil",2,"high","FIFA 10; Werder Bremen/Real Madrid breakout star");
addTier("germany",2010,"Miroslav Klose",2,"high","FIFA 10; Bayern, 4 goals, 14 career WC goals");
addTier("germany",2014,"Manuel Neuer",7,"high","FIFA 14; Bayern, Golden Glove, sweeper-keeper pioneer");
addTier("germany",2014,"Toni Kroos",4,"high","FIFA 14; Bayern/Real Madrid, 2 goals vs Brazil");
addTier("germany",2014,"Thomas Müller",4,"high","FIFA 14; Bayern, 5 goals, Silver Boot");
addTier("germany",2014,"Philipp Lahm",4,"high","FIFA 14; Bayern captain at DM, lifted trophy");
addTier("germany",2014,"Mesut Özil",4,"high","FIFA 14; Arsenal, 1 goal, creative force");
addTier("germany",2014,"Mats Hummels",3,"high","FIFA 14; Dortmund, 2 goals, world-class CB");
addTier("germany",2014,"Mario Götze",1,"high","FIFA 14; Bayern, scored World Cup winning goal");
addTier("germany",2018,"Toni Kroos",6,"high","FIFA 18; Real Madrid, scored winner vs Sweden");
addTier("germany",2018,"Manuel Neuer",7,"high","FIFA 18; Bayern, still elite but group exit");
addTier("germany",2018,"Thomas Müller",1,"high","FIFA 18; Bayern, first blank tournament");
addTier("germany",2018,"Mats Hummels",3,"high","FIFA 18; Bayern, solid despite team failure");
addTier("germany",2018,"Joshua Kimmich",3,"high","FIFA 18; Bayern, emerging RB leader");
addTier("germany",2022,"İlkay Gündoğan",3,"high","FIFA 23; Man City, scored 1 goal");
addTier("germany",2022,"Joshua Kimmich",4,"high","FIFA 23; Bayern, CM/RB leader");
addTier("germany",2022,"Jamal Musiala",2,"high","FIFA 23; Bayern, dazzling young star");
addTier("germany",2022,"Manuel Neuer",5,"high","FIFA 23; Bayern, 36, still world-class");
addTier("germany",2022,"Kai Havertz",2,"high","FIFA 23; Chelsea, scored 2 goals");
addTier("germany",2022,"Serge Gnabry",1,"high","FIFA 23; Bayern, scored 1 goal");
addTier("germany",2022,"Antonio Rüdiger",3,"high","FIFA 23; Real Madrid athletic CB");

// === ITALY ===
addTier("italy",1986,"Gaetano Scirea",5,"low","Juventus legend, elegant world-class sweeper");
addTier("italy",1986,"Giuseppe Bergomi",2,"low","Inter legend, 1982 World Cup winner");
addTier("italy",1986,"Antonio Cabrini",0,"low","Juventus, 1982 champion, world-class LB");
addTier("italy",1986,"Alessandro Altobelli",0,"low","Inter, 1982 champion, 4 goals in 1986");
addTier("italy",1986,"Bruno Conti",1,"low","Roma legend, 1982 champion, tricky winger");
addTier("italy",1990,"Franco Baresi",9,"medium","AC Milan, world's greatest sweeper of his era");
addTier("italy",1990,"Paolo Maldini",4,"low","AC Milan, 22, already world-class LB/CB");
addTier("italy",1990,"Walter Zenga",3,"low","Inter, conceded only 2 goals in tournament");
addTier("italy",1990,"Gianluca Vialli",2,"low","Sampdoria, powerful striker");
addTier("italy",1990,"Roberto Donadoni",0,"low","AC Milan classy winger");
addTier("italy",1994,"Roberto Baggio",9,"high","Juventus, Ballon d'Or year, 5 goals, missed final penalty");
addTier("italy",1994,"Paolo Maldini",6,"medium","AC Milan, 1994 runner-up, world-class");
addTier("italy",1994,"Franco Baresi",6,"medium","AC Milan, rush back from injury for final");
addTier("italy",1994,"Gianluca Pagliuca",2,"medium","Sampdoria/Inter, conceded only 2 before final");
addTier("italy",1994,"Demetrio Albertini",1,"medium","AC Milan elegant deep playmaker");
addTier("italy",1998,"Paolo Maldini",5,"high","FIFA 99; AC Milan captain, world-class");
addTier("italy",1998,"Roberto Baggio",4,"high","FIFA 99; Bologna/Inter, 2 goals, redemption");
addTier("italy",1998,"Christian Vieri",3,"high","FIFA 99; Lazio/Inter, 5 goals, Silver Boot");
addTier("italy",1998,"Alessandro Nesta",3,"high","FIFA 99; Lazio emerging world-class CB");
addTier("italy",2002,"Paolo Maldini",6,"high","FIFA 03; AC Milan, 34, still world-class");
addTier("italy",2002,"Gianluigi Buffon",6,"high","FIFA 03; Juventus, world's most expensive GK");
addTier("italy",2002,"Francesco Totti",6,"high","FIFA 03; Roma captain, sent off vs South Korea");
addTier("italy",2002,"Christian Vieri",4,"high","FIFA 03; Inter, 4 goals");
addTier("italy",2002,"Alessandro Nesta",4,"high","FIFA 03; Lazio/AC Milan, injured early");
addTier("italy",2002,"Fabio Cannavaro",3,"high","FIFA 03; Parma/Inter, suspended R16");
addTier("italy",2006,"Fabio Cannavaro",8,"high","FIFA 07; Juventus/Real Madrid, Ballon d'Or, imperious");
addTier("italy",2006,"Gianluigi Buffon",8,"high","FIFA 07; Juventus, Yashin Award, conceded 2");
addTier("italy",2006,"Andrea Pirlo",5,"high","FIFA 07; AC Milan, Bronze Ball, masterful playmaker");
addTier("italy",2006,"Francesco Totti",5,"high","FIFA 07; Roma, played on one leg, penalty vs Australia");
addTier("italy",2006,"Alessandro Nesta",3,"high","FIFA 07; AC Milan, injured early");
addTier("italy",2006,"Luca Toni",1,"high","FIFA 07; Fiorentina, scored 2 goals");
addTier("italy",2010,"Gianluigi Buffon",6,"high","FIFA 10; Juventus, injured at half-time");
addTier("italy",2010,"Giorgio Chiellini",2,"high","FIFA 10; Juventus elite CB");
addTier("italy",2010,"Fabio Cannavaro",0,"high","FIFA 10; Juventus, 37, group stage exit");
addTier("italy",2014,"Andrea Pirlo",3,"high","FIFA 14; Juventus, still magic at 35, free kick goal");
addTier("italy",2014,"Mario Balotelli",0,"high","FIFA 14; AC Milan, scored vs England, disappointing");
addTier("italy",2014,"Giorgio Chiellini",1,"high","FIFA 14; Juventus, played LB/CB");
addTier("italy",2014,"Claudio Marchisio",1,"high","FIFA 14; Juventus, scored vs England");
addTier("italy",2014,"Daniele De Rossi",1,"high","FIFA 14; Roma aging legend");

// === NETHERLANDS ===
addTier("netherlands",1990,"Marco van Basten",9,"medium","AC Milan, 3x Ballon d'Or, 0 goals in tournament");
addTier("netherlands",1990,"Ruud Gullit",8,"medium","AC Milan Ballon d'Or winner, 1 goal, injured");
addTier("netherlands",1990,"Frank Rijkaard",6,"medium","AC Milan world-class, spitting incident");
addTier("netherlands",1990,"Ronald Koeman",4,"low","Barcelona, world's best ball-playing CB");
addTier("netherlands",1994,"Dennis Bergkamp",4,"medium","Inter/Arsenal, 3 goals, quarterfinals");
addTier("netherlands",1994,"Frank de Boer",0,"low","Ajax/Barcelona emerging world-class defender");
addTier("netherlands",1994,"Frank Rijkaard",5,"medium","Ajax, final tournament before retirement");
addTier("netherlands",1998,"Edwin van der Sar",3,"high","FIFA 99; Ajax/Juventus, world-class GK, semifinalist");
addTier("netherlands",1998,"Marc Overmars",2,"high","FIFA 99; Arsenal, 1 goal, electric pace");
addTier("netherlands",1998,"Patrick Kluivert",1,"high","FIFA 99; AC Milan, 2 goals including vs Argentina");
addTier("netherlands",1998,"Dennis Bergkamp",4,"high","FIFA 99; Arsenal, 3 goals including wonder goal");
addTier("netherlands",1998,"Clarence Seedorf",1,"high","FIFA 99; Real Madrid Champions League winner");
addTier("netherlands",1998,"Frank de Boer",2,"high","FIFA 99; Ajax/Barcelona classy sweeper");
addTier("netherlands",1998,"Jaap Stam",1,"high","FIFA 99; PSV/Man United dominant CB");
addTier("netherlands",2006,"Ruud van Nistelrooy",5,"high","FIFA 07; Man United/Real Madrid, 1 goal");
addTier("netherlands",2006,"Arjen Robben",3,"high","FIFA 07; Chelsea, 1 goal");
addTier("netherlands",2006,"Robin van Persie",1,"high","FIFA 07; Arsenal emerging star, free kick goal");
addTier("netherlands",2010,"Wesley Sneijder",5,"high","FIFA 10; Inter treble, 5 goals, Golden Ball worthy");
addTier("netherlands",2010,"Arjen Robben",6,"high","FIFA 10; Bayern, destroyed defenses, missed 1v1 final");
addTier("netherlands",2010,"Robin van Persie",3,"high","FIFA 10; Arsenal, 1 goal");
addTier("netherlands",2014,"Arjen Robben",6,"high","FIFA 14; Bayern, 3 goals, Bronze Ball, unstoppable");
addTier("netherlands",2014,"Robin van Persie",4,"high","FIFA 14; Man United, 4 goals, Flying Dutchman header");
addTier("netherlands",2014,"Wesley Sneijder",1,"high","FIFA 14; Galatasaray, 1 goal");
addTier("netherlands",2022,"Virgil van Dijk",5,"high","FIFA 23; Liverpool world-class CB, captain");
addTier("netherlands",2022,"Frenkie de Jong",3,"high","FIFA 23; Barcelona quality CM, 1 goal");
addTier("netherlands",2022,"Cody Gakpo",-1,"high","FIFA 23; PSV/Liverpool, 3 goals, breakout star");
addTier("netherlands",2022,"Matthijs de Ligt",1,"high","FIFA 23; Bayern/Juventus young CB leader");
addTier("netherlands",2022,"Denzel Dumfries",1,"high","FIFA 23; Inter attacking wing-back, 1 goal");

// === PORTUGAL ===
addTier("portugal",1986,"Fernando Gomes",1,"low","Porto legend, European Golden Boot 1983/1985");
addTier("portugal",2002,"Luís Figo",7,"high","FIFA 03; Real Madrid, Ballon d'Or winner");
addTier("portugal",2002,"Rui Costa",4,"high","FIFA 03; AC Milan elite playmaker, 1 goal");
addTier("portugal",2002,"Vítor Baía",2,"high","FIFA 03; Porto world-class goalkeeper");
addTier("portugal",2006,"Cristiano Ronaldo",5,"high","FIFA 07; Man United, 1 goal pen, emerging superstar");
addTier("portugal",2006,"Luís Figo",4,"high","FIFA 07; Inter, final tournament, semifinalist");
addTier("portugal",2006,"Ricardo Carvalho",4,"high","FIFA 07; Chelsea world-class CB");
addTier("portugal",2010,"Cristiano Ronaldo",6,"high","FIFA 10; Real Madrid, 1 goal, disappointing");
addTier("portugal",2010,"Deco",3,"high","FIFA 10; Chelsea, fading genius");
addTier("portugal",2014,"Cristiano Ronaldo",10,"high","FIFA 14; Real Madrid Ballon d'Or, played injured");
addTier("portugal",2014,"Pepe",2,"high","FIFA 14; Real Madrid, sent off vs Germany");
addTier("portugal",2018,"Cristiano Ronaldo",10,"high","FIFA 18; Real Madrid/Juventus, 4 goals, hat-trick Spain");
addTier("portugal",2018,"Pepe",3,"high","FIFA 18; Besiktas, still elite at 35");
addTier("portugal",2018,"Bernardo Silva",3,"high","FIFA 18; Man City emerging world-class");
addTier("portugal",2022,"Cristiano Ronaldo",5,"high","FIFA 23; Man United (free agent), 1 goal pen, declining");
addTier("portugal",2022,"Rúben Dias",5,"high","FIFA 23; Man City world-class CB");
addTier("portugal",2022,"Bruno Fernandes",4,"high","FIFA 23; Man United, scored 2 goals");
addTier("portugal",2022,"Bernardo Silva",5,"high","FIFA 23; Man City world-class playmaker");
addTier("portugal",2022,"João Cancelo",4,"high","FIFA 23; Man City/Bayern, world's best attacking full-back");
addTier("portugal",2022,"João Félix",1,"high","FIFA 23; Atletico/Chelsea, 1 goal, unrealized potential");
addTier("portugal",2022,"Raphaël Guerreiro",2,"high","FIFA 23; Dortmund attacking LB, 1 goal");
addTier("portugal",2022,"Diogo Costa",1,"high","FIFA 23; Porto emerging elite GK");
addTier("portugal",2022,"Rúben Neves",1,"high","FIFA 23; Wolves quality CM");

// === SPAIN ===
addTier("spain",1986,"Emilio Butragueño",3,"low","Real Madrid, 5 goals including 4 vs Denmark");
addTier("spain",1986,"Míchel",1,"low","Real Madrid emerging star midfielder");
addTier("spain",1990,"Míchel",2,"low","Real Madrid, 4 goals including hat-trick vs South Korea");
addTier("spain",1994,"Fernando Hierro",2,"low","Real Madrid emerging world-class sweeper/midfielder");
addTier("spain",1994,"Luis Enrique",1,"low","Real Madrid/Barcelona versatile dynamo");
addTier("spain",1994,"Julen Guerrero",1,"low","Athletic Bilbao Spanish Golden Boy");
addTier("spain",1998,"Raúl",4,"high","FIFA 99; Real Madrid emerging Spanish superstar");
addTier("spain",1998,"Fernando Hierro",3,"high","FIFA 99; Real Madrid, 2 goals, world-class");
addTier("spain",2002,"Raúl",6,"high","FIFA 03; Real Madrid, 3 goals, at his peak");
addTier("spain",2002,"Iker Casillas",6,"high","FIFA 03; Real Madrid, penalty save vs Ireland");
addTier("spain",2002,"Fernando Hierro",3,"high","FIFA 03; Real Madrid, final tournament");
addTier("spain",2002,"Juan Carlos Valerón",2,"high","FIFA 03; Deportivo magical playmaker");
addTier("spain",2006,"Fernando Torres",4,"high","FIFA 07; Atletico Madrid, 3 goals, breakout star");
addTier("spain",2006,"Xavi",3,"high","FIFA 07; Barcelona emerging genius");
addTier("spain",2006,"Iker Casillas",7,"high","FIFA 07; Real Madrid, still elite");
addTier("spain",2006,"David Villa",3,"high","FIFA 07; Valencia, 3 goals, emerging elite");
addTier("spain",2006,"Xabi Alonso",3,"high","FIFA 07; Liverpool world-class passer");
addTier("spain",2006,"Carles Puyol",4,"high","FIFA 07; Barcelona warrior CB");
addTier("spain",2010,"Xavi",8,"high","FIFA 10; Barcelona, tournament best player");
addTier("spain",2010,"Andrés Iniesta",6,"high","FIFA 10; Barcelona, World Cup winning goal");
addTier("spain",2010,"Iker Casillas",7,"high","FIFA 10; Real Madrid, Golden Glove, penalty save");
addTier("spain",2010,"David Villa",7,"high","FIFA 10; Barcelona, 5 goals, Silver Boot");
addTier("spain",2010,"Carles Puyol",5,"high","FIFA 10; Barcelona, header semifinal winner");
addTier("spain",2010,"Xabi Alonso",4,"high","FIFA 10; Real Madrid, kicked in chest by De Jong");
addTier("spain",2010,"David Silva",3,"high","FIFA 10; Man City/Valencia magic left foot");
addTier("spain",2010,"Sergio Ramos",3,"high","FIFA 10; Real Madrid, 0 goals but solid");
addTier("spain",2010,"Sergio Busquets",0,"high","FIFA 10; Barcelona emerging elite DM");
addTier("spain",2014,"Sergio Ramos",5,"high","FIFA 14; Real Madrid, horrible tournament individually world-class");
addTier("spain",2014,"Andrés Iniesta",5,"high","FIFA 14; Barcelona, still magic but team collapsed");
addTier("spain",2014,"David Silva",4,"high","FIFA 14; Man City, disappointing tournament");
addTier("spain",2014,"Diego Costa",1,"high","FIFA 14; Atletico/Chelsea, 0 goals, ineffective");
addTier("spain",2018,"Isco",4,"high","FIFA 18; Real Madrid, Spain's best player");
addTier("spain",2018,"David de Gea",6,"high","FIFA 18; Man United, 1 error vs Portugal");
addTier("spain",2018,"Andrés Iniesta",4,"high","FIFA 18; Barcelona, final tournament, legend");
addTier("spain",2018,"Sergio Ramos",5,"high","FIFA 18; Real Madrid captain, penalty specialist");
addTier("spain",2018,"David Silva",4,"high","FIFA 18; Man City fading star");
addTier("spain",2018,"Diego Costa",1,"high","FIFA 18; Atletico Madrid, scored 3 goals");
addTier("spain",2022,"Rodri",3,"high","FIFA 23; Man City, world's best DM, played CB");
addTier("spain",2022,"Pedri",2,"high","FIFA 23; Barcelona brilliant young midfielder");
addTier("spain",2022,"Gavi",0,"high","FIFA 23; Barcelona Golden Boy, youngest scorer since Pele");
addTier("spain",2022,"Aymeric Laporte",3,"high","FIFA 23; Man City quality CB");
addTier("spain",2022,"Sergio Busquets",2,"high","FIFA 23; Barcelona, final tournament, legend");
addTier("spain",2022,"Dani Olmo",1,"high","FIFA 23; RB Leipzig excellent tournament");

// ===== Rating Function =====
function ratePlayer(nationId, name, year) {
  const key = nationId+":"+name+":"+year;
  const override = playerTiers[key];

  if (override) {
    const baseTier = nationTiers[nationId] || 81;
    const wcBump = wcMod(nationId, year);
    const ovr = Math.round(Math.max(73, Math.min(99, baseTier + eraMod(year) + wcBump + override[0])));
    return { overall: ovr, confidence: override[1], basis: override[2] };
  }

  // No override - sensible default below team average for squad players
  const baseTier = nationTiers[nationId] || 81;
  const wcBump = wcMod(nationId, year);
  // Squad players sit 3-4 below team average
  const squadAdj = -3;
  const ovr = Math.round(Math.max(73, Math.min(99, baseTier + eraMod(year) + wcBump + squadAdj)));

  return {
    overall: ovr,
    confidence: year >= 1998 ? "medium" : "low",
    basis: `${year} ${nationId} squad player, position-adjusted historical estimate`
  };
}

// ===== MAIN MIGRATION =====
const allRatings = [];
const results = { total:0, found:0, high:0, med:0, low:0, min:99, max:0, byNation:{}, notFound:[] };

for (const nationId of readdirSync(nationsRoot, {withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name)) {
  const dir = join(nationsRoot, nationId);
  let nSum=0, nCount=0;
  for (const file of readdirSync(dir).filter(f=>f.endsWith(".json")).sort()) {
    const fp = join(dir, file);
    const squad = JSON.parse(readFileSync(fp,"utf8"));
    results.total += squad.players.length;

    squad.schemaVersion = 3;
    squad.dataStatus = "ready";
    squad.ratingSource = { publisher:"Hybrid", series:"FIFA/historical estimate", gameYear:null };

    for (const p of squad.players) {
      const primary = resolvePos(p);
      p.primaryPosition = primary;
      p.secondaryPositions = resolveSec(p, primary);

      const key = nationId+":"+p.name+":"+squad.year;
      const r = ratePlayer(nationId, p.name, squad.year);
      const ovr = r.overall;

      allRatings.push(ovr);
      if (ovr < results.min) results.min = ovr;
      if (ovr > results.max) results.max = ovr;
      nSum += ovr; nCount++;

      if (playerTiers[key]) {
        results.found++;
        if (r.confidence === "high") results.high++;
        else if (r.confidence === "medium") results.med++;
        else results.low++;
      } else {
        if (r.confidence === "medium") results.med++;
        else results.low++;
      }

      const d = derive(primary, ovr);

      // Replace old attribute fields with simplified ones
      delete p.attributes;
      delete p.goalkeeperAttributes;
      p.overall = ovr;
      p.attack = d.attack;
      p.control = d.control;
      p.defence = d.defence;
      p.ratingConfidence = r.confidence;
      p.ratingBasis = r.basis;

      p.ratingSource = {
        publisher: "Hybrid",
        series: "FIFA/historical estimate",
        status: "sourced",
        sourceUrl: null,
        note: r.basis,
      };
    }

    writeFileSync(fp, JSON.stringify(squad, null, 2) + "\n", "utf8");
  }
  results.byNation[nationId] = nCount ? (nSum/nCount).toFixed(1) : "N/A";
}

// ===== REPORT =====
console.log("\n=== LEGACY PLAYER DATA MIGRATION REPORT ===");
console.log("Total players:", results.total);
console.log("Rating range:", results.min, "-", results.max);
console.log("Average rating:", (allRatings.reduce((a,b)=>a+b,0)/allRatings.length).toFixed(1));
console.log("Players with specific overrides:", results.found, "/", results.total);
console.log("High confidence:", results.high);
console.log("Medium confidence:", results.med);
console.log("Low confidence:", results.low);
console.log("\nAverage by nation:");
for (const [n, avg] of Object.entries(results.byNation)) {
  console.log(" ", n.padEnd(14), avg);
}

// Top/Bottom 5
const allP = [];
for (const nationId of readdirSync(nationsRoot, {withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name)) {
  for (const file of readdirSync(join(nationsRoot,nationId)).filter(f=>f.endsWith(".json"))) {
    const s = JSON.parse(readFileSync(join(nationsRoot,nationId,file),"utf8"));
    for (const p of s.players) allP.push({n:nationId,y:s.year,name:p.name,o:p.overall,pos:p.primaryPosition,conf:p.ratingConfidence});
  }
}
allP.sort((a,b)=>b.o-a.o);
console.log("\n=== TOP 10 HIGHEST RATED ===");
allP.slice(0,10).forEach(p=>console.log(" ",p.o,p.name,"("+p.n,p.y+",",p.pos+")"));
console.log("\n=== BOTTOM 10 LOWEST RATED ===");
allP.slice(-10).forEach(p=>console.log(" ",p.o,p.name,"("+p.n,p.y+",",p.pos+")"));
console.log("\n=== ALL LOW CONFIDENCE RATINGS ===");
allP.filter(p=>p.conf==="low").forEach(p=>console.log(" ",p.o,p.name,"("+p.n,p.y+")"));
console.log("\nDone.");
