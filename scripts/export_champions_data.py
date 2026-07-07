#!/usr/bin/env python3
"""Export compact app dictionaries from the local Champions Logic SQLite DB."""

from __future__ import annotations

import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = Path("/home/nuc1/Documents/Coding Projects/champions_logic/data/champions_logic.db")
OUT = ROOT / "src" / "data" / "regulation-mb"
REGULATION = "M-B"


def normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def spaced_form_alias(name: str) -> str | None:
    if "-" not in name:
        return None
    base, form = name.split("-", 1)
    region_map = {
        "Alola": "Alolan",
        "Galar": "Galarian",
        "Hisui": "Hisuian",
        "Paldea": "Paldean",
    }
    if form in region_map:
        return f"{region_map[form]} {base}"
    return f"{base} {form.replace('-', ' ')}"


def aliases_for(name: str, slug: str) -> list[str]:
    aliases = {name, slug, name.replace("-", " ")}
    compact = normalize_key(name)
    if compact != slug:
        aliases.add(compact)
    form_alias = spaced_form_alias(name)
    if form_alias:
        aliases.add(form_alias)
    return sorted(alias for alias in aliases if alias)


def fetchall(conn: sqlite3.Connection, sql: str, params: tuple = ()) -> list[sqlite3.Row]:
    return list(conn.execute(sql, params))


def write_json(name: str, data: object) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    conn = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row

    ability_rows = fetchall(
        conn,
        "SELECT slug, name FROM ability WHERE regulation = ? ORDER BY name",
        (REGULATION,),
    )
    abilities = [
        {
            "id": row["slug"],
            "displayName": row["name"],
            "aliases": aliases_for(row["name"], row["slug"]),
            "showdownAliases": [row["slug"], row["name"]],
            "legalIn": [REGULATION],
        }
        for row in ability_rows
    ]

    move_rows = fetchall(
        conn,
        """
        SELECT slug, name, type, category, power, accuracy, pp
        FROM move
        WHERE regulation = ?
        ORDER BY name
        """,
        (REGULATION,),
    )
    moves = [
        {
            "id": row["slug"],
            "displayName": row["name"],
            "aliases": aliases_for(row["name"], row["slug"]),
            "showdownAliases": [row["slug"], row["name"]],
            "type": row["type"],
            "category": row["category"].title(),
            "power": row["power"],
            "accuracy": row["accuracy"],
            "pp": row["pp"],
            "legalIn": [REGULATION],
        }
        for row in move_rows
    ]

    mega_rows = fetchall(
        conn,
        """
        SELECT slug, base_slug, name, mega_stone, ability_slug, ability_name
        FROM mega_evolution
        WHERE regulation = ?
        ORDER BY name
        """,
        (REGULATION,),
    )
    mega_by_base: dict[str, list[dict[str, str | None]]] = {}
    mega_by_item: dict[str, list[str]] = {}
    for row in mega_rows:
        mega = {
            "id": row["slug"],
            "baseSpeciesId": row["base_slug"],
            "displayName": row["name"],
            "megaStoneId": row["mega_stone"],
            "abilityId": row["ability_slug"],
            "abilityName": row["ability_name"],
            "pdfName": row["name"],
        }
        mega_by_base.setdefault(row["base_slug"], []).append(mega)
        mega_by_item.setdefault(row["mega_stone"], []).append(row["base_slug"])

    item_rows = fetchall(
        conn,
        "SELECT slug, name FROM item WHERE regulation = ? ORDER BY name",
        (REGULATION,),
    )
    items = [
        {
            "id": row["slug"],
            "displayName": row["name"],
            "aliases": aliases_for(row["name"], row["slug"]),
            "showdownAliases": [row["slug"], row["name"]],
            "legalIn": [REGULATION],
            "itemClauseEligible": True,
            "enablesMegaFor": sorted(set(mega_by_item.get(row["slug"], []))),
        }
        for row in item_rows
    ]

    ability_map: dict[str, list[str]] = {}
    for row in fetchall(
        conn,
        """
        SELECT species_slug, ability_slug
        FROM species_ability
        ORDER BY species_slug, ability_slug
        """,
    ):
        ability_map.setdefault(row["species_slug"], []).append(row["ability_slug"])

    learnset_map: dict[str, list[str]] = {}
    for row in fetchall(
        conn,
        """
        SELECT species_slug, move_slug
        FROM learnset
        ORDER BY species_slug, move_slug
        """,
    ):
        learnset_map.setdefault(row["species_slug"], []).append(row["move_slug"])

    species_rows = fetchall(
        conn,
        """
        SELECT slug, name, national_dex, type1, type2, hp, atk, def, spa, spd, spe
        FROM species
        WHERE regulation = ?
        ORDER BY national_dex, name
        """,
        (REGULATION,),
    )
    species = []
    for row in species_rows:
        sid = row["slug"]
        species.append(
            {
                "id": sid,
                "nationalDexNumber": row["national_dex"],
                "displayName": row["name"],
                "aliases": aliases_for(row["name"], sid),
                "showdownAliases": [sid, row["name"], row["name"].replace("-", "")],
                "pdfName": row["name"],
                "legalIn": [REGULATION],
                "types": [t for t in (row["type1"], row["type2"]) if t],
                "baseStats": {
                    "hp": row["hp"],
                    "atk": row["atk"],
                    "def": row["def"],
                    "spa": row["spa"],
                    "spd": row["spd"],
                    "spe": row["spe"],
                },
                "presentedStats": {
                    "hp": row["hp"] + 75,
                    "atk": row["atk"] + 20,
                    "def": row["def"] + 20,
                    "spa": row["spa"] + 20,
                    "spd": row["spd"] + 20,
                    "spe": row["spe"] + 20,
                },
                "forms": [],
                "abilities": sorted(ability_map.get(sid, [])),
                "moves": sorted(learnset_map.get(sid, [])),
                "allowedMegaForms": mega_by_base.get(sid, []),
            }
        )

    hidden_neutral_alignments = {"Hardy", "Docile", "Bashful", "Quirky"}
    alignments = []
    for row in fetchall(
        conn,
        "SELECT alignment, raises, lowers FROM stat_alignment ORDER BY alignment",
    ):
        alignment = row["alignment"]
        if alignment in hidden_neutral_alignments:
            continue
        aliases = aliases_for(alignment, normalize_key(alignment))
        showdown_aliases = [alignment, f"{alignment} Nature"]
        if alignment == "Serious":
            for old_neutral in sorted(hidden_neutral_alignments):
                aliases.extend([old_neutral, f"{old_neutral} Nature"])
                showdown_aliases.extend([old_neutral, f"{old_neutral} Nature"])
        alignments.append(
            {
                "id": alignment,
                "displayName": alignment,
                "aliases": sorted(set(aliases)),
                "showdownNatureAliases": sorted(set(showdown_aliases)),
                "raises": row["raises"],
                "lowers": row["lowers"],
                "isNeutral": row["raises"] is None and row["lowers"] is None,
            }
        )

    rules = {
        "regulation": REGULATION,
        "dataVersion": "M-B+2026-06-22",
        "enabledGimmicks": ["mega"],
        "statPoints": {"totalMax": 66, "perStatMax": 32},
        "speciesClause": "nationalDexNumber",
        "itemClause": True,
        "teraEnabled": False,
        "source": "Champions Logic MCP / SQLite export",
    }

    alias_records = []
    for kind, records in (
        ("species", species),
        ("ability", abilities),
        ("item", items),
        ("move", moves),
        ("statAlignment", alignments),
    ):
        for record in records:
            for alias in record.get("aliases", []):
                alias_records.append(
                    {"kind": kind, "alias": alias, "normalized": normalize_key(alias), "id": record["id"]}
                )

    write_json("abilities.json", abilities)
    write_json("items.json", items)
    write_json("moves.json", moves)
    write_json("species.json", species)
    write_json("stat-alignments.json", alignments)
    write_json("mega-evolutions.json", [mega for megas in mega_by_base.values() for mega in megas])
    write_json("aliases.json", alias_records)
    write_json("rules.json", rules)

    print(
        f"Exported {len(species)} species, {len(moves)} moves, {len(items)} items, "
        f"{len(abilities)} abilities, {len(alignments)} stat alignments."
    )


if __name__ == "__main__":
    main()
