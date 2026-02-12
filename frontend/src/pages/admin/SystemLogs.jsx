import { ArrowRight, Circle } from 'lucide-react';

const SystemLogs = ({ logs }) => {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">System Logs</h2>
        <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm">
          View Logs
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-slate-700">
              <th className="pb-3 text-gray-400 font-medium text-sm">Name</th>
              <th className="pb-3 text-gray-400 font-medium text-sm">Today</th>
              <th className="pb-3 text-gray-400 font-medium text-sm text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                <td className="py-4 text-gray-300">{log.name}</td>
                <td className="py-4 text-gray-400 text-sm">{log.today}</td>
                <td className="py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Circle size={8} className="text-green-400 fill-green-400" />
                    <span className="text-green-400 font-medium">{log.total}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SystemLogs;