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

// ================== BUS API ==================
export const busAPI = {
  getUpcoming: (payload) =>
    apiCall("/api/buses/upcoming", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  healthCheck: () => apiCall("/api/buses/health"),
};
export const placesAPI = {
  search: (query) =>
    apiCall(`/api/places/search?q=${encodeURIComponent(query)}`),
};

// ================== EXPORT ==================
export default {
  adminUsersAPI,
  adminAuthAPI,
  busAPI,
  placesAPI,
};
