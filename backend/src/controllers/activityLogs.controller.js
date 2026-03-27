import { getLogsByScheduler } from "../repositories/activityLogs.repository.js";

/**
 * GET /api/scheduler/activity-logs
 * Query params: type, search, limit, offset
 * Requires: verifySchedulerToken (req.user.id set by middleware)
 */
export const getActivityLogs = async (req, res) => {
  try {
    const schedulerId = req.user.id;
    const {
      type   = "all",
      search = "",
      limit  = 50,
      offset = 0,
    } = req.query;

    const { logs, total } = await getLogsByScheduler(schedulerId, {
      type,
      search,
      limit:  parseInt(limit,  10),
      offset: parseInt(offset, 10),
    });

    res.json({ success: true, logs, total });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch activity logs" });
  }
};