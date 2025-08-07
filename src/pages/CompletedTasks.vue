<script setup>
import {ref, computed, onMounted, getCurrentInstance, onUnmounted} from "vue";
import {useRouter} from "vue-router";

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
const router = useRouter();
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

const completedThisWeek = computed(() => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  return tasks.value.filter((task) => {
    const completedDate = new Date(task.completedDate || task.createdAt);
    return completedDate >= oneWeekAgo;
  }).length;
});

const completedThisMonth = computed(() => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return tasks.value.filter((task) => {
    const completedDate = new Date(task.completedDate || task.createdAt);
    return completedDate >= oneMonthAgo;
  }).length;
});

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return "No date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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

const getCompletionTime = (task) => {
  const created = new Date(task.createdAt);
  const completed = new Date(task.completedDate || task.createdAt);
  const diffMs = completed - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Same day";
  if (diffDays === 1) return "1 day";
  return `${diffDays} days`;
};

const showToastMessage = (message, type = "success") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

async function fetchTasks() {
  try {
    loading.value = true;
    const res = await fetch("http://localhost:4000/fsm/state");
    if (!res.ok) throw new Error("Failed to fetch tasks");
    const data = await res.json();

    // Extract tasks from response (could be in data.context.tasks)
    let allTasks = (data.context?.tasks || data.tasks || []).filter(
      (task) => task.status === "Completed" || task.status === "completed"
    );
    if (user && user.role === "teamMember") {
      allTasks = allTasks.filter((task) => task.assignedTo === user.email);
    }
    tasks.value = allTasks;
    console.log("[CompletedTasks] Loaded completed tasks:", tasks.value);
  } catch (error) {
    console.error("[CompletedTasks] Error fetching tasks:", error);
    tasks.value = [];
    showToastMessage("Failed to load completed tasks. Please refresh the page.", "error");
  } finally {
    loading.value = false;
  }
}

const goBack = () => {
  fsm.send("GO_TO_DASHBOARD");
  router.push("/dashboard");
};

onMounted(() => {
  fetchTasks();

  // Subscribe to state changes
  stateSubscription = fsm.onTransition((state, event) => {
    if (state.matches("completedTasks") || event.type === "MARK_AS_COMPLETED") {
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
  <div class="completed-tasks-container">
    <!-- Header -->
    <div class="page-header">
      <h1>Completed Tasks</h1>
      <p>Review your accomplished tasks</p>
    </div>

    <!-- Stats Section -->
    <div class="stats-section">
      <div class="stat-item">
        <span class="stat-number">{{ tasks.length }}</span>
        <span class="stat-label">Completed</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ completedThisWeek }}</span>
        <span class="stat-label">This Week</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ completedThisMonth }}</span>
        <span class="stat-label">This Month</span>
      </div>
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
          placeholder="Search completed tasks..."
          class="form-control" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center p-4">
      <p>Loading completed tasks...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTasks.length === 0" class="text-center p-4">
      <h3>No completed tasks yet</h3>
      <p>Complete tasks to see them here!</p>
    </div>

    <!-- Tasks Table -->
    <div v-else class="table-responsive">
      <table class="table table-striped" style="width: 100%">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Assigned To</th>
            <th>Completed Date</th>
            <th>Created Date</th>
            <th>Completion Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredTasks" :key="task.id">
            <td>
              <strong>{{ task.title }}</strong>
              <span class="completed-badge">✅ Completed</span>
            </td>
            <td class="description-cell">{{ task.description }}</td>
            <td>
              <span :class="'badge bg-' + getPriorityColor(task.priority || 'medium')">
                {{ (task.priority || "medium").toUpperCase() }}
              </span>
            </td>
            <td>{{ task.assignedTo || "Unassigned" }}</td>
            <td>{{ formatDate(task.completedDate || task.createdAt) }}</td>
            <td>{{ formatDate(task.createdAt) }}</td>
            <td>
              <span class="completion-time-badge">
                {{ getCompletionTime(task) }}
              </span>
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

<style scoped>
.completed-tasks-container {
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

.stats-section {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #059669;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
  margin-top: 0.5rem;
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
  margin-bottom: 2rem;
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

.description-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.completed-badge {
  display: inline-block;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
  font-weight: 500;
}

.completion-time-badge {
  display: inline-block;
  background: #e8f5e8;
  color: #059669;
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-weight: 600;
}

.badge {
  font-size: 0.75rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-weight: 600;
}

.achievement-section {
  margin-top: 2rem;
}

.achievement-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.achievement-icon {
  font-size: 3rem;
}

.achievement-content {
  flex: 1;
}

.achievement-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a2744;
  margin: 0 0 0.5rem 0;
}

.achievement-content p {
  color: #64748b;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.achievement-progress {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #059669, #10b981);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  color: #059669;
  font-weight: 600;
  white-space: nowrap;
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
  background-color: #10b981;
}

.toast.error {
  background-color: #dc3545;
}

@media (max-width: 768px) {
  .completed-tasks-container {
    padding: 1rem;
  }

  .stats-section {
    flex-direction: column;
    gap: 1rem;
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

  .achievement-card {
    flex-direction: column;
    text-align: center;
  }

  .achievement-progress {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
