import { useEffect, useMemo, useState } from "react";
import { Bell, AlertTriangle, MessageSquare, Timer, Check, X } from "lucide-react";
import { schedulerNotificationsAPI } from "../../config/api";

const typeColors = {
  incident: "border-l-red-500 bg-red-500/5",
  delay: "border-l-yellow-500 bg-yellow-500/5",
  query: "border-l-blue-500 bg-blue-500/5",
};

const iconColors = {
  incident: "text-red-400 bg-red-400/10",
  delay: "text-yellow-300 bg-yellow-400/10",
  query: "text-blue-400 bg-blue-400/10",
};

const typeIcon = {
  incident: AlertTriangle,
  delay: Timer,
  query: MessageSquare,
};

function timeAgo(iso) {
  const d = new Date(iso);
  const sec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr > 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? "s" : ""} ago`;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [delayInputs, setDelayInputs] = useState({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");
    schedulerNotificationsAPI
      .getAll({ limit: 200 })
      .then((res) => {
        if (!mounted) return;
        const normalized = (res.data || []).map((n) => ({
          id: n.id,
          incidentId: n.incident_id ?? null,
          serviceId: n.service_id ?? null,
          type: n.type === "incident" ? "incident" : n.type === "delay" ? "delay" : "query",
          title: n.title,
          message: n.message,
          routeLabel: n.route_no
            ? `${n.route_no}${n.from_place && n.to_place ? ` (${n.from_place} → ${n.to_place})` : ""}`
            : null,
          reporter: n.reported_by || "Passenger",
          time: timeAgo(n.created_at),
          schedulerConfirmed: Boolean(n.scheduler_confirmed),
          resolvedAt: n.resolved_at || null,
          read: false,
        }));
        setNotifications(normalized);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || "Failed to load notifications.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === filter);
  }, [filter, notifications]);

  const markRead = (id) => setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setNotifications(notifications.map((n) => ({ ...n, read: true })));
  const dismiss = (id) => setNotifications(notifications.filter((n) => n.id !== id));
  const confirmIncident = async (item) => {
    if (!item.incidentId) return;
    try {
      await schedulerNotificationsAPI.confirmIncident(item.incidentId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id
            ? {
                ...n,
                schedulerConfirmed: true,
                title: "Accident confirmed by scheduler",
                read: true,
              }
            : n
        )
      );
    } catch (e) {
      setError(e.message || "Failed to confirm incident.");
    }
  };
  const resolveIncident = async (item) => {
    if (!item.incidentId) return;
    try {
      await schedulerNotificationsAPI.resolveIncident(item.incidentId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id
            ? {
                ...n,
                schedulerConfirmed: false,
                resolvedAt: new Date().toISOString(),
                title: "Incident resolved by scheduler",
                read: true,
              }
            : n
        )
      );
    } catch (e) {
      setError(e.message || "Failed to resolve incident.");
    }
  };
  const confirmDelay = async (item, minutes = 20) => {
    if (!item.serviceId) return;
    const safeMinutes = Math.max(1, Math.min(180, Number(minutes) || 20));
    try {
      await schedulerNotificationsAPI.confirmDelay(item.serviceId, safeMinutes);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id
            ? {
                ...n,
                title: `Likely delayed by ${safeMinutes} mins`,
                message: `Scheduler reported ${safeMinutes} mins delay`,
                read: true,
              }
            : n
        )
      );
    } catch (e) {
      setError(e.message || "Failed to confirm delay.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Notifications</h1>
          <p className="text-gray-400 mt-1">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm transition-colors">
            <Check size={16} /> Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All" },
          { key: "unread", label: `Unread (${unreadCount})` },
          { key: "incident", label: "Incidents" },
          { key: "delay", label: "Delays" },
          { key: "query", label: "Queries" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.key ? "bg-green-600 text-white" : "bg-slate-800 border border-slate-700 text-gray-300 hover:bg-slate-700"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading && <div className="text-gray-400 text-sm">Loading notifications...</div>}
        {!loading && error && <div className="text-red-400 text-sm">{error}</div>}
        {!loading && !error && filtered.map((n) => {
          const Icon = typeIcon[n.type] || Bell;
          return (
          <div key={n.id} className={`border-l-4 rounded-xl p-4 ${typeColors[n.type]} ${!n.read ? "bg-slate-800" : "bg-slate-800/50"} border border-slate-700 transition-all`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColors[n.type]}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-medium ${!n.read ? "text-white" : "text-gray-300"}`}>{n.title}</h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-400/10 rounded-lg" title="Mark read">
                        <Check size={14} />
                      </button>
                    )}
                    {n.type === "incident" && !n.schedulerConfirmed && !n.resolvedAt && (
                      <button
                        onClick={() => confirmIncident(n)}
                        className="px-2 py-1 text-xs rounded-lg text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/10"
                        title="Confirm incident"
                      >
                        Confirm
                      </button>
                    )}
                    {n.type === "incident" && n.schedulerConfirmed && !n.resolvedAt && (
                      <>
                        <span className="px-2 py-1 text-xs rounded-lg text-emerald-300 border border-emerald-500/40">
                          Confirmed
                        </span>
                        <button
                          onClick={() => resolveIncident(n)}
                          className="px-2 py-1 text-xs rounded-lg text-blue-300 border border-blue-500/40 hover:bg-blue-500/10"
                          title="Resolve incident"
                        >
                          Resolve
                        </button>
                      </>
                    )}
                    {n.type === "incident" && n.resolvedAt && (
                      <span className="px-2 py-1 text-xs rounded-lg text-blue-300 border border-blue-500/40">
                        Resolved
                      </span>
                    )}
                    {n.type === "delay" && (
                      <div className="flex items-center gap-1 flex-wrap justify-end">
                        {[10, 15, 20].map((m) => (
                          <button
                            key={m}
                            onClick={() => confirmDelay(n, m)}
                            className="px-2 py-1 text-xs rounded-lg text-yellow-300 border border-yellow-500/40 hover:bg-yellow-500/10"
                            title={`Verify likely delayed ${m} mins`}
                          >
                            {m}m
                          </button>
                        ))}
                        <input
                          type="number"
                          min={1}
                          max={180}
                          value={delayInputs[n.id] ?? ""}
                          onChange={(e) =>
                            setDelayInputs((prev) => ({ ...prev, [n.id]: e.target.value }))
                          }
                          placeholder="min"
                          className="w-16 px-2 py-1 text-xs rounded-lg bg-slate-900 border border-yellow-500/40 text-yellow-200"
                        />
                        <button
                          onClick={() => confirmDelay(n, delayInputs[n.id] || 20)}
                          className="px-2 py-1 text-xs rounded-lg text-yellow-200 border border-yellow-400/60 hover:bg-yellow-500/15"
                          title="Verify custom delay"
                        >
                          Verify
                        </button>
                      </div>
                    )}
                    <button onClick={() => dismiss(n.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg" title="Dismiss">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-1">{n.message}</p>
                {n.routeLabel && <p className="text-gray-500 text-xs mt-2">Route: {n.routeLabel}</p>}
                <p className="text-gray-500 text-xs mt-1">Reported by: {n.reporter}</p>
                <p className="text-gray-500 text-xs mt-2">{n.time}</p>
              </div>
            </div>
          </div>
        )})}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Bell size={48} className="mx-auto mb-4 opacity-30" />
            <p>No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
