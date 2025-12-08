import { apiClient } from './client';
import { ConceptMapNode, CreateNodeInput, UpdateNodeInput } from '../types';

export const nodeApi = {
  getByConceptMap: async (conceptMapId: string): Promise<ConceptMapNode[]> => {
    const response = await apiClient.get('/nodes', {
      params: { mindmapId: conceptMapId }
    });
    return response.data.nodes;
  },

  getById: async (id: string): Promise<ConceptMapNode> => {
    const response = await apiClient.get(`/nodes/${id}`);
    return response.data;
  },

  create: async (data: CreateNodeInput): Promise<ConceptMapNode> => {
    const response = await apiClient.post('/nodes', data);
    return response.data;
  },

  update: async (id: string, data: UpdateNodeInput): Promise<ConceptMapNode> => {
    const response = await apiClient.patch(`/nodes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/nodes/${id}`);
  },

  undelete: async (id: string): Promise<ConceptMapNode> => {
    const response = await apiClient.patch(`/nodes/${id}/undelete`);
    return response.data;
  },

  search: async (conceptMapId: string, query: string): Promise<ConceptMapNode[]> => {
    const response = await apiClient.get('/nodes/search', {
      params: { mindmapId: conceptMapId, q: query }
    });
    return response.data.results;
  }
};
