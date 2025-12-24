import nodemailer from 'nodemailer';

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

/**
 * Send OTP email to user
 * @param {string} email - Recipient email address
 * @param {string} otp - 4-digit OTP code
 * @returns {Promise<void>}
 */
export const sendOTPEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Treasure Hunt - TOTH 25',
        address: process.env.GMAIL_USER,
      },
      to: email,
      subject: '🔐 Your OTP Code for Treasure Hunt Registration',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
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
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .otp-box {
              background-color: #f8f9fa;
              border: 2px dashed #667eea;
              border-radius: 8px;
              padding: 20px;
              margin: 30px 0;
            }
            .otp-code {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 8px;
              margin: 10px 0;
            }
            .message {
              color: #555;
              line-height: 1.6;
              margin: 20px 0;
            }
            .warning {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              text-align: left;
              border-radius: 4px;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #777;
              font-size: 14px;
              border-top: 1px solid #e0e0e0;
            }
            .icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">🏆</div>
              <h1>Treasure Hunt - TOTH 25</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-bottom: 10px;">Welcome to the Adventure! 🎯</h2>
              <p class="message">
                Thank you for registering for the Treasure Hunt! To complete your registration, 
                please use the OTP code below:
              </p>
              
              <div class="otp-box">
                <p style="margin: 0; color: #666; font-size: 14px;">Your Verification Code</p>
                <div class="otp-code">${otp}</div>
                <p style="margin: 0; color: #999; font-size: 12px;">Valid for 10 minutes</p>
              </div>
              
              <p class="message">
                Enter this code in the registration form to verify your email address and 
                continue setting up your profile.
              </p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>Never share this code with anyone</li>
                  <li>This code expires in 10 minutes</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">
                This is an automated email from Treasure Hunt - TOTH 25<br>
                Please do not reply to this email
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px;">
                © 2025 Treasure Hunt. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Treasure Hunt - TOTH 25

Welcome to the Adventure!

Your verification code is: ${otp}

This code is valid for 10 minutes.

Enter this code in the registration form to verify your email address and continue setting up your profile.

Security Notice:
- Never share this code with anyone
- This code expires in 10 minutes
- If you didn't request this, please ignore this email

This is an automated email. Please do not reply.

© 2025 Treasure Hunt. All rights reserved.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email} - Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    throw new Error('Failed to send OTP email. Please try again.');
  }
};

/**
 * Send welcome email after successful registration
 * @param {string} email - Recipient email address
 * @param {string} fullName - User's full name
 * @returns {Promise<void>}
 */
export const sendWelcomeEmail = async (email, fullName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'Treasure Hunt - TOTH 25',
        address: process.env.GMAIL_USER,
      },
      to: email,
      subject: '🎉 Welcome to Treasure Hunt - TOTH 25!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
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
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              text-align: center;
            }
            .content {
              padding: 40px 30px;
            }
            .feature-box {
              background-color: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 25px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              background-color: #f8f9fa;
              padding: 20px;
              text-align: center;
              color: #777;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 36px;">🎊 Welcome!</h1>
              <p style="margin: 15px 0 0 0; font-size: 18px;">You're all set to begin the adventure</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333;">Hi ${fullName}! 👋</h2>
              <p style="color: #555; line-height: 1.6;">
                Congratulations on completing your registration! You're now part of the Treasure Hunt - TOTH 25.
              </p>
              
              <div class="feature-box">
                <h3 style="margin-top: 0; color: #667eea;">🎯 How to Play:</h3>
                <ol style="color: #555; line-height: 1.8;">
                  <li>Scan QR codes to discover riddles</li>
                  <li>Solve riddles to unlock solutions</li>
                  <li>Collect points for each unique riddle</li>
                  <li>Complete all riddles to finish the game</li>
                  <li>Climb the leaderboard to win!</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #555;">Ready to start your treasure hunt?</p>
                <a href="#" class="button">Start Playing</a>
              </div>
              
              <p style="color: #777; font-size: 14px; margin-top: 30px;">
                Need help? Contact your event organizers or check the FAQ section.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">
                Good luck and have fun! 🍀<br>
                The Treasure Hunt Team
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Treasure Hunt - TOTH 25!

Hi ${fullName}!

Congratulations on completing your registration! You're now part of the Treasure Hunt - TOTH 25.

How to Play:
1. Scan QR codes to discover riddles
2. Solve riddles to unlock solutions
3. Collect points for each unique riddle
4. Complete all riddles to finish the game
5. Climb the leaderboard to win!

Good luck and have fun!
The Treasure Hunt Team
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email} - Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
    // Don't throw error for welcome email - it's not critical
  }
};

export default {
  sendOTPEmail,
  sendWelcomeEmail,
};
