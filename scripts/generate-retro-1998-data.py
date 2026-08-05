import csv
import io
import json
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

import lxml.etree
import lxml.html
import pandas as pd

from retro_starting_xi import add_starting_xis


ROOT = Path(__file__).resolve().parents[1]
WORLD_CUP_SOURCE = ROOT / "tmp" / "worldcup-source"
SQUAD_HTML = WORLD_CUP_SOURCE / "data-raw" / "Wikipedia-squad-pages" / "men-1998-squads.html"
SQUADS_CSV = WORLD_CUP_SOURCE / "data-csv" / "squads.csv"
PLAYERS_CSV = WORLD_CUP_SOURCE / "data-csv" / "players.csv"
APPEARANCES_CSV = WORLD_CUP_SOURCE / "data-csv" / "player_appearances.csv"
MATCHES_CSV = WORLD_CUP_SOURCE / "data-csv" / "matches.csv"
RANKINGS_CSV = ROOT / "tmp" / "fifa-ranking-source" / "ranking_fifa_historical.csv"
SQUADS_OUTPUT = ROOT / "retro-1998-squads.js"
SCHEDULE_OUTPUT = ROOT / "retro-1998-schedule.js"


TEAM_NAME_MAP = {
    "Korea Republic": "South Korea",
    "United States": "USA",
}

TEAM_RATINGS = {
    "Brazil": 92, "Scotland": 76, "Morocco": 77, "Norway": 81,
    "Italy": 89, "Chile": 79, "Austria": 76, "Cameroon": 76,
    "France": 88, "Denmark": 80, "South Africa": 73, "Saudi Arabia": 70,
    "Spain": 86, "Nigeria": 80, "Paraguay": 78, "Bulgaria": 75,
    "Netherlands": 88, "Mexico": 79, "Belgium": 77, "South Korea": 71,
    "Germany": 85, "Yugoslavia": 81, "USA": 73, "Iran": 72,
    "Romania": 82, "England": 85, "Colombia": 79, "Tunisia": 71,
    "Argentina": 88, "Croatia": 82, "Jamaica": 67, "Japan": 70,
}

GROUPS = {
    "A": ["Brazil", "Scotland", "Morocco", "Norway"],
    "B": ["Italy", "Chile", "Cameroon", "Austria"],
    "C": ["France", "South Africa", "Saudi Arabia", "Denmark"],
    "D": ["Spain", "Bulgaria", "Nigeria", "Paraguay"],
    "E": ["Netherlands", "Belgium", "South Korea", "Mexico"],
    "F": ["Germany", "USA", "Yugoslavia", "Iran"],
    "G": ["Romania", "Colombia", "England", "Tunisia"],
    "H": ["Argentina", "Japan", "Jamaica", "Croatia"],
}

ELITE_RATINGS = {
    "ronaldo": 94, "zinedinezidane": 93, "paolomaldini": 92, "dennisbergkamp": 92,
    "gabrielbatistuta": 92, "rivaldo": 91, "robertobaggio": 91, "romario": 91,
    "marceldesailly": 91, "lilianturam": 91, "peterschmeichel": 91,
    "alan shearer": 90, "alanshearer": 90, "michaelowen": 88, "davidbeckham": 88,
    "jurgenklinsmann": 89, "davor suker": 90, "davorsuker": 90, "luisfigo": 90,
    "fernandohierro": 90, "pepguardiola": 88, "raul": 89, "francescototti": 88,
    "robertocarlos": 90, "cafu": 89, "bebeto": 89, "denilson": 88,
    "claudiotaffarel": 87, "aldair": 88, "dunga": 87, "emmanuelpetit": 87,
    "didierdeschamps": 88, "yournidjorkaeff": 87, "fabienbarthez": 87,
    "thierryhenry": 86, "laurentblanc": 88, "bixentelizarazu": 87,
    "frankdeboer": 88, "ronalddeboer": 87, "edwindervan der sar": 88,
    "edwinvandersar": 88, "jaapstam": 88, "patrickkluivert": 88, "marcovermars": 88,
    "clarenceseedorf": 88, "edgardavids": 88, "arielortega": 89, "juansebastianveron": 88,
    "javierzanetti": 88, "robertoayala": 87, "diegosimeone": 87, "claudiolopez": 87,
    "marcelosalas": 88, "ivanzamorano": 89, "jose luischilavert": 88,
    "joseluischilavert": 88, "brianlaudrup": 88, "michaellaudrup": 89,
    "predragmijatovic": 88, "dejanstankovic": 84, "sinisamihajlovic": 86,
    "gheorghehagi": 89, "gheorghepopescu": 87, "robertprosinecki": 87,
    "alessandrodelpiero": 89, "christianvieri": 88, "albertferrerguardiola": 84,
}

PENALTY_TAKER_OVERRIDES = {
    "Argentina": ["Gabriel Batistuta", "Ariel Ortega", "Juan Sebastián Verón"],
    "Brazil": ["Ronaldo", "Rivaldo", "Bebeto", "Dunga"],
    "Chile": ["Marcelo Salas", "Iván Zamorano"],
    "Croatia": ["Davor Šuker", "Robert Prosinečki"],
    "England": ["Alan Shearer", "David Beckham", "Michael Owen"],
    "France": ["Zinedine Zidane", "Youri Djorkaeff", "Emmanuel Petit"],
    "Germany": ["Andreas Möller", "Lothar Matthäus", "Jürgen Klinsmann"],
    "Italy": ["Roberto Baggio", "Alessandro Del Piero", "Christian Vieri"],
    "Mexico": ["Luis Hernández", "Alberto García Aspe"],
    "Netherlands": ["Dennis Bergkamp", "Ronald de Boer", "Frank de Boer"],
    "Paraguay": ["José Luis Chilavert", "Celso Ayala"],
    "Spain": ["Fernando Hierro", "Raúl", "Luis Enrique"],
    "Yugoslavia": ["Predrag Mijatović", "Siniša Mihajlović"],
}

TOP_CLUBS = {
    "milan", "inter milan", "juventus", "real madrid", "barcelona", "bayern munich",
    "borussia dortmund", "manchester united", "arsenal", "liverpool", "chelsea", "ajax",
    "paris saint-germain", "parma", "lazio", "roma", "valencia", "deportivo la coruña",
}


def normalize(value):
    decomposed = unicodedata.normalize("NFKD", str(value or ""))
    return re.sub(r"[^a-z0-9]", "", decomposed.encode("ascii", "ignore").decode().lower())


def canonical_team(value):
    return TEAM_NAME_MAP.get(str(value).strip(), str(value).strip())


def load_player_metadata():
    players = {}
    with PLAYERS_CSV.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            players[row["player_id"]] = row
    return players


def load_squad_ids():
    result = {}
    with SQUADS_CSV.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["tournament_id"] != "WC-1998":
                continue
            result[(canonical_team(row["team_name"]), int(row["shirt_number"]))] = row
    return result


def load_appearance_positions():
    positions = defaultdict(Counter)
    starter_counts = Counter()
    with APPEARANCES_CSV.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["tournament_id"] != "WC-1998":
                continue
            key = (canonical_team(row["team_name"]), int(row["shirt_number"]))
            positions[key][row["position_code"]] += 1
            starter_counts[key] += int(row["starter"])
    return positions, starter_counts


def detailed_positions(broad, observed):
    ordered = [name for name, _ in observed.most_common() if name]
    if broad == "GK":
        return ["GK"]
    fallbacks = {"DF": ["CB"], "MF": ["CM"], "FW": ["ST"]}
    return ordered or fallbacks.get(broad, [broad])


def player_attributes(overall, positions):
    role = positions[0]
    goalkeeper = role == "GK"
    if goalkeeper:
        return {
            "pace": max(30, overall - 38), "shooting": 18, "passing": max(48, overall - 20),
            "dribbling": max(40, overall - 28), "defending": max(42, overall - 24), "physic": max(60, overall - 8),
            "goalkeeping_diving": overall, "goalkeeping_handling": overall - 1,
            "goalkeeping_kicking": overall - 4, "goalkeeping_positioning": overall,
            "goalkeeping_reflexes": min(95, overall + 1),
        }
    attacker = role in {"ST", "CF", "FW", "LW", "RW", "SS"}
    defender = role in {"DF", "CB", "LB", "RB", "LWB", "RWB", "SW"}
    midfielder = not attacker and not defender
    return {
        "pace": max(45, min(94, overall + (3 if attacker else 0))),
        "shooting": max(38, min(94, overall + (3 if attacker else -5 if midfielder else -18))),
        "passing": max(42, min(94, overall + (2 if midfielder else -3 if attacker else -5))),
        "dribbling": max(40, min(94, overall + (2 if attacker or midfielder else -8))),
        "defending": max(22, min(94, overall + (2 if defender else -12 if midfielder else -28))),
        "physic": max(48, min(94, overall + (2 if defender else -2))),
        "goalkeeping_diving": 8, "goalkeeping_handling": 8, "goalkeeping_kicking": 8,
        "goalkeeping_positioning": 8, "goalkeeping_reflexes": 8,
    }


def rate_player(team, name, club, caps, captain, starters, broad_position):
    elite = ELITE_RATINGS.get(normalize(name))
    if elite:
        return elite
    base = TEAM_RATINGS[team] - 7
    base += min(4, starters)
    base += 2 if captain else 0
    base += 2 if caps >= 60 else 1 if caps >= 30 else -1 if caps < 5 else 0
    if club.lower() in TOP_CLUBS:
        base += 3
    elif any(token in club.lower() for token in ("united", "madrid", "milan", "munich", "juventus", "arsenal", "barcelona", "ajax")):
        base += 2
    if broad_position == "GK" and starters == 0:
        base -= 2
    return max(58, min(89, int(round(base))))


def load_rankings():
    rows = []
    with RANKINGS_CSV.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["date"] == "1998-05-20":
                rows.append(row)
    aliases = {"Korea Republic": "South Korea", "IR Iran": "Iran"}
    ranking = {}
    for index, row in enumerate(rows, 1):
        ranking[aliases.get(row["team"], row["team"])] = (index, int(float(row["total_points"])))
    return ranking


def parse_squad_tables():
    root = lxml.html.fromstring(SQUAD_HTML.read_bytes())
    tables = root.xpath('//table[contains(@class, "wikitable")]')
    squads = {}
    for table in tables:
        heading_node = table.xpath('(preceding::h2|preceding::h3)[last()]')[0]
        heading = heading_node.xpath('string(.//span[contains(@class, "mw-headline")][1])').strip() or heading_node.xpath('string(.)').strip()
        team = canonical_team(re.sub(r"\[.*?\]", "", heading).strip())
        if team not in TEAM_RATINGS or team in squads:
            continue
        frame = pd.read_html(io.StringIO(lxml.etree.tostring(table, encoding="unicode")))[0]
        if team == "South Africa" and len(frame) == 23:
            # Paul Evans withdrew injured before the tournament. Simon Gopane was
            # the replacement in the final 22 and inherited the spare goalkeeper slot.
            frame = frame[~frame["Player"].astype(str).str.contains("Paul Evans", case=False)].copy()
            frame.loc[frame["Player"].astype(str).str.contains("Simon Gopane", case=False), "No."] = 22
        if len(frame) != 22 or "Player" not in frame.columns:
            continue
        squads[team] = frame
    if set(squads) != set(TEAM_RATINGS):
        raise ValueError(f"Squad tables mismatch: missing={sorted(set(TEAM_RATINGS)-set(squads))}; found={sorted(squads)}")
    return squads


def generate_squads():
    frames = parse_squad_tables()
    squad_ids = load_squad_ids()
    player_metadata = load_player_metadata()
    appearance_positions, starter_counts = load_appearance_positions()
    rankings = load_rankings()
    squads = {}
    for team, frame in frames.items():
        players = []
        for _, row in frame.iterrows():
            number = int(row["No."])
            raw_name = str(row["Player"])
            captain = "(captain)" in raw_name.lower()
            name = re.sub(r"\s*\(captain\)\s*", "", raw_name, flags=re.I).strip()
            broad = str(row["Pos."]).strip()
            club = str(row["Club"]).strip()
            caps_match = re.search(r"\d+", str(row["Caps"]))
            caps = int(caps_match.group()) if caps_match else 0
            source = squad_ids[(team, 23 if team == "South Africa" and normalize(name) == "simongopane" else number)]
            metadata = player_metadata.get(source["player_id"], {})
            positions = detailed_positions(broad, appearance_positions[(team, number)])
            overall = rate_player(team, name, club, caps, captain, starter_counts[(team, number)], broad)
            shooting = player_attributes(overall, positions)
            penalty = max(45, min(94, shooting["shooting"] + (5 if captain else 0)))
            players.append({
                "number": number,
                "name": name,
                "displayName": name,
                "position": broad,
                "positions": positions,
                "club": club,
                "dateOfBirth": metadata.get("birth_date") or None,
                "caps": caps,
                "overall": overall,
                "preferredFoot": "right",
                "captain": captain,
                "startingXILikelihood": round(min(0.98, 0.18 + starter_counts[(team, number)] * 0.15), 2),
                "penaltyTaking": penalty,
                "penaltyTakingAbility": penalty,
                "ratingJustification": "Custom simulator rating derived from 1997/98 club level, pre-tournament international experience, squad role and the 20 May 1998 FIFA team ranking; not an official EA rating.",
                "sources": ["wikipedia_1998_squads", "fjelstul_worldcup", "fifa_ranking_1998_05_20"],
                "attributes": shooting,
            })
        penalty_takers = [name for name in PENALTY_TAKER_OVERRIDES.get(team, []) if any(normalize(p["name"]) == normalize(name) for p in players)]
        if len(penalty_takers) < 3:
            penalty_takers.extend(
                player["name"] for player in sorted(
                    (p for p in players if p["position"] != "GK" and p["name"] not in penalty_takers),
                    key=lambda p: (p["penaltyTakingAbility"], p["overall"]), reverse=True,
                )[:3-len(penalty_takers)]
            )
        team_rating = TEAM_RATINGS[team]
        fifa_rank, fifa_points = rankings[team]
        squads[team] = {
            "formation": "4-4-2",
            "startingXI": [],
            "penaltyTakers": penalty_takers,
            "goalkeepers": [p["number"] for p in players if p["position"] == "GK"],
            "fifaRank": fifa_rank,
            "fifaPoints": fifa_points,
            "teamRatings": {
                "overall": team_rating,
                "attack": team_rating,
                "midfield": team_rating,
                "defence": team_rating,
                "goalkeeper": max(p["overall"] for p in players if p["position"] == "GK"),
                "squadDepth": round(sum(sorted((p["overall"] for p in players), reverse=True)[:16]) / 16),
                "experience": min(94, 68 + round(sum(p["caps"] for p in players) / 180)),
                "penalties": round(sum(sorted((p["penaltyTakingAbility"] for p in players if p["position"] != "GK"), reverse=True)[:5]) / 5),
                "discipline": 74,
            },
            "players": players,
        }
    add_starting_xis(squads, APPEARANCES_CSV, 1998)
    SQUADS_OUTPUT.write_text(
        "/* Generated from the cited 1998 squad, appearance and ranking sources. Custom ratings are not official EA ratings. */\n"
        f"const RETRO_1998_SQUADS = Object.freeze({json.dumps(squads, ensure_ascii=False, indent=2)});\n",
        encoding="utf-8",
    )
    return squads


def schedule_record(row):
    return {
        "matchNumber": int(row["match_id"].split("-")[-1]),
        "date": row["match_date"],
        "localTime": row["match_time"],
        "utcOffset": "+02:00",
        "stadium": row["stadium_name"],
        "city": row["city_name"],
    }


def generate_schedule():
    with MATCHES_CSV.open(encoding="utf-8-sig", newline="") as handle:
        matches = [row for row in csv.DictReader(handle) if row["tournament_id"] == "WC-1998"]
    if len(matches) != 64:
        raise ValueError(f"Expected 64 matches, found {len(matches)}")
    group_schedule = {}
    knockout_rows = []
    for row in matches:
        home = canonical_team(row["home_team_name"])
        away = canonical_team(row["away_team_name"])
        if row["stage_name"] == "group stage":
            group_schedule[f"{home}|{away}"] = schedule_record(row)
        else:
            knockout_rows.append(row)
    rows_by_number = {int(row["match_id"].split("-")[-1]): row for row in knockout_rows}
    # Match numbers are mapped to engine slots by bracket path, not chronology.
    # That preserves the real France 98 quarter-final and semi-final structure.
    engine_match_numbers = {
        "ko-r16-m1": 50, "ko-r16-m2": 52, "ko-r16-m3": 54, "ko-r16-m4": 56,
        "ko-r16-m5": 49, "ko-r16-m6": 51, "ko-r16-m7": 53, "ko-r16-m8": 55,
        "ko-r2-m1": 58, "ko-r2-m2": 59, "ko-r2-m3": 57, "ko-r2-m4": 60,
        "ko-r3-m1": 61, "ko-r3-m2": 62,
        "ko-third-place": 63, "ko-final": 64,
    }
    knockout_schedule = {
        match_id: schedule_record(rows_by_number[match_number])
        for match_id, match_number in engine_match_numbers.items()
    }
    SCHEDULE_OUTPUT.write_text(
        "/* Historical France 1998 fixture facts from the cited Fjelstul World Cup dataset. */\n"
        f"const RETRO_1998_GROUP_SCHEDULE = Object.freeze({json.dumps(group_schedule, ensure_ascii=False, indent=2)});\n\n"
        f"const RETRO_1998_KNOCKOUT_SCHEDULE = Object.freeze({json.dumps(knockout_schedule, ensure_ascii=False, indent=2)});\n",
        encoding="utf-8",
    )
    return group_schedule, knockout_schedule


def main():
    squads = generate_squads()
    group_schedule, knockout_schedule = generate_schedule()
    print(f"Generated 1998 data: {len(squads)} teams, {sum(len(v['players']) for v in squads.values())} players, {len(group_schedule)} group fixtures, {len(knockout_schedule)} knockout slots.")


if __name__ == "__main__":
    main()
