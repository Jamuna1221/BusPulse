import express from "express";
import { userSignup } from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * POST /auth/user/signup
 */
router.post("/signup", userSignup);

export default router;
