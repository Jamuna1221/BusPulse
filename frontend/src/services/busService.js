import api from "../config/api";

// ================== FETCH UPCOMING BUSES ==================
export async function fetchUpcomingBuses(params) {
  return await api.busAPI.getUpcoming(params);
}

// ================== HEALTH CHECK ==================
export async function checkApiHealth() {
  return await api.busAPI.healthCheck();
}
