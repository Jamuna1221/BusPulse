import { getUserActivityDetail } from "../repositories/adminUserActivity.repository.js";

export const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getUserActivityDetail(id);

    if (!data) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("getUserActivity:", error);
    if (error.message === "Invalid user id") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: "Error loading user activity",
      error: error.message,
    });
  }
};
