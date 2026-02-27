import { useState } from "react";
import { Plus, Edit2, Trash2, X, CalendarDays, Search, Filter, CheckCircle, XCircle } from "lucide-react";

const INITIAL_SCHEDULES = [
  { id: 1, bus: "TN72-AB-1234", route: "Madurai → Theni", driver: "Kumar S.", date: "2026-02-27", departure: "06:30", arrival: "08:45", status: "Scheduled" },
  { id: 2, bus: "TN72-CD-5678", route: "Theni → Bodinayakanur", driver: "Ravi M.", date: "2026-02-27", departure: "07:00", arrival: "07:45", status: "In Progress" },
  { id: 3, bus: "TN72-EF-9012", route: "Periyakulam → Madurai", driver: "Suresh K.", date: "2026-02-27", departure: "07:30", arrival: "10:15", status: "Completed" },
  { id: 4, bus: "TN72-GH-3456", route: "Cumbum → Theni", driver: "Senthil R.", date: "2026-02-27", departure: "08:00", arrival: "09:15", status: "Scheduled" },
  { id: 5, bus: "TN72-IJ-7890", route: "Andipatti → Madurai", driver: "Vijay P.", date: "2026-02-27", departure: "08:30", arrival: "10:00", status: "Cancelled" },
  { id: 6, bus: "TN72-KL-1122", route: "Madurai → Theni", driver: "Arun K.", date: "2026-02-28", departure: "06:00", arrival: "08:15", status: "Scheduled" },
  { id: 7, bus: "TN72-AB-1234", route: "Theni → Bodinayakanur", driver: "Kumar S.", date: "2026-02-28", departure: "09:30", arrival: "10:15", status: "Scheduled" },
];

const statusColors = {
  Scheduled: "text-blue-400 bg-blue-400/10",
  "In Progress": "text-yellow-400 bg-yellow-400/10",
  Completed: "text-green-400 bg-green-400/10",
  Cancelled: "text-red-400 bg-red-400/10",
};

const ScheduleManagement = () => {
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterRoute, setFilterRoute] = useState("");
  const [filterBus, setFilterBus] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ bus: "", route: "", driver: "", date: "", departure: "", arrival: "", status: "Scheduled" });

  const uniqueRoutes = [...new Set(schedules.map((s) => s.route))];
  const uniqueBuses = [...new Set(schedules.map((s) => s.bus))];
  const uniqueDrivers = [...new Set(schedules.map((s) => s.driver))];

  const filtered = schedules.filter((s) => {
    const matchSearch = s.bus.toLowerCase().includes(search.toLowerCase()) || s.route.toLowerCase().includes(search.toLowerCase()) || s.driver.toLowerCase().includes(search.toLowerCase());
    const matchDate = !filterDate || s.date === filterDate;
    const matchRoute = !filterRoute || s.route === filterRoute;
    const matchBus = !filterBus || s.bus === filterBus;
    const matchDriver = !filterDriver || s.driver === filterDriver;
    return matchSearch && matchDate && matchRoute && matchBus && matchDriver;
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ bus: "", route: "", driver: "", date: "", departure: "", arrival: "", status: "Scheduled" });
    setShowModal(true);
  };

  const openEdit = (schedule) => {
    setEditing(schedule);
    setForm({ bus: schedule.bus, route: schedule.route, driver: schedule.driver, date: schedule.date, departure: schedule.departure, arrival: schedule.arrival, status: schedule.status });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editing) {
      setSchedules(schedules.map((s) => (s.id === editing.id ? { ...s, ...form } : s)));
    } else {
      setSchedules([...schedules, { id: Date.now(), ...form }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (confirm("Delete this schedule?")) setSchedules(schedules.filter((s) => s.id !== id));
  };

  const markCompleted = (id) => setSchedules(schedules.map((s) => (s.id === id ? { ...s, status: "Completed" } : s)));
  const markCancelled = (id) => setSchedules(schedules.map((s) => (s.id === id ? { ...s, status: "Cancelled" } : s)));

  const clearFilters = () => {
    setFilterDate("");
    setFilterRoute("");
    setFilterBus("");
    setFilterDriver("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Schedule Management</h1>
          <p className="text-gray-400 mt-1">Create and manage trip schedules</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={18} /> Create Schedule
        </button>
      </div>

      {/* Search + Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search schedules..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${showFilters ? "bg-green-600 border-green-600 text-white" : "border-slate-700 text-gray-300 hover:bg-slate-800"}`}>
          <Filter size={18} /> Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Route</label>
              <select value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All Routes</option>
                {uniqueRoutes.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Bus</label>
              <select value={filterBus} onChange={(e) => setFilterBus(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All Buses</option>
                {uniqueBuses.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Driver</label>
              <select value={filterDriver} onChange={(e) => setFilterDriver(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">All Drivers</option>
                {uniqueDrivers.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <button onClick={clearFilters} className="mt-3 text-sm text-gray-400 hover:text-white transition-colors">Clear all filters</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/50">
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-4">Date</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-4">Bus</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-4">Route</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-4">Driver</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-4">Departure</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-4">Arrival</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-4 px-4">Status</th>
                <th className="text-right text-xs font-medium text-gray-400 uppercase py-4 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4 text-gray-300 text-sm">{s.date}</td>
                  <td className="py-3 px-4 text-white font-medium text-sm">{s.bus}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{s.route}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{s.driver}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{s.departure}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{s.arrival}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[s.status]}`}>{s.status}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      {s.status === "Scheduled" && (
                        <button onClick={() => markCompleted(s.id)} className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg" title="Mark Completed">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {s.status === "Scheduled" && (
                        <button onClick={() => markCancelled(s.id)} className="p-1.5 text-gray-400 hover:text-orange-400 hover:bg-orange-400/10 rounded-lg" title="Cancel Trip">
                          <XCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">No schedules found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editing ? "Edit Schedule" : "Create New Schedule"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Bus</label>
                <input type="text" value={form.bus} onChange={(e) => setForm({ ...form, bus: e.target.value })} placeholder="TN72-XX-0000" required className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Route</label>
                <input type="text" value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="From → To" required className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Driver</label>
                <input type="text" value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })} placeholder="Driver name" required className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Departure</label>
                  <input type="time" value={form.departure} onChange={(e) => setForm({ ...form, departure: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Arrival</label>
                  <input type="time" value={form.arrival} onChange={(e) => setForm({ ...form, arrival: e.target.value })} required className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">{editing ? "Save Changes" : "Create Schedule"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;
