import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserCheck,
  Bus,
  AlertTriangle,
  CalendarClock,
  Map,
  CalendarDays,
  Bell,
  ClipboardList,
  Search,
  BarChart3,
  FileText,
  MessageSquare,
  Clock3,
  TrendingUp,
} from "lucide-react";
import StatsCard from "./StatsCard";
import UsageChart from "./UsageChart";
import {
  adminAnalyticsAPI,
  adminIncidentAPI,
  adminFeedbackAPI,
  adminReportsAPI,
} from "../../config/api";

const opsLinks = [
  { to: "/admin/ops/dashboard", label: "Ops dashboard", icon: CalendarClock },
  { to: "/admin/ops/buses", label: "Buses", icon: Bus },
  { to: "/admin/ops/routes", label: "Routes", icon: Map },
  { to: "/admin/ops/schedules", label: "Schedules", icon: CalendarDays },
  { to: "/admin/ops/reports", label: "Ops reports", icon: BarChart3 },
  { to: "/admin/ops/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/ops/activity", label: "Activity logs", icon: ClipboardList },
  { to: "/admin/ops/search", label: "Search", icon: Search },
];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [reportsOverview, setReportsOverview] = useState({
    stats: { totalReportsYear: 0, totalReports: 0, storageBytes: 0, scheduledReports: 0 },
    recentReports: [],
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([
      adminAnalyticsAPI.getOverview(),
      adminIncidentAPI.getIncidents({ limit: 8 }),
      adminFeedbackAPI.getAll({ limit: 8 }),
      adminReportsAPI.getOverview(),
    ])
      .then(([analyticsRes, incidentsRes, feedbackRes, reportsRes]) => {
        if (!mounted) return;

        if (analyticsRes?.success && analyticsRes?.data) {
          setAnalytics(analyticsRes.data);
        }

        const incidentRows = incidentsRes?.data || incidentsRes?.incidents || [];
        setIncidents(Array.isArray(incidentRows) ? incidentRows : []);

        const feedbackRows = feedbackRes?.data || [];
        setFeedback(Array.isArray(feedbackRows) ? feedbackRows : []);

        const reportsData = reportsRes?.data || {};
        setReportsOverview({
          stats: reportsData?.stats || {
            totalReportsYear: 0,
            totalReports: 0,
            storageBytes: 0,
            scheduledReports: 0,
          },
          recentReports: reportsData?.recentReports || [],
        });
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || "Failed to load dashboard data");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const summary = analytics?.summary;
  const rawGrowth = analytics?.userGrowth || [];
  const topRoutes = analytics?.topRoutes || [];
  const peakHours = analytics?.peakHours || [];
  const usageData =
    rawGrowth.length > 0
      ? rawGrowth.map((ug) => ({
          day: typeof ug.month === "string" ? ug.month.slice(0, 3) : String(ug.month),
          sessions: Math.max(0, Number(ug.users) || 0),
        }))
      : [
          { day: "—", sessions: 0 },
          { day: "—", sessions: 0 },
        ];

  const incidentBadge = (status) => {
    const value = String(status || "").toLowerCase();
    if (value === "resolved") return "bg-green-500/15 text-green-300";
    if (value === "acknowledged") return "bg-amber-500/15 text-amber-300";
    return "bg-red-500/15 text-red-300";
  };

  const feedbackOpenCount = useMemo(
    () => feedback.filter((f) => String(f.status || "").toLowerCase() !== "resolved").length,
    [feedback]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Welcome back. Platform metrics and shortcuts to the same operations tools schedulers use.
          </p>
        </div>
      </div>

      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Operations (scheduler parity)</h2>
        <p className="text-gray-500 text-sm mb-4">
          Buses, routes, schedules, notifications, and logs use your admin token against the scheduler APIs.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {opsLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-emerald-500/40 hover:bg-slate-700 text-gray-200 text-sm transition-colors"
            >
              <Icon size={18} className="text-emerald-400 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading platform metrics…</p>}
      {!loading && error && (
        <p className="text-amber-400/90 text-sm">{error}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total users"
          value={summary ? summary.totalUsers.toLocaleString() : "—"}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Active users (30d)"
          value={summary ? summary.activeUsers.toLocaleString() : "—"}
          icon={UserCheck}
          color="blue"
        />
        <StatsCard
          title="Trip searches (30d)"
          value={summary ? summary.totalRides.toLocaleString() : "—"}
          icon={Bus}
          color="blue"
        />
        <StatsCard
          title="Open incidents (30d)"
          value={summary ? String(summary.openIncidents) : "—"}
          icon={AlertTriangle}
          color="red"
          pulse={Boolean(summary?.openIncidents)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <UsageChart data={usageData} />
        </div>
        <div className="lg:col-span-1 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Top searched routes (30d)</h2>
          <div className="space-y-3">
            {topRoutes.slice(0, 5).map((route, index) => (
              <div key={`${route.route}-${index}`}>
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-300 truncate pr-3">{route.route}</span>
                  <span className="text-white font-medium">{route.usage}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.max(8, Number(route.pct) || 0)}%` }}
                  />
                </div>
              </div>
            ))}
            {topRoutes.length === 0 && (
              <p className="text-sm text-gray-500">No route usage data yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent incidents</h2>
            <Link to="/admin/incidents" className="text-blue-400 text-sm hover:text-blue-300">
              Open all
            </Link>
          </div>
          <div className="space-y-3">
            {incidents.slice(0, 6).map((inc) => (
              <div key={inc.id} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600/60">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white font-medium truncate">{inc.title || inc.description || "Incident"}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${incidentBadge(inc.status)}`}>
                    {String(inc.status || "active")}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {inc.route_no ? `Route ${inc.route_no} · ` : ""}
                  {inc.severity || "low"} severity
                </p>
              </div>
            ))}
            {incidents.length === 0 && (
              <p className="text-sm text-gray-500">No incidents reported.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Feedback inbox snapshot</h2>
            <Link to="/admin/feedback" className="text-blue-400 text-sm hover:text-blue-300">
              Open inbox
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Total</p>
              <p className="text-xl text-white font-semibold">{feedback.length}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Open</p>
              <p className="text-xl text-amber-300 font-semibold">{feedbackOpenCount}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Resolved</p>
              <p className="text-xl text-green-300 font-semibold">{Math.max(0, feedback.length - feedbackOpenCount)}</p>
            </div>
          </div>
          <div className="space-y-2">
            {feedback.slice(0, 4).map((fb) => (
              <div key={fb.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-700/70 last:border-0">
                <p className="text-sm text-gray-300 truncate">{fb.subject || fb.message || "Feedback entry"}</p>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-700 text-gray-300 capitalize">
                  {fb.type || "general"}
                </span>
              </div>
            ))}
            {feedback.length === 0 && (
              <p className="text-sm text-gray-500">No feedback entries yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Peak search windows</h2>
          <div className="space-y-3">
            {peakHours.slice(0, 3).map((slot, index) => (
              <div key={`${slot.label}-${index}`} className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="text-blue-300" />
                    <p className="text-white text-sm font-medium">{slot.label}</p>
                  </div>
                  <span className="text-blue-300 text-xs">{slot.count} searches</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{slot.time}</p>
              </div>
            ))}
            {peakHours.length === 0 && (
              <p className="text-sm text-gray-500">No peak-hour data available.</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Reports snapshot</h2>
            <Link to="/admin/reports" className="text-blue-400 text-sm hover:text-blue-300">
              Open reports
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Yearly reports</p>
              <p className="text-xl text-white font-semibold">{reportsOverview.stats.totalReportsYear || 0}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Scheduled</p>
              <p className="text-xl text-white font-semibold">{reportsOverview.stats.scheduledReports || 0}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Stored</p>
              <p className="text-xl text-white font-semibold">{reportsOverview.stats.totalReports || 0}</p>
            </div>
          </div>
          <div className="space-y-2">
            {reportsOverview.recentReports.slice(0, 4).map((report) => (
              <div key={report.id} className="flex items-center justify-between py-2 border-b border-slate-700/70 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={15} className="text-cyan-300 shrink-0" />
                  <p className="text-sm text-gray-300 truncate">{report.title || report.type || `Report ${report.id}`}</p>
                </div>
                <span className="text-xs text-gray-500 shrink-0">
                  {report.created_at ? new Date(report.created_at).toLocaleDateString() : "-"}
                </span>
              </div>
            ))}
            {reportsOverview.recentReports.length === 0 && (
              <p className="text-sm text-gray-500">No generated reports yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
