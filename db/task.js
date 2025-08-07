// db/task.js
import pool from "./connection.js";

export async function createTask(task) {
  const {title, description, priority, status, assignedTo, dueDate, createdAt, edited} = task;
  const [result] = await pool.query(
    "INSERT INTO tasks (title, description, priority, status, assignedTo, dueDate, createdAt, edited) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [title, description, priority, status, assignedTo, dueDate, createdAt, edited]
  );
  return result.insertId;
}

export async function updateTask(id, updates) {
  const fields = Object.keys(updates)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = Object.values(updates);
  values.push(id);
  await pool.query(`UPDATE tasks SET ${fields} WHERE id = ?`, values);
}

export async function deleteTask(id) {
  await pool.query("DELETE FROM tasks WHERE id = ?", [id]);
}

export async function getTasks() {
  const [rows] = await pool.query("SELECT * FROM tasks");
  return rows;
}

export async function getTasksByUser(email) {
  const [rows] = await pool.query("SELECT * FROM tasks WHERE assignedTo = ?", [email]);
  return rows;
}
