import userService from "../services/user.service.js";

/**
 * Admin Users Controller
 * Handles HTTP requests and delegates business logic to service layer
 */

/**
 * Get all users with pagination and filters
 * GET /api/admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const { page, limit, search, role, is_active } = req.query;

    // Get users and stats in parallel
    const [usersData, stats] = await Promise.all([
      userService.getUsers({ page, limit, search, role, is_active }),
      userService.getStats(),
    ]);

    res.json({
      success: true,
      data: {
        users: usersData.users,
        pagination: usersData.pagination,
        stats,
      },
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
};

/**
 * Get single user by ID
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
};

/**
 * Create new user
 * POST /api/admin/users
 */
export const createUser = async (req, res) => {
  try {
    const userData = req.body;

    // Validate required fields
    const requiredFields = ["name", "email", "password"];
    for (const field of requiredFields) {
      if (!userData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    const newUser = await userService.createUser(userData);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("Error in createUser:", error);

    if (error.message === "User with this email already exists") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
};

/**
 * Update user
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedUser = await userService.updateUser(id, updates);

    res.json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error in updateUser:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "No valid fields to update") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
};

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message,
    });
  }
};

/**
 * Export users data
 * GET /api/admin/users/export
 */
export const exportUsers = async (req, res) => {
  try {
    const users = await userService.exportUsers();

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error in exportUsers:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting users",
      error: error.message,
    });
  }
};