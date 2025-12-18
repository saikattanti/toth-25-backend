import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import "dotenv/config";

const app = express();
const prisma = new PrismaClient();

// ------------------- CORS -------------------
app.use(cors({ origin: "https://5ac4d6f7-353d-4047-8e3f-75c6db24bb2d-00-2u655wkyuoo3a.sisko.replit.dev:3000" }));
app.use(express.json());

// ------------------- Helper: send OTP email -------------------
const sendOtpEmail = async (toEmail, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });

  await transporter.sendMail({
    from: `"Ancient Treasures" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your email",
    html: `<h1>${otp}</h1><p>This OTP is valid for 10 minutes.</p>`,
  });
};

// ------------------- Test database connection -------------------
app.get("/", async (req, res) => {
  try {
    await prisma.$connect();
    res.json({ message: "Database connected successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

// ------------------- Register -------------------
app.post("/auth/register", async (req, res) => {
  const { fullName, email, password, phoneNumber, department, deptRollNo } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: await bcrypt.hash(password, 10),
        phoneNumber,
        department,
        deptRollNo,
        otpHash,
        otpExpiresAt: otpExpiry,
        emailVerified: false,
      },
    });

    await sendOtpEmail(email, otp);

    res.status(201).json({ message: "User registered successfully. OTP sent to email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// ------------------- Verify OTP -------------------
app.post("/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ message: "No OTP found. Please request again." });
    }

    if (user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request again." });
    }

    const isMatch = await bcrypt.compare(otp, user.otpHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid OTP" });

    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        otpHash: null,
        otpExpiresAt: null,
      },
    });

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
});

// ------------------- Start server -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
