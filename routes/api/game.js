// routes/api/game.js - Game Progress Routes
import express from "express";
import prisma from "../../utils/prisma.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = express.Router();

// -------------------- GET GAME PROGRESS --------------------
router.get("/progress", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get game session
    const gameSession = await prisma.gameSession.findUnique({
      where: { userId },
    });

    // Get total active riddles
    const totalRiddles = await prisma.riddle.count({
      where: { isActive: true },
    });

    // Get user's scanned riddles
    const scannedRiddles = await prisma.scan.findMany({
      where: { userId },
      select: {
        riddleId: true,
        scannedAt: true,
      },
      distinct: ["riddleId"],
    });

    const progress = {
      totalScans: gameSession?.totalScans || 0,
      uniqueRiddles: gameSession?.uniqueRiddles || 0,
      totalPoints: gameSession?.totalPoints || 0,
      totalRiddles,
      completionPercentage: totalRiddles > 0 
        ? Math.round(((gameSession?.uniqueRiddles || 0) / totalRiddles) * 100) 
        : 0,
      isCompleted: gameSession?.isCompleted || false,
      startTime: gameSession?.startTime || null,
      endTime: gameSession?.endTime || null,
    };

    res.json({
      success: true,
      progress,
    });
  } catch (err) {
    console.error("Get progress error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get progress" 
    });
  }
});

// -------------------- COMPLETE GAME --------------------
router.post("/complete", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const gameSession = await prisma.gameSession.findUnique({
      where: { userId },
    });

    if (!gameSession) {
      return res.status(400).json({ 
        success: false, 
        error: "No game session found. Scan at least one riddle first." 
      });
    }

    if (gameSession.isCompleted) {
      return res.status(400).json({ 
        success: false, 
        error: "Game already completed" 
      });
    }

    // Mark as completed
    const updatedSession = await prisma.gameSession.update({
      where: { userId },
      data: {
        isCompleted: true,
        endTime: new Date(),
      },
    });

    // Calculate duration
    const duration = Math.floor(
      (new Date(updatedSession.endTime) - new Date(updatedSession.startTime)) / 1000
    ); // in seconds

    res.json({
      success: true,
      message: "Congratulations! Game completed!",
      stats: {
        uniqueRiddles: updatedSession.uniqueRiddles,
        totalScans: updatedSession.totalScans,
        totalPoints: updatedSession.totalPoints,
        duration: duration,
        startTime: updatedSession.startTime,
        endTime: updatedSession.endTime,
      },
    });
  } catch (err) {
    console.error("Complete game error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to complete game" 
    });
  }
});

// -------------------- GET GAME STATS --------------------
router.get("/stats", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const gameSession = await prisma.gameSession.findUnique({
      where: { userId },
    });

    const totalRiddles = await prisma.riddle.count({
      where: { isActive: true },
    });

    const scans = await prisma.scan.findMany({
      where: { userId },
      include: {
        riddle: {
          select: {
            title: true,
            points: true,
          }
        }
      },
      orderBy: {
        scannedAt: "asc"
      }
    });

    const firstScan = scans.length > 0 ? scans[0].scannedAt : null;
    const lastScan = scans.length > 0 ? scans[scans.length - 1].scannedAt : null;

    res.json({
      success: true,
      stats: {
        totalRiddles,
        solvedRiddles: gameSession?.uniqueRiddles || 0,
        totalScans: gameSession?.totalScans || 0,
        totalPoints: gameSession?.totalPoints || 0,
        isCompleted: gameSession?.isCompleted || false,
        firstScan,
        lastScan,
        recentScans: scans.slice(-5).map(s => ({
          riddleTitle: s.riddle.title,
          points: s.riddle.points,
          scannedAt: s.scannedAt,
        })),
      },
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get stats" 
    });
  }
});

export default router;
