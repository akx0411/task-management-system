<script setup>
import {ref, computed, onMounted} from "vue";
import {useRouter} from "vue-router";

const router = useRouter();
const tasks = ref([]);
const loading = ref(true);
const statusFilter = ref("");
const priorityFilter = ref("");
const searchQuery = ref("");
const updatingTask = ref(null);
const deletingTask = ref(null);
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");

// Edit modal state
const showEditModal = ref(false);
const editingTask = ref(null);
const editForm = ref({
  title: "",
  description: "",
  priority: "",
  status: "",
  assignedTo: "",
  dueDate: "",
});
const teamMembers = ref([]);

// Computed properties
const filteredTasks = computed(() => {
  let filtered = tasks.value;

  if (statusFilter.value) {
    filtered = filtered.filter((task) => {
      const status = task.status.toLowerCase().replace(" ", "");
      return status === statusFilter.value.toLowerCase();
    });
  }

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

const pendingCount = computed(() => {
  return tasks.value.filter((t) => t.status === "Pending").length;
});

const inProgressCount = computed(() => {
  return tasks.value.filter((t) => t.status === "In Progress" || t.status === "inProgress").length;
});

const completedCount = computed(() => {
  return tasks.value.filter((t) => t.status === "Completed").length;
});

const hasActiveFilters = computed(() => {
  return statusFilter.value || priorityFilter.value || searchQuery.value;
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

const getStatusIcon = (status) => {
  switch (status) {
    case "Pending":
      return "⏸️";
    case "In Progress":
    case "inProgress":
      return "⚡";
    case "Completed":
      return "✅";
    default:
      return "📋";
  }
};

const getStatusClass = (status) => {
  return status.toLowerCase().replace(" ", "-");
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

const getStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "secondary";
    case "In Progress":
    case "inProgress":
      return "info";
    case "Completed":
      return "success";
    default:
      return "secondary";
  }
};

const getMemberName = (email) => {
  if (!email) return "Unassigned";

  // Try to get member name from localStorage
  try {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find((u) => u.email === email);
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
  } catch (error) {
    console.error("Error getting member name:", error);
  }

  return email.split("@")[0]; // Fallback to email username
};

const showToastMessage = (message, type = "success") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

const confirmDeleteTask = (task, index) => {
  if (
    confirm(
      `🗑️ Are you sure you want to delete task "${task.title}"?\n\nThis action cannot be undone.`
    )
  ) {
    deleteTask(index);
  }
};

const editTask = (task) => {
  editingTask.value = {...task};
  editForm.value = {
    title: task.title || "",
    description: task.description || "",
    priority: task.priority || "medium",
    status: task.status || "Pending",
    assignedTo: task.assignedTo || "",
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "", // Convert to YYYY-MM-DD format for input[type="date"]
  };
  showEditModal.value = true;
};

const cancelEdit = () => {
  showEditModal.value = false;
  editingTask.value = null;
  editForm.value = {
    title: "",
    description: "",
    priority: "",
    status: "",
    assignedTo: "",
    dueDate: "",
  };
};

const saveTask = async () => {
  if (!editForm.value.title || !editForm.value.description) {
    showToastMessage("Please fill in all required fields", "error");
    return;
  }

  try {
    updatingTask.value = editingTask.value.id;

    const updatedTask = {
      ...editingTask.value,
      title: editForm.value.title,
      description: editForm.value.description,
      priority: editForm.value.priority,
      status: editForm.value.status,
      assignedTo: editForm.value.assignedTo,
      dueDate: editForm.value.dueDate || null, // Use null if no date selected
      edited: true,
    };

    // The dueDate is already in YYYY-MM-DD format from the date input
    // No conversion needed since we're using input[type="date"]

    const res = await fetch("/fsm/event", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        type: "SUBMIT_TASK",
        data: {
          task: updatedTask,
          isEdit: true,
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update task");

    // Refresh tasks list
    await fetchTasks();

    showToastMessage(`Task "${editForm.value.title}" has been updated successfully!`);
    cancelEdit();
  } catch (error) {
    console.error("[AllTasks] Error updating task:", error);
    showToastMessage("Failed to update task. Please try again.", "error");
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
    console.log("[AllTasks] Response from backend:", data);

    // Extract tasks from response (could be in data.context.tasks)
    tasks.value = data.context?.tasks || data.tasks || [];
    console.log("[AllTasks] Tasks loaded:", tasks.value);
  } catch (error) {
    console.error("[AllTasks] Error fetching tasks:", error);
    tasks.value = [];
    showToastMessage("Failed to load tasks. Please refresh the page.", "error");
  } finally {
    loading.value = false;
  }
}

async function fetchTeamMembers() {
  try {
    const response = await fetch("/fsm/state?entity=users");
    const data = await response.json();

    if (data.users) {
      teamMembers.value = data.users.filter((user) => user.role === "teamMember");
    }
  } catch (error) {
    console.error("[AllTasks] Error fetching team members:", error);
    // Fallback to localStorage if backend is unavailable
    const users = JSON.parse(localStorage.getItem("users")) || [];
    teamMembers.value = users.filter((u) => u.role === "teamMember");
  }
}

async function deleteTask(index) {
  const deletedTask = tasks.value[index];
  if (!deletedTask || !deletedTask.id) return;

  try {
    deletingTask.value = deletedTask.id;

    const res = await fetch("/fsm/event", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        type: "DELETE_TASK",
        data: {taskId: deletedTask.id},
      }),
    });

    if (!res.ok) throw new Error("Failed to delete task");

    // Refresh tasks list
    await fetchTasks();

    showToastMessage(`Task "${deletedTask.title}" has been deleted successfully!`);
  } catch (error) {
    console.error("[AllTasks] Error deleting task:", error);
    showToastMessage("Failed to delete task. Please try again.", "error");
  } finally {
    deletingTask.value = null;
  }
}

onMounted(() => {
  fetchTasks();
  fetchTeamMembers();
});
</script>

<template>
  <div class="all-tasks-container">
    <!-- Header -->
    <div class="page-header">
      <h1>All Tasks</h1>
      <p>Manage and track all team tasks</p>
    </div>

    <!-- Stats Section -->
    <div class="stats-section">
      <div class="stat-item">
        <span class="stat-number">{{ tasks.length }}</span>
        <span class="stat-label">Total Tasks</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ pendingCount }}</span>
        <span class="stat-label">Pending</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ inProgressCount }}</span>
        <span class="stat-label">In Progress</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ completedCount }}</span>
        <span class="stat-label">Completed</span>
      </div>
    </div>

    <!-- Filter Controls -->
    <div class="filter-section">
      <div class="filter-controls">
        <select v-model="statusFilter" class="form-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="inProgress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
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
      <p>Loading all tasks...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredTasks.length === 0" class="text-center p-4">
      <h3>No tasks found</h3>
      <p v-if="hasActiveFilters">Try adjusting your filters</p>
      <p v-else>Create your first task to get started!</p>
    </div>

    <!-- Tasks Table -->
    <div v-else class="table-responsive">
      <table class="table table-striped" style="width: 100%">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Due Date</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(task, index) in filteredTasks" :key="task.id || index">
            <td>
              <strong>{{ task.title }}</strong>
              <span v-if="task.edited" class="edited-badge">Edited</span>
            </td>
            <td class="description-cell">{{ task.description }}</td>
            <td>
              <span :class="'badge bg-' + getPriorityColor(task.priority || 'medium')">
                {{ (task.priority || "medium").toUpperCase() }}
              </span>
            </td>
            <td>
              <span :class="'badge bg-' + getStatusColor(task.status)">
                {{ task.status }}
              </span>
            </td>
            <td>{{ getMemberName(task.assignedTo) }}</td>
            <td>{{ formatDate(task.dueDate) }}</td>
            <td>{{ formatDate(task.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  @click="editTask(task)"
                  class="btn btn-primary btn-sm me-1"
                  :disabled="updatingTask === task.id">
                  <span v-if="updatingTask === task.id">⏳</span>
                  <span v-else>Edit</span>
                </button>
                <button
                  @click="confirmDeleteTask(task, index)"
                  class="btn btn-danger btn-sm"
                  :disabled="deletingTask === task.id">
                  <span v-if="deletingTask === task.id">⏳</span>
                  <span v-else">Delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Task Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="cancelEdit">
      <div class="edit-modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Task</h3>
          <button @click="cancelEdit" class="close-btn">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="edit-title">Task Title *</label>
            <input
              id="edit-title"
              v-model="editForm.title"
              type="text"
              placeholder="Enter task title"
              class="form-input" />
          </div>

          <div class="form-group">
            <label for="edit-description">Description *</label>
            <textarea
              id="edit-description"
              v-model="editForm.description"
              placeholder="Enter task description"
              class="form-textarea"
              rows="4"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="edit-priority">Priority</label>
              <select id="edit-priority" v-model="editForm.priority" class="form-select">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div class="form-group">
              <label for="edit-status">Status</label>
              <select id="edit-status" v-model="editForm.status" class="form-select">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="edit-due-date">Due Date</label>
            <input id="edit-due-date" v-model="editForm.dueDate" type="date" class="form-input" />
          </div>

          <div class="form-group">
            <label for="edit-assigned">Assigned To</label>
            <select id="edit-assigned" v-model="editForm.assignedTo" class="form-select">
              <option value="">Unassigned</option>
              <option v-for="member in teamMembers" :key="member.email" :value="member.email">
                {{ member.firstName }} {{ member.lastName }} ({{ member.email }})
              </option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="cancelEdit" class="btn btn-secondary">Cancel</button>
          <button
            @click="saveTask"
            class="btn btn-primary"
            :disabled="updatingTask === editingTask?.id">
            <span v-if="updatingTask === editingTask?.id">⏳</span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" :class="['toast', toastType]">
      {{ toastMessage }}
    </div>
  </div>
</template>

<style scoped>
.all-tasks-container {
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
  color: #1a2744;
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

.edited-badge {
  display: inline-block;
  background: #f59e0b;
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-weight: 600;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #1a2744 0%, #0a1732 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 39, 68, 0.4);
}

.btn-danger {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.me-1 {
  margin-right: 0.25rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #0a1732 0%, #1a2744 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #1a2744;
  box-shadow: 0 0 0 3px rgba(26, 39, 68, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 12px 12px;
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
  .all-tasks-container {
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

  .action-buttons {
    flex-direction: column;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
