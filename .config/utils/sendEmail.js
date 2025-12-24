// backend/utils/sendEmail.js
import nodemailer from "nodemailer";

/**
 * Send OTP email to a user
 * @param {string} toEmail - Recipient email address
 * @param {string | number} otp - One-time password
 * @returns {Promise} - Resolves with nodemailer info
 */
export const sendOtpEmail = async (toEmail, otp) => {
  // Ensure env variables exist
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER or EMAIL_PASS not set in environment variables");
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email options
    const mailOptions = {
      from: `"Ancient Treasures" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Email Verification</h2>
          <p>Use the OTP below to verify your email address:</p>
          <h1 style="letter-spacing: 6px; color: #333;">${otp}</h1>
          <p>This OTP is valid for <b>10 minutes</b>.</p>
          <p>If you did not request this verification, ignore this email.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">Ancient Treasures © ${new Date().getFullYear()}</p>
        </div>
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${toEmail}`);
    return info;
  } catch (error) {
    console.error("❌ Failed to send OTP email:", error);
    throw new Error("Failed to send OTP email");
  }
};
