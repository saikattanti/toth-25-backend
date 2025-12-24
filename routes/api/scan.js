// routes/api/scan.js - QR Scan Routes
import express from "express";
import prisma from "../../utils/prisma.js";
import { decryptRiddle } from "../../utils/encryption.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = express.Router();

// -------------------- SCAN QR CODE --------------------
router.post("/", authMiddleware, async (req, res) => {
  const { qrData } = req.body;
  const userId = req.user.id;

  try {
    if (!qrData) {
      return res.status(400).json({ 
        success: false, 
        error: "QR data is required" 
      });
    }

    // Parse QR data format: riddleId:encryptionKey
    const [riddleIdStr, encryptionKey] = qrData.split(":");
    
    if (!riddleIdStr || !encryptionKey) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid QR code format" 
      });
    }

    const riddleId = parseInt(riddleIdStr);
    
    if (isNaN(riddleId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid riddle ID" 
      });
    }

    // Fetch riddle
    const riddle = await prisma.riddle.findUnique({
      where: { id: riddleId },
      select: {
        id: true,
        title: true,
        encryptedPuzzle: true,
        encryptionKey: true,
        solution: true,
        points: true,
        isActive: true,
      }
    });

    if (!riddle) {
      return res.status(404).json({ 
        success: false, 
        error: "Riddle not found" 
      });
    }

    if (!riddle.isActive) {
      return res.status(400).json({ 
        success: false, 
        error: "This riddle is currently inactive" 
      });
    }

    // Verify encryption key matches
    if (riddle.encryptionKey !== encryptionKey) {
      return res.status(403).json({ 
        success: false, 
        error: "Invalid QR code or decryption key" 
      });
    }

    // Decrypt puzzle
    let decryptedPuzzle;
    try {
      decryptedPuzzle = decryptRiddle(riddle.encryptedPuzzle, encryptionKey);
    } catch (error) {
      console.error("Decryption error:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to decrypt riddle" 
      });
    }

    // Check if user already scanned this riddle
    const existingScan = await prisma.scan.findFirst({
      where: {
        userId,
        riddleId,
      },
      orderBy: {
        scannedAt: "desc"
      }
    });

    const isFirstScan = !existingScan;

    // Record scan
    await prisma.scan.create({
      data: {
        userId,
        riddleId,
      },
    });

    // Update game session
    let gameSession = await prisma.gameSession.findUnique({
      where: { userId },
    });

    if (!gameSession) {
      // Create new game session
      gameSession = await prisma.gameSession.create({
        data: {
          userId,
          totalScans: 1,
          uniqueRiddles: 1,
          totalPoints: riddle.points,
        },
      });
    } else {
      // Update existing session
      const updates = {
        totalScans: { increment: 1 },
      };

      // Only add points and increment unique riddles if first scan
      if (isFirstScan) {
        updates.uniqueRiddles = { increment: 1 };
        updates.totalPoints = { increment: riddle.points };
      }

      await prisma.gameSession.update({
        where: { userId },
        data: updates,
      });
    }

    res.json({
      success: true,
      message: isFirstScan ? "New riddle unlocked!" : "Riddle scanned again",
      riddle: {
        id: riddle.id,
        title: riddle.title,
        puzzle: decryptedPuzzle,
        solution: riddle.solution,
        points: riddle.points,
        isFirstScan,
      },
    });
  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to process scan" 
    });
  }
});

// -------------------- GET MY SCANS --------------------
router.get("/my-scans", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const scans = await prisma.scan.findMany({
      where: { userId },
      include: {
        riddle: {
          select: {
            id: true,
            title: true,
            points: true,
          }
        }
      },
      orderBy: {
        scannedAt: "desc"
      }
    });

    // Get unique riddles
    const uniqueRiddles = Array.from(
      new Set(scans.map(s => s.riddleId))
    ).map(riddleId => {
      const scan = scans.find(s => s.riddleId === riddleId);
      return {
        riddleId: scan.riddle.id,
        title: scan.riddle.title,
        points: scan.riddle.points,
        firstScannedAt: scans
          .filter(s => s.riddleId === riddleId)
          .sort((a, b) => new Date(a.scannedAt) - new Date(b.scannedAt))[0]
          .scannedAt,
        totalScans: scans.filter(s => s.riddleId === riddleId).length,
      };
    });

    res.json({
      success: true,
      totalScans: scans.length,
      uniqueRiddles: uniqueRiddles.length,
      scans: uniqueRiddles,
    });
  } catch (err) {
    console.error("Get scans error:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to get scans" 
    });
  }
});

export default router;
