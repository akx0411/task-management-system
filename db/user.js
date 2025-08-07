// db/user.js
import pool from "./connection.js";

export async function createUser(user) {
  const {email, password, firstName, lastName, role} = user;
  const [result] = await pool.query(
    "INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)",
    [email, password, firstName, lastName, role]
  );
  return result.insertId;
}

export async function getUserByEmail(email) {
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
}
