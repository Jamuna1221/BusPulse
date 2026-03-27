import { useState, useEffect } from "react";
import { useUserAuth } from "../../context/UserAuthContext";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function UserProfile() {
  const { token, user: ctxUser, logout } = useUserAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetch(`${API}/api/user/profile`, { headers })
      .then(r => r.json()).then(d => {
        setProfile(d.data);
        setName(d.data?.name || "");
      });
  }, [token]);

  const handleSave = async () => {
    if (!name.trim()) return setMsg({ type: "error", text: "Name cannot be empty." });
    setSaving(true); setMsg({ type: "", text: "" });
    try {
      const res = await fetch(`${API}/api/user/profile`, {
        method: "PUT", headers, body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProfile(prev => ({ ...prev, name: data.data.name }));
      setMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (e) { setMsg({ type: "error", text: e.message }); }
    finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate("/user/login"); };

  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })
    : "—";
  const lastSeen = profile?.last_seen
    ? new Date(profile.last_seen).toLocaleString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })
    : "—";

  return (
    <div style={s.root}>
      {/* Avatar card */}
      <div style={s.avatarCard}>
        <div style={s.avatarBig}>{name?.[0]?.toUpperCase() || "U"}</div>
        <div>
          <div style={s.bigName}>{name || "—"}</div>
          <div style={s.bigEmail}>{profile?.email}</div>
          <div style={s.memberSince}>Member since {joined}</div>
        </div>
      </div>

      <div style={s.grid}>
        {/* Edit Name */}
        <div style={s.section}>
          <div style={s.sectionTitle}>👤 Personal Details</div>

          {msg.text && (
            <div style={msg.type === "success" ? s.successBox : s.errorBox}>{msg.text}</div>
          )}

          <div style={s.field}>
            <label style={s.label}>Full Name</label>
            <input id="profile-name" value={name} onChange={e => setName(e.target.value)}
              style={s.input} placeholder="Your name" />
          </div>

          <div style={s.field}>
            <label style={s.label}>Email address</label>
            <input value={profile?.email || ""} disabled style={{ ...s.input, opacity: 0.5, cursor: "not-allowed" }} />
          </div>

          <button id="save-profile" onClick={handleSave} style={s.saveBtn} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

        {/* Account Info */}
        <div style={s.section}>
          <div style={s.sectionTitle}>📊 Account Info</div>

          <div style={s.infoRow}>
            <span style={s.infoLabel}>Account type</span>
            <span style={s.badge}>USER</span>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Joined</span>
            <span style={s.infoVal}>{joined}</span>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoLabel}>Last seen</span>
            <span style={s.infoVal}>{lastSeen}</span>
          </div>

          <div style={s.danger}>
            <div style={s.sectionTitle}>⚠️ Danger Zone</div>
            <button onClick={handleLogout} style={s.logoutBtn}>
              🚪 Log out of this device
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  root:      { maxWidth: "800px" },
  avatarCard:{ display:"flex", alignItems:"center", gap:"20px", background:"linear-gradient(135deg,rgba(34,197,94,0.1),rgba(59,130,246,0.06))",
               borderRadius:"16px", padding:"24px 28px", marginBottom:"24px", border:"1px solid rgba(34,197,94,0.15)" },
  avatarBig: { width:"70px", height:"70px", borderRadius:"50%", background:"#22c55e", color:"#fff",
               display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"800", fontSize:"28px", flexShrink:0 },
  bigName:   { fontSize:"22px", fontWeight:"700", color:"#f1f5f9", marginBottom:"4px" },
  bigEmail:  { fontSize:"13px", color:"#94a3b8", marginBottom:"4px" },
  memberSince:{ fontSize:"12px", color:"#475569" },
  grid:      { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" },
  section:   { background:"#1e293b", borderRadius:"14px", padding:"22px", border:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", gap:"16px" },
  sectionTitle:{ fontSize:"14px", fontWeight:"700", color:"#f1f5f9" },
  field:     { display:"flex", flexDirection:"column", gap:"7px" },
  label:     { fontSize:"11px", fontWeight:"700", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.5px" },
  input:     { padding:"11px 14px", borderRadius:"10px", background:"#0f172a", border:"1.5px solid rgba(255,255,255,0.08)",
               color:"#f1f5f9", fontSize:"14px", outline:"none" },
  saveBtn:   { padding:"11px", borderRadius:"10px", background:"linear-gradient(135deg,#22c55e,#16a34a)",
               border:"none", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer", marginTop:"4px" },
  successBox:{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", color:"#86efac",
               borderRadius:"8px", padding:"10px 14px", fontSize:"13px" },
  errorBox:  { background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)", color:"#fca5a5",
               borderRadius:"8px", padding:"10px 14px", fontSize:"13px" },
  infoRow:   { display:"flex", justifyContent:"space-between", alignItems:"center",
               paddingBottom:"12px", borderBottom:"1px solid rgba(255,255,255,0.04)" },
  infoLabel: { fontSize:"13px", color:"#64748b" },
  infoVal:   { fontSize:"13px", color:"#f1f5f9", fontWeight:"500" },
  badge:     { padding:"3px 10px", background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.25)",
               color:"#22c55e", borderRadius:"6px", fontSize:"11px", fontWeight:"700" },
  danger:    { marginTop:"auto", paddingTop:"16px", borderTop:"1px solid rgba(239,68,68,0.15)", display:"flex", flexDirection:"column", gap:"12px" },
  logoutBtn: { padding:"10px 16px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)",
               borderRadius:"10px", color:"#f87171", fontSize:"13px", fontWeight:"600", cursor:"pointer" },
};
