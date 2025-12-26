<template>
  <div class="exercises-page">
    <div class="page-header">
      <h1 class="page-title">Exercise Library</h1>
      <button @click="showCreateModal = true" class="btn btn-primary">
        + Add Custom Exercise
      </button>
    </div>

    <div class="filters">
      <label for="muscleGroup">Filter by Muscle Group:</label>
      <select id="muscleGroup" v-model="selectedMuscleGroup" @change="filterExercises" class="form-select">
        <option value="">All Groups</option>
        <option value="Chest">Chest</option>
        <option value="Back">Back</option>
        <option value="Legs">Legs</option>
        <option value="Shoulders">Shoulders</option>
        <option value="Arms">Arms</option>
        <option value="Core">Core</option>
        <option value="Cardio">Cardio</option>
      </select>
    </div>

    <div v-if="loading" class="loading">Loading exercises...</div>

    <div v-else class="exercises-grid">
      <div v-for="exercise in filteredExercises" :key="exercise.id" class="exercise-card">
        <div class="exercise-header">
          <h3>{{ exercise.name }}</h3>
          <span v-if="exercise.created_by" class="badge badge-custom">Custom</span>
        </div>
        <div class="exercise-details">
          <span class="exercise-tag">
            {{ formatType(exercise.exercise_type) }}
          </span>
          <span v-if="exercise.exercise_type !== 'cardio'" class="exercise-tag">{{ exercise.muscle_group }}</span>
        </div>
        <div v-if="exercise.created_by" class="exercise-actions">
          <button @click="editExercise(exercise)" class="btn btn-sm btn-secondary">Edit</button>
          <button @click="deleteExercise(exercise.id)" class="btn btn-sm btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal || editingExercise" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editingExercise ? 'Edit Exercise' : 'Create Custom Exercise' }}</h2>
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
import { useExerciseStore } from '../../stores/exercises';

const exerciseStore = useExerciseStore();

const exercises = computed(() => exerciseStore.exercises);
const loading = computed(() => exerciseStore.loading);
const selectedMuscleGroup = ref('');
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

const filteredExercises = computed(() => {
  if (!selectedMuscleGroup.value) {
    return exercises.value;
  }
  return exercises.value.filter(ex => ex.muscle_group === selectedMuscleGroup.value);
});

onMounted(async () => {
  await exerciseStore.fetchExercises();
});

function filterExercises() {
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
      await exerciseStore.updateExercise(editingExercise.value.id, exerciseForm.value);
    } else {
      await exerciseStore.createExercise(exerciseForm.value);
    }
    closeModal();
  } catch (error) {
    alert(error);
  }
}

async function deleteExercise(id) {
  if (!confirm('Are you sure you want to delete this exercise?')) {
    return;
  }

  try {
    await exerciseStore.deleteExercise(id);
  } catch (error) {
    alert(error);
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
.exercises-page {
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

.filters {
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.filters label {
  font-weight: 500;
  color: #333;
}

.form-select {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.exercises-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.exercise-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.exercise-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.exercise-header h3 {
  margin: 0;
  color: #333;
}

.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-custom {
  background: #e3f2fd;
  color: #1976d2;
}

.exercise-details {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.exercise-tag {
  padding: 0.25rem 0.75rem;
  background: #f5f5f5;
  border-radius: 12px;
  font-size: 0.875rem;
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

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}
</style>