<template>
  <div class="admin-dashboard">
    <h1 class="page-title">Admin Dashboard</h1>

    <div v-if="loading" class="loading">Loading dashboard...</div>

    <div v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-content">
            <h3 class="stat-value">{{ stats.totalUsers }}</h3>
            <p class="stat-label">Total Users</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <h3 class="stat-value">{{ stats.totalWorkouts }}</h3>
            <p class="stat-label">Total Workouts</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <h3 class="stat-value">{{ stats.totalExercises }}</h3>
            <p class="stat-label">Global Exercises</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-content">
            <h3 class="stat-value">{{ stats.activeUsers }}</h3>
            <p class="stat-label">Active Users (7d)</p>
          </div>
        </div>
      </div>

      <div class="recent-users-section">
        <h2 class="section-title">Recent Users</h2>
        <div class="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in recentUsers" :key="user.id">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span :class="['badge', user.role === 'admin' ? 'badge-admin' : 'badge-user']">
                    {{ user.role }}
                  </span>
                </td>
                <td>{{ formatDate(user.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../../services/api';

const loading = ref(false);
const stats = ref({
  totalUsers: 0,
  totalWorkouts: 0,
  totalExercises: 0,
  activeUsers: 0
});
const recentUsers = ref([]);

onMounted(async () => {
  await loadDashboard();
});

async function loadDashboard() {
  loading.value = true;
  try {
    const response = await api.get('/admin/dashboard');
    stats.value = response.data.stats;
    recentUsers.value = response.data.recentUsers;
  } catch (error) {
    alert('Failed to load dashboard');
  } finally {
    loading.value = false;
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 2rem;
  font-weight: 400;
  margin: 0;
  color: #1a1a1a;
}

.stat-label {
  margin: 0;
  color: #666;
  font-size: 0.875rem;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.users-table {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f5f5f5;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e0e0e0;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
}

tbody tr:last-child td {
  border-bottom: none;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-admin {
  background: #ff9800;
  color: white;
}

.badge-user {
  background: #e3f2fd;
  color: #1976d2;
}
</style>