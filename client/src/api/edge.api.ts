import { apiClient } from './client';
import { MindmapEdge, CreateEdgeInput, UpdateEdgeInput } from '../types';

export const edgeApi = {
  getByMindmap: async (mindmapId: string): Promise<MindmapEdge[]> => {
    const response = await apiClient.get('/edges', {
      params: { mindmapId }
    });
    return response.data.edges || response.data;
  },

  create: async (data: CreateEdgeInput): Promise<MindmapEdge> => {
    const response = await apiClient.post('/edges', data);
    return response.data;
  },

  update: async (id: string, data: UpdateEdgeInput): Promise<MindmapEdge> => {
    const response = await apiClient.patch(`/edges/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/edges/${id}`);
  }
};
