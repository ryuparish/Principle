import { apiClient } from './client';
import { ConceptMap, ConceptMapNode, CreateConceptMapInput } from '../types';

export interface LayoutOptions {
  algorithm?: 'layered' | 'force' | 'mrtree';
  direction?: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';
  nodeSpacing?: number;
  layerSpacing?: number;
}

export interface LayoutResult {
  nodes: ConceptMapNode[];
}

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
  },

  applyLayout: async (id: string, options?: LayoutOptions): Promise<LayoutResult> => {
    const response = await apiClient.post(`/mindmaps/${id}/layout`, options || {});
    return response.data;
  }
};
