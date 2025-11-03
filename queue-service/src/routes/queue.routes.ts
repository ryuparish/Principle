import { Router, Request, Response } from 'express';
import { queueService } from '../services/queue.service';
import { PositionUpdateMessage } from '../types';

const router = Router();

// Publish a position update to the queue
router.post('/publish', async (req: Request, res: Response) => {
  try {
    const { nodeId, position }: PositionUpdateMessage = req.body;

    if (!nodeId || !position || !position.x || !position.y) {
      return res.status(400).json({
        error: 'Invalid request body. Expected: { nodeId, position: { x, y } }'
      });
    }

    const message: PositionUpdateMessage = {
      nodeId,
      position,
      timestamp: Date.now()
    };

    await queueService.publish(message);

    res.json({
      success: true,
      message: 'Position update queued',
      data: message
    });
  } catch (error: any) {
    console.error('[ROUTE] Error publishing to queue:', error);
    res.status(500).json({
      error: 'Failed to queue position update',
      message: error.message
    });
  }
});

// Get queue status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await queueService.getStatus();

    res.json({
      success: true,
      status
    });
  } catch (error: any) {
    console.error('[ROUTE] Error getting queue status:', error);
    res.status(500).json({
      error: 'Failed to get queue status',
      message: error.message
    });
  }
});

// Wait for queue to be empty (blocking endpoint)
router.get('/wait-empty', async (req: Request, res: Response) => {
  try {
    const timeout = parseInt(req.query.timeout as string) || 10000;

    const isEmpty = await queueService.waitForEmpty(timeout);

    if (isEmpty) {
      res.json({
        success: true,
        message: 'Queue is empty'
      });
    } else {
      res.status(408).json({
        success: false,
        error: 'Timeout waiting for queue to empty'
      });
    }
  } catch (error: any) {
    console.error('[ROUTE] Error waiting for empty queue:', error);
    res.status(500).json({
      error: 'Failed to wait for empty queue',
      message: error.message
    });
  }
});

// Cleanup old jobs
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    await queueService.cleanup();

    res.json({
      success: true,
      message: 'Queue cleanup completed'
    });
  } catch (error: any) {
    console.error('[ROUTE] Error cleaning up queue:', error);
    res.status(500).json({
      error: 'Failed to cleanup queue',
      message: error.message
    });
  }
});

export default router;
