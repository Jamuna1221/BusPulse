import express from "express";
import { getUpcomingBuses } from "../controllers/etaController.js";

const router = express.Router();

router.post("/upcoming-buses", getUpcomingBuses);

export default router;
