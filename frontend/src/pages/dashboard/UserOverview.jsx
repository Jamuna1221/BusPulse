import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function UserOverview() {
  const { user, token } = useUserAuth();
  const [activity, setActivity] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API}/api/user/activity`, { headers }).then(r => r.json()),
      fetch(`${API}/api/user/saved-places`, { headers }).then(r => r.json()),
    ]).then(([act, pl]) => {
      setActivity(act.data || []);
      setPlaces(pl.data || []);
    }).finally(() => setLoading(false));
  }, [token]);

  const home = places.find(p => p.label === "home");
  const work = places.find(p => p.label === "work");

  return (
    <div>
      {/* Welcome Banner */}
      <div style={s.banner}>
        <div>
          <div style={s.hello}>Good day, {user?.name?.split(" ")[0]} 👋</div>
          <div style={s.sub}>Here's your BusPulse summary</div>
        </div>
        <Link to="/" style={s.findBtn}>🚌 Find Buses</Link>
      </div>

      {/* Quick Stats */}
      <div style={s.statsRow}>
        <StatCard icon="🔍" label="Total Searches" value={activity.length} color="#22c55e" />
        <StatCard icon="📍" label="Saved Places" value={places.length} color="#3b82f6" />
        <StatCard icon="🏠" label="Home" value={home?.name || "Not set"} color="#f59e0b" small />
        <StatCard icon="💼" label="Work" value={work?.name || "Not set"} color="#8b5cf6" small />
      </div>

      {/* Recent Activity */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          <span style={s.sectionTitle}>🕐 Recent Activity</span>
          <Link to="../activity" style={s.seeAll}>See all →</Link>
        </div>
        {loading ? <Skeleton /> : activity.length === 0
          ? <Empty text="No searches yet. Find your first bus!" />
          : activity.slice(0, 5).map(a => <ActivityRow key={a.id} a={a} />)
        }
      </div>

      {/* Saved Places Quick View */}
      <div style={s.section}>
        <div style={s.sectionHead}>
          <span style={s.sectionTitle}>📍 Saved Places</span>
          <Link to="../places" style={s.seeAll}>Manage →</Link>
        </div>
        {loading ? <Skeleton /> : places.length === 0
          ? <Empty text="Save your home, work, or favorite spots for quick access." />
          : <div style={s.placesGrid}>{places.slice(0, 4).map(p => <PlaceChip key={p.id} p={p} />)}</div>
        }
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, small }) {
  return (
    <div style={{ ...s.card, borderTop: `3px solid ${color}` }}>
      <div style={{ ...s.cardIcon, color }}>{icon}</div>
      <div style={s.cardValue}>{small ? <span style={s.cardSmall}>{value}</span> : value}</div>
      <div style={s.cardLabel}>{label}</div>
    </div>
  );
}

function ActivityRow({ a }) {
  const d = new Date(a.searched_at);
  return (
    <div style={s.actRow}>
      <div style={s.actIcon}>🔍</div>
      <div style={s.actInfo}>
        <div style={s.actTitle}>
          {a.from_label || "Current location"} → <strong>{a.to_place_name || "Unknown"}</strong>
        </div>
        <div style={s.actMeta}>
          {a.buses_found} bus{a.buses_found !== 1 ? "es" : ""} found &nbsp;•&nbsp;
          {d.toLocaleDateString("en-IN", { day:"numeric", month:"short" })} at{" "}
          {d.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
        </div>
      </div>
    </div>
  );
}

function PlaceChip({ p }) {
  const ICONS = { home:"🏠", work:"💼", star:"⭐", heart:"❤️", school:"🏫", hospital:"🏥" };
  return (
    <div style={s.placeChip}>
      <span style={s.placeChipIcon}>{ICONS[p.icon] || "📍"}</span>
      <div>
        <div style={s.placeChipName}>{p.name}</div>
        <div style={s.placeChipLabel}>{p.label}</div>
      </div>
    </div>
  );
}

function Skeleton() {
  return <div style={s.skeleton}></div>;
}
function Empty({ text }) {
  return <div style={s.empty}>{text}</div>;
}

const s = {
  banner: { background:"linear-gradient(135deg,rgba(34,197,94,0.12),rgba(59,130,246,0.08))",
            border:"1px solid rgba(34,197,94,0.2)", borderRadius:"16px", padding:"24px 28px",
            display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" },
  hello:  { fontSize:"22px", fontWeight:"700", color:"#f1f5f9", marginBottom:"4px" },
  sub:    { fontSize:"13px", color:"#64748b" },
  findBtn:{ padding:"10px 20px", background:"linear-gradient(135deg,#22c55e,#16a34a)", borderRadius:"10px",
            color:"#fff", fontWeight:"700", fontSize:"13px", textDecoration:"none" },
  statsRow:{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"28px" },
  card:   { background:"#1e293b", borderRadius:"14px", padding:"20px", border:"1px solid rgba(255,255,255,0.06)" },
  cardIcon:{ fontSize:"22px", marginBottom:"10px" },
  cardValue:{ fontSize:"26px", fontWeight:"800", color:"#f1f5f9", marginBottom:"4px" },
  cardSmall:{ fontSize:"14px", fontWeight:"600" },
  cardLabel:{ fontSize:"12px", color:"#64748b" },
  section:{ background:"#1e293b", borderRadius:"14px", padding:"20px 24px", marginBottom:"20px",
            border:"1px solid rgba(255,255,255,0.06)" },
  sectionHead:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" },
  sectionTitle:{ fontSize:"15px", fontWeight:"700", color:"#f1f5f9" },
  seeAll: { fontSize:"12px", color:"#22c55e", textDecoration:"none", fontWeight:"600" },
  actRow: { display:"flex", gap:"14px", alignItems:"flex-start", padding:"12px 0",
            borderBottom:"1px solid rgba(255,255,255,0.04)" },
  actIcon:{ width:"34px", height:"34px", background:"rgba(34,197,94,0.1)", borderRadius:"8px",
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 },
  actInfo:{ flex:1 },
  actTitle:{ fontSize:"13px", color:"#f1f5f9", marginBottom:"4px" },
  actMeta:{ fontSize:"11px", color:"#64748b" },
  placesGrid:{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"12px" },
  placeChip:{ display:"flex", gap:"12px", alignItems:"center", background:"rgba(255,255,255,0.03)",
              borderRadius:"10px", padding:"12px 14px", border:"1px solid rgba(255,255,255,0.06)" },
  placeChipIcon:{ fontSize:"22px" },
  placeChipName:{ fontSize:"13px", fontWeight:"600", color:"#f1f5f9" },
  placeChipLabel:{ fontSize:"11px", color:"#64748b", textTransform:"capitalize" },
  skeleton:{ height:"80px", background:"rgba(255,255,255,0.04)", borderRadius:"10px", animation:"pulse 1.5s infinite" },
  empty:  { color:"#475569", fontSize:"13px", textAlign:"center", padding:"28px 0" },
};
