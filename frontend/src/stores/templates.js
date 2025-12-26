import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useTemplateStore = defineStore('templates', () => {
  const tplList = ref([]);
  const activeTpl = ref(null);
  const busy = ref(false);

  async function loadTemplates() {
    busy.value = true;
    try {
      const response = await api.get('/templates');
      tplList.value = response.data.templates;
      return tplList.value;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch templates';
    } finally { busy.value = false; }
  }

  async function loadTemplate(id) {
    busy.value = true;
    try {
      const response = await api.get(`/templates/${id}`);
      activeTpl.value = response.data.template;
      return activeTpl.value;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch template';
    } finally { busy.value = false; }
  }

  async function createTemplate(templateData) {
    try {
      const response = await api.post('/templates', templateData);
      await loadTemplates();
      return response.data.template;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to create template';
    }
  }

  async function updateTemplate(id, templateData) {
    try {
      const response = await api.put(`/templates/${id}`, templateData);
      await loadTemplates();
      return response.data.template;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update template';
    }
  }

  async function deleteTemplate(id) {
    try {
      await api.delete(`/templates/${id}`);
      await loadTemplates();
    } catch (error) {
      throw error.response?.data?.error || 'Failed to delete template';
    }
  }

  async function addExerciseToTemplate(templateId, exerciseData) {
    try {
      const response = await api.post(`/templates/${templateId}/exercises`, exerciseData);
      await loadTemplate(templateId);
      return response.data.exercise;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to add exercise';
    }
  }

  async function updateExerciseInTemplate(templateId, exerciseId, exerciseData) {
    try {
      const response = await api.put(`/templates/${templateId}/exercises/${exerciseId}`, exerciseData);
      await loadTemplate(templateId);
      return response.data.exercise;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to update exercise';
    }
  }

  async function removeExerciseFromTemplate(templateId, exerciseId) {
    try {
      await api.delete(`/templates/${templateId}/exercises/${exerciseId}`);
      await loadTemplate(templateId);
    } catch (error) {
      throw error.response?.data?.error || 'Failed to remove exercise';
    }
  }

  return {
    templates: tplList,
    currentTemplate: activeTpl,
    loading: busy,
    fetchTemplates: loadTemplates,
    fetchTemplate: loadTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    addExerciseToTemplate,
    updateExerciseInTemplate,
    removeExerciseFromTemplate
  };
});