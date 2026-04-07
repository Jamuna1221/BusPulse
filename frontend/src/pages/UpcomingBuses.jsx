import { useState, useEffect, useRef } from "react";
import { fetchUpcomingBuses } from "../services/busService";
import { useUserAuth } from "../context/UserAuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const NOMINATIM = "https://nominatim.openstreetmap.org";

/* ─── Google Font injection ────────────────────────────────────────────── */
if (!document.getElementById("bp-fonts")) {
  const link = document.createElement("link");
  link.id = "bp-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap";
  document.head.appendChild(link);
}

/* ─── Global styles ────────────────────────────────────────────────────── */
const globalStyle = `
  .bp-root * { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }
  .bp-root { --em: #059669; --em-light: #d1fae5; --em-dark: #047857;
             --ink: #111827; --muted: #6b7280; --surface: #f9fafb;
             --card: #ffffff; --border: #e5e7eb; --amber: #d97706; --red: #dc2626; }

  @keyframes bp-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bp-pulse-dot { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.5);opacity:.6} }
  @keyframes bp-spin { to { transform: rotate(360deg); } }
  @keyframes bp-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .bp-card-enter { animation: bp-fade-up 0.4s ease both; }
  .bp-live-dot { animation: bp-pulse-dot 1.4s ease infinite; }
  .bp-spinner { animation: bp-spin 0.8s linear infinite; }

  .bp-shimmer {
    background: linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 37%,#f0f0f0 63%);
    background-size: 400px 100%;
    animation: bp-shimmer 1.2s ease infinite;
    border-radius: 8px;
  }

  .bp-track-btn {
    background: var(--em); color: #fff;
    border: none; cursor: pointer;
    padding: 8px 18px; border-radius: 10px;
    font-size: 13px; font-weight: 600;
    transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
    letter-spacing: 0.01em;
  }
  .bp-track-btn:hover { background: var(--em-dark); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(5,150,105,0.3); }
  .bp-track-btn:active { transform: translateY(0); }

  .bp-refresh-btn {
    width:100%; padding:14px; border-radius:14px;
    border: 2px solid var(--em); background: transparent;
    color: var(--em); font-size:14px; font-weight:600;
    cursor: pointer; transition: background 0.15s, transform 0.1s;
    letter-spacing: 0.01em;
  }
  .bp-refresh-btn:hover { background: var(--em-light); transform: translateY(-1px); }

  .bp-input {
    width: 100%; border: 1.5px solid var(--border); border-radius: 12px;
    padding: 10px 38px 10px 14px; font-size:14px; color: var(--ink);
    background: var(--card); outline: none; transition: border-color 0.15s, box-shadow 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .bp-input:focus { border-color: var(--em); box-shadow: 0 0 0 3px rgba(5,150,105,0.12); }
  .bp-input::placeholder { color: #9ca3af; }

  .bp-dropdown {
    position:absolute; z-index:30; top:calc(100% + 6px); left:0; right:0;
    background: var(--card); border: 1.5px solid var(--border); border-radius:14px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.1); max-height:220px; overflow:auto;
  }
  .bp-dropdown-item {
    width:100%; text-align:left; border:none; background:transparent;
    padding:10px 14px; cursor:pointer; transition:background 0.1s; display:block;
  }
  .bp-dropdown-item:hover { background: var(--surface); }

  .bp-badge { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; letter-spacing:0.04em; }
  .bp-badge-nearby { background:#dcfce7; color:#15803d; }
  .bp-badge-approaching { background:#d1fae5; color:#065f46; }
  .bp-badge-notdeparted { background:#dbeafe; color:#1d4ed8; }
  .bp-badge-default { background:#f3f4f6; color:#374151; }

  .bp-conf-high   { color:#16a34a; }
  .bp-conf-medium { color:#d97706; }
  .bp-conf-low    { color:#dc2626; }
  .bp-conf-def    { color:#9ca3af; }

  .bp-divider { height:1px; background: var(--border); margin: 0 0 16px; }

  .bp-feedback-btn {
    padding:9px 14px; border-radius:10px; border:none;
    font-size:13px; font-weight:500; cursor:pointer;
    transition: all 0.15s; font-family:'DM Sans',sans-serif;
  }
  .bp-feedback-btn-primary { background: var(--em); color:#fff; }
  .bp-feedback-btn-primary:hover { background: var(--em-dark); }
  .bp-feedback-btn-ghost   { background:#f3f4f6; color:#374151; }
  .bp-feedback-btn-ghost:hover { background:#e5e7eb; }
  .bp-feedback-btn-active  { background: var(--em); color:#fff; }
  .bp-feedback-btn-inactive{ background:#f3f4f6; color:#374151; }
  .bp-feedback-btn:disabled { opacity:.5; cursor:not-allowed; }

  .bp-tag-pill {
    display:inline-flex; align-items:center; gap:4px;
    background: var(--em-light); color: var(--em-dark);
    border-radius: 20px; padding: 2px 10px; font-size:11px; font-weight:600;
  }
`;

if (!document.getElementById("bp-global-style")) {
  const s = document.createElement("style");
  s.id = "bp-global-style";
  s.textContent = globalStyle;
  document.head.appendChild(s);
}

/* ─── Helpers ──────────────────────────────────────────────────────────── */

function timeToMinutes(t) {
  const [h, m] = String(t).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}
function getCurrentTimeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371, r = d => d * Math.PI / 180, dLat = r(lat2 - lat1), dLng = r(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function estimateBusPosition(bus) {
  const geo = bus.routeGeometry;
  if (!geo?.length) return null;
  const cur = timeToMinutes(getCurrentTimeStr()), dep = timeToMinutes(bus.departureTime);
  const elapsed = cur - dep;
  if (elapsed <= 0) return geo[0];
  const AVG = 18 / 60;
  const totalStops = geo.length > 1 ? 9 : 0, stops = Math.floor((elapsed / 171) * totalStops);
  const net = Math.max(0, elapsed - stops * 2), dist = net * AVG;
  let acc = 0;
  for (let i = 1; i < geo.length; i++) {
    const seg = haversineKm(geo[i - 1].lat, geo[i - 1].lng, geo[i].lat, geo[i].lng);
    if (acc + seg >= dist) {
      const f = (dist - acc) / seg;
      return { lat: geo[i - 1].lat + f * (geo[i].lat - geo[i - 1].lat), lng: geo[i - 1].lng + f * (geo[i].lng - geo[i - 1].lng) };
    }
    acc += seg;
  }
  return geo[geo.length - 1];
}
function formatEta(m) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}
function liveStatusLabel(s) { return s ? s.replaceAll("_", " ") : null; }
function effectiveStatus(bus) {
  return bus?.liveStatus === "SERVICE_DISRUPTED" ? "SERVICE_DISRUPTED" : bus?.status;
}

async function searchDestinationPlaces(query) {
  const mk = (q, extra = {}) => new URLSearchParams({ q, format: "json", addressdetails: "1", limit: "20", countrycodes: "in", "accept-language": "en", ...extra });
  const hdr = { headers: { "User-Agent": "BusPulse/1.0" } };
  const r1 = await fetch(`${NOMINATIM}/search?${mk(`${query}, Tamil Nadu, India`)}`, hdr);
  const d1 = await r1.json();
  const tn = (d1 || []).filter(p => p.address?.state === "Tamil Nadu");
  if (tn.length > 0) return tn;
  const r2 = await fetch(`${NOMINATIM}/search?${mk(`${query}, India`, { limit: "25" })}`, hdr);
  const d2 = await r2.json();
  return (d2 || []).filter(p => p.address?.state === "Tamil Nadu");
}

/* ─── TrackMap ─────────────────────────────────────────────────────────── */

function TrackMap({ bus, userLocation }) {
  const mapRef = useRef(null), mapInst = useRef(null), busMarker = useRef(null), ivl = useRef(null);
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const l = document.createElement("link");
      l.id = "leaflet-css"; l.rel = "stylesheet";
      l.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(l);
    }
    function init() {
      const L = window.L;
      if (!L || !mapRef.current || mapInst.current) return;
      const geo = bus.routeGeometry || [], busPos = estimateBusPosition(bus) || geo[0];
      const center = busPos || userLocation;
      mapInst.current = L.map(mapRef.current, { zoomControl: true }).setView([center.lat, center.lng], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 18 }).addTo(mapInst.current);
      if (geo.length > 1) {
        L.polyline(geo.map(p => [p.lat, p.lng]), { color: "#059669", weight: 4, opacity: 0.85 }).addTo(mapInst.current);
        L.circleMarker([geo[0].lat, geo[0].lng], { radius: 7, color: "#059669", fillColor: "#059669", fillOpacity: 1 }).addTo(mapInst.current).bindPopup(`<b>Origin:</b> ${bus.from}`);
        const d = geo[geo.length - 1];
        L.circleMarker([d.lat, d.lng], { radius: 7, color: "#dc2626", fillColor: "#dc2626", fillOpacity: 1 }).addTo(mapInst.current).bindPopup(`<b>Destination:</b> ${bus.to}`);
      }
      const userIcon = L.divIcon({ html: `<div style="background:#3b82f6;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 6px rgba(59,130,246,0.7)"></div>`, iconSize: [14, 14], iconAnchor: [7, 7], className: "" });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(mapInst.current).bindPopup("<b>You</b>");
      const busIcon = L.divIcon({ html: `<div style="background:#f59e0b;width:30px;height:30px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 10px rgba(0,0,0,0.25)">🚌</div>`, iconSize: [30, 30], iconAnchor: [15, 15], className: "" });
      if (busPos) busMarker.current = L.marker([busPos.lat, busPos.lng], { icon: busIcon }).addTo(mapInst.current).bindPopup(`<b>${bus.routeNo}</b><br>${bus.from} → ${bus.to}`);
      ivl.current = setInterval(() => { const p = estimateBusPosition(bus); if (p && busMarker.current) busMarker.current.setLatLng([p.lat, p.lng]); }, 10000);
    }
    if (window.L) { init(); } else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      s.onload = init; document.body.appendChild(s);
    }
    return () => { clearInterval(ivl.current); if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, [bus.serviceId]);
  return <div ref={mapRef} style={{ height: "100%", width: "100%", borderRadius: "12px" }} />;
}

/* ─── TrackModal ───────────────────────────────────────────────────────── */

function TrackModal({ bus, userLocation, onClose, token }) {
  const cur = timeToMinutes(getCurrentTimeStr()), dep = timeToMinutes(bus.departureTime);
  const elapsed = cur - dep;
  const statusLabel = elapsed < 0 ? `Departs in ${Math.abs(elapsed)} min` : `En route · departed ${elapsed} min ago`;

  const [step, setStep] = useState("askCatch");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [doneMessage, setDoneMessage] = useState("");
  const [form, setForm] = useState({ didCatchBus: null, insideBus: null, punctuality: "", crowdLevel: "", busCondition: "", note: "" });

  const submitFeedback = async (override = {}) => {
    setSubmitting(true); setSubmitError("");
    try {
      if (!token) throw new Error("Session expired. Please login again.");
      const res = await fetch(`${API}/api/user/bus-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ serviceId: bus.serviceId, routeId: bus.routeId, ...form, ...override }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Failed to submit.");
      setDoneMessage("Feedback saved. Live status updated.");
      setStep("done");
    } catch (e) { setSubmitError(e.message || "Failed to submit."); }
    finally { setSubmitting(false); }
  };

  const crowdOptions = [["seats_available", "🪑 Seats Free"], ["standing", "🧍 Standing"], ["fully_packed", "😤 Packed"]];
  const condOptions = [["normal", "✅ Normal"], ["delayed", "⏳ Delayed"], ["breakdown", "🔧 Breakdown"], ["accident", "⚠️ Accident"]];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: "0 0" }}>
      <div onClick={e => e.stopPropagation()} className="bp-root" style={{
        background: "#fff", width: "100%", maxWidth: 520, borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 48px rgba(0,0,0,0.18)", maxHeight: "92vh", overflowY: "auto",
        animation: "bp-fade-up 0.3s ease"
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 4, background: "#e5e7eb" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "16px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>{bus.routeNo}</span>
              <span className="bp-tag-pill">🚌 Live</span>
            </div>
            <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>{bus.from} → {bus.to}</p>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>{statusLabel}</p>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "#f3f4f6", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 18, color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Info strip */}
        <div style={{ margin: "0 20px 14px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[{ label: "Departs", val: String(bus.departureTime).slice(0, 5) }, { label: "ETA", val: formatEta(bus.eta) }, { label: "Status", val: effectiveStatus(bus).replace("_", " ") }].map(item => (
            <div key={item.label} style={{ background: "#f9fafb", borderRadius: 12, padding: "10px 8px", textAlign: "center", border: "1px solid #f3f4f6" }}>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", margin: "4px 0 0", fontFamily: "'DM Mono',monospace" }}>{item.val}</p>
            </div>
          ))}
        </div>

        {/* Simulated notice */}
        <div style={{ margin: "0 20px 14px", display: "flex", gap: 8, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "10px 12px" }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.5 }}>
            <b>Simulated position.</b> Estimated from departure time & avg speed — not real-time GPS.
          </p>
        </div>

        {/* Map */}
        <div style={{ margin: "0 20px 16px", borderRadius: 16, overflow: "hidden", height: 300, border: "1px solid #e5e7eb" }}>
          {bus.routeGeometry?.length > 0
            ? <TrackMap bus={bus} userLocation={userLocation} />
            : <div style={{ height: "100%", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "#9ca3af", fontSize: 13 }}>No route geometry available</p>
            </div>}
        </div>

        {/* Feedback */}
        <div style={{ margin: "0 20px 24px", border: "1.5px solid #e5e7eb", borderRadius: 16, padding: "16px" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px" }}>Crowd report</p>

          {step === "askCatch" && (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 10px" }}>Did you catch this bus?</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="bp-feedback-btn bp-feedback-btn-primary" onClick={() => { setForm(s => ({ ...s, didCatchBus: true })); setStep("askInside"); }}>Yes, I did</button>
                <button className="bp-feedback-btn bp-feedback-btn-ghost" onClick={() => { setForm(s => ({ ...s, didCatchBus: false })); setStep("missed"); }}>No, I missed it</button>
              </div>
            </>
          )}

          {step === "askInside" && (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 10px" }}>Are you currently inside?</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="bp-feedback-btn bp-feedback-btn-primary" onClick={() => { setForm(s => ({ ...s, insideBus: true })); setStep("insideDetails"); }}>Yes</button>
                <button className="bp-feedback-btn bp-feedback-btn-ghost" onClick={() => submitFeedback({ insideBus: false, busCondition: "normal" })} disabled={submitting}>No</button>
              </div>
            </>
          )}

          {step === "missed" && (
            <>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: "0 0 10px" }}>Was the bus on time?</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[["on_time", "✅ On Time"], ["late", "🕐 Late"], ["very_late", "🔴 Very Late"], ["not_arrived", "❌ Not Arrived"]].map(([v, l]) => (
                  <button key={v} className="bp-feedback-btn bp-feedback-btn-ghost" style={{ fontSize: 13 }} onClick={() => submitFeedback({ punctuality: v })} disabled={submitting}>{l}</button>
                ))}
              </div>
            </>
          )}

          {step === "insideDetails" && (
            <>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Crowd level</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 14 }}>
                {crowdOptions.map(([v, l]) => (
                  <button key={v} className={`bp-feedback-btn ${form.crowdLevel === v ? "bp-feedback-btn-active" : "bp-feedback-btn-inactive"}`} style={{ fontSize: 12, padding: "8px 6px" }} onClick={() => setForm(s => ({ ...s, crowdLevel: v }))}>{l}</button>
                ))}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 8px" }}>Bus condition</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
                {condOptions.map(([v, l]) => (
                  <button key={v} className={`bp-feedback-btn ${form.busCondition === v ? "bp-feedback-btn-active" : "bp-feedback-btn-inactive"}`} style={{ fontSize: 12 }} onClick={() => setForm(s => ({ ...s, busCondition: v }))}>{l}</button>
                ))}
              </div>
              <textarea value={form.note} onChange={e => setForm(s => ({ ...s, note: e.target.value }))}
                className="bp-input" placeholder="Any extra notes? (optional)" rows={2}
                style={{ marginBottom: 12, resize: "none", padding: "10px 12px", fontSize: 13 }} />
              <button className="bp-feedback-btn bp-feedback-btn-primary" style={{ width: "100%", padding: "11px", fontSize: 14, borderRadius: 12 }} onClick={() => submitFeedback({})} disabled={submitting || !form.crowdLevel || !form.busCondition}>
                {submitting ? "Submitting…" : "Submit Feedback"}
              </button>
            </>
          )}

          {step === "done" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
              <span style={{ fontSize: 22 }}>✅</span>
              <p style={{ fontSize: 14, color: "#15803d", fontWeight: 600, margin: 0 }}>{doneMessage}</p>
            </div>
          )}

          {submitError && <p style={{ fontSize: 12, color: "#dc2626", marginTop: 10 }}>{submitError}</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton loader ──────────────────────────────────────────────────── */
function SkeletonCard({ delay = 0 }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "18px 16px", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", animationDelay: `${delay}ms` }} className="bp-card-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="bp-shimmer" style={{ width: 80, height: 18, marginBottom: 8 }} />
          <div className="bp-shimmer" style={{ width: 160, height: 13 }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="bp-shimmer" style={{ width: 60, height: 18, marginBottom: 8 }} />
          <div className="bp-shimmer" style={{ width: 80, height: 22, borderRadius: 20 }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <div className="bp-shimmer" style={{ width: 120, height: 13 }} />
        <div className="bp-shimmer" style={{ width: 70, height: 34, borderRadius: 10 }} />
      </div>
    </div>
  );
}

/* ─── BusCard ───────────────────────────────────────────────────────────── */
function BusCard({ bus, index, onTrack }) {
  const status = effectiveStatus(bus);
  const badgeClass = {
    SERVICE_DISRUPTED: "bp-badge-default",
    NEARBY: "bp-badge-nearby", APPROACHING: "bp-badge-approaching",
    NOT_DEPARTED: "bp-badge-notdeparted"
  }[status] || "bp-badge-default";

  const confClass = { HIGH: "bp-conf-high", MEDIUM: "bp-conf-medium", LOW: "bp-conf-low" }[bus.confidence] || "bp-conf-def";

  const statusLabel = status === "NOT_DEPARTED" ? "Not Departed" : status.replace(/_/g, " ");

  return (
    <div className="bp-card-enter" style={{
      background: "#fff", borderRadius: 20, padding: "16px",
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      border: "1px solid #f3f4f6",
      transition: "box-shadow 0.2s,transform 0.2s",
      animationDelay: `${index * 60}ms`,
      cursor: "default"
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"; e.currentTarget.style.transform = "translateY(-2px)" }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "translateY(0)" }}
    >
      {/* Top */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#111827", fontFamily: "'DM Mono',monospace" }}>{bus.routeNo}</span>
            {bus.liveStatus && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6366f1", fontWeight: 600 }}>
                <span className="bp-live-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
                LIVE
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {bus.from} <span style={{ color: "#d1d5db" }}>→</span> {bus.to}
          </p>
          {bus.liveStatus && (
            <p style={{ fontSize: 11, color: "#4f46e5", margin: "4px 0 0", fontWeight: 500 }}>
              {liveStatusLabel(bus.liveStatus)}
              {bus.delayMinutes > 0 ? ` · +${bus.delayMinutes} min delay` : ""}
              {bus.confidenceScore ? ` · ${Math.round(bus.confidenceScore)}% confidence` : ""}
            </p>
          )}
          {bus.recommendationType === "TRANSFER_SUGGESTION" && bus.recommendationNote && (
            <p style={{ fontSize: 11, color: "#d97706", margin: "4px 0 0", fontWeight: 500 }}>🔄 {bus.recommendationNote}</p>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{formatEta(bus.eta)}</p>
          <span className={`bp-badge ${badgeClass}`} style={{ marginTop: 6, display: "inline-block" }}>{statusLabel}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#f3f4f6", margin: "14px 0" }} />

      {/* Bottom */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {bus.liveStatus
            ? <span style={{ fontSize: 12, color: "#4f46e5", fontWeight: 600 }}>
              {bus.reportCount || 0} report{bus.reportCount !== 1 ? "s" : ""}
            </span>
            : <span className={`${confClass}`} style={{ fontSize: 12, fontWeight: 600 }}>
              {bus.confidence} confidence
            </span>}
          {bus.distance && <span style={{ fontSize: 11, color: "#9ca3af" }}>· {bus.distance}m away</span>}
        </div>
        <button className="bp-track-btn" onClick={() => onTrack(bus)}>Track →</button>
      </div>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────── */

export default function UpcomingBuses({ location, onChangeLocation }) {
  const { token } = useUserAuth();
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [areaName, setAreaName] = useState("your location");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [trackingBus, setTrackingBus] = useState(null);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationResults, setDestinationResults] = useState([]);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const lastLoggedRef = useRef({ key: "", at: 0 });
  const firstDestRef = useRef(true);

  const fetchAreaName = async () => {
    if (!location) return "Current location";
    try {
      const res = await fetch(`${NOMINATIM}/reverse?format=json&lat=${location.lat}&lon=${location.lng}`);
      const data = await res.json();
      if (data?.address) {
        const label = data.address.suburb || data.address.neighbourhood || data.address.village || data.address.town || data.address.city || "Current location";
        setAreaName(label); return label;
      }
    } catch { }
    setAreaName("Current location"); return "Current location";
  };

  const loadBuses = async ({ logActivity = false } = {}) => {
    if (!location) { setError("Location not available"); setLoading(false); return; }
    setLoading(true); setError(null);
    const area = await fetchAreaName();
    try {
      const response = await fetchUpcomingBuses({
        lat: location.lat, lng: location.lng, maxMinutes: 60, logActivity,
        destinationLat: selectedDestination?.lat, destinationLng: selectedDestination?.lng,
        destinationName: selectedDestination?.name, destinationId: selectedDestination?.id,
      });
      if (response.success) {
        const list = response.buses || [];
        setBuses(list); setLastUpdated(new Date());
        if (token && logActivity) {
          const dk = selectedDestination?.id || selectedDestination?.name || "none";
          const key = `${location.lat.toFixed(4)},${location.lng.toFixed(4)}:${dk}:${list.length}`;
          const now = Date.now();
          if (!(lastLoggedRef.current.key === key && now - lastLoggedRef.current.at < 15000)) {
            lastLoggedRef.current = { key, at: now };
            fetch(`${API}/api/user/activity/log`, {
              method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                fromLat: location.lat, fromLng: location.lng, fromLabel: area || "Current location",
                toPlaceId: selectedDestination?.id ?? null, toPlaceName: selectedDestination?.name ?? null, busesFound: list.length
              }),
            }).catch(() => { });
          }
        }
      } else { setError(response.error || "Failed to fetch buses"); }
    } catch { setError("Unable to fetch upcoming buses. Please try again."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBuses({ logActivity: true }); }, [location]);
  useEffect(() => {
    if (firstDestRef.current) { firstDestRef.current = false; return; }
    loadBuses({ logActivity: true });
  }, [selectedDestination]);
  useEffect(() => {
    const iv = setInterval(loadBuses, 30000);
    return () => clearInterval(iv);
  }, [location, selectedDestination]);
  useEffect(() => {
    const q = destinationQuery.trim();
    if (q.length < 2) { setDestinationResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const places = await searchDestinationPlaces(q);
        setDestinationResults(places.map((p, i) => ({
          id: p.place_id || `osm-${i}`,
          name: p.address?.hamlet || p.address?.village || p.address?.town || p.address?.city || p.display_name?.split(",")?.[0] || "Unknown",
          subtitle: [p.address?.state_district || p.address?.county, p.address?.state].filter(Boolean).join(", "),
          lat: Number(p.lat), lng: Number(p.lon),
        })));
        setDestinationOpen(true);
      } catch { setDestinationResults([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [destinationQuery]);

  return (
    <>
      <div className="bp-root" style={{ minHeight: "100vh", background: "#f9fafb", padding: "24px 16px 40px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 440 }}>

          {/* Header */}
          <div style={{ marginBottom: 24, animation: "bp-fade-up 0.4s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 26 }}>🚌</span>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>Buses near you</h2>
            </div>
            <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#10b981" }} />
              <span>Near <b style={{ color: "#374151" }}>{areaName}</b> · next 60 min</span>
            </p>

            {/* Destination search */}
            <div style={{ position: "relative", marginBottom: 10 }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" }}>📍</span>
              <input className="bp-input" style={{ paddingLeft: 36 }}
                type="text"
                value={selectedDestination ? selectedDestination.name : destinationQuery}
                onChange={e => { setSelectedDestination(null); setDestinationQuery(e.target.value); setDestinationOpen(true); }}
                onFocus={() => setDestinationOpen(true)}
                placeholder="Filter by destination (e.g. Sankarankovil)"
              />
              {selectedDestination && (
                <button onClick={() => { setSelectedDestination(null); setDestinationQuery(""); setDestinationResults([]); setDestinationOpen(false); }}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "#e5e7eb", borderRadius: 20, padding: "2px 8px", fontSize: 11, cursor: "pointer", color: "#6b7280", fontWeight: 600 }}>
                  ✕ Clear
                </button>
              )}
              {destinationOpen && !selectedDestination && destinationResults.length > 0 && (
                <div className="bp-dropdown">
                  {destinationResults.map(p => (
                    <button key={p.id} className="bp-dropdown-item" onClick={() => { setSelectedDestination(p); setDestinationQuery(p.name); setDestinationOpen(false); }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{p.name}</div>
                      {p.subtitle && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{p.subtitle}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDestination && (
              <div style={{ background: "#d1fae5", borderRadius: 10, padding: "7px 12px", fontSize: 12, color: "#065f46", fontWeight: 500, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <span>✅</span> Showing buses towards <b>{selectedDestination.name}</b>
              </div>
            )}
            {selectedDestination && buses.some(b => b.recommendationType === "TRANSFER_SUGGESTION") && (
              <div style={{ background: "#fffbeb", borderRadius: 10, padding: "7px 12px", fontSize: 12, color: "#92400e", fontWeight: 500, display: "flex", gap: 6 }}>
                <span>🔄</span> No direct bus. Showing transfer options.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <button onClick={onChangeLocation} style={{ border: "none", background: "transparent", color: "#059669", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>
                📌 Change location
              </button>
              {lastUpdated && (
                <span style={{ fontSize: 11, color: "#9ca3af" }}>Updated {lastUpdated.toLocaleTimeString()}</span>
              )}
            </div>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[0, 1, 2].map(i => <SkeletonCard key={i} delay={i * 80} />)}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: "16px", marginBottom: 16, animation: "bp-fade-up 0.3s ease" }}>
              <p style={{ color: "#dc2626", fontSize: 14, margin: "0 0 8px" }}>{error}</p>
              <button onClick={loadBuses} style={{ border: "none", background: "transparent", color: "#b91c1c", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>Try again →</button>
            </div>
          )}

          {/* Bus list */}
          {!loading && !error && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {buses.length === 0 ? (
                <div style={{ textAlign: "center", background: "#fff", borderRadius: 24, padding: "40px 24px", border: "1px solid #f3f4f6", animation: "bp-fade-up 0.4s ease" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🚏</div>
                  <p style={{ fontSize: 17, fontWeight: 600, color: "#374151", margin: "0 0 6px" }}>No buses arriving soon</p>
                  <p style={{ fontSize: 13, color: "#9ca3af", margin: "0 0 16px" }}>Check back in a few minutes</p>
                  <button className="bp-track-btn" style={{ padding: "10px 24px" }} onClick={loadBuses}>Refresh</button>
                </div>
              ) : (
                buses.map((bus, i) => (
                  <BusCard key={`${bus.serviceId}-${i}`} bus={bus} index={i} onTrack={setTrackingBus} />
                ))
              )}
            </div>
          )}

          {/* Refresh */}
          {!loading && buses.length > 0 && (
            <div style={{ marginTop: 20, animation: "bp-fade-up 0.5s ease 0.2s both" }}>
              <button className="bp-refresh-btn" onClick={loadBuses}>↻ Refresh Buses</button>
            </div>
          )}
        </div>
      </div>

      {trackingBus && (
        <TrackModal bus={trackingBus} userLocation={location} token={token} onClose={() => setTrackingBus(null)} />
      )}
    </>
  );
}