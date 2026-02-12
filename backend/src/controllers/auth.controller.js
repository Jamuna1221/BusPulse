import { loginAdminService ,signupUserService} from '../services/auth.service.js';

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