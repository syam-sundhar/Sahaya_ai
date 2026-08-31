// ── Sahaya Hospital Service ──────────────────────────────────────────────────
// ES module: GPS location, state detection, Gov API fetch, Haversine distance.
// 100% free — no Google Maps API calls.
//
// Usage:
//   import { getUserLocation, searchNearbyHospitals } from "./hospital-service.js";

const U = window.SAHAYA_UTIL;
const cfg = window.SAHAYA_BACKEND.hospital;

// ── Constants ────────────────────────────────────────────────────────────────
const EARTH_RADIUS_KM = 6371.0;

// ── Indian State bounding boxes for GPS → State mapping ─────────────────────
// Approximate centroids + radius. Used to quickly map GPS to a state name.
// Falls back to fetching all records if no match found.
const STATE_BOUNDS = [
  { name: "Andhra Pradesh", lat: 15.9129, lon: 79.74, r: 4.5 },
  { name: "Arunachal Pradesh", lat: 28.218, lon: 94.7278, r: 3.0 },
  { name: "Assam", lat: 26.2006, lon: 92.9376, r: 3.0 },
  { name: "Bihar", lat: 25.0961, lon: 85.3131, r: 3.0 },
  { name: "Chhattisgarh", lat: 21.2787, lon: 81.8661, r: 4.0 },
  { name: "Goa", lat: 15.2993, lon: 74.124, r: 1.0 },
  { name: "Gujarat", lat: 22.2587, lon: 71.1924, r: 4.5 },
  { name: "Haryana", lat: 29.0588, lon: 76.0856, r: 2.0 },
  { name: "Himachal Pradesh", lat: 31.1048, lon: 77.1734, r: 2.5 },
  { name: "Jharkhand", lat: 23.6102, lon: 85.2799, r: 2.5 },
  { name: "Karnataka", lat: 15.3173, lon: 75.7139, r: 4.5 },
  { name: "Kerala", lat: 10.8505, lon: 76.2711, r: 3.0 },
  { name: "Madhya Pradesh", lat: 22.9734, lon: 78.6569, r: 5.0 },
  { name: "Maharashtra", lat: 19.7515, lon: 75.7139, r: 5.0 },
  { name: "Manipur", lat: 24.6637, lon: 93.9063, r: 1.5 },
  { name: "Meghalaya", lat: 25.467, lon: 91.3662, r: 1.5 },
  { name: "Mizoram", lat: 23.1645, lon: 92.9376, r: 1.5 },
  { name: "Nagaland", lat: 26.1584, lon: 94.5624, r: 1.5 },
  { name: "Odisha", lat: 20.9517, lon: 85.0985, r: 4.0 },
  { name: "Punjab", lat: 31.1471, lon: 75.3412, r: 2.0 },
  { name: "Rajasthan", lat: 27.0238, lon: 74.2179, r: 5.0 },
  { name: "Sikkim", lat: 27.533, lon: 88.5122, r: 1.0 },
  { name: "Tamil Nadu", lat: 11.1271, lon: 78.6569, r: 4.5 },
  { name: "Telangana", lat: 18.1124, lon: 79.0193, r: 3.0 },
  { name: "Tripura", lat: 23.9408, lon: 91.9882, r: 1.5 },
  { name: "Uttar Pradesh", lat: 26.8467, lon: 80.9462, r: 5.0 },
  { name: "Uttarakhand", lat: 30.0668, lon: 79.0193, r: 2.5 },
  { name: "West Bengal", lat: 22.9868, lon: 87.855, r: 4.0 },
  { name: "Delhi", lat: 28.7041, lon: 77.1025, r: 0.8 },
  { name: "Jammu and Kashmir", lat: 33.7782, lon: 76.5762, r: 3.5 },
  { name: "Ladakh", lat: 34.1526, lon: 77.5771, r: 3.0 },
  { name: "Chandigarh", lat: 30.7333, lon: 76.7794, r: 0.3 },
  { name: "Puducherry", lat: 11.9416, lon: 79.8083, r: 0.5 },
  { name: "Andaman and Nicobar Islands", lat: 11.7401, lon: 92.6586, r: 3.0 },
  { name: "Dadra and Nagar Haveli and Daman and Diu", lat: 20.1809, lon: 73.0169, r: 1.0 },
  { name: "Lakshadweep", lat: 10.5667, lon: 72.6417, r: 2.0 }
];

/** All Indian states for the manual selector dropdown. */
export const INDIAN_STATES = STATE_BOUNDS.map(s => s.name).sort();

// ── Haversine Distance ───────────────────────────────────────────────────────
/**
 * Calculate straight-line distance between two GPS points in km.
 * Time complexity: O(1)
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) { return deg * (Math.PI / 180); }

// ── GPS Location ─────────────────────────────────────────────────────────────
/**
 * Get user's current GPS coordinates.
 * @returns {Promise<{lat: number, lon: number}>}
 */
export async function getUserLocation(timeoutMs) {
  var isNative = window.Capacitor
    && typeof Capacitor.isNativePlatform === 'function'
    && Capacitor.isNativePlatform()
    && Capacitor.Plugins
    && Capacitor.Plugins.Geolocation;

  if (isNative) {
    try {
      var geo = Capacitor.Plugins.Geolocation;
      // Request permissions first
      var perm = await geo.checkPermissions();
      if (perm.location !== 'granted') {
        var req = await geo.requestPermissions();
        if (req.location !== 'granted') {
          throw new Error("Location permission denied. Please enable GPS in your device settings.");
        }
      }
      var pos = await geo.getCurrentPosition({ enableHighAccuracy: true, timeout: timeoutMs || 10000 });
      return { lat: pos.coords.latitude, lon: pos.coords.longitude };
    } catch (e) {
      console.error("Capacitor Geolocation error:", e);
      throw new Error("Could not determine your location. Please check GPS settings.");
    }
  }

  // Web fallback
  return new Promise(function (resolve, reject) {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your device."));
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      function (err) {
        if (err.code === 1) {
          reject(new Error("Location permission denied. Please enable GPS in your device settings."));
        } else if (err.code === 2) {
          reject(new Error("Could not determine your location. Please check GPS settings."));
        } else {
          reject(new Error("Location request timed out. Please try again."));
        }
      },
      { enableHighAccuracy: true, timeout: timeoutMs || 10000, maximumAge: 60000 }
    );
  });
}

// ── State Detection ──────────────────────────────────────────────────────────
/**
 * Detect the nearest Indian state from GPS coordinates.
 * Uses simple centroid-distance matching.
 * @returns {string} State name or "" if out of India
 */
export function detectState(lat, lon) {
  var best = null;
  var bestDist = Infinity;
  for (var i = 0; i < STATE_BOUNDS.length; i++) {
    var s = STATE_BOUNDS[i];
    var d = haversineKm(lat, lon, s.lat, s.lon);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  // If nearest centroid is more than 500km away, we're likely outside India
  if (bestDist > 500) return "";
  return best ? best.name : "";
}

// ── Government API Fetch ─────────────────────────────────────────────────────
/**
 * Fetch hospitals from the Government dataset API.
 * Filters by state for performance (reduces ~30k → ~500-3000).
 *
 * @param {string} [stateName] - Optional state filter
 * @param {number} [limit] - Max records (default from config)
 * @returns {Promise<Array>} Array of hospital records with parsed coordinates
 */
export async function fetchHospitals(stateName, limit) {
  var maxRecords = limit || cfg.defaultLimit;
  var url = cfg.baseUrl +
    "?api-key=" + encodeURIComponent(cfg.apiKey) +
    "&format=json" +
    "&limit=" + maxRecords;

  if (stateName) {
    url += "&filters%5Bstate%5D=" + encodeURIComponent(stateName);
  }

  var data = await U.fetchJson(url, {
    method: "GET",
    headers: { "Accept": "application/json" }
  }, cfg.timeoutMs);

  if (!data || !Array.isArray(data.records)) {
    throw new Error("Invalid response from hospital directory.");
  }

  // Parse coordinates and filter out records without valid lat/lon
  var hospitals = [];
  for (var i = 0; i < data.records.length; i++) {
    var rec = data.records[i];
    var coords = String(rec._location_coordinates || "").trim();
    if (!coords || coords.indexOf(",") === -1) continue;

    var parts = coords.split(",");
    var lat = parseFloat(parts[0]);
    var lon = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) continue;

    hospitals.push({
      id: rec._sr_no || i,
      name: rec.hospital_name || "Unknown Hospital",
      lat: lat,
      lon: lon,
      state: rec.state || "",
      district: rec.district || "",
      address: rec._address_original_first_line || "",
      pincode: rec._pincode || "",
      careType: rec._hospital_care_type || "",
      medicineType: rec._discipline_systems_of_medicine || "",
      telephone: rec.telephone || "",
      mobile: rec.mobile_number || "",
      emergencyNum: rec.emergency_num || "",
      ambulanceNum: rec._ambulance_phone_no || "",
      email: rec._hospital_primary_email_id || "",
      website: rec.website || "",
      specialties: rec.specialties || "",
      facilities: rec.facilities || "",
      totalBeds: rec._total_num_beds || "",
      numDoctors: rec.number_doctor || "",
      emergencyServices: rec._emergency_services || "",
      establishedYear: rec.establised_year || "",
      category: rec.hospital_category || ""
    });
  }

  return hospitals;
}

// ── Search Orchestrator ──────────────────────────────────────────────────────
/**
 * Main search function: GPS → State → Fetch → Sort by distance → Top N
 *
 * @param {number} limit - Number of hospitals to return (default 15)
 * @param {string} [overrideState] - Manual state override
 * @returns {Promise<{hospitals: Array, userLat: number, userLon: number, state: string}>}
 */
export async function searchNearbyHospitals(limit, overrideState) {
  var maxResults = limit || 15;

  // 1. Get user location
  var loc = await getUserLocation();

  // 2. Detect state (or use override)
  var state = overrideState || detectState(loc.lat, loc.lon);

  // 3. Fetch hospitals from API (filtered by state if detected)
  var allHospitals = await fetchHospitals(state || null, 500);

  // 4. Calculate distance for each hospital — O(n)
  for (var i = 0; i < allHospitals.length; i++) {
    allHospitals[i].distanceKm = haversineKm(loc.lat, loc.lon, allHospitals[i].lat, allHospitals[i].lon);
  }

  // 5. Sort by distance — O(n log n)
  allHospitals.sort(function (a, b) { return a.distanceKm - b.distanceKm; });

  // 6. Return top N
  return {
    hospitals: allHospitals.slice(0, maxResults),
    userLat: loc.lat,
    userLon: loc.lon,
    state: state,
    total: allHospitals.length
  };
}

/**
 * Format a distance value for display.
 * @param {number} km
 * @returns {string}
 */
export function formatDistance(km) {
  if (km < 1) return Math.round(km * 1000) + " m";
  if (km < 10) return km.toFixed(1) + " km";
  return Math.round(km) + " km";
}

/**
 * Get the best phone number for a hospital.
 * Prefers emergency > mobile > telephone.
 */
export function getBestPhone(hospital) {
  var nums = [hospital.emergencyNum, hospital.mobile, hospital.telephone, hospital.ambulanceNum];
  for (var i = 0; i < nums.length; i++) {
    if (nums[i] && nums[i] !== "0" && nums[i].trim().length > 3) {
      return nums[i].trim();
    }
  }
  return "";
}

/**
 * Build a Google Maps directions deep link.
 */
export function getDirectionsUrl(lat, lon) {
  return "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lon;
}
