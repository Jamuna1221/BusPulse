import { useState } from "react";
import { BarChart3, Download, TrendingUp, Bus, Map, Clock, Users } from "lucide-react";

const ReportsAnalytics = () => {
  const tripsPerDay = [
    { day: "Mon", count: 42 }, { day: "Tue", count: 38 }, { day: "Wed", count: 45 },
    { day: "Thu", count: 50 }, { day: "Fri", count: 48 }, { day: "Sat", count: 30 }, { day: "Sun", count: 22 },
  ];
  const maxTrips = Math.max(...tripsPerDay.map((d) => d.count));

  const topRoutes = [
    { route: "Madurai → Theni", trips: 120, percentage: 85 },
    { route: "Theni → Bodinayakanur", trips: 95, percentage: 67 },
    { route: "Periyakulam → Madurai", trips: 88, percentage: 62 },
    { route: "Cumbum → Theni", trips: 72, percentage: 51 },
    { route: "Andipatti → Madurai", trips: 65, percentage: 46 },
  ];

  const driverPerformance = [
    { name: "Kumar S.", trips: 48, onTime: 96, rating: "Excellent" },
    { name: "Ravi M.", trips: 42, onTime: 91, rating: "Good" },
    { name: "Suresh K.", trips: 39, onTime: 88, rating: "Good" },
    { name: "Senthil R.", trips: 44, onTime: 94, rating: "Excellent" },
    { name: "Vijay P.", trips: 35, onTime: 82, rating: "Average" },
  ];

  const ratingColors = { Excellent: "text-green-400", Good: "text-blue-400", Average: "text-orange-400" };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-400 mt-1">Fleet performance insights and statistics</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg transition-colors">
          <Download size={18} /> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Trips (Month)", value: "275", icon: Bus, color: "bg-blue-500" },
          { label: "Avg. Daily Trips", value: "39", icon: TrendingUp, color: "bg-green-500" },
          { label: "On-Time Rate", value: "91%", icon: Clock, color: "bg-cyan-500" },
          { label: "Delay Frequency", value: "9%", icon: BarChart3, color: "bg-orange-500" },
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
        {/* Trips Per Day */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Trips Per Day (This Week)</h2>
          <div className="flex items-end gap-3 h-48">
            {tripsPerDay.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-gray-400">{d.count}</span>
                <div className="w-full bg-green-500/80 rounded-t-lg hover:bg-green-400 transition-colors" style={{ height: `${(d.count / maxTrips) * 100}%` }}></div>
                <span className="text-xs text-gray-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bus Utilization */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Bus Utilization (%)</h2>
          <div className="space-y-4">
            {[
              { label: "Active", value: 75, color: "bg-green-500" },
              { label: "Maintenance", value: 12, color: "bg-orange-500" },
              { label: "Idle", value: 13, color: "bg-gray-500" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{item.label}</span>
                  <span className="text-white font-medium">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div className={`${item.color} h-3 rounded-full`} style={{ width: `${item.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Routes */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Most Used Routes</h2>
          <div className="space-y-3">
            {topRoutes.map((r, i) => (
              <div key={r.route} className="flex items-center gap-3">
                <span className="text-gray-500 text-sm w-6">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{r.route}</span>
                    <span className="text-white font-medium">{r.trips} trips</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${r.percentage}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Performance */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Driver Performance</h2>
          <div className="space-y-3">
            {driverPerformance.map((d) => (
              <div key={d.name} className="flex items-center justify-between py-2 px-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=334155&color=fff&size=32`} alt={d.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <p className="text-white text-sm font-medium">{d.name}</p>
                    <p className="text-gray-500 text-xs">{d.trips} trips this month</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{d.onTime}%</p>
                  <p className={`text-xs ${ratingColors[d.rating]}`}>{d.rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
