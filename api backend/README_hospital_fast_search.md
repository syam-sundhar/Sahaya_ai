# Fast Hospital Search Without Google Maps

## Goal
Return the nearest 50 hospitals from the government dataset in a fast, low-cost way.

## Why this is fast
The government dataset has about 30k records. A full scan on every request is slow. Instead:

1. Load the hospital dataset once.
2. Build a spatial bucket index.
3. For each user request, search only nearby cells instead of all hospitals.
4. Calculate straight-line distance only for the candidates.
5. Sort candidates and return the top 50.

## Best real-world architecture
Use PostgreSQL + PostGIS:

```sql
CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    hospital_name TEXT,
    state TEXT,
    district TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    location geography(Point, 4326)
);

CREATE INDEX hospitals_location_idx
ON hospitals USING GIST (location);
```

Search query:

```sql
SELECT *,
       ST_Distance(
         location,
         ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
       ) / 1000.0 AS distance_km
FROM hospitals
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
  50000
)
ORDER BY distance_km ASC
LIMIT 50;
```

This is much faster than scanning all rows.

## What to do for your Android app

- Backend receives: `problem`, `latitude`, `longitude`, `limit`
- Backend maps problem to a hospital category (for example, cardiology, emergency, general)
- Backend queries nearby hospitals locally
- Backend sorts by distance
- Backend returns the closest 50 hospitals

## Why not use Google Maps for every request
Because it becomes expensive. The free $200 credit can disappear quickly if you calculate route distance for many users.

## Recommendation
For your project, use only the government data and build a local geospatial index.

If you need road distance later, use Google only for a small shortlist (for example 10 to 20 hospitals), not all 30k.

## Important note
For chest pain or emergency use cases, the app should prioritize nearby emergency-capable hospitals and call emergency services directly if needed.
