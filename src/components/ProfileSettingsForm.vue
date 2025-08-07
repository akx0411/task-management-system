<template>
  <!-- Profile Information Section -->
  <div class="section">
    <div class="section-header">
      <h2>Profile Information</h2>
    </div>

    <div class="profile-content">
      <!-- Avatar Section -->
      <div class="avatar-section">
        <div class="avatar-wrapper">
          <img
            :src="profilePicPreview || user.profilePic || defaultAvatar"
            alt="Profile Avatar"
            class="profile-avatar" />
          <div class="avatar-overlay">
            <label class="upload-label">
              📷
              <input type="file" accept="image/*" @change="onFileChange" class="file-input" />
            </label>
          </div>
        </div>
        <div class="avatar-info">
          <h3>{{ user.firstName }} {{ user.lastName }}</h3>
          <p class="role-badge">
            {{ user.role === "teamLead" ? "👑 Team Lead" : "👨‍💻 Team Member" }}
          </p>
          <p class="email">{{ user.email }}</p>
          <button
            v-if="user.profilePic || profilePicPreview"
            @click="removeProfilePic"
            class="btn btn-danger btn-sm">
            🗑️ Remove Photo
          </button>
        </div>
      </div>

      <form v-if="user && user.email" @submit.prevent="saveProfile" class="profile-form">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input
              id="firstName"
              v-model="form.firstName"
              type="text"
              class="form-control"
              required
              :disabled="isLoading"
              placeholder="Enter first name" />
          </div>
          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input
              id="lastName"
              v-model="form.lastName"
              type="text"
              class="form-control"
              required
              :disabled="isLoading"
              placeholder="Enter last name" />
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            class="form-control"
            required
            disabled />
          <small class="text-muted">Email cannot be changed after account creation</small>
        </div>

        <div class="form-group">
          <label for="password">Confirm Password</label>
          <div class="password-field">
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="form.password"
              class="form-control"
              required
              :disabled="isLoading"
              placeholder="Enter password to confirm changes" />
            <span class="toggle-icon" @click="showPassword = !showPassword">
              {{ showPassword ? "👁️‍🗨️" : "🙈" }}
            </span>
          </div>
          <p class="input-help">Required to save profile changes</p>
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="isLoading" class="btn btn-primary">
            <span v-if="isLoading">⏳</span>
            <span v-else>💾</span>
            {{ isLoading ? "Saving..." : "Save Changes" }}
          </button>
        </div>
      </form>

      <div v-else class="loading-state">
        <div class="loading-spinner">⏳</div>
        <p>Loading profile...</p>
      </div>
    </div>

    <!-- Task Statistics Section -->
    <div class="section">
      <div class="section-header">
        <h2>📊 Task Statistics</h2>
      </div>

      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <template v-if="role === 'teamMember'">
              <tr>
                <td><strong>📋 Total Assigned</strong></td>
                <td>
                  <span class="badge badge-info">{{ taskStats.assigned }}</span>
                </td>
                <td>Total tasks assigned to you</td>
              </tr>
              <tr>
                <td><strong>✅ Completed</strong></td>
                <td>
                  <span class="badge badge-success">{{ taskStats.completed }}</span>
                </td>
                <td>Tasks you have completed</td>
              </tr>
              <tr>
                <td><strong>⏳ Pending</strong></td>
                <td>
                  <span class="badge badge-warning">{{ taskStats.pending }}</span>
                </td>
                <td>Tasks awaiting your action</td>
              </tr>
              <tr>
                <td><strong>🔄 In Progress</strong></td>
                <td>
                  <span class="badge badge-primary">{{ taskStats.inProgress }}</span>
                </td>
                <td>Tasks currently being worked on</td>
              </tr>
              <tr v-if="taskStats.assigned > 0">
                <td><strong>📈 Completion Rate</strong></td>
                <td>
                  <span class="badge badge-success">
                    {{ Math.round((taskStats.completed / taskStats.assigned) * 100) }}%
                  </span>
                </td>
                <td>Your overall completion percentage</td>
              </tr>
            </template>

            <template v-else-if="role === 'teamLead'">
              <tr>
                <td><strong>📝 Tasks Created</strong></td>
                <td>
                  <span class="badge badge-primary">{{ taskStats.tasksAssigned }}</span>
                </td>
                <td>Total tasks you have created and assigned</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, watch, onMounted, onUnmounted, getCurrentInstance} from "vue";
import {useRouter} from "vue-router";
import defaultAvatar from "../assets/user-icon.png";

const router = useRouter();
const {proxy} = getCurrentInstance();
const fsm = proxy?.$fsm;
let stateSubscription;
const user = ref(JSON.parse(sessionStorage.getItem("loggedInUser") || "{}"));
const profilePicPreview = ref(null);
const showPassword = ref(false);
const isLoading = ref(false);

const form = ref({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
});

const role = computed(() => user.value.role);
const allTasks = ref([]);
const teamMembers = ref([]);

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
    background: ${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#007bff"};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    font-weight: 500;
    transform: translateX(100%);
    transition: all 0.3s ease;
    max-width: 300px;
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

// Computed property for task stats to avoid multiple function calls
const taskStats = computed(() => {
  console.log("[ProfileSettings] Computing task stats for:", user.value.email, "Role:", role.value);
  console.log("[ProfileSettings] All tasks:", allTasks.value.length, "tasks");

  if (role.value === "teamMember") {
    const assigned = allTasks.value.filter((t) => t.assignedTo === user.value.email);
    console.log("[ProfileSettings] Assigned tasks to current user:", assigned.length, "tasks");

    const stats = {
      assigned: assigned.length,
      completed: assigned.filter((t) => t.status === "Completed" || t.status === "completed")
        .length,
      pending: assigned.filter((t) => t.status === "Pending" || t.status === "pending").length,
      inProgress: assigned.filter(
        (t) => t.status === "In Progress" || t.status === "inProgress" || t.status === "in-progress"
      ).length,
    };
    console.log("[ProfileSettings] Team member stats:", stats);
    return stats;
  } else if (role.value === "teamLead") {
    const stats = {
      members: teamMembers.value.length,
      tasksAssigned: allTasks.value.length,
    };
    console.log("[ProfileSettings] Team lead stats:", stats);
    return stats;
  }
  return {};
});

watch(
  user,
  (newUser) => {
    if (!newUser || !newUser.email) {
      router.push("/login");
    } else {
      form.value.firstName = newUser.firstName || "";
      form.value.lastName = newUser.lastName || "";
      form.value.email = newUser.email || "";
      form.value.password = "";
    }
  },
  {immediate: true}
);

onMounted(async () => {
  // Fetch current user details from backend
  if (user.value && user.value.email) {
    const res = await fetch(`/auth/profile?email=${encodeURIComponent(user.value.email)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        user.value = data.user;
        form.value.firstName = data.user.firstName || "";
        form.value.lastName = data.user.lastName || "";
        form.value.email = data.user.email || "";
        form.value.password = data.user.password || "";
      }
    }
  }
  // Fetch tasks from backend for task summary
  try {
    const tasksRes = await fetch("/fsm/state");
    if (tasksRes.ok) {
      const tasksData = await tasksRes.json();
      console.log("[ProfileSettings] Tasks data from backend:", tasksData);
      // Extract tasks from response (could be in data.context.tasks or data.tasks)
      allTasks.value = tasksData.context?.tasks || tasksData.tasks || [];
      console.log("[ProfileSettings] All tasks loaded:", allTasks.value);
    } else {
      console.error("[ProfileSettings] Failed to fetch tasks:", tasksRes.status);
      allTasks.value = [];
    }
  } catch (error) {
    console.error("[ProfileSettings] Error fetching tasks:", error);
    allTasks.value = [];
  }
  // Fetch team members from backend for team lead summary
  const usersRes = await fetch("/fsm/state?entity=users");
  const usersData = await usersRes.json();
  teamMembers.value = Array.isArray(usersData)
    ? usersData.filter((u) => u.role === "teamMember")
    : [];

  // Subscribe to FSM state changes to keep task summary updated
  if (fsm) {
    stateSubscription = fsm.onTransition((state) => {
      // Only update tasks if there are actually tasks in the FSM context
      // and avoid overriding with empty arrays unless it's intentional
      if (state.context.tasks && state.context.tasks.length > 0) {
        console.log("[ProfileSettings] FSM state changed, updating tasks");
        allTasks.value = state.context.tasks;
      }
    });
  }
});

onUnmounted(() => {
  if (stateSubscription && typeof stateSubscription === "function") {
    stateSubscription();
  }
});

function onFileChange(e) {
  const file = e.target.files[0];
  if (file) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB", "error");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      // Crop image to square (center crop, 200x200)
      const img = new window.Image();
      img.onload = () => {
        const size = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          img,
          (img.width - size) / 2,
          (img.height - size) / 2,
          size,
          size,
          0,
          0,
          200,
          200
        );
        profilePicPreview.value = canvas.toDataURL("image/png");
        showToast("Profile picture updated! Don't forget to save changes.", "success");
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function removeProfilePic() {
  profilePicPreview.value = null;
  // Remove from user and form
  form.value.profilePic = "";
  const updatedUser = {...user.value, profilePic: ""};
  // Call backend API to update user profile picture
  // Example: await fetch('/api/user/profile-pic', { method: 'POST', body: ... })
  user.value = updatedUser;
  sessionStorage.setItem("loggedInUser", JSON.stringify(updatedUser));
  showToast("Profile picture removed! Don't forget to save changes.", "info");
}

async function saveProfile() {
  if (!form.value.password) {
    showToast("Password is required to confirm changes", "error");
    return;
  }

  // Validate form data
  if (!form.value.firstName.trim() || !form.value.lastName.trim()) {
    showToast("First name and last name are required", "error");
    return;
  }

  isLoading.value = true;

  try {
    const updatedUser = {
      ...user.value,
      firstName: form.value.firstName.trim(),
      lastName: form.value.lastName.trim(),
      email: form.value.email,
      password: form.value.password,
      profilePic: profilePicPreview.value || user.value.profilePic || "",
    };

    const response = await fetch("/auth/profile", {
      method: "PUT",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(updatedUser),
    });

    const data = await response.json();

    if (response.ok && data.user) {
      user.value = data.user;
      sessionStorage.setItem("loggedInUser", JSON.stringify(data.user));
      profilePicPreview.value = null; // Clear preview after successful save
      form.value.password = ""; // Clear password field
      showToast("Profile updated successfully!", "success");
    } else {
      showToast(data.message || "Profile update failed", "error");
    }
  } catch (error) {
    console.error("Profile update error:", error);
    showToast("Network error. Please try again.", "error");
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.profile-settings-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header */
.header {
  background: linear-gradient(135deg, #0a1732 0%, #1a2744 100%);
  color: white;
  padding: 30px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
}

.header h1 {
  font-size: 2rem;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.header p {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

/* Section */
.section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.section-header {
  background: linear-gradient(135deg, #0a1732 0%, #1a2744 100%);
  color: white;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

/* Profile Content */
.profile-content {
  padding: 30px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 30px;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 2px solid #e9ecef;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #007bff;
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.upload-label {
  font-size: 2rem;
  color: white;
  cursor: pointer;
}

.file-input {
  display: none;
}

.avatar-info h3 {
  font-size: 1.8rem;
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-weight: 600;
}

.role-badge {
  display: inline-block;
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 10px 0;
}

.email {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0 0 15px 0;
}

/* Form Styles */
.profile-form {
  max-width: 600px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-control:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.password-field {
  position: relative;
}

.toggle-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  font-size: 1.2rem;
  user-select: none;
}

.text-muted,
small.text-muted {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 5px;
  display: block;
}

.form-actions {
  margin-top: 30px;
}

/* Buttons */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Table */
.table-container {
  padding: 20px;
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1rem;
}

.table th,
.table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  border-top: 1px solid #e9ecef;
}

.table tbody tr:hover {
  background-color: #f8f9fa;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 6px 12px;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 4px;
}

.badge-primary {
  background-color: #007bff;
  color: white;
}

.badge-success {
  background-color: #28a745;
  color: white;
}

.badge-warning {
  background-color: #ffc107;
  color: #212529;
}

.badge-info {
  background-color: #17a2b8;
  color: white;
}

/* Loading States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6c757d;
}

.loading-spinner {
  font-size: 1.5rem;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-content {
    padding: 20px;
  }

  .avatar-section {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .header h1 {
    font-size: 1.6rem;
  }

  .header p {
    font-size: 1rem;
  }
}

@media (max-width: 576px) {
  .profile-settings-container {
    padding: 10px;
  }

  .header {
    padding: 20px;
  }

  .table-container {
    padding: 10px;
  }

  .table th,
  .table td {
    padding: 10px 8px;
    font-size: 0.875rem;
  }
}
</style>
