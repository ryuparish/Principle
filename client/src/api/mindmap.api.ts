import { apiClient } from './client';
import { Mindmap, CreateMindmapInput } from '../types';

export const mindmapApi = {
  getAll: async (): Promise<Mindmap[]> => {
    const response = await apiClient.get('/mindmaps');
    return response.data.mindmaps;
  },

  getById: async (id: string): Promise<Mindmap> => {
    const response = await apiClient.get(`/mindmaps/${id}`);
    return response.data;
  },

  create: async (data: CreateMindmapInput): Promise<Mindmap> => {
    const response = await apiClient.post('/mindmaps', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Mindmap>): Promise<Mindmap> => {
    const response = await apiClient.patch(`/mindmaps/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/mindmaps/${id}`);
  }
};
