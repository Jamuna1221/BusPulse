import { useState, useEffect, useRef } from "react";
import { fetchUpcomingBuses } from "../services/busService";

// ── Helpers ────────────────────────────────────────────────────────────────

function timeToMinutes(timeStr) {
  const parts = String(timeStr).slice(0, 5).split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

function getCurrentTimeStr() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/**
 * Estimate bus's current lat/lng on route geometry based on elapsed time.
 * Returns a point from the geometry array.
 */
function estimateBusPosition(bus) {
  const geometry = bus.routeGeometry;
  if (!geometry || geometry.length === 0) return null;

  const currentMinutes   = timeToMinutes(getCurrentTimeStr());
  const departureMinutes = timeToMinutes(bus.departureTime);
  const elapsedMinutes   = currentMinutes - departureMinutes;

  // Bus hasn't departed — position is at origin
  if (elapsedMinutes <= 0) return geometry[0];

  // Average speed 24 km/h → 0.4 km/min
  const AVG_SPEED_KM_PER_MIN = 18 / 60;
const totalStops       = Math.floor(bus.routeGeometry.length > 1 ? 9 : 0);
const stopsAlreadyMade = Math.floor((elapsedMinutes / 171) * totalStops);
const netTravel        = Math.max(0, elapsedMinutes - stopsAlreadyMade * 2);
const distanceTraveledKm = netTravel * AVG_SPEED_KM_PER_MIN;
  // Walk along geometry to find position
  let accumulated = 0;
  for (let i = 1; i < geometry.length; i++) {
    const segKm =
      haversineKm(
        geometry[i - 1].lat, geometry[i - 1].lng,
        geometry[i].lat,     geometry[i].lng
      );
    if (accumulated + segKm >= distanceTraveledKm) {
      // Interpolate within this segment
      const fraction = (distanceTraveledKm - accumulated) / segKm;
      return {
        lat: geometry[i - 1].lat + fraction * (geometry[i].lat - geometry[i - 1].lat),
        lng: geometry[i - 1].lng + fraction * (geometry[i].lng - geometry[i - 1].lng),
      };
    }
    accumulated += segKm;
  }

  return geometry[geometry.length - 1];
}
function formatEta(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── LeafletMap component (loaded lazily via CDN) ───────────────────────────

function TrackMap({ bus, userLocation }) {
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const busMarker = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id   = "leaflet-css";
      link.rel  = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    function initMap() {
      const L = window.L;
      if (!L || !mapRef.current || mapInst.current) return;

      const geometry = bus.routeGeometry || [];
      const busPos   = estimateBusPosition(bus) || geometry[0];
      const center   = busPos || { lat: userLocation.lat, lng: userLocation.lng };

      mapInst.current = L.map(mapRef.current, { zoomControl: true }).setView(
        [center.lat, center.lng], 11
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(mapInst.current);

      // Draw route polyline
      if (geometry.length > 1) {
        const latlngs = geometry.map((p) => [p.lat, p.lng]);
        L.polyline(latlngs, { color: "#059669", weight: 4, opacity: 0.8 }).addTo(mapInst.current);

        // Origin marker
        L.circleMarker([geometry[0].lat, geometry[0].lng], {
          radius: 8, color: "#059669", fillColor: "#059669", fillOpacity: 1,
        })
          .addTo(mapInst.current)
          .bindPopup(`<b>Origin:</b> ${bus.from}`);

        // Destination marker
        const dest = geometry[geometry.length - 1];
        L.circleMarker([dest.lat, dest.lng], {
          radius: 8, color: "#dc2626", fillColor: "#dc2626", fillOpacity: 1,
        })
          .addTo(mapInst.current)
          .bindPopup(`<b>Destination:</b> ${bus.to}`);
      }

      // User location marker
      const userIcon = L.divIcon({
        html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(59,130,246,0.8)"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8], className: "",
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapInst.current)
        .bindPopup("<b>Your location</b>");

      // Bus marker (animated)
      const busIcon = L.divIcon({
        html: `<div style="background:#f59e0b;width:28px;height:28px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px">🚌</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14], className: "",
      });

      if (busPos) {
        busMarker.current = L.marker([busPos.lat, busPos.lng], { icon: busIcon })
          .addTo(mapInst.current)
          .bindPopup(`<b>${bus.routeNo}</b><br>${bus.from} → ${bus.to}<br>Dep: ${bus.departureTime}`);
      }

      // Animate bus position every 10 seconds
      intervalRef.current = setInterval(() => {
        if (!busMarker.current || !mapInst.current) return;
        const newPos = estimateBusPosition(bus);
        if (newPos) {
          busMarker.current.setLatLng([newPos.lat, newPos.lng]);
        }
      }, 10000);
    }

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src  = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = initMap;
      document.body.appendChild(script);
    }

    return () => {
      clearInterval(intervalRef.current);
      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, [bus.serviceId]);

  return <div ref={mapRef} style={{ height: "100%", width: "100%", borderRadius: "12px" }} />;
}

// ── Track Modal ────────────────────────────────────────────────────────────

function TrackModal({ bus, userLocation, onClose }) {
  const currentMinutes   = timeToMinutes(getCurrentTimeStr());
  const departureMinutes = timeToMinutes(bus.departureTime);
  const elapsedMinutes   = currentMinutes - departureMinutes;

  const statusLabel =
    elapsedMinutes < 0
      ? `Departs in ${Math.abs(elapsedMinutes)} min — still at ${bus.from}`
      : `En route · departed ${elapsedMinutes} min ago`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{bus.routeNo}</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {bus.from} → {bus.to}
            </p>
            <p className="text-xs text-gray-500 mt-1">{statusLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4"
          >
            ×
          </button>
        </div>

        {/* Simulated notice */}
        <div className="mx-5 mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <span className="text-amber-500 text-base">⚠️</span>
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Simulated position only.</span> Bus
            location is estimated based on departure time and average speed.
            Not real-time GPS tracking.
          </p>
        </div>

        {/* Map */}
        <div className="mx-5 mb-4 rounded-xl overflow-hidden" style={{ height: "320px" }}>
          {bus.routeGeometry && bus.routeGeometry.length > 0 ? (
            <TrackMap bus={bus} userLocation={userLocation} />
          ) : (
            <div className="h-full bg-gray-100 flex items-center justify-center rounded-xl">
              <p className="text-gray-500 text-sm">No route geometry available</p>
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="mx-5 mb-5 grid grid-cols-3 gap-3">
          {[
            { label: "Departure", value: String(bus.departureTime).slice(0, 5) },
            { label: "ETA", value: formatEta(bus.eta) },
            { label: "Status",    value: bus.status.replace("_", " ") },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main UpcomingBuses component ──────────────────────────────────────────

export default function UpcomingBuses({ location, onChangeLocation }) {
  const [buses,       setBuses]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [areaName,    setAreaName]    = useState("your location");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [trackingBus, setTrackingBus] = useState(null); // bus being tracked

  const loadUpcomingBuses = async () => {
    if (!location) { setError("Location not available"); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchUpcomingBuses({
        lat: location.lat,
        lng: location.lng,
        maxMinutes: 60,
      });
      if (response.success) {
        setBuses(response.buses || []);
        setLastUpdated(new Date());
      } else {
        setError(response.error || "Failed to fetch buses");
      }
    } catch (err) {
      console.error("Error fetching buses:", err);
      setError("Unable to fetch upcoming buses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAreaName = async () => {
    if (!location) return;
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
      );
      const data = await res.json();
      if (data?.address) {
        setAreaName(
          data.address.suburb     ||
          data.address.neighbourhood ||
          data.address.village    ||
          data.address.town       ||
          data.address.city       ||
          "your location"
        );
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    loadUpcomingBuses();
    fetchAreaName();
  }, [location]);

  useEffect(() => {
    const interval = setInterval(loadUpcomingBuses, 30000);
    return () => clearInterval(interval);
  }, [location]);

  // ── Styles ─────────────────────────────────────────────────────────────

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "NEARBY":       return "bg-emerald-600 text-white";
      case "APPROACHING":  return "bg-emerald-100 text-emerald-700";
      case "NOT_DEPARTED": return "bg-blue-100 text-blue-700";
      default:             return "bg-gray-100 text-gray-700";
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case "HIGH":   return "text-green-600";
      case "MEDIUM": return "text-yellow-600";
      case "LOW":    return "text-red-500";
      default:       return "text-gray-500";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "NOT_DEPARTED": return "NOT DEPARTED";
      default:             return status.replace(/_/g, " ");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      <div className="min-h-screen bg-gray-50 px-4 py-6 flex justify-center">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Buses near you</h2>
            <p className="text-sm text-gray-600 mt-1">
              Near <span className="font-medium">You</span> • Next 15 minutes
            </p>
            <button
              className="mt-2 text-sm text-emerald-600 hover:underline"
              onClick={onChangeLocation}
            >
              Change location
            </button>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-2">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
              <button onClick={loadUpcomingBuses} className="mt-2 text-sm text-red-700 hover:underline">
                Try again
              </button>
            </div>
          )}

          {/* Bus list */}
          {!loading && !error && (
            <div className="space-y-4">
              {buses.length === 0 ? (
                <div className="text-center text-gray-500 mt-20 bg-white rounded-2xl p-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700">No buses arriving soon</p>
                  <p className="text-sm text-gray-500 mt-2">Check back in a few minutes</p>
                  <button onClick={loadUpcomingBuses} className="mt-4 text-sm text-emerald-600 hover:underline">
                    Refresh
                  </button>
                </div>
              ) : (
                buses.map((bus, index) => (
                  <div
                    key={`${bus.serviceId}-${index}`}
                    className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition"
                  >
                    {/* Top row */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{bus.routeNo}</h3>
                        <p className="text-sm text-gray-600">{bus.from} → {bus.to}</p>
                      </div>
                      <div className="text-right">
                       <p className="text-lg font-semibold text-gray-900">{formatEta(bus.eta)}</p>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(bus.status)}`}>
                          {getStatusLabel(bus.status)}
                        </span>
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex justify-between items-center mt-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getConfidenceColor(bus.confidence)}`}>
                          Confidence: {bus.confidence}
                        </span>
                        {bus.distance && (
                          <span className="text-xs text-gray-500">• {bus.distance}m away</span>
                        )}
                      </div>
                      <button
                        onClick={() => setTrackingBus(bus)}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition"
                      >
                        Track
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Refresh */}
          {!loading && buses.length > 0 && (
            <button
              onClick={loadUpcomingBuses}
              className="mt-6 w-full bg-white text-emerald-600 border-2 border-emerald-600 py-3 rounded-xl font-medium hover:bg-emerald-50 transition"
            >
              Refresh Buses
            </button>
          )}
        </div>
      </div>

      {/* Track modal */}
      {trackingBus && (
        <TrackModal
          bus={trackingBus}
          userLocation={location}
          onClose={() => setTrackingBus(null)}
        />
      )}
    </>
  );
}