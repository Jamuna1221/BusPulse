import { getAdminAnalyticsOverview } from "../repositories/adminAnalytics.repository.js";

export async function getAdminAnalyticsOverviewController(req, res) {
  try {
    const data = await getAdminAnalyticsOverview();
    res.json({ success: true, data });
  } catch (error) {
    console.error("getAdminAnalyticsOverviewController error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load admin analytics.",
    });
  }
}
