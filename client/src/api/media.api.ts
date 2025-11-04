import { apiClient } from './client';
import { Media } from '../types';

export const mediaApi = {
  upload: async (file: File, nodeId?: string): Promise<Media> => {
    const formData = new FormData();
    formData.append('image', file);
    if (nodeId) {
      formData.append('nodeId', nodeId);
    }

    const response = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getById: async (id: string): Promise<Media> => {
    const response = await apiClient.get(`/media/${id}`);
    return response.data;
  },

  getByNode: async (nodeId: string): Promise<Media[]> => {
    const response = await apiClient.get(`/media/node/${nodeId}`);
    return response.data.media;
  },

  getByIds: async (ids: string[]): Promise<Media[]> => {
    const response = await apiClient.get('/media/bulk', {
      params: { ids: ids.join(',') }
    });
    return response.data.media;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/media/${id}`);
  },

  cleanup: async (): Promise<{ deletedCount: number }> => {
    const response = await apiClient.post('/media/cleanup');
    return response.data;
  },

  getFileUrl: (filename: string): string => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${API_URL}/api/media/file/${filename}`;
  },

  getThumbnailUrl: (media: Media): string => {
    return mediaApi.getFileUrl(media.thumbnailUrl.split('/').pop() || '');
  },

  getImageUrl: (media: Media): string => {
    return mediaApi.getFileUrl(media.url.split('/').pop() || '');
  }
};
