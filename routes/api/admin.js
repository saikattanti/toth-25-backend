// routes/api/admin.js - Admin Routes
import express from "express";
import prisma from "../../utils/prisma.js";
import { authMiddleware, adminMiddleware } from "../../middleware/auth.middleware.js";
import { encryptRiddle, generateRiddleKey } from "../../utils/encryption.js";

const router = express.Router();

// All admin routes require authentication + admin privileges
router.use(authMiddleware, adminMiddleware);

// -------------------- CREATE RIDDLE --------------------
router.post("/riddles", async (req, res) => {
  const { title, puzzle, solution, points, orderNumber } = req.body;
  const createdBy = req.user.id;

  try {
    if (!title || !puzzle || !solution) {
      return res.status(400).json({ 
        success: false, 
        error: "Title, puzzle, and solution are required" 
      });
    }

    // Generate encryption key
    const encryptionKey = generateRiddleKey();

    // Encrypt puzzle
    const encryptedPuzzle = encryptRiddle(puzzle, encryptionKey);

    // Create riddle
    const riddle = await prisma.riddle.create({
      data: {
        title,
        encryptedPuzzle,
        encryptionKey,
        solution,
        points: points || 10,
        orderNumber,
        createdBy,
        updatedBy: createdBy,
      },
    });

    // Generate QR data
    const qrData = `${riddle.id}:${encryptionKey}`;

    res.status(201).json({
      success: true,
      message: "Riddle created successfully",
      riddle: {
        id: riddle.id,
        title: riddle.title,
        solution: riddle.solution,
        points: riddle.points,
        orderNumber: riddle.orderNumber,
        qrData, // This should be encoded into QR code
        isActive: riddle.isActive,
      },
    });
  } catch (err) {
    console.error("Create riddle error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create riddle" 
    });
  }
});

// -------------------- GET ALL RIDDLES --------------------
router.get("/riddles", async (req, res) => {
  try {
    const riddles = await prisma.riddle.findMany({
      orderBy: [
        { orderNumber: "asc" },
        { createdAt: "desc" }
      ],
      include: {
        creator: {
          select: {
            fullName: true,
            email: true,
          }
        },
        _count: {
          select: {
            scans: true,
          }
        }
      },
    });

    const riddlesWithQR = riddles.map(riddle => ({
      id: riddle.id,
      title: riddle.title,
      solution: riddle.solution,
      points: riddle.points,
      orderNumber: riddle.orderNumber,
      isActive: riddle.isActive,
      qrData: `${riddle.id}:${riddle.encryptionKey}`,
      totalScans: riddle._count.scans,
      createdBy: riddle.creator.fullName,
      createdAt: riddle.createdAt,
    }));

    res.json({
      success: true,
      count: riddlesWithQR.length,
      riddles: riddlesWithQR,
    });
  } catch (err) {
    console.error("Get riddles error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get riddles" 
    });
  }
});

// -------------------- GET SINGLE RIDDLE --------------------
router.get("/riddles/:id", async (req, res) => {
  const riddleId = parseInt(req.params.id);

  try {
    const riddle = await prisma.riddle.findUnique({
      where: { id: riddleId },
      include: {
        creator: {
          select: {
            fullName: true,
            email: true,
          }
        },
        updater: {
          select: {
            fullName: true,
            email: true,
          }
        },
        _count: {
          select: {
            scans: true,
          }
        }
      },
    });

    if (!riddle) {
      return res.status(404).json({ 
        success: false, 
        error: "Riddle not found" 
      });
    }

    res.json({
      success: true,
      riddle: {
        id: riddle.id,
        title: riddle.title,
        solution: riddle.solution,
        points: riddle.points,
        orderNumber: riddle.orderNumber,
        isActive: riddle.isActive,
        qrData: `${riddle.id}:${riddle.encryptionKey}`,
        totalScans: riddle._count.scans,
        createdBy: riddle.creator.fullName,
        updatedBy: riddle.updater.fullName,
        createdAt: riddle.createdAt,
        updatedAt: riddle.updatedAt,
      },
    });
  } catch (err) {
    console.error("Get riddle error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get riddle" 
    });
  }
});

// -------------------- UPDATE RIDDLE --------------------
router.put("/riddles/:id", async (req, res) => {
  const riddleId = parseInt(req.params.id);
  const { title, puzzle, solution, points, orderNumber, isActive } = req.body;
  const updatedBy = req.user.id;

  try {
    const existingRiddle = await prisma.riddle.findUnique({
      where: { id: riddleId },
    });

    if (!existingRiddle) {
      return res.status(404).json({ 
        success: false, 
        error: "Riddle not found" 
      });
    }

    const updateData = { updatedBy };

    if (title !== undefined) updateData.title = title;
    if (solution !== undefined) updateData.solution = solution;
    if (points !== undefined) updateData.points = points;
    if (orderNumber !== undefined) updateData.orderNumber = orderNumber;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If puzzle is updated, re-encrypt
    if (puzzle !== undefined) {
      const newKey = generateRiddleKey();
      updateData.encryptedPuzzle = encryptRiddle(puzzle, newKey);
      updateData.encryptionKey = newKey;
    }

    const updatedRiddle = await prisma.riddle.update({
      where: { id: riddleId },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Riddle updated successfully",
      riddle: {
        id: updatedRiddle.id,
        title: updatedRiddle.title,
        solution: updatedRiddle.solution,
        points: updatedRiddle.points,
        orderNumber: updatedRiddle.orderNumber,
        isActive: updatedRiddle.isActive,
        qrData: `${updatedRiddle.id}:${updatedRiddle.encryptionKey}`,
      },
    });
  } catch (err) {
    console.error("Update riddle error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update riddle" 
    });
  }
});

// -------------------- DELETE RIDDLE --------------------
router.delete("/riddles/:id", async (req, res) => {
  const riddleId = parseInt(req.params.id);

  try {
    await prisma.riddle.delete({
      where: { id: riddleId },
    });

    res.json({
      success: true,
      message: "Riddle deleted successfully",
    });
  } catch (err) {
    console.error("Delete riddle error:", err);
    res.status(400).json({ 
      success: false, 
      error: "Failed to delete riddle" 
    });
  }
});

// -------------------- GET ALL USERS --------------------
router.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        classRollNo: true,
        department: true,
        emailVerified: true,
        profileCompleted: true,
        isAdmin: true,
        createdAt: true,
        gameSession: {
          select: {
            uniqueRiddles: true,
            totalPoints: true,
            isCompleted: true,
          }
        }
      },
    });

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get users" 
    });
  }
});

// -------------------- GET USER DETAILS --------------------
router.get("/users/:id", async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        classRollNo: true,
        phoneNumber: true,
        department: true,
        emailVerified: true,
        profileCompleted: true,
        isAdmin: true,
        createdAt: true,
        gameSession: true,
        scans: {
          include: {
            riddle: {
              select: {
                title: true,
                points: true,
              }
            }
          },
          orderBy: {
            scannedAt: "desc"
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get user" 
    });
  }
});

// -------------------- TOGGLE ADMIN STATUS --------------------
router.patch("/users/:id/admin", async (req, res) => {
  const userId = parseInt(req.params.id);
  const { isAdmin } = req.body;

  try {
    if (typeof isAdmin !== "boolean") {
      return res.status(400).json({ 
        success: false, 
        error: "isAdmin must be a boolean" 
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAdmin },
      select: {
        id: true,
        email: true,
        fullName: true,
        isAdmin: true,
      }
    });

    res.json({
      success: true,
      message: `User ${isAdmin ? "granted" : "revoked"} admin privileges`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Toggle admin error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update admin status" 
    });
  }
});

// -------------------- DELETE USER --------------------
router.delete("/users/:id", async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    // Prevent self-deletion
    if (userId === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        error: "Cannot delete your own account" 
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(400).json({ 
      success: false, 
      error: "Failed to delete user" 
    });
  }
});

// -------------------- GET DASHBOARD STATS --------------------
router.get("/dashboard/stats", async (req, res) => {
  try {
    const [
      totalUsers,
      totalRiddles,
      activeRiddles,
      totalScans,
      completedGames
    ] = await Promise.all([
      prisma.user.count(),
      prisma.riddle.count(),
      prisma.riddle.count({ where: { isActive: true } }),
      prisma.scan.count(),
      prisma.gameSession.count({ where: { isCompleted: true } })
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalRiddles,
        activeRiddles,
        totalScans,
        completedGames,
      },
    });
  } catch (err) {
    console.error("Get dashboard stats error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get dashboard stats" 
    });
  }
});

export default router;
