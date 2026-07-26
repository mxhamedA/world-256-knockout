import csv
import json
import re
import sys
import unicodedata
from collections import defaultdict
from datetime import datetime
from difflib import SequenceMatcher
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
FIFA_SQUADS_PDF = ROOT / "tmp" / "qatar-2022-official-squad-lists.pdf"
FIFA_23_PLAYERS = ROOT / "tmp" / "male_players.csv"
FIFA_23_UPDATE = "6"
FIFA_23_UPDATE_DATE = "2022-11-16"
FIFA_22_UPDATE = "64"
FIFA_22_UPDATE_DATE = "2022-07-18"
WORLDCUP_DATA = ROOT / "tmp" / "worldcup-data" / "data-csv"
OUTPUT = ROOT / "retro-2022-squad-dataset.json"

GROUPS = {
    "Qatar": "A", "Ecuador": "A", "Senegal": "A", "Netherlands": "A",
    "England": "B", "Iran": "B", "USA": "B", "Wales": "B",
    "Argentina": "C", "Saudi Arabia": "C", "Mexico": "C", "Poland": "C",
    "France": "D", "Australia": "D", "Denmark": "D", "Tunisia": "D",
    "Spain": "E", "Costa Rica": "E", "Germany": "E", "Japan": "E",
    "Belgium": "F", "Canada": "F", "Morocco": "F", "Croatia": "F",
    "Brazil": "G", "Serbia": "G", "Switzerland": "G", "Cameroon": "G",
    "Portugal": "H", "Ghana": "H", "Uruguay": "H", "South Korea": "H",
}

PDF_TEAM_NAMES = {
    "IR Iran": "Iran",
    "Korea Republic": "South Korea",
    "USA": "USA",
}

WORLDCUP_TEAM_NAMES = {
    "United States": "USA",
}

FIFA_NATIONALITIES = {
    "Iran": {"Iran", "IR Iran"},
    "South Korea": {"Korea Republic", "South Korea"},
    "USA": {"United States", "USA"},
}

COACHES = {
    "Qatar": "Félix Sánchez",
    "Ecuador": "Gustavo Alfaro",
    "Senegal": "Aliou Cissé",
    "Netherlands": "Louis van Gaal",
    "England": "Gareth Southgate",
    "Iran": "Carlos Queiroz",
    "USA": "Gregg Berhalter",
    "Wales": "Rob Page",
    "Argentina": "Lionel Scaloni",
    "Saudi Arabia": "Hervé Renard",
    "Mexico": "Gerardo Martino",
    "Poland": "Czesław Michniewicz",
    "France": "Didier Deschamps",
    "Australia": "Graham Arnold",
    "Denmark": "Kasper Hjulmand",
    "Tunisia": "Jalel Kadri",
    "Spain": "Luis Enrique",
    "Costa Rica": "Luis Fernando Suárez",
    "Germany": "Hansi Flick",
    "Japan": "Hajime Moriyasu",
    "Belgium": "Roberto Martínez",
    "Canada": "John Herdman",
    "Morocco": "Walid Regragui",
    "Croatia": "Zlatko Dalić",
    "Brazil": "Tite",
    "Serbia": "Dragan Stojković",
    "Switzerland": "Murat Yakin",
    "Cameroon": "Rigobert Song",
    "Portugal": "Fernando Santos",
    "Ghana": "Otto Addo",
    "Uruguay": "Diego Alonso",
    "South Korea": "Paulo Bento",
}

CAPTAINS = {
    "Qatar": "Hassan Al-Haydos",
    "Ecuador": "Enner Valencia",
    "Senegal": "Kalidou Koulibaly",
    "Netherlands": "Virgil van Dijk",
    "England": "Harry Kane",
    "Iran": "Ehsan Hajsafi",
    "USA": "Tyler Adams",
    "Wales": "Gareth Bale",
    "Argentina": "Lionel Messi",
    "Saudi Arabia": "Salman Al-Faraj",
    "Mexico": "Andrés Guardado",
    "Poland": "Robert Lewandowski",
    "France": "Hugo Lloris",
    "Australia": "Mathew Ryan",
    "Denmark": "Simon Kjær",
    "Tunisia": "Youssef Msakni",
    "Spain": "Sergio Busquets",
    "Costa Rica": "Bryan Ruiz",
    "Germany": "Manuel Neuer",
    "Japan": "Maya Yoshida",
    "Belgium": "Eden Hazard",
    "Canada": "Atiba Hutchinson",
    "Morocco": "Romain Saïss",
    "Croatia": "Luka Modrić",
    "Brazil": "Thiago Silva",
    "Serbia": "Dušan Tadić",
    "Switzerland": "Granit Xhaka",
    "Cameroon": "Vincent Aboubakar",
    "Portugal": "Cristiano Ronaldo",
    "Ghana": "André Ayew",
    "Uruguay": "Diego Godín",
    "South Korea": "Heung-min Son",
}

PENALTY_TAKERS = {
    "Qatar": ["Akram Afif", "Hassan Al-Haydos"],
    "Ecuador": ["Enner Valencia"],
    "Senegal": ["Ismaïla Sarr", "Boulaye Dia"],
    "Netherlands": ["Memphis Depay", "Teun Koopmeiners", "Steven Berghuis"],
    "England": ["Harry Kane", "Marcus Rashford"],
    "Iran": ["Mehdi Taremi", "Alireza Jahanbakhsh"],
    "USA": ["Christian Pulisic", "Giovanni Reyna"],
    "Wales": ["Gareth Bale"],
    "Argentina": ["Lionel Messi", "Leandro Paredes", "Lautaro Martínez", "Gonzalo Montiel", "Paulo Dybala"],
    "Saudi Arabia": ["Salem Al-Dawsari", "Salman Al-Faraj"],
    "Mexico": ["Raúl Jiménez", "Andrés Guardado"],
    "Poland": ["Robert Lewandowski", "Piotr Zieliński"],
    "France": ["Kylian Mbappé", "Antoine Griezmann", "Olivier Giroud", "Randal Kolo Muani"],
    "Australia": ["Jamie Maclaren", "Aaron Mooy", "Craig Goodwin"],
    "Denmark": ["Christian Eriksen", "Mikkel Damsgaard"],
    "Tunisia": ["Wahbi Khazri", "Youssef Msakni"],
    "Spain": ["Ferran Torres", "Pablo Sarabia", "Carlos Soler", "Sergio Busquets"],
    "Costa Rica": ["Celso Borges", "Joel Campbell"],
    "Germany": ["İlkay Gündoğan", "Kai Havertz"],
    "Japan": ["Takumi Minamino", "Ritsu Dōan", "Takuma Asano"],
    "Belgium": ["Eden Hazard", "Romelu Lukaku", "Kevin De Bruyne"],
    "Canada": ["Alphonso Davies", "Jonathan David"],
    "Morocco": ["Hakim Ziyech", "Abdelhamid Sabiri", "Achraf Hakimi"],
    "Croatia": ["Luka Modrić", "Andrej Kramarić", "Ivan Perišić", "Nikola Vlašić"],
    "Brazil": ["Neymar", "Casemiro", "Richarlison", "Rodrygo"],
    "Serbia": ["Dušan Tadić", "Aleksandar Mitrović"],
    "Switzerland": ["Ricardo Rodríguez", "Xherdan Shaqiri"],
    "Cameroon": ["Vincent Aboubakar", "Eric Maxim Choupo-Moting"],
    "Portugal": ["Cristiano Ronaldo", "Bruno Fernandes"],
    "Ghana": ["André Ayew", "Jordan Ayew"],
    "Uruguay": ["Luis Suárez", "Edinson Cavani"],
    "South Korea": ["Heung-min Son", "Hee-chan Hwang"],
}

# Opening-match XIs, ordered by tactical role rather than shirt number.
LINEUPS = {
    "Qatar": ("5-3-2", [(1, "GK"), (2, "RWB"), (15, "CB"), (16, "CB"), (3, "CB"), (14, "LWB"), (12, "CDM"), (6, "CM"), (10, "CAM"), (11, "SS"), (19, "ST")]),
    "Ecuador": ("4-4-2", [(1, "GK"), (17, "RB"), (2, "CB"), (3, "CB"), (7, "LB"), (19, "RM"), (20, "CM"), (23, "CM"), (10, "LM"), (11, "ST"), (13, "ST")]),
    "Senegal": ("4-3-3", [(16, "GK"), (21, "RB"), (3, "CB"), (4, "CB"), (22, "LB"), (6, "CDM"), (5, "CM"), (8, "CM"), (18, "RW"), (9, "ST"), (15, "LW")]),
    "Netherlands": ("3-4-1-2", [(23, "GK"), (3, "CB"), (4, "CB"), (5, "CB"), (22, "RWB"), (11, "CM"), (21, "CM"), (17, "LWB"), (8, "CAM"), (7, "ST"), (18, "ST")]),
    "England": ("4-2-3-1", [(1, "GK"), (12, "RB"), (5, "CB"), (6, "CB"), (3, "LB"), (4, "CDM"), (22, "CM"), (17, "RW"), (19, "CAM"), (10, "LW"), (9, "ST")]),
    "Iran": ("5-4-1", [(1, "GK"), (2, "RWB"), (19, "CB"), (8, "CB"), (15, "CB"), (5, "LWB"), (7, "RM"), (21, "CM"), (18, "CM"), (3, "LM"), (9, "ST")]),
    "USA": ("4-3-3", [(1, "GK"), (2, "RB"), (3, "CB"), (13, "CB"), (5, "LB"), (4, "CDM"), (8, "CM"), (6, "CM"), (21, "RW"), (24, "ST"), (10, "LW")]),
    "Wales": ("3-4-3", [(1, "GK"), (5, "CB"), (6, "CB"), (4, "CB"), (14, "RWB"), (15, "CM"), (10, "CM"), (3, "LWB"), (8, "RW"), (11, "ST"), (20, "LW")]),
    "Argentina": ("4-2-3-1", [(23, "GK"), (26, "RB"), (13, "CB"), (19, "CB"), (3, "LB"), (5, "CDM"), (7, "CM"), (11, "RW"), (10, "CAM"), (17, "LW"), (22, "ST")]),
    "Saudi Arabia": ("4-1-4-1", [(21, "GK"), (12, "RB"), (17, "CB"), (5, "CB"), (13, "LB"), (23, "CDM"), (9, "RM"), (8, "CM"), (7, "CM"), (10, "LM"), (11, "ST")]),
    "Mexico": ("4-3-3", [(13, "GK"), (19, "RB"), (3, "CB"), (15, "CB"), (23, "LB"), (4, "CDM"), (16, "CM"), (24, "CM"), (22, "RW"), (20, "ST"), (10, "LW")]),
    "Poland": ("4-2-3-1", [(1, "GK"), (2, "RB"), (15, "CB"), (14, "CB"), (18, "LB"), (10, "CDM"), (19, "CM"), (13, "RW"), (20, "CAM"), (21, "LW"), (9, "ST")]),
    "France": ("4-2-3-1", [(1, "GK"), (2, "RB"), (24, "CB"), (18, "CB"), (21, "LB"), (8, "CDM"), (14, "CM"), (11, "RW"), (7, "CAM"), (10, "LW"), (9, "ST")]),
    "Australia": ("4-2-3-1", [(1, "GK"), (3, "RB"), (19, "CB"), (4, "CB"), (16, "LB"), (13, "CDM"), (22, "CM"), (7, "RW"), (14, "CAM"), (23, "LW"), (15, "ST")]),
    "Denmark": ("3-5-2", [(1, "GK"), (2, "CB"), (4, "CB"), (6, "CB"), (13, "RWB"), (23, "CM"), (8, "CM"), (10, "CAM"), (5, "LWB"), (11, "SS"), (12, "ST")]),
    "Tunisia": ("3-4-2-1", [(16, "GK"), (6, "CB"), (4, "CB"), (3, "CB"), (20, "RWB"), (14, "CM"), (17, "CM"), (24, "LWB"), (25, "CAM"), (7, "SS"), (9, "ST")]),
    "Spain": ("4-3-3", [(23, "GK"), (2, "RB"), (16, "CB"), (24, "CB"), (18, "LB"), (5, "CDM"), (9, "CM"), (26, "CM"), (11, "RW"), (10, "ST"), (21, "LW")]),
    "Costa Rica": ("4-2-3-1", [(1, "GK"), (16, "RB"), (6, "CB"), (15, "CB"), (8, "LB"), (5, "CDM"), (17, "CM"), (4, "RW"), (12, "CAM"), (9, "LW"), (7, "ST")]),
    "Germany": ("4-2-3-1", [(1, "GK"), (15, "RB"), (2, "CB"), (23, "CB"), (3, "LB"), (6, "CDM"), (21, "CM"), (10, "RW"), (13, "CAM"), (14, "LW"), (7, "ST")]),
    "Japan": ("4-2-3-1", [(12, "GK"), (19, "RB"), (4, "CB"), (22, "CB"), (5, "LB"), (6, "CDM"), (17, "CM"), (14, "RW"), (15, "CAM"), (11, "LW"), (25, "ST")]),
    "Belgium": ("3-4-2-1", [(1, "GK"), (19, "CB"), (2, "CB"), (5, "CB"), (21, "RWB"), (6, "CDM"), (8, "CM"), (11, "LWB"), (7, "CAM"), (10, "SS"), (23, "ST")]),
    "Canada": ("3-4-3", [(18, "GK"), (2, "CB"), (5, "CB"), (4, "CB"), (11, "RWB"), (13, "CDM"), (7, "CM"), (22, "LWB"), (10, "RW"), (20, "ST"), (19, "LW")]),
    "Morocco": ("4-3-3", [(1, "GK"), (2, "RB"), (5, "CB"), (6, "CB"), (3, "LB"), (4, "CDM"), (8, "CM"), (15, "CM"), (7, "RW"), (19, "ST"), (17, "LW")]),
    "Croatia": ("4-3-3", [(1, "GK"), (22, "RB"), (6, "CB"), (20, "CB"), (19, "LB"), (11, "CDM"), (10, "CM"), (8, "CM"), (13, "RW"), (9, "ST"), (4, "LW")]),
    "Brazil": ("4-2-3-1", [(1, "GK"), (2, "RB"), (4, "CB"), (3, "CB"), (6, "LB"), (5, "CDM"), (7, "CM"), (11, "RW"), (10, "CAM"), (20, "LW"), (9, "ST")]),
    "Serbia": ("3-4-2-1", [(23, "GK"), (5, "CB"), (4, "CB"), (2, "CB"), (14, "RWB"), (16, "CM"), (8, "CM"), (25, "LWB"), (20, "CAM"), (10, "CAM"), (9, "ST")]),
    "Switzerland": ("4-2-3-1", [(1, "GK"), (3, "RB"), (5, "CB"), (4, "CB"), (13, "LB"), (8, "CDM"), (10, "CM"), (23, "RW"), (15, "CAM"), (17, "LW"), (7, "ST")]),
    "Cameroon": ("4-3-3", [(23, "GK"), (19, "RB"), (21, "CB"), (3, "CB"), (25, "LB"), (14, "CDM"), (8, "CM"), (18, "CM"), (20, "RW"), (13, "ST"), (12, "LW")]),
    "Portugal": ("4-2-3-1", [(22, "GK"), (20, "RB"), (4, "CB"), (13, "CB"), (5, "LB"), (18, "CDM"), (25, "CM"), (10, "RW"), (8, "CAM"), (11, "LW"), (7, "ST")]),
    "Ghana": ("5-2-2-1", [(1, "GK"), (26, "RWB"), (18, "CB"), (23, "CB"), (4, "CB"), (17, "LWB"), (5, "CM"), (21, "CM"), (20, "CAM"), (10, "SS"), (19, "ST")]),
    "Uruguay": ("4-3-3", [(23, "GK"), (22, "RB"), (3, "CB"), (2, "CB"), (16, "LB"), (5, "CDM"), (6, "CM"), (15, "CM"), (8, "RW"), (9, "ST"), (11, "LW")]),
    "South Korea": ("4-2-3-1", [(1, "GK"), (15, "RB"), (4, "CB"), (19, "CB"), (3, "LB"), (5, "CDM"), (6, "CM"), (17, "RW"), (10, "CAM"), (7, "LW"), (16, "ST")]),
}

TEAM_RATINGS = {
    "Argentina": [92, 93, 90, 88, 86, 89, 92, 94, 84],
    "France": [92, 94, 89, 89, 88, 93, 91, 91, 82],
    "Brazil": [91, 92, 90, 91, 90, 93, 91, 88, 86],
    "England": [89, 90, 88, 87, 84, 91, 86, 86, 83],
    "Portugal": [88, 90, 89, 87, 82, 91, 91, 92, 80],
    "Spain": [87, 86, 91, 88, 84, 90, 89, 78, 88],
    "Germany": [87, 88, 90, 84, 89, 89, 92, 84, 82],
    "Netherlands": [87, 87, 88, 89, 78, 86, 88, 86, 83],
    "Belgium": [86, 88, 90, 82, 91, 85, 94, 85, 84],
    "Croatia": [86, 83, 91, 86, 87, 84, 94, 91, 85],
    "Uruguay": [84, 86, 86, 84, 81, 85, 94, 88, 78],
    "Morocco": [83, 80, 85, 89, 88, 80, 84, 91, 88],
    "Senegal": [82, 84, 81, 84, 83, 82, 86, 84, 81],
    "Denmark": [82, 80, 85, 84, 84, 83, 89, 83, 88],
    "Switzerland": [82, 82, 84, 84, 85, 82, 89, 85, 84],
    "Poland": [81, 86, 78, 80, 87, 78, 89, 86, 79],
    "Japan": [80, 79, 81, 80, 76, 81, 84, 72, 91],
    "Mexico": [80, 80, 82, 81, 84, 79, 91, 81, 84],
    "Serbia": [80, 85, 83, 78, 77, 81, 84, 84, 76],
    "USA": [80, 80, 82, 80, 79, 82, 77, 78, 87],
    "South Korea": [79, 83, 79, 77, 78, 78, 84, 86, 86],
    "Ecuador": [78, 79, 81, 80, 76, 79, 74, 80, 83],
    "Iran": [77, 81, 77, 76, 79, 77, 87, 84, 76],
    "Wales": [77, 79, 77, 77, 77, 76, 89, 84, 82],
    "Canada": [77, 80, 78, 75, 74, 77, 72, 79, 85],
    "Cameroon": [77, 81, 77, 77, 78, 78, 85, 82, 75],
    "Australia": [76, 76, 76, 78, 79, 77, 82, 85, 87],
    "Costa Rica": [76, 75, 75, 76, 87, 74, 91, 82, 84],
    "Ghana": [76, 79, 78, 75, 73, 78, 80, 80, 73],
    "Tunisia": [75, 75, 77, 78, 76, 75, 84, 80, 88],
    "Qatar": [72, 74, 72, 71, 69, 72, 78, 78, 82],
    "Saudi Arabia": [72, 74, 73, 72, 75, 73, 80, 82, 81],
}

RATING_FIELDS = [
    "overall", "attack", "midfield", "defence", "goalkeeper",
    "squadDepth", "experience", "penalties", "discipline",
]

PERFORMANCE_ADJUSTMENTS = {
    "Lionel Messi": (2, "Golden Ball, seven goals and decisive champion-level influence"),
    "Emiliano Martínez": (2, "Golden Glove and decisive shootout saves"),
    "Julián Álvarez": (3, "four goals and an outstanding pressing role in the title run"),
    "Enzo Fernández": (3, "Young Player award and immediate control of Argentina's midfield"),
    "Alexis Mac Allister": (2, "became an essential two-way starter during the title run"),
    "Ángel Di María": (1, "decisive goal and penalty won in the final"),
    "Lautaro Martínez": (-1, "strong club baseline but a difficult finishing tournament"),
    "Kylian Mbappé": (2, "Golden Boot with eight goals and a final hat-trick"),
    "Antoine Griezmann": (2, "elite creative and defensive midfield influence"),
    "Olivier Giroud": (2, "four goals and sustained starting importance"),
    "Randal Kolo Muani": (2, "high-impact replacement with a semi-final goal and final contribution"),
    "Aurélien Tchouaméni": (1, "major midfield responsibility and a quarter-final goal"),
    "Karim Benzema": (-1, "elite club form retained, tempered by tournament-ending injury"),
    "Jude Bellingham": (2, "breakout tournament as England's complete midfield starter"),
    "Bukayo Saka": (2, "three goals and sustained attacking threat"),
    "Harry Maguire": (1, "strong tournament defending after difficult club form"),
    "Marcus Rashford": (1, "three goals despite limited starts"),
    "Harry Kane": (0, "elite all-round play retained despite the missed France penalty"),
    "Bruno Fernandes": (2, "two goals, three assists and Portugal's main creator"),
    "Gonçalo Ramos": (3, "hat-trick on his first World Cup start"),
    "Cristiano Ronaldo": (-3, "declining club form and loss of his tournament starting place"),
    "Pepe": (1, "important knockout-stage defending at age 39"),
    "Sofyan Amrabat": (4, "one of the tournament's outstanding holding midfielders"),
    "Yassine Bounou": (3, "elite clean-sheet and shootout performances in a semi-final run"),
    "Azzedine Ounahi": (4, "breakout ball progression and control throughout Morocco's run"),
    "Romain Saïss": (3, "captained an exceptional defensive run while carrying injury"),
    "Achraf Hakimi": (1, "elite two-way play and decisive shootout penalty"),
    "Nayef Aguerd": (2, "central to Morocco's outstanding defensive structure"),
    "Sofiane Boufal": (2, "important ball-carrying outlet in the semi-final run"),
    "Josko Gvardiol": (3, "outstanding tournament defending and third-place goal"),
    "Dominik Livaković": (3, "two shootout wins and elite knockout saves"),
    "Luka Modrić": (1, "sustained elite control through a second straight deep run"),
    "Ivan Perišić": (1, "three direct goal contributions and major knockout influence"),
    "Cody Gakpo": (3, "scored in every group match during his breakout tournament"),
    "Andries Noppert": (4, "low pre-tournament baseline transformed by a strong starting tournament"),
    "Denzel Dumfries": (1, "decisive goal and two assists in the round of 16"),
    "Wout Weghorst": (1, "historic two-goal quarter-final impact"),
    "Neymar": (1, "two goals and elite creation when fit"),
    "Richarlison": (2, "three goals including one of the tournament's best finishes"),
    "Vinícius Júnior": (1, "one goal and two assists as a consistent attacking outlet"),
    "Casemiro": (1, "decisive group-stage winner and elite midfield protection"),
    "Rodrygo": (0, "high talent retained but limited tournament role and shootout miss"),
    "Ritsu Dōan": (2, "two decisive comeback goals against Germany and Spain"),
    "Kaoru Mitoma": (4, "breakout wing play and decisive role in Japan's group win"),
    "Shūichi Gonda": (2, "key saves in victories over Germany and Spain"),
    "Takumi Minamino": (-1, "limited role and missed shootout penalty"),
    "Wojciech Szczęsny": (2, "two saved penalties and outstanding group-stage goalkeeping"),
    "Robert Lewandowski": (0, "strong baseline balanced by two goals and a missed penalty"),
    "Mehdi Taremi": (1, "two goals and one assist despite Iran's group exit"),
    "Gareth Bale": (-2, "late-career physical decline despite a decisive penalty"),
    "Eden Hazard": (-3, "reputation exceeded his reduced club and tournament impact"),
    "Romelu Lukaku": (-2, "injury-limited preparation and costly missed chances"),
    "Kevin De Bruyne": (0, "elite club level retained despite a poor team tournament"),
    "Thibaut Courtois": (0, "elite goalkeeper level retained despite group-stage elimination"),
    "Alphonso Davies": (1, "scored Canada's first men's World Cup goal and remained their main threat"),
    "Stephen Eustáquio": (1, "important midfield control before injury"),
    "Craig Goodwin": (2, "two goals in Australia's best modern World Cup run"),
    "Harry Souttar": (3, "outstanding defending after a long injury absence"),
    "Aziz Behich": (1, "strong two-way tournament in a round-of-16 run"),
    "Salem Al-Dawsari": (2, "two goals including the winner against Argentina"),
    "Mohammed Al-Owais": (2, "outstanding saves in the historic Argentina victory"),
    "Enner Valencia": (2, "three group-stage goals and central attacking importance"),
    "Moisés Caicedo": (1, "strong midfield play and a goal against Senegal"),
    "Kalidou Koulibaly": (1, "captain and decisive scorer in qualification for the knockouts"),
    "Boulaye Dia": (1, "important goals and pressing in Senegal's round-of-16 run"),
    "Vincent Aboubakar": (2, "goal and assist against Serbia plus the winner over Brazil"),
    "Eric Maxim Choupo-Moting": (1, "important attacking output and hold-up play"),
    "Mohammed Kudus": (3, "two goals and a breakout creative tournament"),
    "André Ayew": (-1, "leadership retained but a costly missed penalty"),
    "Cho Gue-sung": (3, "two goals against Ghana and major centre-forward impact"),
    "Hee-chan Hwang": (1, "decisive late winner against Portugal"),
    "Federico Valverde": (0, "elite club form retained despite Uruguay's early exit"),
    "Darwin Núñez": (-1, "strong athletic profile but no goals at the tournament"),
    "Keylor Navas": (-2, "elite career baseline tempered by seven conceded against Spain"),
}

REPLACEMENTS = [
    {"team": "Senegal", "out": "Sadio Mané", "in": "Moussa N'Diaye", "date": "2022-11-20", "reason": "injury"},
    {"team": "Argentina", "out": "Nicolás González", "in": "Ángel Correa", "date": "2022-11-17", "reason": "injury"},
    {"team": "Argentina", "out": "Joaquín Correa", "in": "Thiago Almada", "date": "2022-11-18", "reason": "injury"},
    {"team": "Poland", "out": "Bartłomiej Drągowski", "in": "Kamil Grabara", "date": "2022-11-13", "reason": "injury"},
    {"team": "Saudi Arabia", "out": "Fahad Al-Muwallad", "in": "Nawaf Al-Abed", "date": "2022-11-13", "reason": "eligibility precaution"},
    {"team": "Australia", "out": "Martin Boyle", "in": "Marco Tilio", "date": "2022-11-20", "reason": "injury"},
    {"team": "France", "out": "Presnel Kimpembe", "in": "Axel Disasi", "date": "2022-11-14", "reason": "injury"},
    {"team": "France", "out": "Christopher Nkunku", "in": "Randal Kolo Muani", "date": "2022-11-16", "reason": "injury"},
    {"team": "Japan", "out": "Yūta Nakayama", "in": "Shuto Machino", "date": "2022-11-08", "reason": "injury"},
    {"team": "Spain", "out": "José Gayà", "in": "Alejandro Balde", "date": "2022-11-18", "reason": "injury"},
    {"team": "Morocco", "out": "Amine Harit", "in": "Anass Zaroury", "date": "2022-11-16", "reason": "injury"},
]

MANUAL_PLAYER_PROFILES = {
    "Ró-Ró": {"overall": 68, "positions": ["RB", "RWB", "CB"], "foot": "right"},
    "Ali Assadalla": {"overall": 68, "positions": ["CM", "CAM"], "foot": "right"},
    "Khalid Muneer": {"overall": 62, "positions": ["LW", "RW", "ST"], "foot": "right"},
    "Naif Al-Hadhrami": {"overall": 61, "positions": ["CM", "CDM"], "foot": "right"},
    "Jassem Gaber": {"overall": 62, "positions": ["CB", "CDM"], "foot": "right"},
    "Mostafa Meshaal": {"overall": 61, "positions": ["CM", "CDM"], "foot": "right"},
    "Hernán Galíndez": {
        "overall": 73, "positions": ["GK"], "foot": "right",
        "goalkeeping": {"diving": 74, "handling": 71, "kicking": 69, "positioning": 73, "reflexes": 75},
    },
    "Robert Arboleda": {"overall": 74, "positions": ["CB"], "foot": "right"},
    "Kevin Rodríguez": {"overall": 67, "positions": ["ST", "RW"], "foot": "right"},
    "Shojae Khalilzadeh": {"overall": 72, "positions": ["CB", "RB"], "foot": "right"},
    "Saeid Ezatolahi": {"overall": 72, "positions": ["CDM", "CM"], "foot": "right"},
    "Morteza Pouraliganji": {"overall": 71, "positions": ["CB"], "foot": "right"},
    "Vahid Amiri": {"overall": 72, "positions": ["LM", "LB", "LW"], "foot": "left"},
    "Hossein Kanaanizadegan": {"overall": 71, "positions": ["CB"], "foot": "right"},
    "Rouzbeh Cheshmi": {"overall": 70, "positions": ["CDM", "CB"], "foot": "right"},
    "Mehdi Torabi": {"overall": 73, "positions": ["LW", "CAM", "LM"], "foot": "right"},
    "Ahmad Nourollahi": {"overall": 72, "positions": ["CM", "CDM"], "foot": "right"},
    "Ramin Rezaeian": {
        "overall": 73, "positions": ["RB", "RWB", "RM"], "foot": "right",
        "attributes": {"pace": 76, "shooting": 69, "passing": 73, "dribbling": 72, "defending": 70, "physical": 70},
    },
    "Hossein Hosseini": {
        "overall": 70, "positions": ["GK"], "foot": "right",
        "goalkeeping": {"diving": 71, "handling": 68, "kicking": 67, "positioning": 70, "reflexes": 72},
    },
    "Abolfazl Jalali": {"overall": 68, "positions": ["LB", "LWB"], "foot": "left"},
    "Mohammed Al-Breik": {"overall": 70, "positions": ["RB", "LB", "RWB"], "foot": "right"},
    "Abdulellah Al-Malki": {"overall": 69, "positions": ["CDM", "CM"], "foot": "right"},
    "Yasser Al-Shahrani": {"overall": 72, "positions": ["LB", "RB", "LWB"], "foot": "left"},
    "Mohamed Kanno": {"overall": 73, "positions": ["CM", "CDM"], "foot": "right"},
    "Aymen Mathlouthi": {
        "overall": 69, "positions": ["GK"], "foot": "right",
        "goalkeeping": {"diving": 68, "handling": 69, "kicking": 66, "positioning": 71, "reflexes": 68},
    },
    "Nader Ghandri": {"overall": 69, "positions": ["CB", "CDM"], "foot": "right"},
    "Youssef Msakni": {
        "overall": 74, "positions": ["LW", "SS", "CAM"], "foot": "right",
        "attributes": {"pace": 76, "shooting": 74, "passing": 74, "dribbling": 80, "defending": 34, "physical": 61},
    },
    "Taha Yassine Khenissi": {"overall": 69, "positions": ["ST"], "foot": "right"},
    "Ali Maâloul": {
        "overall": 74, "positions": ["LB", "LWB", "LM"], "foot": "left",
        "attributes": {"pace": 74, "shooting": 68, "passing": 76, "dribbling": 74, "defending": 71, "physical": 70},
    },
    "Ferjani Sassi": {"overall": 72, "positions": ["CM", "CDM", "CAM"], "foot": "right"},
    "Mohamed Ali Ben Romdhane": {"overall": 70, "positions": ["CM", "CAM"], "foot": "right"},
    "Aymen Dahmen": {
        "overall": 71, "positions": ["GK"], "foot": "right",
        "goalkeeping": {"diving": 72, "handling": 70, "kicking": 68, "positioning": 70, "reflexes": 73},
    },
    "Ghailene Chaalali": {"overall": 69, "positions": ["CM", "CDM"], "foot": "right"},
    "Seifeddine Jaziri": {"overall": 70, "positions": ["ST"], "foot": "right"},
    "Bechir Ben Saïd": {
        "overall": 70, "positions": ["GK"], "foot": "right",
        "goalkeeping": {"diving": 71, "handling": 69, "kicking": 67, "positioning": 70, "reflexes": 71},
    },
    "Mouez Hassen": {
        "overall": 69, "positions": ["GK"], "foot": "right",
        "goalkeeping": {"diving": 70, "handling": 68, "kicking": 67, "positioning": 68, "reflexes": 71},
    },
    "Daniel Chacón": {"overall": 65, "positions": ["CB", "CDM"], "foot": "right"},
    "Juan Pablo Vargas": {"overall": 72, "positions": ["CB"], "foot": "left"},
    "Keysher Fuller": {"overall": 69, "positions": ["RB", "RWB", "RM"], "foot": "right"},
    "Celso Borges": {
        "overall": 74, "positions": ["CM", "CDM"], "foot": "right",
        "attributes": {"pace": 46, "shooting": 71, "passing": 75, "dribbling": 69, "defending": 69, "physical": 73},
    },
    "Anthony Contreras": {"overall": 69, "positions": ["ST"], "foot": "right"},
    "Bryan Ruiz": {
        "overall": 73, "positions": ["CAM", "RW", "CM"], "foot": "left",
        "attributes": {"pace": 47, "shooting": 72, "passing": 77, "dribbling": 75, "defending": 42, "physical": 59},
    },
    "Johan Venegas": {"overall": 70, "positions": ["ST", "LW"], "foot": "right"},
    "Gerson Torres": {"overall": 68, "positions": ["RW", "LW", "CAM"], "foot": "right"},
    "Youstin Salas": {"overall": 68, "positions": ["CDM", "RB", "CM"], "foot": "right"},
    "Carlos Martínez": {"overall": 67, "positions": ["RB"], "foot": "right"},
    "Yeltsin Tejeda": {"overall": 72, "positions": ["CDM", "CM"], "foot": "right"},
    "Esteban Alvarado": {
        "overall": 70, "positions": ["GK"], "foot": "right",
        "goalkeeping": {"diving": 70, "handling": 69, "kicking": 68, "positioning": 71, "reflexes": 70},
    },
    "Kendall Waston": {"overall": 72, "positions": ["CB"], "foot": "right"},
    "Brandon Aguilera": {"overall": 67, "positions": ["CAM", "CM"], "foot": "right"},
    "Douglas López": {"overall": 67, "positions": ["CDM", "CM"], "foot": "right"},
    "Roan Wilson": {"overall": 63, "positions": ["CM", "CDM"], "foot": "right"},
    "Anthony Hernández": {"overall": 64, "positions": ["RW", "RM"], "foot": "right"},
    "Álvaro Zamora": {"overall": 67, "positions": ["LW", "RW", "CAM"], "foot": "right"},
    "Daniel Schmidt": {
        "overall": 73, "positions": ["GK"], "foot": "right",
        "goalkeeping": {"diving": 74, "handling": 71, "kicking": 72, "positioning": 72, "reflexes": 74},
    },
    "Derek Cornelius": {"overall": 70, "positions": ["CB", "LB"], "foot": "left"},
    "Anass Zaroury": {"overall": 72, "positions": ["LW", "RW"], "foot": "right"},
    "Badr Benoun": {"overall": 73, "positions": ["CB"], "foot": "right"},
    "Weverton": {
        "overall": 82, "positions": ["GK"], "foot": "right",
        "goalkeeping": {"diving": 81, "handling": 80, "kicking": 76, "positioning": 83, "reflexes": 82},
    },
    "Éverton Ribeiro": {
        "overall": 81, "positions": ["CAM", "RW", "CM"], "foot": "left",
        "attributes": {"pace": 73, "shooting": 75, "passing": 82, "dribbling": 85, "defending": 50, "physical": 60},
    },
    "Strahinja Eraković": {"overall": 73, "positions": ["CB", "RB"], "foot": "right"},
    "Jerome Ngom Mbekeli": {"overall": 65, "positions": ["RB", "RWB", "RM"], "foot": "right"},
    "Georges-Kévin Nkoudou": {"overall": 76, "positions": ["LW", "LM"], "foot": "right"},
    "Souaibou Marou": {"overall": 64, "positions": ["ST"], "foot": "right"},
    "Ibrahim Danlad": {
        "overall": 65, "positions": ["GK"], "foot": "right",
        "goalkeeping": {"diving": 66, "handling": 63, "kicking": 62, "positioning": 64, "reflexes": 67},
    },
    "Daniel Afriyie": {"overall": 67, "positions": ["RW", "ST"], "foot": "right"},
    "Guillermo Varela": {"overall": 73, "positions": ["RB", "RWB"], "foot": "right"},
    "Agustín Canobbio": {"overall": 75, "positions": ["RW", "RM"], "foot": "right"},
    "Giorgian De Arrascaeta": {
        "overall": 82, "positions": ["CAM", "CM", "LW"], "foot": "right",
        "attributes": {"pace": 77, "shooting": 81, "passing": 83, "dribbling": 86, "defending": 50, "physical": 63},
    },
    "Woo-young Jung": {"overall": 72, "positions": ["CDM", "CM"], "foot": "right"},
    "Hwang In-beom": {"overall": 75, "positions": ["CM", "CDM"], "foot": "right"},
    "Cho Yu-min": {"overall": 68, "positions": ["CB", "CDM"], "foot": "right"},
}

POSITION_DEFAULTS = {
    "GK": {"pace": 48, "shooting": 16, "passing": 56, "dribbling": 24, "defending": 18, "physical": 68},
    "CB": {"pace": 62, "shooting": 35, "passing": 58, "dribbling": 58, "defending": 76, "physical": 78},
    "RB": {"pace": 74, "shooting": 48, "passing": 66, "dribbling": 68, "defending": 70, "physical": 72},
    "LB": {"pace": 74, "shooting": 48, "passing": 66, "dribbling": 68, "defending": 70, "physical": 72},
    "RWB": {"pace": 78, "shooting": 55, "passing": 68, "dribbling": 71, "defending": 66, "physical": 72},
    "LWB": {"pace": 78, "shooting": 55, "passing": 68, "dribbling": 71, "defending": 66, "physical": 72},
    "CDM": {"pace": 66, "shooting": 58, "passing": 72, "dribbling": 70, "defending": 74, "physical": 76},
    "CM": {"pace": 68, "shooting": 66, "passing": 76, "dribbling": 75, "defending": 66, "physical": 72},
    "CAM": {"pace": 72, "shooting": 72, "passing": 78, "dribbling": 80, "defending": 43, "physical": 64},
    "RM": {"pace": 78, "shooting": 68, "passing": 72, "dribbling": 77, "defending": 48, "physical": 66},
    "LM": {"pace": 78, "shooting": 68, "passing": 72, "dribbling": 77, "defending": 48, "physical": 66},
    "RW": {"pace": 82, "shooting": 74, "passing": 72, "dribbling": 80, "defending": 36, "physical": 64},
    "LW": {"pace": 82, "shooting": 74, "passing": 72, "dribbling": 80, "defending": 36, "physical": 64},
    "SS": {"pace": 76, "shooting": 76, "passing": 73, "dribbling": 78, "defending": 38, "physical": 68},
    "ST": {"pace": 75, "shooting": 78, "passing": 64, "dribbling": 73, "defending": 33, "physical": 75},
}

ATTRIBUTE_SOURCE_FIELDS = {
    "pace": "pace",
    "shooting": "shooting",
    "passing": "passing",
    "dribbling": "dribbling",
    "defending": "defending",
    "physic": "physical",
}

GK_SOURCE_FIELDS = {
    "goalkeeping_diving": "diving",
    "goalkeeping_handling": "handling",
    "goalkeeping_kicking": "kicking",
    "goalkeeping_positioning": "positioning",
    "goalkeeping_reflexes": "reflexes",
}


def normalize(value):
    decomposed = unicodedata.normalize("NFKD", value or "")
    plain = decomposed.encode("ascii", "ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]", "", plain)


def name_tokens(value):
    decomposed = unicodedata.normalize("NFKD", value or "")
    plain = decomposed.encode("ascii", "ignore").decode("ascii").lower()
    return set(re.findall(r"[a-z0-9]+", plain))


def fifa_position_compatible(official_position, fifa_positions):
    position_groups = {
        "GK": {"GK"},
        "DF": {"CB", "LB", "RB", "LWB", "RWB"},
        "MF": {"CDM", "CM", "CAM", "LM", "RM", "LW", "RW"},
        "FW": {"ST", "CF", "CAM", "LM", "RM", "LW", "RW"},
    }
    return bool(position_groups[official_position].intersection(fifa_positions))


def integer(value, fallback=0):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return fallback


def clamp(value, low=1, high=99):
    return max(low, min(high, int(round(value))))


def common_name(row):
    given = (row.get("given_name") or "").replace("not applicable", "").strip()
    family = (row.get("family_name") or "").replace("not applicable", "").strip()
    return " ".join(part for part in [given, family] if part)


def load_official_pdf():
    teams = {}
    with pdfplumber.open(FIFA_SQUADS_PDF) as document:
        for page in document.pages:
            text = page.extract_text() or ""
            match = re.search(r"\n([^\n]+) \(([A-Z]{3})\)\n", text)
            if not match:
                raise ValueError("Could not identify a team page in the official FIFA PDF.")
            source_team = match.group(1)
            team = PDF_TEAM_NAMES.get(source_team, source_team)
            tables = page.extract_tables()
            squad_table = tables[0]
            players = {}
            for row in squad_table[1:]:
                if not row or not row[0] or not str(row[0]).isdigit():
                    continue
                number = int(row[0])
                players[number] = {
                    "number": number,
                    "officialPosition": row[1],
                    "officialPlayerName": row[2],
                    "officialGivenNames": row[3],
                    "officialFamilyNames": row[4],
                    "shirtName": row[5],
                    "dateOfBirth": datetime.strptime(row[6], "%d/%m/%Y").date().isoformat(),
                    "club": re.sub(r"\s+\([A-Z]{3}\)$", "", (row[7] or "").replace("\x00", "fi")).strip(),
                    "heightCm": integer(row[8]),
                    "caps": integer(row[9]),
                    "internationalGoals": integer(row[10]),
                }
            teams[team] = players
    return teams


def load_worldcup_squads():
    rows = []
    with (WORLDCUP_DATA / "squads.csv").open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["tournament_id"] != "WC-2022":
                continue
            team = WORLDCUP_TEAM_NAMES.get(row["team_name"], row["team_name"])
            rows.append({
                **row,
                "team_name": team,
                "name": common_name(row),
                "shirt_number": int(row["shirt_number"]),
            })
    return rows


def load_appearances():
    usage = defaultdict(lambda: defaultdict(lambda: {"starts": 0, "apps": 0}))
    team_matches = defaultdict(set)
    with (WORLDCUP_DATA / "player_appearances.csv").open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["tournament_id"] != "WC-2022":
                continue
            team = WORLDCUP_TEAM_NAMES.get(row["team_name"], row["team_name"])
            number = int(row["shirt_number"])
            team_matches[team].add(row["match_id"])
            usage[team][number]["apps"] += 1
            usage[team][number]["starts"] += int(row["starter"])
    return usage, {team: len(matches) for team, matches in team_matches.items()}


def load_tournament_goals():
    goals = defaultdict(lambda: defaultdict(int))
    with (WORLDCUP_DATA / "goals.csv").open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["tournament_id"] != "WC-2022" or row["own_goal"] == "1":
                continue
            team = WORLDCUP_TEAM_NAMES.get(row["player_team_name"], row["player_team_name"])
            goals[team][int(row["shirt_number"])] += 1
    return goals


def load_fifa_launch_players():
    indexes = {
        "fifa23": {"byDob": defaultdict(list), "byNationality": defaultdict(list)},
        "fifa22": {"byDob": defaultdict(list), "byNationality": defaultdict(list)},
    }
    with FIFA_23_PLAYERS.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["fifa_version"] == "23" and row["fifa_update"] == FIFA_23_UPDATE:
                target = indexes["fifa23"]
            elif row["fifa_version"] == "22" and row["fifa_update"] == FIFA_22_UPDATE:
                target = indexes["fifa22"]
            elif integer(row["fifa_version"]) < 22:
                break
            else:
                continue
            target["byDob"][row["dob"]].append(row)
            target["byNationality"][normalize(row["nationality_name"])].append(row)
    return indexes


def fifa_match(team, name, official, fifa_rows):
    expected = FIFA_NATIONALITIES.get(team, {team})
    candidates_by_id = {
        row["player_id"]: row
        for row in fifa_rows["byDob"].get(official["dateOfBirth"], [])
    }
    for nationality in expected:
        for row in fifa_rows["byNationality"].get(normalize(nationality), []):
            candidates_by_id[row["player_id"]] = row
    candidates = list(candidates_by_id.values())
    if not candidates:
        return None, 0
    target_name = normalize(name)
    target_tokens = name_tokens(name)
    official_family_tokens = name_tokens(official["officialFamilyNames"])
    target_club = normalize(official["club"])
    ranked = []
    for row in candidates:
        fifa_positions = {value.strip() for value in row["player_positions"].split(",") if value.strip()}
        if official["officialPosition"] == "GK" and "GK" not in fifa_positions:
            continue
        if official["officialPosition"] != "GK" and "GK" in fifa_positions:
            continue
        position_compatible = fifa_position_compatible(official["officialPosition"], fifa_positions)
        short_name = normalize(row["short_name"])
        long_name = normalize(row["long_name"])
        row_tokens = name_tokens(f"{row['short_name']} {row['long_name']}")
        token_coverage = (
            len(target_tokens.intersection(row_tokens)) / len(target_tokens)
            if target_tokens else 0
        )
        sequence_score = max(
            SequenceMatcher(None, target_name, short_name).ratio(),
            SequenceMatcher(None, target_name, long_name).ratio(),
        )
        name_score = max(sequence_score, token_coverage)
        nationality_match = any(normalize(row["nationality_name"]) == normalize(value) for value in expected)
        club_score = SequenceMatcher(None, target_club, normalize(row["club_name"])).ratio()
        dob_match = row["dob"] == official["dateOfBirth"]
        score = (
            name_score
            + (0.35 if nationality_match else 0)
            + club_score * 0.12
            + (0.25 if dob_match else 0)
            + (0.1 if position_compatible else 0)
        )
        family_name_match = any(
            len(token) >= 3 and token in row_tokens
            for token in official_family_tokens
        )
        strong_identity_match = (
            dob_match
            and nationality_match
            and family_name_match
            and club_score >= 0.45
        )
        direct_name_match = (
            token_coverage >= 0.75
            or (
                sequence_score >= 0.88
                and (dob_match or club_score >= 0.5)
            )
        )
        if nationality_match and (direct_name_match or strong_identity_match):
            ranked.append((score, name_score, strong_identity_match, row))
    if not ranked:
        return None, 0
    score, best_name_score, strong_identity_match, row = max(ranked, key=lambda item: item[0])
    return row, score


def fallback_primary(official_position):
    return {"GK": "GK", "DF": "CB", "MF": "CM", "FW": "ST"}[official_position]


def position_attributes(position, overall):
    template = POSITION_DEFAULTS.get(position, POSITION_DEFAULTS["CM"])
    delta = (overall - 75) * 0.45
    return {name: clamp(value + delta) for name, value in template.items()}


def fallback_goalkeeping(overall):
    return {
        "diving": clamp(overall),
        "handling": clamp(overall - 1),
        "kicking": clamp(overall - 3),
        "positioning": clamp(overall),
        "reflexes": clamp(overall + 1),
    }


def starting_likelihood(usage, team_match_count):
    if not team_match_count:
        return 0.08
    starts = usage["starts"]
    apps = usage["apps"]
    if not apps:
        return 0.08
    likelihood = 0.12 + 0.76 * (starts / team_match_count) + 0.12 * ((apps - starts) / team_match_count)
    return round(max(0.08, min(0.98, likelihood)), 2)


def team_rating_payload(team):
    return dict(zip(RATING_FIELDS, TEAM_RATINGS[team]))


def build_dataset():
    official = load_official_pdf()
    squad_rows = load_worldcup_squads()
    usage, match_counts = load_appearances()
    tournament_goals = load_tournament_goals()
    fifa_rows = load_fifa_launch_players()
    replacements_by_player = {
        (replacement["team"], normalize(replacement["in"])): replacement
        for replacement in REPLACEMENTS
    }
    countries = {}
    unmatched = []
    fifa22_fallbacks = []
    low_confidence = []

    rows_by_team = defaultdict(list)
    for row in squad_rows:
        rows_by_team[row["team_name"]].append(row)

    for team in GROUPS:
        if team not in official:
            raise ValueError(f"{team} is missing from the official PDF.")
        formation, lineup_roles = LINEUPS[team]
        lineup_role_by_number = dict(lineup_roles)
        player_by_number = {}

        for row in sorted(rows_by_team[team], key=lambda item: item["shirt_number"]):
            number = row["shirt_number"]
            official_player = official[team].get(number)
            if not official_player:
                raise ValueError(f"{team} #{number} is missing from the official FIFA PDF.")
            name = row["name"]
            manual_profile = MANUAL_PLAYER_PROFILES.get(name)
            fifa_player, match_score = fifa_match(team, name, official_player, fifa_rows["fifa23"])
            fifa_rating_source = "fifa23_pre_tournament_ratings"
            if not fifa_player:
                fifa_player, match_score = fifa_match(team, name, official_player, fifa_rows["fifa22"])
                if fifa_player:
                    fifa_rating_source = "fifa22_end_of_cycle_ratings"
                    fifa22_fallbacks.append(f"{team}: {name}")
            starter_role = lineup_role_by_number.get(number)
            resolved_positions = [
                value.strip()
                for value in (fifa_player["player_positions"].split(",") if fifa_player else [])
                if value.strip()
            ]
            if not resolved_positions and manual_profile:
                resolved_positions = manual_profile["positions"]
            primary = resolved_positions[0] if resolved_positions else fallback_primary(official_player["officialPosition"])
            positions = [primary] + [value for value in resolved_positions if value != primary]
            if starter_role and starter_role not in positions:
                positions.append(starter_role)
            positions = list(dict.fromkeys(positions))

            if fifa_player:
                base_overall = integer(fifa_player["overall"])
                attributes = {
                    output: integer(fifa_player[source])
                    for source, output in ATTRIBUTE_SOURCE_FIELDS.items()
                    if integer(fifa_player[source]) > 0
                }
                if len(attributes) < 6:
                    attributes = position_attributes(primary, base_overall)
                goalkeeping = {
                    output: integer(fifa_player[source])
                    for source, output in GK_SOURCE_FIELDS.items()
                    if integer(fifa_player[source]) > 0
                } if primary == "GK" else None
                preferred_foot = fifa_player["preferred_foot"].lower()
                foot_reliability = (
                    "fifa23-pre-tournament"
                    if fifa_rating_source == "fifa23_pre_tournament_ratings"
                    else "fifa22-end-of-cycle"
                )
            else:
                if manual_profile:
                    base_overall = manual_profile["overall"]
                    attributes = manual_profile.get("attributes", position_attributes(primary, base_overall))
                    goalkeeping = (
                        manual_profile.get("goalkeeping", fallback_goalkeeping(base_overall))
                        if primary == "GK" else None
                    )
                    preferred_foot = manual_profile["foot"]
                    foot_reliability = "manual-period-review"
                else:
                    role_usage = usage[team][number]
                    role_bonus = 2 if role_usage["starts"] >= max(1, match_counts.get(team, 3) - 1) else 0
                    base_overall = clamp(TEAM_RATINGS[team][0] - 9 + role_bonus, 58, 84)
                    attributes = position_attributes(primary, base_overall)
                    goalkeeping = fallback_goalkeeping(base_overall) if primary == "GK" else None
                    preferred_foot = "left" if primary in {"LB", "LWB", "LM", "LW"} else "right"
                    foot_reliability = "role-estimated"
                unmatched.append(f"{team}: {name}")

            default_reason = (
                "manual profile calibrated to club level, international role and World Cup usage"
                if manual_profile and not fifa_player
                else "rating retained after club form, international role and World Cup usage review"
            )
            adjustment, reason = PERFORMANCE_ADJUSTMENTS.get(name, (0, default_reason))
            overall = clamp(base_overall + adjustment, 58, 94)
            player_usage = usage[team][number]
            penalty_base = integer(fifa_player["mentality_penalties"], 62) if fifa_player else 62
            taker_index = next(
                (index for index, taker in enumerate(PENALTY_TAKERS[team]) if normalize(taker) == normalize(name)),
                None,
            )
            if taker_index is not None:
                penalty_base = max(penalty_base, 88 - taker_index * 3)
            if primary == "GK":
                penalty_base = min(penalty_base, 45)
            replacement = replacements_by_player.get((team, normalize(name)))
            sources = ["fifa_official_squad_2022", "worldcup_match_usage_2022"]
            if fifa_player:
                sources.append(fifa_rating_source)
            elif manual_profile:
                sources.append("manual_period_rating_review")
            else:
                sources.append("period_role_estimate")
            if adjustment:
                sources.append("worldcup_performance_context_2022")
            if replacement:
                sources.append("official_replacement_record")

            if fifa_player and fifa_rating_source == "fifa23_pre_tournament_ratings":
                short_justification = f"FIFA 23 pre-tournament baseline {base_overall}"
            elif fifa_player:
                short_justification = f"FIFA 22 end-of-cycle fallback baseline {base_overall}"
            else:
                short_justification = (
                    f"{'Manual period review' if manual_profile else 'Period role estimate'} {base_overall} "
                    "(not present in FIFA 23 pre-tournament or FIFA 22 end-of-cycle data)"
                )
            short_justification += (
                f"; {reason}; started {player_usage['starts']} and appeared in {player_usage['apps']} "
                f"of {match_counts.get(team, 0)} team matches."
            )
            if fifa_player:
                rating_reference = {
                    "source": fifa_rating_source,
                    "playerId": integer(fifa_player["player_id"]),
                    "sourceName": fifa_player["long_name"],
                    "updateDate": (
                        FIFA_23_UPDATE_DATE
                        if fifa_rating_source == "fifa23_pre_tournament_ratings"
                        else FIFA_22_UPDATE_DATE
                    ),
                    "matchScore": round(match_score, 3),
                }
            else:
                rating_reference = {
                    "source": "manual_period_rating_review" if manual_profile else "period_role_estimate",
                    "playerId": None,
                    "sourceName": None,
                    "updateDate": None,
                    "matchScore": None,
                }
            player = {
                "name": name,
                "shirtNumber": number,
                "primaryPosition": primary,
                "secondaryPositions": positions[1:],
                "sourcePosition": official_player["officialPosition"],
                "club": official_player["club"],
                "dateOfBirth": official_player["dateOfBirth"],
                "caps": official_player["caps"],
                "internationalGoals": official_player["internationalGoals"],
                "worldCupGoals": tournament_goals[team][number],
                "preferredFoot": preferred_foot,
                "preferredFootReliability": foot_reliability,
                "ratingReference": rating_reference,
                "overall": overall,
                **attributes,
                "goalkeeping": goalkeeping,
                "startingXILikelihood": starting_likelihood(player_usage, match_counts.get(team, 0)),
                "penaltyTakingAbility": clamp(penalty_base),
                "captain": normalize(CAPTAINS[team]) == normalize(name),
                "officialReplacement": replacement,
                "tournamentUsage": {
                    "starts": player_usage["starts"],
                    "appearances": player_usage["apps"],
                    "teamMatches": match_counts.get(team, 0),
                },
                "shortRatingJustification": short_justification,
                "sources": sources,
            }
            if fifa_player and match_score < 1.1:
                low_confidence.append(f"{team}: {name} ({match_score:.2f})")
            player_by_number[number] = player

        lineup = []
        for number, role in lineup_roles:
            player = player_by_number.get(number)
            if not player:
                raise ValueError(f"{team} starting XI references missing shirt #{number}.")
            lineup.append({"name": player["name"], "shirtNumber": number, "position": role})

        countries[team] = {
            "group": f"Group {GROUPS[team]}",
            "coach": COACHES[team],
            "formation": formation,
            "teamRatings": team_rating_payload(team),
            "likelyStartingXI": lineup,
            "captain": CAPTAINS[team],
            "penaltyTakers": PENALTY_TAKERS[team],
            "players": list(player_by_number.values()),
        }

    dataset = {
        "schemaVersion": 1,
        "tournament": "2022 FIFA World Cup",
        "ratingDate": "2022-12-18",
        "ratingWindow": "November-December 2022",
        "notes": (
            "Historical Qatar 2022 research dataset for the shared Retro World Cup simulator. "
            "Ratings represent ability around November-December 2022 and are not modern ratings."
        ),
        "sources": {
            "fifa_official_squad_2022": "https://fdp.fifa.org/assetspublic/ce44/pdf/SquadLists-English.pdf",
            "fifa_squad_rules_2022": "https://www.fifa.com/en/articles/all-you-need-to-know-about-fifa-world-cup-qatar-2022-squad-lists",
            "worldcup_match_usage_2022": "https://github.com/jfjelstul/worldcup",
            "fifa23_pre_tournament_ratings": (
                "FIFA 23 update 6 (2022-11-16), via "
                "https://www.kaggle.com/datasets/stefanoleone992/fifa-23-complete-player-dataset"
            ),
            "fifa22_end_of_cycle_ratings": (
                "FIFA 22 update 64 (2022-07-18) fallback for players absent from FIFA 23, via "
                "https://www.kaggle.com/datasets/stefanoleone992/fifa-23-complete-player-dataset"
            ),
            "worldcup_performance_context_2022": "2022 tournament appearances, roles and performances reviewed through 18 December 2022",
            "official_replacement_record": "https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_squads",
            "manual_period_rating_review": (
                "Manual November-December 2022 profile review using official tournament roles, "
                "2021/22 and early-2022/23 club context, and tournament performance"
            ),
            "period_role_estimate": "Position- and team-strength-bounded estimate for players absent from the FIFA 23 launch database",
        },
        "officialReplacements": REPLACEMENTS,
        "unreplacedWithdrawals": [
            {
                "team": "France",
                "player": "Karim Benzema",
                "date": "2022-11-20",
                "note": "Remained on FIFA's official 26-player list and was not replaced.",
            }
        ],
        "countries": countries,
        "validationMetadata": {
            "manualReviewPlayers": unmatched,
            "fifa22FallbackPlayers": fifa22_fallbacks,
            "lowerConfidenceFifaMatches": low_confidence,
        },
    }
    return dataset


def validate(dataset):
    countries = dataset["countries"]
    if len(countries) != 32:
        raise ValueError(f"Expected 32 countries, found {len(countries)}.")
    expected_total = 831
    total = 0
    for team, country in countries.items():
        expected_size = 25 if team == "Iran" else 26
        players = country["players"]
        total += len(players)
        if len(players) != expected_size:
            raise ValueError(f"{team} should have {expected_size} players, found {len(players)}.")
        numbers = [player["shirtNumber"] for player in players]
        names = [normalize(player["name"]) for player in players]
        if len(numbers) != len(set(numbers)):
            raise ValueError(f"{team} has duplicate shirt numbers.")
        if len(names) != len(set(names)):
            raise ValueError(f"{team} has duplicate player names.")
        if len(country["likelyStartingXI"]) != 11:
            raise ValueError(f"{team} does not have an 11-player starting XI.")
        lineup_names = {normalize(player["name"]) for player in country["likelyStartingXI"]}
        if len(lineup_names) != 11 or not lineup_names.issubset(set(names)):
            raise ValueError(f"{team} has an invalid starting XI.")
        goalkeeper_count = sum(1 for player in players if player["primaryPosition"] == "GK")
        expected_goalkeepers = 4 if team in {"Iran", "Switzerland", "Tunisia"} else 3
        if goalkeeper_count != expected_goalkeepers:
            raise ValueError(
                f"{team} should have {expected_goalkeepers} goalkeepers, found {goalkeeper_count}."
            )
        if sum(1 for player in players if player["captain"]) != 1:
            raise ValueError(f"{team} does not have exactly one captain.")
        for player in players:
            for rating in [
                "overall", "pace", "shooting", "passing", "dribbling",
                "defending", "physical", "penaltyTakingAbility",
            ]:
                if not 1 <= player[rating] <= 99:
                    raise ValueError(f"{team}: {player['name']} has invalid {rating}.")
    if total != expected_total:
        raise ValueError(f"Expected {expected_total} players, found {total}.")


def main():
    required = [
        FIFA_SQUADS_PDF,
        FIFA_23_PLAYERS,
        WORLDCUP_DATA / "squads.csv",
        WORLDCUP_DATA / "player_appearances.csv",
        WORLDCUP_DATA / "goals.csv",
    ]
    missing = [str(path) for path in required if not path.exists()]
    if missing:
        print("Missing source files:\n" + "\n".join(missing), file=sys.stderr)
        return 1
    dataset = build_dataset()
    validate(dataset)
    OUTPUT.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    unmatched = dataset["validationMetadata"]["manualReviewPlayers"]
    fifa22_fallbacks = dataset["validationMetadata"]["fifa22FallbackPlayers"]
    print(f"Generated {OUTPUT.name}: 32 teams, 831 players.")
    print("Squad sizes: Iran 25; all other teams 26.")
    print(
        f"FIFA 23 pre-tournament matches ({FIFA_23_UPDATE_DATE}): "
        f"{831 - len(fifa22_fallbacks) - len(unmatched)}; "
        f"FIFA 22 end-of-cycle fallbacks ({FIFA_22_UPDATE_DATE}): {len(fifa22_fallbacks)}; "
        f"manual period reviews: {len(unmatched)}."
    )
    if unmatched:
        print("Manual reviews: " + "; ".join(unmatched))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
