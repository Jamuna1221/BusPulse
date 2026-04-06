import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useUserAuth } from "../../context/UserAuthContext";

const NAV = [
  { to: "overview",  icon: "🏠", label: "Overview" },
  { to: "places",    icon: "📍", label: "Saved Places" },
  { to: "activity",  icon: "🕐", label: "Activity" },
  { to: "profile",   icon: "👤", label: "Profile" },
];

export default function UserDashboardLayout() {
  const { user, logout } = useUserAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/user/login"); };

  return (
    <div style={s.root}>
      {/* ── Sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <span style={s.bus}>🚌</span>
          <span style={s.brand}>BusPulse</span>
        </div>

        {/* Avatar */}
        <div style={s.avatar}>
          <div style={s.avatarCircle}>{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div>
            <div style={s.avatarName}>{user?.name}</div>
            <div style={s.avatarEmail}>{user?.email}</div>
          </div>
        </div>

        <nav style={s.nav}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}>
              <span style={s.navIcon}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button id="dash-logout" onClick={handleLogout} style={s.logoutBtn}>
          <span>🚪</span> Logout
        </button>
      </aside>

      {/* ── Main ── */}
      <main style={s.main}>
        {/* Top bar */}
        <div style={s.topbar}>
          <span style={s.topbarTitle}>Dashboard</span>
          <button onClick={() => navigate("/home")} style={s.findBusBtn}>🚌 Find Buses</button>
        </div>
        <div style={s.content}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const s = {
  root:    { display:"flex", minHeight:"100vh", background:"#0f172a", fontFamily:"'Inter','Segoe UI',sans-serif", color:"#f1f5f9" },
  sidebar: { width:"250px", minHeight:"100vh", background:"#1e293b", borderRight:"1px solid rgba(255,255,255,0.06)",
             display:"flex", flexDirection:"column", padding:"24px 16px", flexShrink:0, position:"sticky", top:0 },
  logo:    { display:"flex", alignItems:"center", gap:"10px", marginBottom:"28px", paddingLeft:"8px" },
  bus:     { fontSize:"24px" },
  brand:   { fontSize:"18px", fontWeight:"800", color:"#22c55e" },
  avatar:  { display:"flex", alignItems:"center", gap:"12px", background:"rgba(255,255,255,0.04)",
             borderRadius:"12px", padding:"12px", marginBottom:"24px", border:"1px solid rgba(255,255,255,0.06)" },
  avatarCircle: { width:"38px", height:"38px", borderRadius:"50%", background:"#22c55e", color:"#fff",
                  display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"700", fontSize:"16px", flexShrink:0 },
  avatarName:  { fontSize:"13px", fontWeight:"600", color:"#f1f5f9" },
  avatarEmail: { fontSize:"11px", color:"#64748b", marginTop:"2px", wordBreak:"break-all" },
  nav:    { display:"flex", flexDirection:"column", gap:"4px", flex:1 },
  navItem: { display:"flex", alignItems:"center", gap:"12px", padding:"11px 14px", borderRadius:"10px",
             color:"#94a3b8", textDecoration:"none", fontSize:"14px", fontWeight:"500", transition:"all 0.15s" },
  navActive: { background:"rgba(34,197,94,0.12)", color:"#22c55e", borderLeft:"3px solid #22c55e" },
  navIcon: { fontSize:"18px", width:"22px", textAlign:"center" },
  logoutBtn: { display:"flex", alignItems:"center", gap:"10px", padding:"11px 14px", borderRadius:"10px",
               background:"none", border:"none", color:"#64748b", fontSize:"14px", cursor:"pointer",
               marginTop:"8px", width:"100%", transition:"color 0.15s" },
  topbar:  { display:"flex", alignItems:"center", justifyContent:"space-between",
             padding:"20px 28px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"#1e293b" },
  topbarTitle: { fontSize:"18px", fontWeight:"700", color:"#f1f5f9" },
  findBusBtn:  { padding:"9px 18px", borderRadius:"10px", background:"linear-gradient(135deg,#22c55e,#16a34a)",
                 color:"#fff", border:"none", cursor:"pointer", fontWeight:"600", fontSize:"13px" },
  main:    { flex:1, display:"flex", flexDirection:"column", minHeight:"100vh" },
  content: { padding:"28px", flex:1 },
};
