# 🏆 Treasure Hunt - TOTH 25 Backend

Complete backend API for the college treasure hunt game with QR scanning, riddle decryption, leaderboards, and admin management.

---

## 📋 Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Project Structure](#-project-structure)
4. [Installation & Setup](#-installation--setup)
5. [Environment Variables](#-environment-variables)
6. [Database Schema](#-database-schema)
7. [API Documentation](#-api-documentation)
8. [Testing Guide](#-testing-guide)
9. [Email Configuration](#-email-configuration)
10. [Security Features](#-security-features)
11. [Production Deployment](#-production-deployment)

---

## 🎯 Features

### User Features
- ✅ **3-Step Registration** - Email/Password → OTP Verification → Profile Completion
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **QR Code Scanning** - Scan QR codes to unlock encrypted riddles
- ✅ **Game Progress Tracking** - Track scans, points, and completion
- ✅ **Leaderboard System** - Ranked by points, unique riddles, and completion time
- ✅ **Email Notifications** - OTP emails and welcome messages

### Admin Features
- ✅ **Riddle Management** - Full CRUD operations with automatic encryption
- ✅ **User Management** - View users, manage admin roles, delete users
- ✅ **Dashboard Statistics** - Overview of users, riddles, scans, and completions
- ✅ **QR Code Generation** - Automatic QR data generation for riddles

### Security Features
- ✅ **AES-256 Encryption** - Riddle puzzle encryption
- ✅ **bcrypt Password Hashing** - Secure password storage
- ✅ **JWT Token Verification** - Protected routes with middleware
- ✅ **Admin Authorization** - Role-based access control
- ✅ **OTP Verification** - Email verification with 10-minute expiry

---

## 🛠️ Tech Stack

- **Runtime:** Node.js v24.12.0
- **Framework:** Express.js
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma v5.22.0
- **Authentication:** jsonwebtoken, bcryptjs
- **Encryption:** Node.js crypto (AES-256)
- **Email:** nodemailer (Gmail SMTP)
- **Dev Tools:** nodemon, morgan, cors

---

## 📁 Project Structure

```
toth-25-backend/
├── constants/
│   └── departments.js          # List of college departments
├── controllers/
│   └── auth.controller.js      # (Legacy - not used)
├── middleware/
│   └── auth.middleware.js      # JWT verification & admin checks
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.js                # Demo data seeding script
│   └── migrations/            # Database migrations
├── routes/
│   └── api/
│       ├── auth.js            # Authentication & registration
│       ├── scan.js            # QR scanning & riddle unlocking
│       ├── game.js            # Game progress & stats
│       ├── leaderboard.js     # Rankings & leaderboards
│       ├── admin.js           # Admin management panel
│       └── users.js           # User profile management
├── utils/
│   ├── prisma.js              # Prisma client singleton
│   ├── encryption.js          # AES-256 encryption utilities
│   ├── jwt.js                 # JWT token generation/verification
│   └── email.js               # Email service (OTP & welcome)
├── .env                       # Environment variables
├── index.js                   # Express server entry point
├── package.json               # Dependencies & scripts
└── README.md                  # This file
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v18+ (v24.12.0 recommended)
- PostgreSQL database (or Neon account)
- Gmail account (for SMTP)

### Step 1: Clone Repository
```bash
git clone https://github.com/saikattanti/toth-25-backend.git
cd toth-25-backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create `.env` file (see [Environment Variables](#-environment-variables) section)

### Step 4: Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed demo data
npm run seed
```

### Step 5: Start Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on: `http://localhost:5000`

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Connection (Required)
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# JWT Configuration (Required)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Encryption Configuration (Required)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2

# Gmail SMTP Configuration (Required for OTP emails)
# To generate App Password: https://myaccount.google.com/apppasswords
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Frontend URL (Optional)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### How to Generate Encryption Key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### How to Get Gmail App Password:
1. Enable 2-Factor Authentication on your Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Select "Mail" and "Other (Custom name)"
4. Copy the 16-character password (remove spaces)

---

## 📊 Database Schema

### User Model
```prisma
model User {
  id               Int       @id @default(autoincrement())
  email            String    @unique
  password         String
  fullName         String?
  classRollNo      String?   @unique
  phoneNumber      String?   @unique
  department       String?
  emailVerified    Boolean   @default(false)
  profileCompleted Boolean   @default(false)
  isAdmin          Boolean   @default(false)
  otpHash          String?
  otpExpiresAt     DateTime?
  scans            Scan[]
  gameSession      GameSession?
  createdAt        DateTime  @default(now())
}
```

### Riddle Model
```prisma
model Riddle {
  id              Int      @id @default(autoincrement())
  title           String
  encryptedPuzzle String
  encryptionKey   String
  solution        String
  points          Int      @default(10)
  orderNumber     Int      @unique
  isActive        Boolean  @default(true)
  scans           Scan[]
  createdAt       DateTime @default(now())
}
```

### Scan Model
```prisma
model Scan {
  id        Int      @id @default(autoincrement())
  userId    Int
  riddleId  Int
  scannedAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  riddle    Riddle   @relation(fields: [riddleId], references: [id], onDelete: Cascade)
}
```

### GameSession Model
```prisma
model GameSession {
  id            Int       @id @default(autoincrement())
  userId        Int       @unique
  startTime     DateTime  @default(now())
  endTime       DateTime?
  isCompleted   Boolean   @default(false)
  totalScans    Int       @default(0)
  uniqueRiddles Int       @default(0)
  totalPoints   Int       @default(0)
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 📡 API Documentation

Base URL: `http://localhost:5000`

### 🔓 Public Routes

#### 1. User Registration (Step 1)
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@college.edu",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for OTP.",
  "userId": 1,
  "email": "user@college.edu"
}
```

#### 2. Verify OTP (Step 2)
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@college.edu",
  "otp": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "nextStep": "complete-profile"
}
```

#### 3. Resend OTP
```http
POST /auth/resend-otp
Content-Type: application/json

{
  "email": "user@college.edu"
}
```

#### 4. Complete Profile (Step 3)
```http
POST /auth/complete-profile
Content-Type: application/json

{
  "email": "user@college.edu",
  "fullName": "John Doe",
  "classRollNo": "CS2023001",
  "phoneNumber": "9876543210",
  "department": "Computer Science"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile completed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@college.edu",
    "fullName": "John Doe",
    "classRollNo": "CS2023001",
    "department": "Computer Science",
    "isAdmin": false
  }
}
```

#### 5. Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@college.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@college.edu",
    "fullName": "John Doe",
    "isAdmin": false
  }
}
```

#### 6. Check Profile Status
```http
GET /auth/profile-status?email=user@college.edu
```

**Response:**
```json
{
  "success": true,
  "emailVerified": true,
  "profileCompleted": true,
  "nextStep": "login"
}
```

---

### 🔒 Protected Routes (Require JWT Token)

**Add to all requests:**
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 7. Get My Profile
```http
GET /auth/me
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@college.edu",
    "fullName": "John Doe",
    "classRollNo": "CS2023001",
    "phoneNumber": "9876543210",
    "department": "Computer Science",
    "isAdmin": false
  }
}
```

#### 8. Scan QR Code
```http
POST /scan
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "qrData": "9:f3fbd82b8062d0014a1f6b35667a25f4"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Riddle unlocked! You earned 15 points.",
  "riddle": {
    "id": 9,
    "title": "Riddle #1: The Beginning",
    "puzzle": "I speak without a mouth and hear without ears...",
    "solution": "An echo",
    "points": 15
  },
  "isFirstScan": true,
  "totalScans": 1,
  "uniqueRiddles": 1,
  "totalPoints": 15
}
```

#### 9. Get My Scans
```http
GET /scan/my-scans
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "scans": [
    {
      "id": 1,
      "riddleId": 9,
      "scannedAt": "2025-12-25T10:30:00.000Z",
      "riddle": {
        "id": 9,
        "title": "Riddle #1: The Beginning",
        "points": 15
      }
    }
  ],
  "totalScans": 1,
  "uniqueRiddles": 1
}
```

#### 10. Get Game Progress
```http
GET /game/progress
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "totalScans": 5,
    "uniqueRiddles": 5,
    "totalPoints": 70,
    "completionPercentage": 62.5,
    "isCompleted": false,
    "startTime": "2025-12-25T10:00:00.000Z"
  }
}
```

#### 11. Complete Game
```http
POST /game/complete
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Congratulations! Game completed!",
  "session": {
    "id": 1,
    "userId": 1,
    "startTime": "2025-12-25T10:00:00.000Z",
    "endTime": "2025-12-25T12:30:00.000Z",
    "isCompleted": true,
    "totalScans": 10,
    "uniqueRiddles": 8,
    "totalPoints": 130,
    "duration": "2 hours 30 minutes"
  }
}
```

#### 12. Get Game Stats
```http
GET /game/stats
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "session": {
      "totalScans": 8,
      "uniqueRiddles": 8,
      "totalPoints": 130,
      "isCompleted": true,
      "duration": "2 hours 30 minutes"
    },
    "recentScans": [
      {
        "id": 10,
        "riddleTitle": "Riddle #8: The Final Challenge",
        "points": 20,
        "scannedAt": "2025-12-25T12:30:00.000Z"
      }
    ]
  }
}
```

#### 13. Get Leaderboard
```http
GET /leaderboard?limit=10&offset=0
Authorization: Bearer YOUR_TOKEN (optional)
```

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "userId": 2,
      "fullName": "Alice Johnson",
      "department": "Computer Science",
      "totalPoints": 130,
      "uniqueRiddles": 8,
      "duration": "1 hour 45 minutes",
      "completedAt": "2025-12-25T11:45:00.000Z"
    }
  ],
  "currentUserRank": 3,
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 5
  }
}
```

#### 14. Get Top Performers
```http
GET /leaderboard/top?top=3
```

#### 15. Get Department Leaderboard
```http
GET /leaderboard/by-department?department=Computer Science
```

---

### 🔧 Admin Routes (Require Admin Role)

**Add to all requests:**
```http
Authorization: Bearer ADMIN_JWT_TOKEN
```

#### 16. Create Riddle
```http
POST /admin/riddles
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "title": "Riddle #9: New Challenge",
  "puzzle": "This is the riddle puzzle text",
  "solution": "This is the solution text",
  "points": 20,
  "orderNumber": 9
}
```

**Response:**
```json
{
  "success": true,
  "message": "Riddle created successfully",
  "riddle": {
    "id": 17,
    "title": "Riddle #9: New Challenge",
    "orderNumber": 9,
    "points": 20,
    "isActive": true
  },
  "qrData": "17:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

#### 17. Get All Riddles (Admin)
```http
GET /admin/riddles
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "success": true,
  "riddles": [
    {
      "id": 9,
      "title": "Riddle #1: The Beginning",
      "orderNumber": 1,
      "points": 15,
      "isActive": true,
      "scanCount": 5,
      "createdAt": "2025-12-24T10:00:00.000Z"
    }
  ],
  "total": 8
}
```

#### 18. Get Single Riddle (Admin)
```http
GET /admin/riddles/9
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "success": true,
  "riddle": {
    "id": 9,
    "title": "Riddle #1: The Beginning",
    "puzzle": "Decrypted puzzle text here",
    "encryptionKey": "f3fbd82b8062d0014a1f6b35667a25f4",
    "solution": "An echo",
    "points": 15,
    "orderNumber": 1,
    "isActive": true,
    "scanCount": 5,
    "qrData": "9:f3fbd82b8062d0014a1f6b35667a25f4",
    "createdAt": "2025-12-24T10:00:00.000Z"
  }
}
```

#### 19. Update Riddle
```http
PUT /admin/riddles/9
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "title": "Riddle #1: Updated Title",
  "puzzle": "Updated puzzle text",
  "solution": "Updated solution",
  "points": 20,
  "isActive": true
}
```

#### 20. Delete Riddle
```http
DELETE /admin/riddles/9
Authorization: Bearer ADMIN_TOKEN
```

#### 21. Get All Users
```http
GET /admin/users
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "id": 2,
      "email": "alice@college.edu",
      "fullName": "Alice Johnson",
      "classRollNo": "CS2023001",
      "department": "Computer Science",
      "isAdmin": false,
      "gameSession": {
        "totalPoints": 130,
        "uniqueRiddles": 8,
        "isCompleted": true
      },
      "createdAt": "2025-12-24T09:00:00.000Z"
    }
  ],
  "total": 6
}
```

#### 22. Get User Details
```http
GET /admin/users/2
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 2,
    "email": "alice@college.edu",
    "fullName": "Alice Johnson",
    "classRollNo": "CS2023001",
    "phoneNumber": "9876543210",
    "department": "Computer Science",
    "isAdmin": false,
    "gameSession": {
      "totalPoints": 130,
      "uniqueRiddles": 8,
      "isCompleted": true,
      "duration": "1 hour 45 minutes"
    },
    "recentScans": [
      {
        "id": 8,
        "riddleTitle": "Riddle #8",
        "scannedAt": "2025-12-25T11:45:00.000Z"
      }
    ],
    "createdAt": "2025-12-24T09:00:00.000Z"
  }
}
```

#### 23. Toggle Admin Status
```http
PATCH /admin/users/6/admin
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "isAdmin": true
}
```

#### 24. Delete User
```http
DELETE /admin/users/7
Authorization: Bearer ADMIN_TOKEN
```

#### 25. Get Dashboard Stats
```http
GET /admin/dashboard/stats
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 6,
    "totalRiddles": 8,
    "activeRiddles": 8,
    "totalScans": 34,
    "completedGames": 2,
    "averageCompletionTime": "2 hours 15 minutes"
  }
}
```

---

## 🧪 Testing Guide

### Demo Credentials

**Admin Account:**
```
Email: admin@college.edu
Password: admin123
```

**Test Users:**
```
alice.johnson@college.edu / password123 (Completed game)
bob.smith@college.edu / password123 (In progress)
charlie.brown@college.edu / password123 (Completed game)
diana.prince@college.edu / password123 (Just started)
eve.wilson@college.edu / password123 (Not started)
```

### Demo QR Codes

```
Riddle #1: 9:f3fbd82b8062d0014a1f6b35667a25f4
Riddle #2: 10:b3adce0b6886bafb467a65b0768da7f1
Riddle #3: 11:23e9b53e05710fa653892a6f43432996
Riddle #4: 12:f1c3dd723bcea0123fd48b9f9da3ffec
Riddle #5: 13:03f1cd5aa4066b3ca5cea9437f995d39
Riddle #6: 14:b893000bcfba2d87f2bc4f3af154b2d7
Riddle #7: 15:e7adfeb1aee0ae193f20103abcf7cd0f
Riddle #8: 16:6e6de539c52a469791bd8bb0b7b1ab8c
```

### Test Scenarios

#### Scenario 1: New User Registration
1. Register new user → OTP sent to email
2. Verify OTP → Email verified
3. Complete profile → Welcome email + JWT token
4. Login → Access granted

#### Scenario 2: QR Scanning Flow
1. Login as eve.wilson@college.edu
2. Scan QR code: `9:f3fbd82b8062d0014a1f6b35667a25f4`
3. Riddle unlocked → 15 points earned
4. Re-scan same QR → No new points
5. Check progress → 1 unique riddle, 15 points

#### Scenario 3: Complete Game
1. Login as Eve
2. Scan all 8 QR codes
3. Check progress → 100% completion
4. Complete game → Record end time
5. Check leaderboard → See your rank

#### Scenario 4: Admin Management
1. Login as admin
2. Create new riddle → Get QR code
3. View all users → See game stats
4. View dashboard → Overall statistics
5. Make user admin → Toggle admin role

### Testing Tools

**Recommended:**
- Postman
- Thunder Client (VS Code extension)
- Insomnia
- curl

**Example curl command:**
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@college.edu","password":"admin123"}'
```

**PowerShell script:**
```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:5000/auth/login" `
  -Method POST `
  -Body '{"email":"eve.wilson@college.edu","password":"password123"}' `
  -ContentType "application/json"

$token = $response.token

# Scan QR
$headers = @{"Authorization" = "Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:5000/scan" `
  -Method POST `
  -Headers $headers `
  -Body '{"qrData":"9:f3fbd82b8062d0014a1f6b35667a25f4"}' `
  -ContentType "application/json"
```

---

## 📧 Email Configuration

### Gmail SMTP Setup

#### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification"

#### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" → "Other (Custom name)"
3. Enter: "Treasure Hunt Backend"
4. Copy the 16-character password (remove spaces)

#### Step 3: Update .env
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

### Email Templates

#### OTP Email
- Professional HTML design with gradient header
- 4-digit verification code (large, easy to read)
- 10-minute expiry notice
- Security warnings
- Mobile-responsive

#### Welcome Email
- Personalized greeting with user's name
- Game instructions and how to play
- Branded design
- Call-to-action buttons
- Mobile-responsive

### Email Limits

**Free Gmail:** 500 emails/day
**Google Workspace:** 2,000 emails/day

For production with high traffic, consider:
- SendGrid
- AWS SES
- Mailgun
- Postmark

---

## 🔒 Security Features

### Encryption
- **AES-256-CBC** for riddle puzzles
- **Unique encryption keys** per riddle
- **bcrypt (10 rounds)** for password hashing
- **JWT tokens** with 7-day expiry

### Authentication
- **JWT verification** on all protected routes
- **Email verification** required for registration
- **Profile completion** check before game access
- **Admin role** check for admin routes

### Authorization
- **authMiddleware** - Verifies JWT and profile completion
- **adminMiddleware** - Verifies admin role
- **optionalAuth** - Optional authentication for public routes

### Input Validation
- Email format validation
- Password strength requirements (min 6 characters)
- Phone number uniqueness
- Class roll number uniqueness

### QR Code Security
- Format: `riddleId:encryptionKey`
- Encryption key validated before decryption
- Invalid keys rejected
- Riddle puzzle only decrypted on successful scan

---

## 🎮 Game Mechanics

### Scanning Rules
- ✅ Users can scan QR codes multiple times
- ✅ Points awarded only on **first scan** of each riddle
- ✅ Game session auto-created on first scan
- ✅ Progress tracked in real-time

### Leaderboard Ranking
Ranked by (in order):
1. **Total Points** (descending)
2. **Unique Riddles** (descending)
3. **Completion Time** (ascending)

### Points System
- Each riddle has a point value (configurable)
- Demo riddles: 10-20 points each
- Total possible: 130 points (8 riddles)

### Completion
- Game marked complete when user triggers `/game/complete`
- Records end time and calculates duration
- User appears on leaderboard with final rank

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Generate new `ENCRYPTION_KEY`
- [ ] Update `DATABASE_URL` to production database
- [ ] Configure Gmail SMTP or switch to SendGrid/SES
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS for production frontend
- [ ] Set up error logging (e.g., Sentry)
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Review and update security settings

### Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL="postgresql://prod-user:password@prod-host:5432/prod-db"
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=<64-character-hex-string>
GMAIL_USER=noreply@yourdomain.com
GMAIL_APP_PASSWORD=<app-password>
NEXT_PUBLIC_FRONTEND_URL=https://yourdomain.com
```

### Recommended Services

- **Hosting:** Railway, Render, Heroku, AWS EC2
- **Database:** Neon, Supabase, AWS RDS
- **Email:** SendGrid, AWS SES, Mailgun
- **Monitoring:** Sentry, LogRocket
- **CDN:** Cloudflare

### Performance Optimization

- Use connection pooling for database
- Implement Redis for caching
- Enable gzip compression
- Use PM2 for process management
- Set up load balancing for high traffic

---

## 📝 Available Scripts

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Database operations
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Create & apply migration
npx prisma migrate deploy    # Apply migrations (production)
npx prisma studio            # Open Prisma Studio GUI

# Seed database with demo data
npm run seed

# View database
npx prisma studio
```

---

## 🐛 Troubleshooting

### Database Issues

**Error: Prisma client not generated**
```bash
npx prisma generate
```

**Error: Migration failed**
```bash
npx prisma migrate reset
npx prisma migrate dev
```

### Email Issues

**OTP not received:**
- Check spam folder
- Verify Gmail App Password is correct
- Check console for fallback OTP
- Ensure 2FA enabled on Gmail

**Connection refused:**
- Check firewall settings
- Verify internet connection
- Try port 465 instead of 587

### Authentication Issues

**Token expired:**
- Login again to get new token
- Check `JWT_EXPIRES_IN` setting

**Invalid token:**
- Ensure token is in `Authorization: Bearer TOKEN` format
- Check if `JWT_SECRET` matches between requests

---

## 📞 Support

For issues or questions:
1. Check this README
2. Review console logs
3. Check Prisma Studio for database state
4. Verify environment variables

---

## 📄 License

MIT License - Free to use for educational purposes

---

## 👨‍💻 Author

**Saikat Tanti**
- GitHub: [@saikattanti](https://github.com/saikattanti)
- Email: xplorica.tech@gmail.com

---

**🎉 Happy Treasure Hunting!**

Server running on: `http://localhost:5000`
