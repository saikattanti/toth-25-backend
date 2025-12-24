// backend/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import prisma from "./utils/prisma.js";

import authRoutes from "./routes/api/auth.js";
import usersRoutes from "./routes/api/users.js";
import scanRoutes from "./routes/api/scan.js";
import gameRoutes from "./routes/api/game.js";
import adminRoutes from "./routes/api/admin.js";
import leaderboardRoutes from "./routes/api/leaderboard.js";

// -------------------- ENV --------------------
dotenv.config();

// -------------------- APP --------------------
const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || "*", // allow frontend
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors()); // Preflight

app.use(express.json());

// -------------------- ROUTES --------------------
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/scan", scanRoutes);
app.use("/game", gameRoutes);
app.use("/admin", adminRoutes);
app.use("/leaderboard", leaderboardRoutes);

// -------------------- HEALTH CHECK --------------------
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("DB health check error:", err);
    res.status(500).json({ status: "db_error" });
  }
});

// -------------------- ROOT --------------------
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Treasure Hunt API - TOTH 25</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: white;
          min-height: 100vh;
          padding: 40px 20px;
        }
        .container {
          max-width: 800px;
          width: 100%;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 {
          color: #667eea;
          font-size: 32px;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #666;
          font-size: 18px;
        }
        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #d4edda;
          color: #155724;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          margin-top: 15px;
        }
        .status::before {
          content: '●';
          font-size: 20px;
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .section {
          margin: 30px 0;
        }
        .section h2 {
          color: #333;
          font-size: 20px;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .endpoints {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .endpoint {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
          border-left: 4px solid #667eea;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .endpoint:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }
        .endpoint-name {
          font-weight: 600;
          color: #333;
          margin-bottom: 5px;
        }
        .endpoint-path {
          color: #666;
          font-size: 14px;
          font-family: monospace;
        }
        .links {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 30px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .btn-primary {
          background: #667eea;
          color: white;
        }
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">🏆</div>
          <h1>Treasure Hunt API</h1>
          <div class="subtitle">TOTH 25 Backend Server</div>
          <div class="status">Server Running</div>
        </div>

        <div class="section">
          <h2>📡 API Endpoints</h2>
          <div class="endpoints">
            <div class="endpoint">
              <div class="endpoint-name">🔐 Authentication</div>
              <div class="endpoint-path">/auth</div>
            </div>
            <div class="endpoint">
              <div class="endpoint-name">📷 QR Scanning</div>
              <div class="endpoint-path">/scan</div>
            </div>
            <div class="endpoint">
              <div class="endpoint-name">🎮 Game Progress</div>
              <div class="endpoint-path">/game</div>
            </div>
            <div class="endpoint">
              <div class="endpoint-name">🏅 Leaderboard</div>
              <div class="endpoint-path">/leaderboard</div>
            </div>
            <div class="endpoint">
              <div class="endpoint-name">🔧 Admin Panel</div>
              <div class="endpoint-path">/admin</div>
            </div>
            <div class="endpoint">
              <div class="endpoint-name">👥 User Management</div>
              <div class="endpoint-path">/users</div>
            </div>
          </div>
        </div>

        <div class="links">
          <a href="/health" class="btn btn-primary">
            ❤️ Health Check
          </a>
          <a href="https://github.com/saikattanti/toth-25-backend" target="_blank" class="btn btn-secondary">
            📚 Documentation
          </a>
        </div>

        <div class="footer">
          <p>Built with ❤️ for TOTH 25</p>
          <p style="margin-top: 8px; font-size: 12px;">Powered by Express.js • PostgreSQL • Prisma</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// -------------------- 404 HANDLER --------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// -------------------- GLOBAL ERROR HANDLER --------------------
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ success: false, message: "Server error" });
});

// -------------------- START SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend live on port ${PORT}`);
});
