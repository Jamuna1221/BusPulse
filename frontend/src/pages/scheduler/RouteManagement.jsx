import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, X, Map, Search, MapPin, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { schedulerRouteAPI } from "../../config/api.js";

const EMPTY_FORM = {
  route_no: "",
  from_place: "",
  to_place: "",
  stops: "",          // comma-separated string in the form, array when sent to API
  distance_km: "",
  estimated_time: "",
};

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // ── Fetch ─────────────────────────────────────────────────
  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await schedulerRouteAPI.getAll({ search });
      setRoutes(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchRoutes, 300);
    return () => clearTimeout(timer);
  }, [fetchRoutes]);

  // ── Modal helpers ─────────────────────────────────────────
  const openAdd = () => {
    setEditingRoute(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (route) => {
    setEditingRoute(route);
    setForm({
      route_no: route.route_no,
      from_place: route.from_place,
      to_place: route.to_place,
      stops: (route.stop_names || []).join(", "),
      distance_km: route.distance_km ?? "",
      estimated_time: route.estimated_time || "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError(null);
  };

  // ── Save ──────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const payload = {
      route_no: form.route_no.trim(),
      from_place: form.from_place.trim(),
      to_place: form.to_place.trim(),
      stop_names: form.stops,           // service parses comma-string → array
      distance_km: form.distance_km || null,
      estimated_time: form.estimated_time.trim() || null,
    };

    try {
      if (editingRoute) {
        await schedulerRouteAPI.update(editingRoute.id, payload);
      } else {
        await schedulerRouteAPI.create(payload);
      }
      closeModal();
      fetchRoutes();
    } catch (err) {
      setFormError(err.message || "Failed to save route");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (route) => {
    if (
      !confirm(
        `Deactivate route ${route.route_no} (${route.from_place} → ${route.to_place})?\n\nThis hides it from the scheduler but keeps ETA data intact.`
      )
    )
      return;

    try {
      await schedulerRouteAPI.delete(route.id);
      fetchRoutes();
    } catch (err) {
      alert(err.message || "Failed to deactivate route");
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Route Management</h1>
          <p className="text-gray-400 mt-1">Create and manage bus routes</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={18} /> Add Route
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative max-w-md flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by route number or place..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <button
          onClick={fetchRoutes}
          className="p-2.5 border border-slate-700 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchRoutes} className="ml-auto text-sm underline">Retry</button>
        </div>
      )}

      {/* Route Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-3 animate-pulse">
              <div className="h-5 bg-slate-700 rounded w-20" />
              <div className="h-4 bg-slate-700 rounded w-32" />
              <div className="h-4 bg-slate-700 rounded w-24" />
            </div>
          ))}
        </div>
      ) : routes.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          {search ? "No routes match your search" : "No routes yet. Add your first route."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Map size={20} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{route.route_no}</h3>
                    <p className="text-gray-400 text-sm">
                      {route.distance_km ? `${route.distance_km} km` : "Distance unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(route)}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(route)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-blue-400 shrink-0" />
                  <span className="text-gray-300 text-sm">
                    {route.from_place} → {route.to_place}
                  </span>
                </div>
                {route.estimated_time && (
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-orange-400 shrink-0" />
                    <span className="text-gray-300 text-sm">{route.estimated_time}</span>
                  </div>
                )}
                {route.stop_names.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {route.stop_names.map((stop) => (
                      <span
                        key={stop}
                        className="text-xs bg-slate-700 text-gray-300 px-2 py-1 rounded-md"
                      >
                        {stop}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Count footer */}
      {!loading && routes.length > 0 && (
        <p className="text-xs text-gray-500">{routes.length} route{routes.length !== 1 ? "s" : ""}</p>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingRoute ? "Edit Route" : "Add New Route"}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
                <AlertCircle size={16} />
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Route Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.route_no}
                  onChange={(e) => setForm({ ...form, route_no: e.target.value })}
                  placeholder="R-106"
                  required
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    From <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.from_place}
                    onChange={(e) => setForm({ ...form, from_place: e.target.value })}
                    placeholder="Madurai"
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    To <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.to_place}
                    onChange={(e) => setForm({ ...form, to_place: e.target.value })}
                    placeholder="Theni"
                    required
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Stops <span className="text-gray-500 text-xs">(comma-separated, optional)</span>
                </label>
                <input
                  type="text"
                  value={form.stops}
                  onChange={(e) => setForm({ ...form, stops: e.target.value })}
                  placeholder="Usilampatti, Andipatti"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Distance (km) <span className="text-gray-500 text-xs">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.distance_km}
                    onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
                    placeholder="76"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Est. Time <span className="text-gray-500 text-xs">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.estimated_time}
                    onChange={(e) => setForm({ ...form, estimated_time: e.target.value })}
                    placeholder="2h 15m"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                  {saving ? "Saving..." : editingRoute ? "Save Changes" : "Add Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;