import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Search, RefreshCw } from "lucide-react";
import { schedulerActivityAPI } from "../../config/api";

const typeColors = {
  create: "text-green-400 bg-green-400/10",
  update: "text-blue-400 bg-blue-400/10",
  delete: "text-red-400 bg-red-400/10",
  auth:   "text-purple-400 bg-purple-400/10",
};

const typeDots = {
  create: "bg-green-400",
  update: "bg-blue-400",
  delete: "bg-red-400",
  auth:   "bg-purple-400",
};

const FILTERS = [
  { key: "all",    label: "All"     },
  { key: "create", label: "Created" },
  { key: "update", label: "Updated" },
  { key: "delete", label: "Deleted" },
  { key: "auth",   label: "Auth"    },
];

const LIMIT = 20;

const ActivityLogs = () => {
  const [logs,        setLogs]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [search,      setSearch]      = useState("");
  const [filterType,  setFilterType]  = useState("all");
  const [offset,      setOffset]      = useState(0);

  const fetchLogs = useCallback(async (opts = {}) => {
    setLoading(true);
    setError("");
    try {
      const res = await schedulerActivityAPI.getLogs({
        type:   opts.type   ?? filterType,
        search: opts.search ?? search,
        limit:  LIMIT,
        offset: opts.offset ?? offset,
      });
      if (res.success) {
        setLogs(res.logs);
        setTotal(res.total);
      } else {
        setError("Failed to load logs.");
      }
    } catch (e) {
      console.error(e);
      setError("Unable to fetch activity logs. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filterType, search, offset]);

  // Initial load
  useEffect(() => { fetchLogs(); }, []);

  // Re-fetch when filter or search changes (reset to page 0)
  const handleFilterChange = (key) => {
    setFilterType(key);
    setOffset(0);
    fetchLogs({ type: key, offset: 0 });
  };

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(0);
      fetchLogs({ search, offset: 0 });
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const handlePrev = () => {
    const newOffset = Math.max(0, offset - LIMIT);
    setOffset(newOffset);
    fetchLogs({ offset: newOffset });
  };

  const handleNext = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchLogs({ offset: newOffset });
  };

  const totalPages  = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
          <p className="text-gray-400 mt-1">Track your recent actions and changes</p>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-gray-300 hover:bg-slate-700 text-sm transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === f.key
                  ? "bg-green-600 text-white"
                  : "bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Timeline */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
            <p>No activity logs found</p>
          </div>
        ) : (
          <div className="space-y-0">
            {logs.map((log, i) => (
              <div key={log.id} className="flex gap-4">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${typeDots[log.type] || "bg-gray-400"} mt-1.5 flex-shrink-0`} />
                  {i < logs.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-700 my-1" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-6 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${typeColors[log.type] || "text-gray-400 bg-gray-400/10"}`}>
                      {log.action}
                    </span>
                    <span className="text-gray-500 text-xs">{log.timestamp}</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total} logs
          </span>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={offset === 0}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Prev
            </button>
            <span className="px-3 py-1.5 text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={offset + LIMIT >= total}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogs;