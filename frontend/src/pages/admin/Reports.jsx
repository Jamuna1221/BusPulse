import { FileText, Download, Calendar, Filter, TrendingUp, Users, Bus, AlertTriangle } from 'lucide-react';

const Reports = () => {
  const recentReports = [
    {
      id: 1,
      title: 'Monthly Operations Report',
      type: 'Operations',
      period: 'January 2026',
      generatedAt: '2026-02-01',
      size: '2.4 MB',
      format: 'PDF',
    },
    {
      id: 2,
      title: 'Device Performance Analysis',
      type: 'Technical',
      period: 'Last 30 Days',
      generatedAt: '2026-02-05',
      size: '1.8 MB',
      format: 'Excel',
    },
    {
      id: 3,
      title: 'Customer Feedback Summary',
      type: 'Customer Service',
      period: 'Q4 2025',
      generatedAt: '2026-01-15',
      size: '956 KB',
      format: 'PDF',
    },
    {
      id: 4,
      title: 'Incident Log Report',
      type: 'Safety',
      period: 'January 2026',
      generatedAt: '2026-02-02',
      size: '1.2 MB',
      format: 'PDF',
    },
  ];

  const reportTemplates = [
    {
      id: 1,
      name: 'Daily Operations Summary',
      description: 'Bus activity, device status, and key metrics',
      icon: Bus,
      color: 'blue',
      frequency: 'Daily',
    },
    {
      id: 2,
      name: 'User Analytics Report',
      description: 'User growth, engagement, and behavior patterns',
      icon: Users,
      color: 'green',
      frequency: 'Weekly',
    },
    {
      id: 3,
      name: 'Performance Metrics',
      description: 'On-time performance, delays, and efficiency',
      icon: TrendingUp,
      color: 'purple',
      frequency: 'Monthly',
    },
    {
      id: 4,
      name: 'Incident & Safety Report',
      description: 'All incidents, accidents, and safety metrics',
      icon: AlertTriangle,
      color: 'red',
      frequency: 'Monthly',
    },
  ];

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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Total Reports</p>
            <FileText className="text-blue-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">156</p>
          <p className="text-gray-400 text-sm mt-2">Generated this year</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Last Generated</p>
            <Calendar className="text-green-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">Today</p>
          <p className="text-gray-400 text-sm mt-2">Operations Report</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Scheduled Reports</p>
            <TrendingUp className="text-purple-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">12</p>
          <p className="text-gray-400 text-sm mt-2">Auto-generated</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-sm">Storage Used</p>
            <Download className="text-orange-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-white">24.8 GB</p>
          <p className="text-gray-400 text-sm mt-2">Of 100 GB</p>
        </div>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
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
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                        <Download size={16} />
                        Generate
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
            <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option>Operations Summary</option>
              <option>User Analytics</option>
              <option>Device Performance</option>
              <option>Financial Report</option>
              <option>Incident Log</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Date Range</label>
            <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Last Year</option>
              <option>Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Format</label>
            <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option>PDF</option>
              <option>Excel (XLSX)</option>
              <option>CSV</option>
              <option>JSON</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Download size={20} />
            Generate Report
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            <Calendar size={20} />
            Schedule Report
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
          {recentReports.map((report) => (
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
                    <span className="text-gray-400 text-sm">{report.type}</span>
                    <span className="text-gray-500 text-sm">•</span>
                    <span className="text-gray-400 text-sm">{report.period}</span>
                    <span className="text-gray-500 text-sm">•</span>
                    <span className="text-gray-400 text-sm">{report.size}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-slate-600 text-gray-300 rounded-full text-xs font-medium">
                  {report.format}
                </span>
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
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