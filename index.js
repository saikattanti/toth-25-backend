import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import "dotenv/config";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ------------------- Helper: send OTP email -------------------
const sendOtpEmail = async (toEmail, otp) => {
  try {
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
  } catch (err) {
    console.error("Error sending OTP email:", err);
    throw new Error("Failed to send OTP email");
  }
};

// ------------------- Test database connection -------------------
app.get("/", async (req, res) => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    res.json({
      message: "Database connected successfully!",
      database: "PostgreSQL (Neon)",
      userCount,
      status: "OK",
    });
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

// ------------------- Register with email verification -------------------
app.post("/register", async (req, res) => {
  const {
    fullName,
    email,
    password,
    phoneNumber,
    department,
    deptRollNo,
  } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with hashed password and OTP
    const user = await prisma.user.create({
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

    // Send OTP email
    await sendOtpEmail(email, otp);

    res.status(201).json({
      message: "User registered successfully. OTP sent to email.",
      userId: user.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// ------------------- Verify OTP -------------------
app.post("/verify-otp", async (req, res) => {
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
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP verified → update user
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

// ------------------- Existing /users routes -------------------
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ count: users.length, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.delete("/users/:id", async (req, res) => {
  const userId = parseInt(req.params.id);
  try {
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to delete user" });
  }
});

// ------------------- Existing riddles routes -------------------
app.get("/riddles", async (req, res) => {
  try {
    const riddles = await prisma.riddle.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ count: riddles.length, riddles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch riddles" });
  }
});

app.post("/riddles", async (req, res) => {
  const { name, riddle: riddleText, hint, encryptedData, createdBy } = req.body;
  try {
    const newRiddle = await prisma.riddle.create({
      data: {
        name,
        riddle: riddleText,
        hint: hint || "",
        encryptedData: encryptedData || "",
        createdBy: createdBy || 1,
        updatedBy: createdBy || 1,
      },
    });
    res.status(201).json({ message: "Riddle created successfully", riddle: newRiddle });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create riddle" });
  }
});

app.put("/riddles/:id", async (req, res) => {
  const riddleId = parseInt(req.params.id);
  const { name, riddle: riddleText, hint, encryptedData, updatedBy } = req.body;
  try {
    const updatedRiddle = await prisma.riddle.update({
      where: { id: riddleId },
      data: {
        name,
        riddle: riddleText,
        hint: hint || "",
        encryptedData: encryptedData || "",
        updatedBy: updatedBy || 1,
      },
    });
    res.json({ message: "Riddle updated successfully", riddle: updatedRiddle });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to update riddle" });
  }
});

app.delete("/riddles/:id", async (req, res) => {
  const riddleId = parseInt(req.params.id);
  try {
    await prisma.riddle.delete({ where: { id: riddleId } });
    res.json({ message: "Riddle deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to delete riddle" });
  }
});

// ------------------- Start server -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
