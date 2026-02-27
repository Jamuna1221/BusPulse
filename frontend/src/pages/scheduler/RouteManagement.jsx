import { useState } from "react";
import { Plus, Edit2, Trash2, X, Map, Search, MapPin, Clock } from "lucide-react";

const INITIAL_ROUTES = [
  { id: 1, routeNo: "R-101", from: "Madurai", to: "Theni", stops: ["Usilampatti", "Andipatti"], distanceKm: 76, estimatedTime: "2h 15m" },
  { id: 2, routeNo: "R-102", from: "Theni", to: "Bodinayakanur", stops: ["Chinnamanur"], distanceKm: 30, estimatedTime: "45m" },
  { id: 3, routeNo: "R-103", from: "Periyakulam", to: "Madurai", stops: ["Theni", "Usilampatti"], distanceKm: 95, estimatedTime: "2h 45m" },
  { id: 4, routeNo: "R-104", from: "Cumbum", to: "Theni", stops: ["Gudalur", "Uthamapalayam"], distanceKm: 45, estimatedTime: "1h 15m" },
  { id: 5, routeNo: "R-105", from: "Andipatti", to: "Madurai", stops: ["Usilampatti"], distanceKm: 55, estimatedTime: "1h 30m" },
];

const RouteManagement = () => {
  const [routes, setRoutes] = useState(INITIAL_ROUTES);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [form, setForm] = useState({ routeNo: "", from: "", to: "", stops: "", distanceKm: "", estimatedTime: "" });

  const filtered = routes.filter(
    (r) =>
      r.routeNo.toLowerCase().includes(search.toLowerCase()) ||
      r.from.toLowerCase().includes(search.toLowerCase()) ||
      r.to.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditingRoute(null);
    setForm({ routeNo: "", from: "", to: "", stops: "", distanceKm: "", estimatedTime: "" });
    setShowModal(true);
  };

  const openEdit = (route) => {
    setEditingRoute(route);
    setForm({ routeNo: route.routeNo, from: route.from, to: route.to, stops: route.stops.join(", "), distanceKm: route.distanceKm, estimatedTime: route.estimatedTime });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const stopsArray = form.stops.split(",").map((s) => s.trim()).filter(Boolean);
    if (editingRoute) {
      setRoutes(routes.map((r) => (r.id === editingRoute.id ? { ...r, ...form, stops: stopsArray, distanceKm: Number(form.distanceKm) } : r)));
    } else {
      setRoutes([...routes, { id: Date.now(), ...form, stops: stopsArray, distanceKm: Number(form.distanceKm) }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this route?")) setRoutes(routes.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Route Management</h1>
          <p className="text-gray-400 mt-1">Create and manage bus routes</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={18} /> Add Route
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search routes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Route Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((route) => (
          <div key={route.id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Map size={20} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">{route.routeNo}</h3>
                  <p className="text-gray-400 text-sm">{route.distanceKm} km</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(route)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(route.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-blue-400" />
                <span className="text-gray-300 text-sm">{route.from} → {route.to}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-orange-400" />
                <span className="text-gray-300 text-sm">{route.estimatedTime}</span>
              </div>
              {route.stops.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {route.stops.map((stop) => (
                    <span key={stop} className="text-xs bg-slate-700 text-gray-300 px-2 py-1 rounded-md">{stop}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingRoute ? "Edit Route" : "Add New Route"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {[
                { label: "Route Number", key: "routeNo", placeholder: "R-106" },
                { label: "From", key: "from", placeholder: "Start location" },
                { label: "To", key: "to", placeholder: "End location" },
                { label: "Stops (comma-separated)", key: "stops", placeholder: "Stop1, Stop2, Stop3" },
                { label: "Distance (km)", key: "distanceKm", placeholder: "76", type: "number" },
                { label: "Estimated Time", key: "estimatedTime", placeholder: "2h 15m" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
                  <input type={field.type || "text"} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} required={["routeNo", "from", "to"].includes(field.key)} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">{editingRoute ? "Save Changes" : "Add Route"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;
