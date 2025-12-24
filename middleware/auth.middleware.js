// middleware/auth.middleware.js - JWT Authentication Middleware
import { verifyToken } from "../utils/jwt.js";
import prisma from "../utils/prisma.js";

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        error: "No token provided" 
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        emailVerified: true,
        profileCompleted: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Check if profile is completed
    if (!user.emailVerified) {
      return res.status(403).json({ 
        success: false, 
        error: "Please verify your email first",
        action: "verify-email"
      });
    }

    if (!user.profileCompleted) {
      return res.status(403).json({ 
        success: false, 
        error: "Please complete your profile first",
        action: "complete-profile"
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ 
      success: false, 
      error: "Invalid or expired token" 
    });
  }
}

/**
 * Middleware to check if user is admin
 */
export function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: "Admin access required" 
    });
  }
  next();
}

/**
 * Optional auth middleware (doesn't fail if no token)
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          emailVerified: true,
          profileCompleted: true,
          isAdmin: true,
        },
      });

      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
}
