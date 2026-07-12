"""Build VReply's compact offline dictionary from the ECDICT CSV export."""

from __future__ import annotations

import argparse
import csv
import re
import sqlite3
from pathlib import Path


WORD_RE = re.compile(r"^[A-Za-z][A-Za-z0-9' .-]{0,79}$")


def number(value: str | None) -> int:
    try:
        return int(value or 0)
    except ValueError:
        return 0


def keep(row: dict[str, str]) -> bool:
    translation = (row.get("translation") or "").strip()
    word = (row.get("word") or "").strip()
    if not translation:
        return False
    common_entry = bool(
        (row.get("tag") or "").strip()
        or number(row.get("collins"))
        or number(row.get("oxford"))
        or number(row.get("bnc"))
        or number(row.get("frq"))
    )
    short_general_phrase = (
        " " in word
        and len(word.split()) <= 4
        and len(word) <= 50
        and not translation.splitlines()[0].startswith("[")
    )
    return common_entry or short_general_phrase


def rank(row: dict[str, str]) -> int:
    frequencies = [value for value in (number(row.get("bnc")), number(row.get("frq"))) if value > 0]
    return min(frequencies) if frequencies else 1_000_000


def exchange_aliases(value: str) -> set[str]:
    aliases: set[str] = set()
    for item in value.split("/"):
        _, separator, forms = item.partition(":")
        if not separator:
            continue
        for form in forms.split(","):
            normalized = form.strip().casefold()
            if WORD_RE.fullmatch(normalized):
                aliases.add(normalized)
    return aliases


def build(source: Path, output: Path) -> tuple[int, int]:
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(output.suffix + ".tmp")
    temporary.unlink(missing_ok=True)

    connection = sqlite3.connect(temporary)
    connection.executescript(
        """
        PRAGMA journal_mode = OFF;
        PRAGMA synchronous = OFF;
        CREATE TABLE entries (
            word TEXT PRIMARY KEY COLLATE NOCASE,
            phonetic TEXT NOT NULL,
            translation TEXT NOT NULL,
            definition TEXT NOT NULL,
            pos TEXT NOT NULL,
            exchange TEXT NOT NULL,
            frequency_rank INTEGER NOT NULL
        ) WITHOUT ROWID;
        CREATE TABLE aliases (
            alias TEXT PRIMARY KEY COLLATE NOCASE,
            word TEXT NOT NULL
        ) WITHOUT ROWID;
        CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID;
        """
    )

    entries = 0
    aliases: dict[str, str] = {}
    with source.open("r", encoding="utf-8-sig", newline="") as source_file:
        for row in csv.DictReader(source_file):
            if not keep(row):
                continue
            word = (row.get("word") or "").strip()
            normalized = word.casefold()
            if not WORD_RE.fullmatch(word):
                continue
            exchange = (row.get("exchange") or "").strip()
            connection.execute(
                """
                INSERT OR REPLACE INTO entries
                    (word, phonetic, translation, definition, pos, exchange, frequency_rank)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    normalized,
                    (row.get("phonetic") or "").strip()[:300],
                    (row.get("translation") or "").strip()[:5000],
                    (row.get("definition") or "").strip()[:5000],
                    (row.get("pos") or "").strip()[:300],
                    exchange[:1000],
                    rank(row),
                ),
            )
            entries += 1
            for alias in exchange_aliases(exchange):
                if alias != normalized:
                    aliases.setdefault(alias, normalized)

    connection.executemany(
        "INSERT OR IGNORE INTO aliases (alias, word) VALUES (?, ?)",
        ((alias, word) for alias, word in aliases.items()),
    )
    connection.executemany(
        "INSERT INTO metadata (key, value) VALUES (?, ?)",
        [
            ("name", "ECDICT"),
            ("source", "https://github.com/skywind3000/ECDICT"),
            ("license", "MIT"),
            ("selection", "Common corpus entries plus short general-language phrases"),
        ],
    )
    connection.commit()
    connection.execute("VACUUM")
    connection.close()
    temporary.replace(output)
    return entries, len(aliases)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Path to ECDICT ecdict.csv")
    parser.add_argument("--output", type=Path, default=Path("data/ecdict.sqlite3"))
    args = parser.parse_args()
    entries, aliases = build(args.source, args.output)
    print(f"Built {args.output} with {entries:,} entries and {aliases:,} aliases.")


if __name__ == "__main__":
    main()
