# Node Express Web Application

## Overview
A Node.js Express backend API with PostgreSQL database using Prisma ORM.

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Template Engine**: EJS

## Project Structure
```
├── index.js           # Main server file with API endpoints
├── prisma/
│   └── schema.prisma  # Database schema
├── views/
│   └── index.ejs      # HTML template
├── public/
│   └── styles.css     # Stylesheets
└── package.json       # Dependencies
```

## API Endpoints
- `GET /` - Health check / database connection test
- `POST /register` - Register new user
- `GET /users` - Get all users
- `DELETE /users/:id` - Delete user
- `GET /riddles` - Get all riddles
- `POST /riddles` - Create riddle
- `PUT /riddles/:id` - Update riddle
- `DELETE /riddles/:id` - Delete riddle

## Database Models
- **User**: User registration data
- **Riddle**: Riddle content with encrypted data
- **emailAuth**: Email verification
- **scans**: QR scan tracking

## Development
Server runs on port 5000 with `npm run dev` (uses nodemon for auto-reload).

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (auto-configured by Replit)
