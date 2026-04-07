import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  getBusLiveStatus,
  submitBusFeedback,
} from "../controllers/busFeedback.controller.js";

const router = express.Router();

router.use(verifyToken);
router.post("/bus-feedback", submitBusFeedback);
router.get("/bus-status/:serviceId", getBusLiveStatus);

export default router;
