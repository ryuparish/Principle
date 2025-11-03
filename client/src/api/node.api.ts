import { apiClient } from './client';
import { MindmapNode, CreateNodeInput, UpdateNodeInput } from '../types';

export const nodeApi = {
  getByMindmap: async (mindmapId: string): Promise<MindmapNode[]> => {
    const response = await apiClient.get('/nodes', {
      params: { mindmapId }
    });
    return response.data.nodes;
  },

  getById: async (id: string): Promise<MindmapNode> => {
    const response = await apiClient.get(`/nodes/${id}`);
    return response.data;
  },

  create: async (data: CreateNodeInput): Promise<MindmapNode> => {
    const response = await apiClient.post('/nodes', data);
    return response.data;
  },

  update: async (id: string, data: UpdateNodeInput): Promise<MindmapNode> => {
    const response = await apiClient.patch(`/nodes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/nodes/${id}`);
  },

  search: async (mindmapId: string, query: string): Promise<MindmapNode[]> => {
    const response = await apiClient.get('/nodes/search', {
      params: { mindmapId, q: query }
    });
    return response.data.results;
  }
};
