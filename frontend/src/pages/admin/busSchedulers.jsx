import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  UserPlus,
  MoreVertical,
  Mail,
  Phone,
  Loader,
  X,
  Key,
  Shield,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { adminSchedulersAPI } from "../../config/api";

const BusSchedulers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [schedulers, setSchedulers] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    new_this_week: 0,
    pending_setup: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    is_active: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Fetch schedulers
  const fetchSchedulers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminSchedulersAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
      });

      if (response.success) {
        setSchedulers(response.data.schedulers || []);
        setStats(response.data.stats || {});
        setPagination((p) => ({ ...p, ...response.data.pagination }));
      }
    } catch (err) {
      console.error("Error fetching schedulers:", err);
      setError(err.message || "Failed to fetch schedulers");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSchedulers();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchSchedulers]);

  // Toggle scheduler status
  const toggleSchedulerStatus = async (scheduler) => {
    try {
      await adminSchedulersAPI.update(scheduler.id, {
        is_active: !scheduler.is_active,
      });
      fetchSchedulers();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update scheduler status");
    }
  };

  // Reset password
  const resetPassword = async (scheduler) => {
    if (!confirm(`Reset password for ${scheduler.name}? They will receive an email with a new temporary password.`)) {
      return;
    }

    try {
      const response = await adminSchedulersAPI.resetPassword(scheduler.id);
      if (response.success) {
        alert("Password reset successfully. Email sent to scheduler.");
        fetchSchedulers();
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      alert("Failed to reset password");
    }
  };

  // Resend verification
  const resendVerification = async (scheduler) => {
    try {
      const response = await adminSchedulersAPI.resendVerification(scheduler.id);
      if (response.success) {
        alert("Verification email sent successfully");
      }
    } catch (err) {
      console.error("Error resending verification:", err);
      alert("Failed to resend verification email");
    }
  };

  // Delete scheduler
  const deleteScheduler = async (scheduler) => {
    if (!confirm(`Delete scheduler ${scheduler.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminSchedulersAPI.delete(scheduler.id);
      alert("Scheduler deleted successfully");
      fetchSchedulers();
    } catch (err) {
      console.error("Error deleting scheduler:", err);
      alert("Failed to delete scheduler");
    }
  };

  // Apply filters
  const applyFilters = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ is_active: "" });
    setPagination((p) => ({ ...p, page: 1 }));
    setShowFilters(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Bus Schedulers</h1>
          <p className="text-gray-400 mt-1">
            Manage bus scheduler accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <UserPlus size={20} />
          Add Scheduler
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Schedulers"
          value={stats.total}
          icon={<Shield size={24} />}
          color="blue"
        />
        <StatCard
          title="Active"
          value={stats.active}
          icon={<Calendar size={24} />}
          color="green"
        />
        <StatCard
          title="New This Week"
          value={stats.new_this_week}
          icon={<UserPlus size={24} />}
          color="purple"
        />
        <StatCard
          title="Pending Setup"
          value={stats.pending_setup}
          icon={<AlertCircle size={24} />}
          color="orange"
        />
      </div>

      {/* Search & Actions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Search schedulers by name or email..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <Filter size={20} /> Filters
            {filters.is_active && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 rounded-full text-xs">
                1
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.is_active}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, is_active: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center p-12 bg-slate-800 rounded-xl">
          <Loader className="animate-spin text-blue-400" size={32} />
          <span className="ml-3 text-white">Loading schedulers...</span>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-visible">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    {[
                      "Scheduler",
                      "Contact",
                      "Status",
                      "Setup Status",
                      "Created",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-sm font-medium text-gray-300"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {schedulers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="text-center py-12 text-gray-400"
                      >
                        No schedulers found
                      </td>
                    </tr>
                  ) : (
                    schedulers.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-700/30">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-white font-medium block">
                                {s.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                by {s.created_by_name || "System"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-2 text-sm">
                              <Mail size={14} /> {s.email}
                            </span>
                            <span className="flex items-center gap-2 text-sm">
                              <Phone size={14} /> {s.phone || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              s.is_active
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {s.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {s.is_first_login && (
                              <span className="flex items-center gap-1 text-xs text-orange-400">
                                <AlertCircle size={12} /> Pending Setup
                              </span>
                            )}
                            {!s.email_verified && (
                              <span className="flex items-center gap-1 text-xs text-yellow-400">
                                <Mail size={12} /> Email Not Verified
                              </span>
                            )}
                            {!s.is_first_login && s.email_verified && (
                              <span className="flex items-center gap-1 text-xs text-green-400">
                                <Shield size={12} /> Setup Complete
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300 text-sm">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveMenu(activeMenu === s.id ? null : s.id)
                              }
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              <MoreVertical size={18} />
                            </button>

                            {activeMenu === s.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setActiveMenu(null)}
                                />
                                <div className="absolute right-0 top-8 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                                  <button
                                    onClick={() => {
                                      console.log("View details", s.id);
                                      setActiveMenu(null);
                                    }}
                                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 text-gray-300 transition-colors rounded-t-lg"
                                  >
                                    View Details
                                  </button>

                                  <button
                                    onClick={() => {
                                      toggleSchedulerStatus(s);
                                      setActiveMenu(null);
                                    }}
                                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 text-gray-300 transition-colors"
                                  >
                                    {s.is_active ? "Deactivate" : "Activate"}
                                  </button>

                                  <button
                                    onClick={() => {
                                      resetPassword(s);
                                      setActiveMenu(null);
                                    }}
                                    className=" w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 text-gray-300 transition-colors flex items-center gap-2"
                                  >
                                    <Key size={14} /> Reset Password
                                  </button>

                                  {!s.email_verified && (
                                    <button
                                      onClick={() => {
                                        resendVerification(s);
                                        setActiveMenu(null);
                                      }}
                                      className=" w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 text-gray-300 transition-colors flex items-center gap-2"
                                    >
                                      <Mail size={14} /> Resend Verification
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      deleteScheduler(s);
                                      setActiveMenu(null);
                                    }}
                                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 text-red-400 transition-colors border-t border-slate-700 rounded-b-lg"
                                  >
                                    Delete Scheduler
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
              <span className="text-gray-400 text-sm">
                Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
                total schedulers)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Scheduler Modal */}
      {showAddModal && (
        <AddSchedulerModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchSchedulers}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
    orange: "bg-orange-600",
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">
            {value?.toLocaleString() || 0}
          </p>
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  );
};

const AddSchedulerModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await adminSchedulersAPI.create(formData);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Error creating scheduler:", err);
      setError(err.message || "Failed to create scheduler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add Bus Scheduler</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 text-sm">
              ✓ Scheduler created successfully! Welcome email sent.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((f) => ({ ...f, name: e.target.value }))
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData((f) => ({ ...f, email: e.target.value }))
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="scheduler@example.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              Login credentials will be sent to this email
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData((f) => ({ ...f, phone: e.target.value }))
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="+1 234 567 8900"
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-blue-400 text-sm">
              <strong>Note:</strong> A temporary password will be generated and
              sent to the scheduler's email. They will be required to change it
              on first login.
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : success ? "Created!" : "Create Scheduler"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusSchedulers;