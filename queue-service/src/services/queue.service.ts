import Queue from 'bull';
import axios from 'axios';
import { PositionUpdateMessage, QueueStatus } from '../types';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');
// Route through the API gateway which translates to CORE graph_service
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

// Create Bull queue
export const positionQueue = new Queue<PositionUpdateMessage>('position-updates', {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

// Process queue with concurrency=1 to ensure sequential processing
positionQueue.process(1, async (job) => {
  const { nodeId, position } = job.data;

  try {
    // Call API gateway to update position (gateway translates to CORE graph_service)
    await axios.patch(`${API_GATEWAY_URL}/api/nodes/${nodeId}`, {
      position
    });

    return { success: true, nodeId };
  } catch (error: any) {
    console.error(`Failed to save position for node ${nodeId}:`, error.response?.data || error.message);
    throw error; // Will trigger retry logic
  }
});

// Queue event handlers for errors only
positionQueue.on('failed', (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

// Service functions
export const queueService = {
  // Publish a position update to the queue
  async publish(data: PositionUpdateMessage): Promise<void> {
    await positionQueue.add(data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  },

  // Get queue status
  async getStatus(): Promise<QueueStatus> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      positionQueue.getWaitingCount(),
      positionQueue.getActiveCount(),
      positionQueue.getCompletedCount(),
      positionQueue.getFailedCount(),
      positionQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  },

  // Wait for queue to be empty (with timeout)
  async waitForEmpty(timeoutMs: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getStatus();
      const isEmpty = status.waiting === 0 && status.active === 0 && status.delayed === 0;

      if (isEmpty) {
        return true;
      }

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    return false;
  },

  // Clean up completed and failed jobs
  async cleanup(): Promise<void> {
    await positionQueue.clean(5000, 'completed');
    await positionQueue.clean(5000, 'failed');
  },
};
