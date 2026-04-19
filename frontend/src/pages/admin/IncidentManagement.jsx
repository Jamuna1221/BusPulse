import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  X,
  MapPin,
  Bus,
} from 'lucide-react';
import { adminIncidentAPI } from '../../config/api';

/* ──────────────────────────────────────────────
   Helpers
────────────────────────────────────────────── */
const timeAgo = (iso) => {
  const sec = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
};

const SEVERITY_CONFIG = {
  critical: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-400',
    icon: <AlertCircle size={18} />,
  },
  high: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-400',
    icon: <AlertTriangle size={18} />,
  },
  medium: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-400',
    icon: <AlertTriangle size={18} />,
  },
  low: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-400',
    icon: <Info size={18} />,
  },
};

const getSeverityConfig = (severity) =>
  SEVERITY_CONFIG[severity?.toLowerCase()] ?? SEVERITY_CONFIG.low;

const StatusBadge = ({ status }) => {
  const map = {
    active:       'bg-red-500/20 text-red-400',
    acknowledged: 'bg-orange-500/20 text-orange-400',
    resolved:     'bg-green-500/20 text-green-400',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-slate-700 text-gray-400'}`}>
      {status}
    </span>
  );
};

/* ──────────────────────────────────────────────
   Main Component
────────────────────────────────────────────── */
const IncidentManagement = () => {
  const [incidents, setIncidents]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]         = useState(null);
  const [actionPending, setActionPending] = useState(false);

  /* ── Fetch ── */
  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { limit: 300 };
      if (search)                    params.search = search;
      if (statusFilter !== 'all')    params.status = statusFilter;

      const res  = await adminIncidentAPI.getIncidents(params);
      const rows = (res.data || res.incidents || res || []).map((i) => ({
        id:          i.id,
        title:       i.title || 'Untitled Incident',
        description: i.description || i.message || '—',
        severity:    i.severity || 'low',
        status:      i.status   || 'active',
        routeNo:     i.route_no || null,
        location:    i.location || null,
        createdAt:   i.created_at || i.createdAt || new Date().toISOString(),
      }));
      setIncidents(rows);
    } catch (e) {
      setError(e.message || 'Failed to load incidents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [search, statusFilter]);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:        incidents.length,
    active:       incidents.filter((i) => i.status === 'active').length,
    acknowledged: incidents.filter((i) => i.status === 'acknowledged').length,
    resolved:     incidents.filter((i) => i.status === 'resolved').length,
  }), [incidents]);

  /* ── Actions ── */
  const handleAction = async (incident, action) => {
    try {
      setActionPending(true);
      if (action === 'acknowledge') await adminIncidentAPI.acknowledgeIncident(incident.id);
      if (action === 'resolve')     await adminIncidentAPI.resolveIncident(incident.id);
      setSelected(null);
      await load();
    } catch (e) {
      alert(e.message || 'Action failed.');
    } finally {
      setActionPending(false);
    }
  };

  /* ────────────────────────── Render ────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Incident Management</h1>
          <p className="text-gray-400 mt-1">Track, acknowledge, and resolve reported incidents</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',        value: stats.total,        color: 'text-white',       icon: <AlertCircle size={22} className="text-blue-400" /> },
          { label: 'Active',       value: stats.active,       color: 'text-red-400',     icon: <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" /> },
          { label: 'Acknowledged', value: stats.acknowledged, color: 'text-orange-400',  icon: <Clock size={22} className="text-orange-400" /> },
          { label: 'Resolved',     value: stats.resolved,     color: 'text-green-400',   icon: <CheckCircle size={22} className="text-green-400" /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 text-sm">{label}</p>
              {icon}
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by title, route, or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading && (
          <div className="text-gray-400 text-sm text-center py-12">Loading incidents…</div>
        )}

        {!loading && !error && incidents.length === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
            <p className="text-white font-semibold text-lg">All Clear</p>
            <p className="text-gray-400 text-sm mt-1">No incidents match your filters.</p>
          </div>
        )}

        {!loading && incidents.map((incident) => {
          const cfg = getSeverityConfig(incident.severity);
          return (
            <div
              key={incident.id}
              className={`${cfg.bg} border ${cfg.border} rounded-xl p-5 hover:brightness-110 transition-all`}
            >
              <div className="flex items-start gap-4">
                <div className={`${cfg.text} mt-0.5 shrink-0`}>{cfg.icon}</div>

                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className={`font-bold text-base ${cfg.text}`}>{incident.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${cfg.badge}`}>
                      {incident.severity}
                    </span>
                    <StatusBadge status={incident.status} />
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm line-clamp-2">{incident.description}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-400">
                    {incident.routeNo && (
                      <span className="flex items-center gap-1">
                        <Bus size={12} /> Route {incident.routeNo}
                      </span>
                    )}
                    {incident.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {incident.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {timeAgo(incident.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {incident.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleAction(incident, 'acknowledge')}
                          disabled={actionPending}
                          className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-xs transition-colors"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleAction(incident, 'resolve')}
                          disabled={actionPending}
                          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-xs transition-colors"
                        >
                          Resolve
                        </button>
                      </>
                    )}
                    {incident.status === 'acknowledged' && (
                      <button
                        onClick={() => handleAction(incident, 'resolve')}
                        disabled={actionPending}
                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-xs transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                    <button
                      onClick={() => setSelected(incident)}
                      className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                <p className="text-sm text-gray-400 mt-0.5 uppercase tracking-wide">
                  {selected.severity} · {selected.status}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Details grid */}
            <div className="space-y-4 text-sm">
              <div className="bg-slate-700/40 rounded-lg p-4 text-gray-200 leading-relaxed">
                {selected.description}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Status',    <StatusBadge status={selected.status} />],
                  ['Severity',  <span className={`capitalize font-medium ${getSeverityConfig(selected.severity).text}`}>{selected.severity}</span>],
                  ['Route',     selected.routeNo   || '—'],
                  ['Location',  selected.location  || '—'],
                  ['Reported',  timeAgo(selected.createdAt)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-700/30 rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">{label}</p>
                    <div className="text-white font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              {selected.status === 'active' && (
                <>
                  <button
                    onClick={() => handleAction(selected, 'acknowledge')}
                    disabled={actionPending}
                    className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleAction(selected, 'resolve')}
                    disabled={actionPending}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                  >
                    Resolve
                  </button>
                </>
              )}
              {selected.status === 'acknowledged' && (
                <button
                  onClick={() => handleAction(selected, 'resolve')}
                  disabled={actionPending}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                >
                  Mark Resolved
                </button>
              )}
              <button
                onClick={() => setSelected(null)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;
