<template>
  <div class="p-6">
    <h2 class="text-xl font-semibold mb-4">🙋 My Tasks</h2>
    <table v-if="tasks.length > 0" class="task-table">
      <thead>
        <tr>
          <th>Task Title</th>
          <th>Description</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Date & Time</th>
          <th>Due Date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(task, index) in tasks" :key="index">
          <td>{{ task.title }}</td>
          <td>{{ task.description }}</td>
          <td>{{ task.priority }}</td>
          <td>{{ task.status }}</td>
          <td>{{ new Date(task.createdAt).toLocaleString() }}</td>
          <td>{{ task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-" }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else class="text-gray-400">No tasks found.</p>
  </div>
</template>

<script setup>
import {ref, onMounted} from "vue";

const tasks = ref([]);
const user = JSON.parse(sessionStorage.getItem("loggedInUser") || "null");

async function fetchMyTasks() {
  if (!user) return;
  try {
    const res = await fetch("/fsm/state");
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const data = await res.json();

    // Extract tasks from response (could be in data.context.tasks)
    const allTasks = data.context?.tasks || data.tasks || [];
    tasks.value = allTasks.filter((task) => task.assignedTo === user.email);
    console.log("[MyTasks] Loaded my tasks:", tasks.value);
  } catch (error) {
    console.error("[MyTasks] Error fetching tasks:", error);
    tasks.value = [];
  }
}

onMounted(fetchMyTasks);
</script>

<style scoped>
.task-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  border-radius: 8px;
  overflow: hidden;
}
.task-table th,
.task-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}
.task-table th {
  background: #0a1732;
  color: #fff;
  font-weight: 600;
}
.task-table tr:last-child td {
  border-bottom: none;
}
.task-table tbody tr:hover {
  background: #f0f4f8;
}
</style>
