<template>
  <div class="login-container">
    <div class="form-box">
      <div class="login-header">
        <h2>Welcome Back! 👋</h2>
        <p class="subtitle">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleLoginSubmit">
        <div class="input-group">
          <label for="email">Email Address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
            :disabled="isLoading" />
        </div>

        <div class="input-group">
          <label for="password">Password</label>
          <div class="password-field">
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="Enter your password"
              required
              :disabled="isLoading" />
            <span class="toggle-icon" @click="togglePassword">
              {{ showPassword ? "👁️" : "🙈" }}
            </span>
          </div>
        </div>

        <button type="submit" :disabled="isLoading" class="login-btn">
          <span v-if="isLoading" class="loading-spinner">⏳</span>
          {{ isLoading ? "Signing in..." : "Sign In" }}
        </button>

        <div v-if="error" class="error-message">
          <span class="error-icon">❌</span>
          {{ error }}
        </div>
      </form>

      <!-- Sign Up link -->
      <p class="signup-link">
        Don't have an account?
        <span @click="goToSignup" class="signup-action">Sign Up</span>
      </p>
    </div>
  </div>
</template>

<script>
import {ref, getCurrentInstance, onMounted, onUnmounted} from "vue";
import {useRouter} from "vue-router";

export default {
  setup() {
    const email = ref("");
    const password = ref("");
    const showPassword = ref(false);
    const error = ref("");
    const isLoading = ref(false);
    const router = useRouter();
    const {proxy} = getCurrentInstance();
    const fsm = proxy.$fsm;

    let stateSubscription;

    onMounted(() => {
      // Subscribe to state changes
      stateSubscription = fsm.onTransition((state) => {
        if (state.matches("dashboard")) {
          const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
          if (user && user.role === "teamLead") {
            router.push("/dashboard/all-tasks");
          } else if (user && user.role === "teamMember") {
            router.push("/dashboard/my-tasks");
          } else {
            router.push("/dashboard");
          }
        }
      });
    });

    onUnmounted(() => {
      // Clean up subscription - in XState v4, onTransition returns a function
      if (stateSubscription && typeof stateSubscription === "function") {
        stateSubscription();
      }
    });

    const togglePassword = () => {
      showPassword.value = !showPassword.value;
    };

    const handleLoginSubmit = async () => {
      error.value = "";
      isLoading.value = true;

      try {
        const res = await fetch("/fsm/event", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            type: "LOGIN",
            data: {email: email.value, password: password.value},
          }),
        });

        const data = await res.json();
        console.log("Backend response:", data);

        if (!res.ok) {
          throw new Error(data.error || "Login failed");
        }

        if (data.success && (data.state === "dashboard" || data.state.dashboard)) {
          // Store user in sessionStorage
          sessionStorage.setItem("loggedInUser", JSON.stringify(data.context.user));
          console.log("User role:", data.context.user.role);

          // Send LOGIN_SUCCESS event to client-side FSM
          fsm.send("LOGIN_SUCCESS", {user: data.context.user});

          // Navigate based on user role
          const userRole = data.context.user.role;
          if (userRole === "teamLead") {
            router.push("/dashboard/all-tasks");
          } else if (userRole === "teamMember") {
            router.push("/dashboard/my-tasks");
          } else {
            router.push("/dashboard");
          }
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        isLoading.value = false;
      }
    };

    const goToSignup = () => {
      fsm.send("GO_TO_SIGNUP");
      router.push("/signup");
    };

    return {
      email,
      password,
      showPassword,
      error,
      isLoading,
      togglePassword,
      handleLoginSubmit,
      goToSignup,
    };
  },
};
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #0a1732 0%, #1a2744 100%);
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.form-box {
  background-color: white;
  padding: 2.5rem;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
}

.login-header {
  margin-bottom: 2rem;
}

.login-header h2 {
  margin-bottom: 0.5rem;
  color: #0a1732;
  font-size: 1.8rem;
  font-weight: 600;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

.input-group {
  text-align: left;
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

input {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #0a1732;
  box-shadow: 0 0 0 3px rgba(10, 23, 50, 0.1);
}

input:disabled {
  background-color: #f5f5f5;
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
  font-size: 1.1rem;
  user-select: none;
}

.login-btn {
  background: linear-gradient(135deg, #0a1732 0%, #1a2744 100%);
  color: white;
  padding: 14px 20px;
  width: 100%;
  border: none;
  cursor: pointer;
  margin-top: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(10, 23, 50, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
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

.error-message {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.error-icon {
  flex-shrink: 0;
}

.signup-link {
  margin-top: 2rem;
  font-size: 0.95rem;
  color: #666;
}

.signup-action {
  color: #0a1732;
  cursor: pointer;
  margin-left: 5px;
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.3s ease;
}

.signup-action:hover {
  color: #1a2744;
}
</style>
