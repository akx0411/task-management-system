<template>
  <div class="manage-team-container">
    <!-- Header -->
    <div class="page-header">
      <h1>Manage Team Members</h1>
      <p>Add, remove, and manage your team</p>
    </div>

    <!-- Stats Section -->
    <div class="stats-section">
      <div class="stat-item">
        <span class="stat-number">{{ teamMembers.length }}</span>
        <span class="stat-label">Team Members</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ activeMembers }}</span>
        <span class="stat-label">Active Members</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ teamLeaders }}</span>
        <span class="stat-label">Team Leaders</span>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center p-4">
      <p>Loading team members...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredMembers.length === 0" class="text-center p-4">
      <h3>No team members found</h3>
      <p v-if="searchQuery">Try adjusting your search criteria</p>
      <p v-else>Start building your team by adding members</p>
    </div>

    <!-- Team Members Table -->
    <div v-else class="table-responsive">
      <table class="table table-striped" style="width: 100%">
        <thead>
          <tr>
            <th>Member</th>
            <th>Email</th>
            <th>Role</th>

            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="member in filteredMembers" :key="member.email">
            <td>
              <div class="member-info">
                <img
                  :src="member.avatar || '/src/assets/user-icon.png'"
                  :alt="member.firstName + ' ' + member.lastName"
                  class="member-avatar" />
                <div>
                  <strong>{{ member.firstName }} {{ member.lastName }}</strong>
                </div>
              </div>
            </td>
            <td>{{ member.email }}</td>
            <td>
              <span :class="'badge bg-' + getRoleColor(member.role)">
                {{ member.role === "teamLead" ? "Team Lead" : "Member" }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button @click="editMember(member)" class="btn btn-secondary btn-sm me-1">
                  Edit
                </button>
                <button
                  @click="confirmRemoveMember(member)"
                  class="btn btn-danger btn-sm"
                  :disabled="removingMember === member.email">
                  <span v-if="removingMember === member.email">⏳</span>
                  <span v-else>Remove</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Member Modal -->
    <div v-if="showAddMemberModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Add New Team Member</h3>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <div class="modal-body">
          <p>Send team members an invitation link to join your workspace.</p>
          <div class="invitation-section">
            <div class="invite-link">
              <input type="text" :value="inviteLink" readonly class="link-input" />
              <button @click="copyInviteLink" class="btn btn-primary">
                {{ copied ? "✅ Copied!" : "📋 Copy" }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <div v-if="showToast" :class="['toast', toastType]">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from "vue";

const teamMembers = ref([]);
const loading = ref(true);
const searchQuery = ref("");
const removingMember = ref(null);
const showAddMemberModal = ref(false);
const showToast = ref(false);
const toastMessage = ref("");
const toastType = ref("success");
const copied = ref(false);

// Computed properties
const filteredMembers = computed(() => {
  if (!searchQuery.value) return teamMembers.value;

  const query = searchQuery.value.toLowerCase();
  return teamMembers.value.filter(
    (member) =>
      member.firstName.toLowerCase().includes(query) ||
      member.lastName.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      (member.username && member.username.toLowerCase().includes(query))
  );
});

const activeMembers = computed(() => {
  return teamMembers.value.length; // For now, all members are considered active
});

const teamLeaders = computed(() => {
  return teamMembers.value.filter((member) => member.role === "teamLead").length;
});

const inviteLink = computed(() => {
  return `${window.location.origin}/signup?invite=team`;
});

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getRoleColor = (role) => {
  return role === "teamLead" ? "warning" : "info";
};

const showToastMessage = (message, type = "success") => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

const copyInviteLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value);
    copied.value = true;
    showToastMessage("Invite link copied to clipboard!");
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy invite link:", error);
    showToastMessage("Failed to copy invite link", "error");
  }
};

const closeModal = () => {
  showAddMemberModal.value = false;
  copied.value = false;
};

const editMember = (member) => {
  // Placeholder for edit functionality
  showToastMessage(
    `Edit functionality for ${member.firstName} ${member.lastName} coming soon!`,
    "info"
  );
};

const confirmRemoveMember = (member) => {
  if (
    confirm(`Are you sure you want to remove ${member.firstName} ${member.lastName} from the team?`)
  ) {
    removeMember(member.email);
  }
};

async function loadTeamMembers() {
  try {
    loading.value = true;
    const response = await fetch("http://localhost:4000/fsm/state?entity=users");
    const data = await response.json();

    if (data.users) {
      // Filter for team members only
      teamMembers.value = data.users.filter((user) => user.role === "teamMember");
    }
  } catch (error) {
    console.error("Error loading team members:", error);
    // Fallback to localStorage if backend is unavailable
    const users = JSON.parse(localStorage.getItem("users")) || [];
    teamMembers.value = users.filter((u) => u.role === "teamMember");
  } finally {
    loading.value = false;
  }
}

async function removeMember(email) {
  try {
    removingMember.value = email;

    // Here you would typically call a DELETE endpoint
    // For now, we'll update localStorage as fallback
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const updatedUsers = users.filter((u) => u.email !== email);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    // Reload the team members
    await loadTeamMembers();

    showToastMessage("Team member removed successfully!");
  } catch (error) {
    console.error("Error removing team member:", error);
    showToastMessage("Failed to remove team member. Please try again.", "error");
  } finally {
    removingMember.value = null;
  }
}

onMounted(loadTeamMembers);
</script>

<style scoped>
.manage-team-container {
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

.page-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #bdc0c4;
  font-size: 1rem;
  margin: 0;
}

/* Stats Section */
.stats-section {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #718096;
  font-weight: 500;
  margin-top: 0.25rem;
}

/* Controls Section */
.controls-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.form-control {
  flex: 1;
  max-width: 300px;
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

/* Table Styles */
.table-responsive {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
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

/* Badge Styles */
.badge {
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bg-warning {
  background-color: #fbbf24;
  color: #92400e;
}

.bg-info {
  background-color: #60a5fa;
  color: #1e3a8a;
}

.bg-success {
  background-color: #34d399;
  color: #065f46;
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
  gap: 0.5rem;
  border: 1px solid transparent;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #3182ce;
  border-color: #3182ce;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2c5aa0;
  border-color: #2c5aa0;
}

.btn-secondary {
  background-color: #718096;
  border-color: #718096;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #4a5568;
  border-color: #4a5568;
}

.btn-danger {
  background-color: #e53e3e;
  border-color: #e53e3e;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c53030;
  border-color: #c53030;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
}

.me-1 {
  margin-right: 0.25rem;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.2s ease;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #718096;
  transition: color 0.2s ease;
  padding: 0.25rem;
}

.close-btn:hover {
  color: #e53e3e;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  color: #4a5568;
  margin-bottom: 1rem;
}

/* Invitation Section */
.invitation-section {
  margin-top: 1rem;
}

.invite-link {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.link-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: #f9fafb;
  color: #374151;
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

.toast.info {
  background-color: #3b82f6;
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

/* Loading and Empty States */
.text-center {
  text-align: center;
}

.p-4 {
  padding: 1.5rem;
}

.py-5 {
  padding-top: 3rem;
  padding-bottom: 3rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .manage-team-container {
    padding: 1rem;
  }

  .page-header {
    padding: 1.5rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .stats-section {
    flex-direction: column;
    gap: 1rem;
  }

  .search-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .form-control {
    max-width: none;
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

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }

  .invite-link {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 576px) {
  .table-responsive {
    font-size: 0.875rem;
  }

  .btn-sm {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .modal-content {
    width: 95%;
  }

  .modal-header,
  .modal-body {
    padding: 1rem;
  }
}
</style>
