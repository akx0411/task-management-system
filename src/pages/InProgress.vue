<template>
  <div class="in-progress-container">
    <!-- Header -->
    <div class="page-header">
      <h1>In Progress Tasks</h1>
      <p>Track and manage your active tasks</p>
    </div>

    <!-- Filter Controls -->
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
          placeholder="Search tasks..."
          class="form-control" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center p-4">
      <p>Loading your active tasks...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTasks.length === 0" class="text-center p-4">
      <h3>No tasks in progress</h3>
      <p>Start working on tasks to see them here!</p>
    </div>

    <!-- Tasks Table -->
    <div v-else class="table-responsive">
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
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
              <strong>{{ task.title }}</strong>
            </td>
            <td>{{ task.description }}</td>
            <td>
              <span :class="'badge bg-' + getPriorityColor(task.priority || 'medium')">
                {{ (task.priority || "medium").toUpperCase() }}
              </span>
            </td>
            <td>{{ task.assignedTo || "Unassigned" }}</td>
            <td
              :class="{
                'text-danger': isOverdue(task.dueDate),
                'text-warning': isDueToday(task.dueDate),
              }">
              {{ formatDate(task.dueDate) }}
            </td>
            <td>{{ formatDate(task.createdAt) }}</td>
            <td>
              <button
                @click="updateTaskStatus(task, 'completed')"
                class="btn btn-success btn-sm"
                :disabled="updatingTask === task.title">
                <span v-if="updatingTask === task.title">⏳</span>
                <span v-else>Complete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" :class="['toast', toastType]">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, onUnmounted, getCurrentInstance} from "vue";

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

const overdueCount = computed(() => {
  return tasks.value.filter((task) => isOverdue(task.dueDate)).length;
});

const dueTodayCount = computed(() => {
  return tasks.value.filter((task) => isDueToday(task.dueDate)).length;
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

const updateTaskStatus = async (task, newStatus) => {
  try {
    updatingTask.value = task.title;

    // Update task status through FSM
    await fsm.send({
      type: "UPDATE_TASK_STATUS",
      taskTitle: task.title,
      newStatus: newStatus,
    });

    // Refresh tasks
    await fetchTasks();

    const statusText = newStatus === "completed" ? "completed" : "moved to pending";
    showToastMessage(`Task "${task.title}" has been ${statusText}!`);
  } catch (error) {
    console.error("Error updating task status:", error);
    showToastMessage("Failed to update task status. Please try again.", "error");
  } finally {
    updatingTask.value = null;
  }
};

async function fetchTasks() {
  try {
    loading.value = true;
    const res = await fetch("/fsm/state");
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const data = await res.json();
    console.log("[InProgress] Response from backend:", data);

    // Extract tasks from response (could be in data.context.tasks or data.tasks)
    let allTasks = (data.context?.tasks || data.tasks || []).filter(
      (task) =>
        task.status === "In Progress" ||
        task.status === "inProgress" ||
        task.status === "in-progress"
    );
    console.log("[InProgress] Filtered in-progress tasks:", allTasks);

    if (user && user.role === "teamMember") {
      allTasks = allTasks.filter((task) => task.assignedTo === user.email);
    }
    tasks.value = allTasks;
    console.log("[InProgress] Final tasks for display:", tasks.value);
  } catch (error) {
    console.error("[InProgress] Error fetching tasks:", error);
    tasks.value = [];
    showToastMessage("Failed to load tasks. Please refresh the page.", "error");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchTasks();

  // Subscribe to state changes
  stateSubscription = fsm.onTransition((state) => {
    // Refresh tasks when state changes that might affect in-progress tasks
    if (state.matches("dashboard") || state.context.tasks) {
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

<style scoped>
.in-progress-container {
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #0a1732 0%, #1a2744 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  color: white;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
  font-weight: 700;
}

.page-header p {
  color: #cbd5e1;
  margin: 0;
  font-size: 1.1rem;
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

.table-responsive {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.table {
  margin: 0;
  border-collapse: separate;
  border-spacing: 0;
}

.table th {
  background: linear-gradient(135deg, #0a1732 0%, #1a2744 100%);
  color: white;
  border: none;
  font-weight: 600;
  padding: 1rem;
  text-align: left;
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.table th:first-child {
  border-top-left-radius: 12px;
}

.table th:last-child {
  border-top-right-radius: 12px;
}

.table td {
  vertical-align: middle;
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.table tbody tr:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr:last-child td:first-child {
  border-bottom-left-radius: 12px;
}

.table tbody tr:last-child td:last-child {
  border-bottom-right-radius: 12px;
}

.badge {
  font-size: 0.75rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-weight: 600;
}

.text-danger {
  color: #dc3545 !important;
  font-weight: 600;
}

.text-warning {
  color: #f59e0b !important;
  font-weight: 600;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 4px;
  color: white;
  font-weight: 500;
  z-index: 1000;
}

.toast.success {
  background-color: #28a745;
}

.toast.error {
  background-color: #dc3545;
}

@media (max-width: 768px) {
  .in-progress-container {
    padding: 1rem;
  }

  .filter-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .form-control {
    min-width: auto;
  }

  .table-responsive {
    font-size: 0.875rem;
  }
}
</style>
