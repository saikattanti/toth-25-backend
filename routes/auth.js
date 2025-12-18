import express from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const router = express.Router();
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

router.post("/register", async (req, res) => {
  const { fullName, email, password, phoneNumber, department, deptRollNo } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
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

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject: "Verify your email",
        text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
      });
    }

    res.status(201).json({
      message: "User registered. Please verify your email.",
      userId: user.id,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Registration failed" });
  }
});

router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.otpHash) {
      return res.status(400).json({ error: "Invalid request" });
    }

    if (new Date() > user.otpExpiresAt) {
      return res.status(400).json({ error: "OTP expired" });
    }

    const isValid = await bcrypt.compare(otp, user.otpHash);
    if (!isValid) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: true, otpHash: null, otpExpiresAt: null },
    });

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Verification failed" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(401).json({ error: "Please verify your email first" });
    }

    res.json({
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
    res.status(400).json({ error: "Login failed" });
  }
});

export default router;
