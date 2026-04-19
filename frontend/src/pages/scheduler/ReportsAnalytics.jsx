import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, Clock3, Download, MapPinned, Search } from "lucide-react";
import { schedulerAnalyticsAPI } from "../../config/api";

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState({
    summary: {
      totalSearches30d: 0,
      avgDailySearches7d: 0,
      delaySignalRate7d: 0,
      unresolvedIncidents: 0,
    },
    searchesPerDay: [],
    topDestinations: [],
    liveStatuses: [],
    feedbackMix: [],
    generatedAt: null,
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    schedulerAnalyticsAPI
      .getOverview()
      .then((res) => {
        if (!mounted) return;
        setAnalytics(res.data || analytics);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || "Failed to load analytics.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const maxSearchesPerDay = useMemo(
    () => Math.max(1, ...analytics.searchesPerDay.map((d) => Number(d.count) || 0)),
    [analytics.searchesPerDay]
  );
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const searchesSeries = useMemo(() => {
    const counts = Object.fromEntries(
      analytics.searchesPerDay.map((d) => [String(d.day), Number(d.count) || 0])
    );
    return weekDays.map((day) => ({ day, count: counts[day] ?? 0 }));
  }, [analytics.searchesPerDay]);

  const maxLiveStatusCount = useMemo(
    () => Math.max(1, ...analytics.liveStatuses.map((d) => Number(d.count) || 0)),
    [analytics.liveStatuses]
  );

  const exportCsv = () => {
    const lines = [
      "Section,Label,Value",
      `Summary,Total Searches (30d),${analytics.summary.totalSearches30d}`,
      `Summary,Avg Daily Searches (7d),${analytics.summary.avgDailySearches7d}`,
      `Summary,Delay Signal Rate (7d),${analytics.summary.delaySignalRate7d}%`,
      `Summary,Unresolved Incidents,${analytics.summary.unresolvedIncidents}`,
      ...analytics.searchesPerDay.map((d) => `SearchesPerDay,${d.day},${d.count}`),
      ...analytics.topDestinations.map((d) => `TopDestinations,${String(d.label).replaceAll(",", " ")},${d.searches}`),
      ...analytics.liveStatuses.map((d) => `LiveStatus,${d.status},${d.count}`),
      ...analytics.feedbackMix.map((d) => `FeedbackMix,${d.type},${d.count}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scheduler-analytics.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-400 mt-1">Live demand, delays, and route insights</p>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg transition-colors"
        >
          <Download size={18} /> Export CSV
        </button>
      </div>

      {loading && <div className="text-sm text-gray-400">Loading analytics...</div>}
      {!loading && error && <div className="text-sm text-red-400">{error}</div>}
      {!loading && !error && analytics.generatedAt && (
        <div className="text-xs text-gray-500">Last updated: {new Date(analytics.generatedAt).toLocaleString()}</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Searches (30d)",
            value: analytics.summary.totalSearches30d,
            icon: Search,
            color: "bg-blue-500",
          },
          {
            label: "Avg Daily Searches (7d)",
            value: analytics.summary.avgDailySearches7d,
            icon: BarChart3,
            color: "bg-green-500",
          },
          {
            label: "Delay Signal Rate (7d)",
            value: `${analytics.summary.delaySignalRate7d}%`,
            icon: Clock3,
            color: "bg-cyan-500",
          },
          {
            label: "Unresolved Incidents",
            value: analytics.summary.unresolvedIncidents,
            icon: AlertTriangle,
            color: "bg-orange-500",
          },
        ].map((card) => (
          <div key={card.label} className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{card.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                <card.icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Searches Per Day */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Searches Per Day (This Week)</h2>
          <div className="flex items-end gap-3 h-48">
            {searchesSeries.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-gray-400">{d.count}</span>
                <div className="w-full h-28 flex items-end">
                  <div
                    className="w-full bg-green-500/80 rounded-t-lg hover:bg-green-400 transition-colors"
                    style={{
                      height: d.count > 0
                        ? `${Math.max(14, ((Number(d.count) || 0) / maxSearchesPerDay) * 100)}%`
                        : "6%",
                      opacity: d.count > 0 ? 1 : 0.35,
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Status Spread */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Live Fleet Status Spread</h2>
          <div className="space-y-4">
            {analytics.liveStatuses.map((item, idx) => (
              <div key={`${item.status}-${idx}`}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{String(item.status || "").replaceAll("_", " ")}</span>
                  <span className="text-white font-medium">{item.count}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-indigo-500 h-3 rounded-full"
                    style={{ width: `${((Number(item.count) || 0) / maxLiveStatusCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Destinations */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Top Searched Destinations (30d)</h2>
          <div className="space-y-3">
            {analytics.topDestinations.map((r, i) => (
              <div key={`${r.label}-${i}`} className="flex items-center gap-3">
                <span className="text-gray-500 text-sm w-6">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{r.label}</span>
                    <span className="text-white font-medium">{r.searches} searches</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${r.percentage}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Mix */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Passenger Feedback Mix (7d)</h2>
          <div className="space-y-3">
            {analytics.feedbackMix.map((row, i) => (
              <div key={`${row.type}-${i}`} className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPinned size={16} className="text-green-400" />
                  <p className="text-gray-300 text-sm capitalize">{row.type}</p>
                </div>
                <p className="text-white text-sm font-semibold">{row.count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
