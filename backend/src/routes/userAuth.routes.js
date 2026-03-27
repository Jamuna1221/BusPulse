import express from "express";
import {
  userLogin,
  userSignupInit,
  userVerifySignupOtp,
  userGoogleAuth,
} from "../controllers/auth.controller.js";

const router = express.Router();

/** POST /auth/user/login          — email + password → JWT */
router.post("/login", userLogin);

/** POST /auth/user/signup         — name + email + password → sends OTP */
router.post("/signup", userSignupInit);

/** POST /auth/user/verify-signup  — OTP → JWT (completes signup) */
router.post("/verify-signup", userVerifySignupOtp);

/** POST /auth/user/google         — Google ID token → JWT */
router.post("/google", userGoogleAuth);

export default router;
