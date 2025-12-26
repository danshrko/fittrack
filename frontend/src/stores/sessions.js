import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useSessionStore = defineStore('sessions', () => {
  const sessions = ref([]);
  const currentSession = ref(null);
  const loading = ref(false);

  async function fetchSessions() {
    loading.value = true;
    try {
      const response = await api.get('/sessions');
      sessions.value = response.data.sessions;
      return sessions.value;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch sessions';
    } finally {
      loading.value = false;
    }
  }

  async function fetchSession(id) {
    loading.value = true;
    try {
      const response = await api.get(`/sessions/${id}`);
      currentSession.value = response.data.session;
      return currentSession.value;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch session';
    } finally {
      loading.value = false;
    }
  }

  async function fetchLastSessionForTemplate(templateId) {
    try {
      const response = await api.get(`/sessions/template/${templateId}/last`);
      return response.data.lastSession;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch last session';
    }
  }

  async function startSession(sessionData) {
    try {
      const response = await api.post('/sessions/start', sessionData);
      currentSession.value = response.data.session;
      return currentSession.value;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to start session';
    }
  }

  async function completeSession(id, durationMinutes) {
    try {
      await api.post(`/sessions/${id}/complete`, { duration_minutes: durationMinutes });
      await fetchSessions();
    } catch (error) {
      throw error.response?.data?.error || 'Failed to complete session';
    }
  }

  async function logSet(sessionId, setData) {
    try {
      const response = await api.post(`/sessions/${sessionId}/sets`, setData);
      return response.data.set;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to log set';
    }
  }

  async function updateSet(setId, setData) {
    try {
      const response = await api.put(`/sessions/sets/${setId}`, setData);
      return response.data.set;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update set';
    }
  }

  async function deleteSet(setId) {
    try {
      await api.delete(`/sessions/sets/${setId}`);
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete set';
    }
  }

  async function addSessionExercise(sessionId, exerciseId, notes = null) {
    try {
      const response = await api.post(`/sessions/${sessionId}/exercises`, {
        exercise_id: exerciseId,
        notes: notes || null
      });
      return response.data.sessionExercise;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to add exercise';
    }
  }

  return {
    sessions,
    currentSession,
    loading,
    fetchSessions,
    fetchSession,
    fetchLastSessionForTemplate,
    startSession,
    completeSession,
    logSet,
    updateSet,
    deleteSet,
    addSessionExercise
  };
});