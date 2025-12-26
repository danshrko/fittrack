<template>
  <div class="admin-users-page">
    <h1 class="page-title">All Users</h1>

    <div v-if="loading" class="loading">Loading users...</div>

    <div v-else class="users-table-container">
      <div class="users-filters">
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or email"
          class="filter-input"
        />
        <select v-model="roleFilter" class="filter-select">
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <table class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>{{ user.id }}</td>
            <td>
              <div v-if="editingUserId === user.id" class="inline-form">
                <input
                  v-model="editForm.name"
                  type="text"
                  class="input-sm"
                  placeholder="Name"
                />
              </div>
              <div v-else>
                {{ user.name }}
              </div>
            </td>
            <td>
              <div v-if="editingUserId === user.id" class="inline-form">
                <input
                  v-model="editForm.email"
                  type="email"
                  class="input-sm"
                  placeholder="Email"
                />
              </div>
              <div v-else>
                {{ user.email }}
              </div>
            </td>
            <td>
              <div v-if="editingUserId === user.id" class="inline-form">
                <select v-model="editForm.role" class="input-sm">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div v-else>
                <span :class="['badge', user.role === 'admin' ? 'badge-admin' : 'badge-user']">
                  {{ user.role }}
                </span>
              </div>
            </td>
            <td>{{ formatDate(user.created_at) }}</td>
            <td class="actions-cell">
              <div v-if="editingUserId === user.id" class="actions-inline">
                <button
                  @click="saveUser(user.id)"
                  class="btn btn-sm btn-primary"
                >
                  Save
                </button>
                <button
                  @click="cancelEdit"
                  class="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
              </div>
              <div v-else class="actions-inline">
                <button
                  @click="startEdit(user)"
                  class="btn btn-sm btn-secondary"
                >
                  Edit
                </button>
                <button
                  v-if="user.role !== 'admin'"
                  @click="changeRole(user, 'admin')"
                  class="btn btn-sm btn-outline"
                >
                  Make admin
                </button>
                <button
                  v-else
                  @click="changeRole(user, 'user')"
                  class="btn btn-sm btn-outline"
                >
                  Make user
                </button>
                <button
                  v-if="user.id !== currentUserId"
                  @click="deleteUser(user.id)"
                  class="btn btn-sm btn-danger"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '../../services/api';
import { useAuthStore } from '../../stores/auth';

const loading = ref(false);
const users = ref([]);
const editingUserId = ref(null);
const editForm = ref({
  name: '',
  email: '',
  role: 'user'
});

const authStore = useAuthStore();
const currentUserId = authStore.user?.id ?? null;

const search = ref('');
const roleFilter = ref('');

const filteredUsers = computed(() => {
  let list = users.value || [];

  if (search.value) {
    const s = search.value.toLowerCase();
    list = list.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(s) || email.includes(s);
    });
  }

  if (roleFilter.value) {
    list = list.filter(u => u.role === roleFilter.value);
  }

  return list;
});

onMounted(async () => {
  await loadUsers();
});

async function loadUsers() {
  loading.value = true;
  try {
    const response = await api.get('/users');
    users.value = response.data.users;
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to load users');
  } finally {
    loading.value = false;
  }
}

function startEdit(user) {
  editingUserId.value = user.id;
  editForm.value = {
    name: user.name || '',
    email: user.email || '',
    role: user.role || 'user'
  };
}

function cancelEdit() {
  editingUserId.value = null;
}

async function saveUser(id) {
  try {
    await api.put(`/users/${id}`, {
      name: editForm.value.name,
      email: editForm.value.email,
      role: editForm.value.role
    });
    editingUserId.value = null;
    await loadUsers();
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to update user');
  }
}

async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) {
    return;
  }

  try {
    await api.delete(`/users/${id}`);
    await loadUsers();
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to delete user');
  }
}

async function changeRole(user, role) {
  if (!confirm(`Change role for ${user.email} to "${role}"?`)) {
    return;
  }

  try {
    await api.put(`/users/${user.id}`, { role });
    await loadUsers();
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to update user role');
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>

<style scoped>
.admin-users-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #333;
}

.users-table-container {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

.users-filters {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.filter-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  border: 1px solid #d0d0d0;
  font-size: 0.875rem;
  background-color: #f5f5f5;
  color: #333;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  border: 1px solid #d0d0d0;
  font-size: 0.875rem;
  background-color: #f5f5f5;
  color: #333;
}

.users-table {
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

.inline-form {
  display: flex;
  gap: 0.25rem;
}

.input-sm {
  width: 100%;
  padding: 0.25rem 0.5rem;
  font-size: 0.8125rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  background-color: #f7f7f7;
  color: #333;
}

.actions-cell {
  width: 260px;
}

.actions-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background: #f9f9f9;
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

.btn {
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-primary {
  background: #111111;
  color: white;
}

.btn-secondary {
  background: #f5f5f5;
  color: #111111;
  border-color: #e0e0e0;
}

.btn-outline {
  background: white;
  color: #333;
  border-color: #d0d0d0;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-ghost {
  background: transparent;
  color: #666;
  border-color: transparent;
}
</style>