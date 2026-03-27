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
// ================== SCHEDULER ROUTE API ==================
// Add this block to src/config/api.js after schedulerBusAPI

export const schedulerRouteAPI = {
  // GET /api/scheduler/routes?search=Madurai&isActive=true
  getAll: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== "" && v != null)
    );
    const queryString = new URLSearchParams(clean).toString();
    return apiCall(`/api/scheduler/routes${queryString ? `?${queryString}` : ""}`);
  },

  // GET /api/scheduler/routes/:id
  getById: (id) => apiCall(`/api/scheduler/routes/${id}`),

  // POST /api/scheduler/routes
  create: (data) =>
    apiCall("/api/scheduler/routes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // PUT /api/scheduler/routes/:id
  update: (id, data) =>
    apiCall(`/api/scheduler/routes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // DELETE /api/scheduler/routes/:id  (soft delete — marks is_active=false)
  delete: (id) =>
    apiCall(`/api/scheduler/routes/${id}`, {
      method: "DELETE",
    }),
};
// ================== BUS API ==================
export const busAPI = {
  // ✅ NEW (you missed this)
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiCall(`/api/buses${qs ? `?${qs}` : ""}`);
  },

  getUpcoming: (payload) =>
    apiCall("/api/buses/upcoming", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  healthCheck: () => apiCall("/api/buses/health"),
};
// ================== SCHEDULER SERVICES API ==================
// Add this to src/config/api.js

export const schedulerServicesAPI = {
  // GET /api/scheduler/services?search=&routeId=
  getAll: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== "" && v != null)
    );
    const qs = new URLSearchParams(clean).toString();
    return apiCall(`/api/scheduler/services${qs ? `?${qs}` : ""}`);
  },

  // GET /api/scheduler/services/routes
  getRoutes: () => apiCall("/api/scheduler/services/routes"),

  // GET /api/scheduler/services/:id
  getById: (id) => apiCall(`/api/scheduler/services/${id}`),

  // POST /api/scheduler/services/route
  // Full pipeline: geocode places → create route → fetch OSRM geometry → add departures
  // Body: { route_no, from_place, to_place, distance_km?, departure_times }
  addRoute: (data) =>
    apiCall("/api/scheduler/services/route", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // POST /api/scheduler/services/departure
  // Body: { route_id, departure_time }
  addDeparture: (data) =>
    apiCall("/api/scheduler/services/departure", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // POST /api/scheduler/services/departures
  // Body: { route_id, departure_times: "06.30, 21.00" }
  addDepartures: (data) =>
    apiCall("/api/scheduler/services/departures", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // PUT /api/scheduler/services/:id
  // Body: { departure_time }
  updateDeparture: (id, data) =>
    apiCall(`/api/scheduler/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // DELETE /api/scheduler/services/:id
  deleteDeparture: (id) =>
    apiCall(`/api/scheduler/services/${id}`, {
      method: "DELETE",
    }),
};
// ================== PLACES API ==================
export const placesAPI = {
  search: (query) =>
    apiCall(`/api/places/search?q=${encodeURIComponent(query)}`),
};

// ================== SCHEDULER ACTIVITY LOGS API ==================
export const schedulerActivityAPI = {
  // GET /api/scheduler/activity-logs?type=create&search=bus&limit=20&offset=0
  getLogs: (params = {}) => {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== "" && v != null)
    );
    const qs = new URLSearchParams(clean).toString();
    return apiCall(`/api/scheduler/activity-logs${qs ? `?${qs}` : ""}`);
  },
};

// ================== USER AUTH API ==================
export const userAuthAPI = {
  sendOtp: (email, name) =>
    apiCall("/auth/user/send-otp", {
      method: "POST",
      body: JSON.stringify({ email, name }),
    }),

  verifyOtp: (email, otp) =>
    apiCall("/auth/user/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  googleAuth: (token) =>
    apiCall("/auth/user/google", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),

  logout: () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_info");
  },
};

// ================== EXPORT ==================
export default {
  adminUsersAPI,
  adminSchedulersAPI,
  adminAuthAPI,
  schedulerAuthAPI,
  schedulerBusAPI,
  schedulerRouteAPI,
  schedulerServicesAPI,
  busAPI,
  placesAPI,
  schedulerActivityAPI,
};