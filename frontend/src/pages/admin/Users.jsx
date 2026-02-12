import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  UserPlus,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Loader,
} from "lucide-react";
import { adminUsersAPI } from "../../services/api";

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    new_this_week: 0,
    bus_operators: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toggleUserStatus = async (user) => {
  try {
    await adminUsersAPI.update(user.id, {
      is_active: !user.is_active
    });

    fetchUsers(); // refresh list
  } catch (err) {
    console.error("Error updating status:", err);
  }
};
const changeUserRole = async (user) => {
  const newRole =
    user.role === "USER" ? "BUS_OPERATOR" : "USER";

  try {
    await adminUsersAPI.update(user.id, {
      role: newRole
    });

    fetchUsers();
  } catch (err) {
    console.error("Error updating role:", err);
  }
};

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // ✅ Fetch users (memoized)
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminUsersAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
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
  }, [pagination.page, pagination.limit, searchTerm]);

  // ✅ Single debounced effect (ESLint-safe)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // ✅ Export users
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
      "Status",
      "Location",
      "Join Date",
    ];

    const rows = data.map((u) => [
      u.id,
      u.name,
      u.email,
      u.phone || "",
      u.role,
      u.status,
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
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
            />
          </div>
          <button className="px-6 py-3 bg-slate-700 rounded-lg text-white flex items-center gap-2">
            <Filter size={20} /> Filters
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-3 bg-slate-700 rounded-lg text-white flex items-center gap-2"
          >
            <Download size={20} /> Export
          </button>
        </div>
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
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  {["User", "Contact", "Role", "Status", "Last Active", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left text-sm text-gray-300"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4 text-white">{u.name}</td>
                      <td className="px-6 py-4 text-gray-300">
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-2">
                            <Mail size={14} /> {u.email}
                          </span>
                          <span className="flex items-center gap-2">
                            <Phone size={14} /> {u.phone || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{u.role}</td>
                      <td className="px-6 py-4">
  <span
    className={`px-3 py-1 rounded-full text-sm ${
      u.is_active
        ? "bg-green-500/20 text-green-400"
        : "bg-red-500/20 text-red-400"
    }`}
  >
    {u.is_active ? "Active" : "Inactive"}
  </span>
</td>

                      <td className="px-6 py-4">
                        {u.lastActive
                          ? new Date(u.lastActive).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 relative">
  <button
    onClick={() =>
      setActiveMenu(activeMenu === u.id ? null : u.id)
    }
    className="text-gray-400 hover:text-white"
  >
    <MoreVertical size={18} />
  </button>

  {activeMenu === u.id && (
    <div className="absolute right-6 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
      
      {/* View */}
      <button
        onClick={() => {
          console.log("View user", u.id);
          setActiveMenu(null);
        }}
        className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700 text-gray-300"
      >
        View
      </button>

      {/* Activate / Deactivate */}
      <button
        onClick={() => {
          toggleUserStatus(u);
          setActiveMenu(null);
        }}
        className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700 text-gray-300"
      >
        {u.is_active ? "Deactivate" : "Activate"}
      </button>

      {/* Change Role */}
      <button
        onClick={() => {
          changeUserRole(u);
          setActiveMenu(null);
        }}
        className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-700 text-gray-300"
      >
        Change Role
      </button>

    </div>
  )}
</td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl">
              <span className="text-gray-400 text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page === pagination.pages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
    <p className="text-gray-400 text-sm">{title}</p>
    <p className="text-3xl font-bold text-white mt-2">
      {value?.toLocaleString() || 0}
    </p>
  </div>
);

export default Users;
