````markdown
# Task Management System

A modern task management application built with Vue 3, Node.js, Express, and MySQL. Features role-based access control, real-time state management with FSM, and a clean, professional UI.

## 🚀 Features

- **User Authentication**: Secure login/signup with bcrypt password hashing
- **Role-Based Access**: Team Lead and Team Member roles with different permissions
- **Task Management**: Create, assign, update, and track tasks
- **Real-time Updates**: FSM (Finite State Machine) for state synchronization
- **Professional UI**: Clean, responsive design with consistent styling
- **Team Management**: Manage team members and view statistics
- **Profile Settings**: User profile management with avatar support

## 🛠️ Tech Stack

- **Frontend**: Vue 3, Vue Router, Vite
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **State Management**: Custom FSM implementation
- **Authentication**: bcrypt for password hashing
- **Styling**: Custom CSS with responsive design

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **MySQL** (v8.0 or higher)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd task-management
```
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

#### Create MySQL Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database (in MySQL prompt)
CREATE DATABASE task_management;
USE task_management;
EXIT;
```

#### Alternative: One-liner command

```bash
mysql -u root -p -e "CREATE DATABASE task_management;"
```

### 4. Environment Configuration

The application uses these default database settings:

- **Host**: localhost
- **User**: root
- **Password**: pass123
- **Database**: task_management
- **Port**: 3306

If you need different settings, create a `.env` file:

```bash
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=task_management
DB_PORT=3306
```

### 5. Seed the Database

Populate the database with sample data:

```bash
npm run seed
```

This will:

- Create all necessary tables (users, tasks)
- Insert 25 sample users (5 team leads, 20 team members)
- Insert 60 sample tasks with realistic data
- Create your admin account

### 6. Start the Application

#### Start Backend Server

```bash
node server.js
```

The backend will run on `http://localhost:4000`

#### Start Frontend Development Server

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔑 Default Login Credentials

After seeding, you can login with:

**Admin Account (Team Lead):**

- Email: `admin@gmail.com`
- Password: `admin123`

**Sample Users:**
The seed script will generate additional users with random credentials. Check the console output after running `npm run seed` for sample login credentials.

## 📚 Available Scripts

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `npm install`       | Install all dependencies          |
| `npm run dev`       | Start frontend development server |
| `npm run start`     | Start backend server              |
| `npm run build`     | Build frontend for production     |
| `npm run seed`      | Seed database with sample data    |
| `npm run seed:help` | Show seeding help information     |

## 🗄️ Database Management

### View All Databases

```bash
mysql -u root -p -e "SHOW DATABASES;"
```

### Delete Database (⚠️ Warning: Permanent!)

```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS task_management;"
```

### Reset Database (Complete Fresh Start)

```bash
# Delete existing database
mysql -u root -p -e "DROP DATABASE IF EXISTS task_management;"

# Create fresh database
mysql -u root -p -e "CREATE DATABASE task_management;"

# Seed with fresh data
npm run seed
```

### View Database Tables

```bash
mysql -u root -p task_management -e "SHOW TABLES;"
```

## 🎯 User Roles & Permissions

### Team Lead

- View all tasks dashboard
- Create and assign tasks
- Manage team members
- Edit/delete any task
- View team statistics

### Team Member

- View assigned tasks
- Update task status (Pending → In Progress → Completed)
- View personal task statistics
- Update profile settings

## 🔧 Development Workflow

1. **Start both servers:**

   ```bash
   # Terminal 1: Backend
   npm run start

   # Terminal 2: Frontend
   npm run dev
   ```

2. **Make changes to code** - Hot reload is enabled for development

3. **Test with sample data** - Use the seeded users and tasks

4. **Reset database when needed:**
   ```bash
   npm run seed
   ```

## 📁 Project Structure

```
task-management/
├── src/                    # Frontend Vue.js application
│   ├── components/         # Reusable Vue components
│   ├── pages/             # Page components (routes)
│   ├── fsm/               # Finite State Machine
│   └── assets/            # Static assets
├── routes/                # Backend API routes
├── db/                    # Database configuration and seed files
├── server.js              # Express server entry point
└── package.json           # Dependencies and scripts
```

## 🐛 Troubleshooting

### Database Connection Issues

1. Ensure MySQL is running: `sudo systemctl status mysql`
2. Check credentials in database configuration
3. Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Port Already in Use

- Backend (4000): `lsof -ti:4000 | xargs kill -9`
- Frontend (5173): `lsof -ti:5173 | xargs kill -9`

### Reset Everything

```bash
# Stop all processes
npm run stop  # if available, or manually kill processes

# Reset database
mysql -u root -p -e "DROP DATABASE IF EXISTS task_management; CREATE DATABASE task_management;"

# Reinstall and seed
npm install
npm run seed
```

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Clean Interface**: Professional, minimal design
- **Consistent Styling**: Unified color scheme and component design
- **User Feedback**: Toast notifications for actions
- **Loading States**: Visual feedback during data operations
- **Form Validation**: Client-side validation with helpful error messages

## 🔄 State Management

The application uses a custom FSM (Finite State Machine) for:

- User authentication state
- Task state management
- Real-time synchronization between frontend and backend
- Consistent data flow throughout the application

## 📈 Getting Started Tips

1. **Login as admin** (`admin@company.com` / `admin123`) to explore team lead features
2. **Try different user roles** by logging in as team members
3. **Test task workflow**: Create → Assign → Start → Complete
4. **Explore team management** features in the admin dashboard
5. **Check profile settings** to see user statistics and customization options

---

For questions or issues, please check the troubleshooting section above or refer to the project documentation.

```

```
