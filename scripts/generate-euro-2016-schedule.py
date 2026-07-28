from __future__ import annotations

import csv
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "tmp/euro2016/euro-history/matches/matches/euro/2016.csv"
OUTPUT = ROOT / "retro-euro-2016-schedule.js"

TEAM_ALIASES = {
    "Czechia": "Czech Republic",
    "Türkiye": "Turkey",
}

R16_PATH_ORDER = [
    frozenset(("Switzerland", "Poland")),
    frozenset(("Croatia", "Portugal")),
    frozenset(("Wales", "Northern Ireland")),
    frozenset(("Hungary", "Belgium")),
    frozenset(("Germany", "Slovakia")),
    frozenset(("Italy", "Spain")),
    frozenset(("France", "Republic of Ireland")),
    frozenset(("England", "Iceland")),
]


def normalize_team(name: str) -> str:
    return TEAM_ALIASES.get(name, name)


def schedule_entry(row: dict[str, str], match_number: int) -> dict[str, object]:
    kickoff_utc = datetime.fromisoformat(row["date_time"].replace("Z", "+00:00"))
    offset = int(float(row["utc_offset_hours"]))
    local = kickoff_utc.astimezone(timezone(timedelta(hours=offset)))
    return {
        "matchNumber": match_number,
        "date": local.date().isoformat(),
        "localTime": local.strftime("%H:%M"),
        "utcOffset": f"{offset:+03d}:00",
        "stadium": row["stadium_name"],
        "city": row["stadium_city"],
    }


with SOURCE.open(encoding="utf-8", newline="") as handle:
    rows = list(csv.DictReader(handle))

chronological = sorted(rows, key=lambda row: row["date_time"])
match_number = {
    row["id_match"]: index + 1 for index, row in enumerate(chronological)
}

group_schedule: dict[str, dict[str, object]] = {}
for row in chronological:
    if row["round"] != "GROUP_STANDINGS":
        continue
    home = normalize_team(row["home_team"])
    away = normalize_team(row["away_team"])
    group_schedule[f"{home}|{away}"] = schedule_entry(
        row, match_number[row["id_match"]]
    )

by_round: dict[str, list[dict[str, str]]] = {}
for row in chronological:
    by_round.setdefault(row["round"], []).append(row)

r16_rows = {
    frozenset(
        (normalize_team(row["home_team"]), normalize_team(row["away_team"]))
    ): row
    for row in by_round["ROUND_OF_16"]
}

knockout_schedule: dict[str, dict[str, object]] = {}
for index, pairing in enumerate(R16_PATH_ORDER, start=1):
    row = r16_rows[pairing]
    knockout_schedule[f"ko-r16-m{index}"] = schedule_entry(
        row, match_number[row["id_match"]]
    )

for index, row in enumerate(by_round["QUARTER_FINALS"], start=1):
    knockout_schedule[f"ko-r2-m{index}"] = schedule_entry(
        row, match_number[row["id_match"]]
    )

for index, row in enumerate(by_round["SEMIFINAL"], start=1):
    knockout_schedule[f"ko-r3-m{index}"] = schedule_entry(
        row, match_number[row["id_match"]]
    )

final = by_round["FINAL"][0]
knockout_schedule["ko-final"] = schedule_entry(
    final, match_number[final["id_match"]]
)

content = "\n".join(
    (
        "/* Generated from the historical UEFA Euro 2016 match archive. */",
        "const RETRO_EURO_2016_GROUP_SCHEDULE = Object.freeze("
        + json.dumps(group_schedule, ensure_ascii=False, indent=2)
        + ");",
        "",
        "const RETRO_EURO_2016_KNOCKOUT_SCHEDULE = Object.freeze("
        + json.dumps(knockout_schedule, ensure_ascii=False, indent=2)
        + ");",
        "",
    )
)
OUTPUT.write_text(content, encoding="utf-8")
print(
    f"Wrote {len(group_schedule)} group and "
    f"{len(knockout_schedule)} knockout slots to {OUTPUT}"
)
