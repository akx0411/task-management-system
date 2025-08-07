import express from "express";
import {mainService} from "../fsm/index.js";
import {createUser, getUserByEmail} from "../db/user.js";
import bcrypt from "bcryptjs";
import pool from "../db/connection.js";

const router = express.Router();

// Update user profile endpoint
router.put("/profile", async (req, res) => {
  const {email, username, firstName, lastName, profilePic} = req.body;
  if (!email) return res.status(400).json({error: "Missing email"});

  try {
    await pool.query(
      "UPDATE users SET firstName = ?, lastName = ?, profilePic = ? WHERE email = ?",
      [username || firstName, lastName, profilePic, email]
    );

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    // Update FSM context
    mainService.send({
      type: "SAVE_PROFILE",
      profileData: {
        firstName: user.firstName,
        lastName: user.lastName,
        profilePic: user.profilePic,
      },
    });

    res.json({
      user,
      state: mainService.state.value,
      context: mainService.state.context,
    });
  } catch (err) {
    console.error("[AUTH] Profile update error:", err);
    res.status(500).json({error: "Profile update failed"});
  }
});

// Fetch user profile by email
router.get("/profile", async (req, res) => {
  const {email} = req.query;
  if (!email) return res.status(400).json({error: "Missing email"});

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    res.json({user});
  } catch (err) {
    console.error("[AUTH] Profile fetch error:", err);
    res.status(500).json({error: "Profile fetch failed"});
  }
});

// Signup endpoint - redirects to FSM
router.post("/signup", async (req, res) => {
  console.log("[AUTH] Signup request:", req.body);
  const {email, password, firstName, lastName, role} = req.body;

  if (!email || !password || !role) {
    console.error("[AUTH] Signup error: Missing fields");
    return res.status(400).json({error: "Missing fields"});
  }

  try {
    // Check if user exists
    const existingUser = await getUserByEmail(email);
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
    const hashedPassword = await bcrypt.hash(password, 10);
    await createUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    });

    mainService.send({
      type: "SIGNUP_SUCCESS",
      user: {
        email,
        firstName,
        lastName,
        role,
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
});

// Login endpoint - redirects to FSM
router.post("/login", async (req, res) => {
  console.log("[AUTH] Login request:", req.body);
  const {email, password} = req.body;

  try {
    const user = await getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
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

    mainService.send({
      type: "LOGIN_SUCCESS",
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });

    res.json({
      state: mainService.state.value,
      context: mainService.state.context,
      success: true,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
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
});

export default router;
