"""Clean the raw FlowerStore CSV export.

This script renames opaque column headers to semantic names and normalizes
select fields to numeric-friendly strings.
"""
from __future__ import annotations

import csv
from pathlib import Path

RAW_PATH = Path("google-FlowerStore-2025-12-25.csv")
OUTPUT_PATH = Path("data/flowerstores.cleaned.csv")

COLUMN_MAP = {
    "hfpxzc href": "url",
    "qBF1Pd": "name",
    "評分": "rating",
    "評分數": "review_count",
    "": "address",
    "UsdlK": "phone",
    "FQ2IWe src": "image_url",
}


def normalize_rating(value: str) -> str:
    value = value.strip()
    if not value:
        return ""
    try:
        normalized = format(float(value), "g")
    except ValueError:
        return ""
    return normalized


def normalize_review_count(value: str) -> str:
    value = value.strip()
    if not value:
        return ""
    try:
        count = int(value)
    except ValueError:
        return ""
    return str(count)


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with RAW_PATH.open(newline="", encoding="utf-8") as infile:
        reader = csv.DictReader(infile)
        records = []
        for row in reader:
            cleaned = {}
            for raw, new in COLUMN_MAP.items():
                value = row.get(raw, "")
                if new == "rating":
                    cleaned[new] = normalize_rating(value)
                elif new == "review_count":
                    cleaned[new] = normalize_review_count(value)
                else:
                    cleaned[new] = value.strip()
            records.append(cleaned)

    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as outfile:
        writer = csv.DictWriter(outfile, fieldnames=list(COLUMN_MAP.values()))
        writer.writeheader()
        writer.writerows(records)


if __name__ == "__main__":
    main()
