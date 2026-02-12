import { Settings as SettingsIcon, User, Bell, Shield, Database, Globe, Palette, Key } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage system preferences and configurations</p>
      </div>

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
                defaultValue="Admin User"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Email Address</label>
              <input
                type="email"
                defaultValue="admin@buspulse.com"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Phone Number</label>
              <input
                type="tel"
                defaultValue="+91 98765 43210"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Save Changes
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
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
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

            <button className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
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