import type { DriveAuthStatus, DriveFilesResponse, DriveFile } from '../types/drive';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const googleDriveApi = {
  /**
   * Initiate Google OAuth - opens in current window
   */
  initiateAuth(): void {
    window.location.href = `${baseUrl}/api/auth/google`;
  },

  /**
   * Check Google connection status
   */
  async getStatus(): Promise<DriveAuthStatus> {
    const response = await fetch(`${baseUrl}/api/auth/google/status`);
    if (!response.ok) {
      return { connected: false };
    }
    return response.json();
  },

  /**
   * Disconnect from Google
   */
  async logout(): Promise<void> {
    const response = await fetch(`${baseUrl}/api/auth/google/logout`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Failed to disconnect');
    }
  },

  /**
   * Get Google client ID for Picker API
   */
  async getClientId(): Promise<string> {
    const response = await fetch(`${baseUrl}/api/auth/google/client-id`);
    if (!response.ok) {
      throw new Error('Failed to get client ID');
    }
    const data = await response.json();
    return data.clientId;
  },

  /**
   * Get Picker config (access token + API key)
   */
  async getPickerConfig(): Promise<{ accessToken: string; apiKey: string }> {
    const response = await fetch(`${baseUrl}/api/auth/google/picker-config`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Not connected to Google Drive');
      }
      throw new Error('Failed to get picker config');
    }
    return response.json();
  },

  /**
   * List/search files from Google Drive
   */
  async listFiles(query?: string, pageToken?: string, pageSize = 20): Promise<DriveFilesResponse> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (pageToken) params.set('pageToken', pageToken);
    params.set('pageSize', pageSize.toString());

    const response = await fetch(`${baseUrl}/api/drive/files?${params}`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Not connected to Google Drive');
      }
      throw new Error('Failed to list files');
    }
    return response.json();
  },

  /**
   * Get details of a specific file
   */
  async getFile(fileId: string): Promise<DriveFile> {
    const response = await fetch(`${baseUrl}/api/drive/files/${fileId}`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Not connected to Google Drive');
      }
      if (response.status === 404) {
        throw new Error('File not found');
      }
      throw new Error('Failed to get file');
    }
    return response.json();
  },

  /**
   * List children of a folder
   */
  async listFolderChildren(folderId: string, pageToken?: string, pageSize = 20): Promise<DriveFilesResponse> {
    const params = new URLSearchParams();
    if (pageToken) params.set('pageToken', pageToken);
    params.set('pageSize', pageSize.toString());

    const response = await fetch(`${baseUrl}/api/drive/files/${folderId}/children?${params}`);
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Not connected to Google Drive');
      }
      throw new Error('Failed to list folder contents');
    }
    return response.json();
  }
};
