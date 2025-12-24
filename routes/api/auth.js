// routes/api/auth.js - Updated Authentication Routes
import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../../utils/prisma.js";
import { generateToken } from "../../utils/jwt.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { sendOTPEmail, sendWelcomeEmail } from "../../utils/email.js";

const router = express.Router();

/**
 * Generate a 4-digit OTP
 */
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// -------------------- REGISTER (STEP 1) --------------------
router.post("/register", async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  try {
    // Validation
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        error: "Email, password, and confirm password are required" 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        error: "Passwords do not match" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: "Password must be at least 6 characters" 
      });
    }

    // Check existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: "Email already registered" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        otpHash,
        otpExpiresAt,
      },
    });

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp);
      console.log(`✉️ OTP sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError.message);
      console.log(`✉️ Fallback OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      success: true,
      message: "Registration successful. Please check your email for OTP.",
      userId: user.id,
      email: user.email,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Registration failed" 
    });
  }
});

// -------------------- VERIFY OTP (STEP 2) --------------------
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        error: "Email and OTP are required" 
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.otpHash) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid request" 
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false, 
        error: "Email already verified" 
      });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ 
        success: false, 
        error: "OTP expired. Please request a new one." 
      });
    }

    const isValid = await bcrypt.compare(otp, user.otpHash);
    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid OTP" 
      });
    }

    // Mark email as verified
    await prisma.user.update({
      where: { email },
      data: { 
        emailVerified: true, 
        otpHash: null, 
        otpExpiresAt: null 
      },
    });

    res.json({ 
      success: true, 
      message: "Email verified successfully",
      nextStep: "complete-profile"
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Verification failed" 
    });
  }
});

// -------------------- RESEND OTP --------------------
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({ 
        success: false, 
        error: "Email already verified" 
      });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { otpHash, otpExpiresAt },
    });

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp);
      console.log(`✉️ New OTP sent to ${email}`);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError.message);
      console.log(`✉️ Fallback OTP for ${email}: ${otp}`);
    }

    res.json({ 
      success: true, 
      message: "OTP resent successfully. Please check your email." 
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to resend OTP" 
    });
  }
});

// -------------------- COMPLETE PROFILE (STEP 3) --------------------
router.post("/complete-profile", async (req, res) => {
  const { email, fullName, classRollNo, phoneNumber, department } = req.body;

  try {
    if (!email || !fullName || !classRollNo || !department) {
      return res.status(400).json({ 
        success: false, 
        error: "All fields except phone number are required" 
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ 
        success: false, 
        error: "Please verify your email first" 
      });
    }

    if (user.profileCompleted) {
      return res.status(400).json({ 
        success: false, 
        error: "Profile already completed" 
      });
    }

    // Check if phone number already exists (if provided)
    if (phoneNumber) {
      const existingPhone = await prisma.user.findFirst({
        where: { 
          phoneNumber,
          id: { not: user.id }
        }
      });
      
      if (existingPhone) {
        return res.status(400).json({ 
          success: false, 
          error: "Phone number already in use" 
        });
      }
    }

    // Update profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName,
        classRollNo,
        phoneNumber,
        department,
        profileCompleted: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        classRollNo: true,
        department: true,
        isAdmin: true,
      }
    });

    // Generate JWT token
    const token = generateToken({ 
      userId: updatedUser.id,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(updatedUser.email, updatedUser.fullName);
      console.log(`🎉 Welcome email sent to ${updatedUser.email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError.message);
      // Don't fail the request if welcome email fails
    }

    res.json({
      success: true,
      message: "Profile completed successfully",
      token,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Complete profile error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to complete profile" 
    });
  }
});

// -------------------- LOGIN --------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "Email and password are required" 
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    // Check email verification
    if (!user.emailVerified) {
      return res.status(403).json({ 
        success: false, 
        error: "Please verify your email first",
        action: "verify-email",
        email: user.email,
      });
    }

    // Check profile completion
    if (!user.profileCompleted) {
      return res.status(403).json({ 
        success: false, 
        error: "Please complete your profile",
        action: "complete-profile",
        email: user.email,
      });
    }

    // Generate JWT token
    const token = generateToken({ 
      userId: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        classRollNo: user.classRollNo,
        department: user.department,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Login failed" 
    });
  }
});

// -------------------- GET PROFILE STATUS --------------------
router.get("/profile-status", async (req, res) => {
  const { email } = req.query;

  try {
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }

    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        profileCompleted: true,
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    let nextStep = "home";
    if (!user.emailVerified) {
      nextStep = "verify-email";
    } else if (!user.profileCompleted) {
      nextStep = "complete-profile";
    }

    res.json({
      success: true,
      emailVerified: user.emailVerified,
      profileCompleted: user.profileCompleted,
      nextStep,
    });
  } catch (err) {
    console.error("Profile status error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get profile status" 
    });
  }
});

// -------------------- GET MY PROFILE (Protected) --------------------
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        classRollNo: true,
        phoneNumber: true,
        department: true,
        isAdmin: true,
        createdAt: true,
      }
    });

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get profile" 
    });
  }
});

export default router;
