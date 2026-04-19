import express from "express";
import { verifyAdminToken } from "../middleware/auth.middleware.js";
import {
  changeMyAdminPassword,
  getMyAdminProfile,
  updateMyAdminProfile,
} from "../controllers/adminSettings.controller.js";

const router = express.Router();

router.use(verifyAdminToken);

// GET  /api/admin/settings/me
router.get("/me", getMyAdminProfile);

// PUT  /api/admin/settings/me
router.put("/me", updateMyAdminProfile);

// POST /api/admin/settings/change-password
router.post("/change-password", changeMyAdminPassword);

export default router;

