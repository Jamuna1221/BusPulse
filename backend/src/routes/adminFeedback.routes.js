import express from "express";
import { verifyAdminToken } from "../middleware/auth.middleware.js";
import { listAdminFeedbackController, updateAdminFeedbackStatusController } from "../controllers/adminFeedback.controller.js";

const router = express.Router();

router.use(verifyAdminToken);
router.get("/", listAdminFeedbackController);
router.post("/:id/status", updateAdminFeedbackStatusController);

export default router;
