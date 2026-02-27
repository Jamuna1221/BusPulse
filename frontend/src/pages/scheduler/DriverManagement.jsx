import { useState } from "react";
import { Plus, Edit2, Trash2, X, Users, Search, Phone, Mail } from "lucide-react";

const INITIAL_DRIVERS = [
  { id: 1, name: "Kumar S.", phone: "+91 98765 43210", email: "kumar@email.com", license: "TN-DL-2020-1234", status: "Available", assignedBus: "TN72-AB-1234" },
  { id: 2, name: "Ravi M.", phone: "+91 98765 43211", email: "ravi@email.com", license: "TN-DL-2019-5678", status: "On Trip", assignedBus: "TN72-CD-5678" },
  { id: 3, name: "Suresh K.", phone: "+91 98765 43212", email: "suresh@email.com", license: "TN-DL-2021-9012", status: "Available", assignedBus: "—" },
  { id: 4, name: "Senthil R.", phone: "+91 98765 43213", email: "senthil@email.com", license: "TN-DL-2018-3456", status: "On Trip", assignedBus: "TN72-GH-3456" },
  { id: 5, name: "Vijay P.", phone: "+91 98765 43214", email: "vijay@email.com", license: "TN-DL-2022-7890", status: "Leave", assignedBus: "—" },
  { id: 6, name: "Arun K.", phone: "+91 98765 43215", email: "arun@email.com", license: "TN-DL-2020-1122", status: "Available", assignedBus: "—" },
];

const statusColors = {
  Available: "text-green-400 bg-green-400/10",
  "On Trip": "text-blue-400 bg-blue-400/10",
  Leave: "text-orange-400 bg-orange-400/10",
};

const DriverManagement = () => {
  const [drivers, setDrivers] = useState(INITIAL_DRIVERS);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", license: "", status: "Available", assignedBus: "" });

  const filtered = drivers.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.license.toLowerCase().includes(search.toLowerCase()) || d.phone.includes(search)
  );

  const openAdd = () => { setEditing(null); setForm({ name: "", phone: "", email: "", license: "", status: "Available", assignedBus: "" }); setShowModal(true); };
  const openEdit = (d) => { setEditing(d); setForm({ name: d.name, phone: d.phone, email: d.email, license: d.license, status: d.status, assignedBus: d.assignedBus }); setShowModal(true); };

  const handleSave = (e) => {
    e.preventDefault();
    if (editing) { setDrivers(drivers.map((d) => (d.id === editing.id ? { ...d, ...form } : d))); }
    else { setDrivers([...drivers, { id: Date.now(), ...form }]); }
    setShowModal(false);
  };

  const handleDelete = (id) => { if (confirm("Delete this driver?")) setDrivers(drivers.filter((d) => d.id !== id)); };

  const statusCounts = { Available: drivers.filter((d) => d.status === "Available").length, "On Trip": drivers.filter((d) => d.status === "On Trip").length, Leave: drivers.filter((d) => d.status === "Leave").length };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Driver Management</h1>
          <p className="text-gray-400 mt-1">Manage drivers and their assignments</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-colors"><Plus size={18} /> Add Driver</button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="bg-slate-800 rounded-xl border border-slate-700 p-4 text-center">
            <p className="text-2xl font-bold text-white">{count}</p>
            <p className="text-gray-400 text-sm">{status}</p>
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search drivers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>

      {/* Driver Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((driver) => (
          <div key={driver.id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=334155&color=fff&size=40`} alt={driver.name} className="w-10 h-10 rounded-full" />
                <div>
                  <h3 className="text-white font-bold">{driver.name}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[driver.status]}`}>{driver.status}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(driver)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(driver.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400"><Phone size={14} /><span>{driver.phone}</span></div>
              <div className="flex items-center gap-2 text-gray-400"><Mail size={14} /><span>{driver.email}</span></div>
              <div className="flex items-center gap-2 text-gray-400"><span className="text-xs">License:</span><span className="text-gray-300">{driver.license}</span></div>
              {driver.assignedBus !== "—" && (
                <div className="mt-2 px-3 py-1.5 bg-blue-500/10 rounded-lg text-blue-400 text-xs font-medium">Assigned: {driver.assignedBus}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editing ? "Edit Driver" : "Add New Driver"}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {[
                { label: "Full Name", key: "name", placeholder: "Driver name", required: true },
                { label: "Phone", key: "phone", placeholder: "+91 98765 43210" },
                { label: "Email", key: "email", placeholder: "driver@email.com", type: "email" },
                { label: "License Number", key: "license", placeholder: "TN-DL-2020-1234", required: true },
                { label: "Assigned Bus", key: "assignedBus", placeholder: "TN72-XX-0000" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">{field.label}</label>
                  <input type={field.type || "text"} value={form[field.key]} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} placeholder={field.placeholder} required={field.required} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">{editing ? "Save Changes" : "Add Driver"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverManagement;
