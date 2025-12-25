"""
Tag flower store rows with district labels using rule-based matching.

Rules:
1. Direct district keywords in the name, address, or URL (板橋/中和/永和).
2. Road-to-district mapping for common streets in the target area.
3. Manual overrides for edge cases.
4. Coordinate fallback that assigns to the nearest known district centroid.

Outputs:
* ``google-FlowerStore-2025-12-25-tagged.csv`` in the project root.
* ``district-counts.json`` with aggregated counts per district.
"""

from __future__ import annotations

import csv
import json
import math
import re
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, Tuple

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "google-FlowerStore-2025-12-25.csv"
OUTPUT = ROOT / "google-FlowerStore-2025-12-25-tagged.csv"
COUNT_OUTPUT = ROOT / "district-counts.json"


@dataclass(frozen=True)
class Centroid:
    name: str
    lat: float
    lon: float


# Centroids are approximate but stable anchors for nearby districts.
CENTROIDS: Tuple[Centroid, ...] = (
    Centroid("新北市板橋區", 25.0112, 121.4637),
    Centroid("新北市中和區", 24.9990, 121.4870),
    Centroid("新北市永和區", 25.0090, 121.5150),
    Centroid("新北市土城區", 24.9730, 121.4440),
    Centroid("新北市新莊區", 25.0370, 121.4510),
    Centroid("台北市松山區", 25.0520, 121.5560),
    Centroid("台北市中山區", 25.0620, 121.5330),
    Centroid("台北市文山區", 24.9950, 121.5540),
)

# Direct keywords in any text field.
DISTRICT_KEYWORDS: Dict[str, str] = {
    "板橋": "新北市板橋區",
    "中和": "新北市中和區",
    "永和": "新北市永和區",
}

# Road-name hints for common streets around the target districts.
ROAD_TO_DISTRICT: Dict[str, str] = {
    # 板橋
    "新海路": "新北市板橋區",
    "中正路": "新北市板橋區",
    "英士路": "新北市板橋區",
    "民生路二段": "新北市板橋區",
    "民生路一段": "新北市板橋區",
    "民生路": "新北市板橋區",
    "文化路一段": "新北市板橋區",
    "文化路二段": "新北市板橋區",
    "板橋花市": "新北市板橋區",
    "中山路一段": "新北市板橋區",
    "中山路二段": "新北市板橋區",
    "南雅南路": "新北市板橋區",
    "板新路": "新北市板橋區",
    "漢生東路": "新北市板橋區",
    "縣民大道": "新北市板橋區",
    "立德路": "新北市板橋區",
    "民德路": "新北市板橋區",
    "民權路": "新北市板橋區",
    "民族路": "新北市板橋區",
    "倉後街": "新北市板橋區",
    "長安街": "新北市板橋區",
    "校前街": "新北市板橋區",
    "陽明街": "新北市板橋區",
    "海山路": "新北市板橋區",
    "南華路": "新北市板橋區",
    "信義路": "新北市板橋區",
    "南門街": "新北市板橋區",
    "民生街": "新北市板橋區",
    "三民路": "新北市板橋區",
    "四川路一段": "新北市板橋區",
    "四川路二段": "新北市板橋區",
    "藝文街": "新北市板橋區",
    # 中和
    "連城路": "新北市中和區",
    "景新街": "新北市中和區",
    "和平路": "新北市中和區",
    "和平街": "新北市中和區",
    "中和路": "新北市中和區",
    "員山路": "新北市中和區",
    "南山路": "新北市中和區",
    "保健路": "新北市中和區",
    # 永和
    "延和路": "新北市永和區",
    # 土城
    "裕民路": "新北市土城區",
    "金城路": "新北市土城區",
    "忠孝路": "新北市土城區",
    # 其他鄰近行政區
    "瓊林路": "新北市新莊區",
    "敦化北路": "台北市松山區",
    "長安東路": "台北市中山區",
    "萬寧街": "台北市文山區",
}

# Manual fixes when rules and coordinates still need a nudge.
MANUAL_OVERRIDES: Dict[str, str] = {
    "台北愛麗絲花坊網路花店": "台北市松山區",
    "玖桉花藝 南京復興": "台北市中山區",
    "榆果工作室 ( 榆果傢飾 )": "台北市文山區",
    "花見鍾情花坊": "新北市土城區",
    "Millie米莉花藝坊": "新北市土城區",
    "麗的花坊工作室": "新北市板橋區",
}

COORD_RE = re.compile(r"!3d([0-9.+-]+)!4d([0-9.+-]+)")


def great_circle_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Rough distance in kilometers using the haversine formula."""
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def nearest_centroid(lat: float, lon: float) -> str:
    distances = {
        centroid.name: great_circle_distance(lat, lon, centroid.lat, centroid.lon)
        for centroid in CENTROIDS
    }
    return min(distances, key=distances.get)


def extract_coords(url: str) -> Tuple[float | None, float | None]:
    match = COORD_RE.search(url)
    if not match:
        return None, None
    return float(match.group(1)), float(match.group(2))


def infer_district(name: str, address: str, url: str, lat: float | None, lon: float | None) -> str:
    combined = f"{name} {address} {url}"
    for keyword, district in DISTRICT_KEYWORDS.items():
        if keyword in combined:
            return district

    for road, district in ROAD_TO_DISTRICT.items():
        if road in address:
            return district

    if name in MANUAL_OVERRIDES:
        return MANUAL_OVERRIDES[name]

    if lat is not None and lon is not None:
        return nearest_centroid(lat, lon)

    return "待確認"


def normalize_row(row: Dict[str, str]) -> Dict[str, str]:
    lat, lon = extract_coords(row.get("hfpxzc href", ""))
    name = row.get("qBF1Pd", "").strip()
    address = row.get("", "").strip()
    url = row.get("hfpxzc href", "").strip()
    rating = row.get("評分", "").strip()
    rating_count = row.get("評分數", "").strip()
    phone = row.get("UsdlK", "").strip()
    image = row.get("FQ2IWe src", "").strip()

    district = infer_district(name, address, url, lat, lon)

    return {
        "name": name,
        "address": address,
        "url": url,
        "rating": rating,
        "rating_count": rating_count,
        "phone": phone,
        "image": image,
        "district": district,
    }


def write_csv(rows: Iterable[Dict[str, str]]) -> None:
    fieldnames = [
        "name",
        "address",
        "url",
        "rating",
        "rating_count",
        "phone",
        "image",
        "district",
    ]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Missing source CSV: {SOURCE}")

    with SOURCE.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        tagged_rows = [normalize_row(row) for row in reader]

    write_csv(tagged_rows)

    counts = Counter(row["district"] for row in tagged_rows)
    COUNT_OUTPUT.write_text(json.dumps(counts, ensure_ascii=False, indent=2), encoding="utf-8")

    print("District counts:")
    for district, count in counts.most_common():
        print(f"{district}: {count}")


if __name__ == "__main__":
    main()
