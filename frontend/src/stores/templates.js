import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useTemplateStore = defineStore('templates', () => {
  const templates = ref([]);
  const currentTemplate = ref(null);
  const loading = ref(false);

  async function fetchTemplates() {
    loading.value = true;
    try {
      const response = await api.get('/templates');
      templates.value = response.data.templates;
      return templates.value;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch templates';
    } finally {
      loading.value = false;
    }
  }

  async function fetchTemplate(id) {
    loading.value = true;
    try {
      const response = await api.get(`/templates/${id}`);
      currentTemplate.value = response.data.template;
      return currentTemplate.value;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch template';
    } finally {
      loading.value = false;
    }
  }

  async function createTemplate(templateData) {
    try {
      const response = await api.post('/templates', templateData);
      await fetchTemplates();
      return response.data.template;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create template';
    }
  }

  async function updateTemplate(id, templateData) {
    try {
      const response = await api.put(`/templates/${id}`, templateData);
      await fetchTemplates();
      return response.data.template;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update template';
    }
  }

  async function deleteTemplate(id) {
    try {
      await api.delete(`/templates/${id}`);
      await fetchTemplates();
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete template';
    }
  }

  async function addExerciseToTemplate(templateId, exerciseData) {
    try {
      const response = await api.post(`/templates/${templateId}/exercises`, exerciseData);
      await fetchTemplate(templateId);
      return response.data.exercise;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to add exercise';
    }
  }

  async function updateExerciseInTemplate(templateId, exerciseId, exerciseData) {
    try {
      const response = await api.put(`/templates/${templateId}/exercises/${exerciseId}`, exerciseData);
      await fetchTemplate(templateId);
      return response.data.exercise;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update exercise';
    }
  }

  async function removeExerciseFromTemplate(templateId, exerciseId) {
    try {
      await api.delete(`/templates/${templateId}/exercises/${exerciseId}`);
      await fetchTemplate(templateId);
    } catch (error) {
      throw error.response?.data?.error || 'Failed to remove exercise';
    }
  }

  return {
    templates,
    currentTemplate,
    loading,
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addExerciseToTemplate,
    updateExerciseInTemplate,
    removeExerciseFromTemplate
  };
});