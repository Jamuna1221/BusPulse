import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, Bell, Filter, Search, CheckCircle, X } from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'critical',
      category: 'Device',
      title: 'GPS Signal Lost - Bus 23',
      message: 'Device DEV-001 stopped transmitting location data',
      timestamp: '5 mins ago',
      status: 'active',
      busNumber: 'Bus 23',
      deviceId: 'DEV-001',
    },
    {
      id: 2,
      type: 'warning',
      category: 'Data',
      title: 'High Data Usage Detected',
      message: 'Unusual data consumption pattern detected on Route A',
      timestamp: '15 mins ago',
      status: 'active',
      busNumber: 'Multiple',
      deviceId: 'N/A',
    },
    {
      id: 3,
      type: 'critical',
      category: 'Device',
      title: 'Device 12: GPS Signal Lost',
      message: 'No location updates received for the past 30 minutes',
      timestamp: '30 mins ago',
      status: 'active',
      busNumber: 'Bus 12',
      deviceId: 'DEV-003',
    },
    {
      id: 4,
      type: 'error',
      category: 'Security',
      title: 'Failed Login Attempt',
      message: 'Multiple failed login attempts detected from IP: 192.168.1.45',
      timestamp: '1 hour ago',
      status: 'acknowledged',
      busNumber: 'N/A',
      deviceId: 'N/A',
    },
    {
      id: 5,
      type: 'warning',
      category: 'System',
      title: 'Low Battery Warning',
      message: 'Device DEV-004 battery level at 12%',
      timestamp: '2 hours ago',
      status: 'resolved',
      busNumber: 'Bus 67',
      deviceId: 'DEV-004',
    },
    {
      id: 6,
      type: 'info',
      category: 'System',
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance window: Tonight 2:00 AM - 4:00 AM',
      timestamp: '3 hours ago',
      status: 'acknowledged',
      busNumber: 'N/A',
      deviceId: 'N/A',
    },
  ]);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'critical':
      case 'error':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          icon: 'text-red-400',
        };
      case 'warning':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          icon: 'text-orange-400',
        };
      case 'info':
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/30',
          text: 'text-blue-400',
          icon: 'text-blue-400',
        };
      default:
        return {
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/30',
          text: 'text-gray-400',
          icon: 'text-gray-400',
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
            Active
          </span>
        );
      case 'acknowledged':
        return (
          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
            Acknowledged
          </span>
        );
      case 'resolved':
        return (
          <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Alert Management</h1>
          <p className="text-gray-400 mt-1">Monitor and respond to system alerts</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
          <Bell size={20} />
          Configure Alerts
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Alerts</p>
            <Bell className="text-blue-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">234</p>
          <p className="text-gray-400 text-sm mt-2">Last 24 hours</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Active</p>
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-3xl font-bold text-red-400">18</p>
          <p className="text-gray-400 text-sm mt-2">Needs attention</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Acknowledged</p>
            <AlertTriangle className="text-orange-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-orange-400">45</p>
          <p className="text-gray-400 text-sm mt-2">In progress</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Resolved</p>
            <CheckCircle className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-400">171</p>
          <p className="text-gray-400 text-sm mt-2">Today</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search alerts by title, bus number, or device..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
              <Filter size={20} />
              Filter by Type
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
              Category
            </button>
          </div>
        </div>
      </div>

      {/* Alert Categories Quick Filter */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {['All', 'Critical', 'Warning', 'Info', 'Device', 'System', 'Security'].map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              category === 'All'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.map((alert) => {
          const colors = getAlertColor(alert.type);
          return (
            <div
              key={alert.id}
              className={`${colors.bg} border ${colors.border} rounded-xl p-6 hover:border-opacity-50 transition-all`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`${colors.icon} mt-1`}>
                  {getAlertIcon(alert.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`${colors.text} font-bold text-lg`}>{alert.title}</h3>
                        <span className={`px-2 py-0.5 ${colors.bg} ${colors.text} rounded text-xs font-medium uppercase`}>
                          {alert.type}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-700 text-gray-300 rounded text-xs font-medium">
                          {alert.category}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{alert.message}</p>
                    </div>
                    {getStatusBadge(alert.status)}
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-6 mt-3 text-sm">
                    {alert.busNumber !== 'N/A' && (
                      <div>
                        <span className="text-gray-400">Bus: </span>
                        <span className="text-white font-medium">{alert.busNumber}</span>
                      </div>
                    )}
                    {alert.deviceId !== 'N/A' && (
                      <div>
                        <span className="text-gray-400">Device: </span>
                        <span className="text-blue-400">{alert.deviceId}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">{alert.timestamp}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    {alert.status === 'active' && (
                      <>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                          Acknowledge
                        </button>
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                          Resolve
                        </button>
                      </>
                    )}
                    {alert.status === 'acknowledged' && (
                      <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm">
                        Mark as Resolved
                      </button>
                    )}
                    <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                      View Details
                    </button>
                    {alert.status !== 'resolved' && (
                      <button className="ml-auto p-2 text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Alerts;