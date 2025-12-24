import express from "express";
import prisma from "../../utils/prisma.js";
import { authMiddleware, adminMiddleware } from "../../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/", adminMiddleware, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        deptRollNo: true,
        emailVerified: true,
        createdAt: true,
      },
    });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch users" });
  }
});

router.get("/:id", async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    // Users can only view their own profile, admins can view any
    if (!req.user.isAdmin && req.user.id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: "Access denied" 
      });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        deptRollNo: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch user" });
  }
});

router.delete("/:id", adminMiddleware, async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: "Failed to delete user" });
  }
});

export default router;
