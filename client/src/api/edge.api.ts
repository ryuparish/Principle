import { apiClient } from './client';
import { ConceptMapEdge, CreateEdgeInput, UpdateEdgeInput } from '../types';

export const edgeApi = {
  getByConceptMap: async (conceptMapId: string): Promise<ConceptMapEdge[]> => {
    const response = await apiClient.get('/edges', {
      params: { conceptMapId }
    });
    return response.data.edges || response.data;
  },

  create: async (data: CreateEdgeInput): Promise<ConceptMapEdge> => {
    const response = await apiClient.post('/edges', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEdgeInput): Promise<ConceptMapEdge> => {
    const response = await apiClient.patch(`/edges/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/edges/${id}`);
  }
};
