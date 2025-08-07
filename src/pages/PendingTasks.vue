<script setup>
import {ref, computed, onMounted, getCurrentInstance, onUnmounted} from "vue";

const tasks = ref([]);
const loading = ref(true);
const priorityFilter = ref("");
const searchQuery = ref("");
const updatingTask = ref(null);
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

const user = JSON.parse(sessionStorage.getItem("loggedInUser") || "null");
const {proxy} = getCurrentInstance();
const fsm = proxy.$fsm;
let stateSubscription;

// Computed properties
const filteredTasks = computed(() => {
  let filtered = tasks.value;

  if (priorityFilter.value) {
    filtered = filtered.filter(
      (task) => (task.priority || "medium").toLowerCase() === priorityFilter.value
    );
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        (task.assignedTo && task.assignedTo.toLowerCase().includes(query))
    );
  }

  return filtered;
});

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return "No due date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
};

const isDueToday = (dueDate) => {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() === today.getTime();
};

const getPriorityIcon = (priority) => {
  switch ((priority || "medium").toLowerCase()) {
    case "high":
      return "🔴";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    default:
      return "🟡";
  }
};

const getPriorityColor = (priority) => {
  switch ((priority || "medium").toLowerCase()) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "success";
    default:
      return "warning";
  }
};

const showToastMessage = (message, type = "success") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

const markTaskAsCompleted = async (taskId) => {
  try {
    updatingTask.value = taskId;

    const res = await fetch("http://localhost:4000/fsm/event", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        type: "MARK_AS_COMPLETED",
        data: {taskId: taskId},
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to complete task");

    // Send event to client-side FSM
    fsm.send("MARK_AS_COMPLETED", {taskId: taskId});

    // Add small delay to ensure backend state is updated
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Refresh the task list
    await fetchTasks();

    showToastMessage("🎉 Task marked as completed successfully!");
  } catch (error) {
    console.error("Error marking task as completed:", error);
    showToastMessage("❌ Error completing task: " + error.message, "error");
  } finally {
    updatingTask.value = null;
  }
};

async function fetchTasks() {
  try {
    loading.value = true;
    const res = await fetch("http://localhost:4000/fsm/state");
    const data = await res.json();
    let allTasks = (data.context?.tasks || data.tasks || []).filter(
      (task) => task.status === "Pending"
    );
    if (user && user.role === "teamMember") {
      allTasks = allTasks.filter((task) => task.assignedTo === user.email);
    }
    tasks.value = allTasks;
  } catch (error) {
    console.error("Error fetching pending tasks:", error);
    tasks.value = [];
    showToastMessage("Failed to load pending tasks. Please refresh the page.", "error");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchTasks();

  // Subscribe to state changes
  stateSubscription = fsm.onTransition((state) => {
    if (state.matches("pendingTasks")) {
      fetchTasks();
    }
  });
});

onUnmounted(() => {
  if (stateSubscription && typeof stateSubscription === "function") {
    stateSubscription();
  }
});
</script>

<template>
  <div class="pending-tasks-container">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">🕒 Pending Tasks</h1>
      <p class="page-subtitle">Tasks waiting to be started</p>
    </div>

    <div class="filter-section">
      <div class="filter-controls">
        <select v-model="priorityFilter" class="form-select">
          <option value="">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search pending tasks..."
          class="form-control" />
      </div>
    </div>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading pending tasks...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTasks.length === 0" class="empty-state">
      <div class="text-center py-5">
        <div class="empty-icon">📋</div>
        <h5 class="mt-3">No pending tasks</h5>
        <p class="text-muted">All tasks are either completed or in progress!</p>
      </div>
    </div>

    <!-- Tasks Table -->
    <div v-else class="tasks-section">
      <div class="table-container">
        <table class="table table-hover" style="width: 100%">
          <thead>
            <tr>
              <th>Task</th>
              <th>Priority</th>
              <th>Assigned To</th>
              <th>Due Date</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in filteredTasks" :key="task.id">
              <td>
                <div class="task-info">
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-description">{{ task.description }}</div>
                </div>
              </td>
              <td>
                <span :class="`badge badge-${getPriorityColor(task.priority || 'medium')}`">
                  {{ getPriorityIcon(task.priority || "medium") }}
                  {{ (task.priority || "medium").toUpperCase() }}
                </span>
              </td>
              <td>
                <span class="text-muted">{{ task.assignedTo || "Unassigned" }}</span>
              </td>
              <td>
                <span
                  :class="{
                    'text-danger': isOverdue(task.dueDate),
                    'text-warning': isDueToday(task.dueDate),
                    'text-muted': !isOverdue(task.dueDate) && !isDueToday(task.dueDate),
                  }">
                  {{ formatDate(task.dueDate) }}
                </span>
              </td>
              <td>
                <span class="text-muted">{{ formatDate(task.createdAt) }}</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button
                    @click="markTaskAsCompleted(task.id)"
                    class="btn btn-sm btn-outline-success"
                    :disabled="updatingTask === task.id">
                    <span v-if="updatingTask === task.id">⏳</span>
                    <span v-else>✅ Mark Complete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" :class="['toast', toastType]">
      {{ toastMessage }}
    </div>
  </div>
</template>

<style scoped>
.pending-tasks-container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 2rem;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #0a1732 0%, #1a2744 100%);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  margin: 0;
}

/* Stats Section */
.stats-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-card {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid #e2e8f0;
  transition: transform 0.2s ease;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.stat-number {
  font-size: 1.875rem;
  font-weight: 700;
  color: #2d3748;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
}

/* Filter Section */
.filter-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-control {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

/* Tasks Section */
.tasks-section {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-container {
  overflow-x: auto;
}

.table {
  margin: 0;
  border-collapse: separate;
  border-spacing: 0;
}

.table thead th {
  background: linear-gradient(135deg, #0a1732 0%, #1a2744 100%);
  color: white;
  font-weight: 600;
  padding: 1rem;
  border: none;
  position: sticky;
  top: 0;
  z-index: 10;
}

.table thead th:first-child {
  border-top-left-radius: 12px;
}

.table thead th:last-child {
  border-top-right-radius: 12px;
}

.table tbody td {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: middle;
}

.table tbody tr:hover {
  background-color: #f7fafc;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

/* Task Info */
.task-info {
  max-width: 300px;
}

.task-title {
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.task-description {
  color: #718096;
  font-size: 0.75rem;
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Badge Styles */
.badge {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.badge-danger {
  background-color: #fed7d7;
  color: #c53030;
}

.badge-warning {
  background-color: #fef5e7;
  color: #d69e2e;
}

.badge-success {
  background-color: #c6f6d5;
  color: #38a169;
}

/* Button Styles */
.btn {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline-primary {
  border-color: #3182ce;
  color: #3182ce;
  background: transparent;
}

.btn-outline-primary:hover:not(:disabled) {
  background-color: #3182ce;
  color: white;
}

.btn-outline-success {
  border-color: #38a169;
  color: #38a169;
  background: transparent;
}

.btn-outline-success:hover:not(:disabled) {
  background-color: #38a169;
  color: white;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.me-1 {
  margin-right: 0.25rem;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  flex-wrap: wrap;
}

/* Empty State */
.empty-state {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.6;
  margin-bottom: 1rem;
}

.empty-state h5 {
  color: #2d3748;
  font-weight: 600;
}

.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.filter-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}

.form-select,
.form-control {
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-select:focus,
.form-control:focus {
  outline: none;
  border-color: #1a2744;
  box-shadow: 0 0 0 3px rgba(26, 39, 68, 0.1);
}

.form-control {
  min-width: 250px;
}

/* Toast Styles */
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1100;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.toast.success {
  background-color: #10b981;
}

.toast.error {
  background-color: #ef4444;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Loading States */
.text-center {
  text-align: center;
}

.py-5 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

.mt-3 {
  margin-top: 1rem;
}

.text-muted {
  color: #718096;
}

.text-danger {
  color: #e53e3e;
}

.text-warning {
  color: #d69e2e;
}

.spinner-border {
  width: 2rem;
  height: 2rem;
  border: 0.25em solid;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

.text-primary {
  color: #3182ce;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Bootstrap Grid Classes */
.row {
  display: flex;
  flex-wrap: wrap;
  margin-right: -0.75rem;
  margin-left: -0.75rem;
}

.col-md-3,
.col-md-6,
.col-sm-6 {
  position: relative;
  width: 100%;
  padding-right: 0.75rem;
  padding-left: 0.75rem;
}

.mb-3 {
  margin-bottom: 1rem;
}

.align-items-center {
  align-items: center;
}

/* Responsive Design */
@media (min-width: 576px) {
  .col-sm-6 {
    flex: 0 0 50%;
    max-width: 50%;
  }
}

@media (min-width: 768px) {
  .col-md-3 {
    flex: 0 0 25%;
    max-width: 25%;
  }

  .col-md-6 {
    flex: 0 0 50%;
    max-width: 50%;
  }
}

@media (max-width: 768px) {
  .pending-tasks-container {
    padding: 1rem;
  }

  .page-header {
    padding: 1.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .table thead th,
  .table tbody td {
    padding: 0.75rem 0.5rem;
  }

  .task-info {
    max-width: 200px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }
}

@media (max-width: 576px) {
  .table-container {
    font-size: 0.875rem;
  }

  .btn-sm {
    font-size: 0.625rem;
    padding: 0.25rem 0.375rem;
  }

  .task-title {
    font-size: 0.8rem;
  }

  .task-description {
    font-size: 0.7rem;
  }
}
</style>
