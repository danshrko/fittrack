<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">Fittrack</h1>
      <h2 class="auth-subtitle">Create your account</h2>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            placeholder="John Doe"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="your@email.com"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="6"
            placeholder="••••••••"
            class="form-input"
          />
          <small class="form-hint">Minimum 6 characters</small>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            class="form-input"
          />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
          {{ loading ? 'Creating account...' : 'Register' }}
        </button>
      </form>

      <p class="auth-footer">
        Already have an account?
        <router-link to="/login" class="auth-link">Login here</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

async function handleRegister() {
  error.value = ''
  if (password.value !== confirmPassword.value) return void (error.value = 'Passwords do not match')
  if (password.value.length < 6) return void (error.value = 'Password must be at least 6 characters')

  loading.value = true
  try {
    await authStore.register(name.value, email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = typeof err === 'string' ? err : err?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  padding: 2rem;
}

.auth-card {
  background: white;
  border-radius: 4px;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  border: 1px solid #e0e0e0;
}

.auth-title {
  font-size: 1.5rem;
  text-align: center;
  margin: 0 0 0.5rem 0;
  color: #1a1a1a;
  font-weight: 400;
}

.auth-subtitle {
  text-align: center;
  color: #666;
  margin: 0 0 2rem 0;
  font-weight: 400;
  font-size: 0.9375rem;
}

.auth-form {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
  color: #000000;
  background: white;
}

.form-input::placeholder {
  color: #999;
}

.form-input:focus {
  outline: none;
  border-color: #1a1a1a;
  color: #000000;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  color: #999;
  font-size: 0.8125rem;
}

.error-message {
  background: #fafafa;
  color: #8b0000;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
  border: 1px solid #e0e0e0;
  font-size: 0.9375rem;
}

.btn-block {
  width: 100%;
}

.auth-footer {
  text-align: center;
  color: #666;
  margin: 0;
}

.auth-link {
  color: #1a1a1a;
  text-decoration: none;
  font-weight: 400;
  border-bottom: 1px solid #1a1a1a;
}

.auth-link:hover {
  border-bottom-color: transparent;
}
</style>