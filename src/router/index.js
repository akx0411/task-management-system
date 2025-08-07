// src/router/index.js

import {createRouter, createWebHistory} from "vue-router";

// Import pages
import Login from "../pages/login.vue";
import Signup from "../pages/SignUp.vue";
import Dashboard from "../pages/dashboardlayout.vue";
import AssignTask from "../pages/AssignTask.vue";
import AllTasks from "../pages/AllTasks.vue";
import CreateTask from "../pages/CreateTask.vue";
import PendingTasks from "../pages/PendingTasks.vue";
import CompletedTasks from "../pages/CompletedTasks.vue";
import MyTasks from "../pages/MyTasks.vue";
import InProgress from "../pages/InProgress.vue";
import ManageTeamMember from "../pages/ManageTeamMember.vue";
import Profilesettings from "../pages/Profilesettings.vue";

// Routes
const routes = [
  {path: "/", redirect: "/login"},
  {path: "/login", component: Login},
  {path: "/signup", component: Signup},
  {
    path: "/dashboard",
    component: Dashboard,
    meta: {requiresAuth: true},
    children: [
      // Default child route: redirect to all-tasks for teamLead, my-tasks for teamMember
      {
        path: "",
        redirect: (to) => {
          const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
          if (user && user.role === "teamLead") return "/dashboard/all-tasks";
          if (user && user.role === "teamMember") return "/dashboard/my-tasks";
          return "/dashboard/all-tasks";
        },
      },
      {path: "assign-task", component: AssignTask, meta: {role: "teamLead"}},
      {path: "all-tasks", component: AllTasks, meta: {role: "teamLead"}},
      {path: "create-task", component: CreateTask, meta: {role: "teamLead"}},
      {path: "pending-tasks", component: PendingTasks},
      {path: "completed-tasks", component: CompletedTasks},
      {path: "profile-settings", component: Profilesettings},
      {path: "my-tasks", component: MyTasks, meta: {role: "teamMember"}},
      {path: "in-progress", component: InProgress},
      {path: "manage-team-member", component: ManageTeamMember, meta: {role: "teamLead"}},
    ],
  },
];

// Router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Route guard
router.beforeEach((to, from, next) => {
  const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
  if (to.meta.requiresAuth && !user) {
    next("/login");
  } else if (to.meta.role && user?.role !== to.meta.role) {
    next("/dashboard");
  } else {
    next();
  }
});

export default router;
