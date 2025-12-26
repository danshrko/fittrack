<template>
  <div class="exercises-page">
    <div class="page-header">
      <h1 class="page-title">Exercise Library</h1>
      <button @click="createModalVisible = true" class="btn btn-primary">
        + Add Custom Exercise
      </button>
    </div>

    <div class="filters">
    <label for="muscleGroup">Filter by Muscle Group:</label>
    <select id="muscleGroup" v-model="selMuscle" @change="filterExercises" class="form-select">
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
          <div style="display:flex;gap:0.5rem;align-items:center;">
            <template v-if="authStore.isAuthenticated">
              <button @click.stop="openHist(exercise)" class="btn btn-sm btn-outline">History</button>
            </template>
            <template v-else>
              <span class="history-locked">Log in to view history</span>
            </template>
            <span v-if="exercise.created_by" class="badge badge-custom">Custom</span>
          </div>
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

    <div v-if="createModalVisible || editEx" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2>{{ editEx ? 'Edit Exercise' : 'Create Custom Exercise' }}</h2>
        <form @submit.prevent="saveExercise">
          <div class="form-group">
            <label>Name</label>
            <input v-model="formExercise.name" type="text" required class="form-input" />
          </div>

          <div class="form-group">
            <label>Muscle Group</label>
            <select v-model="formExercise.muscle_group" required class="form-input">
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
            <select v-model="formExercise.exercise_type" required class="form-input">
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
    <div v-if="showHistModal" class="modal-overlay" @click="closeHist">
      <div class="modal-content" @click.stop>
        <h2>History — {{ activeExercise ? activeExercise.name : '' }}</h2>
        <div v-if="histLoading">Loading history...</div>
        <div v-else>
          <div v-if="histError" class="history-empty">{{ histError }}</div>
          <div v-else-if="histSets.length === 0" class="history-empty">No history recorded for this exercise.</div>
          <div v-else class="history-list">
            <div v-for="group in groupedHist" :key="group.date" class="history-group">
              <div class="history-date-header">{{ fmtDateShort(group.date) }}</div>
              <ul>
                <li v-for="(s, idx) in group.sets" :key="group.date + '-' + idx">
                  <div class="history-row">
                    <div class="history-row-main">Set {{ s.set_number }} — {{ s.reps }} reps</div>
                    <div class="history-row-meta">
                      <span v-if="s.weight_kg !== null">{{ s.weight_kg }} kg</span>
                      <span v-if="s.duration_seconds !== null"> • {{ s.duration_seconds }}s</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeHist">Close</button>
        </div>
      </div>
    </div>

  </div>
  </template>

  <script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useExerciseStore } from '../../stores/exercises';
  import { useAuthStore } from '../../stores/auth';
  import api from '../../services/api';

const exerciseStore = useExerciseStore();
const authStore = useAuthStore();

const exercises = computed(() => exerciseStore.exercises);
const loading = computed(() => exerciseStore.loading);
const selMuscle = ref('');
const createModalVisible = ref(false);
const editEx = ref(null);

const formExercise = ref({ name: '', muscle_group: '', exercise_type: '' });

const showExerciseType = computed(() => formExercise.value.muscle_group !== 'Cardio');

watch(() => formExercise.value.muscle_group, (val) => {
  if (val === 'Cardio') {
    formExercise.value.exercise_type = 'cardio';
  } else if (formExercise.value.exercise_type === 'cardio') {
    formExercise.value.exercise_type = '';
  }
});

const filteredExercises = computed(() => {
  if (!selMuscle.value) {
    return exercises.value;
  }
  return exercises.value.filter(ex => ex.muscle_group === selMuscle.value);
});

onMounted(async () => {
  await exerciseStore.fetchExercises();
});

function filterExercises() {}

function editExercise(exercise) {
  editEx.value = exercise;
  formExercise.value = { name: exercise.name, muscle_group: exercise.muscle_group, exercise_type: exercise.exercise_type };
}

function closeModal() {
  createModalVisible.value = false;
  editEx.value = null;
  formExercise.value = { name: '', muscle_group: '', exercise_type: '' };
}

const showHistModal = ref(false);
const histLoading = ref(false);
const histSets = ref([]);
const histError = ref(null);
const activeExercise = ref(null);

async function openHist(exercise) {
  activeExercise.value = exercise;
  showHistModal.value = true;
  histLoading.value = true;
  histSets.value = [];
  try {
    const res = await api.get(`/stats/exercise/${exercise.id}/history?limit=20`);
    histSets.value = res.data.history || [];
    histError.value = histSets.value.length === 0 ? 'No history recorded for this exercise.' : null;
  } catch (err) {
    console.error('Fetch history error', err);
    histSets.value = [];
    const status = err?.response?.status;
    if (status === 401) {
      histError.value = 'You must be logged in to view history.';
    } else if (status === 403) {
      histError.value = 'You are not authorized to view this history.';
    } else {
      histError.value = 'Could not load history (server error).';
    }
  } finally {
    histLoading.value = false;
  }
}

function closeHist() {
  showHistModal.value = false;
  histSets.value = [];
  activeExercise.value = null;
}

function formatDate(d) {
  try { return new Date(d).toLocaleString(); } catch (e) { return d; }
}

const groupedHist = computed(() => {
  const map = {};
  for (const s of histSets.value || []) {
    const dateKey = s.date_completed ? new Date(s.date_completed).toISOString().slice(0, 10) : 'unknown';
    if (!map[dateKey]) map[dateKey] = [];
    map[dateKey].push(s);
  }
  return Object.keys(map).sort((a, b) => b.localeCompare(a)).map(d => ({ date: d, sets: map[d] }));
});

function fmtDateShort(dateStr) { try { return new Date(dateStr).toLocaleDateString(); } catch (e) { return dateStr; } }

async function saveExercise() {
  try {
    if (editEx.value) {
      await exerciseStore.updateExercise(editEx.value.id, formExercise.value);
    } else {
      await exerciseStore.createExercise(formExercise.value);
    }
    closeModal();
  } catch (error) { alert(error); }
}

async function deleteExercise(id) {
  if (!confirm('Are you sure you want to delete this exercise?')) return;
  try { await exerciseStore.deleteExercise(id); } catch (error) { alert(error); }
}

function formatType(type) { if (type === 'strength') return 'Weights'; if (type === 'cardio') return 'Cardio'; if (type === 'bodyweight') return 'Bodyweight'; return type; }
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
  background: #e9f1f8;
  color: #333;
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

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.history-date-header {
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.history-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}
.history-row-main {
  color: #333;
}
.history-row-meta {
  color: #666;
}
.history-empty {
  color: #666;
  padding: 1rem 0;
}
</style>