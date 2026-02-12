import { useState } from 'react';
import { Search, Filter, Plus, Wifi, WifiOff, AlertCircle, MoreVertical, MapPin, Battery } from 'lucide-react';

const Devices = () => {
  const [devices, setDevices] = useState([
    {
      id: 1,
      deviceId: 'DEV-001',
      busNumber: 'Bus 23',
      route: 'Route A - Chennai Central to Tambaram',
      status: 'online',
      lastSignal: '2 mins ago',
      battery: 87,
      location: 'Guindy',
      firmwareVersion: 'v2.3.1',
    },
    {
      id: 2,
      deviceId: 'DEV-002',
      busNumber: 'Bus 45',
      route: 'Route B - T Nagar to Airport',
      status: 'online',
      lastSignal: '1 min ago',
      battery: 92,
      location: 'Ashok Nagar',
      firmwareVersion: 'v2.3.1',
    },
    {
      id: 3,
      deviceId: 'DEV-003',
      busNumber: 'Bus 12',
      route: 'Route C - Adyar to Velachery',
      status: 'offline',
      lastSignal: '30 mins ago',
      battery: 45,
      location: 'Adyar',
      firmwareVersion: 'v2.2.8',
    },
    {
      id: 4,
      deviceId: 'DEV-004',
      busNumber: 'Bus 67',
      route: 'Route D - Porur to OMR',
      status: 'error',
      lastSignal: '1 hour ago',
      battery: 12,
      location: 'Unknown',
      firmwareVersion: 'v2.3.1',
    },
  ]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <Wifi size={18} className="text-green-400" />;
      case 'offline':
        return <WifiOff size={18} className="text-orange-400" />;
      case 'error':
        return <AlertCircle size={18} className="text-red-400" />;
      default:
        return <WifiOff size={18} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500/20 text-green-400';
      case 'offline':
        return 'bg-orange-500/20 text-orange-400';
      case 'error':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getBatteryColor = (battery) => {
    if (battery > 60) return 'text-green-400';
    if (battery > 30) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Device Management</h1>
          <p className="text-gray-400 mt-1">Monitor and manage all GPS tracking devices</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
          <Plus size={20} />
          Register Device
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Devices</p>
            <Wifi className="text-blue-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">320</p>
          <p className="text-gray-400 text-sm mt-2">Registered devices</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Online</p>
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-3xl font-bold text-green-400">208</p>
          <p className="text-gray-400 text-sm mt-2">65% of total</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Offline</p>
            <WifiOff className="text-orange-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-orange-400">80</p>
          <p className="text-gray-400 text-sm mt-2">25% of total</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Errors</p>
            <AlertCircle className="text-red-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-red-400">32</p>
          <p className="text-gray-400 text-sm mt-2">Needs attention</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by device ID or bus number..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <Filter size={20} />
            Filter by Status
          </button>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {devices.map((device) => (
          <div key={device.id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  device.status === 'online' ? 'bg-green-500/20' :
                  device.status === 'offline' ? 'bg-orange-500/20' : 'bg-red-500/20'
                }`}>
                  {getStatusIcon(device.status)}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{device.busNumber}</h3>
                  <p className="text-gray-400 text-sm">{device.deviceId}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-white transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(device.status)}`}>
                  {device.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Route</span>
                <span className="text-white text-sm text-right max-w-xs truncate">{device.route}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Location</span>
                <span className="text-white text-sm flex items-center gap-1">
                  <MapPin size={14} />
                  {device.location}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Battery</span>
                <span className={`text-sm font-medium flex items-center gap-1 ${getBatteryColor(device.battery)}`}>
                  <Battery size={14} />
                  {device.battery}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Last Signal</span>
                <span className="text-white text-sm">{device.lastSignal}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <span className="text-gray-400 text-sm">Firmware</span>
                <span className="text-blue-400 text-sm">{device.firmwareVersion}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                View Details
              </button>
              <button className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Devices;