// routes/fsm.js
import express from "express";
import {mainService} from "../fsm/index.js";
import {createTask, updateTask, deleteTask, getTasks, getTasksByUser} from "../db/task.js";
import {createUser, getUserByEmail} from "../db/user.js";
import pool from "../db/connection.js";
import bcrypt from "bcryptjs";
import {logger} from "../logger/index.js";

const router = express.Router();

// FSM event endpoint - all business logic flows through FSM
router.post("/event", async (req, res) => {
  logger.info("[FSM] Event received:", req.body);
  const {type, data} = req.body;

  try {
    switch (type) {
      case "SIGNUP":
        try {
          // Check if user exists
          const existingUser = await getUserByEmail(data.email);
          if (existingUser) {
            mainService.send({
              type: "SIGNUP_ERROR",
              error: "User already exists",
            });
            return res.status(400).json({
              state: mainService.state.value,
              context: mainService.state.context,
              error: "User already exists",
            });
          }

          // Hash password and create user
          const hashedPassword = await bcrypt.hash(data.password, 10);
          await createUser({
            ...data,
            password: hashedPassword,
          });

          mainService.send({
            type: "SIGNUP_SUCCESS",
            user: {
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              role: data.role,
            },
          });

          res.json({
            state: mainService.state.value,
            context: mainService.state.context,
            success: true,
          });
        } catch (error) {
          mainService.send({
            type: "SIGNUP_ERROR",
            error: error.message,
          });
          res.status(500).json({
            state: mainService.state.value,
            context: mainService.state.context,
            error: error.message,
          });
        }
        break;

      case "LOGIN":
        try {
          const user = await getUserByEmail(data.email);
          if (!user || !(await bcrypt.compare(data.password, user.password))) {
            mainService.send({
              type: "LOGIN_ERROR",
              error: "Invalid credentials",
            });
            return res.status(401).json({
              state: mainService.state.value,
              context: mainService.state.context,
              error: "Invalid credentials",
            });
          }

          // Load user's tasks
          const tasks = await getTasks();

          mainService.send({
            type: "LOGIN_SUCCESS",
            user: {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            },
          });

          mainService.send({
            type: "LOAD_TASKS",
            tasks: tasks,
          });

          res.json({
            state: mainService.state.value,
            context: mainService.state.context,
            success: true,
          });

          logger.info("Login successful, FSM state:", mainService.state.value);
          logger.info("User context:", mainService.state.context.user);
        } catch (error) {
          mainService.send({
            type: "LOGIN_ERROR",
            error: error.message,
          });
          res.status(500).json({
            state: mainService.state.value,
            context: mainService.state.context,
            error: error.message,
          });
        }
        break;

      case "SUBMIT_TASK":
        try {
          const taskId = await createTask(data.task);
          const newTask = {...data.task, id: taskId};

          mainService.send({
            type: "SUBMIT_TASK",
            task: newTask,
          });

          res.json({
            state: mainService.state.value,
            context: mainService.state.context,
            success: true,
            task: newTask,
          });
        } catch (error) {
          mainService.send({
            type: "TASK_ERROR",
            error: error.message,
          });
          res.status(500).json({
            state: mainService.state.value,
            context: mainService.state.context,
            error: error.message,
          });
        }
        break;

      case "MARK_AS_COMPLETED":
        try {
          await updateTask(data.taskId, {status: "Completed"});

          mainService.send({
            type: "MARK_AS_COMPLETED",
            taskId: data.taskId,
          });

          res.json({
            state: mainService.state.value,
            context: mainService.state.context,
            success: true,
          });
        } catch (error) {
          res.status(500).json({
            state: mainService.state.value,
            context: mainService.state.context,
            error: error.message,
          });
        }
        break;

      case "UPDATE_TASK_STATUS":
        try {
          // Find the task by title and update its status
          const [existingTasks] = await pool.query("SELECT * FROM tasks WHERE title = ?", [
            data.taskTitle,
          ]);

          if (existingTasks.length === 0) {
            throw new Error("Task not found");
          }

          const task = existingTasks[0];
          await updateTask(task.id, {
            status: data.newStatus === "inProgress" ? "In Progress" : data.newStatus,
            edited: true,
          });

          mainService.send({
            type: "UPDATE_TASK_STATUS_SUCCESS",
            taskTitle: data.taskTitle,
            newStatus: data.newStatus,
          });

          res.json({
            state: mainService.state.value,
            context: mainService.state.context,
            success: true,
            message: "Task status updated successfully",
          });
        } catch (error) {
          mainService.send({
            type: "UPDATE_TASK_STATUS_ERROR",
            error: error.message,
          });
          res.status(500).json({
            state: mainService.state.value,
            context: mainService.state.context,
            error: error.message,
          });
        }
        break;

      case "DELETE_TASK":
        try {
          await deleteTask(data.taskId);

          mainService.send({
            type: "DELETE_TASK",
            taskId: data.taskId,
          });

          res.json({
            state: mainService.state.value,
            context: mainService.state.context,
            success: true,
          });
        } catch (error) {
          res.status(500).json({
            state: mainService.state.value,
            context: mainService.state.context,
            error: error.message,
          });
        }
        break;

      // Navigation events
      case "ASSIGN_TASK":
      case "VIEW_ALL_TASKS":
      case "VIEW_PENDING":
      case "VIEW_COMPLETED":
      case "PROFILE":
      case "LOGOUT":
      case "GO_BACK":
      case "CANCEL":
      case "GO_TO_LOGIN":
      case "GO_TO_SIGNUP":
        mainService.send({type});
        res.json({
          state: mainService.state.value,
          context: mainService.state.context,
        });
        break;

      default:
        res.status(400).json({
          error: "Unknown event type",
          state: mainService.state.value,
          context: mainService.state.context,
        });
    }
  } catch (err) {
    console.error("[FSM] Error handling event:", err);
    res.status(500).json({
      error: "FSM error",
      message: err.message,
      state: mainService.state.value,
      context: mainService.state.context,
    });
  }
});

// FSM state endpoint - returns current state and context
router.get("/state", async (req, res) => {
  try {
    if (req.query.entity === "users") {
      // Fetch all users for assignment
      const [users] = await pool.query("SELECT email, firstName, lastName, role FROM users");

      mainService.send({
        type: "LOAD_USERS",
        users: users,
      });

      return res.json({
        state: mainService.state.value,
        context: mainService.state.context,
        users: users,
      });
    }

    // Refresh tasks from database
    const tasks = await getTasks();
    mainService.send({
      type: "LOAD_TASKS",
      tasks: tasks,
    });

    res.json({
      state: mainService.state.value,
      context: mainService.state.context,
    });
  } catch (err) {
    console.error("[FSM] Error fetching state:", err);
    res.status(500).json({
      error: "FSM state error",
      state: mainService.state.value,
      context: mainService.state.context,
    });
  }
});

export default router;
