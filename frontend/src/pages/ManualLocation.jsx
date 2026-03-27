import { useState, useEffect, useRef, useCallback } from "react";

const NOMINATIM = "https://nominatim.openstreetmap.org";

async function searchPlaces(query) {
  const params = new URLSearchParams({
    q: `${query}, Tamil Nadu, India`,
    format: "json", addressdetails: "1", limit: "6",
    countrycodes: "in", "accept-language": "en",
  });
  const res  = await fetch(`${NOMINATIM}/search?${params}`, { headers: { "User-Agent": "BusPulse/1.0" } });
  const data = await res.json();
  const tn   = data.filter((p) => p.address?.state === "Tamil Nadu");
  if (tn.length > 0) return tn;
  const p2 = new URLSearchParams({
    q: `${query}, India`, format: "json", addressdetails: "1",
    limit: "8", countrycodes: "in", "accept-language": "en",
  });
  const res2  = await fetch(`${NOMINATIM}/search?${p2}`, { headers: { "User-Agent": "BusPulse/1.0" } });
  const data2 = await res2.json();
  return data2.filter((p) => p.address?.state === "Tamil Nadu");
}

async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
    { headers: { "User-Agent": "BusPulse/1.0" } }
  );
  return res.json();
}

/**
 * Build the best possible location label from Nominatim address fields.
 * Priority: hamlet > village > road (very useful for rural highways) > town > county
 * Always append district for context.
 */
function buildLabel(data) {
  if (!data?.address) return { primary: "", secondary: "", road: "" };
  const a = data.address;
  const road = a.road ? (a.road.length > 52 ? a.road.slice(0, 49) + "u2026" : a.road) : "";
  return { primary: "", secondary: "", road };
}

function formatSearchResult(data) {
  if (!data?.address) return data?.display_name || "Selected location";
  const a = data.address;
  return [
    a.hamlet || a.village || a.road || a.suburb || a.amenity,
    a.city || a.town || a.county,
    a.state,
  ].filter(Boolean).join(", ");
}

// ── Leaflet Map ────────────────────────────────────────────────────────────

function LeafletMap({ center, onDropPin, existingPin }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const [ready,      setReady] = useState(false);

  const placeMarker = useCallback((lat, lng) => {
    const L = window.L;
    if (!L || !mapRef.current) return;
    const icon = L.divIcon({
      html: `<div style="font-size:34px;line-height:1;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.5))">📍</div>`,
      iconSize: [34, 34], iconAnchor: [17, 34], className: "",
    });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon }).addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (!document.getElementById("lf-css")) {
      const link = document.createElement("link");
      link.id = "lf-css"; link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
    }

    const init = () => {
      const L = window.L;
      if (!L || !containerRef.current || mapRef.current) return;

      mapRef.current = L.map(containerRef.current, { zoomControl: true })
        .setView([center.lat, center.lng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 19,
      }).addTo(mapRef.current);

      setTimeout(() => {
        mapRef.current?.invalidateSize();
        setReady(true);
      }, 300);

      // If there's already a pin from GPS, show it but DON'T lock map to it
      if (existingPin) placeMarker(existingPin.lat, existingPin.lng);
    };

    if (window.L) { init(); }
    else {
      if (!document.getElementById("lf-js")) {
        const s = document.createElement("script");
        s.id = "lf-js";
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
        s.onload = init;
        document.body.appendChild(s);
      } else {
        const wait = setInterval(() => { if (window.L) { clearInterval(wait); init(); } }, 100);
      }
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; markerRef.current = null; }
    };
  }, []);

  // Pan to search result (external center change) WITHOUT moving existing pin
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView([center.lat, center.lng], 15, { animate: true });
  }, [center.lat, center.lng]);

  // "Drop Pin Here" — pin goes to exact map center (where crosshair is)
  const handleDropPin = () => {
    if (!mapRef.current) return;
    const c = mapRef.current.getCenter();
    // Place marker at exact center — same coords crosshair shows
    placeMarker(c.lat, c.lng);
    // Do NOT pan map — keep map still so user sees pin land on crosshair
    onDropPin(parseFloat(c.lat.toFixed(6)), parseFloat(c.lng.toFixed(6)));
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Loading */}
      {!ready && (
        <div style={{ position: "absolute", inset: 0, zIndex: 1000, background: "#f3f4f6", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #059669", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Loading map...</p>
        </div>
      )}

      {/* Fixed crosshair at exact center — this is where the pin will drop */}
      {ready && (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 500, pointerEvents: "none" }}>
          <div style={{ position: "relative", width: 44, height: 44 }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "rgba(5,150,105,0.9)", transform: "translateY(-50%)" }} />
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "rgba(5,150,105,0.9)", transform: "translateX(-50%)" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 10, height: 10, borderRadius: "50%", background: "#059669", border: "2px solid white", boxShadow: "0 0 0 2px rgba(5,150,105,0.3)" }} />
          </div>
        </div>
      )}

      {/* Drop Pin Here button */}
      {ready && (
        <button onClick={handleDropPin} style={{
          position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, background: "#059669", color: "#fff",
          border: "none", borderRadius: 24, padding: "11px 28px",
          fontSize: 14, fontWeight: 600,
          boxShadow: "0 4px 16px rgba(5,150,105,0.4)",
          cursor: "pointer", whiteSpace: "nowrap",
        }}>
          📍 Drop Pin Here
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function ManualLocation({ onSubmit, onCancel, gpsLocation }) {
  const defaultCenter = gpsLocation || { lat: 9.1464, lng: 77.8325 };

  const [tab,        setTab]        = useState("map");
  const [mapCenter,  setMapCenter]  = useState(defaultCenter);
  const [query,      setQuery]      = useState("");
  const [results,    setResults]    = useState([]);
  const [searching,  setSearching]  = useState(false);
  const [noResults,  setNoResults]  = useState(false);
  const [pin,        setPin]        = useState(gpsLocation ? { ...gpsLocation } : null);
  const [pinLabel,   setPinLabel]   = useState({ primary: "", secondary: "", road: "" });
  const [geocoding,  setGeocoding]  = useState(false);
  const debounceRef = useRef(null);

  // Auto reverse-geocode GPS pin on mount
  useEffect(() => {
    if (!gpsLocation) return;
    reverseGeocode(gpsLocation.lat, gpsLocation.lng)
      .then((d) => setPinLabel(buildLabel(d)))
      .catch(() => setPinLabel({ primary: "", secondary: "", road: "" }));
  }, []);

  // Search
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setNoResults(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true); setNoResults(false);
      try {
        const data = await searchPlaces(query);
        setResults(data); setNoResults(data.length === 0);
      } catch { setResults([]); setNoResults(true); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelectResult = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    setMapCenter({ lat, lng });
    setPin({ lat, lng });
    setPinLabel({ primary: "", secondary: "", road: "" });
    setResults([]);
    setQuery(formatSearchResult(place));
    setTab("map");
  };

  // Called when user taps "Drop Pin Here"
  const handleDropPin = useCallback(async (lat, lng) => {
    setPin({ lat, lng });
    setGeocoding(true);
    setPinLabel({ primary: "", secondary: "", road: "" });
    try {
      const data  = await reverseGeocode(lat, lng);
      setPinLabel(buildLabel(data));
    } catch {
      setPinLabel({ primary: "", secondary: "", road: "" });
    } finally { setGeocoding(false); }
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#f9fafb" }}>

      {/* Header */}
      <div style={{ background: "#fff", padding: "16px 16px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexShrink: 0 }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111827", margin: 0 }}>Set Your Location</h2>
              <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>
                Pan & zoom to your spot → tap <b>Drop Pin Here</b>
              </p>
            </div>
            <button onClick={onCancel} style={{ fontSize: 13, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
          </div>

          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 12, padding: 4, gap: 4 }}>
            {[{ id: "map", label: "🗺️  Tap on Map" }, { id: "search", label: "🔍  Search" }].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: "8px 4px", borderRadius: 9, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 500,
                background: tab === t.id ? "#fff" : "transparent",
                color: tab === t.id ? "#059669" : "#6b7280",
                boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Tab */}
      {tab === "map" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 16px 4px", minHeight: 0, maxWidth: 560, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          <div style={{ flex: 1, minHeight: 280, borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            <LeafletMap
              center={mapCenter}
              onDropPin={handleDropPin}
              existingPin={pin}
            />
          </div>
        </div>
      )}

      {/* Search Tab */}
      {tab === "search" && (
        <div style={{ flex: 1, padding: "16px", maxWidth: 560, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input autoFocus type="text"
              placeholder="e.g. Kovilpatti Bus Stand, Nalattinputhur..."
              value={query} onChange={(e) => setQuery(e.target.value)}
              style={{ width: "100%", padding: "12px 40px 12px 16px", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, background: "#fff", outline: "none" }}
            />
            {searching
              ? <div style={{ position: "absolute", right: 12, top: 12, width: 18, height: 18, border: "2px solid #059669", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              : query
                ? <button onClick={() => { setQuery(""); setResults([]); setNoResults(false); }} style={{ position: "absolute", right: 10, top: 8, background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af" }}>×</button>
                : null}
          </div>

          {results.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f0f0f0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
              {results.map((place, i) => (
                <button key={place.place_id || i} onClick={() => handleSelectResult(place)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", padding: "12px 16px", background: "none", border: "none", borderBottom: i < results.length - 1 ? "1px solid #f9fafb" : "none", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#f0fdf4"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  <span style={{ fontSize: 20, lineHeight: 1, marginTop: 2 }}>📍</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{formatSearchResult(place)}</p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>{place.address?.state_district || place.address?.county} · {parseFloat(place.lat).toFixed(4)}°N</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {noResults && !searching && (
            <div style={{ marginTop: 16, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: 16 }}>
              <p style={{ fontWeight: 600, color: "#92400e", fontSize: 14, margin: "0 0 6px" }}>"{query}" not found</p>
              <p style={{ fontSize: 13, color: "#b45309", margin: 0, lineHeight: 1.5 }}>
                <button onClick={() => setTab("map")} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, textDecoration: "underline", color: "#92400e", fontSize: 13 }}>Switch to Tap on Map</button>
                {" "}and navigate to your village.
              </p>
            </div>
          )}

          {!query && (
            <p style={{ marginTop: 24, textAlign: "center", fontSize: 13, color: "#9ca3af" }}>
              Village not showing up?{" "}
              <button onClick={() => setTab("map")} style={{ background: "none", border: "none", cursor: "pointer", color: "#059669", fontWeight: 600, textDecoration: "underline", fontSize: 13 }}>Tap on Map</button> instead.
            </p>
          )}
        </div>
      )}

      {/* Bottom bar */}
      <div style={{ background: "#fff", borderTop: "1px solid #f3f4f6", padding: "12px 16px 16px", flexShrink: 0, boxShadow: "0 -2px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          {pin ? (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>📍</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Coordinates — always 100% accurate, shown as primary */}
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0, fontFamily: "monospace", letterSpacing: "0.3px" }}>
                    {pin.lat.toFixed(5)}°N, {pin.lng.toFixed(5)}°E
                  </p>
                  {/* Road name if available — skip vague district/state names */}
                  {!geocoding && pinLabel.road && (
                    <p style={{ fontSize: 12, color: "#6b7280", margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      🛣️ {pinLabel.road}
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: "#10b981", margin: "3px 0 0", fontWeight: 500 }}>
                    {geocoding ? "Getting road info..." : "✓ Exact location pinned"}
                  </p>
                </div>
                <button onClick={() => { setPin(null); setPinLabel({ primary: "", secondary: "", road: "" }); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#d1d5db" }}>×</button>
              </div>
              <button onClick={() => onSubmit({ lat: pin.lat, lng: pin.lng })} disabled={geocoding} style={{
                width: "100%", padding: "14px", borderRadius: 12,
                background: geocoding ? "#d1d5db" : "#059669",
                color: "#fff", border: "none", cursor: geocoding ? "not-allowed" : "pointer",
                fontSize: 15, fontWeight: 600,
              }}>Use This Location</button>
            </>
          ) : (
            <p style={{ textAlign: "center", fontSize: 13, color: "#9ca3af", margin: 0, padding: "6px 0" }}>
              {tab === "map" ? "Pan the map to your spot, then tap Drop Pin Here" : "Search for your area above"}
            </p>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}