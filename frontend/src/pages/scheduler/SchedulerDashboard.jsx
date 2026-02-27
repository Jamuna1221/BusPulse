import { useState } from "react";
import { Bus, Map, Users, CalendarDays, AlertTriangle, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

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
  const [stats] = useState({
    totalBuses: 24,
    totalRoutes: 18,
    totalDrivers: 32,
    todaysTrips: 48,
    delayedTrips: 3,
    activeIssues: 2,
  });

  const tripsData = [
    { day: "Mon", trips: 42 },
    { day: "Tue", trips: 38 },
    { day: "Wed", trips: 45 },
    { day: "Thu", trips: 50 },
    { day: "Fri", trips: 48 },
    { day: "Sat", trips: 30 },
    { day: "Sun", trips: 22 },
  ];

  const maxTrips = Math.max(...tripsData.map((d) => d.trips));

  const recentTrips = [
    { id: 1, bus: "TN72-AB-1234", route: "Madurai → Theni", driver: "Kumar S.", departure: "06:30 AM", status: "On Time" },
    { id: 2, bus: "TN72-CD-5678", route: "Theni → Bodinayakanur", driver: "Ravi M.", departure: "07:00 AM", status: "Delayed" },
    { id: 3, bus: "TN72-EF-9012", route: "Periyakulam → Madurai", driver: "Suresh K.", departure: "07:30 AM", status: "On Time" },
    { id: 4, bus: "TN72-GH-3456", route: "Cumbum → Theni", driver: "Senthil R.", departure: "08:00 AM", status: "Completed" },
    { id: 5, bus: "TN72-IJ-7890", route: "Andipatti → Madurai", driver: "Vijay P.", departure: "08:30 AM", status: "On Time" },
  ];

  const statusColors = {
    "On Time": "text-green-400 bg-green-400/10",
    Delayed: "text-red-400 bg-red-400/10",
    Completed: "text-blue-400 bg-blue-400/10",
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
        <StatCard title="Total Buses" value={stats.totalBuses} icon={Bus} color="blue" trend={{ value: 4, isPositive: true }} />
        <StatCard title="Total Routes" value={stats.totalRoutes} icon={Map} color="green" />
        <StatCard title="Total Drivers" value={stats.totalDrivers} icon={Users} color="purple" trend={{ value: 8, isPositive: true }} />
        <StatCard title="Today's Trips" value={stats.todaysTrips} icon={CalendarDays} color="cyan" />
        <StatCard title="Delayed Trips" value={stats.delayedTrips} icon={AlertTriangle} color="orange" />
        <StatCard title="Active Issues" value={stats.activeIssues} icon={AlertCircle} color="red" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trips per Day Chart */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Trips This Week</h2>
          <div className="flex items-end gap-4 h-48">
            {tripsData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-gray-400">{d.trips}</span>
                <div
                  className="w-full bg-green-500/80 rounded-t-lg transition-all hover:bg-green-400"
                  style={{ height: `${(d.trips / maxTrips) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bus Utilization */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Bus Utilization</h2>
          <div className="space-y-4">
            {[
              { label: "Active", value: 75, color: "bg-green-500" },
              { label: "Maintenance", value: 12, color: "bg-orange-500" },
              { label: "Inactive", value: 13, color: "bg-gray-500" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{item.label}</span>
                  <span className="text-white font-medium">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.value}%` }}></div>
                </div>
              </div>
            ))}
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
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-3 px-4">Bus</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-3 px-4">Route</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-3 px-4">Driver</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-3 px-4">Departure</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((trip) => (
                <tr key={trip.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4 text-white font-medium text-sm">{trip.bus}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{trip.route}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{trip.driver}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{trip.departure}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[trip.status]}`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SchedulerDashboard;
