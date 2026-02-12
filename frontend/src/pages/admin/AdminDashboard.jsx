import { useState, useEffect } from 'react';
import { Users, UserCheck, Smartphone, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import StatsCard from './StatsCard';
import UsageChart from './UsageChart';
import DeviceStatusChart from './DeviceStatusChart';
import RecentAlerts from './RecentAlerts';
import SystemLogs from './SystemLogs';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 12450,
    activeUsersToday: 845,
    totalDevices: 320,
    activeAlerts: 5,
  });

  const [usageData, setUsageData] = useState([
    { day: 'Mon', sessions: 45 },
    { day: 'Mon', sessions: 55 },
    { day: 'Tue', sessions: 38 },
    { day: 'Wed', sessions: 65 },
    { day: 'Thu', sessions: 78 },
    { day: 'Fri', sessions: 62 },
    { day: 'Sat', sessions: 72 },
    { day: 'Sun', sessions: 58 },
  ]);

  const [deviceStatus, setDeviceStatus] = useState({
    online: 65,
    offline: 25,
    error: 10,
  });

  const [recentAlerts, setRecentAlerts] = useState([
    {
      id: 1,
      type: 'error',
      message: 'Bus 23: Connection Lost',
      time: '5 mins ago',
    },
    {
      id: 2,
      type: 'warning',
      message: 'High Data Usage Detected',
      time: '15 mins ago',
    },
    {
      id: 3,
      type: 'error',
      message: 'Device 12: GPS Signal Lost',
      time: '30 mins ago',
    },
    {
      id: 4,
      type: 'error',
      message: 'Failed Login Attempt',
      time: '1 hour ago',
    },
  ]);

  const [systemLogs, setSystemLogs] = useState([
    {
      id: 1,
      name: 'Data Backup Completed',
      today: 'Today 10:15 AM',
      total: '10:15 AM',
      status: 'success',
    },
    {
      id: 2,
      name: 'Device 12 Updated Settings',
      today: 'Yesterday 03:45PM',
      total: '03:45 PM',
      status: 'success',
    },
    {
      id: 3,
      name: 'User "admin" Logged In',
      today: 'Yesterday 08:20 AM',
      total: '08:20 AM',
      status: 'success',
    },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => ({
        ...prev,
        activeUsersToday: prev.activeUsersToday + Math.floor(Math.random() * 3 - 1),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome back, Admin. Here's what's happening today.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Active Users Today"
          value={stats.activeUsersToday.toLocaleString()}
          icon={UserCheck}
          color="blue"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Devices"
          value={stats.totalDevices.toLocaleString()}
          icon={Smartphone}
          color="blue"
          trend={{ value: 3, isPositive: false }}
        />
        <StatsCard
          title="Active Alerts"
          value={stats.activeAlerts}
          icon={AlertTriangle}
          color="red"
          pulse={true}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage Overview */}
        <div className="lg:col-span-2">
          <UsageChart data={usageData} />
        </div>

        {/* Device Status */}
        <div className="lg:col-span-1">
          <DeviceStatusChart data={deviceStatus} />
        </div>
      </div>

      {/* Alerts and Logs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <RecentAlerts alerts={recentAlerts} />

        {/* System Logs */}
        <SystemLogs logs={systemLogs} />
      </div>

      {/* Bottom System Logs Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">System Logs</h2>
          <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
            View Logs
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {systemLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between py-3 px-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">{log.name}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <span className="text-gray-400">{log.today}</span>
                <span className="text-green-400">{log.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard ;