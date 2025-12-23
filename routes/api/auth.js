// backend/routes/api/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Generate a 4-digit OTP
 * @returns {string} OTP
 */
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// -------------------- REGISTER --------------------
router.post("/register", async (req, res) => {
  const { fullName, email, password, phoneNumber, department, deptRollNo } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        phoneNumber,
        department,
        deptRollNo,
        otpHash,
        otpExpiresAt,
      },
    });

    console.log(`OTP for ${email}: ${otp}`); // For testing purposes only

    res.status(201).json({
      success: true,
      message: "User registered. Please verify your email.",
      userId: user.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Registration failed" });
  }
});

// -------------------- VERIFY OTP --------------------
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.otpHash) {
      return res.status(400).json({ success: false, error: "Invalid request" });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ success: false, error: "OTP expired" });
    }

    const isValid = await bcrypt.compare(otp, user.otpHash);
    if (!isValid) {
      return res.status(400).json({ success: false, error: "Invalid OTP" });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true, otpHash: null, otpExpiresAt: null },
    });

    res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Verification failed" });
  }
});

// -------------------- LOGIN --------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ success: false, error: "Please verify your email first" });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Login failed" });
  }
});

// -------------------- RESEND OTP --------------------
router.post("/resend-otp", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ success: false, error: "Email already verified" });
    }

    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { otpHash, otpExpiresAt },
    });

    console.log(`New OTP for ${email}: ${otp}`); // For testing

    res.json({ success: true, message: "OTP resent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to resend OTP" });
  }
});

export default router;
