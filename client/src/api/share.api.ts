import { apiClient } from './client';
import { ShareSettings, EnableSharingInput, ConceptMapExport, ConceptMap } from '../types';

export const shareApi = {
  /**
   * Enable sharing for a concept map
   */
  enableSharing: async (
    conceptMapId: string,
    input: EnableSharingInput
  ): Promise<ShareSettings> => {
    const response = await apiClient.post(`/mindmaps/${conceptMapId}/share`, input);
    return response.data;
  },

  /**
   * Disable sharing for a concept map
   */
  disableSharing: async (conceptMapId: string): Promise<void> => {
    await apiClient.delete(`/mindmaps/${conceptMapId}/share`);
  },

  /**
   * Get sharing settings for a concept map
   */
  getSettings: async (conceptMapId: string): Promise<ShareSettings | null> => {
    try {
      const response = await apiClient.get(`/mindmaps/${conceptMapId}/share`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Map is not shared
      }
      throw error;
    }
  },

  /**
   * Get shared map data (public endpoint)
   */
  getSharedMap: async (
    shareSlug: string,
    token?: string
  ): Promise<ConceptMapExport> => {
    const params = token ? { token } : {};
    const response = await apiClient.get(`/share/${shareSlug}`, { params });
    return response.data;
  },

  /**
   * Download map as JSON file
   */
  downloadJSON: (shareSlug: string, token?: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const url = new URL(`${baseUrl}/api/share/${shareSlug}/download.json`);
    if (token) {
      url.searchParams.set('token', token);
    }
    return url.toString();
  },

  /**
   * Download map as standalone HTML file
   */
  downloadHTML: (shareSlug: string, token?: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const url = new URL(`${baseUrl}/api/share/${shareSlug}/download.html`);
    if (token) {
      url.searchParams.set('token', token);
    }
    return url.toString();
  },

  /**
   * Import a concept map from a JSON file
   */
  importConceptMap: async (file: File): Promise<ConceptMap> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);

          const response = await apiClient.post('/mindmaps/import', json);
          resolve(response.data.map);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
};
