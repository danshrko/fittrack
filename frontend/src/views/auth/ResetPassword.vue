<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">Fittrack</h1>
      <h2 class="auth-subtitle">Choose a new password</h2>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="password">New password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="6"
            placeholder="••••••••"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="6"
            placeholder="••••••••"
            class="form-input"
          />
        </div>

        <div v-if="message" class="success-message">{{ message }}</div>
        <div v-if="error" class="error-message">{{ error }}</div>

        <button type="submit" :disabled="loading" class="btn btn-primary btn-block">
          {{ loading ? 'Updating...' : 'Update password' }}
        </button>
      </form>

      <p class="auth-footer">
        Back to
        <router-link to="/login" class="auth-link">login</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const token = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const message = ref('');
const error = ref('');

onMounted(() => {
  token.value = route.query.token || '';
});

async function handleSubmit() {
  error.value = ''
  message.value = ''
  if (!token.value) return void (error.value = 'Reset link is missing or invalid.')
  if (password.value !== confirmPassword.value) return void (error.value = 'Passwords do not match')

  loading.value = true
  try {
    await authStore.resetPassword(token.value, password.value)
    message.value = 'Password updated. You can now log in.'
    setTimeout(() => router.push('/login'), 1000)
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