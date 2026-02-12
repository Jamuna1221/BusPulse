const DeviceStatusChart = ({ data }) => {
  const total = data.online + data.offline + data.error;
  const onlinePercentage = (data.online / total) * 100;
  const offlinePercentage = (data.offline / total) * 100;
  const errorPercentage = (data.error / total) * 100;

  // Calculate SVG circle values
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  
  const onlineOffset = 0;
  const offlineOffset = (onlinePercentage / 100) * circumference;
  const errorOffset = ((onlinePercentage + offlinePercentage) / 100) * circumference;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 h-full">
      <h2 className="text-xl font-bold text-white mb-6">Device Status</h2>

      <div className="flex items-center justify-center">
        <div className="relative w-64 h-64">
          {/* SVG Donut Chart */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#1e293b"
              strokeWidth="30"
            />

            {/* Online segment */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="30"
              strokeDasharray={`${(onlinePercentage / 100) * circumference} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />

            {/* Offline segment */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#f97316"
              strokeWidth="30"
              strokeDasharray={`${(offlinePercentage / 100) * circumference} ${circumference}`}
              strokeDashoffset={-offlineOffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />

            {/* Error segment */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth="30"
              strokeDasharray={`${(errorPercentage / 100) * circumference} ${circumference}`}
              strokeDashoffset={-errorOffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">{data.online}%</div>
              <div className="text-gray-400 text-sm mt-1">Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-300">Online</span>
          </div>
          <span className="text-white font-semibold">{data.online}%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-300">Offline</span>
          </div>
          <span className="text-white font-semibold">{data.offline}%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-300">Error</span>
          </div>
          <span className="text-white font-semibold">{data.error}%</span>
        </div>
      </div>
    </div>
  );
};

export default DeviceStatusChart;