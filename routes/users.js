import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
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
    res.json({ count: users.length, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/:id", async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
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
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.delete("/:id", async (req, res) => {
  const userId = parseInt(req.params.id);

  try {
    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to delete user" });
  }
});

export default router;
