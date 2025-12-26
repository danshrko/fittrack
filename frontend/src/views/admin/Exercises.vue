<template>
  <div class="admin-exercises-page">
    <div class="page-header">
      <h1 class="page-title">Manage Global Exercises</h1>
      <button @click="showCreateModal = true" class="btn btn-primary">
        + Add Global Exercise
      </button>
    </div>

    <div v-if="loading" class="loading">Loading exercises...</div>

    <div v-else class="exercises-list">
      <div v-for="group in groupedExercises" :key="group.muscle_group" class="exercise-group">
        <h2 class="group-title">{{ group.muscle_group }}</h2>
        <div class="exercises-grid">
          <div v-for="exercise in group.exercises" :key="exercise.id" class="exercise-card">
            <div class="exercise-header">
              <h3>{{ exercise.name }}</h3>
              <span class="exercise-type">
                {{ formatType(exercise.exercise_type) }}
              </span>
            </div>
            <div class="exercise-actions">
              <button @click="editExercise(exercise)" class="btn btn-sm btn-secondary">Edit</button>
              <button @click="deleteExercise(exercise.id)" class="btn btn-sm btn-danger">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal || editingExercise" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editingExercise ? 'Edit Global Exercise' : 'Create Global Exercise' }}</h2>
        <form @submit.prevent="saveExercise">
          <div class="form-group">
            <label>Name</label>
            <input v-model="exerciseForm.name" type="text" required class="form-input" />
          </div>

          <div class="form-group">
            <label>Muscle Group</label>
            <select v-model="exerciseForm.muscle_group" required class="form-input">
              <option value="">Select...</option>
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Legs">Legs</option>
              <option value="Shoulders">Shoulders</option>
              <option value="Arms">Arms</option>
              <option value="Core">Core</option>
              <option value="Cardio">Cardio</option>
            </select>
          </div>

          <div class="form-group" v-if="showExerciseType">
            <label>Exercise Type</label>
            <select v-model="exerciseForm.exercise_type" required class="form-input">
              <option value="">Select...</option>
              <option value="strength">Weights</option>
              <option value="cardio">Cardio</option>
              <option value="bodyweight">Bodyweight</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from '../../services/api';

const loading = ref(false);
const exercises = ref([]);
const showCreateModal = ref(false);
const editingExercise = ref(null);

const exerciseForm = ref({
  name: '',
  muscle_group: '',
  exercise_type: ''
});

const showExerciseType = computed(() => exerciseForm.value.muscle_group !== 'Cardio');

watch(() => exerciseForm.value.muscle_group, (val) => {
  if (val === 'Cardio') {
    exerciseForm.value.exercise_type = 'cardio';
  } else if (exerciseForm.value.exercise_type === 'cardio') {
    exerciseForm.value.exercise_type = '';
  }
});

const groupedExercises = computed(() => {
  const groups = {};
  exercises.value.forEach(ex => {
    if (!groups[ex.muscle_group]) {
      groups[ex.muscle_group] = [];
    }
    groups[ex.muscle_group].push(ex);
  });
  return Object.keys(groups).map(mg => ({
    muscle_group: mg,
    exercises: groups[mg]
  }));
});

onMounted(async () => {
  await loadExercises();
});

async function loadExercises() {
  loading.value = true;
  try {
    const response = await api.get('/admin/exercises');
    exercises.value = response.data.exercises;
  } catch (error) {
    alert('Failed to load exercises');
  } finally {
    loading.value = false;
  }
}

function editExercise(exercise) {
  editingExercise.value = exercise;
  exerciseForm.value = {
    name: exercise.name,
    muscle_group: exercise.muscle_group,
    exercise_type: exercise.exercise_type
  };
}

function closeModal() {
  showCreateModal.value = false;
  editingExercise.value = null;
  exerciseForm.value = {
    name: '',
    muscle_group: '',
    exercise_type: ''
  };
}

async function saveExercise() {
  try {
    if (editingExercise.value) {
      await api.put(`/admin/exercises/${editingExercise.value.id}`, exerciseForm.value);
    } else {
      await api.post('/admin/exercises', exerciseForm.value);
    }
    await loadExercises();
    closeModal();
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to save exercise');
  }
}

async function deleteExercise(id) {
  if (!confirm('Are you sure you want to delete this global exercise?')) {
    return;
  }

  try {
    await api.delete(`/admin/exercises/${id}`);
    await loadExercises();
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to delete exercise');
  }
}

function formatType(type) {
  if (type === 'strength') return 'Weights';
  if (type === 'cardio') return 'Cardio';
  if (type === 'bodyweight') return 'Bodyweight';
  return type;
}
</script>

<style scoped>
.admin-exercises-page {
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

.exercise-group {
  margin-bottom: 3rem;
}

.group-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #333;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.exercises-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.exercise-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.exercise-header h3 {
  margin: 0;
  color: #333;
  font-size: 1rem;
}

.exercise-type {
  padding: 0.25rem 0.5rem;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 0.75rem;
  color: #666;
}

.exercise-actions {
  display: flex;
  gap: 0.5rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
}

.modal-content h2 {
  margin: 0 0 1.5rem 0;
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>

