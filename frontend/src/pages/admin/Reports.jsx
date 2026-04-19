import { useEffect, useMemo, useState } from 'react';
import { FileText, Download, Calendar, Filter, TrendingUp, Users, Bus, AlertTriangle, Route } from 'lucide-react';
import { adminReportsAPI } from "../../config/api";

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [overview, setOverview] = useState({
    stats: { totalReportsYear: 0, totalReports: 0, storageBytes: 0, scheduledReports: 0 },
    templates: [],
    recentReports: [],
    lastGenerated: null,
  });
  const [form, setForm] = useState({
    type: "operations_summary",
    periodLabel: "Last 30 Days",
    format: "csv",
  });

  const templateIcons = {
    operations_summary: Bus,
    user_analytics: Users,
    performance_metrics: TrendingUp,
    incident_safety: AlertTriangle,
    route_top_scoring: Route,
  };

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminReportsAPI.getOverview();
      setOverview(res.data || overview);
    } catch (e) {
      setError(e.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const toSize = (bytes = 0) => {
    const b = Number(bytes) || 0;
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${(b / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const handleDownloadByPayload = (payloadText, type, format) => {
    const ext = format === "json" ? "json" : "csv";
    const mime = format === "json" ? "application/json;charset=utf-8" : "text/csv;charset=utf-8";
    const blob = new Blob([payloadText || ""], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type || "report"}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReport = async (payload) => {
    try {
      setGenerating(true);
      const res = await adminReportsAPI.generate(payload);
      handleDownloadByPayload(res.payloadText, payload.type, payload.format);
      await loadOverview();
    } catch (e) {
      setError(e.message || "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadExisting = (reportId) => {
    const token = localStorage.getItem("token");
    const url = adminReportsAPI.getDownloadUrl(reportId);
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to download");
        return Promise.all([r.blob(), r.headers.get("content-disposition")]);
      })
      .then(([blob, disposition]) => {
        const fname = disposition?.match(/filename="([^"]+)"/)?.[1] || `report-${reportId}.csv`;
        const bUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = bUrl;
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(bUrl);
      })
      .catch((e) => setError(e.message || "Failed to download report."));
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-gray-400 mt-1">Generate and download system reports</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
          <FileText size={20} />
          Generate Custom Report
        </button>
      </div>

      {loading && <div className="text-sm text-gray-400">Loading reports...</div>}
      {!loading && error && <div className="text-sm text-red-400">{error}</div>}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Reports</p>
            <FileText className="text-blue-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">{overview.stats.totalReportsYear}</p>
          <p className="text-gray-400 text-sm mt-2">Generated this year</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Last Generated</p>
            <Calendar className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">
            {overview.lastGenerated ? new Date(overview.lastGenerated.created_at).toLocaleDateString() : "—"}
          </p>
          <p className="text-gray-400 text-sm mt-2">{overview.lastGenerated?.title || "No reports yet"}</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Scheduled Reports</p>
            <TrendingUp className="text-purple-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">{overview.stats.scheduledReports}</p>
          <p className="text-gray-400 text-sm mt-2">Auto-generated</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Storage Used</p>
            <Download className="text-orange-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">{toSize(overview.stats.storageBytes)}</p>
          <p className="text-gray-400 text-sm mt-2">Report storage</p>
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {overview.templates.map((template, idx) => {
            const Icon = templateIcons[template.key] || FileText;
            return (
              <div
                key={template.key || idx}
                className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-4 rounded-xl border ${getColorClasses(template.color)}`}>
                    <Icon size={28} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-1">{template.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 bg-slate-700 text-gray-300 rounded-full text-xs font-medium">
                        {template.frequency}
                      </span>
                      <button
                        onClick={() =>
                          generateReport({
                            type: template.key,
                            periodLabel: "Last 30 Days",
                            format: "csv",
                          })
                        }
                        disabled={generating}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors text-sm"
                      >
                        <Download size={16} />
                        {generating ? "Generating..." : "Generate"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Report Generator */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-6">Custom Report Generator</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Report Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {overview.templates.map((t) => (
                <option key={t.key} value={t.key}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Date Range</label>
            <select
              value={form.periodLabel}
              onChange={(e) => setForm((f) => ({ ...f, periodLabel: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Format</label>
            <select
              value={form.format}
              onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => generateReport(form)}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
          >
            <Download size={20} />
            {generating ? "Generating..." : "Generate Report"}
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <Calendar size={20} />
            Auto Templates Enabled
          </button>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Reports</h2>
          <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm">
            <Filter size={16} />
            Filter
          </button>
        </div>

        <div className="space-y-3">
          {overview.recentReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <FileText size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">{report.title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-gray-400 text-sm">{report.report_type}</span>
                    <span className="text-gray-500 text-sm">•</span>
                    <span className="text-gray-400 text-sm">{report.period_label}</span>
                    <span className="text-gray-500 text-sm">•</span>
                    <span className="text-gray-400 text-sm">{toSize(report.size_bytes)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-600 text-gray-300 rounded-full text-xs font-medium">
                  {String(report.format).toUpperCase()}
                </span>
                <button
                  onClick={() => downloadExisting(report.id)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Download size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;