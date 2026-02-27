// ================== BASE URL ==================
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ================== TOKEN HANDLING ==================
const getToken = () => localStorage.getItem("token");

const getHeaders = (customHeaders = {}) => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...customHeaders,
  };
};

// ================== GENERIC API CALL ==================
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: getHeaders(options.headers),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// ================== ADMIN USERS API ==================
export const adminUsersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/api/admin/users?${queryString}`);
  },

  getById: (id) => apiCall(`/api/admin/users/${id}`),

  create: (userData) =>
    apiCall("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  update: (id, userData) =>
    apiCall(`/api/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),

  delete: (id) =>
    apiCall(`/api/admin/users/${id}`, {
      method: "DELETE",
    }),

  export: () => apiCall("/api/admin/users/export"),
};

// ================== ADMIN SCHEDULERS API ==================
export const adminSchedulersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/api/admin/schedulers?${queryString}`);
  },

  getById: (id) => apiCall(`/api/admin/schedulers/${id}`),

  create: (schedulerData) =>
    apiCall("/api/admin/schedulers", {
      method: "POST",
      body: JSON.stringify(schedulerData),
    }),

  update: (id, schedulerData) =>
    apiCall(`/api/admin/schedulers/${id}`, {
      method: "PUT",
      body: JSON.stringify(schedulerData),
    }),

  delete: (id) =>
    apiCall(`/api/admin/schedulers/${id}`, {
      method: "DELETE",
    }),

  resetPassword: (id) =>
    apiCall(`/api/admin/schedulers/${id}/reset-password`, {
      method: "POST",
    }),

  resendVerification: (id) =>
    apiCall(`/api/admin/schedulers/${id}/resend-verification`, {
      method: "POST",
    }),

  getLogs: (id, limit = 50) =>
    apiCall(`/api/admin/schedulers/${id}/logs?limit=${limit}`),
};

// ================== ADMIN AUTH API ==================
export const adminAuthAPI = {
  login: (credentials) =>
    apiCall("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminEmail");
  },
};

// ================== SCHEDULER AUTH API ==================
export const schedulerAuthAPI = {
  login: (credentials) =>
    apiCall("/auth/scheduler/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  changePassword: (passwords) =>
    apiCall("/auth/scheduler/change-password", {
      method: "POST",
      body: JSON.stringify(passwords),
    }),

  getProfile: () => apiCall("/auth/scheduler/profile"),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("schedulerAuthenticated");
  },
};
// ================== SCHEDULER BUS API ==================
// Add this block to your existing config/api.js file
// Place it after the existing schedulerAuthAPI section

export const schedulerBusAPI = {
  // GET /api/scheduler/buses?status=Active&search=TN72
  getAll: (params = {}) => {
    // Remove empty string params so the URL stays clean
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== "" && v != null)
    );
    const queryString = new URLSearchParams(clean).toString();
    return apiCall(`/api/scheduler/buses${queryString ? `?${queryString}` : ""}`);
  },

  // GET /api/scheduler/buses/:id
  getById: (id) => apiCall(`/api/scheduler/buses/${id}`),

  // POST /api/scheduler/buses
  create: (data) =>
    apiCall("/api/scheduler/buses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // PUT /api/scheduler/buses/:id
  update: (id, data) =>
    apiCall(`/api/scheduler/buses/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // DELETE /api/scheduler/buses/:id
  delete: (id) =>
    apiCall(`/api/scheduler/buses/${id}`, {
      method: "DELETE",
    }),
};
// ================== BUS API ==================
export const busAPI = {
  getUpcoming: (payload) =>
    apiCall("/api/buses/upcoming", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  healthCheck: () => apiCall("/api/buses/health"),
};

// ================== PLACES API ==================
export const placesAPI = {
  search: (query) =>
    apiCall(`/api/places/search?q=${encodeURIComponent(query)}`),
};

// ================== EXPORT ==================
export default {
  adminUsersAPI,
  adminSchedulersAPI,
  adminAuthAPI,
  schedulerAuthAPI,
  schedulerBusAPI,
  busAPI,
  placesAPI,
};
