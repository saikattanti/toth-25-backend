// backend/controllers/auth.controller.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sendOtpEmail } from "../utils/sendEmail.js";

const prisma = new PrismaClient();
const OTP_EXPIRY_MINUTES = 10;

export const register = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: { fullName, email, password: hashedPassword, phoneNumber },
    });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Save OTP in user
    await prisma.user.update({
      where: { id: user.id },
      data: { otpHash, otpExpiresAt },
    });

    // Send OTP email
    await sendOtpEmail(email, otp);

    return res.status(201).json({ message: "User registered. OTP sent to email." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.emailVerified) {
      return res.status(403).json({ message: "Email not verified" });
    }

    return res.status(200).json({ message: "Login successful" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.otpHash) return res.status(400).json({ message: "Invalid OTP or email" });

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ message: "OTP expired. Please request a new one" });
    }

    const isValidOtp = await bcrypt.compare(otp, user.otpHash);
    if (!isValidOtp) return res.status(400).json({ message: "Invalid OTP" });

    // Mark email as verified and remove OTP
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, otpHash: null, otpExpiresAt: null },
    });

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};
