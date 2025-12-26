<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1 class="logo">Fittrack</h1>
      <div class="user-info" v-if="user">
        <p class="user-name">{{ user.name }}</p>
        <p class="user-email">{{ user.email }}</p>
        <span class="user-role" v-if="user.role === 'admin'">Admin</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <div v-if="user?.role === 'admin'" class="nav-section">
        <h3 class="nav-section-title">Admin</h3>
        <NavLink to="/admin" label="Dashboard" />
        <NavLink to="/admin/exercises" label="Exercises" />
        <NavLink to="/admin/users" label="Users" />
      </div>

      <div class="nav-section">
        <h3 class="nav-section-title">Overview</h3>
        <NavLink to="/" label="Dashboard" />
        <NavLink to="/profile" label="Profile" />
      </div>

      <div class="nav-section">
        <h3 class="nav-section-title">Workouts</h3>
        <NavLink to="/templates" label="Templates" />
        <NavLink to="/workout/start" label="Quick Workout" />
        <NavLink to="/history" label="History" />
      </div>

      <div class="nav-section">
        <h3 class="nav-section-title">Exercises</h3>
        <NavLink to="/exercises" label="Exercise Library" />
      </div>
    </nav>

    <div class="sidebar-footer">
      <button @click="handleLogout" class="logout-btn">Logout</button>
    </div>
  </aside>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import NavLink from './NavLink.vue';

const router = useRouter();
const authStore = useAuthStore();
const user = authStore.user;

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 250px;
  height: 100vh;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.logo {
  font-size: 1.25rem;
  font-weight: 400;
  margin: 0 0 1rem 0;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

.user-info {
  font-size: 0.8125rem;
}

.user-name {
  font-weight: 400;
  margin: 0 0 0.25rem 0;
  color: #1a1a1a;
}

.user-email {
  margin: 0 0 0.5rem 0;
  color: #666;
  font-size: 0.75rem;
}

.user-role {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #f5f5f5;
  color: #1a1a1a;
  border-radius: 2px;
  font-size: 0.6875rem;
  font-weight: 400;
  border: 1px solid #e0e0e0;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.nav-section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #999;
  margin: 0 0 0.5rem 0;
  padding: 0 0.5rem;
  font-weight: 600;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
}

.logout-btn {
  width: 100%;
  padding: 0.625rem;
  background: white;
  color: #1a1a1a;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-weight: 400;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.15s;
}

.logout-btn:hover {
  background: #fafafa;
  border-color: #b0b0b0;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
}
</style>