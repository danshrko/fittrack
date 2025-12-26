<template>
  <div class="templates-page">
    <div class="page-header">
      <h1 class="page-title">Workout Templates</h1>
      <router-link to="/templates/create" class="btn btn-primary">
        + Create Workout
      </router-link>
    </div>

    <div v-if="loading" class="loading">Loading templates...</div>

    <div v-else-if="templates.length === 0" class="empty-state">
      <p>No templates yet. Create your first workout template!</p>
      <router-link to="/templates/create" class="btn btn-primary">Create Template</router-link>
    </div>

    <div v-else class="templates-grid">
      <div v-for="template in templates" :key="template.id" class="template-card">
        <div class="template-header">
            <h3>{{ template.name }}</h3>
            <div class="template-actions">
              <router-link :to="`/templates/${template.id}/edit`" class="btn btn-sm btn-secondary">Edit</router-link>
              <button @click="deleteTemplate(template.id)" class="btn btn-sm btn-danger">Delete</button>
            </div>
        </div>
        <p v-if="template.notes" class="template-notes">{{ template.notes }}</p>
        <p class="template-date">Updated: {{ formatDate(template.updated_at) }}</p>
        <div class="template-footer">
          <router-link :to="`/workout/start/${template.id}`" class="btn btn-primary btn-block">
            Start Workout
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useTemplateStore } from '../../stores/templates';

const templateStore = useTemplateStore();

const templates = computed(() => templateStore.templates);
const loading = computed(() => templateStore.loading);

onMounted(async () => {
  await templateStore.fetchTemplates();
});

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function deleteTemplate(id) {
  if (!confirm('Are you sure you want to delete this template?')) {
    return;
  }

  try {
    await templateStore.deleteTemplate(id);
  } catch (error) {
    const message = error?.response?.data?.error || error.message || 'Failed to delete template';
    alert(message);
  }
}
</script>

<style scoped>
.templates-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  margin: 0;
  color: #333;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
}

.empty-state p {
  margin-bottom: 1.5rem;
  color: #666;
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.template-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.template-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.template-header h3 {
  margin: 0;
  color: #333;
  flex: 1;
}

.template-actions {
  display: flex;
  gap: 0.5rem;
}

.template-notes {
  color: #666;
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
}

.template-date {
  color: #999;
  font-size: 0.75rem;
  margin: 0 0 1rem 0;
}

.template-footer {
  margin-top: 1rem;
}

.btn-block {
  width: 100%;
}
</style> 