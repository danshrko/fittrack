<template>
  <div class="workout-page">
    <div class="workout-header">
      <h1 class="page-title">{{ workoutName }}</h1>
      <div class="workout-actions-inline">
        <button v-if="!isTemplate" @click="showExerciseModal = true" class="btn btn-secondary btn-sm">
          Add Exercise
        </button>
        <button v-if="!isTemplate && !currentSessionId" @click="startQuickWorkout" class="btn btn-primary btn-sm">
          Start Quick Workout
        </button>
        <div class="workout-timer">
          <span>Duration: {{ formatDuration(workoutDuration) }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading workout...</div>

    <div v-else class="workout-content">
      <div v-for="(exercise, exIndex) in exercises" :key="exercise.id || exIndex" class="exercise-section">
            <div class="exercise-header">
              <h3>{{ exercise.name }}</h3>
          <div class="exercise-meta">
            <span class="exercise-type">{{ formatType(exercise.exercise_type) }}</span>
            <span v-if="exercise.exercise_type !== 'cardio' && exercise.muscle_group" class="exercise-muscle">{{ exercise.muscle_group }}</span>
            <button v-if="!currentSessionId" class="btn btn-sm btn-secondary" @click="removeExercise(exIndex)">Remove</button>
          </div>
        </div>

        <p v-if="exercise.notes" class="exercise-notes">{{ exercise.notes }}</p>

        <div class="sets-container">
          <div v-for="(set, setIndex) in exercise.sets" :key="setIndex" :class="['set-row', { completed: set.completed }]">
            <label class="set-checkbox">
              <input type="checkbox" v-model="set.completed" />
            </label>
            <span class="set-number">Set {{ setIndex + 1 }}</span>
            <div class="set-inputs">
              <input
                v-if="exercise.exercise_type === 'cardio'"
                v-model.number="set.duration_minutes"
                type="number"
                placeholder="Duration (min)"
                class="form-input set-input"
                min="0"
              />
              <input
                v-if="exercise.exercise_type === 'strength' || exercise.exercise_type === 'bodyweight'"
                v-model.number="set.weight_kg"
                type="number"
                step="1"
                :placeholder="exercise.exercise_type === 'bodyweight' ? 'Extra Weight (kg)' : 'Weight (kg)'"
                class="form-input set-input"
                min="0"
              />
              
            </div>
            <button @click="removeSet(exIndex, setIndex)" class="btn btn-sm btn-danger">Remove</button>
          </div>
        </div>

        <button @click="addSet(exIndex)" class="btn btn-secondary btn-sm">+ Add Set</button>
      </div>

      <div class="workout-actions">
        <button @click="cancelWorkout" class="btn btn-secondary">Cancel Workout</button>
        <button @click="completeWorkout" :disabled="!currentSessionId" class="btn btn-primary">
          Complete Workout
        </button>
      </div>

      <div v-if="showExerciseModal" class="modal-overlay" @click="showExerciseModal = false">
        <div class="modal-content" @click.stop>
          <h2>Select Exercise</h2>
          <div class="exercise-search">
            <input v-model="exerciseSearch" type="text" placeholder="Search exercises..." class="form-input" />
          </div>
          <div class="exercise-list-modal">
            <div
              v-for="exercise in filteredAvailableExercises"
              :key="exercise.id"
              @click="addExercise(exercise)"
              class="exercise-option"
            >
              <h4>{{ exercise.name }}</h4>
              <span class="exercise-option-meta">
                 {{ formatType(exercise.exercise_type) }}<span v-if="exercise.exercise_type !== 'cardio' && exercise.muscle_group"> • {{ exercise.muscle_group }}</span>
              </span>
            </div>
          </div>
          <button @click="showExerciseModal = false" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTemplateStore } from '../../stores/templates';
import { useSessionStore } from '../../stores/sessions';
import { useExerciseStore } from '../../stores/exercises';

const route = useRoute();
const router = useRouter();
const templateStore = useTemplateStore();
const sessionStore = useSessionStore();
const exerciseStore = useExerciseStore();

const isTemplate = computed(() => !!route.params.id);
const loading = ref(false);
const workoutName = ref('Quick Workout');
const currentSessionId = ref(null);
const workoutStartTime = ref(null);
const workoutDuration = ref(0);
const exercises = ref([]);
const showExerciseModal = ref(false);
const exerciseSearch = ref('');
const sessionExercisesCache = ref([]);
let timerInterval = null;

const availableExercises = computed(() => exerciseStore.exercises || []);
const filteredAvailableExercises = computed(() => {
  const term = exerciseSearch.value.trim().toLowerCase();
  return availableExercises.value
    .filter(ex => !exercises.value.some(e => e.exercise_id === ex.id))
    .filter(ex => !term || ex.name.toLowerCase().includes(term) || ex.muscle_group?.toLowerCase().includes(term));
});

onMounted(async () => {
  await exerciseStore.fetchExercises();
  await startWorkout();
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});

function buildSessionExerciseMap(sessionExercises) {
  const map = new Map();
  sessionExercises.forEach(se => {
    if (!map.has(se.exercise_id)) {
      map.set(se.exercise_id, []);
    }
    map.get(se.exercise_id).push(se);
  });
  return map;
}

function formatType(type) {
  if (type === 'strength') return 'Weights';
  if (type === 'cardio') return 'Cardio';
  if (type === 'bodyweight') return 'Bodyweight';
  return type;
}

function resolveSessionExerciseId(exercise, sessionExerciseMap, usedSessionExerciseIds) {
  if (exercise.session_exercise_id && !usedSessionExerciseIds.has(exercise.session_exercise_id)) {
    return exercise.session_exercise_id;
  }

  const candidates = sessionExerciseMap.get(exercise.exercise_id) || [];
  const available = candidates.find(c => !usedSessionExerciseIds.has(c.id));
  return available ? available.id : null;
}

function findSessionExerciseId(exerciseId) {
  return sessionExercisesCache.value.find(se => se.exercise_id === exerciseId)?.id || null;
}

async function startWorkout() {
  loading.value = true;

  try {
    const templateId = route.params.id;
    let template = null;
    let lastSession = null;

    if (templateId) {
      template = await templateStore.fetchTemplate(templateId);
      workoutName.value = template.name;
      lastSession = await sessionStore.fetchLastSessionForTemplate(templateId);
    } else {
      loading.value = false;
      return;
    }

    await startSessionWithExercises(template, lastSession);
  } catch (error) {
    console.error('Start workout error:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to start workout';
    alert(errorMessage);
    router.push('/');
  } finally {
    loading.value = false;
  }
}

async function startSessionWithExercises(template, lastSession) {
  const sessionData = {
    name: template ? template.name : 'Quick Workout',
    template_id: template ? template.id : null
  };

  if (template && template.exercises) {
    sessionData.exercises = template.exercises.map(ex => ({
      exercise_id: ex.exercise_id,
      notes: ex.notes || null
    }));
  } else {
    sessionData.exercises = exercises.value.map(ex => ({
      exercise_id: ex.exercise_id,
      notes: ex.notes || null
    }));
  }

  const session = await sessionStore.startSession(sessionData);
  currentSessionId.value = session.id;
  workoutStartTime.value = new Date();

  await attachSessionExerciseIds();

  if (template && template.exercises) {
    exercises.value = template.exercises.map(ex => {
      const lastExData = lastSession?.exercises?.find(le => le.exercise_id === ex.exercise_id);
      const lastSets = lastExData?.sets || [];

      return {
        id: null,
        exercise_id: ex.exercise_id,
        name: ex.name,
        exercise_type: ex.exercise_type,
        muscle_group: ex.muscle_group,
        notes: ex.notes || null,
        session_exercise_id: findSessionExerciseId(ex.exercise_id),
        sets: lastSets.length > 0
          ? lastSets.map(s => ({
              reps: s.reps || null,
              weight_kg: s.weight_kg != null ? s.weight_kg : null,
              duration_minutes: s.duration_seconds != null ? Math.round(s.duration_seconds / 60) : null,
              completed: false
            }))
          : [{ reps: null, weight_kg: null, duration_minutes: null, completed: false }]
      };
    });
  }

  startTimer();
}

async function startQuickWorkout() {
  if (exercises.value.length === 0) {
    alert('Add at least one exercise to start a quick workout.');
    return;
  }

  loading.value = true;
  try {
    await startSessionWithExercises(null, null);
  } catch (error) {
    console.error('Start workout error:', error);
    const errorMessage = error.response?.data?.error || error.message || 'Failed to start workout';
    alert(errorMessage);
    router.push('/');
  } finally {
    loading.value = false;
  }
}

function startTimer() {
  timerInterval = setInterval(() => {
    if (workoutStartTime.value) {
      const now = new Date();
      workoutDuration.value = Math.floor((now - workoutStartTime.value) / 1000);
    }
  }, 1000);
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function addExercise(exercise) {
  const newExercise = {
    id: null,
    exercise_id: exercise.id,
    name: exercise.name,
    exercise_type: exercise.exercise_type,
    muscle_group: exercise.muscle_group,
    session_exercise_id: null,
      sets: [{ reps: null, weight_kg: null, duration_minutes: null, completed: false }]
  };

  if (currentSessionId.value) {
    await addExerciseToActiveSession(newExercise);
  } else {
    exercises.value.push(newExercise);
  }

  showExerciseModal.value = false;
  exerciseSearch.value = '';
}

function removeExercise(index) {
  exercises.value.splice(index, 1);
}

function addSet(exerciseIndex) {
  exercises.value[exerciseIndex].sets.push({
    reps: null,
    weight_kg: null,
    duration_minutes: null,
    completed: false
  });
}

function removeSet(exerciseIndex, setIndex) {
  exercises.value[exerciseIndex].sets.splice(setIndex, 1);
}

async function completeWorkout() {
  if (!currentSessionId.value) return;

  try {
    const session = await sessionStore.fetchSession(currentSessionId.value);
    const sessionExerciseMap = buildSessionExerciseMap(session.exercises || []);
    const usedSessionExerciseIds = new Set();

    for (let i = 0; i < exercises.value.length; i++) {
      const exercise = exercises.value[i];
      const sessionExerciseId = resolveSessionExerciseId(exercise, sessionExerciseMap, usedSessionExerciseIds);

      if (!sessionExerciseId) {
        console.warn('Session exercise not found for exercise:', exercise.name);
        continue;
      }

      usedSessionExerciseIds.add(sessionExerciseId);

      for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
        const set = exercise.sets[setIndex];

        const hasDuration = set.duration_minutes != null || set.duration_seconds != null;
        if (set.reps || set.weight_kg || hasDuration) {
          const durationSeconds = set.duration_minutes != null
            ? Math.round(set.duration_minutes * 60)
            : (set.duration_seconds != null ? set.duration_seconds : null);

          await sessionStore.logSet(currentSessionId.value, {
            session_exercise_id: sessionExerciseId,
            set_number: setIndex + 1,
            reps: set.reps || null,
            weight_kg: set.weight_kg || null,
            duration_seconds: durationSeconds
          });
        }
      }
    }

    const durationMinutes = Math.floor(workoutDuration.value / 60);
    await sessionStore.completeSession(currentSessionId.value, durationMinutes);
    
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    
    router.push('/history');
  } catch (error) {
    alert(error);
  }
}


function cancelWorkout() {
  if (confirm('Are you sure you want to cancel this workout?')) {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    router.push('/');
  }
}

async function attachSessionExerciseIds() {
  if (!currentSessionId.value) return;
  const session = await sessionStore.fetchSession(currentSessionId.value);
  sessionExercisesCache.value = session.exercises || [];

  const sessionExerciseMap = buildSessionExerciseMap(sessionExercisesCache.value);
  const used = new Set();

  exercises.value = exercises.value.map(exercise => ({
    ...exercise,
    session_exercise_id: resolveSessionExerciseId(exercise, sessionExerciseMap, used)
  }));
}

async function addExerciseToActiveSession(exercise) {
  try {
    const sessionExercise = await sessionStore.addSessionExercise(
      currentSessionId.value,
      exercise.exercise_id,
      exercise.notes || null
    );

    exercise.session_exercise_id = sessionExercise.id;
    exercise.name = sessionExercise.name;
    exercise.exercise_type = sessionExercise.exercise_type;
    exercise.muscle_group = sessionExercise.muscle_group;
    exercises.value.push(exercise);
  } catch (error) {
    console.error(error);
    alert(error || 'Failed to add exercise to session');
  }
}
</script>

<style scoped>
.workout-page {
  max-width: 900px;
  margin: 0 auto;
}

.workout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  margin: 0;
  color: #1a1a1a;
  font-weight: 400;
}

.workout-actions-inline {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.workout-timer {
  font-size: 1rem;
  font-weight: 400;
  color: #1a1a1a;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.workout-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.exercise-section {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1.5rem;
}

.exercise-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.exercise-header h3 {
  margin: 0;
  color: #1a1a1a;
}

.exercise-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.exercise-notes {
  margin: 0.5rem 0 1rem 0;
  color: #666;
  font-size: 0.9rem;
}

.exercise-type,
.exercise-muscle {
  padding: 0.25rem 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 0.8125rem;
  color: #666;
}

.sets-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.set-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.set-row.completed {
  background: #f6f9ff;
  border-radius: 6px;
  padding: 0.5rem;
}

.set-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
}

.set-number {
  width: 60px;
  font-weight: 600;
  color: #666;
}

.set-inputs {
  display: flex;
  gap: 0.5rem;
  flex: 1;
}

.set-input {
  flex: 1;
  padding: 0.5rem;
}

.workout-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 4px;
  padding: 1.5rem;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid #e0e0e0;
}

.exercise-search {
  margin-bottom: 0.5rem;
}

.exercise-list-modal {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.exercise-option {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.exercise-option:hover {
  border-color: #b0b0b0;
}
 
.exercise-option h4 {
  margin: 0 0 0.25rem 0;
  color: #1a1a1a;
  font-weight: 400;
}

.exercise-option-meta {
  font-size: 0.8125rem;
  color: #666;
}
</style>