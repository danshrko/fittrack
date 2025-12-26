<template>
  <div class="history-page">
    <h1 class="page-title">Workout History</h1>

    <div v-if="loading" class="loading">Loading history...</div>

    <div v-else-if="sessions.length === 0" class="empty-state">
      <p>No workouts completed yet. Start your first workout!</p>
      <router-link to="/workout/start" class="btn btn-primary">Start Workout</router-link>
    </div>

    <div v-else class="sessions-list">
      <div v-for="session in sessions" :key="session.id" class="session-card">
        <div class="session-header" @click="toggleSession(session.id)">
          <div class="session-info">
            <h3>{{ session.name }}</h3>
            <p class="session-date">{{ formatDate(session.date_completed) }}</p>
          </div>
          <div class="session-meta">
            <span class="session-duration">{{ session.duration_minutes }} min</span>
            <span class="toggle-icon">{{ expandedSessions.has(session.id) ? '▼' : '▶' }}</span>
          </div>
        </div>

        <div v-if="expandedSessions.has(session.id)" class="session-details">
          <div v-if="sessionDetails[session.id]?.loading" class="loading-details">
            Loading details...
          </div>
          <div v-else-if="sessionDetails[session.id]?.session" class="session-content">
            <div v-for="exercise in sessionDetails[session.id].session.exercises" :key="exercise.id" class="exercise-detail">
              <h4>{{ exercise.name }}</h4>
              <div class="sets-detail">
                <div v-for="set in exercise.sets" :key="set.id" class="set-detail">
                  Set {{ set.set_number }}:
                  <span v-if="set.reps"> {{ set.reps }} reps</span>
                  <span v-if="set.weight_kg"> X {{ formatWeight(set.weight_kg) }}kg</span>
                  <span v-if="set.duration_seconds"> {{ formatDuration(set.duration_seconds) }}</span>
                </div>
              </div>
            </div>
            <div class="session-summary">
              <p><strong>Total Sets:</strong> {{ getTotalSets(sessionDetails[session.id].session) }}</p>
              <p><strong>Total Volume:</strong> {{ getTotalVolume(sessionDetails[session.id].session) }} kg</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSessionStore } from '../../stores/sessions';

const sessionStore = useSessionStore();

const sessions = computed(() => 
  sessionStore.sessions.filter(s => s.date_completed).sort((a, b) => 
    new Date(b.date_completed) - new Date(a.date_completed)
  )
);
const loading = computed(() => sessionStore.loading);
const expandedSessions = ref(new Set());
const sessionDetails = ref({});

onMounted(async () => {
  await sessionStore.fetchSessions();
});

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatWeight(weight) {
  if (weight === null || weight === undefined) return '';
  const num = Number(weight);
  if (Number.isNaN(num)) return '';
  return Math.round(num);
}

async function toggleSession(sessionId) {
  if (expandedSessions.value.has(sessionId)) {
    expandedSessions.value.delete(sessionId);
  } else {
    expandedSessions.value.add(sessionId);
    
    if (!sessionDetails.value[sessionId]) {
      sessionDetails.value[sessionId] = { loading: true };
      try {
        const session = await sessionStore.fetchSession(sessionId);
        sessionDetails.value[sessionId] = { loading: false, session };
      } catch (error) {
        sessionDetails.value[sessionId] = { loading: false, error };
        alert('Failed to load session details');
      }
    }
  }
}

function getTotalSets(session) {
  if (!session?.exercises) return 0;
  return session.exercises.reduce((total, ex) => total + (ex.sets?.length || 0), 0);
}

function getTotalVolume(session) {
  if (!session?.exercises) return 0;
  return session.exercises.reduce((total, ex) => {
    const exerciseVolume = ex.sets?.reduce((exTotal, set) => {
      return exTotal + ((set.reps || 0) * (set.weight_kg || 0));
    }, 0) || 0;
    return total + exerciseVolume;
  }, 0);
}
</script>

<style scoped>
.history-page {
  max-width: 1000px;
  margin: 0 auto;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 2rem;
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

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.session-header:hover {
  background: #f9f9f9;
}

.session-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.session-date {
  margin: 0;
  color: #666;
  font-size: 0.875rem;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.session-duration {
  font-weight: 600;
  color: #1976d2;
}

.toggle-icon {
  color: #666;
  font-size: 0.875rem;
}

.session-details {
  border-top: 1px solid #e0e0e0;
  padding: 1.5rem;
  background: #f9f9f9;
}

.loading-details {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.session-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exercise-detail h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
}

.sets-detail {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-left: 1rem;
}

.set-detail {
  color: #666;
  font-size: 0.875rem;
}

.session-summary {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 2rem;
}

.session-summary p {
  margin: 0;
  color: #333;
}
</style>