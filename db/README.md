# Database Seeding Guide

This guide explains how to populate your task management database with sample data for testing and development purposes.

## 🌱 What the Seed File Does

The `db/seed.js` script will:

1. **Create database tables** (if they don't exist) using the schema from `db/schema.sql`
2. **Clear existing data** from users and tasks tables
3. **Generate realistic sample data**:
   - 25 users (5 team leads, 20 team members)
   - 60 tasks with various priorities, statuses, and assignments
4. **Display a summary** with sample login credentials

## 🚀 How to Run

### Option 1: Using npm script (Recommended)

```bash
npm run seed
```

### Option 2: Direct node execution

```bash
node db/seed.js
```

### Option 3: With custom database settings

```bash
DB_NAME=my_custom_db DB_USER=myuser DB_PASS=mypass npm run seed
```

## 📋 Help Command

```bash
npm run seed:help
```

## 🔧 Configuration

The seed script uses the same database configuration as your application:

| Environment Variable | Default Value   | Description       |
| -------------------- | --------------- | ----------------- |
| `DB_HOST`            | localhost       | Database host     |
| `DB_USER`            | root            | Database username |
| `DB_PASS`            | pass123         | Database password |
| `DB_NAME`            | task_management | Database name     |

## 📊 Generated Data

### Users

- **Team Leads (5)**: Can create and manage tasks
- **Team Members (20)**: Can be assigned tasks
- **Realistic names**: Combination of common first/last names
- **Diverse email formats**: Various email patterns and domains
- **Random passwords**: 8-character alphanumeric passwords

### Tasks

- **60 diverse tasks**: Realistic software development tasks
- **Priorities**: Low, Medium, High (distributed randomly)
- **Statuses**: Pending, In Progress, Completed
- **Due dates**: Between now and 3 months in the future
- **Creation dates**: Between 1 month ago and now
- **Assignments**: Tasks randomly assigned to team members

## 📝 Sample Data Examples

### Sample Users

```
👑 John Smith (teamLead)
   Email: john.smith@company.com
   Password: Abc123XY

👨‍💻 Jane Doe (teamMember)
   Email: jane.doe@gmail.com
   Password: Pass789Z
```

### Sample Tasks

```
📋 Implement user authentication system #1
   Priority: High
   Status: In Progress
   Assigned to: jane.doe@gmail.com

📋 Design responsive dashboard layout #2
   Priority: Medium
   Status: Pending
   Assigned to: michael.brown@tech.org
```

## 🔄 Re-running the Seed

**⚠️ Warning**: Running the seed script will **completely clear** all existing users and tasks from your database. Make sure to backup any important data before running.

The script can be run multiple times safely - it will always:

1. Clear existing data
2. Reset auto-increment counters
3. Generate fresh sample data

## 🛠️ Troubleshooting

### Common Issues

1. **Database connection error**

   ```
   Solution: Check your database credentials and ensure MySQL is running
   ```

2. **Permission denied**

   ```bash
   chmod +x db/seed.js
   ```

3. **Missing database**

   ```sql
   CREATE DATABASE task_management;
   ```

4. **Table already exists errors**
   ```
   The script handles this automatically - existing tables will be used
   ```

## 🧪 Testing Your Application

After seeding, you can:

1. **Login with sample credentials** (displayed after seeding)
2. **Test team lead features**:
   - Create new tasks
   - Assign tasks to team members
   - View all tasks dashboard
3. **Test team member features**:
   - View assigned tasks
   - Update task status
   - View personal task statistics

## 📈 Database Summary

After successful seeding, you'll see output like:

```
📊 Database Summary:
==================
👑 teamLead: 5 users
👨‍💻 teamMember: 20 users

📋 Tasks by Status:
✅ Completed: 18 tasks
🔄 In Progress: 22 tasks
⏳ Pending: 20 tasks

⚡ Tasks by Priority:
🔴 High: 21 tasks
🟡 Medium: 19 tasks
🟢 Low: 20 tasks
```

## 🔐 Security Note

The generated passwords are simple and for **development/testing only**. In production:

- Use proper password hashing (bcrypt)
- Enforce strong password policies
- Implement proper authentication flows

---

**Happy Testing!** 🎉
