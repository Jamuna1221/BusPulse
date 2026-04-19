import { listAdminFeedback, upsertFeedbackStatus } from "../repositories/adminFeedback.repository.js";

export async function listAdminFeedbackController(req, res) {
  try {
    const { limit = 300, search = "", status = "all", type = "all" } = req.query;
    const rows = await listAdminFeedback({ limit, search, status, type });
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("listAdminFeedbackController error:", error);
    res.status(500).json({ success: false, message: "Failed to load feedback." });
  }
}

export async function updateAdminFeedbackStatusController(req, res) {
  try {
    const id = Number(req.params.id);
    const { status, priority = null } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: "Invalid feedback id." });
    if (!status) return res.status(400).json({ success: false, message: "status is required." });
    const ticket = await upsertFeedbackStatus({ id, status, priority });
    res.json({ success: true, data: ticket });
  } catch (error) {
    console.error("updateAdminFeedbackStatusController error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to update feedback status." });
  }
}
