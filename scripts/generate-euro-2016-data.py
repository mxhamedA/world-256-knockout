import json
import math
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "tmp" / "euro2016"
SQUADS_HTML = SOURCE_DIR / "squads-wikipedia.html"
FIFA_16_CSV = SOURCE_DIR / "players_16.csv"
FIFA_17_CSV = SOURCE_DIR / "players_17.csv"
FIFA_19_CSV = ROOT / "tmp" / "2018" / "players_19.csv"
EURO_LINEUPS_CSV = SOURCE_DIR / "euro-history" / "euro_lineups.csv"
EURO_MATCHES_CSV = SOURCE_DIR / "euro-history" / "matches" / "matches" / "euro" / "2016.csv"
OUTPUT = ROOT / "retro-euro-2016-squad-dataset.json"


TEAM_ORDER = [
    "France", "Romania", "Albania", "Switzerland",
    "England", "Russia", "Wales", "Slovakia",
    "Germany", "Ukraine", "Poland", "Northern Ireland",
    "Spain", "Czech Republic", "Turkey", "Croatia",
    "Belgium", "Italy", "Republic of Ireland", "Sweden",
    "Portugal", "Iceland", "Austria", "Hungary",
]

GROUPS = {
    team: f"Group {group}"
    for group, teams in {
        "A": TEAM_ORDER[0:4],
        "B": TEAM_ORDER[4:8],
        "C": TEAM_ORDER[8:12],
        "D": TEAM_ORDER[12:16],
        "E": TEAM_ORDER[16:20],
        "F": TEAM_ORDER[20:24],
    }.items()
    for team in teams
}

COUNTRY_CODES = {
    "France": "FRA",
    "Romania": "ROU",
    "Albania": "ALB",
    "Switzerland": "SUI",
    "England": "ENG",
    "Russia": "RUS",
    "Wales": "WAL",
    "Slovakia": "SVK",
    "Germany": "GER",
    "Ukraine": "UKR",
    "Poland": "POL",
    "Northern Ireland": "NIR",
    "Spain": "ESP",
    "Czech Republic": "CZE",
    "Turkey": "TUR",
    "Croatia": "CRO",
    "Belgium": "BEL",
    "Italy": "ITA",
    "Republic of Ireland": "IRL",
    "Sweden": "SWE",
    "Portugal": "POR",
    "Iceland": "ISL",
    "Austria": "AUT",
    "Hungary": "HUN",
}

COACHES = {
    "France": "Didier Deschamps",
    "Romania": "Anghel Iordănescu",
    "Albania": "Gianni De Biasi",
    "Switzerland": "Vladimir Petković",
    "England": "Roy Hodgson",
    "Russia": "Leonid Slutsky",
    "Wales": "Chris Coleman",
    "Slovakia": "Ján Kozák",
    "Germany": "Joachim Löw",
    "Ukraine": "Mykhaylo Fomenko",
    "Poland": "Adam Nawałka",
    "Northern Ireland": "Michael O'Neill",
    "Spain": "Vicente del Bosque",
    "Czech Republic": "Pavel Vrba",
    "Turkey": "Fatih Terim",
    "Croatia": "Ante Čačić",
    "Belgium": "Marc Wilmots",
    "Italy": "Antonio Conte",
    "Republic of Ireland": "Martin O'Neill",
    "Sweden": "Erik Hamrén",
    "Portugal": "Fernando Santos",
    "Iceland": "Heimir Hallgrímsson & Lars Lagerbäck",
    "Austria": "Marcel Koller",
    "Hungary": "Bernd Storck",
}

FORMATIONS = {
    "France": "4-3-3",
    "Romania": "4-2-3-1",
    "Albania": "4-1-4-1",
    "Switzerland": "4-2-3-1",
    "England": "4-3-3",
    "Russia": "4-2-3-1",
    "Wales": "3-4-2-1",
    "Slovakia": "4-2-3-1",
    "Germany": "4-2-3-1",
    "Ukraine": "4-2-3-1",
    "Poland": "4-4-2",
    "Northern Ireland": "5-2-2-1",
    "Spain": "4-3-3",
    "Czech Republic": "4-2-3-1",
    "Turkey": "4-2-3-1",
    "Croatia": "4-2-3-1",
    "Belgium": "4-2-3-1",
    "Italy": "3-5-2",
    "Republic of Ireland": "4-1-2-1-2",
    "Sweden": "4-4-2",
    "Portugal": "4-4-2",
    "Iceland": "4-4-2",
    "Austria": "4-2-3-1",
    "Hungary": "4-2-3-1",
}

POSITION_OVERRIDES = {
    "Romania": {
        "Denis Alibec": ("ST", ["CF"]),
    },
    "Albania": {
        "Andi Lila": ("RB", ["CDM", "RM"]),
        "Lorik Cana": ("CB", ["CDM", "CM"]),
        "Ansi Agolli": ("LB", ["LWB"]),
        "Orges Shehi": ("GK", []),
        "Alban Hoxha": ("GK", []),
    },
    "Slovakia": {
        "Ján Mucha": ("GK", []),
        "Vladimír Weiss": ("LW", ["RW", "CAM"]),
        "Stanislav Šesták": ("ST", ["RW"]),
        "Adam Nemec": ("ST", []),
        "Patrik Hrošovský": ("CM", ["CDM"]),
        "Kornel Saláta": ("CB", []),
        "Michal Ďuriš": ("ST", ["RW"]),
        "Viktor Pečovský": ("CDM", ["CM"]),
        "Matúš Kozáčik": ("GK", []),
    },
    "Ukraine": {
        "Yevhen Khacheridi": ("CB", []),
        "Anatoliy Tymoshchuk": ("CDM", ["CM"]),
        "Andriy Yarmolenko": ("RW", ["RM"]),
        "Ruslan Rotan": ("CM", ["CDM"]),
        "Serhiy Sydorchuk": ("CDM", ["CM"]),
        "Serhiy Rybalka": ("CDM", ["CM"]),
        "Denys Harmash": ("CM", ["CAM"]),
        "Oleksandr Karavayev": ("RM", ["RW", "RB"]),
    },
    "Czech Republic": {
        "Roman Hubník": ("CB", []),
    },
    "Croatia": {
        "Lovre Kalinić": ("GK", []),
        "Gordon Schildenfeld": ("CB", []),
        "Ante Ćorić": ("CAM", ["CM"]),
        "Domagoj Vida": ("CB", ["RB"]),
    },
    "Iceland": {
        "Ingvar Jónsson": ("GK", []),
        "Eiður Guðjohnsen": ("ST", ["CF", "CAM"]),
    },
    "Hungary": {
        "Roland Juhász": ("CB", []),
    },
}

PREFERRED_FOOT_OVERRIDES = {
    "Denis Alibec": "left",
    "Andi Lila": "right",
    "Lorik Cana": "right",
    "Ansi Agolli": "left",
    "Orges Shehi": "right",
    "Alban Hoxha": "right",
    "Ján Mucha": "right",
    "Vladimír Weiss": "right",
    "Stanislav Šesták": "right",
    "Adam Nemec": "right",
    "Kornel Saláta": "right",
    "Michal Ďuriš": "right",
    "Viktor Pečovský": "right",
    "Anatoliy Tymoshchuk": "right",
    "Ruslan Rotan": "right",
    "Oleksandr Karavayev": "right",
    "Gordon Schildenfeld": "right",
    "Ingvar Jónsson": "right",
    "Roland Juhász": "right",
}

XI_ROLE_OVERRIDES = {
    "France": {"Blaise Matuidi": "CM", "Antoine Griezmann": "RW"},
    "Romania": {"Bogdan Stancu": "LW"},
    "Switzerland": {"Blerim Džemaili": "CAM", "Admir Mehmedi": "LW"},
    "England": {"Wayne Rooney": "CM", "Dele Alli": "CM", "Adam Lallana": "RW"},
    "Russia": {
        "Roman Neustädter": "CDM", "Aleksandr Golovin": "CM",
        "Oleg Shatov": "LW", "Aleksandr Kokorin": "CAM", "Fyodor Smolov": "RW",
    },
    "Wales": {"Jonny Williams": "CAM", "Gareth Bale": "ST"},
    "Germany": {"Benedikt Höwedes": "RB", "Julian Draxler": "LW"},
    "Poland": {"Bartosz Kapustka": "LM", "Jakub Błaszczykowski": "RM"},
    "Northern Ireland": {
        "Conor McLaughlin": "RWB", "Chris Baird": "LWB", "Paddy McNair": "CM",
        "Shane Ferguson": "LW", "Steven Davis": "RW",
    },
    "Spain": {"Andrés Iniesta": "CM", "David Silva": "RW"},
    "Czech Republic": {"Theodor Gebre Selassie": "RW"},
    "Turkey": {
        "Mehmet Topal": "CB", "Selçuk İnan": "CM", "Ozan Tufan": "CM",
        "Oğuzhan Özyakup": "CAM", "Hakan Çalhanoğlu": "LW", "Arda Turan": "RW",
    },
    "Croatia": {"Marcelo Brozović": "RM", "Ivan Rakitić": "CAM"},
    "Belgium": {
        "Toby Alderweireld": "RB", "Jan Vertonghen": "LB",
        "Radja Nainggolan": "CDM", "Marouane Fellaini": "CAM", "Kevin De Bruyne": "RW",
    },
    "Italy": {
        "Emanuele Giaccherini": "CM", "Antonio Candreva": "RWB",
    },
    "Republic of Ireland": {"Robbie Brady": "LB", "Jonathan Walters": "ST"},
    "Portugal": {"André Gomes": "LM", "Nani": "ST"},
    "Iceland": {
        "Aron Gunnarsson": "CM", "Gylfi Sigurðsson": "CM",
        "Jóhann Berg Guðmundsson": "RM", "Birkir Bjarnason": "LM",
    },
    "Austria": {"David Alaba": "CM"},
    "Hungary": {
        "Krisztián Németh": "RW", "Balázs Dzsudzsák": "LW",
    },
}

TEAM_RATINGS = {
    "France": [88, 89, 89, 85, 85, 89, 86, 84, 82],
    "Romania": [75, 74, 75, 77, 79, 72, 80, 76, 81],
    "Albania": [72, 70, 71, 75, 77, 68, 73, 70, 78],
    "Switzerland": [81, 81, 83, 81, 84, 80, 82, 82, 80],
    "England": [85, 86, 85, 83, 81, 87, 82, 77, 82],
    "Russia": [79, 80, 80, 78, 81, 77, 87, 80, 77],
    "Wales": [82, 86, 83, 79, 77, 75, 78, 85, 79],
    "Slovakia": [79, 79, 83, 77, 79, 75, 78, 80, 77],
    "Germany": [89, 87, 90, 89, 92, 90, 91, 88, 84],
    "Ukraine": [78, 81, 78, 77, 81, 74, 83, 79, 77],
    "Poland": [83, 88, 82, 82, 83, 79, 81, 88, 81],
    "Northern Ireland": [75, 73, 74, 78, 74, 71, 79, 75, 84],
    "Spain": [88, 86, 92, 88, 89, 89, 93, 83, 87],
    "Czech Republic": [78, 76, 79, 77, 85, 75, 88, 79, 79],
    "Turkey": [80, 82, 84, 76, 78, 79, 82, 81, 72],
    "Croatia": [86, 85, 91, 83, 81, 83, 88, 86, 75],
    "Belgium": [87, 88, 89, 85, 89, 87, 82, 85, 76],
    "Italy": [86, 82, 85, 91, 89, 84, 93, 88, 77],
    "Republic of Ireland": [77, 77, 77, 78, 75, 74, 83, 78, 82],
    "Sweden": [80, 87, 79, 78, 80, 75, 88, 86, 78],
    "Portugal": [87, 92, 85, 87, 84, 85, 90, 93, 77],
    "Iceland": [78, 79, 79, 81, 75, 73, 77, 82, 87],
    "Austria": [81, 82, 85, 80, 78, 78, 80, 82, 80],
    "Hungary": [77, 76, 78, 77, 74, 73, 86, 81, 76],
}

TEAM_RATING_KEYS = [
    "overall", "attack", "midfield", "defence", "goalkeeper",
    "squadDepth", "experience", "penalties", "discipline",
]

OFFICIAL_REPLACEMENTS = [
    {"team": "France", "out": "Raphaël Varane", "in": "Adil Rami", "date": "2016-05-24", "reason": "injury"},
    {"team": "France", "out": "Jérémy Mathieu", "in": "Samuel Umtiti", "date": "2016-05-28", "reason": "injury"},
    {"team": "France", "out": "Lassana Diarra", "in": "Morgan Schneiderlin", "date": "2016-05-31", "reason": "injury"},
    {"team": "Russia", "out": "Alan Dzagoev", "in": "Dmitri Torbinski", "date": "2016-05-22", "reason": "broken metatarsal"},
    {"team": "Russia", "out": "Igor Denisov", "in": "Artur Yusupov", "date": "2016-06-07", "reason": "hamstring injury"},
    {"team": "Germany", "out": "Antonio Rüdiger", "in": "Jonathan Tah", "date": "2016-06-08", "reason": "knee injury"},
    {"team": "Spain", "out": "Dani Carvajal", "in": "Héctor Bellerín", "date": "2016-05-31", "reason": "hamstring injury"},
]

PENALTY_TAKERS = {
    "France": ["Antoine Griezmann", "Paul Pogba", "Olivier Giroud", "Dimitri Payet", "André-Pierre Gignac"],
    "Romania": ["Bogdan Stancu", "Nicolae Stanciu", "Gabriel Torje", "Răzvan Raț", "Claudiu Keșerü"],
    "Albania": ["Armando Sadiku", "Ledian Memushaj", "Lorik Cana", "Taulant Xhaka", "Bekim Balaj"],
    "Switzerland": ["Ricardo Rodríguez", "Xherdan Shaqiri", "Granit Xhaka", "Fabian Schär", "Stephan Lichtsteiner"],
    "England": ["Wayne Rooney", "Harry Kane", "Jamie Vardy", "James Milner", "Daniel Sturridge"],
    "Russia": ["Artem Dzyuba", "Roman Shirokov", "Aleksandr Kokorin", "Fyodor Smolov", "Aleksandr Samedov"],
    "Wales": ["Gareth Bale", "Aaron Ramsey", "Sam Vokes", "Joe Allen", "Hal Robson-Kanu"],
    "Slovakia": ["Marek Hamšík", "Vladimír Weiss", "Juraj Kucka", "Róbert Mak", "Michal Ďuriš"],
    "Germany": ["Thomas Müller", "Mesut Özil", "Toni Kroos", "Bastian Schweinsteiger", "Julian Draxler"],
    "Ukraine": ["Andriy Yarmolenko", "Yevhen Konoplyanka", "Ruslan Rotan", "Yevhen Seleznyov", "Viktor Kovalenko"],
    "Poland": ["Robert Lewandowski", "Arkadiusz Milik", "Jakub Błaszczykowski", "Grzegorz Krychowiak", "Kamil Glik"],
    "Northern Ireland": ["Steven Davis", "Kyle Lafferty", "Oliver Norwood", "Niall McGinn", "Conor Washington"],
    "Spain": ["Sergio Ramos", "Cesc Fàbregas", "Andrés Iniesta", "David Silva", "Álvaro Morata"],
    "Czech Republic": ["Tomáš Necid", "Tomáš Rosický", "Vladimír Darida", "Bořek Dočkal", "Milan Škoda"],
    "Turkey": ["Burak Yılmaz", "Hakan Çalhanoğlu", "Arda Turan", "Selçuk İnan", "Nuri Şahin"],
    "Croatia": ["Luka Modrić", "Ivan Rakitić", "Mario Mandžukić", "Ivan Perišić", "Marcelo Brozović"],
    "Belgium": ["Eden Hazard", "Kevin De Bruyne", "Romelu Lukaku", "Christian Benteke", "Radja Nainggolan"],
    "Italy": ["Daniele De Rossi", "Leonardo Bonucci", "Lorenzo Insigne", "Graziano Pellè", "Simone Zaza"],
    "Republic of Ireland": ["Jonathan Walters", "Robbie Brady", "Wes Hoolahan", "Shane Long", "Jeff Hendrick"],
    "Sweden": ["Zlatan Ibrahimović", "Marcus Berg", "Sebastian Larsson", "Kim Källström", "Emil Forsberg"],
    "Portugal": ["Cristiano Ronaldo", "Renato Sanches", "João Moutinho", "Nani", "Ricardo Quaresma"],
    "Iceland": ["Gylfi Sigurðsson", "Kolbeinn Sigþórsson", "Alfreð Finnbogason", "Eiður Guðjohnsen", "Birkir Bjarnason"],
    "Austria": ["David Alaba", "Marko Arnautović", "Marc Janko", "Martin Harnik", "Zlatko Junuzović"],
    "Hungary": ["Balázs Dzsudzsák", "Ádám Szalai", "Zoltán Gera", "László Kleinheisler", "Krisztián Németh"],
}

# Final period ratings for players whose 2015/16 rise, decline, international
# importance or tournament performance is not represented fairly by a simple
# interpolation between the FIFA 16 and FIFA 17 snapshots.
OVERALL_OVERRIDES = {
    "France": {
        "Hugo Lloris": 85, "N'Golo Kanté": 82, "Antoine Griezmann": 88,
        "Dimitri Payet": 86, "Paul Pogba": 87, "Anthony Martial": 81,
        "Kingsley Coman": 80, "Samuel Umtiti": 83, "Laurent Koscielny": 85,
    },
    "Switzerland": {
        "Yann Sommer": 84, "Ricardo Rodríguez": 83, "Granit Xhaka": 84,
        "Xherdan Shaqiri": 82, "Stephan Lichtsteiner": 82,
    },
    "England": {
        "Joe Hart": 81, "Wayne Rooney": 84, "Harry Kane": 83, "Jamie Vardy": 82,
        "Dele Alli": 80, "Eric Dier": 80, "Raheem Sterling": 81,
        "Marcus Rashford": 76, "Chris Smalling": 82, "Gary Cahill": 82,
        "Kyle Walker": 81, "Danny Rose": 80, "Daniel Sturridge": 82,
    },
    "Russia": {
        "Igor Akinfeev": 81, "Sergei Ignashevich": 80, "Roman Shirokov": 79,
        "Artem Dzyuba": 80, "Aleksandr Kokorin": 79, "Fyodor Smolov": 79,
        "Aleksandr Golovin": 73,
    },
    "Wales": {
        "Gareth Bale": 90, "Aaron Ramsey": 84, "Joe Allen": 80,
        "Ashley Williams": 82, "James Chester": 77, "Hal Robson-Kanu": 72,
        "Wayne Hennessey": 76, "Ben Davies": 79,
    },
    "Slovakia": {
        "Marek Hamšík": 85, "Martin Škrtel": 81, "Juraj Kucka": 81,
        "Vladimír Weiss": 79, "Róbert Mak": 78, "Milan Škriniar": 75,
        "Matúš Kozáčik": 77, "Patrik Hrošovský": 74, "Viktor Pečovský": 74,
        "Michal Ďuriš": 75,
    },
    "Germany": {
        "Manuel Neuer": 92, "Jérôme Boateng": 88, "Mats Hummels": 87,
        "Toni Kroos": 89, "Mesut Özil": 88, "Thomas Müller": 86,
        "Bastian Schweinsteiger": 83, "Julian Draxler": 84,
        "Joshua Kimmich": 81, "Mario Götze": 83,
    },
    "Ukraine": {
        "Andriy Pyatov": 81, "Andriy Yarmolenko": 83, "Yevhen Konoplyanka": 84,
        "Taras Stepanenko": 79, "Yaroslav Rakitskiy": 79, "Oleksandr Zinchenko": 72,
        "Yevhen Khacheridi": 78, "Ruslan Rotan": 77, "Serhiy Sydorchuk": 76,
        "Serhiy Rybalka": 75, "Denys Harmash": 76, "Oleksandr Karavayev": 74,
    },
    "Poland": {
        "Robert Lewandowski": 90, "Grzegorz Krychowiak": 84,
        "Jakub Błaszczykowski": 82, "Łukasz Piszczek": 83, "Kamil Glik": 82,
        "Arkadiusz Milik": 80, "Łukasz Fabiański": 82, "Wojciech Szczęsny": 82,
        "Michał Pazdan": 78,
    },
    "Northern Ireland": {
        "Jonny Evans": 79, "Steven Davis": 78, "Gareth McAuley": 77,
        "Kyle Lafferty": 74, "Michael McGovern": 74, "Craig Cathcart": 75,
        "Oliver Norwood": 74, "Stuart Dallas": 74,
    },
    "Spain": {
        "David de Gea": 88, "Sergio Ramos": 89, "Gerard Piqué": 87,
        "Jordi Alba": 86, "Sergio Busquets": 87, "Andrés Iniesta": 88,
        "David Silva": 87, "Cesc Fàbregas": 86, "Álvaro Morata": 82,
    },
    "Czech Republic": {
        "Petr Čech": 85, "Tomáš Rosický": 81, "Vladimír Darida": 80,
        "Pavel Kadeřábek": 78, "Tomáš Necid": 76, "Roman Hubník": 76,
    },
    "Turkey": {
        "Arda Turan": 84, "Hakan Çalhanoğlu": 81, "Burak Yılmaz": 80,
        "Nuri Şahin": 81, "Mehmet Topal": 79,
    },
    "Croatia": {
        "Luka Modrić": 89, "Ivan Rakitić": 87, "Ivan Perišić": 85,
        "Mario Mandžukić": 84, "Marcelo Brozović": 82, "Mateo Kovačić": 82,
        "Darijo Srna": 83, "Danijel Subašić": 81, "Vedran Ćorluka": 80,
        "Šime Vrsaljko": 79, "Gordon Schildenfeld": 76, "Ante Ćorić": 77,
    },
    "Belgium": {
        "Thibaut Courtois": 89, "Eden Hazard": 88, "Kevin De Bruyne": 88,
        "Toby Alderweireld": 85, "Jan Vertonghen": 85, "Radja Nainggolan": 85,
        "Romelu Lukaku": 84,
    },
    "Italy": {
        "Gianluigi Buffon": 88, "Leonardo Bonucci": 88, "Giorgio Chiellini": 88,
        "Andrea Barzagli": 86, "Daniele De Rossi": 85, "Antonio Candreva": 83,
        "Graziano Pellè": 82, "Éder": 80, "Emanuele Giaccherini": 80,
    },
    "Republic of Ireland": {
        "Séamus Coleman": 82, "Robbie Brady": 79, "Shane Long": 79,
        "Wes Hoolahan": 78, "Jonathan Walters": 77, "Jeff Hendrick": 77,
        "James McCarthy": 77,
    },
    "Sweden": {
        "Zlatan Ibrahimović": 89, "Emil Forsberg": 81, "Victor Lindelöf": 79,
        "Andreas Granqvist": 79, "Marcus Berg": 78, "Sebastian Larsson": 78,
        "Kim Källström": 77,
    },
    "Portugal": {
        "Cristiano Ronaldo": 94, "Pepe": 89, "Rui Patrício": 84,
        "Raphaël Guerreiro": 82, "Renato Sanches": 80, "Nani": 83,
        "William Carvalho": 83, "João Moutinho": 83, "Ricardo Quaresma": 82,
        "Éder": 75,
    },
    "Iceland": {
        "Gylfi Sigurðsson": 83, "Aron Gunnarsson": 77,
        "Kolbeinn Sigþórsson": 76, "Alfreð Finnbogason": 76,
        "Birkir Bjarnason": 76, "Hannes Þór Halldórsson": 75,
        "Ragnar Sigurðsson": 76, "Kári Árnason": 74, "Birkir Már Sævarsson": 74,
        "Ingvar Jónsson": 68, "Eiður Guðjohnsen": 72,
    },
    "Austria": {
        "David Alaba": 87, "Marko Arnautović": 82, "Zlatko Junuzović": 80,
        "Julian Baumgartlinger": 80, "Aleksandar Dragović": 80,
        "Christian Fuchs": 80, "Martin Harnik": 79,
    },
    "Hungary": {
        "Gábor Király": 74, "Balázs Dzsudzsák": 79, "Zoltán Gera": 76,
        "Ádám Szalai": 75, "László Kleinheisler": 75, "Ádám Nagy": 74,
        "Richárd Guzmics": 73, "Roland Juhász": 75,
    },
    "Romania": {
        "Ciprian Tătărușanu": 79, "Vlad Chiricheș": 79, "Nicolae Stanciu": 77,
        "Gabriel Torje": 76, "Cristian Săpunaru": 76, "Bogdan Stancu": 75,
        "Denis Alibec": 73,
    },
    "Albania": {
        "Etrit Berisha": 77, "Elseid Hysaj": 79, "Lorik Cana": 76,
        "Mërgim Mavraj": 75, "Taulant Xhaka": 74, "Armando Sadiku": 73,
        "Ledian Memushaj": 72, "Andi Lila": 71,
    },
}

PERFORMANCE_NOTES = {
    "Antoine Griezmann": "Euro Golden Boot and Player of the Tournament after an elite Atlético season.",
    "Dimitri Payet": "Breakout West Ham season and decisive group-stage creativity.",
    "N'Golo Kanté": "A title-driving Leicester season transformed his level and France role.",
    "Gareth Bale": "Champions League quality, three Euro goals and Wales' semi-final run.",
    "Aaron Ramsey": "Wales' chief connector, with one goal, four assists and Team of the Tournament selection.",
    "Joe Allen": "Wales' tempo-setter and a UEFA Team of the Tournament midfielder.",
    "Hal Robson-Kanu": "Two knockout goals justify a modest rise beyond his club baseline.",
    "Cristiano Ronaldo": "Fifty-one club goals, the Champions League title, three Euro goals and champion-captain responsibility.",
    "Pepe": "Elite knockout defending and a Player of the Match performance in the final.",
    "Rui Patrício": "Every-minute starter whose saves were decisive in the final.",
    "Renato Sanches": "Young Player of the Tournament, key knockout starter and successful shootout taker.",
    "Leonardo Bonucci": "Outstanding distribution and defensive leadership in Italy's 3-5-2.",
    "Emanuele Giaccherini": "His two-way role and major-match output exceeded his club-rating baseline.",
    "Joshua Kimmich": "Became Germany's starting right-back and excelled in the knockout rounds.",
    "Toni Kroos": "Controlled Germany's midfield throughout a run to the semi-finals.",
    "Ivan Perišić": "Two goals, an assist and a match-winning display against Spain.",
    "Luka Modrić": "World-class midfield control and a superb winner against Turkey.",
    "Gianluigi Buffon": "Still an elite goalkeeper and captain in Italy's quarter-final run.",
    "Michael McGovern": "A high-volume shot-stopping tournament elevated Northern Ireland's goalkeeper.",
    "Hannes Þór Halldórsson": "First-choice keeper throughout Iceland's historic quarter-final run.",
    "Ragnar Sigurðsson": "Defensive leader and scorer in the landmark win over England.",
    "Gylfi Sigurðsson": "Iceland's main creator and set-piece threat throughout the cycle.",
    "Robert Lewandowski": "A 42-goal Bayern season sustains an elite rating despite a quieter tournament.",
    "Jakub Błaszczykowski": "Two goals and a major creative role in Poland's quarter-final run.",
    "Michał Pazdan": "An excellent tournament against elite forwards raised his period assessment.",
    "Robbie Brady": "Two tournament goals, including the winner against Italy, reinforced his importance.",
    "Zlatan Ibrahimović": "A 50-goal Paris season sustains an elite rating despite Sweden's poor tournament.",
    "Joe Hart": "A strong established baseline is reduced after costly errors at the tournament.",
    "Harry Kane": "Golden Boot club form is tempered by a subdued four-match tournament.",
    "Thomas Müller": "Elite club output remains, but a goalless tournament prevents an upgrade.",
    "Eden Hazard": "Difficult club form was followed by a much stronger Euro, especially against Hungary.",
    "Kevin De Bruyne": "Elite chance creation at club level and a central role for Belgium.",
    "Andrés Iniesta": "Spain's standout controller and one of the tournament's best group-stage midfielders.",
    "Gianluigi Buffon": "Elite 2015/16 form and authoritative tournament captaincy sustain the rating.",
}

MANUAL_PENALTIES = {
    "Cristiano Ronaldo": 95, "Renato Sanches": 86, "João Moutinho": 84,
    "Nani": 86, "Ricardo Quaresma": 87, "Robert Lewandowski": 94,
    "Arkadiusz Milik": 83, "Jakub Błaszczykowski": 84, "Grzegorz Krychowiak": 85,
    "Ricardo Rodríguez": 86, "Xherdan Shaqiri": 84, "Sergio Ramos": 85,
    "Gylfi Sigurðsson": 88, "Gareth Bale": 88, "Wayne Rooney": 90,
    "Antoine Griezmann": 86, "Zlatan Ibrahimović": 92, "David Alaba": 84,
}

POSITION_MAP = {
    "GK": "GK", "CB": "CB", "LB": "LB", "RB": "RB", "LWB": "LWB", "RWB": "RWB",
    "CDM": "CDM", "CM": "CM", "CAM": "CAM", "LM": "LM", "RM": "RM",
    "LW": "LW", "RW": "RW", "CF": "CF", "ST": "ST",
}

ATTRIBUTE_FIELDS = ["pace", "shooting", "passing", "dribbling", "defending", "physic"]
GK_FIELDS = [
    "goalkeeping_diving", "goalkeeping_handling", "goalkeeping_kicking",
    "goalkeeping_positioning", "goalkeeping_reflexes",
]


def normalize(value):
    decomposed = unicodedata.normalize("NFKD", str(value or ""))
    ascii_value = decomposed.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]", "", ascii_value)


def clean_text(value):
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    return str(value).strip()


def number(value, default=0):
    try:
        parsed = float(value)
        return default if math.isnan(parsed) else int(round(parsed))
    except (TypeError, ValueError):
        return default


def clamp(value, low=1, high=99):
    return max(low, min(high, int(round(value))))


def safe_list(value):
    if not isinstance(value, str) or not value.strip():
        return []
    try:
        return eval(value, {"__builtins__": {}}, {"nan": None})
    except (SyntaxError, TypeError, ValueError, NameError):
        return []


def parse_dob(value):
    match = re.search(r"\d{1,2} [A-Za-z]+ \d{4}", clean_text(value))
    if not match:
        return None
    return datetime.strptime(match.group(), "%d %B %Y").strftime("%Y-%m-%d")


def strip_captain(value):
    return re.sub(r"\s*\(captain\)\s*", "", clean_text(value), flags=re.I).strip()


def name_similarity(official_name, fifa_row):
    candidates = [clean_text(fifa_row.get("short_name")), clean_text(fifa_row.get("long_name"))]
    target = normalize(official_name)
    scores = []
    for candidate in candidates:
        normalized = normalize(candidate)
        if not normalized:
            continue
        score = SequenceMatcher(None, target, normalized).ratio()
        if target in normalized or normalized in target:
            score = max(score, 0.94)
        official_surname = normalize(official_name.split()[-1])
        if official_surname and official_surname in normalized:
            score += 0.08
        scores.append(score)
    return max(scores, default=0)


def match_fifa_player(official, fifa_frame, allow_weak=False):
    national = fifa_frame[fifa_frame["nationality_name"].eq(official["team"])]
    ranked = []
    official_tokens = [
        normalize(token)
        for token in official["name"].replace("-", " ").split()
        if normalize(token)
    ]
    for _, row in national.iterrows():
        similarity = name_similarity(official["name"], row)
        score = similarity
        dob_match = bool(
            official.get("dateOfBirth")
            and clean_text(row.get("dob")) == official["dateOfBirth"]
        )
        if dob_match:
            score += 0.24
        official_club = normalize(official.get("club"))
        fifa_club = normalize(row.get("club_name"))
        club_match = bool(
            official_club
            and fifa_club
            and (official_club in fifa_club or fifa_club in official_club)
        )
        if club_match:
            score += 0.08
        candidate_names = [
            normalize(clean_text(row.get("short_name"))),
            normalize(clean_text(row.get("long_name"))),
        ]
        target = normalize(official["name"])
        exactish = any(
            target and candidate and (target in candidate or candidate in target)
            for candidate in candidate_names
        )
        first_match = bool(
            official_tokens
            and any(official_tokens[0] in candidate for candidate in candidate_names)
        )
        surname_match = bool(
            official_tokens
            and any(official_tokens[-1] in candidate for candidate in candidate_names)
        )
        ranked.append((
            score, similarity, dob_match, club_match,
            exactish, first_match, surname_match, row,
        ))
    if not ranked:
        return None, 0
    (
        score, similarity, dob_match, club_match,
        exactish, first_match, surname_match, row,
    ) = max(ranked, key=lambda item: item[0])
    strong_name = similarity >= (0.86 if allow_weak else 0.9)
    full_name_match = first_match and surname_match
    corroborated_dob = dob_match and surname_match
    corroborated_club = club_match and surname_match
    if not (exactish or full_name_match or strong_name or corroborated_dob or corroborated_club):
        return None, score
    return row, score


def build_official_squads():
    tables = pd.read_html(SQUADS_HTML)[:24]
    if len(tables) != 24:
        raise RuntimeError(f"Expected 24 squad tables, found {len(tables)}")
    squads = {}
    for team, table in zip(TEAM_ORDER, tables):
        if len(table) != 23:
            raise RuntimeError(f"{team}: expected 23 players, found {len(table)}")
        players = []
        for _, row in table.iterrows():
            raw_name = clean_text(row["Player"])
            players.append({
                "team": team,
                "name": strip_captain(raw_name),
                "shirtNumber": number(row["No."]),
                "sourcePosition": clean_text(row["Pos."]),
                "club": clean_text(row["Club"]),
                "dateOfBirth": parse_dob(row["Date of birth (age)"]),
                "caps": number(row["Caps"]),
                "internationalGoals": number(row["Goals"]),
                "captain": "(captain)" in raw_name.lower(),
            })
        squads[team] = players
    return squads


def build_match_evidence(squads):
    lineups = pd.read_csv(EURO_LINEUPS_CSV, low_memory=False)
    lineups = lineups[lineups["year"].eq(2016)].copy()
    matches = pd.read_csv(EURO_MATCHES_CSV, low_memory=False)
    matches["date"] = pd.to_datetime(matches["date"])

    official_by_code_number = {}
    official_by_name = defaultdict(list)
    for team, players in squads.items():
        code = COUNTRY_CODES[team]
        for player in players:
            official_by_code_number[(code, player["shirtNumber"])] = player
            official_by_name[normalize(player["name"])].append(player)

    match_teams = {}
    for _, match in matches.iterrows():
        match_teams[number(match["id_match"])] = [
            next(
                (name for name, code in COUNTRY_CODES.items() if code == clean_text(match["home_team_code"])),
                None,
            ),
            next(
                (name for name, code in COUNTRY_CODES.items() if code == clean_text(match["away_team_code"])),
                None,
            ),
        ]

    player_id_to_official = {}
    player_name_to_official = {}
    start_counts = Counter()
    matchday_counts = Counter()
    appearance_matches = defaultdict(set)
    goal_counts = Counter()
    opening_xis = {}
    opening_roles = {}
    team_matches = Counter()

    resolved_teams = []
    resolved_numbers = []
    for _, row in lineups.iterrows():
        shirt = number(row["jersey_namber"])
        lineup_name = clean_text(row["name"])
        exact = official_by_name.get(normalize(lineup_name), [])
        candidates = [
            player
            for player in exact
            if player["team"] in match_teams.get(number(row["id_match"]), [])
        ]
        player = candidates[0] if len(candidates) == 1 else None
        if player is None:
            possible_teams = match_teams.get(number(row["id_match"]), [])
            shirt_candidates = [
                official_by_code_number.get((COUNTRY_CODES[team], shirt))
                for team in possible_teams
                if team
            ]
            shirt_candidates = [candidate for candidate in shirt_candidates if candidate]
            if shirt_candidates:
                player = max(
                    shirt_candidates,
                    key=lambda candidate: SequenceMatcher(
                        None, normalize(lineup_name), normalize(candidate["name"])
                    ).ratio(),
                )
        if not player:
            resolved_teams.append(None)
            resolved_numbers.append(None)
            continue
        team = player["team"]
        code = COUNTRY_CODES[team]
        match_id = number(row["id_match"])
        player_id = str(number(row["id_player"]))
        player_id_to_official[player_id] = player
        player_name_to_official[(code, normalize(row["name"]))] = player
        resolved_teams.append(team)
        resolved_numbers.append(shirt)
        matchday_counts[(team, shirt)] += 1
        if clean_text(row["start"]).lower() == "field":
            start_counts[(team, shirt)] += 1
            appearance_matches[(team, shirt)].add(match_id)
    lineups["_resolved_team"] = resolved_teams
    lineups["_resolved_number"] = resolved_numbers

    for _, match in matches.iterrows():
        match_id = number(match["id_match"])
        for code in [clean_text(match["home_team_code"]), clean_text(match["away_team_code"])]:
            team = next((name for name, value in COUNTRY_CODES.items() if value == code), None)
            if team:
                team_matches[team] += 1

        for event in safe_list(match.get("events")):
            event_type = clean_text(event.get("type"))
            if event_type == "SUBSTITUTION":
                code = clean_text(event.get("secondaty_country_code"))
                player_id = str(number(event.get("secondaty_id_person")))
                player = player_id_to_official.get(player_id)
                if player is None:
                    player = player_name_to_official.get((code, normalize(event.get("secondaty_name"))))
                if player:
                    appearance_matches[(player["team"], player["shirtNumber"])].add(match_id)
            elif event_type == "GOAL":
                code = clean_text(event.get("primary_country_code"))
                player_id = str(number(event.get("primary_id_person")))
                player = player_id_to_official.get(player_id)
                if player is None:
                    player = player_name_to_official.get((code, normalize(event.get("primary_name"))))
                if player:
                    goal_counts[(player["team"], player["shirtNumber"])] += 1

    for team in TEAM_ORDER:
        code = COUNTRY_CODES[team]
        team_match_rows = matches[
            matches["home_team_code"].eq(code) | matches["away_team_code"].eq(code)
        ].sort_values(["date", "id_match"])
        opening_match_id = number(team_match_rows.iloc[0]["id_match"])
        starters = lineups[
            lineups["id_match"].eq(opening_match_id)
            & lineups["_resolved_team"].eq(team)
            & lineups["start"].eq("field")
        ].copy()
        starters["_y"] = starters["start_position_y"].fillna(500)
        starters["_x"] = starters["start_position_x"].fillna(500)
        starters = starters.sort_values(["_y", "_x"])
        numbers = [number(value) for value in starters["_resolved_number"].tolist()]
        opening_xis[team] = numbers
        for _, starter in starters.iterrows():
            shirt = number(starter["_resolved_number"])
            opening_roles[(team, shirt)] = {
                "detailed": clean_text(starter["position_field_detailed"]),
                "field": clean_text(starter["position_field"]),
                "x": number(starter["start_position_x"], 500),
                "y": number(starter["start_position_y"], 500),
            }

    return {
        "startCounts": start_counts,
        "matchdayCounts": matchday_counts,
        "appearanceMatches": appearance_matches,
        "goalCounts": goal_counts,
        "openingXIs": opening_xis,
        "openingRoles": opening_roles,
        "teamMatches": team_matches,
    }


def parse_positions(fifa_row, official_position, role=None):
    if fifa_row is not None:
        raw_positions = [
            POSITION_MAP.get(position.strip(), position.strip())
            for position in clean_text(fifa_row.get("player_positions")).split(",")
            if position.strip()
        ]
        if raw_positions:
            return raw_positions[0], list(dict.fromkeys(raw_positions[1:]))

    detailed = clean_text((role or {}).get("detailed"))
    x = number((role or {}).get("x"), 500)
    if detailed == "GOALKEEPER" or official_position == "GK":
        return "GK", []
    if detailed == "CENTRE_BACK":
        return "CB", []
    if detailed == "FULL_BACK":
        return ("RB" if x < 500 else "LB"), []
    if detailed == "DEFENSIVE_MIDFIELDER":
        return "CDM", ["CM"]
    if detailed == "CENTRAL_MIDFIELDER":
        return "CM", ["CDM", "CAM"]
    if detailed == "ATTACKING_MIDFIELDER":
        return "CAM", ["CM"]
    if detailed == "WINGER":
        return ("RW" if x < 500 else "LW"), ["RM" if x < 500 else "LM"]
    if detailed == "STRIKER":
        return "ST", ["CF"]
    return {"GK": "GK", "DF": "CB", "MF": "CM", "FW": "ST"}.get(official_position, "CM"), []


def tactical_role(primary, role, formation, team=None, player_name=None):
    override = XI_ROLE_OVERRIDES.get(team, {}).get(player_name)
    if override:
        return override
    detailed = clean_text((role or {}).get("detailed"))
    x = number((role or {}).get("x"), 500)
    y = number((role or {}).get("y"), 500)
    if detailed == "GOALKEEPER" or primary == "GK":
        return "GK"
    if detailed == "CENTRE_BACK":
        return "CB"
    if detailed == "FULL_BACK":
        side = "R" if x < 500 else "L"
        return f"{side}WB" if formation.startswith("3-") and y >= 330 else f"{side}B"
    if detailed == "DEFENSIVE_MIDFIELDER":
        return "CDM"
    if detailed == "CENTRAL_MIDFIELDER":
        return "CM"
    if detailed == "ATTACKING_MIDFIELDER":
        return "CAM"
    if detailed == "WINGER":
        return "RW" if x < 500 else "LW"
    if detailed == "STRIKER":
        return "ST"
    return primary


def numeric_attributes(row):
    if row is None:
        return {}
    return {field: number(row.get(field)) for field in ATTRIBUTE_FIELDS + GK_FIELDS}


def weighted_value(row16, row17, field, default=0):
    value16 = number(row16.get(field)) if row16 is not None else 0
    value17 = number(row17.get(field)) if row17 is not None else 0
    if value16 and value17:
        return round((0.25 * value16) + (0.75 * value17))
    return value17 or value16 or default


def fallback_overall(team, official, starts, team_match_count):
    team_level = TEAM_RATINGS[team][0]
    ratio = starts / max(1, team_match_count)
    value = team_level - 8 + round(ratio * 5)
    value += min(2, official["caps"] // 35)
    if official["captain"]:
        value += 1
    if official["sourcePosition"] == "GK":
        value += 1
    return clamp(value, 64, 81)


def fallback_attributes(overall, primary):
    templates = {
        "GK": [45, 18, 50, 24, 18, 65],
        "CB": [58, 38, 57, 54, 76, 77],
        "LB": [72, 51, 65, 68, 70, 72],
        "RB": [72, 51, 65, 68, 70, 72],
        "LWB": [74, 55, 67, 70, 66, 71],
        "RWB": [74, 55, 67, 70, 66, 71],
        "CDM": [64, 57, 70, 68, 72, 75],
        "CM": [67, 64, 72, 72, 63, 70],
        "CAM": [73, 70, 74, 76, 42, 62],
        "LM": [76, 68, 71, 76, 43, 63],
        "RM": [76, 68, 71, 76, 43, 63],
        "LW": [79, 72, 70, 77, 38, 62],
        "RW": [79, 72, 70, 77, 38, 62],
        "CF": [74, 75, 69, 74, 37, 69],
        "ST": [71, 77, 62, 70, 35, 74],
    }
    template = templates.get(primary, templates["CM"])
    baseline = 72
    delta = overall - baseline
    return [clamp(value + (delta * 0.72)) for value in template]


def apply_overall_delta(attributes, primary, delta):
    if not delta:
        return attributes
    if primary == "GK":
        weights = [0.25, 0.15, 0.3, 0.15, 0.15, 0.45]
    elif primary in {"CB", "LB", "RB", "LWB", "RWB"}:
        weights = [0.45, 0.2, 0.5, 0.45, 0.95, 0.7]
    elif primary in {"CDM", "CM", "CAM", "LM", "RM"}:
        weights = [0.45, 0.5, 0.95, 0.75, 0.45, 0.5]
    else:
        weights = [0.55, 0.95, 0.55, 0.75, 0.15, 0.45]
    return [clamp(value + (delta * weight)) for value, weight in zip(attributes, weights)]


def goalkeeper_outfield_attributes(row16, row17, overall):
    speed = weighted_value(row16, row17, "goalkeeping_speed", max(35, overall - 35))
    shooting = round((
        weighted_value(row16, row17, "attacking_finishing", 12)
        + weighted_value(row16, row17, "power_shot_power", 35)
    ) / 2)
    passing = round((
        weighted_value(row16, row17, "attacking_short_passing", 35)
        + weighted_value(row16, row17, "skill_long_passing", 38)
    ) / 2)
    dribbling = round((
        weighted_value(row16, row17, "skill_dribbling", 15)
        + weighted_value(row16, row17, "skill_ball_control", 25)
    ) / 2)
    defending = round((
        weighted_value(row16, row17, "mentality_interceptions", 18)
        + weighted_value(row16, row17, "defending_standing_tackle", 12)
    ) / 2)
    physical = round((
        weighted_value(row16, row17, "power_strength", 62)
        + weighted_value(row16, row17, "power_jumping", 66)
        + weighted_value(row16, row17, "power_stamina", 36)
    ) / 3)
    return [clamp(value) for value in [speed, shooting, passing, dribbling, defending, physical]]


def rating_justification(player, overall, row16, row17, usage, generated_fallback):
    parts = []
    if row16 is not None:
        parts.append(f"FIFA 16 baseline {number(row16.get('overall'))}")
    else:
        parts.append("No reliable FIFA 16 identity match")
    if row17 is not None:
        parts.append(f"post-2015/16 FIFA 17 cross-check {number(row17.get('overall'))}")
    elif generated_fallback:
        parts.append("period role estimate from club level, caps and tournament use")
    parts.append(
        f"{usage['starts']} starts and {usage['appearances']} appearances in {usage['teamMatches']} team matches"
    )
    note = PERFORMANCE_NOTES.get(player["name"])
    if note:
        return f"{'; '.join(parts)}. {note} Final rating: {overall}."
    adjustment = "retained" if row16 is not None and number(row16.get("overall")) == overall else "set"
    return f"{'; '.join(parts)}. Rating {adjustment} at {overall} after club-form, international-role and Euro review."


def build_dataset():
    for path in [SQUADS_HTML, FIFA_16_CSV, FIFA_17_CSV, EURO_LINEUPS_CSV, EURO_MATCHES_CSV]:
        if not path.exists():
            raise RuntimeError(f"Missing source file: {path}")

    squads = build_official_squads()
    evidence = build_match_evidence(squads)
    fifa16 = pd.read_csv(FIFA_16_CSV, low_memory=False)
    fifa17 = pd.read_csv(FIFA_17_CSV, low_memory=False)
    fifa19 = pd.read_csv(FIFA_19_CSV, low_memory=False) if FIFA_19_CSV.exists() else pd.DataFrame()

    replacement_by_player = {
        (entry["team"], normalize(entry["in"])): entry
        for entry in OFFICIAL_REPLACEMENTS
    }
    match_stats = {"fifa16": 0, "fifa17": 0, "laterFootOnly": 0, "manual": 0}
    countries = {}

    for team in TEAM_ORDER:
        players = squads[team]
        opening_numbers = evidence["openingXIs"][team]
        opening_number_set = set(opening_numbers)
        team_match_count = evidence["teamMatches"][team]
        finished_players = []
        exact_name_lookup = {normalize(player["name"]): player["name"] for player in players}

        penalty_takers = []
        for requested in PENALTY_TAKERS[team]:
            exact = exact_name_lookup.get(normalize(requested))
            if exact:
                penalty_takers.append(exact)
        if len(penalty_takers) != 5:
            missing = set(map(normalize, PENALTY_TAKERS[team])) - set(map(normalize, penalty_takers))
            raise RuntimeError(f"{team}: unresolved penalty takers {sorted(missing)}")

        for official in players:
            shirt = official["shirtNumber"]
            starts = evidence["startCounts"][(team, shirt)]
            appearances = len(evidence["appearanceMatches"][(team, shirt)])
            usage = {
                "starts": starts,
                "appearances": appearances,
                "teamMatches": team_match_count,
                "goals": evidence["goalCounts"][(team, shirt)],
            }
            role = evidence["openingRoles"].get((team, shirt))

            row16, score16 = match_fifa_player(official, fifa16)
            row17, score17 = match_fifa_player(official, fifa17)
            if row16 is not None:
                match_stats["fifa16"] += 1
            if row17 is not None:
                match_stats["fifa17"] += 1

            primary, secondary = parse_positions(row17 if row17 is not None else row16, official["sourcePosition"], role)
            if official["name"] in POSITION_OVERRIDES.get(team, {}):
                primary, secondary = POSITION_OVERRIDES[team][official["name"]]
            baseline_overall = weighted_value(row16, row17, "overall")
            generated_fallback = not baseline_overall
            if generated_fallback:
                baseline_overall = fallback_overall(team, official, starts, team_match_count)
                match_stats["manual"] += 1

            overall = OVERALL_OVERRIDES.get(team, {}).get(official["name"], baseline_overall)
            overall = clamp(overall, 60, 94)

            if primary == "GK" and (row16 is not None or row17 is not None):
                outfield = goalkeeper_outfield_attributes(row16, row17, baseline_overall)
            elif row16 is not None or row17 is not None:
                outfield = [
                    weighted_value(row16, row17, field, max(20, overall - 8))
                    for field in ATTRIBUTE_FIELDS
                ]
            else:
                outfield = fallback_attributes(overall, primary)
            outfield = apply_overall_delta(outfield, primary, overall - baseline_overall)

            if primary == "GK":
                if row16 is not None or row17 is not None:
                    gk_values = [
                        weighted_value(row16, row17, field, overall - 2)
                        for field in GK_FIELDS
                    ]
                    gk_values = [clamp(value + (overall - baseline_overall)) for value in gk_values]
                else:
                    gk_values = [
                        clamp(overall + offset)
                        for offset in [1, -1, -3, 0, 2]
                    ]
                goalkeeping = dict(zip(
                    ["diving", "handling", "kicking", "positioning", "reflexes"],
                    gk_values,
                ))
            else:
                goalkeeping = None

            foot_row = row16 if row16 is not None else row17
            foot_reliability = (
                "fifa16-period"
                if row16 is not None
                else "fifa17-postseason-crosscheck"
            )
            if foot_row is None and not fifa19.empty:
                later_row, _ = match_fifa_player(official, fifa19, allow_weak=True)
                if later_row is not None:
                    foot_row = later_row
                    foot_reliability = "later-fifa-biographical-crosscheck"
                    match_stats["laterFootOnly"] += 1
            preferred_foot = clean_text(foot_row.get("preferred_foot")).lower() if foot_row is not None else "unknown"
            if preferred_foot not in {"left", "right"}:
                preferred_foot = "unknown"
                foot_reliability = "unverified"
            if official["name"] in PREFERRED_FOOT_OVERRIDES:
                preferred_foot = PREFERRED_FOOT_OVERRIDES[official["name"]]
                foot_reliability = "manual-biographical-period-review"

            penalty_source = row17 if row17 is not None else row16
            penalty_ability = weighted_value(row16, row17, "mentality_penalties", max(45, overall - 14))
            if official["name"] in penalty_takers:
                penalty_ability = max(penalty_ability, 74)
            penalty_ability = MANUAL_PENALTIES.get(official["name"], penalty_ability)

            start_ratio = starts / max(1, team_match_count)
            starting_likelihood = round(min(0.98, 0.08 + (start_ratio * 0.84)), 2)
            if shirt in opening_number_set:
                starting_likelihood = max(starting_likelihood, 0.78)
            if primary == "GK" and starts == team_match_count:
                starting_likelihood = 0.98

            rating_reference = {
                "fifa16": None if row16 is None else {
                    "playerId": number(row16.get("sofifa_id")),
                    "sourceName": clean_text(row16.get("long_name")) or clean_text(row16.get("short_name")),
                    "overall": number(row16.get("overall")),
                    "matchScore": round(score16, 3),
                },
                "fifa17PostseasonCrosscheck": None if row17 is None else {
                    "playerId": number(row17.get("sofifa_id")),
                    "sourceName": clean_text(row17.get("long_name")) or clean_text(row17.get("short_name")),
                    "overall": number(row17.get("overall")),
                    "matchScore": round(score17, 3),
                },
            }

            sources = [
                "uefa_squad_confirmation_2016",
                "association_final_squad_records_2016",
                "euro2016_match_lineups_and_events",
                "uefa_euro_2016_technical_report",
                "period_club_form_review_2015_16",
            ]
            if row16 is not None:
                sources.append("fifa16_ratings_snapshot")
            if row17 is not None:
                sources.append("fifa17_postseason_crosscheck")
            if generated_fallback:
                sources.append("manual_period_role_estimate")
            if foot_reliability == "later-fifa-biographical-crosscheck":
                sources.append("later_fifa_biographical_foot_crosscheck")
            elif foot_reliability == "manual-biographical-period-review":
                sources.append("manual_biographical_foot_review")
            replacement = replacement_by_player.get((team, normalize(official["name"])))
            if replacement:
                sources.append("official_replacement_record")

            finished_players.append({
                "name": official["name"],
                "shirtNumber": shirt,
                "primaryPosition": primary,
                "secondaryPositions": secondary,
                "sourcePosition": official["sourcePosition"],
                "club": official["club"],
                "preferredFoot": preferred_foot,
                "preferredFootReliability": foot_reliability,
                "overall": overall,
                "pace": outfield[0],
                "shooting": outfield[1],
                "passing": outfield[2],
                "dribbling": outfield[3],
                "defending": outfield[4],
                "physical": outfield[5],
                "goalkeeping": goalkeeping,
                "startingXILikelihood": starting_likelihood,
                "penaltyTakingAbility": clamp(penalty_ability),
                "captain": official["captain"],
                "officialReplacement": replacement,
                "tournamentUsage": usage,
                "ratingReference": rating_reference,
                "shortRatingJustification": rating_justification(
                    official, overall, row16, row17, usage, generated_fallback
                ),
                "sources": sources,
            })

        finished_by_number = {player["shirtNumber"]: player for player in finished_players}
        likely_starting_xi = []
        for shirt in opening_numbers:
            player = finished_by_number[shirt]
            role = evidence["openingRoles"].get((team, shirt))
            likely_starting_xi.append({
                "name": player["name"],
                "shirtNumber": shirt,
                "position": tactical_role(
                    player["primaryPosition"], role, FORMATIONS[team], team, player["name"]
                ),
            })

        captain = next(player["name"] for player in finished_players if player["captain"])
        countries[team] = {
            "group": GROUPS[team],
            "coach": COACHES[team],
            "formation": FORMATIONS[team],
            "teamRatings": dict(zip(TEAM_RATING_KEYS, TEAM_RATINGS[team])),
            "likelyStartingXI": likely_starting_xi,
            "captain": captain,
            "penaltyTakers": penalty_takers,
            "players": finished_players,
        }

    dataset = {
        "schemaVersion": 1,
        "tournament": "UEFA Euro 2016",
        "ratingDate": "2016-07-10",
        "ratingWindow": "September 2015-July 2016",
        "notes": (
            "Historical France 2016 research dataset. Ratings represent ability around UEFA Euro 2016, "
            "begin with FIFA 16, and are adjusted using 2015/16 club form, international role and actual "
            "tournament performance. No present-day ratings or later career reputation are used."
        ),
        "ratingMethod": {
            "startingPoint": "FIFA 16 launch-cycle player ratings and attributes",
            "postseasonCrosscheck": (
                "FIFA 17 launch ratings used only as a bounded post-2015/16 cross-check; "
                "large changes require period club or tournament evidence"
            ),
            "clubForm": "2015/16 club level, role, availability and output review",
            "internationalRole": "Pre-tournament caps, captaincy and actual Euro 2016 starts/appearances",
            "tournamentAdjustment": "Bounded manual review of Euro 2016 performances and team importance",
            "fallback": "Position-, team-strength-, caps- and usage-bounded manual period estimate",
        },
        "sources": {
            "uefa_squad_confirmation_2016": (
                "https://www.uefa.com/uefaeuro/history/news/0253-0d814293cea1-"
                "a0e72fd077c9-1000--all-24-uefa-euro-2016-squads-confirmed/"
            ),
            "association_final_squad_records_2016": (
                "https://en.wikipedia.org/wiki/UEFA_Euro_2016_squads "
                "(consolidation of the cited national-association final lists and squad-number releases)"
            ),
            "official_replacement_record": (
                "UEFA/national-association replacement notices consolidated at "
                "https://en.wikipedia.org/wiki/UEFA_Euro_2016_squads"
            ),
            "fifa16_ratings_snapshot": (
                "FIFA 16 SoFIFA career-mode snapshot via "
                "https://www.kaggle.com/datasets/stefanoleone992/fifa-22-complete-player-dataset"
            ),
            "fifa17_postseason_crosscheck": (
                "FIFA 17 SoFIFA launch snapshot via "
                "https://www.kaggle.com/datasets/stefanoleone992/fifa-22-complete-player-dataset"
            ),
            "euro2016_match_lineups_and_events": (
                "https://www.kaggle.com/datasets/piterfm/football-soccer-uefa-euro-1960-2024"
            ),
            "uefa_euro_2016_technical_report": (
                "https://www.uefa.com/MultimediaFiles/Download/TechnicalReport/competitions/"
                "EURO/02/40/26/69/2402669_DOWNLOAD.pdf"
            ),
            "period_club_form_review_2015_16": (
                "Manual 2015/16 club-role and performance review, cross-checked against the "
                "FIFA 16-to-FIFA 17 movement and UEFA tournament technical analysis"
            ),
            "manual_period_role_estimate": (
                "Manual 2016-only estimate for players without a reliable FIFA identity match; "
                "bounded by position, national-team level, caps, club context and tournament usage"
            ),
            "manual_biographical_foot_review": (
                "Period player profiles and club records used only to verify preferred foot; "
                "no later rating values are imported"
            ),
            "later_fifa_biographical_foot_crosscheck": (
                "Later SoFIFA identity record used only for the stable preferred-foot field; "
                "later overall and attributes are explicitly ignored"
            ),
        },
        "officialReplacements": OFFICIAL_REPLACEMENTS,
        "sourceCoverage": match_stats,
        "countries": countries,
    }
    return dataset


def main():
    dataset = build_dataset()
    OUTPUT.write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    player_count = sum(len(country["players"]) for country in dataset["countries"].values())
    print(f"Wrote {OUTPUT.name}: {len(dataset['countries'])} countries, {player_count} players")
    print(json.dumps(dataset["sourceCoverage"], indent=2))


if __name__ == "__main__":
    main()
