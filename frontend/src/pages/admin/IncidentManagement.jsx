import { useState } from 'react';
import { AlertTriangle, Plus, Search, MapPin, Clock, User, CheckCircle, XCircle, Loader } from 'lucide-react';

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([
    {
      id: 1,
      type: 'Accident',
      busNumber: 'Bus 23',
      route: 'Route A',
      location: 'Guindy Junction',
      reportedBy: 'Driver - Rajesh Kumar',
      reportedAt: '2024-02-07 10:30 AM',
      status: 'in-progress',
      priority: 'high',
      description: 'Minor collision with auto. No injuries reported. Bus stopped at location.',
      assignedTo: 'Traffic Control Team',
      estimatedResolution: '2 hours',
    },
    {
      id: 2,
      type: 'Breakdown',
      busNumber: 'Bus 12',
      route: 'Route C',
      location: 'Adyar Depot',
      reportedBy: 'Maintenance Staff',
      reportedAt: '2024-02-07 09:15 AM',
      status: 'resolved',
      priority: 'medium',
      description: 'Engine overheating. Bus sent for maintenance.',
      assignedTo: 'Maintenance Team A',
      estimatedResolution: 'Completed',
    },
    {
      id: 3,
      type: 'Emergency',
      busNumber: 'Bus 45',
      route: 'Route B',
      location: 'Airport Road',
      reportedBy: 'Passenger Alert System',
      reportedAt: '2024-02-07 11:00 AM',
      status: 'open',
      priority: 'critical',
      description: 'Medical emergency onboard. Ambulance requested.',
      assignedTo: 'Emergency Response',
      estimatedResolution: 'Immediate',
    },
    {
      id: 4,
      type: 'Route Blockage',
      busNumber: 'Multiple',
      route: 'Route D',
      location: 'OMR - Thoraipakkam',
      reportedBy: 'Traffic Monitoring',
      reportedAt: '2024-02-07 08:45 AM',
      status: 'in-progress',
      priority: 'high',
      description: 'Road construction causing 30-minute delays.',
      assignedTo: 'Route Planning Team',
      estimatedResolution: '4 hours',
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-red-500/20 text-red-400';
      case 'in-progress':
        return 'bg-orange-500/20 text-orange-400';
      case 'resolved':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Accident':
        return '🚗';
      case 'Breakdown':
        return '⚠️';
      case 'Emergency':
        return '🚨';
      case 'Route Blockage':
        return '🚧';
      default:
        return '❗';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={18} className="text-green-400" />;
      case 'in-progress':
        return <Loader size={18} className="text-orange-400 animate-spin" />;
      case 'open':
        return <XCircle size={18} className="text-red-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Incident Management</h1>
          <p className="text-gray-400 mt-1">Track and resolve operational incidents</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
          <Plus size={20} />
          Report Incident
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Incidents</p>
            <AlertTriangle className="text-blue-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">127</p>
          <p className="text-gray-400 text-sm mt-2">This month</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Open</p>
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
          </div>
          <p className="text-3xl font-bold text-red-400">8</p>
          <p className="text-gray-400 text-sm mt-2">Needs attention</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">In Progress</p>
            <Loader className="text-orange-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-orange-400">15</p>
          <p className="text-gray-400 text-sm mt-2">Being resolved</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Resolved</p>
            <CheckCircle className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-400">104</p>
          <p className="text-gray-400 text-sm mt-2">This month</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by bus number, location, or incident type..."
            className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {incidents.map((incident) => (
          <div key={incident.id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="text-3xl">{getTypeIcon(incident.type)}</div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-bold text-lg">{incident.type}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getPriorityColor(incident.priority)}`}>
                      {incident.priority}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">Incident #{incident.id} - {incident.busNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(incident.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(incident.status)}`}>
                  {incident.status.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-4 p-4 bg-slate-700/50 rounded-lg">
              <p className="text-gray-300 text-sm">{incident.description}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Location</p>
                <p className="text-white text-sm flex items-center gap-1">
                  <MapPin size={14} />
                  {incident.location}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs mb-1">Reported By</p>
                <p className="text-white text-sm flex items-center gap-1">
                  <User size={14} />
                  {incident.reportedBy}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs mb-1">Reported At</p>
                <p className="text-white text-sm flex items-center gap-1">
                  <Clock size={14} />
                  {incident.reportedAt}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs mb-1">Assigned To</p>
                <p className="text-blue-400 text-sm">{incident.assignedTo}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-700">
              <div className="text-sm">
                <span className="text-gray-400">Est. Resolution: </span>
                <span className="text-white font-medium">{incident.estimatedResolution}</span>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm">
                  Update Status
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentManagement;