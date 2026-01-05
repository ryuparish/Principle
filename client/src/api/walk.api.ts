import { apiClient } from './client';
import {
  Walk,
  WalkStep,
  CreateWalkInput,
  UpdateWalkInput,
  CreateStepInput,
  UpdateStepInput
} from '../types/walk';

export const walkApi = {
  // Walk CRUD operations

  getByConceptMap: async (conceptMapId: string): Promise<Walk[]> => {
    const response = await apiClient.get('/walks', {
      params: { conceptMapId }
    });
    return response.data;
  },

  getById: async (id: string): Promise<Walk> => {
    const response = await apiClient.get(`/walks/${id}`);
    return response.data;
  },

  create: async (input: CreateWalkInput): Promise<Walk> => {
    const response = await apiClient.post('/walks', input);
    return response.data;
  },

  update: async (id: string, input: UpdateWalkInput): Promise<Walk> => {
    const response = await apiClient.patch(`/walks/${id}`, input);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/walks/${id}`);
  },

  // Step management operations

  addStep: async (walkId: string, input: CreateStepInput): Promise<WalkStep> => {
    const response = await apiClient.post(`/walks/${walkId}/steps`, input);
    return response.data;
  },

  updateStep: async (walkId: string, stepId: string, input: UpdateStepInput): Promise<WalkStep> => {
    const response = await apiClient.patch(`/walks/${walkId}/steps/${stepId}`, input);
    return response.data;
  },

  removeStep: async (walkId: string, stepId: string): Promise<void> => {
    await apiClient.delete(`/walks/${walkId}/steps/${stepId}`);
  },

  reorderSteps: async (walkId: string, stepIds: string[]): Promise<WalkStep[]> => {
    const response = await apiClient.put(`/walks/${walkId}/steps/reorder`, { stepIds });
    return response.data;
  }
};
