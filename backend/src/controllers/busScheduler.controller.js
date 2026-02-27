import busSchedulerService from "../services/busScheduler.service.js";
import { sendSchedulerWelcomeEmail } from "../utils/emailService.js";

/**
 * Bus Scheduler Controller
 * Handles HTTP requests for bus scheduler management
 */

/**
 * Get all bus schedulers
 * GET /api/admin/schedulers
 */
export const getAllSchedulers = async (req, res) => {
  try {
    const { page, limit, search, is_active } = req.query;

    const [schedulersData, stats] = await Promise.all([
      busSchedulerService.getAllSchedulers({ page, limit, search, is_active }),
      busSchedulerService.getStats(),
    ]);

    res.json({
      success: true,
      data: {
        schedulers: schedulersData.schedulers,
        pagination: schedulersData.pagination,
        stats,
      },
    });
  } catch (error) {
    console.error("Error in getAllSchedulers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching schedulers",
      error: error.message,
    });
  }
};

/**
 * Get single scheduler by ID
 * GET /api/admin/schedulers/:id
 */
export const getSchedulerById = async (req, res) => {
  try {
    const { id } = req.params;
    const scheduler = await busSchedulerService.getSchedulerById(id);

    res.json({
      success: true,
      data: scheduler,
    });
  } catch (error) {
    console.error("Error in getSchedulerById:", error);

    if (error.message === "Scheduler not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error fetching scheduler",
      error: error.message,
    });
  }
};

/**
 * Create new bus scheduler
 * POST /api/admin/schedulers
 */
export const createScheduler = async (req, res) => {
  try {
    const schedulerData = req.body;
    
    // Get admin ID from req.user (set by auth middleware)
    const adminId = req.user?.id || req.user?.userId || null;

    // Validate required fields
    const requiredFields = ["name", "email"];
    for (const field of requiredFields) {
      if (!schedulerData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Create scheduler
    const newScheduler = await busSchedulerService.createScheduler(
      schedulerData,
      adminId
    );

    // Send welcome email with credentials
    try {
      await sendSchedulerWelcomeEmail({
        email: newScheduler.email,
        name: newScheduler.name,
        tempPassword: newScheduler.tempPassword,
        verificationToken: newScheduler.verificationToken,
      });
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the request if email fails
    }

    // Remove temp password from response
    delete newScheduler.tempPassword;
    delete newScheduler.verificationToken;

    res.status(201).json({
      success: true,
      message: "Bus scheduler created successfully. Welcome email sent.",
      data: newScheduler,
    });
  } catch (error) {
    console.error("Error in createScheduler:", error);

    if (error.message === "Email already exists") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating scheduler",
      error: error.message,
    });
  }
};

/**
 * Update scheduler
 * PUT /api/admin/schedulers/:id
 */
export const updateScheduler = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedScheduler = await busSchedulerService.updateScheduler(
      id,
      updates
    );

    res.json({
      success: true,
      message: "Scheduler updated successfully",
      data: updatedScheduler,
    });
  } catch (error) {
    console.error("Error in updateScheduler:", error);

    if (error.message === "Scheduler not found") {
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
      message: "Error updating scheduler",
      error: error.message,
    });
  }
};

/**
 * Delete scheduler
 * DELETE /api/admin/schedulers/:id
 */
export const deleteScheduler = async (req, res) => {
  try {
    const { id } = req.params;
    await busSchedulerService.deleteScheduler(id);

    res.json({
      success: true,
      message: "Scheduler deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteScheduler:", error);

    if (error.message === "Scheduler not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error deleting scheduler",
      error: error.message,
    });
  }
};

/**
 * Reset scheduler password
 * POST /api/admin/schedulers/:id/reset-password
 */
export const resetSchedulerPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const result = await busSchedulerService.resetPassword(id, adminId);

    // Send email with new temporary password
    try {
      await sendSchedulerWelcomeEmail({
        email: result.email,
        name: result.name,
        tempPassword: result.tempPassword,
        isReset: true,
      });
    } catch (emailError) {
      console.error("Error sending reset email:", emailError);
    }

    // Remove temp password from response
    delete result.tempPassword;

    res.json({
      success: true,
      message: "Password reset successfully. Email sent to scheduler.",
      data: result,
    });
  } catch (error) {
    console.error("Error in resetSchedulerPassword:", error);

    if (error.message === "Scheduler not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error resetting password",
      error: error.message,
    });
  }
};

/**
 * Resend verification email
 * POST /api/admin/schedulers/:id/resend-verification
 */
export const resendVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await busSchedulerService.resendVerification(id);

    // Send verification email
    try {
      await sendSchedulerWelcomeEmail({
        email: result.email,
        name: result.name,
        verificationToken: result.verification_token,
        isResend: true,
      });
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
    }

    res.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Error in resendVerification:", error);

    if (error.message === "Scheduler not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error resending verification",
      error: error.message,
    });
  }
};

/**
 * Get scheduler activity logs
 * GET /api/admin/schedulers/:id/logs
 */
export const getSchedulerLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const logs = await busSchedulerService.getSchedulerLogs(id, limit);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error("Error in getSchedulerLogs:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching logs",
      error: error.message,
    });
  }
};