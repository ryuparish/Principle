import Queue from 'better-queue';
import MemoryStore from 'better-queue-memory';
import axios from 'axios';
import { PositionUpdateMessage, QueueStatus } from '../types';
import * as path from 'path';
import * as fs from 'fs';

const NODE_SERVICE_URL = process.env.NODE_SERVICE_URL || 'http://localhost:3001';

// Create queue directory if it doesn't exist
const QUEUE_DIR = path.join(__dirname, '../../.queue');
if (!fs.existsSync(QUEUE_DIR)) {
  fs.mkdirSync(QUEUE_DIR, { recursive: true });
}

// Queue stats tracking
let stats = {
  waiting: 0,
  active: 0,
  completed: 0,
  failed: 0,
};

// Create better-queue with in-memory store (faster, simpler than file-based)
export const positionQueue = new Queue<PositionUpdateMessage, any>(
  async (job, cb) => {
    const { nodeId, position } = job;

    try {
      // Call node-service to update position in database
      await axios.patch(`${NODE_SERVICE_URL}/nodes/${nodeId}`, {
        position
      });

      stats.completed++;
      cb(null, { success: true, nodeId });
    } catch (error: any) {
      console.error(`Failed to save position for node ${nodeId}:`, error.response?.data || error.message);
      stats.failed++;
      cb(error);
    }
  },
  {
    concurrent: 1, // Sequential processing
    maxRetries: 3,
    retryDelay: 1000,
    store: new MemoryStore(), // In-memory persistence
    afterProcessDelay: 0, // No delay between jobs
  }
);

// Track queue length
positionQueue.on('task_queued', () => {
  stats.waiting++;
});

positionQueue.on('task_started', () => {
  stats.waiting--;
  stats.active++;
});

positionQueue.on('task_finish', () => {
  stats.active--;
});

positionQueue.on('task_failed', (taskId, error) => {
  stats.active--;
  console.error(`Task ${taskId} failed:`, error.message);
});

// Service functions
export const queueService = {
  // Publish a position update to the queue
  async publish(data: PositionUpdateMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      positionQueue.push(data, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  // Get queue status
  async getStatus(): Promise<QueueStatus> {
    return {
      waiting: stats.waiting,
      active: stats.active,
      completed: stats.completed,
      failed: stats.failed,
      delayed: 0, // better-queue doesn't have delayed jobs
    };
  },

  // Wait for queue to be empty (with timeout)
  async waitForEmpty(timeoutMs: number = 10000): Promise<boolean> {
    const startTime = Date.now();
    const checkInterval = 100; // Check every 100ms

    while (Date.now() - startTime < timeoutMs) {
      const isEmpty = stats.waiting === 0 && stats.active === 0;

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
    // Reset stats for completed/failed
    stats.completed = 0;
    stats.failed = 0;
  },

  // Shutdown queue gracefully
  async close(): Promise<void> {
    return new Promise((resolve) => {
      positionQueue.destroy(() => {
        console.log('Queue closed');
        resolve();
      });
    });
  },
};
