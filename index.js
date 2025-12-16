import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";
// import pkg from "pg";
// const { Pool } = pkg;
import "dotenv/config";

const app = express();
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// const adapter = new PrismaPg(pool);
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Test database connection endpoint
app.get("/", async (req, res) => {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    res.json({
      message: "Database connected successfully!",
      database: "PostgreSQL (Neon)",
      userCount: userCount,
      status: "OK"
    });
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({
      error: "Database connection failed",
      details: err.message
    });
  }
});

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
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password,
        phoneNumber,
        department,
        deptRollNo,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: "User already exists or invalid data",
    });
  }
});

// Get all users endpoint
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({
      count: users.length,
      users: users
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch users"
    });
  }
});

// Delete user endpoint
app.delete("/users/:id", async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    await prisma.user.delete({
      where: { id: userId }
    });
    res.json({
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: "Failed to delete user"
    });
  }
});

// ============= RIDDLE ENDPOINTS =============

// Get all riddles
app.get("/riddles", async (req, res) => {
  try {
    const riddles = await prisma.riddle.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });
    res.json({
      count: riddles.length,
      riddles: riddles
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to fetch riddles"
    });
  }
});

// Create a new riddle
app.post("/riddles", async (req, res) => {
  const { question, answer, hint } = req.body;

  try {
    const riddle = await prisma.riddle.create({
      data: {
        question,
        answer,
        hint: hint || null
      }
    });

    res.status(201).json({
      message: "Riddle created successfully",
      riddle
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: "Failed to create riddle"
    });
  }
});

// Update a riddle
app.put("/riddles/:id", async (req, res) => {
  const riddleId = parseInt(req.params.id);
  const { question, answer, hint } = req.body;

  try {
    const riddle = await prisma.riddle.update({
      where: { id: riddleId },
      data: {
        question,
        answer,
        hint: hint || null
      }
    });

    res.json({
      message: "Riddle updated successfully",
      riddle
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: "Failed to update riddle"
    });
  }
});

// Delete a riddle
app.delete("/riddles/:id", async (req, res) => {
  const riddleId = parseInt(req.params.id);

  try {
    await prisma.riddle.delete({
      where: { id: riddleId }
    });
    res.json({
      message: "Riddle deleted successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: "Failed to delete riddle"
    });
  }
});

app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
