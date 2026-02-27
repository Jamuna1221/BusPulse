import { useState } from "react";
import { Bell, Wrench, AlertTriangle, Users, Calendar, Check, X } from "lucide-react";

const INITIAL_NOTIFICATIONS = [
  { id: 1, type: "maintenance", icon: Wrench, title: "Bus TN72-EF-9012 maintenance due", message: "Scheduled maintenance in 3 days. Please arrange a replacement bus for Route R-103.", time: "10 minutes ago", read: false },
  { id: 2, type: "overlap", icon: Calendar, title: "Overlapping schedule detected", message: "Driver Kumar S. is assigned to two trips at 06:30 AM on Feb 28. Please resolve the conflict.", time: "25 minutes ago", read: false },
  { id: 3, type: "driver", icon: Users, title: "Driver not assigned", message: "Trip on Route R-105 (Feb 28, 09:00 AM) has no driver assigned yet.", time: "1 hour ago", read: false },
  { id: 4, type: "alert", icon: AlertTriangle, title: "Low driver availability", message: "Only 2 drivers available for tomorrow's 8 scheduled trips. Consider rescheduling or calling backup drivers.", time: "2 hours ago", read: true },
  { id: 5, type: "maintenance", icon: Wrench, title: "Bus TN72-IJ-7890 oil change required", message: "Oil change was due 500km ago. Please schedule maintenance immediately.", time: "3 hours ago", read: true },
  { id: 6, type: "overlap", icon: Calendar, title: "Bus double-booked", message: "Bus TN72-AB-1234 is assigned to overlapping trips on Feb 27 at 08:00 AM.", time: "5 hours ago", read: true },
  { id: 7, type: "alert", icon: AlertTriangle, title: "Trip delay reported", message: "Trip on Route R-101 (Madurai → Theni) is delayed by 15 minutes.", time: "6 hours ago", read: true },
];

const typeColors = {
  maintenance: "border-l-orange-500 bg-orange-500/5",
  overlap: "border-l-red-500 bg-red-500/5",
  driver: "border-l-blue-500 bg-blue-500/5",
  alert: "border-l-yellow-500 bg-yellow-500/5",
};

const iconColors = {
  maintenance: "text-orange-400 bg-orange-400/10",
  overlap: "text-red-400 bg-red-400/10",
  driver: "text-blue-400 bg-blue-400/10",
  alert: "text-yellow-400 bg-yellow-400/10",
};

const Notifications = () => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = filter === "all" ? notifications : filter === "unread" ? notifications.filter((n) => !n.read) : notifications.filter((n) => n.type === filter);

  const markRead = (id) => setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setNotifications(notifications.map((n) => ({ ...n, read: true })));
  const dismiss = (id) => setNotifications(notifications.filter((n) => n.id !== id));

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
          { key: "maintenance", label: "Maintenance" },
          { key: "overlap", label: "Overlaps" },
          { key: "driver", label: "Drivers" },
          { key: "alert", label: "Alerts" },
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
        {filtered.map((n) => (
          <div key={n.id} className={`border-l-4 rounded-xl p-4 ${typeColors[n.type]} ${!n.read ? "bg-slate-800" : "bg-slate-800/50"} border border-slate-700 transition-all`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColors[n.type]}`}>
                <n.icon size={20} />
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
                    <button onClick={() => dismiss(n.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg" title="Dismiss">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-1">{n.message}</p>
                <p className="text-gray-500 text-xs mt-2">{n.time}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
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
