<template>
  <div class="profile-page">
    <h1 class="page-title">My Profile</h1>

    <form @submit.prevent="saveProfile" class="profile-form">
      <h2 class="section-title">Account details</h2>

      <div class="form-group">
        <label>Name</label>
        <input v-model="form.name" type="text" required class="form-input" />
      </div>

      <div class="form-group">
        <label>Email</label>
        <input v-model="form.email" type="email" required class="form-input" />
      </div>

      <p v-if="message" class="info-message">{{ message }}</p>
      <p v-if="error" class="error-message">{{ error }}</p>

      <div class="form-actions">
        <button type="submit" :disabled="saving" class="btn btn-primary">
          {{ saving ? 'Saving...' : 'Save changes' }}
        </button>
      </div>
    </form>

    <form @submit.prevent="changePassword" class="profile-form">
      <h2 class="section-title">Change password</h2>

      <div class="form-group">
        <label>Current password</label>
        <input
          v-model="passwordForm.currentPassword"
          type="password"
          required
          class="form-input"
        />
      </div>

      <div class="form-group">
        <label>New password</label>
        <input
          v-model="passwordForm.newPassword"
          type="password"
          required
          minlength="6"
          class="form-input"
        />
        <small class="form-hint">Minimum 6 characters</small>
      </div>

      <p v-if="passwordMessage" class="info-message">{{ passwordMessage }}</p>
      <p v-if="passwordError" class="error-message">{{ passwordError }}</p>

      <div class="form-actions">
        <button type="submit" :disabled="passwordSaving" class="btn btn-secondary">
          {{ passwordSaving ? 'Updating...' : 'Update password' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();

const profileForm = ref({ name: authStore.user?.name || '', email: authStore.user?.email || '' });

const isSaving = ref(false);
const infoMsg = ref('');
const errMsg = ref('');

const pwdForm = ref({ currentPassword: '', newPassword: '' });
const pwdSaving = ref(false);
const pwdMsg = ref('');
const pwdErr = ref('');

async function saveProfile() {
  if (!profileForm.value.name.trim() || !profileForm.value.email.trim()) {
    errMsg.value = 'Name and email are required.';
    infoMsg.value = '';
    return;
  }

  isSaving.value = true;
  errMsg.value = '';
  infoMsg.value = '';

  try {
    const response = await api.put('/auth/profile', { name: profileForm.value.name.trim(), email: profileForm.value.email.trim() });
    authStore.user = response.data.user;
    localStorage.setItem('user', JSON.stringify(response.data.user));
    infoMsg.value = 'Profile updated.';
  } catch (err) {
    errMsg.value = err.response?.data?.error || 'Failed to update profile';
  } finally {
    isSaving.value = false;
  }
}

async function changePassword() {
  pwdErr.value = '';
  pwdMsg.value = '';

  if (!pwdForm.value.currentPassword || !pwdForm.value.newPassword) {
    pwdErr.value = 'Both current and new password are required.';
    return;
  }

  pwdSaving.value = true;

  try {
    await api.put('/auth/password', { currentPassword: pwdForm.value.currentPassword, newPassword: pwdForm.value.newPassword });
    pwdForm.value.currentPassword = '';
    pwdForm.value.newPassword = '';
    pwdMsg.value = 'Password updated successfully.';
  } catch (err) {
    pwdErr.value = err.response?.data?.error || 'Failed to update password';
  } finally {
    pwdSaving.value = false;
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 500px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.profile-form {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
  color: #333;
}

.info-message {
  color: #2e7d32;
  margin: 0 0 0.75rem 0;
}

.error-message {
  color: #c62828;
  margin: 0 0 0.75rem 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}
</style>