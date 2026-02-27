import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCog, Lock, Monitor, LogOut, Shield, Eye, EyeOff } from "lucide-react";
import { schedulerAuthAPI } from "../../config/api";

const ProfileSecurity = () => {
  const navigate = useNavigate();
  const schedulerName = localStorage.getItem("schedulerName") || "Scheduler";
  const schedulerEmail = localStorage.getItem("schedulerEmail") || "scheduler@buspulse.com";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const sessions = [
    { id: 1, device: "Windows PC", browser: "Chrome 120", ip: "192.168.1.100", lastActive: "Active now", current: true },
    { id: 2, device: "Android Phone", browser: "Mobile App", ip: "192.168.1.105", lastActive: "2 hours ago", current: false },
    { id: 3, device: "Windows PC", browser: "Firefox 121", ip: "10.0.0.50", lastActive: "Yesterday", current: false },
  ];

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) { setError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await schedulerAuthAPI.changePassword({ currentPassword, newPassword });
      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = () => {
    if (confirm("This will log you out of all devices. Continue?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile & Security</h1>
        <p className="text-gray-400 mt-1">Manage your account settings and security</p>
      </div>

      {/* Profile Info */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-4">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(schedulerName)}&background=22c55e&color=fff&size=64`} alt="Profile" className="w-16 h-16 rounded-full" />
          <div>
            <h2 className="text-xl font-bold text-white">{schedulerName}</h2>
            <p className="text-gray-400">{schedulerEmail}</p>
            <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Bus Scheduler</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Lock size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Change Password</h2>
            <p className="text-gray-400 text-sm">Update your password regularly for security</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
            <div className="relative">
              <input type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 pr-12" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
            <div className="relative">
              <input type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 pr-12" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300">
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm">{success}</div>}

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50">
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Monitor size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Active Sessions</h2>
              <p className="text-gray-400 text-sm">Devices where you're logged in</p>
            </div>
          </div>
          <button onClick={handleLogoutAll} className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-400/10">
            <LogOut size={14} /> Logout All
          </button>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between py-3 px-4 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Monitor size={18} className="text-gray-400" />
                <div>
                  <p className="text-white text-sm font-medium">{session.device} • {session.browser}</p>
                  <p className="text-gray-500 text-xs">IP: {session.ip}</p>
                </div>
              </div>
              <div className="text-right">
                {session.current ? (
                  <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Current</span>
                ) : (
                  <span className="text-gray-500 text-xs">{session.lastActive}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSecurity;
