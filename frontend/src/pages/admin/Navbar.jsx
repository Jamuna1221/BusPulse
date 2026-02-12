import { Menu, Bell, ChevronDown } from 'lucide-react';
import Logo from "../../assets/logoSep.png";

const Navbar = ({ onMenuClick }) => {
  return (
    <nav className="bg-slate-800 border-b border-slate-700 h-16 flex items-center justify-between px-6">
      {/* Left Section - Logo and Menu */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg lg:hidden"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex items-center gap-3">
          {/* Your Custom Logo - Replace this with your actual logo */}
          <div className="flex items-center gap-2">
            <img
  src={Logo}
  alt="BusPulse Logo"
  className="w-17 h-12 object-contain rounded-lg"
/>

            <span className="text-white font-bold text-xl">BusPulse</span>
          </div>
        </div>
      </div>

      {/* Right Section - Notifications and User */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative text-gray-300 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors">
          <img
            src="https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff"
            alt="Admin"
            className="w-8 h-8 rounded-full"
          />
          <span className="text-white font-medium hidden md:block">Admin</span>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;