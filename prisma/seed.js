// prisma/seed.js - Demo Data Seeding
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encryptRiddle, generateRiddleKey } from "../utils/encryption.js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data
  await prisma.scan.deleteMany();
  await prisma.gameSession.deleteMany();
  await prisma.riddle.deleteMany();
  await prisma.user.deleteMany();

  // Create Admin User
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      email: "admin@college.edu",
      password: adminPassword,
      fullName: "Admin User",
      classRollNo: "ADMIN001",
      phoneNumber: "9999999999",
      department: "Computer Science",
      emailVerified: true,
      profileCompleted: true,
      isAdmin: true,
    },
  });
  console.log("✅ Admin created:", admin.email);

  // Create Test Users
  const users = [];
  const userPasswords = await bcrypt.hash("password123", 10);

  const userData = [
    { name: "Alice Johnson", rollNo: "CS2023001", dept: "Computer Science", phone: "1234567890" },
    { name: "Bob Smith", rollNo: "IT2023002", dept: "Information Technology", phone: "1234567891" },
    { name: "Charlie Brown", rollNo: "EC2023003", dept: "Electronics & Communication", phone: "1234567892" },
    { name: "Diana Prince", rollNo: "CS2023004", dept: "Computer Science", phone: "1234567893" },
    { name: "Eve Wilson", rollNo: "ME2023005", dept: "Mechanical Engineering", phone: "1234567894" },
  ];

  for (const data of userData) {
    const user = await prisma.user.create({
      data: {
        email: data.name.toLowerCase().replace(" ", ".") + "@college.edu",
        password: userPasswords,
        fullName: data.name,
        classRollNo: data.rollNo,
        phoneNumber: data.phone,
        department: data.dept,
        emailVerified: true,
        profileCompleted: true,
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} test users`);

  // Create Riddles
  const riddlesData = [
    {
      title: "Riddle #1: The Beginning",
      puzzle: "Where knowledge meets the rising sun, find where our journey has begun. In the hall where voices echo wide, the first clue waits inside.",
      solution: "The next QR code is attached to the main auditorium entrance, right pillar",
      points: 10,
      orderNumber: 1,
    },
    {
      title: "Riddle #2: The Library Quest",
      puzzle: "Between pages old and knowledge new, where silence reigns and scholars grew. Seek the tower where books reside, on the third floor, left side.",
      solution: "Find the QR code in the library, 3rd floor, near the computer science section",
      points: 15,
      orderNumber: 2,
    },
    {
      title: "Riddle #3: The Clock Tower Mystery",
      puzzle: "Time stands still where students meet, where hands compete and bells repeat. Look up high where time is told, the secret waits in metal cold.",
      solution: "The clock tower in the main quad, QR is on the base, facing west",
      points: 20,
      orderNumber: 3,
    },
    {
      title: "Riddle #4: The Cafeteria Clue",
      puzzle: "Where hunger meets and stories blend, where daily breaks and friendships mend. Near the place where coffee flows, a hidden message no one knows.",
      solution: "Cafeteria notice board, behind the menu display",
      points: 10,
      orderNumber: 4,
    },
    {
      title: "Riddle #5: The Laboratory Secret",
      puzzle: "Where experiments come alive, where future scientists thrive. In rooms of beakers, tubes, and more, check the door on second floor.",
      solution: "Chemistry Lab 2, door frame, right side",
      points: 15,
      orderNumber: 5,
    },
    {
      title: "Riddle #6: The Sports Arena",
      puzzle: "Where champions are made and sweat is shed, where victory and defeat are bred. On the field where games are won, find the QR when you run.",
      solution: "Football field, near the goalpost, left side",
      points: 20,
      orderNumber: 6,
    },
    {
      title: "Riddle #7: The Garden Path",
      puzzle: "Where nature blooms and flowers grow, where peaceful students come and go. Among the petals red and white, a clue awaits in morning light.",
      solution: "College garden, near the fountain, behind the bench",
      points: 15,
      orderNumber: 7,
    },
    {
      title: "Riddle #8: The Final Challenge",
      puzzle: "You've come so far, the end is near, the final truth will now appear. Return to where your journey starts, and claim your prize with beating hearts.",
      solution: "Congratulations! Return to the auditorium to claim your completion!",
      points: 25,
      orderNumber: 8,
    },
  ];

  const riddles = [];
  for (const data of riddlesData) {
    const key = generateRiddleKey();
    const encryptedPuzzle = encryptRiddle(data.puzzle, key);

    const riddle = await prisma.riddle.create({
      data: {
        title: data.title,
        encryptedPuzzle: encryptedPuzzle,
        encryptionKey: key,
        solution: data.solution,
        points: data.points,
        orderNumber: data.orderNumber,
        isActive: true,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    });
    riddles.push(riddle);
    console.log(`✅ Created: ${riddle.title} | QR Data: ${riddle.id}:${riddle.encryptionKey}`);
  }

  // Create Game Sessions and Scans for demo users
  console.log("\n🎮 Creating game progress for demo users...");

  // Alice - Completed all riddles
  const aliceSession = await prisma.gameSession.create({
    data: {
      userId: users[0].id,
      startTime: new Date(Date.now() - 3600000), // 1 hour ago
      endTime: new Date(),
      isCompleted: true,
      totalScans: 10,
      uniqueRiddles: 8,
      totalPoints: 130,
    },
  });

  for (let i = 0; i < riddles.length; i++) {
    await prisma.scan.create({
      data: {
        userId: users[0].id,
        riddleId: riddles[i].id,
        scannedAt: new Date(Date.now() - 3600000 + i * 400000),
      },
    });
  }
  console.log(`✅ ${users[0].fullName}: Completed (8/8 riddles, 130 points)`);

  // Bob - In progress (5 riddles)
  const bobSession = await prisma.gameSession.create({
    data: {
      userId: users[1].id,
      startTime: new Date(Date.now() - 2400000), // 40 mins ago
      totalScans: 7,
      uniqueRiddles: 5,
      totalPoints: 70,
    },
  });

  for (let i = 0; i < 5; i++) {
    await prisma.scan.create({
      data: {
        userId: users[1].id,
        riddleId: riddles[i].id,
        scannedAt: new Date(Date.now() - 2400000 + i * 400000),
      },
    });
  }
  console.log(`✅ ${users[1].fullName}: In Progress (5/8 riddles, 70 points)`);

  // Charlie - Completed
  const charlieSession = await prisma.gameSession.create({
    data: {
      userId: users[2].id,
      startTime: new Date(Date.now() - 4800000), // 80 mins ago
      endTime: new Date(Date.now() - 600000), // 10 mins ago
      isCompleted: true,
      totalScans: 12,
      uniqueRiddles: 8,
      totalPoints: 130,
    },
  });

  for (let i = 0; i < riddles.length; i++) {
    await prisma.scan.create({
      data: {
        userId: users[2].id,
        riddleId: riddles[i].id,
        scannedAt: new Date(Date.now() - 4800000 + i * 500000),
      },
    });
  }
  console.log(`✅ ${users[2].fullName}: Completed (8/8 riddles, 130 points)`);

  // Diana - Just started (2 riddles)
  const dianaSession = await prisma.gameSession.create({
    data: {
      userId: users[3].id,
      startTime: new Date(Date.now() - 600000), // 10 mins ago
      totalScans: 2,
      uniqueRiddles: 2,
      totalPoints: 25,
    },
  });

  for (let i = 0; i < 2; i++) {
    await prisma.scan.create({
      data: {
        userId: users[3].id,
        riddleId: riddles[i].id,
        scannedAt: new Date(Date.now() - 600000 + i * 300000),
      },
    });
  }
  console.log(`✅ ${users[3].fullName}: Started (2/8 riddles, 25 points)`);

  // Eve - No activity yet
  console.log(`✅ ${users[4].fullName}: Not started yet`);

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📝 Test Credentials:");
  console.log("   Admin: admin@college.edu / admin123");
  console.log("   Users: alice.johnson@college.edu / password123");
  console.log("          bob.smith@college.edu / password123");
  console.log("          charlie.brown@college.edu / password123");
  console.log("          diana.prince@college.edu / password123");
  console.log("          eve.wilson@college.edu / password123");
  console.log("\n🔑 QR Codes to test:");
  riddles.forEach((r) => {
    console.log(`   ${r.title}: ${r.id}:${r.encryptionKey}`);
  });
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
