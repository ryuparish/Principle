import { apiClient } from './client';

interface PositionUpdateMessage {
  nodeId: string;
  position: {
    x: number;
    y: number;
  };
}

interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export const queueApi = {
  // Publish a position update to the queue (fire-and-forget)
  publish: async (data: PositionUpdateMessage): Promise<void> => {
    try {
      await apiClient.post('/queue/publish', data);
    } catch (error: any) {
      console.error('Failed to publish position update:', error);
      // Don't throw - this is fire-and-forget
    }
  },

  // Get queue status
  getStatus: async (): Promise<QueueStatus> => {
    const response = await apiClient.get('/queue/status');
    return response.data.status;
  },

  // Wait for queue to be empty (blocking call with timeout)
  waitEmpty: async (timeoutMs: number = 10000): Promise<boolean> => {
    try {
      const response = await apiClient.get('/queue/wait-empty', {
        params: { timeout: timeoutMs }
      });
      return response.data.success;
    } catch (error: any) {
      if (error.response?.status === 408) {
        return false;
      }
      console.error('Error waiting for queue:', error);
      return false;
    }
  },

  // Cleanup old jobs
  cleanup: async (): Promise<void> => {
    await apiClient.post('/queue/cleanup');
  },
};
