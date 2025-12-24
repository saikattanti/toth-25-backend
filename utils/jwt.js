// utils/jwt.js - JWT Token Management
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Generate JWT token for user
 * @param {object} payload - User data to encode
 * @returns {string} - JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} - Decoded payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token
 * @returns {object} - Decoded payload
 */
export function decodeToken(token) {
  return jwt.decode(token);
}
