import { useState, useEffect } from "react";
import { useUserAuth } from "../../context/UserAuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function UserActivity() {
  const { token } = useUserAuth();
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | today | week

  useEffect(() => {
    fetch(`${API}/api/user/activity`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setActivity(d.data || [])).finally(() => setLoading(false));
  }, [token]);

  const now = new Date();
  const filtered = activity.filter(a => {
    const d = new Date(a.searched_at);
    if (filter === "today") return d.toDateString() === now.toDateString();
    if (filter === "week") return (now - d) < 7 * 864e5;
    return true;
  });

  // Group by date
  const grouped = {};
  filtered.forEach(a => {
    const d = new Date(a.searched_at);
    const key = d.toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
    (grouped[key] = grouped[key] || []).push(a);
  });

  return (
    <div>
      <div style={s.header}>
        <div>
          <h2 style={s.title}>🕐 Activity History</h2>
          <p style={s.subtitle}>{activity.length} total searches</p>
        </div>
        <div style={s.filters}>
          {["all","today","week"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}>
              {f === "all" ? "All time" : f === "today" ? "Today" : "This week"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={s.empty}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={s.emptyBox}>
          <div style={{ fontSize:"48px", marginBottom:"12px" }}>🔍</div>
          <div style={{ fontWeight:"600", color:"#f1f5f9", marginBottom:"8px" }}>No activity found</div>
          <div style={{ color:"#64748b", fontSize:"13px" }}>Your bus searches will appear here</div>
        </div>
      ) : (
        Object.entries(grouped).map(([dateStr, items]) => (
          <div key={dateStr} style={s.group}>
            <div style={s.dateLabel}>{dateStr}</div>
            <div style={s.groupItems}>
              {items.map(a => <ActivityCard key={a.id} a={a} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ActivityCard({ a }) {
  const d = new Date(a.searched_at);
  const time = d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });

  return (
    <div style={s.card}>
      {/* Time column */}
      <div style={s.timeCol}>
        <div style={s.time}>{time}</div>
        <div style={s.dot}></div>
        <div style={s.line}></div>
      </div>

      {/* Details */}
      <div style={s.cardBody}>
        <div style={s.route}>
          <span style={s.from}>{a.from_label || "📍 Current location"}</span>
          <span style={s.arrow}>→</span>
          <span style={s.to}>{a.to_place_name || "Unknown destination"}</span>
        </div>

        <div style={s.meta}>
          <div style={s.badge}>
            <span style={{ color: a.buses_found > 0 ? "#22c55e" : "#f87171" }}>
              {a.buses_found > 0 ? "🚌" : "❌"}
            </span>
            {" "}{a.buses_found} bus{a.buses_found !== 1 ? "es" : ""} found
          </div>
          {a.from_lat && (
            <div style={s.coords}>
              📍 {Number(a.from_lat).toFixed(4)}, {Number(a.from_lng).toFixed(4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  header:  { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"24px", flexWrap:"wrap", gap:"12px" },
  title:   { fontSize:"20px", fontWeight:"700", color:"#f1f5f9", margin:"0 0 4px" },
  subtitle:{ fontSize:"13px", color:"#64748b", margin:0 },
  filters: { display:"flex", gap:"8px", background:"#1e293b", borderRadius:"10px", padding:"4px" },
  filterBtn:{ padding:"7px 16px", borderRadius:"8px", border:"none", background:"none",
              color:"#64748b", fontSize:"13px", fontWeight:"600", cursor:"pointer" },
  filterActive:{ background:"#22c55e", color:"#fff" },
  group:   { marginBottom:"28px" },
  dateLabel:{ fontSize:"12px", fontWeight:"700", color:"#64748b", textTransform:"uppercase",
              letterSpacing:"1px", marginBottom:"12px", paddingLeft:"52px" },
  groupItems:{ display:"flex", flexDirection:"column", gap:"8px" },
  card:    { display:"flex", gap:"0", background:"#1e293b", borderRadius:"12px", overflow:"hidden",
             border:"1px solid rgba(255,255,255,0.06)" },
  timeCol: { width:"52px", display:"flex", flexDirection:"column", alignItems:"center", padding:"14px 0",
             background:"rgba(255,255,255,0.02)", flexShrink:0 },
  time:    { fontSize:"11px", color:"#64748b", fontWeight:"600", marginBottom:"6px" },
  dot:     { width:"8px", height:"8px", borderRadius:"50%", background:"#22c55e" },
  line:    { flex:1, width:"2px", background:"rgba(34,197,94,0.15)", marginTop:"4px" },
  cardBody:{ flex:1, padding:"14px 16px" },
  route:   { display:"flex", alignItems:"center", gap:"8px", marginBottom:"8px", flexWrap:"wrap" },
  from:    { fontSize:"13px", color:"#94a3b8" },
  arrow:   { color:"#22c55e", fontWeight:"700" },
  to:      { fontSize:"13px", fontWeight:"700", color:"#f1f5f9" },
  meta:    { display:"flex", gap:"16px", flexWrap:"wrap" },
  badge:   { fontSize:"12px", color:"#94a3b8" },
  coords:  { fontSize:"11px", color:"#475569" },
  empty:   { color:"#64748b", textAlign:"center", padding:"40px" },
  emptyBox:{ textAlign:"center", padding:"60px 20px", background:"#1e293b", borderRadius:"16px",
             border:"1px solid rgba(255,255,255,0.06)" },
};
