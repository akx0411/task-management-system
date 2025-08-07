<template>
  <div class="assign-task-container">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">
        {{ isEdit.value ? "✏️ Edit Task" : "📝 Assign New Task" }}
      </h1>
      <p class="page-subtitle">
        {{
          isEdit.value
            ? "Update task details and reassign if needed"
            : "Create and assign a task to team members"
        }}
      </p>
    </div>

    <!-- Form Card -->
    <div class="form-card">
      <form @submit.prevent="handleAssignTask" class="task-form">
        <!-- Task Title -->
        <div class="form-group">
          <label for="title" class="form-label"> 📌 Task Title </label>
          <input
            v-model="task.title"
            type="text"
            id="title"
            class="form-control"
            placeholder="Enter a descriptive task title"
            required
            :disabled="isLoading" />
        </div>

        <!-- Description -->
        <div class="form-group">
          <label for="description" class="form-label"> 📝 Description </label>
          <textarea
            v-model="task.description"
            id="description"
            class="form-control"
            placeholder="Provide detailed task description..."
            required
            :disabled="isLoading"
            rows="4"></textarea>
        </div>

        <!-- Priority and Status Row -->
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="priority" class="form-label"> ⚡ Priority </label>
              <select
                v-model="task.priority"
                id="priority"
                class="form-control"
                required
                :disabled="isLoading">
                <option disabled value="">Select priority</option>
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🔴 High</option>
              </select>
            </div>
          </div>

          <div class="col-md-6">
            <div class="form-group">
              <label for="status" class="form-label"> 📊 Status </label>
              <select
                v-model="task.status"
                id="status"
                class="form-control"
                required
                :disabled="isLoading">
                <option disabled value="">Select status</option>
                <option value="Pending">⏳ Pending</option>
                <option value="In Progress">🔄 In Progress</option>
                <option value="Completed">✅ Completed</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Assign To -->
        <div class="form-group">
          <label for="assignedTo" class="form-label">
            👤 Assign To
            <span v-if="loadingMembers" class="loading-indicator">⏳</span>
          </label>
          <select
            v-model="task.assignedTo"
            id="assignedTo"
            class="form-control"
            required
            :disabled="loadingMembers || !!membersError || isLoading">
            <option disabled value="">
              {{ loadingMembers ? "Loading team members..." : "Select team member" }}
            </option>
            <option v-if="membersError" disabled class="error-option">
              {{ membersError }}
            </option>
            <option v-for="member in teamMembers" :key="member.email" :value="member.email">
              👨‍💻 {{ member.firstName }} {{ member.lastName }}
            </option>
          </select>
          <p
            v-if="teamMembers.length === 0 && !loadingMembers && !membersError"
            class="form-help text-danger">
            No team members found. Please contact your administrator.
          </p>
        </div>

        <!-- Due Date -->
        <div class="form-group">
          <label for="dueDate" class="form-label">
            📅 Due Date
            <span class="text-muted">(optional)</span>
          </label>
          <input
            v-model="task.dueDate"
            type="date"
            id="dueDate"
            class="form-control"
            :disabled="isLoading"
            :min="new Date().toISOString().split('T')[0]" />
          <p class="form-help">Select a target completion date for this task</p>
        </div>

        <!-- Action Buttons -->
        <div class="form-actions">
          <button type="button" @click="goBack" class="btn btn-secondary" :disabled="isLoading">
            🔙 Back to Dashboard
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isLoading || loadingMembers">
            <span v-if="isLoading">⏳ Processing...</span>
            <span v-else>
              {{ isEdit.value ? "💾 Save Changes" : "✅ Assign Task" }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import {ref, reactive, onMounted, getCurrentInstance} from "vue";
import {useRouter, useRoute} from "vue-router";

const router = useRouter();
const route = useRoute();
const {proxy} = getCurrentInstance();
const fsm = proxy.$fsm;
const isLoading = ref(false);

const task = reactive({
  title: "",
  description: "",
  priority: "",
  status: "",
  assignedTo: "",
  dueDate: "",
  createdAt: null,
  edited: false,
});
const isEdit = reactive({value: false, id: null});
const teamMembers = ref([]);
const loadingMembers = ref(true);
const membersError = ref("");

// Toast notification system
const showToast = (message, type = "info") => {
  // Remove existing toast
  const existingToast = document.querySelector(".toast-notification");
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement("div");
  toast.className = `toast-notification toast-${type}`;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${
      type === "success"
        ? "linear-gradient(135deg, #28a745, #20c997)"
        : type === "error"
        ? "linear-gradient(135deg, #dc3545, #e74c3c)"
        : "linear-gradient(135deg, #007bff, #0056b3)"
    };
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 10000;
    font-weight: 500;
    transform: translateX(100%);
    transition: all 0.3s ease;
    max-width: 300px;
    backdrop-filter: blur(10px);
  `;

  const icon = type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️";
  toast.innerHTML = `${icon} ${message}`;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

onMounted(async () => {
  loadingMembers.value = true;
  membersError.value = "";
  try {
    // Fetch team members from FSM backend
    const res = await fetch("/fsm/state?entity=users");
    if (!res.ok) throw new Error("Failed to fetch team members");
    const data = await res.json();
    console.log("[AssignTask] Response from backend:", data); // DEBUG LOG

    // Extract users from response (could be in data.users or data.context.users)
    const users = data.users || data.context?.users || [];
    console.log("[AssignTask] Users found:", users); // DEBUG LOG

    // Filter only team members
    teamMembers.value = Array.isArray(users) ? users.filter((u) => u.role === "teamMember") : [];
    console.log("[AssignTask] Filtered teamMembers:", teamMembers.value); // DEBUG LOG

    if (teamMembers.value.length === 0) {
      showToast("No team members found. Please contact your administrator.", "error");
    }
  } catch (err) {
    console.error("[AssignTask] Error fetching users:", err);
    membersError.value = err.message || "Could not load team members.";
    teamMembers.value = [];
    showToast("Failed to load team members. Please try again.", "error");
  } finally {
    loadingMembers.value = false;
  }

  // Check if editing (via route query)
  if (route.query.edit) {
    const parsed = JSON.parse(route.query.edit);
    Object.assign(task, parsed);
    // Fix: format dueDate for input type=date
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      // If already yyyy-MM-dd, leave as is, else format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        task.dueDate = `${yyyy}-${mm}-${dd}`;
      }
    }
    isEdit.value = true;
    isEdit.id = parsed.id;
    showToast("Task loaded for editing", "info");
  } else {
    task.title = "";
    task.description = "";
    task.priority = "";
    task.status = "";
    task.assignedTo = "";
    task.dueDate = "";
    task.createdAt = null;
    task.edited = false;
    isEdit.value = false;
    isEdit.id = null;
  }
});

const handleAssignTask = async () => {
  // Validation
  if (!task.title.trim()) {
    showToast("Please enter a task title", "error");
    return;
  }

  if (!task.description.trim()) {
    showToast("Please enter a task description", "error");
    return;
  }

  if (!task.priority) {
    showToast("Please select a priority level", "error");
    return;
  }

  if (!task.status) {
    showToast("Please select a status", "error");
    return;
  }

  if (!task.assignedTo) {
    showToast("Please assign the task to a team member", "error");
    return;
  }

  isLoading.value = true;

  try {
    if (isEdit.value && isEdit.id) {
      // Update existing task
      const updatedTask = {...task, edited: true, id: isEdit.id};
      const res = await fetch("/fsm/event", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          type: "SUBMIT_TASK",
          data: {task: updatedTask, isEdit: true},
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update task");

      // Send SUBMIT_TASK event to client-side FSM
      fsm.send("SUBMIT_TASK", {task: updatedTask});
      showToast("Task updated successfully!", "success");
    } else {
      // Add new task
      const newTask = {...task, createdAt: Date.now(), edited: false};
      const res = await fetch("/fsm/event", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          type: "SUBMIT_TASK",
          data: {task: newTask},
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");

      // Send SUBMIT_TASK event to client-side FSM
      fsm.send("SUBMIT_TASK", {task: newTask});
      showToast("Task assigned successfully!", "success");
    }

    // Wait a moment for user to see the success message
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  } catch (error) {
    console.error("Error assigning task:", error);
    showToast(`Error: ${error.message}`, "error");
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  router.push("/dashboard");
};
</script>

<style scoped>
.assign-task-container {
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

/* Form Card */
.form-card {
  max-width: 700px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Form */
.task-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.text-muted {
  color: #718096;
  font-weight: 400;
}

.loading-indicator {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.form-control {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
  font-family: inherit;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.form-control:disabled {
  background: #f7fafc;
  color: #718096;
  cursor: not-allowed;
}

textarea.form-control {
  resize: vertical;
  min-height: 100px;
}

.error-option {
  color: #e53e3e;
  font-style: italic;
}

.form-help {
  font-size: 0.75rem;
  color: #718096;
  margin: 0;
}

.text-danger {
  color: #e53e3e;
}

/* Row Layout */
.row {
  display: flex;
  flex-wrap: wrap;
  margin-right: -0.75rem;
  margin-left: -0.75rem;
}

.col-md-6 {
  position: relative;
  width: 100%;
  padding-right: 0.75rem;
  padding-left: 0.75rem;
}

@media (min-width: 768px) {
  .col-md-6 {
    flex: 0 0 50%;
    max-width: 50%;
  }
}

/* Action Buttons */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  text-decoration: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3182ce;
  color: white;
  border: 1px solid #3182ce;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2c5aa0;
  border-color: #2c5aa0;
}

.btn-secondary {
  background-color: #f7fafc;
  color: #4a5568;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #edf2f7;
  border-color: #a0aec0;
}

/* Toast Notifications - Using the same system but simpler styles */
.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 10000;
  max-width: 300px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.toast-success {
  background-color: #10b981;
}

.toast-error {
  background-color: #ef4444;
}

.toast-info {
  background-color: #3b82f6;
}

/* Responsive Design */
@media (max-width: 768px) {
  .assign-task-container {
    padding: 1rem;
  }

  .page-header {
    padding: 1.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .form-card {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

@media (max-width: 576px) {
  .page-subtitle {
    font-size: 0.875rem;
  }

  .form-card {
    padding: 1rem;
  }

  .btn {
    padding: 0.625rem 1.25rem;
    font-size: 0.8rem;
  }
}
</style>
