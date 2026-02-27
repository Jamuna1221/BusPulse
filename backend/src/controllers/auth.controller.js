import {
  loginAdminService,
  signupUserService,
  verifyEmailService,
  loginSchedulerService,
  changeSchedulerPasswordService,
  getSchedulerProfileService
} from '../services/auth.service.js';

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password required' });
    }

    const token = await loginAdminService(email, password);

    res.status(200).json({
      message: 'Admin login successful',
      token
    });

  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Server error'
    });
  }
};

// VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    const user = await verifyEmailService(token);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: user
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Server error"
    });
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

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: result.token,
      is_first_login: result.is_first_login,
      email_verified: result.email_verified,
      user: result.user
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
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

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// SCHEDULER PROFILE
export const schedulerProfile = async (req, res) => {
  try {
    const profile = await getSchedulerProfileService(req.user.id);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// USER SIGNUP
export const userSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required"
      });
    }

    const token = await signupUserService({ name, email, password });

    res.status(201).json({
      message: "User signup successful",
      token
    });

  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || "Server error"
    });
  }
};