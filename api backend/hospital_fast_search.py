"""
Fast nearest-hospital selection using only the government hospital dataset.

This is a local test version designed to run quickly on a small dataset.
For production, use PostgreSQL + PostGIS spatial indexing.
"""

import json
import math
from typing import List, Dict

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return straight-line distance in kilometers."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c


class HospitalIndex:
    """Simple in-memory index for testing."""

    def __init__(self, hospitals: List[Dict]):
        self.hospitals = hospitals

    def search_nearest(self, user_lat: float, user_lon: float, limit: int = 50) -> List[Dict]:
        """Return the nearest hospitals by straight-line distance."""
        results = []

        for hospital in self.hospitals:
            dist = haversine_km(
                user_lat,
                user_lon,
                float(hospital["latitude"]),
                float(hospital["longitude"]),
            )
            results.append({
                "name": hospital.get("hospital_name", "Unknown"),
                "distance_km": round(dist, 2),
                "latitude": float(hospital["latitude"]),
                "longitude": float(hospital["longitude"]),
                "state": hospital.get("state", ""),
                "district": hospital.get("district", ""),
            })

        results.sort(key=lambda x: x["distance_km"])
        return results[:limit]


def load_hospitals_from_json(path: str) -> List[Dict]:
    """Load hospital records from a local JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    hospitals = []
    for item in data:
        coords = str(item.get("_location_coordinates", "")).strip()
        if not coords or "," not in coords:
            continue

        lat_str, lon_str = [x.strip() for x in coords.split(",", 1)]
        try:
            lat = float(lat_str)
            lon = float(lon_str)
        except ValueError:
            continue

        hospitals.append({
            "hospital_name": item.get("hospital_name", "Unknown"),
            "latitude": lat,
            "longitude": lon,
            "state": item.get("state", ""),
            "district": item.get("district", ""),
        })

    return hospitals


if __name__ == "__main__":
    hospitals = load_hospitals_from_json("hospitals.json")
    index = HospitalIndex(hospitals)

    user_lat = 17.0922997
    user_lon = 82.0688201
    result = index.search_nearest(user_lat=user_lat, user_lon=user_lon, limit=5)

    print(f"User location: ({user_lat}, {user_lon})")
    print("Top 5 nearest hospitals:")
    for item in result:
        print(item)
