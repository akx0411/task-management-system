#!/usr/bin/env node

import pool from "./connection.js";
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample data arrays
const firstNames = [
  "John",
  "Jane",
  "Michael",
  "Sarah",
  "David",
  "Emily",
  "Robert",
  "Jessica",
  "William",
  "Ashley",
  "James",
  "Amanda",
  "Christopher",
  "Stephanie",
  "Daniel",
  "Melissa",
  "Matthew",
  "Nicole",
  "Anthony",
  "Elizabeth",
  "Mark",
  "Helen",
  "Donald",
  "Deborah",
  "Steven",
  "Rachel",
  "Paul",
  "Carolyn",
  "Andrew",
  "Janet",
  "Joshua",
  "Catherine",
  "Kenneth",
  "Maria",
  "Kevin",
  "Heather",
  "Brian",
  "Diane",
  "George",
  "Ruth",
  "Timothy",
  "Julie",
  "Ronald",
  "Joyce",
  "Jason",
  "Virginia",
  "Edward",
  "Victoria",
  "Jeffrey",
  "Kelly",
  "Ryan",
  "Christina",
  "Jacob",
  "Joan",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
  "Green",
  "Adams",
  "Nelson",
  "Baker",
  "Hall",
  "Rivera",
  "Campbell",
  "Mitchell",
  "Carter",
  "Roberts",
  "Gomez",
  "Phillips",
  "Evans",
  "Turner",
  "Diaz",
  "Parker",
];

const taskTitles = [
  "Implement user authentication system",
  "Design responsive dashboard layout",
  "Create API documentation",
  "Set up continuous integration pipeline",
  "Optimize database queries",
  "Develop mobile application interface",
  "Write unit tests for core modules",
  "Configure server monitoring",
  "Update project dependencies",
  "Implement search functionality",
  "Create user onboarding flow",
  "Design email notification system",
  "Develop reporting dashboard",
  "Set up backup procedures",
  "Implement data validation",
  "Create admin panel interface",
  "Optimize frontend performance",
  "Develop REST API endpoints",
  "Configure security headers",
  "Implement file upload feature",
  "Create automated testing suite",
  "Design user profile management",
  "Develop chat functionality",
  "Set up error logging system",
  "Implement caching mechanism",
  "Create data export feature",
  "Design responsive navigation menu",
  "Develop notification system",
  "Set up development environment",
  "Implement role-based permissions",
  "Create integration tests",
  "Design landing page",
  "Develop analytics tracking",
  "Set up SSL certificates",
  "Implement password reset flow",
  "Create help documentation",
  "Design form validation",
  "Develop image processing",
  "Set up deployment scripts",
  "Implement audit logging",
];

const taskDescriptions = [
  "Create a comprehensive authentication system with login, registration, and password reset functionality.",
  "Design and implement a responsive dashboard that works across all devices and screen sizes.",
  "Write detailed API documentation including endpoints, parameters, and response examples.",
  "Set up automated CI/CD pipeline for testing and deployment processes.",
  "Analyze and optimize slow database queries to improve application performance.",
  "Develop a mobile-friendly interface that provides excellent user experience on smartphones.",
  "Write comprehensive unit tests to ensure code quality and prevent regression bugs.",
  "Configure monitoring tools to track server performance and uptime metrics.",
  "Update all project dependencies to latest stable versions for security and features.",
  "Implement robust search functionality with filters and advanced query capabilities.",
  "Create an intuitive onboarding process to help new users get started quickly.",
  "Design and implement email notification system for important user actions.",
  "Develop comprehensive reporting dashboard with charts and data visualization.",
  "Set up automated backup procedures to ensure data safety and recovery options.",
  "Implement client and server-side validation to ensure data integrity.",
  "Create administrative interface for managing users, content, and system settings.",
  "Optimize frontend code for faster loading times and better user experience.",
  "Develop RESTful API endpoints following best practices and conventions.",
  "Configure security headers and implement security best practices.",
  "Implement secure file upload feature with validation and virus scanning.",
  "Create automated testing suite to ensure application reliability.",
  "Design user-friendly profile management interface with customization options.",
  "Develop real-time chat functionality for improved team communication.",
  "Set up comprehensive error logging and monitoring system.",
  "Implement intelligent caching mechanism to improve application performance.",
  "Create data export functionality in multiple formats (CSV, PDF, Excel).",
  "Design responsive navigation menu that works seamlessly across devices.",
  "Develop comprehensive notification system for various user actions.",
  "Set up standardized development environment for consistent team workflow.",
  "Implement granular role-based permission system for enhanced security.",
];

const priorities = ["Low", "Medium", "High"];
const statuses = ["Pending", "In Progress", "Completed"];

// Utility functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateEmail(firstName, lastName) {
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "company.com", "tech.org"];
  const domain = getRandomElement(domains);
  const variations = [
    `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}_${lastName.toLowerCase()}@${domain}`,
    `${firstName.substring(0, 1).toLowerCase()}${lastName.toLowerCase()}@${domain}`,
    `${firstName.toLowerCase()}${Math.floor(Math.random() * 100)}@${domain}`,
  ];
  return getRandomElement(variations);
}

function generatePassword() {
  // Simple password generation for demo purposes
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Generate sample users
async function generateUsers(count = 20) {
  const users = [];

  // Add your custom team lead first
  users.push({
    email: "admin@gmail.com",
    password: await bcrypt.hash("admin123", 10),
    firstName: "Admin",
    lastName: "User",
    role: "teamLead",
    profilePic: "/src/assets/user-icon.png",
  });

   users.push({
    email: "member@gmail.com",
    password: await bcrypt.hash("admin123", 10),
    firstName: "Admin",
    lastName: "User",
    role: "teamMember",
    profilePic: "/src/assets/user-icon.png",
  });

  const teamLeadCount = Math.ceil(count * 0.2); // 20% team leads

  for (let i = 0; i < count; i++) {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const email = generateEmail(firstName, lastName);
    const role = i < teamLeadCount ? "teamLead" : "teamMember";
    const plainPassword = generatePassword();

    users.push({
      email,
      password: await bcrypt.hash(plainPassword, 10),
      plainPassword, // Keep plain password for display purposes
      firstName,
      lastName,
      role,
      profilePic: "/src/assets/user-icon.png",
    });
  }

  return users;
}

// Generate sample tasks
function generateTasks(users, count = 50) {
  const tasks = [];
  const teamMembers = users.filter((user) => user.role === "teamMember");

  for (let i = 0; i < count; i++) {
    const title = getRandomElement(taskTitles);
    const description = getRandomElement(taskDescriptions);
    const priority = getRandomElement(priorities);
    const status = getRandomElement(statuses);
    const assignedTo = getRandomElement(teamMembers).email;

    // Generate random due date (between now and 3 months from now)
    const now = new Date();
    const future = new Date();
    future.setMonth(future.getMonth() + 3);
    const dueDate = getRandomDate(now, future);

    // Generate random creation date (between 1 month ago and now)
    const past = new Date();
    past.setMonth(past.getMonth() - 1);
    const createdAt = getRandomDate(past, now).getTime();

    tasks.push({
      title: `${title} #${i + 1}`,
      description,
      priority,
      status,
      assignedTo,
      dueDate: dueDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
      createdAt,
      edited: Math.random() > 0.8, // 20% chance task was edited
    });
  }

  return tasks;
}

// Database operations
async function createTables() {
  try {
    console.log("📄 Creating database tables...");
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split and execute each CREATE TABLE statement
    const statements = schema.split(";").filter((stmt) => stmt.trim().length > 0);

    for (const statement of statements) {
      await pool.execute(statement);
    }

    console.log("✅ Database tables created successfully");
  } catch (error) {
    console.error("❌ Error creating tables:", error.message);
    throw error;
  }
}

async function clearExistingData() {
  try {
    console.log("🧹 Clearing existing data...");
    await pool.execute("DELETE FROM tasks");
    await pool.execute("DELETE FROM users");
    await pool.execute("ALTER TABLE users AUTO_INCREMENT = 1");
    await pool.execute("ALTER TABLE tasks AUTO_INCREMENT = 1");
    console.log("✅ Existing data cleared");
  } catch (error) {
    console.error("❌ Error clearing data:", error.message);
    throw error;
  }
}

async function insertUsers(users) {
  try {
    console.log(`👥 Inserting ${users.length} users...`);

    const insertQuery = `
      INSERT INTO users (email, password, firstName, lastName, role, profilePic) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const user of users) {
      await pool.execute(insertQuery, [
        user.email,
        user.password,
        user.firstName,
        user.lastName,
        user.role,
        user.profilePic,
      ]);
    }

    console.log("✅ Users inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting users:", error.message);
    throw error;
  }
}

async function insertTasks(tasks) {
  try {
    console.log(`📋 Inserting ${tasks.length} tasks...`);

    const insertQuery = `
      INSERT INTO tasks (title, description, priority, status, assignedTo, dueDate, createdAt, edited) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const task of tasks) {
      await pool.execute(insertQuery, [
        task.title,
        task.description,
        task.priority,
        task.status,
        task.assignedTo,
        task.dueDate,
        task.createdAt,
        task.edited,
      ]);
    }

    console.log("✅ Tasks inserted successfully");
  } catch (error) {
    console.error("❌ Error inserting tasks:", error.message);
    throw error;
  }
}

async function displaySummary(users) {
  try {
    console.log("\n📊 Database Summary:");
    console.log("==================");

    const [userCounts] = await pool.execute(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    userCounts.forEach((row) => {
      console.log(`${row.role === "teamLead" ? "👑" : "👨‍💻"} ${row.role}: ${row.count} users`);
    });

    const [taskCounts] = await pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `);

    console.log("\n📋 Tasks by Status:");
    taskCounts.forEach((row) => {
      const icon = row.status === "Completed" ? "✅" : row.status === "In Progress" ? "🔄" : "⏳";
      console.log(`${icon} ${row.status}: ${row.count} tasks`);
    });

    const [priorityCounts] = await pool.execute(`
      SELECT priority, COUNT(*) as count 
      FROM tasks 
      GROUP BY priority
    `);

    console.log("\n⚡ Tasks by Priority:");
    priorityCounts.forEach((row) => {
      const icon = row.priority === "High" ? "🔴" : row.priority === "Medium" ? "🟡" : "🟢";
      console.log(`${icon} ${row.priority}: ${row.count} tasks`);
    });

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n🔑 Login Credentials:");
    console.log("=====================");

    // Show your admin user first
    console.log("🎯 YOUR ADMIN ACCOUNT:");
    console.log("👑 Admin User (teamLead)");
    console.log("   Email: admin@company.com");
    console.log("   Password: admin123");
    console.log("   ⭐ Easy to remember for testing!\n");

    console.log("📋 Other Sample Users:");

    // Show some other sample users with their plain passwords
    const otherUsers = users.filter((user) => user.email !== "admin@company.com").slice(0, 4);

    otherUsers.forEach((user) => {
      console.log(
        `${user.role === "teamLead" ? "👑" : "👨‍💻"} ${user.firstName} ${user.lastName} (${
          user.role
        })`
      );
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.plainPassword}\n`);
    });
  } catch (error) {
    console.error("❌ Error displaying summary:", error.message);
  }
}

// Main seeding function
async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding process...\n");

    // Create tables
    await createTables();

    // Clear existing data
    await clearExistingData();

    // Generate sample data
    console.log("🎲 Generating sample data...");
    const users = await generateUsers(25); // Generate 25 users (5 team leads, 20 team members)
    const tasks = generateTasks(users, 60); // Generate 60 tasks

    // Insert data
    await insertUsers(users);
    await insertTasks(tasks);

    // Display summary
    await displaySummary(users);
  } catch (error) {
    console.error("💥 Seeding failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const help = args.includes("--help") || args.includes("-h");

if (help) {
  console.log(`
🌱 Database Seeding Tool
========================

Usage: node db/seed.js [options]

Options:
  --help, -h     Show this help message

This script will:
1. Create database tables (if they don't exist)
2. Clear existing data
3. Generate and insert sample users and tasks
4. Display a summary of the seeded data

Environment Variables:
  DB_HOST        Database host (default: localhost)
  DB_USER        Database user (default: root)
  DB_PASS        Database password (default: pass123)
  DB_NAME        Database name (default: task_management)

Example:
  node db/seed.js
  DB_NAME=my_db node db/seed.js
`);
  process.exit(0);
}

// Run the seeding process
seedDatabase();
