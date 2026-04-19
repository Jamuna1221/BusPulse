import {
  changeAdminPasswordService,
  getAdminProfileService,
  updateAdminProfileService,
} from "../services/adminSettings.service.js";

export async function getMyAdminProfile(req, res) {
  try {
    const adminId = req.user?.id;
    const data = await getAdminProfileService(adminId);
    res.json({ success: true, data });
  } catch (error) {
    console.error("getMyAdminProfile error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to load profile",
    });
  }
}

export async function updateMyAdminProfile(req, res) {
  try {
    const adminId = req.user?.id;
    const { name, phone } = req.body || {};
    const data = await updateAdminProfileService(adminId, { name, phone });
    res.json({ success: true, message: "Profile updated", data });
  } catch (error) {
    console.error("updateMyAdminProfile error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
}

export async function changeMyAdminPassword(req, res) {
  try {
    const adminId = req.user?.id;
    const { currentPassword, newPassword } = req.body || {};
    const data = await changeAdminPasswordService(adminId, currentPassword, newPassword);
    res.json({ success: true, ...data });
  } catch (error) {
    console.error("changeMyAdminPassword error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to change password",
    });
  }
}

