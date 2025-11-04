import { apiClient } from './client';
import { ConceptMap, CreateConceptMapInput } from '../types';

export const conceptMapApi = {
  getAll: async (): Promise<ConceptMap[]> => {
    const response = await apiClient.get('/mindmaps');
    return response.data.mindmaps;
  },

  getById: async (id: string): Promise<ConceptMap> => {
    const response = await apiClient.get(`/mindmaps/${id}`);
    return response.data;
  },

  create: async (data: CreateConceptMapInput): Promise<ConceptMap> => {
    const response = await apiClient.post('/mindmaps', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ConceptMap>): Promise<ConceptMap> => {
    const response = await apiClient.patch(`/mindmaps/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/mindmaps/${id}`);
  }
};
