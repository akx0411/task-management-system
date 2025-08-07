<script setup>
import logo from "../assets/logo.png";
import {useRouter} from "vue-router";
import {ref, getCurrentInstance} from "vue";

const router = useRouter();
const {proxy} = getCurrentInstance();
const fsm = proxy.$fsm;

const user = ref(JSON.parse(sessionStorage.getItem("loggedInUser") || "{}"));
const defaultAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=Aqsa";
const showUserMenu = ref(false);

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value;
}

function closeUserMenu() {
  showUserMenu.value = false;
}

function navigateToProfile() {
  closeUserMenu();
  router.push("/dashboard/profile-settings");
}

// Fetch user profile from backend on mount
import {onMounted} from "vue";
onMounted(async () => {
  try {
    const currentUser = JSON.parse(sessionStorage.getItem("loggedInUser") || "{}");
    if (!currentUser.email) {
      console.log("No email found in session storage");
      return;
    }

    const res = await fetch(`/auth/profile?email=${encodeURIComponent(currentUser.email)}`, {
      headers: {
        "Content-Type": "application/json",
        // If you use auth tokens, add them here
      },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      user.value = {...user.value, ...data.user};
      sessionStorage.setItem("loggedInUser", JSON.stringify(user.value));
    } else {
      console.error("Failed to fetch profile:", res.status, res.statusText);
    }
  } catch (e) {
    console.error("Error fetching profile:", e);
    // Optionally handle error
  }
});

const logout = async () => {
  const confirmed = confirm(
    "👋 Are you sure you want to logout?\n\nYou will be redirected to the login page."
  );
  if (!confirmed) return;

  closeUserMenu();

  try {
    // Send logout event to FSM
    await fetch("/fsm/event", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        type: "LOGOUT",
        data: {},
      }),
    });

    // Send logout event to frontend FSM
    fsm.send("LOGOUT");

    // Clear session and redirect
    sessionStorage.removeItem("loggedInUser");
    router.push("/login");
  } catch (error) {
    console.error("Logout error:", error);
    // Fallback - still clear session and redirect
    sessionStorage.removeItem("loggedInUser");
    router.push("/login");
  }
};
</script>

<template>
  <div class="top-navbar">
    <div class="left-section">
      <img :src="logo" class="logo-img" />
      <div class="brand-info">
        <span class="logo-text">Task Management</span>
        <span class="brand-subtitle">Stay Organized</span>
      </div>
    </div>
    <div class="right-section">
      <div class="user-info">
        <span class="welcome-text"
          >Welcome back, <strong>{{ user.firstName || "User" }}</strong></span
        >
        <span class="user-role">{{
          user.role === "teamLead" ? "👑 Team Lead" : "👨‍💻 Team Member"
        }}</span>
      </div>

      <div class="user-dropdown" @click="toggleUserMenu">
        <img :src="user.profilePic || defaultAvatar" class="avatar-img" />
        <span class="dropdown-arrow">{{ showUserMenu ? "▲" : "▼" }}</span>

        <div v-if="showUserMenu" class="dropdown-menu" @click.stop>
          <div class="user-profile-header">
            <img :src="user.profilePic || defaultAvatar" class="profile-avatar" />
            <div class="profile-info">
              <div class="profile-name">{{ user.firstName }} {{ user.lastName }}</div>
              <div class="profile-email">{{ user.email }}</div>
            </div>
          </div>
          <hr class="menu-divider" />
          <button class="menu-item" @click="navigateToProfile">⚙️ Profile Settings</button>

          <hr class="menu-divider" />
          <button class="menu-item logout-item" @click="logout">👋 Logout</button>
        </div>
      </div>
    </div>

    <!-- Backdrop to close menu when clicking outside -->
    <div v-if="showUserMenu" class="backdrop" @click="closeUserMenu"></div>
  </div>
</template>

<style scoped>
.top-navbar {
  background: linear-gradient(135deg, #0a1732 0%, #1a2744 100%);
  color: white;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1000;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 0.8rem;
  opacity: 0.8;
  font-weight: 400;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
}

.welcome-text {
  font-size: 0.9rem;
  margin-bottom: 2px;
}

.user-role {
  font-size: 0.75rem;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
}

.user-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.user-dropdown:hover {
  background: rgba(255, 255, 255, 0.1);
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.user-dropdown:hover .avatar-img {
  border-color: rgba(255, 255, 255, 0.6);
}

.dropdown-arrow {
  font-size: 0.7rem;
  transition: transform 0.3s ease;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  min-width: 250px;
  overflow: hidden;
  margin-top: 8px;
  z-index: 1001;
}

.user-profile-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
}

.profile-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-weight: 600;
  color: #0a1732;
  margin-bottom: 2px;
}

.profile-email {
  font-size: 0.85rem;
  color: #666;
}

.menu-divider {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 0;
}

.menu-item {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  text-align: left;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.menu-item:hover {
  background: #f8fafc;
  color: #0a1732;
}

.upload-item {
  position: relative;
}

.avatar-input {
  display: none;
}

.logout-item {
  color: #dc2626;
}

.logout-item:hover {
  background: #fef2f2;
  color: #991b1b;
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

@media (max-width: 768px) {
  .top-navbar {
    padding: 12px 16px;
  }

  .user-info {
    display: none;
  }

  .brand-info {
    display: none;
  }

  .logo-text {
    font-size: 1.1rem;
  }

  .dropdown-menu {
    min-width: 200px;
    right: -10px;
  }
}
</style>
align-items: center; }
