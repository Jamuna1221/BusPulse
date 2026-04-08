import { useState, useEffect, useCallback } from "react";
import {
  Plus, Edit2, Trash2, X, Search, ChevronDown, ChevronRight,
  Clock, RefreshCw, AlertCircle, Zap, AlertTriangle, Navigation,
} from "lucide-react";
import { schedulerServicesAPI } from "../../config/api.js";

const MODE = {
  ADD_DEPARTURE:  "ADD_DEPARTURE",
  ADD_DEPARTURES: "ADD_DEPARTURES",
  EDIT_DEPARTURE: "EDIT_DEPARTURE",
  ADD_ROUTE:      "ADD_ROUTE",
};

function timeToMinutes(t) {
  const [h, m] = String(t).slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

function getCurrentTimeStr() {
  const n = new Date();
  return `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const r = (d) => d * Math.PI / 180;
  const dLat = r(lat2 - lat1);
  const dLng = r(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateBusPosition(bus) {
  const geo = bus.route_geometry || [];
  if (!geo.length) return null;
  const cur = timeToMinutes(getCurrentTimeStr());
  const dep = timeToMinutes(bus.departure_time);
  const elapsed = cur - dep;
  if (elapsed <= 0) return geo[0];
  const avgKmPerMin = 18 / 60;
  const dist = Math.max(0, elapsed) * avgKmPerMin;
  let acc = 0;
  for (let i = 1; i < geo.length; i++) {
    const seg = haversineKm(geo[i - 1].lat, geo[i - 1].lng, geo[i].lat, geo[i].lng);
    if (acc + seg >= dist) {
      const f = seg > 0 ? (dist - acc) / seg : 0;
      return {
        lat: geo[i - 1].lat + f * (geo[i].lat - geo[i - 1].lat),
        lng: geo[i - 1].lng + f * (geo[i].lng - geo[i - 1].lng),
      };
    }
    acc += seg;
  }
  return geo[geo.length - 1];
}

function SchedulerTrackMap({ bus }) {
  const [ready, setReady] = useState(false);
  const mapRef = useState(() => ({ current: null }))[0];
  const mapInst = useState(() => ({ current: null }))[0];
  const busMarker = useState(() => ({ current: null }))[0];

  useEffect(() => {
    if (!document.getElementById("leaflet-css-scheduler")) {
      const l = document.createElement("link");
      l.id = "leaflet-css-scheduler";
      l.rel = "stylesheet";
      l.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(l);
    }
    const init = () => {
      const L = window.L;
      if (!L || !mapRef.current || mapInst.current) return;
      const geo = bus.route_geometry || [];
      const busPos = estimateBusPosition(bus) || geo[0];
      if (!busPos) return;
      mapInst.current = L.map(mapRef.current, { zoomControl: true }).setView([busPos.lat, busPos.lng], 11);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 18 }).addTo(mapInst.current);
      if (geo.length > 1) {
        L.polyline(geo.map((p) => [p.lat, p.lng]), { color: "#059669", weight: 4, opacity: 0.85 }).addTo(mapInst.current);
        L.circleMarker([geo[0].lat, geo[0].lng], { radius: 6, color: "#059669", fillColor: "#059669", fillOpacity: 1 }).addTo(mapInst.current).bindPopup(`<b>From:</b> ${bus.from_place}`);
        const last = geo[geo.length - 1];
        L.circleMarker([last.lat, last.lng], { radius: 6, color: "#dc2626", fillColor: "#dc2626", fillOpacity: 1 }).addTo(mapInst.current).bindPopup(`<b>To:</b> ${bus.to_place}`);
      }
      const busIcon = L.divIcon({ html: `<div style="background:#f59e0b;width:28px;height:28px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 10px rgba(0,0,0,0.25)">🚌</div>`, iconSize: [28, 28], iconAnchor: [14, 14], className: "" });
      busMarker.current = L.marker([busPos.lat, busPos.lng], { icon: busIcon }).addTo(mapInst.current).bindPopup(`<b>${bus.route_no}</b><br>${bus.from_place} → ${bus.to_place}`);
      setReady(true);
    };
    if (window.L) init();
    else {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      s.onload = init;
      document.body.appendChild(s);
    }
    const iv = setInterval(() => {
      const pos = estimateBusPosition(bus);
      if (pos && busMarker.current) busMarker.current.setLatLng([pos.lat, pos.lng]);
    }, 10000);
    return () => {
      clearInterval(iv);
      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, [bus.service_id]);

  return (
    <div className="w-full h-[320px] rounded-xl border border-slate-700 overflow-hidden bg-slate-900">
      {!ready && <div className="h-full flex items-center justify-center text-sm text-gray-500">Loading map...</div>}
      <div ref={(el) => (mapRef.current = el)} className="w-full h-full" />
    </div>
  );
}

function SchedulerTrackModal({ bus, onClose }) {
  const cur = timeToMinutes(getCurrentTimeStr());
  const dep = timeToMinutes(bus.departure_time);
  const elapsed = cur - dep;
  const liveStatus = bus.live_status ? String(bus.live_status).replaceAll("_", " ") : "No live status";
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-3xl p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">{bus.route_no} · Live Track</h3>
            <p className="text-sm text-gray-400 mt-0.5">{bus.from_place} → {bus.to_place}</p>
            <p className="text-xs text-gray-500 mt-1">
              {elapsed < 0 ? `Departs in ${Math.abs(elapsed)} min` : `Departed ${elapsed} min ago`} · Status: {liveStatus}
            </p>
            {bus.status_note && <p className="text-xs text-amber-300 mt-1">{bus.status_note}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        {Array.isArray(bus.route_geometry) && bus.route_geometry.length > 0 ? (
          <SchedulerTrackMap bus={bus} />
        ) : (
          <div className="h-[240px] rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center text-gray-500 text-sm">
            No route geometry available for this service.
          </div>
        )}
      </div>
    </div>
  );
}

const ScheduleManagement = () => {
  const [grouped,   setGrouped]   = useState([]);
  const [routes,    setRoutes]    = useState([]);
  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [search,    setSearch]    = useState("");
  const [routeId,   setRouteId]   = useState("");
  const [expanded,  setExpanded]  = useState(new Set());
  const [mode,      setMode]      = useState(null);
  const [target,    setTarget]    = useState(null);
  const [form,      setForm]      = useState({});
  const [saving,         setSaving]        = useState(false);
  const [formError,      setFormError]     = useState(null);
  const [saveResult,     setSaveResult]    = useState(null);
  const [timeFilter, setTimeFilter] = useState("NONE"); // NONE | NEXT_HOUR | ACTIVE_NOW
  const [trackingBus, setTrackingBus] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  // Time helpers for robust filtering (handles midnight wrap too)
  const toMinutes = (hhmm) => {
    if (!hhmm) return null;
    const normalized = String(hhmm).slice(0, 5);
    const [h, m] = normalized.split(":").map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  };
  const nowMinutes = () => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  };
  const isDepartureInNextHour = (departureTime) => {
    const dep = toMinutes(departureTime);
    if (dep == null) return false;
    const now = nowMinutes();
    const futureDiff = (dep - now + 1440) % 1440;
    return futureDiff >= 0 && futureDiff <= 60;
  };
  const isDepartureActiveNow = (departureTime) => {
    const dep = toMinutes(departureTime);
    if (dep == null) return false;
    const now = nowMinutes();
    const pastDiff = (now - dep + 1440) % 1440;
    return pastDiff >= 0 && pastDiff <= 60;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [servicesRes, routesRes] = await Promise.all([
        schedulerServicesAPI.getAll({ search, routeId }),
        schedulerServicesAPI.getRoutes(),
      ]);
      setGrouped(servicesRes.data || []);
      setStats(servicesRes.stats || null);
      setRoutes(routesRes.data || []);
      if (servicesRes.data?.length === 1) {
        setExpanded(new Set([servicesRes.data[0].route_id]));
      }
    } catch (err) {
      setError(err.message || "Failed to load schedules");
    } finally {
      setLoading(false);
    }
  }, [search, routeId]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);


  const nextHourDeparturesCount = grouped.reduce(
    (acc, route) => acc + route.departures.filter((d) => isDepartureInNextHour(d.departure_time)).length,
    0
  );
  const activeNowDeparturesCount = grouped.reduce(
    (acc, route) => acc + route.departures.filter((d) => isDepartureActiveNow(d.departure_time)).length,
    0
  );

  // Filter grouped routes by selected time filter
  const displayedGrouped = (() => {
    if (timeFilter === "NONE") return grouped;
    const matcher =
      timeFilter === "NEXT_HOUR" ? isDepartureInNextHour : isDepartureActiveNow;
    return grouped
      .map((route) => ({
        ...route,
        departures: route.departures.filter((d) => matcher(d.departure_time)),
      }))
      .filter((route) => route.departures.length > 0);
  })();

  const toggleExpand = (id) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const openAddDeparture  = (route) => { setMode(MODE.ADD_DEPARTURE);  setTarget(route); setForm({ route_id: route.route_id, departure_time: "" }); setFormError(null); };
  const openAddDepartures = (route) => { setMode(MODE.ADD_DEPARTURES); setTarget(route); setForm({ route_id: route.route_id, departure_times: "" }); setFormError(null); };
  const openEditDeparture = (svc, route) => { setMode(MODE.EDIT_DEPARTURE); setTarget({ svc, route }); setForm({ departure_time: svc.departure_time }); setFormError(null); };
  const openAddRoute      = () => { setMode(MODE.ADD_ROUTE); setTarget(null); setForm({ route_no: "", from_place: "", to_place: "", distance_km: "", departure_times: "" }); setFormError(null); setSaveResult(null); };
  const closeModal        = () => { setMode(null); setFormError(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      let result;
      if (mode === MODE.ADD_DEPARTURE)  result = await schedulerServicesAPI.addDeparture({ route_id: form.route_id, departure_time: form.departure_time });
      if (mode === MODE.ADD_DEPARTURES) result = await schedulerServicesAPI.addDepartures({ route_id: form.route_id, departure_times: form.departure_times });
      if (mode === MODE.EDIT_DEPARTURE) result = await schedulerServicesAPI.updateDeparture(target.svc.service_id, { departure_time: form.departure_time });
      if (mode === MODE.ADD_ROUTE) {
        result = await schedulerServicesAPI.addRoute(form);
        setSaveResult(result); // show ETA-ready feedback before closing
        fetchData();
        setSaving(false);
        return; // keep modal open to show result
      }
      closeModal();
      fetchData();
    } catch (err) {
      setFormError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (svc, route) => {
    if (!confirm(`Remove ${svc.departure_time} from ${route.route_no} (${route.from_place} → ${route.to_place})?\n\nThis bus will no longer appear in ETA predictions.`)) return;
    try {
      await schedulerServicesAPI.deleteDeparture(svc.service_id);
      fetchData();
    } catch (err) {
      alert(err.message || "Failed to delete");
    }
  };

  const openTrack = async (svc) => {
    try {
      setTrackLoading(true);
      const res = await schedulerServicesAPI.getById(svc.service_id);
      setTrackingBus(res.data);
    } catch (err) {
      alert(err.message || "Failed to load tracking details.");
    } finally {
      setTrackLoading(false);
    }
  };

  const totalDepartures = displayedGrouped.reduce((a, r) => a + r.departures.length, 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Schedule Management</h1>
          <p className="text-gray-400 mt-1">Changes are live — affects ETA predictions in real time</p>
        </div>
        <button onClick={openAddRoute} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={18} /> Add New Route
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Services",    value: stats.total_services,       color: "text-blue-400",   filter: null },
            { label: "Active Routes",     value: stats.total_routes,         color: "text-green-400",  filter: null },
            { label: "Next Hour Departs", value: nextHourDeparturesCount,    color: "text-yellow-400", filter: "NEXT_HOUR" },
            { label: "Active Running Now", value: activeNowDeparturesCount,  color: "text-cyan-400",   filter: "ACTIVE_NOW" },
          ].map(s => (
            <div
              key={s.label}
              onClick={() =>
                s.filter && setTimeFilter((prev) => (prev === s.filter ? "NONE" : s.filter))
              }
              className={`bg-slate-800 border rounded-xl p-4 transition-all ${
                s.filter
                  ? "border-slate-700 cursor-pointer hover:border-cyan-400/50 hover:bg-slate-700/60 active:scale-95"
                  : "border-slate-700"
              } ${s.filter && timeFilter === s.filter ? "border-cyan-400 ring-1 ring-cyan-400/30" : ""}`}
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <p className="text-xs text-gray-400">{s.label}</p>
                {s.filter && (
                  <span className="text-xs text-cyan-400/60">
                    {timeFilter === s.filter ? "· click to clear" : "· click to filter"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search route number or place..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <select value={routeId} onChange={e => setRouteId(e.target.value)}
          className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="">All Routes</option>
          {routes.map(r => <option key={r.id} value={r.id}>{r.route_no} — {r.from_place} → {r.to_place}</option>)}
        </select>
        <button onClick={fetchData} className="p-2.5 border border-slate-700 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {!loading && displayedGrouped.length > 1 && (
        <div className="flex gap-3 text-sm">
          <button onClick={() => setExpanded(new Set(displayedGrouped.map(r => r.route_id)))} className="text-gray-400 hover:text-white">Expand all</button>
          <span className="text-gray-600">·</span>
          <button onClick={() => setExpanded(new Set())} className="text-gray-400 hover:text-white">Collapse all</button>
          <span className="text-gray-600">·</span>
          <span className="text-gray-500">{displayedGrouped.length} routes · {totalDepartures} departures</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          <AlertCircle size={18} /><span>{error}</span>
          <button onClick={fetchData} className="ml-auto text-sm underline">Retry</button>
        </div>
      )}

      {/* Next hour filter active banner */}
      {timeFilter !== "NONE" && (
        <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 px-4 py-2.5 rounded-lg text-sm">
          <Clock size={16} />
          <span>
            {timeFilter === "NEXT_HOUR"
              ? <>Showing departures in the <strong>next 60 minutes</strong> only</>
              : <>Showing buses that are likely <strong>running now</strong> (departed within last 60 minutes)</>}
            {" "}— {displayedGrouped.reduce((a, r) => a + r.departures.length, 0)} departure(s) across {displayedGrouped.length} route(s)
          </span>
          <button onClick={() => setTimeFilter("NONE")} className="ml-auto text-xs underline hover:text-cyan-200">Clear filter</button>
        </div>
      )}

      {/* Route cards */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 h-16 animate-pulse" />)}
        </div>
      ) : displayedGrouped.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          {search || routeId ? "No routes match your search" : "No schedules yet. Add a new route."}
        </div>
      ) : (
        <div className="space-y-2">
          {displayedGrouped.map(route => {
            const isOpen = expanded.has(route.route_id);
            return (
              <div key={route.route_id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/30 transition-colors select-none"
                  onClick={() => toggleExpand(route.route_id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    {isOpen ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold text-sm">{route.route_no}</span>
                        <span className="text-gray-300 text-sm">{route.from_place} → {route.to_place}</span>
                        {route.distance_km && <span className="text-xs text-gray-500">{route.distance_km} km</span>}
                        {/* ETA-ready indicator */}
                        {route.has_geometry
                          ? <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded"><Zap size={10} />ETA ready</span>
                          : <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded"><AlertTriangle size={10} />No geometry</span>
                        }
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">{route.departures.length} departure{route.departures.length !== 1 ? "s" : ""}</span>
                        {!isOpen && route.departures.slice(0, 5).map(d => (
                          <span key={d.service_id} className="text-xs bg-slate-700 text-gray-300 px-1.5 py-0.5 rounded font-mono">{d.departure_time}</span>
                        ))}
                        {!isOpen && route.departures.length > 5 && <span className="text-xs text-gray-500">+{route.departures.length - 5} more</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0" onClick={e => e.stopPropagation()}>
                    {route.departures.length > 0 && (
                      <button
                        onClick={() => openTrack(route.departures[0])}
                        className="flex items-center gap-1 text-xs text-cyan-300 hover:bg-cyan-400/10 px-2 py-1 rounded-lg transition-colors"
                        title="Track first running departure on this route"
                      >
                        <Navigation size={12} /> Track
                      </button>
                    )}
                    <button onClick={() => openAddDeparture(route)} className="flex items-center gap-1 text-xs text-green-400 hover:bg-green-400/10 px-2 py-1 rounded-lg transition-colors">
                      <Plus size={12} /> Time
                    </button>
                    <button onClick={() => openAddDepartures(route)} className="flex items-center gap-1 text-xs text-blue-400 hover:bg-blue-400/10 px-2 py-1 rounded-lg transition-colors">
                      <Plus size={12} /> Multiple
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-700 p-4">
                    {!route.has_geometry && (
                      <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-2 rounded-lg mb-3">
                        <AlertTriangle size={13} />
                        No route geometry — this route won't appear in ETA predictions. Try re-adding the route or check place coordinates.
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {route.departures.map(dep => (
                        <div key={dep.service_id} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg px-3 py-2 group transition-colors">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-white text-sm font-mono">{dep.departure_time}</span>
                          <div className="flex gap-1 ml-1">
                            <button
                              onClick={() => openTrack(dep)}
                              className="px-1.5 py-0.5 text-[10px] text-cyan-300 border border-cyan-400/40 rounded hover:bg-cyan-400/10"
                              title="Live track this departure"
                            >
                              Track
                            </button>
                            <button onClick={() => openEditDeparture(dep, route)} className="p-0.5 text-gray-400 hover:text-blue-400" title="Edit">
                              <Edit2 size={11} />
                            </button>
                            <button onClick={() => handleDelete(dep, route)} className="p-0.5 text-gray-400 hover:text-red-400" title="Remove">
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {mode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {mode === MODE.ADD_DEPARTURE  && "Add Departure Time"}
                  {mode === MODE.ADD_DEPARTURES && "Add Multiple Departures"}
                  {mode === MODE.EDIT_DEPARTURE && "Edit Departure Time"}
                  {mode === MODE.ADD_ROUTE      && "Add New Route"}
                </h2>
                {mode !== MODE.ADD_ROUTE && target && (
                  <p className="text-sm text-gray-400 mt-0.5">
                    {mode === MODE.EDIT_DEPARTURE
                      ? `${target.route.route_no} — ${target.route.from_place} → ${target.route.to_place}`
                      : `${target.route_no} — ${target.from_place} → ${target.to_place}`}
                  </p>
                )}
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            {/* Live warning */}
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-3 py-2 rounded-lg mb-4 text-xs">
              <Zap size={13} className="shrink-0" />
              Changes go <strong className="ml-1">live immediately</strong> — users see this in the app right now.
            </div>

            {/* Success result after adding route */}
            {saveResult && (
              <div className={`flex items-start gap-2 px-3 py-3 rounded-lg mb-4 text-sm border ${
                saveResult.eta_ready
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
              }`}>
                {saveResult.eta_ready ? <Zap size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                <div>
                  <p className="font-medium">{saveResult.eta_ready ? "Route created and ETA-ready!" : "Route created — geometry missing"}</p>
                  <p className="text-xs mt-0.5 opacity-80">{saveResult.message}</p>
                  <button onClick={closeModal} className="mt-2 text-xs underline opacity-70 hover:opacity-100">Close</button>
                </div>
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2.5 rounded-lg mb-4 text-sm">
                <AlertCircle size={15} /> {formError}
              </div>
            )}

            {/* Don't show form after successful route add */}
            {!saveResult && (
              <form onSubmit={handleSave} className="space-y-4">
                {mode === MODE.ADD_ROUTE && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Route Number <span className="text-red-400">*</span></label>
                      <input type="text" value={form.route_no} onChange={e => setForm({...form, route_no: e.target.value})}
                        placeholder="e.g. 163" required
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">From <span className="text-red-400">*</span></label>
                        <input type="text" value={form.from_place} onChange={e => setForm({...form, from_place: e.target.value})}
                          placeholder="Chennai" required
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">To <span className="text-red-400">*</span></label>
                        <input type="text" value={form.to_place} onChange={e => setForm({...form, to_place: e.target.value})}
                          placeholder="Madurai" required
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Distance (km) <span className="text-gray-500 text-xs">(optional)</span></label>
                      <input type="number" value={form.distance_km} onChange={e => setForm({...form, distance_km: e.target.value})}
                        placeholder="331"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Departure Times <span className="text-red-400">*</span>
                        <span className="text-gray-500 text-xs ml-1">— comma separated, e.g. 06.30, 09.15, 22.45</span>
                      </label>
                      <textarea value={form.departure_times} onChange={e => setForm({...form, departure_times: e.target.value})}
                        placeholder="06.30, 09.15, 14.00, 22.45" required rows={3}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                      <p className="text-xs text-gray-500 mt-1">
                        Place names will be geocoded automatically. Route geometry will be fetched from OSRM.
                        If places are already in the DB, existing coordinates are used.
                      </p>
                    </div>
                  </>
                )}

                {mode === MODE.ADD_DEPARTURE && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Departure Time <span className="text-red-400">*</span></label>
                    <input type="time" value={form.departure_time} onChange={e => setForm({...form, departure_time: e.target.value})} required
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                )}

                {mode === MODE.ADD_DEPARTURES && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Departure Times <span className="text-red-400">*</span>
                      <span className="text-gray-500 text-xs ml-1">comma separated</span>
                    </label>
                    <textarea value={form.departure_times} onChange={e => setForm({...form, departure_times: e.target.value})}
                      placeholder="03.00, 06.15, 07.30, 22.30" required rows={3}
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                    <p className="text-xs text-gray-500 mt-1">Accepts 06.30 or 06:30 — duplicates skipped automatically</p>
                  </div>
                )}

                {mode === MODE.EDIT_DEPARTURE && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      New Time <span className="text-red-400">*</span>
                      <span className="text-gray-500 text-xs ml-1">currently {target?.svc?.departure_time}</span>
                    </label>
                    <input type="time" value={form.departure_time} onChange={e => setForm({...form, departure_time: e.target.value})} required
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal}
                    className="flex-1 py-2.5 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors">Cancel</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors font-medium">
                    {saving
                      ? mode === MODE.ADD_ROUTE ? "Geocoding + fetching geometry..." : "Saving..."
                      : mode === MODE.EDIT_DEPARTURE ? "Update Time"
                      : mode === MODE.ADD_ROUTE ? "Create Route"
                      : "Add to Schedule"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {trackLoading && (
        <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-700 text-gray-200 px-3 py-2 rounded-lg text-sm">
          Loading live track...
        </div>
      )}
      {trackingBus && (
        <SchedulerTrackModal bus={trackingBus} onClose={() => setTrackingBus(null)} />
      )}
    </div>
  );
};

export default ScheduleManagement;