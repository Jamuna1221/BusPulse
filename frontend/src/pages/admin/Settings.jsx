import { useEffect, useState } from "react";
import { Settings as SettingsIcon, User, Bell, Shield, Database, Key, Loader2 } from "lucide-react";
import { adminSettingsAPI } from "../../config/api";

const Settings = () => {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let mounted = true;
    setLoadingProfile(true);
    adminSettingsAPI
      .getMe()
      .then((res) => {
        if (!mounted) return;
        const data = res?.data || {};
        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      })
      .catch((err) => {
        if (!mounted) return;
        setMessage({
          type: "error",
          text: err.message || "Failed to load admin profile",
        });
      })
      .finally(() => {
        if (mounted) setLoadingProfile(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }
    setSavingProfile(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await adminSettingsAPI.updateMe({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
      });
      const data = res?.data || {};
      setProfile((prev) => ({
        ...prev,
        name: data.name || prev.name,
        phone: data.phone || "",
      }));
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to update profile",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setMessage({ type: "error", text: "Please fill all password fields" });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: "error", text: "New password and confirm password do not match" });
      return;
    }

    setSavingPassword(true);
    setMessage({ type: "", text: "" });
    try {
      await adminSettingsAPI.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: "Password changed successfully" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to change password",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage system preferences and configurations</p>
      </div>

      {message.text && (
        <div
          className={`rounded-lg px-4 py-3 text-sm border ${
            message.type === "success"
              ? "bg-green-500/10 border-green-500/30 text-green-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <User size={24} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Profile Settings</h2>
              <p className="text-gray-400 text-sm">Manage your account information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Email Address</label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white/90 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || loadingProfile}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : null}
              {loadingProfile ? "Loading..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <Shield size={24} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Security Settings</h2>
              <p className="text-gray-400 text-sm">Manage passwords and authentication</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Two-Factor Authentication</p>
                <p className="text-gray-400 text-sm">Add an extra layer of security</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <button
              onClick={handleUpdatePassword}
              disabled={savingPassword}
              className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {savingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
              Update Password
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Bell size={24} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Notification Settings</h2>
              <p className="text-gray-400 text-sm">Manage alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Email Notifications', description: 'Receive alerts via email' },
              { label: 'SMS Notifications', description: 'Receive alerts via SMS' },
              { label: 'Critical Alerts Only', description: 'Only high-priority notifications' },
              { label: 'Device Offline Alerts', description: 'Alert when devices go offline' },
              { label: 'Incident Reports', description: 'Notify on new incidents' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={index < 3} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <SettingsIcon size={24} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">System Settings</h2>
              <p className="text-gray-400 text-sm">Configure system preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Time Zone</label>
              <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option>IST (GMT+5:30) - India</option>
                <option>EST (GMT-5) - Eastern Time</option>
                <option>PST (GMT-8) - Pacific Time</option>
                <option>GMT (GMT+0) - London</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Language</label>
              <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option>English</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Telugu</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Date Format</label>
              <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option>DD/MM/YYYY</option>
                <option>MM/DD/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-white font-medium">Auto Logout</p>
                <p className="text-gray-400 text-sm">After 30 minutes of inactivity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <Key size={24} className="text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">API Settings</h2>
              <p className="text-gray-400 text-sm">Manage API keys and integrations</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  defaultValue="sk_live_xxxxxxxxxxxxxxxxxx"
                  readOnly
                  className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none"
                />
                <button className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                  Show
                </button>
              </div>
            </div>

            <button className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
              Regenerate API Key
            </button>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ⚠️ Warning: Regenerating your API key will invalidate the current key and may break existing integrations.
              </p>
            </div>
          </div>
        </div>

        {/* Data & Storage */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-cyan-500/20 rounded-lg">
              <Database size={24} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Data & Storage</h2>
              <p className="text-gray-400 text-sm">Manage data retention and backups</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white">Storage Used</span>
                <span className="text-cyan-400 font-semibold">24.8 GB / 100 GB</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Data Retention Period</label>
              <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                <option>30 Days</option>
                <option>60 Days</option>
                <option>90 Days</option>
                <option>6 Months</option>
                <option>1 Year</option>
                <option>Forever</option>
              </select>
            </div>

            <button className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
              Backup Data Now
            </button>

            <button className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;