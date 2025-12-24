// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import prisma from "./utils/prisma.js";

import authRoutes from "./routes/api/auth.js";
import usersRoutes from "./routes/api/users.js";
import scanRoutes from "./routes/api/scan.js";
import gameRoutes from "./routes/api/game.js";
import adminRoutes from "./routes/api/admin.js";
import leaderboardRoutes from "./routes/api/leaderboard.js";

// -------------------- ENV --------------------
dotenv.config();

// -------------------- APP --------------------
const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "*", // allow frontend
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors()); // Preflight

app.use(express.json());

// -------------------- ROUTES --------------------
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/scan", scanRoutes);
app.use("/game", gameRoutes);
app.use("/admin", adminRoutes);
app.use("/leaderboard", leaderboardRoutes);

// -------------------- HEALTH CHECK --------------------
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("DB health check error:", err);
    res.status(500).json({ status: "db_error" });
  }
});

// -------------------- ROOT --------------------
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend running",
  });
});

// -------------------- 404 HANDLER --------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// -------------------- GLOBAL ERROR HANDLER --------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ success: false, message: "Server error" });
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend live on port ${PORT}`);
});
