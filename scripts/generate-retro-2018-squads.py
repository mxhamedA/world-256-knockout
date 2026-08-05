import csv
import json
import re
import sys
import unicodedata
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path
from retro_starting_xi import add_starting_xis


ROOT = Path(__file__).resolve().parents[1]
WIKI_PATH = ROOT / "tmp" / "2018" / "squads-wiki.json"
FIFA_PATH = ROOT / "tmp" / "2018" / "players_19.csv"
OUTPUT_PATH = ROOT / "data/retro/2018/squads.js"
APPEARANCES_PATH = ROOT / "tmp" / "fjelstul" / "player_appearances.csv"

TEAM_NAME_MAP = {
    "Iran": "Iran",
    "South Korea": "South Korea",
}

FIFA_NAME_OVERRIDES = {
    ("Mexico", "chicharito"): "Javier Hernandez",
    ("Egypt", "kahraba"): "Mahmoud Kahraba",
}

RATING_BOOSTS = {
    "Luka Modric": 2,
    "Kylian Mbappe": 2,
    "Thibaut Courtois": 1,
    "Eden Hazard": 1,
    "Antoine Griezmann": 1,
    "Harry Kane": 1,
    "Raphael Varane": 1,
    "N'Golo Kante": 1,
    "Paul Pogba": 1,
    "Ivan Perisic": 1,
    "Kieran Trippier": 1,
    "Jordan Pickford": 1,
    "Denis Cheryshev": 2,
    "Aleksandr Golovin": 1,
    "Yerry Mina": 2,
}

ATTRIBUTE_FIELDS = {
    "pace": "pace",
    "shooting": "shooting",
    "passing": "passing",
    "dribbling": "dribbling",
    "defending": "defending",
    "physic": "physic",
    "goalkeeping_diving": "goalkeeping_diving",
    "goalkeeping_handling": "goalkeeping_handling",
    "goalkeeping_kicking": "goalkeeping_kicking",
    "goalkeeping_positioning": "goalkeeping_positioning",
    "goalkeeping_reflexes": "goalkeeping_reflexes",
}

NATIONALITY_MAP = {
    "South Korea": {"Korea Republic", "South Korea"},
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


def clean_wiki(value):
    value = re.sub(r"<ref[^>]*>.*?</ref>", "", value, flags=re.S)
    value = re.sub(r"<ref[^>]*/>", "", value)
    value = re.sub(r"\{\{[^{}]*\}\}", "", value)
    value = re.sub(
        r"\[\[(?:[^\]|]+\|)?([^\]]+)\]\]",
        lambda match: match.group(1),
        value,
    )
    return re.sub(r"\s+", " ", value).strip()


def load_fifa_players():
    by_dob = defaultdict(list)
    with FIFA_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            row = {key: clean_fifa_text(value) for key, value in row.items()}
            by_dob[row["dob"]].append(row)
    return by_dob


def fifa_match(team_name, display_name, club, dob, rows_by_dob):
    target = normalize(display_name)
    target_club = normalize(club)
    candidates = rows_by_dob.get(dob, [])
    if not candidates:
        return None, 0
    expected_nationalities = NATIONALITY_MAP.get(team_name, {team_name})
    ranked = sorted([
        (
            max(
                SequenceMatcher(None, target, normalize(row.get("short_name"))).ratio(),
                SequenceMatcher(None, target, normalize(row.get("long_name"))).ratio(),
            )
            + SequenceMatcher(None, target_club, normalize(row.get("club_name"))).ratio() * 0.08
            + (
                0.35
                if any(normalize(row.get("nationality_name")) == normalize(name) for name in expected_nationalities)
                else 0
            ),
            row,
        )
        for row in candidates
    ], key=lambda item: item[0])
    score, row = ranked[-1]
    # Exact birth date plus matching nationality is strong enough to tolerate
    # transliteration differences in the historical squad and rating datasets.
    nationality_matches = any(
        normalize(row.get("nationality_name")) == normalize(name)
        for name in expected_nationalities
    )
    threshold = 0.55 if nationality_matches else 0.68
    return (row if score >= threshold else None), score


def integer(value, fallback=0):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return fallback


def field(line, key, next_key):
    match = re.search(rf"\|{re.escape(key)}=(.*?)\|{re.escape(next_key)}=", line)
    return match.group(1).strip() if match else ""


def player_from_line(team_name, line, fifa_rows, team_rating):
    number = integer(field(line, "no", "pos"))
    position = field(line, "pos", "name")
    raw_name = field(line, "name", "sortname")
    display_name = clean_wiki(raw_name)
    display_name = FIFA_NAME_OVERRIDES.get((team_name, normalize(display_name)), display_name)
    age_value = field(line, "age", "caps")
    dates = re.findall(r"\|(\d{4})\|(\d{1,2})\|(\d{1,2})", age_value)
    birth_year, birth_month, birth_day = dates[-1] if dates else ("1990", "1", "1")
    caps = integer(field(line, "caps", "goals"))
    goals = integer(field(line, "goals", "club"))
    club = clean_wiki(field(line, "club", "clubnat"))
    dob = f"{birth_year}-{int(birth_month):02d}-{int(birth_day):02d}"
    fifa_row, match_score = fifa_match(team_name, display_name, club, dob, fifa_rows)
    if fifa_row:
        positions = [
            role.strip()
            for role in fifa_row["player_positions"].split(",")
            if role.strip()
        ] or [position]
        base_rating = integer(fifa_row["overall"], team_rating - 8)
        attributes = {
            output_key: integer(fifa_row[source_key])
            for source_key, output_key in ATTRIBUTE_FIELDS.items()
            if integer(fifa_row[source_key]) > 0
        }
    else:
        positions = [position]
        base_rating = round(team_rating - 12 + min(8, caps / 15) + min(3, goals / 8))
        attributes = {}
    overall = min(94, max(58, base_rating + RATING_BOOSTS.get(display_name, 0)))
    return {
        "number": number,
        "name": display_name,
        "displayName": display_name,
        "position": position,
        "positions": positions,
        "club": club,
        "dateOfBirth": dob,
        "caps": caps,
        "internationalGoals": goals,
        "overall": overall,
        "preferredFoot": fifa_row.get("preferred_foot", "Right").lower() if fifa_row else "right",
        "attributes": attributes,
        "_ratingMatch": round(match_score, 3),
    }


def extract_team_sections(wikitext):
    matches = list(re.finditer(r"(?m)^===([^=]+)===$", wikitext))
    sections = {}
    for index, match in enumerate(matches):
        team_name = match.group(1).strip()
        if team_name == "Age":
            break
        end = matches[index + 1].start() if index + 1 < len(matches) else len(wikitext)
        sections[TEAM_NAME_MAP.get(team_name, team_name)] = wikitext[match.end():end]
    return sections


def main():
    if not WIKI_PATH.exists() or not FIFA_PATH.exists() or not APPEARANCES_PATH.exists():
        print("Missing 2018 squad or FIFA ratings source data.", file=sys.stderr)
        return 1

    retro_source = (ROOT / "retro-data.js").read_text(encoding="utf-8")
    ratings = {
        name: int(rating)
        for name, rating in re.findall(
            r'\{ name: "([^"]+)", group: "[A-H]", rating: (\d+) \}',
            retro_source.split("2018: Object.freeze", 1)[1].split("2022: Object.freeze", 1)[0],
        )
    }
    payload = json.loads(WIKI_PATH.read_text(encoding="utf-8-sig"))
    wikitext = payload["parse"]["wikitext"]
    sections = extract_team_sections(wikitext)
    fifa_rows = load_fifa_players()
    squads = {}
    unmatched = []

    for team_name, section in sections.items():
        if team_name not in ratings:
            continue
        coach_line = re.search(r"Coach:\s*(.+)", section)
        coach = clean_wiki(coach_line.group(1).splitlines()[0]) if coach_line else ""
        player_lines = [
            line for line in section.splitlines()
            if line.startswith("{{nat fs g player|")
        ]
        players = [
            player_from_line(team_name, line, fifa_rows, ratings[team_name])
            for line in player_lines
        ]
        for player in players:
            if player.pop("_ratingMatch") < 0.55:
                unmatched.append(f"{team_name}: {player['name']}")
        squads[team_name] = {"coach": coach, "players": players}

    invalid = {
        team: len(squad["players"])
        for team, squad in squads.items()
        if len(squad["players"]) != 23
    }
    if len(squads) != 32 or invalid:
        print(f"Invalid squad extraction: teams={len(squads)}, invalid={invalid}", file=sys.stderr)
        return 1
    add_starting_xis(squads, APPEARANCES_PATH, 2018)

    OUTPUT_PATH.write_text(
        "/* Generated from the official 2018 final squad lists and period FIFA ratings data. */\n"
        f"const RETRO_2018_SQUADS = Object.freeze({json.dumps(squads, ensure_ascii=False, indent=2)});\n",
        encoding="utf-8",
    )
    print(
        f"Generated {OUTPUT_PATH.name}: {len(squads)} teams, "
        f"{sum(len(squad['players']) for squad in squads.values())} players."
    )
    print(f"Players using form/caps fallback ratings: {len(unmatched)}")
    if unmatched:
        print("  " + ", ".join(normalize(item) for item in unmatched[:20]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
