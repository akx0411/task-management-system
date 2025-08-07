<template>
  <div class="team-members-container">
    <!-- Header -->
    <div class="page-header">
      <h1 class="page-title">👥 Team Members</h1>
      <p class="page-subtitle">Manage and view your team members</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3 text-muted">Loading team members...</p>
    </div>

    <!-- Team Members Table -->
    <div v-else-if="teamMembers.length > 0" class="members-section">
      <div class="table-container">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th>Role</th>
              <th>Assigned Tasks</th>
              <th>Completed Tasks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in teamMembers" :key="member.email">
              <td>
                <div class="member-info">
                  <img
                    :src="member.profilePic || defaultAvatar"
                    :alt="`${member.firstName} ${member.lastName}`"
                    class="member-avatar" />
                  <div>
                    <div class="member-name">{{ member.firstName }} {{ member.lastName }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="text-muted">{{ member.email }}</span>
              </td>
              <td>
                <span class="badge" :class="`badge-${getRoleColor(member.role)}`">
                  {{ member.role === "teamLead" ? "Team Lead" : "Team Member" }}
                </span>
              </td>
              <td>
                <span class="task-count">{{ getAssignedTaskCount(member.email) }}</span>
              </td>
              <td>
                <span class="task-count">{{ getCompletedTaskCount(member.email) }}</span>
              </td>
              <td>
                <button @click="viewMemberTasks(member)" class="btn btn-sm btn-outline-primary">
                  View Tasks
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Team Statistics -->
      <div class="team-stats mt-4">
        <h5 class="mb-3">📊 Team Overview</h5>
        <div class="row">
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div>
                <div class="stat-number">{{ teamMembers.length }}</div>
                <div class="stat-label">Total Members</div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="stat-card">
              <div class="stat-icon">👑</div>
              <div>
                <div class="stat-number">{{ teamLeads.length }}</div>
                <div class="stat-label">Team Leads</div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="stat-card">
              <div class="stat-icon">👨‍💻</div>
              <div>
                <div class="stat-number">{{ regularMembers.length }}</div>
                <div class="stat-label">Team Members</div>
              </div>
            </div>
          </div>
          <div class="col-md-3 col-sm-6 mb-3">
            <div class="stat-card">
              <div class="stat-icon">📋</div>
              <div>
                <div class="stat-number">{{ totalAssignedTasks }}</div>
                <div class="stat-label">Total Tasks</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="text-center py-5">
        <div class="empty-icon">👥</div>
        <h5 class="mt-3">No Team Members Found</h5>
        <p class="text-muted">There are currently no team members in the system.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, onUnmounted, getCurrentInstance} from "vue";
import {useRouter} from "vue-router";
import defaultAvatar from "../assets/user-icon.png";

const router = useRouter();
const {proxy} = getCurrentInstance();
const fsm = proxy.$fsm;

const teamMembers = ref([]);
const allTasks = ref([]);
const isLoading = ref(true);
let stateSubscription;

// Toast notification system
const showToast = (message, type = "info") => {
  const existingToast = document.querySelector(".toast-notification");
  if (existingToast) {
    existingToast.remove();
  }

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

  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    toast.style.transform = "translateX(100%)";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
};

// Computed properties
const teamLeads = computed(() => teamMembers.value.filter((member) => member.role === "teamLead"));

const regularMembers = computed(() =>
  teamMembers.value.filter((member) => member.role === "teamMember")
);

const totalAssignedTasks = computed(() => allTasks.value.length);

// Helper functions
const getAssignedTaskCount = (email) => {
  return allTasks.value.filter((task) => task.assignedTo === email).length;
};

const getCompletedTaskCount = (email) => {
  return allTasks.value.filter(
    (task) =>
      task.assignedTo === email && (task.status === "Completed" || task.status === "completed")
  ).length;
};

const getRoleColor = (role) => {
  return role === "teamLead" ? "warning" : "info";
};

const viewMemberTasks = (member) => {
  // Store member info and navigate to a filtered view
  sessionStorage.setItem("viewingMember", JSON.stringify(member));
  showToast(`Viewing tasks for ${member.firstName} ${member.lastName}`, "info");
  router.push("/all-tasks");
};

// Data fetching
const fetchTeamMembers = async () => {
  try {
    const res = await fetch("/fsm/state?entity=users");
    if (!res.ok) throw new Error("Failed to fetch team members");

    const data = await res.json();
    const users = data.users || data.context?.users || [];

    teamMembers.value = Array.isArray(users) ? users : [];
    console.log("[TeamMembers] Loaded team members:", teamMembers.value);
  } catch (error) {
    console.error("[TeamMembers] Error fetching team members:", error);
    showToast("Failed to load team members", "error");
    teamMembers.value = [];
  }
};

const fetchTasks = async () => {
  try {
    const res = await fetch("/fsm/state");
    if (!res.ok) throw new Error("Failed to fetch tasks");

    const data = await res.json();
    allTasks.value = data.context?.tasks || data.tasks || [];
    console.log("[TeamMembers] Loaded tasks:", allTasks.value);
  } catch (error) {
    console.error("[TeamMembers] Error fetching tasks:", error);
    allTasks.value = [];
  }
};

onMounted(async () => {
  isLoading.value = true;

  try {
    await Promise.all([fetchTeamMembers(), fetchTasks()]);
  } catch (error) {
    console.error("[TeamMembers] Error during initialization:", error);
  } finally {
    isLoading.value = false;
  }

  // Subscribe to FSM state changes
  if (fsm) {
    stateSubscription = fsm.onTransition((state) => {
      if (state.context.users || state.context.tasks) {
        fetchTeamMembers();
        fetchTasks();
      }
    });
  }
});

onUnmounted(() => {
  if (stateSubscription && typeof stateSubscription === "function") {
    stateSubscription();
  }

  // Clean up stored member info
  sessionStorage.removeItem("viewingMember");
});
</script>

<style scoped>
.team-members-container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 2rem;
}

/* Header */
.page-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #718096;
  font-size: 1rem;
  margin: 0;
}

/* Members Section */
.members-section {
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

/* Member Info */
.member-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e2e8f0;
}

.member-name {
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

/* Badge Styles */
.badge {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-warning {
  background-color: #fbbf24;
  color: #92400e;
}

.badge-info {
  background-color: #60a5fa;
  color: #1e3a8a;
}

/* Task Count */
.task-count {
  font-weight: 600;
  color: #4a5568;
  font-size: 1.1rem;
}

/* Button Styles */
.btn {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-outline-primary {
  border-color: #3182ce;
  color: #3182ce;
}

.btn-outline-primary:hover {
  background-color: #3182ce;
  border-color: #3182ce;
  color: white;
}

/* Team Statistics */
.team-stats {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.team-stats h5 {
  color: #2d3748;
  font-weight: 600;
  margin-bottom: 1rem;
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

/* Responsive Design */
@media (max-width: 768px) {
  .team-members-container {
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

  .member-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .member-avatar {
    width: 32px;
    height: 32px;
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
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
}
</style>
