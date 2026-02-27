import { Menu, Bell, ChevronDown, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/logoSep.png";

const SchedulerNavbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const schedulerName = localStorage.getItem("schedulerName") || "Scheduler";

  return (
    <nav className="bg-slate-800 border-b border-slate-700 h-16 flex items-center justify-between px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg lg:hidden"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-3">
          <img src={Logo} alt="BusPulse Logo" className="w-17 h-12 object-contain rounded-lg" />
          <div>
            <span className="text-white font-bold text-xl">BusPulse</span>
            <span className="text-green-400 text-xs font-medium ml-2 bg-green-400/10 px-2 py-0.5 rounded-full">
              Scheduler
            </span>
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Quick Search */}
        <button
          onClick={() => navigate("/scheduler/search")}
          className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg hidden md:block"
        >
          <Search size={20} />
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate("/scheduler/notifications")}
          className="relative text-gray-300 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div
          onClick={() => navigate("/scheduler/profile")}
          className="flex items-center gap-3 cursor-pointer hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
        >
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(schedulerName)}&background=22c55e&color=fff`}
            alt="Scheduler"
            className="w-8 h-8 rounded-full"
          />
          <span className="text-white font-medium hidden md:block">{schedulerName}</span>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>
    </nav>
  );
};

export default SchedulerNavbar;
