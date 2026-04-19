import { useEffect, useMemo, useState } from "react";
import { Bus, Map, CalendarDays, AlertTriangle, AlertCircle, Search, TrendingUp, TrendingDown } from "lucide-react";
import { schedulerAnalyticsAPI } from "../../config/api";

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    orange: "bg-orange-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    cyan: "bg-cyan-500",
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              {trend.isPositive ? (
                <TrendingUp size={14} className="text-green-400" />
              ) : (
                <TrendingDown size={14} className="text-red-400" />
              )}
              <span className={`text-xs ${trend.isPositive ? "text-green-400" : "text-red-400"}`}>
                {trend.value}% vs last week
              </span>
            </div>
          )}
        </div>
        <div className={`${colors[color]} w-14 h-14 rounded-xl flex items-center justify-center`}>
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  );
};

const SchedulerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState({
    stats: {
      totalBuses: 0,
      totalRoutes: 0,
      todaysTrips: 0,
      passengerSearches7d: 0,
      delayedTrips: 0,
      activeIssues: 0,
    },
    tripsThisWeek: [],
    liveStatusOverview: [],
    todaysTrips: [],
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    schedulerAnalyticsAPI
      .getDashboard()
      .then((res) => {
        if (!mounted) return;
        setDashboard(res.data || dashboard);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || "Failed to load dashboard.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const maxTrips = useMemo(
    () => Math.max(1, ...dashboard.tripsThisWeek.map((d) => Number(d.trips) || 0)),
    [dashboard.tripsThisWeek]
  );
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const tripsSeries = useMemo(() => {
    const counts = Object.fromEntries(
      dashboard.tripsThisWeek.map((d) => [String(d.day), Number(d.trips) || 0])
    );
    return weekDays.map((day) => ({ day, trips: counts[day] ?? 0 }));
  }, [dashboard.tripsThisWeek]);

  const statusColors = {
    "On Time": "text-green-400 bg-green-400/10",
    Delayed: "text-red-400 bg-red-400/10",
    Completed: "text-blue-400 bg-blue-400/10",
    Issue: "text-orange-300 bg-orange-400/10",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back. Here's your fleet overview for today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Buses" value={dashboard.stats.totalBuses} icon={Bus} color="blue" />
        <StatCard title="Total Routes" value={dashboard.stats.totalRoutes} icon={Map} color="green" />
        <StatCard title="Today's Trips" value={dashboard.stats.todaysTrips} icon={CalendarDays} color="cyan" />
        <StatCard title="Passenger Searches (7d)" value={dashboard.stats.passengerSearches7d} icon={Search} color="purple" />
        <StatCard title="Delayed Trips" value={dashboard.stats.delayedTrips} icon={AlertTriangle} color="orange" />
        <StatCard title="Active Issues" value={dashboard.stats.activeIssues} icon={AlertCircle} color="red" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trips per Day Chart */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Trips This Week</h2>
          <div className="flex items-end gap-4 h-48">
            {tripsSeries.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-gray-400">{d.trips}</span>
                <div className="w-full h-28 flex items-end">
                  <div
                    className="w-full bg-green-500/80 rounded-t-lg transition-all hover:bg-green-400"
                    style={{
                      height: d.trips > 0
                        ? `${Math.max(14, ((Number(d.trips) || 0) / maxTrips) * 100)}%`
                        : "6%",
                      opacity: d.trips > 0 ? 1 : 0.35,
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Status Overview */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Live Status Overview</h2>
          <div className="space-y-4">
            {dashboard.liveStatusOverview.map((item) => (
              <div key={item.status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{String(item.status || "").replaceAll("_", " ")}</span>
                  <span className="text-white font-medium">{item.count}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        dashboard.stats.totalBuses > 0
                          ? (Number(item.count || 0) / dashboard.stats.totalBuses) * 100
                          : 0
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {dashboard.liveStatusOverview.length === 0 && (
              <p className="text-sm text-gray-500">No live status data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Trips */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Today's Trips</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-3 px-4">Route</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-3 px-4">Departure</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.todaysTrips.map((trip) => (
                <tr key={trip.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4 text-gray-300 text-sm">{trip.route}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{trip.departure}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[trip.status] || "text-gray-300 bg-slate-700"}`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !error && dashboard.todaysTrips.length === 0 && (
            <p className="text-sm text-gray-500 py-4 px-1">No trips available.</p>
          )}
        </div>
      </div>
      {loading && <p className="text-sm text-gray-400">Loading dashboard...</p>}
      {!loading && error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default SchedulerDashboard;
