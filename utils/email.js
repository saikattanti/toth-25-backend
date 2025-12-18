import nodemailer from "nodemailer";

export const sendOtpEmail = async (toEmail, otp) => {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email credentials not configured in .env");
      console.log(`📧 OTP for ${toEmail}: ${otp}`);
      throw new Error("Email service not configured. Check console for OTP.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Add timeout and retry settings
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5,
    });

    // Verify transporter connection
    await transporter.verify();
    console.log("✅ Email service connected");

    const mailOptions = {
      from: `"TOTH - Treasure Hunt" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "🔐 Your Email Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #8B6F3D 0%, #C9B07A 100%);
              padding: 30px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .otp-box {
              background-color: #F5F5F5;
              border: 2px dashed #C9B07A;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 42px;
              font-weight: bold;
              color: #8B6F3D;
              letter-spacing: 8px;
              margin: 10px 0;
            }
            .message {
              color: #555;
              font-size: 16px;
              line-height: 1.6;
              margin: 20px 0;
            }
            .warning {
              background-color: #FFF3CD;
              border-left: 4px solid #FFC107;
              padding: 15px;
              margin: 20px 0;
              text-align: left;
              font-size: 14px;
              color: #856404;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #6c757d;
              font-size: 12px;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏛️ TOTH - Treasure Hunt</h1>
              <p style="margin: 10px 0 0 0; font-size: 14px;">Email Verification</p>
            </div>

            <div class="content">
              <div class="icon">🔐</div>

              <p class="message">
                Hello! Welcome to the Treasure Hunt adventure.
              </p>

              <p class="message">
                Use the following One-Time Password (OTP) to verify your email address:
              </p>

              <div class="otp-box">
                <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
                <div class="otp-code">${otp}</div>
              </div>

              <div class="warning">
                ⏰ <strong>Important:</strong> This OTP will expire in <strong>10 minutes</strong>. 
                Do not share this code with anyone.
              </div>

              <p class="message" style="font-size: 14px; color: #888;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 5px 0;">
                This is an automated email. Please do not reply.
              </p>
              <p style="margin: 5px 0;">
                © ${new Date().getFullYear()} TOTH - Treasure Hunt. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Your TOTH verification code is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you didn't request this code, please ignore this email.`
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Email sent successfully to ${toEmail}`);
    console.log(`📧 Message ID: ${info.messageId}`);

    return info;
  } catch (error) {
    console.error("❌ Email sending error:", error.message);

    // Log OTP to console as fallback
    console.log(`\n${"=".repeat(50)}`);
    console.log(`📧 FALLBACK - OTP for ${toEmail}: ${otp}`);
    console.log(`⏰ Valid for 10 minutes`);
    console.log(`${"=".repeat(50)}\n`);

    throw error;
  }
};

// Optional: Send welcome email after verification
export const sendWelcomeEmail = async (toEmail, userName) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("Email service not configured");
      return;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"TOTH - Treasure Hunt" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "🎉 Welcome to TOTH!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8B6F3D;">Welcome, ${userName}! 🎊</h1>
          <p style="font-size: 16px;">Your email has been successfully verified!</p>
          <p>You can now enjoy the full Treasure Hunt experience.</p>
          <p style="color: #666;">Happy hunting! 🏆</p>
        </div>
      `,
    });

    console.log(`✅ Welcome email sent to ${toEmail}`);
  } catch (error) {
    console.error("Welcome email error:", error.message);
  }
};
