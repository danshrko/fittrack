<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">Fittrack</h1>
      <h2 class="auth-subtitle">Reset your password</h2>

      <form @submit.prevent="handleSubmit" class="auth-form">
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

        <div v-if="message" class="success-message">{{ message }}</div>
        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
          {{ loading ? 'Sending...' : 'Send reset link' }}
        </button>
      </form>

      <p class="auth-footer">
        Remembered your password?
        <router-link to="/login" class="auth-link">Back to login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();
const email = ref('');
const loading = ref(false);
const message = ref('');
const error = ref('');

async function handleSubmit() {
  message.value = ''
  error.value = ''
  loading.value = true
  try {
    await authStore.requestPasswordReset(email.value)
    message.value = 'If that account exists, a reset email has been sent.'
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.success-message {
  background: #e7f6ec;
  color: #146a2d;
  padding: 0.75rem 1rem;
  border: 1px solid #c2e4ce;
  border-radius: 6px;
  margin-bottom: 1rem;
}
</style>