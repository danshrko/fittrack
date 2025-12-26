import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useExerciseStore = defineStore('exercises', () => {
  const exercises = ref([]);
  const loading = ref(false);

  async function fetchExercises() {
    loading.value = true;
    try {
      const response = await api.get('/exercises');
      exercises.value = response.data.exercises;
      return exercises.value;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch exercises';
    } finally {
      loading.value = false;
    }
  }

  async function fetchByMuscleGroup(group) {
    loading.value = true;
    try {
      const response = await api.get(`/exercises/muscle/${group}`);
      return response.data.exercises;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch exercises';
    } finally {
      loading.value = false;
    }
  }

  async function createExercise(exerciseData) {
    try {
      const response = await api.post('/exercises', exerciseData);
      await fetchExercises();
      return response.data.exercise;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create exercise';
    }
  }

  async function updateExercise(id, exerciseData) {
    try {
      const response = await api.put(`/exercises/${id}`, exerciseData);
      await fetchExercises();
      return response.data.exercise;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update exercise';
    }
  }

  async function deleteExercise(id) {
    try {
      await api.delete(`/exercises/${id}`);
      await fetchExercises();
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete exercise';
    }
  }

  return {
    exercises,
    loading,
    fetchExercises,
    fetchByMuscleGroup,
    createExercise,
    updateExercise,
    deleteExercise
  };
});