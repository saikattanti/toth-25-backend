import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";

// -------------------- Load ENV --------------------
dotenv.config();

// -------------------- Init --------------------
const app = express();
const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

// -------------------- Middleware --------------------
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*", // change to your frontend URL in production
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));

// -------------------- Routes --------------------
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);

// -------------------- Health Check --------------------
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      database: "connected",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});

// -------------------- Root --------------------
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend is running!", timestamp: new Date().toISOString() });
});

// -------------------- 404 --------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// -------------------- Global Error Handler --------------------
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// -------------------- Graceful Shutdown --------------------
const shutdown = async (signal) => {
  console.log(`🛑 ${signal} received. Shutting down...`);
  await prisma.$disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
