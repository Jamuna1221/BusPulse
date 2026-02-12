// API Base URL
const API_BASE_URL =import.meta.env.VITE_API_BASE_URL;

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem("token");
};

// Create headers with auth token
const getHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API call handler
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "API request failed");
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Admin Users API
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

// Admin Auth API
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

export default {
  adminUsersAPI,
  adminAuthAPI,
};
