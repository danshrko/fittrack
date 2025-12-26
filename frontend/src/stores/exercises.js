import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useExerciseStore = defineStore('exercises', () => {
  const exRef = ref([]);
  const busy = ref(false);

  async function loadExercises() {
    busy.value = true;
    try {
      const response = await api.get('/exercises');
      exRef.value = response.data.exercises;
      return exRef.value;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch exercises';
    } finally {
      busy.value = false;
    }
  }

  async function fetchByMuscleGroup(group) {
    busy.value = true;
    try {
      const response = await api.get(`/exercises/muscle/${group}`);
      return response.data.exercises;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch exercises';
    } finally {
      busy.value = false;
    }
  }

  async function createExercise(exerciseData) {
    try {
      const response = await api.post('/exercises', exerciseData);
      await loadExercises();
      return response.data.exercise;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create exercise';
    }
  }

  async function updateExercise(id, exerciseData) {
    try {
      const response = await api.put(`/exercises/${id}`, exerciseData);
      await loadExercises();
      return response.data.exercise;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update exercise';
    }
  }

  async function deleteExercise(id) {
    try {
      await api.delete(`/exercises/${id}`);
      await loadExercises();
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete exercise';
    }
  }

  return {
    exercises: exRef,
    loading: busy,
    fetchExercises: loadExercises,
    fetchByMuscleGroup,
    createExercise,
    updateExercise,
    deleteExercise
  };
});