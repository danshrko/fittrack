<template>
  <div class="template-form-page">
    <div class="page-header">
      <h1 class="page-title">{{ isEdit ? 'Edit Template' : 'Create Workout Template' }}</h1>
      <router-link to="/templates" class="btn btn-secondary">Cancel</router-link>
    </div>

    <div class="form-container">
      <form @submit.prevent="saveTemplate" class="template-form">
        <div class="form-group">
          <label>Workout Name</label>
          <input v-model="form.name" type="text" required class="form-input" placeholder="e.g., Push Day" />
        </div>

        <div class="form-group">
          <label>Notes (Optional)</label>
          <textarea v-model="form.notes" class="form-input" rows="3" placeholder="Add any notes about this workout..."></textarea>
        </div>

        <div class="exercises-section">
          <div class="section-header">
            <h2>Exercises</h2>
            <button type="button" @click="showExerciseModal = true" class="btn btn-primary">
              + Add Exercise
            </button>
          </div>

          <div v-if="form.exercises.length === 0" class="empty-exercises">
            <p>No exercises added yet. Click "Add Exercise" to get started.</p>
          </div>

          <div v-else class="exercises-list">
            <div v-for="(exercise, index) in form.exercises" :key="exercise.id || index" class="exercise-item">
              <div class="exercise-info">
                <span class="exercise-number">{{ index + 1 }}</span>
                <div class="exercise-details">
                  <h4>{{ exercise.name }}</h4>
                  <span class="exercise-meta">{{ exercise.muscle_group }} • {{ formatType(exercise.exercise_type) }}</span>
                </div>
              </div>
              <div class="exercise-actions">
                <input
                  v-model="exercise.notes"
                  type="text"
                  placeholder="Exercise notes..."
                  class="form-input exercise-notes"
                  @blur="updateExerciseNotes(exercise)"
                />
                <button type="button" @click="removeExercise(index)" class="btn btn-sm btn-danger">Remove</button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <router-link to="/templates" class="btn btn-secondary">Cancel</router-link>
          <button type="submit" :disabled="loading" class="btn btn-primary">
            {{ loading ? 'Saving...' : 'Save Template' }}
          </button>
        </div>
      </form>
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
            <span>{{ exercise.muscle_group }} • {{ formatType(exercise.exercise_type) }}</span>
          </div>
        </div>
        <button @click="showExerciseModal = false" class="btn btn-secondary">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTemplateStore } from '../../stores/templates';
import { useExerciseStore } from '../../stores/exercises';

const route = useRoute();
const router = useRouter();
const templateStore = useTemplateStore();
const exerciseStore = useExerciseStore();

const isEdit = computed(() => !!route.params.id);
const loading = ref(false);
const showExerciseModal = ref(false);
const exerciseSearch = ref('');

const form = ref({
  name: '',
  notes: '',
  exercises: []
});

const availableExercises = computed(() => exerciseStore.exercises);
const filteredAvailableExercises = computed(() => {
  if (!exerciseSearch.value) return availableExercises.value;
  const search = exerciseSearch.value.toLowerCase();
  return availableExercises.value.filter(ex =>
    ex.name.toLowerCase().includes(search) ||
    ex.muscle_group.toLowerCase().includes(search)
  );
});

onMounted(async () => {
  await exerciseStore.fetchExercises();

  if (isEdit.value) {
    await loadTemplate();
  }
});

async function loadTemplate() {
  try {
    const template = await templateStore.fetchTemplate(route.params.id);
    form.value = {
      name: template.name,
      notes: template.notes || '',
      exercises: template.exercises.map(ex => ({
        id: ex.id,
        exercise_id: ex.exercise_id,
        name: ex.name,
        muscle_group: ex.muscle_group,
        exercise_type: ex.exercise_type,
        notes: ex.notes || ''
      }))
    };
  } catch (error) {
    alert(error);
    router.push('/templates');
  }
}

function addExercise(exercise) {
  if (form.value.exercises.some(ex => ex.exercise_id === exercise.id)) {
    alert('Exercise already added');
    return;
  }

  form.value.exercises.push({
    exercise_id: exercise.id,
    name: exercise.name,
    muscle_group: exercise.muscle_group,
    exercise_type: exercise.exercise_type,
    notes: ''
  });

  showExerciseModal.value = false;
  exerciseSearch.value = '';
}

function removeExercise(index) {
  form.value.exercises.splice(index, 1);
}

async function updateExerciseNotes(exercise) {
  if (!isEdit.value || !exercise.id) return;

  try {
    await templateStore.updateExerciseInTemplate(
      route.params.id,
      exercise.id,
      {
        order_index: form.value.exercises.indexOf(exercise) + 1,
        notes: exercise.notes
      }
    );
  } catch (error) {
    console.error('Failed to update exercise notes:', error);
  }
}

async function saveTemplate() {
  loading.value = true;

  try {
    if (isEdit.value) {
      await templateStore.updateTemplate(route.params.id, {
        name: form.value.name,
        notes: form.value.notes
      });

      for (let i = 0; i < form.value.exercises.length; i++) {
        const ex = form.value.exercises[i];
        if (ex.id) {
          await templateStore.updateExerciseInTemplate(route.params.id, ex.id, {
            order_index: i + 1,
            notes: ex.notes
          });
        } else {
          await templateStore.addExerciseToTemplate(route.params.id, {
            exercise_id: ex.exercise_id,
            order_index: i + 1,
            notes: ex.notes
          });
        }
      }
    } else {
      const template = await templateStore.createTemplate({
        name: form.value.name,
        notes: form.value.notes
      });

      for (let i = 0; i < form.value.exercises.length; i++) {
        await templateStore.addExerciseToTemplate(template.id, {
          exercise_id: form.value.exercises[i].exercise_id,
          order_index: i + 1,
          notes: form.value.exercises[i].notes
        });
      }
    }

    router.push('/templates');
  } catch (error) {
    alert(error);
  } finally {
    loading.value = false;
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
.template-form-page {
  max-width: 900px;
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

.form-container {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
}

.template-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.exercises-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  color: #333;
}

.empty-exercises {
  text-align: center;
  padding: 3rem;
  color: #666;
  background: #f9f9f9;
  border-radius: 8px;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exercise-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
}

.exercise-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.exercise-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1976d2;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  flex-shrink: 0;
}

.exercise-details {
  flex: 1;
}

.exercise-details h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.exercise-meta {
  font-size: 0.875rem;
  color: #666;
}

.exercise-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.exercise-notes {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  border-top: 1px solid #e0e0e0;
  padding-top: 2rem;
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
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-content h2 {
  margin: 0 0 1rem 0;
  color: #333;
}

.exercise-search {
  margin-bottom: 1rem;
}

.exercise-list-modal {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.exercise-option {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.exercise-option:hover {
  background: #f5f5f5;
}

.exercise-option h4 {
  margin: 0 0 0.25rem 0;
  color: #333;
}

.exercise-option span {
  font-size: 0.875rem;
  color: #666;
}
</style>