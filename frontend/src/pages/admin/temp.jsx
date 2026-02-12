const UsageChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.sessions));
  const minValue = Math.min(...data.map(d => d.sessions));
  const range = maxValue - minValue;
  const CHART_WIDTH = 1000;
const CHART_HEIGHT = 256;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <h2 className="text-xl font-bold text-white mb-6">Usage Overview</h2>
      
      <div className="mb-4">
        <p className="text-gray-400 text-sm">Sessions</p>
      </div>

      <div className="relative h-64">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-gray-500 text-xs">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
          <span>0</span>
        </div>

        {/* Chart area */}
        <div className="ml-8 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-slate-700"></div>
            ))}
          </div>

          {/* Line chart */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            {/* Area under the line */}
            <path
  d={`
    M 0,${CHART_HEIGHT - ((data[0].sessions - minValue) / range) * CHART_HEIGHT}
    ${data
      .map((point, index) => {
        const x = (index / (data.length - 1)) * CHART_WIDTH;
        const y =
          CHART_HEIGHT -
          ((point.sessions - minValue) / range) * CHART_HEIGHT;
        return `L ${x},${y}`;
      })
      .join(" ")}
    L ${CHART_WIDTH},${CHART_HEIGHT}
    L 0,${CHART_HEIGHT}
    Z
  `}
  fill="url(#lineGradient)"
/>


            {/* Line */}
            <path
  d={`
    M 0,${CHART_HEIGHT - ((data[0].sessions - minValue) / range) * CHART_HEIGHT}
    ${data
      .map((point, index) => {
        const x = (index / (data.length - 1)) * CHART_WIDTH;
        const y =
          CHART_HEIGHT -
          ((point.sessions - minValue) / range) * CHART_HEIGHT;
        return `L ${x},${y}`;
      })
      .join(" ")}
  `}
  fill="none"
  stroke="#3b82f6"
  strokeWidth="3"
  strokeLinecap="round"
  strokeLinejoin="round"
/>


            {/* Data points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 256 - ((point.sessions - minValue) / range * 256);
              return (
                <circle
                  key={index}
                  cx={`${x}%`}
                  cy={y}
                  r="4"
                  fill="#3b82f6"
                  className="hover:r-6 transition-all cursor-pointer"
                />
              );
            })}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-8 right-0 flex justify-between text-gray-500 text-xs mt-2">
          {data.map((point, index) => (
            index % 1 === 0 && <span key={index}>{point.day}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UsageChart;