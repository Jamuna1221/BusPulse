import {
  getSchedulerAnalyticsOverview,
  getSchedulerDashboardOverview,
} from "../repositories/schedulerAnalytics.repository.js";

export async function getAnalyticsOverview(req, res) {
  try {
    const data = await getSchedulerAnalyticsOverview();
    res.json({ success: true, data });
  } catch (error) {
    console.error("getAnalyticsOverview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load scheduler analytics.",
    });
  }
}

export async function getDashboardOverview(req, res) {
  try {
    const data = await getSchedulerDashboardOverview();
    res.json({ success: true, data });
  } catch (error) {
    console.error("getDashboardOverview error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load scheduler dashboard.",
    });
  }
}
