import { useState } from "react";
import { ClipboardList, Search, Filter } from "lucide-react";

const LOGS = [
  { id: 1, action: "Schedule Created", details: "Created trip: TN72-AB-1234 on Route R-101 (Feb 28)", user: "You", timestamp: "2026-02-27 10:30 AM", type: "create" },
  { id: 2, action: "Bus Updated", details: "Changed status of TN72-EF-9012 to Maintenance", user: "You", timestamp: "2026-02-27 10:15 AM", type: "update" },
  { id: 3, action: "Driver Assigned", details: "Assigned Kumar S. to bus TN72-AB-1234", user: "You", timestamp: "2026-02-27 09:45 AM", type: "update" },
  { id: 4, action: "Trip Cancelled", details: "Cancelled trip on Route R-105 (Feb 27, 08:30 AM)", user: "You", timestamp: "2026-02-27 09:30 AM", type: "delete" },
  { id: 5, action: "Route Created", details: "Created new route R-106: Dindigul → Madurai", user: "You", timestamp: "2026-02-27 09:00 AM", type: "create" },
  { id: 6, action: "Login", details: "Logged in from 192.168.1.100", user: "You", timestamp: "2026-02-27 08:30 AM", type: "auth" },
  { id: 7, action: "Password Changed", details: "Password updated successfully", user: "You", timestamp: "2026-02-26 04:00 PM", type: "auth" },
  { id: 8, action: "Schedule Updated", details: "Changed departure time for Route R-102 trip to 07:15 AM", user: "You", timestamp: "2026-02-26 03:30 PM", type: "update" },
  { id: 9, action: "Driver Added", details: "Added new driver: Arun K. (TN-DL-2020-1122)", user: "You", timestamp: "2026-02-26 02:00 PM", type: "create" },
  { id: 10, action: "Bus Added", details: "Added new bus TN72-KL-1122 (48 seats)", user: "You", timestamp: "2026-02-26 01:30 PM", type: "create" },
];

const typeColors = {
  create: "text-green-400 bg-green-400/10",
  update: "text-blue-400 bg-blue-400/10",
  delete: "text-red-400 bg-red-400/10",
  auth: "text-purple-400 bg-purple-400/10",
};

const typeDots = {
  create: "bg-green-400",
  update: "bg-blue-400",
  delete: "bg-red-400",
  auth: "bg-purple-400",
};

const ActivityLogs = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filtered = LOGS.filter((log) => {
    const matchSearch = log.action.toLowerCase().includes(search.toLowerCase()) || log.details.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || log.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
        <p className="text-gray-400 mt-1">Track your recent actions and changes</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "create", label: "Created" },
            { key: "update", label: "Updated" },
            { key: "delete", label: "Deleted" },
            { key: "auth", label: "Auth" },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilterType(f.key)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === f.key ? "bg-green-600 text-white" : "bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="space-y-0">
          {filtered.map((log, i) => (
            <div key={log.id} className="flex gap-4">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${typeDots[log.type]} mt-1.5 flex-shrink-0`}></div>
                {i < filtered.length - 1 && <div className="w-0.5 flex-1 bg-slate-700 my-1"></div>}
              </div>

              {/* Content */}
              <div className="pb-6 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[log.type]}`}>{log.action}</span>
                  </div>
                  <span className="text-gray-500 text-xs">{log.timestamp}</span>
                </div>
                <p className="text-gray-300 text-sm mt-1">{log.details}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
              <p>No activity logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
