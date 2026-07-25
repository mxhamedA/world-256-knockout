import csv
import re
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path


TEAM_ALIASES = {
    "ivorycoast": "Ivory Coast",
    "cotedivoire": "Ivory Coast",
    "korearepublic": "South Korea",
    "southkorea": "South Korea",
    "unitedstates": "USA",
    "usa": "USA",
}


def normalize(value):
    decomposed = unicodedata.normalize("NFKD", value or "")
    ascii_value = decomposed.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]", "", ascii_value.lower())


def canonical_team_name(value):
    return TEAM_ALIASES.get(normalize(value), value)


def formation_label(position_codes):
    defensive_positions = {"DF", "RB", "CB", "LB", "RWB", "LWB", "SW"}
    midfield_positions = {"MF", "DM", "CDM", "CM", "AM", "CAM", "RM", "LM"}
    forward_positions = {"FW", "RW", "LW", "RF", "LF", "CF", "SS", "ST"}
    counts = Counter(
        "DF" if position in defensive_positions
        else "MF" if position in midfield_positions
        else "FW" if position in forward_positions
        else position
        for position in position_codes
    )
    defenders = counts["DF"]
    midfielders = counts["MF"]
    forwards = counts["FW"]
    common = {
        (4, 5, 1): "4-2-3-1",
        (4, 2, 4): "4-2-3-1",
        (4, 1, 5): "4-1-4-1",
        (4, 4, 2): "4-4-2",
        (4, 3, 3): "4-3-3",
        (3, 5, 2): "3-5-2",
        (5, 3, 2): "5-3-2",
        (5, 4, 1): "5-4-1",
        (3, 4, 3): "3-4-3",
    }
    return common.get((defenders, midfielders, forwards), f"{defenders}-{midfielders}-{forwards}")


def load_opening_starting_xis(csv_path: Path, year: int):
    appearances = defaultdict(list)
    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if row["tournament_id"] != f"WC-{year}" or row["starter"] != "1":
                continue
            appearances[canonical_team_name(row["team_name"])].append(row)

    lineups = {}
    for team_name, rows in appearances.items():
        first_match = min(rows, key=lambda row: (row["match_date"], row["match_id"]))["match_id"]
        starters = [row for row in rows if row["match_id"] == first_match]
        numbers = [int(row["shirt_number"]) for row in starters]
        if len(numbers) != 11 or len(set(numbers)) != 11:
            raise ValueError(f"{year} {team_name}: expected 11 unique opening-match starters, found {numbers}")
        lineups[team_name] = {
            "startingXI": numbers,
            "formation": formation_label([row["position_code"] for row in starters]),
        }
    return lineups


def add_starting_xis(squads, csv_path: Path, year: int):
    lineups = load_opening_starting_xis(csv_path, year)
    missing = sorted(set(squads) - set(lineups))
    extra = sorted(set(lineups) - set(squads))
    if missing or extra:
        raise ValueError(f"{year} starting-XI team mismatch: missing={missing}, extra={extra}")

    for team_name, squad in squads.items():
        squad_numbers = {player["number"] for player in squad["players"]}
        lineup = lineups[team_name]
        invalid_numbers = sorted(set(lineup["startingXI"]) - squad_numbers)
        if invalid_numbers:
            raise ValueError(f"{year} {team_name}: starting-XI numbers absent from squad: {invalid_numbers}")
        squad.update(lineup)
    return squads
