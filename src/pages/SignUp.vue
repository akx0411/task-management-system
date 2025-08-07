<template>
  <div class="signup-container">
    <div class="form-box">
      <div class="signup-header">
        <h2>Create Account 🚀</h2>
        <p class="subtitle">Join our task management platform</p>
      </div>

      <form @submit.prevent="handleSignup">
        <div class="name-group">
          <div class="input-group">
            <label for="firstName">First Name</label>
            <input
              id="firstName"
              v-model="firstName"
              type="text"
              placeholder="Enter first name"
              required
              :disabled="isLoading" />
          </div>
          <div class="input-group">
            <label for="lastName">Last Name</label>
            <input
              id="lastName"
              v-model="lastName"
              type="text"
              placeholder="Enter last name"
              required
              :disabled="isLoading" />
          </div>
        </div>

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
          <label for="role">Select Your Role</label>
          <select v-model="role" id="role" required :disabled="isLoading">
            <option value="" disabled>Choose your role</option>
            <option value="teamLead">Team Lead 👑</option>
            <option value="teamMember">Team Member 👨‍💻</option>
          </select>
        </div>

        <div class="input-group">
          <label for="password">Password</label>
          <div class="password-field">
            <input
              id="password"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="Create a strong password"
              required
              :disabled="isLoading" />
            <span class="toggle-icon" @click="togglePassword">
              {{ showPassword ? "👁️" : "🙈" }}
            </span>
          </div>
        </div>

        <div class="input-group">
          <label for="retypePassword">Confirm Password</label>
          <input
            id="retypePassword"
            :type="showPassword ? 'text' : 'password'"
            v-model="retypePassword"
            placeholder="Confirm your password"
            required
            :disabled="isLoading"
            :class="{'password-mismatch': retypePassword && password !== retypePassword}" />
          <div v-if="retypePassword && password !== retypePassword" class="password-error">
            Passwords don't match
          </div>
        </div>

        <button
          type="submit"
          :disabled="isLoading || (retypePassword && password !== retypePassword)"
          class="signup-btn">
          <span v-if="isLoading" class="loading-spinner">⏳</span>
          {{ isLoading ? "Creating Account..." : "Create Account" }}
        </button>

        <div v-if="error" class="error-message">
          <span class="error-icon">❌</span>
          {{ error }}
        </div>

        <div v-if="success" class="success-message">
          <span class="success-icon">✅</span>
          {{ success }}
        </div>
      </form>

      <p class="login-link">
        Already have an account?
        <span @click="goToLogin" class="login-action">Sign in here</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import {ref, getCurrentInstance} from "vue";
import {useRouter} from "vue-router";

const router = useRouter();
const {proxy} = getCurrentInstance();
const fsm = proxy.$fsm;
const firstName = ref("");
const lastName = ref("");
const email = ref("");
const role = ref("");
const password = ref("");
const retypePassword = ref("");
const showPassword = ref(false);
const error = ref("");
const success = ref("");
const isLoading = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const handleSignup = async () => {
  error.value = "";
  success.value = "";

  if (password.value !== retypePassword.value) {
    error.value = "Passwords do not match!";
    return;
  }

  isLoading.value = true;

  try {
    const res = await fetch("/fsm/event", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        type: "SIGNUP",
        data: {
          firstName: firstName.value,
          lastName: lastName.value,
          email: email.value,
          password: password.value,
          role: role.value,
        },
      }),
    });

    let data = null;
    try {
      data = await res.json();
    } catch (jsonErr) {
      throw new Error("Invalid server response");
    }

    if (!res.ok) throw new Error(data.error || "Signup failed");

    if (data.success) {
      success.value = "Account created successfully! Redirecting to login...";
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  fsm.send("GO_TO_LOGIN");
  router.push("/login");
};
</script>

<style scoped>
.signup-container {
  background: linear-gradient(135deg, #0a1732 0%, #1a2744 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.form-box {
  background-color: white;
  padding: 3.5rem;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-height: 90vh;
  overflow-y: auto;
}

.signup-header {
  margin-bottom: 2rem;
}

.signup-header h2 {
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

.name-group {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 0.5rem;
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

input,
select {
  display: block;
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

input:focus,
select:focus {
  outline: none;
  border-color: #0a1732;
  box-shadow: 0 0 0 3px rgba(10, 23, 50, 0.1);
}

input:disabled,
select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

select {
  cursor: pointer;
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

.password-mismatch {
  border-color: #dc2626 !important;
}

.password-error {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.signup-btn {
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

.signup-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(10, 23, 50, 0.3);
}

.signup-btn:disabled {
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

.success-message {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  padding: 12px;
  border-radius: 8px;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.error-icon,
.success-icon {
  flex-shrink: 0;
}

.login-link {
  margin-top: 2rem;
  font-size: 0.95rem;
  color: #666;
}

.login-action {
  color: #0a1732;
  cursor: pointer;
  margin-left: 5px;
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.3s ease;
}

.login-action:hover {
  color: #1a2744;
}

@media (max-width: 768px) {
  .name-group {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .form-box {
    padding: 2rem;
  }
}
</style>
