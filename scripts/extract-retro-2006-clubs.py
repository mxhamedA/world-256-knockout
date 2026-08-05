"""Extract each Germany 2006 player's tournament-time club from FIFA's squad list."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pdfplumber


TEAM_NAMES = {
    "Côte d'Ivoire": "Ivory Coast",
    "Korea Republic": "South Korea",
}


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "tmp" / "pdfs" / "FWC_2006_SquadLists.pdf"
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else root / "data/retro/2006/clubs.generated.json"
    clubs: dict[str, dict[str, str]] = {}

    with pdfplumber.open(source) as document:
        for page_number, page in enumerate(document.pages[1:], start=2):
            lines = [line.strip() for line in (page.extract_text(layout=True) or "").splitlines() if line.strip()]
            if len(lines) < 3:
                raise RuntimeError(f"Page {page_number} has no team heading.")
            team = TEAM_NAMES.get(lines[2], lines[2])
            tables = page.extract_tables()
            if len(tables) != 1:
                raise RuntimeError(f"{team} on page {page_number} has {len(tables)} tables.")
            header, *rows = tables[0]
            if header[:2] != ["#", "FIFA Display Name"]:
                raise RuntimeError(f"{team} has an unexpected table header.")
            players = {
                str(int(row[0])): row[7].replace("\n", " ").strip()
                for row in rows
                if row and row[0] and row[0].isdigit()
            }
            if len(players) != 23:
                raise RuntimeError(f"{team} has {len(players)} extracted clubs instead of 23.")
            clubs[team] = players

    if len(clubs) != 32 or sum(map(len, clubs.values())) != 736:
        raise RuntimeError("The official squad list must produce 32 teams and 736 players.")
    output.write_text(json.dumps(clubs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Extracted {sum(map(len, clubs.values()))} official player clubs to {output}.")


if __name__ == "__main__":
    main()
