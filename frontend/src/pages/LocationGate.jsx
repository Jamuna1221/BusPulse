import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const ICONS = { home:"🏠", work:"💼", school:"🏫", hospital:"🏥", gym:"🏋️", other:"⭐", star:"⭐", heart:"❤️" };

const LocationGate = ({ onSuccess, onManualLocation }) => {
  const { user, token, logout } = useUserAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/user/saved-places`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setSavedPlaces(d.data || []))
      .catch(() => {});
  }, [token]);

  const handleLogout = () => { logout(); navigate("/user/login"); };

  const requestLocation = () => {
    if (!navigator.geolocation) return setError("Geolocation is not supported on this device.");
    setLoading(true); setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLoading(false); onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      (err) => {
        setLoading(false);
        setError(err.code === err.PERMISSION_DENIED
          ? "Location permission denied. Enable it in browser settings."
          : err.code === err.TIMEOUT ? "Location request timed out." : "Unable to retrieve location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const useSavedPlace = (place) => {
    if (place.lat && place.lng) {
      onSuccess({ lat: parseFloat(place.lat), lng: parseFloat(place.lng), label: place.name });
    } else {
      setError(`"${place.name}" has no coordinates saved. Edit it in your dashboard to add lat/lng.`);
    }
  };

  // Show home & work first, then rest
  const pinned = savedPlaces.filter(p => p.label === "home" || p.label === "work");
  const rest   = savedPlaces.filter(p => p.label !== "home" && p.label !== "work").slice(0, 3);
  const chips  = [...pinned, ...rest];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative"
      style={{ backgroundImage:"url('/map-bg.png')", backgroundSize:"cover", backgroundPosition:"center" }}>
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>

      <div className="relative max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 text-center">

        {/* User chip */}
        {user && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"8px",
                          background:"rgba(30,127,92,0.10)", borderRadius:"999px",
                          padding:"6px 14px 6px 8px", border:"1px solid rgba(30,127,92,0.25)" }}>
              <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:"#1E7F5C",
                            color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                            fontWeight:"700", fontSize:"12px" }}>
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <span style={{ fontSize:"13px", color:"#1B1F1D", fontWeight:"500" }}>{user.name}</span>
              <button id="logout-btn" onClick={handleLogout}
                style={{ marginLeft:"4px", background:"none", border:"none", color:"#5F6F68",
                         cursor:"pointer", fontSize:"12px", padding:"0", textDecoration:"underline" }}>
                Logout
              </button>
            </div>
            <button
              id="dashboard-btn"
              onClick={() => navigate("/user/dashboard")}
              style={{ padding:"6px 14px", borderRadius:"999px", background:"rgba(30,127,92,0.10)",
                       border:"1px solid rgba(30,127,92,0.25)", color:"#1E7F5C", fontSize:"12px",
                       fontWeight:"600", cursor:"pointer" }}>
              📊 Dashboard
            </button>
          </div>
        )}

        <h1 className="text-2xl font-semibold text-[#1B1F1D]">Welcome to BusPulse 👋</h1>
        <p className="mt-1 text-xs text-[#5F6F68]">Real-time buses • Nearby stops • Accurate ETAs</p>
        <p className="mt-4 text-sm text-[#5F6F68]">To show nearby bus stops and live bus locations, we need access to your location.</p>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {/* Saved Place Recommendations */}
        {chips.length > 0 && (
          <div style={{ marginTop:"16px", textAlign:"left" }}>
            <p style={{ fontSize:"11px", fontWeight:"700", color:"#64748b", textTransform:"uppercase",
                        letterSpacing:"0.5px", marginBottom:"8px" }}>Quick pick from your saved places</p>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
              {chips.map(p => (
                <button key={p.id} onClick={() => useSavedPlace(p)}
                  style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 12px",
                           borderRadius:"10px", background:"rgba(30,127,92,0.08)",
                           border:"1px solid rgba(30,127,92,0.2)", cursor:"pointer",
                           color:"#1B1F1D", fontSize:"12px", fontWeight:"500" }}>
                  <span>{ICONS[p.icon] || "📍"}</span>
                  <span>{p.name}</span>
                  {!p.lat && <span style={{ color:"#f87171", fontSize:"10px" }}>⚠️ no coords</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Enable Location */}
        <button onClick={requestLocation} disabled={loading}
          className="mt-6 w-full bg-[#1E7F5C] text-white py-3 rounded-xl font-medium hover:bg-[#16664A] transition disabled:opacity-50">
          {loading ? "Getting location..." : "Enable Location"}
        </button>

        <button className="mt-4 w-full text-sm text-[#5F6F68] underline" onClick={() => { setError(""); onSuccess(null); }}>
          Continue without location
        </button>
        <button className="mt-2 w-full text-sm text-[#1F4FD8] underline" onClick={onManualLocation}>
          Set location manually
        </button>
      </div>
    </div>
  );
};

export default LocationGate;
