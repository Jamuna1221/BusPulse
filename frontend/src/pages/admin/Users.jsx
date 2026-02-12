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
  ChevronDown,
} from "lucide-react";
import { adminUsersAPI } from "../../services/api";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    new_this_week: 0,
    bus_operators: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    role: "",
    is_active: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminUsersAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
      });

      if (response.success) {
        setUsers(response.data.users || []);
        setStats(response.data.stats || {});
        setPagination((p) => ({ ...p, ...response.data.pagination }));
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, filters]);

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Toggle user status
  const toggleUserStatus = async (user) => {
    try {
      await adminUsersAPI.update(user.id, {
        is_active: !user.is_active,
      });
      fetchUsers();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update user status");
    }
  };

  // Change user role
  const changeUserRole = async (user) => {
    const newRole = user.role === "USER" ? "BUS_OPERATOR" : "USER";

    try {
      await adminUsersAPI.update(user.id, {
        role: newRole,
      });
      fetchUsers();
    } catch (err) {
      console.error("Error updating role:", err);
      alert("Failed to update user role");
    }
  };

  // Export users
  const handleExport = async () => {
    try {
      const response = await adminUsersAPI.export();
      if (response.success) {
        const csv = convertToCSV(response.data);
        downloadCSV(csv, "users-export.csv");
      }
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export users");
    }
  };

  const convertToCSV = (data) => {
    const headers = [
      "ID",
      "Name",
      "Email",
      "Phone",
      "Role",
      "Active",
      "Location",
      "Join Date",
    ];

    const rows = data.map((u) => [
      u.id,
      u.name,
      u.email,
      u.phone || "",
      u.role,
      u.is_active ? "Yes" : "No",
      u.location || "",
      new Date(u.joinDate).toLocaleDateString(),
    ]);

    return [headers, ...rows].map((r) => r.join(",")).join("\n");
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Apply filters
  const applyFilters = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ role: "", is_active: "" });
    setPagination((p) => ({ ...p, page: 1 }));
    setShowFilters(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Users Management</h1>
          <p className="text-gray-400 mt-1">
            Manage and monitor all platform users
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.total} />
        <StatCard title="Active Today" value={stats.active} />
        <StatCard title="New This Week" value={stats.new_this_week} />
        <StatCard title="Bus Operators" value={stats.bus_operators} />
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
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-2 transition-colors"
          >
            <Filter size={20} /> Filters
            {(filters.role || filters.is_active) && (
              <span className="ml-2 px-2 py-0.5 bg-blue-600 rounded-full text-xs">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            onClick={handleExport}
            disabled={users.length === 0}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} /> Export
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-slate-700 rounded-lg border border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, role: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="USER">User</option>
                  <option value="BUS_OPERATOR">Bus Operator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
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
          <span className="ml-3 text-white">Loading users...</span>
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
                      "User",
                      "Contact",
                      "Role",
                      "Status",
                      "Last Active",
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
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-12 text-gray-400"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-2 text-sm">
                            <Mail size={14} /> {u.email}
                          </span>
                          <span className="flex items-center gap-2 text-sm">
                            <Phone size={14} /> {u.phone || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-700 text-gray-300 rounded-lg text-sm">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            u.is_active
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {u.lastActive
                          ? new Date(u.lastActive).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveMenu(activeMenu === u.id ? null : u.id)
                            }
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {activeMenu === u.id && (
                            <>
                              {/* Backdrop - closes menu when clicking outside */}
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveMenu(null)}
                              />
                              
                              {/* Dropdown Menu - positioned absolutely with high z-index */}
                              <div className="absolute right-0 top-8 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                                <button
                                  onClick={() => {
                                    console.log("View user", u.id);
                                    setActiveMenu(null);
                                  }}
                                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 text-gray-300 transition-colors rounded-t-lg"
                                >
                                  View Details
                                </button>

                                <button
                                  onClick={() => {
                                    toggleUserStatus(u);
                                    setActiveMenu(null);
                                  }}
                                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 text-gray-300 transition-colors"
                                >
                                  {u.is_active ? "Deactivate" : "Activate"}
                                </button>

                                <button
                                  onClick={() => {
                                    changeUserRole(u);
                                    setActiveMenu(null);
                                  }}
                                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 text-gray-300 transition-colors"
                                >
                                  Change to{" "}
                                  {u.role === "USER"
                                    ? "Bus Operator"
                                    : "User"}
                                </button>

                                <button
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `Delete user ${u.name}? This cannot be undone.`
                                      )
                                    ) {
                                      // TODO: Implement delete
                                      console.log("Delete user", u.id);
                                    }
                                    setActiveMenu(null);
                                  }}
                                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 text-red-400 transition-colors border-t border-slate-700 rounded-b-lg"
                                >
                                  Delete User
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
                total users)
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

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors">
    <p className="text-gray-400 text-sm">{title}</p>
    <p className="text-3xl font-bold text-white mt-2">
      {value?.toLocaleString() || 0}
    </p>
  </div>
);

const AddUserModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "USER",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await adminUsersAPI.create(formData);
      if (response.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Error creating user:", err);
      setError(err.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Add New User</h2>
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
            />
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
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) =>
                setFormData((f) => ({ ...f, password: e.target.value }))
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData((f) => ({ ...f, role: e.target.value }))
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="USER">User</option>
              <option value="BUS_OPERATOR">Bus Operator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData((f) => ({ ...f, location: e.target.value }))
              }
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Users;