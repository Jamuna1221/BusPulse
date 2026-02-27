import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, X, Bus, Search, RefreshCw, AlertCircle } from "lucide-react";
import { schedulerBusAPI } from "../../config/api.js";

const statusColors = {
  Active: "text-green-400 bg-green-400/10",
  Maintenance: "text-orange-400 bg-orange-400/10",
  Inactive: "text-gray-400 bg-gray-400/10",
};

const EMPTY_FORM = {
  bus_number: "",
  capacity: "",
  status: "Active",
  assigned_driver_name: "",
  assigned_route_label: "",
};

const BusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // ── Fetch buses from API ──────────────────────────────────
  const fetchBuses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await schedulerBusAPI.getAll({ status: statusFilter, search });
      setBuses(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load buses");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    // Debounce the search so we don't hit the API on every keystroke
    const timer = setTimeout(fetchBuses, 300);
    return () => clearTimeout(timer);
  }, [fetchBuses]);

  // ── Modal helpers ─────────────────────────────────────────
  const openAdd = () => {
    setEditingBus(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (bus) => {
    setEditingBus(bus);
    setForm({
      bus_number: bus.bus_number,
      capacity: bus.capacity,
      status: bus.status,
      assigned_driver_name: bus.assigned_driver_name || "",
      assigned_route_label: bus.assigned_route_label || "",
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError(null);
  };

  // ── Save (create or update) ───────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    // Strip empty optional fields before sending
    const payload = {
      bus_number: form.bus_number.trim(),
      capacity: Number(form.capacity),
      status: form.status,
      assigned_driver_name: form.assigned_driver_name.trim() || null,
      assigned_route_label: form.assigned_route_label.trim() || null,
    };

    try {
      if (editingBus) {
        await schedulerBusAPI.update(editingBus.id, payload);
      } else {
        await schedulerBusAPI.create(payload);
      }
      closeModal();
      fetchBuses();
    } catch (err) {
      setFormError(err.message || "Failed to save bus");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (bus) => {
    if (!confirm(`Delete bus ${bus.bus_number}? This cannot be undone.`)) return;
    try {
      await schedulerBusAPI.delete(bus.id);
      fetchBuses();
    } catch (err) {
      alert(err.message || "Failed to delete bus");
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Bus Management</h1>
          <p className="text-gray-400 mt-1">Manage your fleet of buses</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={18} /> Add Bus
        </button>
      </div>

      {/* Search + Filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-md flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bus number, driver, route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button
          onClick={fetchBuses}
          className="p-2.5 border border-slate-700 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={fetchBuses} className="ml-auto text-sm underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-6">Bus Number</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-6">Capacity</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-6">Status</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-6">Driver</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-6">Route</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton rows
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-4 px-6">
                        <div className="h-4 bg-slate-700 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : buses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-500">
                    {search || statusFilter ? "No buses match your filters" : "No buses yet. Add your first bus."}
                  </td>
                </tr>
              ) : (
                buses.map((bus) => (
                  <tr key={bus.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                          <Bus size={16} className="text-blue-400" />
                        </div>
                        <span className="text-white font-medium text-sm">{bus.bus_number}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300 text-sm">{bus.capacity} seats</td>
                    <td className="py-4 px-6">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[bus.status]}`}>
                        {bus.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-300 text-sm">{bus.assigned_driver_name || "—"}</td>
                    <td className="py-4 px-6 text-gray-300 text-sm">{bus.assigned_route_label || "—"}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(bus)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(bus)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && buses.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-700 text-xs text-gray-500">
            {buses.length} bus{buses.length !== 1 ? "es" : ""}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingBus ? "Edit Bus" : "Add New Bus"}
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
                  Bus Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.bus_number}
                  onChange={(e) => setForm({ ...form, bus_number: e.target.value })}
                  placeholder="TN72-AB-1234"
                  required
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Capacity (seats) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="52"
                  required
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Assigned Driver <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.assigned_driver_name}
                  onChange={(e) => setForm({ ...form, assigned_driver_name: e.target.value })}
                  placeholder="Driver name"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Assigned Route <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.assigned_route_label}
                  onChange={(e) => setForm({ ...form, assigned_route_label: e.target.value })}
                  placeholder="Madurai → Theni"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
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
                  {saving ? "Saving..." : editingBus ? "Save Changes" : "Add Bus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusManagement;