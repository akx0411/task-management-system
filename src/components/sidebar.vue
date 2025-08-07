<template>
  <div>
    <button class="hamburger" @click="toggleSidebar">
      <span class="bar"></span>
      <span class="bar"></span>
      <span class="bar"></span>
    </button>
    <div :class="['sidebar', {collapsed: isCollapsed}]">
      <ul class="nav-list">
        <li class="nav-item" v-for="item in filteredMenuItems" :key="item.name">
          <router-link :to="item.path" class="nav-link">
            <span class="emoji">{{ item.emoji }}</span>
            <span v-if="!isCollapsed" class="label">{{ item.name }}</span>
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
const isCollapsed = ref(true);
function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
}

const menuItems = [
  {name: "All Tasks", path: "/dashboard/all-tasks", roles: ["teamLead"], emoji: "📋"},
  {
    name: "Manage Team Member",
    path: "/dashboard/manage-team-member",
    roles: ["teamLead"],
    emoji: "👥",
  },
  {
    name: "In-Progress",
    path: "/dashboard/in-progress",
    roles: ["teamLead", "teamMember"],
    emoji: "🔄",
  },
  {
    name: "Completed Tasks",
    path: "/dashboard/completed-tasks",
    roles: ["teamLead", "teamMember"],
    emoji: "✅",
  },
  {
    name: "Pending Tasks",
    path: "/dashboard/pending-tasks",
    roles: ["teamLead", "teamMember"],
    emoji: "🕒",
  },
  {name: "Assign Task", path: "/dashboard/assign-task", roles: ["teamLead"], emoji: "📝"},
  {
    name: "Profile Settings",
    path: "/dashboard/profile-settings",
    roles: ["teamLead", "teamMember"],
    emoji: "⚙️",
  },
  {name: "My Tasks", path: "/dashboard/my-tasks", roles: ["teamMember"], emoji: "🙋"},
];

const filteredMenuItems = computed(() => {
  const user = JSON.parse(sessionStorage.getItem("loggedInUser") || "{}");
  if (!user || !user.role) return [];
  return menuItems.filter((item) => item.roles.includes(user.role));
});
</script>

<style scoped>
.hamburger {
  background: none;
  border: none;
  cursor: pointer;
  margin: 16px 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 1001;
}
.bar {
  width: 28px;
  height: 3px;
  background: #0a1732;
  border-radius: 2px;
  transition: all 0.3s;
}
.sidebar {
  background-color: #f2f2f2;
  height: 100vh;
  width: 220px;
  padding-top: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
  transition: width 0.3s;
  overflow: hidden;
}
.sidebar.collapsed {
  width: 60px;
}
.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.nav-item {
  margin-bottom: 18px;
}
.nav-link {
  display: flex;
  align-items: center;
  padding: 8px 20px;
  font-size: 16px;
  color: #333;
  text-decoration: none;
  position: relative;
  transition: color 0.3s;
}
.emoji {
  font-size: 1.5rem;
  margin-right: 16px;
  min-width: 28px;
  text-align: center;
  transition: none;
}
.label {
  transition: color 0.3s, opacity 0.3s;
}
.nav-link:hover .label {
  color: #0a1732;
}
.sidebar.collapsed .label {
  opacity: 0;
  width: 0;
  overflow: hidden;
  display: inline-block;
}
.nav-link::after {
  content: "";
  position: absolute;
  bottom: 6px;
  left: 20px;
  width: 0;
  height: 2px;
  background-color: #0a1732;
  transition: width 0.3s ease;
}
.nav-link:hover::after {
  width: calc(100% - 40px);
}
</style>
