<template>
  <div class="dashboard-container">
    <TopNavbar />

    <div class="dashboard-body">
      <Sidebar />

      <div class="dashboard-content">
        <!-- ONLY ONE router-view with key to force re-render -->
        <router-view :key="$route.fullPath" />
      </div>
    </div>
  </div>
</template>

<script>
import TopNavbar from "@/components/TopNavbar.vue";
import Sidebar from "@/components/sidebar.vue";
import {getCurrentInstance, onMounted, onUnmounted} from "vue";
import {useRouter} from "vue-router";

export default {
  components: {
    TopNavbar,
    Sidebar,
  },
  setup() {
    const {proxy} = getCurrentInstance();
    const fsm = proxy.$fsm;
    const router = useRouter();
    let stateSubscription;

    onMounted(() => {
      // Subscribe to state changes
      stateSubscription = fsm.onTransition((state) => {
        // Handle state transitions
        if (state.matches("login")) {
          router.push("/login");
        }
      });
    });

    onUnmounted(() => {
      if (stateSubscription && typeof stateSubscription === "function") {
        stateSubscription();
      }
    });

    return {};
  },
};
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f4f6f8;
}

.dashboard-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.dashboard-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #ffffff;
  border-left: 1px solid #ddd;
}
</style>
