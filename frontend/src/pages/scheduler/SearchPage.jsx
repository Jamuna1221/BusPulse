import { useState } from "react";
import { Search, Bus, Map, Users, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ALL_DATA = {
  buses: [
    { id: "b1", label: "TN72-AB-1234", detail: "52 seats • Active • Kumar S.", link: "/scheduler/buses" },
    { id: "b2", label: "TN72-CD-5678", detail: "40 seats • Active • Ravi M.", link: "/scheduler/buses" },
    { id: "b3", label: "TN72-EF-9012", detail: "52 seats • Maintenance", link: "/scheduler/buses" },
    { id: "b4", label: "TN72-GH-3456", detail: "36 seats • Active • Senthil R.", link: "/scheduler/buses" },
    { id: "b5", label: "TN72-IJ-7890", detail: "52 seats • Inactive", link: "/scheduler/buses" },
    { id: "b6", label: "TN72-KL-1122", detail: "48 seats • Active • Vijay P.", link: "/scheduler/buses" },
  ],
  routes: [
    { id: "r1", label: "R-101: Madurai → Theni", detail: "76 km • 2h 15m • 2 stops", link: "/scheduler/routes" },
    { id: "r2", label: "R-102: Theni → Bodinayakanur", detail: "30 km • 45m • 1 stop", link: "/scheduler/routes" },
    { id: "r3", label: "R-103: Periyakulam → Madurai", detail: "95 km • 2h 45m • 2 stops", link: "/scheduler/routes" },
    { id: "r4", label: "R-104: Cumbum → Theni", detail: "45 km • 1h 15m • 2 stops", link: "/scheduler/routes" },
    { id: "r5", label: "R-105: Andipatti → Madurai", detail: "55 km • 1h 30m • 1 stop", link: "/scheduler/routes" },
  ],
  drivers: [
    { id: "d1", label: "Kumar S.", detail: "TN-DL-2020-1234 • Available", link: "/scheduler/drivers" },
    { id: "d2", label: "Ravi M.", detail: "TN-DL-2019-5678 • On Trip", link: "/scheduler/drivers" },
    { id: "d3", label: "Suresh K.", detail: "TN-DL-2021-9012 • Available", link: "/scheduler/drivers" },
    { id: "d4", label: "Senthil R.", detail: "TN-DL-2018-3456 • On Trip", link: "/scheduler/drivers" },
    { id: "d5", label: "Vijay P.", detail: "TN-DL-2022-7890 • Leave", link: "/scheduler/drivers" },
  ],
  schedules: [
    { id: "s1", label: "TN72-AB-1234 → Madurai → Theni", detail: "Feb 27, 06:30 AM • Kumar S.", link: "/scheduler/schedules" },
    { id: "s2", label: "TN72-CD-5678 → Theni → Bodinayakanur", detail: "Feb 27, 07:00 AM • Ravi M.", link: "/scheduler/schedules" },
    { id: "s3", label: "TN72-EF-9012 → Periyakulam → Madurai", detail: "Feb 27, 07:30 AM • Suresh K.", link: "/scheduler/schedules" },
  ],
};

const categoryConfig = {
  buses: { icon: Bus, color: "text-blue-400 bg-blue-400/10", label: "Buses" },
  routes: { icon: Map, color: "text-green-400 bg-green-400/10", label: "Routes" },
  drivers: { icon: Users, color: "text-purple-400 bg-purple-400/10", label: "Drivers" },
  schedules: { icon: CalendarDays, color: "text-cyan-400 bg-cyan-400/10", label: "Schedules" },
};

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const results = {};
  if (query.trim().length >= 2) {
    const q = query.toLowerCase();
    for (const [category, items] of Object.entries(ALL_DATA)) {
      const matches = items.filter((item) => item.label.toLowerCase().includes(q) || item.detail.toLowerCase().includes(q));
      if (matches.length > 0) results[category] = matches;
    }
  }

  const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Search</h1>
        <p className="text-gray-400">Search across buses, routes, drivers, and schedules</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Type to search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Results */}
      {query.trim().length >= 2 && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">{totalResults} result{totalResults !== 1 ? "s" : ""} found</p>

          {Object.entries(results).map(([category, items]) => {
            const config = categoryConfig[category];
            const Icon = config.icon;

            return (
              <div key={category} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${config.color}`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-white font-medium text-sm">{config.label}</span>
                  <span className="text-gray-500 text-xs">({items.length})</span>
                </div>
                <div>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(item.link)}
                      className="px-4 py-3 hover:bg-slate-700/30 cursor-pointer border-b border-slate-700/50 last:border-0 transition-colors"
                    >
                      <p className="text-white text-sm font-medium">{item.label}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {totalResults === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search size={48} className="mx-auto mb-4 opacity-30" />
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}

      {query.trim().length < 2 && (
        <div className="text-center py-12 text-gray-500">
          <Search size={48} className="mx-auto mb-4 opacity-20" />
          <p>Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
