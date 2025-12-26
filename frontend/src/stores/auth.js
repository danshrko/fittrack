import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user')) || null);
  const token = ref(localStorage.getItem('token') || null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
      localStorage.setItem('user', JSON.stringify(user.value));
      return response.data;
    } catch (error) {
      const apiError = error?.response?.data?.error
      const msg = apiError || error?.message || 'Login failed'
      throw msg
    }
  }

  async function register(name, email, password) {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', token.value);
      localStorage.setItem('user', JSON.stringify(user.value));
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Registration failed';
    }
  }

  async function getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      user.value = response.data.user;
      localStorage.setItem('user', JSON.stringify(user.value));
      return response.data.user;
    } catch (error) {
      logout();
      throw error;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  async function requestPasswordReset(email) {
    try {
      const response = await api.post('/auth/forgot', { email });
      return response.data;
    } catch (error) {
      const apiError = error?.response?.data?.error;
      const msg = apiError || error?.message || 'Failed to send reset email';
      throw msg;
    }
  }

  async function resetPassword(tokenValue, password) {
    try {
      const response = await api.post('/auth/reset', { token: tokenValue, password });
      return response.data;
    } catch (error) {
      const apiError = error?.response?.data?.error;
      const msg = apiError || error?.message || 'Failed to reset password';
      throw msg;
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    getCurrentUser,
    logout,
    requestPasswordReset,
    resetPassword
  };
});