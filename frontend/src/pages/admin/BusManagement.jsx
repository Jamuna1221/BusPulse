import { useState } from 'react';
import { Bus, Plus, Search, MapPin, Clock, AlertCircle, CheckCircle, Power } from 'lucide-react';

const BusManagement = () => {
  const [buses, setBuses] = useState([
    {
      id: 1,
      busNumber: 'Bus 23',
      route: 'Route A - Chennai Central to Tambaram',
      status: 'active',
      driver: 'Rajesh Kumar',
      deviceId: 'DEV-001',
      currentLocation: 'Guindy',
      nextStop: 'Velachery',
      capacity: 45,
      occupancy: 32,
      lastUpdated: '2 mins ago',
    },
    {
      id: 2,
      busNumber: 'Bus 45',
      route: 'Route B - T Nagar to Airport',
      status: 'active',
      driver: 'Suresh Babu',
      deviceId: 'DEV-002',
      currentLocation: 'Ashok Nagar',
      nextStop: 'Airport',
      capacity: 50,
      occupancy: 38,
      lastUpdated: '1 min ago',
    },
    {
      id: 3,
      busNumber: 'Bus 12',
      route: 'Route C - Adyar to Velachery',
      status: 'unavailable',
      driver: 'N/A',
      deviceId: 'DEV-003',
      currentLocation: 'Depot',
      nextStop: 'N/A',
      capacity: 45,
      occupancy: 0,
      lastUpdated: '30 mins ago',
      incident: 'Vehicle breakdown',
    },
    {
      id: 4,
      busNumber: 'Bus 67',
      route: 'Route D - Porur to OMR',
      status: 'maintenance',
      driver: 'N/A',
      deviceId: 'DEV-004',
      currentLocation: 'Service Center',
      nextStop: 'N/A',
      capacity: 48,
      occupancy: 0,
      lastUpdated: '1 hour ago',
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'unavailable':
        return 'bg-red-500/20 text-red-400';
      case 'maintenance':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getOccupancyColor = (occupancy, capacity) => {
    const percentage = (occupancy / capacity) * 100;
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Bus Management</h1>
          <p className="text-gray-400 mt-1">Monitor and manage fleet operations in real-time</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
          <Plus size={20} />
          Add Bus
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Fleet</p>
            <Bus className="text-blue-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">87</p>
          <p className="text-gray-400 text-sm mt-2">Registered buses</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Active Now</p>
            <CheckCircle className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-400">56</p>
          <p className="text-gray-400 text-sm mt-2">On routes</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Unavailable</p>
            <AlertCircle className="text-red-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-red-400">12</p>
          <p className="text-gray-400 text-sm mt-2">Incidents/breakdowns</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Maintenance</p>
            <Power className="text-orange-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-orange-400">19</p>
          <p className="text-gray-400 text-sm mt-2">Scheduled service</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by bus number, route, or driver..."
            className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Bus Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {buses.map((bus) => (
          <div key={bus.id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-bold text-xl">{bus.busNumber}</h3>
                <p className="text-gray-400 text-sm mt-1">{bus.route}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(bus.status)}`}>
                {bus.status}
              </span>
            </div>

            {/* Incident Alert */}
            {bus.incident && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400" />
                <span className="text-red-400 text-sm">{bus.incident}</span>
              </div>
            )}

            {/* Details Grid */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Driver</span>
                <span className="text-white text-sm">{bus.driver}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Device ID</span>
                <span className="text-blue-400 text-sm">{bus.deviceId}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Current Location</span>
                <span className="text-white text-sm flex items-center gap-1">
                  <MapPin size={14} />
                  {bus.currentLocation}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Next Stop</span>
                <span className="text-white text-sm flex items-center gap-1">
                  <Clock size={14} />
                  {bus.nextStop}
                </span>
              </div>
            </div>

            {/* Occupancy Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Occupancy</span>
                <span className="text-white text-sm">{bus.occupancy}/{bus.capacity}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getOccupancyColor(bus.occupancy, bus.capacity)}`}
                  style={{ width: `${(bus.occupancy / bus.capacity) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-700">
              <span className="text-gray-400 text-xs">Updated {bus.lastUpdated}</span>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusManagement;