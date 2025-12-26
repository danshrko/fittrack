import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const usr = ref(JSON.parse(localStorage.getItem('user')) || null);
  const tok = ref(localStorage.getItem('token') || null);

  const isAuthenticated = computed(() => !!tok.value);

  async function login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      tok.value = response.data.token;
      usr.value = response.data.user;
      localStorage.setItem('token', tok.value);
      localStorage.setItem('user', JSON.stringify(usr.value));
      return response.data;
    } catch (error) {
      const apiError = error?.response?.data?.error;
      const msg = apiError || error?.message || 'Login failed';
      throw msg;
    }
  }

  async function register(name, email, password) {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      tok.value = response.data.token;
      usr.value = response.data.user;
      localStorage.setItem('token', tok.value);
      localStorage.setItem('user', JSON.stringify(usr.value));
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Registration failed';
    }
  }

  async function getCurrentUser() {
    try {
      const response = await api.get('/auth/me');
      usr.value = response.data.user;
      localStorage.setItem('user', JSON.stringify(usr.value));
      return response.data.user;
    } catch (error) {
      doLogout();
      throw error;
    }
  }

  function doLogout() {
    usr.value = null;
    tok.value = null;
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
    user: usr,
    token: tok,
    isAuthenticated,
    login,
    register,
    getCurrentUser,
    logout: doLogout,
    requestPasswordReset,
    resetPassword
  };
});