import express from "express";
import { getETA } from "../controllers/etaController.js";

const router = express.Router();

router.post("/eta", getETA);

export default router;
