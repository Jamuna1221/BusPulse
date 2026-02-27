import nodemailer from "nodemailer";

/**
 * Send welcome/reset/verification email to bus scheduler
 */
export const sendSchedulerWelcomeEmail = async (data) => {
  const { email, name, tempPassword, verificationToken, isReset, isResend } = data;

  const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;
  const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${verificationToken}`;

  let subject = "";
  let htmlContent = "";

  if (isReset) {
    subject = "Your BusPulse Password Has Been Reset";
    htmlContent = `
      <h2>Password Reset</h2>
      <p>Hi ${name},</p>
      <p>Your password has been reset.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p>You must change this password after login.</p>
      <a href="${loginUrl}">Login Here</a>
    `;
  } else if (isResend) {
    subject = "Verify Your BusPulse Email";
    htmlContent = `
      <h2>Email Verification</h2>
      <p>Hi ${name},</p>
      <p>Please verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
    `;
  } else {
    subject = "Welcome to BusPulse - Scheduler Account";
    htmlContent = `
      <h2>Welcome to BusPulse</h2>
      <p>Hi ${name},</p>
      <p>Your scheduler account has been created.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p>You must change this password on first login.</p>
      <a href="${loginUrl}">Login Here</a>
    `;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // use false for port 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: email,
      subject,
      html: htmlContent,
    });

    console.log("✅ Email sent successfully to:", email);

    return {
      success: true,
      message: "Email sent successfully",
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};

export default {
  sendSchedulerWelcomeEmail,
};