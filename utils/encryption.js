// utils/encryption.js - AES-256 Encryption/Decryption
import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const IV_LENGTH = 16;

/**
 * Encrypt text using AES-256
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text in format: iv:encryptedData
 */
export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt text using AES-256
 * @param {string} encryptedData - Encrypted text in format: iv:encryptedData
 * @returns {string} - Decrypted text
 */
export function decrypt(encryptedData) {
  try {
    const [ivHex, encrypted] = encryptedData.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "hex"),
      iv
    );

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Decryption failed: Invalid key or corrupted data");
  }
}

/**
 * Generate a random encryption key for riddles
 * @returns {string} - Random key
 */
export function generateRiddleKey() {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Encrypt riddle puzzle with specific key
 * @param {string} puzzle - Puzzle text
 * @param {string} key - Encryption key
 * @returns {string} - Encrypted puzzle
 */
export function encryptRiddle(puzzle, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(key.padEnd(64, "0").substring(0, 64), "hex"),
    iv
  );

  let encrypted = cipher.update(puzzle, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt riddle puzzle with specific key
 * @param {string} encryptedPuzzle - Encrypted puzzle
 * @param {string} key - Decryption key
 * @returns {string} - Decrypted puzzle
 */
export function decryptRiddle(encryptedPuzzle, key) {
  try {
    const [ivHex, encrypted] = encryptedPuzzle.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(key.padEnd(64, "0").substring(0, 64), "hex"),
      iv
    );

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error("Invalid decryption key");
  }
}
