import {
  loginAdminService,
  verifyEmailService,
  loginSchedulerService,
  changeSchedulerPasswordService,
  getSchedulerProfileService,
  loginUserService,
  signupInitService,
  verifySignupOtpService,
  googleAuthUserService,
} from '../services/auth.service.js';
import { insertLog } from '../repositories/activityLogs.repository.js';
import { sendOtpEmail } from '../utils/emailService.js';


export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const token = await loginAdminService(email, password);

    res.status(200).json({ message: 'Admin login successful', token });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Server error' });
  }
};

// VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await verifyEmailService(token);

    res.status(200).json({ success: true, message: "Email verified successfully", data: user });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Server error" });
  }
};

// SCHEDULER LOGIN
export const schedulerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const result = await loginSchedulerService(email, password);

    // Log the login — fire and forget (don't fail login if log fails)
    insertLog({
      schedulerId: result.user.id,
      action:      "Login",
      details:     `Logged in from ${req.ip || req.headers["x-forwarded-for"] || "unknown IP"}`,
      type:        "auth",
    }).catch(() => {});

    res.status(200).json({
      success:        true,
      message:        'Login successful',
      token:          result.token,
      is_first_login: result.is_first_login,
      email_verified: result.email_verified,
      user:           result.user,
    });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
  }
};

// SCHEDULER CHANGE PASSWORD
export const schedulerChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const result = await changeSchedulerPasswordService(req.user.id, currentPassword, newPassword);

    // Log password change
    insertLog({
      schedulerId: req.user.id,
      action:      "Password Changed",
      details:     "Password updated successfully",
      type:        "auth",
    }).catch(() => {});

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
  }
};

// SCHEDULER PROFILE
export const schedulerProfile = async (req, res) => {
  try {
    const profile = await getSchedulerProfileService(req.user.id);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Server error' });
  }
};

// USER LOGIN (email + password → JWT, no OTP)
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required.' });

    const result = await loginUserService(email, password);
    res.json({ success: true, message: 'Login successful.', token: result.token, user: result.user });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message || 'Login failed.' });
  }
};

// USER SIGNUP — Step 1: create account + email OTP
export const userSignupInit = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const { user, otp } = await signupInitService({ name, email, password });
    await sendOtpEmail({ email: user.email, name: user.name, otp });
    res.status(201).json({ success: true, message: `Verification code sent to ${email}.` });
  } catch (error) {
    console.error('userSignupInit error:', error);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Signup failed.' });
  }
};

// USER SIGNUP — Step 2: verify OTP → issue JWT
export const userVerifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and code are required.' });

    const result = await verifySignupOtpService(email, otp);
    res.json({ success: true, message: 'Account verified. Welcome!', token: result.token, user: result.user });
  } catch (error) {
    console.error('userVerifySignupOtp error:', error);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Verification failed.' });
  }
};

// USER GOOGLE AUTH
export const userGoogleAuth = async (req, res) => {
  try {
    const { token: googleToken } = req.body;
    if (!googleToken) return res.status(400).json({ success: false, message: 'Google token is required.' });

    const result = await googleAuthUserService(googleToken);
    res.json({ success: true, message: 'Google login successful.', token: result.token, user: result.user });
  } catch (error) {
    console.error('userGoogleAuth error:', error);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Google authentication failed.' });
  }
};