import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, Users, Bus, Clock, Download } from 'lucide-react';
import { adminAnalyticsAPI } from "../../config/api";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState({
    summary: {
      totalRides: 0,
      activeUsers: 0,
      avgTripMinutes: 0,
      onTimeRate: 0,
      totalUsers: 0,
      totalIncidents30d: 0,
      openIncidents: 0,
      resolvedIncidents: 0,
    },
    userGrowth: [],
    topRoutes: [],
    peakHours: [],
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    adminAnalyticsAPI
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

  const maxGrowth = useMemo(() => Math.max(1, ...analytics.userGrowth.map((d) => d.heightPct || 0)), [analytics.userGrowth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics & Insights</h1>
          <p className="text-gray-400 mt-1">Performance metrics and data analysis</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
          <Download size={20} />
          Export Report
        </button>
      </div>

      {loading && <div className="text-gray-400 text-sm">Loading analytics...</div>}
      {!loading && error && <div className="text-red-400 text-sm">{error}</div>}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">Total Rides</p>
            <Bus className="text-blue-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">{analytics.summary.totalRides.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-green-400 text-sm">{analytics.summary.totalIncidents30d} incidents</span>
            <span className="text-gray-500 text-sm">last 30 days</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">Active Users</p>
            <Users className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">{analytics.summary.activeUsers.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-green-400 text-sm">{analytics.summary.totalUsers.toLocaleString()} total users</span>
            <span className="text-gray-500 text-sm">registered</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">Avg Trip Time</p>
            <Clock className="text-purple-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">{analytics.summary.avgTripMinutes} min</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={16} className="text-red-400 rotate-180" />
            <span className="text-green-400 text-sm">Live ETA average</span>
            <span className="text-gray-500 text-sm">snapshot</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">On-Time Rate</p>
            <TrendingUp className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">{analytics.summary.onTimeRate}%</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-green-400 text-sm">{analytics.summary.openIncidents} open</span>
            <span className="text-gray-500 text-sm">incidents now</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">User Growth Trend</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.userGrowth.map((point, index) => (
              <div key={`${point.month}-${index}`} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full h-44 flex items-end">
                  <div
                    className="w-full bg-blue-600 rounded-t-lg hover:bg-blue-500 transition-all cursor-pointer relative group"
                    style={{ height: `${Math.max(4, ((point.heightPct || 0) / maxGrowth) * 100)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {point.users} users
                    </div>
                  </div>
                </div>
                <span className="text-gray-500 text-xs">
                  {point.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Route Performance */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Top Routes by Usage</h2>
          <div className="space-y-4">
            {analytics.topRoutes.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">{item.route}</span>
                  <span className="text-white font-semibold">{item.usage}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peak Hours */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Peak Usage Hours</h2>
          <div className="space-y-3">
            {analytics.peakHours.map((peak, index) => (
              <div key={index} className="p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{peak.label}</span>
                  <span className="text-blue-400 text-sm">{peak.percentage}%</span>
                </div>
                <p className="text-gray-400 text-sm">{peak.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Incident Health */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Incident Health</h2>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#1e293b"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="351.86"
                  strokeDashoffset={`${351.86 - ((analytics.summary.onTimeRate || 0) / 100) * 351.86}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-white">{analytics.summary.onTimeRate}%</span>
                <span className="text-gray-400 text-xs">On-time</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Open Incidents:</span>
              <span className="text-orange-400">{analytics.summary.openIncidents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Resolved (30d):</span>
              <span className="text-green-400">{analytics.summary.resolvedIncidents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total (30d):</span>
              <span className="text-blue-400">{analytics.summary.totalIncidents30d}</span>
            </div>
          </div>
        </div>

        {/* Passenger Demand */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Passenger Demand</h2>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-white mb-2">{analytics.summary.totalRides.toLocaleString()}</div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-6 h-6 ${i < Math.min(5, Math.max(1, Math.round((analytics.summary.onTimeRate || 0) / 20))) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-400 text-sm">searches in last 30 days</p>
          </div>
          <div className="space-y-2">
            {[
              { stars: "Open incidents", count: analytics.summary.openIncidents, percentage: analytics.summary.totalIncidents30d ? Math.round((analytics.summary.openIncidents / analytics.summary.totalIncidents30d) * 100) : 0 },
              { stars: "Resolved", count: analytics.summary.resolvedIncidents, percentage: analytics.summary.totalIncidents30d ? Math.round((analytics.summary.resolvedIncidents / analytics.summary.totalIncidents30d) * 100) : 0 },
              { stars: "Active users", count: analytics.summary.activeUsers, percentage: analytics.summary.totalUsers ? Math.round((analytics.summary.activeUsers / analytics.summary.totalUsers) * 100) : 0 },
            ].map((rating) => (
              <div key={rating.stars} className="flex items-center gap-2">
                <span className="text-gray-400 text-sm w-24">{rating.stars}</span>
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${rating.percentage}%` }}
                  ></div>
                </div>
                <span className="text-gray-400 text-xs w-16 text-right">{rating.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;