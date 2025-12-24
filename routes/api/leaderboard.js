// routes/api/leaderboard.js - Leaderboard Routes
import express from "express";
import prisma from "../../utils/prisma.js";
import { optionalAuth } from "../../middleware/auth.middleware.js";

const router = express.Router();

// -------------------- GET LEADERBOARD --------------------
router.get("/", optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    // Get game sessions with user details
    const leaderboard = await prisma.gameSession.findMany({
      where: {
        isCompleted: true,
        uniqueRiddles: { gt: 0 }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            department: true,
            classRollNo: true,
          }
        }
      },
      orderBy: [
        { totalPoints: "desc" },
        { uniqueRiddles: "desc" },
        { endTime: "asc" } // Faster completion time for tie-breaking
      ],
      take: limit,
      skip: offset,
    });

    // Calculate duration and rank
    const leaderboardWithRank = leaderboard.map((entry, index) => {
      const duration = entry.endTime && entry.startTime
        ? Math.floor((new Date(entry.endTime) - new Date(entry.startTime)) / 1000)
        : null;

      const hours = duration ? Math.floor(duration / 3600) : 0;
      const minutes = duration ? Math.floor((duration % 3600) / 60) : 0;
      const seconds = duration ? duration % 60 : 0;

      return {
        rank: offset + index + 1,
        userId: entry.user.id,
        fullName: entry.user.fullName,
        department: entry.user.department,
        classRollNo: entry.user.classRollNo,
        uniqueRiddles: entry.uniqueRiddles,
        totalScans: entry.totalScans,
        totalPoints: entry.totalPoints,
        duration: duration,
        durationFormatted: duration ? `${hours}h ${minutes}m ${seconds}s` : "N/A",
        completedAt: entry.endTime,
        isCurrentUser: req.user ? entry.user.id === req.user.id : false,
      };
    });

    // Get total count
    const totalCompleted = await prisma.gameSession.count({
      where: {
        isCompleted: true,
        uniqueRiddles: { gt: 0 }
      }
    });

    // Get current user's rank if logged in
    let currentUserRank = null;
    if (req.user) {
      const userSession = await prisma.gameSession.findUnique({
        where: { userId: req.user.id },
      });

      if (userSession && userSession.isCompleted) {
        const betterScores = await prisma.gameSession.count({
          where: {
            isCompleted: true,
            uniqueRiddles: { gt: 0 },
            OR: [
              { totalPoints: { gt: userSession.totalPoints } },
              {
                AND: [
                  { totalPoints: userSession.totalPoints },
                  { uniqueRiddles: { gt: userSession.uniqueRiddles } }
                ]
              },
              {
                AND: [
                  { totalPoints: userSession.totalPoints },
                  { uniqueRiddles: userSession.uniqueRiddles },
                  { endTime: { lt: userSession.endTime } }
                ]
              }
            ]
          }
        });

        currentUserRank = betterScores + 1;
      }
    }

    res.json({
      success: true,
      total: totalCompleted,
      limit,
      offset,
      currentUserRank,
      leaderboard: leaderboardWithRank,
    });
  } catch (err) {
    console.error("Get leaderboard error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get leaderboard" 
    });
  }
});

// -------------------- GET TOP PERFORMERS --------------------
router.get("/top", async (req, res) => {
  try {
    const top = parseInt(req.query.top) || 10;

    const topPerformers = await prisma.gameSession.findMany({
      where: {
        isCompleted: true,
        uniqueRiddles: { gt: 0 }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            department: true,
          }
        }
      },
      orderBy: [
        { totalPoints: "desc" },
        { uniqueRiddles: "desc" },
        { endTime: "asc" }
      ],
      take: top,
    });

    const formatted = topPerformers.map((entry, index) => {
      const duration = entry.endTime && entry.startTime
        ? Math.floor((new Date(entry.endTime) - new Date(entry.startTime)) / 1000)
        : null;

      return {
        rank: index + 1,
        fullName: entry.user.fullName,
        department: entry.user.department,
        totalPoints: entry.totalPoints,
        uniqueRiddles: entry.uniqueRiddles,
        duration,
      };
    });

    res.json({
      success: true,
      topPerformers: formatted,
    });
  } catch (err) {
    console.error("Get top performers error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get top performers" 
    });
  }
});

// -------------------- GET DEPARTMENT LEADERBOARD --------------------
router.get("/by-department", async (req, res) => {
  try {
    const department = req.query.department;

    if (!department) {
      return res.status(400).json({ 
        success: false, 
        error: "Department parameter is required" 
      });
    }

    const leaderboard = await prisma.gameSession.findMany({
      where: {
        isCompleted: true,
        uniqueRiddles: { gt: 0 },
        user: {
          department: department
        }
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            classRollNo: true,
            department: true,
          }
        }
      },
      orderBy: [
        { totalPoints: "desc" },
        { uniqueRiddles: "desc" },
        { endTime: "asc" }
      ],
    });

    const formatted = leaderboard.map((entry, index) => ({
      rank: index + 1,
      fullName: entry.user.fullName,
      classRollNo: entry.user.classRollNo,
      totalPoints: entry.totalPoints,
      uniqueRiddles: entry.uniqueRiddles,
    }));

    res.json({
      success: true,
      department,
      count: formatted.length,
      leaderboard: formatted,
    });
  } catch (err) {
    console.error("Get department leaderboard error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get department leaderboard" 
    });
  }
});

export default router;
