import nodemailer from "nodemailer";

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

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

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: email,
    subject,
    html: htmlContent,
  });

  console.log("✅ Email sent successfully to:", email);
  return { success: true, message: "Email sent successfully" };
};

/**
 * Send OTP login code to a user's email.
 */
export const sendOtpEmail = async ({ email, name, otp }) => {
  const subject = "Your BusPulse Login Code";
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; margin: 0; padding: 0; }
        .wrapper { max-width: 480px; margin: 40px auto; background: #1e293b; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 1px; }
        .body { padding: 32px; color: #e2e8f0; }
        .body p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
        .otp-box { background: #0f172a; border: 2px solid #22c55e; border-radius: 12px; text-align: center; padding: 24px; margin: 24px 0; }
        .otp-code { font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #22c55e; font-family: monospace; }
        .expiry { font-size: 13px; color: #94a3b8; text-align: center; margin-top: 8px; }
        .footer { background: #0f172a; padding: 20px 32px; text-align: center; color: #64748b; font-size: 12px; }
        .footer span { color: #22c55e; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>🚌 BusPulse</h1>
        </div>
        <div class="body">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Use the code below to log in to BusPulse. This code is valid for <strong>10 minutes</strong>.</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p class="expiry">⏱ Expires in 10 minutes</p>
          <p style="color:#94a3b8; font-size:13px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          Sent by <span>BusPulse</span> · Do not share this code with anyone
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: email,
    subject,
    html: htmlContent,
  });

  console.log(`✅ OTP email sent to ${email}`);
};

export default {
  sendSchedulerWelcomeEmail,
  sendOtpEmail,
};