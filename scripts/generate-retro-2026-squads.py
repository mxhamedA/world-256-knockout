"""Build the playable 2026 World Cup squads from FIFA and EA source snapshots.

Inputs are intentionally kept in tmp/ because they are downloaded source material:
  - tmp/pdfs/world-cup-2026-official-squads.pdf
  - tmp/fc26-national-ratings.json

The generated browser dataset is deterministic and checked into the project.
"""

from __future__ import annotations

import json
import math
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "tmp" / "pdfs" / "world-cup-2026-official-squads.pdf"
FC26_PATH = ROOT / "tmp" / "fc26-national-ratings.json"
OUTPUT_PATH = ROOT / "data/retro/2026/squads.js"

APP_TEAM_ALIASES = {
    "Bosnia And Herzegovina": "Bosnia and Herzegovina",
    "Cape Verde": "Cabo Verde",
    "Congo DR": "Congo DR",
    "Côte D'Ivoire": "Côte d'Ivoire",
    "Côte d'Ivoire": "Côte d'Ivoire",
    "Iran": "IR Iran",
    "South Korea": "Korea Republic",
    "Turkey": "Türkiye",
    "USA": "USA",
}

EA_NATION_ALIASES = {
    "Cabo Verde": "Cape Verde Islands",
    "Côte d'Ivoire": "Côte d'Ivoire",
    "Congo DR": "Congo DR",
    "Curaçao": "Curaçao",
    "Czechia": "Czech Republic",
    "IR Iran": "Iran",
    "Korea Republic": "Korea Republic",
    "Netherlands": "Holland",
    "Türkiye": "Turkey",
    "USA": "United States",
}

# Official post-tournament ordering (1-48), published after the 19 July final.
FINAL_STANDINGS = [
    "Spain", "Argentina", "England", "France", "Norway", "Belgium", "Morocco",
    "Switzerland", "Mexico", "Colombia", "Brazil", "USA", "Portugal", "Canada",
    "Egypt", "Paraguay", "Netherlands", "Germany", "Côte d'Ivoire", "Croatia",
    "Japan", "Australia", "Congo DR", "Ghana", "Ecuador", "South Africa",
    "Sweden", "Austria", "Bosnia and Herzegovina", "Algeria", "Senegal",
    "Cabo Verde", "IR Iran", "Korea Republic", "Türkiye", "Scotland", "Uruguay",
    "Saudi Arabia", "Czechia", "New Zealand", "Qatar", "Curaçao", "Panama",
    "Jordan", "Haiti", "Uzbekistan", "Tunisia", "Iraq",
]

TOURNAMENT_POINTS = {
    "Spain": 22, "Argentina": 21, "England": 19, "France": 18, "Norway": 12,
    "Belgium": 11, "Morocco": 11, "Switzerland": 11, "Mexico": 12,
    "Colombia": 11, "Brazil": 10, "USA": 9, "Portugal": 8, "Canada": 7,
    "Egypt": 6, "Paraguay": 5, "Netherlands": 8, "Germany": 7,
    "Côte d'Ivoire": 6, "Croatia": 6, "Japan": 5, "Australia": 5,
    "Congo DR": 4, "Ghana": 4, "Ecuador": 4, "South Africa": 4, "Sweden": 4,
    "Austria": 4, "Bosnia and Herzegovina": 4, "Algeria": 4, "Senegal": 3,
    "Cabo Verde": 3, "IR Iran": 3, "Korea Republic": 3, "Türkiye": 3,
    "Scotland": 3, "Uruguay": 2, "Saudi Arabia": 2, "Czechia": 1,
    "New Zealand": 1, "Qatar": 1, "Curaçao": 1, "Panama": 0, "Jordan": 0,
    "Haiti": 0, "Uzbekistan": 0, "Tunisia": 0, "Iraq": 0,
}

CAPTAIN_HINTS = {
    "Argentina": "Lionel Messi",
    "Australia": "Mathew Ryan",
    "Belgium": "Kevin De Bruyne",
    "Brazil": "Marquinhos",
    "Canada": "Alphonso Davies",
    "Croatia": "Luka Modrić",
    "England": "Harry Kane",
    "France": "Kylian Mbappé",
    "Germany": "Joshua Kimmich",
    "Mexico": "Edson Álvarez",
    "Morocco": "Achraf Hakimi",
    "Netherlands": "Virgil van Dijk",
    "Portugal": "Cristiano Ronaldo",
    "Spain": "Rodri",
    "Switzerland": "Granit Xhaka",
    "USA": "Christian Pulisic",
}

TEAM_ABILITY_BONUSES = {
    "Cabo Verde": 5,
}

TEAM_SQUAD_BONUSES = {
    "Cabo Verde": 3,
}

PLAYER_OVERALL_OVERRIDES = {
    ("Cabo Verde", 1): 79,   # Vozinha
    ("Cabo Verde", 13): 78,  # Sidny Lopes Cabral
    ("England", 3): 83,      # Nico O'Reilly
    ("England", 25): 82,     # Djed Spence
}

PLAYER_DISPLAY_NAME_OVERRIDES = {
    ("Spain", 2): "Marc Pubill",
    ("Spain", 13): "Joan García",
    ("Spain", 22): "Pau Cubarsí",
    ("Spain", 25): "Víctor Muñoz",
}

PLAYER_POSITION_OVERRIDES = {
    ("England", 3): "LB",   # Nico O'Reilly
    ("England", 25): "LB",  # Djed Spence
}

# Tournament roles are deliberately separate from the FC 26 snapshot. The
# snapshot predates several of these call-ups, so a missing EA match must not
# turn into a team-average rating or an automatic starting place.
#
# Spain: RFEF's World Cup final team sheet and FIFA's post-tournament awards.
# France: the recurring XI in FFF/FIFA match reports, with the attacking ratings
# reflecting Mbappe's Golden Boot-level output and the production of Dembele,
# Olise and Barcola throughout the tournament.
TOURNAMENT_TEAM_PROFILES = {
    "England": {
        "formation": "4-3-3",
        # Pickford; O'Reilly, Stones, Guehi, James; Rice, Bellingham,
        # Anderson; Gordon, Kane, Saka.
        "startingXI": [1, 3, 5, 6, 24, 4, 10, 8, 18, 9, 7],
        "players": {
            3: (83, "starter"),
            25: (82, "rotation"),
        },
    },
    "Spain": {
        "formation": "4-2-3-1",
        "startingXI": [23, 24, 22, 14, 12, 16, 8, 15, 10, 19, 21],
        "players": {
            1: (81, "unused"),
            2: (72, "fringe"),
            3: (78, "unused"),
            4: (80, "fringe"),
            5: (82, "rotation"),
            6: (85, "rotation"),
            7: (87, "impact"),
            8: (87, "starter"),
            9: (81, "rotation"),
            10: (87, "starter"),
            11: (78, "rotation"),
            12: (85, "starter"),
            13: (76, "unused"),
            14: (87, "starter"),
            15: (85, "starter"),
            16: (93, "tournament-star"),
            17: (86, "impact"),
            18: (80, "fringe"),
            19: (90, "tournament-star"),
            20: (87, "rotation"),
            21: (86, "starter"),
            22: (89, "tournament-star"),
            23: (90, "tournament-star"),
            24: (88, "tournament-star"),
            25: (68, "unused"),
            26: (78, "fringe"),
        },
    },
    "France": {
        "formation": "4-2-3-1",
        "startingXI": [16, 3, 17, 4, 5, 6, 14, 12, 11, 7, 10],
        "players": {
            1: (81, "rotation"),
            2: (80, "rotation"),
            3: (83, "starter"),
            4: (87, "starter"),
            5: (88, "starter"),
            6: (86, "starter"),
            7: (91, "tournament-star"),
            8: (87, "starter"),
            9: (82, "rotation"),
            10: (95, "tournament-star"),
            11: (89, "tournament-star"),
            12: (87, "starter"),
            13: (80, "fringe"),
            14: (85, "starter"),
            15: (83, "rotation"),
            16: (88, "starter"),
            17: (88, "starter"),
            18: (80, "fringe"),
            19: (84, "rotation"),
            20: (85, "impact"),
            21: (82, "rotation"),
            22: (81, "rotation"),
            23: (72, "unused"),
            24: (83, "impact"),
            25: (79, "fringe"),
            26: (82, "rotation"),
        },
    },
}


def normalize(value: str | None) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    return re.sub(r"[^a-z0-9]", "", value.encode("ascii", "ignore").decode().lower())


def clean_pdf_text(value: str | None) -> str:
    # A few embedded glyphs have no Unicode mapping in the official PDF.
    return (value or "").replace("\x00", "i").strip()


def smart_title(value: str | None) -> str:
    """Turn FIFA's all-caps name fields into normal display case."""
    return re.sub(
        r"[^\s-]+",
        lambda match: match.group(0) if not match.group(0).isupper() else match.group(0).title(),
        value or "",
    )


def display_player_name(official: dict, matched: dict | None) -> str:
    """Use the concise first-name + surname style from the other WC modes."""
    if matched:
        common_name = (matched.get("commonName") or "").strip()
        if common_name:
            return common_name
        first_name = (matched.get("firstName") or "").strip().split()
        last_name = (matched.get("lastName") or "").strip()
        if first_name or last_name:
            return " ".join([*(first_name[:1]), last_name]).strip()
    listed_value = (official.get("listedName") or "").strip()
    listed_name = listed_value.split()
    last_name = smart_title(official.get("lastName") or official.get("shirtName"))
    if listed_value:
        if len(listed_name) == 1 or listed_value.isupper():
            return smart_title(listed_value)
        if normalize(listed_name[0]) == normalize(official.get("lastName")):
            return " ".join([listed_name[-1], last_name]).strip()
        return smart_title(listed_value)
    first_name = (official.get("firstNames") or "").strip().split()[:1]
    return " ".join([*first_name, last_name]).strip()


def app_team_name(pdf_name: str) -> str:
    return APP_TEAM_ALIASES.get(pdf_name, pdf_name)


def parse_fifa_ranks() -> dict[str, int]:
    source = (ROOT / "data.js").read_text(encoding="utf-8")
    block = re.search(
        r"const FIFA_RANKING_SOURCE = `\s*(.*?)\s*`\.trim\(\);",
        source,
        re.DOTALL,
    )
    if not block:
        raise RuntimeError("Could not locate FIFA_RANKING_SOURCE in data.js")
    rankings = {}
    for index, line in enumerate(block.group(1).splitlines(), start=1):
        name = line.split("|", 1)[0]
        rankings[name] = index
    return rankings


def parse_official_squads() -> dict[str, dict]:
    squads: dict[str, dict] = {}
    with pdfplumber.open(PDF_PATH) as pdf:
        if len(pdf.pages) != 48:
            raise RuntimeError(f"Expected 48 FIFA squad pages, found {len(pdf.pages)}")
        for page in pdf.pages:
            lines = (page.extract_text() or "").splitlines()
            header = next((line for line in lines if re.fullmatch(r".+ \([A-Z]{3}\)", line)), None)
            if not header:
                raise RuntimeError("A FIFA squad page is missing its country header")
            pdf_name = re.sub(r"\s+\([A-Z]{3}\)$", "", header)
            team_name = app_team_name(pdf_name)
            tables = page.extract_tables()
            if not tables:
                raise RuntimeError(f"No squad table found for {team_name}")
            table = tables[0]
            header = [clean_pdf_text(cell).upper() for cell in table[0]]

            def column_index(label: str) -> int:
                try:
                    return header.index(label)
                except ValueError as error:
                    raise RuntimeError(f"{team_name} squad table is missing the {label} column") from error

            number_index = column_index("#")
            position_index = column_index("POS")
            listed_name_index = column_index("PLAYER NAME")
            first_names_index = column_index("FIRST NAME(S)")
            last_name_index = column_index("LAST NAME(S)")
            shirt_name_index = column_index("NAME ON SHIRT")
            club_index = column_index("CLUB")
            caps_index = column_index("CAPS")
            goals_index = column_index("GOALS")
            players = []
            for row in table[1:]:
                if not row or not str(row[number_index] or "").isdigit():
                    continue
                number = int(row[number_index])
                position = clean_pdf_text(row[position_index])
                listed_name = clean_pdf_text(row[listed_name_index])
                first_names = clean_pdf_text(row[first_names_index])
                last_name = clean_pdf_text(row[last_name_index])
                shirt_name = clean_pdf_text(row[shirt_name_index])
                club = clean_pdf_text(row[club_index])
                caps = int(row[caps_index] or 0)
                goals = int(row[goals_index] or 0)
                display_name = re.sub(r"\s+", " ", f"{first_names} {last_name}").strip()
                players.append({
                    "number": number,
                    "position": position,
                    "name": display_name,
                    "firstNames": first_names,
                    "lastName": last_name,
                    "listedName": listed_name,
                    "shirtName": shirt_name,
                    "club": club,
                    "caps": caps,
                    "internationalGoals": goals,
                })
            coach_row = next((row for row in table if row and row[0] == "Head coach"), None)
            coach = clean_pdf_text(coach_row[3] if coach_row else "Unknown")
            if len(players) != 26:
                raise RuntimeError(f"Expected 26 official players for {team_name}, found {len(players)}")
            squads[team_name] = {"coach": coach, "players": players}
    return squads


def player_name_candidates(player: dict) -> set[str]:
    listed_parts = player["listedName"].split()
    reversed_listed = " ".join(listed_parts[1:] + listed_parts[:1]) if len(listed_parts) > 1 else ""
    return {
        normalize(player["name"]),
        normalize(player["listedName"]),
        normalize(reversed_listed),
        normalize(player["shirtName"]),
    } - {""}


def ea_name_candidates(player: dict) -> set[str]:
    conventional = f'{player.get("firstName", "")} {player.get("lastName", "")}'.strip()
    return {
        normalize(conventional),
        normalize(player.get("commonName")),
        normalize(f'{player.get("lastName", "")} {player.get("firstName", "")}'),
    } - {""}


def match_fc26_player(official: dict, candidates: list[dict], used_ids: set[int]) -> dict | None:
    official_names = player_name_candidates(official)
    available = [candidate for candidate in candidates if candidate["id"] not in used_ids]
    for candidate in available:
        if official_names & ea_name_candidates(candidate):
            return candidate
    scored = []
    for candidate in available:
        score = max(
            SequenceMatcher(None, left, right).ratio()
            for left in official_names
            for right in ea_name_candidates(candidate)
        )
        scored.append((score, candidate))
    if scored:
        score, candidate = max(scored, key=lambda entry: entry[0])
        if score >= 0.82:
            return candidate
    return None


def stage_rating(place: int, points: int) -> float:
    if place == 1:
        base = 95
    elif place == 2:
        base = 93
    elif place <= 4:
        base = 90
    elif place <= 8:
        base = 87
    elif place <= 16:
        base = 83
    elif place <= 32:
        base = 78
    else:
        base = 72
    return base + max(-1.5, min(1.5, (points - 4) * 0.18))


def average(values: list[float], fallback: float) -> float:
    return sum(values) / len(values) if values else fallback


def clamp_round(value: float, minimum: int = 48, maximum: int = 95) -> int:
    return max(minimum, min(maximum, round(value)))


def preferred_foot(value: int | None) -> str | None:
    return {1: "Right", 2: "Left"}.get(value)


def generate() -> dict[str, dict]:
    official_squads = parse_official_squads()
    fc26_by_nation = json.loads(FC26_PATH.read_text(encoding="utf-8-sig"))
    fifa_ranks = parse_fifa_ranks()
    finish_by_team = {team: index for index, team in enumerate(FINAL_STANDINGS, start=1)}
    generated = {}

    if set(official_squads) != set(FINAL_STANDINGS):
        missing = sorted(set(FINAL_STANDINGS) - set(official_squads))
        extra = sorted(set(official_squads) - set(FINAL_STANDINGS))
        raise RuntimeError(f"Squad/standing mismatch. Missing={missing}; extra={extra}")

    for team_name, squad in official_squads.items():
        ea_nation = EA_NATION_ALIASES.get(team_name, team_name)
        candidates = fc26_by_nation.get(ea_nation, [])
        used_ids: set[int] = set()
        matched_count = 0
        player_rows = []
        place = finish_by_team[team_name]
        points = TOURNAMENT_POINTS[team_name]
        fifa_name = {
            "Cabo Verde": "Cape Verde",
            "Congo DR": "DR Congo",
            "CÃ´te d'Ivoire": "Ivory Coast",
            "IR Iran": "Iran",
            "Korea Republic": "South Korea",
            "TÃ¼rkiye": "TÃ¼rkiye",
        }.get(team_name, team_name)
        fifa_rank = fifa_ranks.get(fifa_name, 100)
        fifa_component = max(68, 94 - (fifa_rank - 1) * 0.38)
        tournament_component = stage_rating(place, points)
        team_context = fifa_component * 0.56 + tournament_component * 0.44
        tournament_profile = TOURNAMENT_TEAM_PROFILES.get(team_name, {})
        tournament_players = tournament_profile.get("players", {})
        for official in squad["players"]:
            matched = match_fc26_player(official, candidates, used_ids)
            if matched:
                used_ids.add(matched["id"])
                matched_count += 1
            experience_bonus = min(3.5, math.log2(max(1, official["caps"] + 1)) * 0.55)
            scoring_bonus = min(2.0, official["internationalGoals"] / 12)
            baseline = team_context - 8 + experience_bonus + scoring_bonus
            if matched:
                context_adjustment = max(-2, min(2, round((team_context - 80) * 0.10)))
                overall = clamp_round(int(matched["overall"]) + context_adjustment, 60, 95)
            else:
                # No FC 26 match is evidence of uncertainty, not permission to
                # inherit an elite team's average. Keep the fallback
                # conservative until tournament evidence supplies an override.
                overall = clamp_round(baseline - 4, 64, 79)
            overall = clamp_round(overall + TEAM_SQUAD_BONUSES.get(team_name, 0), 60, 95)
            overall = PLAYER_OVERALL_OVERRIDES.get((team_name, official["number"]), overall)
            tournament_player = tournament_players.get(official["number"])
            if tournament_player:
                overall = tournament_player[0]
            stats = matched.get("stats", {}) if matched else {}
            position_override = PLAYER_POSITION_OVERRIDES.get((team_name, official["number"]))
            detailed_position = position_override or (matched.get("position") if matched else official["position"])
            detailed_positions = list(dict.fromkeys([
                detailed_position,
                *([position for position in matched.get("alternatePositions", []) if position] if matched else []),
                official["position"],
            ]))
            player = {
                "number": official["number"],
                "name": PLAYER_DISPLAY_NAME_OVERRIDES.get(
                    (team_name, official["number"]),
                    display_player_name(official, matched),
                ),
                "position": detailed_position,
                "positions": detailed_positions,
                "squadGroup": official["position"],
                "club": matched.get("team") if matched else official["club"],
                "overall": overall,
                "attributes": {
                    "pace": stats.get("pace", overall),
                    "shooting": stats.get("shooting", overall),
                    "passing": stats.get("passing", overall),
                    "dribbling": stats.get("dribbling", overall),
                    "defending": stats.get("defending", overall),
                    "physic": stats.get("physical", overall),
                    "goalkeeping_diving": stats.get("gkDiving", 5),
                    "goalkeeping_handling": stats.get("gkHandling", 5),
                    "goalkeeping_kicking": stats.get("gkKicking", 5),
                    "goalkeeping_positioning": stats.get("gkPositioning", 5),
                    "goalkeeping_reflexes": stats.get("gkReflexes", 5),
                },
                "internationalCaps": official["caps"],
                "internationalGoals": official["internationalGoals"],
                "preferredFoot": preferred_foot(matched.get("preferredFoot")) if matched else None,
                "fc26Overall": int(matched["overall"]) if matched else None,
                "tournamentRole": tournament_player[1] if tournament_player else None,
                "captain": normalize(official["name"]) == normalize(CAPTAIN_HINTS.get(team_name)),
            }
            player_rows.append(player)

        formation = tournament_profile.get("formation", "4-3-3")
        by_position = {
            position: sorted(
                [player for player in player_rows if player["squadGroup"] == position],
                key=lambda player: (-player["overall"], player["number"]),
            )
            for position in ("GK", "DF", "MF", "FW")
        }
        preferred_starter_numbers = tournament_profile.get("startingXI")
        if preferred_starter_numbers:
            player_by_number = {player["number"]: player for player in player_rows}
            starters = [player_by_number[number] for number in preferred_starter_numbers]
        else:
            starters = (
                by_position["GK"][:1]
                + by_position["DF"][:4]
                + by_position["MF"][:3]
                + by_position["FW"][:3]
            )
        if len(starters) < 11:
            starter_numbers = {player["number"] for player in starters}
            starters += sorted(
                [player for player in player_rows if player["number"] not in starter_numbers],
                key=lambda player: -player["overall"],
            )[: 11 - len(starters)]

        place = finish_by_team[team_name]
        points = TOURNAMENT_POINTS[team_name]
        fifa_name = {
            "Cabo Verde": "Cape Verde",
            "Congo DR": "DR Congo",
            "Côte d'Ivoire": "Ivory Coast",
            "IR Iran": "Iran",
            "Korea Republic": "South Korea",
            "Türkiye": "Türkiye",
        }.get(team_name, team_name)
        fifa_rank = fifa_ranks.get(fifa_name, 100)
        fifa_component = max(68, 94 - (fifa_rank - 1) * 0.38)
        fc_component = average([player["overall"] for player in starters], 72)
        tournament_component = stage_rating(place, points)
        ability_bonus = TEAM_ABILITY_BONUSES.get(team_name, 0)
        overall = clamp_round(
            fc_component * 0.40 + fifa_component * 0.32 + tournament_component * 0.28 + ability_bonus,
            68,
            93,
        )
        tournament_delta = (tournament_component - 78) * 0.22

        def line_rating(position: str, count: int, fallback: float = fc_component) -> float:
            return average([player["overall"] for player in by_position[position][:count]], fallback)

        attack_fc = line_rating("FW", 4)
        midfield_fc = line_rating("MF", 4)
        defence_fc = line_rating("DF", 5)
        goalkeeper_fc = line_rating("GK", 2)
        top_sixteen = sorted((player["overall"] for player in player_rows), reverse=True)[:16]
        squad_depth_fc = average(top_sixteen, fc_component)
        blend_line = lambda fc_value: clamp_round(
            fc_value * 0.56 + overall * 0.34 + tournament_delta * 0.45 + 8,
            64,
            96,
        )
        team_ratings = {
            "overall": overall,
            "attack": blend_line(attack_fc),
            "midfield": blend_line(midfield_fc),
            "defence": blend_line(defence_fc),
            "goalkeeper": blend_line(goalkeeper_fc),
            "squadDepth": blend_line(squad_depth_fc),
            "experience": clamp_round(overall + min(3, average([p["internationalCaps"] for p in starters], 20) / 35), 64, 96),
            "penalties": clamp_round(overall + (1 if place <= 8 else 0), 64, 96),
            "discipline": 78,
        }
        captain = next((player["name"] for player in player_rows if player["captain"]), None)
        if not captain:
            captain = max(player_rows, key=lambda player: player["internationalCaps"])["name"]
            next(player for player in player_rows if player["name"] == captain)["captain"] = True
        penalty_takers = [
            player["name"]
            for player in sorted(
                player_rows,
                key=lambda player: (
                    -int(player["attributes"].get("shooting") or 0),
                    -player["internationalGoals"],
                ),
            )[:3]
        ]
        generated[team_name] = {
            "coach": squad["coach"],
            "captain": captain,
            "formation": formation,
            "startingXI": [player["number"] for player in starters],
            "penaltyTakers": penalty_takers,
            "players": player_rows,
            "teamRatings": team_ratings,
            "ratingBlend": {
                "fc26Squad": round(fc_component, 2),
                "fifaRank": fifa_rank,
                "tournamentFinish": place,
                "tournamentPoints": points,
                "fc26MatchedPlayers": matched_count,
                "formula": "40% FC 26 squad, 32% FIFA ranking, 28% 2026 tournament performance",
            },
        }
    return generated


if __name__ == "__main__":
    data = generate()
    content = (
        "/* Generated from FIFA's official 2026 World Cup squad list and EA SPORTS FC 26 ratings.\n"
        " * Team ratings blend: 40% FC 26 squad, 32% FIFA ranking, 28% tournament performance.\n"
        " */\n"
        f"const RETRO_2026_SQUADS = Object.freeze({json.dumps(data, ensure_ascii=False, indent=2)});\n"
    )
    OUTPUT_PATH.write_text(content, encoding="utf-8")
    match_count = sum(squad["ratingBlend"]["fc26MatchedPlayers"] for squad in data.values())
    print(f"Wrote {OUTPUT_PATH.name}: {len(data)} squads, {match_count}/1248 FC 26 matches")
    for team, squad in sorted(data.items(), key=lambda item: item[1]["ratingBlend"]["tournamentFinish"]):
        blend = squad["ratingBlend"]
        print(
            f'{blend["tournamentFinish"]:>2}. {team:<24} '
            f'OVR {squad["teamRatings"]["overall"]} '
            f'FC {blend["fc26Squad"]:.1f} FIFA #{blend["fifaRank"]} '
            f'matched {blend["fc26MatchedPlayers"]:>2}/26'
        )
