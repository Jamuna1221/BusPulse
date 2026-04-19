import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bus,
  Map,
  CalendarDays,
  Users,
  BarChart3,
  Bell,
  ClipboardList,
  Search,
  UserCog,
  LogOut,
} from "lucide-react";

const SchedulerSidebar = ({
  isOpen,
  onClose,
  basePath = "/scheduler",
  panelLabel = "Scheduler",
  profilePath,
}) => {
  const navigate = useNavigate();
  const prof = profilePath ?? `${basePath}/profile`;

  const navItems = [
    { path: `${basePath}/dashboard`, icon: LayoutDashboard, label: "Dashboard" },
    { path: `${basePath}/buses`, icon: Bus, label: "Bus Management" },
    { path: `${basePath}/routes`, icon: Map, label: "Route Management" },
    { path: `${basePath}/schedules`, icon: CalendarDays, label: "Schedules" },
    { path: `${basePath}/reports`, icon: BarChart3, label: "Reports & Analytics" },
    { path: `${basePath}/notifications`, icon: Bell, label: "Notifications" },
    { path: `${basePath}/activity`, icon: ClipboardList, label: "Activity Logs" },
    { path: `${basePath}/search`, icon: Search, label: "Search" },
    { path: prof, icon: UserCog, label: panelLabel === "Operations" ? "Admin settings" : "Profile & Security" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo - mobile only */}
        <div className="h-16 flex items-center justify-center border-b border-slate-700 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Bus size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">BusPulse</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-4">
            {panelLabel} Panel
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-green-600 text-white shadow-lg shadow-green-500/30"
                        : "text-gray-300 hover:bg-slate-700 hover:text-white"
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="font-medium text-sm">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-300 hover:bg-red-600/10 hover:text-red-400 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SchedulerSidebar;
