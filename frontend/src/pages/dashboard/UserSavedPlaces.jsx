import { useState, useEffect, useRef } from "react";
import { useUserAuth } from "../../context/UserAuthContext";

const API        = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const NOMINATIM  = "https://nominatim.openstreetmap.org";

const LABELS = ["home", "work", "school", "hospital", "gym", "other"];
const ICONS  = { home:"🏠", work:"💼", school:"🏫", hospital:"🏥", gym:"🏋️", other:"⭐", star:"⭐", heart:"❤️" };

const EMPTY_FORM = { label:"other", name:"", address:"", lat:"", lng:"", icon:"star" };

/* ── Nominatim helpers (same logic as ManualLocation.jsx) ── */
async function searchPlaces(query) {
  const p1 = new URLSearchParams({ q:`${query}, Tamil Nadu, India`, format:"json", addressdetails:"1", limit:"6", countrycodes:"in", "accept-language":"en" });
  const r1  = await fetch(`${NOMINATIM}/search?${p1}`, { headers:{ "User-Agent":"BusPulse/1.0" } });
  const d1  = await r1.json();
  const tn  = d1.filter(p => p.address?.state === "Tamil Nadu");
  if (tn.length > 0) return tn;
  const p2 = new URLSearchParams({ q:`${query}, India`, format:"json", addressdetails:"1", limit:"8", countrycodes:"in", "accept-language":"en" });
  const r2  = await fetch(`${NOMINATIM}/search?${p2}`, { headers:{ "User-Agent":"BusPulse/1.0" } });
  const d2  = await r2.json();
  return d2.filter(p => p.address?.state === "Tamil Nadu");
}

async function reverseGeocode(lat, lng) {
  const res = await fetch(`${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`, { headers:{ "User-Agent":"BusPulse/1.0" } });
  return res.json();
}

function formatResult(data) {
  if (!data?.address) return data?.display_name || "Selected location";
  const a = data.address;
  return [a.hamlet || a.village || a.road || a.suburb || a.amenity, a.city || a.town || a.county, a.state].filter(Boolean).join(", ");
}

/* ── Main component ── */
export default function UserSavedPlaces() {
  const { token } = useUserAuth();
  const [places,   setPlaces]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");

  /* location-picker state */
  const [locQuery,    setLocQuery]    = useState("");
  const [locResults,  setLocResults]  = useState([]);
  const [locSearching,setLocSearching]= useState(false);
  const [locNoResult, setLocNoResult] = useState(false);
  const [locGpsing,   setLocGpsing]   = useState(false);
  const debounceRef = useRef(null);

  const headers = { Authorization:`Bearer ${token}`, "Content-Type":"application/json" };

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/user/saved-places`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r => r.json()).then(d => setPlaces(d.data || [])).finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  /* Debounced Nominatim search */
  useEffect(() => {
    if (locQuery.trim().length < 2) { setLocResults([]); setLocNoResult(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLocSearching(true); setLocNoResult(false);
      try {
        const data = await searchPlaces(locQuery);
        setLocResults(data); setLocNoResult(data.length === 0);
      } catch { setLocResults([]); setLocNoResult(true); }
      finally { setLocSearching(false); }
    }, 420);
    return () => clearTimeout(debounceRef.current);
  }, [locQuery]);

  const resetLocPicker = () => { setLocQuery(""); setLocResults([]); setLocNoResult(false); };

  const openAdd = () => {
    setEditing(null); setForm(EMPTY_FORM); setError(""); resetLocPicker(); setShowForm(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ label:p.label, name:p.name, address:p.address||"", lat:p.lat||"", lng:p.lng||"", icon:p.icon||"star" });
    /* pre-fill query with existing address so user sees what's saved */
    setLocQuery(p.address || (p.lat ? `${Number(p.lat).toFixed(5)}°N, ${Number(p.lng).toFixed(5)}°E` : ""));
    setLocResults([]); setLocNoResult(false);
    setError(""); setShowForm(true);
  };

  /* User picks a Nominatim result */
  const handleSelectResult = (place) => {
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const addr = formatResult(place);
    setForm(f => ({ ...f, lat, lng, address: addr }));
    setLocQuery(addr);
    setLocResults([]);
  };

  /* "Use my location" — GPS → reverse geocode */
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation not supported by your browser.");
    setLocGpsing(true); setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        try {
          const data = await reverseGeocode(lat, lng);
          const addr = formatResult(data);
          setForm(f => ({ ...f, lat, lng, address: addr }));
          setLocQuery(addr);
          setLocResults([]);
        } catch {
          setForm(f => ({ ...f, lat, lng }));
          setLocQuery(`${lat}°N, ${lng}°E`);
        } finally { setLocGpsing(false); }
      },
      () => { setError("Could not get your location."); setLocGpsing(false); }
    );
  };

  /* Clear chosen location */
  const clearLocation = () => {
    setForm(f => ({ ...f, lat:"", lng:"", address:"" }));
    resetLocPicker();
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError("Name is required.");
    setSaving(true); setError("");
    try {
      const url = editing ? `${API}/api/user/saved-places/${editing.id}` : `${API}/api/user/saved-places`;
      const res  = await fetch(url, { method: editing ? "PUT" : "POST", headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setShowForm(false); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this place?")) return;
    await fetch(`${API}/api/user/saved-places/${id}`, { method:"DELETE", headers });
    load();
  };

  const grouped = {};
  places.forEach(p => { (grouped[p.label] = grouped[p.label] || []).push(p); });

  /* ── Has a pinned location? ── */
  const hasPinnedLoc = form.lat !== "" && form.lng !== "";

  return (
    <div>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>📍 Saved Places</h2>
          <p style={s.subtitle}>Quick access during location search</p>
        </div>
        <button id="add-place-btn" onClick={openAdd} style={s.addBtn}>+ Add Place</button>
      </div>

      {/* ── Modal ── */}
      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHead}>
              <span style={s.modalTitle}>{editing ? "Edit Place" : "Add New Place"}</span>
              <button onClick={() => setShowForm(false)} style={s.closeBtn}>✕</button>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.formGrid}>
              {/* Category chips */}
              <div style={s.field}>
                <label style={s.label}>Category</label>
                <div style={s.labelRow}>
                  {LABELS.map(l => (
                    <button key={l} type="button"
                      style={{ ...s.labelChip, ...(form.label === l ? s.labelChipActive : {}) }}
                      onClick={() => setForm(f => ({ ...f, label:l, icon:l }))}>
                      {ICONS[l]} {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div style={s.field}>
                <label style={s.label}>Name *</label>
                <input style={s.input} placeholder="e.g. My Apartment" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name:e.target.value }))} />
              </div>

              {/* ── Smart Location Picker ── */}
              <div style={s.field}>
                <label style={s.label}>Location</label>

                {hasPinnedLoc ? (
                  /* — Pinned chip — */
                  <div style={s.pinnedChip}>
                    <span style={s.pinnedDot} />
                    <div style={s.pinnedText}>
                      <span style={s.pinnedAddr}>{form.address || "Custom location"}</span>
                      <span style={s.pinnedCoords}>{Number(form.lat).toFixed(5)}°N, {Number(form.lng).toFixed(5)}°E</span>
                    </div>
                    <button onClick={clearLocation} style={s.pinnedClear} title="Change location">✕</button>
                  </div>
                ) : (
                  <>
                    {/* Search input */}
                    <div style={{ position:"relative" }}>
                      <span style={s.searchIcon}>🔍</span>
                      <input
                        style={{ ...s.input, paddingLeft:"36px", paddingRight: locQuery ? "36px" : "14px" }}
                        placeholder="Search area, landmark, street…"
                        value={locQuery}
                        onChange={e => setLocQuery(e.target.value)}
                        autoComplete="off"
                      />
                      {locSearching
                        ? <span style={s.searchSpinner} />
                        : locQuery
                          ? <button onClick={resetLocPicker} style={s.searchClear}>×</button>
                          : null}
                    </div>

                    {/* Autocomplete results */}
                    {locResults.length > 0 && (
                      <div style={s.dropdown}>
                        {locResults.map((r, i) => (
                          <button key={r.place_id || i}
                            style={s.dropdownItem}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(34,197,94,0.08)"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            onClick={() => handleSelectResult(r)}>
                            <span style={{ fontSize:"16px", flexShrink:0 }}>📍</span>
                            <div style={{ minWidth:0 }}>
                              <div style={s.dItemPrimary}>{formatResult(r)}</div>
                              <div style={s.dItemSub}>{r.address?.state_district || r.address?.county} · {parseFloat(r.lat).toFixed(4)}°N</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No results hint */}
                    {locNoResult && !locSearching && (
                      <div style={s.noResult}>No places found for "{locQuery}". Try a different name.</div>
                    )}

                    {/* Use my location button */}
                    <button onClick={handleUseMyLocation} disabled={locGpsing} style={s.myLocBtn}>
                      {locGpsing
                        ? <><span style={s.gpsSpinner} /> Getting location…</>
                        : <>🎯 Use my current location</>}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={s.modalActions}>
              <button onClick={() => setShowForm(false)} style={s.cancelBtn}>Cancel</button>
              <button id="save-place-btn" onClick={handleSave} style={s.saveBtn} disabled={saving}>
                {saving ? "Saving…" : editing ? "Update" : "Save Place"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Places list ── */}
      {loading ? <div style={s.loading}>Loading…</div> :
       places.length === 0 ? (
         <div style={s.empty}>
           <div style={{ fontSize:"48px", marginBottom:"12px" }}>📍</div>
           <div style={{ fontWeight:"600", color:"#f1f5f9", marginBottom:"8px" }}>No saved places yet</div>
           <div style={{ color:"#64748b", fontSize:"13px", marginBottom:"20px" }}>Add your home, work or favourite spots.</div>
           <button onClick={openAdd} style={s.addBtn}>+ Add your first place</button>
         </div>
       ) : (
         Object.entries(grouped).map(([label, items]) => (
           <div key={label} style={s.group}>
             <div style={s.groupLabel}>{ICONS[label] || "📍"} {label.charAt(0).toUpperCase() + label.slice(1)}</div>
             <div style={s.placesList}>
               {items.map(p => (
                 <div key={p.id} style={s.placeCard}>
                   <div style={s.placeIcon}>{ICONS[p.icon] || "📍"}</div>
                   <div style={s.placeInfo}>
                     <div style={s.placeName}>{p.name}</div>
                     {p.address && <div style={s.placeAddr}>{p.address}</div>}
                     {p.lat && <div style={s.placeCoords}>{Number(p.lat).toFixed(4)}°N, {Number(p.lng).toFixed(4)}°E</div>}
                   </div>
                   <div style={s.placeActions}>
                     <button onClick={() => openEdit(p)} style={s.editBtn}>✏️</button>
                     <button onClick={() => handleDelete(p.id)} style={s.deleteBtn}>🗑️</button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         ))
       )
      }
    </div>
  );
}

/* ── Styles ── */
const s = {
  header:      { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" },
  title:       { fontSize:"20px", fontWeight:"700", color:"#f1f5f9", margin:"0 0 4px" },
  subtitle:    { fontSize:"13px", color:"#64748b", margin:0 },
  addBtn:      { padding:"10px 20px", background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none",
                 borderRadius:"10px", color:"#fff", fontWeight:"700", fontSize:"13px", cursor:"pointer" },

  overlay:     { position:"fixed", inset:0, background:"rgba(0,0,0,0.72)", zIndex:1000,
                 display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" },
  modal:       { background:"#1e293b", borderRadius:"20px", padding:"28px", width:"100%", maxWidth:"480px",
                 border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 32px 80px rgba(0,0,0,0.6)",
                 maxHeight:"90vh", overflowY:"auto" },
  modalHead:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" },
  modalTitle:  { fontSize:"17px", fontWeight:"700", color:"#f1f5f9" },
  closeBtn:    { background:"none", border:"none", color:"#64748b", fontSize:"18px", cursor:"pointer" },
  errorBox:    { background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)",
                 color:"#fca5a5", borderRadius:"8px", padding:"10px 14px", fontSize:"13px", marginBottom:"16px" },

  formGrid:    { display:"flex", flexDirection:"column", gap:"16px" },
  field:       { display:"flex", flexDirection:"column", gap:"6px" },
  label:       { fontSize:"12px", fontWeight:"600", color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px" },
  labelRow:    { display:"flex", flexWrap:"wrap", gap:"8px" },
  labelChip:   { padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)",
                 background:"rgba(255,255,255,0.04)", color:"#94a3b8", fontSize:"12px", cursor:"pointer" },
  labelChipActive:{ background:"rgba(34,197,94,0.15)", border:"1px solid #22c55e", color:"#22c55e" },
  input:       { padding:"11px 14px", borderRadius:"10px", background:"#0f172a",
                 border:"1.5px solid rgba(255,255,255,0.08)", color:"#f1f5f9", fontSize:"14px",
                 outline:"none", width:"100%", boxSizing:"border-box" },

  /* ── location picker ── */
  searchIcon:  { position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"14px", pointerEvents:"none" },
  searchSpinner:{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)",
                  width:"14px", height:"14px", border:"2px solid #22c55e", borderTopColor:"transparent",
                  borderRadius:"50%", animation:"lsp-spin 0.7s linear infinite",
                  /* inject keyframes via a sibling <style> tag */ },
  searchClear: { position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)",
                 background:"none", border:"none", cursor:"pointer", fontSize:"18px", color:"#64748b", lineHeight:1 },

  dropdown:    { background:"#0f172a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px",
                 overflow:"hidden", display:"flex", flexDirection:"column" },
  dropdownItem:{ display:"flex", alignItems:"flex-start", gap:"10px", padding:"11px 14px",
                 background:"transparent", border:"none", borderBottom:"1px solid rgba(255,255,255,0.05)",
                 cursor:"pointer", textAlign:"left", transition:"background 0.15s", width:"100%" },
  dItemPrimary:{ fontSize:"13px", fontWeight:"500", color:"#f1f5f9", margin:0,
                 overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  dItemSub:    { fontSize:"11px", color:"#64748b", margin:"2px 0 0" },

  noResult:    { fontSize:"12px", color:"#f59e0b", background:"rgba(245,158,11,0.08)",
                 border:"1px solid rgba(245,158,11,0.2)", borderRadius:"8px", padding:"9px 12px" },

  myLocBtn:    { display:"flex", alignItems:"center", gap:"7px", marginTop:"2px", padding:"10px 14px",
                 background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)",
                 borderRadius:"10px", color:"#22c55e", fontSize:"13px", fontWeight:"600",
                 cursor:"pointer", width:"100%", justifyContent:"center" },
  gpsSpinner:  { width:"13px", height:"13px", border:"2px solid #22c55e", borderTopColor:"transparent",
                 borderRadius:"50%", display:"inline-block", animation:"lsp-spin 0.7s linear infinite" },

  /* pinned chip */
  pinnedChip:  { display:"flex", alignItems:"center", gap:"10px", background:"rgba(34,197,94,0.08)",
                 border:"1px solid rgba(34,197,94,0.25)", borderRadius:"10px", padding:"12px 14px" },
  pinnedDot:   { width:"8px", height:"8px", borderRadius:"50%", background:"#22c55e", flexShrink:0,
                 boxShadow:"0 0 8px rgba(34,197,94,0.8)" },
  pinnedText:  { flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:"2px" },
  pinnedAddr:  { fontSize:"13px", fontWeight:"500", color:"#f1f5f9", overflow:"hidden",
                 textOverflow:"ellipsis", whiteSpace:"nowrap" },
  pinnedCoords:{ fontSize:"11px", color:"#64748b" },
  pinnedClear: { background:"none", border:"none", cursor:"pointer", fontSize:"16px", color:"#475569",
                 flexShrink:0, lineHeight:1 },

  modalActions:{ display:"flex", gap:"12px", justifyContent:"flex-end", marginTop:"24px" },
  cancelBtn:   { padding:"10px 20px", borderRadius:"10px", background:"rgba(255,255,255,0.06)",
                 border:"none", color:"#94a3b8", fontWeight:"600", fontSize:"14px", cursor:"pointer" },
  saveBtn:     { padding:"10px 24px", borderRadius:"10px", background:"linear-gradient(135deg,#22c55e,#16a34a)",
                 border:"none", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer" },

  loading:     { color:"#64748b", padding:"40px", textAlign:"center" },
  empty:       { textAlign:"center", padding:"60px 20px", background:"#1e293b", borderRadius:"16px",
                 border:"1px solid rgba(255,255,255,0.06)" },
  group:       { marginBottom:"24px" },
  groupLabel:  { fontSize:"13px", fontWeight:"700", color:"#64748b", textTransform:"uppercase",
                 letterSpacing:"1px", marginBottom:"12px" },
  placesList:  { display:"flex", flexDirection:"column", gap:"8px" },
  placeCard:   { display:"flex", gap:"14px", alignItems:"center", background:"#1e293b",
                 borderRadius:"12px", padding:"14px 16px", border:"1px solid rgba(255,255,255,0.06)" },
  placeIcon:   { width:"40px", height:"40px", background:"rgba(34,197,94,0.1)", borderRadius:"10px",
                 display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 },
  placeInfo:   { flex:1, minWidth:0 },
  placeName:   { fontSize:"14px", fontWeight:"600", color:"#f1f5f9", marginBottom:"2px" },
  placeAddr:   { fontSize:"12px", color:"#64748b", marginBottom:"2px" },
  placeCoords: { fontSize:"11px", color:"#475569" },
  placeActions:{ display:"flex", gap:"8px" },
  editBtn:     { background:"rgba(255,255,255,0.06)", border:"none", borderRadius:"8px", padding:"7px 10px", cursor:"pointer", fontSize:"14px" },
  deleteBtn:   { background:"rgba(239,68,68,0.08)", border:"none", borderRadius:"8px", padding:"7px 10px", cursor:"pointer", fontSize:"14px" },
};

/* Inject spinner keyframe once */
if (typeof document !== "undefined" && !document.getElementById("lsp-kf")) {
  const st = document.createElement("style");
  st.id = "lsp-kf";
  st.textContent = "@keyframes lsp-spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(st);
}
