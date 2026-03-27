import { useState, useEffect } from "react";
import { useUserAuth } from "../../context/UserAuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LABELS = ["home", "work", "school", "hospital", "gym", "other"];
const ICONS  = { home:"🏠", work:"💼", school:"🏫", hospital:"🏥", gym:"🏋️", other:"⭐", star:"⭐", heart:"❤️" };

const EMPTY_FORM = { label:"other", name:"", address:"", lat:"", lng:"", icon:"star" };

export default function UserSavedPlaces() {
  const { token } = useUserAuth();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // place object
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = () => {
    setLoading(true);
    fetch(`${API}/api/user/saved-places`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setPlaces(d.data || [])).finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setError(""); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ label: p.label, name: p.name, address: p.address || "", lat: p.lat || "", lng: p.lng || "", icon: p.icon || "star" });
    setError(""); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError("Name is required.");
    setSaving(true); setError("");
    try {
      const url = editing
        ? `${API}/api/user/saved-places/${editing.id}`
        : `${API}/api/user/saved-places`;
      const res = await fetch(url, { method: editing ? "PUT" : "POST", headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setShowForm(false); load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this place?")) return;
    await fetch(`${API}/api/user/saved-places/${id}`, { method: "DELETE", headers });
    load();
  };

  // Group by label
  const grouped = {};
  places.forEach(p => { (grouped[p.label] = grouped[p.label] || []).push(p); });

  return (
    <div>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>📍 Saved Places</h2>
          <p style={s.subtitle}>Quick access during location search</p>
        </div>
        <button id="add-place-btn" onClick={openAdd} style={s.addBtn}>+ Add Place</button>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHead}>
              <span style={s.modalTitle}>{editing ? "Edit Place" : "Add New Place"}</span>
              <button onClick={() => setShowForm(false)} style={s.closeBtn}>✕</button>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.formGrid}>
              <div style={s.field}>
                <label style={s.label}>Category</label>
                <div style={s.labelRow}>
                  {LABELS.map(l => (
                    <button key={l} type="button"
                      style={{ ...s.labelChip, ...(form.label === l ? s.labelChipActive : {}) }}
                      onClick={() => setForm(f => ({ ...f, label: l, icon: l === "home" ? "home" : l === "work" ? "work" : l }))}>
                      {ICONS[l]} {l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Name *</label>
                <input style={s.input} placeholder="e.g. My Apartment" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div style={s.field}>
                <label style={s.label}>Address (optional)</label>
                <input style={s.input} placeholder="e.g. MG Road, Bengaluru" value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>

              <div style={s.row2}>
                <div style={s.field}>
                  <label style={s.label}>Lat</label>
                  <input style={s.input} type="number" step="any" placeholder="12.9716" value={form.lat}
                    onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Lng</label>
                  <input style={s.input} type="number" step="any" placeholder="77.5946" value={form.lng}
                    onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
                </div>
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

      {/* Places list */}
      {loading ? <div style={s.loading}>Loading…</div> :
       places.length === 0 ? (
         <div style={s.empty}>
           <div style={{ fontSize:"48px", marginBottom:"12px" }}>📍</div>
           <div style={{ fontWeight:"600", color:"#f1f5f9", marginBottom:"8px" }}>No saved places yet</div>
           <div style={{ color:"#64748b", fontSize:"13px", marginBottom:"20px" }}>Add your home, work or favourite spots. They'll appear as suggestions when searching for buses.</div>
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
                     {p.lat && <div style={s.placeCoords}>{Number(p.lat).toFixed(4)}, {Number(p.lng).toFixed(4)}</div>}
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

const s = {
  header: { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px" },
  title:  { fontSize:"20px", fontWeight:"700", color:"#f1f5f9", margin:"0 0 4px" },
  subtitle:{ fontSize:"13px", color:"#64748b", margin:0 },
  addBtn: { padding:"10px 20px", background:"linear-gradient(135deg,#22c55e,#16a34a)", border:"none",
            borderRadius:"10px", color:"#fff", fontWeight:"700", fontSize:"13px", cursor:"pointer" },
  overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex",
            alignItems:"center", justifyContent:"center", padding:"20px" },
  modal:  { background:"#1e293b", borderRadius:"20px", padding:"28px", width:"100%", maxWidth:"480px",
            border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 32px 80px rgba(0,0,0,0.5)" },
  modalHead:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" },
  modalTitle:{ fontSize:"17px", fontWeight:"700", color:"#f1f5f9" },
  closeBtn:{ background:"none", border:"none", color:"#64748b", fontSize:"18px", cursor:"pointer" },
  errorBox:{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", color:"#fca5a5",
             borderRadius:"8px", padding:"10px 14px", fontSize:"13px", marginBottom:"16px" },
  formGrid:{ display:"flex", flexDirection:"column", gap:"16px" },
  field:  { display:"flex", flexDirection:"column", gap:"6px" },
  label:  { fontSize:"12px", fontWeight:"600", color:"#94a3b8", textTransform:"uppercase", letterSpacing:"0.5px" },
  labelRow:{ display:"flex", flexWrap:"wrap", gap:"8px" },
  labelChip:{ padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.1)",
              background:"rgba(255,255,255,0.04)", color:"#94a3b8", fontSize:"12px", cursor:"pointer" },
  labelChipActive:{ background:"rgba(34,197,94,0.15)", border:"1px solid #22c55e", color:"#22c55e" },
  input:  { padding:"11px 14px", borderRadius:"10px", background:"#0f172a", border:"1.5px solid rgba(255,255,255,0.08)",
            color:"#f1f5f9", fontSize:"14px", outline:"none" },
  row2:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" },
  modalActions:{ display:"flex", gap:"12px", justifyContent:"flex-end", marginTop:"24px" },
  cancelBtn:{ padding:"10px 20px", borderRadius:"10px", background:"rgba(255,255,255,0.06)", border:"none",
              color:"#94a3b8", fontWeight:"600", fontSize:"14px", cursor:"pointer" },
  saveBtn:{ padding:"10px 24px", borderRadius:"10px", background:"linear-gradient(135deg,#22c55e,#16a34a)",
            border:"none", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer" },
  loading:{ color:"#64748b", padding:"40px", textAlign:"center" },
  empty:  { textAlign:"center", padding:"60px 20px", background:"#1e293b", borderRadius:"16px",
            border:"1px solid rgba(255,255,255,0.06)" },
  group:  { marginBottom:"24px" },
  groupLabel:{ fontSize:"13px", fontWeight:"700", color:"#64748b", textTransform:"uppercase",
               letterSpacing:"1px", marginBottom:"12px" },
  placesList:{ display:"flex", flexDirection:"column", gap:"8px" },
  placeCard: { display:"flex", gap:"14px", alignItems:"center", background:"#1e293b", borderRadius:"12px",
               padding:"14px 16px", border:"1px solid rgba(255,255,255,0.06)" },
  placeIcon: { width:"40px", height:"40px", background:"rgba(34,197,94,0.1)", borderRadius:"10px",
               display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 },
  placeInfo: { flex:1, minWidth:0 },
  placeName: { fontSize:"14px", fontWeight:"600", color:"#f1f5f9", marginBottom:"2px" },
  placeAddr: { fontSize:"12px", color:"#64748b", marginBottom:"2px" },
  placeCoords:{ fontSize:"11px", color:"#475569" },
  placeActions:{ display:"flex", gap:"8px" },
  editBtn:   { background:"rgba(255,255,255,0.06)", border:"none", borderRadius:"8px", padding:"7px 10px", cursor:"pointer", fontSize:"14px" },
  deleteBtn: { background:"rgba(239,68,68,0.08)", border:"none", borderRadius:"8px", padding:"7px 10px", cursor:"pointer", fontSize:"14px" },
};
