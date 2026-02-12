import { AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react';

const RecentAlerts = ({ alerts }) => {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertCircle size={20} className="text-red-400" />;
      case 'warning':
        return <AlertTriangle size={20} className="text-orange-400" />;
      default:
        return <Info size={20} className="text-blue-400" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error':
        return 'border-red-500/20 bg-red-500/5';
      case 'warning':
        return 'border-orange-500/20 bg-orange-500/5';
      default:
        return 'border-blue-500/20 bg-blue-500/5';
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Recent Alerts</h2>
        <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm">
          View All
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${getAlertColor(alert.type)} hover:bg-opacity-10 transition-all cursor-pointer`}
          >
            <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">{alert.message}</p>
              <p className="text-gray-400 text-sm mt-1">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentAlerts;