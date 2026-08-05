import csv
import json
import re
import sys
import unicodedata
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

import pdfplumber
from retro_starting_xi import add_starting_xis


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "tmp" / "pdfs" / "fwc_2014_squadlists.pdf"
FIFA_PATH = ROOT / "tmp" / "players_15.csv"
OUTPUT_PATH = ROOT / "retro-2014-squads.js"
APPEARANCES_PATH = ROOT / "tmp" / "fjelstul" / "player_appearances.csv"

TEAM_NAME_MAP = {
    "Côte d'Ivoire": "Ivory Coast",
    "Korea Republic": "South Korea",
}

NATIONALITY_MAP = {
    "Bosnia and Herzegovina": {"Bosnia Herzegovina", "Bosnia and Herzegovina"},
    "Ivory Coast": {"Côte d'Ivoire", "Ivory Coast"},
    "South Korea": {"Korea Republic", "South Korea"},
    "USA": {"United States", "USA"},
}

NUMERIC_FIELDS = [
    "pace",
    "shooting",
    "passing",
    "dribbling",
    "defending",
    "physic",
    "goalkeeping_diving",
    "goalkeeping_handling",
    "goalkeeping_kicking",
    "goalkeeping_positioning",
    "goalkeeping_reflexes",
]

PLAYER_NAME_OVERRIDES = {
    ("Germany", "mesutoezil"): "Mesut Özil",
    ("Germany", "thomasmueller"): "Thomas Müller",
}

PLAYER_OVERALL_OVERRIDES = {
    ("Brazil", "fred"): 82,
    ("Greece", "georgiossamaras"): 76,
}


def normalize(value):
    decomposed = unicodedata.normalize("NFKD", value or "")
    ascii_value = decomposed.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]", "", ascii_value.lower())


def clean_fifa_text(value):
    if not value:
        return ""
    try:
        return value.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return value


def iso_dob(value):
    day, month, year = value.split(".")
    return f"{year}-{month}-{day}"


def integer(value, fallback=None):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return fallback


def load_fifa_players():
    by_dob = defaultdict(list)
    with FIFA_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            by_dob[row["dob"]].append(row)
    return by_dob


def candidate_score(team_name, display_name, row):
    expected_nationalities = NATIONALITY_MAP.get(team_name, {team_name})
    nationality_match = any(
        normalize(row.get("nationality")) == normalize(nationality)
        for nationality in expected_nationalities
    )
    display_normalized = normalize(display_name)
    names = [
        normalize(clean_fifa_text(row.get("short_name"))),
        normalize(clean_fifa_text(row.get("long_name"))),
    ]
    name_score = max(SequenceMatcher(None, display_normalized, name).ratio() for name in names)
    return name_score + (0.35 if nationality_match else 0)


def match_fifa_player(team_name, display_name, dob, fifa_by_dob):
    candidates = fifa_by_dob.get(dob, [])
    if not candidates:
        return None, 0
    ranked = sorted(
        ((candidate_score(team_name, display_name, row), row) for row in candidates),
        key=lambda item: item[0],
        reverse=True,
    )
    score, row = ranked[0]
    return (row if score >= 0.62 else None), score


def player_record(team_name, row, fifa_by_dob):
    number = integer(row[0])
    display_name = row[1].strip()
    dob = iso_dob(row[5])
    fifa_row, match_score = match_fifa_player(team_name, display_name, dob, fifa_by_dob)
    positions = [
        position.strip()
        for position in (fifa_row.get("player_positions", "") if fifa_row else "").split(",")
        if position.strip()
    ]
    broad_position = row[6].strip()
    if not positions:
        positions = [broad_position]
    attributes = {
        key: integer(fifa_row.get(key))
        for key in NUMERIC_FIELDS
        if fifa_row and integer(fifa_row.get(key)) is not None
    }
    player_name_override = PLAYER_NAME_OVERRIDES.get((team_name, normalize(display_name)))
    player_name = player_name_override or display_name.title()
    overall_override = PLAYER_OVERALL_OVERRIDES.get((team_name, normalize(display_name)))
    return {
        "number": number,
        "name": player_name,
        "displayName": player_name_override or display_name,
        "position": broad_position,
        "positions": positions,
        "club": row[7].strip(),
        "dateOfBirth": dob,
        "height": integer(row[8]),
        "caps": integer(row[9], 0),
        "internationalGoals": integer(row[10], 0),
        "overall": overall_override if overall_override is not None else integer(fifa_row.get("overall"), 68) if fifa_row else 68,
        "preferredFoot": fifa_row.get("preferred_foot", "Right").lower() if fifa_row else "right",
        "attributes": attributes,
        "_ratingMatch": round(match_score, 3),
    }


def main():
    if not PDF_PATH.exists() or not FIFA_PATH.exists() or not APPEARANCES_PATH.exists():
        print("Missing source files. Download the official squad PDF and players_15.csv first.", file=sys.stderr)
        return 1

    fifa_by_dob = load_fifa_players()
    squads = {}
    unmatched = []

    with pdfplumber.open(PDF_PATH) as document:
        for page in document.pages:
            lines = page.extract_text().splitlines()
            source_team_name = lines[2].strip()
            team_name = TEAM_NAME_MAP.get(source_team_name, source_team_name)
            table = page.extract_tables()[0]
            player_rows = [row for row in table[1:] if row[0] and str(row[0]).isdigit()]
            coach_match = re.search(r"Coach:\s+(.+?)\s+\([A-Z]{3}\)", page.extract_text())
            players = [player_record(team_name, row, fifa_by_dob) for row in player_rows]
            for player in players:
                if player["_ratingMatch"] < 0.62:
                    unmatched.append(f"{team_name}: {player['displayName']} ({player['dateOfBirth']})")
                player.pop("_ratingMatch", None)
            squads[team_name] = {
                "coach": coach_match.group(1).title() if coach_match else "",
                "players": players,
            }

    invalid = {team: len(squad["players"]) for team, squad in squads.items() if len(squad["players"]) != 23}
    if len(squads) != 32 or invalid:
        print(f"Invalid squad extraction: teams={len(squads)}, invalid={invalid}", file=sys.stderr)
        return 1
    add_starting_xis(squads, APPEARANCES_PATH, 2014)

    payload = json.dumps(squads, ensure_ascii=False, indent=2)
    OUTPUT_PATH.write_text(
        "/* Generated from the official FIFA 2014 squad list and FIFA 15 ratings data. */\n"
        f"const RETRO_2014_SQUADS = Object.freeze({payload});\n",
        encoding="utf-8",
    )
    print(f"Generated {OUTPUT_PATH.name}: {len(squads)} teams, {sum(len(s['players']) for s in squads.values())} players.")
    print(f"Players without a confident FIFA 15 rating match: {len(unmatched)}")
    for item in unmatched:
        print(f"  - {item}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
