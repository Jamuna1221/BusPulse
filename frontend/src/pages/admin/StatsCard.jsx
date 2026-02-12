import { TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, color = 'blue', trend, pulse = false }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
          
          {trend && (
            <div className="flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp size={16} className="text-green-400" />
              ) : (
                <TrendingDown size={16} className="text-red-400" />
              )}
              <span className={trend.isPositive ? 'text-green-400' : 'text-red-400'}>
                {trend.value}%
              </span>
              <span className="text-gray-500 text-sm ml-1">vs last week</span>
            </div>
          )}
        </div>

        <div className={`${colorClasses[color]} w-14 h-14 rounded-xl flex items-center justify-center ${pulse ? 'animate-pulse' : ''}`}>
          <Icon size={28} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;