import { TrendingUp, Users, Bus, Clock, Download } from 'lucide-react';

const Analytics = () => {
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">Total Rides</p>
            <Bus className="text-blue-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">45,231</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-green-400 text-sm">+18.2%</span>
            <span className="text-gray-500 text-sm">vs last month</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">Active Users</p>
            <Users className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">12,450</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-green-400 text-sm">+12.5%</span>
            <span className="text-gray-500 text-sm">vs last month</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">Avg Trip Time</p>
            <Clock className="text-purple-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">42 min</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={16} className="text-red-400 rotate-180" />
            <span className="text-green-400 text-sm">-3.2%</span>
            <span className="text-gray-500 text-sm">faster</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-400 text-sm">On-Time Rate</p>
            <TrendingUp className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">87.3%</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={16} className="text-green-400" />
            <span className="text-green-400 text-sm">+5.1%</span>
            <span className="text-gray-500 text-sm">improvement</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">User Growth Trend</h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {[65, 72, 68, 85, 92, 88, 95, 78, 82, 90, 97, 100].map((height, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-blue-600 rounded-t-lg hover:bg-blue-500 transition-all cursor-pointer relative group"
                     style={{ height: `${height}%` }}>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {Math.round(12450 * (height / 100))} users
                  </div>
                </div>
                <span className="text-gray-500 text-xs">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Route Performance */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Top Routes by Usage</h2>
          <div className="space-y-4">
            {[
              { route: 'Route A - Chennai Central to Tambaram', usage: 92 },
              { route: 'Route B - T Nagar to Airport', usage: 85 },
              { route: 'Route C - Adyar to Velachery', usage: 78 },
              { route: 'Route D - Porur to OMR', usage: 72 },
              { route: 'Route E - Anna Nagar to Guindy', usage: 65 },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm">{item.route}</span>
                  <span className="text-white font-semibold">{item.usage}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${item.usage}%` }}
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
            {[
              { time: '8:00 AM - 10:00 AM', percentage: 85, label: 'Morning Rush' },
              { time: '5:00 PM - 7:00 PM', percentage: 90, label: 'Evening Rush' },
              { time: '12:00 PM - 2:00 PM', percentage: 60, label: 'Lunch Time' },
            ].map((peak, index) => (
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

        {/* Device Health */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Device Health Score</h2>
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
                  strokeDashoffset="87.96"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-white">75%</span>
                <span className="text-gray-400 text-xs">Healthy</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Battery Issues:</span>
              <span className="text-orange-400">12 devices</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">GPS Signal Loss:</span>
              <span className="text-red-400">8 devices</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Optimal:</span>
              <span className="text-green-400">240 devices</span>
            </div>
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Customer Satisfaction</h2>
          <div className="text-center mb-4">
            <div className="text-5xl font-bold text-white mb-2">4.2</div>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-6 h-6 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="text-gray-400 text-sm">Based on 1,247 reviews</p>
          </div>
          <div className="space-y-2">
            {[
              { stars: 5, count: 687, percentage: 55 },
              { stars: 4, count: 374, percentage: 30 },
              { stars: 3, count: 125, percentage: 10 },
              { stars: 2, count: 37, percentage: 3 },
              { stars: 1, count: 24, percentage: 2 },
            ].map((rating) => (
              <div key={rating.stars} className="flex items-center gap-2">
                <span className="text-gray-400 text-sm w-8">{rating.stars}★</span>
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{ width: `${rating.percentage}%` }}
                  ></div>
                </div>
                <span className="text-gray-400 text-xs w-12 text-right">{rating.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;